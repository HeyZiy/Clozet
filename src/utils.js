export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatPrice(price) {
  return parseFloat(String(price || '0').replace(/,/g, '') || 0);
}

export function formatDate(dateStr) {
  if (!dateStr) return null;
  let d;
  const chineseMatch = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日?/);
  if (chineseMatch) {
    d = new Date(parseInt(chineseMatch[1]), parseInt(chineseMatch[2]) - 1, parseInt(chineseMatch[3]));
  } else {
    d = new Date(dateStr);
  }
  return isNaN(d.getTime()) ? null : d;
}

export function getYearFromDate(dateStr) {
  const d = formatDate(dateStr);
  return d ? d.getFullYear() : null;
}

export function getMonthFromDate(dateStr) {
  const d = formatDate(dateStr);
  return d ? d.getMonth() : null;
}

export function getStoredYear() {
  return parseInt(localStorage.getItem('selectedYear'));
}

export function setStoredYear(year) {
  localStorage.setItem('selectedYear', year);
}

export function getBudgets() {
  return JSON.parse(localStorage.getItem('wardrobeBudgets') || '{}');
}

export function setBudgets(budgets) {
  localStorage.setItem('wardrobeBudgets', JSON.stringify(budgets));
}

// 品类配置管理
const CATEGORIES_KEY = 'wardrobeCategories';
const DEFAULT_CATEGORIES = ['短袖', '长袖', '外套', '裤子', '短裤', '羽绒服', '秋衣', '内衣', '袜子', '鞋子', '配饰', '特殊'];

export function getCategories() {
  const stored = localStorage.getItem(CATEGORIES_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
}

export function setCategories(categories) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function resetCategories() {
  localStorage.removeItem(CATEGORIES_KEY);
  return DEFAULT_CATEGORIES;
}

// 收纳位置配置管理
const STORAGE_LOCATIONS_KEY = 'wardrobeStorageLocations';
const DEFAULT_STORAGE_LOCATIONS = ['衣柜上层', '衣柜下层', '抽屉', '床底箱', '收纳箱A', '收纳箱B', '挂衣架', '玄关'];

export function getStorageLocations() {
  const stored = localStorage.getItem(STORAGE_LOCATIONS_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_STORAGE_LOCATIONS;
}

export function setStorageLocations(locations) {
  localStorage.setItem(STORAGE_LOCATIONS_KEY, JSON.stringify(locations));
}

export function resetStorageLocations() {
  localStorage.removeItem(STORAGE_LOCATIONS_KEY);
  return DEFAULT_STORAGE_LOCATIONS;
}
