---
applyTo: "js/**/*.js"
---

# JavaScript 模組規範入口

正式規範：`.github/standards/frontend-contracts.md`、`.github/standards/ui-components.md`。

強制要求：

- 使用 IIFE、`'use strict'` 與 `data-initialised` 防重複初始化。
- DOM 查詢限定在 `moduleRoot`；欄位寫入需先確認元素存在。
- 使用 `data-action` 事件委派，不使用 inline onclick。
- CRUD 成功後必須通知 DataSync；不得自行重造共用 Column Manager 或 UI 元件。
- 使用者資料插入 HTML 前必須 `escapeHtml()`；data JSON 使用 `encodeURIComponent()`。
- 禁止新增 `alert()`、`confirm()`，流程型操作使用標準確認 Modal。

修改功能模組前後執行：

```text
node tools/audit-system-health.js
node tools/audit-system-health.js --changed --base origin/main
```

若涉及 DataSync，再執行正式規範列出的 syntax 與 DataSync audit。
