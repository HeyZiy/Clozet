import { $, $$, escapeHtml } from '../utils.js';
import { fetchData, normalize, renderCsvTable } from '../components/table.js';

let currentTab = 'inventory';
let activeCategory = '全部';

export async function renderWardrobeView(contentEl, loadingEl, navigate) {
  loadingEl.hidden = false;
  currentTab = 'inventory';
  
  try {
    const rawData = await fetchData('/api/items');
    const items = normalize(rawData).normalized;
    
    // SQLite records have 'location' column: 'inventory', 'storage', 'discard'
    const inv = items.filter(r => r.location === 'inventory');
    const store = items.filter(r => r.location === 'storage');
    const disc = items.filter(r => r.location === 'discard');
    
    renderWardrobeLayout(contentEl, { inv, store, disc }, navigate);
    setupWardrobeEvents(contentEl, navigate);
  } catch (e) {
    contentEl.innerHTML = `<div class="muted">衣柜管理加载失败：${escapeHtml(e.message)}</div>`;
  } finally {
    loadingEl.hidden = true;
  }
}

// Removed static CATEGORY_GROUPS and getCategoryGroup mapping
// Categories will now be dynamically extracted from the data.

function renderWardrobeLayout(contentEl, data, navigate) {
  const { inv, store, disc } = data;
  
  contentEl.innerHTML = `
    <section class="wardrobe-view">
      <div class="view-tabs">
        <button class="tab-btn ${currentTab === 'inventory' ? 'active' : ''}" data-tab="inventory">🧥 衣柜区域 (${inv.length})</button>
        <button class="tab-btn ${currentTab === 'storage' ? 'active' : ''}" data-tab="storage">📦 收纳区域 (${store.length})</button>
        <button class="tab-btn ${currentTab === 'discard' ? 'active' : ''}" data-tab="discard">🗑️ 预淘汰区 (${disc.length})</button>
      </div>
      <div id="tab-content"></div>
    </section>
  `;
  
  renderTabContent($('#tab-content', contentEl), data, navigate);
}

function renderTabContent(tabEl, data, navigate) {
  const { inv, store, disc } = data;
  
  let currentData, title, fileType;
  switch (currentTab) {
    case 'inventory':
      currentData = inv;
      title = '衣柜区域';
      fileType = 'inventory';
      break;
    case 'storage':
      currentData = store;
      title = '收纳区域';
      fileType = 'storage';
      break;
    case 'discard':
      currentData = disc;
      title = '预淘汰区';
      fileType = 'discard';
      break;
  }
  
  const catMap = {};
  currentData.forEach(r => {
    const cat = r.category || '其他';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const allCategories = ['全部', ...Object.keys(catMap).sort()];
  
  tabEl.innerHTML = `
    <div class="dash-section animate-fade-in">
      <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:1px solid var(--border); padding-bottom:12px; margin-bottom:16px;">
        <h3 style="margin:0; font-size:16px;">
          ${title}明细 
          <span class="muted" style="font-size:13px;font-weight:normal">(${currentData.length} 件)</span>
        </h3>
        <div class="category-filters" style="display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end">
          ${allCategories.map(g => `
            <button class="cat-filter-btn ${activeCategory === g ? 'active' : ''}" data-cat="${g}" style="background:${activeCategory === g ? 'var(--brand)' : 'transparent'}; color:${activeCategory === g ? '#fff' : 'var(--muted)'}; border:1px solid ${activeCategory === g ? 'var(--brand)' : 'var(--border)'}; padding:4px 10px; border-radius:14px; cursor:pointer; font-size:12px; transition:all 0.2s;">
              ${escapeHtml(g)}
            </button>
          `).join('')}
          <button id="add-wardrobe-btn" style="background:var(--accent); color:#161a22; border:none; padding:4px 12px; border-radius:14px; cursor:pointer; font-size:12px; font-weight:bold; transition:all 0.2s; margin-left:8px;">
            + 新增记录
          </button>
        </div>
      </div>
      <div id="wardrobe-table-container"></div>
    </div>
  `;
  
  const filteredData = activeCategory === '全部' 
    ? currentData 
    : currentData.filter(r => (r.category || '其他') === activeCategory);

  const container = $('#wardrobe-table-container', tabEl);
  renderCsvTable(container, title, fileType, filteredData, null, true);
}

function setupWardrobeEvents(contentEl, navigate) {
  $$('.tab-btn', contentEl).forEach(btn => {
    btn.addEventListener('click', async (e) => {
      currentTab = e.target.dataset.tab;
      activeCategory = '全部'; // Reset category filter on location change
      $$('.tab-btn', contentEl).forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      refreshWardrobeData(contentEl, navigate);
    });
  });

  // Category Filter Events
  $$('.cat-filter-btn', contentEl).forEach(btn => {
    btn.addEventListener('click', async (e) => {
      activeCategory = e.target.dataset.cat;
      refreshWardrobeData(contentEl, navigate);
    });
  });

  const addBtn = $('#add-wardrobe-btn', contentEl);
  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      const { showModal } = await import('../components/modal.js');
      const emptyData = {
        name: '', category: '', brand: '', color: '', price: '',
        buy_date: '', source: '', url: '', image: '',
        season: '', status: '已入库', remarks: '',
        location: currentTab // default to current tab
      };
      
      showModal('添加新物品', emptyData, async (newData) => {
        try {
          // 1. 先添加衣柜物品
          const res = await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newData)
          });
          if (!res.ok) {
            alert('添加失败，请重试');
            return;
          }
          // Removed synchronous creation in /api/purchases (Single Source of Truth)
          alert('添加成功！');
          refreshWardrobeData(contentEl, navigate);
        } catch(e) {
          alert('操作失败：' + e.message);
        }
      });
    });
  }
}

async function refreshWardrobeData(contentEl, navigate) {
  const rawData = await fetchData('/api/items');
  const items = normalize(rawData).normalized;
  
  const inv = items.filter(r => r.location === 'inventory');
  const store = items.filter(r => r.location === 'storage');
  const disc = items.filter(r => r.location === 'discard');
  
  renderTabContent($('#tab-content', contentEl), { inv, store, disc }, navigate);
  setupWardrobeEvents(contentEl, navigate);
}
