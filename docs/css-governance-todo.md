# CSS 統一治理待辦

更新日期：2026-07-19

## 目標

逐步整理現有 CSS，建立一致的 token、共用元件 class 與模組例外規則，降低重複樣式、固定值與 legacy class 造成的維護成本。

本工作採分階段、小範圍、可驗證方式進行，不進行未經審查的全域機械替換。

## 工作原則

- `styles.css :root` 是 UI token 的唯一來源。
- 共用元件優先使用正式 token 與共用 class。
- 新程式碼不得新增第二套同義 token 或 Modal、表格、表單、按鈕 class。
- 舊 class 先保留相容，確認無使用後再移除。
- 只修改本輪指定或完成 DoD 必要的檔案。
- 每個階段完成後更新本文件、工作計畫與驗證結果。
- 不修改 audit baseline 來掩蓋既有問題。

## 待辦進度

- [x] 盤點 CSS token、Modal class、表格/表單/按鈕共用規則與 audit 基線
- [x] 確認正式 token 與共用元件命名規則
- [x] 列出 Modal legacy class 與相容策略
- [x] 統一 Modal 尺寸與 Renderer/config 產生方式
- [x] 分批遷移並淘汰非標準 Modal class
- [x] 統一表格共用 token/class，完成第一批共用色彩 token 收斂
- [x] 統一表單標題、輸入控制項與間距規則，完成第一批共用色彩 token 收斂
- [x] 統一按鈕與表格操作按鈕規則，完成第一批一般按鈕 token 收斂
- [x] 分批處理 hardcoded spacing/radius 與 token candidate，完成本輪共用元件第一輪收斂
- [x] 執行模組遷移後的完整驗證，本輪未新增模組遷移阻擋
- [x] 整理未完成項目與後續建議，保留 751 項人工審查 backlog
- [x] 規劃五段使用者字體大小與基本設定收納架構
- [x] 建立「系統設定 → 基本設定 → 字體調整」側欄 Tab 入口
- [x] 接入極小、小、標準、大、極大五段字體 token 與即時預覽
- [x] 增加隨字體大小變化的範例表格預覽
- [x] 加入瀏覽器保存、啟動前套用與跨分頁同步
- [x] 完成權限 migration、schema sync、靜態審計與自動回歸測試
- [ ] 實際瀏覽器逐段切換與版面驗收（目前應用程式內無可用瀏覽器頁籤）

## 目前盤點基線

- `styles.css`：約 11,859 行
- system health changed audit：新增 0、阻擋 0
- 既有 hardcoded spacing/radius：786
- 需要審查的 token candidates：378
- 正式 Modal 尺寸：`small`、`medium`、`large`、`xlarge`
- Modal 預設尺寸：`xlarge`，寬度 `min(1800px, 95%)`
- Modal 最大高度：`80vh`
- 舊版相容 class：`.modal-window-large` 已無正式程式碼使用，CSS 相容規則已移除

## Modal 統一規則

正式使用：

```html
<div class="modal-window small">
<div class="modal-window medium">
<div class="modal-window large">
<div class="modal-window xlarge">
```

配置模式使用：

```javascript
modal: {
    size: 'medium'
}
```

禁止新使用：

```html
<div class="modal-window-large">
```

`.modal-window-large` 已不再提供 CSS 實作；規範與檢查器仍保留對該錯誤格式的辨識，避免新程式碼重新使用。

## 本輪已存在的修改

- `styles.css`：表格、表單控制項與輸入標題的 compact density 調整。
- `core/configs/companies.config.js`：公司 Modal 尺寸調整為 `medium`。

以上修改屬於本輪既有工作，不得被後續整理覆蓋或回復。

## 驗證要求

依修改範圍執行：

- `git diff --check`
- `node tools/audit-system-health.js --changed --base origin/main`
- `node tools/validate-config-modules.js`
- DataSync 相關修改時執行 DataSync syntax 與 audit
- Modal、入口或模組遷移時進行實際畫面驗收

## 更新紀錄

### 2026-07-19（基本設定與字體調整）

- 新增「基本設定」側邊欄模組，主畫面沿用生產工單排程的左側 Tab 版面。
- 第一個設定 Tab 為「字體調整」，提供 85%、90%、100%、110%、120% 五段選項。
- 字體偏好只調整文字 token，圖示、控制項尺寸與列印版面維持原規格。
- 偏好保存在目前瀏覽器，頁面啟動時於主要 CSS 載入前套用，並支援跨分頁同步。
- 功能資料不進資料庫；新增 migration 僅用於 `basic_settings.read` 側邊欄模組權限治理。
- 權限 migration 已套用，schema sync 為 Applied 38／Pending 0；`basic_settings.read` 已授予 1 個既有系統參數管理角色。
- 自動驗證：JS/PHP syntax、配置驗證、audit tests、DataSync P0/P1/P2=0、system health changed blocking=0、HTTP 靜態資產 200 均通過。
- 待完成：目前應用程式內無可用瀏覽器頁籤，需在頁籤可用後補做五段切換、重新載入保存與 768px 響應式畫面驗收。

### 2026-07-19（字體調整範例表格）

- 在「目前套用」下方新增範例表格，展示序號、訂單編號、客戶名稱、預計交期、狀態與金額。
- 範例表格使用正式 `data-table compact ui-compact-table` class，會跟著目前字體 preset 即時變化。
- 已補強字體偏好回歸測試，確認預覽表格契約存在；system health changed audit 維持新增 0、阻擋 0。

### 2026-07-19

- 建立本待辦文件。
- 完成 CSS、Modal、token 與 audit 初步盤點。
- 確認正式 Modal 尺寸與 `.modal-window-large` 相容策略。
- 建立分階段治理工作計畫。

