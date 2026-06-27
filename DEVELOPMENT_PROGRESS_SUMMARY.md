# 開發進度摘要

更新時間：2026-06-27  
目前分支：`main`  
本輪交付版本：`v3.0.16`

## 1. 專案架構

### 目錄結構

- `index.php`：正式 SPA 入口；`index.html` 僅作相容轉址。
- `modules/`：模組 HTML 畫面，本輪修改 `modules/work_orders.html`。
- `js/`：原生 JavaScript 模組與 DataSync，本輪修改 `js/work_orders.js`、`js/data-sync.js`。
- `api/`：PHP API，本輪新增 `api/work_order_pre_production_images/`，並修改工單 API 與 workflow guard。
- `migrations/`：MySQL / MariaDB migration，本輪新增 `2026_06_27_add_work_order_pre_production_images.sql`。
- `tools/`：健康審計、DataSync 稽核、schema 同步、更新包建置，本輪修改 `tools/sync-local-schema.ps1`。
- `print/`：列印範本，本輪修改 `print/order_confirmation_print.html`。
- `release-notes/`：版本更新說明，本輪新增 `2026-06-27-v3.0.16.txt`。
- `dist/`：一鍵更新包輸出；本輪產出 `update_v3.0.16_20260627_224754.zip`。

### 技術棧

- Apache + PHP
- MySQL / MariaDB
- 原生 JavaScript + HTML + CSS
- PowerShell 工具鏈

### 本輪主要涉及模組 / API / 資料表

- 模組 / 前端：
  - `modules/work_orders.html`
  - `js/work_orders.js`
  - `styles.css`
  - `print/order_confirmation_print.html`
- API：
  - `api/work_order_pre_production_images/index.php`
  - `api/work_order_pre_production_images/update.php`
  - `api/work_order_pre_production_images/delete.php`
  - `api/work_orders/index.php`
  - `api/work_orders/show.php`
  - `api/work_orders/delete.php`
  - `api/common/workflow_guard.php`
- 資料表：
  - 新增 `work_order_pre_production_images`
  - 既有 `work_order_completion_images`
  - 既有 `work_order_defect_images`
  - 既有 `work_order_tool_condition_images`
  - 既有 `work_orders`

## 2. 已完成功能

### 本次新增或修改項目

- 新增「工單圖片附件」資料流，用於生產前隨工單提供現場人員檢視的參考圖片。
- 新增 `work_order_pre_production_images` API：
  - `GET/POST api/work_order_pre_production_images/index.php`
  - `PUT api/work_order_pre_production_images/update.php`
  - `DELETE api/work_order_pre_production_images/delete.php`
  - 欄位與行為參考現場圖片 API，並限制每張工單最多 3 張。
- 生產工單編輯 modal 新增「工單圖片附件」，並與「現場圖片回傳」以 6/6 並排。
- 工單編輯載入時回傳並渲染 `pre_production_images`。
- 工單列表圖片總數納入 `work_order_pre_production_images`。
- 工單刪除守門納入 `work_order_pre_production_images`，避免已有生產前圖片附件時誤刪。
- DataSync 新增 `work_order_pre_production_images -> work_orders`。
- 客戶光篩代工委託確認單列印範本完成：
  - 自動 A4 分頁與頁碼。
  - 修正列印越界。
  - 兩個細項可維持單頁，四個細項可分頁。
  - 移除總價列，單價上移。
  - 低於 2000 元時顯示 `單批不足量以2000元計`。
  - 修正 `總重量(含載具kg)` 標題擠壓。

### 重要資料庫異動

- 新增 migration：
  - `migrations/2026_06_27_add_work_order_pre_production_images.sql`
- 新增資料表：
  - `work_order_pre_production_images`
- 欄位：
  - `id`
  - `work_order_id`
  - `file_name`
  - `file_path`
  - `file_size`
  - `mime_type`
  - `sort_order`
  - `description`
  - `uploaded_at`
  - `deleted_at`
  - `uploaded_by_employee_id`
- FK：
  - `fk_woppi_work_order` -> `work_orders(id)`，`ON DELETE CASCADE`
  - `fk_woppi_uploaded_by_employee` -> `employees(id)`，`ON DELETE SET NULL`
- 已同步更新 `tools/sync-local-schema.ps1` 的 `$migrationChecks`。

### 版本與更新包資訊

