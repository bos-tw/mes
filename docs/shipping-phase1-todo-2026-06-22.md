# 出貨單第一階段待辦事項

更新日期：2026-06-23  
狀態：第一階段 P0 已完成，待你自行實機驗證；第二階段已開始開發  
對應計畫：`docs/shipping-phase1-implementation-plan-2026-06-22.md`、`docs/shipping-phase2-implementation-plan-2026-06-22.md`

> 2026-06-25 起，二次重篩 / 二次篩選相關設計與實作追蹤已收斂到 `docs/second-screening-implementation-plan-2026-06-25.md` 與 `docs/second-screening-todo-2026-06-25.md`。本文件中的舊描述僅保留歷程脈絡，實際狀態請以新版文件為準。

## 本次進度摘要

- [x] 第一階段 P0 資料結構、API、前端、A5 列印與基本守門已完成
- [x] 出貨單第一階段重量欄位顯示規範已定義為統一小數點後 2 位
- [x] 第一階段文件已更新為完成狀態，第二階段規劃文件已建立
- [x] 已完成 migration、schema sync、語法檢查、系統健康審計、配置模組驗證、DataSync 稽核
- [x] 第二階段第一輪已完成：出貨單與出貨品質檢驗基本整合、跨模組導頁與初步追溯入口
- [x] 第二階段已完成第一輪二次重篩案件骨架、客戶載具遺留分析與不良品歷史回送顯示
- [x] 已補入口雙檔同步與遠端首頁排查修正：`index.html` / `index.php` 維持同內容主介面殼層
- [x] 已將二次重篩入口改為一般使用者可理解的「二次重篩歷史紀錄」，並以搜尋列表 + 詳情時間線呈現追溯
- [x] 已根治「index.php / index.html 看起來不同步」的主要原因：補齊前端 / 後端權限映射，並將入口與權限同步納入系統健康審計
- [x] 已將入口同步、前後端權限映射與 `index.html` 只能作為轉址相容頁的規則記入 `.github/copilot-instructions.md`
- [x] 已修正遠端 `index.html` 因 `data-asset-version="static-html"` 導致紅色「系統已更新」提示永遠不消失的阻斷 bug
- [x] 已產生正式測試更新包 `v3.0.8`，驗證 45 個主檔與 1 個 migration 均已納入
- [ ] 需重新產生包含 `index.html` 轉址入口修正的更新包，部署後驗證紅色更新提示可消失
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

- [x] 保留 `shipping_quality_inspections` 既有入口
- [x] 第一階段不把品質檢驗設為強制守門
- [x] 已在出貨單詳情顯示關聯品質檢驗筆數 / 狀態 / 最近檢驗

## P1：設計確認

- [x] 確認 `shipment_purpose` 中文文案
- [x] 確認不良品摘要是否至少需填來源單號
- [x] 確認載具摘要是否允許完全手動輸入
- [x] 確認載具列印是否以類型彙總而非逐件列印
- [x] 確認不良品單重是否可與良品單重不同

## 必測案例

- [x] 只有一般產品出貨，可正常建立與列印
- [x] 一般產品 + 不良品摘要，可正常建立與列印
- [x] 一般產品 + 載具摘要，可正常建立與列印
- [x] 一般產品 + 不良品摘要 + 載具摘要，可正常建立與列印
- [x] 純載具歸還單，可正常建立與列印
- [x] 純不良品回送單，可正常建立與列印
- [x] 空白預覽可看到不良品與載具欄位
- [x] A5 列印版面在 10 項內不擠壓
- [x] 既有一般出貨單列印不因新欄位壞掉

註記：以上案例已由你確認完成。

## 第二階段：已開始開發

對應規劃：`docs/shipping-phase2-implementation-plan-2026-06-22.md`

### P0-1：出貨品質檢驗整合

- [x] 在出貨單詳情顯示關聯出貨品質檢驗筆數與狀態
- [x] 在出貨單建立 / 編輯 / 詳情提供建立或開啟出貨品質檢驗入口
- [x] 建立出貨單與出貨品質檢驗的基本關聯規則
- [x] 第一輪已做到「可視、可建、可追」，且暫不強制守門

### P0-2：跨模組追溯鏈總覽

- [x] 在出貨單詳情顯示更完整的來源工單、部分入庫、庫存、退貨、檢驗追溯鏈總覽
- [x] 整理出貨詳情頁的追溯區塊，讓品質檢驗 / 不良品歷史 / 退貨 / 庫存入口集中呈現
- [x] 規劃並落地客戶載具紀錄 / 遺留分析與二次重篩鏈在追溯區塊中的位置

### P0-3：不良品追溯與回送口徑

