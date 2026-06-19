# 系統健康審計改善計畫

日期：2026-06-19

## 執行進度

| 階段 | 狀態 | 完成內容 |
|---|---|---|
| 第一階段：建立可信基礎 | 已完成 | 結構化 finding、severity、classification、confidence、fingerprint、JSON/Markdown 輸出 |
| 第二階段：基準線與退化阻擋 | 已完成 | `audit-baseline.json`、changed audit、Git 變更範圍、新增／既有／已解決／阻擋比較 |
| 第三階段：拆分規則與測試 | 已完成 | 已拆分 `F-1`、`J-2`、`M-1`，建立 core/rules/adapters/tests，DataSync 改由專項工具提供唯一結果 |
| 第四階段：降低誤判 | 已完成 | J-2 加入檔案級已審查安全來源與穩定 identity；修正真實 XSS 後 J-2 為 0 |
| 第五階段：技術債收斂 | 已完成治理 | 基準線由 62 項降至 17 項，全部為 P2；剩餘項目納入持續清理，不阻擋一般交付 |
| 第六階段：持續整合 | 已完成 | 新增統一測試入口與 GitHub Actions，PR 自動執行 changed audit |

## 最終結果

截至 2026-06-19 完成改善後：

- 完整審計：錯誤 0、警告 17、資訊 11，exit code 0。
- changed audit：new 0、blocking 0。
- DataSync：P0 0、P1 0、P2 10。
- J-2：由 29 個檔案級錯誤降為 0。
- 正式基準線：17 項，全部為 P2，P0/P1 均為 0。
- 剩餘 P2：
  - 13 個大型 JavaScript 模組。
  - 2 個 status board POST fallback。
  - 1 個 `order_items.html` inline style 群組。
  - 1 個雙重狀態欄位群組。

## 一、問題定義

目前 `tools/audit-system-health.js` 已累積約 1,320 行，涵蓋安全、API、前端、資料完整性、列印、設定模組、DataSync、流程防護與拆分工單等約 24 類規則。

改善前（2026-06-19）的完整審計結果為：

- 錯誤：35
- 警告：27
- 資訊：10

目前主要問題不是「規則不夠多」，而是：

1. 歷史問題與本次新增問題混在一起，導致審計長期固定失敗。
2. 審計失敗無法直接判斷是否由本次修改造成，紅燈逐漸失去阻擋力。
3. 單一檔案承擔過多領域，規則維護、測試與責任歸屬不清。
4. 部分規則依賴正規表示式，容易發生誤判或漏判。
5. 缺少穩定的機器可讀輸出、規則測試、基準線與退化比較。
6. `audit-system-health.js`、`audit-data-sync.js`、`validate-config-modules.js` 之間尚未形成清楚的分工與共同報告格式。

## 二、改善目標

審計系統應達成以下結果：

- 新增的錯誤或退化必須立即阻擋。
- 既有問題可被追蹤，但不應讓每次開發都收到無法行動的固定紅燈。
- 高風險安全與資料破壞問題不得被基準線豁免。
- 每項規則都有明確領域、嚴重度、檔案位置、穩定識別碼與修正方向。
- 既有問題數量只能下降，不可增加。
- 專項審計各司其職，不在總審計重複實作相同規則。
- 開發者能快速回答：「這次修改新增了什麼問題？」

## 三、治理原則

1. **不以停用規則換取通過**
   - 規則若有誤判，應改善偵測方式或標示信心等級，不直接刪除。

2. **基準線只記錄已確認的歷史債務**
   - 不可將目前所有結果直接自動接受為基準線。
   - 基準線更新必須使用明確命令並經人工審查。

3. **高風險規則永遠阻擋**
   - 硬編碼帳密、權限停用、API 驗證缺失、可能造成資料破壞的流程漏洞，不得被基準線忽略。

4. **修改到哪裡，品質就改善到哪裡**
   - 修改檔案若原本已有相關錯誤，至少不可增加；高風險問題應在同次修改中處理。

5. **總審計負責編排，專項工具負責深度**
   - DataSync 由 `audit-data-sync.js` 負責。
   - 配置型模組由 `validate-config-modules.js` 負責。
   - 總審計只整合結果，不複製專項規則。

## 四、目標架構

建議逐步拆分為：

```text
tools/
  audit-system-health.js        # 相容入口與總編排
  audit/
    core/
      finding.js                # 統一結果格式
      baseline.js               # 基準線讀寫與比對
      git-scope.js              # 變更檔案範圍
      reporter.js               # 終端、JSON、Markdown 報告
      runner.js                 # 規則執行與統計
    rules/
      security.js
      api.js
      frontend.js
      architecture.js
      data-integrity.js
      workflow.js
    adapters/
      data-sync.js
      config-modules.js
    tests/
      fixtures/
```

每筆發現統一包含：

```js
{
  ruleId,
  severity,
  domain,
  file,
  line,
  message,
  remediation,
  confidence,
  fingerprint,
  baselineAllowed
}
```

`fingerprint` 應由規則、檔案與穩定程式特徵產生，不可只依賴容易變動的行號。

## 五、分階段執行

### 第一階段：建立可信基礎

工作項目：

- 將現有字串型錯誤改為結構化 finding。
- 保留目前終端輸出，避免既有操作流程中斷。
- 新增 JSON 與 Markdown 輸出能力。
- 為每項結果建立穩定 fingerprint。
- 將目前 35 項錯誤逐項分類為：
  - 真實缺陷
  - 規範型技術債
  - 誤判
  - 需人工確認
- 定義不可基準化的高風險規則。

