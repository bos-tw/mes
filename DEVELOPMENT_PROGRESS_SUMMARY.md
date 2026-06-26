# 開發進度摘要

更新時間：2026-06-27  
目前分支：`main`  
本輪交付版本：`v3.0.14`

## 1. 專案架構

### 目錄結構

- `index.php`：正式 SPA 入口；`index.html` 僅作相容轉址。
- `modules/`：模組 HTML 畫面。
- `js/`：原生 JavaScript 模組、DataSync、跨模組接線。
- `core/configs/`：配置型模組定義。
- `api/`：PHP API；`api/bootstrap.php` 與 `api/common/*` 提供登入、權限、回應與流程守門。
- `migrations/`：MySQL/MariaDB migration。
- `tools/`：系統健康審計、配置驗證、DataSync 稽核、schema 同步、更新包建置。
- `release-notes/`：版本更新說明。
- `dist/`：一鍵更新包輸出；更新包通常不納入 git。

### 技術棧

- Apache + PHP
- MySQL / MariaDB
- 原生 JavaScript + HTML + CSS
- PowerShell 工具鏈

### 本輪主要涉及模組 / API / 資料表

- 前端 / 模組：
  - `modules/rescreen_batches.html`
  - `js/rescreen_batches.js`
  - `js/rescreen_batches_execution.js`
  - `js/work_orders.js`
  - `core/configs/rescreen_batches.config.js`
  - `styles.css`
- API：
  - `api/rescreen_batches/helpers.php`
  - `api/rescreen_batches/index.php`
  - `api/return_orders/helpers.php`
  - `api/rescreen_batch_images/index.php`
  - `api/rescreen_batch_images/update.php`
  - `api/rescreen_batch_images/delete.php`
- 資料表：
  - `rescreen_batches`
  - `rescreen_batch_items`
  - `rescreen_batch_rules`
  - `rescreen_batch_defects`
  - `rescreen_batch_production_records`
  - `rescreen_batch_images`
  - 關聯追溯：`work_orders`、`return_orders`、`inventory_item_sources`、`inventory_items`、`shipping_orders`、`defect_history_records`

## 2. 已完成功能

### 本次新增或修改項目

- 二次篩選新增流程收斂為「必須掛回原始工單」，退貨單只作為可選追溯來源。
- 新增 / 編輯二次篩選 modal 改為工單級第二輪執行案件：
  - 來源追溯資料
  - 案件設定
  - 佐證與備註
  - 生產排程
  - 首件尺寸檢驗 (mm)
  - 二篩執行結果
  - 二次篩分服務不良明細
  - 二次篩選生產記錄
  - 現場圖片回傳
- 二次篩選詳情頁改為欄位式呈現，不再產生推論式或作文式說明。
- 新增 `js/rescreen_batches_execution.js`，負責二篩 modal 的員工 / 機台選項、排程與首件欄位回填、圖片上傳 / 刪除 / 預覽。
- 原始工單編輯 modal 的二次篩選追蹤區已補齊：
  - 第二輪排程
  - 首件檢驗摘要
  - 現場圖片數量
  - 服務明細
  - 生產記錄
  - 結果摘要與導頁入口
- 新增二次篩選現場圖片 API：
  - 上傳：`api/rescreen_batch_images/index.php`
  - 更新：`api/rescreen_batch_images/update.php`
  - 刪除：`api/rescreen_batch_images/delete.php`
- `docs/second-screening-todo-2026-06-26.md` 已全數閉合，沒有未勾選項目。
- `docs/second-screening-implementation-plan-2026-06-25.md` 已更新為二次篩選工單級第二輪執行模型最新口徑。

### 重要資料庫異動

- 新增 migration：
  - `migrations/2026_06_26_add_rescreen_work_order_execution_model.sql`
  - `migrations/2026_06_26_add_rescreen_batch_images.sql`
- `rescreen_batches` 新增工單級第二輪執行欄位：
  - `scheduled_start_date`
  - `scheduled_end_date`
  - `actual_start_date`
  - `actual_end_date`
  - `assigned_employee_id`
  - `calibration_employee_id`
  - `machine_id`
  - `quantity_to_produce`
  - `screening_speed`
  - `first_piece_*`
