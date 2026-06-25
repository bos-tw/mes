# 開發進度摘要

更新時間：2026-06-25  
目前分支：`main`  
本輪交付版本：`v3.0.13`

## 1. 專案架構

### 目錄結構

- `index.php`：正式 SPA 入口；`index.html` 僅作相容轉址。
- `modules/`：模組 HTML 畫面。
- `js/`：原生 JavaScript 模組、DataSync、跨模組 helper。
- `core/configs/`：配置型模組定義。
- `api/`：PHP API，`api/bootstrap.php` / `api/common/*` 提供權限、回應與流程守門。
- `migrations/`：MySQL/MariaDB migration。
- `tools/`：系統健康審計、配置驗證、DataSync 稽核、schema 同步、更新包建置。
- `release-notes/`、`dist/`：更新說明與一鍵更新包輸出。

### 技術棧

- Apache + PHP
- MySQL / MariaDB
- 原生 JavaScript + HTML + CSS
- PowerShell 工具鏈（schema sync、update package）

### 本輪主要涉及模組 / API / 資料表

- 模組 / 前端：
  - `rescreen_batches`
  - `work_orders`
  - `defect_history_records`
  - `return_orders`
  - `shipping_orders`
  - `inventory_items`
- API：
  - `api/rescreen_batches/helpers.php`
  - `api/rescreen_batches/update.php`
  - `api/work_orders/index.php`
  - `api/work_orders/show.php`
  - `api/defect_history_records/helpers.php`
  - `api/return_orders/helpers.php`
  - `api/shipping_orders/helpers.php`
  - `api/shipping_orders/show.php`
  - `api/inventory_items/helpers.php`
  - `api/inventory_items/show.php`
  - `api/common/workflow_guard.php`
- 資料表：
  - `rescreen_batches`
  - `rescreen_batch_items`
  - `rescreen_batch_rules`
  - `rescreen_batch_defects`
  - `rescreen_batch_production_records`
  - `inventory_item_sources`
  - 關聯追溯：`work_orders`、`inventory_items`、`shipping_orders`、`return_orders`、`production_records`

## 2. 已完成功能

### 本次新增或修改項目

- 二次篩選流程已收斂為「案件直接掛回原始工單」，不再另建 `WO-*` 二次篩選執行工單。
- 二次篩選支援三種建立入口：
  - 原始工單建立
  - 第一次篩選 / 不良紀錄建立
  - 退貨單建立
- `second_screening_reason` 已改為使用者自由輸入文字；`rescreen_type` 保留標準型態語意。
- 二次篩選案件直接保存第二輪：
  - 篩分服務不良明細
  - 生產記錄
  - 處置、人員、時間
- 二次篩選摘要欄位改為由第二輪明細自動回算：
  - `rescreen_output_good_units`
  - `rescreen_output_defect_units`
  - `rescreen_output_scrap_units`
- 原始工單編輯視窗的二次篩選追蹤區可直接展開：
  - 第二輪服務明細
  - 第二輪生產記錄
  - 案件狀態與結果
- 出貨、退貨、庫存來源鏈、不良品歷史已可追溯到二次篩選案件與原因。
- 二次篩選命名已統一，相關 plan / todo / design review 已更新為最新口徑。

### 重要資料庫異動

- 本輪新增 migration：
  - `migrations/2026_06_25_expand_second_screening_reason_length.sql`
  - `migrations/2026_06_25_add_rescreen_execution_details.sql`
  - `migrations/2026_06_25_archive_rescreen_execution_work_orders.sql`
- 目前二次篩選相關 schema 重點：
  - `rescreen_batches.second_screening_reason` 擴成可承接自由文字
  - `rescreen_batch_defects` 新增 `disposition`、`recorded_at`、`recorded_by_employee_id`
  - 新增 `rescreen_batch_production_records`
  - 清理無實際執行資料的舊 `rescreen` 類型工單，並解除 `rescreen_batches.rescreen_work_order_id` 關聯
