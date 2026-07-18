# MES 全系統修復待辦事項

## 文件目的

本文件依 2026-07-18 本輪唯讀盤點結果建立，記錄目前已確認的功能故障、安全問題、資料一致性問題與後續驗證工作。

本文件先以唯讀盤點建立，後續隨本輪修復同步更新程式、schema migration、驗證結果與進度框。

## 盤點基線

- 開始 commit：`40cc32a383486fe2fb161cfbdc521c051bc02ae2`
- `origin/main`：`40cc32a383486fe2fb161cfbdc521c051bc02ae2`
- 上一輪主要變更來源：`ffec56e feat: complete P0-P2 system operation improvements`
- 側邊欄：儀表板 1 項、功能模組 44 項
- Schema 同步：Applied 34、Pending 0
- PHP 語法檢查：309 個檔案通過
- JavaScript 語法檢查：108 個檔案通過
- 配置驗證：通過
- 系統健康度稽核：0 errors、15 warnings
- DataSync 稽核：P0 0、P1 0、P2 9
- 目前工作樹另有測試產物：`?? .phpunit.result.cache`；未經確認不得自行刪除

## 逐項進度總覽

| 待辦 ID | 調查 | 修復 | 驗證 | 部署 | 最後更新 | 更新摘要 |
|---|---|---|---|---|---|---|
| P0-1 | [x] | [x] | [x] | [ ] | 2026-07-18 | 已修復，待部署 |
| P0-2 | [x] | [x] | [x] | [ ] | 2026-07-18 | 已修復，待部署 |
| P1-1 | [x] | [x] | [x] | [ ] | 2026-07-18 | 已修復，待部署；已依目標模組套用 workflow guard 權限 |
| P1-2 | [x] | [x] | [x] | [ ] | 2026-07-18 | 已修復，待部署；圖片端點明確要求退貨管理權限 |
| P1-3 | [x] | [x] | [x] | [ ] | 2026-07-18 | 已修復，待部署；新增工單空白狀態自動帶入 pending |
| P1-4 | [x] | [x] | [x] | [ ] | 2026-07-18 | 已修復，待部署；對外錯誤回應已移除內部細節 |
| P2-1 | [x] | [x] | [x] | [ ] | 2026-07-18 | 已處置，已定義相容期來源並回填四個模組的 lookup 鏡像 |
| P2-2 | [x] | [x] | [x] | [ ] | 2026-07-18 | 已修復；service_category 描述改為「用於定義服務分類」 |
| P2-3 | [x] | [x] | [x] | [ ] | 2026-07-18 | 已修復；DROP／ADD／MODIFY／UNIQUE DDL 已條件化並完成重跑 |
| P2-4 | [x] | [x] | [x] | [ ] | 2026-07-18 | 已修復；message_attachments COMMENT 改為 UTF-8 正確內容 |
| P2-5 | [x] | [x] | [x] | [ ] | 2026-07-18 | 已修復；下架 API 先經正式權限，授權後一致回傳 410 |
| P2-6 | [x] | [x] | [x] | [ ] | 2026-07-18 | 已修復；稽核新增 API 模組／頂層端點授權註冊檢查 |
| P2-7 | [x] | [x] | [x] | [ ] | 2026-07-18 | 已處置；DataSync P2 已降為 0，status_board fallback 已移除，大型 JS 留作非阻斷維護項 |

每個待辦項目下方另有詳細更新框。勾選順序建議為：調查完成 → 修復完成 → 驗證通過 → 已部署。

## P0：必須優先處理

### P0-1 系統更新 API 缺少管理員／系統權限授權

狀態：`已修復，待部署`

進度更新框：

- [x] 調查完成
- [x] 修復完成
- [x] 驗證通過
- [ ] 已部署
- 最後更新：2026-07-18
- 更新摘要：系統更新頂層 API 已統一補上 `manage_system_parameters` 授權；管理員／非授權角色權限解析測試通過。
- 阻塞／待決策：尚未部署至正式環境。

影響：任何已登入員工可能直接呼叫系統更新 API，包含上傳、備份、套用、啟用維護模式與回滾。

涉及端點：

- `api/system_update_upload.php`
- `api/system_update_backup.php`
- `api/system_update_apply.php`
- `api/system_update_maintenance.php`
- `api/system_update_rollback.php`
- `api/system_update_status.php`
- `api/system_update_history.php`
- `api/system_update_init_check.php`

根因：這些端點位於 `api/system_update_*.php` 頂層，沒有被 `api/bootstrap.php` 的 `/api/{module}/` 自動權限解析涵蓋；端點本身只呼叫 `requireAuth()`。

修復要求：

