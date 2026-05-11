# MES 開發進度摘要

最後更新：2026-05-10

## 1) 目前專案架構

- 根目錄：C:/Apache24/htdocs/mes
- 前端層：
  - index.php、index.html：主框架與導覽
  - modules/*.html：模組頁面結構
  - js/*.js：模組互動、API 串接、DataSync
  - styles.css：全站樣式與按鈕/Modal 規範
  - script.js：全域事件、版本資訊 Modal 邏輯
- 後端層：
  - api/{module}/*.php：CRUD 與模組 API
  - api/system_update_*.php：更新中心 API（上傳/套用/狀態/初始化檢查/歷程）
  - api/bootstrap.php、api/config.php：DB 與共用初始化
- DB 與 migration：
  - migrations/*.sql：升版腳本
  - migrations/rollbacks/*.sql：回滾腳本
- 發佈與檢查工具：
  - tools/build-update-package.ps1：更新包打包
  - tools/audit-system-health.js：系統健康審計
  - tools/validate-config-modules.js：配置模組驗證

## 2) 已完成功能

### A. 系統更新中心（可打包、可套用、可查狀態）

- 已完成更新流程 API：
  - api/system_update_common.php
  - api/system_update_upload.php
  - api/system_update_apply.php
  - api/system_update_status.php
  - api/system_update_init_check.php
  - api/system_update_history.php
- 已完成資料表與 migration：
  - system_update_logs
  - system_update_jobs
  - 對應 rollback SQL 已建立
- 已完成前端入口與操作：
  - 安全設定頁新增「系統更新」區塊（上傳、套用、刷新、初始化檢查）
  - 關於系統 Modal 可讀取版本歷程

### A-1. 系統更新中心進階能力（本輪新增完成）

- 維護模式：
  - 新增 `api/system_update_maintenance.php`（GET/POST）
  - 套用更新時自動啟用維護模式，結束後自動關閉（若原本為關閉）
  - `api/bootstrap.php` 新增維護模式攔截（允許更新中心必要端點，其餘 API 回傳 503）
- DB 快照/備份：
  - `api/system_update_apply.php` 在套用前自動建立全庫快照（Schema + Data）
  - 新增 `api/system_update_backup.php` 支援手動建立 DB 快照
  - 快照策略已落地：`每日一份`、`保留 7 天`（同日重複請求會重用當日快照，並自動清理逾期檔案）
- 自動回滾：
  - 檔案層：維持既有「覆蓋前備份 + 失敗自動還原」
  - Migration 層：新增 rollback migration 自動推導與反向執行
  - 支援 `manifest.json` 的 `rollback_migrations`（選填）
- 套用後健康檢查：
  - 新增關鍵檔案存在、DB 探測、覆蓋檔案驗證、更新目錄寫權限檢查
  - 健康檢查不通過時，直接判定套用失敗並啟動回滾流程
- 前端更新中心 UI：
  - 新增維護模式啟用/關閉按鈕與狀態顯示
  - 新增「建立 DB 快照」操作
  - 新增 DB 快照與健康檢查結果顯示欄位
  - 新增「一鍵手動回滾（選版本回退）」區塊：
    - 可載入可回滾版本清單
    - 可一鍵回退指定版本（含檔案還原 + rollback migration）

### B. 訂單主表管理 UI 調整（本輪）

- 訂單細項內嵌操作按鈕改為純圖示（移除「編輯/刪除」中文字）。
- 訂單細項編輯 Modal 改為雙欄版型。
- 版本更新清單前後端統一只顯示最新 3 筆。

### C. 打包流程標準化（本輪）

- 已建立並驗證 v1.0.3 更新包：
  - dist/update_v1.0.3_20260509_185454.zip
- 已整理打包文件：
  - docs/2026-05-09_更新安裝包打包流程.md
- 已寫入 AI 指引規範：
  - .github/copilot-instructions.md 新增「更新安裝包打包規範」章節
  - 規定 release note 內容固定保留最新三筆

## 3) 剩餘 Bug / 風險

1. 系統健康審計仍為失敗狀態（既有技術債，非本輪新引入）。
2. 遠端測試環境尚未完成 v1.0.3 全流程回歸（上傳、套用、初始化檢查、版本顯示）。
3. 系統更新中心剩餘強化項（已非阻斷）：
   - DB 快照壓縮策略（目前為 SQL 明文快照）
   - 回滾預檢可視化（目前由 API 回傳錯誤訊息，尚未做逐項視覺化清單）
   - 健康檢查可擴充（目前為基礎檢查，尚未整合全量 `audit-system-health.js`）
4. migration SQL 容易因編輯器連線方言誤判：
   - 本專案 migration 為 MySQL 方言
   - 若用 MSSQL 連線檢查會出現語法紅線（非實際執行錯誤）

## 4) 接下來任務（優先順序）

1. 遠端測試環境部署 v1.0.3 並做回歸驗證。
2. 依審計報告逐項收斂高風險項（安全性、API 結構一致性、前端風險點）。
3. 補「手動回滾 UI」與「快照保留策略」（例如保留最近 N 份，自動清理舊檔）。
4. 建立 v1.0.4 任務清單與打包內容（只納入實際變更檔）。
5. 持續維持版本更新紀錄策略：前端/API/release note 均為最新三筆。

## 5) Git 一鍵更新起點（給後續 AI/開發者）

- 此專案已於 `2026-05-11` 建立 Git 基線，作為「一鍵更新功能」正式起點。
- 基線分支：`main`
- 基線 commit：`1ce804a`（`chore: initialize git baseline for one-click update workflow`）
- 基線 tag：`update-base-2026-05-11`（已推送到 `origin`）
- 後續若要產生更新檔清單，請以此 tag 比對：
  - `git diff --name-only update-base-2026-05-11..HEAD`
- 打包更新檔時，請只納入實際變更檔與對應 migration，避免覆蓋：
  - `uploads/**`, `export/**`, `backup/**`, `db_backups/**`, `db_exports/**`, `old/**`, `vendor/**`