完成標準：

- 新舊版本掃描範圍與結果數量可核對。
- 每筆結果都能定位到規則與檔案。
- 尚未核准基準線前，原有命令行為保持不變。

### 第二階段：導入基準線與退化阻擋

工作項目：

- 建立經人工確認的 `tools/audit-baseline.json`。
- 比對結果分為：
  - `new`：本次新增
  - `existing`：已知歷史問題
  - `resolved`：本次消除
  - `regressed`：同類問題增加或惡化
- 新增 Git 變更範圍模式，支援工作樹、暫存區及指定基準分支。
- 阻擋條件改為：
  - 所有新增 P0 問題
  - 所有新增或惡化 P1 問題
  - 不可基準化規則的任何命中
  - 歷史問題總數增加

預定命令：

```powershell
node tools/audit-system-health.js --changed --base origin/main
node tools/audit-system-health.js --full
node tools/audit-system-health.js --full --format json
node tools/audit-system-health.js --full --write docs/system-health-audit.md
node tools/audit-system-health.js --update-baseline --confirm-reviewed-baseline
```

完成標準：

- 日常審計能清楚指出本次修改新增的問題。
- 未新增退化時可通過，不再因固定歷史債務永久失敗。
- 基準線更新不能由一般審計流程自動執行。

### 第三階段：拆分規則與建立測試

工作項目：

- 將單一檔案依領域拆成規則模組。
- 每個規則至少建立一個應通過與一個應失敗的 fixture。
- 為 baseline、fingerprint、Git 範圍及報告器建立單元測試。
- 將 DataSync 與配置模組驗證以 adapter 整合。
- 保留 `node tools/audit-system-health.js` 作為穩定入口。

完成標準：

- 新增規則不需要修改大型中央函式。
- 每項規則可獨立測試。
- 專項工具與總審計不重複維護相同邏輯。

### 第四階段：降低誤判與提升精度

優先改善：

1. `J-2 innerHTML XSS`
   - 區分靜態可信 HTML、已消毒內容與未處理動態輸入。
   - 逐步以 JavaScript AST 分析取代純正規表示式。

2. `M-1 HTML style`
   - 區分標準共用元件與真正不合規的自訂按鈕。
   - 將按鈕、圖示與顏色一致性集中交由配置模組驗證。

3. `DS-1 DataSync`
   - 以 `audit-data-sync.js` 的 P0/P1/P2 結果為唯一專項來源。

4. PHP 與 API 規則
   - 優先使用 tokenizer 或結構化掃描，降低字串比對誤差。

完成標準：

- 每項誤判都有測試案例，避免修正後再次復發。
- 規則輸出包含 `confidence`，低信心結果不與確定缺陷混為一談。

### 第五階段：清理既有技術債

建議優先順序：

- P0：帳密、權限、API 驗證、資料破壞與流程防護。
- P1：真實 XSS、資料同步錯誤、UI 結構規範與狀態判斷錯誤。
- P2：大型檔案、舊式 API fallback、雙狀態欄位與架構整理。

執行方式：

- 每輪選定一個規則群組，不混合大範圍功能改造。
- 修正前後都執行完整審計及相關專項審計。
- 每次合併後重新產生報告，但基準線只移除已解決項目。
- 禁止以修改 fingerprint 或放寬規則方式掩蓋未解問題。

### 第六階段：納入持續整合與規範

工作項目：

- Pull Request 執行 changed audit。
- 排程或發布前執行 full audit。
- 保存 JSON 或 Markdown 報告作為趨勢依據。
- 在 `.github/copilot-instructions.md` 定義：
  - 何時跑 changed audit
  - 何時跑 full audit
  - 基準線更新權限與審查要求
  - 專項審計觸發條件

完成標準：

- Pull Request 不可新增 P0/P1 問題。
- 完整審計報告能呈現新增、既有、已解決與惡化趨勢。
- 基準線問題數量只能持平或下降。

## 六、嚴重度與阻擋策略

| 等級 | 定義 | 日常變更 | 完整審計 |
|---|---|---|---|
| P0 | 安全、權限、資料破壞、重大流程漏洞 | 永遠阻擋 | 永遠阻擋 |
| P1 | 明確功能錯誤、XSS、同步錯誤、重要規範退化 | 新增或惡化即阻擋 | 顯示並追蹤 |
| P2 | 架構債、維護性、低風險一致性問題 | 警告，不可增加 | 納入清理排程 |
| Info | 建議與觀察 | 不阻擋 | 保留趨勢 |

## 七、驗收指標

- 改善前所有 35 項錯誤完成分類，沒有未歸屬結果。
- 所有 P0 規則明確標示為不可基準化。
- 已拆分的 core、frontend 與 DataSync adapter 具備自動測試案例。
- 新增問題與歷史問題可被可靠區分。
- 修改檔案不會增加同類歷史問題。
- 總審計與專項工具沒有重複規則來源。
- 審計通過代表「本次變更沒有新增不可接受風險」，而不是單純沒有執行到問題。

## 八、建議實施順序

1. 先完成 finding 格式、JSON 輸出與 fingerprint。
2. 人工盤點並核准目前結果，建立初始基準線。
3. 實作 changed audit 與退化阻擋。
4. 再拆分規則檔案並補齊測試。
5. 優先改善 `J-2`、`M-1`、`DS-1` 的誤判與責任重疊。
6. 分批清除現有技術債。
7. 最後導入 Pull Request 與排程審計。

此順序可先恢復審計的可信度，再進行架構整理；避免先投入大量重構，期間仍無法可靠阻擋新問題。
