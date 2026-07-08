# UI 統一化待辦事項（2026-07-08）

## 目標

建立 MES 全系統一致的 UI 密度、CSS token、表格/表單/Modal/統計卡規格，逐步移除零散硬編碼 spacing，讓畫面維持高資訊密度、清楚區隔與可長時間操作。

## 核心原則

- 預設使用 compact density，除非是危險操作、流程守門或說明型內容。
- 新增或重構 UI spacing 必須優先使用 `:root` token 或共用 class。
- 不再用局部 `padding`、`gap`、`height` 補丁處理單一畫面，避免風格繼續分裂。
- 表格、輸入框、下拉選單、區塊標題、統計側欄需使用一致的密度規格。
- 有特殊固定尺寸需求時，必須加 `ui-token-exception` 註解並說明原因。

## P0：規範與基礎建置

- [x] 更新 `.github/copilot-instructions.md`，加入 UI density 與 CSS token 強制規範。
- [x] 更新 `.github/skills/ui-style.md`，補齊 compact density、雙層框線、統計側欄規範。
- [x] 更新 `.github/skills/css-style-guide.md`，補齊 UI token、密度、落地流程。
- [x] 在 `styles.css` 的 `:root` 補齊 `--ui-*` token，並確認命名不與既有 token 衝突。
- [x] 建立或擴充 UI style audit 工具，至少能列出新增硬編碼 `padding`、`gap`、`height`、`min-height`、`border-radius`。
- [x] 產出目前 `styles.css` hardcoded spacing baseline，作為後續逐步收斂依據。

## P0 Baseline：`styles.css` hardcoded spacing / radius 掃描

掃描日期：2026-07-08

掃描範圍：`styles.css`

掃描屬性：`padding*`、`gap`、`row-gap`、`column-gap`、`height`、`min-height`、`max-height`、`border-radius*`、`margin*`

排除條件：已使用 `var(...)`、值為 `0` 的 reset / 清除規則。

### 總覽

| 類型 | 筆數 |
|------|------|
| hardcoded spacing / radius 總筆數 | 1160 |
| 初步可 token 化候選 | 629 |
| 需要人工判斷候選 | 55 |
| 工單 / 工單編輯相關候選 | 341 |

### 屬性分布

| 屬性 | 筆數 |
|------|------|
| `padding` | 302 |
| `gap` | 235 |
| `border-radius` | 150 |
| `height` | 95 |
| `margin-bottom` | 93 |
| `min-height` | 91 |
| `margin-top` | 52 |
| `margin` | 26 |
| `max-height` | 23 |
| `padding-bottom` | 20 |
| `margin-right` | 16 |
| `margin-left` | 14 |
| `padding-left` | 14 |
| `padding-right` | 14 |
| `padding-top` | 11 |

### 常見硬編碼值

| 值 | 筆數 | 建議 |
|----|------|------|
| `gap: 8px` | 53 | 改用 `--ui-section-gap` 或元件專用 gap token |
| `gap: 12px` | 46 | 檢查是否應收斂到 `--ui-section-gap` 或 normal density token |
| `border-radius: 6px` | 44 | 檢查是否收斂到 `--ui-radius-control` / `--ui-radius-card` |
| `gap: 10px` | 41 | 工單 Modal 內優先收斂，避免 8/10/12 混用 |
| `border-radius: 4px` | 35 | 多數可改用 `--ui-radius-control` |
| `border-radius: 8px` | 25 | 多數可改用 `--ui-radius-card` / `--ui-radius-panel` |
| `padding: 10px 12px` | 25 | 多數 section / card 可改用 `--ui-card-padding-*` |
| `margin-bottom: 12px` | 22 | 多數可改用 `--ui-section-gap` 或 section stack token |
| `padding: 8px 10px` | 14 | compact section 候選 |
| `height: 32px` | 14 | control height 候選 |
| `padding: 4px 8px` | 12 | control / label padding 候選 |
| `min-height: 32px` | 11 | control height 候選 |
| `padding: 6px 8px` | 11 | table / compact row 候選 |

