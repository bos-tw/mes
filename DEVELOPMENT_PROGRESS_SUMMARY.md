# 開發進度摘要

更新時間：2026-06-16 19:05  
目前基底 commit：`edb4176`  
本輪工作版本：`v2.1.2`  
目前分支：`main`

## 1. 專案架構

### 目錄結構與技術棧

- 後端：PHP 8 + PDO，API 入口與共用初始化集中在 `api/bootstrap.php`。
- 前端：原生 JavaScript + 配置驅動模組渲染。
  - 共用模組切換與頁籤控制：`script.js`
  - 共用配置渲染：`core/module-renderer.js`
  - 模組設定：`core/configs/*.config.js`
  - 模組邏輯：`js/*.js`
- 頁面入口：`index.php` 為主，`index.html` 保留同版結構與版本資訊。
- 樣式：集中於 `styles.css`。
- 資料庫：MySQL 8，migration 位於 `migrations/`。
- 本機 schema 同步：`tools/sync-local-schema.ps1`
- 更新包工具：
  - `tools/build-update-package.ps1`
  - `tools/build-update-package-safe.ps1`
- 更新系統 API：
  - `api/system_update_common.php`
  - `api/system_update_*`

### 本輪主要涉及模組

- 工單管理 / 生產作業
- 退貨單
- 流水號管理
- 設備管理 / 機台設備管理
- 新增：機台能力管理
- 共用 tab 未儲存提醒與 modal 渲染機制

### 本輪主要涉及資料表

- `number_sequences`
- `machine_capabilities`
- `machine_capability_assignments`
- `machines`
- `return_orders` 相關資料流程
- `work_orders`
- `production_records`
- 列印 / 出貨 / 訂單查詢所需關聯資料

## 2. 已完成功能

### 本次新增或修改項目

- 完成全系統 tab 關閉前未儲存提醒補強。
  - 補上共用 dirty-check 機制。
  - 修正未輸入任何資料卻誤判為未儲存。
  - 修正退貨單儲存成功後仍跳出未儲存提示。

- 完成流水號管理重整。
  - 支援 `ORDER`、`WO`、`INV`、`SO`、`RO`、`WOPR` 等前綴。
  - 原本「日期範圍」改為 `active_from` / `active_until`。
  - 補上 `seq_prefix`、`last_generated_on` 等欄位與索引邏輯。
  - 修正對應 modal 版面與資料儲存流程。

- 完成設備管理下的「機台能力管理」。
  - 新增側邊欄入口。
  - 新增 `machine_capabilities` API 與前端模組。
  - 支援 CRUD。
  - 機台設備管理改為一對多關聯中的「單機台指定單一能力」。
  - 既有機台補上預設 `GENERAL` 能力。

- 修正配置化 modal 單欄表單時全部擠在左側的共用版面問題。
  - `core/module-renderer.js` 新增 `single-column` 版型判斷。
  - `styles.css` 補上單欄 modal grid 規則。
  - 影響流水號管理、機台能力管理等共用 modal。

- 修正列印與統計資料顯示。
  - 訂單確認單補上批號淨重顯示。
  - 工單列印修正「載具統計」與「載具數量」不一致問題。
  - 補強訂單 / 工單 / 出貨查詢鏈上的重量欄位整理。

- 修正工單與生產資料流程。
  - 修正編輯工單時找不到對應客戶批號而無法儲存的情況。
  - 補強 `work_orders` / `production_records` / `inventory_items` 相關 helper 與回填邏輯。

- 版本與交付物更新。
  - `index.php` / `index.html` 版本資訊已更新為 `v2.1.2`。
  - 新增：
    - `release-notes/2026-06-16-v2.1.2.txt`
    - `docs/change-summary-2026-06-16-v2.1.2.md`
  - 已產生更新包：
    - `dist/update_v2.1.2_20260616_185618.zip`

### 本輪資料庫 migration

- `migrations/2026_06_16_rebuild_number_sequences_management.sql`
- `migrations/2026_06_16_add_machine_capabilities_management.sql`
- `migrations/2026_06_16_add_machine_capability_to_machines.sql`

