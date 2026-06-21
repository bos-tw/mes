# 開發進度摘要

更新時間：2026-06-21  
目前分支：`main`  
目前交付版本：`v3.0.3`

## 1. 專案架構

- 目錄結構
  - `mobile/`：手機版前端入口、工單詳情、圖片上傳與互動樣式
  - `js/`：桌面版模組邏輯，含 `return_orders.js`、`work_orders.js` 等
  - `api/`：PHP API，含權限檢查與工單相關端點
  - `styles.css`：桌面共用樣式與 badge/chip 規則
  - `migrations/`：資料庫 migration
  - `tools/`：健康檢查、DataSync 稽核、schema 同步、更新包建置
  - `release-notes/`、`dist/`：release note 與一鍵更新包輸出
- 技術棧
  - 後端：PHP 8、PDO、MySQL 8、Apache
  - 前端：原生 JavaScript、HTML、CSS
  - 工具：Node.js、PowerShell
- 本輪主要涉及模組 / API / 資料表
  - 模組：手機版工單詳情與生產紀錄、桌面退貨單狀態顯示、桌面共用 badge/chip 樣式
  - API：`api/bootstrap.php` 權限別名 / 舊權限映射
  - 相關資料表：`work_order_completion_images`、`work_order_defect_images`、`work_order_tool_condition_images`、`production_records`、`work_orders`

## 2. 已完成功能

- 本次新增或修改項目
  - 修正手機版工單圖片上傳權限，三類圖片 API 改為沿用 `manage_work_orders`
  - 手機版工單詳情新增可展開收合區塊：
    - `工單資訊`
    - `篩分服務`
    - `生產紀錄`
  - 手機版 `生產紀錄` 重做：
    - 顯示摘要卡與逐筆載具明細分區
    - 每筆卡片區分卡號、載具類型、載具重量、實際裝載重量、機台、日期時間、操作人、備註
    - 支援預設 / 自行輸入模式切換、逐筆新增/移除、編輯後送回工單更新 API
  - 修正退貨單 `處理狀態`，由 Bootstrap `badge` 改為系統共用 `status-badge`
  - 統一桌面與手機相關 badge/chip 樣式，將近期漂移成橢圓膠囊的狀態標籤調回方框小圓角
- 重要資料庫異動
  - 本輪無新增 migration
  - 本輪無 schema 變更
  - 圖片上傳功能沿用既有 `2026-06-20` 已建立之三張圖片表
- 版本與更新包資訊
  - 版本：`v3.0.3`
  - Release note：`release-notes/2026-06-21-v3.0.3.txt`
  - 更新包：`dist/update_v3.0.3_20260621_122319.zip`
  - 更新包內容：`manifest.json` + 5 個部署檔案 + 0 個 migration

## 3. 待修 Bug

- 已知問題
  - 手機版工單與退貨單調整已完成，但尚未做完整真機回歸
  - 全量健康檢查仍有既有 17 筆 warning
  - DataSync 稽核仍有既有 10 筆 P2 `crud_module_without_dependents`
  - 工作樹存在測試上傳檔：`uploads/work_order_completion_images/16/...jpg`
- 重現條件
  - 執行 `node tools/audit-system-health.js` 可重現 17 筆 warning
  - 執行 `node tools/audit-data-sync.js --write docs/data-sync-audit.md` 可重現 P0=0、P1=0、P2=10
  - 本機手機版圖片上傳測試後，`uploads/work_order_completion_images/16/` 會留下未追蹤檔案
- 目前推測原因
  - 17 筆 warning 屬既有技術債，包含大型 JS、`status_board` POST fallback、雙重狀態欄位、inline style
  - DataSync P2 為既有模組依賴宣告不足，非本輪新增
  - 上傳圖片未追蹤檔案來自本機驗證流程，不應直接納入程式提交

## 4. 下一步任務

- P0
  - 真機驗證手機版工單詳情、生產紀錄編輯、三類圖片上傳與回寫流程
  - 確認是否需要清理或保留 `uploads/work_order_completion_images/16/...jpg` 測試檔，再決定是否可安全提交
  - 若要提交本輪程式碼，先處理工作樹中的非程式檔案混入風險
- P1
  - 檢查手機版生產紀錄編輯後，桌面工單畫面與既有流程資料是否完全一致
  - 逐頁檢查仍有無漏網的橢圓 badge/chip 樣式漂移
  - 視需要補充手機版生產紀錄操作說明或 UX 文案
- P2
  - 清理健康稽核 17 筆既有 warning
  - 清理 DataSync 10 筆既有 P2
  - 視需要拆分過大的 `mobile/mobile.js`、`js/return_orders.js`、`js/work_orders.js`

## 5. 驗證狀態

- 已執行的檢查
  - `node tools/audit-system-health.js`
    - 結果：0 error、17 warning
  - `node tools/audit-system-health.js --changed --base origin/main`
    - 結果：0 new、0 blocking
  - `node --check mobile/mobile.js`
  - `node --check js/return_orders.js`
  - `node --check js/data-sync.js`
  - `node --check tools/audit-data-sync.js`
  - `node tools/audit-data-sync.js --write docs/data-sync-audit.md`
    - 結果：P0=0、P1=0、P2=10
  - `php -l api/bootstrap.php`
  - 更新包已用 `tools/build-update-package.ps1` 建立，且已確認 ZIP 內含 `manifest.json`
- 尚未驗證的風險
  - 手機版工單詳情、生產紀錄與圖片上傳尚未完成 Android / iOS 真機回歸
  - 尚未驗證桌面退貨單與手機工單調整在正式環境資料下的完整操作路徑
  - 工作樹含測試上傳檔，現階段不宜直接 `git add -A` 提交
