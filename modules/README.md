# 模組檔案索引與修改指引

> 📅 最後更新：2026-02-05
> 🎯 目的：幫助開發者快速找到正確的檔案進行修改
> ✅ 配置化狀態：44/44 模組已完成配置化（100%）

---

## 🚨 重要提醒

### 本專案採用「配置化系統」

**系統會自動檢查模組是否有配置檔：**

```
當開啟模組時：
1. script.js 檢查 core/configs/{模組名稱}.config.js 是否存在
2. 如果存在 → 使用 ModuleRenderer 動態生成 HTML（配置檔控制）
3. 如果不存在 → 載入 modules/{模組名稱}.html 靜態檔案
```

**這意味著**：
- ✅ **已配置化的模組**：修改配置檔才會生效
- ❌ **已配置化的模組**：修改 HTML 檔案不會生效（檔案已不使用）

---

## 📋 已配置化模組列表（44 個）

> ⚠️ 以下模組的 HTML 檔案僅供參考，**修改不會生效**！
> ✅ 請修改對應的配置檔：`core/configs/{模組名稱}.config.js`

| # | 模組名稱 | 配置檔位置 | HTML 狀態 | 遷移模式 |
|---|---------|-----------|----------|----------|
| 1 | `audit_logs` | [core/configs/audit_logs.config.js](../core/configs/audit_logs.config.js) | ⚠️ 已重命名為 .bak | 🔀 混合模式 (requiresHtmlModal) |
| 2 | `calendar_event_participants` | [core/configs/calendar_event_participants.config.js](../core/configs/calendar_event_participants.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 3 | `calendar_event_reminders` | [core/configs/calendar_event_reminders.config.js](../core/configs/calendar_event_reminders.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 4 | `companies` | [core/configs/companies.config.js](../core/configs/companies.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 5 | `customers` | [core/configs/customers.config.js](../core/configs/customers.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 6 | `daily_machine_inspections` | [core/configs/daily_machine_inspections.config.js](../core/configs/daily_machine_inspections.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 7 | `daily_machine_inspection_items` | [core/configs/daily_machine_inspection_items.config.js](../core/configs/daily_machine_inspection_items.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 8 | `dashboard_calendar_events` | [core/configs/dashboard_calendar_events.config.js](../core/configs/dashboard_calendar_events.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 9 | `dashboard` | [core/configs/dashboard.config.js](../core/configs/dashboard.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 10 | `departments` | [core/configs/departments.config.js](../core/configs/departments.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 11 | `domain_event_outbox` | [core/configs/domain_event_outbox.config.js](../core/configs/domain_event_outbox.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 12 | `employees` | [core/configs/employees.config.js](../core/configs/employees.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 13 | `employee_roles` | [core/configs/employee_roles.config.js](../core/configs/employee_roles.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 14 | `inventory_items` | [core/configs/inventory_items.config.js](../core/configs/inventory_items.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 15 | `inventory_transactions` | [core/configs/inventory_transactions.config.js](../core/configs/inventory_transactions.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 16 | `lookup_domains` | [core/configs/lookup_domains.config.js](../core/configs/lookup_domains.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 17 | `lookup_values` | [core/configs/lookup_values.config.js](../core/configs/lookup_values.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 18 | `machines` | [core/configs/machines.config.js](../core/configs/machines.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 19 | `machine_maintenance_tasks` | [core/configs/machine_maintenance_tasks.config.js](../core/configs/machine_maintenance_tasks.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 20 | `messages` | [core/configs/messages.config.js](../core/configs/messages.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 21 | `notifications` | [core/configs/notifications.config.js](../core/configs/notifications.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 22 | `number_sequences` | [core/configs/number_sequences.config.js](../core/configs/number_sequences.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 23 | `orders` | [core/configs/orders.config.js](../core/configs/orders.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 24 | `order_items` | [core/configs/order_items.config.js](../core/configs/order_items.config.js) | ⚠️ 已重命名為 .bak | 🔀 混合模式 (requiresHtmlModal) |
| 25 | `permissions` | [core/configs/permissions.config.js](../core/configs/permissions.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 26 | `production_quality_records` | [core/configs/production_quality_records.config.js](../core/configs/production_quality_records.config.js) | ⚠️ 已重命名為 .bak | 🔀 混合模式 (requiresHtmlModal) |
| 27 | `production_records` | [core/configs/production_records.config.js](../core/configs/production_records.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 28 | `quality_issue_reports` | [core/configs/quality_issue_reports.config.js](../core/configs/quality_issue_reports.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 29 | `report_descriptions` | [core/configs/report_descriptions.config.js](../core/configs/report_descriptions.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 30 | `return_orders` | [core/configs/return_orders.config.js](../core/configs/return_orders.config.js) | ⚠️ 已重命名為 .bak | 🔀 混合模式 (requiresHtmlModal) |
| 31 | `return_order_items` | [core/configs/return_order_items.config.js](../core/configs/return_order_items.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 32 | `roles` | [core/configs/roles.config.js](../core/configs/roles.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 33 | `role_permissions` | [core/configs/role_permissions.config.js](../core/configs/role_permissions.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 34 | `screening_items` | [core/configs/screening_items.config.js](../core/configs/screening_items.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 35 | `screening_services` | [core/configs/screening_services.config.js](../core/configs/screening_services.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 36 | `shipping_orders` | [core/configs/shipping_orders.config.js](../core/configs/shipping_orders.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 37 | `shipping_order_items` | [core/configs/shipping_order_items.config.js](../core/configs/shipping_order_items.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 38 | `shipping_quality_inspections` | [core/configs/shipping_quality_inspections.config.js](../core/configs/shipping_quality_inspections.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 39 | `suppliers` | [core/configs/suppliers.config.js](../core/configs/suppliers.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 40 | `system_parameters` | [core/configs/system_parameters.config.js](../core/configs/system_parameters.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 41 | `tools` | [core/configs/tools.config.js](../core/configs/tools.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 42 | `work_orders` | [core/configs/work_orders.config.js](../core/configs/work_orders.config.js) | ⚠️ 已重命名為 .bak | 🔀 混合模式 (requiresHtmlModal) |
| 43 | `work_order_first_piece_dimensions` | [core/configs/work_order_first_piece_dimensions.config.js](../core/configs/work_order_first_piece_dimensions.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |
| 44 | `work_order_images` | [core/configs/work_order_images.config.js](../core/configs/work_order_images.config.js) | ⚠️ 已重命名為 .bak | ✅ 完全配置化 |

---

**新增配置化：** `dashboard`、`work_order_first_piece_dimensions`、`work_order_images` 已改為配置化，原 HTML 已備份為 .bak。

## 🔀 混合模式說明

部分複雜模組採用混合配置模式：

| 模組 | 配置化部分 | HTML 部分 | 原因 |
|------|-----------|----------|------|
| `audit_logs` | 頁面結構（header、filter、table） | 詳情 Modal | Modal 從原 HTML 載入 |
| `order_items` | 頁面結構 | Modal 表單 | Modal 含複雜子表格 |
| `production_quality_records` | 頁面結構、部分 Modal | 部分 Modal | 含特殊欄位選擇器 |
| `return_orders` | 頁面結構 | Modal 表單 | Modal 含複雜子表格 |
| `work_orders` | 頁面結構（header、filter、table） | Modal 表單 | Modal 太複雜（含 Tab、子表格） |

**混合模式的修改方式**：
1. 頁面結構（標題、篩選、表格）→ 修改配置檔
2. Modal 表單（如配置檔有 `requiresHtmlModal: true`）→ 修改 `.html.bak`

---

## 📄 傳統 HTML 模組列表（0 個）

目前無傳統 HTML 模組；`dashboard` 已改為配置化。

---

## 📝 修改指引

### 步驟 1：確認模組是否已配置化

**方法 1：檢查配置檔是否存在**
```bash
# 在專案根目錄執行
ls core/configs/customers.config.js
# 如果檔案存在 → 已配置化
```

**方法 2：檢查上方列表**
- 在上方列表中 → 已配置化
- 不在列表中 → 未配置化

**方法 3：在瀏覽器 Console 檢查**
```javascript
ModuleConfig.has('customers')  // true = 已配置化
```

### 步驟 2：修改對應的檔案

| 模組狀態 | 修改檔案 | 範例 |
|----------|----------|------|
| ✅ 已配置化（完全） | `core/configs/{模組名稱}.config.js` | 修改 customers 標題 → 編輯 `core/configs/customers.config.js` |
| 🔀 混合模式 | 配置檔 + `.html.bak` | 修改 work_orders 篩選 → 配置檔；修改 Modal → `.html.bak` |
| ❌ 未配置化 | `modules/{模組名稱}.html` | （目前所有模組都已配置化） |

### 步驟 3：配置檔修改範例

**修改標題**：
```javascript
// core/configs/customers.config.js
ModuleConfig.register('customers', {
    title: '客戶基本資料',        // ← 修改這裡
    subtitle: '維護客戶基本資料與聯絡資訊',  // ← 或這裡
    // ...
});
```

**修改 Modal 標題**：
```javascript
// core/configs/customers.config.js
modal: {
    title: '新增客戶基本資料',    // ← 修改這裡
    sections: [...]
}
```

**修改按鈕**：
```javascript
// core/configs/customers.config.js
actions: [
    { label: '新增', icon: 'fa-plus', action: 'create', style: 'primary' },
    // ↑ 修改 label 或 icon
]
```

### 步驟 4：驗證修改

1. **重新整理瀏覽器**（強制重新載入：Ctrl+Shift+R）
2. **檢查 Console**：確認無錯誤訊息
3. **測試功能**：確認按鈕、Modal 等功能正常

---

## 🆘 常見問題

### Q1: 我修改了 HTML 但沒有效果？

**A**: 檢查是否為已配置化模組。如果在上方列表中，請修改配置檔。

### Q2: 混合模式要怎麼改？

**A**:
- 頁面結構（標題、按鈕、篩選、表格）→ 修改配置檔
- Modal 表單（如有 `requiresHtmlModal: true`）→ 修改 `.html.bak`

### Q3: .html.bak 檔案可以刪除嗎？

**A**:
- **完全配置化的模組**：理論上可以，但建議保留供參考
- **混合模式的模組**：不可刪除，系統會載入使用

### Q4: 如何知道是否為混合模式？

**A**: 查看配置檔，如果有以下任一項即為混合模式：
```javascript
requiresHtmlModal: true       // Modal 從 HTML 載入
customModalHtml: '...'        // 有自訂 Modal HTML
afterTableHtml: '...'         // 表格後有額外 HTML
```

---

## 📚 相關文件

- [配置規範](../core/configs/README.md) - 如何正確編寫配置檔
- [遷移進度](../docs/模組配置遷移進度.md) - 詳細的遷移歷史
- [開發指引](../DEVELOPMENT.md) - 專案開發流程
- [架構分析報告](../docs/2026-02-04 2026-02-04 專案架構混亂問題分析報告.md) - 為何採用配置化系統

---

## 📞 需要協助？

如果遇到問題：
1. 先查看上方「常見問題」
2. 閱讀相關文件
3. 在瀏覽器 Console 檢查錯誤訊息
4. 詢問專案負責人或 AI 助手

---

**最後更新**: 2026-02-04
**維護者**: 專案團隊


