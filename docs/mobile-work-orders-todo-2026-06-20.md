# 手機版生產工單待辦追蹤

更新日期：2026-06-20
對應文件：`docs/mobile-work-orders-spec-2026-06-20.md`
狀態：已開始實作，第一版入口、手機上傳與桌面唯讀整合已落地

## 1. 產品決策基線

- [x] 手機版只做生產工單，不含其他模組
- [x] 完工照片為建議上傳，不強制
- [x] `部分完工` 為第一版必做
- [x] 第一版手機版權限先視為一致
- [x] 手機入口採獨立模組
- [x] 登入樣式需與桌面版一致
- [x] 整體風格需與桌面版一致，但版面需手機友善
- [x] 遠端測試期間採 `只新增、不取代、不中斷舊流程`
- [x] 本輪先不導入通用附件模型
- [x] `work_order_images` 既有用途先保留
- [x] 完工圖片 / 不良品圖片 / 載具狀況圖片改採獨立資料表

## 2. 規格確認待辦

- [x] 確認手機版模組正式名稱與入口文案
- [x] 確認工單清單頁的預設篩選條件
- [x] 確認工單卡片需顯示的最終欄位
- [x] 確認 `部分完工` 與 `完工` 的欄位差異
- [x] 確認異常類型清單是否沿用既有資料來源
- [x] 確認照片類型分類是否第一版就納入
- [x] 確認 QR Code 入口是否列入第一版
- [x] 確認三張新圖片表是否需要保留事件關聯欄位

## 3. UI / UX 規劃待辦

- [x] 盤點現有桌面版登入頁樣式與可共用元素
- [x] 規劃手機版登入頁版型
- [x] 規劃手機版工單清單頁版型
- [x] 規劃手機版工單執行頁版型
- [x] 規劃手機版異常回報區塊
- [x] 規劃手機版照片上傳區塊
- [x] 定義手機 / 平板斷點與元件尺寸

## 4. 資料結構與後端規劃待辦

- [x] 盤點現有 `work_orders` 可直接沿用的欄位與 API
- [x] 規劃手機版工單查詢 API
- [x] 規劃開工 / 暫停 / 恢復 / 部分完工 / 完工 API
- [x] 規劃異常回報 API
- [x] 規劃 `work_order_completion_images` 資料表與 API
- [x] 規劃 `work_order_defect_images` 資料表與 API
- [x] 規劃 `work_order_tool_condition_images` 資料表與 API
- [x] 規劃並實作操作紀錄資料表
- [x] 規劃桌面版工單明細讀取新圖片 API 整合
- [x] 確認異常追溯第一版沿用既有 `quality_issue_reports`
- [x] 若新增 migration，記得同步更新 `tools/sync-local-schema.ps1`

## 5. 權限與入口規劃待辦

- [x] 手機版集中開發目錄為 `mobile/`
- [x] 正式預計使用路徑為 `https://mes.sort.com.tw/mobile`
- [x] 確認第一版不新增獨立權限鍵 `mobile_work_orders.*`
- [x] 確認桌面版保留上方快捷入口，不放側邊欄連結
- [x] 若入口樣式調整，需同步更新 `index.html` 與 `index.php`
- [x] 規劃手機版登入後導向邏輯
- [x] 規劃 QR Code 或直達工單入口路徑
- [x] 規劃 `mobile/` 目錄下的頁面、腳本、樣式與資源結構
- [x] 確認手機版相對 / 絕對路徑策略，避免部署到 `/mobile` 後資源失效

## 6. 前端實作待辦

- [x] 建立手機版頁面骨架
- [x] 建立手機版工單清單
- [x] 建立手機版工單執行頁
- [x] 建立開工動作
- [x] 建立暫停 / 恢復動作
- [x] 建立部分完工回報
- [x] 建立完工回報
- [x] 建立異常回報
- [x] 建立照片上傳與預覽
- [x] 補齊成功 / 失敗提示與防重送處理
- [x] 手機版改接 `work_order_completion_images`
- [x] 手機版補 `work_order_defect_images`
- [x] 手機版補 `work_order_tool_condition_images`
- [x] 桌面版工單明細新增完工圖片唯讀區塊
- [x] 桌面版工單明細新增不良品圖片唯讀區塊
- [x] 桌面版工單明細新增載具狀況圖片唯讀區塊

## 7. 整合與驗證待辦

- [x] 修改功能模組前執行 `node tools/audit-system-health.js --changed --base origin/main`
- [x] 修改功能模組後執行 `node tools/audit-system-health.js --changed --base origin/main`
- [ ] 若修改配置型模組，修改前後執行 `node tools/validate-config-modules.js`
- [ ] 若涉及前端 CRUD / 狀態 / DataSync，執行：
- [x] `node --check js/data-sync.js`
- [x] `node --check tools/audit-data-sync.js`
- [x] `node tools/audit-data-sync.js --write docs/data-sync-audit.md`
- [x] 若新增 migration，執行 `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`
- [x] 盤點是否需補 `php -l` 與 `node --check` 對應檔案
- [x] 打包一鍵更新時，確認手機版檔案於 ZIP 內仍維持 `mobile/` 路徑
- [ ] 驗證遠端部署後 `https://mes.sort.com.tw/mobile` 可正常開啟
- [x] 新圖片表納入 DataSync，至少刷新 `work_orders` 相關畫面
- [ ] 驗證手機上傳後桌面版工單明細可正常讀取三類新圖片

