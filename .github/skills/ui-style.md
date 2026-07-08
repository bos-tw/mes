# UI 風格指南（螺絲篩分管理系統）

本文件整理專案現有 UI 風格特徵與完整落地規範，請在新增/修改 UI 時嚴格遵守。

---

## 1. 整體設計語言

### 1.1 定位與氛圍
- **定位**：企業級、穩重、可長時間閱讀的管理系統。
- **視覺語言**：扁平化 + 輕陰影層次。
- **空間感**：留白充足，主內容區域清晰。

### 1.2 版面布局
- **固定結構**：頂部白色導覽列 + 左側深色側邊欄 + 右側主內容。
- **主內容**：以白色卡片或白底表格承載資訊，背景為淺灰以提升對比。
- **行為一致**：分頁載入在 `#tab-content-area`，不要改變核心布局。

### 1.3 UI 密度（Density）- 強制規範

MES 是長時間操作的資料密集型後台系統，預設 UI 密度為 **compact**。新增或修改 UI 時，必須優先維持資訊緊密、對齊清楚、可快速掃描，不得以過大的 padding/gap 造成同一視窗可見資訊量下降。

#### 密度分級

| 密度 | 適用情境 | 規則 |
|------|----------|------|
| `compact` | 列表、工單編輯、訂單/出貨/庫存明細、統計側欄 | 預設使用，間距最小但保留可讀性 |
| `normal` | 新增/編輯一般 Modal、設定頁、低頻維護表單 | 可略寬鬆，但仍須使用 token |
| `comfortable` | 危險操作確認、流程守門、錯誤提示、說明型內容 | 只限需要降低誤操作或提高閱讀理解的區塊 |

#### 強制原則

1. 資料表格、表單列、統計卡、區塊標題列必須優先使用 compact density。
2. 同一 Modal 內不得混用多套 padding/gap 風格，除非有明確視覺分層需求。
3. 表格 cell、input/select、label、section、card 的尺寸必須由 CSS token 或共用 class 控制。
4. 禁止用「局部補丁」持續新增不成系統的 `padding: 10px 14px`、`gap: 13px` 等硬編碼值。
5. 可點擊元件仍需保留最小操作範圍：一般按鈕 / 下拉箭頭建議不低於 30px，高頻操作不低於 32px。

#### Compact 基準值

| 元件 | 建議值 |
|------|--------|
| Section padding | `8px 10px` |
| Section gap / row gap | `8px` |
| Subsection header padding-bottom | `6px` |
| 表格 cell padding | `4px 6px` |
| 表單 control height | `32px` |
| 表單 control padding | `4px 8px` |
| Inline label padding | `4px 8px` |
| 統計卡 metric row padding | `6px 8px` |
| Modal body section gap | `8px ~ 10px` |

實際 CSS 不應直接散落使用上述數值；需透過 `css-style-guide.md` 定義的 token 或既有共用 class 使用。

#### 共用 Utility Class

資料密集區塊應優先使用下列 class 做漸進統一：

| Utility | 適用區塊 |
|---------|----------|
| `.ui-compact-section` | 表單 section、附件卡片、可收合區塊 |
| `.ui-compact-table` | compact 明細表、附件表、歷程表 |
| `.ui-compact-form-row` | inline label + input/select/textarea |
| `.ui-metric-card` | 右側統計卡、平衡卡、摘要卡 |
| `.ui-metric-row` | label/value 統計列 |

使用規則：

1. utility class 只處理密度、框線、圓角、label/value 間距，不可作為 JS hook。
2. 若既有模組已使用 `.form-section`、`.data-table compact`、`.metrics-panel`，可疊加 utility class 漸進收斂。
3. 新增 compact 區塊時，不得另寫一組近似的 padding/gap/radius。
4. 特殊版面若不能使用 utility class，需先評估新增 token，必要時加 `ui-token-exception:` 註解。

---

## 2. 色彩系統

### 2.1 品牌主色（Primary Green）
- `#4CAF50`
- 用途：品牌名稱、主按鈕、正向狀態、互動 hover/active。

### 2.2 主要中性色
- **內容文字主色**：`#333`
- **次要文字**：`#2f3b4c`, `#9e9e9e`, `#999`
- **背景灰**：`#f0f2f5`
- **分隔線**：`#ddd`, `#e0e0e0`

