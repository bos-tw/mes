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
| 一般操作 | `btn text` | 藍色 (#007bff) | 編輯、檢視、前往 |
| 危險操作 | `btn text danger` | 紅色 (#dc3545) | 刪除 |
| 列印操作 | `btn text` + `data-action="print"` | 青色 (#17a2b8) | 列印 |

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

- **`.btn.text`（一般操作）**：
  - 背景：`#007bff`（藍色）
  - 文字：白色
  - 尺寸：30x30px
  - 圓角：4px
  - Hover：`#0056b3` + 輕微上移效果

- **`.btn.text.danger`（危險操作）**：
  - 背景：`#dc3545`（紅色）
  - Hover：`#a71d2a`

- **特殊操作自動顏色**：
  - `data-action="print"`：青色 (#17a2b8)
  - `data-action="details"`：橘色 (#ff9800)
  - `data-action="copy-order-item"`：紫色 (#9c27b0)
  - `data-action="create-work-order"`：黃色 (#FFC107)

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

### 4.8 表單（Form）
- **輸入框**：圓角 6px，邊框 `#ddd`
- **Focus**：主色系邊框或陰影
- **Label**：深灰 `#2f3b4c`

### 4.9 Modal / Card
- **卡片**：白色背景、圓角 10~12px、微陰影
- **Modal**：置中顯示、層次感明確

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
- `.btn.text.purple`：表格操作按鈕-檢視（紫底）
- `.btn.text.danger`：表格操作按鈕-刪除（紅底）
- `.status-badge`：狀態徽章
- `.link-text`：藍色連結樣式
- `.subtext`：表格內次要文字
- `.row-inactive`：不活躍列
- `.sidebar-toggle`：側欄收合按鈕

---

## 9. 實作守則（必須遵守）

1. **禁止擅自變更主色系**。
2. **按鈕字級固定 14px**。
3. **H2 標題固定 18px**。
4. **所有新 UI 元件需符合現有配色、陰影與留白**。
5. **避免引入新的 UI library**，除非明確要求。

---

## 10. 新 UI 需求落地檢查清單

- [ ] 有使用主色與中性色規範
- [ ] 按鈕尺寸、圓角一致
- [ ] 狀態資訊使用 `.status-badge`
- [ ] 表格/卡片符合背景與邊框規範
- [ ] 互動狀態有 Hover/Focus 視覺回饋

