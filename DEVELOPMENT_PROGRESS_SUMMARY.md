# MES Development Progress Summary

更新日期：2026-07-20

## 最新架構與完成項目

- 技術棧：PHP 8.4 API、MySQL 8、原生 JavaScript／HTML／CSS、PowerShell schema／更新工具、PHPUnit 12。
- 修復儀表板工單狀態統計：改由 `work_orders.status_lookup_id` JOIN `lookup_values` 取得正式狀態，排除已淘汰的 `work_orders.status` 讀取。
- 訂單與訂單明細新增流程在狀態未填時套用 `pending`；API 驗證失敗會回傳並由前端顯示具體欄位原因。
- 訂單明細改為 `deleted_at` 軟刪除，訂單、工單、統計與公開查詢均排除已刪除明細，並保留識別與稽核追溯。
- 全系統表格操作按鈕統一使用 24px 尺寸與 2px 間距；新增 `--ui-table-action-size`、`--ui-table-action-gap`，未新增 inline style 或固定值例外。
- 移除生產工單六階段導引及相關資產，保留現場可彈性操作的連續表單；一次／二次篩分頁籤與生產排程標題已改為系統樣式。
- 移除儀表板「我的工作佇列」，由既有「我的收藏」提供快速入口。

## Migration 與 schema

- 新增並收錄 `migrations/2026_07_20_add_order_items_soft_delete.sql`，建立 `order_items.deleted_at` 與 `idx_order_items_order_active`。
- migration 使用正式更新器的 PDO／SQL 分割執行路徑；舊 schema 完整執行、重複執行、只完成欄位後重試及舊資料保留均通過。
- `tools/sync-local-schema.ps1` 已加入明確 migration check；本機 schema sync 為 Applied 39、Pending 0。

## 驗證狀態

- `node tools/audit-system-health.js`：0 errors、13 項既有 F-1 大型 JS warning。
- `node tools/audit-system-health.js --changed --base origin/main`：0 new、0 blocking、4 resolved。
- `node tools/validate-config-modules.js` 與 `node tools/test-audit-system.js`：通過。
- DataSync：P0=0、P1=0、P2=0、OK=51；`docs/data-sync-audit.md` 已更新。
- UI style audit：748 hardcoded spacing/radius、378 token candidates、370 needs review；未新增 blocking。
- 本輪 12 個 JS 與 16 個 PHP 逐檔語法檢查通過；`git diff --check` 通過。
- PHPUnit：40 tests、94 assertions、16 skipped；可執行測試均通過，跳過項目需要獨立 HTTP 測試環境。
- 使用者已完成本機實際畫面驗收。

## 已知風險與下一輪優先事項

- P0：無新增項目。
- P1：獨立 HTTP 整合測試環境尚未建立，因此 16 個 HTTP 測試依既有條件跳過；部署後仍需依正式資料與權限做 smoke test。
- P2：13 個既有大型 JavaScript 維護性警告；下一輪若進行技術債處理，第一優先為拆分 7,590 行的 `js/work_orders.js`，並維持行為回歸測試。

## 更新包

- 版本：`v3.1.5`／`FileVersion v3.1.5`／ReleaseDate `2026-07-20`。
- 路徑：`dist/update_v3.1.5_20260720_155348.zip`；大小 272,231 bytes。
- SHA-256：`8DAEEE8F3B4FA39BCB79B43239D869BC73132B384900497D96402669EF1345AE`。
- 更新包包含 28 個一般檔案、1 個 migration、2 個刪除路徑；ZIP 根目錄 manifest、正式 PHP parser、精確檔案集合、migration 順序／hash 與 delete_files 均驗證通過。
- 11 個僅供開發的 `.github`／PHPUnit／審計測試檔未納入正式部署包；未刪除任何既有更新包。

## Git 交接

- 分支：`main`。
- 本輪開始 commit／目前 HEAD：`ef7c0a6762f3f32b4e605b20e96b0239e7cf0c65`。
- `origin/main`：`ef7c0a6762f3f32b4e605b20e96b0239e7cf0c65`；提交指標一致。
- 工作樹保留本輪已確認但尚未提交的功能、migration、測試、文件與兩個刪除項目；沒有來源不明檔案。
- 已取得本輪 commit 與 push 明確授權；收尾使用精確檔案清單 stage，禁止 rebase、merge、reset、force push 或其他歷史改寫，最終 commit／push 結果以收尾回報為準。
