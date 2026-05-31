# 開發進度摘要

更新時間：2026-05-31 17:10
目前基底 commit：0e20974
本輪工作版本：v2.0.12
目前分支：main

## 1. 專案架構

### 目錄結構與技術棧

- 後端：PHP API，位於 `api/`，共用啟動、登入、DB、稽核與錯誤處理在 `api/bootstrap.php`。
- 前端：原生 JavaScript 模組，位於 `js/`；畫面片段位於 `modules/`；共用樣式位於 `styles.css`。
- DB：MySQL 8，migration 位於 `migrations/`，本機 schema 同步腳本為 `tools/sync-local-schema.ps1`。
- 更新系統：更新包產生腳本位於 `tools/build-update-package.ps1`、`tools/build-update-package-safe.ps1`；上傳/套用 API 為 `api/system_update_upload.php`、`api/system_update_apply.php`、`api/system_update_common.php`。
- 報表/列印：報表 API 位於 `api/reports/`，列印模板位於 `print/`。
- 專案規範：`.github/copilot-instructions.md`，本輪新增 UI/tooltip/警示訊息與 `.github/skills/` 讀取規範。

### 本輪主要涉及模組、Controller、View

- 生產工單：`api/work_orders/*`、`js/work_orders.js`、`modules/work_orders.html`
- 生產工單排程：`api/work_orders/schedule_nodes.php`、`js/production_work_order_schedule.js`、`modules/production_work_order_schedule.html`
- 庫存項目：`api/inventory_items/*`、`js/inventory_items.js`
- 出貨/退貨/訂單品項刪除防呆：`api/shipping_orders/*`、`api/return_orders/delete.php`、`api/order_items/delete.php`
- 流程守門：`api/common/workflow_guard.php`
- 篩分報表：`api/reports/screening_inspection.php`、`print/screening_inspection_print.html`
- 稽核工具：`tools/audit-system-health.js`、`tools/audit-data-sync.js`

### 本輪主要涉及資料表

- `work_orders`
- `work_order_machine_runs`
- `work_order_machine_defects`
- `work_order_partial_receipts`
- `production_records`
- `inventory_items`
- `inventory_transactions`
- `shipping_order_items`
- `return_orders`
- `order_items`

## 2. 已完成功能

### 本次新增或修改項目

- 新增拆分工單資料骨架：主工單類型、機台執行明細、機台不良明細、部分入庫追蹤。
- 生產工單 Modal 新增一般/拆分工單切換；拆分工單以機台頁籤管理各機台生產履歷、排程、不良項目與生產設定。
- 拆分機台必須從 `machines` 資料表選擇，禁止幽靈機台或預設未選機台。
- 生產工單排程改支援一般工單節點 `wo:{id}` 與拆分機台節點 `mr:{id}`，同一主工單可排到多台機台。
- 部分入庫改為工單層共用入口：一般工單可直接部分入庫；拆分工單需以目前機台頁籤作來源。
- 拆分機台區移除部分入庫按鈕，只保留統計與提示，避免雙入口操作混淆。
- 拆分工單不良紀錄改為完整欄位：服務項目、公差(+)、公差(-)、PPM、不良品數量、備註。
- 一般工單與拆分工單皆移除「服務名稱(客製)」欄位，避免與服務項目重疊。
- 更新刪除/出貨/退貨/庫存相關流程守門，避免已關聯流程資料被硬刪造成追溯斷裂。
- 更新 `audit-system-health.js` 與 `audit-data-sync.js`，加入拆分工單資料結構檢查。
- 修正多處灰色/禁用按鈕缺少 tooltip 或 aria-label 的問題，並把規範寫入 `.github/copilot-instructions.md`。
- 修正 Modal 警示訊息樣式應使用系統既有 `modal-alert error/success/info` 風格。

### 修改檔案清單

