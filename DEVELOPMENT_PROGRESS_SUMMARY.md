# 開發進度摘要

更新時間：2026-06-23  
目前分支：`main`  
最新提交：`572be93 fix: route static entrypoint to php shell`  
最新交付版本：`v3.0.9`  
最新更新包：`dist/update_v3.0.9_20260623_214404.zip`

## 1. 專案架構

- 目錄結構：
  - `api/`：PHP API、權限守門、系統更新、流程追溯端點。
  - `js/`：桌面版原生 JavaScript 模組與 DataSync。
  - `modules/`：功能 HTML 片段。
  - `core/configs/`：配置化模組定義。
  - `migrations/`：MySQL schema / data migration。
  - `tools/`：schema sync、健康稽核、DataSync 稽核、更新包打包工具。
  - `docs/`、`release-notes/`、`dist/`：計畫文件、版本說明、更新包輸出。
- 技術棧：
  - PHP 8 + PDO + MySQL 8 + Apache 24。
  - 原生 JavaScript / HTML / CSS。
  - Node.js 稽核工具。
  - PowerShell schema sync / 更新包工具。
- 本輪主要涉及模組 / API / 資料表：
  - 模組：`rescreen_batches`、`return_orders`、`work_orders`、`shipping_orders`、`defect_history_records`、`customers`、主入口。
  - API：`api/rescreen_batches/*`、`api/return_orders/*`、`api/work_orders/*`、`api/shipping_orders/*`、`api/defect_history_records/helpers.php`、`api/bootstrap.php`、`api/cache_version.php`、`api/version.php`。
  - 資料表：`rescreen_batches`、`rescreen_batch_items`、`rescreen_batch_rules`、`rescreen_batch_defects`、`inventory_item_sources`、`work_orders.source_rescreen_batch_id`、`number_sequences.seq_key = RB`。

## 2. 已完成功能

- 二次重篩第一輪已完成並已提交：
  - 新增 `rescreen_batches` 模組、側邊欄入口「二次重篩歷史紀錄」、配置檔、前端列表 / 檢視 / 編輯邏輯。
  - 新增 `api/rescreen_batches/`：列表、檢視、更新、刪除、由退貨單建立重篩案件、共用 helpers。
  - 重篩案件保存原始訂單、原始工單、退貨單、出貨單、來源庫存等追溯鏈。
  - 支援 `strict_rescreen` / `relaxed_rescreen`、規則快照、結果分流與不良來源。
- 出貨 / 退貨 / 工單 / 不良品 / 客戶載具追溯補強：
  - 退貨單可建立二次重篩案件。
  - 工單與出貨、退貨、不良品歷史的來源欄位與導頁追溯已補強。
  - 客戶載具以紀錄與客戶彙整為主，保留工單 / 出貨 / 退貨來源顯示。
- 主入口與版本偵測根治：
  - `index.php` 為唯一完整主入口；`index.html` 僅保留相容轉址頁，會轉往 `index.php` 並保留 query string / hash。
  - 修正遠端 `index.html` 固定 `data-asset-version="static-html"` 造成「系統已更新」紅色提示重整後仍反覆出現的阻斷問題。
  - `api/cache_version.php` 已加強，避免掃描暫存或權限問題導致入口快取版本失效。
  - `tools/audit-system-health.js` 已支援單一主入口策略，並新增 `INDEX 關於系統版本硬編碼`、`INDEX 靜態入口版本偵測衝突` 檢查。
  - `.github/copilot-instructions.md` 已記錄：禁止 `index.html` 保留完整 SPA 殼層或 static-html 版本值。
- 關於系統版本顯示：
  - 移除入口內硬編碼舊版本值。
  - `script.js` 改由 `system_update_logs` / `api/system_update_history.php` 載入版本；載入失敗時顯示 `未取得`。
- 重要資料庫異動：
  - 新增 migration：`migrations/2026_06_23_add_rescreen_batches_foundation.sql`。
  - `tools/sync-local-schema.ps1` 的 `$migrationChecks` 已同步。
  - migration 已修正為可重複執行，包含動態 SQL no-op 使用 `DO 0` 與 `number_sequences` RB 補資料防重入。
- 版本與更新包：
  - `v3.0.8`：二次重篩功能完整更新包，`dist/update_v3.0.8_20260623_212649.zip`，45 files + 1 migration。
  - `v3.0.9`：入口版本偵測阻斷修補包，`dist/update_v3.0.9_20260623_214404.zip`，7 files + 0 migration。
  - 最新 release note：`release-notes/2026-06-23-v3.0.9.txt`。

## 3. 待修 Bug

