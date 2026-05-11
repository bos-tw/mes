# JavaScript 模組撰寫風格指南

此 Skill 定義 MES 系統前端 JavaScript 模組的標準撰寫風格，開發新模組時必須遵循。

---

## 1. 模組基本結構

使用 IIFE（立即執行函式表達式）封裝模組：

```javascript
/**
 * {ModuleName} Module
 * 模組中文名稱
 */
(function() {
    'use strict';

    function initialize{ModuleName}Module(container) {
        const moduleRoot = container.querySelector('[data-module="{module_name}"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        // ===== DOM 元素快取 =====
        // ===== 狀態管理 =====
        // ===== 輔助函式 =====
        // ===== 事件處理 =====
        // ===== 初始化 =====
    }

    window.initialize{ModuleName}Module = initialize{ModuleName}Module;
})();
```

---

## 2. DOM 元素快取

### 2.1 命名規則

使用 `data-{module-name}-{element}` 格式選取元素：

```javascript
// 主要元素
const alertBox = moduleRoot.querySelector('[data-{module-name}-alert]');
const filterForm = moduleRoot.querySelector('[data-{module-name}-filter]');
const tableElement = moduleRoot.querySelector('[data-{module-name}-table]');
const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
const paginationContainer = moduleRoot.querySelector('[data-{module-name}-pagination]');

// Modal 相關
const modalOverlay = moduleRoot.querySelector('[data-{module-name}-modal]');
const modalAlertBox = modalOverlay ? modalOverlay.querySelector('[data-{module-name}-modal-alert]') : null;
const modalForm = modalOverlay ? modalOverlay.querySelector('[data-{module-name}-form]') : null;
const modalTitle = modalOverlay ? modalOverlay.querySelector('[data-modal-title]') : null;
const modalCloseButton = modalOverlay ? modalOverlay.querySelector('[data-action="close-modal"]') : null;
const cancelButton = modalOverlay ? modalOverlay.querySelector('[data-action="cancel"]') : null;

// Header 按鈕
const headerCreateButton = container.querySelector('.content-header [data-action="create"]');
const resetFilterButton = moduleRoot.querySelector('[data-action="reset-filter"]');

// 表單欄位
const nameInput = modalForm ? modalForm.querySelector('input[name="name"]') : null;
const emailInput = modalForm ? modalForm.querySelector('input[name="email"]') : null;
```

### 2.2 防禦性檢查

所有 DOM 操作前必須檢查元素是否存在：

```javascript
if (tableBody) {
    tableBody.innerHTML = html;
}

if (modalOverlay) {
    modalOverlay.classList.remove('hidden');
}
```

---

## 3. 狀態管理

```javascript
// 使用快取 Map
const itemsCache = new Map();

// 狀態物件
const state = {
    page: 1,
    perPage: 10,
    totalPages: 1,
    total: 0,
    currentEditingId: null,
    formInitialSnapshot: null,
    sortField: null,
    sortDirection: 'asc', // 'asc' or 'desc'
};

// 髒標記
let isFormDirty = false;
```

---

## 4. Alert 顯示函式

### 4.1 頁面級 Alert

```javascript
function showAlert(type, message) {
    if (!alertBox) return;
    alertBox.textContent = message;
    alertBox.classList.remove('hidden', 'success', 'error', 'warning', 'info');
    alertBox.classList.add(type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'error');
}

function hideAlert() {
    if (!alertBox) return;
    alertBox.classList.add('hidden');
    alertBox.textContent = '';
    alertBox.classList.remove('success', 'error', 'warning', 'info');
}
```

### 4.2 Modal 內 Alert

```javascript
function showModalAlert(type, message, autoHide = true) {
    if (!modalAlertBox) { 
        showAlert(type, message); 
        return; 
    }
    modalAlertBox.textContent = message;
    modalAlertBox.classList.remove('hidden', 'success', 'error', 'warning', 'info');
    modalAlertBox.classList.add(type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'error');
    
    if (autoHide && type === 'success') {
        setTimeout(() => hideModalAlert(), 3000);
    }
    
    // 滾動到頂部顯示訊息
    const modalWindow = modalOverlay?.querySelector('.modal-window');
    if (modalWindow) modalWindow.scrollTop = 0;
}

function hideModalAlert() {
    if (!modalAlertBox) return;
    modalAlertBox.classList.add('hidden');
    modalAlertBox.textContent = '';
    modalAlertBox.classList.remove('success', 'error', 'warning', 'info');
}
```

---

## 5. API 呼叫模式

### 5.1 GET 請求（列表查詢）

