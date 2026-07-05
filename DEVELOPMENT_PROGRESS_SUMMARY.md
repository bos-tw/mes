# DEVELOPMENT_PROGRESS_SUMMARY

## 1. 專案架構

- 專案根目錄：`C:\Apache24\htdocs\mes`
- 技術棧：PHP API、MySQL/MariaDB、原生 HTML/CSS/JavaScript、PowerShell 更新與 schema 工具。
- 主要目錄：
  - `api/`：後端 API 與列印資料來源。
  - `core/configs/`：配置型模組欄位與 UI 設定。
  - `js/`：前端模組邏輯。
  - `modules/`：主系統模組 HTML。
  - `print/`：列印模板。
  - `help/`、`docs/`：系統說明與使用指南。
  - `release-notes/`：更新包 release note。
  - `tools/`：審計、schema 同步、更新包打包工具。
  - `dist/`：一鍵更新包輸出。
- 本輪主要涉及模組 / API / 資料表：
  - 品質檢驗報表：`print/screening_inspection_print.html`、`api/reports/screening_inspection.php`、`api/reports/templates/qrcode_report.tpl.html`。
  - 報表描述：`api/report_descriptions/index.php`、`api/report_descriptions/show.php`、`modules/report_descriptions.html`、`core/configs/report_descriptions.config.js`、`js/report_descriptions.js`。
  - 生產命令單列印：`print/work_order_print.html`、`js/work_orders.js`。
  - 客戶光篩代工委託確認單：`print/order_confirmation_print.html`、`api/orders/public_info.php`。
  - 系統說明與操作文案：`script.js`、`help/content.js`、`help/workflow-content.js`、`docs/2026-02-10 系統使用指南更新記錄.md`。
  - 資料表：本輪未新增或修改資料表；使用既有 `customers.minimum_order_amount`。

## 2. 已完成功能

- 品質檢驗報表名稱統一：
  - 將正式使用中的「篩分檢驗結果報表 / Screening Inspection Report」統一為「品質檢驗報表 / Quality Inspection Report」。
  - 同步列印頁標題、QR 線上報表模板、報表描述預設值、按鈕提示與說明文件。
  - 品質檢驗報表「操作人員 / Assigned Operator」欄位改為「架機人員 / Machine Setup Operator」。
- 生產命令單列印：
  - 將手機上傳 QR Code 從頁首移至底部備註區右側。
  - 移除 QR Code 標題，QR 保持正方形，尺寸依左側「備註」含標題總高度同步。
  - 備註欄位自動延伸吃剩餘寬度。
- 客戶光篩代工委託確認單：
  - `api/orders/public_info.php` 回傳客戶最低委託額度。
  - `print/order_confirmation_print.html` 的「單批不足量以 X 元計」改用 `customers.minimum_order_amount`，不再硬寫 `2000`。
  - 客戶低消為空或 `0` 時不顯示不足量提示。
- 重要資料庫異動：
  - 無 migration。
  - 無 schema 變更。
- 版本與更新包：
  - 新增 `release-notes/2026-07-05-v3.0.18.txt`，內容固定 3 行。
  - 已使用 `tools/build-update-package.ps1` 建立更新包：
    `dist/update_v3.0.18_20260705_211625.zip`
  - 更新包版本：`v3.0.18`，`FileVersion=v3.0.18`，`ReleaseDate=2026-07-05`，migrations 0。
  - ZIP 已確認包含 `manifest.json`，manifest 顯示 `migrations=0`。

## 3. 待修 Bug

- 全域健康審計仍有既有 warning：
  - 重現條件：執行 `node tools/audit-system-health.js`。
  - 目前結果：錯誤 0、警告 17、提示 11。
  - 目前推測原因：既有技術債，包含大型 JS、既有 POST fallback、既有 inline style、雙重狀態欄位等；本輪 changed audit 未新增阻擋問題。
- 列印版面仍需人工驗收：
  - 重現條件：以瀏覽器列印預覽 A4，檢查品質檢驗報表、生產命令單、客戶光篩代工委託確認單。
  - 目前推測原因：列印版面受資料量、圖片數量、瀏覽器列印縮放與頁尾空間影響，自動化檢查無法完全覆蓋。

## 4. 下一步任務

- P0：
  - 在測試或遠端環境實際套用 `dist/update_v3.0.18_20260705_211625.zip`。
  - 以瀏覽器列印預覽人工驗收三份列印模板：品質檢驗報表、生產命令單、客戶光篩代工委託確認單。
- P1：
  - 針對客戶低消不同數值測試確認單顯示：空值、0、整數、小數、低於/高於訂單總額。
  - 驗證生產命令單 QR Code 在不同備註長度、圖片數量與卡號分欄情境下仍維持 A4 版面。
  - 檢查報表名稱變更後，角色權限、報表描述設定與說明頁搜尋是否符合使用者預期。
- P2：
  - 逐步拆分大型 JS 檔案，降低健康審計 F-1 warning。
  - 清理或標記 `.old` 歷史模板，避免未來誤用舊文案。
  - 逐步處理健康審計既有 warning。

## 5. 驗證狀態

- 已執行：
  - `git fetch --all --prune`
  - `git checkout main`
  - `git pull --ff-only origin main`
  - `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`：Applied 29、Pending 0、schema already in sync。
  - `node tools/audit-system-health.js`：錯誤 0、警告 17。
  - `node tools/audit-system-health.js --changed --base origin/main`：新增 0、阻擋 0。
  - `node tools/validate-config-modules.js`：通過。
  - `node --check script.js`
  - `node --check js/report_descriptions.js`
  - `node --check js/work_orders.js`
  - `node --check help/content.js`
  - `node --check help/workflow-content.js`
  - `node --check core/configs/report_descriptions.config.js`
  - `php -l api/orders/public_info.php`
  - `php -l api/report_descriptions/index.php`
  - `php -l api/report_descriptions/show.php`
  - `php -l api/reports/screening_inspection.php`
  - 更新包檢查：`manifest.json` 存在，files 17，migrations 0。
- 尚未驗證風險：
  - 更新包尚未在遠端環境實際套用。
  - 列印模板尚未由使用者完成實機 A4 預覽/列印驗收。
  - 本輪無 migration；未新增 migration 重複執行驗證需求。