### 2.3 功能色（Status）
- **成功/進行中**：綠色系（`#e8f5e9`, `#388e3c`, `#2e7d32`）
- **警告/暫停**：橘色系（`#fff3e0`, `#f57c00`, `#e65100`）
- **危險/取消**：紅色系（`#ffebee`, `#d32f2f`, `#c62828`）
- **次要/完成**：灰色系（`#f5f5f5`, `#616161`）
- **資訊/待開始**：藍色系（`#e3f2fd`, `#1976d2`）

---

## 3. 字體與排版

### 3.1 字體
- `Segoe UI` + `Microsoft JhengHei` 為主要字體。

### 3.2 字級與行距
- **內文**：預設 14px ~ 16px
- **H2**：18px（不可放大）
- **按鈕文字**：14px（不可放大）
- **行高**：1.6

### 3.3 字重
- **標題/重要資訊**：600 或 bold
- **內文**：400 ~ 500

---

## 4. 組件設計規範

### 4.1 頂部導覽列（Top Navbar）
- **背景**：白色
- **陰影**：`0 2px 4px rgba(0,0,0,0.1)`
- **底線**：`1px solid #ddd`
- **品牌字**：主色 `#4CAF50` + bold
- **Icon**：主色或灰色，hover 變主色

### 4.2 側邊欄（Sidebar）
- **背景**：`#313a46`
- **文字**：`#e0e0e0`
- **Hover**：`#3e4a59` + 白字
- **圖示**：Font Awesome，固定寬度對齊

### 4.3 按鈕（Buttons）
- **主要按鈕**：
  - 背景 `#4CAF50`
  - 文字白色
  - 圓角 20px
  - Hover：`#43a047`
  - Focus：外框 `rgba(76,175,80,0.25)`

- **次要按鈕**：
  - 灰底或白底 + 邊框 `#e0e0e0`
  - 文字 `#2f3b4c`
  - Hover：背景淡灰

### 4.4 表格操作按鈕（Table Action Buttons）- 重要規範

**表格內的操作按鈕必須使用以下標準樣式：**

| 用途 | 類別 | 顏色 | 範例 |
|------|------|------|------|
| 檢視 | `btn text` + 檢視類 `data-action` | teal (`#0f766e`) | 檢視、預覽 |
| 編輯 | `btn text` + 編輯類 `data-action` | blue (`#2563eb`) | 編輯 |
| 列印 | `btn text` + 列印類 `data-action` | purple (`#7c3aed`) | 列印 |
| 刪除 | `btn text danger` + 刪除類 `data-action` | red (`#dc3545`) | 刪除 |
| 停用/阻擋 | `disabled`、`aria-disabled`、`op-role-blocked` | gray (`#6c757d`) | 不可操作 |

```html
<!-- ✅ 正確：標準樣式 -->
<td class="table-actions">
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

<!-- ❌ 禁止使用的樣式 -->
<button class="btn text purple">     <!-- ❌ 不允許自訂顏色 -->
<button class="btn text success">    <!-- ❌ 不允許自訂顏色 -->
<button class="btn text warning">    <!-- ❌ 不允許自訂顏色 -->
<button class="btn outline small">   <!-- ❌ 表格內不使用 outline -->
<button class="icon-btn">            <!-- ❌ 已棄用 -->
<button class="link">                <!-- ❌ 請改用 btn text -->
```

**樣式規格：**

- **`.btn.text`（操作按鈕基底）**：
  - 實際背景由 `data-action` 對應的 `.op-role-*` 決定
  - 文字：白色
  - 尺寸：30x30px
  - 圓角：4px
  - Hover：角色色加深 + 輕微上移效果

- **`.btn.text.danger`（危險操作）**：
  - 背景：`#dc3545`（紅色）
  - Hover：`#a71d2a`

- **語意角色自動顏色**：
  - 列印：紫色
  - 檢視：teal
  - 編輯：藍色
  - 刪除：紅色
  - 新增：綠色
  - 流程操作：棕橘色
  - 灰色只允許停用或阻擋操作

### 4.5 圖示按鈕（Icon Button）
- **尺寸**：36x36
- **形狀**：圓形
- **背景**：`rgba(76,175,80,0.12)`
- **Hover**：更深的淡綠，文字變主色
- **用途**：側邊欄、工具列等非表格區域

### 4.6 Badge / 狀態標籤
- **樣式**：小型圓角、細邊框、淡色背景
- **文字**：對應功能色
- **高度**：最小 18px，避免視覺擁擠

### 4.7 表格（Table）
- **表格外觀**：白色底，細邊框 `#e0e0e0`
- **表頭**：字重 600、背景微灰
- **列 hover**：淺灰背景
- **次要資訊**：使用 `.subtext` 樣式（0.8em，灰色）
- **密度**：資料列表與 Modal 內明細表預設使用 compact cell padding，不得任意放大列高。

