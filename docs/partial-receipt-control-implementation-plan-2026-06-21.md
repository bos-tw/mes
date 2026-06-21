# 部分入庫與工單數量平衡實作計畫

更新日期：2026-06-21  
狀態：待下一輪開發  
適用範圍：一般工單、拆分工單、庫存、出貨、退貨／沖銷

## 1. 背景與問題

部分入庫代表將目前已完成生產、因客戶急需而先行交付的良品提前入庫。這些產品已經完成生產，後續即使已出貨，也不能在工單結案時被當成短缺。

目前系統已有部分入庫資料表、庫存建立及最終結清骨架，但仍缺少完整的工單總帳、歷程呈現、出貨追蹤、短缺確認及沖銷流程。如果只建立庫存而沒有在工單端累計，會造成：

- 生管將先行交付數量誤認為工單短缺。
- 庫存與出貨帳面存在產品，但生產工單無法解釋來源。
- 最終入庫可能再次建立整批數量，造成重複庫存。
- 錯誤部分入庫沒有合法更正路徑，只能直接改資料或留下錯帳。

## 2. 設計目標

- 一般與拆分工單使用同一套工單數量總帳。
- 拆分工單只增加來源機台維度，不建立另一套結算口徑。
- 所有計算以內容物淨重為主，支數為換算與顯示值。
- 部分入庫建立後可追溯到工單、機台、庫存、出貨與操作人。
- 工單結案只補入剩餘良品，不能重複計入先行入庫。
- 真實短缺與已先行交付必須清楚分開。
- 已進入出貨流程的紀錄禁止直接刪除，只能走退貨或沖銷。

## 3. 核心帳務公式

```text
工單預計良品
  = 累計有效部分入庫
  + 最終補入庫
  + 真實短缺

累計有效部分入庫
  = 部分入庫已出貨
  + 部分入庫尚在庫

帳面短缺
  = 工單預計良品
  - 累計有效部分入庫
  - 最終補入庫
```

重量與支數換算：

```text
支數 = 淨重(kg) * 1000 / 單支重(g)
```

主控比較使用淨重；支數的取整規則需在開發前由使用者確認。

## 4. 資料來源與責任

| 資料 | 主要來源 | 說明 |
|---|---|---|
| 工單預計淨重 | `work_orders.total_weight_kg` | 建立工單時已保存內容物淨重 |
| 生產紀錄重量 | `production_records.weight_kg` | 現場逐筆載具生產資料 |
| 部分入庫 | `work_order_partial_receipts` | 每次先行入庫的工單總帳 |
| 部分入庫庫存 | `inventory_items` | `receipt_type = partial` |
| 出貨數量 | `shipping_order_items` | 依關聯庫存彙總 |
| 最終補入庫 | `inventory_items` | `receipt_type = final` |
| 庫存異動 | `inventory_transactions` | 入庫、出貨、沖銷完整追溯 |

## 5. 後端實作

### 5.1 工單明細查詢

擴充 `api/work_orders/show.php`，集中回傳：

```text
partial_receipt_summary
  expected_net_weight_kg
  expected_units
  produced_net_weight_kg
  produced_units
  partial_received_net_weight_kg
  partial_received_units
  partial_shipped_units
  partial_in_stock_units
  final_received_net_weight_kg
  final_received_units
  shortage_net_weight_kg
  shortage_units
  balance_difference_net_weight_kg

partial_receipts[]
  id
  receipt_number
  machine_run_id
  source_label
  inventory_item_id
  inventory_number
  net_weight_kg
  calculated_units
  quantity_shipped
  quantity_on_hand
  receipt_status
  notes
  created_by_name
  created_at
  settled_at
```

計算應集中在後端 helper，避免桌面、手機及報表各自產生不同結果。

### 5.2 建立部分入庫

`api/work_orders/partial_receipt.php` 必須：

- 只接受進行中或暫停中的工單。
- 必填本次 `net_weight_kg`。
- 一般工單不可帶 `machine_run_id`。
- 拆分工單必須指定已完成的機台明細。
- 本次淨重不得超過來源範圍剩餘重量。
- 工單累計淨重不得超過工單預計淨重。
- 已完成或已有正式庫存的工單禁止建立。
- 同一 transaction 建立：
  - `inventory_items`
  - `work_order_partial_receipts`
  - `inventory_transactions`
  - 工單操作紀錄
  - audit log

### 5.3 工單結案

`api/work_orders/update.php` 在結案時：

- 彙總所有非 `reversed` 的部分入庫。
- 先計算完整良品淨重，再扣除已部分入庫。
- 只對剩餘良品建立 `final` 庫存。
- 若剩餘良品為 0，不建立零數量庫存。
- 若部分入庫大於實際良品，阻擋結案。
- 將有效部分入庫改為 `settled`。
- 記錄短缺及原因。
- 所有操作必須在同一 transaction 中完成。