- [ ] 定義出貨不良品摘要與工單不良記錄的追溯口徑
- [ ] 明確定義 `source_work_order_id` / `source_inventory_item_id` / `source_shipping_order_id` 的必填與主追溯欄位規則
- [x] 建立出貨不良品回送與原工單 / 原庫存 / 原出貨單的初步關聯顯示
- [x] 補足不良品歷史查詢頁與出貨單之間的導頁
- [x] 在「不良品歷史紀錄」顯示該筆不良是否有標註在出貨單
- [x] 在「不良品歷史紀錄」顯示該筆不良是否要求隨貨送回
- [x] 在「不良品歷史紀錄」顯示該筆不良是否已隨貨送回
- [x] 在「不良品歷史紀錄」補上關聯退貨單筆數與導頁入口
- [x] 確認二次重篩不採「僅靠一般工單追來源」，改走獨立案件資料模型
- [x] 確認二次重篩再次產生的不良，也要作為正式不良來源納入不良品歷史紀錄
- [x] 規劃退貨後二次重篩的來源管制欄位與流程節點
- [ ] 規劃 `不良品歷史紀錄` 如何納入二次重篩不良來源與輪次顯示

### P0-5：二次重篩案件模型

- [x] 確認二次篩選採「案件主檔 + 明細 + 執行工單/階段」模型
- [x] 確認二次篩選主檔必須直接關聯原始訂單、原始工單
- [x] 確認二次篩選使用獨立案件編號
- [x] 確認二次篩選完成後需形成可追溯結果，且必須保留完整來源鏈
- [x] 重新確認二次篩選不是只有退貨後重篩；同一模組需支援「異常後放寬標準重篩」與「客戶要求固定二次篩選」
- [ ] 調整現有 `rescreen_batches` 語意：從「退貨後二次重篩」修正為「二次篩選案件」
- [ ] 新增或改名業務理由欄位，例如 `second_screening_reason`
- [ ] 定義 `relaxed_after_high_defect`：第一次篩選不良過多，客戶同意放寬標準後二次篩選
- [ ] 定義 `customer_required_second_pass`：客戶/訂單要求固定二次篩選
- [ ] 取消「第一版必須從退貨單建立」作為總原則；退貨單只能是來源之一
- [ ] 原始生產工單需能直接顯示此批是否已二次篩選、二次篩選理由、案件編號與結果摘要
- [x] 設計 `rescreen_batches` 主表欄位與狀態流轉
- [x] 設計 `rescreen_batch_items` 明細表，用來承接退貨 / 不良品 / 出貨摘要等來源
- [x] 設計 `rescreen_batch_rules`，保存二次重篩前後的篩選標準快照
- [x] 設計 `rescreen_batch_defects`，用來承接二次重篩再次發生的不良
- [x] 在 `work_orders` 補 `work_order_type = rescreen` 與 `source_rescreen_batch_id`
- [x] 設計二次重篩完成後的新庫存來源鏈模型（不可簡化為直接回寫原庫存）
- [x] 設計 `inventory_item_sources` 或等價正式來源鏈表，承接 rescreen -> inventory 的完整追溯
- [x] 定義二次重篩案件與退貨單 / 出貨單 / 不良品歷史 / 工單之間的導頁與追溯規則
- [ ] 評估二次重篩結果如何回掛新庫存 / 新出貨 / 再次不良
- [ ] 定義二次重篩不良如何回掛 `source_defect_history_record_id`、`source_return_order_item_id` 與 `rescreen_round`
- [x] 定義 `strict_rescreen` 與 `relaxed_rescreen` 的建立條件、必填欄位與狀態流轉
- [x] 定義二次重篩新庫存與原始訂單 / 工單 / 出貨 / 退貨 / 原庫存的完整來源關聯欄位

#### 已完成的第一輪實作

- [x] 新增 migration：`rescreen_batches`、`rescreen_batch_items`、`rescreen_batch_rules`、`rescreen_batch_defects`、`inventory_item_sources`
- [x] `number_sequences` 新增 `RB` 案件編號
- [x] 退貨單詳情頁可顯示已建立的二次重篩案件，並可直接開啟建立入口
- [x] 新增 `rescreen_batches` 模組，可列表、建立、編輯、檢視來源明細與規則快照
- [x] 側邊欄新增 / 調整為「二次重篩歷史紀錄」入口，放在品質管理下，提供搜尋、檢視與追溯
- [x] 二次重篩詳情改為使用者導向：先顯示結果摘要，再以時間線呈現原訂單 / 原出貨 / 退貨 / 重篩工單
- [x] 從退貨單建立案件時，會自動回填原始訂單 / 訂單品項 / 工單 / 出貨單來源
- [x] 單一來源品項時，系統會自動建立 `work_order_type = rescreen` 的執行工單
- [x] 已建立 rollback 式建立測試，確認案件編號與執行工單可正常產生
- [ ] 尚待補齊二次篩選完成後的新庫存建立、再次不良閉環與不良品歷史正式納管
- [ ] 尚待依 `docs/second-screening-design-review-2026-06-25.md` 修正現有退貨導向模型

