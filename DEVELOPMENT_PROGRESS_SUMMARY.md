# 開發進度摘要

更新時間：2026-06-08 19:40
目前基底 commit：`1131829`
本輪工作版本：`v2.1.1`
目前分支：`main`

## 1. 專案架構

### 目錄結構與技術棧

- 後端：PHP API，主要入口與共用初始化在 `api/bootstrap.php`。
- 前端：原生 JavaScript，模組頁面 HTML 片段位於 `modules/`，共用樣式集中在 `styles.css`。
- 資料庫：MySQL 8，migration 位於 `migrations/`，本機 schema 同步腳本位於 `tools/sync-local-schema.ps1`。
- 更新系統：更新包腳本位於 `tools/build-update-package.ps1`、`tools/build-update-package-safe.ps1`；上傳/套用 API 為 `api/system_update_*`。
- 版本資訊：`index.php` / `index.html` 內有「關於系統」顯示欄位，實際前端 cache version 由 `api/cache_version.php` 與 `index.php` 注入。

### 本輪主要涉及模組、Controller、View

- 生產工單主模組
  - Controller / API：
    - `api/work_orders/index.php`
    - `api/work_orders/show.php`
    - `api/work_orders/update.php`
    - `api/work_orders/delete.php`
    - `api/work_orders/helpers.php`
  - View：
    - `modules/work_orders.html`
  - Frontend：
    - `js/work_orders.js`
    - `styles.css`

- 版本與更新包
  - `index.php`
  - `index.html`
  - `release-notes/2026-06-08-v2.1.1.txt`
  - `docs/change-summary-2026-06-08-v2.1.1.md`

- 開發/部署輔助
  - `.github/copilot-instructions.md`
  - `tools/sync-local-schema.ps1`

### 本輪主要涉及資料表

- `work_orders`
- `production_records`
- `work_order_screening_defects`
- `order_item_drawings`
- `order_item_tools`
- 既有拆分工單相關表仍持續沿用：
  - `work_order_machine_runs`
  - `work_order_machine_defects`
  - `work_order_partial_receipts`

## 2. 已完成功能

### 本次新增或修改項目

- 一般工單編輯 modal 依稿件重整：
  - 上方摘要列改為主要顯示區。
  - `訂單詳細資訊`、`圖面附件`、`生產排程`、`篩分明細 / 首件尺寸檢驗`、`生產記錄` 重新對齊。
  - 右側 `生產統計` 改成稿件指定欄位，移除 `差值 (訂單 - 實際)` panel。

- 一般工單生產記錄補強：
  - 新增 `載具種類`、`載具重量(kg)`。
  - 支援 `預設 / 自行輸入` 雙模式。
  - 卡號依支數與載具列數自動重算。

- 圖面附件編輯流程補齊：
  - 編輯工單可載入 `order_item_drawings`。
  - 可新增 / 預覽 / 移除圖面。
  - 補上 `formatFileSize()`，修正 `Load work order data error: ReferenceError: formatFileSize is not defined`。

- 拆分工單 CSS / 版面套用一般工單結構：
  - 保留拆分機台頁籤，但 split modal section 改吃一般工單的白底卡片、標題層級與收合箭頭。
  - 拆分機台內的 `生產排程`、`篩分明細 / 生產設定`、`生產記錄` 已支援獨立收合。
  - 拆分模式保留整張工單上方摘要列；移除拆分機台內重複摘要卡。
  - 拆分模式下隱藏下方重複的全域 `生產記錄`，只保留機台內那塊。

- 拆分工單篩分服務明細修正：
  - 服務項目欄位避免擠壓重疊。
  - 備註改為可輸入。
  - 服務項目名稱改為完整單行顯示，寬度交由水平捲軸承接。

- API / DB 寫入相容調整：
  - `production_records` 新增 `production_source_mode`、`tool_name`、`tool_weight_kg` 相容讀寫。
  - 工單顯示 API 補回 `tool_details`、`drawings`。
  - 刪除工單時，`production_records` 的「有意義資料」判斷加入載具欄位。
  - 一般工單 `work_order_screening_defects` 的 `notes` 寫入補齊。

### 修改的檔案清單

