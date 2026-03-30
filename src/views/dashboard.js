import { $, $$, escapeHtml } from '../utils.js';
import { fetchData, normalize, renderCsvTable } from '../components/table.js';

export async function renderDashboardView(contentEl, loadingEl, navigate) {
  loadingEl.hidden = false;

  try {
    const rawData = await fetchData('/api/items');
    const items = normalize(rawData).normalized;

    // 统计数据
    const inventoryItems = items.filter(r => r.location === 'inventory');
    const storageItems = items.filter(r => r.location === 'storage');
    const discardItems = items.filter(r => r.location === 'discard');

    let totalAssetValue = 0;
    items.forEach(r => {
      const price = parseFloat(r.price);
      if (!isNaN(price)) totalAssetValue += price;
    });

    // 最近入库的6件物品
    const recentItems = [...items]
      .sort((a, b) => new Date(b.buy_date || 0) - new Date(a.buy_date || 0))
      .slice(0, 6);

    contentEl.innerHTML = `
      <section class="dashboard-view animate-fade-in">
        <!-- 快捷操作区 -->
        <div class="quick-actions" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:24px;">
          <button class="action-card" onclick="window.navigate('wardrobe')" style="background:linear-gradient(135deg, var(--brand) 0%, #6366f1 100%); color:white; border:none; padding:20px; border-radius:16px; cursor:pointer; text-align:left; transition:all 0.2s;">
            <div style="font-size:28px; margin-bottom:8px;">👔</div>
            <div style="font-weight:700; font-size:14px;">浏览衣橱</div>
            <div style="font-size:12px; opacity:0.8; margin-top:4px;">${inventoryItems.length} 件在用</div>
          </button>

          <button class="action-card" id="dash-fast-add" style="background:linear-gradient(135deg, var(--success) 0%, #10b981 100%); color:white; border:none; padding:20px; border-radius:16px; cursor:pointer; text-align:left; transition:all 0.2s;">
            <div style="font-size:28px; margin-bottom:8px;">📸</div>
            <div style="font-weight:700; font-size:14px;">拍照入库</div>
            <div style="font-size:12px; opacity:0.8; margin-top:4px;">AI 自动识别</div>
          </button>

          <button class="action-card" onclick="window.navigate('finance')" style="background:linear-gradient(135deg, var(--accent) 0%, #2dd4bf 100%); color:white; border:none; padding:20px; border-radius:16px; cursor:pointer; text-align:left; transition:all 0.2s;">
            <div style="font-size:28px; margin-bottom:8px;">💰</div>
            <div style="font-weight:700; font-size:14px;">财务概览</div>
            <div style="font-size:12px; opacity:0.8; margin-top:4px;">资产 ¥${totalAssetValue.toFixed(0)}</div>
          </button>

          <button class="action-card" onclick="window.navigate('wardrobe')" style="background:var(--panel); border:1px solid var(--border); padding:20px; border-radius:16px; cursor:pointer; text-align:left; transition:all 0.2s;">
            <div style="font-size:28px; margin-bottom:8px;">📦</div>
            <div style="font-weight:700; font-size:14px; color:var(--text);">闲置收纳</div>
            <div style="font-size:12px; color:var(--muted); margin-top:4px;">${storageItems.length} 件在库</div>
          </button>
        </div>

        <!-- 核心数据卡片 -->
        <div class="stats-row" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-bottom:24px;">
          <div class="stat-mini" style="background:var(--panel); border:1px solid var(--border); padding:16px 20px; border-radius:12px; display:flex; align-items:center; gap:16px;">
            <div style="width:48px; height:48px; border-radius:12px; background:rgba(99,102,241,0.15); display:flex; align-items:center; justify-content:center; font-size:24px;">👕</div>
            <div>
              <div style="font-size:24px; font-weight:800; color:var(--text);">${items.length}</div>
              <div style="font-size:12px; color:var(--muted);">衣物总数</div>
            </div>
          </div>

          <div class="stat-mini" style="background:var(--panel); border:1px solid var(--border); padding:16px 20px; border-radius:12px; display:flex; align-items:center; gap:16px;">
            <div style="width:48px; height:48px; border-radius:12px; background:rgba(16,185,129,0.15); display:flex; align-items:center; justify-content:center; font-size:24px;">💎</div>
            <div>
              <div style="font-size:24px; font-weight:800; color:var(--success);">¥${(totalAssetValue / 10000).toFixed(1)}w</div>
              <div style="font-size:12px; color:var(--muted);">资产估值</div>
            </div>
          </div>

          <div class="stat-mini" style="background:var(--panel); border:1px solid var(--border); padding:16px 20px; border-radius:12px; display:flex; align-items:center; gap:16px;">
            <div style="width:48px; height:48px; border-radius:12px; background:rgba(239,68,68,0.15); display:flex; align-items:center; justify-content:center; font-size:24px;">🗑️</div>
            <div>
              <div style="font-size:24px; font-weight:800; color:var(--danger);">${discardItems.length}</div>
              <div style="font-size:12px; color:var(--muted);">待淘汰</div>
            </div>
          </div>
        </div>

        <!-- 最近入库预览 -->
        <div class="recent-section" style="background:var(--panel); border:1px solid var(--border); border-radius:16px; padding:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 style="margin:0; font-size:16px; font-weight:700;">最近入库</h3>
            <button onclick="window.navigate('wardrobe')" style="background:none; border:none; color:var(--brand); font-size:13px; cursor:pointer;">查看全部 →</button>
          </div>

          <div class="items-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:12px;">
            ${recentItems.length ? recentItems.map(item => `
              <div class="item-card" style="background:var(--bg); border:1px solid var(--border); border-radius:12px; overflow:hidden; cursor:pointer; transition:all 0.2s;" onclick="window.navigate('wardrobe')">
                <div style="aspect-ratio:1; background:rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; overflow:hidden;">
                  ${item.image ?
                    `<img src="${item.image}" style="width:100%; height:100%; object-fit:cover;">` :
                    `<span style="font-size:32px;">${getCategoryEmoji(item.category)}</span>`
                  }
                </div>
                <div style="padding:12px;">
                  <div style="font-size:13px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(item.name || '未命名')}</div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
                    <span style="font-size:11px; color:var(--muted);">${escapeHtml(item.category || '衣物')}</span>
                    <span style="font-size:11px; color:var(--success); font-weight:600;">¥${item.price || 0}</span>
                  </div>
                </div>
              </div>
            `).join('') : `
              <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--muted);">
                <div style="font-size:48px; margin-bottom:12px;">📭</div>
                <div>还没有衣物记录</div>
                <button id="dash-empty-add" style="margin-top:16px; background:var(--brand); color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer;">添加第一件</button>
              </div>
            `}
          </div>
        </div>

        <!-- 占位：未来智能推荐区 -->
        <div class="ai-section" style="margin-top:24px; background:linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(45,212,191,0.1) 100%); border:1px dashed var(--brand); border-radius:16px; padding:24px; text-align:center;">
          <div style="font-size:32px; margin-bottom:8px;">✨</div>
          <div style="font-weight:700; color:var(--text); margin-bottom:4px;">智能穿搭推荐</div>
          <div style="font-size:13px; color:var(--muted);">基于天气、场合、个人风格的 AI 搭配建议（开发中）</div>
        </div>
      </section>
    `;

    // 绑定快捷添加按钮事件
    const fastAddBtn = $('#dash-fast-add');
    if (fastAddBtn) {
      fastAddBtn.addEventListener('click', async () => {
        const { showImageImportModal } = await import('../components/purchaseForm.js');
        showImageImportModal(async (record) => {
          try {
            await fetch('/api/items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({...record, location: 'inventory', add_date: record.buy_date})
            });
            window.dispatchEvent(new Event('data-refreshed'));
          } catch (e) {
            alert('入库发生错误: ' + e.message);
          }
        });
      });
    }

    // 空状态添加按钮
    const emptyAddBtn = $('#dash-empty-add');
    if (emptyAddBtn) {
      emptyAddBtn.addEventListener('click', () => fastAddBtn?.click());
    }

  } catch (e) {
    contentEl.innerHTML = `<div class="muted">首页加载失败：${escapeHtml(e.message)}</div>`;
  } finally {
    loadingEl.hidden = true;
  }
}

function getCategoryEmoji(category) {
  if (!category) return '👔';
  if (category.includes('短袖') || category.includes('T恤')) return '👕';
  if (category.includes('长袖') || category.includes('衬衫')) return '👔';
  if (category.includes('外套') || category.includes('夹克')) return '🧥';
  if (category.includes('裤子') || category.includes('裤')) return '👖';
  if (category.includes('短裤')) return '🩳';
  if (category.includes('羽绒服')) return '🧥';
  if (category.includes('秋衣') || category.includes('内衣')) return '🥼';
  if (category.includes('袜子')) return '🧦';
  if (category.includes('鞋子') || category.includes('鞋')) return '👟';
  if (category.includes('配饰') || category.includes('帽子')) return '🧢';
  return '👔';
}
