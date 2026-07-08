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

### 1.4 UI Token 與密度規範（強制）

MES 是資料密集型後台系統，預設 UI 密度為 `compact`。所有新增或重構的表格、表單、Modal、統計側欄、區塊標題與卡片 spacing，必須優先使用 `:root` token 或既有共用 class，不得再用零散硬編碼形成第二套視覺規格。

#### 必備 token

`styles.css` 的 `:root` 必須維護以下語意 token；若需要新增同類規格，需先確認是否可沿用既有 token。

```css
:root {
    --ui-density: compact;

    --ui-section-padding-y: 8px;
    --ui-section-padding-x: 10px;
    --ui-section-gap: 8px;
    --ui-subsection-header-padding-y: 0;
    --ui-subsection-header-padding-bottom: 6px;

    --ui-control-height: 32px;
    --ui-control-padding-y: 4px;
    --ui-control-padding-x: 8px;
    --ui-inline-label-width: 112px;
    --ui-inline-label-padding-y: 4px;
    --ui-inline-label-padding-x: 8px;

    --ui-table-cell-padding-y: 4px;
    --ui-table-cell-padding-x: 6px;
    --ui-table-header-padding-y: 5px;
    --ui-table-header-padding-x: 6px;

    --ui-card-padding-y: 10px;
    --ui-card-padding-x: 12px;
    --ui-metric-row-padding-y: 6px;
    --ui-metric-row-padding-x: 8px;
    --ui-metric-gap: 8px;

    --ui-radius-control: 4px;
    --ui-radius-card: 8px;
    --ui-radius-panel: 8px;
    --ui-radius-pill: 999px;
}
```

#### 使用規則

- 新 CSS 不得直接散落新增 `padding: 10px 14px`、`gap: 13px`、`min-height: 38px`、`border-radius: 11px` 這類無規格來源的數值。
- 若特殊元件必須硬編碼 spacing / size，必須在同一段 CSS 前加上 `ui-token-exception` 註解並說明原因。
- 允許例外的場景限於列印模板、第三方套件相容、QR Code / Canvas / 固定比例圖片、或被外部設備限制的掃描/輸入元件。
- 同一 Modal 或卡片內不得混用多套 section padding、表格列高、表單 control 高度。
- 若發現既有樣式與 token 衝突，優先補待辦或逐步重構，不得再複製舊樣式擴散。

```css
/* ui-token-exception: QR Code 固定尺寸，需配合掃描器最小可讀範圍。 */
.qr-code-preview {
    width: 180px;
    height: 180px;
}

.compact-data-table td {
    padding: var(--ui-table-cell-padding-y) var(--ui-table-cell-padding-x);
}
```

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

### 2.3 表格操作按鈕

```css
.btn.text { /* 30x30 操作按鈕基底，實際顏色由 .op-role-* 控制 */ }
.btn.text.danger { /* 刪除操作 */ }
.op-role-print { background: #7c3aed; }
.op-role-view { background: #0f766e; }
.op-role-edit { background: #2563eb; }
```

- 表格操作按鈕必須有 `data-action`，不得只使用 inline `onclick`。
- 禁止以 `purple`、`success`、`warning` 等 class 自訂已納管 action 的顏色。
- 可正常操作的按鈕不得使用灰色；灰色只用於停用或阻擋狀態。

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
    padding: var(--ui-table-cell-padding-y) var(--ui-table-cell-padding-x);
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
    padding: var(--ui-card-padding-y) var(--ui-card-padding-x);
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
    padding: var(--ui-control-padding-y) var(--ui-control-padding-x);
    border-radius: var(--ui-radius-control);
    transition: background-color 0.2s ease, color 0.2s ease;
}

.modal-close:hover {
    background-color: #f0f0f0;
    color: #333;
}

.modal-window h3 {
    margin-bottom: var(--ui-section-gap);
    padding-bottom: var(--ui-subsection-header-padding-bottom);
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
    gap: var(--ui-section-gap);
}

.form-section {
    margin-bottom: var(--ui-section-gap);
    padding: var(--ui-section-padding-y) var(--ui-section-padding-x);
}

.form-section h4 {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    margin-bottom: var(--ui-section-gap);
    padding-bottom: var(--ui-subsection-header-padding-bottom);
    border-bottom: 1px solid #e0e0e0;
}
```

### 6.2 標籤與輸入框

```css
.inline-label {
    display: flex;
    flex-direction: column;
    gap: var(--ui-section-gap);
}

