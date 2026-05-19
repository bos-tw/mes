# 開發進度摘要（更新：2026-05-19）

## 專案架構

- 根目錄：C:/Apache24/htdocs/mes
- 主要目錄：
  - api/：PHP API（模組化端點、權限驗證、RBAC）
  - js/：前端模組（IIFE、data-action 事件委派）
  - core/configs/：配置化模組定義
  - modules/：非配置化或混合模式 HTML 模組
  - migrations/：資料庫 migration
  - tools/：審計、schema 同步、更新包打包腳本
  - dist/：一鍵更新包輸出
- 技術棧：
  - 後端：PHP 8 + PDO/MySQL
  - 前端：Vanilla JS + HTML + CSS
  - 配置化渲染：core/module-config.js + core/module-renderer.js
  - 資料同步：js/data-sync.js
  - 自動化：node tools/audit-system-health.js、node tools/audit-data-sync.js、powershell tools/sync-local-schema.ps1

## 已完成功能

1. 新增側邊欄新功能納管規範（強制）
- 已寫入 .github/copilot-instructions.md，明確要求「選單 + 權限 + 相容 + migration + 驗收」五件事同輪完成。

2. 修正生產工單排程權限缺口
- 前端側邊欄權限判斷補齊模組對應與別名：
  - script.js：MODULE_LEGACY_PERMISSION_MAP 新增 production_work_order_schedule -> manage_work_orders
  - script.js：PERMISSION_ALIAS_MAP 新增 production_work_order_schedule.read -> 生產工單排程
- 後端權限別名與 legacy 映射補齊：
  - api/bootstrap.php：getPermissionAliasMap 與 legacyPermissionMap 同步新增對應。

3. 權限資料與資料庫同步落地
- 新增 migration：migrations/2026_05_18_add_production_work_order_schedule_permission.sql
  - 建立 production_work_order_schedule.read
  - 自動複製既有 manage_work_orders 角色到新權限（向後相容）
- tools/sync-local-schema.ps1 已新增對應 migration check。

4. 角色權限關聯顯示優化
- api/role_permissions/helpers.php：權限顯示名稱改由 bootstrap alias map 解析。
- production_work_order_schedule.read 會顯示為「生產工單排程」。

5. 更新包已產出（可一鍵更新遠端）
- 版本：v2.0.3
- 變更摘要：release-notes/2026-05-19-v2.0.3.txt
- 輸出：dist/update_v2.0.3_20260519_132202.zip
- 打包統計：主檔 40、migration 2
- 覆蓋驗證：MISSING_MAIN=0、MISSING_MIG=0、manifest.json 存在

## 待修 Bug

1. 系統健康審計基線仍未清零（歷史技術債）
- 重現：node tools/audit-system-health.js
- 現況：仍有 Errors（非本輪新增）
- 主要類型：
  - J-2：部分模組 innerHTML 未完全 escapeHtml
  - F-1：大型 JS 模組仍超過建議行數
  - A-3：部分 API 仍有 POST fallback 警示

2. 權限更新後的 UI 可見性需要重新登入
- 重現：修改角色權限後不重新登入，側邊欄可能維持舊 session 權限快照。
- 臨時解法：登出再登入後驗證可見性。

3. 開發環境缺少 rg 指令
- 重現：PowerShell 執行 rg 失敗（command not found）。
- 影響：搜尋流程需退回 Select-String，效率較低。

## 下一步任務（優先順序）

1. P0：遠端套用並驗收 v2.0.3 更新包
- 驗收點：
  - 生產工單排程可在角色權限關聯中搜尋與編輯
  - 有權限角色看得到側邊欄，無權限角色看不到
  - migration 2026_05_16、2026_05_18 皆成功執行

2. P0：收斂健康審計 Errors（先清安全與阻斷項）
- 優先清理 J-2（XSS 風險）與 A-3（方法相容警示）。

3. P1：整理權限體系遷移策略
- 逐步從 legacy manage_* 過渡到 module.read/module.edit/module.delete。
- 建立 migration 模板，統一新模組權限建立與角色複製流程。

4. P1：清理大型模組技術債
- 拆分 order_items.js、work_orders.js（api/render/controller 分層）。

5. P2：工具鏈體驗改善
- 補齊 rg 工具或在文件加註 PowerShell fallback 搜尋方案。
