# 開發進度摘要（更新：2026-05-19）

## 專案架構

- 根目錄：C:/Apache24/htdocs/mes
- 主要目錄：
  - api/：PHP API（模組化端點、權限驗證、RBAC）
  - js/：前端模組（IIFE、data-action 事件委派、DataSync）
  - modules/：模組頁面 HTML
  - core/：配置化渲染與核心腳本
  - migrations/：資料庫 migration
  - tools/：審計、schema 同步、更新包打包
  - release-notes/、dist/：更新說明與一鍵更新包輸出
- 技術棧：PHP + MySQL(PDO)、Vanilla JS、HTML、CSS、PowerShell、Node.js 審計工具

## 已完成功能

1. 生產工單排程：修正誤刪邏輯為「移回待排程」
- 機台排程列操作從刪除工單改為移除機台指派。
- 點擊後清空 machine_id，工單回到待排程，不刪除資料。
- 檔案：js/production_work_order_schedule.js

2. 生產工單排程：修正指定機台下拉不完整
- 根因：api/machines/index.php 預設每頁 10 筆。
- 修正：改為分頁抓全量機台（perPage=100 迭代至最後一頁）並去重排序。
- 機台顯示標籤統一為 machine_number + name，降低誤判。
- 檔案：js/production_work_order_schedule.js

3. 生產工單排程：新增「機台排程狀態」分頁與展開細項
- 側欄新增第三個分頁「機台排程狀態」。
- 列出所有機台，欄位含：機台、排隊工單數、首筆工單、最早預定開始、操作。
- 操作欄新增展開/收合細項（data-action=details），可查看該機台目前排隊工單明細。
- 檔案：modules/production_work_order_schedule.html、js/production_work_order_schedule.js、styles.css

4. 更新包已產出
- 版本：v2.0.4
- 更新說明：release-notes/2026-05-19-v2.0.4.txt
- 更新包：dist/update_v2.0.4_20260519_161908.zip
- 打包內容：5 個主檔，0 個 migrations（本輪無資料庫 migration 變更）
- 覆蓋驗證：manifest.json 存在、files/ 存在、必需檔案全數命中

## 待修 Bug

1. 系統健康審計仍有既有錯誤（非本輪新增）
- 重現：node tools/audit-system-health.js
- 主要類型：
  - J-2：多模組 innerHTML 未完整 escapeHtml
  - F-1：部分 JS 模組過大
  - A-3：部分 API 方法相容警示

2. 排程模組刪除/移除確認流程仍使用原生 confirm
- 目前為可用狀態，但與專案建議的自訂對話框風格不一致。
- 重現：機台排程列按「移回待排程」時觸發 window.confirm。

3. docs/data-sync-audit.md 每次審計會更新時間戳造成雜訊變更
- 重現：執行 node tools/audit-data-sync.js --write docs/data-sync-audit.md
- 影響：容易在 commit 中夾帶非功能變更。

## 下一步任務（優先順序）

1. P0：遠端一鍵更新驗收 v2.0.4
- 驗收重點：
  - 機台排程狀態分頁可列出所有機台
  - 展開細項可正確顯示排隊工單
  - 移回待排程後，工單由機台列回到待排程列

2. P0：收斂 audit-system-health 錯誤（先安全性）
- 優先處理 J-2 XSS 與高風險 API 警示。

3. P1：排程模組確認互動統一
- 將 window.confirm 替換為系統一致的自訂確認對話框。

4. P1：建立機台狀態分頁回歸清單
- 覆蓋分頁切換、展開收合、DataSync 刷新、拖拉後同步顯示。

5. P2：減少審計報告檔提交雜訊
- 評估將 docs/data-sync-audit.md 納入專用提交流程或在提交前自動還原時間戳差異。
