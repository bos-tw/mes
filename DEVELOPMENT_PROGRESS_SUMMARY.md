# DEVELOPMENT_PROGRESS_SUMMARY

## 1. 專案架構

- 專案根目錄：`C:\Apache24\htdocs\mes`
- 技術棧：PHP API、MySQL、原生 HTML/CSS/JavaScript、PowerShell 工具鏈
- 主要目錄：
  - `api/`：後端 API、更新器、流程守門
  - `js/`：前端模組邏輯
  - `modules/`：模組 HTML
  - `core/configs/`：配置型模組設定
  - `tools/`：審計、schema、打包、驗包工具
  - `release-notes/`：一鍵更新 release note
  - `docs/`：交接、audit、reference 文件
  - `dist/`：更新包輸出
- 本輪主要涉及模組 / API / 資料表：
  - UI 統一化：`styles.css`
  - 工單 / 訂單品項 / 排程 / 出貨 / 退貨 / 庫存：`js/work_orders.js`、`js/shipping_orders.js`、`js/return_orders.js`、`js/inventory_items.js`、`js/inventory_transactions.js`
  - 對應 HTML：`modules/work_orders.html`、`modules/order_items.html`、`modules/production_work_order_schedule.html`、`modules/return_orders.html`、`modules/shipping_order_return_modals.html`
  - 配置：`core/configs/inventory_items.config.js`、`core/configs/shipping_orders.config.js`
  - 審計 / 打包工具：`tools/audit-system-health.js`、`tools/audit-ui-style.js`、`tools/build-update-package-safe.ps1`、`tools/prepare-one-click-update.ps1`、`tools/verify-update-package.ps1`
  - 文件：`.github/copilot-instructions.md`、`.github/skills/ui-style.md`、`.github/skills/css-style-guide.md`、`docs/ui-standardization-todo-2026-07-08.md`、`docs/ui-standardization-reference-2026-07-08.md`、`docs/ui-style-audit.md`、`docs/data-sync-audit.md`、`docs/one-click-update-rollback-playbook.md`
  - 資料表：本輪未新增或修改資料表；沿用既有 `inventory_items`、`inventory_transactions`、`shipping_orders`、`return_orders`、`work_orders`

## 2. 已完成功能

- 新增 / 修改：
  - 建立 `--ui-*` token 與 compact utility class，收斂 section、table、form row、metric card 密度規格
  - 收斂工單編輯 Modal 與右側統計卡樣式
  - 第一批套用至 `work_orders`、`order_items`、`production_work_order_schedule`、`shipping_orders`、`return_orders`、`inventory_items`、`inventory_transactions`
  - 收斂全域 shell / sidebar / dropdown / alert spacing、padding、radius
  - 新增 UI style audit 工具：`tools/audit-ui-style.js`
  - `tools/audit-system-health.js` 整合 UI style audit 摘要
  - 新增一鍵更新前預檢工具：`tools/prepare-one-click-update.ps1`
  - 新增更新包驗證工具：`tools/verify-update-package.ps1`
  - 補齊 UI reference 與一鍵更新文件
- 重要資料庫異動：
  - 本輪無 migration
  - 無 schema 變更
  - `tools/sync-local-schema.ps1` 的 `$migrationChecks` 無需更新
- 版本與更新包資訊：
  - release note：`release-notes/2026-07-08-v3.0.20.txt`
  - 正式使用 `tools/build-update-package.ps1` 建立更新包：`dist/update_v3.0.20_20260708_184807.zip`
  - 更新包驗證通過：`manifest.json` 存在、`files_root=files`、`version_number=file_version=v3.0.20`

## 3. 待修 Bug

- `node tools/audit-system-health.js` 仍有既有 warning 17 項
  - 重現：直接執行完整 health audit
  - 現況：無 error，但有大型 JS、POST fallback、inline style、雙重狀態欄位等歷史警告
  - 推測原因：歷史技術債，非本輪新增
- `modules/order_items.html` 仍有 inline style warning
  - 重現：完整 health audit 會報 `M-1 HTML 內聯樣式`
  - 推測原因：既有表格 / 區塊殘留 style attribute，尚未完全抽回 CSS
- 更新包尚未在遠端環境實際套用
  - 重現：目前僅完成本機打包與 ZIP 驗證
  - 推測原因：尚未走遠端更新器上傳 / 套用流程

## 4. 下一步任務

- P0
  - 在測試 / 遠端環境實際套用 `dist/update_v3.0.20_20260708_184807.zip`
  - 驗證更新器完整流程：上傳、驗 manifest、套用、回報版本
  - 確認套用後 UI 統一化相關畫面無 CSS regression
- P1
  - 清理 `order_items` 既有 inline style warning
  - 繼續降低全域 hardcoded spacing/radius，特別是 login、tab、badge、舊全域樣式
  - 補 UI 驗收截圖 / 參考畫面
- P2
  - 研究是否將 UI audit 升級為 changed-scope 硬性守門
  - 逐步拆分大型 JS 檔案，降低 `F-1 JS 檔案過大` warning

## 5. 驗證狀態

- 已執行：
  - `node tools/audit-system-health.js`
  - `node tools/audit-system-health.js --changed --base origin/main`
  - `node --check js/inventory_items.js`
  - `node --check js/inventory_transactions.js`
  - `node --check js/return_orders.js`
  - `node --check js/shipping_orders.js`
  - `node --check js/work_orders.js`
  - `node --check tools/audit-system-health.js`
  - `node --check tools/audit-ui-style.js`
  - `node --check js/data-sync.js`
  - `node --check tools/audit-data-sync.js`
  - `node tools/audit-data-sync.js --write docs/data-sync-audit.md`
  - `node tools/audit-ui-style.js --write docs/ui-style-audit.md --max-samples 0`
  - `git diff --check`
  - `powershell -ExecutionPolicy Bypass -File .\tools\verify-update-package.ps1 -ZipPath .\dist\update_v3.0.20_20260708_184807.zip -ExpectedVersionNumber v3.0.20 -ExpectedFileVersion v3.0.20 -ExpectedReleaseDate 2026-07-08`
  - `tools/build-update-package.ps1` 已成功產出更新包
- 尚未驗證風險：
  - 本輪無 PHP API 異動，未執行 `php -l`
  - 本輪無 migration，未執行 schema 套用與 migration 重複執行驗證
  - 更新包尚未在遠端環境實際套用