- Release note：`release-notes/2026-06-27-v3.0.16.txt`
- 一鍵更新包：`dist/update_v3.0.16_20260627_224754.zip`
- 打包工具：`tools/build-update-package.ps1`
- 打包參數：
  - `VersionNumber = v3.0.16`
  - `FileVersion = 3.0.16`
  - `ReleaseDate = 2026-06-27`
  - `ChangeSummaryFile = release-notes/2026-06-27-v3.0.16.txt`
  - `Migrations = @('migrations/2026_06_27_add_work_order_pre_production_images.sql')`
- 更新包已確認：
  - 包含 `manifest.json`
  - 包含本輪 16 個 `-Files`
  - 包含本輪 1 個 migration

## 3. 待修 Bug

### 已知問題

- 尚未用已登入瀏覽器實機操作工單 modal 的「工單圖片附件」上傳 / 預覽 / 刪除流程。
- 尚未將 `work_order_pre_production_images` 實際渲染到 `print/work_order_print.html` 的「附件及相片」區塊。
- 完整 `node tools/audit-system-health.js` 仍有 17 個既有 warning。

### 重現條件

- 執行 `node tools/audit-system-health.js` 可重現既有 warning：
  - `api/status_board/update.php`、`api/status_board/delete.php` 允許 POST 方法偽裝。
  - 多個 JS 模組行數偏大或超過建議上限。
  - `modules/order_items.html` 有既有 inline style warning。
  - 部分模組仍同時存在 `status` 與 `status_lookup_id`。

### 目前推測原因

- 舊 API 為相容保留 POST fallback。
- 多個前端模組長期累積功能尚未拆分。
- 部分資料模型保留歷史狀態欄位。
- headless Chrome 沒有登入 session，無法完成 modal 實機回歸。

## 4. 下一步任務

### P0

- 使用已登入瀏覽器實機回歸生產工單 modal：
  - 「工單圖片附件」與「現場圖片回傳」6/6 版面正常。
  - 工單圖片附件可上傳最多 3 張。
  - 預覽與刪除正常。
  - 刪除後 DataSync / 工單圖片總數刷新正常。
- 將 `work_order_pre_production_images` 接到 `print/work_order_print.html` 的「附件及相片」區塊，顯示最多 3 張生產前參考圖片。

### P1

- 補強工單圖片附件 UI：
  - 上傳時輸入圖片說明。
  - 排序欄位或拖曳排序。
  - 圖片數量達 3 張時停用新增按鈕或顯示明確提示。
- 回歸客戶光篩代工委託確認單：
  - 2 細項單頁。
  - 4 細項分頁。
  - 低於 2000 元提示。
  - Chrome 列印預覽無橫向越界。

### P2

- 清理完整健康審計既有 17 項 warning。
- 拆分大型前端模組，優先評估 `js/work_orders.js`。
- 評估舊 `work_order_images` 與新圖片資料流的長期定位與是否需資料遷移。

## 5. 驗證狀態

### 已執行的檢查

- `node tools/audit-system-health.js`
  - 結果：錯誤 0，warning 17。
- `node tools/audit-system-health.js --changed --base origin/main`
  - 結果：新增 0，阻擋 0。
- JS syntax：
  - `node --check js/work_orders.js`
  - `node --check js/data-sync.js`
  - `node --check tools/audit-data-sync.js`
- DataSync：
  - `node tools/audit-data-sync.js --write docs/data-sync-audit.md`
  - 結果：P0 = 0，P1 = 0，P2 = 10。
- PHP syntax：
  - `php -l api/work_order_pre_production_images/index.php`
  - `php -l api/work_order_pre_production_images/update.php`
  - `php -l api/work_order_pre_production_images/delete.php`
  - `php -l api/work_orders/show.php`
  - `php -l api/work_orders/index.php`
  - `php -l api/work_orders/delete.php`
  - `php -l api/common/workflow_guard.php`
- Schema：
  - `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`
  - 結果：Applied 29，Pending 0。
  - migration 重複執行 smoke test 成功。
- 更新包：
  - 使用 `tools/build-update-package.ps1` 產出 `dist/update_v3.0.16_20260627_224754.zip`
  - 已確認 zip 內含 `manifest.json` 與本輪 migration。

### 尚未驗證的風險

- 未用已登入瀏覽器實機操作「工單圖片附件」上傳 / 預覽 / 刪除。
- 未在正式前或正式環境套用 `v3.0.16` 更新包。
- 未將新圖片附件實際印到生產命令單紙本「附件及相片」區。
- 完整健康審計的 17 個 warning 仍存在，非本輪新增。
