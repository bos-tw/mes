# 開發進度摘要

更新時間：2026-06-24  
目前分支：`main`  
最新交付版本：`v3.0.10`  
最新更新包：`dist/update_v3.0.10_20260624_090950.zip`

## 1. 專案架構

- 目錄結構：
  - `api/`：PHP API、權限守門、系統更新、流程追溯端點。
  - `js/`：桌面版原生 JavaScript 模組與 DataSync。
  - `modules/`：功能 HTML 片段。
  - `core/configs/`：配置化模組定義。
  - `migrations/`：MySQL schema / data migration。
  - `tools/`：schema sync、健康稽核、DataSync 稽核、更新包打包工具。
  - `release-notes/`：一鍵更新包變更摘要。
  - `dist/`：本機更新包輸出，`dist/*.zip` 受 `.gitignore` 忽略。
- 技術棧：
  - PHP 8 + PDO + MySQL 8 + Apache 24。
  - 原生 JavaScript / HTML / CSS。
  - Node.js 稽核工具。
  - PowerShell schema sync / 更新包工具。
- 本輪主要涉及模組 / API / 資料表：
  - 模組：主入口 `index.php`、相容轉址入口 `index.html`。
  - API：無 PHP API 邏輯異動；入口仍依賴 `api/cache_version.php` 產生前端資源版本。
  - 資料表：本輪無資料表異動。

## 2. 已完成功能

- 本次新增或修改項目：
  - 修正遠端主入口白畫面問題：移除 `index.php` 的 `declare(strict_types=1);`，避免遠端檔案前置 BOM、空白或主機插入內容時觸發 `strict_types declaration must be the very first statement` fatal。
  - 保留單一完整主入口策略：`index.php` 是完整系統入口，`index.html` 仍只做相容轉址到 `index.php`。
  - 新增 release note：`release-notes/2026-06-24-v3.0.10.txt`，固定三筆摘要。
- 重要資料庫異動：
  - 本輪無 migration。
  - 本輪無 schema 異動。
  - 未修改 `tools/sync-local-schema.ps1` 的 `$migrationChecks`。
- 版本與更新包資訊：
  - `v3.0.10`：遠端入口相容性熱修更新包。
  - 更新包：`dist/update_v3.0.10_20260624_090950.zip`。
  - 打包方式：使用 `tools/build-update-package.ps1`。
  - 打包檔案：`index.php`、`release-notes/2026-06-24-v3.0.10.txt`。
  - migrations：0。
  - 已確認 ZIP 內含 `manifest.json`，且 entries 為 `files/index.php`、`files/release-notes/2026-06-24-v3.0.10.txt`、`manifest.json`。

## 3. 待修 Bug

- 已知問題：
  - 完整健康審計仍有 17 個既有 warning。
  - `api/status_board/update.php`、`api/status_board/delete.php` 仍允許 POST fallback。
  - 多個前端 JS 檔過大，例如 `js/work_orders.js`、`js/shipping_orders.js`、`js/orders.js`、`js/order_items.js`。
  - 多個模組仍存在 `status` / `status_lookup_id` 雙重狀態欄位。
- 重現條件：
  - 既有 warning：執行 `node tools/audit-system-health.js`。
  - 遠端入口白畫面舊問題：遠端 `index.php` 在 `declare(strict_types=1);` 前存在任何輸出、BOM、空白或插入內容時，PHP 會 fatal；本輪已移除入口檔的 strict_types 宣告。
- 目前推測原因：
  - 既有 warning 來自歷史相容策略、大型前端模組累積與欄位過渡期設計。
  - 遠端入口白畫面是 PHP `strict_types` 宣告位置限制與遠端檔案前置內容衝突，不是 `.htaccess` rewrite 問題。

## 4. 下一步任務

- P0
  - 遠端套用 `v3.0.10`，確認 `https://mes.sort.com.tw/`、`/index.php`、登入後主系統與「安全設定 > 一鍵更新」均可正常開啟。
  - 遠端確認 `index.html` 仍會轉往 `index.php`，且不再發生白畫面或「系統已更新」提示反覆出現。
  - 遠端確認 `v3.0.8` 二次重篩 migration / 檔案與 `v3.0.9` 入口版本偵測修補已套用；若缺漏需依版本順序補套。
- P1
  - 瀏覽器實測側邊欄「二次重篩歷史紀錄」、退貨單建立二次重篩案件、案件列表搜尋、詳情追溯鏈。
  - 補齊二次重篩完成後的新庫存建立、再次不良閉環與不良品歷史正式納管。
  - 補強客戶載具遺留分析與出貨 / 退貨 / 工單紀錄彙整視圖。
- P2
  - 清理 `audit-system-health` 既有 warning。
  - 拆分過大的前端模組。
  - 整理 `status` / `status_lookup_id` 雙重狀態欄位策略。

## 5. 驗證狀態

- 已執行的檢查：
  - `git fetch --all --prune`
  - `git status --short`
  - `git checkout main`
  - `git pull --ff-only origin main`
  - `powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1`：`Applied: 22, Pending: 0`，schema already in sync。
  - `php -l index.php`：通過。
  - `node tools/audit-system-health.js --changed --base origin/main`：新增 0、阻擋 0。
  - `node tools/audit-system-health.js`：錯誤 0、警告 17、提示 11。
  - `tools/build-update-package.ps1`：已產出 `v3.0.10` 更新包。
  - ZIP 讀取式驗證：`manifest.json` 存在，版本、檔案清單、migration 數量符合預期。
- 尚未驗證的風險：
  - 尚未在遠端透過一鍵更新實際套用 `v3.0.10`。
  - 尚未完成遠端登入後主系統完整瀏覽器回歸。
  - 尚未完成二次重篩端到端資料流實測。
  - `dist/update_v3.0.10_20260624_090950.zip` 因 `.gitignore` 規則不會進入 Git commit，需保留本機交付檔或另行上傳到遠端更新流程使用。
