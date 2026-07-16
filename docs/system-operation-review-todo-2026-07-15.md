# MES 系統運作邏輯與 UI/UX 改善待辦

建立日期：2026-07-15
檢視基線：`067624a`

## 目標

依實際程式碼、資料庫 schema、API 行為與本機檢查結果，修正權限、流程狀態、資料追溯、測試及 UI/UX 缺口。

每一批施工都必須交付可運作的完整閉環，不得只修改畫面、單一欄位或文件說明。

## P0：立即處理

### 1. 權限改為 Fail-Closed

- [x] 移除後端「權限清單為空時放行寫入」的相容邏輯。
- [x] 所有模組 GET API 執行 `{module}.read` 或對應舊權限檢查。
- [x] 前端權限清單為空時只允許登入、個人資料與必要通用功能，不顯示全部模組。
- [x] 盤點目前沒有角色的有效員工，透過零權限 `access_pending` 角色承接，不在程式中以放行方式相容。
- [x] 明確建立初始管理員／緊急管理員初始化流程，避免新環境因 fail-closed 無法管理。
- [x] 新增自動測試：無角色、無權限、唯讀、可編輯、管理員五種情境。

完成條件：

- 無角色或權限空白的帳號無法讀取或修改業務模組。
- 直接呼叫 API 與前端選單呈現結果一致。
- 未授權請求穩定回傳 HTTP 403。

主要範圍：

- `api/bootstrap.php`
- `script.js`
- `api/login.php`
- `api/session.php`
- `api/roles/`
- `api/permissions/`
- `api/role_permissions/`
- `api/employee_roles/`

### 2. 建立出貨單正式狀態機

- [x] 定義合法狀態與轉換矩陣，例如：`draft -> confirmed -> preparing -> packed -> shipped -> delivered`。
- [x] 明確定義取消、退回草稿及已出貨沖銷的合法入口。
- [x] 阻擋 `shipped -> draft/preparing/packed` 等會造成庫存帳實不符的跳轉。
- [x] 狀態轉換與庫存扣減、配貨釋放、出貨回沖放在同一 transaction。
- [x] 加入重複請求防護，避免重複扣庫存或重複建立交易。
- [x] 所有非法轉換回傳 HTTP 409，並提供目前狀態、要求狀態及建議動作。
- [x] 補齊正常出貨、取消出貨、退貨及重複送出測試。

完成條件：

- 任意 API 呼叫都無法繞過狀態轉換規則。
- 庫存 `quantity_on_hand`、`quantity_allocated`、`quantity_shipped` 與異動紀錄一致。
- 出貨狀態與訂單品項出貨統計一致。

主要範圍：

- `api/shipping_orders/update.php`
- `api/shipping_orders/helpers.php`
- `api/shipping_orders/add_item.php`
- `api/shipping_orders/delete.php`
- `api/shipping_order_items/`
- `js/shipping_orders.js`

### 3. 完成或暫時下架退貨品項模組

- [x] 統一 `return_order_items` 的關聯欄位；以實際流程確認應使用 `shipping_order_item_id`。
- [x] 修正列表、新增、查詢、更新及刪除 API 的欄位名稱與 JOIN。
- [x] 補上前端 JS、DataSync、欄位配置及操作守門。
- [x] 驗證退貨數量不得超過可退數量，並防止多張退貨單累計超退。
- [x] 退貨品項不可直接連結任意訂單品項，必須追溯原出貨品項。
- [x] 模組已在同一批完成，保留正式側邊欄入口並移除佔位狀態。

完成條件：

- API 不再出現 `Unknown column 'roi.order_item_id'`。
- 使用者可從出貨單建立退貨，並在退貨品項頁看到一致資料。
- 直接 API 呼叫同樣受到數量與流程限制。

主要範圍：

- `api/return_order_items/`
- `api/return_orders/`
- `core/configs/return_order_items.config.js`
- `js/return_order_items.js`（需新增或正式整合）
- `index.php`
- `script.js`

## P1：高優先改善

### 4. 統一工單狀態單一真實來源

- [x] 決定以 `status_lookup_id` 或 `status` 為唯一主狀態，不再雙向獨立寫入。
- [x] 若保留 lookup，所有查詢統一 JOIN `lookup_values` 取得 `status_key`。
- [x] 資料 migration 回填並驗證既有工單狀態。
- [x] 修正 Dashboard 工單統計、最近工單與行事曆查詢。
- [x] 盤點首件、報表、庫存、刪除守門等直接使用 `work_orders.status` 的查詢。
- [x] 設定資料庫約束或同步機制，避免再次產生兩個互相矛盾的狀態。

