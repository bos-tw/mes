# MES Development Progress Summary

更新日期：2026-07-19

## 最新架構與完成項目

- 技術棧：PHP 8.4 API、MySQL 8、原生 JavaScript／HTML／CSS、PowerShell schema／更新工具、PHPUnit 12。
- 訂單明細新增穩定識別 `order_item_sequence`／`order_item_number`，格式為 `ORDER-YYYYMMDD-NNNN-L01`；客戶提供的 `customer_batch_number` 保留原值。
- 客戶批號入口改為全域訂單明細工作區；訂單主表內嵌明細新增／編輯共用完整明細 Modal，並保留下游工單、庫存、出貨與退貨追溯。
- 工單、庫存、出貨與退貨相關查詢、列表與匯出均帶出 `order_item_number`，既有 `order_item_id` 關聯鍵維持不變。
- 系統設定新增「基本設定／字體調整」，提供 85%、90%、100%、110%、120% 五段字體選項、瀏覽器保存、跨分頁同步與訂單列表範例表格預覽。
- 新增 `basic_settings.read` 權限；字體偏好保存在目前瀏覽器，不建立字體偏好資料表。
- CSS 仍使用正式文字 token；未新增 inline style，圖示 token、控制項高度與列印版面維持原規格。

## Migration 與 schema

- 新增並收錄：
  1. `migrations/2026_07_19_add_order_item_number.sql`
  2. `migrations/2026_07_19_add_basic_settings_permission.sql`
- migration 使用正式 PDO／SQL 分割執行路徑，不使用 `DELIMITER`／stored procedure。
- 舊 schema／資料情境的完整執行、完整重跑、部分執行後重試均通過；測試資料庫已清理。
- 本機 schema sync：Applied 38、Pending 0。

## 驗證狀態

- `node tools/audit-system-health.js`：0 errors、13 項既有 F-1 warning。
- `node tools/audit-system-health.js --changed --base origin/main`：0 new、0 blocking。
- `node tools/validate-config-modules.js`：通過。
- DataSync：P0=0、P1=0、P2=0、OK=51；`docs/data-sync-audit.md` 已更新。
- UI style audit 已執行；現有報告記錄 751 hardcoded spacing/radius、380 token candidates、371 needs review，未新增 blocking。
- JS／PHP syntax、audit tests、P0 workflow 35 assertions 均通過。
- PHPUnit：32 tests、76 assertions、16 skipped，測試通過。
- 使用者已完成本地實機畫面驗收。
- `git diff --check`：通過；僅有既有 LF／CRLF 轉換提示，沒有 whitespace error。

## 已知風險與下一輪優先事項

- P0：無新增項目。
- P1：部署後確認正式角色權限、`number_sequences`、公司資料、status mirror、`message_attachments` metadata，以及兩種角色權限操作。
- P2：逐步拆分既有大型 JavaScript，處理 13 項既有 F-1 warning，並依模組完成剩餘 CSS token candidate 的視覺回歸。
- `js/order_item_quick_editor.js` 目前被 Git 標示為工作樹狀態差異，但內容 hash 與基線相同；未列入本輪正式更新包。

## 更新包

- 版本：`v3.1.4`／`FileVersion v3.1.4`／ReleaseDate `2026-07-19`。
- 已建立 v3.1.4 明確清單更新包：40 個一般檔案、2 個 migration、0 個刪除檔案；最終路徑與 SHA-256 於收尾交付回報提供。
- 官方 verifier、正式 PHP manifest parser、ZIP 檔案集合、migration 順序與來源 hash 均通過。
- 先前 safe builder 產生的候選包因包含非本輪內容相同的 `js/order_item_quick_editor.js`，未交付且保留於 `dist/` 供追溯；未刪除任何既有或歷史包。

## Git 交接

- 分支：`main`。
- 開始 commit／HEAD：`9c94806da87704abc366d85d160793d8725f8d86`。
- `origin/main`：`9c94806da87704abc366d85d160793d8725f8d86`。
- HEAD 與 `origin/main` 一致。
- 本輪 Git 交接已取得使用者明確授權；不執行 rebase、merge、reset、restore、stash 或其他歷史改寫。
- 起始基線為上述 HEAD／`origin/main`；commit hash、push 結果與最終工作樹狀態以本輪收尾命令輸出為準。
