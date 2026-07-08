# UI 統一化 Reference（2026-07-08）

## 1. 目標

這份文件是 UI 統一化的實作對照表，讓後續開發直接知道：

- 哪些 token 應優先使用
- 哪些 utility class 已可直接套用
- 哪些全域骨架已納入統一規格
- 哪些情境必須標註 `ui-token-exception`

## 2. 核心 Token

主要定義位置：`styles.css :root`

### 密度 / 間距

- `--ui-section-padding-y`
- `--ui-section-padding-x`
- `--ui-section-gap`
- `--ui-control-height`
- `--ui-control-padding-y`
- `--ui-control-padding-x`
- `--ui-card-padding-y`
- `--ui-card-padding-x`
- `--ui-table-cell-padding-y`
- `--ui-table-cell-padding-x`
- `--ui-table-header-padding-y`
- `--ui-table-header-padding-x`

### 圓角

- `--ui-radius-control`
- `--ui-radius-card`
- `--ui-radius-panel`
- `--ui-radius-pill`

### 全域 shell / dropdown / alert

- `--ui-shell-header-padding-y`
- `--ui-shell-header-padding-x`
- `--ui-shell-content-padding`
- `--ui-sidebar-width`
- `--ui-sidebar-collapsed-width`
- `--ui-dropdown-toggle-padding-y`
- `--ui-dropdown-toggle-padding-x`
- `--ui-dropdown-item-padding-y`
- `--ui-dropdown-item-padding-x`
- `--ui-alert-padding-y`
- `--ui-alert-padding-x`
- `--ui-alert-modal-padding-y`
- `--ui-alert-modal-padding-x`

## 3. 共用 Utility Class

### `.ui-compact-section`

用途：

- 後台 card / section / modal subsection
- 需要 compact padding、統一 border、統一 radius 的區塊

建議搭配：

- `.form-section`
- `.subsection`
- `details` / collapsible block

### `.ui-compact-table`

用途：

- 資料密集型 table
- detail modal 內的子表
- 附件、追溯、履歷、品項、服務明細表

### `.ui-compact-form-row`

用途：

- inline label + input/select/textarea
- modal 內左右分欄的 label/control row

### `.ui-metric-card`

用途：

- 統計卡
- 側欄 metrics
- 工單平衡卡、比較卡、摘要卡

### `.ui-metric-row`

用途：

- 單列 label/value 統計資料
- 需要上下分隔線、左右對齊的資訊列

## 4. 全域骨架現況

目前已納入 token 收斂：

- `top navbar`
- `user dropdown`
- `sidebar`
- `sidebar tabs`
- `folder tabs`
- `module-alert`
- `modal-alert`
- `weight-variance-alert`

後續新增全域 UI 時，應先沿用現有 token，不應再局部硬編碼：

- `padding: 10px 12px`
- `gap: 8px`
- `border-radius: 6px`

## 5. 建議套用順序

1. 先判斷能否直接用 utility class。
2. 若 utility class 不足，再補 token 化樣式。
3. 若是全域骨架，優先擴充既有 shell token。
4. 只有在固定尺寸不可避免時，才新增 `ui-token-exception`。

## 6. `ui-token-exception` 規則

適用情境：

- A4 / 列印毫米定位
- QR / barcode / canvas 固定尺寸
- 無障礙隱藏元素的 1px pattern
- 必須維持固定 viewport / media 尺寸的 layout

範例：

```css
/* ui-token-exception: 列印 A4 固定毫米定位，不能改成一般 UI density token。 */
@page {
  margin: 12mm;
}
```

## 7. 本輪已驗證模組

- `work_orders`
- `order_items`
- `production_work_order_schedule`
- `shipping_orders`
- `return_orders`
- `inventory_items`
- `inventory_transactions`

## 8. 一鍵更新前建議流程

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\prepare-one-click-update.ps1 `
  -VersionNumber "v3.0.20" `
  -FileVersion "v3.0.20" `
  -ReleaseDate "2026-07-08" `
  -ChangeSummaryFile "release-notes/2026-07-08-v3.0.20.txt"
```

若只要先預檢：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\prepare-one-click-update.ps1 -SkipPackageBuild
```

若要單獨驗證已產出的更新包：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\verify-update-package.ps1 `
  -ZipPath ".\dist\update_v3.0.20_20260708_183700.zip" `
  -ExpectedVersionNumber "v3.0.20" `
  -ExpectedFileVersion "v3.0.20" `
  -ExpectedReleaseDate "2026-07-08"
```
