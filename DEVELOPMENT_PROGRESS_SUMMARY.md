# 開發進度摘要（更新：2026-05-17）

## 專案架構

- 根目錄：C:/Apache24/htdocs/mes
- 技術棧：
  - 後端：PHP 8（api/* 模組化端點，`bootstrap.php` 權限/驗證）
  - 前端：Vanilla JS + HTML + CSS（IIFE 模組、`data-action` 事件委派）
  - 配置化 UI：`core/module-config.js` + `core/module-renderer.js` + `core/configs/*.config.js`
  - 跨分頁同步：`js/data-sync.js`（module helper + dependency broadcast）
  - 資料庫：MySQL（`migrations/*.sql`）
- 工具鏈：
  - 驗證：`tools/validate-config-modules.js`、`tools/audit-system-health.js`、`tools/audit-data-sync.js`
  - 打包：`tools/build-update-package.ps1`、`tools/build-update-package-safe.ps1`
  - 本機 schema 同步：`tools/sync-local-schema.ps1`

## 已完成功能

1. 事件/提醒個人化權限模型完成（行事曆）
- `dashboard_calendar_events` 與 `calendar_event_reminders` API 全面改為「本人資料本人可見/可改」。
- create/update/delete 與查詢皆加上 employee ownership 條件。
- 影響檔：`api/dashboard_calendar_events/*.php`、`api/calendar_event_reminders/*.php`、`api/dashboard/calendar_events.php`

2. 提醒模組前端改為完全個人模式
- 移除員工選擇欄位，提醒預設與綁定當前登入者。
- 影響檔：`core/configs/calendar_event_reminders.config.js`、`js/calendar_event_reminders.js`

3. Dashboard 行事曆改版（節點化）
- 篩選改為下拉：訂單 / 工單 / 交貨 / 全部（預設訂單）。
- 事件改為關鍵節點顯示，不再呈現跨度長條。
- 同一事件起訖節點同色（穩定 hash 調色），點任一節點開同一詳情流程。
- 影響檔：`core/configs/dashboard.config.js`、`js/dashboard.js`、`styles.css`

4. ICON 規範落地與文件化
- 行事曆圖例/節點由 emoji 改為 Font Awesome。
- 新增強制規範：禁止 emoji、`core/configs` 用 `fa-*`、動態渲染用 `fas fa-*`，並定義 Dashboard 節點 icon 對照。
- 影響檔：`.github/copilot-instructions.md`、`.github/instructions/ui-style.instructions.md`

5. 權限系統延續改善（本輪仍在工作樹）
- RBAC alias 相容、role_permissions 權限主軸流程、employee_roles 錯誤訊息改善。
- 權限中文化 migration 與 schema 同步規則已就位。

6. 更新包已產出（可一鍵更新）
- 版本：`v2.0.2`
- 變更摘要：`release-notes/2026-05-17-v2.0.2.txt`
- 輸出：`dist/update_v2.0.2_20260517_101233.zip`
- 打包統計：主檔 39、migration 1
- 覆蓋驗證：`MISSING_MAIN=0`、`MISSING_MIG=0`

## 待修 Bug

1. 健康審計基線仍未過（歷史技術債）
- 重現：`node tools/audit-system-health.js`
- 現況：Errors 34 / Warnings 27 / Hints 8
- 主因：
  - J-2：多模組 `innerHTML` 未 `escapeHtml`
  - F-1：`orders/order_items/work_orders/shipping_orders` 檔案過大

2. 架構警示：status_board 仍有 POST fallback
- 重現：`node tools/audit-system-health.js`
- 現象：`api/status_board/update.php`、`api/status_board/delete.php`（A-3）

3. DataSync 覆蓋仍有 P2 項
- 重現：`node tools/audit-data-sync.js --write docs/data-sync-audit.md`
- 現況：P0=0、P1=0、P2=10（crud_module_without_dependents）

## 下一步任務（優先順序）

1. P0：遠端套用並驗收 `v2.0.2`
- 驗收重點：
  - 事件/提醒個人化存取是否符合預期
  - Dashboard 節點化與下拉篩選
  - ICON 規範視覺一致性
  - migration `2026_05_16_update_permissions_display_names.sql` 生效

2. P0：處理 J-2 安全風險（XSS）
- 優先模組：`orders`、`order_items`、`work_orders`、`customers`
- 目標：健康審計錯誤數顯著下降

3. P1：拆分大型 JS 模組（F-1）
- 優先：`js/order_items.js`、`js/work_orders.js`
- 拆分策略：api layer / render layer / controller layer

4. P1：補齊 DataSync notify 與相依表
- 針對 CRUD 模組補 `notifyCreated/Updated/Deleted`
- 回歸：`tools/audit-data-sync.js` 與雙分頁即時刷新清單

5. P2：收斂規範警示
- 移除 `status_board` POST fallback
- 修正 modules 按鈕 class 與 inline style 遺留項