完成條件：

- Dashboard、工單列表、行事曆、狀態看板及報表顯示相同狀態。
- 工單不會因 NULL 比較而從行事曆消失。
- 狀態分布與資料庫實際 lookup 狀態完全一致。

### 5. 建立全流程共用狀態機

- [x] 將訂單、訂單品項、工單、庫存、出貨及退貨狀態規則集中管理。
- [x] 訂單狀態只能使用定義值，不接受任意 50 字元字串。
- [x] 訂單已有工單、庫存或出貨後，限制不合法的回退與客戶變更。
- [x] 工單完成、退回、作廢、部分入庫及最終入庫使用明確 transition service。
- [x] 退貨單 `processing_status` 使用定義值並限制合法轉換。
- [x] 狀態轉換統一寫入操作歷程，包含 from、to、操作者、原因與時間。

完成條件：

- 所有狀態轉換都有單一後端入口、合法矩陣與 transaction。
- 前端只顯示目前狀態可執行的下一步。
- 無法透過直接 API 更新建立不合法狀態。

### 6. 補齊庫存來源鏈

- [x] 工單標準入庫、最終入庫、部分入庫、手動入庫、退貨及二次篩選都建立 `inventory_item_sources`。
- [x] 對現有庫存依 `work_order_id`、`order_item_id`、`order_id` 回填來源鏈。
- [x] 在回填完成前，來源鏈 API 對既有直接關聯欄位提供 fallback。
- [x] 加入來源鏈唯一性或防重複規則。
- [x] 驗證從庫存可追到工單、訂單品項、訂單、出貨、退貨及二次篩選。

完成條件：

- 每一筆有效庫存至少有一筆來源鏈資料。
- 來源鏈頁面不再對既有庫存顯示空白。
- 新增、回沖及二次篩選不會產生重複來源節點。

### 7. 稽核紀錄改為不可變

- [x] 移除一般 UI 的人工新增及批次實體刪除功能。
- [x] 稽核紀錄只能由系統業務動作產生。
- [x] 本輪不提供實體清理；未來如需 retention／archive，必須另建可審核且留下管理稽核的流程。
- [x] 避免 API 錯誤回應直接包含例外內容。
- [x] 盤點並補齊本輪關鍵狀態與庫存寫入的 audit／transition log。

完成條件：

- 一般管理者無法修改或刪除既有稽核證據。
- 清理紀錄本身也會留下不可刪除的管理稽核。

### 8. 重新設計 Domain Event Outbox

- [x] 確認系統是否真正需要 Outbox；目前無 producer／consumer／外部發布契約，已移除正式模組。
- [x] 已移除人工 CRUD；舊 API 回傳 HTTP 410，不再允許人工建立事件。
- [x] 因本輪決策為下架，暫不建立無實際用途的狀態與 retry 規則。
- [x] 因本輪決策為下架，暫不建立空轉的 consumer、dead-letter 與監控。
- [x] 舊事件 API 不可編輯或刪除。

完成條件：

- 正式 UI、前端資產與人工 CRUD 已移除，不再誤導為可運作的 Outbox。
- 若未來有明確整合需求，須以業務 transaction producer、consumer、retry 與 dead-letter 完整重建後才可重新上架。

### 9. 修復自動測試基礎

- [x] 在 Composer 加入 `autoload-dev` PSR-4：`Tests\\ => tests/`。
- [x] 確認 `ApiTestCase` 可被 PHPUnit 載入。
- [x] 建立獨立測試資料庫初始化及清理流程。
- [x] 測試不得依賴正式／開發資料庫既有資料。
- [x] 補權限、狀態轉換、庫存平衡、退貨品項及來源鏈整合測試。
- [x] CI 執行 PHPUnit、system health、config validation、DataSync audit。

完成條件：

- `vendor/bin/phpunit --configuration phpunit.xml` 可完整啟動並通過。
- schema/API 欄位不一致會在 CI 被阻擋。

### 10. 移除不安全的 ID 產生方式

- [x] 盤點所有 `MAX(id) + 1` 與 `microtime + random_int`。
- [x] 優先改用 AUTO_INCREMENT、UUID/ULID 或有鎖定的集中式序號。
- [x] 庫存交易、檢驗、行事曆、系統參數及出退貨品項以 schema contract 驗證資料庫並發安全配號。
- [x] 文件編號與資料表主鍵分離，不以可讀文件編號取代內部 ID。

完成條件：

- 並發新增不會發生 duplicate primary key。
- 所有 ID 產生策略有明確且一致的規則。