### 5.4 部分入庫沖銷

新增 `api/work_orders/reverse_partial_receipt.php`：

- 不得硬刪資料。
- 檢查庫存是否已配貨、出貨或有其他異動。
- 尚未配貨／出貨時：
  - 原部分入庫改為 `reversed`。
  - 原庫存改為作廢或建立反向庫存異動。
  - 保留完整操作紀錄。
- 已配貨時：
  - 回傳 `409`，要求先解除配貨。
- 已出貨時：
  - 回傳 `409`，要求建立退貨／出貨沖銷。
- 回應需包含：
  - `workflow_guard.allowed`
  - `workflow_guard.impacts`
  - `workflow_guard.recommended_action`

### 5.5 短缺資料

開發前評估是否需要 migration 新增：

- `work_orders.shortage_net_weight_kg`
- `work_orders.shortage_units`
- `work_orders.shortage_reason_code`
- `work_orders.shortage_notes`
- `work_orders.shortage_confirmed_by`
- `work_orders.shortage_confirmed_at`

若新增 migration，必須同步更新 `tools/sync-local-schema.ps1` 的 `$migrationChecks`。

## 6. 桌面版 UI

### 6.1 數量平衡卡

在工單右側統計區增加：

- 工單預計淨重／支數
- 現場已生產淨重／支數
- 累計部分入庫淨重／支數
- 部分入庫已出貨
- 部分入庫尚在庫
- 最終補入庫
- 真實短缺
- 平衡差異

異常狀態：

- 平衡差異不為 0：紅色警示。
- 已部分入庫超過生產紀錄：阻擋並要求檢查。
- 已出貨高於有效部分入庫：資料異常，禁止結案。

### 6.2 部分入庫歷程

新增可展開表格：

- 入庫單號
- 建立時間
- 操作人
- 來源機台
- 淨重／支數
- 庫存編號
- 已出貨／尚在庫
- 狀態
- 備註
- 合法操作

合法操作只顯示：

- 檢視庫存
- 檢視出貨
- 沖銷（符合流程守門時）

### 6.3 結案確認

結案前顯示專用確認 Modal：

- 預計良品
- 已部分入庫
- 本次最終補入
- 真實短缺
- 短缺原因
- 對庫存與出貨的影響

不得使用只有「確定完工嗎？」的原生確認框。

## 7. 手機版 UI

- 將「部分完工」文案統一為「部分入庫／先行入庫」。
- 顯示：
  - 工單預計淨重
  - 累計部分入庫
  - 剩餘可入庫
- 本次淨重必填。
- 成功後顯示部分入庫單號及更新後剩餘重量。
- 與桌面使用相同狀態及正式庫存守門。
- 拆分工單顯示來源機台名稱，不只顯示 ID。

## 8. 權限與稽核

- 評估新增權限：
  - `work_orders.partial_receipt`
  - `work_orders.reverse_partial_receipt`
  - `work_orders.confirm_shortage`
- 若新增權限：
  - migration 寫入 `permissions`
  - 更新前後端 permission alias
  - 既有角色授權相容
  - 更新 schema 同步檢查
- audit log 至少記錄：
  - 建立部分入庫
  - 沖銷部分入庫
  - 結清部分入庫
  - 短缺確認
  - 主管覆核

## 9. 開發順序

1. 建立共用部分入庫彙總 helper 與 API 回傳模型。
2. 完成桌面數量平衡卡及歷程表。
3. 完成一般／拆分工單結案平衡。
4. 建立短缺原因及確認流程。
5. 建立部分入庫沖銷 API 與 workflow guard。
6. 同步手機版操作與文案。
7. 補報表、庫存及出貨交叉連結。
8. 執行完整情境測試及資料平衡查核。

## 10. 驗收標準

- 部分入庫、最終入庫與短缺可完整平衡工單預計量。
- 已出貨部分入庫不會被列為工單短缺。
- 一般與拆分工單使用相同結算規則。
- 已出貨資料不可直接刪除或沖銷。
- 任一庫存及出貨紀錄皆可回推工單與部分入庫單。
- 工單結案不會重複建立先行入庫數量。
- 桌面、手機、報表顯示的彙總結果一致。

## 11. 強制驗證

```powershell
node tools/audit-system-health.js --changed --base origin/main
php -l api/work_orders/partial_receipt.php
php -l api/work_orders/show.php
php -l api/work_orders/update.php
node --check js/work_orders.js
node --check mobile/mobile.js
node --check js/data-sync.js
node --check tools/audit-data-sync.js
node tools/audit-data-sync.js --write docs/data-sync-audit.md
```

若新增 migration：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\sync-local-schema.ps1
```

