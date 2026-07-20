# MES UI Token 規範

本文件定義新增或修改 UI/CSS 時可使用的視覺基礎。實際 token 定義位於根目錄 `styles.css` 的 `:root`；文件不得另建一套同名或近似 token。

## 色彩

新 CSS 優先使用下列 token，不得直接寫 HEX/RGB 顏色：

| 語意 | 正式 token |
|---|---|
| 品牌/主要動作 | `var(--color-primary)` |
| 主要動作 hover | `var(--color-primary-hover)` |
| 主要色淺底 | `var(--color-primary-light)` |
| 危險 | `var(--color-danger)` |
| 危險 hover | `var(--color-danger-hover)` |
| 警告 | `var(--color-warning)` |
| 資訊 | `var(--color-info)` |
| 主要文字 | `var(--color-text-primary)` |
| 次要/弱化文字 | `var(--color-text-secondary)`、`var(--color-text-muted)` |
| 背景 | `var(--color-bg)`、`var(--color-bg-light)` |
| 邊框 | `var(--color-border)`、`var(--color-border-light)` |

目前品牌主色是綠色系（`--color-primary`），不是藍色系。編輯、檢視、列印等表格操作的語意色由共用 action 樣式管理，不得在模組中自行覆寫。

## 字體

- 預設內容字級使用 `var(--font-base)`（目前 14px）。
- 其他字級使用既有 `--font-xs`、`--font-sm`、`--font-md`、`--font-lg`、`--font-xl`、`--font-2xl`、`--font-3xl`、`--font-4xl`。
- 正式 UI 字體不得低於 12px；列印固定版面可使用專用例外並註明原因。

## 密度與 spacing

MES 是資料密集型後台，預設為 `compact`。優先使用下列 token：

- 區塊：`--ui-section-padding-*`、`--ui-section-gap`
- 控制項：`--ui-control-height`、`--ui-control-padding-*`
- 表格：`--ui-table-cell-padding-*`、`--ui-table-header-padding-*`
- 表格操作：`--ui-table-action-size`、`--ui-table-action-gap`
- 表格欄寬：`--ui-table-column-min-width`、`--ui-table-column-max-width`、`--ui-table-resize-handle-width`
- 卡片/統計：`--ui-card-padding-*`、`--ui-metric-*`
- shell：`--ui-shell-*`

不得新增沒有規格來源的 `padding`、`gap`、`height`、`min-height`、`margin` 或近似 radius。既有 CSS 的歷史值不應複製到新元件。

## 圓角

優先使用：

- 控制項：`var(--ui-radius-control)`
- 卡片：`var(--ui-radius-card)`
- 面板：`var(--ui-radius-panel)`
- Badge/pill：`var(--ui-radius-pill)` 或 `var(--ui-badge-radius)`

登入頁 `.brand-logo` 是特殊品牌元件，維持直角規範；不可把一般卡片的圓角套用到它。

## 合法例外

只有下列情況可使用固定值，且 CSS 前必須有註解：

```css
/* ui-token-exception: A4 列印版面需要固定毫米尺寸。 */
```

- A4/列印模板的毫米尺寸
- QR Code、Canvas、固定比例圖片
- 第三方套件相容
- 分隔線、透明遮罩或純幾何裝飾
- 經驗證需要固定尺寸的品牌元件

例外不能用來合理化一般表格、表單、Modal 或卡片的局部 spacing。
