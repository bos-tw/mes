# 開發進度摘要

更新時間：2026-06-20  
目前分支：`main`  
本輪版本：`v2.1.5`

## 1. 專案架構

- 目錄結構：
  - `api/`：PHP API，工單相關入口在 `api/work_orders/`
  - `js/`：前端模組，訂單細項與工單主流程在 `js/order_items.js`、`js/work_orders.js`
  - `print/`：列印模板，現行工單為 `print/work_order_print.html`，舊版備份為 `print/work_order_print_legacy_20260620.html`
  - `core/configs/`：配置型模組定義，本輪涉及 `screening_services.config.js`
  - `tools/`：健康檢查、DataSync 稽核、schema 同步、更新包腳本
  - `migrations/`：資料庫 migration
  - `release-notes/`：版本發布摘要
- 技術棧：
  - 後端：PHP 8、PDO、MySQL 8
  - 前端：原生 JavaScript、HTML、CSS
  - 維運工具：PowerShell、Node.js
- 本輪主要涉及模組 / API / 資料表：
  - 模組：篩分服務、訂單細項、工單、工單列印、訂單委託確認單列印
  - API：`api/work_orders/helpers.php`、`api/work_orders/index.php`、`api/work_orders/show.php`
  - 資料表：`work_orders`、`work_order_machine_runs`、`order_items`

## 2. 已完成功能

- 篩分服務 modal 改為雙欄 `6/6`，並縮為標準 `medium` 尺寸。
- 修正工單建立畫面的排程日期列溢出，對齊欄位寬度。
- 修正委託確認單與工單列印中的英文狀態顯示，`return_required` 轉為中文。
- `訂單細項 -> 工單` 建立流程補齊資料寫入：
  - 首件尺寸 `first_piece_dimensions`
  - 載具名稱 `pr_tool_name[]`
  - 載具重量 `pr_tool_weight_kg[]`
  - `production_source_mode`
- 工單 API 新增有效訂單細項唯一防重建保護；重複建立時回傳 `409`。
- `docs/data-sync-audit.md` 與 `tools/audit-data-sync.js` 已中文化。
- 生產命令單列印已改為新版單頁 A4 版型：
  - 一般工單直接套用新版
  - 拆分工單自動依 `work_order_machine_runs` 產生各份執行單，不另印主工單
  - 顯示拆分份數、主工單號、日期星期
  - 保留附件/相片區塊作為未來功能預留
  - 移除舊版「已登錄生產記錄」區塊
  - 線條規格目前為：內線 `0.1mm`、外框 `0.1mm`、章節分隔線 `0.4mm`
- 舊版工單列印模板已保留備份：`print/work_order_print_legacy_20260620.html`

### 重要資料庫異動

- 新增 migration：`migrations/2026_06_20_add_work_order_order_item_unique.sql`
- 內容：在 `work_orders` 新增唯一鍵 `uk_work_orders_order_item_active (order_item_id, delete_token)`
- `tools/sync-local-schema.ps1` 的 `$migrationChecks` 已同步更新
- migration 採可重複執行寫法，schema 同步已驗證 `Pending: 0`

### 版本與更新包資訊

- 版本：`v2.1.5`
- Release note：`release-notes/2026-06-20-v2.1.5.txt`
- 更新包：`dist/update_v2.1.5_20260620_164539.zip`
- 更新包已確認包含 `manifest.json` 與本輪 1 份 migration

## 3. 待修 Bug

- 已知問題：
  - `node tools/audit-system-health.js` 仍有 17 個既有 warning
  - `node tools/audit-data-sync.js` 仍有 10 個 P2 `crud_module_without_dependents`
- 重現條件：
  - 執行 `node tools/audit-system-health.js`
  - 執行 `node tools/audit-data-sync.js --write docs/data-sync-audit.md`
- 目前推測原因：
  - 屬於既有技術債，包含大型 JS 模組、`status_board` POST fallback、`order_items.html` inline style、部分模組雙重狀態欄位語意未收斂
  - DataSync P2 主要是部分 CRUD 模組未宣告下游相依，暫未判定為流程阻斷

## 4. 下一步任務

- P0：
  - 無本輪新發現阻斷問題
- P1：
  - 在實際瀏覽器重新逐頁人工比對新版生產命令單列印版面
  - 以真實資料回歸驗證一般工單與拆分工單的列印內容、份數與欄位映射
  - 在目標環境實際套用 `v2.1.5` 更新包
- P2：
  - 清理 `audit-system-health` 17 項既有警告
  - 清理 DataSync 10 項 P2 相依宣告問題
  - 規劃未來附件/相片上傳功能接入新版工單列印

## 5. 驗證狀態

已執行的檢查：

- `node tools/audit-system-health.js`
- `node tools/audit-system-health.js --changed --base origin/main`
- `node tools/validate-config-modules.js`
- `node tools/audit-data-sync.js --write docs/data-sync-audit.md`
- `node --check js/order_items.js`
- `node --check js/work_orders.js`
- `node --check js/data-sync.js`
- `node --check tools/audit-data-sync.js`
- `php -l api/work_orders/helpers.php`
- `php -l api/work_orders/index.php`
- `php -l api/work_orders/show.php`
- `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`
- 更新包 ZIP 內容檢查：已確認 `manifest.json`、`files/` 與 migration 路徑正確

尚未驗證的風險：

- 尚未重新進行瀏覽器列印預覽的人工版面核對
- 尚未在目標環境實際套用 `v2.1.5` 更新包
- `audit-system-health` 的 17 項 warning 與 DataSync 10 項 P2 仍存在
