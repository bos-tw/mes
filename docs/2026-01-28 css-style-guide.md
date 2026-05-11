# MES 系統 CSS 樣式指南

本文件記錄 MES 系統中使用的 CSS 樣式規範，確保所有模組的視覺一致性。

---

## 按鈕樣式規範

### 主要按鈕類別

所有按鈕皆使用 `.btn` 作為基礎類別，搭配功能性類別定義外觀。

| 類別組合 | 用途 | 背景色 | 文字色 |
|----------|------|--------|--------|
| `.btn.primary` | 主要操作（儲存、確認） | `#007bff` 藍色 | `#fff` |
| `.btn.outline` | 次要操作（取消、重設） | 透明 | `#333` |
| `.btn.success` | 成功/完成操作 | `#4CAF50` 綠色 | `#fff` |
| `.btn.ghost` | 幽靈按鈕 | 透明 | `#495057` |

---

### 表格操作按鈕 (`.btn.text`)

表格內的操作欄按鈕統一使用 `.btn.text` 類別，配合 `data-action` 屬性定義顏色。

#### 標準尺寸
- **寬高**: 36px × 36px
- **內距**: 8px
- **圓角**: 6px
- **字重**: 500

#### 顏色對照表

| data-action | 用途 | 背景色 | Hover 色 | 色碼 |
|-------------|------|--------|----------|------|
| `edit` / 預設 | 編輯 | `#007bff` 藍色 | `#0056b3` | - |
| `print` / `print-single` / `print-work-order` | 列印 | `#17a2b8` 青色 | `#138496` | Cyan |
| `details` | 明細/詳情 | `#ff9800` 橙色 | `#f57c00` | Orange |
| `copy-order-item` | 複製品項 | `#9c27b0` 紫色 | `#7b1fa2` | Purple |
| `create-work-order` / `convert-to-inventory` | 建立工單/轉庫存 | `#FFC107` 黃色 | `#FFB300` | Amber |
| `.danger` | 刪除 | `#dc3545` 紅色 | `#a71d2a` | Red |
| `.purple` | 自定義紫色 | `#9c27b0` | `#7b1fa2` | - |

#### 範例用法

```html
<!-- 列印按鈕 (青色) -->
<button type="button" class="btn text" data-action="print-work-order" title="列印">
    <i class="fas fa-print"></i>
</button>

<!-- 編輯按鈕 (藍色) -->
<button type="button" class="btn text" data-action="edit" title="編輯">
    <i class="fas fa-edit"></i>
</button>

<!-- 刪除按鈕 (紅色) -->
<button type="button" class="btn text danger" data-action="delete" title="刪除">
    <i class="fas fa-trash"></i>
</button>

<!-- 明細按鈕 (橙色) -->
<button type="button" class="btn text" data-action="details" title="明細">
    <i class="fas fa-list"></i>
</button>
```

---

### 已棄用樣式

以下樣式已棄用，請勿在新程式碼中使用：

| 舊類別 | 替代方案 |
|--------|----------|
| `.btn.btn-print-new` | `.btn.text[data-action="print-work-order"]` |
| `.btn.btn-print-done` | `.btn.text[data-action="print-work-order"]` |

---

## 表單元素

### 輸入欄位標籤

所有表單標籤統一使用 `.inline-label` 類別：

```html
<label class="inline-label">
    <span>欄位名稱 <abbr title="必填">*</abbr></span>
    <input type="text" name="field_name" required>
</label>
```

#### 全寬欄位

需要佔滿整行的欄位，加上 `.full-width` 類別：

```html
<label class="inline-label full-width">
    <span>備註</span>
    <textarea name="notes" rows="3"></textarea>
</label>
```

---

## Modal 視窗

### 尺寸類別

| 類別 | 寬度 | 使用場景 |
|------|------|----------|
| `.modal-window` | min(1800px, 95%) | 預設尺寸 |
| `.modal-window.large` | min(1200px, 90%) | 中大型表單 |
| `.modal-window.medium` | min(600px, 90%) | 小型對話框 |

### ⚠️ 注意事項

```html
<!-- ✅ 正確 -->
<div class="modal-window large">

<!-- ❌ 錯誤 (不要使用連字號格式) -->
<div class="modal-window modal-window-large">
```

---

## 狀態標籤 (Status Badge)

```html
<span class="status-badge scheduled">排程中</span>
<span class="status-badge in-progress">進行中</span>
<span class="status-badge completed">已完成</span>
<span class="status-badge on-hold">暫停</span>
<span class="status-badge cancelled">已取消</span>
```

| 類別 | 背景色 | 文字色 |
|------|--------|--------|
| `.scheduled` | `#ffc107` 黃 | `#000` |
| `.in-progress` | `#17a2b8` 青 | `#fff` |
| `.completed` | `#28a745` 綠 | `#fff` |
| `.on-hold` | `#6c757d` 灰 | `#fff` |
| `.cancelled` | `#dc3545` 紅 | `#fff` |

---

## 色彩系統

### 主色調

| 名稱 | 色碼 | 用途 |
|------|------|------|
| Primary Blue | `#007bff` | 主要按鈕、連結 |
| Success Green | `#28a745` | 成功狀態、完成 |
| Warning Amber | `#ffc107` | 警告、待處理 |
| Danger Red | `#dc3545` | 錯誤、刪除 |
| Info Cyan | `#17a2b8` | 資訊、列印 |
| Secondary Gray | `#6c757d` | 次要文字、暫停狀態 |

### 文字顏色

| 類別 | 色碼 | 用途 |
|------|------|------|
| `.text-muted` | `#6c757d` | 次要文字、停用提示 |
| `.text-danger` | `#dc3545` | 錯誤訊息 |
| `.text-success` | `#28a745` | 成功訊息 |

---

## 間距與排版

### 標準間距

- **小間距**: 4px
- **中間距**: 8px
- **大間距**: 16px
- **超大間距**: 24px

### 表格設定

```css
.data-table th,
.data-table td {
    padding: 10px 12px;
}

.table-actions {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
}
```

---

## 響應式設計

系統主要設計為桌面使用，但仍需考慮不同螢幕尺寸：

- **最小寬度**: 1024px（推薦）
- **側邊欄**: 240px 固定寬度
- **主內容區**: 彈性寬度

---

## 版本紀錄

| 版本 | 日期 | 異動內容 |
|------|------|----------|
| 1.0 | 2025-01-XX | 初版建立，統一按鈕顏色規範 |