### 2026-07-19（第一批 Modal）

- 確認正式程式碼沒有使用 `.modal-window-large`。
- 移除 `styles.css` 中未再使用的 `.modal-window-large` 相容 CSS。
- 保留 `module_structure_checker.js` 對 legacy class 的阻擋檢查。
- 驗證：配置模組通過、system health 新增 0/阻擋 0、`git diff --check` 通過。

## 閉環判定與剩餘 backlog

本輪共用 CSS 收斂閉環條件：

- [x] Modal 只使用標準尺寸，legacy Modal CSS 已移除。
- [x] 表格、表單、按鈕、badge/tag 共用規則已接入正式 token。
- [x] 無使用的 legacy button CSS 已移除，檢查器仍阻止新使用。
- [x] UI style audit 報告已重新產生並與目前 CSS 同步。
- [x] 配置驗證、JavaScript syntax、system health 與 diff check 通過。

剩餘 751 項 hardcoded spacing/radius 不作一次性全域替換，分類如下：

- 高風險或固定版面：登入、列印、QR、圖片、Canvas、第三方相容與特殊流程版面，保留人工審查。
- 模組特例：客戶/供應商附件、工單工作區、報表與搜尋元件，需依畫面逐項驗收。
- 可疑 token candidate：列入後續批次，必須先確認所有使用者與視覺影響。

這些 backlog 不阻擋本輪共用元件治理閉環，但不得在後續新增同類 hardcoded 規則。

### 2026-07-19（第七批 badge/tag token）

- `status-badge`、`source-tag`、篩選 chip 與按鈕選取數量 badge 改用既有 badge padding/radius token。
- 篩選摘要間距改用 `--ui-section-gap`。
- 保留所有狀態顏色、文字與操作行為不變。
- audit 基線改善：hardcoded spacing/radius 769 → 759；token candidates 394 → 387；needs review 375 → 372。
- 驗證：配置模組通過、system health 新增 0/阻擋 0、`git diff --check` 通過。

### 2026-07-19（第六批共用操作間距）

- `.table-actions` 間距改用 `--ui-section-gap`。
- 表格操作按鈕圓角改用 `--ui-radius-control`，保留 30px 可點擊尺寸。
- 重新產生 `docs/ui-style-audit.md`，同步目前 CSS 實際 audit 結果。
- audit 基線改善：hardcoded spacing/radius 771 → 769；token candidates 396 → 394；needs review 維持 375。
- 驗證：配置模組通過、system health 新增 0/阻擋 0、`git diff --check` 通過。

### 2026-07-19（第四批 legacy 列印按鈕）

- 確認工單正式 HTML 使用標準 `btn text op-action-btn op-role-print`。
- 移除 `work_orders.js` 對已棄用 `btn-print-new/done` 的狀態切換。
- 移除 `styles.css` 中未再使用的 `btn-print-new/done` CSS。
- audit 基線改善：hardcoded spacing/radius 783 → 777；token candidates 406 → 400。
- 驗證：`node --check js/work_orders.js`、配置模組通過、system health 新增 0/阻擋 0、`git diff --check` 通過。

### 2026-07-19（第五批 legacy icon button）

- 確認正式程式碼沒有使用 `.icon-btn` 或 `.btn-icon`。
- 移除兩組 legacy icon button CSS。
- 保留配置驗證器對 `.btn-icon` 的禁止新使用檢查，以及 `script.js` 的防禦性 class 清除。
- audit 基線改善：hardcoded spacing/radius 777 → 771；token candidates 400 → 396；needs review 377 → 375。
- 驗證：配置模組通過、system health 新增 0/阻擋 0、`git diff --check` 通過。

### 2026-07-19（第三批按鈕共用 token）

- 一般 `.btn` 改用共用控制項高度、padding、gap 與圓角 token。
- `.btn.outline` 與 `.btn.ghost` 改用正式品牌、背景與圓角規則。
- 表格操作按鈕保留 30px 可點擊範圍與既有 action 語意色。
- audit 基線改善：hardcoded spacing/radius 786 → 783；token candidates 408 → 406；needs review 378 → 377。
- 驗證：配置模組通過、system health 新增 0/阻擋 0、`git diff --check` 通過。

### 2026-07-19（第二批共用 token）

- 共用資料表表頭文字、斑馬紋與 hover 改用既有色彩 token。
- 共用表單標籤、輸入框、Modal 表單控制項與 ghost 按鈕邊框改用既有色彩 token。
- 未修改模組專用版面與按鈕語意色，保留後續分批審查範圍。
- 驗證：配置模組通過、system health 新增 0/阻擋 0、`git diff --check` 通過。

### 2026-07-19（第八批操作連結與欄位選擇器）

- `.link` 操作連結改用 control padding、control height 與 control radius token。
- 欄位選擇器與關閉按鈕改用 panel/control radius 與 control height token。
- 保留附件預覽的 36px 專用尺寸，避免破壞檔案操作可用性。
- audit 基線改善：hardcoded spacing/radius 759 → 751；token candidates 387 → 380；needs review 372 → 371。
- 驗證：配置模組通過、`node --check js/work_orders.js`、system health 新增 0/阻擋 0、`git diff --check` 通過。

### 2026-07-19（閉環驗證）

- `node tools/test-audit-system.js` 通過。
- DataSync 相關 JavaScript syntax 通過。
- 配置模組驗證通過。
- system health changed audit：新增 0、阻擋 0。
- UI style audit：hardcoded spacing/radius 751、token candidates 380、needs review 371。
- `git diff --check` 通過。
- 本輪共用 CSS 治理閉環完成；剩餘項目保留於 backlog，後續需按模組與畫面人工驗收。
