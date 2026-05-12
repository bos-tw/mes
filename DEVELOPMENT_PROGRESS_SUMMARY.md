# 開發進度摘要

## 專案架構

- 專案根目錄：`C:\Apache24\htdocs\mes`
- 後端：PHP 8+ 原生 API，入口多位於 `api/**/index.php|show.php|update.php|delete.php`，共用啟動檔為 `api/bootstrap.php`。
- 前端：原生 HTML/CSS/JavaScript，主框架由 `index.php`、`script.js` 載入 `modules/*.html` 與 `js/*.js`。
- 主要模組目錄：
  - `api/`：REST-like API、系統更新、版本檢查、模組資料操作。
  - `js/`：各功能頁前端控制器，例如 `work_orders.js`、`work_order_first_piece_dimensions.js`。
  - `modules/`：功能頁 HTML 片段。
  - `print/`：列印頁。
  - `tools/`：維運工具，包含 `build-update-package.ps1`、`audit-system-health.js`。
  - `release-notes/`：更新包摘要來源。
  - `dist/`：一鍵更新 ZIP 輸出目錄，通常被 Git 忽略。
- 資料庫：MySQL/MariaDB，採軟刪除欄位 `deleted_at` 的表格需保留關聯判斷。
- 發佈規範：一鍵更新包必須使用 `tools/build-update-package.ps1` 產生，ZIP 根目錄需包含 `manifest.json` 與 `files/`。

## 已完成功能

1. 前端快取與版本更新改善
- 新增 `api/cache_version.php`，集中計算前端資源版本 hash。
- `index.php` 改用共用 cache version 輸出 `APP_ASSET_VERSION`，避免硬編版本漏改。
- `api/version.php` 改用共用版本偵測，回傳動態版本與產生時間。
- `script.js` 強化模組載入與版本輪詢：模組 HTML fetch 加上版本參數與 `cache: 'no-store'`，並在 focus/pageshow/互動時提高偵測更新機率。
- `api/system_update_apply.php` 套用更新後會寫入 `uploads/system_updates/cache_version.json` 並嘗試清除 stat/opcache。
- `api/system_update_common.php` 增加 cache version 檔寫入與 PHP cache invalidation helper。
- `api/security_settings/index.php` 與 `modules/security_settings.html` 的更新紀錄顯示限制維持一致。

2. 首件尺寸檢驗刪除 405 修正
- `js/work_order_first_piece_dimensions.js` 的刪除改送 `POST` JSON，包含 `_method: 'DELETE'` 與 `id`，相容目前前端通用請求流程。
- `api/work_order_first_piece_dimensions/delete.php` 補上支援 `DELETE` 與 `POST + _method=DELETE` 的註解與相容說明。
- 已解決錯誤：`POST /api/work_order_first_piece_dimensions/delete.php 405 (Method Not Allowed)`。

3. 生產工單刪除誤判修正
- 問題：直接建立工單或由訂單轉工單後，尚未生產仍無法刪除，顯示「此工單有相關的生產紀錄、首件尺寸資料...」。
- 根因：前端自動產生只有 `card_number` 的預排生產紀錄列；刪除 API 只要看到關聯列就阻擋。
- `js/work_orders.js`：提交時只送出有實際內容的生產紀錄，卡號-only 預排列不再送後端。
- `api/work_orders/helpers.php`：新增 `hasFilledWorkOrderValue()`、`isMeaningfulProductionRecord()`、`filterMeaningfulProductionRecords()`、`isMeaningfulFirstPieceDimension()`。
- `api/work_orders/index.php`、`api/work_orders/update.php`：建立/更新時後端也過濾卡號-only 生產紀錄，防止舊快取 JS 繼續寫入空資料。
- `api/work_orders/delete.php`：刪除前清理空白預建生產紀錄與空白首件尺寸殼資料，只在真正有生產重量/日期/時間/機台/備註或首件尺寸內容時阻擋。
- `api/work_orders/helpers.php` 順手補齊 `fp_notes` 後端驗證與儲存。

4. 更新包產出
- 已產出一鍵更新包：`dist/update_v1.0.7_20260512_175010.zip`
- 版本：`v1.0.7`
- 檔案數：15
- Migrations：0
- ZIP 已驗證包含 `manifest.json` 與 `files/`。
- Release note：`release-notes/2026-05-12-v1.0.7.txt`

5. 已執行檢查
- PHP syntax checks passed：
  - `api/cache_version.php`
  - `api/security_settings/index.php`
  - `api/system_update_apply.php`
  - `api/system_update_common.php`
  - `api/version.php`
  - `api/work_order_first_piece_dimensions/delete.php`
  - `api/work_orders/delete.php`
  - `api/work_orders/helpers.php`
  - `api/work_orders/index.php`
  - `api/work_orders/update.php`
  - `index.php`
- `git diff --check`：僅出現 Git CRLF 換行提示，未見 whitespace error。
- `node` 本機不可用，無法執行 `node tools/audit-system-health.js`。

## 待修 Bug

1. 遠端套用 `v1.0.7` 後需回歸確認工單刪除
- 重現條件：建立新工單或由訂單轉工單，不輸入生產重量/日期/時間/機台/備註與首件尺寸，直接刪除工單。
- 預期：刪除成功。
- 風險：若遠端已有舊資料留下非空但實際無效的關聯列，仍需看資料內容判斷是否要補資料清理腳本。

2. 使用者端快取仍需實機驗證
- 重現條件：遠端更新後，使用者保持舊頁面不重新整理並繼續操作。
- 預期：前端版本輪詢或 focus/pageshow 偵測到版本變化，提示或觸發更新流程，並降低舊 JS 繼續操作的機率。
- 注意：若使用者長時間停在同一頁且完全不互動，仍可能延後偵測。

3. `audit-system-health.js` 尚未在本機跑過
- 重現條件：本機缺少 `node`。
- 預期：安裝 Node.js 後執行 `node tools/audit-system-health.js`，確認無新增系統健康警告。

## 下一步任務

1. P0：遠端上傳並套用 `dist/update_v1.0.7_20260512_175010.zip`
- 套用後確認「安全設定 > 系統更新」可顯示 `v1.0.7` 更新摘要。
- 驗證更新後 `api/version.php` 回傳版本會變動。

2. P0：回歸測試工單刪除
- 直接建立工單後立即刪除。
- 訂單轉工單後立即刪除。
- 有實際生產紀錄時刪除應回 409 並保護資料。
- 有實際首件尺寸時刪除應回 409 並保護資料。
- 有工單圖片時刪除應回 409 並保護資料。

3. P0：回歸測試首件尺寸檢驗刪除
- 在首件尺寸檢驗列表刪除資料。
- 確認不再出現 405。
- 確認刪除後列表與工單頁關聯狀態正確。

4. P1：驗證使用者更新體驗
- 使用舊頁面停留測試：套用更新後切回頁面、focus、pageshow、點擊操作，確認版本偵測與更新提示/刷新行為。
- 確認動態載入模組 HTML 不再被瀏覽器快取卡住。

5. P1：安裝 Node.js 或改由有 Node 的環境執行健康檢查
- 執行 `node tools/audit-system-health.js`。
- 若有警告，依模組分批修正。

6. P2：資料清理評估
- 若遠端資料庫已累積舊版產生的卡號-only `production_records`，評估是否補 migration 或一次性清理工具。
- 清理條件需避免刪除已經有重量、日期、時間、機台或備註的真實生產紀錄。
