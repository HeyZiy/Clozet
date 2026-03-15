const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Basic CSV parser identical to table.js
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeCsv(csvText) {
  const lines = csvText.trim().split('\n');
  if (!lines.length) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const normalized = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || values.every(v => v === '')) continue;
    
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    normalized.push(row);
  }
  
  return normalized;
}

function extractColorFromName(name) {
  if (!name) return '未知';
  const n = name.toLowerCase();
  
  const colors = [
    { key: '白', val: '白色' },
    { key: '黑', val: '黑色' },
    { key: '灰', val: '灰色' },
    { key: '蓝', val: '蓝色' },
    { key: '红', val: '红色' },
    { key: '绿', val: '绿色' },
    { key: '黄', val: '黄色' },
    { key: '粉', val: '粉色' },
    { key: '紫', val: '紫色' },
    { key: '棕', val: '棕色' },
    { key: '卡其', val: '卡其色' },
    { key: '咖', val: '咖啡色' },
    { key: '橙', val: '橙色' },
    { key: '青', val: '青色' },
    { key: '银', val: '银色' },
    { key: '金', val: '金色' },
    { key: '杏', val: '杏色' },
    { key: '藏青', val: '藏青色' }
  ];
  
  // Return the first matching color, or "其他"
  for (const c of colors) {
    if (n.includes(c.key)) {
      return c.val;
    }
  }
  return '其他';
}

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'database.sqlite');

console.log(`Creating database at ${dbPath}`);
// Delete existing to start fresh if migration is run multiple times
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Create Items Table (Merged from inventory, storage, discard)
  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image TEXT,
      name TEXT,
      category TEXT,
      brand TEXT,
      season TEXT,
      status TEXT,
      price REAL,
      url TEXT,
      buy_date TEXT,
      source TEXT,
      add_date TEXT,
      color TEXT,
      location TEXT -- 'inventory', 'storage', 'discard'
    )
  `);

  // Create Purchases Table
  db.run(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image TEXT,
      name TEXT,
      brand TEXT,
      category TEXT,
      buy_date TEXT,
      source TEXT,
      price REAL,
      url TEXT,
      status TEXT,
      remarks TEXT
    )
  `);

  // Helper to parse price
  const parsePrice = (p) => {
    if (!p) return 0;
    const num = parseFloat(String(p).replace(/[^0-9.-]+/g, ""));
    return isNaN(num) ? 0 : num;
  };

  const stmtItems = db.prepare(`
    INSERT INTO items (image, name, category, brand, season, status, price, url, buy_date, source, add_date, color, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const importItems = (filename, location) => {
    const fp = path.join(dataDir, filename);
    if (!fs.existsSync(fp)) {
      console.log(`Skipping ${filename}, file not found.`);
      return;
    }
    const content = fs.readFileSync(fp, 'utf8');
    const records = normalizeCsv(content);
    console.log(`Importing ${records.length} records from ${filename} as ${location}...`);
    
    records.forEach(r => {
      const color = extractColorFromName(r['名称'] || '');
      stmtItems.run(
        r['图片'] || '',
        r['名称'] || '未命名',
        r['分类'] || r['类型'] || '其他',
        r['品牌'] || '无品牌',
        r['季节'] || r['适用季节'] || '四季通用',
        r['状态'] || '未知状态',
        parsePrice(r['价格'] || r['金额']),
        r['购买链接'] || '',
        r['购买日期'] || '',
        r['购买途径'] || r['来源'] || '',
        r['入库日期'] || '',
        color,
        location
      );
    });
  };

  importItems('inventory.csv', 'inventory');
  importItems('storage.csv', 'storage');
  importItems('discard.csv', 'discard');

  stmtItems.finalize();

  const stmtPurchases = db.prepare(`
    INSERT INTO purchases (image, name, brand, category, buy_date, source, price, url, status, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const purchFile = path.join(dataDir, 'purchases.csv');
  if (fs.existsSync(purchFile)) {
    const content = fs.readFileSync(purchFile, 'utf8');
    const records = normalizeCsv(content);
    console.log(`Importing ${records.length} records from purchases.csv...`);
    
    records.forEach(r => {
      stmtPurchases.run(
        r['图片'] || '',
        r['名称'] || '未命名',
        r['品牌'] || '无品牌',
        r['分类'] || r['类型'] || '其他',
        r['购买日期'] || '',
        r['购买途径'] || r['来源'] || '',
        parsePrice(r['价格'] || r['金额']),
        r['购买链接'] || '',
        r['状态'] || '已下单',
        r['备注'] || ''
      );
    });
  }
  stmtPurchases.finalize();

});

db.close(() => {
  console.log("Migration complete! Data written to data/database.sqlite");
});