- 新增 `rescreen_batch_images`，用於二次篩選現場圖片回傳。
- `tools/sync-local-schema.ps1` 的 `$migrationChecks` 已同步新增兩支 migration 檢查。
- migration 已確認可重複執行：
  - 執行模型 migration 使用欄位 / index / constraint 存在檢查後再 ALTER。
  - 圖片 migration 使用 `CREATE TABLE IF NOT EXISTS`。

### 版本與更新包資訊

- Release note：`release-notes/2026-06-27-v3.0.14.txt`
- 一鍵更新包：`dist/update_v3.0.14_20260627_001143.zip`
- 打包工具：`tools/build-update-package.ps1`
- 更新包已確認：
  - 包含 `manifest.json`
  - `version_number = v3.0.14`
  - `file_version = 3.0.14`
  - 包含本輪 18 個 `-Files`
  - 包含本輪 2 個 `-Migrations`

## 3. 待修 Bug

### 已知問題

- 尚未發現本輪二次篩選閉環的穩定可重現阻斷 bug。
- 完整 `node tools/audit-system-health.js` 仍有 17 個既有 warning。

### 重現條件

- 執行 `node tools/audit-system-health.js` 會看到既有 warning：
  - `api/status_board/update.php`、`api/status_board/delete.php` 仍允許 POST 方法偽裝。
  - 多個既有前端模組行數偏大或超過建議上限。
  - `modules/order_items.html` 仍有既有 inline style warning。
  - 部分模組仍同時存在 `status` 與 `status_lookup_id`。

### 目前推測原因

- 舊 API 保留相容用 POST fallback，尚未全部收斂為標準 HTTP method。
- 多個前端模組長期累積功能，尚未拆分。
- 既有資料模型仍有歷史欄位並存情況。

## 4. 下一步任務

### P0

- 以瀏覽器實機走完二次篩選主流程：
  - 從原始工單建立固定二篩。
  - 從不良 / 退貨脈絡建立放寬二篩。
  - 編輯排程、首件、服務明細、生產記錄與現場圖片。
- 在測試或正式前環境套用 `v3.0.14` 更新包，確認一鍵更新、migration、版本顯示、登入與主要頁面載入正常。

### P1

- 針對二次篩選做人工回歸：
  - modal 固定 footer / 折疊區塊
  - 工單二篩追蹤摘要
  - 詳情頁圖片預覽
  - DataSync 跨頁刷新
- 若固定二篩需要正式規格來源，評估補 `source_requirement_id` 的需求主檔與 UI。

### P2

- 清理 `node tools/audit-system-health.js` 的既有 warning。
- 拆分大型前端模組，優先評估 `js/work_orders.js`、`js/shipping_orders.js`、`js/inventory_items.js`。

## 5. 驗證狀態

### 已執行的檢查

- `node tools/audit-system-health.js`
  - 結果：錯誤 0，warning 17。
- `node tools/audit-system-health.js --changed --base origin/main`
  - 結果：本次變更未新增審計問題。
- `node tools/validate-config-modules.js`
  - 通過。
- DataSync：
  - `node --check js/data-sync.js`
  - `node --check tools/audit-data-sync.js`
  - `node tools/audit-data-sync.js --write docs/data-sync-audit.md`
  - 結果：P0 = 0，P1 = 0，P2 = 10。
- JS syntax：
  - `node --check js/rescreen_batches.js`
  - `node --check js/rescreen_batches_execution.js`
  - `node --check js/work_orders.js`
  - `node --check core/configs/rescreen_batches.config.js`
- PHP syntax：
  - `php -l api/rescreen_batches/helpers.php`
  - `php -l api/rescreen_batches/index.php`
  - `php -l api/return_orders/helpers.php`
  - `php -l api/rescreen_batch_images/index.php`
  - `php -l api/rescreen_batch_images/update.php`
  - `php -l api/rescreen_batch_images/delete.php`
- Schema：
  - `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`
  - 結果：Applied 28，Pending 0，schema already in sync。
- 更新包：
  - 使用 `tools/build-update-package.ps1` 產出 `dist/update_v3.0.14_20260627_001143.zip`
  - 已確認 zip 內含 `manifest.json`。

### 尚未驗證的風險

- 尚未完成瀏覽器實機點擊回歸。
- 尚未在遠端或正式前環境實際套用 `v3.0.14` 更新包。
- 尚未用真實圖片檔做上傳 / 刪除實測。
- 完整健康審計的 17 個 warning 仍存在，非本輪新增但仍需後續清理。
