# 開發進度摘要

最後更新：2026-05-11

## 專案架構

- 專案根目錄：`C:/Apache24/htdocs/mes`
- 技術棧：
  - 後端：PHP（Apache + MySQL），主要 API 位於 `api/`
  - 前端：Vanilla JS + HTML + CSS（`script.js`, `js/`, `modules/`）
  - 更新機制：一鍵更新（上傳 ZIP + manifest，套用檔案與 migration）
  - 測試/檢查：`tools/audit-system-health.js`、`tools/validate-config-modules.js`
- 重要目錄：
  - `api/`：業務 API 與系統更新 API（`system_update_*`）
  - `js/`：模組 JS 與頁面功能邏輯
  - `modules/`：功能頁 HTML（含安全設定頁）
  - `migrations/`：資料庫 migration（含 system update 相關表）
  - `release-notes/`：版本更新摘要
  - `dist/`：更新包產物（`update_*.zip`）

## 已完成功能

- 修正「閒置自動登出」實際未登出的問題（已實測通過）：
  - 檔案：`script.js`, `login.js`, `login.html`, `login-fui.css`
  - 變更重點：
    - 閒置倒數歸零時強制執行登出並導向登入頁
    - 全域攔截 API `401`（Session 逾時）並導向登入頁，避免停留舊畫面
    - 登入頁新增逾時提示與 `LOGIN` 連結（文案：你已經登入，請再次登入系統）
- 建立最小變更更新包 `v1.0.4` 並完成遠端套用驗證：
  - `release-notes/2026-05-11-v1.0.4.txt`
  - `dist/update_v1.0.4_20260511_205237.zip`
- 遠端部署排障（CloudPanel）：
  - 補齊 DB migration（`system_update_jobs`, `system_update_logs`）
  - 排除初始化檢查中的 `ZipArchive` 與更新暫存目錄問題（操作層面）
- Git 已提交並推送：
  - commit：`7bc748e`
  - branch：`main`（已同步 `origin/main`）

## 待修 Bug

1. 系統健康審計存在既有錯誤（非本輪新增）。
- 重現：
  - 在專案根目錄執行 `node tools/audit-system-health.js`
  - 目前可見既有錯誤群組：`J-2`（多處 innerHTML 未 escapeHtml）、`F-1`（大型 JS 檔）、`M-1`（樣式規範）等

2. 一鍵更新流程缺少「完整回滾」正式測試紀錄。
- 重現：
  - 已完成上傳/驗證/套用與功能驗證
  - 尚未形成可追溯的「套用後回滾」測試報告（含資料與檔案一致性）

## 下一步任務（依優先順序）

1. 完成一鍵更新 UAT 回歸報告（含回滾流程）
- 覆蓋：上傳、初始化檢查、套用、維護模式、回滾、版本歷程顯示

2. 先處理高風險安全項（`J-2` XSS）
- 以 `audit-system-health` 清單分批修正 innerHTML 輸出，統一套用 `escapeHtml()`

3. 建立更新包檔案清單自動化
- 以 `update-base-2026-05-11..HEAD` 的 `git diff --name-only` 生成 `-Files` 清單，降低漏包風險

4. 持續收斂前端技術債
- 拆分過大 JS 模組（優先 `order_items.js`, `work_orders.js`, `shipping_orders.js`）

5. 固化遠端部署前檢查清單（CloudPanel）
- 檢查項：`ZipArchive`、`uploads/system_updates` 可寫入、`system_update_*` migration 完整性
