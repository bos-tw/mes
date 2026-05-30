# 開發進度摘要

更新時間：2026-05-30
目前基底 commit：ba8dba9
本輪版本：v2.0.8

## 1. 專案架構

### 目錄結構與技術棧

- 後端：PHP API，位於 `api/`，共用啟動與權限邏輯在 `api/bootstrap.php`，資料庫連線在 `api/config.php`。
- 前端：原生 JavaScript 模組，位於 `js/`，模組配置位於 `core/configs/`，頁面片段位於 `modules/`。
- 列印：HTML 列印模板位於 `print/`，本輪主要修改訂單確認單。
- DB：MySQL 8，本機同步腳本為 `tools/sync-local-schema.ps1`，migration 位於 `migrations/`。
- 診斷工具：`tools/audit-system-health.js`、`tools/audit-data-sync.js`、`tools/validate-config-modules.js`。
- 開發規範：`.github/copilot-instructions.md`，本輪新增流程型資料刪除守門規範。

### 本輪主要涉及模組

- 訂單主表：`orders`
- 客戶批號 / 訂單品項：`order_items`
- 生產工單：`work_orders`
- 庫存項目：`inventory_items`
- 出貨單：`shipping_orders`
- 流程刪除守門：`workflow_guard`
- 訂單確認單列印：`print/order_confirmation_print.html`

### 本輪主要涉及資料表

- `orders`
- `order_items`
- `order_item_attachments`
- `order_item_drawings`
- `work_orders`
- `inventory_items`
- `inventory_transactions`
- `shipping_orders`
- `shipping_order_items`
- `return_orders`
- `shipping_quality_inspections`

## 2. 已完成功能

### 新增或修改項目

- 新增 `orders.expected_delivery_period`，支援預計交期時段：上午、中午、下午、晚間。
- 調整訂單編輯 modal 寬度，避免左右過寬，並在預計交期旁顯示交期時段欄位。
- 訂單確認單列印新增客戶訂單編號，來源改為訂單主表的 `customer_order_number`。
- 訂單確認單的訂單日期、預計交期改成一致顯示格式，預計交期右側顯示上午/中午/下午/晚間。
- 修正複製客戶批號細項時，圖面附件與檔案附件未同步複製的問題。
- 修正庫存轉出貨單流程：前端送出欄位、後端回傳 `shipping_order_id`、跳轉出貨單、列表即時刷新。
- 修正工單轉庫存時數量/重量可能變成 0 的問題。
- 工單建立與完成轉庫存時，會從訂單細項補齊總重、淨重、單重、總支數、載具重量、載具數量。
- 新增資料修復 migration，回補既有工單、庫存與入庫異動缺失的數量/重量。
- 新增流程刪除守門機制，避免訂單 > 工單 > 庫存 > 出貨流程產生幽靈資料。
- 出貨單刪除改為軟刪 `shipping_orders.deleted_at`，保留 `shipping_order_items` 追溯資料；未出貨狀態刪除會釋放庫存配貨。
- 前端刪除前加入 workflow guard 預檢，提示流程影響；目前仍以 `confirm()` 過渡，後續要改成標準 modal。
- `.github/copilot-instructions.md` 已寫入流程型資料刪除守門規範與標準 modal 文案。
- `tools/audit-system-health.js` 新增 `WF-1`，可檢查流程刪除守門是否接好。

### 修改檔案清單

- `.github/copilot-instructions.md`
- `DEVELOPMENT_PROGRESS_SUMMARY.md`
- `api/common/workflow_guard.php`
- `api/workflow_guard/check.php`
- `api/inventory_items/delete.php`
- `api/inventory_items/helpers.php`
- `api/order_items/index.php`
- `api/order_items/update.php`
- `api/orders/delete.php`
- `api/orders/helpers.php`
- `api/orders/index.php`
- `api/orders/public_info.php`
- `api/shipping_orders/add_item.php`
- `api/shipping_orders/delete.php`
- `api/work_orders/delete.php`
- `api/work_orders/helpers.php`
- `api/work_orders/index.php`
- `api/work_orders/update.php`
- `core/configs/inventory_items.config.js`
- `core/configs/orders.config.js`
- `js/inventory_items.js`
- `js/order_items.js`
- `js/orders.js`
- `js/shipping_orders.js`
- `js/work_orders.js`
- `print/order_confirmation_print.html`
- `tools/audit-system-health.js`
- `tools/sync-local-schema.ps1`
- `migrations/2026_05_30_add_orders_expected_delivery_period.sql`
- `migrations/2026_05_30_backfill_work_order_inventory_metrics.sql`
- `release-notes/2026-05-30-v2.0.8.txt`

