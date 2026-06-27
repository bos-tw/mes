# DataSync 稽核報告

產生時間：2026-06-27T08:46:50.797Z

## 摘要

- P0: 0
- P1: 0
- P2: 10
- 通過：40
- 相依來源數：39
- 狀態型介面刷新檢查數：36

## 模組矩陣

| 優先級 | 模組 | 輔助模組 | CRUD 方法 | 通知模組 | 相依刷新目標 | 相依來源 | 問題 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P2 | audit_logs | audit_logs | DELETE | (helper) | - | - | CRUD 模組未設定相依刷新目標 |
| P2 | calendar_event_participants | calendar_event_participants | POST, DELETE | (helper) | - | dashboard_calendar_events, employees | CRUD 模組未設定相依刷新目標 |
| P2 | dashboard | dashboard | POST | notifications | - | dashboard_calendar_events, notifications, orders, quality_issue_reports, shipping_orders, work_orders | CRUD 模組未設定相依刷新目標 |
| P2 | domain_event_outbox | domain_event_outbox | DELETE | (helper) | - | - | CRUD 模組未設定相依刷新目標 |
| P2 | messages | messages | POST, DELETE | (helper) | - | employees | CRUD 模組未設定相依刷新目標 |
| P2 | number_sequences | number_sequences | DELETE | (helper) | - | - | CRUD 模組未設定相依刷新目標 |
| P2 | production_work_order_schedule | production_work_order_schedule | PUT | (helper), work_orders | - | machine_capabilities, machines, work_orders | CRUD 模組未設定相依刷新目標 |
| P2 | report_descriptions | report_descriptions | DELETE | (helper) | - | - | CRUD 模組未設定相依刷新目標 |
| P2 | security_settings | security_settings | POST | (helper) | - | - | CRUD 模組未設定相依刷新目標 |
| P2 | system_parameters | system_parameters | DELETE | (helper) | - | - | CRUD 模組未設定相依刷新目標 |
| OK | calendar_event_reminders | calendar_event_reminders | DELETE | (helper) | dashboard_calendar_events | dashboard_calendar_events, employees | - |
| OK | companies | companies | POST, PUT, DELETE | companies | employees, customers, suppliers | - | - |
| OK | customers | customers | POST, PATCH, DELETE | customers | orders, screening_services, return_orders, rescreen_batches | companies, lookup_values | - |
| OK | daily_machine_inspection_items | daily_machine_inspection_items | DELETE | (helper) | daily_machine_inspections | daily_machine_inspections, employees | - |
| OK | daily_machine_inspections | daily_machine_inspections | DELETE | (helper) | daily_machine_inspection_items | daily_machine_inspection_items, employees, machines | - |
| OK | dashboard_calendar_events | dashboard_calendar_events | DELETE | (helper) | calendar_event_participants, calendar_event_reminders, dashboard | calendar_event_reminders | - |
| OK | defect_history_records | defect_history_records | - | - | - | order_items, production_records, rescreen_batches, shipping_orders, tools, work_orders | - |
| OK | departments | departments | POST, PUT, DELETE | (helper) | employees, notifications, quality_issue_reports | - | - |
| OK | employee_roles | employee_roles | POST, DELETE | (helper) | employees, roles | employees, roles | - |
| OK | employees | employees | DELETE | (helper) | work_orders, orders, calendar_event_participants, calendar_event_reminders, work_order_first_piece_dimensions, messages, notifications, employee_roles, daily_machine_inspections, daily_machine_inspection_items, machine_maintenance_tasks, production_records, quality_issue_reports, shipping_quality_inspections | companies, departments, employee_roles, lookup_values | - |
| OK | inventory_items | inventory_items | POST, PUT, DELETE | inventory_items, shipping_orders, work_orders | work_orders, inventory_transactions, shipping_orders, shipping_order_items | order_items, rescreen_batches, return_orders, screening_items, shipping_order_items, shipping_orders, suppliers, work_orders | - |
| OK | inventory_items_source_chain | - | - | - | - | - | - |
| OK | inventory_transactions | inventory_transactions | - | - | - | inventory_items, return_orders, shipping_order_items, shipping_orders, work_orders | - |
| OK | lookup_domains | lookup_domains | DELETE | (helper) | lookup_values | - | - |
| OK | lookup_values | lookup_values | - | - | orders, customers, suppliers, employees, work_orders, screening_items | lookup_domains | - |
| OK | machine_capabilities | machine_capabilities | POST, PUT, DELETE | (helper) | machines, work_orders, production_work_order_schedule | - | - |
| OK | machine_maintenance_tasks | machine_maintenance_tasks | DELETE | (helper) | machines | employees, machines | - |
| OK | machines | machines | POST, PUT, DELETE | machines | work_orders, machine_maintenance_tasks, daily_machine_inspections, production_records, production_work_order_schedule | machine_capabilities, machine_maintenance_tasks | - |
| OK | notifications | notifications | POST, DELETE | (helper) | dashboard | departments, employees, roles | - |
| OK | order_items | order_items | POST, DELETE | order_items | orders, work_orders, inventory_items, defect_history_records | orders, screening_items, screening_services, shipping_order_items, shipping_orders, tools, work_orders | - |
| OK | orders | orders | POST, DELETE | (helper), order_items | order_items, work_orders, dashboard | customers, employees, lookup_values, order_items, screening_services, suppliers, work_orders | - |
| OK | permissions | permissions | DELETE | (helper) | role_permissions | role_permissions | - |
| OK | production_quality_records | production_quality_records | POST, DELETE | production_quality_records | work_orders | - | - |
| OK | production_records | production_records | - | - | defect_history_records | employees, machines, work_orders | - |
| OK | quality_issue_reports | quality_issue_reports | DELETE | (helper) | dashboard | departments, employees | - |
| OK | rescreen_batches | rescreen_batches | - | (helper) | return_orders, work_orders, inventory_items, defect_history_records | customers, return_orders, work_orders | - |
| OK | rescreen_batches_execution | - | - | rescreen_batches | - | - | - |
| OK | return_orders | return_orders | DELETE | (helper) | inventory_items, inventory_transactions, shipping_orders, shipping_order_items, rescreen_batches | customers, rescreen_batches, shipping_order_items, shipping_orders | - |
| OK | role_permissions | role_permissions | PUT | (helper) | roles, permissions | permissions, roles | - |
| OK | roles | roles | DELETE | (helper) | notifications, employee_roles, role_permissions | employee_roles, role_permissions | - |
| OK | screening_items | screening_items | DELETE | screening_items | order_items, screening_services, inventory_items | lookup_values | - |
| OK | screening_services | screening_services | POST, DELETE | screening_services | orders, order_items | customers, screening_items | - |
| OK | shipping_order_items | shipping_order_items | - | - | shipping_orders, order_items, inventory_items, inventory_transactions, return_orders | inventory_items, return_orders, shipping_orders | - |
| OK | shipping_orders | shipping_orders | POST, PUT, DELETE | return_orders, shipping_orders | shipping_order_items, inventory_items, order_items, inventory_transactions, return_orders, dashboard, shipping_quality_inspections, defect_history_records | inventory_items, return_orders, shipping_order_items, shipping_quality_inspections | - |
| OK | shipping_quality_inspections | shipping_quality_inspections | POST, PUT, DELETE | (helper) | shipping_orders | employees, shipping_orders | - |
| OK | suppliers | suppliers | POST, DELETE | suppliers | orders, inventory_items | companies, lookup_values | - |
| OK | tools | tools | DELETE | tools | work_orders, order_items, defect_history_records | - | - |
| OK | work_order_first_piece_dimensions | work_order_first_piece_dimensions | POST, DELETE | (helper) | work_orders | employees, work_orders | - |
| OK | work_order_images | work_order_images | - | - | work_orders | work_orders | - |
| OK | work_orders | work_orders | POST, DELETE | inventory_items, rescreen_batches, work_orders | order_items, orders, work_order_images, work_order_first_piece_dimensions, inventory_items, inventory_transactions, dashboard, production_records, production_work_order_schedule, defect_history_records, rescreen_batches | employees, inventory_items, lookup_values, machine_capabilities, machines, order_items, orders, production_quality_records, rescreen_batches, tools, work_order_completion_images, work_order_defect_images, work_order_first_piece_dimensions, work_order_images, work_order_tool_condition_images | - |

