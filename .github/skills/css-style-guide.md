# CSS 樣式撰寫風格指南

此 Skill 定義 MES 系統 CSS 的標準撰寫風格，新增或修改樣式時必須遵循。

---

## 1. 設計系統概述

### 1.1 色彩系統

| 用途 | 顏色 | Hex 值 |
|------|------|--------|
| 主要色（綠色） | Primary | `#4CAF50` |
| 主要色懸停 | Primary Hover | `#43a047` |
| 主要色深 | Primary Dark | `#2f8a3b` |
| 危險色（紅色） | Danger | `#dc3545` |
| 警告色（橘色） | Warning | `#ff9800` |
| 資訊色（藍色） | Info | `#1976d2` |
| 成功色 | Success | `#388e3c` |
| 次要色（灰色） | Secondary | `#6c757d` |
| 背景色 | Background | `#f0f2f5` |
| 內容背景 | Content BG | `#f8f9fa` |
| 邊框色 | Border | `#dee2e6` |
| 文字主色 | Text Primary | `#333` |
| 文字次色 | Text Secondary | `#6c757d` |
| 側邊欄背景 | Sidebar BG | `#313a46` |

### 1.2 字體設定

```css
body {
    font-family: 'Segoe UI', 'Microsoft JhengHei', Arial, sans-serif;
    font-size: 15px;
    line-height: 1.6;
    color: #333;
}
```

### 1.3 圓角規範

| 元素類型 | 圓角值 |
|---------|--------|
| 按鈕 | `24px`（圓形按鈕）或 `4px`（方形按鈕） |
| 卡片/Modal | `0`（方角）或 `5px` |
| 輸入框 | `0` 或 `4px` |
| 徽章 | `6px` |
| 頭像/Logo | `50%`（圓形） |

---

## 2. 按鈕樣式

### 2.1 基本按鈕

```css
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: 24px;
    border: 1px solid transparent;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease, color 0.2s ease, 
                border-color 0.2s ease, box-shadow 0.2s ease;
    text-decoration: none;
}
```

### 2.2 按鈕變體

```css
/* 主要按鈕（綠色漸層） */
.btn.primary {
    background: linear-gradient(135deg, #4CAF50, #2f8a3b);
    color: #fff;
    box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
}

.btn.primary:hover {
    background: linear-gradient(135deg, #43a047, #2c7d36);
}

/* 邊框按鈕 */
.btn.outline {
    background-color: #fff;
    color: #2f8a3b;
    border-color: #2f8a3b;
}

.btn.outline:hover {
    background-color: rgba(47, 138, 59, 0.08);
}

/* 成功按鈕 */
.btn.success {
    background: linear-gradient(135deg, #4CAF50, #2f8a3b);
    color: #fff;
    border: none;
    box-shadow: 0 2px 6px rgba(76, 175, 80, 0.3);
}
```

### 2.3 連結按鈕（表格操作用）

```css
.link {
    background: none;
    border: none;
    cursor: pointer;
    color: #007bff;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s ease;
}

.link:hover {
    background-color: rgba(0, 123, 255, 0.1);
}

.link.danger {
    color: #dc3545;
}

.link.danger:hover {
    background-color: rgba(220, 53, 69, 0.1);
}

.link.success {
    color: #4CAF50;
}

.link.warning {
    color: #ff9800;
}
```

---

## 3. 表格樣式

```css
.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
}

.data-table thead {
    background-color: #f5f5f5;
}

.data-table th,
.data-table td {
    border: 1px solid #e0e0e0;
    padding: 6px 8px;
    text-align: left;
    font-size: 15px;
}

.data-table th {
    font-weight: bold;
    color: #555;
    white-space: nowrap;
}

/* 斑馬紋 */
.data-table tbody tr:nth-child(even) {
    background-color: #f9f9f9;
}

.data-table tbody tr:hover {
    background-color: #f0f0f0;
}

/* 可排序欄位 */
.data-table th[data-sort] {
    cursor: pointer;
    user-select: none;
}

.data-table th[data-sort]:hover {
    background-color: rgba(0, 123, 255, 0.1);
}

/* 排序指示器 */
.data-table th i {
    margin-left: 5px;
    opacity: 0.6;
}

.data-table th:hover i {
    opacity: 1;
}

.data-table th.sort-asc i:before {
    content: "\f145"; /* fa-sort-up */
}

.data-table th.sort-desc i:before {
    content: "\f144"; /* fa-sort-down */
}
```

