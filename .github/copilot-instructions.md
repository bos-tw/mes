# MES 系統開發指引

這是給 GitHub Copilot 和其他 AI 助手的開發指引，請在進行相關開發時遵循。

---

## 🎯 開發節奏與完成定義（2026-05-10 新增，強制遵循）

### 核心原則

1. 每一輪工作都必須交付「可正常運作」的功能或修復結果，不可只停留在優化建議。
2. 新功能開發與既有問題修復要並行推進，避免長時間只投入單一功能加強而影響整體進度。
3. 若發現可改善項目，**必須提出建議**；但除非屬於阻斷性風險，否則不應阻止當前目標功能交付。
4. 若判斷某項順手修正可顯著提升穩定性、可維護性或可用性，應在同一輪一併完成。

### 執行要求

1. 開始實作前先確認本輪「主目標功能」與「最低可交付結果（DoD）」。
2. 開發過程中若遇到延伸優化，分為：
   - `必做`：不修會導致功能不可用、資料錯誤、安全風險。
   - `建議`：可提升品質但不影響本輪功能可用性。
3. 本輪至少要完成主目標的可用交付；`建議` 項目可順手完成或列入下一輪。
4. 回報時需明確區分：
   - 已完成且可運作
   - 已順手改善
   - 建議後續處理

---

## 🚨 開始工作前必讀（2026-02-04 新增，2026-03-01 更新）

### ⚡ 自動化驗證工具（強制執行）

系統共有兩個驗證工具，依工作類型選擇執行：

---

#### 工具 1：配置化模組驗證（修改配置模組時必跑）

```bash
# 開始修改前，先執行驗證
node tools/validate-config-modules.js

# 修改後，再次執行驗證
node tools/validate-config-modules.js
```

##### 驗證工具 1 檢查項目

1. ✅ 配置檔必須有 `hiddenFields: ['id']`
2. ✅ 禁止不安全的 `querySelector().value =` 賦值
3. ✅ JS 必須有防禦性函數（setFieldValue）
4. ✅ 混合模式必須有對應的 HTML 檔案
5. ✅ Modal 尺寸必須使用標準值
6. ✅ 表格操作按鈕必須使用標準樣式

---

#### 工具 2：系統健康度審計（新增或修改功能模組時必跑）

**所有 AI Agent 在新增或修改功能模組（API、前端 JS、HTML、列印範本）前後，必須執行審計工具：**

```bash
# 開始修改前，先執行審計
node tools/audit-system-health.js

# 修改後，再次執行審計（確認未引入新問題）
node tools/audit-system-health.js

# 顯示詳細修復建議
node tools/audit-system-health.js --fix-hints
```

**如果審計出現 ❌ 錯誤，必須修復後才能繼續！⚠️ 警告應盡快處理。**

##### 工具 2 審計涵蓋範圍

