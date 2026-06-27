# 開發進度摘要

更新時間：2026-06-27  
目前分支：`main`  
本輪交付版本：`v3.0.15`

## 1. 專案架構

### 目錄結構

- `index.php`：正式 SPA 入口；`index.html` 僅作相容轉址。
- `modules/`：模組 HTML 畫面。
- `js/`：原生 JavaScript 模組、DataSync、跨模組互動。
- `api/`：PHP API；`api/bootstrap.php` 與 `api/common/*` 提供登入、權限、回應與流程守門。
- `print/`：列印與報表前端範本。
- `migrations/`：MySQL / MariaDB migration。
- `tools/`：健康審計、DataSync 稽核、schema 同步、更新包建置。
- `release-notes/`：版本更新說明。
- `docs/`：交接、稽核、待辦與設計紀錄。
- `dist/`：一鍵更新包輸出；更新包通常不納入 git。

### 技術棧

- Apache + PHP
- MySQL / MariaDB
- 原生 JavaScript + HTML + CSS
- PowerShell 工具鏈

### 本輪主要涉及模組 / API / 資料表

- 模組 / 前端：
  - `modules/work_orders.html`
  - `js/work_orders.js`
  - `styles.css`
  - `print/screening_inspection_print.html`
- API：
  - `api/reports/generate_static.php`
  - 既有 `api/rescreen_batches/index.php` 被前端內嵌建立流程呼叫，API 本輪未修改。
- 文件 / 交付：
  - `docs/data-sync-audit.md`
  - `docs/work-order-screening-modal-todo-2026-06-27.md`
  - `release-notes/2026-06-27-v3.0.15.txt`
- 資料表：
  - 本輪未新增或修改資料表。
  - 前端仍使用既有 `work_orders`、`rescreen_batches`、`rescreen_batch_*`、`production_records`、`work_order_execution_images` 等資料流。

## 2. 已完成功能

### 本次新增或修改項目

- 修正篩分檢驗報表與列印範本統計：
  - 不良品數量改以篩分服務明細的不良品分布加總呈現。
  - 良品數量改為 `總數量 - 不良品數量`。
  - 不良率改以實際不良品數量 / 總數量計算。
  - 修正先前不良品明細有值但摘要顯示 0、或把總數誤判為不良品的問題。
- 修正生產工單右側統計：
  - 不良品支數改以現場輸入的篩分服務不良數量為準。
  - 良品支數改以總支數扣除不良品支數。
  - 避免由重量推估造成百萬級錯誤支數。
- 重構生產工單新增 / 編輯 modal：
  - 上方保留共同資訊：工單摘要、訂單詳細資訊、圖面附件、客戶載具紀錄與遺留分析。
  - 下方改以「一次篩分 / 二次篩分」頁籤分流。
  - 一次篩分保留原排程、篩分明細、首件尺寸、現場圖片、生產記錄、部分入庫歷程。
  - 二次篩分整合原本二次篩選追蹤摘要。
- 二次篩分建立流程改善：
  - 在原工單 modal 的二次篩分頁籤按「建立二次篩選」時，直接展開內嵌建立欄位。
  - 不再跳轉到「新增二次篩選紀錄」頁籤。
  - 內嵌表單可填二篩類型、原因、排程、人員、機台、生產數量、佐證與備註。
  - 送出後呼叫既有 `api/rescreen_batches/index.php`，成功後即時刷新原 modal 的二次篩分追蹤。
- 現場圖片回傳區改為頁籤：
  - 完工圖片
  - 不良品圖片
  - 載具狀況圖片
- 排程欄位的員工 / 機台選擇支援搜尋與下拉選單。
- 生產工單列表的二次篩選欄位：
  - 未建立二篩時留白。
  - 已有二篩案件才顯示連結。
- 工單編輯摘要區重要文字改用 UI 規定藍色提高辨識。
- 新增待辦追蹤文件：
  - `docs/work-order-screening-modal-todo-2026-06-27.md`
- 新增 release note：
  - `release-notes/2026-06-27-v3.0.15.txt`

### 重要資料庫異動

- 本輪沒有新增 migration。
- 本輪沒有修改資料表 schema。
- 本輪沒有更新 `tools/sync-local-schema.ps1` 的 `$migrationChecks`，因為沒有新增 migration。