- 定義系統更新所需的正式權限與管理員策略。
- 所有更新相關端點統一執行伺服器端授權。
- GET 狀態／歷史／初始化檢查也要有適當的讀取權限。
- 套用、備份、回滾、維護模式、上傳必須拒絕非授權員工。
- 補充非管理員角色的 API 權限測試。

### P0-2 修復報表 API 權限映射回歸

狀態：`已修復，待部署`

進度更新框：

- [x] 調查完成
- [x] 修復完成
- [x] 驗證通過
- [ ] 已部署
- 最後更新：2026-07-18
- 更新摘要：後端與前端均加入 `reports -> view_reports` 映射，報表讀取與靜態頁產生權限測試通過。
- 阻塞／待決策：尚未部署至正式環境。

影響：品質檢驗列印頁顯示「您沒有執行此操作的權限」，即使管理員已有「列印報表說明」權限。

涉及端點：

- `api/reports/screening_inspection.php`
- `api/reports/generate_static.php`
- `print/screening_inspection_print.html`
- `api/bootstrap.php`

根因：自動權限檢查將模組解析為 `reports`，但 legacy permission map 沒有 `reports`，資料庫既有權限是 `view_reports`／「列印報表說明」。

修復要求：

- 明確定義報表資料讀取與 QR 靜態頁產生的權限。
- 補上 `reports` 模組映射或採用正式權限別名策略。
- 同時驗證管理員、一般授權員工、無權限員工三種結果。
- 實測品質檢驗報表、QR 靜態頁與其他列印頁。

## P1：功能阻斷與高風險流程

### P1-1 修復 `workflow_guard` 自動權限阻擋

狀態：`已修復，待部署`

進度更新框：

- [x] 調查完成
- [x] 修復完成
- [x] 驗證通過
- [ ] 已部署
- 最後更新：2026-07-18
- 更新摘要：`workflow_guard/check.php` 依目標模組與動作套用既有權限；已驗證訂單權限可通過、庫存權限不足回傳 403。
- 阻塞／待決策：

影響：刪除或沖銷前的流程檢查可能直接回傳 403，造成流程檢查失敗。

涉及功能：

- 訂單刪除
- 訂單項目刪除
- 庫存項目刪除
- 出貨單刪除
- 退貨單刪除
- 生產工單刪除
- 工單部分入庫沖銷

根因：`api/workflow_guard/check.php` 被解析為 `workflow_guard.read`，但沒有對應權限映射。

修復要求：

- 由 workflow guard 依查詢的目標模組驗證目標操作權限。
- 不可用單一過寬權限放行所有模組刪除。
- 保留既有流程關聯、庫存、出貨、退貨與追溯檢查。
- 驗證「可刪除」、「不可刪除」、「無權限」三種情境。

### P1-2 修復二次篩選圖片 API 權限

狀態：`已修復，待部署`

進度更新框：

- [x] 調查完成
- [x] 修復完成
- [x] 驗證通過
- [ ] 已部署
- 最後更新：2026-07-18
- 更新摘要：圖片列表、新增／更新、刪除端點明確要求 `manage_return_orders`，並排除通用模組誤判；PHP 語法與整體審計通過。
- 阻塞／待決策：

影響：二次篩選圖片讀取、上傳、修改、刪除可能被 403 阻擋。

涉及端點：

- `api/rescreen_batch_images/index.php`
- `api/rescreen_batch_images/update.php`
- `api/rescreen_batch_images/delete.php`
- `js/rescreen_batches_execution.js`

修復要求：

- 明確沿用 `rescreen_batches`／`manage_return_orders` 權限或建立正式子權限。
- 讀取與寫入採最小權限。
- 驗證圖片上傳、顯示、刪除、DataSync 更新與檔案權限。

### P1-3 修復新增生產工單的狀態初始化

狀態：`已修復，待部署`

進度更新框：

- [x] 調查完成
- [x] 修復完成
- [x] 驗證通過
- [ ] 已部署
- 最後更新：2026-07-18
- 更新摘要：後端新增工單空白狀態自動解析 `status_work_order.pending`（目前 ID 25）；更新流程仍要求明確狀態，前端建立表單補上 required 與 pending 預選。
- 阻塞／待決策：

影響：新增生產工單送出空白 `status_lookup_id` 時觸發 SQLSTATE 23000／1048。

涉及檔案：

- `modules/work_orders.html`
- `js/work_orders.js`
- `api/work_orders/helpers.php`
- `api/work_orders/index.php`

修復要求：

- 前端新增表單預設選取 `status_work_order.pending`。
- 後端新增流程即使前端漏送，也要安全預設為 pending。
- 空白狀態不得轉成 NULL 後直接交給資料庫。
- 保留狀態 ID、lookup domain 與有效值驗證。
- 驗證一般工單、二次重篩工單、拆分工單三種新增流程。

