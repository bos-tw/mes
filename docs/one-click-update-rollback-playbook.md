# 一鍵更新與一鍵還原實作手冊（跨專案通用）

> 目的：把本專案（MES）已落地的一鍵更新/回滾機制，整理成可移植到其他專案的實作模板。  
> 適用：PHP + MySQL 專案（其他語言也可沿用相同資料流與檔案格式）。

## 1. 核心概念

一鍵還原要成立，必須同時具備三件事：

1. 可追溯的更新批次（`system_update_jobs`）。
2. 套用前的檔案備份（每個 job 的 `backup_dir`）。
3. 可反向執行的 DB rollback migration（`rollback_migrations` 或可推導路徑）。

只做到「覆蓋檔案 + 執行 migration」不叫可還原；那只是可更新。

## 2. 目錄與資料流設計

建議統一使用：

- 更新根目錄：`uploads/system_updates/`
- 更新包：`uploads/system_updates/packages/*.zip`
- 每次更新工作目錄：`uploads/system_updates/jobs/job_{id}/`
- 套用前檔案備份：`uploads/system_updates/jobs/job_{id}/backup_YYYYMMDD_HHMMSS/`
- DB 每日快照：`uploads/system_updates/db_backups/db_snapshot_YYYYMMDD.sql`
- 維護模式旗標：`uploads/system_updates/maintenance_state.json`

資料流：

1. 上傳 ZIP -> 驗證 `manifest.json` -> 寫入 `system_update_jobs(status=validated)`。
2. 套用更新 -> 自動進維護模式 -> 備份原檔 -> 覆蓋新檔 -> 執行 migrations -> 健康檢查 -> 成功後關維護模式。
3. 若套用失敗 -> 檔案回復 + 嘗試 rollback executed migrations。
4. 手動回滾 -> 依 job 的 `backup_dir` 還原檔案 + 執行 rollback migrations。

## 3. 更新包 ZIP 規格（必備）

ZIP 根目錄必須包含：

- `manifest.json`
- `files/`（要覆蓋到專案根目錄的相對檔案）
- `migrations/*.sql`（正向 migration）
- `migrations/rollbacks/*.sql`（反向 migration，建議）

`manifest.json` 最低欄位：

```json
{
  "version_number": "v2.1.0",
  "file_version": "v2.1.0",
  "release_date": "2026-05-17",
  "change_summary": "1. ...\n2. ...",
  "files_root": "files",
  "migrations": [
    "migrations/2026_05_17_add_xxx.sql"
  ],
  "rollback_migrations": [
    "migrations/rollbacks/2026_05_17_rollback_add_xxx.sql"
  ]
}
```

## 4. 回滾檔命名規範（建議強制）

本專案有內建推導規則，可供你在其他專案沿用：

- 正向：`migrations/2026_05_17_add_xxx.sql`
- 反向：`migrations/rollbacks/2026_05_17_rollback_add_xxx.sql`

若 `manifest.rollback_migrations` 沒填，系統可嘗試由正向檔名推導；但建議明確填入，降低誤判。

## 5. 需要的資料表

至少要有兩張表：

1. `system_update_jobs`：記錄每次上傳/套用/回滾狀態與備份路徑。
2. `system_update_logs`：顯示版本歷史（例如「關於系統」只顯示最近 3 筆）。

狀態建議值：

- `uploaded`
- `validated`
- `applying`
- `success`
- `failed`
- `rolling_back`
- `rolled_back`
- `rollback_failed`

## 6. API 介面建議（對照 MES）

最小集合：

1. `GET /api/system_update_init_check.php`
2. `POST /api/system_update_upload.php`
3. `POST /api/system_update_apply.php`
4. `GET /api/system_update_status.php`
5. `GET/POST /api/system_update_rollback.php`
6. `POST /api/system_update_backup.php`（可手動先做 DB 快照）
7. `GET /api/system_update_history.php`

## 7. 套用更新時的必要防護

1. 先驗證 ZIP 路徑安全（拒絕 `../`、絕對路徑）。
2. 保護路徑不可被覆蓋（例如 `.env`、`api/config.php`、`uploads/`、`vendor/`）。
3. 套用前先把既有檔案複製到 `backup_dir`。
4. 套用完成前保持維護模式。
5. 套用後做健康檢查（關鍵檔存在、DB 可查詢、覆蓋檔存在）。

## 8. 一鍵回滾「可執行」條件（重點）

要能回滾，至少要通過：

1. 該 job 的更新包檔案仍存在。
2. 該 job 的 `backup_dir` 仍存在。
3. 每個正向 migration 都有對應 rollback migration。
4. rollback migration 實體檔案存在於更新包內。
5. job 狀態為 `success`（才允許回退）。

## 9. 打包腳本建議

建議至少準備兩支腳本：

1. `build-update-package.ps1`
2. `build-update-package-safe.ps1`（從 `git diff` 自動收檔 + ZIP 覆蓋驗證）

另外，若你要「真的可回滾」，打包器要支援把 `rollback_migrations` 寫進 `manifest.json`，並把反向 SQL 放入 ZIP。  
很多專案只打了 `migrations`，導致 UI 有回滾按鈕但實際不可回滾。

## 10. 跨專案導入檢查清單

- [ ] 已建立 `system_update_jobs` / `system_update_logs`。
- [ ] 更新包含 `manifest.json + files/`。
- [ ] `manifest` 包含 `migrations` 與 `rollback_migrations`。
- [ ] 有維護模式開關機制。
- [ ] 有 job 級檔案備份路徑。
- [ ] 有 DB 快照機制與保留天數。
- [ ] 回滾前會做 readiness check。
- [ ] 套用/回滾後有健康檢查。
- [ ] 狀態機完整（含 `rollback_failed`）。

## 11. 本專案可直接參考的檔案

- `api/system_update_common.php`
- `api/system_update_upload.php`
- `api/system_update_apply.php`
- `api/system_update_rollback.php`
- `api/system_update_init_check.php`
- `api/system_update_status.php`
- `api/system_update_backup.php`
- `tools/build-update-package.ps1`
- `tools/build-update-package-safe.ps1`
- `migrations/2026_05_09_create_system_update_jobs.sql`
- `migrations/2026_05_09_create_system_update_logs.sql`

---

如果你要把這套複製到新專案，建議先完成「上傳 -> 驗證 -> 套用 -> 失敗回復 -> 手動回滾」五段整合測試，再開放一鍵更新給正式環境使用。
