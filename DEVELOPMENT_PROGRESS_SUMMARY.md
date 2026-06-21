# 開發進度摘要

更新時間：2026-06-21  
目前分支：`main`  
目前 HEAD：`b2f8ce7`
目前交付版本：`v3.0.4`

## 1. 專案架構

- 目錄：
  - `api/`：PHP API、權限與流程交易。
  - `js/`：桌面版原生 JavaScript 模組。
  - `mobile/`：手機版工單入口、操作與樣式。
  - `modules/`：桌面模組 HTML。
  - `migrations/`：MySQL migration。
  - `tools/`：健康稽核、DataSync、schema 同步及更新包工具。
  - `docs/`：技術文件與開發計畫。
  - `release-notes/`、`dist/`：版本說明與一鍵更新包。
- 技術棧：PHP 8、PDO、MySQL 8、Apache、原生 JavaScript/HTML/CSS、Node.js、PowerShell。
- 本輪涉及：
  - 模組：桌面及手機生產工單、客戶管理。
  - API：工單查詢、更新、部分入庫。
  - 資料表：`work_orders`、`production_records`、`work_order_partial_receipts`、`inventory_items`、`inventory_transactions`、三類工單現場圖片表。

## 2. 已完成功能

- 工單現場圖片：
  - 桌面及手機版完工、不良品、載具狀況圖片新增刪除功能。
  - 桌面按鈕沿用系統既有表格操作樣式。
  - 刪除後發送 DataSync 通知。
- 手機生產紀錄：
  - 對齊桌面欄位：卡號、載具類型、載具重量、實際重量、日期、時間、機台、機台種類、登錄者、備註。
  - 支援預設／自行輸入模式、逐筆新增移除及頁內儲存。
  - 已完成工單仍可依桌面既有規則維護生產紀錄。
  - `mobile/index.php` 以檔案時間加入 CSS/JS cache busting。
- 客戶管理：
  - 修正重量公差呼叫不存在的 `formatNumber()`，統一使用安全百分比格式。
- 部分入庫：
  - 修正 PDO 重複命名參數造成的 `HY093 Invalid parameter number`。
  - 桌面新增部分入庫 Modal，必填本次淨重並顯示剩餘可入庫重量。
  - 僅允許進行中／暫停工單；已完成或已有正式庫存時前後端阻擋。
  - 一般與拆分工單皆檢查工單及來源機台剩餘淨重。
  - 工單查詢回傳部分入庫累計、支數與剩餘淨重。
  - 一般與拆分工單完工時皆扣除既有部分入庫，只建立剩餘最終庫存並結清紀錄。
- 開發文件：
  - `docs/partial-receipt-control-implementation-plan-2026-06-21.md`
  - `docs/partial-receipt-control-todo-2026-06-21.md`
- 資料庫：
  - 本輪無新增 migration、無 schema 異動。
- 更新包：
  - Release note：`release-notes/2026-06-21-v3.0.4.txt`
  - 更新包：`dist/update_v3.0.4_20260621_150535.zip`
  - SHA256：`20FE99869DA7F43CF8ACF29B7EE16F040749E262083611C01A2EB18FDD52949F`
  - 包含 9 個部署檔案、0 個 migration，`manifest.json` 已確認存在。

## 3. 待修 Bug

- 部分入庫完整管控尚未完成：
  - 工單尚無「預計、已生產、部分入庫、已出貨、尚在庫、最終補入、真實短缺」完整平衡卡。
  - 尚無部分入庫歷程表與合法沖銷流程。
  - 工單結案尚無短缺原因及主管覆核。
- 手機版與現場流程：
  - 尚未完成 Android／iOS 真機回歸。
  - 尚未完整驗證「部分入庫 → 出貨 → 最終結案」。
- 已知稽核債務：
  - 完整健康稽核有 17 個既有 warning。
  - DataSync 有 10 個既有 P2，P0/P1 為 0。
- 工作樹風險：
  - 未追蹤圖片 `uploads/work_order_completion_images/16/wo_completion_16_20260621135028_c82c78f0.jpg`。
  - 此檔為本機操作產生的上傳圖片，尚未確認是否應提交，禁止直接納入 `git add -A`。
- 已確認重現資料：
  - `WO-20260306-0002` 已完成且已有正式庫存 `INV-20260530-0002`，不得作為部分入庫成功測試工單。

## 4. 下一步任務

- P0：
  - 先處理未追蹤上傳圖片的提交歸屬，再提交及 push 本輪程式。
  - 依兩份部分入庫文件實作工單數量平衡卡與部分入庫歷程。
  - 建立部分入庫沖銷 API及 workflow guard；已出貨紀錄只能走退貨／沖銷。
  - 建立結案短缺確認，確保 `部分入庫 + 最終入庫 + 真實短缺 = 工單預計`。
  - 使用隔離測試工單驗證一般／拆分工單完整流程。
- P1：
  - 手機版顯示累計部分入庫、剩餘可入庫及來源機台名稱。
  - 統一「部分完工」與「部分／先行入庫」現場文案。
  - 確認部分入庫是否直接視為品保合格、支數取整規則及短缺主管核准門檻。
  - 實際透過系統更新介面套用 `v3.0.4`。
- P2：
  - 清理健康稽核 17 個既有 warning。
  - 清理 DataSync 10 個既有 P2。
  - 拆分過大的 `js/work_orders.js`、`mobile/mobile.js` 等模組。

## 5. 驗證狀態

- 已完成：
  - `node tools/audit-system-health.js`：0 error、17 個既有 warning。
  - `node tools/audit-system-health.js --changed --base origin/main`：0 new、0 blocking。
  - `node tools/validate-config-modules.js`：通過。
  - `node --check js/customers.js`
  - `node --check js/work_orders.js`
  - `node --check mobile/mobile.js`
  - `node --check js/data-sync.js`
  - `node --check tools/audit-data-sync.js`
  - `node tools/audit-data-sync.js --write docs/data-sync-audit.md`：P0=0、P1=0、P2=10。
  - `php -l api/work_orders/partial_receipt.php`
  - `php -l api/work_orders/show.php`
  - `php -l api/work_orders/update.php`
  - `php -l mobile/index.php`
  - 更新包內容、版本、migration 清單及 `manifest.json` 已驗證。
- 尚未驗證：
  - 更新包尚未透過系統更新介面實際套用。
  - 部分入庫成功、出貨、最終結案及沖銷尚未完成隔離資料回歸。
  - 手機版生產紀錄及圖片刪除尚未完成真機回歸。
  - 本輪尚未 commit/push，原因是工作樹混入尚未確認提交的上傳圖片。
