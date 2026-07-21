# MES Development Progress Summary

更新日期：2026-07-21

## 本輪完成項目

- 篩分服務新增 `is_default`／「預設項目」；新增客戶批號時只自動帶入啟用中的預設服務，且每次開啟新增表單都重新載入服務選項避免快取過期。
- 客戶批號的篩分服務依服務編號排序；圖面附件與檔案附件統一為五欄表格；出貨狀態改用共用 `status-badge`。
- 客戶批號工具列移除「新增品項」與大型搜尋框，改為批次匯出、抽屜式搜尋與欄位設定；新增／編輯仍由訂單明細脈絡進入。
- 客戶編輯 Modal 移除非編輯用途的載具分析；員工與受篩產品 Modal 統一為 `medium` 尺寸。
- 共用表格欄寬管理器修正操作欄按鈕溢出與序號欄過寬；未新增 token、inline style 或固定值例外。

## Migration 與 schema

- 新增 `migrations/2026_07_21_add_screening_service_default_flag.sql`，並同步 `tools/sync-local-schema.ps1` 與 `tools/schema-contract.json`。
- migration 以正式 PDO SQL 分割／執行器驗證：舊 schema 含既有服務資料可套用，DDL 已提交後以新 PDO 連線重試亦可安全完成。
- 本機 schema sync：Applied 40、Pending 0。

## 驗證狀態

- 使用者已完成本機實際畫面驗收。
- `node tools/audit-system-health.js`：0 errors、13 項既有大型 JavaScript warning。
- `node tools/audit-system-health.js --changed --base origin/main`：0 new、0 blocking、4 resolved。
- `node tools/validate-config-modules.js`、本輪 JS／PHP 語法檢查、`git diff --check`：通過。
- DataSync audit：P0=0、P1=0、P2=0、OK=51。
- `php tools/test-p0-workflow-integrity.php`：35 assertions 通過；PHPUnit：40 tests、94 assertions 通過、16 skipped。
- UI style audit：748 hardcoded spacing/radius、378 token candidates、370 needs review；本輪未新增審計問題。

## 更新包

- 版本：`v3.1.7`／`FileVersion v3.1.7`／ReleaseDate `2026-07-21`。
- 路徑：`dist/update_v3.1.7_20260721_221127.zip`；大小 90,375 bytes。
- SHA-256：`CFEB47A6DDBAF46FAAF1A307C8EB532EB7938884069B28837C4717665D8A4EAE`。
- 包含 14 個正式檔案、1 個 migration、0 個刪除路徑；更新包驗證、正式 PHP manifest parser、檔案清單與 migration SHA-256 比對均通過。

## 已知風險與下一輪優先事項

- P0：無新增項目。
- P1：部署後以正式資料與權限驗證新增客戶批號的預設服務帶入與抽屜搜尋。
- P2：13 個既有大型 JavaScript 維護性 warning；優先拆分 `js/work_orders.js`。

## Git 交接

- 分支：`main`；本輪開始 commit 與 `origin/main` 基線：`519204b0ac366b6d0e3bd58ba0525a323183664c`。
- 本輪功能、migration、驗證文件與 release note 均尚未提交；未取得 commit 或 push 授權。
- 工作樹含本輪已確認變更，以及本次 PHPUnit 自動產生的 `.phpunit.result.cache` 暫存檔；暫存檔未納入更新包，也未刪除。
