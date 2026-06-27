# 生產工單一次/二次篩分 Modal 重構待辦（2026-06-27）

## 目標

將新增/編輯生產工單 modal 收斂為「上方共同主檔資訊 + 下方一次篩分/二次篩分頁籤」。

共同主檔資訊保留原始工單追溯脈絡；一次篩分維持原生產工單資料；二次篩分讀寫 `rescreen_batches` 相關資料，但在原工單 modal 中可檢閱與導頁。

## P0：共同主檔區

- [x] 工單摘要固定顯示於 modal 上方。
- [x] 訂單詳細資訊固定顯示於 modal 上方。
- [x] 圖面附件固定顯示於 modal 上方。
- [x] 客戶載具紀錄與遺留分析固定顯示於 modal 上方。
- [x] 新增與編輯 modal 的共同主檔資訊結構一致。

## P0：一次篩分頁籤

- [x] 新增一次篩分頁籤。
- [x] 將原工單排程放入一次篩分頁籤。
- [x] 將一次篩分服務明細與首件尺寸放入一次篩分頁籤。
- [x] 將一次篩分現場圖片回傳放入一次篩分頁籤。
- [x] 將一次篩分生產記錄放入一次篩分頁籤。
- [x] 將部分入庫歷程與結清追蹤歸入一次篩分頁籤。
- [x] 一次篩分頁籤維持既有 `work_orders` 儲存流程。

## P0：二次篩分頁籤

- [x] 新增二次篩分頁籤。
- [x] 沒有二次篩分案件時顯示空狀態與建立入口。
- [x] 已有二次篩分案件時顯示案件編號、原因、狀態與結果摘要。
- [ ] 顯示二次篩分排程、首件/標準快照、服務明細、生產記錄與現場圖片摘要。
- [x] 二次篩分資料維持讀寫 `rescreen_batches` / `rescreen_batch_*`，不混入一次篩分欄位。
- [x] 二次篩分頁籤可導向既有二次篩選紀錄模組檢視或編輯。

## P1：統計與互動

- [ ] 右側統計依目前頁籤區分一次篩分與二次篩分語意。
- [ ] 一次篩分統計維持原工單數字。
- [ ] 二次篩分統計避免顯示一次篩分數字造成混淆。
- [x] 新增/編輯 modal 的頁籤切換、收合、搜尋下拉互動正常。

## P1：驗證

- [ ] `node --check js/work_orders.js`
- [ ] `node --check js/data-sync.js`
- [ ] `node --check tools/audit-data-sync.js`
- [ ] `node tools/audit-data-sync.js --write docs/data-sync-audit.md`
- [ ] `node tools/audit-system-health.js --changed --base origin/main`
- [ ] `node tools/audit-system-health.js`

## 後續觀察

- [ ] 若二次篩分需要在原工單 modal 內直接完整編輯，評估抽出 `rescreen_batches` modal 共用元件，避免重複維護兩套表單。
