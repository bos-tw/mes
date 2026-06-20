# 手機版工單部署與更新檢查清單

更新日期：2026-06-20
適用範圍：`/mobile` 第一版、三張新圖片表、桌面工單唯讀整合、操作紀錄

## 1. 一鍵更新包必帶檔案

以下檔案屬於本輪手機版工單第一階段的必要 runtime 內容：

- `index.html`
- `index.php`
- `script.js`
- `js/data-sync.js`
- `js/work_orders.js`
- `modules/work_orders.html`
- `mobile/index.php`
- `mobile/mobile.css`
- `mobile/mobile.js`
- `api/work_orders/helpers.php`
- `api/work_orders/index.php`
- `api/work_orders/show.php`
- `api/work_orders/update.php`
- `api/work_orders/partial_receipt.php`
- `api/quality_issue_reports/index.php`
- `api/work_order_execution_image_common.php`
- `api/work_order_operation_logs_helper.php`
- `api/work_order_completion_images/index.php`
- `api/work_order_completion_images/update.php`
- `api/work_order_completion_images/delete.php`
- `api/work_order_defect_images/index.php`
- `api/work_order_defect_images/update.php`
- `api/work_order_defect_images/delete.php`
- `api/work_order_tool_condition_images/index.php`
- `api/work_order_tool_condition_images/update.php`
- `api/work_order_tool_condition_images/delete.php`

## 2. 一鍵更新包必帶 migration

- `migrations/2026_06_20_add_work_order_execution_image_tables.sql`
- `migrations/2026_06_20_add_work_order_operation_logs.sql`

## 3. ZIP 路徑檢查重點

- `mobile/` 內檔案必須保持：
  - `files/mobile/index.php`
  - `files/mobile/mobile.css`
  - `files/mobile/mobile.js`
- 不可被打包到專案根目錄，例如：
  - `files/index.php` 取代了 `files/mobile/index.php`
  - `files/mobile.js` 取代了 `files/mobile/mobile.js`
- 三張新圖片 API 必須維持各自獨立目錄：
  - `files/api/work_order_completion_images/...`
  - `files/api/work_order_defect_images/...`
  - `files/api/work_order_tool_condition_images/...`

## 4. 建議打包指令

建議使用 `tools/build-update-package.ps1` 明確指定檔案，避免把不必要的工作中草稿一起打入：

```powershell
& ".\tools\build-update-package.ps1" `
  -VersionNumber "v2.0.9-mobile-stage1" `
  -FileVersion "v2.0.9-mobile-stage1" `
  -ReleaseDate "2026-06-20" `
  -ChangeSummaryFile "release-notes/2026-06-20-mobile-work-orders-stage1.txt" `
  -Files @(
    "index.html",
    "index.php",
    "script.js",
    "js/data-sync.js",
    "js/work_orders.js",
    "modules/work_orders.html",
    "mobile/index.php",
    "mobile/mobile.css",
    "mobile/mobile.js",
    "api/work_orders/helpers.php",
    "api/work_orders/index.php",
    "api/work_orders/show.php",
    "api/work_orders/update.php",
    "api/work_orders/partial_receipt.php",
    "api/quality_issue_reports/index.php",
    "api/work_order_execution_image_common.php",
    "api/work_order_operation_logs_helper.php",
    "api/work_order_completion_images/index.php",
    "api/work_order_completion_images/update.php",
    "api/work_order_completion_images/delete.php",
    "api/work_order_defect_images/index.php",
    "api/work_order_defect_images/update.php",
    "api/work_order_defect_images/delete.php",
    "api/work_order_tool_condition_images/index.php",
    "api/work_order_tool_condition_images/update.php",
    "api/work_order_tool_condition_images/delete.php"
  ) `
  -Migrations @(
    "migrations/2026_06_20_add_work_order_execution_image_tables.sql",
    "migrations/2026_06_20_add_work_order_operation_logs.sql"
  ) `
  -OutputDir "dist"
```

## 5. 遠端部署後驗證清單

部署完成後，至少驗證以下流程：

1. `/mobile` 可開啟登入頁，且登入樣式正常。
2. 手機登入後可看到工單清單，預設顯示 `待開工 / 生產中 / 暫停中`。
3. 手機可開啟工單明細，並可看到：
   - 完工圖片
   - 不良品圖片
   - 載具狀況圖片
   - 操作紀錄
4. 手機可執行：
   - 開工
   - 暫停
   - 恢復
   - 部分完工
   - 完工
   - 異常回報
   - 三類圖片上傳
5. 手機上傳完工圖片後，桌面版工單明細可讀取新圖。
6. 手機上傳不良品圖片後，桌面版工單明細可讀取新圖。
7. 手機上傳載具狀況圖片後，桌面版工單明細可讀取新圖。
8. 手機操作後，工單明細的操作紀錄可看到對應追溯項目。
9. 若桌面版工單頁已開啟，再由手機操作後，桌面頁面能重新整理或收到跨頁同步結果。
10. 遠端 migration 套用後，確認資料表存在：
   - `work_order_completion_images`
   - `work_order_defect_images`
   - `work_order_tool_condition_images`
   - `work_order_operation_logs`

## 6. 本輪不建議忽略的風險

- 若 ZIP 中 `mobile/` 路徑錯位，遠端 `/mobile` 將直接失效。
- 若漏掉 `api/work_order_operation_logs_helper.php`，操作紀錄功能會失敗。
- 若漏掉 `js/data-sync.js` 或 `mobile/mobile.js`，跨頁同步與手機端刷新行為會不一致。
- 若漏掉兩支 migration，遠端上傳圖片與操作紀錄會缺表失敗。
