# MES 系統健康度審計報告

產生時間：2026-06-19T03:16:59.013Z

## 摘要

- 錯誤：0
- 警告：17
- 資訊：11
- 總計：28

## 發現項目

| 嚴重度 | 規則 | 分類 | 領域 | 檔案 | 問題 | 信心 | Fingerprint |
|---|---|---|---|---|---|---|---|
| P2 | A-3 | policy-debt | 架構 | api/status_board/delete.php | api/status_board/delete.php 允許 POST 作為 PUT/DELETE 的替代方法（HTTP 方法偽裝） | high | 2569531724d46504f495 |
| P2 | A-3 | policy-debt | 架構 | api/status_board/update.php | api/status_board/update.php 允許 POST 作為 PUT/DELETE 的替代方法（HTTP 方法偽裝） | high | f5bc802e4552a0645e23 |
| P2 | F-1 | policy-debt | 前端 | js/companies.js | companies.js 有 1175 行，接近建議上限（1000 行） | high | 962579225d213a1ee189 |
| P2 | F-1 | policy-debt | 前端 | js/customers.js | customers.js 有 1672 行，接近建議上限（1000 行） | high | ddc3fe8b308a56b26ea8 |
| P2 | F-1 | policy-debt | 前端 | js/dashboard.js | dashboard.js 有 1405 行，接近建議上限（1000 行） | high | c5aa25e3e7cd31e552ac |
| P2 | F-1 | policy-debt | 前端 | js/employees.js | employees.js 有 1156 行，接近建議上限（1000 行） | high | 63364875d47341b7f895 |
| P2 | F-1 | policy-debt | 前端 | js/inventory_items.js | inventory_items.js 有 1924 行，接近建議上限（1000 行） | high | 671f1038e7c5eef2226d |
| P2 | F-1 | policy-debt | 前端 | js/messages.js | messages.js 有 1447 行，接近建議上限（1000 行） | high | a9629ac8b1bb132a29cc |
| P2 | F-1 | policy-debt | 前端 | js/orders.js | orders.js 有 2128 行，超過建議上限 2000 行 | high | 536b0d46eca4f5dfd2b8 |
| P2 | F-1 | policy-debt | 前端 | js/order_items.js | order_items.js 有 3408 行，超過建議上限 2000 行 | high | 28b22f715d7ef38e8814 |
| P2 | F-1 | policy-debt | 前端 | js/production_work_order_schedule.js | production_work_order_schedule.js 有 1612 行，接近建議上限（1000 行） | high | 2df35344dd8a47875497 |
| P2 | F-1 | policy-debt | 前端 | js/return_orders.js | return_orders.js 有 1256 行，接近建議上限（1000 行） | high | dfd2f21be2345767c3c5 |
| P2 | F-1 | policy-debt | 前端 | js/shipping_orders.js | shipping_orders.js 有 2255 行，超過建議上限 2000 行 | high | ad07d9d7485250a033a9 |
| P2 | F-1 | policy-debt | 前端 | js/suppliers.js | suppliers.js 有 1213 行，接近建議上限（1000 行） | high | 3b32cc62081808ba46a0 |
| P2 | F-1 | policy-debt | 前端 | js/work_orders.js | work_orders.js 有 4880 行，超過建議上限 2000 行 | high | cd5869224e355d0acfc6 |
| P2 | D-3 | policy-debt | 資料完整性 | api/employees, api/login.php, api/reports, api/return_orders, api/work_orders | 以下模組同時使用 status（varchar）和 status_lookup_id（FK），造成欄位語意重複：api/employees, api/login.php, api/reports, api/return_orders, api/work_orders | high | ad468ee41e962907e41c |
| P2 | M-1 | policy-debt | 前端 | modules/order_items.html | order_items.html 在 L427, L429, L430, L431, L432, L457, L458, L459, L460, L491, L492, L493, L494, L495, L496, L527, L528, L529, L530, L531, L532, L533, L534 行有 inline style（除 display:none 外均應移至 CSS） | medium | c5dfb2b53dfd5b86d3c9 |
| Info | DB | advisory | 安全性 | DB: roles / employee_roles | 請手動確認資料庫 roles 與 employee_roles 資料表不為空；若為空，所有員工將無法取得任何系統權限 | high | a5e5c5a973ff94a937dc |
| Info | INFO | advisory | 架構 | api/ (2 個檔案) | 共 2 個 update.php/delete.php 允許 POST 偽裝，已逐一列於上方；建議統一改為標準 HTTP 方法後移除 POST fallback | high | 26653be4876a2b82cbf8 |
| Info | DB | advisory | 資料完整性 | DB: order_items | 請手動確認資料庫 order_items 資料表是否有 deleted_at 欄位 | high | 847f551a8654d1e0480d |
| Info | DB | advisory | 資料庫 (需手動驗證) | DB: number_sequences | [D-1] 若此資料表為空，工單/訂單編號自動產生功能將失效。建議修復：插入各單據類型的起始序號設定 | high | 82bf6697e7339080da94 |
| Info | DB | advisory | 資料庫 (需手動驗證) | DB: companies | [D-2] 若此資料表為空，列印範本中的公司資訊欄位將顯示空白。建議修復：插入至少一筆公司基本資料 | high | 20cf3f0629c87ea2b9bd |
| Info | DB | advisory | 資料庫 (需手動驗證) | DB: 多個資料表 | [D-3] 同時存在 status（varchar）和 status_lookup_id（FK）欄位。建議修復：確認哪個是主要欄位，棄用另一個 | high | 4a5aa248386db2125c45 |
| Info | DB | advisory | 資料庫 (需手動驗證) | DB: lookup_domains | [D-4] id=0 的異常紀錄可能影響 FK 參照或前端渲染邏輯。建議修復：確認此紀錄是否應該存在，若為誤植請移除 | high | 2ceca6b566a33bc62ce9 |
| Info | DB | advisory | 資料庫 (需手動驗證) | DB: message_attachments | [D-5] COMMENT 欄位可能有亂碼（字元編碼問題）。建議修復：執行 ALTER TABLE 修正 COMMENT 或重建資料表 | high | 921ec191652528dfd64f |
| Info | DS-1 | advisory | 架構 | DS-1 DataSync 專項審計 | P0=0、P1=0、P2=10；P2 詳情請查看 docs/data-sync-audit.md | low | bd17a84af2b3d7031564 |
| Info | WF-1 | advisory | 資料完整性 | WF-1 流程刪除守門 | 已檢查訂單、訂單品項、工單、庫存、出貨、出貨品項、退貨單刪除 API 與前端預檢是否接上 workflow_guard。 | high | 173bda2172bffaf87e9a |
| Info | SWO-1 | advisory | 資料完整性 | SWO-1 拆分工單 | 已檢查拆分工單 migration、schema 同步、部分入庫、防重建、排程節點與報表機台明細。 | high | 86999f2f17b2caaa417c |
