# 開發進度摘要

更新時間：2026-06-20
目前分支：`main`
目前交付版本：`v3.0.1`

## 1. 專案架構

- 目錄結構：
  - `mobile/`：手機版入口與前端，現有 `index.php`、`mobile.css`、`mobile.js`
  - `api/work_orders/`：工單列表、明細、更新、部分完工 API
  - `api/work_order_completion_images/`、`api/work_order_defect_images/`、`api/work_order_tool_condition_images/`：三類工單現場圖片 API
  - `api/work_order_execution_image_common.php`：三類圖片共用上傳/驗證 helper
  - `api/work_order_operation_logs_helper.php`：工單操作紀錄共用 helper
  - `js/`：桌面前端模組，主要涉及 `js/work_orders.js`、`js/data-sync.js`
  - `modules/`：桌面模組 HTML，主要涉及 `modules/work_orders.html`
  - `migrations/`：資料庫 migration
  - `tools/`：健康檢查、DataSync 稽核、schema 同步、更新包腳本
  - `release-notes/`：版本發布摘要
- 技術棧：
  - 後端：PHP 8、PDO、MySQL 8
  - 前端：原生 JavaScript、HTML、CSS
  - 維運：PowerShell、Node.js
- 本輪主要涉及模組 / API / 資料表：
  - 模組：手機版生產工單、桌面版工單明細、DataSync、更新包流程
  - API：`api/work_orders/index.php`、`show.php`、`update.php`、`partial_receipt.php`、`api/quality_issue_reports/index.php`
  - 資料表：`work_order_completion_images`、`work_order_defect_images`、`work_order_tool_condition_images`、`work_order_operation_logs`

## 2. 已完成功能

- 新增獨立手機版 `/mobile` 生產工單入口：
  - 登入頁與主系統風格一致
  - 工單清單、工單明細、右側抽屜選單、手機頂部縮合 header
- 手機版工單流程已落地：
  - 開工
  - 暫停 / 恢復
  - 部分完工
  - 完工
  - 品質異常回報
  - 完工圖片 / 不良品圖片 / 載具狀況圖片上傳
- 手機端圖片上傳支援：
  - 相機拍照
  - 相簿多選
  - 上傳前預覽 / 移除
  - 依圖片用途導向不同 API
- 桌面版工單明細已補唯讀整合：
  - 完工圖片
  - 不良品圖片
  - 載具狀況圖片
- 手機版與桌面版工單明細已可查看 `operation_logs`
- 工單清單已顯示現場照片數量摘要
- 新圖片表與手機端事件已納入 DataSync / 跨頁刷新基礎
- 新增部署檢查文件：
  - `docs/mobile-deployment-checklist-2026-06-20.md`

### 重要資料庫異動

- 新增 migration：
  - `migrations/2026_06_20_add_work_order_execution_image_tables.sql`
  - `migrations/2026_06_20_add_work_order_operation_logs.sql`
- 新增資料表：
  - `work_order_completion_images`
  - `work_order_defect_images`
  - `work_order_tool_condition_images`
  - `work_order_operation_logs`
- `tools/sync-local-schema.ps1` 的 `$migrationChecks` 已同步更新
- 兩支 migration 已確認可重複執行

### 版本與更新包資訊

- 版本：`v3.0.1`
- Release note：`release-notes/2026-06-20-v3.0.1.txt`
- 正式更新包：`dist/update_v3.0.1_20260620_222753.zip`
- 已確認更新包內含：
  - `manifest.json`
  - `files/mobile/index.php`
  - `files/mobile/mobile.css`
  - `files/mobile/mobile.js`
  - 兩支 migration

## 3. 待修 Bug

- 已知問題：
  - `node tools/audit-system-health.js` 仍有 17 個既有 warning
  - `node tools/audit-data-sync.js --write docs/data-sync-audit.md` 仍有 10 個 P2 `crud_module_without_dependents`
  - 手機版 / 桌面版流程尚未在遠端環境做實機驗證
- 重現條件：
  - 執行 `node tools/audit-system-health.js`
  - 執行 `node tools/audit-data-sync.js --write docs/data-sync-audit.md`
  - 或於遠端部署後實際操作 `/mobile`
- 目前推測原因：
  - 17 個 warning 為既有技術債，包含大型 JS、`status_board` POST fallback、雙重狀態欄位、inline style
  - DataSync P2 為既有 CRUD 模組依賴宣告不完整
  - 遠端風險主要來自未完成實機部署驗證，而非本機語法 / schema 問題

## 4. 下一步任務

- P0：
  - 遠端部署 `v3.0.1` 更新包
  - 驗證 `https://mes.sort.com.tw/mobile`
  - 驗證手機上傳後桌面工單明細能正常讀取三類新圖片與操作紀錄
- P1：
  - 以真實帳號與真實工單資料完整回歸手機流程
  - 驗證手機操作後桌面已開啟頁面的 DataSync / 刷新效果
  - 驗證一鍵更新包於遠端套用後 migration 與路徑均正確
- P2：
  - 清理 `audit-system-health` 17 項既有 warning
  - 清理 `audit-data-sync` 10 項 P2 依賴宣告問題
  - 依遠端實測結果微調手機版欄位與提示

## 5. 驗證狀態

已執行的檢查：

- `node tools/audit-system-health.js`
- `node tools/audit-system-health.js --changed --base origin/main`
- `node --check mobile/mobile.js`
- `node --check js/data-sync.js`
- `node --check js/work_orders.js`
- `node --check script.js`
- `node --check tools/audit-data-sync.js`
- `node tools/audit-data-sync.js --write docs/data-sync-audit.md`
- `php -l index.php`
- `php -l mobile/index.php`
- `php -l api/work_orders/helpers.php`
- `php -l api/work_orders/index.php`
- `php -l api/work_orders/show.php`
- `php -l api/work_orders/update.php`
- `php -l api/work_orders/partial_receipt.php`
- `php -l api/quality_issue_reports/index.php`
- `php -l api/work_order_execution_image_common.php`
- `php -l api/work_order_operation_logs_helper.php`
- `php -l` 三組新圖片 API 的 `index/update/delete`
- `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`
- 兩支 migration 已直接用 `mysql source ...sql` 重複執行驗證
- 更新包 ZIP 內容檢查：已確認 `manifest.json`、`files/mobile/*`、新 API 與 migration 路徑正確

尚未驗證的風險：

- 尚未在遠端環境實際套用 `update_v3.0.1_20260620_222753.zip`
- 尚未驗證遠端 `/mobile` 登入、圖片上傳、桌面讀取、操作紀錄全流程
- `audit-system-health` 17 項 warning 與 DataSync 10 項 P2 仍存在，但非本輪新增阻斷
