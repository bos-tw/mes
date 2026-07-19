---
applyTo: "modules/**,core/configs/**"
---

# HTML 模組規範入口

正式規範：`.github/standards/ui-components.md`、`.github/standards/frontend-contracts.md`。

強制要求：

- 模組使用 `data-module="snake_case"`，維持既有頁面結構。
- 按鈕必須使用 `class="btn primary|outline|text|text danger"` 與 `data-action`。
- Modal 尺寸使用 `.modal-window.small|medium|large|xlarge`。
- `modules/` 禁止新增 inline style 與 inline onclick。
- Icon 使用 Font Awesome；icon-only 按鈕要有 `title` 與 `aria-label`。
- 動態使用者資料輸出前必須 escape，data JSON 必須 URI encode。

修改後執行：

```text
node tools/validate-config-modules.js
node tools/audit-system-health.js --changed --base origin/main
```
