# 開發進度摘要

最後更新：2026-05-11

## 專案架構

- 專案根目錄：`C:/Apache24/htdocs/mes`
- 技術棧：
  - 後端：PHP（`api/*.php`，Apache + MySQL）
  - 前端：Vanilla JS + HTML + CSS（`js/`, `modules/`, `print/`）
  - 測試：PHPUnit（`composer.json`, `phpunit.xml`）
  - 工具：PowerShell / Node.js 腳本（`tools/`）
- 主要目錄：
  - `api/`：模組 CRUD、系統更新 API（`system_update_*`）
  - `modules/`：頁面模組（含安全設定的一鍵更新入口）
  - `print/`：列印模板（含客戶光篩代工委託確認單）
  - `migrations/`：資料庫 migration；`migrations/rollbacks/`：回滾 SQL
  - `tools/`：`build-update-package.ps1`、`audit-system-health.js`、`validate-config-modules.js`
  - `release-notes/`、`dist/`：更新說明與打包產物

## 已完成功能

- 一鍵更新功能已確認整合於「安全設定」頁：
  - 前端：`modules/security_settings.html`, `js/security_settings.js`
  - API：`api/system_update_upload.php`, `api/system_update_apply.php`, `api/system_update_status.php`, `api/system_update_rollback.php`, `api/system_update_maintenance.php`, `api/system_update_init_check.php`, `api/system_update_history.php`
- 閒置自動登出流程修正已完成並通過遠端主機實測：
  - 修正檔案：`script.js`, `login.js`, `login.html`, `login-fui.css`
  - 行為修正：
    - 閒置倒數到期會強制登出並導回登入頁
    - API 回傳 401（Session 逾時）時會自動導回登入頁
    - 登入頁顯示「你已經登入，請再次登入系統」與 `LOGIN` 連結
  - 設定測試：遠端主機以 15 分鐘閒置登出設定測試通過
- 更新包 `v1.0.4` 已建立並完成遠端套用測試：
  - release note：`release-notes/2026-05-11-v1.0.4.txt`
  - 發布檔案：`dist/update_v1.0.4_20260511_205237.zip`
  - 遠端初始化檢查處理：
    - 已補 `system_update_jobs` / `system_update_logs` migration
    - 已排除 ZipArchive 與更新暫存目錄檢查問題
- Git 基線已建立（作為一鍵更新版本比對起點）：
  - 初始化 commit：`1ce804a`
  - 基線 tag：`update-base-2026-05-11`（已 push 到 origin）
  - 主分支：`main`（已 push，追蹤 `origin/main`）
- 遠端倉庫已完成連線與同步：
  - `origin = https://github.com/bos-tw/mes.git`
- 文件規範已整理：
  - 一鍵更新 Git 基線規範已寫入 `/.github/copilot-instructions.md`
  - `DEVELOPMENT_PROGRESS_SUMMARY.md` 保持為每輪對話收斂摘要用途
- `.gitignore` 已補齊高風險覆蓋路徑：
  - `uploads/**`, `export/**`, `backup/**`, `db_backups/**`, `db_exports/**`, `old/**`, `vendor/**`

## 待修 Bug

1. 系統健康審計尚有既有失敗項（技術債，非本輪新增）。
- 重現：在專案根目錄執行 `node tools/audit-system-health.js`，可見現存錯誤/警告清單。

2. 一鍵更新流程尚缺「回滾流程」完整測試紀錄歸檔。
- 現況：`v1.0.4` 已完成「上傳→驗證→套用」與功能驗證，仍待補「回滾」報告。

## 下一步任務

1. 以 `update-base-2026-05-11` 為基準，實作「從 git diff 自動產生更新包檔案清單」腳本（降低漏包風險）。
2. 進行一次完整 UAT 回歸並固化測試清單：上傳、初始化檢查、套用、維護模式、回滾、版本歷程顯示。
3. 持續清理 `audit-system-health` 的高風險項，優先處理安全性與資料一致性問題。
4. 建立下一版 release note 與 migration 對照，並驗證 SQL（MySQL 方言）在測試環境可重放。
5. 制定「一鍵更新操作 SOP」：固定 pull 最新 `main`、打包、驗證、套用、異常回滾。
