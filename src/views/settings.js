import { $, $$, escapeHtml, getCategories, setCategories, resetCategories, getBudgets, setBudgets, getStorageLocations, setStorageLocations, resetStorageLocations } from '../utils.js';
import { DEFAULT_CATEGORIES, DEFAULT_BUDGETS } from '../config.js';

export function renderSettingsView(contentEl, loadingEl, navigate) {
  loadingEl.hidden = false;

  try {
    const categories = getCategories();
    const storageLocations = getStorageLocations();
    const budgets = getBudgets();

    contentEl.innerHTML = `
      <section class="settings-view animate-fade-in">
        <h2 class="main-section-title">⚙️ 设置</h2>

        <!-- 品类管理 -->
        <div class="settings-card" style="background:var(--panel); border:1px solid var(--border); border-radius:16px; padding:24px; margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 style="margin:0; font-size:16px;">📂 衣物分类管理</h3>
            <button id="reset-categories" style="background:none; border:1px solid var(--border); color:var(--muted); padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px;">恢复默认</button>
          </div>
          <p style="color:var(--muted); font-size:13px; margin-bottom:16px;">自定义您的衣物分类列表，用于添加衣物时的下拉选择</p>

          <div id="categories-list" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;">
            ${categories.map(cat => `
              <div class="category-tag" style="display:flex; align-items:center; gap:6px; background:rgba(99,102,241,0.15); color:var(--brand); padding:8px 12px; border-radius:20px; font-size:13px;">
                <span>${escapeHtml(cat)}</span>
                <button class="remove-cat" data-cat="${escapeHtml(cat)}" style="background:none; border:none; color:var(--brand); cursor:pointer; padding:0; font-size:16px; line-height:1;">×</button>
              </div>
            `).join('')}
          </div>

          <div style="display:flex; gap:8px;">
            <input type="text" id="new-category" placeholder="输入新分类名称" style="flex:1; background:var(--bg); border:1px solid var(--border); color:var(--text); padding:10px 14px; border-radius:8px;">
            <button id="add-category" style="background:var(--brand); color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:600;">添加</button>
          </div>
        </div>

        <!-- 收纳位置管理 -->
        <div class="settings-card" style="background:var(--panel); border:1px solid var(--border); border-radius:16px; padding:24px; margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 style="margin:0; font-size:16px;">📦 收纳位置管理</h3>
            <button id="reset-storage-locations" style="background:none; border:1px solid var(--border); color:var(--muted); padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px;">恢复默认</button>
          </div>
          <p style="color:var(--muted); font-size:13px; margin-bottom:16px;">自定义收纳位置列表，用于移动衣物到收纳区时的选择</p>

          <div id="storage-locations-list" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;">
            ${storageLocations.map(loc => `
              <div class="location-tag" style="display:flex; align-items:center; gap:6px; background:rgba(16,185,129,0.15); color:var(--success); padding:8px 12px; border-radius:20px; font-size:13px;">
                <span>${escapeHtml(loc)}</span>
                <button class="remove-loc" data-loc="${escapeHtml(loc)}" style="background:none; border:none; color:var(--success); cursor:pointer; padding:0; font-size:16px; line-height:1;">×</button>
              </div>
            `).join('')}
          </div>

          <div style="display:flex; gap:8px;">
            <input type="text" id="new-storage-location" placeholder="输入新收纳位置" style="flex:1; background:var(--bg); border:1px solid var(--border); color:var(--text); padding:10px 14px; border-radius:8px;">
            <button id="add-storage-location" style="background:var(--success); color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:600;">添加</button>
          </div>
        </div>

        <!-- 预算设置 -->
        <div class="settings-card" style="background:var(--panel); border:1px solid var(--border); border-radius:16px; padding:24px; margin-bottom:20px;">
          <h3 style="margin:0 0 16px 0; font-size:16px;">💰 预算设置</h3>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
            <div>
              <label style="display:block; font-size:13px; color:var(--muted); margin-bottom:6px;">年度预算</label>
              <input type="number" id="yearly-budget" value="${budgets.yearly || DEFAULT_BUDGETS.yearly}" style="width:100%; background:var(--bg); border:1px solid var(--border); color:var(--text); padding:10px 14px; border-radius:8px;">
            </div>
            <div>
              <label style="display:block; font-size:13px; color:var(--muted); margin-bottom:6px;">月度预算</label>
              <input type="number" id="monthly-budget" value="${budgets.monthly || DEFAULT_BUDGETS.monthly}" style="width:100%; background:var(--bg); border:1px solid var(--border); color:var(--text); padding:10px 14px; border-radius:8px;">
            </div>
          </div>

          <button id="save-budgets" style="margin-top:16px; background:var(--success); color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:600;">保存预算</button>
        </div>

        <!-- 数据管理 -->
        <div class="settings-card" style="background:var(--panel); border:1px solid var(--border); border-radius:16px; padding:24px;">
          <h3 style="margin:0 0 16px 0; font-size:16px;">💾 数据管理</h3>

          <div style="display:flex; gap:12px; flex-wrap:wrap;">
            <button id="export-data" style="background:var(--bg); border:1px solid var(--border); color:var(--text); padding:10px 20px; border-radius:8px; cursor:pointer;">📤 导出数据</button>
            <button id="clear-localstorage" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:var(--danger); padding:10px 20px; border-radius:8px; cursor:pointer;">🗑️ 清除本地设置</button>
          </div>
        </div>
      </section>
    `;

    setupSettingsEvents(contentEl);

  } catch (e) {
    contentEl.innerHTML = `<div class="muted">设置页面加载失败：${escapeHtml(e.message)}</div>`;
  } finally {
    loadingEl.hidden = true;
  }
}

