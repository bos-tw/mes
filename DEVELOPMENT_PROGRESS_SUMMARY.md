# 開發進度摘要

更新時間：2026-06-24  
目前分支：`main`  
最新交付版本：`v3.0.11`  
最新更新包：`dist/update_v3.0.11_20260624_204240.zip`

## 1. 專案架構

- 目錄結構：
  - `api/`：PHP API、權限守門、工單 / 出貨 / 客戶載具分析資料端點。
  - `js/`：原生 JavaScript 功能模組與前端互動邏輯。
  - `modules/`：功能頁 HTML 片段。
  - `print/`：列印版型。
  - `migrations/`：MySQL schema / data migration。
  - `tools/`：schema sync、健康稽核、DataSync 稽核、更新包打包工具。
  - `release-notes/`：一鍵更新包變更摘要。
  - `dist/`：本機更新包輸出，`dist/*.zip` 受 `.gitignore` 忽略。
- 技術棧：
  - PHP 8 + PDO + MySQL 8 + Apache 24。
  - 原生 JavaScript / HTML / CSS。
  - Node.js 稽核工具。
  - PowerShell schema sync / 更新包工具。
- 本輪主要涉及模組 / API / 資料表：
  - 模組：生產工單、出貨單列印、生產命令單列印。
  - API：`api/work_orders/show.php`。
  - 前端：`js/work_orders.js`、`modules/work_orders.html`、`styles.css`。
  - 列印：`print/shipping_order_print.html`、`print/work_order_print.html`。
  - 資料表：讀取既有 `orders.customer_id`、`order_item_tools`、`shipping_order_tool_summaries`，本輪無 schema 異動。

## 2. 已完成功能

- 本次新增或修改項目：
  - 出貨單列印主表簡化為現場指定欄位：桶號、批號、規格、料號、類別、重量、單重、數量、桶數。
  - 出貨單列印新增 `經辦` 為登入者，移除製單人員、出貨人員、不良品摘要、客戶載具摘要，並保留原表單排版風格。
  - 出貨單列印字體放大、表格標題上下 padding 微調。
  - 生產命令單 `圖面號碼` 改為當工單欄位空白時，回補訂單品項即時計算資料。
  - 生產命令單卡號列不再因最少列數補空白而誤顯卡號；`載具數量` 與實際卡號數量一致。
  - 生產工單 `指派機台` 下拉改為載入 `api/machines/index.php?perPage=100`，避免只拿到預設 10 筆。
  - 生產工單篩分服務明細欄寬調整：縮小 PPM、公差、不良品數量與備註欄，讓服務項目完整呈現。
  - 工單客戶載具遺留分析修正：`api/work_orders/show.php` 補回 `o.customer_id AS customer_id`，讓既有 `fetchCustomerToolAnalysis()` 可取得正確客戶。
  - 新增 release note：`release-notes/2026-06-24-v3.0.11.txt`，固定三筆摘要。
- 重要資料庫異動：
  - 本輪無 migration。
  - 本輪無 schema 異動。
  - 未修改 `tools/sync-local-schema.ps1` 的 `$migrationChecks`。
- 版本與更新包資訊：
  - 版本：`v3.0.11`。
  - 更新包：`dist/update_v3.0.11_20260624_204240.zip`。
  - 打包方式：使用 `tools/build-update-package.ps1`。
  - 打包檔案：`api/work_orders/show.php`、`js/work_orders.js`、`modules/work_orders.html`、`print/shipping_order_print.html`、`print/work_order_print.html`、`styles.css`、`release-notes/2026-06-24-v3.0.11.txt`。
  - migrations：0，打包時已明確傳 `-Migrations @()`。
  - 已確認 ZIP 內含 `manifest.json`。

## 3. 待修 Bug

- 已知問題：
  - 完整健康審計仍有 17 個既有 warning。
  - `api/status_board/update.php`、`api/status_board/delete.php` 仍允許 POST fallback。
  - 多個前端 JS 檔過大，例如 `js/work_orders.js`、`js/shipping_orders.js`、`js/orders.js`、`js/order_items.js`。
  - `modules/order_items.html` 仍有既有 inline style warning。
  - 多個模組仍存在 `status` / `status_lookup_id` 雙重狀態欄位。
- 重現條件：
  - 既有 warning：執行 `node tools/audit-system-health.js`。
  - 若工單客戶載具分析仍顯示無資料，需確認該客戶是否真的有 `order_item_tools` 或 `shipping_order_tool_summaries` 紀錄。
- 目前推測原因：
  - 健康審計 warning 來自歷史相容策略、大型前端模組累積與欄位過渡期設計。
  - 客戶載具分析目前仍是第一輪摘要：以訂單載具設定視為進場、出貨單載具摘要視為歸還，尚未形成正式客戶載具流水帳。

## 4. 下一步任務

- P0
  - 遠端套用 `v3.0.11`，確認更新包可正常套用且 `manifest.json` 被系統更新流程讀取。
  - 瀏覽器實測生產工單編輯視窗：指派機台完整清單、篩分服務明細欄寬、客戶載具遺留分析、圖面號碼帶入。
  - 瀏覽器或列印預覽實測出貨單與生產命令單版面。
- P1
  - 若現場需要，將客戶載具紀錄從第一輪摘要升級為獨立客戶載具總覽 / 流水帳。
  - 補齊二次重篩完成後的新庫存建立、再次不良閉環與不良品歷史正式納管。
  - 釐清工單 / 批次 / 出貨單層級的載具顯示口徑，避免只用客戶層級造成現場誤解。
- P2
  - 清理 `audit-system-health` 既有 warning。
  - 拆分過大的前端模組。
  - 整理 `status` / `status_lookup_id` 雙重狀態欄位策略。

## 5. 驗證狀態

- 已執行的檢查：
  - 初始化時已完成 `git fetch --all --prune`、`git checkout main`、`git pull --ff-only origin main`。
  - 初始化時已完成 `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`。
  - `node --check js/work_orders.js`：通過。
  - `php -l api/work_orders/show.php`：通過。
  - `node tools/audit-system-health.js --changed --base origin/main`：通過，未新增審計問題。
  - `node tools/audit-system-health.js`：通過，0 errors、17 warnings、11 infos。
  - `tools/build-update-package.ps1`：已產出 `v3.0.11` 更新包。
  - ZIP 讀取式驗證：`manifest.json` 存在，包內檔案清單符合 `-Files`。
- 尚未驗證的風險：
  - 尚未在遠端透過一鍵更新實際套用 `v3.0.11`。
  - 尚未完成瀏覽器實機回歸。
  - 尚未完成出貨單與生產命令單列印視覺確認。
  - `dist/update_v3.0.11_20260624_204240.zip` 因 `.gitignore` 規則不會進入 Git commit，需保留本機交付檔或另行上傳到遠端更新流程使用。
