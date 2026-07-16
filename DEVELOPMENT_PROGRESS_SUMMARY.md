# DEVELOPMENT_PROGRESS_SUMMARY

## 1. 專案架構

- 專案根目錄：`C:\Apache24\htdocs\mes`
- 本輪基線：`main` / `067624a`
- 技術棧：PHP 8.4 API、MySQL 8、原生 JavaScript、配置型模組、PowerShell schema 工具
- 本輪完成範圍：P0、P1 與 P2；P2 主要範圍如下：
  - 前端資產：`core/module-assets.js` 按需載入，入口 10 支／約 229 KiB，並有 CI 預算守門
  - 工作區：流程導向側邊欄、搜尋、收藏、Dashboard 工作佇列；已移除低價值的最近使用與固定流程捷徑
  - 工單 UX：六階段工作區及 `js/work-orders/` API、狀態機、渲染子模組
  - 回饋與設計系統：`core/feedback.js`、SRI、ARIA modal、419 項 token 轉換及五層 CSS
- P1 主要範圍如下：
  - 工單狀態單一真實來源與共用狀態機：`api/common/workflow_state_machine.php`、訂單／工單／出退貨更新端點
  - 庫存來源鏈：`api/inventory_items/helpers.php`、工單入庫、退貨品項、二次篩選與歷史回填 migration
  - 稽核治理：操作日誌唯讀、資料庫不可變 trigger、Domain Event Outbox 正式模組下架
  - 測試與 CI：Composer PSR-4、隔離 `_test` schema、PHPUnit、GitHub Actions
  - ID 策略：17 個高風險資料表改由 MySQL `AUTO_INCREMENT` 配號
- P0 範圍：
  - 權限：`api/bootstrap.php`、`script.js`
  - 出貨狀態與庫存：`api/shipping_orders/`、`api/common/workflow_guard.php`、`js/shipping_orders.js`
  - 退貨單／品項：`api/return_orders/`、`api/return_order_items/`、`js/return_orders.js`、`js/return_order_items.js`
  - 配置與同步：`core/configs/return_order_items.config.js`、`js/data-sync.js`、`index.php`
  - migration／工具：`migrations/2026_07_15_*.sql`、`tools/sync-local-schema.ps1`、`tools/test-p0-workflow-integrity.php`

## 2. 已完成功能

- 自動審計補強 13 項已閉環：
  - 新增 `SEC-3`、`PERM-2`、`SCHEMA-1`、`NAV-1`、`STATE-1`、`INV-1`、`AUDIT-1`、`OUTBOX-1`、`ASSET-1`、`TEST-1`、`CSS-1`、`UX-1`、`UPDATE-1`，且全數設為不可 baseline 降級。
  - 新增由本機實際資料庫匯出的 95-table schema contract，以及 10 組治理規則的正反例測試；完整與 changed-scope health audit 均會執行。
  - 規則上線時實際攔截並修復：工單空權限放行、訂單品項不存在的 `deleted_at`、退貨候選品不存在的 `specification`、二次篩選工單寫入已移除的 `status`。
  - CI 獨立阻擋 PHPUnit 啟動失敗與前端資產預算超標。

- 一鍵更新與版本快取已閉環：
  - 正式完整更新包為 `dist/update_v3.1.2_20260716_224036.zip`，SHA-256 `D510F4F9D3BB710BDB4E440D7A4106F6F7BBA5A26D42195A0201E2FCAAA7EDB5`；使用者已確認遠端套用成功。
  - `tools/build-update-package.ps1` 改為保留呼叫端指定的 migration 相依順序，支援 `delete_files`，並由 `.NET ZipFile` 建立最終 ZIP。
  - `api/system_update_common.php` 支援刪除檔案備份／回復、更新階段與錯誤追蹤編號；migration 失敗會附資料庫原始回覆。
  - `2026_07_16_unify_work_order_status.sql` 已支援舊狀態 key／中文標籤、NULL／錯誤 domain、不同 FK 名稱與規則；狀態回填、FK、NOT NULL 與舊欄位移除均可重複執行。
  - 已重建遠端舊 schema 情境，透過正式 PDO migration 執行路徑連跑兩次成功；migration 順序、ZIP manifest、來源雜湊與 160 個 payload 檔案均精確驗證。