## 建議處理順序

- P2 audit_logs：CRUD 模組未設定相依刷新目標
- P2 calendar_event_participants：CRUD 模組未設定相依刷新目標
- P2 dashboard：CRUD 模組未設定相依刷新目標
- P2 domain_event_outbox：CRUD 模組未設定相依刷新目標
- P2 messages：CRUD 模組未設定相依刷新目標
- P2 number_sequences：CRUD 模組未設定相依刷新目標
- P2 production_work_order_schedule：CRUD 模組未設定相依刷新目標
- P2 report_descriptions：CRUD 模組未設定相依刷新目標
- P2 security_settings：CRUD 模組未設定相依刷新目標
- P2 system_parameters：CRUD 模組未設定相依刷新目標

## 狀態型介面刷新檢查

以下模組會保留快取、展開列、明細視窗、編輯視窗或按鈕狀態等本機介面狀態。相依資料變更時，需人工確認目前開啟的介面狀態會同步刷新，而不只是重新載入主列表。

| 模組 | 狀態訊號 | 相依來源 | 有 onDependencyUpdate | 備註 |
| --- | --- | --- | --- | --- |
| calendar_event_participants | 編輯視窗, 按鈕狀態 | dashboard_calendar_events, employees | 是 | 請確認目前開啟狀態的刷新路徑 |
| calendar_event_reminders | 編輯視窗, 按鈕狀態 | dashboard_calendar_events, employees | 是 | 請確認目前開啟狀態的刷新路徑 |
| customers | 快取, 明細視窗, 編輯視窗, 按鈕狀態 | companies, lookup_values | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| daily_machine_inspection_items | 編輯視窗, 按鈕狀態 | daily_machine_inspections, employees | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| daily_machine_inspections | 編輯視窗, 按鈕狀態 | daily_machine_inspection_items, employees, machines | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| dashboard | 編輯視窗, 按鈕狀態 | dashboard_calendar_events, notifications, orders, quality_issue_reports, shipping_orders, work_orders | 是 | 請確認目前開啟狀態的刷新路徑 |
| dashboard_calendar_events | 編輯視窗, 按鈕狀態 | calendar_event_reminders | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| defect_history_records | 明細視窗, 編輯視窗, 按鈕狀態 | order_items, production_records, rescreen_batches, shipping_orders, tools, work_orders | 是 | 請確認目前開啟狀態的刷新路徑 |
| employee_roles | 編輯視窗, 按鈕狀態 | employees, roles | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| employees | 快取, 編輯視窗, 按鈕狀態 | companies, departments, employee_roles, lookup_values | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| inventory_items | 明細視窗, 編輯視窗, 按鈕狀態 | order_items, rescreen_batches, return_orders, screening_items, shipping_order_items, shipping_orders, suppliers, work_orders | 是 | 請確認目前開啟狀態的刷新路徑 |
| inventory_transactions | 明細視窗, 編輯視窗, 按鈕狀態 | inventory_items, return_orders, shipping_order_items, shipping_orders, work_orders | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| lookup_values | 按鈕狀態 | lookup_domains | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| machine_maintenance_tasks | 編輯視窗, 按鈕狀態 | employees, machines | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| machines | 快取, 編輯視窗, 按鈕狀態 | machine_capabilities, machine_maintenance_tasks | 是 | 請確認目前開啟狀態的刷新路徑 |
| messages | 明細視窗, 編輯視窗, 按鈕狀態 | employees | 是 | 請確認目前開啟狀態的刷新路徑 |
| notifications | 明細視窗, 編輯視窗, 按鈕狀態 | departments, employees, roles | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| order_items | 編輯視窗, 按鈕狀態 | orders, screening_items, screening_services, shipping_order_items, shipping_orders, tools, work_orders | 是 | 請確認目前開啟狀態的刷新路徑 |
| orders | 快取, 展開列, 編輯視窗, 按鈕狀態 | customers, employees, lookup_values, order_items, screening_services, suppliers, work_orders | 是 | 請確認目前開啟狀態的刷新路徑 |
| permissions | 快取, 編輯視窗, 按鈕狀態 | role_permissions | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| production_records | 快取, 明細視窗, 編輯視窗, 按鈕狀態 | employees, machines, work_orders | 是 | 請確認目前開啟狀態的刷新路徑 |
| production_work_order_schedule | 展開列, 編輯視窗, 按鈕狀態 | machine_capabilities, machines, work_orders | 是 | 請確認目前開啟狀態的刷新路徑 |
| quality_issue_reports | 明細視窗, 編輯視窗, 按鈕狀態 | departments, employees | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| rescreen_batches | 明細視窗, 編輯視窗, 按鈕狀態 | customers, return_orders, work_orders | 是 | 請確認目前開啟狀態的刷新路徑 |
| return_orders | 明細視窗, 編輯視窗, 按鈕狀態 | customers, rescreen_batches, shipping_order_items, shipping_orders | 是 | 請確認目前開啟狀態的刷新路徑 |
| role_permissions | 編輯視窗, 按鈕狀態 | permissions, roles | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| roles | 快取, 編輯視窗, 按鈕狀態 | employee_roles, role_permissions | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| screening_items | 編輯視窗, 按鈕狀態 | lookup_values | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| screening_services | 快取, 編輯視窗, 按鈕狀態 | customers, screening_items | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| shipping_order_items | 編輯視窗, 按鈕狀態 | inventory_items, return_orders, shipping_orders | 是 | 請確認目前開啟狀態的刷新路徑 |
| shipping_orders | 明細視窗, 編輯視窗, 按鈕狀態 | inventory_items, return_orders, shipping_order_items, shipping_quality_inspections | 是 | 請確認目前開啟狀態的刷新路徑 |
| shipping_quality_inspections | 快取, 明細視窗, 編輯視窗, 按鈕狀態 | employees, shipping_orders | 是 | 請確認目前開啟狀態的刷新路徑 |
| suppliers | 快取, 編輯視窗, 按鈕狀態 | companies, lookup_values | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| work_order_first_piece_dimensions | 明細視窗, 編輯視窗, 按鈕狀態 | employees, work_orders | 是 | 請確認目前開啟狀態的刷新路徑 |
| work_order_images | 編輯視窗, 按鈕狀態 | work_orders | 否 | 使用通用 onRefresh，需人工檢查開啟中的介面狀態 |
| work_orders | 快取, 編輯視窗, 按鈕狀態 | employees, inventory_items, lookup_values, machine_capabilities, machines, order_items, orders, production_quality_records, rescreen_batches, tools, work_order_completion_images, work_order_defect_images, work_order_first_piece_dimensions, work_order_images, work_order_tool_condition_images | 是 | 請確認目前開啟狀態的刷新路徑 |
