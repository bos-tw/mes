# 開發進度摘要

更新時間：2026-06-21  
目前分支：`main`  
最新交付版本：`v3.0.5`  
更新包：`dist/update_v3.0.5_20260621_221535.zip`

## 1. 專案架構

- 主要目錄：
  - `api/`：PHP API、流程守門、工單、庫存、出貨與報表端點。
  - `js/`：桌面版原生 JavaScript 模組。
  - `mobile/`：手機版工單入口與樣式。
  - `modules/`：桌面模組 HTML。
  - `core/configs/`：配置化模組欄位與表格設定。
  - `migrations/`：MySQL schema migration。
  - `tools/`：schema 同步、健康稽核、DataSync 稽核、更新包打包工具。
  - `docs/`、`release-notes/`、`dist/`：技術文件、版本說明與一鍵更新包。
- 技術棧：
  - PHP 8、PDO、MySQL 8、Apache。
  - 原生 JavaScript / HTML / CSS。
  - Node.js 稽核工具、PowerShell schema sync 與更新包工具。
- 本輪主要涉及模組 / API / 資料表：
  - 模組：桌面生產工單、手機生產工單、庫存項目、出貨 / 退貨關聯畫面。
  - API：`api/work_orders/*`、`api/inventory_items/*`、`api/shipping_orders/*`、`api/shipping_order_items/*`、`api/common/workflow_guard.php`、`api/workflow_guard/check.php`。
  - 資料表：`work_orders`、`work_order_partial_receipts`、`work_order_partial_receipt_tools`、`work_order_machine_runs`、`production_records`、`inventory_items`、`inventory_transactions`、`shipping_orders`、`shipping_order_items`、`permissions`、`role_permissions`。

## 2. 已完成功能

- 工單部分入庫：
  - 完成一般工單與拆分工單部分入庫流程，支援本次淨重、整數支數、剩餘可入庫檢核與已完成 / 已有正式庫存防呆。
  - 部分入庫視為品保合格，會建立可追溯庫存與異動紀錄。
  - 新增部分入庫沖銷 API：`api/work_orders/reverse_partial_receipt.php`。
  - 新增工單結案平衡：部分入庫、最終補入庫、真實短缺與平衡差異。
  - 新增桌面 / 手機版部分入庫歷程、出貨追蹤、已出貨 / 待出貨 / 可再出貨 / 未出貨資訊。
- 出貨載具：
  - 部分入庫 Modal 可從載具管理 / 訂單品項載具帶入名稱、類型、重量。
  - 支援多選載具與自填數量，立即合計參考載具重量；載具重量僅供參考，不併入產品淨重。
  - 部分入庫歷程改顯示載具摘要，完整載具明細保留於提示與結構化資料。
- 庫存追溯：
  - 庫存項目檢視 / 編輯補齊部分入庫單號、來源、狀態、原始部分入庫、目前未出貨、可再出貨、待出貨、已出貨與載具資訊。
  - 異動紀錄 `work_order_partial_receipt` 顯示為中文「部分入庫」。
- 生產工單 UI 修正：
  - 修正已完成工單按「部分入庫」無反應，改為防呆提醒。
  - 修正部分入庫區塊收合箭頭、標題對齊、排程週別顯示、首件檢驗欄位高度、出貨載具欄位版面。
  - 生產紀錄欄位「機台種類」改為「機台能力」，選擇機台後自動帶出機台能力。
- 出貨 / 退貨 / workflow：
  - 補強部分入庫庫存與出貨、退貨、流程刪除守門的追溯關聯。
- 文件與版本：
  - Release note：`release-notes/2026-06-21-v3.0.5.txt`
  - 更新包：`dist/update_v3.0.5_20260621_221535.zip`
  - ZIP 已確認含 `manifest.json`，版本、檔案根目錄與 migration 清單正確。

## 3. 重要資料庫異動

- 新增 migration：
  - `migrations/2026_06_21_add_partial_receipt_control_fields.sql`
  - `migrations/2026_06_21_add_partial_receipt_shipping_tool_details_table.sql`
