# MES Development Progress Summary

更新日期：2026-07-18

## 專案架構

- 根目錄：`C:\Apache24\htdocs\mes`
- 技術棧：PHP 8.4 API、MySQL 8、原生 JavaScript／HTML／CSS、PowerShell schema／更新工具、PHPUnit 12。
- 主要目錄：`api/` 後端端點與共用守門、`js/` 前端模組、`modules/` 配置型畫面、`core/` 共用核心、`migrations/` 資料庫 migration、`tools/` 審計／schema／更新包工具、`docs/` 技術文件、`release-notes/` 版本說明、`dist/` 更新包。
- 本輪涉及後端：系統更新、權限 bootstrap、流程守門、訂單、出貨、二次篩選圖片、狀態看板、工具、工作工單 API。
- 本輪涉及前端：`js/work_orders.js`、`modules/work_orders.html`、`script.js`。
- 本輪涉及資料表：`work_orders`、`orders`、`shipping_orders`、`tools`、`employees`、`lookup_domains`、`lookup_values`、`message_attachments`、`inventory_item_sources`、流程外鍵相關表。

## 本輪已完成

- 修復新增生產工單未帶 `status_lookup_id` 導致 `SQLSTATE[23000]`／HTTP 500；空白狀態建立時使用 pending，更新時拒絕空白狀態。
- 修復工作工單錯誤回應洩漏例外檔案與行號。
- 補強系統更新 API、報表權限映射、流程守門、二次篩選圖片與狀態看板 HTTP method 契約。
- `domain_event_outbox` 維持停用 API（410），權限映射與前後端契約一致。
- 完成 `status_lookup_id` 相容鏡像回填：員工、訂單、出貨單、載具；補齊載具 `retired` 狀態。四個 legacy 模組仍以 `status` 為相容來源，`status_lookup_id` 為鏡像；工單已改為 lookup 唯一來源。
- `2026_07_16_unify_work_order_status.sql` 改為可重複執行，包含完整執行及部分執行後重試；明確處理狀態回填、欄位／FK／唯一鍵。
- 新增並依序執行：
  1. `migrations/2026_07_16_unify_work_order_status.sql`
  2. `migrations/2026_07_18_repair_lookup_and_message_metadata.sql`
  3. `migrations/2026_07_18_reconcile_status_lookup_mirrors.sql`
- 修正 `service_category` 描述與 `message_attachments` UTF-8 COMMENT；`tools/sync-local-schema.ps1` 的 `$migrationChecks` 改為明確相依順序。
- 新增狀態來源契約文件、更新 DataSync／system health governance 審計規則與報告。
- 版本：`v3.1.3`／`FileVersion v3.1.3`／ReleaseDate `2026-07-18`。
- 更新包：[dist/update_v3.1.3_20260718_211152.zip](C:/Apache24/htdocs/mes/dist/update_v3.1.3_20260718_211152.zip)，32 個檔案、3 個 migration、0 個刪除檔案；大小 227,694 bytes；SHA-256 `3c8701d21e4a42c06b2eb81716919c674eaf51f16814d425273c371897759624`。

## 待修 Bug／已知風險

- 完整 system health audit 仍有 13 項既有 F-1 大型 JavaScript 警告；本輪未新增阻擋問題。
- `roles`／`employee_roles`、`number_sequences`、`companies`、`order_items.deleted_at` 等資料內容仍需部署後由管理員確認。
- status mirror 已有 migration 與新增／更新流程同步，但部署後仍需抽查四個 legacy 模組的一致性。
- 尚未完成實際瀏覽器逐頁操作與列印畫面驗收；目前以靜態審計、語法、API／資料庫情境測試替代。

## 下一步任務

- P0：部署後確認新增生產工單、工作工單六階段流程、列印權限與 system update API 的實際瀏覽器操作。
- P1：確認正式資料庫的角色權限、編號序號、公司資料、狀態鏡像及 `message_attachments` metadata；持續觀察 migration 後資料一致性。
- P2：逐項拆分大型 JS 檔案、處理 13 項既有 F-1 警告，並依模組完成剩餘 CSS token candidate 的視覺回歸；不得再次全域機械轉換。

## 驗證狀態

- `node tools/audit-system-health.js`：0 errors、13 既有 warnings。
- `node tools/audit-system-health.js --changed --base origin/main`：0 新增、0 blocking。
- `node tools/validate-config-modules.js`：通過。
- DataSync：`js/data-sync.js`、`tools/audit-data-sync.js` 語法通過；P0=0、P1=0、P2=0、OK=50，報告已寫入 `docs/data-sync-audit.md`。
- PHP syntax：本輪 26 個 PHP 檔案全部通過 `php -l`；本輪相關 JS 全部通過 `node --check`。
- 測試：`node tools/test-audit-system.js` 通過；P0 workflow 35 assertions 通過；PHPUnit 32 tests／76 assertions／16 skipped，通過。
- Migration：使用正式 PDO／SQL 分割執行路徑，在接近舊 schema 的完整、重複、部分執行後重試情境均通過；測試資料庫已清理。
- Schema sync：Applied 36、Pending 0。
- 更新包官方 verifier、正式 PHP manifest parser、ZIP 精確檔案清單、migration 順序與來源 SHA-256 均通過。
- `git diff --check`：通過；僅有既有 LF／CRLF 轉換提示，無 whitespace error。

## Git 交接

- 分支：`main`。
- 收尾前基線：`40cc32a383486fe2fb161cfbdc521c051bc02ae2`。
- 預計提交訊息：`fix: close system repair handoff and package v3.1.3`；實際功能／交付 commit 為 `a428535`，已推送至 `origin/main`。
- 本輪摘要、功能修復、migration、驗證工具、文件與 release note 均已提交；測試快取 `.phpunit.result.cache` 已排除並移除。
- Git push 已完成；本次文件收尾狀態更新後，仍須再次確認本機 `HEAD == origin/main` 且 `git status --short` 無輸出。
