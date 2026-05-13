# DataSync Regression Checklist

Use this checklist after changing any module that performs CRUD, changes lifecycle status, or controls action buttons from server data.

## Baseline Commands

Run these commands before manual verification:

```powershell
node --check js/data-sync.js
node --check tools/audit-data-sync.js
node tools/audit-data-sync.js --write docs/data-sync-audit.md
```

Expected audit result:

- `P0: 0`
- `P1: 0`
- Review `Stateful Refresh Review` in `docs/data-sync-audit.md` for any module touched in the change.

## Test Setup

- Open the MES system in one browser window.
- Open two system tabs inside the app, for example `orders` and `work_orders`.
- Also open a second browser tab pointing to the same MES URL for cross-browser-tab verification.
- Keep DevTools Console open and filter for `[DataSync]`.

## Core Workflow Scenarios

### Orders To Order Items And Work Orders

- Open `orders`, `order_items`, and `work_orders`.
- Create or update an order.
- Verify `order_items` refreshes its order context/options.
- Verify `work_orders` refreshes list rows and action buttons.
- Confirm console shows `orders - updated/created` and dependent updates.

### Order Items To Orders, Work Orders, And Inventory

- Open `order_items`, `orders`, `work_orders`, and `inventory_items`.
- Add, update, or delete an order item.
- Verify order totals/status display refreshes.
- Expand the affected order in `orders` before editing in `order_items`, then verify the already-open inline detail row refreshes its weight, units, amount, status, and work-order button state without closing/reopening the detail row.
- Verify work-order creation/status buttons refresh.
- Verify inventory-related conversion/allocation buttons refresh.

### Work Orders To Inventory And Dashboard

- Open `work_orders`, `inventory_items`, `inventory_transactions`, and `dashboard`.
- Change work-order status or complete a work order.
- Keep a work-order edit modal open in another tab and verify order data, screening service details, inventory-conversion state, and action buttons refresh after related `order_items`, `inventory_items`, first-piece, image, or production-quality changes.
- Verify inventory conversion buttons and inventory list refresh.
- Verify dashboard work-order stats refresh.
- Verify production records refresh if open.

### Inventory To Shipping And Work Orders

- Open `inventory_items`, `shipping_orders`, `shipping_order_items`, and `work_orders`.
- Create/update/delete inventory or perform a conversion that changes available inventory.
- Verify shipping allocation buttons refresh.
- Verify work-order inventory-conversion buttons refresh.
- Verify inventory transaction list refreshes if open.

### Shipping And Return Flow

- Open `shipping_orders`, `shipping_order_items`, `inventory_items`, `inventory_transactions`, and `return_orders`.
- Create/update/delete a shipping order or shipping item.
- Keep the shipping detail modal, add-item modal, create-return modal, and quick-return modal open in separate tests; verify available inventory and returnable quantities refresh after shipping item, inventory, or return changes.
- Verify return-order options/status refresh.
- Verify inventory quantities and transaction rows refresh.
- Create or update a return order.
- Verify shipping order/item status and inventory quantities refresh.

### Notifications And Dashboard

- Open `dashboard` and `notifications`.
- Open an unread announcement from the dashboard ticker.
- Verify the notification becomes read in `notifications` without manually refreshing.
- Verify dashboard announcement area can refresh through the `notifications` dependency.

## Cross Browser Tab Scenarios

- Repeat one core workflow in browser tab A while the related module is open in browser tab B.
- Verify browser tab B receives the localStorage-backed DataSync event.
- Confirm no duplicate refresh storm appears in the console.

## Pass Criteria

- All changed modules emit a DataSync notification after successful server writes.
- Dependent modules refresh list data, open detail data, dropdown options, and action button states.
- `docs/data-sync-audit.md` remains at `P0: 0` and `P1: 0`.
- No module relies on manual browser refresh to show the latest action availability.
