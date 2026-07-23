# MES Development Progress Summary

更新日期：2026-07-23

## 本輪交付結果

- 本輪開始 commit 與遠端基線均為 `a17c91e6489300ce29e2319bc05a6edd35690127`，分支為 `main`；初始化工作樹內的變更均為前段已確認需求及本輪延續項目，沒有執行 reset、restore、stash、強制 checkout 或歷史改寫。
- 訂單主表「預訂交期」維持使用者自行輸入；`order_items.expected_delivery_date`／`expected_delivery_period` 成為每筆訂單細項及其生產工單的交期權威來源，搜尋、預填、Modal、報表、CSV 與列印已同步。
- 訂單主表展開細項與客戶批號頁面的「轉為工單」均沿用 `window.openWorkOrderFromOrderItem(orderItemId)`，與生產工單頁面「新增工單」共用同一 Modal、來源映射、驗證及建立交易，不形成另一種工單類型。
- 新增工單只建立來源、排程、機台與篩分服務規劃；後端會拒絕在建立階段送入卡號實秤、首件結果、不良數量或生產實績。編輯工單則進入正式製程執行，不再依賴一般／拆分工單切換。
- 編輯 Modal 已收斂為「工單設定／生產與篩分／二次篩分（有轉流才顯示）／庫存與結案／交辦與備註」；階段與平行機台沿用既有 `.work-order-screening-stage-tabs`、`.split-machine-tabs`、`.op-action-btn`、共用 token、`data-action` 與鍵盤操作契約。
- 正式製程機台規劃改為 `.form-grid.form-grid-four-columns` 緊湊並排，備註維持滿列；卡號、首件、機台結果與轉流歷程依需要展開，草稿結果會自動展開。正式製程內的欄位、階段容器與展開面板均使用直角，並移除編輯工單外層表單中的無效巢狀 `<form>`，各儲存操作改由明確 `data-flow-action` 處理。

## 正式生產與篩分流程

- 新增 `work_order_stages`、階段服務快照、圖片要求快照、機台結果、結果圖片、機台進／出料載具、不良包袋、階段轉流、庫存包袋與出貨包袋關聯等正式資料模型。
- 每張工單建立一個一般「生產與篩分」階段，階段下可加開多台平行機台；機台 ID 穩定保存，不以刪除重建方式同步。每台機台獨立保存排程、人員、投入量、進料載具、卡號、首件多輪次、篩分明細、結果、圖片、出料載具與包袋。
- 卡號保留「依生管預設」與「現場自行輸入」兩種來源；依載具及預計支數累計產生參考號。現場秤重後保存實際毛重、載具皮重快照及內容物淨重，已實秤卡號鎖定，後續只重算未完成卡號。
- 機台完成結果同時保存機台畫面原始不良支數（例如 100）、不良品實秤淨重、單支重快照、後端 `PHP_ROUND_HALF_UP` 換算入庫支數（例如 99）及差異；既有主檔單支重日後修改不影響歷史結果。
- 圖片依「訂單細項覆寫 → 客戶預設 → 系統選填」建立工單／階段快照；選填可缺圖正常完成，必填則依圖片類型與最低張數由後端阻擋。
- 一般篩分良品可直接入庫或以「第二道工序」進入二次篩分；一般篩分不良品可直接入庫或以「放寬標準」進入二次篩分。兩種二次篩分可並存，分別保存來源品質、規格、原因／佐證、機台、結果及轉流，不把良品誤建為不良重篩。

## 庫存、包裝與出貨閉環

- 終點轉流才建立庫存，中間轉流不重複入庫；同一來源結果與品質具有防重及冪等守門。
- 良品庫存以實際出料載具管理，支援沿用、更換及混合載具；不良品庫存以實秤換算支數及包／袋管理，塑膠袋重量固定不列入內容物重量。
- 庫存列表、詳細追溯與 CSV 已增加良品／不良品類別、支數、袋數、重量、來源階段／機台／結果、原始 100、入庫 99、圖片與載具資訊。
- 出貨可混合良品、不良品及空載具；不良品必須選擇完整實際包袋且出貨支數須等於袋內支數。完成出貨會同步扣除支數、袋數及載具，撤銷則完整恢復，已出貨庫存會阻擋上游結果或轉流撤銷。

## 報表、列印、CSV 與 DataSync

- 篩分檢驗報表及列印已接入正式製程，顯示階段、機台、兩種二次篩分、100／99、實秤重量、單支重快照、圖片要求與圖片、轉流、出料載具及包袋。
- 工單列印改讀正式階段與機台資料；庫存、出貨列印同步區分良品／不良品，顯示實際載具及 `99支／N袋`。
- 新增 `api/work_orders/export.php`，現有「批次匯出」改為後端正式 CSV；每列對應工單／階段／機台／結果版本，包含規格、放寬佐證、卡號實秤、100／99、圖片、轉流、載具與包袋。
- DataSync 已加入階段、機台結果、轉流、結果圖片、庫存包袋及出貨包袋事件與依賴；audit 結果為 P0/P1/P2 皆 0。