| 代號 | 類別 | 說明 |
|------|------|------|
| S-1 | 安全性 | 資料庫憑證硬編碼 |
| S-2 | 安全性 | 權限系統是否被停用 |
| S-3 | 安全性 | 角色/員工角色 API 檔案是否存在 |
| S-5 | 安全性 | 列印範本 fetch() 是否攜帶 Cookie |
| S-6 | 安全性 | 登入狀態硬編碼字串比對 |
| A-1 | 架構 | report_descriptions 模組命名一致性 |
| A-2 | 架構 | 各模組是否缺少 delete 端點 |
| A-3 | 架構 | HTTP 方法偽裝（POST fallback） |
| F-1 | 前端 | JS 檔案是否過大（>2000 行） |
| F-2 | 前端 | 列印範本 CSRF Token 取得機制 |
| F-3 | 前端 | JS 模組 console.log 殘留（分頁切換前應移除） |
| J-1 | 前端 | JS 模組結構規範（'use strict'、IIFE、data-initialised 防重複） |
| J-2 | 安全性 | JS innerHTML XSS 風險（使用者資料插入前必須呼叫 escapeHtml()） |
| D-3 | 資料完整性 | 雙重狀態欄位 |
| D-6 | 資料完整性 | order_items 軟刪除機制 |
| STRUCT | 架構 | API 模組標準檔案結構 |
| DB | 資料庫 | 需手動驗證的資料庫項目提示 |
| INDEX | 架構 | index.html 是否載入所有配置檔 |
| C-1 | 架構 | core/ 腳本載入順序（module-config → module-renderer → *.config） |
| C-2 | 架構 | core/configs 配置格式規範（hiddenFields、icon 格式、舊格式） |
| E-1 | 安全性/架構 | export.php 完整性（fetch credentials、檔案存在、requireAuth、requireMethod、declare strict_types） |
| H-1 | 架構 | help/ 目錄 JS 完整性（孤立檔案、選取器不符） |
| M-1 | 前端 | modules/*.html 樣式規範（btn 前綴、Bootstrap 類別、inline style） |

---

#### 完整驗證流程（推薦）

```bash
# 一次執行兩個工具
node tools/validate-config-modules.js && node tools/audit-system-health.js
```

**如果任何驗證失敗，必須修復後才能繼續！**

---

## 📦 更新安裝包打包規範（2026-05-09 新增）

### 適用範圍

- 使用 `tools/build-update-package.ps1` 產生 `dist/update_*.zip` 並透過「安全設定 > 系統更新」上傳套用。

### 打包前必做

1. 進入專案根目錄 `C:\Apache24\htdocs\mes`。
2. 建立或更新 release note 檔案（放在 `release-notes/`）。
3. release note 內容 **固定只保留最新三筆**（每行一筆）。
4. 執行審計工具（`node tools/audit-system-health.js`）並記錄結果。
5. 若有變更 PHP API，至少執行 `php -l` 做語法檢查。

### 打包命令規範（強制）

#### 規範 1：不可只傳部分參數

- `build-update-package.ps1` 的必要參數必須一次給齊：
  - `-VersionNumber`
  - `-FileVersion`
  - `-ReleaseDate`
  - `-ChangeSummaryFile`
  - `-Files`

#### 規範 2：避免參數拆行失敗

- 禁止先執行 `-VersionNumber` 再於下一行補 `-FileVersion`。
- 建議使用 splatting（`@params`）一次呼叫，避免 PowerShell 將後續參數當成新命令。

#### 標準指令模板（推薦）

```powershell
Set-Location "C:\Apache24\htdocs\mes"

if (!(Test-Path "release-notes")) { New-Item -ItemType Directory -Path "release-notes" | Out-Null }

@(
"1. 調整項目一。"
"2. 調整項目二。"
"3. 調整項目三。"
) | Set-Content -Path "release-notes\YYYY-MM-DD-vX.Y.Z.txt" -Encoding UTF8

$params = @{
    VersionNumber     = "vX.Y.Z"
    FileVersion       = "vX.Y.Z"
    ReleaseDate       = "YYYY-MM-DD"
    ChangeSummaryFile = "release-notes/YYYY-MM-DD-vX.Y.Z.txt"
    Files             = @(
        "js/example.js",
        "api/example.php"
    )
    Migrations        = @(
        "migrations/2026_xx_xx_example.sql"
    )
    OutputDir         = "dist"
}

& ".\tools\build-update-package.ps1" @params
```

#### 檔案清單規則

- `-Files` 僅放「本次實際變更檔案」，禁止把無關檔案打包進去。
- `-Migrations` 只有在本次有 DB migration 時才填；沒有 migration 時可傳空陣列 `@()`。

### 打包後驗證

1. 確認 `dist/` 有新 ZIP。
2. 以 `Get-ChildItem .\dist\update_vX.Y.Z_*.zip` 檢查最新檔案時間。
3. 更新後在「關於系統」確認版本更新內容正常顯示。

### 更新包輸出位置規範（2026-05-12 新增，強制）

1. 所有提供給「系統一鍵更新」使用的更新包，**必須輸出在 `dist/`**。
2. 檔名必須沿用既有慣例：`dist/update_vX.Y.Z_YYYYMMDD_HHMMSS.zip`。
3. `updates/` 僅可作為工作暫存或中間產物，**不得作為最終交付路徑**。
4. AI 助手在回報更新包時，必須優先提供 `dist/...zip` 路徑。

### 打包工具與格式規範（2026-05-12 新增，強制）

1. **禁止手動壓縮**（`Compress-Archive`、7-Zip、手動拖拉壓縮）作為一鍵更新最終交付包。
2. 一鍵更新包**必須**使用 `tools/build-update-package.ps1` 產生，因系統更新器要求 ZIP 根目錄含 `manifest.json`。
3. 若缺少 `manifest.json`，系統會出現：`上傳失敗：更新包缺少 manifest.json。`。
4. AI 助手若先做臨時包測試，最終仍必須重跑官方打包腳本並回報 `dist/update_*.zip`。

#### 標準打包方法（強制）

```powershell
Set-Location "C:\Apache24\htdocs\mes"

$params = @{
    VersionNumber     = "vX.Y.Z"
    FileVersion       = "vX.Y.Z"
    ReleaseDate       = "YYYY-MM-DD"
    ChangeSummaryFile = "release-notes/YYYY-MM-DD-vX.Y.Z.txt"
    Files             = @(
        "js/example.js",
        "api/example.php"
    )
    Migrations        = @()
    OutputDir         = "dist"
}

& ".\tools\build-update-package.ps1" @params
```

#### 上傳前格式自檢（強制）

```powershell
# 1) 確認 ZIP 內有 manifest.json 與 files/ 目錄
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = "dist/update_vX.Y.Z_YYYYMMDD_HHMMSS.zip"
[System.IO.Compression.ZipFile]::OpenRead($zip).Entries | Select-Object -ExpandProperty FullName

# 2) 可選：解壓後檢查 manifest.json 內容欄位
# version_number / file_version / release_date / files_root / migrations
```

### 版本更新內容顯示規範（強制）

- 系統端僅顯示最新三筆更新紀錄。
- 前端與 API 的限制值必須一致（避免 UI 與資料回傳筆數不一致）。

### 本次已驗證範例（v1.0.3）

- 版本號：`v1.0.3`
- 打包輸出：`dist/update_v1.0.3_*.zip`
- release note：`release-notes/2026-05-09-v1.0.3.txt`（三筆）

### Git 一鍵更新起點（2026-05-11，強制參考）

- 本專案「一鍵更新功能」Git 基線如下：
  - 分支：`main`
  - 基線 commit：`1ce804a`（`chore: initialize git baseline for one-click update workflow`）
  - 基線 tag：`update-base-2026-05-11`
- 後續 AI/開發者在整理更新包檔案清單時，必須先比對：
  - `git diff --name-only update-base-2026-05-11..HEAD`
- 打包與覆蓋時必須避開以下路徑（避免覆蓋使用者資料與環境相依內容）：
  - `uploads/**`, `export/**`, `backup/**`, `db_backups/**`, `db_exports/**`, `old/**`, `vendor/**`

#### 強制規則範例

❌ **錯誤範例：**
```javascript
// 配置檔缺少 hiddenFields
modal: {
    title: '新增資料',
    sections: [...]  // ❌ 缺少 hiddenFields
}

// JS 使用不安全賦值
form.querySelector('[name="id"]').value = data.id;  // ❌ 沒有 null 檢查
```

✅ **正確範例：**
```javascript
// 配置檔必須有 hiddenFields
modal: {
    title: '新增資料',
    hiddenFields: ['id'],  // ✅ 必須加入
    sections: [...]
}

// JS 使用防禦性函數
function setFieldValue(name, value) {
    const field = form.querySelector(`[name="${name}"]`);
    if (field) {
        field.value = value || '';
    } else {
        console.warn(`模組: 欄位不存在 - ${name}`);
    }
}
setFieldValue('id', data.id);  // ✅ 安全
```

---

## 🏗️ core/ 模組渲染系統規範（2026-02-05 更新）

### 架構概覽

| 檔案 | 職責 |
|------|------|
| `core/module-config.js` | 配置註冊中心，提供 `window.ModuleConfig.register/get/has/getAll` |
| `core/module-renderer.js` | HTML 渲染引擎，提供 `window.ModuleRenderer.render/renderTo/renderPart` |
| `core/configs/*.config.js` | 各模組的靜態配置，呼叫 `ModuleConfig.register(id, config)` |

### ⚠️ index.html 腳本載入順序（強制要求）

核心腳本**必須**依此順序載入，否則初始化失敗：

```html
<!-- 1. 配置中心（最先） -->
<script src="core/module-config.js"></script>
<!-- 2. 渲染引擎（需要 ModuleConfig） -->
<script src="core/module-renderer.js"></script>
<!-- 3. 各模組配置（需要兩者皆就緒） -->
<script src="core/configs/companies.config.js"></script>
<script src="core/configs/customers.config.js"></script>
<!-- ... 其他 config 檔案 -->
```

違反此順序 → **`ModuleConfig is not defined`** 錯誤。已由 `audit-system-health.js [C-1]` 自動檢查。

### 三種模組模式區別

| 模式 | config 特徵 | modal 渲染方式 |
|------|-------------|--------------|
| **標準模式** | `modal: { sections: [...] }` | Renderer 自動產生所有 HTML |
| **混合模式** | `requiresHtmlModal: true`, `modal: null` | 表格/篩選由 Renderer 產生，Modal 從 `modules/*.html` 載入 |
| **無 Modal 模式** | `modal: null`（無 `requiresHtmlModal`） | 唯讀列表，無新增/編輯功能 |

**修改配置前必須先確認是哪種模式！**

### core/configs 配置欄位規範

#### actions[] 按鈕（標題區）

```javascript
actions: [
    {
        action: 'create',      // ✅ 用 action（不是 dataAction）
        label: '新增',
        icon: 'fa-plus',       // ✅ 不加 fas 前綴（renderer 自動补）
        style: 'primary',      // ✅ 用 style（不是 class）
        wrapLabel: true        // 可選：用 <span> 包住文字（響應式隱藏）
    }
]
```

| ❌ 舊格式（禁止） | ✅ 新格式 |
|-----------------|----------|
| `dataAction: 'create'` | `action: 'create'` |
| `icon: 'fas fa-plus'` | `icon: 'fa-plus'` |
| `class: 'btn primary'` | `style: 'primary'` |

### 列印尺寸與操作按鈕顏色規範（2026-05-05 新增）

#### 列印尺寸（強制）

- 所有列印輸出都必須明確設定紙張尺寸，預設一律為 A4：`@page { size: A4; margin: 12mm; }`
- JS 動態開啟的新列印視窗也必須在 `<style>` 內宣告 `@page`，不可只依賴瀏覽器預設值。
- 唯二例外：`print/shipping_order_print.html`（出貨單）與 `print/return_order_print.html`（退貨單）使用 A5 中一刀格式：`@page { size: A5 landscape; ... }`
- 使用 `window.print()` 列印目前系統畫面的模組，會套用 `styles.css` 的全域 A4 `@page`；若新增獨立列印範本，仍需在範本內自行宣告尺寸。

#### 操作欄按鈕顏色（強制）

操作欄小圖示按鈕使用 `.btn.text` 加 `data-action` 由 `styles.css` 統一控色，禁止在按鈕上寫 inline `style="background..."`。

| 用途 | data-action / class | 顏色 |
|------|---------------------|------|
| 檢視/明細/預覽 | `view`, `view-detail`, `view-details`, `detail`, `details`, `show`, `preview`, `preview-logo` | teal `#0f766e`，hover `#115e59` |
| 列印 | `print`, `print-detail`, `print-single`, `print-work-order`, `print-screening-report` | purple `#7c3aed`，hover `#6d28d9` |
| 編輯 | `edit`, `edit-from-detail`, `edit-order-item`, `edit-order-item-inline`, `edit-screening-item`, `edit-work-order`, `edit-draft` | blue `#2563eb`，hover `#1d4ed8` |
| 客戶批號/訂單細項入口 | `open-order-items` | 銘黃色 `#f59e0b`，hover `#d97706` |
| 複製 | `copy-order-item` | fuchsia `#c026d3`，hover `#a21caf` |
| 建工單/轉庫存 | `create-work-order`, `convert-to-inventory` | brown-orange `#b45309`，hover `#92400e` |
| 跳轉/前往關聯資料 | `goto-work-order`, `go-to-*` | slate `#475569`，hover `#334155` |
| 回覆/標記/一般輔助 | `reply`, `mark-read`, 其他未列明 `.btn.text` | neutral blue-gray `#64748b`，hover `#475569` |
| 刪除/危險操作 | `.btn.text.danger`, `delete-*` | red `#dc3545`，hover `#a71d2a` |
| 啟用/成功 | `.btn.text.success`, `add-to-shipping` | green `#28a745`，hover `#1e7e34` |
| 停用/警告 | `.btn.text.warning` | orange `#f97316`，hover `#ea580c` |
| 不可操作/已完成狀態 | `disabled`, `aria-disabled="true"` | gray `#6c757d` |

列印按鈕不得與檢視按鈕同色；客戶批號不得與建工單/轉庫存同色；複製不得與編輯同色。若新增操作欄按鈕，優先沿用既有 `data-action` 命名以自動套用顏色，並同步更新此表與 `styles.css`。

#### modal 配置規則

- 標準模式 (`modal: {}`) **必須**有 `hiddenFields: ['id']`，否則編輯時 id 無法傳遞
- `requiresHtmlModal: true` 的混合模式**不需要** `hiddenFields`（modal 由 HTML 控制）
- `modal: null` 的唯讀模式**不需要** `hiddenFields`

已由 `validate-config-modules.js [Rule 1]` 和 `audit-system-health.js [C-2]` 自動檢查。

#### formRows vs sections（渲染差異）

| 模式 | HTML 輸出 | 用途 |
|------|-----------|------|
| `modal.sections` (標準) | `<section class="form-section">` | 頂層表單區塊 |
| `modal.formRows[].sections` | `<div class="form-section">` | 並排 row 內的子區塊 |
| `modal.formRows` + `modal.sections` | 混合 | formRows 後接非並排的 sections（用 div） |

這是刻意的設計：formRows 的子 sections 用 `<div>`，而頂層 sections 用語義化 `<section>` 標籤。

---

## ⚠️ 配置化系統重要提醒（2026-02-04 更新）

### 修改模組前必須檢查

**所有模組修改前，請先確認是否已配置化**：

1. **檢查配置檔是否存在**
   ```bash
   ls core/configs/{模組名稱}.config.js
   # 如果存在 → 已配置化，請修改配置檔
   # 如果不存在 → 未配置化，修改 modules/{模組名稱}.html
   ```

2. **已配置化的模組（41 個）**
   - HTML 檔案已重新命名為 `.html.bak`（僅供參考，修改無效）
   - 所有內容由 `core/configs/*.config.js` 控制
   - 修改配置檔後重新整理瀏覽器即可生效

3. **傳統 HTML 模組（4 個）** — 直接修改 `modules/{模組名稱}.html`
   - `dashboard` - 結構太複雜，不適合配置化
   - `report_descriptions` - 特殊表單，未配置化
   - `work_order_first_piece_dimensions` - 內嵌於工單的子功能
   - `work_order_images` - 內嵌於工單的子功能

4. **混合模式模組（6 個）**
   - `work_orders`, `order_items`, `production_quality_records`, `inventory_items`, `inventory_transactions`, `audit_logs`
   - 頁面結構由配置檔控制
   - 複雜 Modal 仍使用 `.html.bak` 檔案

5. **快速查詢**
   - 查看 `modules/README.md` - 完整的模組索引與修改指引
   - 查看 `DEVELOPMENT.md` - 開發指引與範例
   - 查看 `core/configs/README.md` - 配置檔規範
   - 在瀏覽器 Console 執行 `ModuleConfig.has('模組名稱')` → `true` = 已配置化

### AI 助手務必遵循

1. **修改前必須檢查**：不要直接修改 HTML，先確認是否已配置化
2. **明確告知使用者**：如果模組已配置化，說明要修改配置檔
3. **提供正確路徑**：指引使用者到正確的檔案（配置檔或 HTML）
4. **參考文件**：遇到配置化相關問題，參考 `modules/README.md`

---

## 欄位設定功能 (Column Manager)

### 概述
系統使用 `api/common/column_manager.js` 提供表格欄位顯示/隱藏功能。
**此功能完全自動初始化，不需要在模組 JS 中寫任何初始化程式碼。**

### 如何為新頁面加入欄位設定功能

#### 步驟 1：在 column_manager.js 註冊模組

編輯 `api/common/column_manager.js`，在 `SUPPORTED_MODULES` 陣列中加入新模組名稱：

```javascript
const SUPPORTED_MODULES = [
    'customers',
    'suppliers',
    // ... 其他模組
    'your_new_module'  // <-- 加入這裡
];
```

同時在 `_getManagerKey` 方法的 `keyMap` 中加入對應的 key：

```javascript
const keyMap = {
    // ... 其他模組
    'your_new_module': 'yourNewModuleColumnManager'
};
```

#### 步驟 2：在模組 HTML 中加入必要的 data 屬性

```html
<!-- 模組根元素必須有 data-module 屬性 -->
<div data-module="your_new_module">

    <!-- 欄位設定按鈕 -->
    <button type="button" data-action="toggle-column-selector">
        <i class="fas fa-columns"></i> 欄位設定
    </button>

    <!-- 欄位選擇器面板 (注意: data 屬性中的底線要轉換為連字號) -->
    <div data-your-new-module-column-selector class="column-selector" style="display: none;">
        <div class="column-selector-header">
            <span>選擇顯示欄位</span>
            <button type="button" data-action="close-column-selector">×</button>
        </div>
        <div class="column-selector-body">
            <!-- 每個 checkbox 的 data-column 要對應表格 th 的 data-column -->
            <label><input type="checkbox" data-column="column1" checked> 欄位1</label>
            <label><input type="checkbox" data-column="column2" checked> 欄位2</label>
            <label><input type="checkbox" data-column="column3" checked> 欄位3</label>
        </div>
        <div class="column-selector-footer">
            <button type="button" data-action="select-all-columns">全選</button>
            <button type="button" data-action="deselect-all-columns">全不選</button>
            <button type="button" data-action="apply-column-settings">套用</button>
        </div>
    </div>

    <!-- 表格 (注意: data 屬性中的底線要轉換為連字號) -->
    <table data-your-new-module-table>
        <thead>
            <tr>
                <!-- 每個 th 必須有 data-column 屬性，對應 checkbox 的 data-column -->
                <th data-column="column1">欄位1</th>
                <th data-column="column2">欄位2</th>
                <th data-column="column3">欄位3</th>
            </tr>
        </thead>
        <tbody>
            <!-- 資料列的 td 順序必須與 th 對應 -->
        </tbody>
    </table>
</div>
```

#### 步驟 3：表格更新後重新套用可見性

如果模組 JS 中有動態更新表格內容（例如載入資料後 render），需要在更新後呼叫：

```javascript
// 取得管理器並重新套用欄位可見性
const manager = window.yourNewModuleColumnManager;
if (manager) {
    manager.onTableUpdated();
}

// 或使用新 API
const manager = ColumnManagerAutoInit.getManager('your_new_module');
if (manager) {
    manager.onTableUpdated();
}
```

### 重要注意事項

1. **命名規則**：
   - 模組名稱使用 snake_case：`order_items`
   - HTML data 屬性使用 kebab-case：`data-order-items-table`
   - Window 變數使用 camelCase：`orderItemColumnManager`

2. **不要在模組 JS 中手動初始化**：
   ```javascript
   // ❌ 不要這樣做
   if (typeof window.initXxxColumnManager === 'function') {
       window.initXxxColumnManager();
   }

   // ✅ 系統會自動初始化，只需在表格更新後呼叫 onTableUpdated()
   ```

3. **CSS 類別**：確保 `styles.css` 中有 `.hidden-column { display: none; }` 樣式

4. **localStorage**：設定會自動儲存在 `{模組名稱}_visible_columns` key 中

---

## Modal 對話框規範

### 概述
系統所有 Modal 對話框必須遵循統一的 HTML 結構和 CSS 類別命名，以確保視覺一致性。

### Modal 尺寸標準 (2026-02-01 制定)

**使用以下四種標準尺寸**（使用空格分開的複合類別格式）：

| 尺寸 | 類別 | 寬度 | 適用場景 |
|------|------|------|----------|
| 超大 | `modal-window` 或 `modal-window xlarge` | min(1800px, 95%) | 複雜表單、多欄位並排、含子表格 |
| 大 | `modal-window large` | min(1400px, 92%) | 中大型表單、詳情檢視、6-12 個欄位 |
| 中 | `modal-window medium` | min(800px, 90%) | 標準表單、5-10 個欄位 |
| 小 | `modal-window small` | min(500px, 90%) | 確認對話框、簡單輸入、1-4 個欄位 |

#### 選擇指南

1. **超大 (xlarge/預設)**：工單管理、訂單編輯等需要顯示大量資訊的複雜表單
2. **大 (large)**：出貨單、退貨單等中大型表單，欄位需要完整顯示
3. **中 (medium)**：標準 CRUD 表單，如客戶、供應商等基本資料維護
4. **小 (small)**：確認刪除、簡單輸入框等

#### 配置檔使用方式

```javascript
// 在 config.js 中設定
modal: {
    title: '新增資料',
    size: 'large',  // 可選值: 'xlarge', 'large', 'medium', 'small'，省略則為超大
    // ...
}
```

### ⚠️ 禁止使用的類別

```html
<!-- ❌ 不要使用連字號格式 -->
<div class="modal-window modal-window-large">
<div class="modal-window modal-window-medium">
<div class="modal-window modal-window-xlarge">

<!-- ✅ 正確的格式 -->
<div class="modal-window">
<div class="modal-window xlarge">
<div class="modal-window large">
<div class="modal-window medium">
<div class="modal-window small">
```

### 標準 Modal 結構

```html
<div class="modal-overlay hidden" data-{module}-modal>
    <div class="modal-window">
        <!-- 關閉按鈕 -->
        <button type="button" class="modal-close" data-action="close-modal" aria-label="關閉">
            <i class="fas fa-times"></i>
        </button>

        <!-- 標題 -->
        <h3 data-modal-title>新增資料</h3>

        <!-- Modal 內部錯誤訊息顯示區 -->
        <div class="modal-alert hidden" data-{module}-modal-alert role="alert"></div>

        <!-- 表單 -->
        <form data-{module}-form novalidate>
            <input type="hidden" name="id">

            <section class="form-section">
                <h4>區塊標題</h4>
                <div class="form-grid">
                    <label class="inline-label">
                        <span>欄位名稱 <abbr title="必填">*</abbr></span>
                        <input type="text" name="field_name" required placeholder="請輸入" autocomplete="off">
                    </label>
                    <!-- 更多欄位... -->
                </div>
            </section>

            <!-- 全寬欄位使用 full-width 類別 -->
            <section class="form-section">
                <h4>備註區</h4>
                <div class="form-grid">
                    <label class="inline-label full-width">
                        <span>備註</span>
                        <textarea name="notes" rows="3" placeholder="請輸入備註"></textarea>
                    </label>
                </div>
            </section>

            <!-- 表單按鈕放在 form 內 -->
            <div class="form-actions">
                <button type="button" class="outline" data-action="cancel">取消</button>
                <button type="submit" class="primary">儲存</button>
            </div>
        </form>
    </div>
</div>
```

### 詳情檢視 Modal（無表單）

```html
<div class="modal-overlay hidden" data-{module}-detail-modal>
    <div class="modal-window large">
        <button type="button" class="modal-close" data-action="close-detail-modal" aria-label="關閉">
            <i class="fas fa-times"></i>
        </button>
        <h3><i class="fas fa-info-circle"></i> 資料詳情</h3>

        <div class="detail-content" data-{module}-details>
            <!-- 詳情內容動態載入 -->
        </div>

        <div class="form-actions">
            <button type="button" class="outline" data-action="close-detail-modal">關閉</button>
            <button type="button" class="primary" data-action="edit-from-detail">編輯</button>
        </div>
    </div>
</div>
```

### 重要規則

1. **表單屬性**：
   - 必須加上 `novalidate` 屬性（由 JS 處理驗證）
   - 隱藏的 id 欄位用於區分新增/編輯模式

2. **標籤類別**：
   - 所有 `<label>` 使用 `class="inline-label"`
   - 全寬欄位額外加上 `full-width` 類別
   - **不要使用** inline style 如 `style="grid-column: 1 / -1;"`

3. **按鈕規則**：
   - 按鈕放在 `<form>` 內的 `<div class="form-actions">`
   - 取消按鈕：`class="outline"` + `type="button"`
   - 儲存按鈕：`class="primary"` + `type="submit"`
   - **不要使用** `btn` 前綴（如 `btn primary`）

4. **Alert 區域**：
   - 必須有 `role="alert"` 屬性
   - 使用 `data-{module}-modal-alert` 命名

5. **輸入欄位**：
   - 加上 `autocomplete="off"` 防止瀏覽器自動填入
   - 必填欄位使用 `<abbr title="必填">*</abbr>`

6. **區塊標題**：
   - 使用 `<section class="form-section">` 包裹
   - 標題使用 `<h4>` （不需要額外 class）

---

## 模組頁面結構規範

### 概述
所有模組 HTML 檔案（`modules/*.html`）必須遵循統一的結構，確保一致性和可維護性。

### 標準頁面結構

```html
<div data-module="module_name">
<!-- 內容標題區 - 不可使用 sticky -->
<div class="content-header with-actions">
    <div>
        <h2>模組標題</h2>
        <p class="subtitle">模組描述說明</p>
    </div>
    <div class="header-actions">
        <button type="button" class="btn primary" data-action="create">
            <i class="fas fa-plus"></i> 新增
        </button>
        <button type="button" class="btn outline" data-action="print">
            <i class="fas fa-print"></i> 列印
        </button>
    </div>
</div>

<!-- 主要內容區 -->
<div class="content-area">
    <!-- 模組警告訊息區 -->
    <div class="module-alert hidden" data-{module}-alert></div>

    <!-- 欄位選擇器面板（如需要） -->
    <div class="column-selector hidden" data-{module}-column-selector>
        <!-- ... -->
    </div>

    <!-- 工具列/篩選區 -->
    <section class="module-toolbar compact">
        <form class="filter-form" data-{module}-filter>
            <!-- ... -->
        </form>
    </section>

    <!-- 資料表格區 -->
    <section class="module-content">
        <table data-{module}-table>
            <!-- ... -->
        </table>
    </section>
</div>

<!-- Modal 對話框 -->
<div class="modal-overlay hidden" data-{module}-modal>
    <!-- ... -->
</div>
</div>
```

### ⚠️ 禁止的結構

```html
<!-- ❌ 不可使用 sticky 固定標題 -->
<div class="content-header with-actions sticky">

<!-- ❌ 不可單獨使用 content-header（如有按鈕） -->
<div class="content-header">
    <!-- 有 header-actions 時必須加 with-actions -->
</div>

<!-- ❌ 不可使用連字號按鈕類別 -->
<button class="btn-primary">
<button class="btn-outline">

<!-- ✅ 正確的按鈕類別 -->
<button class="btn primary">
<button class="btn outline">
```

### Content Header 規則

1. **基本結構**：`<div class="content-header with-actions">`
2. **無按鈕時**：可使用 `<div class="content-header">`（不加 `with-actions`）
3. **禁止 sticky**：不可加入 `sticky` 類別
4. **標題**：使用 `<h2>` 標籤
5. **副標題**：使用 `<p class="subtitle">`

### 按鈕樣式規則

#### 頁面標題區按鈕（Header Actions）

| 用途 | 類別 | 範例 |
|------|------|------|
| 主要動作 | `btn primary` | 新增、儲存 |
| 次要動作 | `btn outline` | 列印、匯出、取消 |
| 小型按鈕 | `btn outline small` | 欄位選擇器內的按鈕 |
| 危險動作 | `btn danger` | 刪除確認 |

#### ⚠️ 表格操作欄按鈕（Table Row Actions）- 重要規範

**表格內的操作按鈕必須使用以下標準樣式：**

| 用途 | 類別 | 範例 |
|------|------|------|
| 一般操作 | `btn text` | 編輯、檢視、列印、前往 |
| 危險操作 | `btn text danger` | 刪除 |

```html
<!-- ✅ 正確寫法 -->
<td>
    <button type="button" class="btn text" data-action="view" title="檢視">
        <i class="fas fa-eye"></i>
    </button>
    <button type="button" class="btn text" data-action="edit" title="編輯">
        <i class="fas fa-edit"></i>
    </button>
    <button type="button" class="btn text danger" data-action="delete" title="刪除">
        <i class="fas fa-trash"></i>
    </button>
</td>

<!-- ❌ 錯誤寫法 - 禁止使用 -->
<button class="btn-icon">           <!-- 錯誤：使用 btn-icon -->
<button class="btn-icon danger">    <!-- 錯誤：使用 btn-icon -->
<button class="btn text purple">    <!-- 錯誤：使用 purple 顏色 -->
<button class="btn text success">   <!-- 錯誤：使用 success 顏色 -->
<button class="btn outline small">  <!-- 錯誤：在表格內用 outline -->
<button data-action="edit">         <!-- 錯誤：沒有任何 class -->
```

**禁止在表格操作欄使用的樣式：**
- `btn-icon` - 已棄用
- `btn text purple` - 不允許自訂顏色
- `btn text success` - 不允許自訂顏色
- `btn outline small` - 表格內不使用 outline 樣式
- 無 class 的按鈕 - 必須有 `btn text` 基礎類別

---

## modules/ HTML Inline Style 規範（2026-03-10 新增）

### 禁止使用 Inline Style（M-1 規則）

**`modules/*.html` 內禁止使用 `style=` 屬性**（僅 `display:none` 例外，允許 JS 動態顯隱）。

| ✅ 正確做法 | ❌ 禁止做法 |
|-----------|-----------|
| `class="readonly-field"` | `style="background-color: #f8f9fa; color: #6c757d;"` |
| `class="col-100"` | `style="width: 100px;"` |
| `class="info-box"` | `style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius);"` |
| `class="subsection-header"` | `style="display: flex; justify-content: space-between;"` |
| `style="display: none;"` | （允許此例外，JS 隱藏用途） |

### 表格欄位寬度工具類別（styles.css）

使用 `.col-*` 類別替代 `<th>` 上的 inline style：

```html
<!-- ✅ 正確 -->
<th class="col-80">縮圖</th>
<th class="col-100">公差(+)</th>
<th class="col-120">圖片類型</th>
<th class="col-150">上傳時間</th>

<!-- ❌ 禁止 -->
<th style="width: 80px;">縮圖</th>
<th style="width: 100px;">公差(+)</th>
```

| 類別 | 寬度 | 常用場景 |
|------|------|---------|
| `.col-40` | 40px | Checkbox 欄 |
| `.col-50` | 50px | 小型操作欄 |
| `.col-80` | 80px | 縮圖、預覽、操作 |
| `.col-100` | 100px | 數值欄（公差、PPM） |
| `.col-120` | 120px | 短文字欄（類型、數量） |
| `.col-150` | 150px | 中文字欄（時間、名稱） |
| `.col-200` | 200px | 較長文字欄 |

### 資訊框（Info Box）

Modal 內顯示唯讀資訊的方塊，使用 `.info-box` 類別：

```html
<!-- ✅ 正確 -->
<div class="detail-grid info-box" data-shipping-order-info>
    <!-- 動態載入資訊 -->
</div>

<!-- ❌ 禁止 -->
<div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius);">
```

### 子區塊標題列（含操作按鈕）

使用 `.subsection-header` + `.subsection-actions` 替代 inline flex：

```html
<!-- ✅ 正確 -->
<div class="subsection-header">
    <h4>品項清單</h4>
    <div class="subsection-actions">
        <button type="button" class="btn outline small" data-action="select-all">全選</button>
    </div>
</div>

<!-- ❌ 禁止 -->
<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
    <h4 style="margin: 0;">品項清單</h4>
```

### 唯讀輸入框

使用 `.readonly-field` 類別：

```html
<!-- ✅ 正確 -->
<input type="text" name="number" disabled readonly class="readonly-field">

<!-- ❌ 禁止 -->
<input type="text" name="number" disabled readonly style="background-color: #f8f9fa; color: #6c757d;">
```

---

## 模組初始化架構

每個模組 JS 都遵循以下模式：

```javascript
(function() {
    'use strict';

    function initializeXxxModule(container) {
        const moduleRoot = container.querySelector('[data-module="xxx"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        // 欄位管理器由 column_manager.js 自動初始化，不需要手動呼叫

        // ... 模組邏輯
    }

    window.initializeXxxModule = initializeXxxModule;
})();
```

---

## Tab 系統

- Tab 內容會動態載入到 `#tab-content-area`
- 使用 `data-page` 和 `data-title` 屬性定義選單項目
- Tab 狀態會自動儲存到 localStorage

---

## 配置化模組系統 (Module Config System)

### 概述
系統使用配置化架構統一管理模組的 UI 結構，減少 HTML 重複代碼，確保一致性。

**核心檔案**：
- `core/module-config.js` - 配置註冊中心
- `core/module-renderer.js` - HTML 渲染引擎
- `core/configs/*.config.js` - 各模組配置檔

### 如何將現有模組遷移為配置化

#### 步驟 1：分析現有模組
使用瀏覽器 Console 執行：
```javascript
ModuleMigration.migrate('module_name');
```
這會產生配置骨架供參考。

#### 步驟 2：建立配置檔
在 `core/configs/` 建立 `{module_name}.config.js`：

```javascript
ModuleConfig.register('module_name', {
    title: '模組標題',
    subtitle: '模組描述',

    // 標題區按鈕
    headerActions: [
        { label: '新增', icon: 'fas fa-plus', class: 'btn primary', dataAction: 'create' }
    ],

    // 篩選工具列
    filterToolbar: {
        fields: [
            { name: 'search', type: 'text', placeholder: '搜尋...' },
            { name: 'status', type: 'select', options: [...] }
        ]
    },

    // 資料表格
    dataTable: {
        columns: [
            { key: 'id', label: 'ID', sortable: true },
            { key: 'name', label: '名稱', sortable: true }
        ],
        rowActions: true
    },

    // 新增/編輯 Modal
    modal: {
        createTitle: '新增資料',
        editTitle: '編輯資料',
        sections: [...],
        submitDataAction: 'save'
    }
});
```

#### 步驟 3：在 index.html 載入配置
```html
<script src="core/configs/module_name.config.js"></script>
```

### ⚠️ 配置化遷移重要注意事項

#### HTML 結構必須匹配
模組 JS 會透過特定選擇器尋找元素，產生的 HTML 必須完全匹配：

| 元件 | 必要的 data 屬性 |
|------|------------------|
| 表格 | `data-{kebab-module}-table` |
| 分頁 | `data-{kebab-module}-pagination` |
| Modal | `data-{kebab-module}-modal` |
| 表單 | `data-{kebab-module}-form` |
| Alert | `data-{kebab-module}-alert` |

#### 表格結構規範
```html
<!-- ✅ 正確結構 -->
<section class="table-section">
    <div class="table-responsive">
        <table data-{kebab-module}-table>
            <thead>
                <tr>
                    <!-- sortable 欄位必須有 data-sort 和排序圖示 -->
                    <th data-column="name" data-sort="name">
                        名稱 <i class="fas fa-sort"></i>
                    </th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
    <div class="pagination" data-{kebab-module}-pagination></div>
</section>

<!-- ❌ 錯誤結構 -->
<section class="module-content">
    <div class="table-container">
        ...
    </div>
</section>
```

#### 篩選工具列規範
```html
<!-- ✅ 正確結構 -->
<section class="module-toolbar compact">
    <form class="filter-form" data-{kebab-module}-filter>
        <div class="filter-row">
            ...
        </div>
        <div class="form-actions">
            <button type="submit" class="btn primary small">套用</button>
            <button type="button" class="btn outline small" data-action="reset-filter">重設</button>
        </div>
    </form>
</section>

<!-- ❌ 錯誤 - 不要用 filter-actions -->
<div class="filter-actions">
    <button><i class="fas fa-filter"></i> 篩選</button>
    <button><i class="fas fa-redo"></i> 重設</button>
</div>
```

#### 搜尋抽屜規範（2026-05-07 新增，2026-05-07 收斂）

系統已改用「右上角搜尋按鈕 + 右側滑出搜尋面板」作為新版列表查詢模式。搜尋抽屜互動已收斂到 `core/module-renderer.js` 的通用 controller，禁止在各模組 JS 重新實作一套抽屜開關、遮罩、Esc、chips 摘要或 badge 邏輯。

##### 適用情境

- 列表是主要工作區，使用者需要一次看到更多資料列與欄位。
- 搜尋條件包含關鍵字、日期區間、狀態、客戶/供應商等多欄位。
- 右上角已有新增、列印、匯出、欄位設定等操作按鈕，需要維持一列整齊。

##### 配置檔設定

在 `core/configs/{module}.config.js` 使用一般 `filters` 定義欄位，並加上：

```javascript
ModuleConfig.register('orders', {
    // ...
    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    filters: [
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '訂單號碼 / 客戶名稱' },
        { name: 'date_from', label: '開始日期', type: 'date' },
        { name: 'date_to', label: '結束日期', type: 'date' }
    ],
    columns: [
        { key: 'checkbox', label: '', sortable: false, isCheckbox: true },
        { key: 'order_number', label: '訂單號碼', sortable: true, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ]
});
```

##### UI 文字與圖示

- 使用者可見按鈕文字一律用「搜尋」，不要用「篩選」。
- 搜尋按鈕圖示使用 `fa-search`，不是 `fa-filter`。
- 抽屜標題使用「搜尋條件」。
- 內部 `data-action` 可維持既有命名：`open-filter-drawer`、`close-filter-drawer`、`reset-filter`，避免破壞既有 JS 綁定。

##### Renderer 與樣式責任

- 抽屜 HTML 由 `core/module-renderer.js` 依 `filterLayout: 'drawer'` 產生。
- 抽屜互動由 `core/module-renderer.js` 依 `useGenericFilterDrawer: true` 自動初始化。
- 樣式由 `styles.css` 的 `.filter-drawer-*` 與 `.filter-summary-*` 控制。
- 若 `tableHeaderActionsInHeader: true`，搜尋與欄位設定按鈕應放在標題列右側 `.header-actions`，不要再放在表格區上方造成兩列按鈕。
- 搜尋摘要列使用 `data-{module}-filter-summary` 顯示目前條件，讓使用者不必打開抽屜也能知道目前查詢狀態。
- Renderer 只會在有可選欄位時顯示「欄位設定」按鈕；動態表頭模組可只啟用搜尋抽屜，不強制啟用欄位設定。

##### JS 行為規範

通用互動由 `ModuleRenderer` 處理，模組 JS 不得再自行綁定下列抽屜互動：

- 點擊 `[data-action="open-filter-drawer"]` 開啟右側面板。
- 點擊 overlay、關閉按鈕或按 `Escape` 關閉面板。
- 搜尋摘要 chips 與條件數 badge。
- 點擊摘要列的「清除搜尋」後重設表單並重新 submit。

模組 JS 只需要保留資料行為：

- 監聽 `filterForm submit`，執行查詢/重新載入資料。
- 監聽 `reset-filter` 時如需設定特殊預設值，可在 `form.reset()` 後補值，並重新查詢。
- 若舊模組仍保留 `setFilterDrawerOpen()` 或 `updateFilterSummary()` 相容函式，函式內容必須委派到：

```javascript
window.ModuleRenderer
    ?.getFilterDrawerController?.('module_name', moduleRoot)
    ?.updateSummary();
```

或使用 controller 的 `open()` / `close()`；不得複製 chips、badge、overlay、Esc 等 DOM 操作。

##### 欄位設定搭配規則

- 欄位設定面板只列出真正可顯示的業務欄位。
- `checkbox`、操作欄、空 label 欄位、內部技術 ID 欄位不得出現在欄位設定中。
- 如果移除表頭欄位，必須同步移除 JS row template 中對應的 `<td>`，並調整 loading/empty row 的 `colspan`，避免列表跑版。

#### Modal 表單規範
1. **不要**在 form 內自動加入 `<input type="hidden" name="id">`，讓模組 JS 自己處理
2. **form-actions** 必須加上 `align-right` 類別
3. **submit 按鈕**必須有對應的 `data-action` 屬性

```html
<!-- ✅ 正確 -->
<div class="form-actions align-right">
    <button type="button" class="outline" data-action="cancel">取消</button>
    <button type="submit" class="primary" data-action="save">儲存</button>
</div>
```

#### 特殊 Section 屬性
某些表單區塊需要額外的 class 或 data 屬性：
```javascript
sections: [
    {
        title: 'LOGO',
        className: 'logo-section',      // 加在 section 上
        dataAttr: 'data-logo-section',  // 加在 section 上
        fields: [...]
    }
]
```

#### 標題按鈕 label 包裝
某些按鈕文字需要用 `<span>` 包裝（供 CSS 響應式隱藏）：
```javascript
headerActions: [
    {
        label: '列印',
        icon: 'fas fa-print',
        class: 'btn outline',
        dataAction: 'print',
        wrapLabel: true  // 產生 <span>列印</span>
    }
]
```

### 命名規則對照

| 用途 | 格式 | 範例 |
|------|------|------|
| 模組 ID | snake_case | `order_items` |
| HTML data 屬性 | kebab-case | `data-order-items-table` |
| Window 變數 | camelCase | `orderItemsColumnManager` |
| 配置檔名 | snake_case.config.js | `order_items.config.js` |

### 遷移檢查清單

- [ ] 備份原始 HTML 為 `.html.bak`
- [ ] **參考 `core/configs/README.md` 規範**
- [ ] **參考現有運作的配置（如 `companies.config.js`）**
- [ ] 使用 `ModuleMigration.migrate()` 分析結構
- [ ] 建立配置檔
- [ ] 在 index.html 載入配置
- [ ] **實際測試模組功能（不是只有語法檢查）**：
  - [ ] 瀏覽器 Console 無錯誤
  - [ ] 表格顯示正常
  - [ ] 排序功能正常
  - [ ] 分頁功能正常
  - [ ] 篩選功能正常
  - [ ] 新增/編輯 Modal 正常
  - [ ] 欄位設定功能正常
- [ ] 確認無 Console 錯誤

### ⚠️ 重要提醒：避免虛假測試

**絕對不要只做語法檢查就說「測試通過」**。必須：

1. **實際在瀏覽器開啟頁面**
2. **確認 Console 無錯誤**
3. **點擊按鈕確認功能正常**
4. **確認資料能正確載入**

如果無法實際測試，應明確告知使用者：「配置已建立，但需要您在瀏覽器中驗證功能」。

---

## CSV 匯出規範（export.php）（2026-03-01 新增）

### 概述

系統各模組的資料匯出功能由 `api/{module}/export.php` 提供，前端透過 JS 觸發下載。

### PHP 端強制要求

每支 `export.php` **必須**包含以下三行（缺一不可）：

```php
declare(strict_types=1);   // 檔案頂端
requireAuth();             // 登入驗證
requireMethod('GET');      // 限定 GET 方法
```

❌ 缺少任一項均會被 `audit-system-health.js [E-1]` 標記為錯誤。

### 標準 Response Header

```php
// UTF-8 BOM（讓 Excel 正確識別繁中）
fwrite($fh, "\xEF\xBB\xBF");

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
```

### 檔名命名規則

```php
$filename = '{模組英文名}' . date('Ymd_His') . '.csv';
// 範例：inventory_items_20260301_143022.csv
```

如需中文檔名（RFC 2231 編碼）：

```php
$encodedFilename = rawurlencode('庫存項目_' . date('Ymd_His') . '.csv');
header("Content-Disposition: attachment; filename*=UTF-8''" . $encodedFilename);
```

### 最大匯出筆數

```php
const MAX_EXPORT_ROWS = 50000;
```

超過 50,000 筆時截斷，**不拋錯**（避免逾時）。

### 前端觸發方式

| 觸發方式 | 是否需要 credentials | 範例 |
|----------|---------------------|------|
| `window.open(url, '_blank')` | ❌ 不需要（瀏覽器自動帶 Cookie） | `inventory_items.js` |
| `window.location.href = url` | ❌ 不需要（同上） | — |
| `fetch(url, { credentials: 'include' })` | ✅ **必須加** | `production_quality_records.js` |

> ⚠️ 使用 `fetch()` 下載時若缺少 `credentials: 'include'`，Session Cookie 不會被送出，導致 `requireAuth()` 拒絕請求（回傳 401）。

### fetch() 下載範本

```javascript
async function exportData(params) {
    const url = `/api/{module}/export.php?${new URLSearchParams(params)}`;
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error('匯出失敗');
    const blob = await response.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    // 優先使用 Content-Disposition 的 filename
    const cd = response.headers.get('Content-Disposition') || '';
    a.download = cd.match(/filename="?([^"]+)"?/)?.[1] || 'export.csv';
    a.click();
}
```

### 已存在的 export.php 模組

| 模組 | 路徑 | 觸發方式 |
|------|------|----------|
| 客戶 | `api/customers/export.php` | `window.open()` |
| 工單首件尺寸 | `api/work_order_first_piece_dimensions/export.php` | `window.open()` |
| 審計日誌 | `api/audit_logs/export.php` | `window.open()` |
| 訂單明細 | `api/order_items/export.php` | `fetch()` + credentials |
| 庫存項目 | `api/inventory_items/export.php` | `window.open()` |
| 生產品質記錄 | `api/production_quality_records/export.php` | `fetch()` + credentials |

---

## help/ 系統使用手冊規範（2026-03-02 新增）

### 目錄結構

```
help/
  index.html          # 手冊主頁（株架、搜尋 Modal、播轉導航）
  styles.css          # 手冊專用樣式
  script.js           # 定義導航渲染、文章載入、TOC、搜尋功能
  content.js          # HELP_CONTENT：完整導航結構 + 各篇文章內容（49 篇）
  workflow-content.js # WORKFLOW_ARTICLES：補充流程篇的較詳細版本，執行時覆蓋 content.js
```

### 內容載入涵層次

| 檔案 | 常數名稱 | 載入順序 | 說明 |
|------|----------|----------|------|
| `workflow-content.js` | `WORKFLOW_ARTICLES` | 1 | 課蓋相同 ID 的 content.js 文章 |
| `content.js` | `HELP_CONTENT` | 2 | 主內容定義 |
| `script.js` | （IIFE） | 3 | 初始化時自動將 WORKFLOW_ARTICLES 合併至 HELP_CONTENT.articles |

### 新增文章的方式

**方式 1：直接新增至 content.js**（適合新功能模組的簡短說明）

```javascript
// 1. 在 HELP_CONTENT.navigation 高適組加入導航項目
{ id: 'my-feature', title: '我的功能', icon: 'fa-star' }

// 2. 在 HELP_CONTENT.articles 加入文章
'my-feature': {
    title: '我的功能',
    content: `<h1>我的功能</h1><p>...</p>`
}
```

**方式 2：建立新的補充内容檔案**（適合詳細流程導覽文件）

```javascript
// 檔名: help/xxx-content.js
// 定義全域常數（不要使用 module.exports）
const XXX_ARTICLES = {
    'my-feature': {
        title: '...',
        content: `<h1>...</h1>`
    }
};
// 不要加 module.exports！（此檔在瀏覽器執行）
```

然後記得：
1. 在 `help/index.html` 加入 `<script src="xxx-content.js"></script>` （必須在 content.js **之前**）
2. 在 `script.js` 的 `init()` 內加入合併邏輯：
   ```javascript
   if (typeof XXX_ARTICLES !== 'undefined') {
       Object.assign(HELP_CONTENT.articles, XXX_ARTICLES);
   }
   ```

### 重要禁止事項

- ✅ 完整 JS 檔案必須在 `help/index.html` 被 `<script>` 對應載入
- ✅ 补充內容 JS 不可使用 `module.exports`（烏覽器環境）
- ✅ 搜尋 Modal 關閉按鈕選取器必須用 `#close-search-modal`（不是 `.search-close`）
- ❌ 複製 HTML 對應小型系統（內容雜亂難維護）
- ❌ 在「手冊文章內容」中寫入傔擬的 API 路徑或功能行為（手冊展示的是實際系統行為）

### 已確認的內容 JS 檔案

| 檔案 | 全域常數 | 文章數量 | 說明 |
|------|----------|----------|------|
| `content.js` | `HELP_CONTENT` | 49 篇 | 主內容，涵蓋全模組 |
| `workflow-content.js` | `WORKFLOW_ARTICLES` | 2 篇 | workflow-overview、workflow-order-to-shipping 的詳細版 |

---

## 資料同步

使用 `js/data-sync.js` 進行跨分頁資料同步：

```javascript
// 通知資料變更
DataSync.notifyWithDependencies('模組名稱', DataSync.EVENT_TYPES.UPDATED, data);

// 訂閱變更
DataSync.subscribe('模組名稱', (event) => {
    // 處理變更
});
```

---

## 📚 技能文件索引（Skills）

以下文件定義各技術領域的詳細規範。**在進行對應工作時，必須閱讀並遵循相關文件。**

> 各文件已同步為 `.github/instructions/*.instructions.md`，VS Code Copilot 會依編輯的檔案類型自動套用。

| 文件 | 適用範圍 | 說明 |
|------|----------|------|
| `.github/skills/php-api-style.md` | `api/**/*.php` | PHP API 程式碼撰寫風格（宣告、輸出、錯誤處理） |
| `.github/skills/api-code-style-check.md` | `api/**/*.php` | API 風格一致性檢查清單（strict_types、中文訊息、句號） |
| `.github/skills/api-doc-standard.md` | `api/**/*.php` | PHPDoc 註解規範（Doc-as-Code） |
| `.github/skills/javascript-module-style.md` | `js/**/*.js` | 前端 JS 模組架構（IIFE、事件委派、防禦性函數） |
| `.github/skills/html-module-style.md` | `modules/**`, `core/configs/**` | HTML 模組頁面結構規範 |
| `.github/skills/css-style-guide.md` | `**/*.css` | CSS 撰寫規範（命名、按鈕類別、Modal 尺寸） |
| `.github/skills/ui-style.md` | UI 相關檔案 | 整體 UI 風格（色彩系統、間距、狀態標籤） |
| `.github/skills/order-print.md` | `print/**` | 列印範本規範（credentials、CSRF、report_code） |
| `.github/skills/company-branding-skill.md` | 公司/列印相關 | 公司 LOGO 管理、上傳驗證、列印整合 |

### 快速參照

- **新增 PHP API 模組** → 閱讀 `php-api-style.md` + `api-doc-standard.md`
- **新增前端 JS 模組** → 閱讀 `javascript-module-style.md`
- **新增/修改 HTML 模組** → 閱讀 `html-module-style.md` + `ui-style.md`
- **新增/修改 CSS** → 閱讀 `css-style-guide.md` + `ui-style.md`
- **修改列印範本** → 閱讀 `order-print.md`
- **修改公司資料/LOGO** → 閱讀 `company-branding-skill.md`

---

## JS 模組進階規範（2026-03-02 補充）

### 模組必須遵守的四項規則

#### 1. IIFE 包裹（防止全域污染）

```javascript
// ✅ 正確：用 IIFE 保護內部變數
(function() {
    'use strict';

    function initializeXxxModule(container) {
        // ...
    }

    window.initializeXxxModule = initializeXxxModule;
})();

// ❌ 錯誤：直接掛到全域
window.initializeXxxModule = function(container) { /* ... */ };
```

#### 2. `'use strict'` 嚴格模式

```javascript
(function() {
    'use strict'; // ✅ 必須位於 IIFE 頂端
    // ...
})();
```

#### 3. `data-initialised` 防重複初始化守衛

```javascript
function initializeXxxModule(container) {
    const moduleRoot = container.querySelector('[data-module="xxx"]');
    if (!moduleRoot || moduleRoot.dataset.initialised === 'true') return; // ✅ 防重複
    moduleRoot.dataset.initialised = 'true';
    // ...
}
```

#### 4. 移除 `console.log` 殘留

```javascript
// ❌ 不允許殘留在生產代碼
console.log('[module] loadItems called:', state);
console.log('✅ Modal 載入成功');

