# 開發進度摘要

## 專案架構

- 專案根目錄：`C:\Apache24\htdocs\mes`
- 後端：PHP 8+ 原生 API，入口多位於 `api/**/index.php|show.php|update.php|delete.php`，共用啟動檔為 `api/bootstrap.php`。
- 前端：原生 HTML/CSS/JavaScript，由 `index.php` 載入 `script.js`、`core/configs/*.config.js`、`modules/*.html` 與 `js/*.js`。
- 資料庫：MySQL 8 / MariaDB 相容；本機測試 DB 為 `yucyuan`。軟刪除表格通常使用 `deleted_at` 與 `delete_token`。
- 主要目錄：
  - `api/`：REST-like API、系統更新、版本檢查、模組資料操作。
  - `js/`：各功能頁前端控制器。
  - `core/configs/`：配置化模組 UI 定義。
  - `modules/`：傳統或混合模式 HTML 片段。
  - `migrations/`：資料庫 schema 更新 SQL。
  - `tools/`：維運工具，包含 `build-update-package.ps1`、`audit-system-health.js`。
  - `release-notes/`：更新包摘要來源。
  - `dist/`：一鍵更新 ZIP 輸出目錄，被 Git 忽略。
- 發佈規範：一鍵更新包必須使用 `tools/build-update-package.ps1` 產出；ZIP 根目錄需包含 `manifest.json` 與 `files/`。

## 已完成功能

1. 生產工單完成生命週期鎖定
- 新增 migration：`migrations/2026_05_12_add_work_orders_completed_at.sql`。
- 新增欄位：`work_orders.completed_at`，記錄工單首次進入已完成狀態時間。
- migration 會新增 `idx_work_orders_completed_at`，並回填目前已完成與稽核紀錄中曾完成的工單。
- migration 已改成可重複執行：欄位與索引存在時不會中斷更新。
- 本機已套用 migration，確認 `id=2` 工單目前為非完成狀態但已有 `completed_at`，可覆蓋「曾完成後退回」情境。
- `api/work_orders/update.php`：工單進入完成狀態時寫入 `completed_at`；改用 `lookup_values.value_key='completed'` 判斷，不再硬依賴 `status_lookup_id=28`。
- `api/work_orders/delete.php`：只要 `completed_at` 有值，或目前狀態為完成，即回 `409` 禁止刪除。
- `api/work_orders/index.php` / `show.php`：回傳 `completed_at` 與 `lifecycle_locked` 供前端判斷。
- `api/work_orders/helpers.php`：新增工單狀態 key 判斷 helper。
- `js/work_orders.js`：已完成或曾完成工單的刪除按鈕改為 `disabled`、灰色、不可點；事件層也再次阻擋。
- `styles.css`：補強停用刪除按鈕的灰色樣式。

2. 工單刪除使用者體驗修正
- 已完成或曾完成工單的刪除按鈕不再消失，而是保留但灰化停用。
- 前端 tooltip / 警告訊息改為「此工單已進入完成或追溯流程，無法刪除」。
- 後端訊息改為「若資料需更正，請使用退回狀態或作廢流程」。

3. 每日機台檢驗下拉修正
- `js/daily_machine_inspections.js`：修正新增每日機台檢驗時機台下拉顯示 `undefined - 機台名稱`。
- 原因：API 回傳 `machine_number`，前端使用不存在的 `m.code`。
- 新增穩定 fallback：`code -> machine_code -> machine_number -> name -> 機台 {id}`。

4. 機台維修任務 400 錯誤可視化與驗證
- `js/machine_maintenance_tasks.js`：新增 `readJsonResponse()`，正確讀取 API 的 `message` 欄位。
- 新增前端必要欄位驗證：機台、任務類型、任務標題、預定開始時間、標題長度、機台 ID 格式。
- 修正 400 時只顯示「操作失敗」而看不到實際原因的問題。

5. 更新包產出
- 已產出一鍵更新包：`dist/update_v1.0.8_20260512_203903.zip`
- 版本：`v1.0.8`
- 檔案數：9
- Migrations：1
- 已檢查 ZIP 包含 `manifest.json`、`files/`、`migrations/2026_05_12_add_work_orders_completed_at.sql`。
- Release note：`release-notes/2026-05-12-v1.0.8.txt`

