# 拆分工單實作追蹤計畫（2026-05-31）

## 目標

- 支援單一生產工單臨時或預先拆分到多台機台趕工。
- 現場操作維持簡單：依頁籤填機台、重量、不良項目、完成/入庫。
- 系統負責重量防呆、工單層部分入庫追蹤、最終結清與流程追溯。

## 最新狀態（2026-05-31）

- 程式面狀態：Phase 1 到 Phase 5 已完成。
- 口徑調整：部分入庫入口已改為工單層單一路徑（一般/拆分共用），拆分機台區僅保留來源與統計資訊。
- 驗證狀態：已完成 PHP/JS 語法檢查、schema DryRun、DataSync 拆分工單檢查；尚未完成瀏覽器人工情境回歸。
- 發包狀態：尚未建立一鍵更新包，既有 `dist/update_v2.0.8_20260530_221737.zip` 不包含本計畫成果。
- Git 狀態：本計畫相關程式仍在工作區，尚未 commit、尚未 push。
- 後續邊界：現場看板與儀表板的拆分工單統計口徑尚未整合，已列為另案。

## 影響頁面模組

| 模組 | 檔案 | 修改目的 | 驗證重點 | 狀態 |
|------|------|----------|----------|------|
| 生產工單 | `modules/work_orders.html`, `js/work_orders.js`, `api/work_orders/*` | 新增一般/拆分模式、機台 TAB、重量優先統計、不良項目必填、工單共用部分入庫入口 | 單機台可臨時改多機台；合計淨重不可超過主工單；0 不良需明確保存 | 已完成，待瀏覽器情境驗證 |
| 生產工單排程 | `modules/production_work_order_schedule.html`, `js/production_work_order_schedule.js`, `api/work_orders/*` | 以機台執行明細排程，而非只排主工單 `machine_id` | 同一主工單可出現在多台機台；拖拉排序更新明細；衝突檢查以機台明細為單位 | 已完成，待瀏覽器情境驗證 |
| 庫存項目 | `js/inventory_items.js`, `api/inventory_items/*` | 顯示部分完工入庫/最終入庫狀態，避免與完整入庫混淆 | 部分入庫可出貨但需標示；結清後不重複計庫存 | 已完成，待瀏覽器情境驗證 |
| 庫存異動 | `api/inventory_transactions/*`, `js/inventory_transactions.js` | 記錄部分入庫、最終補入、沖抵/結清追蹤 | 每筆庫存變動可追到工單與機台明細 | 已完成，待資料情境驗證 |
| 出貨單/出貨項目 | `js/shipping_orders.js`, `api/shipping_orders/*` | 允許選用部分完工入庫庫存出貨 | 不可超出有效在庫；出貨後禁止刪除來源機台明細 | 已完成，待瀏覽器情境驗證 |
| 報表/現場看板 | `api/reports/*`, `status_board.*`, `api/dashboard/*` | 拆分工單統計與排程顯示口徑一致 | 主工單彙總與機台明細可互相回推 | 篩分報表已完成，現場看板/儀表板待另案整合 |

## 新增資料結構

| 資料表/欄位 | 用途 | 狀態 |
|-------------|------|------|
| `work_orders.work_order_type` | `normal` / `split`，判斷 UI 與流程模式 | 已完成 |
| `work_order_machine_runs` | 每個機台頁籤/排程節點一筆，記錄機台、時間、淨重、換算支數、狀態 | 已完成 |
| `work_order_machine_defects` | 每個機台明細的不良項目，來源限定確認單上的篩分服務項目 | 已完成 |
| `work_order_partial_receipts` | 部分完工入庫追蹤（工單主關聯，拆分時可帶機台明細來源）與庫存項目 | 已完成 |
| `inventory_items.receipt_type` | 標示 `standard` / `partial` / `final` 等入庫類型 | 已完成 |

## 分階段執行

### Phase 1：資料骨架與規範

- [x] 定案重量優先、服務項目、不超重與現場簡化原則。
- [x] 建立 migration：主工單類型、機台明細、不良明細、部分入庫追蹤、庫存入庫類型。
- [x] 更新 `tools/sync-local-schema.ps1` migration 檢查。
- [x] 本機同步 schema 並驗證可重複執行。

### Phase 2：生產工單 UI 與 API