- `.github/copilot-instructions.md`
- `api/work_orders/delete.php`
- `api/work_orders/helpers.php`
- `api/work_orders/index.php`
- `api/work_orders/show.php`
- `api/work_orders/update.php`
- `index.html`
- `index.php`
- `js/work_orders.js`
- `modules/work_orders.html`
- `styles.css`
- `tools/sync-local-schema.ps1`
- `migrations/2026_06_07_add_production_record_tool_fields.sql`
- `release-notes/2026-06-08-v2.1.1.txt`
- `docs/change-summary-2026-06-08-v2.1.1.md`
- `DEVELOPMENT_PROGRESS_SUMMARY.md`

### 版本號、更新包、migration

- 最新版本號：`v2.1.1`
- FileVersion：`20260608.1`
- ReleaseDate：`2026-06-08`
- 最新更新包：`dist/update_v2.1.1_*.zip`（以 `dist/` 中最新修改時間者為準）
- 包內 manifest 已驗證，檔案與本地工作區 hash 比對結果：`Mismatches=0`
- 本輪 migration：
  - `migrations/2026_06_07_add_production_record_tool_fields.sql`
- 本輪本機 schema 同步腳本已更新：
  - `tools/sync-local-schema.ps1`

## 3. 重要決策與規範

### 本輪已定稿的設計 / 資料 / 流程決策

- 一般工單與拆分工單的編輯 modal 必須共用同一套視覺語言；拆分工單只多出「拆分機台」能力，不應變成另一套 UI。
- 拆分工單完成與否，以上方整張工單摘要列為準，不以單一機台摘要卡判斷。
- 拆分工單內的資料顯示以「機台為主」，因此：
  - 拆分機台內的生產記錄保留。
  - 下方全域重複生產記錄在 split mode 隱藏。
- 圖面附件屬於 `訂單詳細資訊` 的下級內容，不是平行主區塊。
- 右側 `實際篩分後` 欄位以稿件列示為準，差值 panel 已移除。
- 生產記錄的載具資料不是裝飾欄位，而是實際寫入 DB / 更新包 / migration 要一起帶走的結構變更。

### 使用者明確要求的偏好

- 版面必須「照稿修」，不要自行擴大解讀。
- 只改指定欄位，不要說「這一類欄位」一起調。
- 能顯示的標題要完整顯示，不要截斷。
- 若某欄位的水平捲軸無法避免，優先保留名稱完整單行。
- 對話結束前才要求更新包；平時不必每輪都維護更新包。
- `DEVELOPMENT_PROGRESS_SUMMARY.md` 是交接用文件，不必每輪都寫，但本輪結束時需要覆寫成最新真實狀態。

### 下一輪不可重犯的錯誤或踩雷點

- 不要在拆分工單中保留與整張工單摘要重複的機台摘要卡。
- 不要讓 split mode 同時顯示機台內生產記錄與下方全域生產記錄。
- 不要把使用者指名的單一欄位比例變更，擴大成整類欄位一起調。
- 不要再把 `圖面附件` 做成平級主 section，它必須掛在 `訂單詳細資訊` 底下。
- 不要忽略更新包內容與工作區一致性；打包後若再改檔，必須重打包並重做 hash 比對。
- migration 的動態 no-op 仍禁止使用 `SELECT 1`，必須用 `DO 0`。

## 4. 待修 Bug

### 已知問題

- P0：`拆分工單` 仍需完整人工瀏覽器回歸，尤其是多機台切換、儲存、重新開啟後資料回填。
- P0：`一般工單` 與 `拆分工單` 共用大量 `js/work_orders.js` 狀態，仍有模式切換殘留風險。
- P1：遠端一鍵更新後，需確認 `production_records` 新欄位是否真的存在，並驗證舊資料相容顯示。
- P1：本地 `dist/` 仍存在舊的 `v2.0.13` 測試包；下一輪不要誤用，正式測試請只拿 `v2.1.1`。
- P1：`tools/build-update-package-safe.ps1` 這輪在直接 one-liner 呼叫時失敗，最後改用 `build-update-package.ps1` 明確列檔打包；safe wrapper 之後可再單獨檢查。

### 重現條件

- 拆分工單 UI 問題：
  - 開啟工單編輯 modal
  - 切到 `拆分工單`
  - 切換不同機台頁籤、展開/收合各 section、輸入生產記錄與 defect notes
  - 儲存後重新開啟確認是否完整回填