## P2：UI/UX 與效能改善

### 11. 前端資產按需載入

- [x] 不再於 `index.php` 一次載入全部 config 與模組 JS。
- [x] 依使用者開啟的模組動態載入對應 config、HTML、JS。
- [x] 將共用核心與業務模組分包，設定資產大小預算。
- [x] Apache 啟用 gzip/Brotli 與版本化 immutable cache。
- [x] 新版本改為持續橫幅提示，由使用者選擇立即更新或延後 15 分鐘；更新前攔截未儲存資料。
- [x] 更新重載使用新資產版本 URL、只清除 MES 命名快取，並以一次補救重載及失敗提示避免循環。
- [x] 多分頁同步版本通知與延後狀態；版本 API 回傳 build、發布時間與 required 契約。
- [x] 未登入狀態先完成 session 判斷，再載入完整系統資產。
- [x] 第三方套件本地化，或加入 SRI、crossorigin 與可用性 fallback。

目前基線：

- `index.php` 有 105 個 script tag。
- 103 個本機 script 約 2.59 MB。
- `js/work_orders.js` 約 356 KB。
- `styles.css` 約 291 KB。

收斂結果（2026-07-16）：

- 入口降為 10 支本機核心腳本、約 229 KiB；預算由 `tools/audit-frontend-assets.js` 與 CI 守門。
- `core/module-assets.js` 依模組載入 config、功能 JS 與延伸子模組；session 成功後才還原並載入工作頁籤。
- Apache 設定已啟用 Brotli、deflate、expires、headers、filter，`.htaccess` 使用版本化 immutable cache；設定通過 `httpd -t` 與 module dump。
- Font Awesome、FullCalendar、Chart.js 使用固定版本、SRI、crossorigin；Dashboard 套件失效時保留工作佇列與統計數字降級模式。

完成條件：

- 首次登入只載入 shell、Dashboard 與必要共用程式。
- 開啟單一模組不下載其他無關模組。
- 靜態資產有壓縮及長效快取。

### 12. 側邊欄改為角色與工作流程導向

- [x] 將四十多個技術模組入口整理為接單、排程、生產、入庫、出貨、退貨／異常等主要工作區。
- [x] 依角色顯示常用任務，不只依資料表名稱分類。
- [x] 增加全域搜尋、收藏及待辦入口；移除不符合實際工作方式的最近使用與固定流程捷徑。
- [x] Dashboard 提供可直接處理的工作佇列，而非只有統計數字。
- [x] 顯示目前流程位置與下一步，降低跨模組尋找成本。

完成條件：

- 現場人員可從首頁在少量點擊內到達待處理工單。
- 業務、排程、生產、倉庫與管理者看到符合角色的入口。

### 13. 重構工單操作畫面

- [x] 將工單頁拆成基本資料、排程／機台、生產紀錄、品質、完工入庫、追溯等階段頁籤。
- [x] 依工單類型及狀態漸進揭露欄位，不同時顯示所有控制項。
- [x] 常用現場操作保留在固定工作區，低頻設定移入進階區。
- [x] 顯示每個階段完成度、缺少資料與阻擋原因。
- [x] 拆分 `js/work_orders.js` 為 API、狀態機、渲染及各功能子模組。

目前基線：

- `modules/work_orders.html` 約有 114 個表單控制項、40 個 section、75 個按鈕。
- `js/work_orders.js` 約 7,577 行。

收斂結果（2026-07-16）：API request、狀態轉換／建議階段、六階段工作區渲染已拆到 `js/work-orders/`，原 CRUD 模組保留既有業務處理並透過上述子模組組裝。

完成條件：

- 使用者不需在單一長頁面中尋找主要操作。
- 各階段可獨立測試，且狀態與 DataSync 行為一致。

### 14. 統一確認、錯誤與流程提示

- [x] 盤點約 100 個原生 `confirm()`／`alert()` 呼叫。
- [x] 一般成功訊息統一使用 toast 或 module alert。
- [x] 危險操作統一使用流程影響 modal。
- [x] modal 顯示目前節點、影響資料、合法動作、取消及說明。
- [x] 支援鍵盤焦點管理、Escape、aria-describedby 與錯誤摘要。

收斂結果（2026-07-16）：桌面功能共有 64 處 `AppFeedback` 呼叫、0 個未遷移危險原生提示；僅保留 14 個必須同步回傳 boolean 的未儲存導覽守門，詳見 `docs/native-feedback-audit.md`。

完成條件：