// ✅ 允許保留的是錯誤與警告
console.error('[module] API error:', error);
console.warn('[module] 欄位不存在:', name);
```

### `escapeHtml` 使用規則

`window.escapeHtml` 由 `js/utils.js` 提供，不需在各模組內重複定義。直接呼叫 `escapeHtml(value)` 即可使用。

#### 何時必須使用 `escapeHtml`（J-2 規則）

| 場景 | 需要 escapeHtml | 說明 |
|------|----------------|------|
| 使用者輸入欄位（名稱、地址、備註） | ✅ **必須** | 任何文字欄位都可能含有 `<>"'&` |
| 系統產生的號碼（訂單號、工單號） | ✅ **建議** | 理論上安全，但仍建議 escape |
| 資料庫 ID（整數） | ❌ 不需要 | 整數不含 HTML 特殊字符 |
| 日期欄位（ISO 格式 YYYY-MM-DD） | ❌ 不需要 | ISO 日期格式安全 |
| `formatDate()`、`formatNumber()` 等格式化函數輸出 | ❌ 不需要 | 格式化函數已處理安全輸出 |
| `textContent` 直接賦值 | ❌ 不需要 | textContent 不解析 HTML |
| `data-id`、`data-action` 等屬性（整數 ID） | ❌ 不需要 | 僅放整數 |