## Migration 與 schema

- `migrations/2026_07_22_add_order_item_expected_delivery.sql`：加入訂單細項交期欄位、回填及索引。
- `migrations/2026_07_23_add_work_order_production_flow.sql`：加入正式製程、圖片快照、100／99、載具、包袋、轉流、庫存與出貨關聯；條件式 DDL 使用 PDO 更新器可執行的 `PREPARE/EXECUTE` 與 `DO 0`，不含 `DELIMITER` 或 stored procedure。
- 兩支 migration 均已由正式 PDO 更新路徑連續執行兩次；最終 schema sync 為 Applied 42、Pending 0，`tools/schema-contract.json` 已同步至 106 個資料表。

## 驗證狀態

- 變更範圍 PHP lint：39 檔通過；JavaScript `node --check`：19 檔通過。
- `node tools/test-audit-system.js`：完整 audit 測試組通過，包含工單頁籤、製程契約、訂單細項交期及既有回歸。
- `php tools/test-work-order-production-flow.php`：資料庫整合回歸 24 assertions 通過，測試交易已 rollback。
- `php tools/test-work-order-migrations.php`：以隔離的舊 schema／舊資料情境及正式 PDO SQL 分割路徑通過；7/22 migration 完整執行兩次並回填 21 筆，7/23 migration 部分執行 36 statements 後完整重試 208 statements、再完整重跑一次均成功，回填 3 個工單階段，臨時資料庫已移除。
- `php tools/test-p0-workflow-integrity.php`：P0 權限、出貨狀態機、退貨與庫存配置 35 assertions 通過，資料庫測試交易已 rollback。
- 工單正式 CSV 已使用本機真實工單執行登入權限與 SQL smoke test，成功輸出階段／機台資料。
- `node tools/audit-system-health.js --changed --base origin/main`：新增 0、阻擋 0、已解決 4；13 項均為既有大型 JavaScript warning。
- `node tools/validate-config-modules.js`：通過；`node tools/audit-data-sync.js`：P0/P1/P2 皆 0；`git diff --check`：通過。
- Apache 根頁與 `modules/work_orders.html` 均可由本機 HTTP 取得；工單 show／flow、篩分報表、庫存 show、出貨 show／pending 已完成帶登入狀態的同程序 API smoke test。
- 實機截圖發現混合模式先載入製程擴充腳本、後注入 Modal，導致擴充腳本首次找不到製程容器而提前結束；已改為可重入的 `initializeWorkOrderProductionFlow()`，並由工單主模組在 Modal 注入完成後明確啟動。截圖工單 `WO-20260718-0001` 已確認具有 1 個一般階段及 1 台機台，排除資料缺失。
- 第二次實機截圖顯示機台規劃被排成單欄；根因是動態製程在既有編輯表單內建立巢狀 `<form>`，瀏覽器忽略內層四欄容器。已改為合法 grid 區塊、直角欄位與按需展開面板，並新增契約測試阻擋巢狀表單回歸。
- 瀏覽器控制環境沒有可用實例，無法執行自動化視覺回放；使用者已於 2026-07-23 實機確認最新四欄緊湊排列、直角欄位與按需展開版面之視覺驗收通過。

## 發布與 Git 交接

- 版本：`v3.1.9`；release note：`release-notes/2026-07-23-v3.1.9.txt`（固定 3 行）。
- 最終更新包：`dist/update_v3.1.9_20260723_210547.zip`；57 個正式執行期檔案、2 支 migration、0 刪除檔案。
- 最終包已通過官方 `tools/verify-update-package.ps1`、正式更新器 `parseSystemUpdateManifestFromZip()`、57 個執行期檔案及 2 支 migration 的逐檔 SHA-256 比對（0 missing、0 extra、0 mismatch）；migration 順序為細項交期後正式製程。
- 最終包 SHA-256：`BAA16F1A75B16D8B494CCFE24679E6AB9FEAFB14E8EC9C3FA350BE5300362A9F`。先前候選包保留供追溯，不得取代本次最終交付包。
- Git 收尾範圍共 73 個已確認檔案（52 修改、21 新增、0 刪除），均屬本輪需求、驗證與交付文件；以單次提交 `feat: 完成生產工單正式製程與庫存出貨閉環` 納入，既有 `v3.1.8` release note 與更新包未被改寫。

## 殘餘驗收

- UI 自動化視覺回放仍因沒有可用瀏覽器實例而無法執行；最新畫面已由使用者實機視覺驗收通過。後續正式環境操作仍應持續觀察：加開機台、預設／自行輸入卡號、實秤鎖定、多輪首件、100／99、選填／必填圖片、兩種二次篩分、良／不良入庫、混合出貨及撤銷恢復。
