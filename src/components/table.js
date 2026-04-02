import { $, $$, escapeHtml, getStorageLocations } from '../utils.js';
import { OPTIONS_SEASONS } from '../config.js';
import { showToast } from './toast.js';

export async function fetchData(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`加载失败: ${url}`);
  const data = await res.json();
  return data;
}

export function normalize(data) {
  // Maintaining compatibility with existing code where it expects { headers, normalized }
  if (!data || !data.length) return { headers: [], normalized: [] };
  
  const headers = Object.keys(data[0]);
  return { headers, normalized: data };
}

let currentSort = { key: null, asc: true };

// Column persistence logic
const STORAGE_KEY = 'wardrobe_column_prefs';
let columnPrefs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

function savePrefs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(columnPrefs));
}

export function renderCsvTable(container, title, fileType, rows, filterFn, showActions = true) {
  if (!rows || rows.length === 0) {
    container.innerHTML = `<div class="muted">暂无数据</div>`;
    return;
  }
  
  const filteredRows = filterFn ? rows.filter(filterFn) : rows;
  if (filteredRows.length === 0) {
    container.innerHTML = `<div class="muted">没有符合条件的记录</div>`;
    return;
  }
  
  // Apply sorting if active
  let displayRows = [...filteredRows];
  if (currentSort.key) {
    displayRows.sort((a, b) => {
      let valA = a[currentSort.key] || '';
      let valB = b[currentSort.key] || '';
      
      // Numeric or Date parsing for specific fields
      if (currentSort.key.includes('价格') || currentSort.key.includes('金额')) {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      } else if (currentSort.key.includes('日期')) {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      }
      
      if (valA < valB) return currentSort.asc ? -1 : 1;
      if (valA > valB) return currentSort.asc ? 1 : -1;
      return 0;
    });
  }
  
  const allHeaders = Object.keys(filteredRows[0]);

  // Always hide internal/system fields from display
  const hiddenFields = ['location'];

  // Initialize prefs if empty for these headers
  allHeaders.forEach(h => {
    if (columnPrefs[h] === undefined) {
      const isHiddenByDefault = ['URL', '链接', '日期', '来源', '品牌', 'add_date', 'buy_date'].some(k => h.toLowerCase().includes(k));
      columnPrefs[h] = !isHiddenByDefault;
    }
  });

  const displayHeaders = allHeaders.filter(h => columnPrefs[h] && !hiddenFields.includes(h.toLowerCase()));
  
  container.innerHTML = `
    <div class="controls">
      <input type="text" class="search" placeholder="搜索..." data-table-search>
    <div class="batch-actions animate-slide-up" data-batch-actions>
      <div style="display:flex; align-items:center; gap:16px; border-right:1px solid rgba(255,255,255,0.1); padding-right:16px; margin-right:4px">
        <span style="color:var(--brand); font-weight:800; font-size:16px" data-selected-count>0</span>
        <span style="font-size:12px; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:1px">已选择</span>
      </div>
      <button class="batch-btn" data-batch-action="move">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px"><polyline points="9 18 15 12 9 6"></polyline></svg>
        批量区域移动
      </button>
      <button class="batch-btn danger" data-batch-action="delete">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
        彻底删除记录
      </button>
      <button class="nav-btn" style="background:transparent; border:none; padding:8px; margin-left:8px; color:var(--muted)" onclick="document.querySelectorAll('[data-row-select]').forEach(cb => cb.checked = false); window.dispatchEvent(new Event('data-refreshed'));">
        取消选择
      </button>
    </div>
    <div style="position:relative">
      <button class="column-settings-btn" id="col-settings-trigger" title="列设置">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
      </button>
      <div class="column-selector-dropdown" id="col-selector-menu">
        <div style="font-weight:800; font-size:12px; margin-bottom:12px; color:var(--text); letter-spacing:1px; text-transform:uppercase">显示列设置</div>
        ${allHeaders.map(h => `
          <label class="column-option">
            <input type="checkbox" data-col-toggle="${h}" ${columnPrefs[h] ? 'checked' : ''}>
            ${h}
          </label>
        `).join('')}
      </div>
    </div>
    <div class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th style="width:40px"><input type="checkbox" data-select-all></th>
            ${displayHeaders.map(h => {
              const isActive = currentSort.key === h;
              const dirIcon = isActive ? (currentSort.asc ? ' ↑' : ' ↓') : '';
              return `<th class="sortable-header" data-sort-key="${escapeHtml(h)}" style="cursor:pointer; user-select:none;">
                ${escapeHtml(h)}<span class="muted" style="font-size:12px">${dirIcon}</span>
              </th>`;
            }).join('')}
            ${showActions ? '<th>操作</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${displayRows.map((row, idx) => renderTableRow(row, idx, displayHeaders, fileType, showActions)).join('')}
        </tbody>
      </table>
    </div>
  `;
  
  setupTableEvents(container, fileType, filteredRows, title, filterFn, showActions);
}