.inline-label span {
    font-weight: 500;
    color: #555;
    font-size: 14px;
}

.inline-label input,
.inline-label select,
.inline-label textarea {
    min-height: var(--ui-control-height);
    padding: var(--ui-control-padding-y) var(--ui-control-padding-x);
    border: 1px solid #ced4da;
    border-radius: var(--ui-radius-control);
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
    gap: var(--ui-section-gap);
    margin-top: var(--ui-section-gap);
    padding-top: var(--ui-section-gap);
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
    padding: var(--ui-alert-padding-y) var(--ui-alert-padding-x);
    border-radius: var(--ui-badge-radius);
    margin-bottom: var(--ui-alert-margin-bottom);
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
    width: var(--ui-sidebar-width);
    background-color: #313a46;
    color: #e0e0e0;
    padding-top: var(--ui-shell-content-padding);
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
    transition: width 0.3s ease;
}

.menu-link {
    display: flex;
    align-items: center;
    padding: var(--ui-nav-item-padding-y) var(--ui-nav-item-padding-x);
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
    padding: var(--ui-nav-subitem-padding-y) var(--ui-nav-subitem-padding-x) var(--ui-nav-subitem-padding-y) var(--ui-nav-subitem-indent);
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

---

## 13. 共用 Compact Utility Class（強制優先）

新增資料密集型區塊時，優先使用既有 utility class，不要重新定義近似 padding、gap、radius。

| Utility | 用途 |
|---------|------|
| `.ui-compact-section` | 一般 section/card 的 compact padding、border、radius |
| `.ui-compact-table` | 表格 cell/header padding 與字級 |
| `.ui-compact-form-row` | inline label + control 的單列排版 |
| `.ui-metric-card` | 統計卡外框、padding、radius |
| `.ui-metric-row` | 統計 label/value 單列間距與底線 |

```html
<section class="form-section ui-compact-section">
    <header class="subsection-header"><h4>區塊標題</h4></header>
    <div class="subsection-body">
        <table class="data-table compact ui-compact-table"></table>
    </div>
</section>

<label class="inline-label ui-compact-form-row">
    <span>欄位標題</span>
    <input type="text">
</label>

<section class="ui-metric-card">
    <div class="ui-metric-row">
        <span class="metric-label">統計名稱</span>
        <strong>123</strong>
    </div>
</section>
```

- 若既有模組已有 `.form-section`、`.data-table compact`、`.metrics-panel`，可疊加 utility class 做漸進收斂。
- utility class 僅負責密度、邊框與 label/value 排版，不應承載模組語意或 JS hook。
- 若 utility class 不足以表達特殊版面，先評估是否需要新增 token；不得直接散落硬編碼尺寸。
- 特殊固定尺寸需加 `ui-token-exception:` 註解並說明原因。

---

## 14. UI 統一落地規則（強制）

### 14.1 修改前

- 先搜尋是否已有相同用途的 token、共用 class 或模組既有樣式，不得直接新增一組近似 spacing。
- 修改 `styles.css` 前必須讀本文件與 `.github/skills/ui-style.md`。
- 修改畫面模板前必須讀 `.github/skills/html-module-style.md` 與 `.github/skills/ui-style.md`。
- 若是系統性 UI 統一工作，必須同步更新對應 todo / plan 文件。

### 14.2 修改中

- 優先調整共用 token 或共用 class，再用模組 scoped selector 做必要差異化。
- 模組 scoped selector 必須以頁面或 modal 明確容器開頭，避免外溢影響其他模組。
- 不得用 `!important` 處理一般 spacing、border 或 control height 問題。
- 避免雙層框線模型：label 外層若有完整 border，內部 input/select 不得再畫完整 border；可搜尋下拉若外層 control 已有 border，內層 input 不得重複畫框。
- 統計資料列應明確分離 label 與 value；label 可用淡底圓角標題帶，value 保持乾淨可讀。

### 14.3 修改後

- 檢查是否新增未註解的硬編碼 `padding`、`gap`、`height`、`min-height`、`border-radius`。
- 回報時需說明是否新增 `ui-token-exception`，以及例外原因。
- 功能模組 UI/CSS 修改前後需執行 `node tools/audit-system-health.js --changed --base origin/main`。
- 配置型模組仍需執行 `node tools/validate-config-modules.js`。
- 若本輪只完成部分模組統一，必須在 todo 文件留下範圍、剩餘項目與驗收方式。