### P0-4：客戶載具紀錄與遺留分析

- [x] 盤點載具來源口徑：目前以訂單 `order_item_tools`、工單 `tool_details` / 部分入庫 `shipping_tool_details`、出貨單 `shipping_order_tool_summaries` 為第一輪依據
- [x] 整理工單與出貨單的載具記錄顯示與追溯方式，不強制要求一致
- [x] 先在出貨單詳情顯示客戶載具紀錄、來源載具紀錄與遺留分析摘要
- [x] 在工單編輯視窗與客戶編輯視窗顯示客戶載具紀錄與遺留分析
- [x] 先以訂單載具設定 vs 出貨載具摘要做初步分析，判斷目前該客戶是否可能仍有遺留載具在公司
- [x] 在不破壞第一階段快照設計前提下，建立訂單 / 工單 / 出貨摘要之間的載具紀錄對應

### P1：流程守門與治理

- [ ] 評估是否於 `status -> shipped` 前加上品質檢驗完成檢查
- [ ] 評估不良品回送與純載具歸還單的更明確流程守門
- [ ] 評估是否需新增權限、DataSync 依賴與操作稽核欄位

### 設計確認

- [ ] 確認第二階段出貨品質檢驗是否維持單頭關聯，或需逐項綁定出貨品項
- [ ] 確認不良品回送是否要形成正式不良品庫存 / 隔離帳
- [ ] 確認「需隨貨送回」與「已隨貨送回」的判定欄位與顯示規則
- [ ] 確認客戶載具紀錄顯示是否以客戶為主，或需細到工單 / 批次 / 出貨單
- [x] 確認二次篩選需建立獨立案件資料表，並由工單或工單階段作為執行載體
- [x] 確認二次篩選再次產生的不良需建立正式來源，不可只沿用一般工單不良備註
- [x] 確認二次篩選主檔需直接保存原始訂單、原始工單
- [x] 確認二次篩選使用獨立案件編號
- [x] 確認二次篩選完成後需形成可追溯結果，且必須保留完整來源鏈
- [ ] 確認 UI 命名從「二次重篩歷史紀錄」改為「二次篩選紀錄」
- [ ] 確認二次篩選案件可從生產工單建立，而非只從退貨單建立
- [ ] 確認生產工單列表/詳情可直接顯示二次篩選狀態與理由
- [ ] 確認 `relaxed_rescreen` 的標準快照是否只記公差 / PPM，或也要記服務項目啟停
- [ ] 確認二次重篩案件完成後，結果是否一定要分流為「可再出貨 / 再次不良 / 報廢 / 其他」
- [ ] 確認二次重篩新庫存的來源鏈是否採獨立 `inventory_item_sources` 表

## 驗證

- [x] `node tools/audit-system-health.js --changed --base origin/main`
- [x] `php -l api/shipping_orders/index.php`
- [x] `php -l api/shipping_orders/show.php`
- [x] `php -l api/shipping_orders/update.php`
- [x] 若拆出新 API，對應 `php -l`
- [x] `php -l api/shipping_orders/helpers.php`
- [x] `php -l api/rescreen_batches/index.php`
- [x] `php -l api/rescreen_batches/show.php`
- [x] `php -l api/rescreen_batches/update.php`
- [x] `php -l api/rescreen_batches/create_from_return.php`
- [x] `php -l api/rescreen_batches/delete.php`
- [x] `php -l api/work_orders/update.php`
- [x] `node --check js/shipping_orders.js`
- [x] `node --check js/rescreen_batches.js`
- [x] `node --check js/return_orders.js`
- [x] `node --check js/work_orders.js`
- [x] 若修改 `js/data-sync.js`，執行 `node --check js/data-sync.js`
- [x] 若修改 `tools/audit-data-sync.js`，執行 `node --check tools/audit-data-sync.js`
- [x] 若涉及 DataSync，執行 `node tools/audit-data-sync.js --write docs/data-sync-audit.md`
- [x] 若有 migration，執行 `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`
- [x] 主入口 / 側邊欄調整時，確認 `index.php` 為唯一完整入口，`index.html` 僅為轉址相容頁
- [ ] 重新驗證遠端以 `index.html` 進入時會轉往 `index.php`，且立即重整紅色提示不再重複出現
- [x] 系統健康審計已新增雙入口同步與前後端權限映射同步檢查
- [x] `tools/build-update-package-safe.ps1` 已修正 git 參數收集問題，並成功產生 v3.0.7 測試更新包
- [x] 檢查工作樹，不可提交未追蹤測試圖片
