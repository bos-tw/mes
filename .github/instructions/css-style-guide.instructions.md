---
applyTo: "**/*.css"
---

# CSS 規範入口

正式規範：`.github/standards/ui-tokens.md`、`.github/standards/ui-components.md`。

執行要求：

- 以 `styles.css` 的 `:root` 為唯一 token 來源；不得建立藍色或其他第二套色票。
- 新增 spacing、radius、height、font-size 優先使用正式 token 或共用 class。
- CSS 使用 4 空格縮排，selector 採 kebab-case；按鈕使用 `.btn.primary` 等空格複合 class。
- 禁止 `btn-primary`、`btn-danger`、無註解的 `!important` 與模組自行覆寫共用 action 顏色。
- 特殊固定值必須先加 `ui-token-exception` 註解。

修改後執行：

```text
node tools/audit-system-health.js --changed --base origin/main
```