- 已知問題：
  - 完整健康審計仍有 17 個既有 warning。
  - `api/status_board/update.php`、`api/status_board/delete.php` 仍允許 POST fallback。
  - 多個前端 JS 檔過大，例如 `js/work_orders.js`、`js/shipping_orders.js`、`js/orders.js`。
  - 多個模組仍存在 `status` / `status_lookup_id` 雙重狀態欄位。
- 已修正但需遠端驗證：
  - `v3.0.8` 遠端若從 `index.html` 進入，紅色「系統已更新」提示會反覆顯示；`v3.0.9` 已改為轉址到 `index.php`。
- 重現條件：
  - 既有 warning：執行 `node tools/audit-system-health.js`。
  - 已修正問題：遠端舊版開啟 `https://mes.sort.com.tw/index.html`，前端 `_currentVersion` 為 `static-html`，但 `api/version.php` 回傳動態版本。
- 目前推測原因：
  - 既有 warning 來自歷史相容策略與大型前端模組累積。
  - 已修正問題來自靜態完整 SPA 入口無法注入 `api/cache_version.php` 產生的版本值。

## 4. 下一步任務

- P0
  - 遠端套用 `v3.0.9`，確認 `index.html` 會轉往 `index.php`，紅色更新提示不再反覆出現。
  - 遠端確認 `v3.0.8` 二次重篩 migration / 檔案已套用，若尚未套用需先套 `v3.0.8` 再套 `v3.0.9`。
  - 瀏覽器實測側邊欄「二次重篩歷史紀錄」、退貨單建立二次重篩案件、案件列表搜尋、詳情追溯鏈。
- P1
  - 補齊二次重篩完成後的新庫存建立、再次不良閉環與不良品歷史正式納管。
  - 補強客戶載具遺留分析與出貨 / 退貨 / 工單紀錄彙整視圖。
  - 實測二次重篩再次產生不良品後，不良品歷史紀錄的來源與回送狀態顯示。
- P2
  - 清理 `audit-system-health` 既有 warning。
  - 拆分過大的前端模組。
  - 整理 `status` / `status_lookup_id` 雙重狀態欄位策略。

## 5. 驗證狀態

- 已執行：
  - `node tools/audit-system-health.js`
  - `node tools/audit-system-health.js --changed --base origin/main`
  - `node tools/validate-config-modules.js`
  - `node --check script.js`
  - `node --check tools/audit-system-health.js`
  - `node --check js/data-sync.js`
  - `node --check tools/audit-data-sync.js`
  - `node --check js/customers.js`
  - `node --check js/defect_history_records.js`
  - `node --check js/return_orders.js`
  - `node --check js/shipping_orders.js`
  - `node --check js/shipping_quality_inspections.js`
  - `node --check js/work_orders.js`
  - `node --check js/rescreen_batches.js`
  - `php -l api/bootstrap.php`
  - `php -l api/cache_version.php`
  - `php -l api/common/workflow_guard.php`
  - `php -l api/customers/show.php`
  - `php -l api/defect_history_records/helpers.php`
  - `php -l api/number_sequences/helpers.php`
  - `php -l api/return_orders/helpers.php`
  - `php -l api/return_orders/index.php`
  - `php -l api/shipping_orders/helpers.php`
  - `php -l api/shipping_orders/show.php`
  - `php -l api/work_orders/helpers.php`
  - `php -l api/work_orders/index.php`
  - `php -l api/work_orders/show.php`
  - `php -l api/work_orders/update.php`
  - `php -l api/rescreen_batches/helpers.php`
  - `php -l api/rescreen_batches/index.php`
  - `php -l api/rescreen_batches/show.php`
  - `php -l api/rescreen_batches/update.php`
  - `php -l api/rescreen_batches/create_from_return.php`
  - `php -l api/rescreen_batches/delete.php`
  - `php -l api/system_update_history.php`
  - `node tools/audit-data-sync.js --write docs/data-sync-audit.md`：`P0=0`、`P1=0`、`P2=10`
  - `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`：`Applied: 22, Pending: 0`
  - migration 重複執行 smoke test：通過
  - `tools/build-update-package.ps1`：已產出 `v3.0.8` 與 `v3.0.9`
  - ZIP 讀取式驗證：`v3.0.8` 與 `v3.0.9` 的 `manifest.json` / files / migrations 清單均符合預期
- 尚未驗證風險：
  - 尚未在遠端主機實際套用 `v3.0.9`。
  - 尚未完成瀏覽器端完整操作回歸與列印視覺回歸。
  - 尚未完成工單 → 退貨 → 二次重篩 → 再次不良 → 後續出貨的端到端資料流實測。