### 版本號、更新包、migration

- 本輪版本：`v2.0.8`
- 更新包已建立：`dist/update_v2.0.8_20260530_221737.zip`
- 注意：使用者後續表示遠端無法執行診斷工具，因此本輪最後只更新本地診斷工具，不需重打更新包。
- 新增 migration：`migrations/2026_05_30_add_orders_expected_delivery_period.sql`
- 新增 migration：`migrations/2026_05_30_backfill_work_order_inventory_metrics.sql`
- `tools/sync-local-schema.ps1` 已加入上述 migration 檢查。
- 本機已執行 schema 同步腳本，`expected_delivery_period` 與 backfill migration 已套用。

### 本機資料庫已做的資料修復

- 恢復測試用軟刪庫存資料，讓使用者可繼續測試。
- 修復 `WO-20260530-0001` / `ORDER-20260505-0001` / `INV-20260530-0004` 的數量與重量：由訂單細項回填總重、淨重、總支數、載具重量、載具數量與入庫異動數量。
- 這些資料修復已由 backfill migration 覆蓋可重複執行邏輯，遠端可透過 migration 修補同類資料。

## 3. 重要決策與規範

### 已定稿流程決策

- MES 核心流程視為：訂單 > 工單 > 庫存 > 出貨 > 退貨/沖銷。
- 已進入後續流程的資料不可當作普通 CRUD 直接刪除。
- 刪除語意分三類：真正刪除/軟刪除、退回上一步、作廢/沖銷/退貨。
- 後端必須用 `api/common/workflow_guard.php` 做最終守門，前端 confirm 或 modal 不能取代後端檢查。
- 前端刪除前必須呼叫 `api/workflow_guard/check.php?module={module}&action=delete&id={id}`。
- 不允許刪除時，API 應回傳 HTTP 409 與 `workflow_guard` 詳細資訊。
- 出貨單刪除不可硬刪；需軟刪主檔、保留明細追溯。
- 從工單轉庫存時，不可產生 0 數量庫存；若工單數量缺失，要回源訂單細項補值。

### 標準流程影響 modal 方向

目前前端先以 `confirm()` 過渡，但下一輪應補標準 modal。理想文案如下：

```text
此資料已進入後續流程

目前流程：
訂單 ORDER-xxx
  → 工單 WO-xxx
  → 庫存 INV-xxx
  → 尚未出貨

可執行動作：
[退回工單] [作廢庫存] [取消]
```

按鈕應依流程狀態提供，不可提供會造成追溯斷鏈的動作。

### 使用者明確偏好

- 使用者偏好直接進資料庫與程式修正，不要只提供建議。
- 使用者重視流程追溯，不能讓資料「消失但不回上游也不到下游」。
- 使用者認同「詢問是否退回上個流程」與「依狀態提供退回/作廢/取消」的防呆設計。
- 訂單確認單資訊要跟畫面欄位連動，不可寫死或抓錯來源。
- 更新包要注意版本號與 migration，不可漏 DB 異動。

### 下一輪不可重犯

- 不可讓工單完成轉庫存產生 0 數量庫存。
- 不可直接刪除已銜接後續流程的訂單、工單、庫存或出貨單。
- 不可只在前端擋刪除，後端 delete API 一定要守門。
- 不可硬刪出貨單明細，否則追溯會斷。
- 不可只新增 migration 卻忘記更新 `tools/sync-local-schema.ps1`。
- 不可只更新 `DEVELOPMENT_PROGRESS_SUMMARY.md` 以外的分散追蹤文件；對話收尾統一更新此檔。

## 4. 待修 Bug

### 已知問題