- 核心流程不再使用缺乏上下文的原生確認框。
- 錯誤訊息可指出欄位、原因與修正方式。

### 15. 收斂 CSS 與設計系統

- [x] 盤點 UI audit 的 786 個硬編碼 spacing／radius。
- [ ] 以逐模組視覺回歸方式，將 408 個 token candidate 改用具 fallback 的共用 token。
- [x] 拆分 `styles.css` 為 token、shell、components、utilities 與 module scoped 樣式。
- [x] 移除 `modules/order_items.html` 非 display:none 的 inline style。
- [x] 統一表格、表單、Modal、狀態 badge、操作按鈕及 focus 樣式。
- [x] 增加高對比、鍵盤操作及縮放至 200% 的驗收。

回歸修復（2026-07-16）：原批次轉換器將 419 個宣告一次改寫，並產生
`--ui-radius-pill: var(--ui-radius-pill)` 循環引用；因缺少視覺回歸而造成多模組版面異常。
已將 `styles.css` 恢復為原本實值、修正轉換器不可改寫 token 定義、將 `styles/` 納入 cache version，並新增 `CSS-1`
阻擋循環／缺失 token／樣式快取漏掃。UI audit 回到 408 個 candidate、378 個人工 review；後續只能逐模組轉換，
每批需比較轉換前後畫面，不得再以 candidate 歸零單獨作為完成條件。

完成條件：

- 新增 UI 不需以局部 `!important` 或硬編碼覆蓋修正。
- 主要模組在相同元件上具有一致密度與互動回饋。

## 自動審計需補強的規則

- [x] 偵測空權限 fail-open（`SEC-3`）。
- [x] 檢查 GET API 是否執行 read permission（`PERM-2`）。
- [x] 比對 API SQL 欄位與實際 schema contract（`SCHEMA-1`）。
- [x] 偵測正式選單中的 placeholder／缺少 initializer 模組（`NAV-1`）。
- [x] 檢查雙重狀態欄位及查詢是否使用錯誤來源（`STATE-1`）。
- [x] 檢查有效庫存建立路徑與 schema 同步來源鏈驗證（`INV-1`）。
- [x] 阻擋稽核紀錄實體刪除（`AUDIT-1`）。
- [x] 檢查 Outbox 是否誤接業務 producer／consumer 或正式 UI（`OUTBOX-1`）。
- [x] 加入前端資產數量及大小預算並接入 CI blocking（`ASSET-1`）。
- [x] 將 PHPUnit 無法啟動列為 CI blocking（`TEST-1`）。
- [x] 阻擋 CSS token 自我引用、未定義無 fallback、入口 CSS 缺檔與樣式快取漏掃（`CSS-1`）。
- [x] 阻擋側邊欄最近使用／固定流程捷徑回歸，以及共用 modal 使用原生按鈕樣式（`UX-1`）。
- [x] 阻擋版本提示退化為強制重載、忽略未儲存資料、無限重載或清除非 MES 快取（`UPDATE-1`）。

閉環證據：規則集中於 `tools/audit/rules/governance-contracts.js`，正反例測試集中於
`tools/audit/tests/governance-contracts.test.js`；更新互動另由
`tools/audit/tests/version-checker-behavior.test.js` 驗證提示、延後、未儲存防護及快取邊界。完整與 changed-scope 健康度審計都會執行，
上述規則不可被 baseline 降級。實際 schema 由 `tools/export-schema-contract.php` 匯出至
`tools/schema-contract.json`，GitHub Actions 另獨立執行 PHPUnit 與前端資產預算。

## 每批共同驗證

依實際修改範圍執行：

```powershell
node tools/audit-system-health.js --changed --base origin/main
node tools/validate-config-modules.js
node --check js/data-sync.js
node --check tools/audit-data-sync.js
node tools/audit-data-sync.js --write docs/data-sync-audit.md
powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1
vendor\bin\phpunit.bat --configuration phpunit.xml
git diff --check
```

另需執行對應 PHP `php -l`、JS `node --check`、至少兩種角色權限驗收，以及核心流程的瀏覽器操作回歸。

## 建議施工批次

1. 權限 fail-closed 與讀取權限。
2. 出貨狀態機與庫存一致性。
3. 退貨品項完整閉環。
4. 工單狀態統一及 Dashboard／行事曆修復。
5. 庫存來源鏈寫入與歷史回填。
6. PHPUnit、schema contract 與流程整合測試。
7. 稽核紀錄與 Domain Event Outbox 治理。
8. 前端按需載入、導航與工單 UI 重構。
9. CSS token 與全系統可用性收斂。