```javascript
async function loadItems(page = 1) {
    hideAlert();
    renderLoadingRow();

    const formData = new FormData(filterForm);
    const params = new URLSearchParams();
    
    const keyword = (formData.get('keyword') || '').toString().trim();
    const perPageValue = parseInt((formData.get('perPage') || '10').toString(), 10);

    state.page = Math.max(1, page);
    state.perPage = Number.isFinite(perPageValue) && perPageValue > 0 ? perPageValue : 10;

    params.set('page', String(state.page));
    params.set('perPage', String(state.perPage));
    if (keyword !== '') {
        params.set('keyword', keyword);
    }

    try {
        const response = await fetch(`api/{module}/index.php?${params.toString()}`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`載入失敗（${response.status}）`);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || '載入失敗，請稍後再試。');
        }

        const items = Array.isArray(result.data) ? result.data : [];
        itemsCache.clear();

        renderTableRows(items);

        if (result.pagination) {
            state.page = result.pagination.page || state.page;
            state.perPage = result.pagination.perPage || state.perPage;
            state.totalPages = result.pagination.totalPages || 1;
            state.total = result.pagination.total || items.length;
        }

        renderPagination();
    } catch (error) {
        console.error(error);
        showAlert('error', error.message || '載入失敗，請稍後再試。');
        renderTableRows([]);
    }
}
```

### 5.2 POST 請求（新增）

```javascript
async function handleSubmit(event) {
    event.preventDefault();
    hideModalAlert();

    const formData = new FormData(modalForm);
    const payload = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('api/{module}/index.php', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!result.success) {
            if (result.errors) {
                const errorMessages = Object.values(result.errors).join('、');
                throw new Error(errorMessages);
            }
            throw new Error(result.message || '儲存失敗。');
        }

        showAlert('success', result.message || '儲存成功。');
        closeModal(true);
        loadItems(state.page);

        // 通知其他分頁
        DataSync.notifyWithDependencies('{module}', DataSync.EVENT_TYPES.CREATED, result.data);
    } catch (error) {
        console.error(error);
        showModalAlert('error', error.message || '儲存失敗，請稍後再試。');
    }
}
```

### 5.3 PUT 請求（更新）

```javascript
async function handleUpdate(id, payload) {
    try {
        const response = await fetch(`api/{module}/update.php?id=${id}`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || '更新失敗。');
        }

        showAlert('success', result.message || '更新成功。');
        closeModal(true);
        loadItems(state.page);

        DataSync.notifyWithDependencies('{module}', DataSync.EVENT_TYPES.UPDATED, result.data);
    } catch (error) {
        console.error(error);
        showModalAlert('error', error.message || '更新失敗，請稍後再試。');
    }
}
```

### 5.4 DELETE 請求（刪除）