- `tools/audit-system-health.js` 仍會因既有專案健康度問題回傳失敗。
- 既有問題包含：多個大型 JS 檔超過行數限制、許多 `innerHTML` 未包 `escapeHtml()` 的 XSS 風險、部分 module HTML 按鈕 class 缺少 `btn` 前綴、部分模組 DataSync notify 不完整、部分 API 同時使用 `status` 與 `status_lookup_id`。
- 前端流程刪除提示目前仍是瀏覽器 `confirm()` 過渡，尚未做成標準 modal。
- `workflow_guard` 目前涵蓋 `orders`、`work_orders`、`inventory_items`、`shipping_orders`，但規範中列出的 `order_items`、`shipping_order_items`、`return_orders` 還需要後續擴充。

### 重現條件

- 執行 `node tools/audit-system-health.js` 會看到既有 F-1/J-2/M-1/DS-1/D-3 等錯誤或警告。
- 在已產生庫存或出貨的資料上按刪除，會由 workflow guard 阻擋或提示流程影響；目前提示形式還不是正式 modal。
- 若遠端資料已有缺失工單/庫存數量，需套用 migration 後再驗證是否回補成功。

### 目前推測原因

- 既有前端模組累積較大，尚未拆分，且歷史上 `innerHTML` escape 規範未完全落地。
- 舊流程刪除原本偏 CRUD 思維，沒有完整流程生命週期守門。
- 舊工單資料模型允許部分重量/數量欄位缺失，導致完成轉庫存時用到空值或 0。

### 尚未驗證風險

- 遠端套用 migration 後，實際既有資料的回補結果需抽樣驗證。
- 出貨單刪除改為軟刪後，所有列表、報表、查詢是否都正確排除 `deleted_at IS NOT NULL` 仍需完整回歸。
- workflow guard 的阻擋訊息與 recommended action 還未完全串成使用者理想的 modal 操作流。

## 5. 下一步任務

### P0

- 建立共用「流程影響確認 modal」，取代目前刪除流程中的原生 `confirm()`。
- 擴充 workflow guard 到 `order_items`、`shipping_order_items`、`return_orders`。
- 遠端套用 v2.0.8 migration 後，驗證 `WO-20260530-0001` 類型資料不再產生 0 庫存。
- 回歸測試：訂單 > 工單 > 庫存 > 出貨 > 刪除/退回/作廢的主要流程。

### P1

- 檢查所有 `shipping_orders` 查詢是否正確排除軟刪資料。
- 強化出貨單刪除後的 DataSync notify，確保其他分頁與相關模組同步刷新。
- 清理本輪涉及檔案中的 `innerHTML` XSS audit 命中點，至少先處理 `orders.js`、`order_items.js`、`inventory_items.js`、`shipping_orders.js`、`work_orders.js`。
- 將流程刪除守門的 UI 操作與 `recommended_action` 做更細緻對應。

### P2

- 拆分過大的 JS 模組，降低 `F-1` 健康度錯誤。
- 補齊全系統 DataSync notify。
- 整理雙重狀態欄位 `status` / `status_lookup_id` 的主從策略。
- 將 `audit-system-health.js` 的 WF-1 規則持續擴充到更多流程型模組。

## 6. 驗證狀態

### 已執行檢查與結果

- `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`：已執行，migration 已套用。
- PHP 語法檢查：本輪涉及的 API 與 helper 先前已執行 `php -l`，結果通過。
- JS 語法檢查：`js/orders.js`、`js/work_orders.js`、`js/inventory_items.js`、`js/shipping_orders.js`、`tools/audit-system-health.js` 先前已執行 `node --check`，結果通過。
- `node tools/audit-data-sync.js`：先前通過，結果 P0:0、P1:0、P2:10。
- `node tools/validate-config-modules.js`：先前通過。
- `node tools/audit-system-health.js`：已執行，WF-1 正常通過並顯示資訊；整體仍因既有 F-1/J-2/M-1 等歷史問題回傳失敗。

### 本次收尾已完成

- 已重新執行本輪修改檔案的 PHP/JS 語法檢查，結果通過。
- 已執行 git status --short --branch，確認工作區異動均屬本輪相關內容。
- 接下來只加入本輪相關檔案後 commit 與 push。

### 未執行或限制

- 未在瀏覽器做完整人工 UI 回歸，需要使用者在本機或遠端實測。
- 未重打 v2.0.8 更新包，因使用者表示遠端無法執行診斷工具，最後的診斷工具更新不需納入遠端包。