- [x] API 讀取基礎：列表回傳工單類型/拆分統計，單筆回傳機台明細與機台不良項目。
- [x] 工單編輯 Modal 增加一般/拆分模式切換。
- [x] 拆分模式新增機台 TAB，可由單機台臨時升級。
- [x] 儲存機台明細與不良項目，0 不良必填。
- [x] 重量防呆：機台合計淨重不得超過主工單預期內容物淨重。
- [x] 部分入庫入口：工單共用（一般/拆分皆可）；拆分工單需指定已完成機台來源。

### Phase 3：生產工單排程

- [x] 待排程區支援拆分工單標籤與已排程機台數。
- [x] 拆分工單在排程列表使用直覺色彩標示，與一般工單視覺區隔。
- [x] 機台排程列表改以 `work_order_machine_runs` 顯示。
- [x] 同一主工單可拖拉到多台機台，不互相覆蓋。
- [x] 排程衝突檢查以機台明細為單位。

Phase 3 實作摘要：

- 新增 `api/work_orders/schedule_nodes.php`，統一輸出一般工單節點 `wo:{id}` 與拆分機台節點 `mr:{id}`。
- `js/production_work_order_schedule.js` 已改用 `node_key` 讀寫排程、拖拉、移回待排程、Modal 儲存與衝突檢查。
- 待排程、機台排程、生產時間、機台排程狀態展開明細皆會保留拆分工單標籤與色彩。
- 同一主工單拆成多台機台時，各機台明細可獨立排程，不再互相覆蓋主工單 `machine_id`。

### Phase 4：庫存、出貨與結清

- [x] 部分完工入庫建立庫存並標示 `partial`。
- [x] 部分入庫以工單為主流程，拆分工單僅增加來源機台追溯維度。
- [x] 出貨可選部分完工入庫庫存，但不得超出有效在庫。
- [x] 主工單全數完成時只補入剩餘淨重，並結清部分入庫紀錄。
- [x] 已部分入庫的機台明細不可硬刪或整批重建。
- [x] 已出貨的機台明細不可硬刪。

### Phase 5：報表與稽核

- [x] 篩分報表支援主工單總表與機台分頁明細。
- [x] audit log 記錄一般轉拆分、增減機台、部分入庫與最終結清。
- [x] `audit-system-health.js` / `audit-data-sync.js` 增加新資料結構檢查。

Phase 5 實作摘要：

- 篩分報表 API 已回傳拆分機台明細、不良項目與部分入庫摘要。
- 列印頁已顯示主工單彙總與機台明細表。
- `audit-system-health.js` 已加入 `SWO-1` 拆分工單檢查。
- `audit-data-sync.js` 已加入 `Split work order DataSync review`，目前結果為 OK。

## 已執行驗證

- `php -l api\work_orders\update.php`：通過。
- `php -l api\work_orders\schedule_nodes.php`：通過。
- `php -l api\work_orders\partial_receipt.php`：通過。
- `php -l api\reports\screening_inspection.php`：通過。
- `node --check js\production_work_order_schedule.js`：通過。
- `node --check js\work_orders.js`：通過。
- `node --check tools\audit-system-health.js`：通過。
- `node --check tools\audit-data-sync.js`：通過。
- `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1 -DryRun`：Applied 11、Pending 0。
- `node tools\audit-data-sync.js`：P0:0、P1:0、P2:10，`Split work order DataSync review: OK`。
- `node tools\audit-system-health.js`：`SWO-1` 與 `WF-1` 已執行；整體仍因既有 F-1/J-2/M-1/DS-1/D-3 歷史問題失敗。

## 必測情境

- 單機台工單照舊建立、排程、完成、入庫。
- 單機台工單臨時新增第二台機台，原資料保留且轉換紀錄存在。
- 某機台 0 不良可保存，空白不良會被阻擋。
- 機台合計淨重超過主工單預期淨重時硬阻擋。
- 一般工單可直接部分入庫並出貨，主工單仍未結案。
- 拆分工單可指定已完成機台來源做部分入庫並出貨，主工單仍未結案。
- 主工單全數完成時只補入剩餘淨重，不重複計入部分入庫。
- 生產工單排程同時顯示同一主工單在多台機台上的排程節點。
- 拆分工單在待排程、機台排程、生產時間與機台排程狀態中具備一致色彩與標籤提示。