function setupSettingsEvents(contentEl) {
  // 添加分类
  const addBtn = $('#add-category', contentEl);
  const newCatInput = $('#new-category', contentEl);

  addBtn?.addEventListener('click', () => {
    const newCat = newCatInput.value.trim();
    if (!newCat) return;

    const categories = getCategories();
    if (categories.includes(newCat)) {
      alert('该分类已存在');
      return;
    }

    categories.push(newCat);
    setCategories(categories);
    newCatInput.value = '';
    refreshCategoriesList(contentEl);
  });

  newCatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addBtn?.click();
  });

  // 删除分类
  contentEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-cat')) {
      const catToRemove = e.target.dataset.cat;
      if (!confirm(`确定要删除分类 "${catToRemove}" 吗？`)) return;

      const categories = getCategories().filter(c => c !== catToRemove);
      setCategories(categories);
      refreshCategoriesList(contentEl);
    }
  });

  // 恢复默认分类
  $('#reset-categories', contentEl)?.addEventListener('click', () => {
    if (!confirm('确定要恢复默认分类列表吗？自定义的分类将被删除。')) return;
    resetCategories();
    refreshCategoriesList(contentEl);
  });

  // 添加收纳位置
  const addLocBtn = $('#add-storage-location', contentEl);
  const newLocInput = $('#new-storage-location', contentEl);

  addLocBtn?.addEventListener('click', () => {
    const newLoc = newLocInput.value.trim();
    if (!newLoc) return;

    const locations = getStorageLocations();
    if (locations.includes(newLoc)) {
      alert('该收纳位置已存在');
      return;
    }

    locations.push(newLoc);
    setStorageLocations(locations);
    newLocInput.value = '';
    refreshStorageLocationsList(contentEl);
  });

  newLocInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addLocBtn?.click();
  });

  // 删除收纳位置
  contentEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-loc')) {
      const locToRemove = e.target.dataset.loc;
      if (!confirm(`确定要删除收纳位置 "${locToRemove}" 吗？`)) return;

      const locations = getStorageLocations().filter(l => l !== locToRemove);
      setStorageLocations(locations);
      refreshStorageLocationsList(contentEl);
    }
  });

  // 恢复默认收纳位置
  $('#reset-storage-locations', contentEl)?.addEventListener('click', () => {
    if (!confirm('确定要恢复默认收纳位置列表吗？自定义的位置将被删除。')) return;
    resetStorageLocations();
    refreshStorageLocationsList(contentEl);
  });

  // 保存预算
  $('#save-budgets', contentEl)?.addEventListener('click', () => {
    const yearly = parseFloat($('#yearly-budget', contentEl).value) || DEFAULT_BUDGETS.yearly;
    const monthly = parseFloat($('#monthly-budget', contentEl).value) || DEFAULT_BUDGETS.monthly;
    setBudgets({ yearly, monthly });
    alert('预算设置已保存');
  });

  // 导出数据
  $('#export-data', contentEl)?.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/items');
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wardrobe-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('导出失败: ' + e.message);
    }
  });

  // 清除本地设置
  $('#clear-localstorage', contentEl)?.addEventListener('click', () => {
    if (!confirm('确定要清除所有本地设置吗？包括分类、预算、列显示偏好等。数据不会丢失。')) return;
    localStorage.clear();
    alert('本地设置已清除，页面将刷新');
    location.reload();
  });
}

function refreshCategoriesList(contentEl) {
  const categories = getCategories();
  const listEl = $('#categories-list', contentEl);
  if (listEl) {
    listEl.innerHTML = categories.map(cat => `
      <div class="category-tag" style="display:flex; align-items:center; gap:6px; background:rgba(99,102,241,0.15); color:var(--brand); padding:8px 12px; border-radius:20px; font-size:13px;">
        <span>${escapeHtml(cat)}</span>
        <button class="remove-cat" data-cat="${escapeHtml(cat)}" style="background:none; border:none; color:var(--brand); cursor:pointer; padding:0; font-size:16px; line-height:1;">×</button>
      </div>
    `).join('');
  }
}

function refreshStorageLocationsList(contentEl) {
  const locations = getStorageLocations();
  const listEl = $('#storage-locations-list', contentEl);
  if (listEl) {
    listEl.innerHTML = locations.map(loc => `
      <div class="location-tag" style="display:flex; align-items:center; gap:6px; background:rgba(16,185,129,0.15); color:var(--success); padding:8px 12px; border-radius:20px; font-size:13px;">
        <span>${escapeHtml(loc)}</span>
        <button class="remove-loc" data-loc="${escapeHtml(loc)}" style="background:none; border:none; color:var(--success); cursor:pointer; padding:0; font-size:16px; line-height:1;">×</button>
      </div>
    `).join('');
  }
}