- schema 內容：
  - `work_orders` 新增真實短缺欄位與確認人員欄位。
  - `work_order_partial_receipts` 新增出貨載具摘要、沖銷時間、沖銷人員與沖銷原因。
  - 新增 `work_order_partial_receipt_tools`，保存每次部分入庫出貨載具快照。
  - 新增 / 補齊權限：`work_orders.partial_receipt`、`work_orders.reverse_partial_receipt`、`work_orders.confirm_shortage`。
- migration 狀態：
  - migration 具備重複執行保護。
  - `tools/sync-local-schema.ps1` 的 `$migrationChecks` 已同步包含上述兩個 migration。
  - `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`：`Applied: 20, Pending: 0`。

## 4. 待修 Bug

- P1：尚未做瀏覽器實機視覺回歸；近期多次調整工單編輯 Modal 版面，仍需人工確認桌面寬度與捲動狀態。
  - 重現條件：開啟生產工單編輯 Modal，檢查生產排程、部分入庫歷程、篩分 / 首件檢驗、生產紀錄區塊。
  - 目前推測原因：`styles.css` 中同一 modal 有多段後置覆蓋規則，局部改版容易被後段選擇器覆蓋。
- P1：更新包尚未透過系統更新介面實際套用。
  - 重現條件：到系統更新介面上傳 `dist/update_v3.0.5_20260621_221535.zip`。
  - 目前推測原因：本輪只完成打包與 ZIP manifest 驗證，尚未執行套用流程。
- P2：健康稽核仍有既有 warning。
  - `api/status_board/delete.php`、`api/status_board/update.php` 仍允許 POST fallback。
  - 多個 JS 檔案過大，`js/work_orders.js` 已超過建議上限。
  - `modules/order_items.html` 仍有既有 inline style。
  - 多個模組仍有 `status` 與 `status_lookup_id` 雙重狀態欄位。
- 工作樹注意事項：
  - `uploads/work_order_completion_images/16/wo_completion_16_20260621135028_c82c78f0.jpg` 已由使用者確認為測試資料。
  - 此檔未納入 v3.0.5 更新包，並已加入本機 `.git/info/exclude`，不應提交。

## 5. 下一步任務

- P0：
  - 提交並 push 本輪已完成的 v3.0.5 程式、migration、release note 與更新包相關檔案。
  - 透過系統更新介面實際套用 `dist/update_v3.0.5_20260621_221535.zip`，確認更新流程可用。
- P1：
  - 使用隔離測試工單回歸：部分入庫、多載具、出貨、退貨 / 取消配貨、沖銷、最終結案、真實短缺。
  - 桌面瀏覽器實測工單編輯 Modal 排版與收合行為。
  - 手機版回歸：部分入庫、工單詳情、出貨追蹤、現場圖片與生產紀錄。
- P2：
  - 清理健康稽核既有 warning。
  - 拆分過大的 `js/work_orders.js` 與相關前端模組。
  - 整理 `status` / `status_lookup_id` 雙重狀態欄位策略。

## 6. 驗證狀態

- 已執行：
  - `php -l`：本輪 PHP API 檔案全數通過。
  - `node --check`：`js/inventory_items.js`、`js/shipping_orders.js`、`js/work_orders.js`、`mobile/mobile.js`、`script.js`、`core/configs/inventory_items.config.js`、`js/data-sync.js`、`tools/audit-data-sync.js` 全數通過。
  - `node tools/validate-config-modules.js`：通過。
  - `node tools/audit-data-sync.js --write docs/data-sync-audit.md`：P0=0、P1=0、P2=10。
  - `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`：Applied 20、Pending 0。
  - `node tools/audit-system-health.js`：0 error、17 warning。
  - `tools/build-update-package.ps1`：已產生 `dist/update_v3.0.5_20260621_221535.zip`。
  - ZIP 檢查：`manifest.json` 存在，migrations 清單正確。
- 尚未驗證風險：
  - 未透過系統更新介面套用 v3.0.5。
  - 未做瀏覽器截圖 / 實機視覺回歸。
  - 未做完整端到端資料流回歸。
  - 測試上傳圖片已確認不提交；若未來需清理，請先確認 Windows 檔案權限或占用狀態。