- `.github/copilot-instructions.md`
- `DEVELOPMENT_PROGRESS_SUMMARY.md`
- `api/common/workflow_guard.php`
- `api/inventory_items/helpers.php`
- `api/inventory_items/index.php`
- `api/order_items/delete.php`
- `api/reports/screening_inspection.php`
- `api/return_orders/delete.php`
- `api/shipping_orders/add_item.php`
- `api/shipping_orders/delete_item.php`
- `api/work_orders/helpers.php`
- `api/work_orders/index.php`
- `api/work_orders/partial_receipt.php`
- `api/work_orders/schedule_nodes.php`
- `api/work_orders/show.php`
- `api/work_orders/update.php`
- `docs/change-summary-2026-05-31-v2.0.9.md`
- `docs/change-summary-2026-05-31-v2.0.10.md`
- `docs/change-summary-2026-05-31-v2.0.11.md`
- `docs/split-work-order-discussion-2026-05-23.md`
- `docs/split-work-order-implementation-plan-2026-05-31.md`
- `js/inventory_items.js`
- `js/order_items.js`
- `js/orders.js`
- `js/production_work_order_schedule.js`
- `js/return_orders.js`
- `js/shipping_orders.js`
- `js/utils.js`
- `js/work_orders.js`
- `migrations/2026_05_31_add_split_work_order_foundation.sql`
- `modules/production_work_order_schedule.html`
- `modules/work_orders.html`
- `print/screening_inspection_print.html`
- `styles.css`
- `tools/audit-data-sync.js`
- `tools/audit-system-health.js`
- `tools/sync-local-schema.ps1`

### 版本號、更新包、migration

- 最新可用更新包：`dist/update_v2.0.12_*.zip`，請以 `dist/` 中最新產生時間的 `v2.0.12` zip 為準。
- 最新版本號：`v2.0.12`
- FileVersion：`20260531.4`
- ReleaseDate：`2026-05-31`
- 注意：`dist/*.zip` 目前受 `.gitignore` 忽略，本次 commit 不會包含 zip 檔，但本地檔案已產生供手動上傳。
- 不要再使用：`v2.0.9`、`v2.0.10`、`v2.0.11`
- `v2.0.9` 問題：打包後 migration 又被修正，包內 migration 與工作區不一致。
- `v2.0.10` 問題：migration 內 no-op 使用 `SELECT 1`，一鍵更新器以 `PDO::exec()` 執行時可能留下未讀結果集導致套用失敗。`v2.0.11` 問題：打包後才更新本交接摘要，包內摘要不是最新。
- 最新 migration：`migrations/2026_05_31_add_split_work_order_foundation.sql`
- migration 已修正：條件式 no-op 改用 `DO 0`，且 `work_order_partial_receipts.machine_run_id` 為 nullable，支援一般工單部分入庫。

## 3. 重要決策與規範

### 已定稿設計/資料/流程決策

- 重量優先：所有流程從入料、生產到出貨都以淨重為主，支數由淨重與單支重反推。
- 載具不是核心管制對象；進貨載具與出貨載具可不同，重點是內容物淨重與可追溯數量。
- 不良欄位只記錄確認單上的篩分服務項目；多服務項目代表實際計價服務，不可自創項目。
- 部分入庫是工單共用能力，不是拆分工單專屬功能。
- 拆分工單只是多了機台來源追溯；一般工單部分入庫時 `machine_run_id` 可為 `NULL`。
- 拆分工單需所有機台完成才可結案；已完成部分可先部分入庫與出貨，但最終結清時不可重複入庫。
- 拆分機台要從機台設備管理資料表選取，不能產生幽靈機台。
- 生產工單排程是安排時間的地方；工單 Modal 只設定要生產的機台與內容，不應把排程選項做成不可操作。
- 現場操作要單一路徑、少選項、強防呆；複雜追蹤與結清由系統後台負責。

### 使用者明確偏好

- UI 必須遵循既有系統風格，不要自創 UI/UX。
- 拆分/一般工單的類型切換要做在上方頁籤，類似「依客戶/訂單選擇」與「快速搜尋」。
- 錯誤/警告訊息要遵循系統既有樣式。
- 灰色禁用按鈕也必須有可理解的 tooltip/title 與 aria-label。
- 讀取 `.github/copilot-instructions.md` 時，也必須讀取 `.github/skills/` 內容。

### 下一輪不可重犯踩雷點

- 不要把部分入庫放在拆分機台卡片內做第二入口。
- 不要讓拆分工單自動產生「未選機台 1」。
- 不要在 migration 的動態 no-op 裡使用 `SELECT 1`，一鍵更新器可能因未讀結果集失敗；請用 `DO 0`。
- 不要讓 `work_order_partial_receipts.machine_run_id` 維持 `NOT NULL`，一般工單部分入庫需要 `NULL`。
- 不要在一般/拆分篩分服務明細顯示「服務名稱(客製)」，使用者認為與服務項目重疊。
- 不要只看 ZIP 驗證通過；一鍵套用還會跑檔案覆蓋、migration、健康檢查。
- 打包後若又改檔，必須重打包並 hash 比對，避免包內內容與工作區不同。