### 版本與更新包資訊

- Release note：`release-notes/2026-06-27-v3.0.15.txt`
- 一鍵更新包：`dist/update_v3.0.15_20260627_165231.zip`
- 打包工具：`tools/build-update-package.ps1`
- 打包參數重點：
  - `VersionNumber = v3.0.15`
  - `FileVersion = 3.0.15`
  - `ReleaseDate = 2026-06-27`
  - `ChangeSummaryFile = release-notes/2026-06-27-v3.0.15.txt`
  - `Migrations = @()`
- 更新包已確認：
  - 包含 `manifest.json`
  - 包含本輪 8 個 `-Files`
  - 不包含 migration

## 3. 待修 Bug

### 已知問題

- 尚未在瀏覽器實際操作本輪 UI 流程。
- 完整 `node tools/audit-system-health.js` 仍有 17 個既有 warning。

### 重現條件

- 執行 `node tools/audit-system-health.js` 可重現既有 warning：
  - `api/status_board/update.php`、`api/status_board/delete.php` 允許 POST 方法偽裝。
  - 多個既有前端模組行數偏大或超過建議上限。
  - `modules/order_items.html` 仍有既有 inline style warning。
  - 部分模組仍同時存在 `status` 與 `status_lookup_id`。

### 目前推測原因

- 舊 API 為相容保留 POST fallback，尚未全部收斂為標準 HTTP method。
- 多個前端模組長期累積功能，尚未拆分。
- 既有資料模型仍有歷史狀態欄位並存。
- 本輪 UI 主要以靜態與語法 / 稽核工具驗證，尚未做人工瀏覽器回歸。

## 4. 下一步任務

### P0

- 以瀏覽器實機回歸生產工單 modal：
  - 新增工單與編輯工單皆能正常開啟。
  - 一次篩分 / 二次篩分頁籤切換正常。
  - 二次篩分內嵌建立表單可成功建立 `rescreen_batches` 案件並即時刷新。
  - 一次篩分欄位儲存不受二次篩分內嵌表單影響。
- 套用 `dist/update_v3.0.15_20260627_165231.zip` 至測試或正式前環境，確認更新包安裝與主要頁面載入。

### P1

- 回歸報表與列印：
  - `api/reports/generate_static.php`
  - `print/screening_inspection_print.html`
  - 確認總數量、良品、不良品、不良率與明細合計一致。
- 回歸工單統計側欄：
  - 有不良品輸入時良品 / 不良品 / 總支數一致。
  - 無不良品時不良品為 0 且良品等於總支數。
- 評估是否將二次篩分完整編輯表單抽成共用元件，避免 `work_orders` 與 `rescreen_batches` 維護兩套 UI。

### P2

- 清理 `node tools/audit-system-health.js` 既有 17 項 warning。
- 拆分大型前端模組，優先評估 `js/work_orders.js`。
- 將本輪 `docs/work-order-screening-modal-todo-2026-06-27.md` 的後續觀察事項轉成正式 issue 或後續任務清單。

## 5. 驗證狀態

### 已執行的檢查

- `node tools/audit-system-health.js`
  - 結果：錯誤 0，warning 17。
- `node tools/audit-system-health.js --changed --base origin/main`
  - 結果：本次變更未新增審計問題。
- DataSync：
  - `node --check js/data-sync.js`
  - `node --check tools/audit-data-sync.js`
  - `node tools/audit-data-sync.js --write docs/data-sync-audit.md`
  - 結果：P0 = 0，P1 = 0，P2 = 10。
- JS syntax：
  - `node --check js/work_orders.js`
- PHP syntax：
  - `php -l api/reports/generate_static.php`
- 更新包：
  - 使用 `tools/build-update-package.ps1` 產出 `dist/update_v3.0.15_20260627_165231.zip`
  - 已確認 zip 內含 `manifest.json`。

### 尚未驗證的風險

- 尚未完成瀏覽器實機點擊回歸。
- 尚未在遠端或正式前環境實際套用 `v3.0.15` 更新包。
- 尚未用實際資料建立二次篩分案件驗證內嵌表單送出後的 UI 刷新。
- 尚未用真實報表資料逐筆比對列印與靜態報表數字。
- 完整健康審計的 17 個 warning 仍存在，非本輪新增但仍需後續清理。
