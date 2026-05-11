---
applyTo: "js/**/*.js"
---

# JavaScript 模組撰寫風格指南

> 完整規範：`.github/skills/javascript-module-style.md`

## 模組初始化架構（必須遵循）

```javascript
(function () {
    'use strict';

    function initializeXxxModule(container) {
        const moduleRoot = container.querySelector('[data-module="xxx"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') return;
        moduleRoot.dataset.initialised = 'true';

        // ─── 元素綁定 ───────────────────────────────
        const table      = moduleRoot.querySelector('[data-xxx-table]');
        const filterForm = moduleRoot.querySelector('[data-xxx-filter]');
        const modal      = moduleRoot.querySelector('[data-xxx-modal]');
        const form       = moduleRoot.querySelector('[data-xxx-form]');
        const alertEl    = moduleRoot.querySelector('[data-xxx-alert]');

        // ─── 狀態 ────────────────────────────────────
        let currentPage = 1;
        let currentSort = { field: 'id', dir: 'desc' };

        // ─── 初始化 ──────────────────────────────────
        loadData();
        bindEvents();
    }

    window.initializeXxxModule = initializeXxxModule;
})();
```

## 防禦性函數（有 Modal 表單時必加）

```javascript
function setFieldValue(name, value) {
    const field = form.querySelector(`[name="${name}"]`);
    if (field) {
        field.value = value ?? '';
    } else {
        console.warn(`[xxx] 欄位不存在: ${name}`);
    }
}
```

## API 呼叫標準範本

```javascript
async function loadData() {
    try {
        const params = new URLSearchParams({ page: currentPage, ...filters });
        const res = await fetch(`../api/xxx/index.php?${params}`, {
            credentials: 'include'
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        renderTable(data.data);
        renderPagination(data.total, data.page, data.totalPages);
    } catch (e) {
        showAlert(e.message, 'error');
    }
}

async function saveData(payload) {
    const isEdit = !!payload.id;
    const url    = isEdit ? '../api/xxx/update.php' : '../api/xxx/store.php';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': sessionStorage.getItem('csrfToken') || ''
        },
        body: JSON.stringify(payload)
    });
    return res.json();
}
```

## 事件委派（統一使用 data-action）

```javascript
function bindEvents() {
    moduleRoot.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (!action) return;

        const handlers = {
            'create': openCreateModal,
            'edit':   (el) => openEditModal(el.closest('tr').dataset.id),
            'delete': (el) => confirmDelete(el.closest('tr').dataset.id),
            'cancel': closeModal,
        };

        handlers[action]?.(e.target.closest('[data-action]'));
    });
}
```

## 欄位管理器

```javascript
// ❌ 不要手動初始化
// window.initXxxColumnManager();

// ✅ 只在表格資料更新後呼叫
const manager = ColumnManagerAutoInit.getManager('xxx');
if (manager) manager.onTableUpdated();
```

## 禁止事項

- ❌ JS 檔案超過 2000 行 — 拆分為多個模組
- ❌ `document.querySelector` — 改用 `moduleRoot.querySelector` 限定範圍
- ❌ `form.querySelector('[name="id"]').value = x` — 沒有 null 檢查
- ❌ 全域變數污染（必須用 IIFE 包裹）
- ❌ `alert()` / `confirm()` — 使用自定義 Modal
