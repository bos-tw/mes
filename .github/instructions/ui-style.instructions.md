---
applyTo: "**/*.css,modules/**,core/configs/**,js/**/*.js"
---

# UI/UX 規範入口

正式規範：

- `.github/standards/ui-tokens.md`
- `.github/standards/ui-components.md`
- `.github/standards/frontend-contracts.md`

MES 是資料密集型後台，預設採 compact density。新增 UI 必須沿用既有頁面 shell、共用 token、按鈕、Modal、表格與表單結構。

禁止：

- 自行創造色票、spacing、radius 或元件 class。
- 使用 emoji 作正式 icon。
- 使用 inline style、inline onclick、無 `btn` 前綴的按鈕。
- 只用顏色傳達狀態。

若本需求不是 UI 變更，不得順手改變版面、色彩、字體或密度。
