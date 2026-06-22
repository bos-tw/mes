# 開發進度摘要

更新時間：2026-06-22  
目前分支：`main`  
最新交付版本：`v3.0.6`  
更新包：`dist/update_v3.0.6_20260622_152759.zip`

## 1. 專案架構

- 目錄結構：
  - `api/`：PHP API、權限、流程守門、報表端點。
  - `js/`：桌面版原生 JavaScript 模組。
  - `core/configs/`：配置化模組定義。
  - `print/`：列印模板。
  - `migrations/`：MySQL migration。
  - `tools/`：schema sync、健康稽核、DataSync 稽核、更新包打包工具。
  - `docs/`、`release-notes/`、`dist/`：技術文件、版本說明、更新包。
- 技術棧：
  - PHP 8、PDO、MySQL 8、Apache 24
  - 原生 JavaScript / HTML / CSS
  - Node.js 稽核工具
  - PowerShell schema sync / 更新包工具
- 本輪主要涉及模組 / API / 資料表：
  - 模組：`shipping_orders`、`shipping_order_items`、`report_descriptions`、`customers`、`inventory_items`、`work_orders`、`production_work_order_schedule`、`defect_history_records`
  - API：`api/shipping_orders/*`、`api/defect_history_records/*`、`api/bootstrap.php`、`api/common/column_manager.js`
  - 資料表：`shipping_orders`、`shipping_order_items`、`shipping_order_defect_summaries`、`shipping_order_tool_summaries`、`work_order_screening_defects`、`work_order_machine_defects`

## 2. 已完成功能

- 出貨單第一階段已落地：
  - `shipment_purpose`、不良品摘要、客戶載具摘要資料結構與 CRUD 已完成。
  - 出貨單主畫面 / 編輯 / 詳情 / 列印已支援上述欄位。
  - A5 列印沿用既有版型，新增不良品摘要與載具摘要。
  - 重量顯示規範已統一為小數點後 2 位。
  - 工單 / 部分入庫可作為出貨摘要建議帶入來源，且仍可人工修改。
  - 修正 SPA 分頁內 form 原生 submit 導致的離站警告。
- 新增不良品歷史紀錄模組：
  - 側邊欄入口、權限映射、模組設定、前端頁面、DataSync 依賴已接上。
  - API 已可彙整工單不良與出貨不良摘要做跨模組查詢。
- 報表 / UI 修正：
  - 四種列表中的客戶名稱已可連到客戶基本資料。
  - 表單備註列印、預覽與標題文案已補齊。
  - 出貨單列印已移除關聯訂單顯示，保留出貨性質。
- 重要資料庫異動：
  - migration：`migrations/2026_06_22_add_shipping_phase1_summary_tables.sql`
  - `tools/sync-local-schema.ps1` 的 `$migrationChecks` 已同步更新。
  - migration 具 `IF EXISTS` / `IF NOT EXISTS` 保護，可重複執行。
- 版本與更新包：
  - release note：`release-notes/2026-06-22-v3.0.6.txt`
  - 更新包：`dist/update_v3.0.6_20260622_152759.zip`
  - ZIP 已確認含 `manifest.json` 與本輪 migration。

## 3. 待修 Bug

- 無本輪新增且已確認的阻擋級功能 bug。
- 已知問題仍以健康稽核既有 warning 為主：
  - `api/status_board/update.php`、`api/status_board/delete.php` 仍允許 POST fallback。
  - 多個 JS 檔案過大，`js/shipping_orders.js`、`js/work_orders.js`、`js/orders.js` 等已超過建議上限。
  - 多個模組仍存在 `status` / `status_lookup_id` 雙重狀態欄位。
- 重現條件：
  - 執行 `node tools/audit-system-health.js`
- 目前推測原因：
  - 歷史模組累積、流程型 API 沿用舊相容策略、前端單檔功能持續擴張尚未拆模組。

## 4. 下一步任務

- P0
  - 實機驗證出貨單第一階段：建立、編輯、加入品項、列印、純載具歸還、純不良品回送。
  - 驗證更新包 `v3.0.6` 透過系統更新介面可正常套用。
  - 依 `docs/shipping-phase2-implementation-plan-2026-06-22.md` 啟動第二階段第一項：出貨品質檢驗整合。
- P1
  - 補出貨品質檢驗與出貨單的顯示 / 建立入口 / 基本關聯。
  - 補不良品追溯與出貨 / 退貨 / 工單導頁串接。
  - 規劃客戶載具往來總帳資料模型與結餘口徑。
- P2
  - 清理 `audit-system-health` 既有 warning。
  - 拆分過大的前端模組。
  - 整理雙重狀態欄位策略。

## 5. 驗證狀態

- 已執行：
  - `node tools/audit-system-health.js`
  - `node tools/audit-system-health.js --changed --base origin/main`
  - `node tools/validate-config-modules.js`
  - `node --check`：
    - `api/common/column_manager.js`
    - `core/configs/shipping_orders.config.js`
    - `core/configs/defect_history_records.config.js`
    - `core/module-renderer.js`
    - `script.js`
    - `js/customers.js`
    - `js/data-sync.js`
    - `js/defect_history_records.js`
    - `js/inventory_items.js`
    - `js/orders.js`
    - `js/production_work_order_schedule.js`
    - `js/report_descriptions.js`
    - `js/shipping_orders.js`
    - `js/work_orders.js`
    - `tools/audit-data-sync.js`
  - `php -l`：
    - `api/bootstrap.php`
    - `api/shipping_orders/index.php`
    - `api/shipping_orders/show.php`
    - `api/shipping_orders/update.php`
    - `api/defect_history_records/helpers.php`
    - `api/defect_history_records/index.php`
    - `api/defect_history_records/update.php`
    - `api/defect_history_records/delete.php`
    - `index.php`
  - `node tools/audit-data-sync.js --write docs/data-sync-audit.md`：`P0=0`、`P1=0`
  - `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`：`Applied: 21, Pending: 0`
  - `tools/build-update-package.ps1`：已產出 `v3.0.6` 更新包
- 尚未驗證風險：
  - 未做完整瀏覽器實機回歸與列印視覺驗證。
  - 未透過系統更新介面實際套用 `v3.0.6`。
  - 未做完整端到端資料流回歸（工單 → 庫存 → 出貨 → 退貨 / 二次重篩）。
