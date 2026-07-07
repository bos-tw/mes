# DEVELOPMENT_PROGRESS_SUMMARY

## 1. 專案架構

- 專案根目錄：`C:\Apache24\htdocs\mes`
- 技術棧：PHP API、MySQL/MariaDB、原生 HTML/CSS/JavaScript、PowerShell schema/更新包工具。
- 主要目錄：
  - `api/`：後端 API 與流程守門。
  - `js/`：前端功能模組邏輯。
  - `modules/`：主系統模組 HTML。
  - `print/`：列印模板。
  - `docs/`：審計報告與交接文件。
  - `release-notes/`：更新包 release note。
  - `tools/`：健康審計、DataSync 審計、schema 同步與更新包打包工具。
  - `dist/`：一鍵更新包輸出。
- 本輪主要涉及模組 / API / 資料表：
  - 生產工單編輯：`js/work_orders.js`、`styles.css`。
  - 工單更新 API：`api/work_orders/update.php`。
  - 生產命令單列印：`print/work_order_print.html`.
  - DataSync 審計報告：`docs/data-sync-audit.md`。
  - 更新包說明：`release-notes/2026-07-07-v3.0.19.txt`。
  - 資料表：未新增或修改資料表；使用既有 `work_orders`、`production_records`、`work_order_screening_defects`。

## 2. 已完成功能

- 生產工單編輯：
  - 修正一般工單「篩分服務明細」不良品數量欄位可操作性，避免欄寬壓縮造成難以修改。
  - 編輯送出時，只要篩分服務表格已載入，就送出目前不良明細狀態，讓既有不良品數量可改回 `0` 並清除。
  - 不良品數量新增非負整數前端防呆；空值視為 `0`，負數或小數會提示並停止送出。
  - 修正一般工單「生產排程」圈選欄位儲存：指定員工、指定機台、校機人員、生產數量會從排程區明確寫入 payload，避免自訂選單或版面變動造成漏送。
- 工單完工重量守門：
  - 修正已完成一般工單再次編輯生產重量時的超重漏洞。
  - `api/work_orders/update.php` 現在只要儲存後狀態仍為已完成，就用最新生產紀錄重新檢查良品淨重不可超過工單預期淨重。
- 生產命令單列印：
  - 移除標題下方資訊區的中間細線，保留上方粗分隔線。
  - 將「預計交期：YYY/MM/DD（週X）」移入標題下方資訊區，並加大加粗。
  - 拆分工單時交期字級略縮小，避免與拆分標記擠出 A4 寬度。
- 重要資料庫異動：
  - 無 migration。
  - 無 schema 變更。
  - `tools/sync-local-schema.ps1` 無需更新 `$migrationChecks`。
- 版本與更新包：
  - 新增 `release-notes/2026-07-07-v3.0.19.txt`，內容固定 3 行。
  - 已使用 `tools/build-update-package.ps1` 建立更新包：`dist/update_v3.0.19_20260707_221257.zip`。
  - 更新包版本：`v3.0.19`，`FileVersion=v3.0.19`，`ReleaseDate=2026-07-07`。
  - 更新包包含 files 7、migrations 0；已確認 zip 內有 `manifest.json`。

## 3. 待修 Bug

- 全域健康審計仍有既有 warning：
  - 重現條件：執行 `node tools/audit-system-health.js`。
  - 目前結果：錯誤 0、警告 17、提示 11。
  - 目前推測原因：既有技術債，包含大型 JS、既有 POST fallback、既有 inline style、雙重狀態欄位等；本輪 changed audit 未新增阻擋問題。
- 生產命令單列印版面仍需人工驗收：
  - 重現條件：以瀏覽器列印預覽 A4，檢查標題下方預計交期區域、QR 備註區與長資料情境。
  - 目前推測原因：列印版面受資料長度、瀏覽器列印縮放、拆分工單標記與圖片/備註內容影響，自動化檢查無法完全覆蓋。
- 更新包尚未實機套用：
  - 重現條件：在測試或遠端環境套用 `dist/update_v3.0.19_20260707_221257.zip`。
  - 目前推測原因：本機已完成打包與 manifest 檢查，但尚未在目標環境走更新器流程。

## 4. 下一步任務

- P0：
  - 在測試或遠端環境實際套用 `dist/update_v3.0.19_20260707_221257.zip`。
  - 以瀏覽器列印預覽人工驗收生產命令單 A4 版面，確認預計交期區域與 QR 備註區不超出紙張。
  - 以已完成工單測試：修改生產紀錄重量超過工單預期淨重時，後端應回傳 409 並阻擋儲存。
- P1：
  - 回歸一般工單編輯：不良品數量改為 `0`、排程四欄修改/清空後重新開啟仍正確保存。
  - 驗證 DataSync 跨分頁刷新：工單更新後相關列表與依賴模組狀態不殘留舊資料。
  - 驗證拆分工單列印時預計交期與拆分標記在 A4 寬度內。
- P2：
  - 逐步拆分大型 JS 檔案，降低健康審計 F-1 warning。
  - 逐步處理既有 POST fallback、inline style、雙重狀態欄位等健康審計 warning。
  - 補強列印模板自動化視覺回歸檢查。

## 5. 驗證狀態

- 已執行：
  - `git fetch --all --prune`
  - `git checkout main`
  - `git pull --ff-only origin main`
  - `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`：Applied 29、Pending 0、schema already in sync。
  - `node --check js/work_orders.js`
  - `node --check js/data-sync.js`
  - `node --check tools/audit-data-sync.js`
  - `node tools/audit-data-sync.js --write docs/data-sync-audit.md`：P0 0、P1 0、P2 10。
  - `php -l api/work_orders/update.php`
  - `php -l api/work_orders/helpers.php`
  - `php -r '... validateWorkOrderData(...)'`：排程四欄 payload 驗證通過。
  - `php -r '... insertWorkOrderProductionRecords(...); fetchWorkOrderProductionSummary(...); rollBack();'`：已完成工單超重 smoke test 判定 `over_limit=true`。
  - `node tools/audit-system-health.js --changed --base origin/main`：新增 0、阻擋 0。
  - `node tools/audit-system-health.js`：錯誤 0、警告 17、提示 11。
  - `git diff --check`：無 whitespace error。
  - `tools/build-update-package.ps1` 建立 `dist/update_v3.0.19_20260707_221257.zip`：files 7、migrations 0。
  - 更新包檢查：`manifest.json` 存在，manifest 版本 `v3.0.19`，files 7，migrations 0。
- 尚未驗證風險：
  - 更新包尚未在測試或遠端環境實際套用。
  - 生產命令單尚未由使用者完成實機 A4 預覽/列印驗收。
  - 本輪無 migration；未執行新增 migration 的重複套用驗證。
