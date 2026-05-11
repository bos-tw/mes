---
applyTo: "**/*.css"
---

# CSS 樣式撰寫風格指南

> 完整規範：`.github/skills/css-style-guide.md`

## 基本規則

- 使用 2 空格縮排
- 選擇器使用 kebab-case：`.modal-window`、`.form-section`
- 顏色值使用 CSS 變數（定義在 `:root`）
- 避免 `!important`，確有需要需加注解說明

## 禁止的寫法

```css
/* ❌ 禁止 */
.modal-window-large { }       /* 連字號命名法（應用空格複合類別） */
button.btn-primary { }        /* 連字號按鈕類別 */
div[style*="display:none"] { }/* 覆蓋 inline style */

/* ✅ 正確 */
.modal-window.large { }
.btn.primary { }
.hidden { display: none; }
```

## 標準按鈕類別

```css
/* 主要動作 */    .btn.primary  { }
/* 次要動作 */    .btn.outline  { }
/* 文字按鈕 */    .btn.text     { }   /* 表格操作欄 */
/* 危險動作 */    .btn.danger   { }
/* 表格危險 */    .btn.text.danger { }
```

## Modal 尺寸（空格複合類別）

```css
.modal-window         { min-width: min(1800px, 95%); }  /* 超大（預設）*/
.modal-window.xlarge  { min-width: min(1800px, 95%); }
.modal-window.large   { min-width: min(1400px, 92%); }
.modal-window.medium  { min-width: min(800px,  90%); }
.modal-window.small   { min-width: min(500px,  90%); }
```

## 命名慣例

| 類型 | 規則 | 範例 |
|------|------|------|
| 元件 | BEM-like kebab-case | `.form-section`, `.table-responsive` |
| 狀態 | 形容詞 | `.hidden`, `.active`, `.disabled` |
| 修飾 | 無前綴空格複合 | `.modal-window large`, `.btn primary` |

## RWD 斷點

```css
@media (max-width: 768px)  { /* 手機 */  }
@media (max-width: 1024px) { /* 平板 */ }
```

## 必要的 hidden-column 樣式

```css
/* 欄位管理器必須要有 */
.hidden-column { display: none !important; }
```

## 登入頁品牌區（.brand-logo）規範

| 屬性 | 規定值 | 說明 |
|------|--------|------|
| `border-radius` | `0` | **直角**，禁止設定圓角 |
| `background` | `#f3f4f6` | 淺灰色底 |
| `border` | `1px solid #cdd0d5` | 略深灰框線 |
| `width / height` | `76px` | 固定尺寸 |

```css
/* ✅ 正確 */
.brand-logo {
    width: 76px;
    height: 76px;
    border-radius: 0;          /* 直角 */
    background: #f3f4f6;
    border: 1px solid #cdd0d5;
}

.brand-logo img.company-logo-img {
    width: 68px;
    height: 68px;
    object-fit: contain;
    border-radius: 0;          /* 直角，與外框一致 */
}

/* ❌ 禁止 */
.brand-logo { border-radius: 8px; }   /* 圓角 */
.brand-logo { background: rgba(76,175,80,0.12); } /* 綠色底 */
```
