# 開發進度摘要（更新：2026-05-15）

## 專案架構

- 根目錄：C:/Apache24/htdocs/mes
- 後端：PHP（api/* 模組化 API，session 驗證 + JSON 回應）
- 前端：Vanilla JS + HTML + CSS（status_board.* 為獨立即時看板頁）
- 核心渲染：core/module-config.js、core/module-renderer.js、core/configs/*.config.js
- 同步機制：js/data-sync.js（跨分頁事件通知）
- 資料庫：MySQL/MariaDB（migrations/* 管理 schema）
- 打包與驗證：
  - tools/audit-system-health.js
  - tools/build-update-package.ps1
  - tools/build-update-package-safe.ps1

## 已完成功能

1. 現場狀態看板重構完成（status_board）
- 看板版面改為 3:2:1 區塊：生產工單排程 / 三日內已完成工單 / 最新公告。
- 生產工單排程：每頁顯示 5 筆，超過 5 筆採分頁輪播。
- 三日內已完成工單：每頁顯示 3 筆，依完成時間倒序輪播。
- 最新公告：每次顯示 1 筆。
- 標題與主視覺字級下修，提升小螢幕可視內容高度。

2. 看板資料 API 擴充與補強
- api/status_board/index.php 新增 completed_orders 資料集。
- completed_orders 篩選條件：三日內完成，並依 completion_time DESC。
- 新增 api/status_board/update.php、api/status_board/delete.php 結構檔（供模組完整性檢查）。

3. 顯示密度與欄位可讀性優化
- 生產排程欄寬調整，淨重欄位加寬並強制不換行，避免二行撐高列高。
- JS 讀取 CSS 變數列高，避免 ticker 與實際列高不一致造成裁切。

4. 更新包產出（大版本）
- 版本：v2.0.0
- 更新說明：release-notes/2026-05-15-v2.0.0.txt
- 更新包：dist/update_v2.0.0_20260515_121252.zip
- 已驗證 zip 含 manifest.json、files/ 與本輪 6 個變更檔。
- 本輪資料庫無 migration（Migrations = 空陣列）。

## 待修 Bug

1. 系統健康審計存在既有歷史問題
- 重現：node tools/audit-system-health.js
- 現象：其他模組仍有既有告警（如大型 JS、XSS 風險點、架構一致性警示）。
- 影響：不阻斷本輪 status_board 交付，但持續影響整體健康度。

2. status_board update/delete 端點仍被審計標示方法策略問題
- 重現：node tools/audit-system-health.js（搜尋 status_board）
- 現象：api/status_board/update.php、api/status_board/delete.php 有 HTTP 方法策略警示。
- 影響：功能可用，但需後續與專案 API 規範對齊。

3. 超低解析度下仍可能出現看板擁擠
- 重現：在較低高度顯示器（含系統縮放）開啟 status_board.html
- 現象：雖已縮小字級與列高，極端環境仍可能接近邊界。
- 影響：需再做最小高度保底策略或斷點專用壓縮樣式。

## 下一步任務（優先順序）

1. P0：遠端套用並驗證 v2.0.0 更新包
- 驗證三區塊比例、5/3/1 顯示筆數、已完成工單輪播與公告輪播。
- 驗證不同螢幕解析度下生產區可完整顯示 5 行。

2. P0：修正 status_board update/delete API 審計警示
- 對齊專案 API 方法規範，消除方法策略警示。

3. P1：收斂 audit-system-health 既有高風險項
- 優先處理 XSS 熱點與過大 JS 模組（F-1/J-2 類）。

4. P1：建立看板視覺回歸清單
- 固定驗證字級、列高、欄寬、輪播節奏與資料空態。

5. P2：清理本地臨時產物
- 清理 audit_output.txt、dist/verify_v200 等驗證中間檔，避免干擾版本管理。