6. 已執行檢查
- PHP syntax checks passed：
  - `api/work_orders/delete.php`
  - `api/work_orders/helpers.php`
  - `api/work_orders/index.php`
  - `api/work_orders/show.php`
  - `api/work_orders/update.php`
- JS syntax checks passed：
  - `js/work_orders.js`
  - `js/daily_machine_inspections.js`
  - `js/machine_maintenance_tasks.js`
- MySQL 本機確認：
  - `work_orders.completed_at` 欄位存在。
  - `idx_work_orders_completed_at` 索引存在。
  - 本機已有 10 筆工單被回填追溯鎖定。
- `node tools/audit-system-health.js` 已執行，但仍因既有全專案問題失敗，非本輪新增阻塞。

## 待修 Bug

1. P0：遠端套用 `v1.0.8` 後需回歸確認工單鎖定
- 重現條件：工單進入已完成後再退回非完成狀態，嘗試刪除。
- 預期：列表刪除按鈕灰化停用；直接呼叫 delete API 回 `409`。
- 注意：遠端需套用 migration 後才有 `completed_at` 欄位。

2. P0：遠端套用 `v1.0.8` 後需確認 migration 執行
- 檢查：`work_orders.completed_at` 欄位與 `idx_work_orders_completed_at` 索引存在。
- 檢查：既有目前已完成工單與稽核可辨識曾完成工單已回填。
- 風險：若遠端 `audit_logs.details` 有非標準 JSON 或缺稽核資料，只有目前狀態為完成的工單能自動回填。

3. P1：作廢流程尚未實作
- 現況：完成或曾完成工單不可刪除，但尚無正式「作廢工單」流程。
- 建議：新增 `voided_at`、`void_reason`、`voided_by_employee_id` 或建立獨立作廢紀錄表。

4. P1：系統健康審計既有問題
- `node tools/audit-system-health.js` 仍失敗。
- 主要既有項目：大型 JS（`work_orders.js`、`order_items.js`、`shipping_orders.js`）、多個 JS innerHTML XSS 掃描警告、`status_board` 缺標準端點、部分模組 DataSync 警告、`modules/report_descriptions.html` 按鈕 class 問題。

5. P2：遠端快取與版本載入需留意
- 若遠端頁面仍載入舊版 `work_orders.js?v=...`，需重新整理或依系統更新提示刷新。
- 預期套用更新後 `api/version.php` 與前端資源版本會變動。

## 下一步任務

1. P0：遠端上傳並套用 `dist/update_v1.0.8_20260512_203903.zip`
- 使用「安全設定 > 系統更新」套用。
- 確認更新包摘要顯示 `v1.0.8`。
- 確認 ZIP 中 migration 有被執行。

2. P0：回歸測試工單刪除鎖定
- 新建工單，尚未完成且無關聯資料時可刪除。
- 工單改為已完成後刪除按鈕灰化停用。
- 已完成工單直接打 delete API 應回 `409`。
- 已完成後退回非完成狀態，刪除按鈕仍灰化停用，delete API 仍回 `409`。

3. P0：回歸測試完成狀態更新流程
- 工單從非完成改成已完成時應寫入 `completed_at`。
- 工單從已完成退回非完成時不清除 `completed_at`。
- 若選擇同步建立庫存，原既有庫存建立流程仍需正常。
- 若退回時選擇刪除庫存，原既有庫存刪除限制仍需正常。

4. P1：回歸測試每日機台檢驗
- 開啟新增每日機台檢驗。
- 機台下拉應顯示 `machine_number - name`，不可再出現 `undefined`。

5. P1：回歸測試機台維修任務
- 新增時刻意缺必填欄位，前端應顯示具體錯誤。
- 正常填寫新增/更新應成功。
- API 400 時前端應顯示後端 `message`。

6. P2：規劃工單作廢流程
- 建議新增作廢欄位或作廢紀錄表。
- 作廢應保留追溯資料、不可物理刪除，並記錄操作者與原因。

7. P2：分批處理健康審計既有項目
- 優先處理真實 XSS 風險與 `modules/report_descriptions.html` class 問題。
- 大型 JS 拆分可排後續重構，不阻擋本輪更新測試。
