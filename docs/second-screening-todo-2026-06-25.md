# 二次篩選待辦清單（2026-06-25）

## 使用方式

本文件是二次篩選的主要追蹤清單。實作設計請看 `docs/second-screening-implementation-plan-2026-06-25.md`。

每輪開工前先選定一段完整功能閉環；可以分批施工，但不可用「最小可行版本」作為交付標準。完成後更新本清單，必要時同步補充 plan。

## P0：設計與文件收斂

- [x] 重新定義二次篩選：同一模組支援異常後放寬標準重篩與客戶要求固定二次篩選。
- [x] 確認退貨單不是唯一入口，只是來源之一。
- [x] 確認生產工單必須能直接顯示二次篩選狀態、原因、案件編號與結果。
- [x] 建立二次篩選專用 plan。
- [x] 建立二次篩選專用 todo。
- [x] 記錄實作規範：不再以最小可行版本為交付標準，每次實作都必須朝完整功能閉環推進。
- [x] 將舊文件中仍容易誤導的「二次重篩」段落補上導向本文件的說明。

## P0：資料模型

- [x] 調整 `rescreen_batches` 語意：由「退貨後二次重篩」改為「二次篩選案件」。
- [x] 新增 `second_screening_reason` 欄位。
- [x] `second_screening_reason` 改為使用者自行輸入文字，`rescreen_type` 保留嚴格 / 放寬標準型態。
- [x] 定義 `relaxed_after_high_defect` 驗證規則。
- [x] 定義 `customer_required_second_pass` 驗證規則。
- [x] 補 `customer_approval_reference` 或等價欄位，用於客戶同意放寬標準。
- [x] 補 `source_requirement_id` 或等價欄位，用於客戶/訂單固定二次篩選要求。
- [x] 檢查 `source_work_order_id` 是否足夠代表原始生產工單。
- [x] 若新增 migration，同步更新 `tools/sync-local-schema.ps1` 的 `$migrationChecks`。

## P0：API 與建立流程

- [x] 允許從生產工單建立二次篩選案件。
- [x] 允許從第一次篩選結果或不良紀錄建立二次篩選案件。
- [x] 保留從退貨單建立二次篩選案件，但改成來源之一。
- [x] 建立二次篩選案件時依 `second_screening_reason` 驗證必要欄位。
- [x] 避免同一批貨重複建立多筆有效二次篩選案件。
- [x] 建立後直接掛回原始工單，不另行產生獨立 `WO-*` 二次篩選工單。

## P0：工單端追蹤

- [x] 工單列表顯示是否有二次篩選。
- [x] 工單列表顯示二次篩選原因。
- [x] 工單詳情/編輯 API 回傳二次篩選案件編號。
- [x] 工單詳情/編輯 API 回傳關聯二次篩選案件與結果摘要，不依賴獨立執行工單。
- [x] 工單詳情/編輯 API 回傳二次篩選結果摘要。
- [x] 工單端提供二次篩選詳情導頁。
- [x] 原始工單可直接列出並導向關聯二次篩選案件，不再產生獨立二篩工單導頁。
- [x] 工單編輯 modal 內新增可視化二次篩選摘要區。
- [x] 工單編輯 modal 的二次篩選追蹤卡直接展開第二輪服務明細與生產記錄內容，不只顯示筆數。

## P0：二次篩選紀錄

- [x] 二次篩選案件直接保存第二輪篩分服務明細不良結果，不再只依賴摘要欄位。
- [x] 二次篩選案件直接保存第二輪生產記錄，不再借用獨立 `WO-*` 二篩工單。
- [x] 二次篩選摘要改由第二輪服務明細與生產記錄自動回算，不再依賴手填。
- [x] 二次篩選詳情頁顯示第二次篩選服務明細。
- [x] 二次篩選詳情頁顯示原標準快照。
- [x] 二次篩選詳情頁顯示第二次篩選標準快照。
- [x] 二次篩選詳情頁顯示各服務再次不良數量。
- [x] 二次篩選詳情頁顯示良品數、再次不良數、報廢/其他處置數。
- [x] 二次篩選詳情頁顯示測量/篩選人員與時間。
- [x] 放寬標準重篩時，清楚顯示客戶同意依據。

## P1：結果與追溯

- [x] 二次篩選完成後同步回寫結果摘要。
- [x] 二次篩選後新庫存寫入來源鏈。
- [x] 二次篩選再次不良納入不良品歷史。
- [x] 不良品歷史顯示二次篩選理由與案件編號。
- [x] 原始工單摘要區直接顯示第二輪篩分服務明細與生產記錄。
- [x] 出貨流程可追溯二次篩選來源。
- [x] 退貨流程可追溯二次篩選來源。
- [x] 庫存詳情可追溯二次篩選來源鏈。

## P1：UI 命名與導覽

- [x] 側邊欄名稱從「二次重篩歷史紀錄」調整為「二次篩選紀錄」。
- [x] 模組標題與按鈕文案統一使用「二次篩選」。
- [x] 保留必要的「重篩」字眼在放寬標準情境中，但不可作為整個模組名稱。
- [x] 篩選條件可依二次篩選理由查詢。
- [x] 詳情頁時間線區分來源理由、原始工單與二次篩選案件。

## 驗證

- [x] 功能模組修改前跑 `node tools/audit-system-health.js --changed --base origin/main`。
- [x] 功能模組修改後跑 `node tools/audit-system-health.js --changed --base origin/main`。
- [x] 若修改配置型模組，跑 `node tools/validate-config-modules.js`。
- [x] 若涉及 DataSync，跑 `node --check js/data-sync.js`。
- [x] 若涉及 DataSync，跑 `node --check tools/audit-data-sync.js`。
- [x] 若涉及 DataSync，跑 `node tools/audit-data-sync.js --write docs/data-sync-audit.md`。
- [x] 若新增 migration，確認 `tools/sync-local-schema.ps1` 的 `$migrationChecks` 已更新。

本輪補充驗證：

- [x] `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`
- [x] `php -l`：`api/rescreen_batches/helpers.php`、`index.php`、`update.php`、`create_from_return.php`、`api/work_orders/index.php`、`api/work_orders/show.php`
- [x] `node --check`：`js/rescreen_batches.js`、`js/work_orders.js`、`core/configs/rescreen_batches.config.js`、`core/configs/work_orders.config.js`
- [x] `php -l`：`api/common/workflow_guard.php`
- [x] `php -l`：`api/defect_history_records/helpers.php`
- [x] `php -l`：`api/return_orders/helpers.php`
- [x] `php -l`：`api/shipping_orders/helpers.php`
- [x] `php -l`：`api/shipping_orders/show.php`
- [x] `php -l`：`api/inventory_items/helpers.php`
- [x] `php -l`：`api/inventory_items/show.php`
- [x] `node --check`：`js/return_orders.js`
- [x] `node --check`：`js/defect_history_records.js`
- [x] `node --check`：`js/shipping_orders.js`
- [x] `node --check`：`js/inventory_items.js`
- [x] `node --check`：`js/inventory_items_source_chain.js`
