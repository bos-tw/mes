# 開發進度摘要（更新：2026-05-16）

## 專案架構

- 根目錄：C:/Apache24/htdocs/mes
- 技術棧：
  - 後端：PHP 8（api/* 模組化 REST API，bootstrap 權限檢查）
  - 前端：Vanilla JS + HTML + CSS（IIFE 模組 + data-action 事件委派）
  - UI 組裝：core/module-config.js + core/module-renderer.js + core/configs/*.config.js
  - 跨分頁同步：js/data-sync.js（module helper + dependency broadcast）
  - 資料庫：MySQL（migrations/*.sql 管理結構與資料修正）
- 打包與驗證：
  - tools/validate-config-modules.js
  - tools/audit-system-health.js
  - tools/build-update-package.ps1
  - tools/sync-local-schema.ps1

## 已完成功能

1. RBAC 權限顯示與授權相容層
- 權限名稱改為中文顯示後，前後端皆加入 alias 相容。
- 已完成檔案：
  - api/bootstrap.php（權限候選與自動授權判斷支援中英文）
  - script.js（前端 hasPermission/hasAnyPermission/canAccessModule 支援中英文）

2. 權限管理流程重構（權限主軸）
- role_permissions 由「角色 -> 權限」調整為「權限 -> 角色」。
- 新增編輯流程，可一次增減角色並同步資料。
- Modal 改為左右雙區穿梭（未加入/已加入）+ 中間箭頭與雙擊移動。
- 已完成檔案：
  - core/configs/role_permissions.config.js
  - js/role_permissions.js
  - api/role_permissions/index.php
  - api/role_permissions/helpers.php

3. employee_roles 409 錯誤體驗修正
- 前端改為優先顯示 API message，避免只顯示 generic error。
- 建立前先做前端重複關聯檢查，降低衝突頻率。
- 已完成檔案：
  - js/employee_roles.js

4. 權限資料中文化與可部署化
- permissions 26 筆資料完成中文名稱與描述修正。
- DB 變更已落地為 migration，並加入本機 schema 同步檢查規則。
- 已完成檔案：
  - migrations/2026_05_16_update_permissions_display_names.sql
  - tools/sync-local-schema.ps1

5. 更新包已產出（可一鍵更新）
- 版本：v2.0.1
- 更新說明：release-notes/2026-05-16-v2.0.1.txt
- 輸出：dist/update_v2.0.1_20260516_151226.zip
- 驗證：manifest.json / files/ / migration 皆存在，期望檔案覆蓋 18/18。

## 待修 Bug

1. 系統健康審計仍未過（歷史問題）
- 重現：node tools/audit-system-health.js
- 現象：目前仍有 34 錯誤、27 警告（以前端 XSS 與大型 JS 模組為主）。
- 代表檔案：
  - XSS 熱點：js/customers.js、js/orders.js、js/order_items.js、js/work_orders.js 等
  - 模組過大：js/order_items.js、js/work_orders.js、js/shipping_orders.js、js/orders.js

2. status_board API 方法策略警示
- 重現：node tools/audit-system-health.js
- 現象：api/status_board/update.php、api/status_board/delete.php 仍有 POST fallback 警示（A-3）。

3. DataSync 覆蓋不完整（多模組）
- 重現：node tools/audit-system-health.js
- 現象：多個 CRUD 模組缺少 dataSyncHelper.notify* 呼叫，跨分頁資料可能不同步。

## 下一步任務（優先順序）

1. P0：遠端套用並驗收 v2.0.1 更新包
- 驗證 RBAC：側邊欄可見性、tab 存取、API 寫入授權。
- 驗證權限管理：權限對應角色穿梭編輯、批次儲存、回填正確。
- 驗證 migration：permissions 中文名稱與描述在遠端一致。

2. P0：處理安全性高風險（J-2）
- 先從高使用量模組修正 innerHTML 未 escapeHtml 問題（orders/order_items/work_orders/customers）。

3. P1：拆分過大 JS 模組（F-1）
- 優先拆分 js/order_items.js 與 js/work_orders.js（API 層 / render 層 / controller 層）。

4. P1：補齊 DataSync notify
- 對所有有 CRUD 的模組補上 notifyCreated/Updated/Deleted，並再次跑 data-sync 審計。

5. P2：收斂架構警示與前端規範
- 修正 status_board POST fallback 策略。
- 修正 modules/*.html 既有按鈕 class 與 inline style 規範違反項。
