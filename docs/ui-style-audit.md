# UI Style Audit

Generated: 2026-07-20T07:53:22.550Z

Scanned files: `styles.css`

## Summary

| Item | Count |
|------|------:|
| Total hardcoded spacing/radius findings | 748 |
| Token candidates | 378 |
| Needs review | 370 |
| Covered by ui-token-exception | 0 |

## Top Properties

| Property | Count |
|----------|------:|
| `padding` | 174 |
| `gap` | 156 |
| `border-radius` | 95 |
| `margin-bottom` | 70 |
| `min-height` | 49 |
| `height` | 48 |
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
| `padding: 16px` | 8 |
| `gap: 0.75rem` | 7 |
| `margin-bottom: 16px` | 7 |
| `margin-bottom: 8px` | 7 |
| `padding: 10px 14px` | 7 |
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
| `styles.css` | 217 | `@page` | `margin: 12mm` | review |  |
| `styles.css` | 252 | `.app-container` | `height: 100vh` | review |  |
| `styles.css` | 494 | `.dropdown-divider` | `height: 1px` | review |  |
| `styles.css` | 516 | `.weekday-badge` | `padding: 4px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 529 | `.weekday-text` | `margin-left: 5px` | review |  |
| `styles.css` | 557 | `.record-link-button:focus-visible` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 734 | `.subtext` | `margin-top: 2px` | review |  |
| `styles.css` | 756 | `.text-warning i` | `margin-right: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 856 | `.menu-item` | `margin-bottom: 2px` | review |  |
| `styles.css` | 890 | `.menu-item.active > .menu-link` | `padding-left: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 909 | `.menu-item.active .submenu` | `max-height: 500px` | review |  |
| `styles.css` | 1038 | `.tab-header` | `padding: 10px 15px` | review |  |
| `styles.css` | 1042 | `.tab-header` | `margin-bottom: -1px` | review |  |
| `styles.css` | 1044 | `.tab-header` | `border-top-left-radius: 5px` | review |  |
| `styles.css` | 1045 | `.tab-header` | `border-top-right-radius: 5px` | review |  |
| `styles.css` | 1048 | `.tab-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1066 | `.tab-header .close-tab` | `margin-left: 5px` | review |  |
| `styles.css` | 1079 | `.tab-content-area` | `padding: 20px` | review |  |
| `styles.css` | 1094 | `.example-table-container` | `margin-top: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1163 | `.data-table input[type="checkbox"]` | `height: 16px` | review |  |
| `styles.css` | 1260 | `body.login-page` | `min-height: 100vh` | review |  |
| `styles.css` | 1270 | `.login-wrapper` | `padding: 32px 16px` | review |  |
| `styles.css` | 1277 | `.login-card` | `padding: 48px` | review |  |
| `styles.css` | 1280 | `.login-card` | `gap: 32px` | review |  |
| `styles.css` | 1288 | `.login-brand` | `padding-right: 32px` | review |  |
| `styles.css` | 1294 | `.login-brand h1` | `margin-top: 18px` | review |  |
| `styles.css` | 1300 | `.brand-logo img.company-logo-img` | `height: 68px` | review |  |
| `styles.css` | 1307 | `.login-brand p` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1313 | `.login-brand .system-subtitle` | `margin-top: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1320 | `.login-brand .login-hint` | `margin-top: 14px` | review |  |
| `styles.css` | 1325 | `.brand-logo` | `height: 76px` | review |  |
| `styles.css` | 1343 | `.login-card form` | `gap: 18px` | review |  |
| `styles.css` | 1349 | `.form-group label` | `margin-bottom: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1355 | `.form-group .form-control` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1380 | `.toggle-password` | `padding: 4px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1392 | `.remember-me` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1397 | `.login-button` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1402 | `.login-button` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1420 | `.login-success` | `margin-top: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1421 | `.login-success` | `padding: 12px 14px` | review |  |
| `styles.css` | 1439 | `.login-hint` | `padding: 24px` | review |  |
| `styles.css` | 1445 | `.login-hint h2` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1457 | `.sample-accounts td` | `padding: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1469 | `.sample-accounts code` | `padding: 2px 5px` | review |  |
| `styles.css` | 1478 | `.login-footer` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1483 | `.login-card` | `padding: 32px` | review |  |
| `styles.css` | 1490 | `.login-brand` | `padding-bottom: 24px` | review |  |
| `styles.css` | 1504 | `.content-header.with-actions` | `gap: 16px` | review |  |
| `styles.css` | 1522 | `.content-header.with-actions.sticky` | `padding: 16px 20px` | review |  |
| `styles.css` | 1523 | `.content-header.with-actions.sticky` | `margin: -20px -20px 20px -20px` | review |  |
| `styles.css` | 1531 | `.content-header.with-actions .subtitle` | `margin: 4px 0 0` | review |  |
| `styles.css` | 1539 | `.header-actions` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1597 | `.btn.text` | `padding: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1601 | `.btn.text` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1607 | `.btn.text` | `height: 30px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 1846 | `.btn-dropdown-wrapper .dropdown-menu` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1854 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1855 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item` | `padding: 10px 14px` | review |  |
| `styles.css` | 1871 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item:first-child` | `border-radius: 6px 6px 0 0` | review |  |
| `styles.css` | 1875 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item:last-child` | `border-radius: 0 0 6px 6px` | review |  |
| `styles.css` | 1915 | `.summary-cards` | `gap: 1rem` | review |  |
| `styles.css` | 1917 | `.summary-cards` | `margin-bottom: 1rem` | review |  |
| `styles.css` | 1923 | `.summary-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1924 | `.summary-card` | `padding: 1rem 1.25rem` | review |  |
| `styles.css` | 1927 | `.summary-card` | `gap: 1rem` | review |  |
| `styles.css` | 1948 | `.summary-card .summary-label` | `margin-bottom: 0.25rem` | review |  |
| `styles.css` | 1974 | `.filter-summary-bar` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 2006 | `.filter-count` | `height: 18px` | review |  |
| `styles.css` | 2041 | `.filter-drawer` | `height: 100vh` | review |  |
| `styles.css` | 2185 | `.filter-form .form-grid label:not(.filter-checkbox) > select` | `min-height: 38px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 2266 | `.checkbox-label` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 2437 | `.form-grid label.inline-label input[type="checkbox"]` | `height: 16px` | review |  |
| `styles.css` | 2712 | `.modal-alert::before` | `margin-top: 1px` | review |  |
| `styles.css` | 2771 | `.form-panel` | `margin-top: 25px` | review |  |
| `styles.css` | 2772 | `.form-panel` | `padding: 20px` | review |  |
| `styles.css` | 2774 | `.form-panel` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 2780 | `.form-panel h3` | `margin-bottom: 15px` | review |  |
| `styles.css` | 2786 | `.form-panel small` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3100 | `.modal-overlay` | `padding: 20px` | review |  |
| `styles.css` | 3109 | `.modal-window` | `max-height: 80vh` | review |  |
| `styles.css` | 3163 | `.column-selector` | `max-height: 80vh` | review |  |
| `styles.css` | 3171 | `.column-selector-header` | `padding: 15px` | review |  |
| `styles.css` | 3209 | `.column-selector-body` | `padding: 15px` | review |  |
| `styles.css` | 3215 | `.column-selector-body .column-option` | `padding: 8px 0` | review |  |
| `styles.css` | 3225 | `.column-selector-body .column-option input[type="checkbox"]` | `margin-right: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3227 | `.column-selector-body .column-option input[type="checkbox"]` | `height: 18px` | review |  |
| `styles.css` | 3237 | `.column-selector-footer` | `padding: 12px 15px` | review |  |
| `styles.css` | 3240 | `.column-selector-footer` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3243 | `.column-selector-footer` | `border-radius: 0 0 8px 8px` | review |  |
| `styles.css` | 3340 | `.role-permission-transfer-section label.inline-label` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3349 | `.role-permission-transfer-section label.inline-label span` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3354 | `.role-permission-transfer-section label.inline-label select` | `min-height: 260px` | review |  |
| `styles.css` | 3355 | `.role-permission-transfer-section label.inline-label select` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3368 | `.role-permission-transfer-controls-box` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3369 | `.role-permission-transfer-controls-box` | `min-height: 260px` | review |  |
| `styles.css` | 3374 | `.role-permission-transfer-controls-box .btn` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3394 | `.form-address` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3400 | `.form-address label` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3442 | `.screening-create-panel` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3451 | `.screening-create-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3462 | `.screening-create-header` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3474 | `.screening-create-body` | `padding: 16px` | review |  |
| `styles.css` | 3484 | `.screening-create-footer` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3486 | `.screening-create-footer` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3494 | `.screening-create-footer .btn.small` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3500 | `.checkbox-field` | `gap: 5px` | review |  |
| `styles.css` | 3510 | `.checkbox-field input[type="checkbox"]` | `height: 18px` | review |  |
| `styles.css` | 3517 | `.file-input-group` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3527 | `.file-input-group label.file-upload-btn` | `padding: 6px 12px` | review |  |
| `styles.css` | 3550 | `.file-input-group label.file-upload-btn i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3556 | `.file-input-group .file-hint` | `margin-left: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3562 | `.invoice-stamp-preview` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3564 | `.invoice-stamp-preview` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3565 | `.invoice-stamp-preview` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3571 | `.invoice-stamp-preview img` | `max-height: 200px` | review |  |
| `styles.css` | 3573 | `.invoice-stamp-preview img` | `margin: 0 auto 8px` | review |  |
| `styles.css` | 3575 | `.invoice-stamp-preview img` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3581 | `.invoice-stamp-preview .preview-actions` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3586 | `.invoice-stamp-preview .icon-button` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3587 | `.invoice-stamp-preview .icon-button` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3596 | `.attachment-preview` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3598 | `.attachment-preview` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3599 | `.attachment-preview` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3609 | `.attachment-preview .preview-info` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3621 | `.attachment-preview .preview-actions` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3626 | `.attachment-preview .icon-button` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3627 | `.attachment-preview .icon-button` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3635 | `.field-hint` | `margin-top: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3651 | `.modal-window form .form-grid label small` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3662 | `.modal-window.number-sequences-modal .form-grid` | `gap: 14px` | review |  |
| `styles.css` | 3689 | `.modal-window.number-sequences-modal label.inline-label > small` | `margin-top: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3774 | `.modal-window.customers-modal form[data-customers-form]` | `gap: 14px 12px` | review |  |
| `styles.css` | 3803 | `.modal-window.customers-modal .form-row > .form-section > .customer-modal-grid` | `gap: 8px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3874 | `.modal-window.customers-modal .customer-stamp-field` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3875 | `.modal-window.customers-modal .customer-stamp-field` | `min-height: 72px` | review |  |
| `styles.css` | 3884 | `.modal-window.customers-modal .customer-stamp-field > span` | `padding: 4px 10px` | review |  |
| `styles.css` | 3897 | `.modal-window.customers-modal .customer-stamp-control` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3903 | `.modal-window.customers-modal .customer-stamp-control .field-hint` | `margin: 6px 0 0` | review |  |
| `styles.css` | 3911 | `.modal-window.customers-modal .customer-stamp-control .file-input-group` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3957 | `.modal-window.suppliers-modal form[data-suppliers-form]` | `gap: 14px 12px` | review |  |
| `styles.css` | 3986 | `.modal-window.suppliers-modal .form-row > .form-section > .supplier-modal-grid` | `gap: 8px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4016 | `.modal-window.suppliers-modal .supplier-attachment-field` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4017 | `.modal-window.suppliers-modal .supplier-attachment-field` | `min-height: 72px` | review |  |
| `styles.css` | 4026 | `.modal-window.suppliers-modal .supplier-attachment-field > span` | `padding: 4px 10px` | review |  |
| `styles.css` | 4039 | `.modal-window.suppliers-modal .supplier-attachment-control` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4045 | `.modal-window.suppliers-modal .supplier-attachment-control .field-hint` | `margin: 6px 0 0` | review |  |
| `styles.css` | 4053 | `.modal-window.suppliers-modal .supplier-attachment-control .file-input-group` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4113 | `.detail-content` | `padding: 10px 0` | review |  |
| `styles.css` | 4119 | `.detail-content dl` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4120 | `.detail-content dl` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4121 | `.detail-content dl` | `padding: 15px` | review |  |
| `styles.css` | 4123 | `.detail-content dl` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4129 | `.detail-content dl > div` | `gap: 15px` | review |  |
| `styles.css` | 4131 | `.detail-content dl > div` | `padding: 8px 0` | review |  |
| `styles.css` | 4153 | `.detail-content dl.inventory-detail-list` | `column-gap: 20px` | review |  |
| `styles.css` | 4245 | `.subsection` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4246 | `.subsection` | `padding: 16px` | review |  |
| `styles.css` | 4248 | `.subsection` | `margin-bottom: 15px` | review |  |
| `styles.css` | 4251 | `.subsection` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4258 | `.subsection-header` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4259 | `.subsection-header` | `padding-bottom: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4288 | `.image-gallery` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4289 | `.image-gallery` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4290 | `.image-gallery` | `min-height: 100px` | review |  |
| `styles.css` | 4299 | `.image-gallery .empty-state` | `padding: 40px 20px` | review |  |
| `styles.css` | 4305 | `.image-gallery .empty-state i` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4312 | `.image-gallery .image-item` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4330 | `.image-gallery .image-item .btn-delete` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4332 | `.image-gallery .image-item .btn-delete` | `height: 28px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 4349 | `.order-items-modal` | `max-height: 85vh` | review |  |
| `styles.css` | 4377 | `.order-items-modal .order-items-modal-body::-webkit-scrollbar-track` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4382 | `.order-items-modal .order-items-modal-body::-webkit-scrollbar-thumb` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4438 | `.metrics-comparison-container` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4439 | `.metrics-comparison-container` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4454 | `.metrics-comparison-container .metrics-subtitle` | `margin: 0 0 8px 0` | review |  |
| `styles.css` | 4455 | `.metrics-comparison-container .metrics-subtitle` | `padding-bottom: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4470 | `.metrics-comparison-container .metric` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4471 | `.metrics-comparison-container .metric` | `padding: 5px 0` | review |  |
| `styles.css` | 4523 | `.table-secondary` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4531 | `.stacked-inputs` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4549 | `.order-items-services-table th:nth-child(3)` | `padding-left: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4550 | `.order-items-services-table th:nth-child(3)` | `padding-right: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4556 | `.order-items-services-table td:nth-child(6)` | `padding-left: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4557 | `.order-items-services-table td:nth-child(6)` | `padding-right: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4571 | `.modal-window.work-orders-modal` | `max-height: 90vh` | review |  |
| `styles.css` | 4575 | `.work-orders-modal h3[data-modal-title]` | `margin-bottom: 15px` | review |  |
| `styles.css` | 4577 | `.work-orders-modal h3[data-modal-title]` | `padding-right: 40px` | review |  |
| `styles.css` | 4581 | `.work-orders-modal .modal-alert` | `margin-bottom: 15px` | review |  |
| `styles.css` | 4599 | `.work-orders-modal-body` | `padding-right: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4608 | `.work-orders-modal-body::-webkit-scrollbar-track` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4613 | `.work-orders-modal-body::-webkit-scrollbar-thumb` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4621 | `.work-orders-modal-footer` | `padding-top: 15px` | review |  |
| `styles.css` | 4640 | `.rescreen-batches-modal` | `max-height: 88vh` | review |  |
| `styles.css` | 4642 | `.rescreen-batches-modal` | `padding: 20px 20px 16px` | review |  |
| `styles.css` | 4647 | `.rescreen-batches-modal h3` | `margin-bottom: 14px` | review |  |
| `styles.css` | 4652 | `.rescreen-batches-modal > .modal-alert` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4659 | `.rescreen-batches-modal form` | `gap: 14px` | review |  |
| `styles.css` | 4675 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-header` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4677 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-header` | `margin: 0 0 8px` | review |  |
| `styles.css` | 4678 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-header` | `padding: 0 0 6px` | review |  |
| `styles.css` | 4682 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-body` | `padding-left: 2px` | review |  |
| `styles.css` | 4683 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-body` | `padding-right: 2px` | review |  |
| `styles.css` | 4697 | `[data-rescreen-batches-modal] .rescreen-section-title` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4742 | `.rescreen-section-helper` | `margin: 0 0 12px` | review |  |
| `styles.css` | 4746 | `.rescreen-source-summary-grid` | `min-height: 128px` | review |  |
| `styles.css` | 4752 | `.rescreen-source-card` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4755 | `.rescreen-source-card` | `gap: 14px` | review |  |
| `styles.css` | 4756 | `.rescreen-source-card` | `padding: 16px 18px` | review |  |
| `styles.css` | 4770 | `.rescreen-source-card-header` | `gap: 0.75rem` | review |  |
| `styles.css` | 4776 | `.rescreen-source-card-title-group` | `gap: 0.2rem` | review |  |
| `styles.css` | 4797 | `.rescreen-source-card-title-group p` | `margin: 0.15rem 0 0` | review |  |
| `styles.css` | 4803 | `.rescreen-source-card-badge` | `border-radius: 999px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4808 | `.rescreen-source-card-badge` | `padding: 0.35rem 0.8rem` | review |  |
| `styles.css` | 4819 | `.rescreen-source-card-body` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4826 | `.rescreen-source-fact` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4828 | `.rescreen-source-fact` | `gap: 0.35rem` | review |  |
| `styles.css` | 4829 | `.rescreen-source-fact` | `padding: 0.8rem 0.9rem` | review |  |
| `styles.css` | 4857 | `.rescreen-source-state` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4859 | `.rescreen-source-state` | `gap: 0.35rem` | review |  |
| `styles.css` | 4860 | `.rescreen-source-state` | `padding: 16px 18px` | review |  |
| `styles.css` | 4894 | `.rescreen-batches-modal-body` | `padding-right: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4903 | `.rescreen-batches-modal-body::-webkit-scrollbar-track` | `border-radius: 999px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4908 | `.rescreen-batches-modal-body::-webkit-scrollbar-thumb` | `border-radius: 999px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4920 | `.rescreen-batches-modal-footer` | `padding-top: 14px` | review |  |
| `styles.css` | 4930 | `[data-rescreen-batches-detail-modal] .modal-window.xlarge` | `max-height: 88vh` | review |  |
| `styles.css` | 4938 | `[data-rescreen-batches-detail-modal] .detail-content` | `padding: 4px 0 0` | review |  |
| `styles.css` | 4944 | `[data-rescreen-batches-detail-modal] .form-actions` | `margin-top: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4945 | `[data-rescreen-batches-detail-modal] .form-actions` | `padding-top: 14px` | review |  |
| `styles.css` | 4951 | `[data-rescreen-batches-detail-modal] .detail-content .detail-section p` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4957 | `[data-rescreen-batches-detail-modal] .detail-content .detail-grid` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4964 | `[data-rescreen-batches-detail-modal] .detail-content .detail-item` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4967 | `[data-rescreen-batches-detail-modal] .detail-content .detail-item` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4968 | `[data-rescreen-batches-detail-modal] .detail-content .detail-item` | `padding: 12px 14px` | review |  |
| `styles.css` | 5011 | `.rescreen-batches-modal` | `padding: 16px 16px 14px` | review |  |
| `styles.css` | 5034 | `.work-orders-section-layout` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5036 | `.work-orders-section-layout` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5075 | `.work-order-schedule-section .weekday-badge` | `padding: 4px 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5094 | `.work-orders-section-right .table-responsive` | `min-height: 280px` | review |  |
| `styles.css` | 5103 | `.work-order-type-top-section` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5112 | `.work-order-source-mode-hint` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5113 | `.work-order-source-mode-hint` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5115 | `.work-order-source-mode-hint` | `border-radius: 5px` | review |  |
| `styles.css` | 5127 | `.work-order-collapsible-section details` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5135 | `.work-order-collapsible-section summary` | `padding-bottom: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5136 | `.work-order-collapsible-section summary` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5148 | `.work-order-collapsible-section summary::before` | `margin-right: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5232 | `.work-orders-section-right .table-responsive` | `min-height: 220px` | review |  |
| `styles.css` | 5253 | `.work-order-live-time-row` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5254 | `.work-order-live-time-row` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 5256 | `.work-order-live-time-row` | `padding: 10px 14px` | review |  |
| `styles.css` | 5377 | `.work-order-edit-first-piece-card` | `min-height: 200px` | review |  |
| `styles.css` | 5382 | `.work-order-edit-first-piece-card .subsection-body` | `min-height: 140px` | review |  |
| `styles.css` | 5403 | `.work-order-edit-images-card .table-responsive` | `min-height: 120px` | review |  |
| `styles.css` | 5427 | `.work-order-production-mode-tabs` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5428 | `.work-order-production-mode-tabs` | `padding: 0 2px` | review |  |
| `styles.css` | 5436 | `.work-order-production-mode-tabs .tab-btn` | `border-radius: 4px 4px 0 0` | review |  |
| `styles.css` | 5437 | `.work-order-production-mode-tabs .tab-btn` | `padding: 6px 14px` | review |  |
| `styles.css` | 5507 | `.work-order-production-mode-panel` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5516 | `.work-order-execution-image-tabs` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5530 | `.work-order-image-sections-grid` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5553 | `.work-order-production-mode-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5594 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `height: min(850px, 94vh)` | review |  |
| `styles.css` | 5596 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `max-height: 94vh` | review |  |
| `styles.css` | 5621 | `[data-work-orders-edit-modal] form` | `padding-top: 42px` | review |  |
| `styles.css` | 5805 | `[data-work-orders-edit-modal] .work-order-edit-drawing-card` | `min-height: 82px` | review |  |
| `styles.css` | 5920 | `[data-work-orders-edit-modal] .work-order-edit-service-section` | `min-height: 170px` | review |  |
| `styles.css` | 5928 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card` | `min-height: 170px` | review |  |
| `styles.css` | 5940 | `[data-work-orders-edit-modal] .work-order-edit-service-section .table-responsive` | `min-height: 126px` | review |  |
| `styles.css` | 5941 | `[data-work-orders-edit-modal] .work-order-edit-service-section .table-responsive` | `max-height: 126px` | review |  |
| `styles.css` | 5990 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card .subsection-actions .btn` | `min-height: 25px` | review |  |
| `styles.css` | 5996 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card .subsection-body` | `min-height: 122px` | review |  |
| `styles.css` | 6024 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card textarea` | `height: 24px` | review |  |
| `styles.css` | 6025 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card textarea` | `min-height: 24px` | review |  |
| `styles.css` | 6038 | `[data-work-orders-edit-modal] .work-order-edit-production-records` | `min-height: 230px` | review |  |
| `styles.css` | 6056 | `[data-work-orders-edit-modal] .work-order-production-mode-tabs` | `min-height: 30px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 6068 | `[data-work-orders-edit-modal] .work-order-production-mode-header` | `min-height: 25px` | review |  |
| `styles.css` | 6076 | `[data-work-orders-edit-modal] .work-order-production-mode-header .btn` | `min-height: 25px` | review |  |
| `styles.css` | 6092 | `[data-work-orders-edit-modal] .production-records-table select` | `height: 25px` | review |  |
| `styles.css` | 6093 | `[data-work-orders-edit-modal] .production-records-table select` | `min-height: 25px` | review |  |
| `styles.css` | 6156 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `height: 92vh` | review |  |
| `styles.css` | 6157 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `max-height: 92vh` | review |  |
| `styles.css` | 6359 | `.work-order-mobile-quick-entry-card` | `margin-top: 14px` | review |  |
| `styles.css` | 6360 | `.work-order-mobile-quick-entry-card` | `padding-top: 2px` | review |  |
| `styles.css` | 6365 | `.work-order-mobile-quick-entry-body` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6369 | `.work-order-mobile-quick-entry-qr` | `min-height: 232px` | review |  |
| `styles.css` | 6371 | `.work-order-mobile-quick-entry-qr` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 6376 | `.work-order-mobile-quick-entry-qr` | `padding: 14px` | review |  |
| `styles.css` | 6404 | `.work-order-mobile-quick-entry-actions` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6443 | `[data-work-orders-edit-modal] .work-order-edit-drawing-card` | `min-height: 86px` | review |  |
| `styles.css` | 6609 | `.searchable-select-native` | `height: 1px !important` | review |  |
| `styles.css` | 6653 | `.searchable-select-list` | `max-height: 220px` | review |  |
| `styles.css` | 6713 | `[data-machine-picker-modal] .machine-picker-layout` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6720 | `[data-machine-picker-modal] .machine-picker-groups` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6721 | `[data-machine-picker-modal] .machine-picker-groups` | `max-height: min(52vh, 420px)` | review |  |
| `styles.css` | 6723 | `[data-machine-picker-modal] .machine-picker-groups` | `padding-right: 4px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 6728 | `[data-machine-picker-modal] .machine-picker-group-btn` | `min-height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 6729 | `[data-machine-picker-modal] .machine-picker-group-btn` | `padding: 7px 10px` | review |  |
| `styles.css` | 6757 | `[data-machine-picker-modal] .machine-picker-panel-header` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6758 | `[data-machine-picker-modal] .machine-picker-panel-header` | `margin-top: 2px` | review |  |
| `styles.css` | 6759 | `[data-machine-picker-modal] .machine-picker-panel-header` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 6776 | `[data-machine-picker-modal] .machine-picker-grid` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6777 | `[data-machine-picker-modal] .machine-picker-grid` | `max-height: min(46vh, 360px)` | review |  |
| `styles.css` | 6785 | `[data-machine-picker-modal] .machine-picker-option` | `column-gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6787 | `[data-machine-picker-modal] .machine-picker-option` | `min-height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 6788 | `[data-machine-picker-modal] .machine-picker-option` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 6790 | `[data-machine-picker-modal] .machine-picker-option` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 6877 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card` | `min-height: 175px` | review |  |
| `styles.css` | 6890 | `[data-work-orders-edit-modal] .work-order-edit-production-records` | `min-height: 260px` | review |  |
| `styles.css` | 6997 | `[data-work-orders-edit-modal] .work-order-edit-summary-value > span` | `height: 1px` | review |  |
| `styles.css` | 7343 | `[data-work-orders-edit-modal] .work-order-tool-analysis-empty` | `margin-bottom: 0.75rem` | review |  |
| `styles.css` | 7412 | `[data-work-orders-edit-modal] .work-order-edit-service-section .table-responsive` | `max-height: 210px` | review |  |
| `styles.css` | 7550 | `[data-work-orders-edit-modal] .split-work-order-header h4` | `margin: 0 0 4px` | review |  |
| `styles.css` | 7569 | `[data-work-orders-edit-modal] .split-machine-tab` | `min-height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 7662 | `[data-work-orders-edit-modal] .split-machine-settings-card` | `min-height: 175px` | review |  |
| `styles.css` | 7704 | `[data-work-orders-edit-modal] .split-machine-settings-grid label.full-width textarea` | `min-height: 72px` | review |  |
| `styles.css` | 7831 | `.split-work-order-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7832 | `.split-work-order-header` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7833 | `.split-work-order-header` | `padding-bottom: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7838 | `.split-work-order-header h4` | `margin: 0 0 4px` | review |  |
| `styles.css` | 7844 | `.split-work-order-layout` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7851 | `.split-machine-tabs` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7858 | `.split-machine-tab` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7859 | `.split-machine-tab` | `padding: 8px 12px` | review |  |
| `styles.css` | 7864 | `.split-machine-tab` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7866 | `.split-machine-tab` | `min-height: 42px` | review |  |
| `styles.css` | 7880 | `.split-machine-empty-tabs` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7881 | `.split-machine-empty-tabs` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7889 | `.split-machine-empty-state` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7893 | `.split-machine-empty-state` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7894 | `.split-machine-empty-state` | `padding: 18px` | review |  |
| `styles.css` | 7915 | `.split-machine-content-stack` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7920 | `.split-machine-card` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7921 | `.split-machine-card` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7926 | `.split-machine-card h5` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7934 | `.split-machine-card-header` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7935 | `.split-machine-card-header` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7955 | `.split-production-record-mode-tabs` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7956 | `.split-production-record-mode-tabs` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7977 | `.split-partial-receipt-box` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7978 | `.split-partial-receipt-box` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7980 | `.split-partial-receipt-box` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7984 | `.split-partial-receipt-box` | `margin-top: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8044 | `.work-order-balance-alert` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8045 | `.work-order-balance-alert` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8046 | `.work-order-balance-alert` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8076 | `.work-order-partial-tools-field` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8080 | `.work-order-partial-tools-empty` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8089 | `.work-order-partial-tools-list` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8095 | `.work-order-partial-tool-row` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8097 | `.work-order-partial-tool-row` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8115 | `.work-order-partial-tool-toggle input` | `height: 18px` | review |  |
| `styles.css` | 8120 | `.work-order-partial-tool-meta` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8135 | `.work-order-partial-tool-qty` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8150 | `.work-order-partial-tools-summary` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8151 | `.work-order-partial-tools-summary` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8158 | `.work-order-partial-tools-metric` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8183 | `.work-order-completion-summary` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8184 | `.work-order-completion-summary` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8190 | `.work-order-completion-summary-row` | `gap: 16px` | review |  |
| `styles.css` | 8192 | `.work-order-completion-summary-row` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8193 | `.work-order-completion-summary-row` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8211 | `.work-order-reverse-impact-list` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8212 | `.work-order-reverse-impact-list` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8216 | `.work-order-reverse-impact-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8217 | `.work-order-reverse-impact-item` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8227 | `.inventory-receipt-badge` | `margin-left: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8228 | `.inventory-receipt-badge` | `padding: 2px 6px` | review |  |
| `styles.css` | 8229 | `.inventory-receipt-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8248 | `.split-summary-grid` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8259 | `.split-summary-grid strong` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8269 | `.split-machine-settings-card .subsection-header` | `margin: 0 0 8px` | review |  |
| `styles.css` | 8270 | `.split-machine-settings-card .subsection-header` | `padding: 0 0 6px` | review |  |
| `styles.css` | 8279 | `.split-machine-card-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8285 | `.split-machine-settings-grid` | `gap: 8px 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8297 | `.split-machine-settings-grid label.inline-label > span` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8304 | `.split-machine-settings-grid textarea` | `min-height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 8305 | `.split-machine-settings-grid textarea` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 8306 | `.split-machine-settings-grid textarea` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8314 | `.split-machine-settings-grid label.full-width textarea` | `min-height: 72px` | review |  |
| `styles.css` | 8368 | `.source-selection-section` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8370 | `.source-selection-section` | `border-radius: 5px` | review |  |
| `styles.css` | 8371 | `.source-selection-section` | `padding: 15px` | review |  |
| `styles.css` | 8378 | `.source-selection-section .tabs` | `margin-bottom: 15px` | review |  |
| `styles.css` | 8382 | `.source-selection-section .tab-btn` | `padding: 10px 20px` | review |  |
| `styles.css` | 8415 | `.search-grid` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8417 | `.search-grid` | `margin-bottom: 15px` | review |  |
| `styles.css` | 8426 | `.search-results` | `margin-top: 15px` | review |  |
| `styles.css` | 8428 | `.search-results` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8451 | `.profile-tabs` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8456 | `.profile-tab` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8465 | `.profile-tab` | `margin-bottom: -2px` | review |  |
| `styles.css` | 8479 | `.profile-tab i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8509 | `.version-info-content` | `padding: 20px 0` | review |  |
| `styles.css` | 8514 | `.system-logo` | `margin-bottom: 15px` | review |  |
| `styles.css` | 8521 | `.system-name` | `margin: 10px 0 5px` | review |  |
| `styles.css` | 8527 | `.system-subtitle` | `margin-bottom: 25px` | review |  |
| `styles.css` | 8532 | `.version-details` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8533 | `.version-details` | `padding: 20px` | review |  |
| `styles.css` | 8534 | `.version-details` | `margin: 20px 0` | review |  |
| `styles.css` | 8542 | `.version-item` | `padding: 8px 0` | review |  |
| `styles.css` | 8564 | `.version-features` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8565 | `.version-features` | `padding: 20px` | review |  |
| `styles.css` | 8566 | `.version-features` | `margin: 20px 0` | review |  |
| `styles.css` | 8571 | `.version-features h5` | `margin: 0 0 15px 0` | review |  |
| `styles.css` | 8583 | `.version-features li` | `padding: 6px 0` | review |  |
| `styles.css` | 8592 | `.version-features li::before` | `margin-right: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8598 | `.version-update-list` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8603 | `.version-update-list .version-update-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8604 | `.version-update-list .version-update-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8619 | `.version-update-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8620 | `.version-update-header` | `margin-bottom: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8637 | `.version-update-summary` | `padding-left: 16px` | review |  |
| `styles.css` | 8642 | `.version-update-summary li` | `padding: 2px 0` | review |  |
| `styles.css` | 8650 | `.version-update-empty` | `padding: 6px 0` | review |  |
| `styles.css` | 8654 | `.version-links` | `margin: 25px 0` | review |  |
| `styles.css` | 8660 | `.version-links .btn` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8661 | `.version-links .btn` | `padding: 10px 24px` | review |  |
| `styles.css` | 8666 | `.version-copyright` | `margin-top: 25px` | review |  |
| `styles.css` | 8667 | `.version-copyright` | `padding-top: 20px` | review |  |
| `styles.css` | 8672 | `.version-copyright p` | `margin: 5px 0` | review |  |
| `styles.css` | 8684 | `.menu-divider` | `margin: 8px 0` | review |  |
| `styles.css` | 8693 | `.message-list-container` | `min-height: 300px` | review |  |
| `styles.css` | 8700 | `.message-list` | `gap: 1px` | review |  |
| `styles.css` | 8708 | `.message-item` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8709 | `.message-item` | `padding: 16px` | review |  |
| `styles.css` | 8733 | `.message-avatar` | `height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 8763 | `.message-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8764 | `.message-header` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8784 | `.notification-meta` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8810 | `.notification-footer` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8816 | `.message-actions` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8830 | `.priority-badge` | `padding: 2px 8px` | review |  |
| `styles.css` | 8831 | `.priority-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8859 | `.expired-badge` | `padding: 2px 6px` | review |  |
| `styles.css` | 8860 | `.expired-badge` | `border-radius: 3px` | review |  |
| `styles.css` | 8886 | `.loading-state` | `padding: 60px 20px` | review |  |
| `styles.css` | 8893 | `.loading-state i` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8943 | `.sidebar-tabs-layout` | `min-height: 500px` | review |  |
| `styles.css` | 8998 | `.sidebar-tab-btn .tab-badge` | `height: 20px` | review |  |
| `styles.css` | 9295 | `.message-detail-content` | `padding: 16px 0` | review |  |
| `styles.css` | 9301 | `.detail-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9302 | `.detail-header` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9308 | `.detail-type` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9317 | `.detail-title` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9323 | `.detail-meta` | `gap: 16px` | review |  |
| `styles.css` | 9326 | `.detail-meta` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9327 | `.detail-meta` | `padding-bottom: 16px` | review |  |
| `styles.css` | 9334 | `.detail-meta span` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9350 | `.message-detail-header` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9351 | `.message-detail-header` | `padding-bottom: 16px` | review |  |
| `styles.css` | 9357 | `.message-detail-row` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9358 | `.message-detail-row` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9373 | `.message-detail-subject` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9374 | `.message-detail-subject` | `padding-bottom: 16px` | review |  |
| `styles.css` | 9389 | `.filter-bar` | `gap: 16px` | review |  |
| `styles.css` | 9390 | `.filter-bar` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9392 | `.filter-bar` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9393 | `.filter-bar` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9399 | `.filter-group` | `gap: 16px` | review |  |
| `styles.css` | 9405 | `.filter-group label` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9411 | `.filter-group select` | `padding: 6px 10px` | review |  |
| `styles.css` | 9413 | `.filter-group select` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9422 | `.checkbox-label input[type="checkbox"]` | `margin-right: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9430 | `.form-hint` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9461 | `.table-header-actions` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9462 | `.table-header-actions` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9481 | `.filter-row` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9487 | `.filter-field` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9498 | `.filter-field select` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9500 | `.filter-field select` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9529 | `.section-title` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9533 | `.section-title` | `margin-bottom: 15px` | review |  |
| `styles.css` | 9534 | `.section-title` | `padding-bottom: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9580 | `.event-popup-card` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9584 | `.event-popup-card` | `margin: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9594 | `.event-popup-close` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9612 | `.event-popup-header` | `padding: 20px 20px 16px` | review |  |
| `styles.css` | 9618 | `.event-popup-type-badge` | `padding: 4px 10px` | review |  |
| `styles.css` | 9619 | `.event-popup-type-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9623 | `.event-popup-type-badge` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9632 | `.event-popup-header h4` | `padding-right: 30px` | review |  |
| `styles.css` | 9636 | `.event-popup-body` | `padding: 20px` | review |  |
| `styles.css` | 9642 | `.event-popup-info` | `gap: 14px` | review |  |
| `styles.css` | 9648 | `.event-popup-row` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9656 | `.event-popup-row i` | `margin-top: 2px` | review |  |
| `styles.css` | 9664 | `.event-popup-time` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9670 | `.event-popup-time-separator` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9682 | `.event-popup-footer` | `padding: 16px 20px` | review |  |
| `styles.css` | 9686 | `.event-popup-footer` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9690 | `.event-popup-footer button` | `padding: 10px 20px` | review |  |
| `styles.css` | 9693 | `.event-popup-footer button` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9721 | `.event-popup-footer button.primary i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9726 | `.event-popup-card` | `margin: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9727 | `.event-popup-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9731 | `.event-popup-header` | `padding: 16px` | review |  |
| `styles.css` | 9735 | `.event-popup-body` | `padding: 16px` | review |  |
| `styles.css` | 9739 | `.event-popup-footer` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9757 | `.dashboard-calendar .fc-toolbar` | `padding: 12px 8px` | review |  |
| `styles.css` | 9760 | `.dashboard-calendar .fc-toolbar` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9771 | `.dashboard-calendar .fc-button-group` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9777 | `.dashboard-calendar .fc-button` | `padding: 8px 16px !important` | review |  |
| `styles.css` | 9805 | `.dashboard-calendar .fc-today-button` | `border-radius: 4px !important` | review |  |
| `styles.css` | 9806 | `.dashboard-calendar .fc-today-button` | `margin-right: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9816 | `.dashboard-calendar .fc-next-button` | `padding: 8px 12px !important` | review |  |
| `styles.css` | 9819 | `.dashboard-calendar .fc-next-button` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9833 | `.dashboard-calendar .fc-next-button` | `margin-left: -1px` | review |  |
| `styles.css` | 9842 | `.dashboard-calendar .fc-col-header-cell` | `padding: 12px 0 !important` | review |  |
| `styles.css` | 9874 | `.dashboard-calendar .fc-daygrid-day-frame` | `min-height: 100px` | review |  |
| `styles.css` | 9879 | `.dashboard-calendar .fc-daygrid-day-number` | `padding: 8px !important` | review |  |
| `styles.css` | 9883 | `.dashboard-calendar .fc-daygrid-day-number` | `height: 28px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9888 | `.dashboard-calendar .fc-daygrid-day-number` | `margin: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9914 | `.dashboard-calendar .fc-event` | `border-radius: 4px !important` | review |  |
| `styles.css` | 9915 | `.dashboard-calendar .fc-event` | `padding: 2px 6px !important` | review |  |
| `styles.css` | 9918 | `.dashboard-calendar .fc-event` | `margin: 1px 4px !important` | review |  |
| `styles.css` | 9924 | `.dashboard-calendar .fc-event.dashboard-node-event` | `border-radius: 999px !important` | review |  |
| `styles.css` | 9925 | `.dashboard-calendar .fc-event.dashboard-node-event` | `padding: 1px 8px !important` | review |  |
| `styles.css` | 9939 | `.dashboard-calendar .fc-event-main` | `padding: 1px 2px` | review |  |
| `styles.css` | 9945 | `.dashboard-calendar .fc-event-time` | `margin-right: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9956 | `.dashboard-calendar .fc-daygrid-event-dot` | `height: 8px` | review |  |
| `styles.css` | 9957 | `.dashboard-calendar .fc-daygrid-event-dot` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9965 | `.dashboard-calendar .fc-more-link` | `padding: 2px 6px` | review |  |
| `styles.css` | 9966 | `.dashboard-calendar .fc-more-link` | `margin: 2px 4px` | review |  |
| `styles.css` | 9977 | `.dashboard-calendar .fc-popover` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9984 | `.dashboard-calendar .fc-popover-header` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9990 | `.dashboard-calendar .fc-popover-body` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9995 | `.dashboard-calendar .fc-timegrid-slot` | `height: 48px !important` | review |  |
| `styles.css` | 10003 | `.dashboard-calendar .fc-timegrid-slot-label` | `padding-top: 4px !important` | review |  |
| `styles.css` | 10028 | `.dashboard-calendar .fc-timegrid-allday .fc-timegrid-col-frame` | `min-height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10034 | `.dashboard-calendar .fc-list` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10040 | `.dashboard-calendar .fc-list-day-cushion` | `padding: 12px 16px !important` | review |  |
| `styles.css` | 10060 | `.dashboard-calendar .fc-list-event-time` | `padding: 12px 16px !important` | review |  |
| `styles.css` | 10064 | `.dashboard-calendar .fc-list-event-graphic` | `padding: 12px 8px !important` | review |  |
| `styles.css` | 10070 | `.dashboard-calendar .fc-list-event-dot` | `height: 10px` | review |  |
| `styles.css` | 10074 | `.dashboard-calendar .fc-list-event-title` | `padding: 12px 16px !important` | review |  |
| `styles.css` | 10080 | `.dashboard-calendar .fc-list-empty` | `padding: 40px` | review |  |
| `styles.css` | 10095 | `.dashboard-calendar .fc-toolbar-title` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10099 | `.dashboard-calendar .fc-toolbar-chunk` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10103 | `.dashboard-calendar .fc-button` | `padding: 6px 10px !important` | review |  |
| `styles.css` | 10108 | `.dashboard-calendar .fc-daygrid-day-frame` | `min-height: 70px` | review |  |
| `styles.css` | 10112 | `.dashboard-calendar-section .dashboard-calendar` | `min-height: 500px` | review |  |
| `styles.css` | 10125 | `.announcement-bar-section` | `height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10126 | `.announcement-bar-section` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10135 | `.announcement-bar-label` | `padding: 0 14px` | review |  |
| `styles.css` | 10138 | `.announcement-bar-label` | `gap: 7px` | review |  |
| `styles.css` | 10155 | `.announcement-bar-track` | `height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10163 | `.ticker-placeholder` | `padding: 0 16px` | review |  |
| `styles.css` | 10171 | `.ticker-item` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10173 | `.ticker-item` | `padding: 0 16px` | review |  |
| `styles.css` | 10205 | `.ticker-type-badge` | `padding: 1px 6px` | review |  |
| `styles.css` | 10206 | `.ticker-type-badge` | `border-radius: 2px` | review |  |
| `styles.css` | 10234 | `.announcement-bar-count` | `padding: 0 12px` | review |  |
| `styles.css` | 10246 | `.announcement-modal-meta` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10247 | `.announcement-modal-meta` | `padding: 8px 0 12px` | review |  |
| `styles.css` | 10249 | `.announcement-modal-meta` | `margin-bottom: 14px` | review |  |
| `styles.css` | 10257 | `.announcement-modal-meta .announcement-type-tag` | `padding: 2px 8px` | review |  |
| `styles.css` | 10258 | `.announcement-modal-meta .announcement-type-tag` | `border-radius: 2px` | review |  |
| `styles.css` | 10272 | `.announcement-modal-content` | `max-height: 50vh` | review |  |
| `styles.css` | 10274 | `.announcement-modal-content` | `padding-right: 4px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10281 | `.dashboard-section` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10288 | `.dashboard-section .section-header` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10292 | `.dashboard-section .section-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10302 | `.dashboard-section .section-header h3` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10312 | `.section-header-actions` | `gap: 16px` | review |  |
| `styles.css` | 10320 | `.stats-cards-row` | `gap: 16px` | review |  |
| `styles.css` | 10321 | `.stats-cards-row` | `padding: 16px` | review |  |
| `styles.css` | 10337 | `.stats-card-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10338 | `.stats-card-header` | `padding: 10px 14px` | review |  |
| `styles.css` | 10364 | `.stats-card-body` | `padding: 14px` | review |  |
| `styles.css` | 10367 | `.stats-card-body` | `gap: 16px` | review |  |
| `styles.css` | 10378 | `.stats-main` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10379 | `.stats-main` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10397 | `.stats-sub` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10423 | `.stats-chart-small` | `height: 80px` | review |  |
| `styles.css` | 10436 | `.charts-row` | `gap: 16px` | review |  |
| `styles.css` | 10437 | `.charts-row` | `padding: 0 16px 16px` | review |  |
| `styles.css` | 10446 | `.chart-card.wide` | `min-height: 220px` | review |  |
| `styles.css` | 10450 | `.chart-card.narrow` | `min-height: 220px` | review |  |
| `styles.css` | 10457 | `.chart-card-header` | `padding: 10px 14px` | review |  |
| `styles.css` | 10467 | `.chart-card-header i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10475 | `.chart-year-badge` | `padding: 2px 8px` | review |  |
| `styles.css` | 10479 | `.chart-card-body` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10480 | `.chart-card-body` | `height: 180px` | review |  |
| `styles.css` | 10492 | `.recent-cards-row` | `gap: 16px` | review |  |
| `styles.css` | 10493 | `.recent-cards-row` | `padding: 16px` | review |  |
| `styles.css` | 10504 | `.recent-card-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10505 | `.recent-card-header` | `padding: 10px 14px` | review |  |
| `styles.css` | 10518 | `.recent-card-body` | `max-height: 250px` | review |  |
| `styles.css` | 10530 | `.recent-list .no-data-message` | `padding: 30px` | review |  |
| `styles.css` | 10544 | `.recent-item` | `padding: 10px 14px` | review |  |
| `styles.css` | 10562 | `.item-header` | `margin-bottom: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10573 | `.item-status` | `padding: 2px 8px` | review |  |
| `styles.css` | 10590 | `.item-body` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10605 | `.calendar-container` | `padding: 16px` | review |  |
| `styles.css` | 10609 | `.dashboard-calendar` | `min-height: 500px` | review |  |
| `styles.css` | 10616 | `.calendar-filter-control` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10627 | `.calendar-filter-select` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10630 | `.calendar-filter-select` | `padding: 0 10px` | review |  |
| `styles.css` | 10640 | `.calendar-legend` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10648 | `.legend-item` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10662 | `.dashboard-node-content` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10699 | `.stats-chart-small` | `height: 100px` | review |  |
| `styles.css` | 10721 | `.logo-section` | `margin-top: 1rem` | review |  |
| `styles.css` | 10728 | `.logo-edit-area` | `gap: 1.5rem` | review |  |
| `styles.css` | 10729 | `.logo-edit-area` | `margin-top: 0.5rem` | review |  |
| `styles.css` | 10739 | `.logo-edit-area .file-input-group` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10753 | `.logo-library` | `gap: 0.5rem` | review |  |
| `styles.css` | 10760 | `.logo-empty-state` | `padding: 0.75rem 1rem` | review |  |
| `styles.css` | 10769 | `.logo-create-hint` | `gap: 0.5rem` | review |  |
| `styles.css` | 10770 | `.logo-create-hint` | `padding: 1rem` | review |  |
| `styles.css` | 10773 | `.logo-create-hint` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10792 | `.logo-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10793 | `.logo-item` | `padding: 0.5rem` | review |  |
| `styles.css` | 10810 | `.logo-preview` | `height: 55px` | review |  |
| `styles.css` | 10815 | `.logo-preview` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10846 | `.logo-actions` | `gap: 0.25rem` | review |  |
| `styles.css` | 10847 | `.logo-actions` | `margin-top: 0.4rem` | review |  |
| `styles.css` | 10851 | `.logo-actions .btn` | `padding: 3px 6px` | review |  |
| `styles.css` | 10862 | `.logo-badge` | `padding: 0.1rem 0.4rem` | review |  |
| `styles.css` | 10863 | `.logo-badge` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10887 | `.logo-lightbox img` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10909 | `.rich-editor-toolbar` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10910 | `.rich-editor-toolbar` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10914 | `.rich-editor-toolbar` | `border-radius: 6px 6px 0 0` | review |  |
| `styles.css` | 10920 | `.rich-editor-toolbar button` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10927 | `.rich-editor-toolbar button` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10943 | `.rich-editor-toolbar select` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10944 | `.rich-editor-toolbar select` | `padding: 4px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10946 | `.rich-editor-toolbar select` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10954 | `.toolbar-separator` | `height: 24px` | review |  |
| `styles.css` | 10956 | `.toolbar-separator` | `margin: 0 4px` | review |  |
| `styles.css` | 10960 | `.rich-editor-content` | `min-height: 200px` | review |  |
| `styles.css` | 10961 | `.rich-editor-content` | `max-height: 400px` | review |  |
| `styles.css` | 10963 | `.rich-editor-content` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10965 | `.rich-editor-content` | `border-radius: 0 0 6px 6px` | review |  |
| `styles.css` | 10985 | `.rich-editor-content p` | `margin: 0 0 8px 0` | review |  |
| `styles.css` | 10990 | `.rich-editor-content ol` | `margin: 8px 0` | review |  |
| `styles.css` | 10991 | `.rich-editor-content ol` | `padding-left: 24px` | review |  |
| `styles.css` | 10996 | `.rich-editor-content h4` | `margin: 12px 0 8px 0` | review |  |
| `styles.css` | 11003 | `.attachment-preview-list` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11004 | `.attachment-preview-list` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11010 | `.attachment-preview-item` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11011 | `.attachment-preview-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11014 | `.attachment-preview-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11040 | `.attachment-preview-item .remove-attachment` | `height: 24px` | review |  |
| `styles.css` | 11059 | `.message-attachments` | `margin-top: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11060 | `.message-attachments` | `padding-top: 16px` | review |  |
| `styles.css` | 11066 | `.message-attachments > strong` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11077 | `.attachment-list` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11087 | `.attachment-link` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11088 | `.attachment-link` | `padding: 8px 12px` | review |  |
| `styles.css` | 11091 | `.attachment-link` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11118 | `.attachment-image-preview` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11119 | `.attachment-image-preview` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11124 | `.attachment-image-preview .preview-thumb` | `height: 90px` | review |  |
| `styles.css` | 11126 | `.attachment-image-preview .preview-thumb` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11140 | `.attachment-actions` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11141 | `.attachment-actions` | `margin-left: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11146 | `.attachment-actions button` | `height: 28px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 11153 | `.attachment-actions button` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11182 | `.image-lightbox-overlay img` | `max-height: 90vh` | review |  |
| `styles.css` | 11184 | `.image-lightbox-overlay img` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11211 | `.existing-attachment-item` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11212 | `.existing-attachment-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11215 | `.existing-attachment-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11228 | `.existing-attachment-item .existing-badge` | `padding: 1px 6px` | review |  |
| `styles.css` | 11229 | `.existing-attachment-item .existing-badge` | `border-radius: 3px` | review |  |
| `styles.css` | 11235 | `.badge-sm` | `padding: 2px 6px` | review |  |
| `styles.css` | 11238 | `.badge-sm` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11273 | `.message-reply-info` | `margin-top: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11274 | `.message-reply-info` | `padding: 10px 14px` | review |  |
| `styles.css` | 11276 | `.message-reply-info` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11282 | `.message-reply-info i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11290 | `.info-box` | `padding: 1rem` | review |  |
| `styles.css` | 11293 | `.info-box` | `margin-bottom: 1rem` | review |  |
| `styles.css` | 11315 | `.settings-section .section-desc` | `margin: -8px 0 16px` | review |  |
| `styles.css` | 11343 | `.toggle-control` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11350 | `.toggle-control input[type="checkbox"]` | `height: 1px` | review |  |
| `styles.css` | 11360 | `.toggle-switch` | `height: 24px` | review |  |
| `styles.css` | 11362 | `.toggle-switch` | `border-radius: 24px` | review |  |
| `styles.css` | 11373 | `.toggle-switch::after` | `height: 18px` | review |  |
| `styles.css` | 11396 | `.settings-note-list` | `margin: 4px 0 0` | review |  |
| `styles.css` | 11397 | `.settings-note-list` | `padding-left: 20px` | review |  |
| `styles.css` | 11404 | `.settings-note-list li + li` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11409 | `.system-update-upload-grid` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11415 | `.system-update-maintenance-row` | `gap: 10px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11417 | `.system-update-maintenance-row` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11418 | `.system-update-maintenance-row` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11420 | `.system-update-maintenance-row` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11427 | `.system-update-maintenance-status` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11434 | `.system-update-actions` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11435 | `.system-update-actions` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11440 | `.system-update-status` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11441 | `.system-update-status` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11442 | `.system-update-status` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11466 | `.system-rollback-panel` | `margin: 0 0 12px` | review |  |
| `styles.css` | 11467 | `.system-rollback-panel` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11469 | `.system-rollback-panel` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11474 | `.system-rollback-panel h5` | `margin: 0 0 8px` | review |  |
| `styles.css` | 11482 | `.system-rollback-controls` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11495 | `.system-update-meta` | `gap: 8px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11496 | `.system-update-meta` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11497 | `.system-update-meta` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11499 | `.system-update-meta` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11507 | `.system-update-meta-item` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11521 | `.system-update-change-list h5` | `margin: 0 0 8px` | review |  |
| `styles.css` | 11528 | `.system-update-change-list ul` | `padding-left: 18px` | review |  |
| `styles.css` | 11532 | `.system-update-change-list li` | `margin: 4px 0` | review |  |
| `styles.css` | 11585 | `.production-schedule-tab-panel` | `min-height: 520px` | review |  |
| `styles.css` | 11629 | `.production-schedule-column` | `min-height: 440px` | review |  |
| `styles.css` | 11696 | `.schedule-run-label` | `margin-top: 2px` | review |  |
| `styles.css` | 11718 | `.work-order-type-badge` | `padding: 3px 8px` | review |  |
| `styles.css` | 11720 | `.work-order-type-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11752 | `.work-order-second-screening-empty` | `gap: 0.75rem` | review |  |
| `styles.css` | 11758 | `.work-order-second-screening-cards` | `gap: 0.75rem` | review |  |
| `styles.css` | 11764 | `.work-order-second-screening-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11766 | `.work-order-second-screening-card` | `gap: 0.4rem` | review |  |
| `styles.css` | 11767 | `.work-order-second-screening-card` | `padding: 0.75rem` | review |  |
| `styles.css` | 11773 | `.work-order-inline-rescreen-card` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11775 | `.work-order-inline-rescreen-card` | `gap: 0.85rem` | review |  |
| `styles.css` | 11776 | `.work-order-inline-rescreen-card` | `padding: 1rem` | review |  |
| `styles.css` | 11783 | `.work-order-inline-rescreen-actions` | `gap: 0.75rem` | review |  |
| `styles.css` | 11788 | `.work-order-inline-rescreen-header p` | `margin: 0.2rem 0 0` | review |  |
| `styles.css` | 11794 | `.work-order-inline-rescreen-actions` | `padding-top: 0.75rem` | review |  |
| `styles.css` | 11799 | `.work-order-second-screening-detail-block` | `margin-top: 0.1rem` | review |  |
| `styles.css` | 11800 | `.work-order-second-screening-detail-block` | `padding-top: 0.45rem` | review |  |
| `styles.css` | 11806 | `.work-order-second-screening-inline-list` | `gap: 0.35rem 0.75rem` | review |  |
| `styles.css` | 11813 | `.work-order-second-screening-detail-list` | `gap: 0.35rem` | review |  |
| `styles.css` | 11815 | `.work-order-second-screening-detail-list` | `margin: 0.45rem 0 0` | review |  |
| `styles.css` | 11823 | `.work-order-second-screening-detail-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11825 | `.work-order-second-screening-detail-item` | `gap: 0.15rem` | review |  |
| `styles.css` | 11826 | `.work-order-second-screening-detail-item` | `padding: 0.45rem 0.55rem` | review |  |
| `styles.css` | 11842 | `.rescreen-image-upload-panel` | `gap: 0.75rem` | review |  |
| `styles.css` | 11847 | `.rescreen-image-grid` | `gap: 0.75rem` | review |  |
| `styles.css` | 11854 | `.rescreen-image-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11856 | `.rescreen-image-card` | `gap: 0.5rem` | review |  |
| `styles.css` | 11857 | `.rescreen-image-card` | `padding: 0.65rem` | review |  |
| `styles.css` | 11862 | `.rescreen-image-card img` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11863 | `.rescreen-image-card img` | `height: 120px` | review |  |
| `styles.css` | 11883 | `.form-section-heading` | `gap: 0.75rem` | review |  |
| `styles.css` | 11905 | `.schedule-status-chip` | `padding: 3px 8px` | review |  |
| `styles.css` | 11907 | `.schedule-status-chip` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11915 | `.production-time-content` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11919 | `.production-status-content` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11932 | `.machine-status-detail-wrap` | `padding: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11948 | `.machine-status-detail-empty` | `padding: 12px 10px` | review |  |
| `styles.css` | 11958 | `.schedule-empty` | `padding: 18px 10px` | review |  |
| `styles.css` | 11966 | `.schedule-live-time-row` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11967 | `.schedule-live-time-row` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |

