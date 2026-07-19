# MES 修改治理流程

## 修改前

1. 明確列出主目標、DoD、預計修改檔案與不得修改範圍。
2. 依檔案類型讀取對應 `.github/instructions` 與本目錄正式規範。
3. 先執行適用的 changed audit，確認沒有把既有問題誤當成基線。
4. 若規範或範例衝突，先停止該類型修改並修正文規來源。

## 修改中

- 只修改使用者指定或為完成 DoD 必要的檔案。
- 不得順手全域替換色彩、spacing、字體、radius 或元件 class。
- 共用 token、共用元件與入口檔案的變更，必須列出受影響模組並同步驗證。
- 不得以修改 audit baseline、放寬規則或刪除既有問題來讓檢查通過。

## 修改後

- 文件範例、實際程式與 audit 必須一致。
- CSS/UI：跑 UI style audit、system health changed audit，必要時用瀏覽器驗收。
- JS CRUD/狀態/DataSync：跑 JS syntax 與 DataSync audit。
- 配置模組：前後跑 `validate-config-modules.js`。
- 修改 migration：確認可重複執行並同步 `$migrationChecks`，再跑 schema sync。
- 修改 `index.php`、`index.html` 或側邊欄：確認雙入口與權限映射。

## 回報格式

至少回報：

- 已完成且可運作的結果
- 實際修改範圍
- 驗證命令與結果
- 是否新增 token、inline style 或固定值例外
- 尚未完成與建議後續項目
