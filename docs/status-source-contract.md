# 狀態欄位來源契約

## 2026-07-18 相容期決策

目前 `employees`、`orders`、`shipping_orders`、`tools` 同時保留字串 `status` 與 `status_lookup_id`。本輪不直接移除 legacy 欄位，避免破壞既有 API、流程狀態機、篩選與報表；正式唯一來源切換需要另立 breaking migration。

相容期規則如下：

| 模組 | 相容期來源 | `status_lookup_id` 定位 | Lookup domain |
|---|---|---|---|
| employees | `status` | 對應狀態鏡像 | `employee_status` |
| orders | `status` | 對應狀態鏡像 | `status_order` |
| shipping_orders | `status` | 對應狀態鏡像 | `shipping_status` |
| tools | `status` | 對應狀態鏡像 | `tool_status` |
| work_orders | `status_lookup_id` | 唯一持久化來源 | `status_work_order` |

本輪 migration 會回填既有 NULL／不一致的鏡像值，並補上載具 `retired` lookup 值。後續修改四個相容期模組的狀態寫入時，必須同步更新鏡像；切換唯一來源前，需先完成所有 API、前端、報表與流程查詢的讀取切換，並另行驗證回滾方案。
