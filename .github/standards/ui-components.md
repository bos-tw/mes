# MES UI 元件與 UX 契約

## 頁面結構

模組頁面維持：`content-header` → `content-area` → toolbar/filter → table/card → pagination → modal。模組根節點必須有 `data-module="snake_case"`。

- 內容標題使用 `.content-header`，有操作按鈕時加 `.with-actions`。
- 資料密集區塊使用既有 `.compact` 或 `.ui-compact-*` 共用 class。
- 不得新增 sticky header、另一套卡片外框或另一套頁面 shell。

## 按鈕

所有按鈕必須具備 `btn` 前綴、語意 class 與 `data-action`：

```html
<button type="button" class="btn primary" data-action="create">
    <i class="fas fa-plus" aria-hidden="true"></i> 新增
</button>
<button type="button" class="btn text danger" data-action="delete" title="刪除" aria-label="刪除">
    <i class="fas fa-trash" aria-hidden="true"></i>
</button>
```

禁止：`btn-primary`、`btn-danger`、`btn-icon`、只有 `primary`/`outline` 而沒有 `btn`、inline `onclick`、模組自行新增 action 顏色 class。

表格操作的顏色與 icon 必須符合既有 `data-action` 映射；若新增 action，先更新共用映射與本文件，再使用於模組。

表格操作欄統一使用 `.table-actions` 與 `.op-action-btn`：按鈕尺寸使用 `var(--ui-table-action-size)`，圖示字級使用 `var(--font-sm)`，按鈕間距使用 `var(--ui-table-action-gap)`。模組不得自行放大、縮小或改寫間距。

## 既有元件優先與視覺驗收（強制）

只要需求包含「比照系統」、「沿用既有風格／元件」、「相同大小」或提供既有畫面，以下規則一律適用：

1. 實作前必須先找出至少一個同類既有畫面或共用元件，並在開工回報中列出實際引用的檔案、selector／class 與適用原因。
2. 必須直接沿用既有 HTML 結構、共用 class、token、`data-action` 映射與互動契約；禁止以新增局部 CSS、固定 px、inline style 或近似配色／間距來模仿既有元件。
3. 表格內的 icon-only 操作必須使用共用 `.op-action-btn` 與既有角色樣式；搜尋與表單欄位必須沿用既有 `form-grid`、`inline-label`、`ui-compact-form-row` 或該目標畫面實際使用的共用結構。
4. 若確認不存在可重用元件，必須先回報缺口與預計新增的共用契約，取得使用者同意後才能新增；不得在模組內私自建立第二套樣式。
5. UI/CSS 驗收必須以實際可登入畫面與引用畫面逐項比較大小、間距、顏色、icon、欄位結構與互動；靜態檢查不能取代視覺驗收。無法取得可用瀏覽器時，必須明確標示「視覺驗收未完成」，不得宣稱 UI DoD 完成。

## Icon 與可用性

- 使用 Font Awesome：配置檔使用 `fa-*`，HTML/JS 渲染使用 `fas fa-*`。
- 不使用 emoji 或 Unicode 圖案作正式功能 icon。
- icon-only 按鈕必須有 `title` 與 `aria-label`。
- 不得只用顏色傳達狀態，必須同時提供文字、icon 或 aria 資訊。

## Modal

- 尺寸使用 `.modal-window.small|medium|large|xlarge`，不得使用 `modal-window-large`。
- 所有標準 Modal 必須由共用 `.modal-overlay` 與 `--ui-modal-top-offset` 固定上緣；禁止模組自行改回垂直置中，避免內容或頁籤高度改變時整個視窗上下跳動。
- 關閉按鈕使用 `data-action="close-modal"` 並提供 `aria-label`。
- 表單必須有 hidden `id`，欄位操作需先確認元素存在。
- 危險或流程型操作使用自訂確認 Modal，內容要說明流程節點、影響與合法動作；不得只顯示無上下文的原生 `confirm()`。

## 表格、表單與 inline style

- 表格欄位、表單 control、section 與 card 使用共用 token/class。
- 主資料表欄寬由 `TableColumnResizer` 共用管理：拖曳標題分隔線可調寬，雙擊分隔線依標題與目前資料自動適寬；序號、勾選、操作欄及 `data-no-column-resize` 欄位不開放調整。
- 模組不得自行建立另一套欄寬拖曳邏輯；整張表不需此功能時使用 `data-no-column-resize="true"`。
- `modules/` HTML 禁止新增 inline style；欄位寬度使用既有 utility class。
- 只有 `display:none` 的歷史相容例外可保留，新增內容不得仿效。
- 動態資料插入 `innerHTML` 前必須使用共用 `escapeHtml()`；data attribute 內嵌 JSON 必須使用 `encodeURIComponent()`。

## 登入品牌元件

`.brand-logo` 固定 76px、直角、淺灰底與灰框；這是品牌元件特例，不可用一般卡片 token 任意改成圓角或綠色底。
