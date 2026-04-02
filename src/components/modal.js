import { $, $$, escapeHtml, getCategories, getStorageLocations } from '../utils.js';
import { OPTIONS_SEASONS, OPTIONS_BRANDS, OPTIONS_SOURCES } from '../config.js';

let currentEditData = null;
let onSaveCallback = null;

export function showModal(title, data, onSave) {
  currentEditData = data;
  onSaveCallback = onSave;
  
  const modal = $('#modal-overlay');
  const modalTitle = $('#modal-title');
  const modalBody = $('#modal-body');
  const form = $('#edit-form');
  
  modalTitle.textContent = title;
  form.innerHTML = generateFormFields(data);
  
  modal.hidden = false;
  
  setupModalEvents();
}

export function hideModal() {
  const modal = $('#modal-overlay');
  modal.hidden = true;
  currentEditData = null;
  onSaveCallback = null;
}

// 生成可输入下拉框（Combobox）
function generateCombobox(key, value, options, placeholder) {
  const datalistId = `datalist-${key}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  return `
    <div class="form-group">
      <label>${escapeHtml(key)}</label>
      <input type="text" name="${escapeHtml(key)}" value="${escapeHtml(value)}" placeholder="${placeholder}" list="${datalistId}" class="combobox-input" autocomplete="off">
      <datalist id="${datalistId}">
        ${options.map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}
      </datalist>
    </div>
  `;
}

function generateFormFields(data) {
  return Object.entries(data).map(([key, value]) => {
    const keyLower = key.toLowerCase();
    
    if (keyLower === 'id' || keyLower === '_id') {
      return `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}">`;
    }
    
    if (keyLower.includes('图片') || keyLower.includes('image')) {
      return `
        <div class="form-group">
          <label>${escapeHtml(key)}</label>
          <div class="img-preview">
            ${value ? `<img src="${escapeHtml(value)}" onerror="this.parentElement.innerHTML='<span class=\\'placeholder\\'>无图片</span>'">` : '<span class="placeholder">无图片</span>'}
          </div>
          <input type="text" name="${escapeHtml(key)}" value="${escapeHtml(value)}" placeholder="图片URL">
        </div>
      `;
    }
    
    // Location field - hidden from user, managed automatically by system
    if (keyLower === 'location') {
      return `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}">`;
    }

    if (keyLower.includes('季节') || keyLower.includes('适用季节')) {
      return `
        <div class="form-group">
          <label>${escapeHtml(key)}</label>
          <select name="${escapeHtml(key)}">
            ${OPTIONS_SEASONS.map(s => `<option value="${s}" ${s === value ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      `;
    }
    
    // 日期字段 - 支持中文"日期"和英文"date"
    if (keyLower.includes('日期') || keyLower.includes('date')) {
      return `
        <div class="form-group">
          <label>${escapeHtml(key)}</label>
          <input type="date" name="${escapeHtml(key)}" value="${escapeHtml(value)}">
        </div>
      `;
    }
    
    if (keyLower.includes('价格') || keyLower.includes('金额')) {
      return `
        <div class="form-group">
          <label>${escapeHtml(key)}</label>
          <input type="number" step="0.01" name="${escapeHtml(key)}" value="${escapeHtml(value)}" placeholder="0.00">
        </div>
      `;
    }
    
    if (keyLower.includes('备注') || keyLower.includes('说明')) {
      return `
        <div class="form-group">
          <label>${escapeHtml(key)}</label>
          <textarea name="${escapeHtml(key)}" rows="3" style="width:100%;resize:vertical;border:1px solid var(--border);background:var(--bg);color:var(--text);padding:8px;border-radius:6px">${escapeHtml(value)}</textarea>
        </div>
      `;
    }

    // 分类 - 下拉选择（使用用户自定义列表）
    if (keyLower === 'category' || keyLower === '分类') {
      const categories = getCategories();
      return `
        <div class="form-group">
          <label>${escapeHtml(key)}</label>
          <select name="${escapeHtml(key)}">
            <option value="">请选择分类</option>
            ${categories.map(c => `<option value="${c}" ${c === value ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
      `;
    }

    // 品牌 - 可输入下拉框 (支持中文和英文字段名)
    if (keyLower === 'brand' || keyLower === '品牌' || keyLower.includes('品牌')) {
      return generateCombobox(key, value, OPTIONS_BRANDS, '例如：优衣库');
    }

    // 购买途径/来源 - 可输入下拉框 (支持中文和英文字段名)
    if (keyLower === 'source' || keyLower === '来源' || keyLower === '购买途径' || keyLower.includes('来源') || keyLower.includes('途径')) {
      return generateCombobox(key, value, OPTIONS_SOURCES, '例如：淘宝');
    }

    // 收纳位置 - 可输入下拉框（使用用户自定义列表）
    if (keyLower === 'storage_location' || keyLower === '收纳位置') {
      const storageOptions = getStorageLocations();
      return generateCombobox(key, value, storageOptions, '例如：衣柜上层');
    }

    return `
      <div class="form-group">
        <label>${escapeHtml(key)}</label>
        <input type="text" name="${escapeHtml(key)}" value="${escapeHtml(value)}">
      </div>
    `;
  }).join('');
}

function setupModalEvents() {
  const modal = $('#modal-overlay');
  const closeBtn = $('#modal-close');
  const cancelBtn = $('#modal-cancel');
  const saveBtn = $('#modal-save');
  
  const handleClose = () => hideModal();
  
  closeBtn?.addEventListener('click', handleClose);
  cancelBtn?.addEventListener('click', handleClose);
  
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) handleClose();
  });
  
  saveBtn?.addEventListener('click', handleSave);
}

function handleSave() {
  if (!onSaveCallback || !currentEditData) return;
  
  const form = $('#edit-form');
  const formData = new FormData(form);
  const updatedData = { ...currentEditData };
  
  for (const [key, value] of formData.entries()) {
    updatedData[key] = value;
  }
  
  onSaveCallback(updatedData);
  hideModal();
}
