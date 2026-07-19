# MES 前端程式契約

## JavaScript 模組

- 模組使用 IIFE 與 `'use strict'`，避免污染全域。
- 初始化函式必須檢查模組根節點與 `data-initialised`，避免重複綁定。
- DOM 查詢優先限定在 `moduleRoot`；欄位寫入必須先做 null check。
- 事件使用 `data-action` 委派，不使用 inline `onclick`。
- 超過 2000 行的模組不得繼續擴大，新增功能應拆成 API、render、主模組層。
- 不使用 `alert()`/`confirm()`，除非是瀏覽器生命週期無法非同步確認的既有例外。

## API 與 CRUD

- API 呼叫需依現有端點契約使用 `credentials: 'include'`、HTTP method 與 CSRF。
- CRUD 成功後必須通知 DataSync；失敗不得通知成功事件。
- 配置型模組遵循 `core/configs`、`hiddenFields: ['id']` 與共用 renderer，不得在模組端重造共用行為。

## DataSync

- 每個可變更資料的模組建立 `DataSync.createModuleHelper()`。
- 建立、更新、刪除成功後呼叫對應 `notifyCreated/notifyUpdated/notifyDeleted`。
- 新增模組或關聯時同步更新 `js/data-sync.js` 的 `MODULE_DEPENDENCIES`。
- DataSync 相關修改後必跑：

```text
node --check js/data-sync.js
node --check tools/audit-data-sync.js
node tools/audit-data-sync.js --write docs/data-sync-audit.md
```

## 安全與資料呈現

- 使用者資料輸出至 HTML 必須 escape；安全 HTML 只限已明確審核的 allowlist helper。
- HTML data attribute 的 JSON 使用 URI encoding。
- 前端不能取代後端權限、流程守門或資料驗證。

## 驗證

- 功能模組修改前後執行 `node tools/audit-system-health.js`。
- 配置型模組修改前後執行 `node tools/validate-config-modules.js`。
- UI/CSS 修改後執行 `node tools/audit-system-health.js --changed --base origin/main`，並進行實際畫面驗收。
