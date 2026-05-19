# DataSync Audit Report

Generated at: 2026-05-17T02:10:52.704Z

## Summary

- P0: 0
- P1: 0
- P2: 10
- OK: 35
- Dependency sources: 33
- Stateful refresh review: 34

## Module Matrix

| Priority | Module | Helper | CRUD | Notify | Dependents | Dependency Sources | Issues |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P2 | audit_logs | audit_logs | DELETE | (helper) | - | - | crud_module_without_dependents |
| P2 | calendar_event_participants | calendar_event_participants | POST, DELETE | (helper) | - | dashboard_calendar_events, employees | crud_module_without_dependents |
| P2 | dashboard | dashboard | POST | notifications | - | dashboard_calendar_events, notifications, orders, quality_issue_reports, shipping_orders, work_orders | crud_module_without_dependents |
| P2 | domain_event_outbox | domain_event_outbox | DELETE | (helper) | - | - | crud_module_without_dependents |
| P2 | messages | messages | POST, DELETE | (helper) | - | employees | crud_module_without_dependents |
| P2 | number_sequences | number_sequences | DELETE | (helper) | - | - | crud_module_without_dependents |
| P2 | production_work_order_schedule | production_work_order_schedule | PUT | (helper), work_orders | - | machines, work_orders | crud_module_without_dependents |
| P2 | report_descriptions | report_descriptions | DELETE | (helper) | - | - | crud_module_without_dependents |
| P2 | security_settings | security_settings | POST | (helper) | - | - | crud_module_without_dependents |
| P2 | system_parameters | system_parameters | DELETE | (helper) | - | - | crud_module_without_dependents |
| OK | calendar_event_reminders | calendar_event_reminders | DELETE | (helper) | dashboard_calendar_events | dashboard_calendar_events, employees | - |
| OK | companies | companies | POST, PUT, DELETE | companies | employees, customers, suppliers | - | - |
| OK | customers | customers | POST, PATCH, DELETE | customers | orders, screening_services, return_orders | companies, lookup_values | - |
| OK | daily_machine_inspection_items | daily_machine_inspection_items | DELETE | (helper) | daily_machine_inspections | daily_machine_inspections, employees | - |
| OK | daily_machine_inspections | daily_machine_inspections | DELETE | (helper) | daily_machine_inspection_items | daily_machine_inspection_items, employees, machines | - |
| OK | dashboard_calendar_events | dashboard_calendar_events | DELETE | (helper) | calendar_event_participants, calendar_event_reminders, dashboard | calendar_event_reminders | - |
| OK | departments | departments | POST, PUT, DELETE | (helper) | employees, notifications, quality_issue_reports | - | - |
| OK | employee_roles | employee_roles | POST, DELETE | (helper) | employees, roles | employees, roles | - |
| OK | employees | employees | DELETE | (helper) | work_orders, orders, calendar_event_participants, calendar_event_reminders, work_order_first_piece_dimensions, messages, notifications, employee_roles, daily_machine_inspections, daily_machine_inspection_items, machine_maintenance_tasks, production_records, quality_issue_reports, shipping_quality_inspections | companies, departments, employee_roles, lookup_values | - |
| OK | inventory_items | inventory_items | POST, PUT, DELETE | inventory_items, work_orders | work_orders, inventory_transactions, shipping_orders, shipping_order_items | order_items, return_orders, screening_items, shipping_order_items, shipping_orders, suppliers, work_orders | - |
| OK | inventory_transactions | inventory_transactions | - | - | - | inventory_items, return_orders, shipping_order_items, shipping_orders, work_orders | - |
| OK | lookup_domains | lookup_domains | DELETE | (helper) | lookup_values | - | - |
| OK | lookup_values | lookup_values | - | - | orders, customers, suppliers, employees, work_orders, screening_items | lookup_domains | - |
| OK | machine_maintenance_tasks | machine_maintenance_tasks | DELETE | (helper) | machines | employees, machines | - |
| OK | machines | machines | POST, PUT, DELETE | machines | work_orders, machine_maintenance_tasks, daily_machine_inspections, production_records, production_work_order_schedule | machine_maintenance_tasks | - |
| OK | notifications | notifications | POST, DELETE | (helper) | dashboard | departments, employees, roles | - |
| OK | order_items | order_items | POST, DELETE | order_items | orders, work_orders, inventory_items | orders, screening_items, screening_services, shipping_order_items, shipping_orders, tools, work_orders | - |
| OK | orders | orders | POST, DELETE | (helper), order_items | order_items, work_orders, dashboard | customers, employees, lookup_values, order_items, screening_services, suppliers, work_orders | - |
| OK | permissions | permissions | DELETE | (helper) | role_permissions | role_permissions | - |
| OK | production_quality_records | production_quality_records | POST, DELETE | production_quality_records | work_orders | - | - |
| OK | production_records | production_records | - | - | - | employees, machines, work_orders | - |
| OK | quality_issue_reports | quality_issue_reports | DELETE | (helper) | dashboard | departments, employees | - |
| OK | return_orders | return_orders | DELETE | (helper) | inventory_items, inventory_transactions, shipping_orders, shipping_order_items | customers, shipping_order_items, shipping_orders | - |
| OK | role_permissions | role_permissions | PUT | (helper) | roles, permissions | permissions, roles | - |
| OK | roles | roles | DELETE | (helper) | notifications, employee_roles, role_permissions | employee_roles, role_permissions | - |
| OK | screening_items | screening_items | DELETE | screening_items | order_items, screening_services, inventory_items | lookup_values | - |
| OK | screening_services | screening_services | POST, DELETE | screening_services | orders, order_items | customers, screening_items | - |
| OK | shipping_order_items | shipping_order_items | - | - | shipping_orders, order_items, inventory_items, inventory_transactions, return_orders | inventory_items, return_orders, shipping_orders | - |
| OK | shipping_orders | shipping_orders | POST, PUT, DELETE | return_orders, shipping_orders | shipping_order_items, inventory_items, order_items, inventory_transactions, return_orders, dashboard, shipping_quality_inspections | inventory_items, return_orders, shipping_order_items, shipping_quality_inspections | - |
| OK | shipping_quality_inspections | shipping_quality_inspections | POST, PUT, DELETE | (helper) | shipping_orders | employees, shipping_orders | - |
| OK | suppliers | suppliers | POST, DELETE | suppliers | orders, inventory_items | companies, lookup_values | - |
| OK | tools | tools | DELETE | tools | work_orders, order_items | - | - |
| OK | work_order_first_piece_dimensions | work_order_first_piece_dimensions | POST, DELETE | (helper) | work_orders | employees, work_orders | - |
| OK | work_order_images | work_order_images | - | - | work_orders | work_orders | - |
| OK | work_orders | work_orders | POST, DELETE | inventory_items, work_orders | order_items, orders, work_order_images, work_order_first_piece_dimensions, inventory_items, inventory_transactions, dashboard, production_records, production_work_order_schedule | employees, inventory_items, lookup_values, machines, order_items, orders, production_quality_records, tools, work_order_first_piece_dimensions, work_order_images | - |

