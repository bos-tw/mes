# 開發進度摘要

最後更新：2026-05-12

## 專案架構

- 專案路徑：`C:/Apache24/htdocs/mes`
- 技術棧：
  - 後端：PHP 8+（Apache）+ MySQL
  - 前端：Vanilla JS + HTML + CSS（無前端框架）
  - 報表：`print/*.html` 動態渲染 + API 資料聚合
  - 更新機制：一鍵更新（`tools/build-update-package.ps1` 產生 `dist/update_*.zip`，含 `manifest.json`）
- 主要目錄：
  - `api/`：業務 API、報表 API、靜態報表產生 API
  - `print/`：列印版報表模板（含 QRCode 產生）
  - `js/`、`modules/`：系統模組前端邏輯與畫面
  - `tools/`：審計與打包工具（`audit-system-health.js`、`validate-config-modules.js`）
  - `release-notes/`：版本更新說明
  - `dist/`：更新包輸出

## 已完成功能（本輪）

1. 篩分檢驗結果報表版面重構（A4 可讀性導向）
- 檔案：`print/screening_inspection_print.html`
- 完成內容：
  - 移除 PPM 摘要卡與明細表 PPM 欄位（含切換按鈕邏輯）
  - 重新分組資訊區：客戶資訊 / 訂單資訊 / 生產資訊
  - 欄位改為中英對照，並補齊：客戶名稱、圖號、受篩產品、客戶聯絡人、客戶訂單編號、料號、客戶批號、完工日期、操作人員
  - 調整圖表尺寸與間距，縮小不良分布區塊以提高單頁容納率
  - 標題與區塊字重提升，表頭與內容加入分隔線，資訊卡對齊優化

2. 報表資料補強
- 檔案：`api/reports/screening_inspection.php`
- 完成內容：
  - 回傳 `work_order.assigned_employee_name` 供列印畫面顯示操作人員
  - `qrcode_url` 改為可解析同站路徑 fallback（未設定 `REPORT_EXTERNAL_URL` 時不再使用示範網域）

3. QRCode 產生流程改為「先確保可開啟」
- 檔案：`print/screening_inspection_print.html`、`api/reports/generate_static.php`
- 完成內容：
  - 列印頁在產生 QR 前，先呼叫 `POST /api/reports/generate_static.php`
  - 成功時優先使用 `public_url`；若只有 `file_path` 則轉同站可存取 URL
  - `generate_static.php` 在 `REPORT_EXTERNAL_URL` 未設定時，自動回退同站 URL（依當前 host/path 組裝）

4. AI 協作規範文件補充
- 檔案：`.github/copilot-instructions.md`
- 完成內容：新增「QRCode 報表設計紀錄（2026-05-12）」章節，定義試作階段策略、路徑規劃、未來擴充與檢查清單

5. 測試用更新包已產生（未上線）
- `release-notes/2026-05-12-v1.0.5.txt`
- `dist/update_v1.0.5_20260512_121138.zip`

## 待修 Bug（已知問題與重現條件）

1. 系統健康審計存在既有高風險項（非本輪引入）
- 重現步驟：
  - 在專案根目錄執行 `node tools/audit-system-health.js`
- 目前主要錯誤：
  - `J-2`：多個 JS 模組存在 `innerHTML` 未經 `escapeHtml()` 的 XSS 風險
  - `F-1`：`order_items.js`、`work_orders.js`、`shipping_orders.js` 檔案過大
  - `M-1`：`modules/report_descriptions.html` 按鈕 class 規範不符

2. QRCODE 外部入口仍屬試作階段
- 重現條件：
  - 在未設定 `REPORT_EXTERNAL_URL` 的環境掃碼可開啟同站靜態頁，但尚未導入 token 化公開入口
- 影響：
  - 目前可用性已改善，但尚未完成「固定入口 + 可控授權 + 防枚舉」最終架構

## 下一步任務（優先順序）

1. 完成一鍵更新 UAT（本輪 `v1.0.5`）
- 驗證項：上傳、初始化檢查、套用、版本資訊、回滾流程
- 測試通過後再正式標記 release 與部署

2. 修復 `J-2` XSS 風險（最高優先）
- 依 `audit-system-health` 清單分批改寫 `innerHTML` 注入點，統一套用 `escapeHtml()` / 安全渲染

3. QRCODE 公開頁架構升級
- 規劃 `.../report/{token}` 固定入口（可撤銷、可過期、可權限控管）
- 保持舊靜態連結向後相容

4. 報表線上資訊擴充（沿用既有 QR 入口）
- 優先新增：異常說明、處置記錄、檢驗圖片/附件、修訂歷程
- 原則：紙本快照固定，線上資訊可增量擴充

5. 前端技術債收斂
- 拆分大型 JS 模組與樣式規範修正，降低後續改動風險
