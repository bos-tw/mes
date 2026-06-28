# DEVELOPMENT_PROGRESS_SUMMARY

## 1. 專案架構

- 專案根目錄：`C:\Apache24\htdocs\mes`
- 技術棧：PHP API、MySQL/MariaDB、原生 HTML/CSS/JavaScript、PowerShell 更新/Schema 工具。
- 主要目錄：
  - `api/`：後端 API、權限與報表資料來源。
  - `js/`：前端模組邏輯。
  - `modules/`：主系統模組 HTML。
  - `print/`：列印模板。
  - `styles.css` / `script.js`：全域樣式與主入口行為。
  - `tools/`：審計、schema 同步、更新包打包工具。
  - `release-notes/`：更新包 release note。
  - `dist/`：一鍵更新包輸出。
- 本輪主要涉及模組 / API / 資料表：
  - 操作按鈕規範：`.github/copilot-instructions.md`、`styles.css`、`script.js`、`js/defect_history_records.js`。
  - 工單圖片附件：`api/bootstrap.php`、`modules/work_orders.html`、`js/work_orders.js`、`print/work_order_print.html`。
  - 客戶光篩代工委託確認單：`print/order_confirmation_print.html`、`js/orders.js`。
  - 篩分檢驗結果報表：`api/reports/screening_inspection.php`、`print/screening_inspection_print.html`。
  - 更新提醒：`script.js`。
  - 本輪未新增 migration；沿用既有 `work_order_pre_production_images` 相關資料表/API。

## 2. 已完成功能

- 操作按鈕：
  - 新增/整理操作按鈕色彩規範，記錄於 `.github/copilot-instructions.md`。
  - 修正 `script.js` 全域操作按鈕 normalizer 未識別新 action 造成顏色未渲染問題。
  - `js/defect_history_records.js` 改用語意化 `op-role-*` 類別。
- 工單圖片附件：
  - 補齊 `work_order_pre_production_images` 權限映射，避免編輯工單時無權限。
  - 工單圖片附件區改為參考「現場圖片回傳」的標題與折疊方式。
  - 工單列印 `附件及相片` 區固定大小，最多顯示三張圖片並平均分配，避免推擠 A4。
- 工單列印：
  - QR code 縮小。
  - `卡號與重量記錄` 超過 10 筆時左右分欄，右欄補空白列使兩側高度一致。
- 客戶光篩代工委託確認單：
  - 確認存在單筆列印與批次列印兩套渲染路徑；以 `print/order_confirmation_print.html` 新版為主。
  - 批次列印主要批號區塊收斂為新版格式，包含 `總重量(含載具kg)` 小字規則。
  - 簽核列 `作成` 右側預設帶登入者姓名/帳號。
  - 修正簽核列與頁尾空白配置；頁尾公司資訊恢復可辨識大小，避免被壓縮到難以辨識。
- 篩分檢驗結果報表：
  - 生產資訊新增 `進貨日期`，目前來源為訂單確認單既有 `order_date`。
  - 公差值移除 `+/-` 符號，固定顯示 2 位小數。
- 版本更新：
  - `script.js` 更新檢查偵測到新版本時自動重新載入，並嘗試清除 Cache API / Service Worker，降低使用者看到舊畫面的機率。
- 版本與更新包：
  - 新增 `release-notes/2026-06-28-v3.0.17.txt`，固定 3 行。
  - 已使用 `tools/build-update-package.ps1` 建立更新包：
    `dist/update_v3.0.17_20260628_122203.zip`
  - 更新包版本：`v3.0.17`，`FileVersion=v3.0.17`，無 migration。

## 3. 待修 Bug

- 客戶光篩代工委託確認單列印版面仍需人工驗收：
  - 重現條件：以瀏覽器列印預覽 A4，特別是資料量較多且底部含簽核/公司資訊的訂單。
  - 目前狀態：已修正大空白與頁尾過小問題，但尚未由使用者回傳最新人工驗收結果。
- 全域健康審計仍有既有 warning：
  - 重現條件：執行 `node tools/audit-system-health.js`。
  - 目前結果：錯誤 0、警告 17；包含大型 JS、既有 POST fallback、既有 inline style 等。
  - 目前推測原因：既有技術債，非本輪新增阻擋。

## 4. 下一步任務

- P0：
  - 人工驗收 `dist/update_v3.0.17_20260628_122203.zip` 套用流程與委託確認單 A4 列印預覽。
  - 確認 `uploads/work_order_pre_production_images/` 測試/實際上傳檔是否應保留於環境，避免誤納入版本控管。
- P1：
  - 以共用模板或共用渲染函式進一步收斂單筆/批次委託確認單，降低未來版型分岔。
  - 補強工單圖片附件實機上傳、預覽、刪除與列印閉環測試。
- P2：
  - 逐步拆分大型 JS 檔案，處理健康審計 warning。
  - 整理舊版列印檔與 `old/` 歷史模板，降低誤用風險。

## 5. 驗證狀態

- 已執行：
  - `node tools/audit-system-health.js`：錯誤 0、警告 17。
  - `node tools/audit-system-health.js --changed --base origin/main`：多次通過，新增 0、阻擋 0。
  - `node --check script.js`
  - `node --check js/defect_history_records.js`
  - `node --check js/orders.js`
  - `node --check js/work_orders.js`
  - `php -l api/bootstrap.php`
  - `php -l api/reports/screening_inspection.php`
  - `node tools/validate-config-modules.js`
  - 更新包 manifest 檢查：`manifest.json` 存在，files 13，migrations 0。
- 尚未驗證風險：
  - 委託確認單、工單列印、篩分檢驗報表仍需在實際瀏覽器列印預覽人工確認。
  - 更新包尚未在遠端環境實際套用驗證。
  - 本輪無 migration，因此未執行 schema sync 作為打包前必要步驟；本輪開始時 schema sync 曾成功。
