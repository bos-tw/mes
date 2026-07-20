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

## Icon 與可用性

- 使用 Font Awesome：配置檔使用 `fa-*`，HTML/JS 渲染使用 `fas fa-*`。
- 不使用 emoji 或 Unicode 圖案作正式功能 icon。
- icon-only 按鈕必須有 `title` 與 `aria-label`。
- 不得只用顏色傳達狀態，必須同時提供文字、icon 或 aria 資訊。

## Modal

- 尺寸使用 `.modal-window.small|medium|large|xlarge`，不得使用 `modal-window-large`。
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
