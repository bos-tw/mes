# 開發進度摘要

更新時間：2026-06-25
目前分支：`main`
基準 commit：`18de4e0`
本輪交付版本：`v3.0.12`

## 1. 專案架構

### 目錄與技術棧

- `index.php`：正式 SPA 主入口；`index.html` 僅為相容轉址頁。
- `modules/`：模組 HTML；`js/`：原生 JavaScript 模組與 DataSync。
- `core/configs/`：配置型模組定義。
- `api/`：PHP REST API；共用權限與回應邏輯位於 `api/bootstrap.php`。
- `migrations/`：MariaDB/MySQL migration；`tools/sync-local-schema.ps1` 負責本機 schema 同步。
- `tools/`：系統健康、配置模組、DataSync 與更新包建置工具。
- 技術棧：Apache + PHP + MariaDB/MySQL + 原生 JavaScript/HTML/CSS。

### 本輪範圍

- 模組：`rescreen_batches`、`work_orders`、`defect_history_records`。
- API：`api/rescreen_batches/*`、`api/work_orders/*`、`api/defect_history_records/helpers.php`。
- 前端：`modules/rescreen_batches.html`、`modules/work_orders.html`、對應 JS/config、`index.php`、`styles.css`。
- 資料表：`rescreen_batches`、`rescreen_batch_items`；關聯來源包含工單、退貨單與不良品歷史。

## 2. 已完成功能

- 將「二次重篩」統一改為「二次篩選」，並完成兩種原因分類：
  - `relaxed_after_high_defect`：首次篩選不良過多，客戶放寬標準後再次篩選。
  - `customer_required_second_pass`：客戶要求每批固定進行二次篩選。
- 二次篩選案件可由退貨單、生產工單或不良品歷史建立，不再強制依附退貨單。
- 二次篩選保留原因、客戶通知/標準佐證、來源工單、來源不良紀錄、明細與處理紀錄。
- 生產工單列表及編輯視窗可查看二次篩選狀態、原因與案件連結，也可依情境建立案件。
- 不良品歷史可建立或開啟對應二次篩選案件。
- 側邊欄、權限別名、模組標題與 API 訊息已統一為「二次篩選」。
- `.github/copilot-instructions.md` 已加入禁止以 MVP/最小版交付、每批施工須完成範圍內功能閉環的規範。
- 二次篩選設計、實作計畫與 TODO 已整理於 `docs/second-screening-*.md`。

### 資料庫異動

- migration：`migrations/2026_06_25_refine_second_screening_model.sql`。
- `rescreen_batches.source_return_order_id` 改為 nullable。
- `rescreen_batch_items.return_order_item_id` 改為 nullable。
- `rescreen_batches` 新增：
  - `second_screening_reason`
  - `customer_approval_reference`
  - `source_requirement_id`
  - `source_defect_history_record_id`
- migration 具重複執行安全性，並已加入 `tools/sync-local-schema.ps1` 的 `$migrationChecks`。

### 版本與更新包

- Release note：`release-notes/2026-06-25-v3.0.12.txt`，僅保留最新三筆。
- 最終更新包：`dist/update_v3.0.12_20260625_133748.zip`。
- 建置工具：`tools/build-update-package.ps1`。
- 更新包包含 25 個本輪執行檔案、1 個 migration、`manifest.json`；ZIP 已驗證無缺檔。

## 3. 待修 Bug / 已知缺口

- 尚未發現本輪功能的已知可重現程式錯誤。
- 尚未以瀏覽器完整操作兩種二次篩選情境；可能風險集中在 modal 排版、按鈕導頁、權限角色顯示與跨分頁刷新。
- 尚未在遠端環境實際套用更新包；遠端資料量、既有資料內容與 DB 權限可能暴露本機未出現的 migration/API 問題。
- `source_requirement_id` 目前只有預留欄位，專案尚無客戶固定二篩要求主檔可正式關聯；目前固定二篩依原因與客戶佐證追溯。
- 完整系統健康審計仍有 17 個既有 warning，非本輪新增。

## 4. 下一步任務

### P0

- 在測試或正式前環境套用 `v3.0.12` 更新包，確認 manifest、migration、版本紀錄與更新後登入皆正常。
- 以瀏覽器逐一驗證兩條完整流程：不良過多放寬後二篩、客戶固定每批二篩；確認建立、編輯、明細、追溯與工單回看。
- 使用有權限/無權限角色驗證「二次篩選」側邊欄、API 權限及舊權限相容。

### P1

- 驗證跨分頁 DataSync：工單、不良品歷史與二次篩選頁面同時開啟時，新增/更新/刪除後狀態一致。
- 依實際使用回饋補強二次篩選詳情中的篩選人員、時間與結果呈現。
- 若要制度化「每批固定二篩」，設計客戶/訂單層級要求主檔並正式接上 `source_requirement_id`。

### P2

- 逐步處理完整健康審計的 17 個既有 warning。
- 評估拆分持續增長的 `js/work_orders.js`，降低大型模組維護風險。

## 5. 驗證狀態

### 已完成

- `node tools/audit-system-health.js`：0 errors；17 個既有 warning。
- `node tools/audit-system-health.js --changed --base origin/main`：0 new / 0 blocking。
- `node tools/validate-config-modules.js`：通過。
- 本輪異動 JavaScript 與 DataSync 工具的 `node --check`：全部通過。
- 本輪異動 PHP API 與入口的 `php -l`：全部通過。
- `node tools/audit-data-sync.js --write docs/data-sync-audit.md`：P0=0、P1=0。
- `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`：23 applied、0 pending。
- migration 直接連續執行兩次：均成功。
- 更新包 ZIP：`manifest.json` 存在、25 個指定檔案無缺漏、migration 已包含。

### 尚未驗證

- 遠端環境實際更新與回滾演練。
- 瀏覽器端完整 CRUD、modal 視覺、角色權限與跨分頁回歸。
- 大量既有資料下的查詢效能與特殊歷史資料相容性。
