# DataSync Remediation Plan

## Goal

Make cross-tab and cross-module updates reliable across the whole MES frontend.
When page A creates, updates, deletes, converts, ships, returns, uploads, or
changes a status, every already-open related page B must refresh its data and
recompute action buttons.

## Current Baseline

- DataSync core exists in `js/data-sync.js`.
- Dependency fan-out exists in `MODULE_DEPENDENCIES`.
- Most core modules already call `DataSync.createModuleHelper`.
- A static audit tool now exists: `tools/audit-data-sync.js`.
- Latest generated report: `docs/data-sync-audit.md`.

## Work Order

### 1. Audit and Tracking

- Run `node tools/audit-data-sync.js --write docs/data-sync-audit.md`.
- Treat the report as a risk map, not an automatic truth source.
- Any module with CRUD must either use `dataSyncHelper.notify*()` or direct
  `DataSync.notifyWithDependencies(...)`.
- Any module with dependency sources must have a refresh path that rerenders
  data and action buttons.

### 2. P0 Core Workflow Review

Review these first because they control the main business chain:

- `orders`
- `order_items`
- `work_orders`
- `inventory_items`
- `shipping_orders`
- `return_orders`

For each module, verify:

- Same-module updates refresh another open tab of the same module.
- Dependency updates refresh related lists.
- Open detail modals refresh or close safely after related changes.
- Action buttons are recalculated after refresh.
- CRUD success paths emit DataSync events only after the API confirms success.

### 3. Critical Button-State Scenarios

These must be tested manually or automated:

- `order_items` create-work-order button disables after a work order is created.
- `work_orders` convert-to-inventory button disables after inventory is created.
- `work_orders` delete button disables for completed or lifecycle-locked work orders.
- `inventory_items` add-to-shipping button updates after shipping allocation.
- `shipping_orders` return buttons update after return order creation.
- `return_orders` changes refresh shipping return status.

### 4. Dependency Matrix Cleanup

Review and adjust `MODULE_DEPENDENCIES` for all business flows:

- `orders` -> `order_items`, `work_orders`, `dashboard`
- `order_items` -> `orders`, `work_orders`, `inventory_items`
- `work_orders` -> `order_items`, `work_order_images`,
  `work_order_first_piece_dimensions`, `inventory_items`,
  `inventory_transactions`, `dashboard`, `production_records`
- `inventory_items` -> `work_orders`, `inventory_transactions`,
  `shipping_orders`, `shipping_order_items`
- `shipping_orders` -> `shipping_order_items`, `inventory_items`,
  `order_items`, `inventory_transactions`, `return_orders`, `dashboard`,
  `shipping_quality_inspections`
- `return_orders` -> `inventory_items`, `inventory_transactions`,
  `shipping_orders`, `shipping_order_items`

### 5. P1 Module Cleanup

After P0, fix modules flagged by the audit report:

- customer and supplier option sources
- employee, role, permission assignment modules
- machine and maintenance modules
- daily inspection modules
- quality modules
- lookup modules
- notification and dashboard modules

### 6. Regression Checklist

Use two open MES tabs in the same browser and, where possible, another browser
window:

- A updates data, B updates within one debounce cycle.
- B has an open modal, and its data does not become misleading.
- Buttons reflect the new state after dependency refresh.
- Deleted rows disappear or become unavailable.
- No duplicate refresh loops occur.

### 7. Definition of Done

- `node tools/audit-data-sync.js --write docs/data-sync-audit.md` has no P0.
- Core workflow manual tests pass.
- Any remaining P1/P2 items are documented with reason and owner.
- `.github/copilot-instructions.md` includes the DataSync requirements for new
  modules and new CRUD flows.