## 3. 待修 Bug

### 已知問題與重現條件

- P1：`tools/build-update-package-safe.ps1` 在目前 PowerShell 呼叫情境下會於 git 參數收集階段失敗。
  - 重現：
    - 在 repo 根目錄直接執行 safe wrapper
    - wrapper 內 `Get-GitLines` 呼叫失敗
  - 目前 workaround：
    - 改用 `tools/build-update-package.ps1` 並明確傳入檔案清單

- P1：機台能力 migration 目前仍保留 `machine_capability_assignments` 舊式對應表，但實際邏輯已改為 `machines.machine_capability_id` 單一能力。
  - 風險：
    - 下一輪若有人誤讀 schema，可能以為仍採多對多
  - 現況：
    - 系統功能使用的是單一能力關聯

- P1：tab 未儲存偵測雖已修正主要誤判，但仍缺少跨模組完整人工回歸。
  - 重現建議：
    - 逐一開啟系統設定、退貨單、工單、機台能力管理
    - 不輸入直接關 tab
    - 輸入後儲存再關 tab
    - 驗證提醒是否符合實際 dirty state

- P2：列印與重量數值已補強，但仍需遠端真實資料驗證。
  - 重現建議：
    - 用已有批號、已有載具與重量資料的訂單/工單列印
    - 比對畫面、列印頁與 DB 數值是否一致

## 4. 下一步任務

### P0

- 遠端套用 `dist/update_v2.1.2_20260616_185618.zip`
- 驗證遠端更新任務成功：
  - `system_update_jobs.status = success`
  - `version_number = v2.1.2`
- 驗證遠端 migration 結果：
  - `number_sequences` 新欄位 / 索引存在
  - `machine_capabilities` / `machines.machine_capability_id` 存在
  - `GENERAL` 預設能力已建立

### P1

- 進行跨模組未儲存提醒人工回歸。
- 驗證機台能力管理 CRUD 與機台設備管理指定能力的完整流程。
- 驗證流水號管理在新增、編輯、停用、重新產號時的實際行為。
- 驗證退貨單、工單、訂單確認單、工單列印在遠端真實資料下的顯示與儲存結果。

### P2

- 修正 `tools/build-update-package-safe.ps1`，讓 safe wrapper 可直接用於日後打包。
- 視需求移除或弱化 `machine_capability_assignments` 舊表，避免 schema 誤導。
- 若後續工單功能持續擴充，考慮拆分 `js/work_orders.js` 的狀態管理。

## 5. 驗證狀態

### 已執行

- `php -l`
  - `index.php`
  - `api/machines/index.php`
  - `api/machines/helpers.php`
  - `api/machine_capabilities/index.php`
  - `api/machine_capabilities/helpers.php`
  - `api/number_sequences/helpers.php`
  - `api/return_orders/helpers.php`
  - `api/work_orders/helpers.php`
- `node --check`
  - `script.js`
  - `core/module-renderer.js`
  - `js/machines.js`
  - `js/machine_capabilities.js`
  - `js/number_sequences.js`
  - `js/return_orders.js`
  - `js/work_orders.js`
- `powershell -ExecutionPolicy Bypass -File .\\tools\\sync-local-schema.ps1`
  - 結果：`Applied: 15, Pending: 0`
- 使用更新器重跑 migration：
  - `2026_06_16_rebuild_number_sequences_management.sql`
  - `2026_06_16_add_machine_capabilities_management.sql`
  - `2026_06_16_add_machine_capability_to_machines.sql`
  - 結果：可重複執行
- 更新包驗證：
  - ZIP 內 `42` 個程式/文件檔 + `3` 個 migration
  - 與工作區 SHA256 比對結果：`Mismatches=0`
  - 更新包 SHA256：
    - `9CD51F72092194D9502688733D0E6833CAF5CF8D0E062D75EB215E02B70A7BBC`

### 未執行

- 未做完整瀏覽器人工回歸。
- 未做遠端一鍵更新實機測試。
- 未做完整列印資料與現場資料交叉驗證。
