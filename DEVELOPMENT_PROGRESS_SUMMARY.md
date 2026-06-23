# 開發進度摘要

更新時間：2026-06-23  
目前分支：`main`  
最新已提交版本：`v3.0.8`  
最新已產出更新包：`dist/update_v3.0.8_20260623_212649.zip`  
目前未提交阻斷修復：`index.html` 靜態入口已改為轉址到 `index.php`，需重新驗證並產生新版更新包

## 1. 專案架構

- 目錄結構：
  - `api/`：PHP API、權限守門、系統更新、流程追溯端點。
  - `js/`：桌面版原生 JavaScript 模組與 DataSync。
  - `modules/`：各功能 HTML 片段。
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
  - 模組：`rescreen_batches`、`return_orders`、`work_orders`、`shipping_orders`、`defect_history_records`、`customers`。
  - API：`api/rescreen_batches/*`、`api/return_orders/*`、`api/work_orders/*`、`api/shipping_orders/*`、`api/defect_history_records/helpers.php`、`api/bootstrap.php`、`api/cache_version.php`。
  - 資料表：`rescreen_batches`、`rescreen_batch_items`、`rescreen_batch_rules`、`rescreen_batch_defects`、`inventory_item_sources`、`work_orders.source_rescreen_batch_id`、`number_sequences.seq_key = RB`。

## 2. 已完成功能

- 二次重篩第一輪可實測：
  - 新增 `rescreen_batches` 模組、側邊欄入口「二次重篩歷史紀錄」、配置檔、前端列表 / 檢視 / 編輯邏輯。
  - 新增 `api/rescreen_batches/`：列表、檢視、更新、刪除、由退貨單建立重篩案件、共用 helpers。
  - 重篩案件直接保存原始訂單、原始工單、退貨單、出貨單、來源庫存等追溯鏈。
  - 支援 `strict_rescreen` / `relaxed_rescreen`，並保留規則快照、結果分流、不良來源。
- 出貨 / 退貨 / 工單 / 不良品 / 客戶載具追溯補強：
  - 退貨單可建立二次重篩案件。
  - 工單與出貨、退貨、不良品歷史的來源欄位與導頁追溯已補強。
  - 客戶載具以紀錄與客戶彙整為主，保留工單 / 出貨 / 退貨來源顯示。
- 雙入口與權限同步修正：
  - `index.php` 為唯一完整主入口；`index.html` 已改為相容轉址頁，轉往 `index.php`。
  - 前端 `MODULE_LEGACY_PERMISSION_MAP` 與後端 `api/bootstrap.php` legacy map / alias 已同步。
  - `api/cache_version.php` 已加強，避免掃描暫存或權限問題導致入口快取版本失效。
  - 遠端 `index.html` 原本使用 `data-asset-version="static-html"`，會和 `api/version.php` 動態版本永遠不一致，導致紅色「系統已更新」提示重整後仍反覆出現；已改為單一 `index.php` 主入口策略。
- 「關於系統」版本顯示根治：
  - 移除 `index.html` / `index.php` 內硬編碼舊版本值。
  - `script.js` 改由 `system_update_logs` / `api/system_update_history.php` 載入版本；載入失敗時顯示 `未取得`。
  - `tools/audit-system-health.js` 新增 `INDEX 關於系統版本硬編碼` 與 `INDEX 靜態入口版本偵測衝突`，防止入口檔再硬編碼正式版本或 static-html 版本值。
  - `.github/copilot-instructions.md` 已記錄禁止硬編碼關於系統正式版本，以及 `index.html` 只能作轉址相容頁的規範。
- 重要資料庫異動：
  - 新增 migration：`migrations/2026_06_23_add_rescreen_batches_foundation.sql`。
  - `tools/sync-local-schema.ps1` 的 `$migrationChecks` 已同步。
  - migration 已修正為可重複執行，包含動態 SQL no-op 使用 `DO 0` 與 `number_sequences` RB 補資料防重入。
- 版本與更新包：
  - release note：`release-notes/2026-06-23-v3.0.8.txt`，只保留最新三筆。
  - 正式更新包：`dist/update_v3.0.8_20260623_212649.zip`。
  - ZIP 驗證：`manifest.json` 存在，`files/` 45 檔、migration 1 檔，無漏放 / 多放。

## 3. 待修 Bug

- 已知問題：
  - `v3.0.8` 遠端部署後，若使用者從 `index.html` 進入，紅色「系統已更新」提示會反覆顯示且立即重整無效。
  - 完整健康審計仍有 17 個既有 warning。
  - `api/status_board/update.php`、`api/status_board/delete.php` 仍允許 POST fallback。
  - 多個前端 JS 檔過大，例如 `js/work_orders.js`、`js/shipping_orders.js`、`js/orders.js`。
  - 多個模組仍存在 `status` / `status_lookup_id` 雙重狀態欄位。
- 重現條件：
  - 遠端開啟 `https://mes.sort.com.tw/index.html`，前端 `_currentVersion` 讀到 `static-html`，但 `api/version.php` 回傳更新後動態版本。
  - 執行 `node tools/audit-system-health.js`。
- 目前推測原因：
  - `index.html` 是靜態完整 SPA 入口，無法注入 `api/cache_version.php` 產生的版本值；立即重整只會重載同一個靜態入口，無法消除版本差異。
  - 歷史相容設計與大型前端模組累積，尚未分階段重構。

## 4. 下一步任務

- P0
  - 完成 `index.html` 轉址入口修正的驗證，重新產生新版更新包並部署測試。
  - 在遠端主機套用 `v3.0.8` 更新包，確認系統更新流程、migration、檔案覆蓋均成功。
  - 瀏覽器實測 `index.html` / `index.php` 入口一致性、側邊欄「二次重篩歷史紀錄」、關於系統版本顯示。
  - 實測退貨單建立二次重篩案件、案件列表搜尋、檢視追溯鏈、更新結果分流。
- P1
  - 補齊二次重篩與不良品歷史的使用者導向檢視細節，降低一般使用者閱讀追溯鏈的負擔。
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
  - `tools/build-update-package.ps1`：已產出 `v3.0.8` 更新包
  - ZIP 讀取式驗證：`manifest.json` / files / migrations 清單均符合預期
- 尚未驗證風險：
  - `index.html` 轉址到 `index.php` 的阻斷修復尚未重新打包部署到遠端。
  - 尚未在遠端主機實際套用 `v3.0.8`。
  - 尚未完成瀏覽器端完整操作回歸與列印視覺回歸。
  - 尚未完成工單 → 退貨 → 二次重篩 → 再次不良 → 後續出貨的端到端資料流實測。