```javascript
// ✅ 正確：所有使用者提供的字串欄位都加 escapeHtml
tbody.innerHTML = items.map(item => `
    <tr data-id="${item.id}">
        <td>${item.id}</td>
        <td>${escapeHtml(item.order_number)}</td>
        <td>${escapeHtml(item.customer_name)}</td>
        <td>${escapeHtml(item.consignee_address || '-')}</td>
        <td>${item.return_date || '-'}</td>
        <td>${formatNumber(item.quantity, 0)}</td>
    </tr>
`).join('');

// ✅ 正確：HTML 屬性中也要 escapeHtml
const btnTitle = hasWorkOrder
    ? `已轉成工單 ${escapeHtml(item.work_order_number || '')}`.trim()
    : '轉為工單';

// ❌ 錯誤：字串欄位未 escape
td.innerHTML = `<td>${item.customer_name}</td>`;  // XSS 風險！

// ✅ 直接使用（utils.js 已提前載入）
return `<td>${escapeHtml(item.name)}</td>`;

// ❌ 不要重複定義 escapeHtml
function escapeHtml(s) { return s.replace(...); } // 除非 utils.js 未載入
```

#### data-json 屬性編碼規則

若需要在 HTML data 屬性中嵌入 JSON 物件（以便後續 JS 讀取），**必須**使用 `encodeURIComponent`：

