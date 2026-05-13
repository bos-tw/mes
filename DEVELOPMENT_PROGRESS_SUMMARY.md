# 開發進度摘要（更新：2026-05-13）

## 專案架構

- 根目錄：`C:\Apache24\htdocs\mes`
- 後端技術棧：PHP（模組化 API，主要位於 `api/`，含 `index/show/update/delete` 端點）
- 前端技術棧：Vanilla JS + HTML + CSS（核心入口 `script.js`、樣式 `styles.css`、模組腳本 `js/*.js`）
- UI 配置層：`core/configs/*.config.js`（配置化渲染），部分頁面為混合模式（配置 + `modules/*.html`）
- 資料庫：MySQL/MariaDB，相依 `migrations/` 進行 schema 升級
- 維運/工具：
  - `tools/build-update-package.ps1`（一鍵更新包產生）
  - `tools/audit-system-health.js`（系統健康審計）
  - `tools/audit-data-sync.js`（DataSync 盤點）
  - `tools/sync-local-schema.ps1`（本機 schema 同步）

## 已完成功能（本輪）

1. 全系統「操作欄按鈕」語意化標準化完成（跨模組）
- 在 `script.js` 新增全域標準化機制：
  - `OPERATION_ACTION_ROLE_MAP`
  - `OPERATION_ACTION_LABEL_MAP`
  - MutationObserver + 動態重繪再標準化
- 針對操作欄容器（`table-actions/actions/actions-cell/actions-col`）自動套用語意 class 與 title/aria-label。

2. 操作按鈕顏色語意分流（避免混色與誤判 disabled）
- 新增/調整角色色系：`view/edit/delete/print/screening-report/expand/order-items/shipping/reply/mark-read/workflow/navigate/neutral`。
- 重要拆分：
  - `details`（展開/收合）獨立為 cyan，不再使用灰色。
  - `open-order-items`（客戶批號入口）獨立為 amber。
  - `print-work-order`（列印工單）與 `print-screening-report`（列印篩分檢驗結果報表）分色。
  - `reply`、`mark-read` 不再是灰色，分別改為 indigo / lime。
  - `add-to-shipping` 從 workflow 色系拆出，改為 shipping 綠色。

3. 模組級落地修正（維持既有 JS 事件行為）
- `js/orders.js`：調整操作欄語意 class 與顯示文案（展開/客戶批號/編輯/刪除）。
- `js/work_orders.js`：區分兩種列印按鈕語意與文案（工單 vs 篩分檢驗結果報表）。
- `js/inventory_items.js`：補齊 `view/edit/delete` 的 `data-action` 與語意 class（保留原 `onclick`，不改既有呼叫路徑）。
- `js/messages.js`：`reply` 套用回覆語意角色。
- `js/notifications.js`：`mark-read` 套用已讀語意角色。
- `modules/work_orders.html` / `styles.css`：配合版面與按鈕語意修正。

4. 規範與文件同步
- 更新 `.github/copilot-instructions.md`：
  - 補充操作欄跨模組統一規範（強制）
  - 更新色系表與命名對照（含 `details`、`open-order-items`、`print-screening-report`、`reply`、`mark-read`）
- 新增/更新 DataSync 與流程文件：
  - `docs/data-sync-audit.md`
  - `docs/data-sync-regression-checklist.md`
  - `docs/data-sync-remediation-plan.md`
- 新增工具：
  - `tools/audit-data-sync.js`
  - `tools/sync-local-schema.ps1`

5. 更新包產出
- 已產出更新包：`dist/update_v1.0.9_20260513_184409.zip`
- release note：`release-notes/2026-05-13-v1.0.9.txt`

## 待修 Bug（已知）

1. `audit-system-health` 仍為失敗狀態（既有技術債）
- 重現：執行 `node tools/audit-system-health.js`
- 現況：報告包含大量既有項目（JS 體積、innerHTML XSS 掃描警告、部分模組 DataSync 警告、status_board 結構警告等）。
- 影響：不阻斷本輪 UI 語意色修正，但影響整體健康度門檻。

2. 部分頁面仍可能存在舊樣式殘留（非 `data-action` 控制的按鈕）
- 重現：切到低覆蓋率模組，若按鈕未帶 `data-action` 且無語意 class，可能退回預設色。
- 影響：視覺一致性風險，功能通常不受影響。

3. 快取導致更新後顏色看似未生效
- 重現：前端資源版本未刷新時（瀏覽器快取舊 `script.js/styles.css`）。
- 建議：強制重整（Ctrl+F5）或依版本檢查機制刷新。

## 下一步任務（優先順序）

1. P0：建立「操作欄按鈕覆蓋率清單」
- 掃描 `js/*.js` 產生缺少 `data-action` / 缺少語意 class 的按鈕清單，補齊到全模組一致。

2. P0：建立按鈕語意回歸測試腳本
- 針對關鍵模組（orders/work_orders/inventory_items/messages/notifications）做色系與標題快照比對。

3. P1：修復 `audit-system-health` 中高風險項目
- 優先處理可確認的 XSS 風險（innerHTML 寫入點）與核心 DataSync notify 缺漏模組。

4. P1：統一列印/流程/導向類 action 命名規則
- 清理 `print-*`、`open-*`、`goto-*` 的語意邊界，降低未來誤映射。

5. P2：持續拆分超大前端模組
- 優先拆 `order_items.js`、`work_orders.js`、`shipping_orders.js`，降低耦合與回歸風險。