---

## 4. 狀態徽章

### 4.1 基本徽章

```css
.status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.4;
    text-align: center;
    white-space: nowrap;
}
```

### 4.2 狀態變體

```css
/* 待處理 - 藍色 */
.status-badge.pending,
.status-badge.scheduled {
    background-color: #e3f2fd;
    color: #1976d2;
    border: 1px solid #bbdefb;
}

/* 進行中 - 綠色 */
.status-badge.in-progress {
    background-color: #e8f5e9;
    color: #388e3c;
    border: 1px solid #c8e6c9;
}

/* 已完成 - 灰色 */
.status-badge.completed {
    background-color: #f5f5f5;
    color: #616161;
    border: 1px solid #e0e0e0;
}

/* 暫停 - 橘色 */
.status-badge.paused {
    background-color: #fff3e0;
    color: #f57c00;
    border: 1px solid #ffe0b2;
}

/* 已取消 - 紅色 */
.status-badge.cancelled {
    background-color: #ffebee;
    color: #d32f2f;
    border: 1px solid #ffcdd2;
}

/* 通用狀態 */
.status-badge.success {
    background-color: #e8f5e9;
    color: #2e7d32;
    border: 1px solid #c8e6c9;
}

.status-badge.danger {
    background-color: #ffebee;
    color: #c62828;
    border: 1px solid #ffcdd2;
}

.status-badge.warning {
    background-color: #fff3e0;
    color: #e65100;
    border: 1px solid #ffe0b2;
}

.status-badge.secondary {
    background-color: #f5f5f5;
    color: #616161;
    border: 1px solid #e0e0e0;
}

/* 啟用/停用 */
.status-badge.active {
    background-color: #e8f5e9;
    color: #2e7d32;
    border: 1px solid #c8e6c9;
}

.status-badge.inactive {
    background-color: #fafafa;
    color: #9e9e9e;
    border: 1px solid #e0e0e0;
}
```

---

## 5. Modal 對話框

```css
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-window {
    background-color: #fff;
    width: min(1800px, 95%);
    max-height: 90vh;
    overflow-y: auto;
    padding: 24px;
    position: relative;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

/* 中大型 Modal */
.modal-window.large {
    width: min(1200px, 90%);
}

/* 小型 Modal */
.modal-window.medium {
    width: min(600px, 90%);
}

.modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: none;
    border: none;
    font-size: 20px;
    color: #6c757d;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.2s ease, color 0.2s ease;
}

.modal-close:hover {
    background-color: #f0f0f0;
    color: #333;
}

.modal-window h3 {
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e0e0e0;
    font-size: 18px;
    color: #333;
}
```

---

## 6. 表單樣式

### 6.1 表單網格

```css
.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
}

.form-section {
    margin-bottom: 24px;
}

.form-section h4 {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e0e0e0;
}
```

### 6.2 標籤與輸入框

```css
.inline-label {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.inline-label span {
    font-weight: 500;
    color: #555;
    font-size: 14px;
}

.inline-label input,
.inline-label select,
.inline-label textarea {
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.inline-label input:focus,
.inline-label select:focus,
.inline-label textarea:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

/* 全寬欄位 */
.inline-label.full-width {
    grid-column: 1 / -1;
}

/* 必填標記 */
.inline-label abbr[title="必填"] {
    color: #dc3545;
    text-decoration: none;
}
```

### 6.3 表單按鈕區

```css
.form-actions {
    display: flex;
    gap: 12px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #e0e0e0;
}

.form-actions.align-right {
    justify-content: flex-end;
}

.form-actions.align-center {
    justify-content: center;
}
```