```javascript
// ✅ 正確：使用 encodeURIComponent 避免 & 等字符破壞 HTML
const json = encodeURIComponent(JSON.stringify(item));
return `<tr data-json="${json}">`;

// 讀取時
const data = JSON.parse(decodeURIComponent(row.dataset.json));

// ❌ 錯誤：只 replace " 無法處理 &、' 等字符
const json = JSON.stringify(item).replace(/"/g, '&quot;');  // 不完整！
```

### 相關模組一覽

| 檔案 | 行數 | F-1 狀態 |
|------|------|----------|
| `order_items.js` | 2880 | ⚠️ 超過 2000 行，建議拆分 |
| `work_orders.js` | 2072 | ⚠️ 超過 2000 行，建議拆分 |

**拆分迷思**：大型模組可拆為三層。
1. `xxx-api.js` — fetch 呼叫層
2. `xxx-render.js` — HTML 渲染層
3. `xxx.js` — 主模組（事件綁定、狀態管理）

---

## 🔄 跨分頁資料同步 (DataSync) 標準規範（2026-03-03 新增，強制執行）

### 概述

系統使用 `js/data-sync.js` 提供跨分頁（Tab）即時同步機制。**所有模組完成 CRUD 後必須呼叫 DataSync 通知，否則其他已開啟的分頁將顯示過時資料。**

