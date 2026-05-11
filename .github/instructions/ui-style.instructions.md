---
applyTo: "**/*.css,modules/**,core/configs/**,js/**/*.js"
---

# UI 風格指南

> 完整規範：`.github/skills/ui-style.md`

## 整體設計語言

螺絲篩分管理系統採用**工業風格**，強調清晰、高密度的資訊呈現。

## 色彩系統（CSS 變數）

```css
:root {
    --primary:      #2563eb;   /* 主要藍色 */
    --primary-dark: #1d4ed8;
    --danger:       #dc2626;   /* 危險紅色 */
    --success:      #16a34a;   /* 成功綠色 */
    --warning:      #d97706;   /* 警告橘色 */
    --text-primary: #111827;
    --text-muted:   #6b7280;
    --border:       #e5e7eb;
    --bg-surface:   #f9fafb;
}
```

## 間距規範

```css
/* 使用 4px 基準單位的倍數 */
--space-1:  4px;
--space-2:  8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
```

## 表單元素

```css
/* 標準 input 樣式 */
input, select, textarea {
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 6px 10px;
    font-size: 14px;
}

input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}
```

## 標準按鈕類別

```css
/* 務必使用以下標準類別，不可自定義顏色 */
.btn.primary  { background: var(--primary); color: #fff; }
.btn.outline  { border: 1px solid var(--border); background: transparent; }
.btn.text     { background: transparent; border: none; }
.btn.danger   { background: var(--danger); color: #fff; }
.btn.text.danger { color: var(--danger); background: transparent; }
```

## 狀態標籤（Badge）

```css
/* 使用靜態 class，不要用 inline style 設定顏色 */
.badge.active    { background: #dcfce7; color: #16a34a; }
.badge.inactive  { background: #f1f5f9; color: #64748b; }
.badge.pending   { background: #fef9c3; color: #a16207; }
.badge.cancelled { background: #fee2e2; color: #dc2626; }
```

## 表格樣式

```css
table { border-collapse: collapse; width: 100%; }
th    { background: var(--bg-surface); font-weight: 600; text-align: left; }
th, td { padding: 8px 12px; border-bottom: 1px solid var(--border); }
tr:hover td { background: rgba(37, 99, 235, 0.04); }
```

## 禁止事項

- ❌ `style="color: red"` — 使用 CSS class
- ❌ 自定義 `btn-primary`、`btn-danger` 等連字號類別
- ❌ `font-size: 10px` — 字體最小 12px
- ❌ 僅用顏色傳遞資訊（需同時有文字/圖示）
- ❌ 動畫時間超過 300ms
