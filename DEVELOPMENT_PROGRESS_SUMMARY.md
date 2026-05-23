# 開發進度摘要（更新：2026-05-23）

## 1. 專案架構

### 目錄結構與技術棧

- 根目錄：`C:/Apache24/htdocs/mes`
- 核心目錄：
  - `api/`：PHP API（Controller/Endpoint，PDO，權限驗證）
  - `js/`：前端模組（IIFE、事件委派、DataSync）
  - `modules/`：HTML View
  - `core/configs/`：配置化模組定義
  - `print/`：列印頁模板
  - `migrations/`：資料庫 migration
  - `tools/`：審計、schema 同步、更新包打包
  - `release-notes/`、`dist/`：發版說明與更新包輸出
- 技術棧：PHP + MySQL(PDO)、Vanilla JS、HTML、CSS、PowerShell、Node.js

### 本輪主要涉及模組、Controller、View、資料表

- 主要模組：`work_orders`、`orders`、`order_items`、`inventory_items`、`reports/screening_inspection`
- Controller/API：`api/reports/screening_inspection.php`
- View：`modules/work_orders.html`、`modules/order_items.html`、`print/screening_inspection_print.html`
- 前端邏輯：`js/work_orders.js`、`js/orders.js`、`js/order_items.js`、`js/order_item_quick_editor.js`
- 配置與樣式：`core/configs/inventory_items.config.js`、`styles.css`
- 指引與交接文件：`.github/copilot-instructions.md`、`DEVELOPMENT_PROGRESS_SUMMARY.md`、`docs/split-work-order-discussion-2026-05-23.md`
- 涉及資料表（邏輯層）：`work_orders`、`order_items`、`order_item_tools`、`production_records`、`work_order_screening_defects`、`screening_services`

## 2. 已完成功能

### 本次新增或修改項目

1. 重量優先口徑已落地到報表/API/工單畫面
- 報表 summary 改為重量換算主值：`good_units`、`defect_units`
- 分布支數獨立保留：`defect_units_distribution`
- 新增追蹤欄位：`order_net_weight_kg`、`actual_net_weight_kg`、`defect_weight_kg`、載具與生產重量統計

2. 工單編輯畫面新增口徑差異可視化
- `work_orders` modal 指標新增：分布合計支數、差異（重量-分布）
- `js/work_orders.js` 計算改為重量優先，並保留分布值與差異值顯示

3. 列印頁分布比例分母修正
- `print/screening_inspection_print.html` 的分布比例改用 `defect_units_distribution`，避免拿主值當分布分母

4. 小數精度統一
- 規則：重量欄位 2 位小數、單重欄位 4 位小數
- 含列表、匯出/列印輸出、客批號編輯 modal 預填值與建立受篩產品步進

5. 討論文件外置
- 拆分工單與逐機台不良品管制討論內容移至獨立文件（不混入交接摘要）

6. 開發指引補強
- 新增規則：進度摘要僅於對話收尾更新
- 新增「工單與篩分報表口徑統一規範」章節

### 修改檔案清單（實際 git diff + untracked）

- `.github/copilot-instructions.md`
- `DEVELOPMENT_PROGRESS_SUMMARY.md`
- `api/reports/screening_inspection.php`
- `core/configs/inventory_items.config.js`
- `js/order_item_quick_editor.js`
- `js/order_items.js`
- `js/orders.js`
- `js/work_orders.js`
- `modules/order_items.html`
- `modules/work_orders.html`
- `print/screening_inspection_print.html`
- `styles.css`
- `docs/split-work-order-discussion-2026-05-23.md`（新增）
- `release-notes/2026-05-19-v2.0.5.txt`（新增）
- `release-notes/2026-05-23-v2.0.6.txt`（新增）
- `release-notes/2026-05-23-v2.0.7.txt`（新增）

### 版本號、更新包、migration

- 版本號：`v2.0.7`
- 更新包：`dist/update_v2.0.7_20260523_185222.zip`
- migration：本輪無新增 migration（`0`）

## 3. 重要決策與規範

### 本輪已定稿決策

1. 統計口徑以重量優先
- `defect_units` 主值以重量換算
- `defect_units_distribution` 作分類分布用途
- 兩者同時顯示，允許差異存在並可追蹤

2. 小數位數統一
- 重量：2 位
- 單重：4 位
- 客批號編輯 modal 同步遵守

3. 討論紀錄與交接摘要分流
- 交接摘要：`DEVELOPMENT_PROGRESS_SUMMARY.md`
- 討論細節：獨立 `docs/*.md`

### 使用者明確偏好

1. 只在每輪對話收尾更新交接摘要
2. 不要把討論內容直接塞進交接摘要
3. 針對拆分工單，偏好逐機台填寫不良資料後再合計（以利機台能力分析）

### 下一輪不可重犯踩雷點

1. 非收尾階段不得更新 `DEVELOPMENT_PROGRESS_SUMMARY.md`
2. 討論內容需另建文檔，不得混入交接摘要
3. 不得回退重量優先口徑或混淆主值/分布值

## 4. 待修 Bug

1. 系統健康審計仍有既有錯誤（非本輪新增）
- 重現：`node tools/audit-system-health.js`
- 現象：審計回傳失敗
- 推測原因：既有專案級問題（J-2、F-1、A-3、DataSync 類型問題）尚未收斂
- 風險：遠端部署後可能仍存在既有安全/一致性告警

2. `modules/order_items.html` diff 變動量偏大
- 重現：`git diff --stat`
- 現象：單檔 1000+ 行增減
- 推測原因：本輪有版面重整與既有未提交改動疊加
- 風險：若只驗證局部流程，可能遺漏其他 UI 回歸點

3. 打包安全腳本在本機發生 git 參數失敗
- 重現：`tools/build-update-package-safe.ps1 -SkipFromRefDiff`
- 現象：Git command failed（已改用 `build-update-package.ps1` 成功打包）
- 推測原因：safe script 在當前 shell 條件下參數展開異常
- 風險：下輪若沿用 safe script 需先復現與修正

## 5. 下一步任務

1. P0：遠端驗證 `v2.0.7` 更新包
- 驗證重量優先主值、分布分母、客批號小數精度是否一致

2. P0：針對 `order_items` 大幅版面改動做回歸
- 聚焦 modal 開啟、受篩產品建立、載具/篩分服務編輯、提交流程

3. P1：拆分工單 MVP 需求細化
- 依 `docs/split-work-order-discussion-2026-05-23.md` 明確欄位、阻擋條件、API 契約

4. P1：收斂 audit-system-health 高優先問題
- 先處理安全性與資料一致性類問題（J-2 / A-3）

5. P2：排查 `build-update-package-safe.ps1` 在目前環境的失敗根因

## 6. 驗證狀態

### 已執行檢查

1. `node tools/audit-system-health.js`
- 結果：失敗（既有問題，非本輪新增）

2. `php -l api/reports/screening_inspection.php`
- 結果：通過（No syntax errors）

3. `node --check js/orders.js`
- 結果：通過

4. `node --check js/order_items.js`
- 結果：通過

5. `node --check js/order_item_quick_editor.js`
- 結果：通過

6. 更新包完整性檢查
- `manifest.json` 存在
- `files/` 根目錄存在
- 以 `git status` 檔案清單比對 ZIP，缺漏 `0`

### 未執行檢查與原因

1. 端到端 UI smoke test（瀏覽器實際操作）
- 原因：本輪在 CLI 環境作業，未執行人工互動測試

2. DB migration 驗證
- 原因：本輪無 migration 變更
