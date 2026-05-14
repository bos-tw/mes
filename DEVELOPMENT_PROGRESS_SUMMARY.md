# 開發進度摘要（更新：2026-05-14）

## 專案架構

- 根目錄：C:/Apache24/htdocs/mes
- 後端：PHP（api/* 模組化端點，常見 index/show/update/delete）
- 前端：Vanilla JS + HTML + CSS（入口 script.js，模組在 js/* 與 modules/*）
- 配置化系統：core/module-config.js + core/module-renderer.js + core/configs/*.config.js
- 同步機制：js/data-sync.js（createModuleHelper + notifyWithDependencies + MODULE_DEPENDENCIES）
- 資料庫：MySQL/MariaDB，schema 由 migrations/* 管理
- 工具鏈：
  - tools/audit-system-health.js（系統健康審計）
  - tools/audit-data-sync.js（DataSync 盤點）
  - tools/sync-local-schema.ps1（本機 schema 同步）
  - tools/build-update-package.ps1（一鍵更新包）

## 已完成功能（本輪新增/修改）

1. 生產工單排程模組上線（新頁）
- 新增頁面與腳本：
  - modules/production_work_order_schedule.html
  - js/production_work_order_schedule.js
- 入口掛載完成：index.php、index.html、腳本載入鏈
- UI 改為左側雙分頁（生產機台 / 生產時間），支援拖拉調度與衝突提示

2. machine_sequence 完整後端化（穩定階段）
- 新增 migration：migrations/2026_05_14_add_work_orders_machine_sequence.sql
- 已同步本機 schema 檢查清單：tools/sync-local-schema.ps1
- work_orders API 已整合 machine_sequence 規則：
  - api/work_orders/helpers.php
  - api/work_orders/index.php
  - api/work_orders/update.php
- 規則涵蓋：同機台重排、跨機台移動、序號正規化與回寫

3. 跨分頁即時同步修正（訂單主表/客戶批號/工單）
- 調整 orders 刷新流程，補齊展開細項快取失效與重抓
- DataSync 依賴補齊 work_orders -> orders
- 對應檔案：
  - js/orders.js
  - js/data-sync.js

4. 排程頁快捷操作優化
- 待排程區改為精簡欄位：只顯示工單號碼 + 操作
- 工單號碼 hover 顯示詳情（tooltip）
- 新增前往工單按鈕，並可直接切到生產工單頁開啟該工單詳情
- 三區塊一致化：待排程、機台排程、生產時間皆可前往工單

5. 操作按鈕配色規範統一（避免撞色）
- open-order-items 與 goto-work-order 完成分色：
  - open-order-items：sky（#0369a1 / #075985）
  - goto-work-order：slate（#475569 / #334155）
- 全域語意映射調整：script.js（open-order-items 回到 order-items 角色）
- 規範文件同步：.github/copilot-instructions.md

6. 更新包已產生（可遠端測試）
- dist/update_v1.0.10_20260514_164823.zip
- release-notes/2026-05-14-v1.0.10.txt
- ZIP 自檢通過：含 manifest.json 與 files/，且含 migration

## 待修 Bug（已知問題與重現）

1. 系統健康審計仍非全綠（既有技術債）
- 重現：node tools/audit-system-health.js
- 現象：35 errors / 28 warnings（F-1、J-2、DS-1 等多屬歷史問題）
- 影響：不阻斷本輪功能使用，但影響整體健康度門檻

2. JS 模組過大風險（可維護性）
- 重現：audit-system-health [F-1]
- 主要檔案：js/order_items.js、js/work_orders.js、js/orders.js、js/shipping_orders.js
- 影響：修改成本高、回歸風險高

3. 多處 innerHTML XSS 掃描告警（歷史分布）
- 重現：audit-system-health [J-2]
- 含本輪新增模組在內，仍有多檔待系統性修復
- 影響：安全基線需補強

4. DataSync 覆蓋率不一致（部分模組）
- 重現：audit-system-health [DS-1]
- 現象：部分 CRUD 模組仍被判定 notify 呼叫不足
- 影響：跨頁資料可能出現延遲或不一致

## 下一步任務（優先順序）

1. P0：完成遠端更新包驗證
- 上傳並套用 update_v1.0.10
- 驗證 migration 套用、排程拖拉持久化、跨頁同步、按鈕配色

2. P0：修復 production_work_order_schedule 的 M-1 樣式規範警告
- 檢查 modules/production_work_order_schedule.html 按鈕 class 是否全符合 btn 前綴規範

3. P1：處理高風險 J-2（XSS）
- 先修核心模組：orders、order_items、work_orders、production_work_order_schedule
- 建立 innerHTML 安全輸出統一策略（escapeHtml / textContent）

4. P1：提升 DataSync 覆蓋率
- 補齊被 DS-1 點名模組的 notify 路徑
- 以 docs/data-sync-audit.md 持續追蹤 P0/P1=0

5. P2：拆分超大前端模組
- 優先拆 js/order_items.js、js/work_orders.js
- 建議分層：api 層 / render 層 / state-event 層