### 模組分布

| 區域 | 筆數 | 優先度 |
|------|------|--------|
| 未分類 / 舊式全域樣式 | 539 | P2-P4 逐步整理 |
| 工單 / 工單編輯 | 341 | P1 優先 |
| 共用 table / form / modal | 162 | P2 優先 |
| 全域 shell / sidebar / toolbar | 75 | P2-P3 |
| 配置型模組 | 25 | P3，需搭配 `validate-config-modules` |
| 訂單 | 11 | P3 |
| 庫存 / 入庫 / 出貨 | 4 | P3 |
| print / QR / 固定媒體 | 3 | 多數應保留例外並加註解 |

### 待 token 化清單狀態

本段是 P0 baseline 掃描時的「候選類型盤點」，不是持續逐條打勾的 active todo。以下改為反映目前去向：

- [x] `gap: 8px`、`gap: 10px`、`gap: 12px`
  已在 P1/P2 先收斂工單 Modal、共用表單、toolbar、filter、metrics；剩餘多數分布在全域 shell、dropdown、sidebar，轉入 P3/P4。
- [x] `padding: 4px 6px`、`padding: 4px 8px`、`padding: 6px 8px`
  已建立 table cell、control、inline label token 與 utility class；剩餘需配合模組逐步替換。
- [x] `padding: 8px 10px`、`padding: 10px 12px`、`padding: 12px 16px`
  已建立 section/card/header token，並套用到工單 Modal、共用 section、pagination / filter 區。
- [~] `height: 32px`、`min-height: 32px`、`min-height: 34px`、`height: 36px`
  已處理主要 control / button 高度；剩餘包含 icon button、固定表格高度、模組特殊欄位，保留到 P3/P4 人工判斷。
- [x] `border-radius: 4px`、`6px`、`8px`、`10px`、`12px`
  已建立 `--ui-radius-control`、`--ui-radius-card`、`--ui-radius-panel`，並套用到 P1/P2 已收斂區域；剩餘多在舊全域樣式。
- [~] `margin-bottom: 8px`、`10px`、`12px`、`16px`
  已在共用 section / metrics / toolbar / pagination 引入 token；但全域 shell、alert、dropdown 仍需在 P3/P4 補齊對應規則。
- [ ] `height: 100%`、`height: 100vh`、`max-height: 90vh`、`max-height: 500px`
  仍列為 layout 尺寸候選，暫不直接納入 compact density token，待後續建立 layout size 規則再處理。
- [ ] `@page margin: 12mm`、QR / barcode / print / canvas 固定尺寸
  仍列為 `ui-token-exception` 候選，待 P4 整理例外註解策略時補齊。

### P1 優先處理 selector 群狀態

本段原本是 P0 掃描後列出的「優先 selector 候選」。其中大多數已在 P1 實作中吸收，不應再視為未開始。

- [x] `[data-work-orders-edit-modal] .modal-window.work-orders-modal`
- [x] `[data-work-orders-edit-modal] .work-order-edit-summary-grid select`
- [x] `[data-work-orders-edit-modal] .work-order-edit-schedule-grid select`
- [x] `[data-work-orders-edit-modal] .production-records-table select`
- [x] `[data-work-orders-edit-modal] .work-order-edit-detail-section label.inline-label select`
- [x] `[data-work-orders-edit-modal] .work-order-edit-drawing-card`
- [x] `[data-work-orders-edit-modal] .work-order-edit-production-records`
- [x] `[data-work-orders-edit-modal] .work-order-edit-service-section .table-responsive`
- [x] `[data-work-orders-edit-modal] .work-order-edit-service-section td`
- [x] `.work-orders-metrics-sidebar`
- [x] `.work-orders-metrics-sidebar .metrics-panel`
- [x] `.work-orders-metrics-sidebar .metric`
- [x] `.work-order-balance-card .metric`

補充：

- 上述 selector 已完成主要 token 化與框線模型收斂。
- 目前未完成的不是 selector 實作本身，而是 P1 驗收截圖與剩餘固定版面尺寸的後續判斷。

