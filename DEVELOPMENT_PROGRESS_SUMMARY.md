# 開發進度摘要

更新時間：2026-06-21
目前分支：`main`
目前交付版本：`v3.0.2`

## 1. 專案架構

- 目錄結構：
  - `mobile/`：手機版入口與前端，包含 `index.php`、`mobile.js`、`mobile.css`
  - `modules/`、`js/`、`styles.css`：桌面版模組、行為與共用樣式
  - `print/`：A4 與其他列印範本
  - `api/work_orders/`：工單清單、明細與流程 API
  - `api/work_order_completion_images/`、`api/work_order_defect_images/`、`api/work_order_tool_condition_images/`：三類現場圖片 API
  - `migrations/`：資料庫 migration
  - `tools/`：健康檢查、DataSync 稽核、schema 同步與更新包建置
  - `release-notes/`、`dist/`：版本說明與一鍵更新包輸出
- 技術棧：
  - 後端：PHP 8、PDO、MySQL 8
  - 前端：原生 JavaScript、HTML、CSS
  - 維運：Node.js、PowerShell、Apache
- 本輪主要涉及：
  - `mobile/mobile.css`
  - `modules/work_orders.html`
  - `js/work_orders.js`
  - `print/work_order_print.html`
  - `styles.css`
  - 手機工單快速入口與既有三類圖片上傳流程
- 本輪未修改 API、資料表或 migration。

## 2. 已完成功能

- 修正手機版圖片上傳 modal：
  - modal 內容區可捲動
  - 底部操作區保持可見
  - 小螢幕欄位、預覽與間距已壓縮
- 桌面版「編輯生產工單」新增手機快速入口：
  - 顯示對應工單 QR Code
  - 支援開啟手機版與複製連結
  - 掃描後以 `work_order_id` 直接開啟該工單
- A4 生產命令單新增同一工單手機入口 QR Code：
  - QR 內容以桌面編輯版為準，列印時傳入相同 `mobile_base`
  - 限制 QR 基底網址為同站來源
  - 桌面與 A4 均使用 `QRCode.CorrectLevel.H`
  - A4 QR 顯示尺寸縮為 `16mm`
- A4 表頭完成壓縮：
  - 移除 QR 下方說明文字
  - 工單編號、製單日期、預計交期置於 QR 左側並靠右
  - 製單日期與預計交期同列
  - 預計交期放大並加粗
  - 表頭最低高度由 `22mm` 降為 `18mm`
- 已同步更新手機工單規格、待辦與 DataSync 稽核文件。

### 重要資料庫異動

- 本輪沒有資料庫異動。
- 本輪沒有新增 migration。
- 既有圖片表與操作紀錄表沿用 `v3.0.1` 已存在結構。

### 版本與更新包

- 版本：`v3.0.2`
- Release note：`release-notes/2026-06-21-v3.0.2.txt`
- 更新包：`dist/update_v3.0.2_20260621_092432.zip`
- SHA-256：`77F6B273F907E0BE52124A0F5B5860024731C65C91527FD2F8C8483F59DEF26A`
- 更新包已確認包含 `manifest.json`、9 個本輪檔案、0 個 migration。

## 3. 待修 Bug

- 已知問題：
  - 完整健康稽核仍有 17 個既有 warning。
  - DataSync 稽核仍有 10 個既有 P2 `crud_module_without_dependents`。
  - 尚未於正式環境套用 `v3.0.2`。
  - 尚未以實體手機掃描 A4 QR 並完成圖片上傳回歸。
- 重現條件：
  - 執行 `node tools/audit-system-health.js` 可看到 17 個 warning。
  - 執行 `node tools/audit-data-sync.js --write docs/data-sync-audit.md` 可看到 10 個 P2。
  - A4 QR 與手機 modal 風險需在正式站、實體手機與實際印表尺寸下驗證。
- 目前可確認原因：
  - 健康稽核 warning 為既有大型 JS、`status_board` POST fallback、雙重狀態欄位及 inline style。
  - DataSync P2 為既有 CRUD 模組未宣告 dependent。
  - 正式掃碼與列印風險來自尚未完成遠端部署及實機回歸。

## 4. 下一步任務

- P0：
  - 於正式環境套用 `update_v3.0.2_20260621_092432.zip`
  - 驗證桌面編輯版與 A4 QR 對同一工單開啟相同手機網址
  - 以實體手機完成掃碼、登入、工單直達與三類圖片上傳
- P1：
  - 實際列印 A4，確認 QR 可掃、表頭不重疊、預計交期清楚且整頁未溢出
  - 驗證手機上傳 modal 在常用 Android/iOS 螢幕可捲動且送出按鈕可操作
  - 驗證手機上傳後桌面工單圖片與跨頁刷新結果
- P2：
  - 清理健康稽核 17 個既有 warning
  - 清理 DataSync 10 個既有 P2
  - 評估將 QR URL 產生邏輯抽成共用模組，避免後續桌面與列印版再次分歧

## 5. 驗證狀態

已執行：

- `node tools/audit-system-health.js`
  - 結果：0 error、17 warning
- `node tools/audit-system-health.js --changed --base origin/main`
  - 結果：0 new、0 blocking
- `node --check js/work_orders.js`
- `node --check js/data-sync.js`
- `node --check tools/audit-data-sync.js`
- `node tools/audit-data-sync.js --write docs/data-sync-audit.md`
  - 結果：P0=0、P1=0、P2=10
- Release note 已確認固定 3 行。
- 更新包已確認：
  - `manifest.json` 存在
  - 版本與日期正確
  - 9 個檔案清單正確
  - migration 陣列為空

尚未驗證：

- 正式環境更新包套用
- 正式站 QR URL 與登入後工單直達
- 實體 A4 列印尺寸、QR 掃描成功率與整頁高度
- Android/iOS 真機上傳 modal 與三類圖片完整流程