### 核心機制

```
A 分頁執行 CRUD
   └→ dataSyncHelper.notifyCreated/Updated/Deleted(data)
         └→ DataSync.notifyWithDependencies(moduleName, eventType, data)
               ├→ 廣播給 moduleName 的直接監聽者 → 觸發 onRefresh（同模組其他分頁重新載入）
               └→ 查詢 MODULE_DEPENDENCIES[moduleName] → 廣播 dependency_updated 給相依模組
                     └→ 相依模組的 onDependencyUpdate 或 fallback onRefresh 被呼叫
```

### 完整 MODULE_DEPENDENCIES 對照表（2026-03-03 更新）

> 此表對應 `js/data-sync.js` 的 `MODULE_DEPENDENCIES`。新增模組時必須同步更新此表與程式碼。

| 變更來源模組 | 需刷新的模組 | 說明 |
|-------------|------------|------|
| `companies` | `employees`, `customers`, `suppliers` | 公司資料影響員工/客戶/供應商 |
| `customers` | `orders`, `screening_services`, `return_orders` | 客戶資料影響訂單/篩選服務/退貨單 |
| `suppliers` | `orders`, `inventory_items` | 供應商影響訂單/庫存 |
| `screening_items` | `order_items`, `screening_services`, `inventory_items` | 篩選項目影響訂單項目/服務/庫存 |
| `screening_services` | `orders`, `order_items` | 篩選服務影響訂單 |
| `employees` | `work_orders`, `orders`, `calendar_event_participants`, `calendar_event_reminders`, `work_order_first_piece_dimensions`, `messages`, `notifications`, `employee_roles`, `daily_machine_inspections`, `daily_machine_inspection_items`, `machine_maintenance_tasks`, `production_records`, `quality_issue_reports`, `shipping_quality_inspections` | 員工影響幾乎所有模組 |
| `departments` | `employees`, `notifications`, `quality_issue_reports` | 部門影響員工/通知/品質報告 |
| `roles` | `notifications`, `employee_roles`, `role_permissions` | 角色影響通知/員工角色/角色權限 |
| `permissions` | `role_permissions` | 權限影響角色權限 |
| `machines` | `work_orders`, `machine_maintenance_tasks`, `daily_machine_inspections`, `production_records` | 機台影響工單/保養/檢驗/生產 |
| `tools` | `work_orders`, `order_items` | 工具影響工單/訂單項目 |
| `orders` | `order_items`, `work_orders`, `dashboard` | 訂單影響項目/工單/儀表板 |
| `order_items` | `work_orders`, `inventory_items` | 訂單項目影響工單/庫存 |
| `work_orders` | `work_order_images`, `work_order_first_piece_dimensions`, `inventory_items`, `inventory_transactions`, `dashboard`, `production_records` | 工單影響圖片/首件/庫存/儀表板/生產 |
| `shipping_orders` | `shipping_order_items`, `inventory_items`, `order_items`, `inventory_transactions`, `return_orders`, `dashboard`, `shipping_quality_inspections` | 出貨單影響出貨項目/庫存/退貨/儀表板/品質 |
| `return_orders` | `inventory_items`, `inventory_transactions` | 退貨影響庫存 |
| `inventory_items` | `inventory_transactions` | 庫存項目影響交易記錄 |
| `dashboard_calendar_events` | `calendar_event_participants`, `calendar_event_reminders`, `dashboard` | 行事曆事件影響參與者/提醒/儀表板 |
| `daily_machine_inspections` | `daily_machine_inspection_items` | 檢驗單影響檢驗項目 |
| `work_order_first_piece_dimensions` | `work_orders` | 首件尺寸影響工單（反向同步） |
| `daily_machine_inspection_items` | `daily_machine_inspections` | 檢驗項目影響上層檢驗單（反向同步） |
| `employee_roles` | `employees`, `roles` | 員工角色指派影響員工/角色清單 |
| `role_permissions` | `roles`, `permissions` | 角色權限指派影響角色/權限清單 |
| `lookup_domains` | `lookup_values` | 查詢網域影響查詢值 |
| `shipping_quality_inspections` | `shipping_orders` | 出貨品質檢驗影響出貨單 |
| `machine_maintenance_tasks` | `machines` | 機台保養任務影響機台資料 |
| `calendar_event_reminders` | `dashboard_calendar_events` | 行事曆提醒影響事件顯示 |
| `production_quality_records` | `work_orders` | 生產品質記錄影響工單 |
| `quality_issue_reports` | `dashboard` | 品質異常報告影響儀表板 |
| `lookup_values` | `orders`, `customers`, `suppliers`, `employees`, `work_orders`, `screening_items` | 查詢值影響所有使用下拉選單的模組 |