## P1：工單編輯 Modal 優先收斂

- [x] 將工單編輯 Modal 的 section padding、title padding、表格 cell padding 改用 `--ui-*` token。
- [x] 將工單編輯 Modal 的 input/select/searchable select 高度與 padding 改用 token。
- [x] 將「圖面附件」與「客戶載具紀錄與遺留分析」兩個同級區塊套用共用 layout class。
- [x] 將右側統計側欄的 card、metric row、label badge 改用 token。
- [x] 檢查並移除雙層框線：inline label、select wrapper、searchable select、section header。
- [ ] 驗收截圖：訂單詳細資訊、生產排程、部分入庫歷程、篩分明細、右側統計卡。

### P1 掃描結果

掃描日期：2026-07-08

範圍：`[data-work-orders-edit-modal]`、`.work-orders-metrics-sidebar`、`.work-order-balance-card`、`.work-order-tool-analysis-*`、`.production-records-table`

| 項目 | 筆數 |
|------|------|
| P0 baseline 工單 / 工單編輯相關候選 | 341 |
| P1 token 化後剩餘 hardcoded spacing / radius | 33 |

剩餘 33 筆主要屬於固定版面尺寸，例如 Modal 視窗高度、固定表格高度、隱藏 label 的 `1px` accessibility pattern、特定區塊 `min-height`。這些暫不直接改為 density token，避免影響目前工單編輯 Modal 的可視高度與滾動行為；後續若建立 layout size token，再納入 P2/P4 整理。

## P2：共用元件收斂

- [x] 收斂 `.data-table` / 模組內表格 padding、字級、表頭高度。
- [x] 收斂 `.form-grid`、`.form-section`、`.inline-label`、`.form-actions`。
- [x] 收斂 `.modal-window`、modal header、modal body、modal footer。
- [x] 收斂 `.module-toolbar`、filter row、pagination。
- [x] 建立共用 utility class：compact section、compact table、compact form row、metric card。

### P2-3：Toolbar / Filter / Pagination 收斂待辦

- [x] 掃描 `.module-toolbar`、`.filter-form`、`.filter-row`、`.pagination` 目前 hardcoded spacing / radius。
- [x] 將 `.module-toolbar` 外距、內距、gap 改用 `--ui-*` token。
- [x] 將 `.filter-form` / `.filter-form .form-grid` 的 gap、label、input/select 高度改用 `--ui-*` token。
- [x] 將 `.filter-form .form-actions` 與查詢/重置按鈕高度、padding、radius 改用 `--ui-*` token。
- [x] 將 `.pagination` gap、margin、button padding/radius 改用 `--ui-*` token。
- [x] 確認列表頁查詢列在桌機與窄版寬度下不換行錯亂。
- [x] 執行 `node tools/audit-ui-style.js --write docs/ui-style-audit.md` 更新報告。
- [x] 執行 `node tools/audit-system-health.js --changed --base origin/main`。

### P2-4：共用 Utility Class 建立待辦

- [x] 建立 `.ui-compact-section`，統一 section/card padding、border、radius。
- [x] 建立 `.ui-compact-table`，統一 table cell padding、表頭 padding、字級。
- [x] 建立 `.ui-compact-form-row`，統一 inline label、control height、control padding。
- [x] 建立 `.ui-metric-card` / `.ui-metric-row`，統一統計卡 label/value layout。
- [x] 補充 utility class 使用規則到 `.github/skills/css-style-guide.md`。
- [x] 補充 utility class 使用規則到 `.github/skills/ui-style.md`。
- [x] 選 1-2 個低風險畫面試套 utility class，確認不破壞既有排版。
- [x] 執行 `node tools/audit-ui-style.js --write docs/ui-style-audit.md` 更新報告。
- [x] 執行 `node tools/audit-system-health.js --changed --base origin/main`。

### P2-3 / P2-4 完成紀錄

完成日期：2026-07-08

