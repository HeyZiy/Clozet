// Toast 通知系统，支持撤销操作
let toastContainer = null;
let activeToasts = new Map();

function getContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, options = {}) {
  const {
    duration = 5000,
    undoable = false,
    onUndo,
    undoText = '撤销',
    type = 'info'
  } = options;

  const container = getContainer();
  const toastId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  const toast = document.createElement('div');
  toast.id = `toast-${toastId}`;
  toast.style.cssText = `
    background: var(--panel, #1a1d26);
    border: 1px solid var(--border, rgba(255,255,255,0.1));
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    pointer-events: auto;
    animation: slideUp 0.3s ease;
    min-width: 280px;
    max-width: 400px;
  `;

  // 类型颜色
  const typeColors = {
    info: 'var(--brand, #6366f1)',
    success: 'var(--success, #10b981)',
    warning: 'var(--warning, #f59e0b)',
    error: 'var(--danger, #ef4444)'
  };

  toast.innerHTML = `
    <div style="width: 4px; height: 40px; background: ${typeColors[type] || typeColors.info}; border-radius: 2px; flex-shrink: 0;"></div>
    <div style="flex: 1;">
      <div style="color: var(--text, #fff); font-size: 14px; font-weight: 500;">${message}</div>
    </div>
    ${undoable ? `
      <button class="toast-undo" style="
        background: transparent;
        border: 1px solid var(--brand, #6366f1);
        color: var(--brand, #6366f1);
        padding: 6px 14px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s;
      ">${undoText}</button>
    ` : ''}
    <button class="toast-close" style="
      background: none;
      border: none;
      color: var(--muted, #94a3b8);
      cursor: pointer;
      font-size: 18px;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    ">×</button>
  `;

  container.appendChild(toast);

  // 存储定时器
  let timeoutId = null;
  let isUndone = false;

  const removeToast = () => {
    if (isUndone) return; // 如果已撤销，不执行移除动画
    toast.style.animation = 'slideDown 0.3s ease forwards';
    setTimeout(() => {
      toast.remove();
      activeToasts.delete(toastId);
    }, 300);
  };

  // 撤销按钮
  if (undoable) {
    const undoBtn = toast.querySelector('.toast-undo');
    undoBtn?.addEventListener('click', () => {
      isUndone = true;
      clearTimeout(timeoutId);
      if (onUndo) onUndo();
      toast.style.animation = 'slideDown 0.2s ease forwards';
      setTimeout(() => toast.remove(), 200);
      activeToasts.delete(toastId);
    });
  }

  // 关闭按钮
  toast.querySelector('.toast-close')?.addEventListener('click', () => {
    clearTimeout(timeoutId);
    removeToast();
  });

  // 自动关闭
  if (duration > 0) {
    timeoutId = setTimeout(removeToast, duration);
  }

  activeToasts.set(toastId, { toast, timeoutId });

  return {
    id: toastId,
    dismiss: () => {
      clearTimeout(timeoutId);
      removeToast();
    }
  };
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes slideDown {
    from { transform: translateY(0); opacity: 1; }
    to { transform: translateY(20px); opacity: 0; }
  }
  .toast-undo:hover {
    background: var(--brand, #6366f1) !important;
    color: white !important;
  }
  .toast-close:hover {
    background: rgba(255,255,255,0.1);
    color: var(--text, #fff);
  }
`;
document.head.appendChild(style);

// 清除所有 Toast
export function clearAllToasts() {
  activeToasts.forEach(({ toast, timeoutId }) => {
    clearTimeout(timeoutId);
    toast.remove();
  });
  activeToasts.clear();
}