## Recommended Order

- P2 audit_logs: crud_module_without_dependents
- P2 calendar_event_participants: crud_module_without_dependents
- P2 dashboard: crud_module_without_dependents
- P2 domain_event_outbox: crud_module_without_dependents
- P2 messages: crud_module_without_dependents
- P2 number_sequences: crud_module_without_dependents
- P2 production_work_order_schedule: crud_module_without_dependents
- P2 report_descriptions: crud_module_without_dependents
- P2 security_settings: crud_module_without_dependents
- P2 system_parameters: crud_module_without_dependents

## Stateful Refresh Review

These modules keep local UI state such as caches, expanded rows, open detail modals, edit modals, or action buttons. When dependencies change, manual review must confirm the open state is refreshed, not only the main list.

| Module | Signals | Dependency Sources | Has onDependencyUpdate | Notes |
| --- | --- | --- | --- | --- |
| calendar_event_participants | edit_modal, button_state | dashboard_calendar_events, employees | yes | verify open state refresh path |
| calendar_event_reminders | edit_modal, button_state | dashboard_calendar_events, employees | yes | verify open state refresh path |
| customers | cache, detail_modal, edit_modal, button_state | companies, lookup_values | no | uses generic onRefresh; inspect open state manually |
| daily_machine_inspection_items | edit_modal, button_state | daily_machine_inspections, employees | no | uses generic onRefresh; inspect open state manually |
| daily_machine_inspections | edit_modal, button_state | daily_machine_inspection_items, employees, machines | no | uses generic onRefresh; inspect open state manually |
| dashboard | edit_modal, button_state | dashboard_calendar_events, notifications, orders, quality_issue_reports, shipping_orders, work_orders | yes | verify open state refresh path |
| dashboard_calendar_events | edit_modal, button_state | calendar_event_reminders | no | uses generic onRefresh; inspect open state manually |
| employee_roles | edit_modal, button_state | employees, roles | no | uses generic onRefresh; inspect open state manually |
| employees | cache, edit_modal, button_state | companies, departments, employee_roles, lookup_values | no | uses generic onRefresh; inspect open state manually |
| inventory_items | detail_modal, edit_modal, button_state | order_items, return_orders, screening_items, shipping_order_items, shipping_orders, suppliers, work_orders | yes | verify open state refresh path |
| inventory_transactions | detail_modal, edit_modal, button_state | inventory_items, return_orders, shipping_order_items, shipping_orders, work_orders | no | uses generic onRefresh; inspect open state manually |
| lookup_values | button_state | lookup_domains | no | uses generic onRefresh; inspect open state manually |
| machine_maintenance_tasks | edit_modal, button_state | employees, machines | no | uses generic onRefresh; inspect open state manually |
| machines | cache, edit_modal, button_state | machine_maintenance_tasks | no | uses generic onRefresh; inspect open state manually |
| messages | detail_modal, edit_modal, button_state | employees | yes | verify open state refresh path |
| notifications | detail_modal, edit_modal, button_state | departments, employees, roles | no | uses generic onRefresh; inspect open state manually |
| order_items | edit_modal, button_state | orders, screening_items, screening_services, shipping_order_items, shipping_orders, tools, work_orders | yes | verify open state refresh path |
| orders | cache, expanded_row, edit_modal, button_state | customers, employees, lookup_values, order_items, screening_services, suppliers, work_orders | yes | verify open state refresh path |
| permissions | cache, edit_modal, button_state | role_permissions | no | uses generic onRefresh; inspect open state manually |
| production_records | cache, detail_modal, edit_modal, button_state | employees, machines, work_orders | yes | verify open state refresh path |
| production_work_order_schedule | edit_modal, button_state | machines, work_orders | yes | verify open state refresh path |
| quality_issue_reports | detail_modal, edit_modal, button_state | departments, employees | no | uses generic onRefresh; inspect open state manually |
| return_orders | detail_modal, edit_modal, button_state | customers, shipping_order_items, shipping_orders | yes | verify open state refresh path |
| role_permissions | edit_modal, button_state | permissions, roles | no | uses generic onRefresh; inspect open state manually |
| roles | cache, edit_modal, button_state | employee_roles, role_permissions | no | uses generic onRefresh; inspect open state manually |
| screening_items | edit_modal, button_state | lookup_values | no | uses generic onRefresh; inspect open state manually |
| screening_services | cache, edit_modal, button_state | customers, screening_items | no | uses generic onRefresh; inspect open state manually |
| shipping_order_items | edit_modal, button_state | inventory_items, return_orders, shipping_orders | yes | verify open state refresh path |
| shipping_orders | detail_modal, edit_modal, button_state | inventory_items, return_orders, shipping_order_items, shipping_quality_inspections | yes | verify open state refresh path |
| shipping_quality_inspections | cache, detail_modal, edit_modal, button_state | employees, shipping_orders | yes | verify open state refresh path |
| suppliers | cache, edit_modal, button_state | companies, lookup_values | no | uses generic onRefresh; inspect open state manually |
| work_order_first_piece_dimensions | detail_modal, edit_modal, button_state | employees, work_orders | yes | verify open state refresh path |
| work_order_images | edit_modal, button_state | work_orders | no | uses generic onRefresh; inspect open state manually |
| work_orders | cache, edit_modal, button_state | employees, inventory_items, lookup_values, machines, order_items, orders, production_quality_records, tools, work_order_first_piece_dimensions, work_order_images | yes | verify open state refresh path |