- P2 UI/UX 與效能改善除逐模組 token 遷移外已完成：
  - 業務 config/JS 不再由入口一次載入；登入 session 成功並開啟模組後才載入對應資產。
  - Dashboard 第三方資產固定版本、SRI、crossorigin，失效時保留統計數字與工作佇列降級操作。
  - 側邊欄依接單、排程與生產、品質與異常、入庫、出貨、退貨工作流程重整，仍沿用 fail-closed 權限隱藏。
  - 側邊欄工作區只保留搜尋與使用者主動收藏，不再儲存／顯示最近使用，也不再提供固定接單→生產→入庫→出貨捷徑。
  - 工單表單依基本資料、排程／機台、生產紀錄、品質、完工入庫、追溯漸進揭露，顯示必填缺漏與階段完成度。
  - 桌面危險操作原生提示違規為 0；同步未儲存導覽守門保留 14 處原生 confirm。
  - 共用 `AppFeedback` modal 的取消、一般確認及危險確認按鈕均套用系統 `.btn outline/primary/danger` 規範；一般操作不再顯示危險色階段標籤。
  - 原 419 項機械式 token 轉換因造成視覺回歸已撤回；目前 408 個 candidate 必須改為逐模組、具 fallback 且完成視覺比較後才能勾選。
  - 新增 `CSS-1` 契約，阻擋 token 自我引用、未定義且無 fallback、入口 CSS 缺檔與 cache version 漏掃；轉換器不再改寫 CSS 自訂變數定義。
  - 新版本不再自動強制刷新；上方橫幅提供立即更新與延後 15 分鐘，多分頁同步通知，更新前保護未儲存資料。
  - 更新採版本化 URL 載入新資產，只清除 MES 命名 CacheStorage；失敗最多自動補救一次，再顯示明確重試提示。
  - `UPDATE-1` 與行為測試會阻擋強制重載、無限循環、未儲存防護缺失及跨站快取誤刪回歸。

- P1 高優先改善已閉環：
  - `work_orders.status` 已由 schema 移除，所有查詢以 `status_lookup_id -> lookup_values.value_key` 為唯一狀態來源。
  - 訂單、訂單品項、工單、庫存、出貨、退貨共用集中轉換矩陣；非法轉換回傳 409，轉換歷程與業務交易同時提交。
  - `workflow_status_transitions` 與 `audit_logs` 均由資料庫 trigger 阻擋 UPDATE／DELETE。
  - 每筆有效庫存都有正式來源鏈；標準／最終／部分／手動入庫、退貨及二次篩選均可追溯，並有唯一鍵防重複。
  - Outbox 因沒有 producer、consumer 或外部發布契約，已移除側邊欄、配置與前端程式；舊 API 回傳 410。
  - PHPUnit 已可由標準指令啟動，Composer 可載入 `Tests\\`，本機測試 schema 只複製結構、不使用開發資料。
  - 所有 `MAX(id)+1` 與 `microtime+random_int` 主鍵生成已移除，文件編號仍由 `number_sequences` 獨立管理。

- 權限改為 fail-closed：
  - GET/HEAD/POST/PUT/PATCH/DELETE 均由後端自動權限閘門檢查。
  - 空權限帳號無法讀取 Dashboard 或業務模組；前端顯示「尚未配置系統權限」。
  - 保留舊中文權限相容，並只對必要關聯選單授予跨模組唯讀權限，不擴張寫入權限。
  - 兩個有效無角色帳號已由 migration 指派零權限 `access_pending` 角色；目前有效無角色帳號為 0。
  - 新增 `tools/initialize-emergency-admin.php`，只有 CLI 且明確 `--confirm` 才能指派緊急管理員。
- 出貨狀態機與庫存一致性：
  - 新單固定由 `draft` 開始，前後端只提供合法下一狀態。
  - `packed -> shipped` 扣庫、`shipped -> cancelled` 回沖；相同狀態重送不產生副作用。
  - 狀態與庫存異動位於同一 transaction，鎖定出貨單及庫存資料，並保護其他待出貨單配貨量。
  - 配貨量改由有效待出貨品項重算；訂單品項出貨統計於狀態寫入後重算，並納入 `delivered`。
  - 只有草稿可刪除；離開草稿後不可變更客戶或來源訂單。
  - 非法轉換回傳 HTTP 409，包含目前狀態、要求狀態與合法下一狀態。
- 退貨品項完整閉環：
  - API 全面改用實際 schema 的 `shipping_order_item_id`，完成列表、新增、單筆、更新、刪除。
  - 僅允許連結同一原出貨單的已出貨／已送達品項，累計退貨不得超過出貨量。
  - 退貨建立與出貨取消共用資料鎖，避免並發下同時取消出貨及建立退貨。
  - 退貨單處理狀態加入合法矩陣；完成或拒絕後不可重新開啟修改品項。
  - 新增正式配置、CRUD UI、分頁、來源選單、DataSync 與入口初始化。
  - 既有出貨單 `has_return/return_status` 已依有效退貨品項回填。