### P1-4 移除新增工單回應中的內部例外細節

狀態：`已修復，待部署`

進度更新框：

- [x] 調查完成
- [x] 修復完成
- [x] 驗證通過
- [ ] 已部署
- 最後更新：2026-07-18
- 更新摘要：新增工單失敗回應移除檔案路徑、行號與原始例外內容，改為一般化訊息；例外仍寫入伺服器稽核紀錄。
- 阻塞／待決策：

目前回應包含 exception message、PHP 檔案名稱與行號。

修復要求：

- 對外只回傳一般化錯誤訊息與可處理的錯誤代碼。
- 詳細例外僅寫入伺服器 log 與稽核記錄。
- 確認其他 CRUD API 沒有同樣的 `file`、`line`、原始 SQL 錯誤洩漏。

## P2：資料模型與維護風險

### P2-1 整理雙重狀態欄位

狀態：`已處置，維持相容期`

進度更新框：

- [x] 調查完成
- [x] 修復完成
- [x] 驗證通過
- [ ] 已部署
- 最後更新：2026-07-18
- 更新摘要：新增 `docs/status-source-contract.md` 定義四個 legacy 模組以 `status` 為相容期來源、`status_lookup_id` 為鏡像；migration 回填 NULL／不一致值並補齊載具 `retired` lookup。新增／更新寫入已同步鏡像。
- 阻塞／待決策：正式移除 legacy 欄位仍需另立 breaking migration；本輪不冒險改寫既有 API 契約。

目前同時存在 `status` 與 `status_lookup_id` 的資料表：

- `employees`
- `orders`
- `shipping_orders`
- `tools`

目前資料檢查結果：

- `orders` 14 筆全部沒有 `status_lookup_id`
- `shipping_orders` 2 筆全部沒有 `status_lookup_id`
- `tools` 11 筆中 8 筆沒有 `status_lookup_id`

本輪 migration 回填後，上述四個模組的有效狀態均已有對應鏡像；原始數字保留作為修復前基線。

修復要求：

- 先定義各模組唯一真實狀態來源。
- 完成 backfill、讀寫切換與相容期策略。
- 更新 API、前端篩選、報表、lookup 顯示與流程狀態機。
- 確認 migration 可重複執行後，再移除 legacy 欄位或正式標記棄用。

### P2-2 修正 `lookup_domains.id = 0` 的錯誤描述

狀態：`已修復，待部署`

進度更新框：

- [x] 調查完成
- [x] 修復完成
- [x] 驗證通過
- [ ] 已部署
- 最後更新：2026-07-18
- 更新摘要：依既有檢閱報告與 `screening_services` 業務語意，透過 migration 將 `service_category` 描述修正為「用於定義服務分類」，不再保留員工狀態誤述。
- 阻塞／待決策：尚未部署至正式環境。

目前 `id = 0` 為 `service_category`，描述卻是員工在職狀態；同一 domain 下已有 `general`、`special` 等代碼值。

修復要求：

- 先確認正式業務語意與歷史資料用途。
- 透過 migration 修正描述，不直接手動修改正式資料庫。
- 檢查所有使用 `service_category` 的表單與報表。

### P2-3 修正 migration 的可重複執行性

狀態：`已修復，待部署`

進度更新框：

- [x] 調查完成
- [x] 修復完成
- [x] 驗證通過
- [ ] 已部署
- 最後更新：2026-07-18
- 更新摘要：原 migration 的外鍵、索引與 ID 欄位 DDL 全部改為存在性判斷後執行；已在已套用 schema 直接重跑成功，schema sync 顯示 Applied 36、Pending 0。
- 阻塞／待決策：乾淨 schema／半套用 schema 的正式更新包演練仍需部署環境執行。

`migrations/2026_07_16_unify_work_order_status.sql` 包含多個未條件化的 `DROP FOREIGN KEY`、`ADD CONSTRAINT` 與 `MODIFY`。

修復要求：

- 每個 DDL 操作都要有存在性判斷或等價的安全策略。
- 同步維護 `tools/sync-local-schema.ps1` 的 `$migrationChecks`。
- 在乾淨 schema、已套用 schema、半套用 schema 分別驗證。
- 更新包部署測試需涵蓋中斷後重試。

### P2-4 修正 `message_attachments` 欄位 COMMENT 編碼

狀態：`已修復，待部署`

進度更新框：

