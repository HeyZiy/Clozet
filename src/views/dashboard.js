import { $, $$, escapeHtml } from '../utils.js';
import { fetchData, normalize } from '../components/table.js';

export async function renderDashboardView(contentEl, loadingEl, navigate) {
  loadingEl.hidden = false;
  
  try {
    const rawData = await fetchData('/api/items');
    const items = normalize(rawData).normalized;
    
    // Process data
    const activeItems = items.filter(r => r.location !== 'discard');
    const inventoryItems = items.filter(r => r.location === 'inventory');
    
    let totalAssetValue = 0;
    const catMap = {};
    const colorMap = {};
    
    activeItems.forEach(r => {
      // Categorization
      const cat = r.category || '其他';
      catMap[cat] = (catMap[cat] || 0) + 1;
      
      // Color
      const color = r.color || '其他';
      colorMap[color] = (colorMap[color] || 0) + 1;
      
      // Valuation
      const price = parseFloat(r.price);
      if (!isNaN(price)) {
        totalAssetValue += price;
      }
    });

    const topCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topColors = Object.entries(colorMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const recent = [...items].sort((a, b) => b.id - a.id).slice(0, 5);
    
    contentEl.innerHTML = `
      <section class="dashboard-view animate-fade-in">
        <h2 class="main-section-title">📊 衣橱数据概览</h2>
        
        <div class="stats-grid">
          <div class="stat-card highlight" onclick="window.navigate('wardrobe')">
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
              <div class="stat-val">${items.length} <span style="font-size:16px; font-weight:500; color:var(--muted)">件</span></div>
              <div style="background:rgba(99, 102, 241, 0.2); padding:10px; border-radius:14px; color:var(--brand)">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/></svg>
              </div>
            </div>
            <div class="stat-label">在库衣物总数</div>
          </div>

          <div class="stat-card" style="border-left:4px solid var(--success)" onclick="window.navigate('finance')">
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
              <div class="stat-val" style="color:var(--success)">¥${totalAssetValue.toFixed(0)}</div>
              <div style="background:rgba(16, 185, 129, 0.2); padding:10px; border-radius:14px; color:var(--success)">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
            </div>
            <div class="stat-label">衣橱资产估值</div>
          </div>

          <div class="stat-card" style="border-left:4px solid var(--accent)" onclick="window.navigate('wardrobe')">
            <div style="display:flex; justify-content:space-between; align-items:flex-start">
              <div class="stat-val" style="color:var(--accent)">${inventoryItems.length} <span style="font-size:16px; font-weight:500; color:var(--muted)">件</span></div>
              <div style="background:rgba(45, 212, 191, 0.2); padding:10px; border-radius:14px; color:var(--accent)">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
            </div>
            <div class="stat-label">当前季节备选 (外挂区)</div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="dash-panel animate-slide-up" style="animation-delay: 0.1s">
            <h3>最近入库物品</h3>
            <div class="recent-list">
              ${recent.length ? recent.map(r => `
                <div class="recent-item">
                  <div style="width:40px; height:40px; border-radius:10px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; overflow:hidden">
                    ${r.image ? `<img src="${r.image}" style="width:100%; height:100%; object-fit:cover">` : `<span style="font-size:10px; color:var(--muted)">无图</span>`}
                  </div>
                  <div class="name">${escapeHtml(r.name)}</div>
                  <div class="pill pill-category">${escapeHtml(r.category || '衣物')}</div>
                </div>
              `).join('') : '<div class="muted">暂无记录</div>'}
            </div>
          </div>
          
          <div class="dash-panel animate-slide-up" style="animation-delay: 0.2s">
            <h3>分类分布 (Top 5)</h3>
            <div class="cat-list">
              ${topCats.length ? topCats.map(([cat, count]) => {
                const pct = items.length ? ((count / items.length) * 100).toFixed(0) : 0;
                return `
                  <div class="cat-row">
                    <div class="cat-info">
                      <span>${escapeHtml(cat)}</span>
                      <span>${count}件 (${pct}%)</span>
                    </div>
                    <div class="progress-bg"><div class="progress-fill" style="width:${pct}%"></div></div>
                  </div>
                `;
              }).join('') : '<div class="muted">暂无数据</div>'}
            </div>
          </div>

          <div class="dash-panel animate-slide-up" style="animation-delay: 0.3s">
            <h3>色彩分布</h3>
            <div class="color-grid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px">
              ${topColors.length ? topColors.map(([color, count]) => {
                let colorCode = getColorCode(color);
                const isLight = colorCode === '#f1f5f9';
                
                return `
                  <div class="color-card" style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.03); padding:8px; border-radius:10px; border:1px solid var(--border); transition: all 0.2s hover {transform: scale(1.05)}">
                    <span style="width:16px; height:16px; border-radius:4px; background:${colorCode}; ${isLight ? 'border:1px solid #ccc;' : ''}"></span>
                    <span style="font-size:13px; flex:1">${escapeHtml(color)}</span>
                    <span class="muted" style="font-size:12px">${count}</span>
                  </div>
                `;
              }).join('') : '<div class="muted">暂无颜色数据</div>'}
            </div>
          </div>
        </div>
      </section>
    `;
  } catch (e) {
    contentEl.innerHTML = `<div class="muted">概览加载失败：${escapeHtml(e.message)}</div>`;
  } finally {
    loadingEl.hidden = true;
  }
}

function getColorCode(color) {
  if (color.includes('白')) return '#f8fafc';
  if (color.includes('黑')) return '#0f172a';
  if (color.includes('灰')) return '#64748b';
  if (color.includes('蓝')) return '#3b82f6';
  if (color.includes('红')) return '#ef4444';
  if (color.includes('绿')) return '#22c55e';
  if (color.includes('黄')) return '#eab308';
  if (color.includes('粉')) return '#f472b6';
  if (color.includes('紫')) return '#a855f7';
  if (color.includes('褐') || color.includes('咖啡') || color.includes('棕')) return '#78350f';
  if (color.includes('杏') || color.includes('米') || color.includes('卡其')) return '#fef3c7';
  if (color.includes('藏') || color.includes('深蓝')) return '#1e3a8a';
  return '#475569';
}
