# 開發進度摘要

更新時間：2026-06-19
目前分支：`main`
本輪版本：`v2.1.3`
本輪起始 commit：`8988e72`

## 1. 專案架構

- 後端：PHP 8 + PDO，API 共用初始化位於 `api/bootstrap.php`。
- 前端：原生 JavaScript、HTML、CSS，配置型模組由 `core/module-renderer.js` 與 `core/configs/*.config.js` 驅動。
- 主入口：`index.php`；`index.html` 保留同步版本資訊。
- 共用前端：
  - 分頁、模組載入、操作按鈕標準化：`script.js`
  - 欄位顯示設定：`api/common/column_manager.js`
  - DataSync：`js/data-sync.js`
- 審計工具：
  - 總審計：`tools/audit-system-health.js`
  - DataSync 專項：`tools/audit-data-sync.js`
  - 配置模組驗證：`tools/validate-config-modules.js`
  - 審計核心、規則、adapter、測試：`tools/audit/`
- 資料庫：MySQL 8；本輪沒有 migration 或 schema 異動。

### 本輪主要涉及範圍

- 機台能力、機台設備、工單、生產排程。
- 客戶、庫存、出貨、退貨、訊息、通知等列表與狀態顯示。
- 共用欄位設定、列表操作按鈕、圖示與色彩規範。
- 系統健康審計、DataSync 審計、GitHub Actions。
- 涉及既有資料表語意：`machine_capabilities`、`machines`、`work_orders`、`inventory_items`、`shipping_orders`、`return_orders`；未修改資料表結構。

## 2. 已完成功能

- 機台能力選單改為中文優先，列表欄位保留並調整顯示順序。
- 欄位設定改由共用 `column_manager.js` 自動管理，修正按鈕無反應、面板定位與表格欄位套用問題。
- 統一列表操作按鈕的 `data-action`、Font Awesome 圖示與顏色；灰色僅用於停用或阻擋狀態。
- 生產工單列表補上一般工單／拆分工單類型呈現。
- 修正多個前端模組的 XSS 輸出風險，包括狀態 fallback、訊息內容、人員名稱、來源標籤與工單生產紀錄欄位。
- 系統健康審計完成重構：
  - 結構化 finding、severity、classification、confidence、fingerprint。
  - JSON／Markdown 輸出、changed audit、Git 範圍、人工確認基準線。
  - `F-1`、`J-2`、`M-1` 拆成規則模組。
  - DataSync 改由專項工具 adapter 提供唯一 P0/P1 結果。
  - 新增 `node tools/test-audit-system.js`。
  - 新增 `.github/workflows/system-health-audit.yml`。
- 正式審計基準線為 17 項，全部是 P2；P0/P1 為 0，J-2 為 0。

### 版本與更新包

- `index.html`、`index.php` 已同步更新為：
  - 版本：`v2.1.3`
  - 發布日期：`2026-06-19`
  - 文件版本：`20260619.1`
- Release note：`release-notes/2026-06-19-v2.1.3.txt`
- 更新包：`dist/update_v2.1.3_*.zip`（以 `dist/` 最新的 v2.1.3 檔案為交付包）
- 更新包包含 58 個檔案、0 個 migration；`manifest.json` 已由系統更新解析器驗證。

## 3. 待修 Bug

- 目前沒有已知 P0/P1 審計錯誤。
- P2 審計技術債共 17 項：
  - 13 個 JavaScript 模組超過建議行數。
  - `api/status_board/update.php`、`delete.php` 仍接受 POST fallback。
  - `modules/order_items.html` 尚有 inline style。
  - 部分 API 同時使用 `status` 與 `status_lookup_id`。
- DataSync P2 共 10 項，原因為 CRUD 模組沒有宣告下游相依；目前未判定為 P0/P1。

## 4. 下一步任務

- P0：無。
- P1：
  - 在目標環境透過「系統更新」實際套用 `v2.1.3` 更新包。
  - 套用後回歸機台能力、欄位設定、生產工單類型、列表操作按鈕及工單／庫存／出貨流程。
  - 確認 GitHub Actions 在遠端 PR／main push 環境可正常執行。
- P2：
  - 分批拆分 `work_orders.js`、`order_items.js`、`shipping_orders.js` 等大型模組。
  - 移除 status board POST fallback。
  - 清理 `order_items.html` inline style。
  - 規劃 `status`／`status_lookup_id` 欄位口徑收斂。
  - 人工審查 DataSync 10 項 `crud_module_without_dependents` 是否需新增相依。

## 5. 驗證狀態

已通過：

- `node tools/test-audit-system.js`
- `node tools/validate-config-modules.js`
- `node tools/audit-system-health.js`
  - 0 errors / 17 warnings / 11 infos
- `node tools/audit-system-health.js --changed --base origin/main`
  - 0 new / 0 blocking
- `node tools/audit-data-sync.js --write docs/data-sync-audit.md`
  - P0=0 / P1=0 / P2=10
- 40 個本輪異動 JavaScript 檔案的 `node --check`
- `php -l index.php`
- `git diff --check`
- 更新包 ZIP：
  - 根目錄存在 `manifest.json`
  - 版本、日期與 0 migration 正確
  - 包內 58 個檔案與工作樹清單一致
  - `parseSystemUpdateManifestFromZip()` 驗證通過

尚未驗證：

- 尚未在遠端／正式環境實際套用更新包。
- 尚未完成完整瀏覽器人工回歸。
- GitHub Actions 尚未經遠端 push 實際觸發。