- `.module-toolbar`、`.filter-summary-bar`、`.filter-form`、`.filter-form-drawer`、`.pagination` 已改用 `--ui-*` spacing/radius/control token。
- `.dashboard-section .module-toolbar.compact` 已同步改用 token，避免 dashboard toolbar 形成第二套 padding。
- 已建立 `.ui-compact-section`、`.ui-compact-table`、`.ui-compact-form-row`、`.ui-metric-card`、`.ui-metric-row`。
- 低風險試套範圍：工單編輯 Modal 的圖面附件、客戶載具紀錄與遺留分析、部分入庫歷程表、右側統計卡與工單數量平衡卡。
- 本次未新增 `ui-token-exception`。

### P2-1 掃描結果

掃描日期：2026-07-08

範圍：`.data-table`、`.form-grid`、`.form-section`、`.inline-label`、`.form-actions`、`.modal-window`

| 項目 | 筆數 |
|------|------|
| P2-1 token 化後剩餘 hardcoded spacing / radius | 25 |

剩餘項目主要是 checkbox 固定尺寸、Modal 最大高度、客戶/供應商附件欄位、number-sequences 特殊欄位高度。這些暫不納入共用 density token，避免把特定模組的版面限制誤轉為全域規則；後續應由 P2-2 audit 工具標記，或在 P3 模組收斂時逐一判斷是否補 `ui-token-exception`。

### P2-2：UI Style Audit 工具

- [x] 新增 `tools/audit-ui-style.js`。
- [x] 支援預設掃描 `styles.css`，也可指定 CSS 檔案。
- [x] 支援 human / JSON 輸出。
- [x] 支援 `--write docs/ui-style-audit.md` 產生 Markdown 報告。
- [x] 支援偵測 `ui-token-exception:` 註解。
- [x] 支援 `--fail-on-issues` 作為未來 CI / health gate 使用。

#### P2-2 掃描結果

掃描日期：2026-07-08

指令：

```bash
node tools/audit-ui-style.js --write docs/ui-style-audit.md
```

| 項目 | 筆數 |
|------|------|
| hardcoded spacing / radius 總筆數 | 927 |
| token candidates | 480 |
| needs review | 447 |
| covered by `ui-token-exception` | 0 |

目前工具先作為「報告型」工具，不預設 fail，避免既有歷史樣式阻擋開發。後續若要納入守門，建議先建立 baseline，再只對新增/變更區塊啟用 `--fail-on-issues`。

## P3：配置型與主流程模組套用

- [~] 逐一套用配置型模組，並跑 `node tools/validate-config-modules.js`。
- [~] 逐一套用訂單、工單、入庫、出貨、庫存、篩分等主流程模組。
- [x] 檢查 `index.html` 與 `index.php` 主入口、側邊欄、共用載入區是否一致。
- [~] 若涉及 DataSync / CRUD 狀態顯示，依規範跑 DataSync 檢查。

補充：

- 已完成 `work_orders`、`order_items`、`production_work_order_schedule`、`shipping_orders`、`return_orders`、`inventory_items`、`inventory_transactions` 第一批收斂。
- 已確認 `index.html` 已統一轉導至 `index.php`，主入口雙軌未再分裂；後續若改入口仍需同步檢查 redirect / asset load 行為。
- 目前主流程 UI 統一化整體估算進度約 `83% - 86%`；剩餘主要集中在少數舊模組私有樣式、歷史 spacing override 清理、P4 文件範例與治理收尾。
- DataSync 三項檢查已在本輪涉及的排程、出貨、退貨、庫存異動鏈路執行，未新增新的阻擋問題。

### P3-1：`order_items` 第一批收斂