---

## 7. Alert 訊息

```css
.module-alert,
.modal-alert {
    padding: 12px 16px;
    border-radius: 4px;
    margin-bottom: 16px;
    font-size: 14px;
}

.module-alert.success,
.modal-alert.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.module-alert.error,
.modal-alert.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.module-alert.warning,
.modal-alert.warning {
    background-color: #fff3cd;
    color: #856404;
    border: 1px solid #ffeeba;
}

.module-alert.info,
.modal-alert.info {
    background-color: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}
```

---

## 8. 工具類別

```css
/* 隱藏元素 */
.hidden {
    display: none !important;
}

/* 隱藏欄位（Column Manager 用） */
.hidden-column {
    display: none !important;
}

/* 文字對齊 */
.text-center {
    text-align: center;
}

.text-right {
    text-align: right;
}

/* 次要文字 */
.text-muted {
    color: #9e9e9e;
    font-size: 0.85em;
}

/* 表格內次要文字 */
.subtext {
    font-size: 0.8em;
    color: #999;
    margin-top: 2px;
}

/* 停用列樣式 */
.row-inactive {
    opacity: 0.7;
    background-color: #fafafa;
}

/* 連結文字 */
.link-text {
    color: #1976d2;
    text-decoration: none;
    cursor: pointer;
}

.link-text:hover {
    text-decoration: underline;
}
```

---

## 9. 分頁樣式

```css
.pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 16px;
    padding: 12px 0;
}

.pagination button {
    padding: 8px 16px;
    border: 1px solid #dee2e6;
    background-color: #fff;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease;
}

.pagination button:hover:not([disabled]) {
    background-color: #f0f0f0;
    border-color: #adb5bd;
}

.pagination button[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
}

.pagination span {
    color: #6c757d;
    font-size: 14px;
}
```

---

## 10. 側邊欄樣式

```css
.sidebar {
    width: 250px;
    background-color: #313a46;
    color: #e0e0e0;
    padding-top: 20px;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
    transition: width 0.3s ease;
}

.menu-link {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    color: #e0e0e0;
    text-decoration: none;
    transition: background-color 0.3s ease, color 0.3s ease;
    font-size: 16px;
}

.menu-link:hover {
    background-color: #3e4a59;
    color: #fff;
}

.menu-item.active > .menu-link {
    background-color: #2b333c;
    color: #4CAF50;
    border-left: 5px solid #4CAF50;
    padding-left: 15px;
}

.submenu li a {
    padding: 10px 20px 10px 55px;
    color: #a0a0a0;
}

.submenu li a:hover {
    background-color: #3e4a59;
    color: #fff;
}

.submenu li a.active-submenu-item {
    color: #4CAF50;
    font-weight: bold;
    background-color: #3e4a59;
}
```

---

## 11. 響應式設計

```css
/* 平板以下 */
@media (max-width: 768px) {
    .form-grid {
        grid-template-columns: 1fr;
    }

    .modal-window {
        width: 95%;
        padding: 16px;
    }

    .header-actions {
        flex-wrap: wrap;
    }

    .data-table {
        font-size: 13px;
    }

    .data-table th,
    .data-table td {
        padding: 4px 6px;
    }
}

/* 手機 */
@media (max-width: 480px) {
    .btn {
        padding: 6px 12px;
        font-size: 13px;
    }

    .content-header.with-actions {
        flex-direction: column;
        align-items: flex-start;
    }
}
```

---

## 12. 動畫與過渡

```css
/* 標準過渡時間 */
:root {
    --transition-fast: 0.15s ease;
    --transition-normal: 0.2s ease;
    --transition-slow: 0.3s ease;
}

/* 常用過渡 */
.transition-all {
    transition: all var(--transition-normal);
}

/* 按鈕點擊效果 */
button:active {
    transform: translateY(1px);
}

/* Focus 樣式 */
button:focus,
input:focus,
select:focus,
textarea:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.25);
}
```