## 8. 建議開發順序

- [x] 第 1 階段：確認規格與入口位置
- [x] 第 2 階段：完成手機版頁面框架與登入樣式對齊
- [x] 第 3 階段：完成工單清單與工單執行頁
- [x] 第 4 階段：新增三張工單圖片表與 API
- [x] 第 5 階段：手機版改接完工 / 不良品 / 載具狀況圖片
- [x] 第 6 階段：桌面版工單明細補唯讀整合
- [ ] 第 7 階段：完成驗證、修補與回歸測試

## 9. 目前狀態備註

- 已完成第一版獨立入口 `mobile/index.php`、`mobile/mobile.css`、`mobile/mobile.js`。
- 已落地手機版登入頁、工單清單、工單詳情與開工 / 暫停 / 恢復 / 部分完工 / 完工 / 異常回報 / 照片上傳流程。
- 工單照片已支援手機直接拍照、相簿多張選取、送出前預覽與移除未送出照片。
- 已同步把 `生產工單手機版` 掛入桌面首頁上方快捷入口，並移除側邊欄連結。
- 手機版 `每日機台檢驗` 已可查詢、新增、編輯；其餘抽屜選單頁面仍保留後續擴充入口。
- 已確認本輪附件策略為：保留 `work_order_images`，新增三張獨立圖片表，不先導入通用附件模型。
- 已確認桌面版需同步補讀取能力，但第一階段先做工單明細唯讀整合。
- 已完成三張新圖片表 migration、schema sync 與獨立 API 基礎：
  - `work_order_completion_images`
  - `work_order_defect_images`
  - `work_order_tool_condition_images`
- 已擴充 `api/work_orders/show.php`，工單明細可帶出三類新圖片資料供手機版 / 桌面版後續接用。
- `/mobile` 本機煙霧檢查已回應 `HTTP 200`。
- 已完成桌面版工單明細三類圖片唯讀區塊：
  - 完工圖片
  - 不良品圖片
  - 載具狀況圖片
- 已完成 `work_order_operation_logs` 操作紀錄表、migration 與 schema sync。
- 已把以下手機端核心動作接入工單操作紀錄：
  - 開工
  - 暫停
  - 恢復
  - 部分完工
  - 完工
  - 品質異常回報
  - 完工圖片上傳
  - 不良品圖片上傳
  - 載具狀況圖片上傳
- 已擴充 `api/work_orders/show.php` 回傳 `operation_logs`，手機工單明細可直接查看操作紀錄。
- 已完成本機驗證：
  - `node tools/audit-system-health.js --changed --base origin/main`
  - `node --check js/data-sync.js`
  - `node --check tools/audit-data-sync.js`
  - `node tools/audit-data-sync.js --write docs/data-sync-audit.md`
  - `php -l` / `node --check` 對應異動檔案
  - `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`
- 已補手機版跨頁資料同步通知，手機操作後可發送 `work_orders` 與新圖片模組的 DataSync 事件。
- 已完成一鍵更新包本機預檢：
  - 更新包：`dist/update_v2.1.5-mobile-precheck_20260620_221849.zip`
  - 已確認 ZIP 內保留 `files/mobile/index.php`、`files/mobile/mobile.css`、`files/mobile/mobile.js`
  - 已確認 ZIP 內包含兩支 migration 與三組新圖片 API
- 已新增部署文件：`docs/mobile-deployment-checklist-2026-06-20.md`

## 10. 目前真正剩餘的重點缺口

- 待決策：
  - 暫無，本輪主要產品決策已補齊
- 待實作：
  - 遠端 `/mobile` 部署驗證
  - 驗證手機上傳後桌面版工單明細實機讀取

## 11. 本輪最新確認

- 工單清單預設篩選：狀態預設 `待開工`、`生產中`、`暫停中`；日期與機台不預設。
- 工單卡片第一版維持目前精簡欄位，不再增加更多固定欄位。
- `部分完工` 與 `完工` 欄位維持目前已實作版本。
- 異常資料來源沿用既有 `quality_issue_reports`。
- QR Code / 直達工單入口列入第一版。
- 第一版不新增獨立權限鍵 `mobile_work_orders.*`。
- 三張新圖片表第一版不保留更細事件關聯欄位。
- 異常追溯第一版不另建新主表；操作追溯仍需補操作紀錄資料表。
- 工單清單第一版不額外加上「是否有異常」標記。
- 推進順序採：先把本機功能補完整，再整理遠端 `/mobile` 驗證與上線。
