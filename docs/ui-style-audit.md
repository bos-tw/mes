# UI Style Audit

Generated: 2026-07-19T09:50:40.724Z

Scanned files: `styles.css`

## Summary

| Item | Count |
|------|------:|
| Total hardcoded spacing/radius findings | 751 |
| Token candidates | 380 |
| Needs review | 371 |
| Covered by ui-token-exception | 0 |

## Top Properties

| Property | Count |
|----------|------:|
| `padding` | 176 |
| `gap` | 156 |
| `border-radius` | 95 |
| `margin-bottom` | 70 |
| `height` | 49 |
| `min-height` | 49 |
| `margin-top` | 40 |
| `margin` | 37 |
| `max-height` | 19 |
| `margin-right` | 13 |
| `padding-right` | 10 |
| `padding-top` | 10 |
| `padding-bottom` | 9 |
| `padding-left` | 8 |
| `margin-left` | 6 |
| `column-gap` | 2 |
| `border-top-left-radius` | 1 |
| `border-top-right-radius` | 1 |

## Top Values

| Value | Count |
|-------|------:|
| `gap: 8px` | 37 |
| `border-radius: 6px` | 30 |
| `gap: 12px` | 24 |
| `gap: 10px` | 21 |
| `margin-bottom: 12px` | 19 |
| `border-radius: 4px` | 18 |
| `border-radius: 8px` | 16 |
| `gap: 6px` | 14 |
| `padding: 10px 12px` | 14 |
| `gap: 4px` | 11 |
| `padding: 12px` | 11 |
| `gap: 16px` | 10 |
| `margin-top: 8px` | 10 |
| `margin-bottom: 15px` | 8 |
| `padding: 10px 14px` | 8 |
| `padding: 16px` | 8 |
| `gap: 0.75rem` | 7 |
| `margin-bottom: 16px` | 7 |
| `margin-bottom: 8px` | 7 |
| `padding: 12px 16px` | 7 |
| `border-radius: 10px` | 6 |
| `border-radius: 12px` | 6 |
| `margin-bottom: 10px` | 6 |
| `margin-right: 6px` | 6 |
| `margin-top: 4px` | 6 |
| `padding: 20px` | 6 |
| `height: 18px` | 5 |
| `height: 36px` | 5 |
| `margin-bottom: 20px` | 5 |
| `margin-bottom: 4px` | 5 |

## Findings