function renderTableRow(row, idx, headers, fileType, showActions) {
  return `
    <tr data-row-id="${row.id}">
      <td class="col-check" style="text-align:center"><input type="checkbox" data-row-select></td>
      ${headers.map(h => renderTableCell(row[h], h, row)).join('')}
      ${showActions ? `<td class="col-actions" style="text-align:right; padding-right:24px">${renderRowActions(fileType)}</td>` : ''}
    </tr>
  `;
}

function renderTableCell(value, header, fullRow) {
  const headerLower = header.toLowerCase();
  
  if (headerLower.includes('图片') || headerLower.includes('image')) {
    return `<td class="col-img" data-label="${escapeHtml(header)}">${value ? `<img src="${escapeHtml(value)}" class="table-img" onerror="this.src='/assets/placeholder.svg'">` : ''}</td>`;
  }

  if (headerLower.includes('名称') || headerLower.includes('name')) {
    const brand = fullRow['品牌'] || fullRow['brand'] || '';
    return `
      <td data-label="${escapeHtml(header)}">
        <div style="font-weight:700; font-size:14px; color:#fff" class="cell-main-text">${escapeHtml(value)}</div>
        ${brand ? `<div style="font-size:11px; color:var(--muted); margin-top:2px" class="cell-sub-text">${escapeHtml(brand)}</div>` : ''}
      </td>
    `;
  }
  
  if (headerLower.includes('价格') || headerLower.includes('金额') || headerLower.includes('price')) {
    const num = parseFloat(value);
    return `<td data-label="${escapeHtml(header)}" style="font-weight:600; color:var(--accent)">${!isNaN(num) ? `¥${num.toFixed(0)}` : '¥0'}</td>`;
  }
  
  if (headerLower.includes('季节') || headerLower.includes('适用季节') || headerLower.includes('season')) {
    const seasonClass = getSeasonClass(value);
    return `<td data-label="${escapeHtml(header)}"><span class="pill ${seasonClass}">${escapeHtml(value)}</span></td>`;
  }
  
  if (headerLower.includes('分类') || headerLower.includes('类型') || headerLower.includes('category')) {
    return `<td data-label="${escapeHtml(header)}"><span class="pill pill-category">${escapeHtml(value)}</span></td>`;
  }
  
  return `<td data-label="${escapeHtml(header)}">${escapeHtml(value)}</td>`;
}


function getSeasonClass(season) {
  if (!season) return '';
  if (season.includes('冬')) return 'pill-winter';
  if (season.includes('夏')) return 'pill-summer';
  if (season.includes('春') && season.includes('秋')) return 'pill-spring-fall';
  if (season.includes('春')) return 'pill-spring';
  if (season.includes('秋')) return 'pill-fall';
  return '';
}