- [x] 調查完成
- [x] 修復完成
- [x] 驗證通過
- [ ] 已部署
- 最後更新：2026-07-18
- 更新摘要：新增 metadata migration，修正 `message_attachments` 表與各欄位 COMMENT；使用 UTF-8 HEX schema check 驗證，並重跑 migration 成功。
- 阻塞／待決策：尚未部署至正式環境。

目前資料庫欄位 COMMENT 已出現亂碼。此問題不一定阻斷功能，但會影響 schema 維護與管理工具可讀性。

## API 合約與下架模組

### P2-5 統一 Domain Event Outbox 的下架回應

狀態：`已修復，待部署`

進度更新框：

- [x] 調查完成
- [x] 修復完成
- [x] 驗證通過
- [ ] 已部署
- 最後更新：2026-07-18
- 更新摘要：`domain_event_outbox` 加入系統參數權限映射；已登入且具權限者收到設計中的 410，無權限者仍先拒絕，避免 403／410 契約混亂。
- 阻塞／待決策：正式移除相關過時文件與資料庫權限名稱可列入部署後清理。

`domain_event_outbox` 已無前端模組，API 設計為回傳 410；目前集中式權限檢查可能先回傳 403。

修復要求：

- 若正式下架，應讓所有相關端點一致回傳 410。
- 若保留管理 API，需補正式權限與文件。
- 同步清理資料庫權限描述與導覽文件中的過時功能說明。

## 稽核工具補強

### P2-6 讓健康度稽核能偵測未註冊 API 模組

狀態：`已修復，待部署`

進度更新框：

- [x] 調查完成
- [x] 修復完成
- [x] 驗證通過
- [ ] 已部署
- 最後更新：2026-07-18
- 更新摘要：健康度治理契約新增 `PERM-3`，掃描 API 模組權限映射與頂層 auth-only 端點；同步補上前後端 domain event mapping，未新增審計問題。
- 阻塞／待決策：尚未部署至正式環境。

目前健康度稽核顯示 0 errors，但未偵測到 `reports`、`workflow_guard`、`rescreen_batch_images` 權限映射缺失。

修復要求：

- 掃描所有使用 `requireAuth()` 的 API 模組。
- 排除明確的公共端點與個人端點後，要求每個模組都有權限映射。
- 特別檢查頂層 `/api/*.php` 端點的授權策略。
- 將報表、流程守門、附件 API 納入自動化測試。

### P2-7 處理目前稽核警告

非立即功能阻斷，但應列入後續維護：

進度更新框：

- [x] 調查完成
- [x] 修復完成
- [x] 驗證通過
- [ ] 已部署
- 最後更新：2026-07-18
- 更新摘要：`status_board/update.php` 僅接受 PUT、delete 僅接受 DELETE；DataSync 已將 9 個明確的 terminal／standalone CRUD 模組排除誤報，P0/P1/P2 均為 0。大型 JS 仍保留 F-1 非阻斷維護提醒，未進行高風險拆檔。
- 阻塞／待決策：大型 JS 拆分屬獨立重構工作，不影響本輪功能修復閉環。

- `status_board/update.php`、`status_board/delete.php` 的 POST fallback
- 9 個 DataSync P2 項目
- 過大的前端 JS：尤其 `js/work_orders.js`、`js/shipping_orders.js`、`js/order_items.js`

## 每批修復完成後的驗證要求

### 共通驗證

```powershell
node tools/validate-config-modules.js
node tools/audit-system-health.js --changed --base origin/main
node tools/audit-system-health.js
node tools/test-audit-system.js
php tools/test-p0-workflow-integrity.php
vendor\bin\phpunit.bat --configuration phpunit.xml
```

### 涉及前端 CRUD／狀態／DataSync

```powershell
node --check js/data-sync.js
node --check tools/audit-data-sync.js
node tools/audit-data-sync.js --write docs/data-sync-audit.md
```

### 涉及 migration／schema

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1
```

另須確認 migration 可重複執行，並檢查更新包是否需要重新建立。

### 涉及入口或側邊欄

- 確認 `index.php` 與 `index.html` 的現行單一入口規範。
- 確認側邊欄、ModuleAssets、權限映射與功能說明同步。
- 逐一驗證可見、可開啟、API 可用與無權限時隱藏／拒絕。

## 建議修復順序

1. P0-1 系統更新 API 授權漏洞
2. P0-2 報表列印權限回歸
3. P1-1 workflow guard 權限回歸
4. P1-2 二次篩選圖片權限回歸
5. P1-3 新增生產工單狀態初始化
6. P1-4 錯誤資訊洩漏
7. P2-1 雙重狀態欄位與資料回填設計
8. P2-3 migration 可重複執行與更新包驗證
9. P2-2、P2-4 資料描述與 metadata 修正
10. P2-5、P2-6、P2-7 共用合約與稽核工具補強