- [x] 將 `order_items` Modal 的附件 / 載具 / 篩分服務 subsection 套用 `ui-compact-section`。
- [x] 將 `order_items` Modal 內 `data-table compact` 子表套用 `ui-compact-table`。
- [x] 將 `order_items` Modal footer metrics 區塊套用 `ui-metric-card`。
- [x] 將 `order_items` 私有樣式的 inline panel、inline table、modal body、modal footer spacing 改用 `--ui-*` token。
- [x] `order_items` 屬混合配置模組，修改前後均執行 `node tools/validate-config-modules.js`。
- [x] 更新 `docs/ui-style-audit.md`。
- [x] 執行 `node tools/audit-system-health.js --changed --base origin/main`。

補充：

- 本批優先收斂 Modal 內高密度區塊，不調整配置生成的 header / table shell，避免混合模式造成不必要風險。
- 本批未涉及 DataSync 檢查項，也未新增 `ui-token-exception`。
- 本批完成後，`docs/ui-style-audit.md` 最新統計為：總筆數 `878`、token candidates `454`、needs review `424`。

### P3-2：`production_work_order_schedule` 第一批收斂

- [x] 將 `production_work_order_schedule` 四張 compact table 套用 `ui-compact-table`。
- [x] 將排程檢視 Modal 的 `form-section` 套用 `ui-compact-section`。
- [x] 將模組私有 toolbar、machine filter、column header、column card、split badge spacing / radius 改用 `--ui-*` token。
- [x] 更新 `docs/ui-style-audit.md`。
- [x] 執行 `node tools/audit-system-health.js --changed --base origin/main`。
- [x] 因模組涉及前端狀態 / DataSync 生態，補跑 DataSync 三項檢查。

補充：

- 本批聚焦排程主畫面與檢視 Modal 的密度一致性，未修改排程拖拉、儲存與 DataSync 業務邏輯。
- 本批未新增 `ui-token-exception`。
- 本批完成後，`docs/ui-style-audit.md` 最新統計為：總筆數 `868`、token candidates `446`、needs review `422`。
- DataSync 三項檢查已完成，`docs/data-sync-audit.md` 已更新；其中 `production_work_order_schedule` 仍有既有 `P2` 提示 `crud_module_without_dependents`，屬現存治理議題，非本批新增。

### P3-3：`shipping_orders` 第一批收斂

- [x] 將 `shipping_orders` 配置檔 customHtml 的載具摘要表套用 `ui-compact-table`。
- [x] 將 `shipping_order_return_modals.html` 的 `form-section` 套用 `ui-compact-section`。
- [x] 將 `shipping_order_return_modals.html` 的退貨品項表套用 `ui-compact-table`。
- [x] 將 `shipping_orders` 詳情彈窗內各張 `data-table compact` 子表套用 `ui-compact-table`。
- [x] 將全域 `detail-section` / `subsection-actions` 的 spacing、padding、radius 收斂到 `--ui-*` token。
- [x] 因涉及配置型模組，執行 `node tools/validate-config-modules.js`。
- [x] 因涉及前端 CRUD / 狀態 / DataSync 生態，補跑 DataSync 三項檢查。
- [x] 更新 `docs/ui-style-audit.md`。
- [x] 執行 `node tools/audit-system-health.js --changed --base origin/main`。

補充：

- 本批聚焦出貨單 detail / return flow 的高密度區塊，不變更出貨、退貨、品質檢驗、追溯流程邏輯。
- 本批未新增 `ui-token-exception`。
- 本批完成後，`docs/ui-style-audit.md` 最新統計為：總筆數 `860`、token candidates `441`、needs review `419`。
- DataSync 三項檢查已完成，`docs/data-sync-audit.md` 已更新；本批未新增新的 DataSync 問題，既有 `P2` 提示仍與 `production_work_order_schedule` 等舊治理項有關。

### P3-4：`return_orders` 第一批收斂

- [x] 將 `return_orders.html` 的 Modal `form-section` 套用 `ui-compact-section`。
- [x] 將 `return_orders.html` 的退貨品項表套用 `ui-compact-table`。
- [x] 將 `return_orders` 詳情彈窗的退貨品項表套用 `ui-compact-table`。
- [x] 因模組屬混合配置模式，執行 `node tools/validate-config-modules.js`。
- [x] 因模組涉及前端 CRUD / 狀態 / DataSync 生態，補跑 DataSync 三項檢查。
- [x] 更新 `docs/ui-style-audit.md`。
- [x] 執行 `node tools/audit-system-health.js --changed --base origin/main`。

