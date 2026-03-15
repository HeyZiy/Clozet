const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const port = process.env.PORT || 5173;
const root = __dirname;

// Helper function to escape CSV fields
function escapeCsvField(field) {
  if (field === null || field === undefined) return '';
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape inner quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

const mime = {
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.csv':'text/csv; charset=utf-8',
  '.md':'text/markdown; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.gif':'image/gif',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let urlPath = decodeURI(url.pathname);
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
  const filePath = path.join(root, urlPath);

  // Handle API Fetch Metadata (POST /api/fetch-metadata)
  if (req.method === 'POST' && urlPath === '/api/fetch-metadata') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      let browser;
      try {
        const { targetUrl } = JSON.parse(body);
        if (!targetUrl) {
          res.writeHead(400); res.end('URL required'); return;
        }

        console.log(`[V2.1] Scraping: ${targetUrl}`);
        console.log('Launching browser...');
        
        // Find system browser on Windows as fallback
        const executablePaths = [
          'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          process.env.CHROME_PATH 
        ].filter(Boolean);
        
        let executablePath = executablePaths.find(p => fs.existsSync(p));

        browser = await puppeteer.launch({
          headless: true,
          executablePath: executablePath || undefined,
          args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled' // Helps bypass some bot detection
          ]
        });
        console.log(`Browser launched (Executable: ${executablePath || 'default'}). Creating page...`);
        const page = await browser.newPage();
        
        // Set extra headers to look more like a real user
        await page.setExtraHTTPHeaders({
          'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8'
        });

        // Emulate iPhone
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
        await page.setViewport({ width: 390, height: 844 });
        
        // Speed optimization: Block images, fonts, and CSS
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
            req.abort();
          } else {
            req.continue();
          }
        });

        console.log(`Navigating to ${targetUrl}...`);
        try {
          // Use domcontentloaded for faster returns, we don't need all resources
          await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        } catch (navErr) {
          console.log(`Navigation hit a timeout/error (${navErr.message}), but continuing to extract partial data if possible...`);
        }
        
        // If it's a Taobao link, wait specifically for some content or a bit longer
        const isTaobao = targetUrl.includes('taobao.com') || targetUrl.includes('tmall.com') || targetUrl.includes('tb.cn');
        if (isTaobao) {
          console.log('Detected Taobao/Tmall/tb.cn, waiting for dynamic content...');
          await new Promise(resolve => setTimeout(resolve, 3000)); // Taobao needs more time
        } else {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        const data = await page.evaluate(() => {
          const getMeta = (prop) => {
            const el = document.querySelector(`meta[property="${prop}"], meta[name="${prop}"]`);
            return el ? el.getAttribute('content') : null;
          };

          let title = getMeta('og:title') || document.title || '';
          let image = getMeta('og:image') || getMeta('twitter:image') || '';
          let price = '';

          // Check for Taobao "World" placeholder
          const isPlaceholder = title.includes('天猫淘宝海外') || title.includes('Login') || title.includes('验证码');

          // Platform-specific cleanups
          if (location.host.includes('taobao.com') || location.host.includes('tmall.com')) {
            // Price detection in mobile Taobao
            const priceEl = document.querySelector('.price, .item-price, .promo-price, .ui-cost, [class*="price-text"], .main-price');
            if (priceEl) price = priceEl.innerText.replace(/[^\d.]/g, '');
            
            // Image detection
            if (!image || image.includes('placeholder')) {
              const mainImg = document.querySelector('.main-img img, .item-detail-img img, #J_ImgBooth');
              if (mainImg) image = mainImg.src;
            }
          } else if (location.host.includes('jd.com')) {
            const priceEl = document.querySelector('.jd-price, .price-display, .p-price, .mod_price');
            if (priceEl) price = priceEl.innerText.replace(/[^\d.]/g, '');
          }

          // Fallback price detection (searching for ¥ sign)
          if (!price) {
            const priceTags = Array.from(document.querySelectorAll('span, div, b, strong')).filter(el => el.innerText.includes('¥') || el.innerText.includes('￥'));
            for (const tag of priceTags) {
              const match = tag.innerText.match(/[¥￥]\s?(\d+(?:\.\d{2})?)/);
              if (match) { price = match[1]; break; }
            }
          }

          // Generic Title Clean
          title = title.replace(/-淘宝网|-tmall\.com天猫| - 详情|-京东|淘宝海外/g, '').trim();

          return { title, image, price, isPlaceholder };
        });

        console.log('Extraction results:', data);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          ...data,
          success: true,
          warning: data.isPlaceholder ? '注意：可能触发了机器人验证或重定向，信息可能不完整' : undefined
        }));
      } catch (e) {
        console.error('Scrape error:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      } finally {
        if (browser) await browser.close();
      }
    });
    return;
  }

  // Handle API Save (POST /api/save)
  if (req.method === 'POST' && urlPath === '/api/save') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { filename, content } = JSON.parse(body);
        if (!filename || content === undefined) {
          res.writeHead(400); res.end('Invalid request'); return;
        }
        
        // Ensure saving is restricted to the root or subdirectories like 'data/'
        const safePath = path.resolve(root, filename);
        if (!safePath.startsWith(root)) {
          res.writeHead(403); res.end('Forbidden'); return;
        }

        // Ensure directory exists
        const dir = path.dirname(safePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(safePath, content, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500); res.end(e.message);
      }
    });
    return;
  }

  // Handle API Save Row to CSV (POST /api/save/:filename)
  if (req.method === 'POST' && urlPath.startsWith('/api/save/')) {
    const filename = urlPath.replace('/api/save/', '');
    if (!filename.endsWith('.csv')) {
      res.writeHead(400); res.end('Only CSV files supported'); return;
    }
    
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const rowData = JSON.parse(body);
        
        // Ensure saving is restricted to the data directory
        const safePath = path.resolve(root, 'data', filename);
        if (!safePath.startsWith(path.resolve(root, 'data'))) {
          res.writeHead(403); res.end('Forbidden'); return;
        }

        // Read existing CSV to get headers
        let headers = [];
        let existingContent = '';
        
        if (fs.existsSync(safePath)) {
          existingContent = fs.readFileSync(safePath, 'utf8');
          const lines = existingContent.trim().split('\n');
          if (lines.length > 0) {
            headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          }
        }

        // If file is empty or doesn't exist, create with default headers
        if (headers.length === 0) {
          headers = Object.keys(rowData);
          const headerLine = headers.map(h => escapeCsvField(h)).join(',');
          fs.writeFileSync(safePath, headerLine + '\n', 'utf8');
        }

        // Create CSV row matching headers
        const rowValues = headers.map(key => {
          const value = rowData[key] || '';
          return escapeCsvField(value);
        });
        
        const rowLine = rowValues.join(',') + '\n';
        
        // Append to file
        fs.appendFileSync(safePath, rowLine, 'utf8');
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500); res.end(e.message);
      }
    });
    return;
  }

  if (!filePath.startsWith(root)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.writeHead(404); res.end('Not Found'); return;
    }
    if (stat.isDirectory()) {
      const idx = path.join(filePath, 'index.html');
      fs.readFile(idx, (e, buf) => {
        if (e) { res.writeHead(403); res.end('Forbidden'); return; }
        res.writeHead(200, {'Content-Type': mime['.html']});
        res.end(buf);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    fs.readFile(filePath, (e, buf) => {
      if (e) { res.writeHead(500); res.end('Internal Error'); return; }
      res.writeHead(200, {'Content-Type': mime[ext] || 'application/octet-stream'});
      res.end(buf);
    });
  });
});

server.listen(port, () => {
  console.log(`Static server running at http://localhost:${port}/`);
});