| File | Line | Selector | Declaration | Classification | Suggested token |
|------|-----:|----------|-------------|----------------|-----------------|
| `styles.css` | 215 | `@page` | `margin: 12mm` | review |  |
| `styles.css` | 250 | `.app-container` | `height: 100vh` | review |  |
| `styles.css` | 492 | `.dropdown-divider` | `height: 1px` | review |  |
| `styles.css` | 514 | `.weekday-badge` | `padding: 4px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 527 | `.weekday-text` | `margin-left: 5px` | review |  |
| `styles.css` | 555 | `.record-link-button:focus-visible` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 732 | `.subtext` | `margin-top: 2px` | review |  |
| `styles.css` | 754 | `.text-warning i` | `margin-right: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 854 | `.menu-item` | `margin-bottom: 2px` | review |  |
| `styles.css` | 888 | `.menu-item.active > .menu-link` | `padding-left: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 907 | `.menu-item.active .submenu` | `max-height: 500px` | review |  |
| `styles.css` | 1036 | `.tab-header` | `padding: 10px 15px` | review |  |
| `styles.css` | 1040 | `.tab-header` | `margin-bottom: -1px` | review |  |
| `styles.css` | 1042 | `.tab-header` | `border-top-left-radius: 5px` | review |  |
| `styles.css` | 1043 | `.tab-header` | `border-top-right-radius: 5px` | review |  |
| `styles.css` | 1046 | `.tab-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1064 | `.tab-header .close-tab` | `margin-left: 5px` | review |  |
| `styles.css` | 1077 | `.tab-content-area` | `padding: 20px` | review |  |
| `styles.css` | 1092 | `.example-table-container` | `margin-top: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1161 | `.data-table input[type="checkbox"]` | `height: 16px` | review |  |
| `styles.css` | 1258 | `body.login-page` | `min-height: 100vh` | review |  |
| `styles.css` | 1268 | `.login-wrapper` | `padding: 32px 16px` | review |  |
| `styles.css` | 1275 | `.login-card` | `padding: 48px` | review |  |
| `styles.css` | 1278 | `.login-card` | `gap: 32px` | review |  |
| `styles.css` | 1286 | `.login-brand` | `padding-right: 32px` | review |  |
| `styles.css` | 1292 | `.login-brand h1` | `margin-top: 18px` | review |  |
| `styles.css` | 1298 | `.brand-logo img.company-logo-img` | `height: 68px` | review |  |
| `styles.css` | 1305 | `.login-brand p` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1311 | `.login-brand .system-subtitle` | `margin-top: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1318 | `.login-brand .login-hint` | `margin-top: 14px` | review |  |
| `styles.css` | 1323 | `.brand-logo` | `height: 76px` | review |  |
| `styles.css` | 1341 | `.login-card form` | `gap: 18px` | review |  |
| `styles.css` | 1347 | `.form-group label` | `margin-bottom: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1353 | `.form-group .form-control` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1378 | `.toggle-password` | `padding: 4px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1390 | `.remember-me` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1395 | `.login-button` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1400 | `.login-button` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1418 | `.login-success` | `margin-top: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1419 | `.login-success` | `padding: 12px 14px` | review |  |
| `styles.css` | 1437 | `.login-hint` | `padding: 24px` | review |  |
| `styles.css` | 1443 | `.login-hint h2` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1455 | `.sample-accounts td` | `padding: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1467 | `.sample-accounts code` | `padding: 2px 5px` | review |  |
| `styles.css` | 1476 | `.login-footer` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1481 | `.login-card` | `padding: 32px` | review |  |
| `styles.css` | 1488 | `.login-brand` | `padding-bottom: 24px` | review |  |
| `styles.css` | 1502 | `.content-header.with-actions` | `gap: 16px` | review |  |
| `styles.css` | 1520 | `.content-header.with-actions.sticky` | `padding: 16px 20px` | review |  |
| `styles.css` | 1521 | `.content-header.with-actions.sticky` | `margin: -20px -20px 20px -20px` | review |  |
| `styles.css` | 1529 | `.content-header.with-actions .subtitle` | `margin: 4px 0 0` | review |  |
| `styles.css` | 1537 | `.header-actions` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1595 | `.btn.text` | `padding: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1599 | `.btn.text` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1605 | `.btn.text` | `height: 30px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 1844 | `.btn-dropdown-wrapper .dropdown-menu` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1852 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1853 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item` | `padding: 10px 14px` | review |  |
| `styles.css` | 1869 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item:first-child` | `border-radius: 6px 6px 0 0` | review |  |
| `styles.css` | 1873 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item:last-child` | `border-radius: 0 0 6px 6px` | review |  |
| `styles.css` | 1913 | `.summary-cards` | `gap: 1rem` | review |  |
| `styles.css` | 1915 | `.summary-cards` | `margin-bottom: 1rem` | review |  |
| `styles.css` | 1921 | `.summary-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1922 | `.summary-card` | `padding: 1rem 1.25rem` | review |  |
| `styles.css` | 1925 | `.summary-card` | `gap: 1rem` | review |  |
| `styles.css` | 1946 | `.summary-card .summary-label` | `margin-bottom: 0.25rem` | review |  |
| `styles.css` | 1972 | `.filter-summary-bar` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 2004 | `.filter-count` | `height: 18px` | review |  |
| `styles.css` | 2039 | `.filter-drawer` | `height: 100vh` | review |  |
| `styles.css` | 2183 | `.filter-form .form-grid label:not(.filter-checkbox) > select` | `min-height: 38px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 2264 | `.checkbox-label` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 2435 | `.form-grid label.inline-label input[type="checkbox"]` | `height: 16px` | review |  |
| `styles.css` | 2710 | `.modal-alert::before` | `margin-top: 1px` | review |  |
| `styles.css` | 2769 | `.form-panel` | `margin-top: 25px` | review |  |
| `styles.css` | 2770 | `.form-panel` | `padding: 20px` | review |  |
| `styles.css` | 2772 | `.form-panel` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 2778 | `.form-panel h3` | `margin-bottom: 15px` | review |  |
| `styles.css` | 2784 | `.form-panel small` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 2807 | `:is(td.table-actions, td.actions, td.actions-cell, td.actions-col) .op-action-btn` | `height: 30px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 2808 | `:is(td.table-actions, td.actions, td.actions-cell, td.actions-col) .op-action-btn` | `padding: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3094 | `.modal-overlay` | `padding: 20px` | review |  |
| `styles.css` | 3103 | `.modal-window` | `max-height: 80vh` | review |  |
| `styles.css` | 3157 | `.column-selector` | `max-height: 80vh` | review |  |
| `styles.css` | 3165 | `.column-selector-header` | `padding: 15px` | review |  |
| `styles.css` | 3203 | `.column-selector-body` | `padding: 15px` | review |  |
| `styles.css` | 3209 | `.column-selector-body .column-option` | `padding: 8px 0` | review |  |
| `styles.css` | 3219 | `.column-selector-body .column-option input[type="checkbox"]` | `margin-right: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3221 | `.column-selector-body .column-option input[type="checkbox"]` | `height: 18px` | review |  |
| `styles.css` | 3231 | `.column-selector-footer` | `padding: 12px 15px` | review |  |
| `styles.css` | 3234 | `.column-selector-footer` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3237 | `.column-selector-footer` | `border-radius: 0 0 8px 8px` | review |  |
| `styles.css` | 3334 | `.role-permission-transfer-section label.inline-label` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3343 | `.role-permission-transfer-section label.inline-label span` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3348 | `.role-permission-transfer-section label.inline-label select` | `min-height: 260px` | review |  |
| `styles.css` | 3349 | `.role-permission-transfer-section label.inline-label select` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3362 | `.role-permission-transfer-controls-box` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3363 | `.role-permission-transfer-controls-box` | `min-height: 260px` | review |  |
| `styles.css` | 3368 | `.role-permission-transfer-controls-box .btn` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3388 | `.form-address` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3394 | `.form-address label` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3436 | `.screening-create-panel` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3445 | `.screening-create-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3456 | `.screening-create-header` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3468 | `.screening-create-body` | `padding: 16px` | review |  |
| `styles.css` | 3478 | `.screening-create-footer` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3480 | `.screening-create-footer` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3488 | `.screening-create-footer .btn.small` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3494 | `.checkbox-field` | `gap: 5px` | review |  |
| `styles.css` | 3504 | `.checkbox-field input[type="checkbox"]` | `height: 18px` | review |  |
| `styles.css` | 3511 | `.file-input-group` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3521 | `.file-input-group label.file-upload-btn` | `padding: 6px 12px` | review |  |
| `styles.css` | 3544 | `.file-input-group label.file-upload-btn i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3550 | `.file-input-group .file-hint` | `margin-left: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3556 | `.invoice-stamp-preview` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3558 | `.invoice-stamp-preview` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3559 | `.invoice-stamp-preview` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3565 | `.invoice-stamp-preview img` | `max-height: 200px` | review |  |
| `styles.css` | 3567 | `.invoice-stamp-preview img` | `margin: 0 auto 8px` | review |  |
| `styles.css` | 3569 | `.invoice-stamp-preview img` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3575 | `.invoice-stamp-preview .preview-actions` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3580 | `.invoice-stamp-preview .icon-button` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3581 | `.invoice-stamp-preview .icon-button` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3590 | `.attachment-preview` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3592 | `.attachment-preview` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3593 | `.attachment-preview` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3603 | `.attachment-preview .preview-info` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3615 | `.attachment-preview .preview-actions` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3620 | `.attachment-preview .icon-button` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3621 | `.attachment-preview .icon-button` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3629 | `.field-hint` | `margin-top: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3645 | `.modal-window form .form-grid label small` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3656 | `.modal-window.number-sequences-modal .form-grid` | `gap: 14px` | review |  |
| `styles.css` | 3683 | `.modal-window.number-sequences-modal label.inline-label > small` | `margin-top: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3768 | `.modal-window.customers-modal form[data-customers-form]` | `gap: 14px 12px` | review |  |
| `styles.css` | 3797 | `.modal-window.customers-modal .form-row > .form-section > .customer-modal-grid` | `gap: 8px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3868 | `.modal-window.customers-modal .customer-stamp-field` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3869 | `.modal-window.customers-modal .customer-stamp-field` | `min-height: 72px` | review |  |
| `styles.css` | 3878 | `.modal-window.customers-modal .customer-stamp-field > span` | `padding: 4px 10px` | review |  |
| `styles.css` | 3891 | `.modal-window.customers-modal .customer-stamp-control` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3897 | `.modal-window.customers-modal .customer-stamp-control .field-hint` | `margin: 6px 0 0` | review |  |
| `styles.css` | 3905 | `.modal-window.customers-modal .customer-stamp-control .file-input-group` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3951 | `.modal-window.suppliers-modal form[data-suppliers-form]` | `gap: 14px 12px` | review |  |
| `styles.css` | 3980 | `.modal-window.suppliers-modal .form-row > .form-section > .supplier-modal-grid` | `gap: 8px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4010 | `.modal-window.suppliers-modal .supplier-attachment-field` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4011 | `.modal-window.suppliers-modal .supplier-attachment-field` | `min-height: 72px` | review |  |
| `styles.css` | 4020 | `.modal-window.suppliers-modal .supplier-attachment-field > span` | `padding: 4px 10px` | review |  |
| `styles.css` | 4033 | `.modal-window.suppliers-modal .supplier-attachment-control` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4039 | `.modal-window.suppliers-modal .supplier-attachment-control .field-hint` | `margin: 6px 0 0` | review |  |
| `styles.css` | 4047 | `.modal-window.suppliers-modal .supplier-attachment-control .file-input-group` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4107 | `.detail-content` | `padding: 10px 0` | review |  |
| `styles.css` | 4113 | `.detail-content dl` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4114 | `.detail-content dl` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4115 | `.detail-content dl` | `padding: 15px` | review |  |
| `styles.css` | 4117 | `.detail-content dl` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4123 | `.detail-content dl > div` | `gap: 15px` | review |  |
| `styles.css` | 4125 | `.detail-content dl > div` | `padding: 8px 0` | review |  |
| `styles.css` | 4147 | `.detail-content dl.inventory-detail-list` | `column-gap: 20px` | review |  |
| `styles.css` | 4239 | `.subsection` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4240 | `.subsection` | `padding: 16px` | review |  |
| `styles.css` | 4242 | `.subsection` | `margin-bottom: 15px` | review |  |
| `styles.css` | 4245 | `.subsection` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4252 | `.subsection-header` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4253 | `.subsection-header` | `padding-bottom: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4282 | `.image-gallery` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4283 | `.image-gallery` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4284 | `.image-gallery` | `min-height: 100px` | review |  |
| `styles.css` | 4293 | `.image-gallery .empty-state` | `padding: 40px 20px` | review |  |
| `styles.css` | 4299 | `.image-gallery .empty-state i` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4306 | `.image-gallery .image-item` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4324 | `.image-gallery .image-item .btn-delete` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4326 | `.image-gallery .image-item .btn-delete` | `height: 28px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 4343 | `.order-items-modal` | `max-height: 85vh` | review |  |
| `styles.css` | 4371 | `.order-items-modal .order-items-modal-body::-webkit-scrollbar-track` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4376 | `.order-items-modal .order-items-modal-body::-webkit-scrollbar-thumb` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4432 | `.metrics-comparison-container` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4433 | `.metrics-comparison-container` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4448 | `.metrics-comparison-container .metrics-subtitle` | `margin: 0 0 8px 0` | review |  |
| `styles.css` | 4449 | `.metrics-comparison-container .metrics-subtitle` | `padding-bottom: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4464 | `.metrics-comparison-container .metric` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4465 | `.metrics-comparison-container .metric` | `padding: 5px 0` | review |  |
| `styles.css` | 4517 | `.table-secondary` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4525 | `.stacked-inputs` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4543 | `.order-items-services-table th:nth-child(3)` | `padding-left: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4544 | `.order-items-services-table th:nth-child(3)` | `padding-right: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4550 | `.order-items-services-table td:nth-child(6)` | `padding-left: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4551 | `.order-items-services-table td:nth-child(6)` | `padding-right: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4565 | `.modal-window.work-orders-modal` | `max-height: 90vh` | review |  |
| `styles.css` | 4569 | `.work-orders-modal h3[data-modal-title]` | `margin-bottom: 15px` | review |  |
| `styles.css` | 4571 | `.work-orders-modal h3[data-modal-title]` | `padding-right: 40px` | review |  |
| `styles.css` | 4575 | `.work-orders-modal .modal-alert` | `margin-bottom: 15px` | review |  |
| `styles.css` | 4593 | `.work-orders-modal-body` | `padding-right: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4602 | `.work-orders-modal-body::-webkit-scrollbar-track` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4607 | `.work-orders-modal-body::-webkit-scrollbar-thumb` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4615 | `.work-orders-modal-footer` | `padding-top: 15px` | review |  |
| `styles.css` | 4634 | `.rescreen-batches-modal` | `max-height: 88vh` | review |  |
| `styles.css` | 4636 | `.rescreen-batches-modal` | `padding: 20px 20px 16px` | review |  |
| `styles.css` | 4641 | `.rescreen-batches-modal h3` | `margin-bottom: 14px` | review |  |
| `styles.css` | 4646 | `.rescreen-batches-modal > .modal-alert` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4653 | `.rescreen-batches-modal form` | `gap: 14px` | review |  |
| `styles.css` | 4669 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-header` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4671 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-header` | `margin: 0 0 8px` | review |  |
| `styles.css` | 4672 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-header` | `padding: 0 0 6px` | review |  |
| `styles.css` | 4676 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-body` | `padding-left: 2px` | review |  |
| `styles.css` | 4677 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-body` | `padding-right: 2px` | review |  |
| `styles.css` | 4691 | `[data-rescreen-batches-modal] .rescreen-section-title` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4736 | `.rescreen-section-helper` | `margin: 0 0 12px` | review |  |
| `styles.css` | 4740 | `.rescreen-source-summary-grid` | `min-height: 128px` | review |  |
| `styles.css` | 4746 | `.rescreen-source-card` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4749 | `.rescreen-source-card` | `gap: 14px` | review |  |
| `styles.css` | 4750 | `.rescreen-source-card` | `padding: 16px 18px` | review |  |
| `styles.css` | 4764 | `.rescreen-source-card-header` | `gap: 0.75rem` | review |  |
| `styles.css` | 4770 | `.rescreen-source-card-title-group` | `gap: 0.2rem` | review |  |
| `styles.css` | 4791 | `.rescreen-source-card-title-group p` | `margin: 0.15rem 0 0` | review |  |
| `styles.css` | 4797 | `.rescreen-source-card-badge` | `border-radius: 999px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4802 | `.rescreen-source-card-badge` | `padding: 0.35rem 0.8rem` | review |  |
| `styles.css` | 4813 | `.rescreen-source-card-body` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4820 | `.rescreen-source-fact` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4822 | `.rescreen-source-fact` | `gap: 0.35rem` | review |  |
| `styles.css` | 4823 | `.rescreen-source-fact` | `padding: 0.8rem 0.9rem` | review |  |
| `styles.css` | 4851 | `.rescreen-source-state` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4853 | `.rescreen-source-state` | `gap: 0.35rem` | review |  |
| `styles.css` | 4854 | `.rescreen-source-state` | `padding: 16px 18px` | review |  |
| `styles.css` | 4888 | `.rescreen-batches-modal-body` | `padding-right: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4897 | `.rescreen-batches-modal-body::-webkit-scrollbar-track` | `border-radius: 999px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4902 | `.rescreen-batches-modal-body::-webkit-scrollbar-thumb` | `border-radius: 999px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4914 | `.rescreen-batches-modal-footer` | `padding-top: 14px` | review |  |
| `styles.css` | 4924 | `[data-rescreen-batches-detail-modal] .modal-window.xlarge` | `max-height: 88vh` | review |  |
| `styles.css` | 4932 | `[data-rescreen-batches-detail-modal] .detail-content` | `padding: 4px 0 0` | review |  |
| `styles.css` | 4938 | `[data-rescreen-batches-detail-modal] .form-actions` | `margin-top: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4939 | `[data-rescreen-batches-detail-modal] .form-actions` | `padding-top: 14px` | review |  |
| `styles.css` | 4945 | `[data-rescreen-batches-detail-modal] .detail-content .detail-section p` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4951 | `[data-rescreen-batches-detail-modal] .detail-content .detail-grid` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4958 | `[data-rescreen-batches-detail-modal] .detail-content .detail-item` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4961 | `[data-rescreen-batches-detail-modal] .detail-content .detail-item` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4962 | `[data-rescreen-batches-detail-modal] .detail-content .detail-item` | `padding: 12px 14px` | review |  |
| `styles.css` | 5005 | `.rescreen-batches-modal` | `padding: 16px 16px 14px` | review |  |
| `styles.css` | 5028 | `.work-orders-section-layout` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5030 | `.work-orders-section-layout` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5069 | `.work-order-schedule-section .weekday-badge` | `padding: 4px 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5088 | `.work-orders-section-right .table-responsive` | `min-height: 280px` | review |  |
| `styles.css` | 5097 | `.work-order-type-top-section` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5106 | `.work-order-source-mode-hint` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5107 | `.work-order-source-mode-hint` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5109 | `.work-order-source-mode-hint` | `border-radius: 5px` | review |  |
| `styles.css` | 5121 | `.work-order-collapsible-section details` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5129 | `.work-order-collapsible-section summary` | `padding-bottom: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5130 | `.work-order-collapsible-section summary` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5142 | `.work-order-collapsible-section summary::before` | `margin-right: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5226 | `.work-orders-section-right .table-responsive` | `min-height: 220px` | review |  |
| `styles.css` | 5247 | `.work-order-live-time-row` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5248 | `.work-order-live-time-row` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 5250 | `.work-order-live-time-row` | `padding: 10px 14px` | review |  |
| `styles.css` | 5371 | `.work-order-edit-first-piece-card` | `min-height: 200px` | review |  |
| `styles.css` | 5376 | `.work-order-edit-first-piece-card .subsection-body` | `min-height: 140px` | review |  |
| `styles.css` | 5397 | `.work-order-edit-images-card .table-responsive` | `min-height: 120px` | review |  |
| `styles.css` | 5421 | `.work-order-production-mode-tabs` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5422 | `.work-order-production-mode-tabs` | `padding: 0 2px` | review |  |
| `styles.css` | 5430 | `.work-order-production-mode-tabs .tab-btn` | `border-radius: 4px 4px 0 0` | review |  |
| `styles.css` | 5431 | `.work-order-production-mode-tabs .tab-btn` | `padding: 6px 14px` | review |  |
| `styles.css` | 5441 | `.work-order-screening-tabs-section` | `padding: 10px 14px` | review |  |
| `styles.css` | 5471 | `.work-order-production-mode-panel` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5480 | `.work-order-execution-image-tabs` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5494 | `.work-order-image-sections-grid` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5517 | `.work-order-production-mode-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5558 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `height: min(850px, 94vh)` | review |  |
| `styles.css` | 5560 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `max-height: 94vh` | review |  |
| `styles.css` | 5585 | `[data-work-orders-edit-modal] form` | `padding-top: 42px` | review |  |
| `styles.css` | 5769 | `[data-work-orders-edit-modal] .work-order-edit-drawing-card` | `min-height: 82px` | review |  |
| `styles.css` | 5884 | `[data-work-orders-edit-modal] .work-order-edit-service-section` | `min-height: 170px` | review |  |
| `styles.css` | 5892 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card` | `min-height: 170px` | review |  |
| `styles.css` | 5904 | `[data-work-orders-edit-modal] .work-order-edit-service-section .table-responsive` | `min-height: 126px` | review |  |
| `styles.css` | 5905 | `[data-work-orders-edit-modal] .work-order-edit-service-section .table-responsive` | `max-height: 126px` | review |  |
| `styles.css` | 5954 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card .subsection-actions .btn` | `min-height: 25px` | review |  |
| `styles.css` | 5960 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card .subsection-body` | `min-height: 122px` | review |  |
| `styles.css` | 5988 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card textarea` | `height: 24px` | review |  |
| `styles.css` | 5989 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card textarea` | `min-height: 24px` | review |  |
| `styles.css` | 6002 | `[data-work-orders-edit-modal] .work-order-edit-production-records` | `min-height: 230px` | review |  |
| `styles.css` | 6020 | `[data-work-orders-edit-modal] .work-order-production-mode-tabs` | `min-height: 30px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 6032 | `[data-work-orders-edit-modal] .work-order-production-mode-header` | `min-height: 25px` | review |  |
| `styles.css` | 6040 | `[data-work-orders-edit-modal] .work-order-production-mode-header .btn` | `min-height: 25px` | review |  |
| `styles.css` | 6056 | `[data-work-orders-edit-modal] .production-records-table select` | `height: 25px` | review |  |
| `styles.css` | 6057 | `[data-work-orders-edit-modal] .production-records-table select` | `min-height: 25px` | review |  |
| `styles.css` | 6120 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `height: 92vh` | review |  |
| `styles.css` | 6121 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `max-height: 92vh` | review |  |
| `styles.css` | 6323 | `.work-order-mobile-quick-entry-card` | `margin-top: 14px` | review |  |
| `styles.css` | 6324 | `.work-order-mobile-quick-entry-card` | `padding-top: 2px` | review |  |
| `styles.css` | 6329 | `.work-order-mobile-quick-entry-body` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6333 | `.work-order-mobile-quick-entry-qr` | `min-height: 232px` | review |  |
| `styles.css` | 6335 | `.work-order-mobile-quick-entry-qr` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 6340 | `.work-order-mobile-quick-entry-qr` | `padding: 14px` | review |  |
| `styles.css` | 6368 | `.work-order-mobile-quick-entry-actions` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6407 | `[data-work-orders-edit-modal] .work-order-edit-drawing-card` | `min-height: 86px` | review |  |
| `styles.css` | 6573 | `.searchable-select-native` | `height: 1px !important` | review |  |
| `styles.css` | 6617 | `.searchable-select-list` | `max-height: 220px` | review |  |
| `styles.css` | 6677 | `[data-machine-picker-modal] .machine-picker-layout` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6684 | `[data-machine-picker-modal] .machine-picker-groups` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6685 | `[data-machine-picker-modal] .machine-picker-groups` | `max-height: min(52vh, 420px)` | review |  |
| `styles.css` | 6687 | `[data-machine-picker-modal] .machine-picker-groups` | `padding-right: 4px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 6692 | `[data-machine-picker-modal] .machine-picker-group-btn` | `min-height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 6693 | `[data-machine-picker-modal] .machine-picker-group-btn` | `padding: 7px 10px` | review |  |
| `styles.css` | 6721 | `[data-machine-picker-modal] .machine-picker-panel-header` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6722 | `[data-machine-picker-modal] .machine-picker-panel-header` | `margin-top: 2px` | review |  |
| `styles.css` | 6723 | `[data-machine-picker-modal] .machine-picker-panel-header` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 6740 | `[data-machine-picker-modal] .machine-picker-grid` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6741 | `[data-machine-picker-modal] .machine-picker-grid` | `max-height: min(46vh, 360px)` | review |  |
| `styles.css` | 6749 | `[data-machine-picker-modal] .machine-picker-option` | `column-gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6751 | `[data-machine-picker-modal] .machine-picker-option` | `min-height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 6752 | `[data-machine-picker-modal] .machine-picker-option` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 6754 | `[data-machine-picker-modal] .machine-picker-option` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 6841 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card` | `min-height: 175px` | review |  |
| `styles.css` | 6854 | `[data-work-orders-edit-modal] .work-order-edit-production-records` | `min-height: 260px` | review |  |
| `styles.css` | 6961 | `[data-work-orders-edit-modal] .work-order-edit-summary-value > span` | `height: 1px` | review |  |
| `styles.css` | 7307 | `[data-work-orders-edit-modal] .work-order-tool-analysis-empty` | `margin-bottom: 0.75rem` | review |  |
| `styles.css` | 7376 | `[data-work-orders-edit-modal] .work-order-edit-service-section .table-responsive` | `max-height: 210px` | review |  |
| `styles.css` | 7514 | `[data-work-orders-edit-modal] .split-work-order-header h4` | `margin: 0 0 4px` | review |  |
| `styles.css` | 7533 | `[data-work-orders-edit-modal] .split-machine-tab` | `min-height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 7626 | `[data-work-orders-edit-modal] .split-machine-settings-card` | `min-height: 175px` | review |  |
| `styles.css` | 7668 | `[data-work-orders-edit-modal] .split-machine-settings-grid label.full-width textarea` | `min-height: 72px` | review |  |
| `styles.css` | 7795 | `.split-work-order-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7796 | `.split-work-order-header` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7797 | `.split-work-order-header` | `padding-bottom: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7802 | `.split-work-order-header h4` | `margin: 0 0 4px` | review |  |
| `styles.css` | 7808 | `.split-work-order-layout` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7815 | `.split-machine-tabs` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7822 | `.split-machine-tab` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7823 | `.split-machine-tab` | `padding: 8px 12px` | review |  |
| `styles.css` | 7828 | `.split-machine-tab` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7830 | `.split-machine-tab` | `min-height: 42px` | review |  |
| `styles.css` | 7844 | `.split-machine-empty-tabs` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7845 | `.split-machine-empty-tabs` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7853 | `.split-machine-empty-state` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7857 | `.split-machine-empty-state` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7858 | `.split-machine-empty-state` | `padding: 18px` | review |  |
| `styles.css` | 7879 | `.split-machine-content-stack` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7884 | `.split-machine-card` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7885 | `.split-machine-card` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7890 | `.split-machine-card h5` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7898 | `.split-machine-card-header` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7899 | `.split-machine-card-header` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7919 | `.split-production-record-mode-tabs` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7920 | `.split-production-record-mode-tabs` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7941 | `.split-partial-receipt-box` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7942 | `.split-partial-receipt-box` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7944 | `.split-partial-receipt-box` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7948 | `.split-partial-receipt-box` | `margin-top: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8008 | `.work-order-balance-alert` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8009 | `.work-order-balance-alert` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8010 | `.work-order-balance-alert` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8040 | `.work-order-partial-tools-field` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8044 | `.work-order-partial-tools-empty` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8053 | `.work-order-partial-tools-list` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8059 | `.work-order-partial-tool-row` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8061 | `.work-order-partial-tool-row` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8079 | `.work-order-partial-tool-toggle input` | `height: 18px` | review |  |
| `styles.css` | 8084 | `.work-order-partial-tool-meta` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8099 | `.work-order-partial-tool-qty` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8114 | `.work-order-partial-tools-summary` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8115 | `.work-order-partial-tools-summary` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8122 | `.work-order-partial-tools-metric` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8147 | `.work-order-completion-summary` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8148 | `.work-order-completion-summary` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8154 | `.work-order-completion-summary-row` | `gap: 16px` | review |  |
| `styles.css` | 8156 | `.work-order-completion-summary-row` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8157 | `.work-order-completion-summary-row` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8175 | `.work-order-reverse-impact-list` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8176 | `.work-order-reverse-impact-list` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8180 | `.work-order-reverse-impact-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8181 | `.work-order-reverse-impact-item` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8191 | `.inventory-receipt-badge` | `margin-left: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8192 | `.inventory-receipt-badge` | `padding: 2px 6px` | review |  |
| `styles.css` | 8193 | `.inventory-receipt-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8212 | `.split-summary-grid` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8223 | `.split-summary-grid strong` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8233 | `.split-machine-settings-card .subsection-header` | `margin: 0 0 8px` | review |  |
| `styles.css` | 8234 | `.split-machine-settings-card .subsection-header` | `padding: 0 0 6px` | review |  |
| `styles.css` | 8243 | `.split-machine-card-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8249 | `.split-machine-settings-grid` | `gap: 8px 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8261 | `.split-machine-settings-grid label.inline-label > span` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8268 | `.split-machine-settings-grid textarea` | `min-height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 8269 | `.split-machine-settings-grid textarea` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 8270 | `.split-machine-settings-grid textarea` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8278 | `.split-machine-settings-grid label.full-width textarea` | `min-height: 72px` | review |  |
| `styles.css` | 8332 | `.source-selection-section` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8334 | `.source-selection-section` | `border-radius: 5px` | review |  |
| `styles.css` | 8335 | `.source-selection-section` | `padding: 15px` | review |  |
| `styles.css` | 8342 | `.source-selection-section .tabs` | `margin-bottom: 15px` | review |  |
| `styles.css` | 8346 | `.source-selection-section .tab-btn` | `padding: 10px 20px` | review |  |
| `styles.css` | 8379 | `.search-grid` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8381 | `.search-grid` | `margin-bottom: 15px` | review |  |
| `styles.css` | 8390 | `.search-results` | `margin-top: 15px` | review |  |
| `styles.css` | 8392 | `.search-results` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8415 | `.profile-tabs` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8420 | `.profile-tab` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8429 | `.profile-tab` | `margin-bottom: -2px` | review |  |
| `styles.css` | 8443 | `.profile-tab i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8473 | `.version-info-content` | `padding: 20px 0` | review |  |
| `styles.css` | 8478 | `.system-logo` | `margin-bottom: 15px` | review |  |
| `styles.css` | 8485 | `.system-name` | `margin: 10px 0 5px` | review |  |
| `styles.css` | 8491 | `.system-subtitle` | `margin-bottom: 25px` | review |  |
| `styles.css` | 8496 | `.version-details` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8497 | `.version-details` | `padding: 20px` | review |  |
| `styles.css` | 8498 | `.version-details` | `margin: 20px 0` | review |  |
| `styles.css` | 8506 | `.version-item` | `padding: 8px 0` | review |  |
| `styles.css` | 8528 | `.version-features` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8529 | `.version-features` | `padding: 20px` | review |  |
| `styles.css` | 8530 | `.version-features` | `margin: 20px 0` | review |  |
| `styles.css` | 8535 | `.version-features h5` | `margin: 0 0 15px 0` | review |  |
| `styles.css` | 8547 | `.version-features li` | `padding: 6px 0` | review |  |
| `styles.css` | 8556 | `.version-features li::before` | `margin-right: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8562 | `.version-update-list` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8567 | `.version-update-list .version-update-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8568 | `.version-update-list .version-update-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8583 | `.version-update-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8584 | `.version-update-header` | `margin-bottom: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8601 | `.version-update-summary` | `padding-left: 16px` | review |  |
| `styles.css` | 8606 | `.version-update-summary li` | `padding: 2px 0` | review |  |
| `styles.css` | 8614 | `.version-update-empty` | `padding: 6px 0` | review |  |
| `styles.css` | 8618 | `.version-links` | `margin: 25px 0` | review |  |
| `styles.css` | 8624 | `.version-links .btn` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8625 | `.version-links .btn` | `padding: 10px 24px` | review |  |
| `styles.css` | 8630 | `.version-copyright` | `margin-top: 25px` | review |  |
| `styles.css` | 8631 | `.version-copyright` | `padding-top: 20px` | review |  |
| `styles.css` | 8636 | `.version-copyright p` | `margin: 5px 0` | review |  |
| `styles.css` | 8648 | `.menu-divider` | `margin: 8px 0` | review |  |
| `styles.css` | 8657 | `.message-list-container` | `min-height: 300px` | review |  |
| `styles.css` | 8664 | `.message-list` | `gap: 1px` | review |  |
| `styles.css` | 8672 | `.message-item` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8673 | `.message-item` | `padding: 16px` | review |  |
| `styles.css` | 8697 | `.message-avatar` | `height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 8727 | `.message-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8728 | `.message-header` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8748 | `.notification-meta` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8774 | `.notification-footer` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8780 | `.message-actions` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8794 | `.priority-badge` | `padding: 2px 8px` | review |  |
| `styles.css` | 8795 | `.priority-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8823 | `.expired-badge` | `padding: 2px 6px` | review |  |
| `styles.css` | 8824 | `.expired-badge` | `border-radius: 3px` | review |  |
| `styles.css` | 8850 | `.loading-state` | `padding: 60px 20px` | review |  |
| `styles.css` | 8857 | `.loading-state i` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8907 | `.sidebar-tabs-layout` | `min-height: 500px` | review |  |
| `styles.css` | 8962 | `.sidebar-tab-btn .tab-badge` | `height: 20px` | review |  |
| `styles.css` | 9259 | `.message-detail-content` | `padding: 16px 0` | review |  |
| `styles.css` | 9265 | `.detail-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9266 | `.detail-header` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9272 | `.detail-type` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9281 | `.detail-title` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9287 | `.detail-meta` | `gap: 16px` | review |  |
| `styles.css` | 9290 | `.detail-meta` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9291 | `.detail-meta` | `padding-bottom: 16px` | review |  |
| `styles.css` | 9298 | `.detail-meta span` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9314 | `.message-detail-header` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9315 | `.message-detail-header` | `padding-bottom: 16px` | review |  |
| `styles.css` | 9321 | `.message-detail-row` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9322 | `.message-detail-row` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9337 | `.message-detail-subject` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9338 | `.message-detail-subject` | `padding-bottom: 16px` | review |  |
| `styles.css` | 9353 | `.filter-bar` | `gap: 16px` | review |  |
| `styles.css` | 9354 | `.filter-bar` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9356 | `.filter-bar` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9357 | `.filter-bar` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9363 | `.filter-group` | `gap: 16px` | review |  |
| `styles.css` | 9369 | `.filter-group label` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9375 | `.filter-group select` | `padding: 6px 10px` | review |  |
| `styles.css` | 9377 | `.filter-group select` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9386 | `.checkbox-label input[type="checkbox"]` | `margin-right: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9394 | `.form-hint` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9425 | `.table-header-actions` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9426 | `.table-header-actions` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9445 | `.filter-row` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9451 | `.filter-field` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9462 | `.filter-field select` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9464 | `.filter-field select` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9493 | `.section-title` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9497 | `.section-title` | `margin-bottom: 15px` | review |  |
| `styles.css` | 9498 | `.section-title` | `padding-bottom: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9544 | `.event-popup-card` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9548 | `.event-popup-card` | `margin: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9558 | `.event-popup-close` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9576 | `.event-popup-header` | `padding: 20px 20px 16px` | review |  |
| `styles.css` | 9582 | `.event-popup-type-badge` | `padding: 4px 10px` | review |  |
| `styles.css` | 9583 | `.event-popup-type-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9587 | `.event-popup-type-badge` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9596 | `.event-popup-header h4` | `padding-right: 30px` | review |  |
| `styles.css` | 9600 | `.event-popup-body` | `padding: 20px` | review |  |
| `styles.css` | 9606 | `.event-popup-info` | `gap: 14px` | review |  |
| `styles.css` | 9612 | `.event-popup-row` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9620 | `.event-popup-row i` | `margin-top: 2px` | review |  |
| `styles.css` | 9628 | `.event-popup-time` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9634 | `.event-popup-time-separator` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9646 | `.event-popup-footer` | `padding: 16px 20px` | review |  |
| `styles.css` | 9650 | `.event-popup-footer` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9654 | `.event-popup-footer button` | `padding: 10px 20px` | review |  |
| `styles.css` | 9657 | `.event-popup-footer button` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9685 | `.event-popup-footer button.primary i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9690 | `.event-popup-card` | `margin: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9691 | `.event-popup-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9695 | `.event-popup-header` | `padding: 16px` | review |  |
| `styles.css` | 9699 | `.event-popup-body` | `padding: 16px` | review |  |
| `styles.css` | 9703 | `.event-popup-footer` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9721 | `.dashboard-calendar .fc-toolbar` | `padding: 12px 8px` | review |  |
| `styles.css` | 9724 | `.dashboard-calendar .fc-toolbar` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9735 | `.dashboard-calendar .fc-button-group` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9741 | `.dashboard-calendar .fc-button` | `padding: 8px 16px !important` | review |  |
| `styles.css` | 9769 | `.dashboard-calendar .fc-today-button` | `border-radius: 4px !important` | review |  |
| `styles.css` | 9770 | `.dashboard-calendar .fc-today-button` | `margin-right: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9780 | `.dashboard-calendar .fc-next-button` | `padding: 8px 12px !important` | review |  |
| `styles.css` | 9783 | `.dashboard-calendar .fc-next-button` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9797 | `.dashboard-calendar .fc-next-button` | `margin-left: -1px` | review |  |
| `styles.css` | 9806 | `.dashboard-calendar .fc-col-header-cell` | `padding: 12px 0 !important` | review |  |
| `styles.css` | 9838 | `.dashboard-calendar .fc-daygrid-day-frame` | `min-height: 100px` | review |  |
| `styles.css` | 9843 | `.dashboard-calendar .fc-daygrid-day-number` | `padding: 8px !important` | review |  |
| `styles.css` | 9847 | `.dashboard-calendar .fc-daygrid-day-number` | `height: 28px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9852 | `.dashboard-calendar .fc-daygrid-day-number` | `margin: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9878 | `.dashboard-calendar .fc-event` | `border-radius: 4px !important` | review |  |
| `styles.css` | 9879 | `.dashboard-calendar .fc-event` | `padding: 2px 6px !important` | review |  |
| `styles.css` | 9882 | `.dashboard-calendar .fc-event` | `margin: 1px 4px !important` | review |  |
| `styles.css` | 9888 | `.dashboard-calendar .fc-event.dashboard-node-event` | `border-radius: 999px !important` | review |  |
| `styles.css` | 9889 | `.dashboard-calendar .fc-event.dashboard-node-event` | `padding: 1px 8px !important` | review |  |
| `styles.css` | 9903 | `.dashboard-calendar .fc-event-main` | `padding: 1px 2px` | review |  |
| `styles.css` | 9909 | `.dashboard-calendar .fc-event-time` | `margin-right: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9920 | `.dashboard-calendar .fc-daygrid-event-dot` | `height: 8px` | review |  |
| `styles.css` | 9921 | `.dashboard-calendar .fc-daygrid-event-dot` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9929 | `.dashboard-calendar .fc-more-link` | `padding: 2px 6px` | review |  |
| `styles.css` | 9930 | `.dashboard-calendar .fc-more-link` | `margin: 2px 4px` | review |  |
| `styles.css` | 9941 | `.dashboard-calendar .fc-popover` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9948 | `.dashboard-calendar .fc-popover-header` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9954 | `.dashboard-calendar .fc-popover-body` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9959 | `.dashboard-calendar .fc-timegrid-slot` | `height: 48px !important` | review |  |
| `styles.css` | 9967 | `.dashboard-calendar .fc-timegrid-slot-label` | `padding-top: 4px !important` | review |  |
| `styles.css` | 9992 | `.dashboard-calendar .fc-timegrid-allday .fc-timegrid-col-frame` | `min-height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9998 | `.dashboard-calendar .fc-list` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10004 | `.dashboard-calendar .fc-list-day-cushion` | `padding: 12px 16px !important` | review |  |
| `styles.css` | 10024 | `.dashboard-calendar .fc-list-event-time` | `padding: 12px 16px !important` | review |  |
| `styles.css` | 10028 | `.dashboard-calendar .fc-list-event-graphic` | `padding: 12px 8px !important` | review |  |
| `styles.css` | 10034 | `.dashboard-calendar .fc-list-event-dot` | `height: 10px` | review |  |
| `styles.css` | 10038 | `.dashboard-calendar .fc-list-event-title` | `padding: 12px 16px !important` | review |  |
| `styles.css` | 10044 | `.dashboard-calendar .fc-list-empty` | `padding: 40px` | review |  |
| `styles.css` | 10059 | `.dashboard-calendar .fc-toolbar-title` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10063 | `.dashboard-calendar .fc-toolbar-chunk` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10067 | `.dashboard-calendar .fc-button` | `padding: 6px 10px !important` | review |  |
| `styles.css` | 10072 | `.dashboard-calendar .fc-daygrid-day-frame` | `min-height: 70px` | review |  |
| `styles.css` | 10076 | `.dashboard-calendar-section .dashboard-calendar` | `min-height: 500px` | review |  |
| `styles.css` | 10089 | `.announcement-bar-section` | `height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10090 | `.announcement-bar-section` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10099 | `.announcement-bar-label` | `padding: 0 14px` | review |  |
| `styles.css` | 10102 | `.announcement-bar-label` | `gap: 7px` | review |  |
| `styles.css` | 10119 | `.announcement-bar-track` | `height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10127 | `.ticker-placeholder` | `padding: 0 16px` | review |  |
| `styles.css` | 10135 | `.ticker-item` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10137 | `.ticker-item` | `padding: 0 16px` | review |  |
| `styles.css` | 10169 | `.ticker-type-badge` | `padding: 1px 6px` | review |  |
| `styles.css` | 10170 | `.ticker-type-badge` | `border-radius: 2px` | review |  |
| `styles.css` | 10198 | `.announcement-bar-count` | `padding: 0 12px` | review |  |
| `styles.css` | 10210 | `.announcement-modal-meta` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10211 | `.announcement-modal-meta` | `padding: 8px 0 12px` | review |  |
| `styles.css` | 10213 | `.announcement-modal-meta` | `margin-bottom: 14px` | review |  |
| `styles.css` | 10221 | `.announcement-modal-meta .announcement-type-tag` | `padding: 2px 8px` | review |  |
| `styles.css` | 10222 | `.announcement-modal-meta .announcement-type-tag` | `border-radius: 2px` | review |  |
| `styles.css` | 10236 | `.announcement-modal-content` | `max-height: 50vh` | review |  |
| `styles.css` | 10238 | `.announcement-modal-content` | `padding-right: 4px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10245 | `.dashboard-section` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10252 | `.dashboard-section .section-header` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10256 | `.dashboard-section .section-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10266 | `.dashboard-section .section-header h3` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10276 | `.section-header-actions` | `gap: 16px` | review |  |
| `styles.css` | 10284 | `.stats-cards-row` | `gap: 16px` | review |  |
| `styles.css` | 10285 | `.stats-cards-row` | `padding: 16px` | review |  |
| `styles.css` | 10301 | `.stats-card-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10302 | `.stats-card-header` | `padding: 10px 14px` | review |  |
| `styles.css` | 10328 | `.stats-card-body` | `padding: 14px` | review |  |
| `styles.css` | 10331 | `.stats-card-body` | `gap: 16px` | review |  |
| `styles.css` | 10342 | `.stats-main` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10343 | `.stats-main` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10361 | `.stats-sub` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10387 | `.stats-chart-small` | `height: 80px` | review |  |
| `styles.css` | 10400 | `.charts-row` | `gap: 16px` | review |  |
| `styles.css` | 10401 | `.charts-row` | `padding: 0 16px 16px` | review |  |
| `styles.css` | 10410 | `.chart-card.wide` | `min-height: 220px` | review |  |
| `styles.css` | 10414 | `.chart-card.narrow` | `min-height: 220px` | review |  |
| `styles.css` | 10421 | `.chart-card-header` | `padding: 10px 14px` | review |  |
| `styles.css` | 10431 | `.chart-card-header i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10439 | `.chart-year-badge` | `padding: 2px 8px` | review |  |
| `styles.css` | 10443 | `.chart-card-body` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10444 | `.chart-card-body` | `height: 180px` | review |  |
| `styles.css` | 10456 | `.recent-cards-row` | `gap: 16px` | review |  |
| `styles.css` | 10457 | `.recent-cards-row` | `padding: 16px` | review |  |
| `styles.css` | 10468 | `.recent-card-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10469 | `.recent-card-header` | `padding: 10px 14px` | review |  |
| `styles.css` | 10482 | `.recent-card-body` | `max-height: 250px` | review |  |
| `styles.css` | 10494 | `.recent-list .no-data-message` | `padding: 30px` | review |  |
| `styles.css` | 10508 | `.recent-item` | `padding: 10px 14px` | review |  |
| `styles.css` | 10526 | `.item-header` | `margin-bottom: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10537 | `.item-status` | `padding: 2px 8px` | review |  |
| `styles.css` | 10554 | `.item-body` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10569 | `.calendar-container` | `padding: 16px` | review |  |
| `styles.css` | 10573 | `.dashboard-calendar` | `min-height: 500px` | review |  |
| `styles.css` | 10580 | `.calendar-filter-control` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10591 | `.calendar-filter-select` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10594 | `.calendar-filter-select` | `padding: 0 10px` | review |  |
| `styles.css` | 10604 | `.calendar-legend` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10612 | `.legend-item` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10626 | `.dashboard-node-content` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10663 | `.stats-chart-small` | `height: 100px` | review |  |
| `styles.css` | 10685 | `.logo-section` | `margin-top: 1rem` | review |  |
| `styles.css` | 10692 | `.logo-edit-area` | `gap: 1.5rem` | review |  |
| `styles.css` | 10693 | `.logo-edit-area` | `margin-top: 0.5rem` | review |  |
| `styles.css` | 10703 | `.logo-edit-area .file-input-group` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10717 | `.logo-library` | `gap: 0.5rem` | review |  |
| `styles.css` | 10724 | `.logo-empty-state` | `padding: 0.75rem 1rem` | review |  |
| `styles.css` | 10733 | `.logo-create-hint` | `gap: 0.5rem` | review |  |
| `styles.css` | 10734 | `.logo-create-hint` | `padding: 1rem` | review |  |
| `styles.css` | 10737 | `.logo-create-hint` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10756 | `.logo-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10757 | `.logo-item` | `padding: 0.5rem` | review |  |
| `styles.css` | 10774 | `.logo-preview` | `height: 55px` | review |  |
| `styles.css` | 10779 | `.logo-preview` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10810 | `.logo-actions` | `gap: 0.25rem` | review |  |
| `styles.css` | 10811 | `.logo-actions` | `margin-top: 0.4rem` | review |  |
| `styles.css` | 10815 | `.logo-actions .btn` | `padding: 3px 6px` | review |  |
| `styles.css` | 10826 | `.logo-badge` | `padding: 0.1rem 0.4rem` | review |  |
| `styles.css` | 10827 | `.logo-badge` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10851 | `.logo-lightbox img` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10873 | `.rich-editor-toolbar` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10874 | `.rich-editor-toolbar` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10878 | `.rich-editor-toolbar` | `border-radius: 6px 6px 0 0` | review |  |
| `styles.css` | 10884 | `.rich-editor-toolbar button` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10891 | `.rich-editor-toolbar button` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10907 | `.rich-editor-toolbar select` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10908 | `.rich-editor-toolbar select` | `padding: 4px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10910 | `.rich-editor-toolbar select` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10918 | `.toolbar-separator` | `height: 24px` | review |  |
| `styles.css` | 10920 | `.toolbar-separator` | `margin: 0 4px` | review |  |
| `styles.css` | 10924 | `.rich-editor-content` | `min-height: 200px` | review |  |
| `styles.css` | 10925 | `.rich-editor-content` | `max-height: 400px` | review |  |
| `styles.css` | 10927 | `.rich-editor-content` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10929 | `.rich-editor-content` | `border-radius: 0 0 6px 6px` | review |  |
| `styles.css` | 10949 | `.rich-editor-content p` | `margin: 0 0 8px 0` | review |  |
| `styles.css` | 10954 | `.rich-editor-content ol` | `margin: 8px 0` | review |  |
| `styles.css` | 10955 | `.rich-editor-content ol` | `padding-left: 24px` | review |  |
| `styles.css` | 10960 | `.rich-editor-content h4` | `margin: 12px 0 8px 0` | review |  |
| `styles.css` | 10967 | `.attachment-preview-list` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10968 | `.attachment-preview-list` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10974 | `.attachment-preview-item` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10975 | `.attachment-preview-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10978 | `.attachment-preview-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11004 | `.attachment-preview-item .remove-attachment` | `height: 24px` | review |  |
| `styles.css` | 11023 | `.message-attachments` | `margin-top: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11024 | `.message-attachments` | `padding-top: 16px` | review |  |
| `styles.css` | 11030 | `.message-attachments > strong` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11041 | `.attachment-list` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11051 | `.attachment-link` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11052 | `.attachment-link` | `padding: 8px 12px` | review |  |
| `styles.css` | 11055 | `.attachment-link` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11082 | `.attachment-image-preview` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11083 | `.attachment-image-preview` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11088 | `.attachment-image-preview .preview-thumb` | `height: 90px` | review |  |
| `styles.css` | 11090 | `.attachment-image-preview .preview-thumb` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11104 | `.attachment-actions` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11105 | `.attachment-actions` | `margin-left: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11110 | `.attachment-actions button` | `height: 28px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 11117 | `.attachment-actions button` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11146 | `.image-lightbox-overlay img` | `max-height: 90vh` | review |  |
| `styles.css` | 11148 | `.image-lightbox-overlay img` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11175 | `.existing-attachment-item` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11176 | `.existing-attachment-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11179 | `.existing-attachment-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11192 | `.existing-attachment-item .existing-badge` | `padding: 1px 6px` | review |  |
| `styles.css` | 11193 | `.existing-attachment-item .existing-badge` | `border-radius: 3px` | review |  |
| `styles.css` | 11199 | `.badge-sm` | `padding: 2px 6px` | review |  |
| `styles.css` | 11202 | `.badge-sm` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11237 | `.message-reply-info` | `margin-top: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11238 | `.message-reply-info` | `padding: 10px 14px` | review |  |
| `styles.css` | 11240 | `.message-reply-info` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11246 | `.message-reply-info i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11254 | `.info-box` | `padding: 1rem` | review |  |
| `styles.css` | 11257 | `.info-box` | `margin-bottom: 1rem` | review |  |
| `styles.css` | 11279 | `.settings-section .section-desc` | `margin: -8px 0 16px` | review |  |
| `styles.css` | 11307 | `.toggle-control` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11314 | `.toggle-control input[type="checkbox"]` | `height: 1px` | review |  |
| `styles.css` | 11324 | `.toggle-switch` | `height: 24px` | review |  |
| `styles.css` | 11326 | `.toggle-switch` | `border-radius: 24px` | review |  |
| `styles.css` | 11337 | `.toggle-switch::after` | `height: 18px` | review |  |
| `styles.css` | 11360 | `.settings-note-list` | `margin: 4px 0 0` | review |  |
| `styles.css` | 11361 | `.settings-note-list` | `padding-left: 20px` | review |  |
| `styles.css` | 11368 | `.settings-note-list li + li` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11373 | `.system-update-upload-grid` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11379 | `.system-update-maintenance-row` | `gap: 10px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11381 | `.system-update-maintenance-row` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11382 | `.system-update-maintenance-row` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11384 | `.system-update-maintenance-row` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11391 | `.system-update-maintenance-status` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11398 | `.system-update-actions` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11399 | `.system-update-actions` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11404 | `.system-update-status` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11405 | `.system-update-status` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11406 | `.system-update-status` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11430 | `.system-rollback-panel` | `margin: 0 0 12px` | review |  |
| `styles.css` | 11431 | `.system-rollback-panel` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11433 | `.system-rollback-panel` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11438 | `.system-rollback-panel h5` | `margin: 0 0 8px` | review |  |
| `styles.css` | 11446 | `.system-rollback-controls` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11459 | `.system-update-meta` | `gap: 8px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11460 | `.system-update-meta` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11461 | `.system-update-meta` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11463 | `.system-update-meta` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11471 | `.system-update-meta-item` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11485 | `.system-update-change-list h5` | `margin: 0 0 8px` | review |  |
| `styles.css` | 11492 | `.system-update-change-list ul` | `padding-left: 18px` | review |  |
| `styles.css` | 11496 | `.system-update-change-list li` | `margin: 4px 0` | review |  |
| `styles.css` | 11549 | `.production-schedule-tab-panel` | `min-height: 520px` | review |  |
| `styles.css` | 11593 | `.production-schedule-column` | `min-height: 440px` | review |  |
| `styles.css` | 11660 | `.schedule-run-label` | `margin-top: 2px` | review |  |
| `styles.css` | 11682 | `.work-order-type-badge` | `padding: 3px 8px` | review |  |
| `styles.css` | 11684 | `.work-order-type-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11716 | `.work-order-second-screening-empty` | `gap: 0.75rem` | review |  |
| `styles.css` | 11722 | `.work-order-second-screening-cards` | `gap: 0.75rem` | review |  |
| `styles.css` | 11728 | `.work-order-second-screening-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11730 | `.work-order-second-screening-card` | `gap: 0.4rem` | review |  |
| `styles.css` | 11731 | `.work-order-second-screening-card` | `padding: 0.75rem` | review |  |
| `styles.css` | 11737 | `.work-order-inline-rescreen-card` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11739 | `.work-order-inline-rescreen-card` | `gap: 0.85rem` | review |  |
| `styles.css` | 11740 | `.work-order-inline-rescreen-card` | `padding: 1rem` | review |  |
| `styles.css` | 11747 | `.work-order-inline-rescreen-actions` | `gap: 0.75rem` | review |  |
| `styles.css` | 11752 | `.work-order-inline-rescreen-header p` | `margin: 0.2rem 0 0` | review |  |
| `styles.css` | 11758 | `.work-order-inline-rescreen-actions` | `padding-top: 0.75rem` | review |  |
| `styles.css` | 11763 | `.work-order-second-screening-detail-block` | `margin-top: 0.1rem` | review |  |
| `styles.css` | 11764 | `.work-order-second-screening-detail-block` | `padding-top: 0.45rem` | review |  |
| `styles.css` | 11770 | `.work-order-second-screening-inline-list` | `gap: 0.35rem 0.75rem` | review |  |
| `styles.css` | 11777 | `.work-order-second-screening-detail-list` | `gap: 0.35rem` | review |  |
| `styles.css` | 11779 | `.work-order-second-screening-detail-list` | `margin: 0.45rem 0 0` | review |  |
| `styles.css` | 11787 | `.work-order-second-screening-detail-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11789 | `.work-order-second-screening-detail-item` | `gap: 0.15rem` | review |  |
| `styles.css` | 11790 | `.work-order-second-screening-detail-item` | `padding: 0.45rem 0.55rem` | review |  |
| `styles.css` | 11806 | `.rescreen-image-upload-panel` | `gap: 0.75rem` | review |  |
| `styles.css` | 11811 | `.rescreen-image-grid` | `gap: 0.75rem` | review |  |
| `styles.css` | 11818 | `.rescreen-image-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11820 | `.rescreen-image-card` | `gap: 0.5rem` | review |  |
| `styles.css` | 11821 | `.rescreen-image-card` | `padding: 0.65rem` | review |  |
| `styles.css` | 11826 | `.rescreen-image-card img` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11827 | `.rescreen-image-card img` | `height: 120px` | review |  |
| `styles.css` | 11847 | `.form-section-heading` | `gap: 0.75rem` | review |  |
| `styles.css` | 11869 | `.schedule-status-chip` | `padding: 3px 8px` | review |  |
| `styles.css` | 11871 | `.schedule-status-chip` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11879 | `.production-time-content` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11883 | `.production-status-content` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11896 | `.machine-status-detail-wrap` | `padding: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11912 | `.machine-status-detail-empty` | `padding: 12px 10px` | review |  |
| `styles.css` | 11922 | `.schedule-empty` | `padding: 18px 10px` | review |  |
| `styles.css` | 11930 | `.schedule-live-time-row` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11931 | `.schedule-live-time-row` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |

