# 開發進度摘要（更新：2026-05-14，本輪對話收斂版）

## 專案架構

- 根目錄：C:/Apache24/htdocs/mes
- 後端：PHP（api/* 模組化端點，採 requireAuth + requireMethod + jsonResponse 風格）
- 前端：Vanilla JS + HTML + CSS（入口 script.js，模組邏輯在 js/*，頁面在 modules/*）
- 配置渲染：core/module-config.js、core/module-renderer.js、core/configs/*.config.js
- 跨頁同步：js/data-sync.js（createModuleHelper、notifyWithDependencies、MODULE_DEPENDENCIES）
- 資料庫：MySQL/MariaDB，schema 由 migrations/* 管理
- 打包/驗證工具：
  - tools/validate-config-modules.js
  - tools/audit-system-health.js
  - tools/audit-data-sync.js
  - tools/build-update-package.ps1
  - tools/build-update-package-safe.ps1（本輪新增，防漏檔）

## 已完成功能

1. 儀表板行事曆整合補強
- api/dashboard/calendar_events.php 已補齊出貨事件資料來源與事件欄位輸出。
- js/dashboard.js、js/dashboard_calendar_events.js、js/shipping_orders.js 完成跨模組 context 導頁與開單定位。

2. 行事曆提醒狀態可編輯化
- core/configs/calendar_event_reminders.config.js 新增提醒狀態欄位（is_sent）配置。
- js/calendar_event_reminders.js 完成新增/編輯流程與狀態欄位控制。
- api/calendar_event_reminders/update.php 完成 is_sent 與 sent_at 同步更新邏輯。

3. 側邊欄流程重排與雙入口同步
- index.html 依生管流程重排主選單。
- index.php 完整同步同一份順序，避免本機入口與伺服器入口不一致。

4. 打包規範補強（防再發）
- .github/copilot-instructions.md 新增：
  - 首頁入口雙檔同步規範。
  - 一鍵更新打包漏檔防呆規範。
  - 防漏檔自動打包方法。
- 新增 tools/build-update-package-safe.ps1：
  - 自動彙整 FromRef 差異 + 工作樹變更。
  - 自動排除不應打包目錄。
  - 自動清同版舊包。
  - 打包後逐檔覆蓋驗證。

5. 更新包產出狀態（本輪）
- 最終可用包：dist/update_v1.0.11_20260514_192610.zip
- 已確認包含：index.html、index.php、login.html、login.js、login-fui.css 與本輪 API/JS/規範更新。
- 本輪無新增 DB migration（manifest.migrations 為空）。

## 待修 Bug

1. 系統健康審計仍有歷史錯誤/警告
- 重現：node tools/audit-system-health.js
- 現象：仍有既有 J-2（innerHTML XSS）、F-1（檔案過大）、DS-1（DataSync 覆蓋）等告警。

2. 同版多包造成選錯風險（流程問題）
- 重現：同一版號重跑 build-update-package.ps1 會新增多個 dist/update_vX.Y.Z_*.zip。
- 狀態：已用 build-update-package-safe.ps1 與文件規範降風險，但既有歷史包仍在 dist。

3. 先前 v1.0.10 包未含登入頁（已定位原因）
- 重現：檢視 dist/update_v1.0.10_20260514_164823.zip entries。
- 現象：manifest/files 清單無 login.*，遠端登入頁不會更新。
- 狀態：流程與規範已補強，後續需以新包重新驗證遠端。

## 下一步任務（優先順序）

1. P0：遠端驗證最新 v1.0.11 包
- 套用 dist/update_v1.0.11_20260514_192610.zip。
- 驗證登入頁、側邊欄順序、行事曆提醒狀態編輯與跨模組導頁。

2. P0：將打包流程切換為 safe 腳本
- 團隊預設改用 tools/build-update-package-safe.ps1。
- 發版流程加入 FromRef 與 ZIP 覆蓋驗證結果回報。

3. P1：清理 dist 歷史同版包
- 每次發版保留最後可交付包，移除同版舊包以降低誤上傳機率。

4. P1：持續收斂審計高風險項
- 優先處理 J-2（XSS）與 DS-1（notify 覆蓋）在核心模組的告警。

5. P2：拆分超大 JS 模組
- 先拆 js/order_items.js、js/work_orders.js、js/shipping_orders.js 以降低回歸風險。