function renderRowActions(fileType) {
  const actions = [];
  
  // Custom SVG Icons for a premium feel
  const icons = {
    storage: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>`,
    inventory: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z"/></svg>`,
    discard: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
    restore: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 017-8.7"/><path d="M14 4.3a9 9 0 017 8.7"/><polyline points="7 12 3 12 3 8"/><polyline points="17 12 21 12 21 16"/><path d="M3 12a9 9 0 0011 8.7"/><path d="M14 20.7a9 9 0 007-8.7"/></svg>`,
    delete: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    edit: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`
  };

  if (fileType === 'inventory') {
    actions.push(`<button class="move-btn storage" data-action="move" data-target="storage" title="移至闲置收纳">${icons.storage}</button>`);
    actions.push(`<button class="move-btn discard" data-action="move" data-target="discard" title="移至预淘汰区">${icons.discard}</button>`);
  } else if (fileType === 'storage') {
    actions.push(`<button class="move-btn inventory" data-action="move" data-target="inventory" title="移回在用衣柜">${icons.inventory}</button>`);
    actions.push(`<button class="move-btn discard" data-action="move" data-target="discard" title="移至预淘汰区">${icons.discard}</button>`);
  } else if (fileType === 'discard') {
    actions.push(`<button class="move-btn inventory" data-action="move" data-target="inventory" title="恢复到在用衣柜">${icons.restore}</button>`);
    actions.push(`<button class="move-btn delete" data-action="delete" title="彻底删除记录">${icons.delete}</button>`);
  } else if (fileType === 'purchases' || fileType === 'all') {
    actions.push(`<button class="move-btn inventory" data-action="move" data-target="inventory" title="设为在用">${icons.inventory}</button>`);
    actions.push(`<button class="move-btn storage" data-action="move" data-target="storage" title="设为收纳">${icons.storage}</button>`);
    actions.push(`<button class="move-btn discard" data-action="move" data-target="discard" title="设为预淘汰">${icons.discard}</button>`);
  }
  
  actions.push(`<button class="edit-btn" data-action="edit" title="编辑属性">${icons.edit}</button>`);
  
  return `<div class="row-actions horizontal-actions">${actions.join('')}</div>`;
}

export function setupTableEvents(container, fileType, rows, title, filterFn, showActions) {
  const selectAll = $('[data-select-all]', container);
  const batchActions = $('[data-batch-actions]', container);
  const selectedCount = $('[data-selected-count]', container);
  
  // Setup sorting header clicks
  $$('.sortable-header', container).forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sortKey;
      if (currentSort.key === key) {
        currentSort.asc = !currentSort.asc;
      } else {
        currentSort.key = key;
        currentSort.asc = true;
      }
      // Re-trigger render
      renderCsvTable(container, title, fileType, rows, filterFn, showActions);
    });
  });
  
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      const checked = e.target.checked;
      $$('[data-row-select]', container).forEach(cb => cb.checked = checked);
      updateBatchActions();
    });
  }
  
  $$('[data-row-select]', container).forEach(cb => {
    cb.addEventListener('change', updateBatchActions);
  });
  
  function updateBatchActions() {
    const selected = $$('[data-row-select]:checked', container).length;
    if (selectedCount) selectedCount.textContent = selected;
    if (batchActions) batchActions.classList.toggle('active', selected > 0);
  }
  
  // Handle row actions (Edit, Move, Delete)
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    
    const action = btn.dataset.action;
    const rowId = btn.closest('tr').dataset.rowId;
    // Look up by id to avoid issues with sorting/filtering
    const rowData = rows.find(r => String(r.id) === String(rowId));
    
    console.log(`Action: ${action} on row ID ${rowId}`, rowData);
    
    if (action === 'edit') {
      const { showModal } = await import('./modal.js');

      let editData = rowData;
      // If the row comes from the finance mapped view, translate it back to the English schema
      if (fileType === 'purchases') {
         editData = {
           id: rowData.id,
           image: rowData['图片'] || '',
           name: rowData['名称'] || '',
           brand: rowData['品牌'] || '',
           category: rowData['分类'] || '',
           buy_date: rowData['购买日期'] || '',
           source: rowData['购买途径'] || '',
           price: rowData['价格'] || '',
           url: rowData['购买链接'] || '',
           season: rowData['季节'] || '',
           remarks: rowData['备注'] || '',
           location: (rowData['当前下落'] === '在用衣橱' ? 'inventory' : (rowData['当前下落'] === '闲置收纳' ? 'storage' : (rowData['当前下落'] === '预淘汰区' ? 'discard' : 'inventory')))
         };
      }
      
      showModal('编辑物品属性', editData, async (updatedData) => {
        try {
          const res = await fetch(`/api/items/${rowData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
          });
          if (res.ok) {
            alert('编辑成功！');
            window.dispatchEvent(new Event('data-refreshed'));
          } else {
            alert('编辑失败，请重试');
          }
        } catch(e) {
          alert('保存失败：' + e.message);
        }
      });
    } else if (action === 'move') {
      const target = btn.dataset.target;
      const targetLabel = target === 'inventory' ? '在用衣柜' : (target === 'storage' ? '闲置收纳' : '预淘汰区');

      // 如果是移到收纳区，先弹出选择收纳位置的弹窗
      let storageLocation = '';
      if (target === 'storage') {
        const locations = getStorageLocations();
        const locationOptions = locations.map((loc, idx) => `${idx + 1}. ${loc}`).join('\n');
        const selected = prompt(`选择收纳位置：\n${locationOptions}\n\n输入序号（1-${locations.length}）或直接输入位置名称：`);

        if (selected === null) return; // 用户取消

        // 输入验证
        if (!selected.trim()) {
          showToast('请输入有效的收纳位置', { type: 'error' });
          return;
        }

        // 尝试解析序号
        const idx = parseInt(selected) - 1;
        if (idx >= 0 && idx < locations.length) {
          storageLocation = locations[idx];
        } else {
          // 直接使用输入的内容
          storageLocation = selected.trim();
        }
      }

      // 执行移动
      try {
        const updateData = { location: target };
        if (storageLocation) {
          updateData.storage_location = storageLocation;
        }

        const res = await fetch(`/api/items/${rowData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });

        if (res.ok) {
          // 显示 Toast 通知，支持撤销
          const message = storageLocation
            ? `已移动到 ${targetLabel} - ${storageLocation}`
            : `已移动到 ${targetLabel}`;

          showToast(message, {
            type: 'success',
            undoable: true,
            undoText: '撤销',
            duration: 5000,
            onUndo: async () => {
              // 撤销移动，恢复原位置
              try {
                const undoData = { location: rowData.location };
                if (rowData.storage_location) {
                  undoData.storage_location = rowData.storage_location;
                }
                await fetch(`/api/items/${rowData.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(undoData)
                });
                window.dispatchEvent(new Event('data-refreshed'));
              } catch(e) {
                console.error('撤销失败:', e);
              }
            }
          });
          window.dispatchEvent(new Event('data-refreshed'));
        } else {
          showToast('移动失败，请重试', { type: 'error' });
        }
      } catch(e) {
        showToast('操作失败：' + e.message, { type: 'error' });
      }
    } else if (action === 'delete') {
      // 先执行删除
      const endpoint = `/api/items/${rowData.id}`;
      try {
        const res = await fetch(endpoint, { method: 'DELETE' });
        if (res.ok) {
          // 显示 Toast 通知，支持撤销（这里只是视觉反馈，实际撤销需要后端支持恢复）
          showToast('已删除', {
            type: 'success',
            duration: 3000
          });
          window.dispatchEvent(new Event('data-refreshed'));
        } else {
          showToast('删除失败，请重试', { type: 'error' });
        }
      } catch(e) {
        showToast('删除失败：' + e.message, { type: 'error' });
      }
    }
  });

  // Handle batch actions (Move, Delete)
  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-batch-action]');
    if (!btn) return;

    const action = btn.dataset.batchAction;
    const selectedRows = $$('[data-row-select]:checked', container).map(cb => {
      const rowId = cb.closest('tr').dataset.rowId;
      return rows.find(r => String(r.id) === String(rowId));
    }).filter(row => row);

    if (selectedRows.length === 0) {
      alert('请先选择要操作的项');
      return;
    }

    if (action === 'delete') {
      // 批量删除
      let successCount = 0;
      let failCount = 0;
      for (const row of selectedRows) {
        try {
          const endpoint = `/api/items/${row.id}`;
          const res = await fetch(endpoint, { method: 'DELETE' });
          if (res.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch(e) {
          failCount++;
        }
      }

      if (failCount === 0) {
        showToast(`已删除 ${successCount} 项`, { type: 'success', duration: 3000 });
        window.dispatchEvent(new Event('data-refreshed'));
      } else {
        showToast(`删除完成：成功 ${successCount} 项，失败 ${failCount} 项`, { type: 'warning', duration: 5000 });
        window.dispatchEvent(new Event('data-refreshed'));
      }
    } else if (action === 'move') {
      const targets = ['inventory', 'storage', 'discard'];
      const targetLabels = { inventory: '在用衣柜', storage: '闲置收纳', discard: '预淘汰区' };
      const target = prompt(`选择目标位置：\n${targets.map(t => `${t} - ${targetLabels[t]}`).join('\n')}`);

      if (target && targets.includes(target)) {
        // 保存原始位置用于撤销
        const originalLocations = new Map(selectedRows.map(r => [r.id, r.location]));
        let successCount = 0;
        let failCount = 0;

        for (const row of selectedRows) {
          try {
            const res = await fetch(`/api/items/${row.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ location: target })
            });
            if (res.ok) {
              successCount++;
            } else {
              failCount++;
            }
          } catch(e) {
            failCount++;
          }
        }

        if (failCount === 0) {
          showToast(`已移动 ${successCount} 项到 ${targetLabels[target]}`, {
            type: 'success',
            undoable: true,
            undoText: '撤销',
            duration: 5000,
            onUndo: async () => {
              // 批量撤销
              for (const row of selectedRows) {
                const originalLoc = originalLocations.get(row.id);
                if (originalLoc) {
                  try {
                    await fetch(`/api/items/${row.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ location: originalLoc })
                    });
                  } catch(e) {
                    console.error('撤销失败:', e);
                  }
                }
              }
              window.dispatchEvent(new Event('data-refreshed'));
            }
          });
          window.dispatchEvent(new Event('data-refreshed'));
        } else {
          showToast(`移动完成：成功 ${successCount} 项，失败 ${failCount} 项`, { type: 'warning', duration: 5000 });
          window.dispatchEvent(new Event('data-refreshed'));
        }
      }
    }
  });

  const searchInput = $('[data-table-search]', container);
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      $$('tbody tr', container).forEach(tr => {
        const text = tr.textContent.toLowerCase();
        tr.style.display = text.includes(query) ? '' : 'none';
      });
    });
  }

  // Column Selector Toggle
  const colTrigger = $('#col-settings-trigger', container);
  const colMenu = $('#col-selector-menu', container);
  if (colTrigger && colMenu) {
    colTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      colMenu.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
      if (!colMenu.contains(e.target) && e.target !== colTrigger) {
        colMenu.classList.remove('active');
      }
    });

    $$('[data-col-toggle]', colMenu).forEach(cb => {
      cb.addEventListener('change', (e) => {
        const col = e.target.dataset.colToggle;
        columnPrefs[col] = e.target.checked;
        savePrefs();
        // Re-render table instantly
        renderCsvTable(container, title, fileType, rows, filterFn, showActions);
      });
    });
  }
}
