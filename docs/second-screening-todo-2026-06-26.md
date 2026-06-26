# 二次篩選待辦清單（2026-06-26）

## 文件定位

本文件追蹤本輪「二次篩選建立流程語意修正」。既有設計與主實作口徑仍以 `docs/second-screening-implementation-plan-2026-06-25.md` 與 `docs/second-screening-design-review-2026-06-25.md` 為準。

本輪不得以最小可行版本交付；每一批修改都必須維持完整功能閉環，包含畫面、payload、後端驗證、追溯、驗證與必要文件同步。

## P0：二次篩選建立流程語意修正

本輪 DoD：使用者從工單、不良紀錄、退貨單建立二次篩選時，畫面、payload、後端驗證、追溯結果都能清楚表達「原始工單是主掛載點，退貨單只是可選追溯來源之一」。

- [x] 確認嚴格二篩與放寬二篩都必須對應原始工單。
- [x] 確認退貨單不是放寬二篩必要條件，只能作為選填追溯來源。
- [x] 重新盤點 `新增二次篩選紀錄` modal 的三種建立入口：生產工單、不良紀錄、退貨單。
- [x] 從生產工單建立時，表單主來源固定顯示原始工單，`退貨追溯來源` 保留選填。
- [x] 從不良紀錄建立時，表單固定顯示原始工單與來源不良紀錄，並要求客戶放寬標準佐證。
- [x] 從退貨單建立時，退貨單只顯示為 `退貨追溯來源`，同時必須顯示可回推的原始工單。
- [x] 若退貨來源無法回推原始工單，阻擋建立並提示資料不足。
- [x] 將 `來源與類型` 區塊改名為 `案件設定`。
- [x] 將 `案件類型` 改名為 `二次篩選標準型態`，避免與業務理由混淆。
- [x] 保留 `second_screening_reason` 為使用者輸入文字，但依入口提供合理預設值。
- [x] 工單來源預設原因為 `客戶要求固定二次篩選`。
- [x] 不良紀錄或退貨來源預設原因為 `不良過多，客戶同意放寬標準`，但不得讓退貨成為唯一語意。
- [x] 儲存 payload 必須送 `source_work_order_id`，不論嚴格二篩或放寬二篩都要對應原始工單。
- [x] 若使用者選擇 `source_return_order_id`，只作為選填追溯來源一起保存，不取代原始工單。
- [x] 後端建立 API 補強來源互斥與優先順序驗證，避免同一筆案件同時被誤判為工單主來源與退貨主來源。
- [x] 後端驗證 `relaxed_rescreen` 情境必須具備不良紀錄或明確客戶佐證。
- [x] 二次篩選詳情頁調整欄位名稱，明確區分 `原始工單`、`退貨追溯來源`、`二次篩選標準型態`、`二次篩選原因`。
- [x] 工單編輯 modal 的二次篩選追蹤區確認仍能正確導向同一筆二次篩選案件。
- [x] 退貨單詳情中的二次篩選入口確認不再讓使用者誤解退貨單是主掛載來源。

## P0：文件同步

- [x] 實作前確認本文件列出的本輪 DoD。
- [x] 若本輪調整改變設計口徑，同步更新 `docs/second-screening-implementation-plan-2026-06-25.md`。（本輪未改變既有設計口徑，依 2026-06-25 plan 落地修正。）
- [x] 實作完成後更新本文件各待辦狀態。
- [x] 若發現新缺口，補入本文件，不集中到最後補寫。

## P0：二次篩選工單級執行模型補齊

本段 DoD：二次篩選案件雖不產生新的正式 `WO-*` 工單號碼，但必須具備原始工單同等級的第二輪執行紀錄能力，包含排程、篩分明細、首件尺寸檢驗、現場圖片、生產記錄與結果追溯。

- [x] 盤點原始工單編輯 modal 的工單級資料區塊：生產排程、篩分服務明細、首件尺寸檢驗、圖面/現場圖片、生產記錄、結果摘要。
- [x] 盤點目前二次篩選案件已具備與缺失的欄位、資料表、API 與前端編輯器。
- [x] 定義二次篩選案件與原始工單的主從關係：`source_work_order_id` 為主掛載，二次篩選案件保存自己的第二輪執行資料。
- [x] 確認二次篩選案件不新增正式 `WO-*` 工單號碼，但 UI 必須以工單級執行案件呈現。
- [x] 補齊二次篩選生產排程欄位與 API：預定/實際開始結束、指派人員、校機人員、指定機台、篩選速度。
- [x] 補齊二次篩選篩分服務明細：第二輪服務項目、原標準快照、二篩標準快照、再次不良結果。
- [x] 補齊二次篩選首件尺寸檢驗 (mm) 資料模型、API 與 UI。
- [x] 補齊二次篩選現場圖片回傳與附件資料模型、API 與 UI。
- [x] 補齊二次篩選生產記錄，使其能達到原始工單生產記錄同等可用性。
- [x] 補齊二次篩選結果摘要回算邏輯，確保良品、再次不良、報廢/其他處置由第二輪明細與生產記錄一致產生。
- [x] 調整 `新增/編輯二次篩選紀錄` modal，版型比照工單編輯 modal 的工單級區塊，而不是只顯示原因與簡化明細。
- [x] 調整二次篩選詳情頁，完整呈現第二輪排程、篩分明細、首件檢驗、圖片、生產記錄與結果。
- [x] 調整工單編輯 modal 的二次篩選追蹤區，能導向並摘要呈現完整第二輪執行資料。
- [x] 補齊資料同步與追溯：出貨、退貨、庫存、不良品歷史都能回到同一筆二次篩選執行案件。
- [x] 若新增資料表或欄位，新增 migration 並同步更新 `tools/sync-local-schema.ps1` 的 `$migrationChecks`。
- [x] 更新 `docs/second-screening-implementation-plan-2026-06-25.md`，明確記錄二次篩選為工單級第二輪執行模型。
- [x] 實作完成後更新本文件各項狀態與驗證結果。

## 驗證

- [x] 修改功能前跑 `node tools/audit-system-health.js --changed --base origin/main`。
- [x] 修改功能後跑 `node tools/audit-system-health.js --changed --base origin/main`。
- [x] 若修改 `core/configs/*.config.js`，跑 `node tools/validate-config-modules.js`。
- [x] 若涉及 DataSync 或跨模組刷新，跑 `node --check js/data-sync.js`。
- [x] 若涉及 DataSync 或跨模組刷新，跑 `node --check tools/audit-data-sync.js`。
- [x] 若涉及 DataSync 或跨模組刷新，跑 `node tools/audit-data-sync.js --write docs/data-sync-audit.md`。
- [x] 若新增 migration，確認 `tools/sync-local-schema.ps1` 的 `$migrationChecks` 已更新。

本輪補充驗證：

- [x] `node --check js/rescreen_batches.js`
- [x] `node --check js/rescreen_batches_execution.js`
- [x] `php -l api/rescreen_batches/index.php`
- [x] `php -l api/rescreen_batches/helpers.php`
- [x] `php -l api/return_orders/helpers.php`
- [x] `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`
- [x] `js/rescreen_batches.js` 目前 997 行，低於 changed audit 門檻。

## 閉環狀態

- [x] 本輪 todo 已閉合，包含建立流程、工單級執行模型、圖片回傳、工單端摘要、追溯與驗證。