### 強制規則

#### 規則 1：每個模組初始化時必須建立 DataSync 輔助器

```javascript
// ✅ 正確：所有功能模組都必須有
let dataSyncHelper = null;
if (typeof DataSync !== 'undefined') {
    dataSyncHelper = DataSync.createModuleHelper('module_name', {
        onRefresh: () => loadData(),          // 本模組有資料變化時自動重載
        debounceMs: 300,                      // 防抖延遲（建議保留）
        onDependencyUpdate: (sourceModule) => { // 可選：相依模組變化時的處理
            if (sourceModule === 'parent_module') {
                loadParentOptions();           // 只更新下拉選項，避免全頁重刷
            }
        }
    });
}

// ❌ 禁止：模組沒有 DataSync 輔助器
```

#### 規則 2：CRUD 成功後必須發送通知

```javascript
// ✅ 正確
async function saveData(data, isEdit) {
    const result = await fetch(...);
    if (!result.success) return;

    // 必須在這裡通知
    if (dataSyncHelper) {
        if (isEdit) {
            dataSyncHelper.notifyUpdated(result.data);
        } else {
            dataSyncHelper.notifyCreated(result.data);
        }
    }
}

async function deleteData(id) {
    const result = await fetch(...);
    if (!result.success) return;

    if (dataSyncHelper) {
        dataSyncHelper.notifyDeleted({ id });  // ✅ 必須
    }
}

// ❌ 禁止：儲存後不呼叫 notify
```