- `tools/sync-local-schema.ps1` 的 `$migrationChecks` 已同步收錄本輪 migration。
- `sync-local-schema.ps1` 已連跑兩次，確認 migration 可重覆執行且 schema 已同步。

### 版本與更新包資訊

- Release note：`release-notes/2026-06-25-v3.0.13.txt`
- 一鍵更新包：`dist/update_v3.0.13_20260625_213337.zip`
- 打包工具：`tools/build-update-package.ps1`
- 更新包已確認包含：
  - `manifest.json`
  - 本輪指定 `-Files`
  - 本輪 3 支 migration

## 3. 待修 Bug

### 已知問題

- 尚未發現本輪二次篩選閉環的可穩定重現阻斷 bug。
- 系統健康審計仍有既有 warning，與本輪功能交付無直接阻斷，但屬待修技術債。

### 重現條件

- `api/status_board/update.php`、`api/status_board/delete.php`
  - 以 `POST` 呼叫仍可作為 `PUT/DELETE` fallback。
- `js/work_orders.js`、`js/shipping_orders.js`、`js/inventory_items.js` 等大型模組
  - 在系統健康審計中會持續出現檔案過大 warning。

### 目前推測原因

- `status_board` 仍保留舊式 HTTP 方法偽裝相容邏輯，尚未收斂為標準方法。
- 多個前端模組歷次功能疊加後未拆分，造成行數過大與維護成本偏高。

## 4. 下一步任務

### P0

- 以瀏覽器實際走完二次篩選兩條主流程：
  - 不良過多放寬標準後二篩
  - 客戶要求每批固定二篩
- 驗證原始工單、二次篩選案件、出貨、退貨、庫存來源鏈與不良品歷史的實際導頁與資料一致性。
- 在目標環境套用 `v3.0.13` 更新包，確認更新包套用、migration、登入與版本顯示正常。

### P1

- 針對二次篩選相關頁面做人工回歸：
  - modal 排版
  - 權限顯示
  - 跨分頁刷新 / DataSync
- 評估是否要為固定二次篩選建立正式需求主檔，實際接上 `source_requirement_id`。

### P2

- 處理完整系統健康審計的既有 warning。
- 拆分過大的前端模組，優先評估 `js/work_orders.js`、`js/shipping_orders.js`、`js/inventory_items.js`。

## 5. 驗證狀態

### 已執行的檢查

- `node tools/audit-system-health.js --changed --base origin/main`
  - 結果：`新增 0 / 阻擋 0`
- `node tools/audit-system-health.js`
  - 結果：`error 0 / warning 17`
- `node tools/validate-config-modules.js`
  - 通過
- `node --check`
  - `core/configs/rescreen_batches.config.js`
  - `js/defect_history_records.js`
  - `js/inventory_items.js`
  - `js/inventory_items_source_chain.js`
  - `js/rescreen_batches.js`
  - `js/return_orders.js`
  - `js/shipping_orders.js`
  - `js/work_orders.js`
  - `script.js`
- `php -l`
  - `api/common/workflow_guard.php`
  - `api/defect_history_records/helpers.php`
  - `api/inventory_items/helpers.php`
  - `api/inventory_items/show.php`
  - `api/rescreen_batches/helpers.php`
  - `api/rescreen_batches/update.php`
  - `api/return_orders/helpers.php`
  - `api/shipping_orders/helpers.php`
  - `api/shipping_orders/show.php`
  - `api/work_orders/index.php`
  - `api/work_orders/show.php`
- `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`
  - 連跑兩次皆成功，`Pending: 0`
- 更新包驗證
  - `dist/update_v3.0.13_20260625_213337.zip` 已建立
  - 已確認 zip 內含 `manifest.json`

### 尚未驗證的風險

- 尚未完成完整人工 UI / 流程回歸。
- 尚未在遠端或正式前環境實際套用更新包驗證。
- audit 的 17 個 warning 仍存在，雖非本輪新增，但後續仍需清理。