```javascript
async function handleDelete(id) {
    if (!confirm('確定要刪除這筆資料嗎？')) {
        return;
    }

    try {
        const response = await fetch(`api/{module}/delete.php?id=${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Accept': 'application/json' },
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || '刪除失敗。');
        }

        showAlert('success', result.message || '刪除成功。');
        loadItems(state.page);

        DataSync.notifyWithDependencies('{module}', DataSync.EVENT_TYPES.DELETED, { id });
    } catch (error) {
        console.error(error);
        showAlert('error', error.message || '刪除失敗，請稍後再試。');
    }
}
```

---

## 6. 表格渲染

### 6.1 資料列渲染

```javascript
function renderTableRows(rows) {
    if (!tableBody) return;

    if (!rows || rows.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">尚無符合條件的資料。</td></tr>';
        return;
    }

    const html = rows.map((item) => {
        itemsCache.set(item.id, item);

        return `
            <tr data-id="${item.id}">
                <td>${item.id}</td>
                <td>${escapeHtml(item.name) || '-'}</td>
                <td>${escapeHtml(item.email) || '-'}</td>
                <td>
                    <button type="button" class="link" data-action="edit" title="編輯">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="link danger" data-action="delete" title="刪除">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = html;

    // 欄位管理器：重新套用欄位可見性
    const manager = window.{moduleName}ColumnManager;
    if (manager) manager.onTableUpdated();
}
```

### 6.2 載入中狀態

```javascript
function renderLoadingRow() {
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">資料載入中...</td></tr>';
    }
}
```

### 6.3 分頁渲染

```javascript
function renderPagination() {
    if (!paginationContainer) return;

    if (state.totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    const prevDisabled = state.page <= 1 ? 'disabled' : '';
    const nextDisabled = state.page >= state.totalPages ? 'disabled' : '';

    paginationContainer.innerHTML = `
        <button type="button" data-page="${state.page - 1}" ${prevDisabled}>上一頁</button>
        <span>第 ${state.page} / ${state.totalPages} 頁，共 ${state.total} 筆資料</span>
        <button type="button" data-page="${state.page + 1}" ${nextDisabled}>下一頁</button>
    `;
}
```

---

## 7. Modal 處理

### 7.1 開啟 Modal

```javascript
async function openModal(mode, item = null) {
    if (!modalOverlay || !modalForm) return;

    modalForm.reset();
    hideModalAlert();
    state.currentEditingId = mode === 'edit' && item ? item.id : null;

    if (modalTitle) {
        modalTitle.textContent = mode === 'edit' ? '編輯資料' : '新增資料';
    }

    if (item) {
        if (nameInput) nameInput.value = item.name || '';
        if (emailInput) emailInput.value = item.email || '';
    }

    modalOverlay.classList.remove('hidden');
    setFormInitialSnapshot();
    
    if (nameInput) nameInput.focus();
}
```

### 7.2 關閉 Modal

```javascript
function closeModal(force = false) {
    if (!modalOverlay || modalOverlay.classList.contains('hidden')) return;

    if (!force && isFormDirty && hasUnsavedChanges()) {
        const confirmed = window.confirm('表單資料尚未儲存，確定要關閉嗎？');
        if (!confirmed) return;
    }

    if (modalForm) modalForm.reset();
    modalOverlay.classList.add('hidden');
    hideModalAlert();
    state.currentEditingId = null;
    state.formInitialSnapshot = null;
    isFormDirty = false;
}
```

---

## 8. 表單髒檢查（Dirty Check）

```javascript
function getFormSnapshot() {
    if (!modalForm) return {};
    return {
        name: nameInput ? nameInput.value.trim() : '',
        email: emailInput ? emailInput.value.trim() : '',
    };
}

function setFormInitialSnapshot() {
    state.formInitialSnapshot = getFormSnapshot();
    isFormDirty = false;
}

function hasUnsavedChanges() {
    if (!modalForm || !state.formInitialSnapshot) return false;
    const current = getFormSnapshot();
    return Object.keys(state.formInitialSnapshot).some(
        (key) => state.formInitialSnapshot[key] !== current[key]
    );
}

function updateDirtyState() {
    isFormDirty = hasUnsavedChanges();
}
```

---

## 9. 事件綁定模式

### 9.1 表格委派事件

```javascript
if (tableBody) {
    tableBody.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const row = button.closest('tr');
        const id = row ? parseInt(row.dataset.id, 10) : null;

        if (!id) return;

        switch (action) {
            case 'edit':
                const item = itemsCache.get(id);
                if (item) openModal('edit', item);
                break;
            case 'delete':
                handleDelete(id);
                break;
        }
    });
}
```

### 9.2 分頁事件

```javascript
if (paginationContainer) {
    paginationContainer.addEventListener('click', (event) => {
        const button = event.target.closest('[data-page]');
        if (button && !button.disabled) {
            loadItems(parseInt(button.dataset.page, 10));
        }
    });
}
```

### 9.3 Modal 關閉事件

```javascript
if (modalOverlay) {
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            closeModal();
        }
    });
}

if (modalCloseButton) {
    modalCloseButton.addEventListener('click', () => closeModal());
}

if (cancelButton) {
    cancelButton.addEventListener('click', () => closeModal());
}
```

---

## 10. DataSync 整合

```javascript
// 訂閱其他模組的變更
DataSync.subscribe('related_module', (event) => {
    if (event.action === DataSync.EVENT_TYPES.UPDATED ||
        event.action === DataSync.EVENT_TYPES.DELETED) {
        loadItems(state.page);
    }
});

// 發送變更通知
DataSync.notifyWithDependencies('{module}', DataSync.EVENT_TYPES.CREATED, data);
DataSync.notifyWithDependencies('{module}', DataSync.EVENT_TYPES.UPDATED, data);
DataSync.notifyWithDependencies('{module}', DataSync.EVENT_TYPES.DELETED, { id });
```

---

## 11. 輔助函式

### 11.1 HTML 跳脫

```javascript
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
```

### 11.2 日期格式化

```javascript
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW');
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-TW');
}
```

---

## 12. 初始化

```javascript
// 載入初始資料
loadItems(1);

// 訂閱跨分頁同步
DataSync.subscribe('{module}', (event) => {
    if (event.sourceTabId !== DataSync.currentTabId) {
        loadItems(state.page);
    }
});
```