補充：

- 本批聚焦退貨單 Modal 與 detail 內高密度區塊，不變更退貨建立、刪除、二次篩選串接邏輯。
- 本批未新增 `ui-token-exception`。
- 本批完成後，`docs/ui-style-audit.md` 最新統計維持：總筆數 `860`、token candidates `441`、needs review `419`。
- DataSync 三項檢查已完成，`docs/data-sync-audit.md` 已更新；本批未新增新的 DataSync 問題，既有 `P2` 提示仍為舊治理項。

### P3-5：`inventory_items` 第一批收斂

- [x] 將 `inventory_items` 出貨 Modal 的三個 `form-section` 套用 `ui-compact-section`。
- [x] 將 `inventory_items` 出貨 Modal 的 inline label 套用 `ui-compact-form-row`。
- [x] 將 `inventory_items` detail 內的出貨履歷 / 異動記錄表套用 `ui-compact-table`。
- [x] 因模組屬配置型鏈路，執行 `node tools/validate-config-modules.js`。
- [x] 因模組涉及前端 CRUD / 狀態 / DataSync 生態，補跑 DataSync 三項檢查。
- [x] 更新 `docs/ui-style-audit.md`。
- [x] 執行 `node tools/audit-system-health.js --changed --base origin/main`。

補充：

- 本批聚焦庫存項目出貨 Modal 與 detail table 的密度一致性，不變更加入出貨單、來源追溯與庫存計算邏輯。
- 本批未新增 `ui-token-exception`。
- 本批完成後，`docs/ui-style-audit.md` 最新統計為：總筆數 `857`、token candidates `439`、needs review `418`。
- DataSync 三項檢查已完成，`docs/data-sync-audit.md` 已更新；本批未新增新的 DataSync 問題。

### P3-6：`inventory_transactions` 第一批收斂

- [x] 移除 `inventory_transactions` detail modal 的 inline spacing style，改回共用 `detail-grid` / `detail-section` class。
- [x] 新增 `detail-grid-two-column`、`detail-section-spaced-top`、`detail-inline-note` 共用樣式，改用 `--ui-*` token 控制間距。
- [x] 將 `detail-note-stack` 收斂到 `--ui-*` token，避免 detail 區域再維持第二套 padding / radius。
- [x] 執行 `node --check js/inventory_transactions.js`。
- [x] 因模組涉及前端 CRUD / 狀態 / DataSync 生態，補跑 DataSync 三項檢查。
- [x] 更新 `docs/ui-style-audit.md`。
- [x] 執行 `node tools/audit-system-health.js --changed --base origin/main`。

補充：

- 本批聚焦 detail modal 呈現層，不調整庫存異動列表、篩選、摘要與 API 載入邏輯。
- 本批未新增 `ui-token-exception`。
- 本批完成後，`docs/ui-style-audit.md` 最新統計延續為：總筆數 `857`、token candidates `439`、needs review `418`。
- DataSync 三項檢查已完成，`docs/data-sync-audit.md` 已更新；本批未新增新的 DataSync 問題。

### P3-7：全域 shell / sidebar / dropdown / alert 第一批收斂

- [x] 將 top navbar、badge、user dropdown、sidebar、tab header、folder tab 的 spacing / radius 收斂到 `--ui-*` token。
- [x] 將 `module-alert`、`modal-alert`、`weight-variance-alert` 的 padding / radius / gap 收斂到 `--ui-*` token。
- [x] 將 sidebar tabs / toolbar / search input / filter select 的 spacing / radius 收斂到 `--ui-*` token。
- [x] 更新 `.github/skills/ui-style.md` 與 `.github/skills/css-style-guide.md` 的全域 shell 規範。
- [x] 更新 `docs/ui-style-audit.md`。
- [x] 執行 `node --check tools/audit-system-health.js`。
- [x] 執行 `node tools/audit-system-health.js --changed --base origin/main`。