- 文件與追蹤：
  - `docs/system-operation-review-todo-2026-07-15.md` 的 P0、P1、P2 與自動審計補強均已完成或標記後續非阻斷項目。
  - `.github/copilot-instructions.md` DataSync 對照表已同步。

## 3. 待修 Bug／已知資料風險

- 本機有 1 筆歷史退貨品項連到狀態仍為 `draft` 的原出貨單。
  - 新程式已阻擋再次建立或編輯此類資料，且退貨旗標已重算為 `full`。
  - 未自行推定實際出貨事實，也未改動該筆庫存數量；需由業務人員判斷歷史出貨狀態或退貨單是否誤建。
- 完整 health audit 仍有既有 warning 15 項；changed-scope 為 0 新增、0 blocking。
- DataSync audit 仍有既有 P2 9 項，本輪 P0/P1 為 0。
- in-app Browser runtime 本輪未提供可用瀏覽器，因此無法完成視覺截圖驗收；已以配置驗證、JS 語法與本機 HTTP API 情境測試替代。
- 2026-07-16 CSS 視覺回歸已先恢復 `styles.css` 原始實值；待瀏覽器實例可用後，仍需補做主要模組修復後截圖驗收。

## 4. 下一步任務

- P3：處理 DataSync 既有 P2 9 項與 health audit 既有 15 項 warning。
- 依逐模組方式處理剩餘 408 個 CSS token candidate，每個模組完成瀏覽器視覺比較後才合併，禁止再次機械式全域改寫。
- 管理員重啟 Apache2.4 服務後，以實際回應標頭複驗 Brotli/gzip 與 immutable cache；本輪已完成設定、`httpd -t` 與 module dump，但目前程序無權限由此工作階段重啟。
- 待 in-app Browser 提供可用實例後，補做登入、工單狀態、稽核唯讀及 Outbox 下架的視覺回歸。
- 由業務人員確認歷史 `draft` 出貨單／退貨單的真實狀態後，再執行資料修復。

## 5. 驗證狀態

- 前端資產：10 支本機核心腳本、約 229 KiB；`audit-frontend-assets` 通過。
- 回饋：64 處 AppFeedback、14 處同步未儲存守門、0 違規。
- UI：786 項基線包含 408 個 token candidate、378 個人工 review；機械轉換已撤回，後續改採逐模組視覺回歸。

- schema：34 applied、0 pending；P1 migration 與不可變 trigger 已驗證。
- 更新包：v3.1.2 內建 verifier 與正式 PHP manifest parser 通過；160 files、5 migrations、2 delete files，payload 缺漏 0、多包 0，使用者已確認遠端套用成功。
- migration 相容測試：以舊 `status` 欄位、nullable `status_lookup_id`、`ON DELETE SET NULL` 舊 FK 及中文狀態資料重建情境，正式 PDO 路徑連跑兩次均成功；最終 NULL 0、錯誤 domain 0、FK 為 CASCADE/RESTRICT。
- 資料合約：`work_orders.status` 0 欄、NULL lookup 0 筆、有效庫存缺來源 0 筆、來源重複 0 組、P1 自增表 17 張。
- `vendor\\bin\\phpunit.bat --configuration phpunit.xml`：32 tests、76 assertions、16 個 HTTP 測試在未啟動隔離服務時明確 skipped。
- `php tools/test-p0-workflow-integrity.php`：35 assertions passed，交易測試均 rollback。
- 本機 HTTP 情境：
  - 版本 API：200、no-store，包含 version、build_id、released_at、required。
  - 空權限讀訂單／Dashboard：403。
  - 退貨權限讀退貨品項及原出貨相依資料：200。
  - 退貨權限讀無關員工模組：403。
  - 草稿來源建立退貨、超出合法來源、`draft -> shipped`：409。
- 全部變更 PHP 檔案通過 `php -l`。
- `script.js`、本輪模組 JS、DataSync 與 config 通過 `node --check`。
- `node tools/validate-config-modules.js`：通過。
- `node tools/audit-data-sync.js --write docs/data-sync-audit.md`：P0 0、P1 0。
- `node tools/audit-system-health.js --changed --base origin/main`：0 新增、0 blocking。
- `git diff --check`：通過。

## 6. Git 交接

- 分支：`main`。
- 功能與交付 commit：`ffec56eb6b78001990f3c7bc8f76f6bcdeb9589f`（`feat: complete P0-P2 system operation improvements`），已推送至 `origin/main`。
- 本文件所在的收尾 commit 使用 `docs: finalize P0-P2 handoff`，並推送至 `origin/main`；最終 hash 以收尾回報與 `git log --oneline -1` 為準。
- `dist/` 更新包為交付產物，不強制加入 Git；正式交付包路徑與 SHA-256 已列於上方。
