# DEVELOPMENT_PROGRESS_SUMMARY

## 專案架構（目錄與技術棧）

- 核心後端：`api/`（PHP 8 + PDO + Session/Auth + JSON API）
- 前端模組：`js/`（Vanilla JS、IIFE 模組化、事件委派、DataSync 跨分頁同步）
- 頁面與配置：`modules/` + `core/configs/` + `core/module-renderer.js`
- 列印模板：`print/`（A4/A5 專用 HTML + CSS）
- DB 與版本：`migrations/`、`release-notes/`
- 打包與檢查：`tools/`（`build-update-package.ps1`、`audit-system-health.js`）
- 發佈輸出：`dist/update_*.zip`（系統一鍵更新上傳來源）

## 已完成功能（本輪）

1. 列印版面修正（A4）
- 檔案：`print/screening_inspection_print.html`
- 修正螢幕與列印預覽在「客戶資訊/訂單資訊/生產資訊」區塊的排版差異。
- 優化中英標題佈局（同列顯示）以回收垂直空間，避免內容擠出單頁。

2. 機台設備管理儲存/更新異常修正
- 檔案：`js/machines.js`、`api/machines/index.php`、`api/machines/update.php`、`api/machines/helpers.php`
- 修正儲存時 `HTTP 500` + 前端 `Unexpected end of JSON input` 的相容性問題。
- 前端改為更穩定的回應解析流程，並統一 method override 送法。

3. 機台維修任務 UI 資料顯示修正
- 檔案：`js/machine_maintenance_tasks.js`
- 修正新增任務時機台下拉顯示 `undefined - 光篩機` 的問題（欄位映射/顯示字串處理）。

4. 客戶批號刪除與訂單主表內嵌明細刪除修正
- 檔案：`js/order_items.js`、`js/orders.js`、`api/order_items/delete.php`
- 修正兩處刪除按鈕失效：
  - 訂單主表展開明細刪除
  - 客戶批號列表刪除
- 前端改為 `POST + _method=DELETE`，避免部分環境直接 `DELETE` 失敗。
- 補強 JSON 回應解析（空回應/非 JSON 給出可讀錯誤訊息）。
- 後端刪除 API 加入 schema 容錯（資料表/欄位存在檢查），避免因環境差異直接 500。

5. 更新打包規範補強（避免再發）
- 檔案：`.github/copilot-instructions.md`
- 新增強制規範：
  - 一鍵更新包最終輸出只能在 `dist/`
  - 禁止手動壓縮作為最終交付
  - 必須使用 `tools/build-update-package.ps1`
  - 上傳前需檢查 ZIP 內含 `manifest.json` 與 `files/`

6. 更新包產出
- 版本：`v1.0.6`
- 檔案：`dist/update_v1.0.6_20260512_164300.zip`
- `manifest.json` 已確認存在且欄位完整。

## 待修 Bug（已知問題與重現條件）

1. 無「已確認可穩定重現」的阻斷性新 Bug。
- 狀態：本輪主要錯誤（刪除 500、儲存 500、JSON parse fail）皆已修正。

2. 需回歸驗證的高風險路徑（建議視為準待修）
- 路徑 A：刪除客戶批號（含有/不含有關聯工單、庫存、出貨、退貨）。
  - 重現方式：於 `訂單主表管理` 與 `客戶批號` 兩處各操作一次刪除。
  - 預期：可刪除時回 200；有關聯時回 409 並顯示阻擋訊息；不得再出現空 500。
- 路徑 B：機台管理儲存/更新。
  - 重現方式：新增機台、編輯機台後儲存。
  - 預期：不得再出現 `Unexpected end of JSON input` 或 `伺服器未回傳內容，HTTP 500`。

## 下一步任務（優先順序）

1. 立即回歸測試（P0）
- 針對 `machines`、`machine_maintenance_tasks`、`orders/order_items` 跑完整 CRUD 與錯誤情境。
- 確認所有寫入 API 回應均為有效 JSON。

2. 打包流程標準化落地（P0）
- 僅使用 `tools/build-update-package.ps1` 發佈。
- 上傳前固定執行 ZIP 內容自檢（`manifest.json` + `files/`）。

3. 列印頁最終驗證（P1）
- 針對 `screening_inspection_print.html` 做多筆資料、高缺陷數量、長字串場景列印預覽確認單頁穩定性。

4. 清理與技術債（P2）
- 依 `audit-system-health.js` 結果持續清理警告。
- 評估將大型前端模組（如 `order_items.js`）拆分為 API/Render/Main 三層。
