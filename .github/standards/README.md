# MES 開發規範治理

本目錄是 MES 程式風格、UI/UX 與前端契約的唯一正式規範來源。

## 規範優先順序

發現規範、文件範例與既有程式碼不一致時，依下列順序處理，不得自行選擇一套：

1. 實際執行契約：`styles.css` 的 `:root` token、共用元件、審計工具與測試。
2. `.github/standards/*.md` 的正式規範。
3. `.github/instructions/*.instructions.md` 的檔案類型入口與短版檢查表。
4. `.github/skills/*.md` 的相容參考文件。
5. `copilot-instructions.md` 的流程與業務背景說明。

若同一層文件互相衝突，必須停止相關修改、指出衝突並以正式規範修正；不得自行創造第二套 token、元件或命名。

## 正式文件

| 文件 | 適用範圍 |
|---|---|
| `ui-tokens.md` | 色彩、字體、spacing、radius、密度與例外 |
| `ui-components.md` | 按鈕、Modal、表格、表單、Icon、HTML 結構 |
| `frontend-contracts.md` | JavaScript 模組、CRUD、DataSync、XSS 與配置模組 |
| `change-governance.md` | 修改前後流程、範圍控制與驗證要求 |

## 現行程式碼的相容原則

- `styles.css` 的 token 名稱與值是既有 UI 的基準；新 CSS 必須引用 token。
- 既有畫面尚未完全收斂的樣式不代表可以複製；新增功能必須使用正式 token 與共用 class。
- 若需要變更共用 token，必須先評估所有使用者與模組，並在同一輪完成驗證與回報。
