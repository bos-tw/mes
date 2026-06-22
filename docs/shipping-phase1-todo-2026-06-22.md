# 出貨單第一階段待辦事項

更新日期：2026-06-22  
狀態：第一階段 P0 已完成，待實機驗證；第二階段已完成規劃、待開發  
對應計畫：`docs/shipping-phase1-implementation-plan-2026-06-22.md`、`docs/shipping-phase2-implementation-plan-2026-06-22.md`

## 本次進度摘要

- [x] 第一階段 P0 資料結構、API、前端、A5 列印與基本守門已完成
- [x] 出貨單第一階段重量欄位顯示規範已定義為統一小數點後 2 位
- [x] 第一階段文件已更新為完成狀態，第二階段規劃文件已建立
- [x] 已完成 migration、schema sync、語法檢查、系統健康審計、配置模組驗證、DataSync 稽核
- [ ] P1 品質檢驗預留顯示與第二階段流程補強尚未開始
- [ ] 實機操作、列印視覺驗證與使用者情境測試待進行

## P0：資料結構

- [x] 確認 `shipping_orders` 新增 `shipment_purpose`
- [x] 建立 `shipping_order_defect_summaries`
- [x] 建立 `shipping_order_tool_summaries`
- [x] migration 具備重複執行安全性
- [x] 更新 `tools/sync-local-schema.ps1` 的 `$migrationChecks`

## P0：出貨單 API

- [x] `index.php` 支援 `shipment_purpose`
- [x] `show.php` 回傳不良品摘要
- [x] `show.php` 回傳載具摘要
- [x] `update.php` 支援儲存不良品摘要
- [x] `update.php` 支援儲存載具摘要
- [x] 出貨單查詢保留既有產品出貨邏輯

## P0：出貨單前端

- [x] 出貨單 modal 新增出貨性質欄位
- [x] 出貨單 modal 新增不良品摘要區塊
- [x] 出貨單 modal 新增載具摘要區塊
- [x] 詳情 modal 顯示不良品摘要
- [x] 詳情 modal 顯示載具摘要
- [x] 保持現有產品品項新增流程可用

## P0：A5 列印

- [x] 沿用目前 `print/shipping_order_print.html` 版型
- [x] 保持 A5 橫式，不改 A4
- [x] 保留目前頁首、主表、備註、合計、簽收區結構
- [x] 主表延用產品出貨明細
- [x] 主表下新增不良品摘要區塊
- [x] 主表下新增載具摘要區塊
- [x] 合計區拆出良品、不良品、載具摘要
- [x] 紙本不得缺少不良品與載具欄位
- [x] 紙本所有重量欄位統一顯示到小數點後 2 位

## P0：基本守門

- [x] 一般產品必須來自庫存
- [x] 產品出貨客戶必須與出貨單客戶一致
- [x] 不良品摘要數量與重量不得為負
- [x] 載具摘要數量與重量不得為負
- [x] 有不良品摘要時，出貨性質不可為純 `normal`

## P1：品質檢驗預留

- [ ] 保留 `shipping_quality_inspections` 既有入口
- [ ] 第一階段不把品質檢驗設為強制守門
- [ ] 評估是否在出貨單詳情顯示已建立的品質檢驗筆數

## P1：設計確認

- [x] 確認 `shipment_purpose` 中文文案
- [ ] 確認不良品摘要是否至少需填來源單號
- [x] 確認載具摘要是否允許完全手動輸入
- [ ] 確認載具列印是否以類型彙總而非逐件列印
- [x] 確認不良品單重是否可與良品單重不同

## 必測案例

- [ ] 只有一般產品出貨，可正常建立與列印
- [ ] 一般產品 + 不良品摘要，可正常建立與列印
- [ ] 一般產品 + 載具摘要，可正常建立與列印
- [ ] 一般產品 + 不良品摘要 + 載具摘要，可正常建立與列印
- [ ] 純載具歸還單，可正常建立與列印
- [ ] 純不良品回送單，可正常建立與列印
- [ ] 空白預覽可看到不良品與載具欄位
- [ ] A5 列印版面在 10 項內不擠壓
- [ ] 既有一般出貨單列印不因新欄位壞掉

註記：以上案例目前待你進行實機驗證，尚未在待辦上勾選。

## 第二階段：規劃完成，待開發

對應規劃：`docs/shipping-phase2-implementation-plan-2026-06-22.md`

### P0：出貨品質檢驗整合

- [ ] 在出貨單詳情顯示關聯出貨品質檢驗筆數與狀態
- [ ] 在出貨單建立 / 編輯 / 詳情提供建立或開啟出貨品質檢驗入口
- [ ] 建立出貨單與出貨品質檢驗的基本關聯規則
- [ ] 保持第一輪為「可視、可建、可追」，暫不強制守門

### P0：不良品追溯與回送管制

- [ ] 定義出貨不良品摘要與工單不良記錄的追溯口徑
- [ ] 建立出貨不良品回送與原工單 / 原庫存 / 原出貨單的關聯顯示
- [ ] 補足不良品歷史查詢頁與出貨單之間的導頁
- [ ] 規劃退貨後二次重篩的來源管制欄位與流程節點

### P0：客戶載具往來總帳

- [ ] 盤點載具來源、入場、隨貨歸還、未歸還的帳務口徑
- [ ] 建立客戶載具往來總帳資料模型
- [ ] 明確定義工單帶入、出貨覆核、退貨返還的數量與重量計算規則
- [ ] 在不破壞第一階段快照設計前提下，建立總帳與出貨摘要的對應

### P1：跨模組查詢與流程守門

- [ ] 在出貨單詳情顯示來源工單、部分入庫、庫存、退貨、檢驗的追溯鏈
- [ ] 評估是否於 `status -> shipped` 前加上品質檢驗完成檢查
- [ ] 評估不良品回送與純載具歸還單的更明確流程守門
- [ ] 評估是否需新增權限、DataSync 依賴與操作稽核欄位

### 設計確認

- [ ] 確認第二階段出貨品質檢驗是否只做關聯，或需逐項綁定出貨品項
- [ ] 確認不良品回送是否要形成正式不良品庫存 / 隔離帳
- [ ] 確認客戶載具總帳是否以客戶為主，或需細到工單 / 批次 / 出貨單
- [ ] 確認退貨後二次重篩是否建立新工單類型或沿用既有工單

## 驗證

- [x] `node tools/audit-system-health.js --changed --base origin/main`
- [x] `php -l api/shipping_orders/index.php`
- [x] `php -l api/shipping_orders/show.php`
- [x] `php -l api/shipping_orders/update.php`
- [ ] 若拆出新 API，對應 `php -l`
- [x] `php -l api/shipping_orders/helpers.php`
- [x] `node --check js/shipping_orders.js`
- [x] 若修改 `js/data-sync.js`，執行 `node --check js/data-sync.js`
- [x] 若修改 `tools/audit-data-sync.js`，執行 `node --check tools/audit-data-sync.js`
- [x] 若涉及 DataSync，執行 `node tools/audit-data-sync.js --write docs/data-sync-audit.md`
- [x] 若有 migration，執行 `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`
- [x] 檢查工作樹，不可提交未追蹤測試圖片