補充：

- 本批聚焦全域骨架與高覆用提示元件，不變更 sidebar 行為、登入/登出流程、通知/留言業務邏輯。
- 本批未新增 `ui-token-exception`。
- 本批完成後，`docs/ui-style-audit.md` 最新統計為：總筆數 `786`、token candidates `408`、needs review `378`。
- `audit-system-health.js` 已整合 UI style audit 摘要，`--changed` 模式下會自動顯示目前 token 化掃描結果，作為 PR / changed-scope 審計的一部分。

## P4：驗收與防回歸

- [x] 將 UI style audit 納入例行健康檢查或 PR 檢查流程。
- [~] 清理不再使用的舊 spacing override。
- [x] 補齊文件中的元件範例截圖或 reference section。
- [x] 每輪 UI 統一工作完成後，更新本文件剩餘項目與已驗收範圍。
- [x] 建立可執行的一鍵更新前預檢入口，避免手動遺漏 UI / DataSync / schema / package 檢查。

### P4-1：健康檢查閉環

- [x] `tools/audit-system-health.js` 新增 UI style audit 摘要整合。
- [x] `--changed --base origin/main` 模式會自動顯示 UI style audit 統計。
- [x] 保持 UI style audit 為「摘要型守門」，先不直接 block 歷史 token candidate，避免舊樣式一次性阻擋開發。
- [ ] 後續若要升級為硬性守門，需先建立 changed-scope / baseline 化策略。

### P4-2：一鍵更新前預檢閉環

- [x] 新增 `tools/prepare-one-click-update.ps1`，整合 config validation、UI style audit、DataSync audit、schema dry-run、changed health audit、package build。
- [x] 新增 `tools/verify-update-package.ps1`，可單獨驗證 `dist/update_*.zip` 的 manifest 與 ZIP 結構。
- [x] 補一份可直接出包的 release note 草稿：`release-notes/2026-07-08-v3.0.20.txt`。
- [x] 補一份 UI 統一化 reference：`docs/ui-standardization-reference-2026-07-08.md`。
- [x] 一鍵更新前預設會刷新 `docs/ui-style-audit.md` 與 `docs/data-sync-audit.md`，避免文件與出包內容脫節。
- [x] 一鍵更新前預設會執行 `git diff --check`，先攔截 whitespace / 格式問題。
- [x] 以暫定版號 `v3.0.20` 實跑 package build，確認可產出 `dist/update_*.zip`。
- [x] package build 後已接續執行 ZIP 驗證，確認 manifest/version/files_root 結構正確。

建議指令：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\prepare-one-click-update.ps1 `
  -VersionNumber "v3.0.20" `
  -FileVersion "v3.0.20" `
  -ReleaseDate "2026-07-08" `
  -ChangeSummaryFile "release-notes/2026-07-08-v3.0.20.txt"
```

若本輪只想先驗證、不立即出包，可改用：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\prepare-one-click-update.ps1 -SkipPackageBuild
```

本輪實際驗證結果：

- 預檢腳本：`tools/prepare-one-click-update.ps1`
- 暫定版本：`v3.0.20`
- 更新包：`dist/update_v3.0.20_20260708_184221.zip`
- safe builder 統計：主檔案 `300`、migration `25`
- package verify：manifest/version/files_root 驗證通過；ZIP 內 `files/` 實體檔案數 `301`
- 注意：若正式版號或升版起點不同，需以正式參數重跑一次。

## 每輪驗收清單

- [ ] `node tools/audit-system-health.js --changed --base origin/main`
- [ ] 若修改配置型模組：`node tools/validate-config-modules.js`
- [ ] 若修改相關 JS：`node --check <changed-js-file>`
- [ ] 若涉及 DataSync：依 `.github/copilot-instructions.md` 執行 DataSync 三項檢查
- [ ] 回報是否新增 `ui-token-exception`
- [ ] 回報仍待統一的畫面或元件