## 4. 待修 Bug

### 已知問題

- P0：遠端需改用最新 `v2.0.12` 更新包重新上傳與套用；`v2.0.9`、`v2.0.10`、`v2.0.11` 均已棄用。
- P0：拆分工單流程尚未做完整瀏覽器人工回歸，包含建立、編輯、排程、部分入庫、出貨與最終結清。
- P1：遠端套用後需確認「關於系統」版本是否更新到 `v2.0.12`，以及 `system_update_jobs.status = success`。
- P1：現場看板與 dashboard 的拆分工單統計口徑仍未整合，本輪列為後續另案。
- P1：部分入庫、最終結清與出貨後不可刪除的防呆流程，需要真實資料情境驗證。
- P2：篩分報表已支援拆分明細，但尚未做完整列印版人工驗證。

### 重現條件與推測原因

- `v2.0.10` 一鍵套用失敗：遠端上傳通過後按一鍵套用，migration 執行到動態 no-op `SELECT 1` 後，下一條 SQL 可能報 `Cannot execute queries while other unbuffered queries are active`。
- 一般工單部分入庫若 DB 還是舊結構：`work_order_partial_receipts.machine_run_id` 若仍為 `NOT NULL`，一般工單部分入庫會無法寫入。`v2.0.12` migration 已修正。
- UI 若看起來仍是舊內容：可能是遠端仍套用 `v2.0.9/v2.0.10`、套用失敗回滾，或瀏覽器 cache 未更新。

### 尚未驗證風險

- 遠端 DB 若已有半套用狀態，需確認 migration 可重複執行。
- 更新器套用成功後的健康檢查可能仍受遠端環境檔案權限或目錄權限影響。
- 生產工單的拆分與一般模式共用大量前端狀態，仍需人工檢查切換模式後資料是否殘留。

## 5. 下一步任務

### P0

- 遠端上傳並套用最新的 `dist/update_v2.0.12_*.zip`。
- 套用後查 `system_update_jobs` 最新任務，確認 `status = success`、`version_number = v2.0.12`。
- 確認 DB 欄位：`work_order_partial_receipts.machine_run_id` 必須允許 `NULL`。
- 做一般工單最小回歸：開工單、編輯、儲存、篩分服務不良數量、部分入庫入口。
- 做拆分工單最小回歸：切拆分、選機台、新增/移除機台、填生產履歷、不良數量、儲存。

### P1

- 驗證生產工單排程：一般節點 `wo:{id}`、拆分節點 `mr:{id}`，拖拉與衝突檢查正常。
- 驗證部分入庫後庫存、出貨、刪除防呆與回溯關聯。
- 驗證最終結清：主工單完成時只補入剩餘淨重，不重複計入已部分入庫。
- 補遠端實測結果到 `docs/split-work-order-implementation-plan-2026-05-31.md`。

### P2

- 整合現場看板/dashboard 的拆分統計口徑。
- 補更完整的自動化 smoke test 或 API 測試腳本。
- 檢視 `v2.0.9/v2.0.10` 摘要檔是否需要保留，若要保留需在文件註明已棄用。

## 6. 驗證狀態

### 已執行檢查與結果

- `php -l api/work_orders/partial_receipt.php`：通過。
- `php -l api/work_orders/schedule_nodes.php`：通過。
- `php -l api/system_update_apply.php`：通過。
- `php -l api/system_update_common.php`：通過。
- `node --check js/work_orders.js`：通過。
- 本地執行 `executeSqlMigrationFile()` 套用 `migrations/2026_05_31_add_split_work_order_foundation.sql`：成功，回報 57 條語句。
- 本地確認 `work_order_partial_receipts.machine_run_id` 已可為 `NULL`。
- `v2.0.12` 更新包 manifest 檢查：版本 `v2.0.12`、FileVersion `20260531.4`、37 個檔案、1 個 migration。
- `v2.0.12` 更新包內容與本地工作區 hash 比對：已通過，`Mismatches=0`。

### 未執行檢查與原因

- 未在遠端成功套用 `v2.0.12`：需使用者上傳最新包後執行。
- 未做完整瀏覽器人工回歸：本輪已到對話收斂與打包階段。
- 未驗證現場看板/dashboard：本輪列為 P2/另案。
- 未提交 `dist/update_v2.0.12_*.zip`：`dist/*.zip` 受 `.gitignore` 忽略；更新包已存在於本地 `dist/` 供手動上傳。