- DB 相容問題：
  - 若遠端資料庫尚未套用 `2026_06_07_add_production_record_tool_fields.sql`
  - 開啟或儲存帶有載具欄位的生產記錄時，可能出現缺欄位錯誤或資料未寫入

### 目前推測原因

- `js/work_orders.js` 已經承擔一般工單、拆分工單、部分入庫、首件尺寸、圖面附件與右側統計，狀態複雜，最容易出現 UI state 殘留。
- 遠端若套用失敗回滾、或 migration 沒完整執行，前端新欄位與後端舊 schema 會不一致。
- 更新包 safe wrapper 的失敗目前看起來像是 shell / git 參數呼叫方式問題，不像 ZIP 內容本身有缺漏。

### 尚未驗證的風險

- 遠端資料若已有半套用狀態，需確認 migration 可重複執行且不會破壞既有資料。
- 拆分工單的部分入庫與最終出貨串接，這輪未做完整情境測試。
- `order_item_drawings` 編輯儲存流程需在遠端實際驗證檔案上傳與 preview path。
- `index.php` / `index.html` 的版本號已更新為 `v2.1.1`，仍需確認遠端「關於系統」畫面會顯示最新值。

## 5. 下一步任務

### P0

- 上傳並套用 `dist/update_v2.1.1_20260608_193242.zip`
- 檢查遠端 `system_update_jobs` 最新任務：
  - `status = success`
  - `version_number = v2.1.1`
- 驗證遠端 DB：
  - `production_records.production_source_mode`
  - `production_records.tool_name`
  - `production_records.tool_weight_kg`
- 做一般工單最小回歸：
  - 開啟編輯 modal
  - 圖面附件顯示 / 預覽 / 移除 / 儲存
  - 生產記錄 `預設 / 自行輸入`
  - 右側統計同步
- 做拆分工單最小回歸：
  - 切到 `拆分工單`
  - 新增 / 切換 / 移除機台
  - 收合箭頭
  - defect notes 輸入
  - 機台內生產記錄
  - 儲存後重新開啟回填

### P1

- 檢查 `tools/build-update-package-safe.ps1` 的 git 呼叫失敗原因，讓 safe wrapper 能恢復可直接使用。
- 驗證拆分工單的部分入庫與主工單完成狀態互動。
- 驗證 `show.php` / `update.php` / `delete.php` 在舊資料與新欄位混合情境下是否穩定。
- 將遠端測試結果補回 `docs/split-work-order-implementation-plan-2026-05-31.md`

### P2

- 檢視 `js/work_orders.js` 是否需要在功能穩定後拆分狀態管理，降低一般/拆分模式互相污染。
- 補更完整的 smoke test / API 測試，至少涵蓋：
  - production records 載具欄位
  - drawings 載入/儲存
  - split machine defects notes
- 整合現場看板 / dashboard 的拆分工單統計口徑（上一版摘要仍未完成）。

## 6. 驗證狀態

### 已執行的檢查與結果

- `node --check js/work_orders.js`：通過
- `php -l api/work_orders/delete.php`：通過
- `php -l api/work_orders/helpers.php`：通過
- `php -l api/work_orders/index.php`：通過
- `php -l api/work_orders/show.php`：通過
- `php -l api/work_orders/update.php`：通過
- `git diff --check`：通過（僅有 CRLF 警告，無 diff 格式錯誤）
- `powershell -ExecutionPolicy Bypass -File .\\tools\\sync-local-schema.ps1 -DryRun`：
  - `Applied: 12, Pending: 0`
  - `Schema is already in sync.`
- `php -r "require 'api/bootstrap.php'; require 'api/system_update_common.php'; echo executeSqlMigrationFile(...)"` 套用 `migrations/2026_06_07_add_production_record_tool_fields.sql`：
  - 成功
  - 回傳 `13`
- 更新包 `dist/update_v2.1.1_*.zip`（本地最新檔）
  - manifest 驗證通過
  - 內含 14 個檔案 + 1 個 migration
  - 與目前工作區 hash 比對：`Mismatches=0`

### 未執行的檢查與原因

- 未執行完整瀏覽器人工回歸：
  - 本輪工作重點在長對話收斂、修版與最終打包
  - 尚未逐頁做一般/拆分工單完整點測
- 未執行遠端一鍵套用：
  - 需使用者上傳 `v2.1.1` 更新包後進行
- 未驗證看板 / dashboard：
  - 本輪未觸及該模組，延續為 P2