### 4.8 表單（Form）
- **輸入框**：圓角 6px，邊框 `#ddd`
- **Focus**：主色系邊框或陰影
- **Label**：深灰 `#2f3b4c`
- **框線模型**：inline label 不得同時讓外層 label 和內部 label/input 各畫一層完整外框，避免雙層粗框。
- **下拉元件**：可搜尋下拉若有外層 control border，內層 input 不得再畫完整 border。

### 4.9 Modal / Card
- **卡片**：白色背景、圓角 10~12px、微陰影
- **Modal**：置中顯示、層次感明確
- **Modal 密度**：複雜作業 Modal 預設 compact；Section、表格、統計側欄必須使用同一套密度 token。

### 4.10 統計側欄（Metrics Sidebar）
- **用途**：顯示工單、訂單、篩分、平衡等即時統計。
- **外觀**：白底或淡灰底卡片，細邊框，圓角不得超過系統 token。
- **Metric row**：label 與 value 必須有清楚區隔；label 可使用淡底圓角標題帶，value 不應被過度裝飾。
- **留白**：label/value 不得貼齊卡片圓角或邊界，左右需保留 token 化 padding。
- **資料密度**：數值列表需緊密排列，避免一張側欄卡片占用過多垂直空間。

---

## 5. 互動與回饋

### 5.1 Hover
- 以**顏色加深 / 背景變化**呈現

### 5.2 Active
- **輕微位移或縮放**

### 5.3 Focus
- 明顯主色外框或陰影

---

## 6. Icon 使用規範

- 使用 Font Awesome（已載入）。
- 左側選單 icon 與文字保持同一行、固定寬度。
- 重要功能 icon 使用主色，次要 icon 使用灰色。

---

## 7. 響應式與可用性

- 側欄可收合，避免在小螢幕佔用太多空間。
- 按鈕大小最小高度 32px，保持可點擊範圍。
- 文字對比需維持可讀性（避免淺灰字配淺灰底）。

---

## 8. 可重用樣式清單（重要）

- `.btn.text`：表格操作按鈕-編輯（藍底白字 32x32）
- `.btn.text.danger`：表格操作按鈕-刪除（紅底）
- `.status-badge`：狀態徽章
- `.link-text`：藍色連結樣式
- `.subtext`：表格內次要文字
- `.row-inactive`：不活躍列
- `.sidebar-toggle`：側欄收合按鈕
- `.user-dropdown-toggle` / `.user-dropdown-menu`：右上角使用者下拉選單
- `.module-alert` / `.modal-alert`：模組與 Modal 訊息提示
- `.sidebar-tab-btn` / `.sidebar-content-toolbar`：側欄型頁籤與搜尋工具列

---

## 9. 實作守則（必須遵守）

1. **禁止擅自變更主色系**。
2. **按鈕字級固定 14px**。
3. **H2 標題固定 18px**。
4. **所有新 UI 元件需符合現有配色、陰影與留白**。
5. **避免引入新的 UI library**，除非明確要求。
6. **新增或修改 UI 間距必須使用 CSS token 或既有共用 class**。
7. **禁止新增無規格來源的硬編碼 padding/gap/height/border-radius**；特殊情境必須加 `ui-token-exception` 註解。
8. **修改資料密集畫面時必須優先採用 compact density**。
9. **同一 Modal 內表格、輸入框、標題、統計卡的密度必須一致**。
10. **若發現既有 UI 密度不一致，應提出待辦並優先收斂到共用 token，而不是繼續新增局部覆蓋。**
11. **全域 shell（top navbar / sidebar / dropdown / alert / sidebar tabs）也屬統一規格範圍，不可繼續用局部硬編碼 spacing / radius 擴散。**

---

## 10. 新 UI 需求落地檢查清單

- [ ] 有使用主色與中性色規範
- [ ] 按鈕尺寸、圓角一致
- [ ] 狀態資訊使用 `.status-badge`
- [ ] 表格/卡片符合背景與邊框規範
- [ ] 互動狀態有 Hover/Focus 視覺回饋
- [ ] 間距、欄高、圓角使用 CSS token 或共用 class
- [ ] 未新增無註解的硬編碼 padding/gap/height/border-radius
- [ ] 資料密集畫面使用 compact density
- [ ] 同一 Modal / Card 內框線模型一致，沒有雙層粗框
- [ ] 表格、輸入框、下拉選單、統計列的可見密度一致