#### 規則 3：新增模組時必須更新 MODULE_DEPENDENCIES

在 `js/data-sync.js` 的 `MODULE_DEPENDENCIES` 表中宣告：

- **誰依賴我**（我的資料變動後，哪些模組需要更新）
- **我依賴誰**（被觸發時透過 `onDependencyUpdate` 或 `onRefresh` 處理）

```javascript
// js/data-sync.js → MODULE_DEPENDENCIES
'my_new_module': ['module_that_shows_my_data', 'another_dependent'],
```

**範例（首件尺寸 ↔ 工單的雙向同步）：**

| 方向 | 設定位置 | 內容 |
|------|----------|------|
| 工單更新 → 首件模組重載 | `MODULE_DEPENDENCIES['work_orders']` 包含 `'work_order_first_piece_dimensions'` | 工單變動時首件列表刷新 |
| 首件更新 → 工單模組重載 | `MODULE_DEPENDENCIES['work_order_first_piece_dimensions']` 包含 `'work_orders'` | 首件獨立修改後工單列表刷新 |

#### 規則 4：`onDependencyUpdate` vs `onRefresh` 的選擇

| 情況 | 建議做法 |
|------|----------|
| 相依模組更新時只需要重新載入整個列表 | 不設 `onDependencyUpdate`，讓 fallback `onRefresh` 處理 |
| 相依模組更新時只需要刷新下拉選項（不全頁重載） | 明確設定 `onDependencyUpdate` 只呼叫選項更新函數 |
| 需要區分不同相依模組採取不同動作 | 設定 `onDependencyUpdate(sourceModule)` 並用 `if` 判斷 |

```javascript
// ✅ 範例：訂單模組依賴客戶和篩選服務更新下拉選項、自身異動時全頁重刷
dataSyncHelper = DataSync.createModuleHelper('orders', {
    onRefresh: () => loadOrders(),       // 本模組資料變動 → 重載列表
    onDependencyUpdate: (sourceModule) => {
        if (sourceModule === 'customers') loadCustomerOptions();
        if (sourceModule === 'screening_services') loadServiceOptions();
        // 若有其他相依，直接 loadOrders() 以確保最新
    }
});
```

### 違規檢查

執行 `node tools/audit-system-health.js` 後若看到以下問題，需立即修復：

```
❌ [DataSync] work_order_first_piece_dimensions 未在 MODULE_DEPENDENCIES 中宣告反向依賴
❌ [DataSync] xxxx.js: 有 CRUD 操作但未呼叫 dataSyncHelper.notify*()
```

### AI 助手在新增/修改功能模組時的 DataSync 檢查清單

- [ ] 模組初始化程式碼有 `DataSync.createModuleHelper(...)`
- [ ] `createModuleHelper` 有設定 `onRefresh` 指向主要資料載入函數
- [ ] 所有 建立/更新/刪除 成功後呼叫對應的 `dataSyncHelper.notify*()`
- [ ] `js/data-sync.js` 的 `MODULE_DEPENDENCIES` 已添加此模組的相依宣告
- [ ] 若此模組的資料異動會影響其他已開啟的模組頁面，確認相關模組的 `onDependencyUpdate` 或 `onRefresh` 能正確處理

---

## 🔗 QR Code 報表設計紀錄（2026-05-12 新增，試作階段）

### 目標與定位

- QR Code 的定位不是「重複紙本內容」，而是「紙本報表之外的數位延伸入口」。
- 現階段目標：先確保掃碼**一定可顯示**暫時報表內容（避免 404 / 空白頁）。
- 未來目標：在不重印紙本的前提下，持續擴充掃碼後可見資訊（追溯、附件、說明、歷程）。

### 目前採用的「可用優先」策略（必須遵循）

1. 列印報表頁在產生 QRCode 前，先呼叫：
   - `POST /api/reports/generate_static.php`
   - 成功後以回傳 `public_url` 作為 QR 內容。
2. 若 `generate_static.php` 失敗，退回 API 回傳 `qrcode_url` 或同站本地靜態路徑（fallback）。
3. `REPORT_EXTERNAL_URL` 未設定時，不可回傳示範網域（如 `report.example.com`）；
   必須自動回退為「同站可開啟路徑」。

### 路徑規劃（weberp 根目錄情境）

- 假設網站實際根目錄是 `/{site}/weberp`（本系統部署在網站根目錄下）。
- 靜態頁匯出目錄（預設）：`export/qrcode_pages`
- 掃碼 URL 應可落在：
  - `https://{host}/weberp/export/qrcode_pages/{work_order_number}.html`

> 註：若後續有獨立報表子網域，再改 `REPORT_EXTERNAL_URL` 指向該網域即可，不需重構前端流程。

### 現階段關鍵檔案（2026-05-12）

- 列印頁（先產生靜態頁，再產生 QR）：
  - `print/screening_inspection_print.html`
- 報表 API（`qrcode_url` fallback 邏輯）：
  - `api/reports/screening_inspection.php`
- 靜態頁產生 API（`public_url` 解析與 fallback）：
  - `api/reports/generate_static.php`
- 靜態頁模板：
  - `api/reports/templates/qrcode_report.tpl.html`

### 未來擴充原則（AI 必讀）

1. **保持固定入口概念**
- 目前可先用 `.../{work_order_number}.html`。
- 後續建議升級為 `.../report/{token}`，由後端決定內容區塊，避免 URL 可枚舉。

2. **紙本與線上分層**
- 紙本：當下快照（固定）。
- 線上：可持續補充（可新增但不破壞既有欄位）。

3. **模組化擴充區塊（建議）**
- 先保留：報表摘要、檢驗明細、不良分布圖。
- 可新增：異常說明、處置記錄、檢驗圖片、附件、品保聯絡窗口、修訂歷程。

4. **安全性**
- 不得直接暴露內部 API（需登入）給外部掃碼使用者。
- 對外掃碼應走靜態頁或受控公開頁。
- 若導入 token，需支援撤銷與有效期控制。

### AI 執行檢查清單（QR 相關修改前後）

- [ ] 列印時是否先嘗試產生靜態頁（`generate_static.php`）？
- [ ] `REPORT_EXTERNAL_URL` 未設定時是否仍能掃碼成功？
- [ ] 掃碼網址是否對應到實際存在檔案？
- [ ] 是否避免回傳示範網域（`report.example.com`）？
- [ ] 新增欄位是否保持向後相容（舊 QR 連結仍可用）？
