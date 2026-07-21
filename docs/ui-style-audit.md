# UI Style Audit

Generated: 2026-07-21T14:08:03.281Z

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
| `styles.css` | 220 | `@page` | `margin: 12mm` | review |  |
| `styles.css` | 255 | `.app-container` | `height: 100vh` | review |  |
| `styles.css` | 497 | `.dropdown-divider` | `height: 1px` | review |  |
| `styles.css` | 519 | `.weekday-badge` | `padding: 4px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 532 | `.weekday-text` | `margin-left: 5px` | review |  |
| `styles.css` | 560 | `.record-link-button:focus-visible` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 737 | `.subtext` | `margin-top: 2px` | review |  |
| `styles.css` | 759 | `.text-warning i` | `margin-right: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 859 | `.menu-item` | `margin-bottom: 2px` | review |  |
| `styles.css` | 893 | `.menu-item.active > .menu-link` | `padding-left: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 912 | `.menu-item.active .submenu` | `max-height: 500px` | review |  |
| `styles.css` | 1041 | `.tab-header` | `padding: 10px 15px` | review |  |
| `styles.css` | 1045 | `.tab-header` | `margin-bottom: -1px` | review |  |
| `styles.css` | 1047 | `.tab-header` | `border-top-left-radius: 5px` | review |  |
| `styles.css` | 1048 | `.tab-header` | `border-top-right-radius: 5px` | review |  |
| `styles.css` | 1051 | `.tab-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1069 | `.tab-header .close-tab` | `margin-left: 5px` | review |  |
| `styles.css` | 1082 | `.tab-content-area` | `padding: 20px` | review |  |
| `styles.css` | 1097 | `.example-table-container` | `margin-top: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1222 | `.data-table input[type="checkbox"]` | `height: 16px` | review |  |
| `styles.css` | 1319 | `body.login-page` | `min-height: 100vh` | review |  |
| `styles.css` | 1329 | `.login-wrapper` | `padding: 32px 16px` | review |  |
| `styles.css` | 1336 | `.login-card` | `padding: 48px` | review |  |
| `styles.css` | 1339 | `.login-card` | `gap: 32px` | review |  |
| `styles.css` | 1347 | `.login-brand` | `padding-right: 32px` | review |  |
| `styles.css` | 1353 | `.login-brand h1` | `margin-top: 18px` | review |  |
| `styles.css` | 1359 | `.brand-logo img.company-logo-img` | `height: 68px` | review |  |
| `styles.css` | 1366 | `.login-brand p` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1372 | `.login-brand .system-subtitle` | `margin-top: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1379 | `.login-brand .login-hint` | `margin-top: 14px` | review |  |
| `styles.css` | 1384 | `.brand-logo` | `height: 76px` | review |  |
| `styles.css` | 1402 | `.login-card form` | `gap: 18px` | review |  |
| `styles.css` | 1408 | `.form-group label` | `margin-bottom: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1414 | `.form-group .form-control` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1439 | `.toggle-password` | `padding: 4px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1451 | `.remember-me` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1456 | `.login-button` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1461 | `.login-button` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1479 | `.login-success` | `margin-top: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1480 | `.login-success` | `padding: 12px 14px` | review |  |
| `styles.css` | 1498 | `.login-hint` | `padding: 24px` | review |  |
| `styles.css` | 1504 | `.login-hint h2` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1516 | `.sample-accounts td` | `padding: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1528 | `.sample-accounts code` | `padding: 2px 5px` | review |  |
| `styles.css` | 1537 | `.login-footer` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1542 | `.login-card` | `padding: 32px` | review |  |
| `styles.css` | 1549 | `.login-brand` | `padding-bottom: 24px` | review |  |
| `styles.css` | 1563 | `.content-header.with-actions` | `gap: 16px` | review |  |
| `styles.css` | 1581 | `.content-header.with-actions.sticky` | `padding: 16px 20px` | review |  |
| `styles.css` | 1582 | `.content-header.with-actions.sticky` | `margin: -20px -20px 20px -20px` | review |  |
| `styles.css` | 1590 | `.content-header.with-actions .subtitle` | `margin: 4px 0 0` | review |  |
| `styles.css` | 1598 | `.header-actions` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1656 | `.btn.text` | `padding: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1660 | `.btn.text` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1666 | `.btn.text` | `height: 30px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 1905 | `.btn-dropdown-wrapper .dropdown-menu` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1913 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1914 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item` | `padding: 10px 14px` | review |  |
| `styles.css` | 1930 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item:first-child` | `border-radius: 6px 6px 0 0` | review |  |
| `styles.css` | 1934 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item:last-child` | `border-radius: 0 0 6px 6px` | review |  |
| `styles.css` | 1974 | `.summary-cards` | `gap: 1rem` | review |  |
| `styles.css` | 1976 | `.summary-cards` | `margin-bottom: 1rem` | review |  |
| `styles.css` | 1982 | `.summary-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1983 | `.summary-card` | `padding: 1rem 1.25rem` | review |  |
| `styles.css` | 1986 | `.summary-card` | `gap: 1rem` | review |  |
| `styles.css` | 2007 | `.summary-card .summary-label` | `margin-bottom: 0.25rem` | review |  |
| `styles.css` | 2033 | `.filter-summary-bar` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 2065 | `.filter-count` | `height: 18px` | review |  |
| `styles.css` | 2100 | `.filter-drawer` | `height: 100vh` | review |  |
| `styles.css` | 2244 | `.filter-form .form-grid label:not(.filter-checkbox) > select` | `min-height: 38px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 2325 | `.checkbox-label` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 2496 | `.form-grid label.inline-label input[type="checkbox"]` | `height: 16px` | review |  |
| `styles.css` | 2771 | `.modal-alert::before` | `margin-top: 1px` | review |  |
| `styles.css` | 2830 | `.form-panel` | `margin-top: 25px` | review |  |
| `styles.css` | 2831 | `.form-panel` | `padding: 20px` | review |  |
| `styles.css` | 2833 | `.form-panel` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 2839 | `.form-panel h3` | `margin-bottom: 15px` | review |  |
| `styles.css` | 2845 | `.form-panel small` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3159 | `.modal-overlay` | `padding: 20px` | review |  |
| `styles.css` | 3168 | `.modal-window` | `max-height: 80vh` | review |  |
| `styles.css` | 3222 | `.column-selector` | `max-height: 80vh` | review |  |
| `styles.css` | 3230 | `.column-selector-header` | `padding: 15px` | review |  |
| `styles.css` | 3268 | `.column-selector-body` | `padding: 15px` | review |  |
| `styles.css` | 3274 | `.column-selector-body .column-option` | `padding: 8px 0` | review |  |
| `styles.css` | 3284 | `.column-selector-body .column-option input[type="checkbox"]` | `margin-right: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3286 | `.column-selector-body .column-option input[type="checkbox"]` | `height: 18px` | review |  |
| `styles.css` | 3296 | `.column-selector-footer` | `padding: 12px 15px` | review |  |
| `styles.css` | 3299 | `.column-selector-footer` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3302 | `.column-selector-footer` | `border-radius: 0 0 8px 8px` | review |  |
| `styles.css` | 3399 | `.role-permission-transfer-section label.inline-label` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3408 | `.role-permission-transfer-section label.inline-label span` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3413 | `.role-permission-transfer-section label.inline-label select` | `min-height: 260px` | review |  |
| `styles.css` | 3414 | `.role-permission-transfer-section label.inline-label select` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3427 | `.role-permission-transfer-controls-box` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3428 | `.role-permission-transfer-controls-box` | `min-height: 260px` | review |  |
| `styles.css` | 3433 | `.role-permission-transfer-controls-box .btn` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3453 | `.form-address` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3459 | `.form-address label` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3501 | `.screening-create-panel` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3510 | `.screening-create-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3521 | `.screening-create-header` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3533 | `.screening-create-body` | `padding: 16px` | review |  |
| `styles.css` | 3543 | `.screening-create-footer` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3545 | `.screening-create-footer` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3553 | `.screening-create-footer .btn.small` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3559 | `.checkbox-field` | `gap: 5px` | review |  |
| `styles.css` | 3569 | `.checkbox-field input[type="checkbox"]` | `height: 18px` | review |  |
| `styles.css` | 3576 | `.file-input-group` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3586 | `.file-input-group label.file-upload-btn` | `padding: 6px 12px` | review |  |
| `styles.css` | 3609 | `.file-input-group label.file-upload-btn i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3615 | `.file-input-group .file-hint` | `margin-left: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3621 | `.invoice-stamp-preview` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3623 | `.invoice-stamp-preview` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3624 | `.invoice-stamp-preview` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3630 | `.invoice-stamp-preview img` | `max-height: 200px` | review |  |
| `styles.css` | 3632 | `.invoice-stamp-preview img` | `margin: 0 auto 8px` | review |  |
| `styles.css` | 3634 | `.invoice-stamp-preview img` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3640 | `.invoice-stamp-preview .preview-actions` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3645 | `.invoice-stamp-preview .icon-button` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3646 | `.invoice-stamp-preview .icon-button` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3655 | `.attachment-preview` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3657 | `.attachment-preview` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3658 | `.attachment-preview` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3668 | `.attachment-preview .preview-info` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3680 | `.attachment-preview .preview-actions` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3685 | `.attachment-preview .icon-button` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3686 | `.attachment-preview .icon-button` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3694 | `.field-hint` | `margin-top: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3710 | `.modal-window form .form-grid label small` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3721 | `.modal-window.number-sequences-modal .form-grid` | `gap: 14px` | review |  |
| `styles.css` | 3748 | `.modal-window.number-sequences-modal label.inline-label > small` | `margin-top: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3833 | `.modal-window.customers-modal form[data-customers-form]` | `gap: 14px 12px` | review |  |
| `styles.css` | 3862 | `.modal-window.customers-modal .form-row > .form-section > .customer-modal-grid` | `gap: 8px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3933 | `.modal-window.customers-modal .customer-stamp-field` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3934 | `.modal-window.customers-modal .customer-stamp-field` | `min-height: 72px` | review |  |
| `styles.css` | 3943 | `.modal-window.customers-modal .customer-stamp-field > span` | `padding: 4px 10px` | review |  |
| `styles.css` | 3956 | `.modal-window.customers-modal .customer-stamp-control` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3962 | `.modal-window.customers-modal .customer-stamp-control .field-hint` | `margin: 6px 0 0` | review |  |
| `styles.css` | 3970 | `.modal-window.customers-modal .customer-stamp-control .file-input-group` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4016 | `.modal-window.suppliers-modal form[data-suppliers-form]` | `gap: 14px 12px` | review |  |
| `styles.css` | 4045 | `.modal-window.suppliers-modal .form-row > .form-section > .supplier-modal-grid` | `gap: 8px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4075 | `.modal-window.suppliers-modal .supplier-attachment-field` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4076 | `.modal-window.suppliers-modal .supplier-attachment-field` | `min-height: 72px` | review |  |
| `styles.css` | 4085 | `.modal-window.suppliers-modal .supplier-attachment-field > span` | `padding: 4px 10px` | review |  |
| `styles.css` | 4098 | `.modal-window.suppliers-modal .supplier-attachment-control` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4104 | `.modal-window.suppliers-modal .supplier-attachment-control .field-hint` | `margin: 6px 0 0` | review |  |
| `styles.css` | 4112 | `.modal-window.suppliers-modal .supplier-attachment-control .file-input-group` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4172 | `.detail-content` | `padding: 10px 0` | review |  |
| `styles.css` | 4178 | `.detail-content dl` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4179 | `.detail-content dl` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4180 | `.detail-content dl` | `padding: 15px` | review |  |
| `styles.css` | 4182 | `.detail-content dl` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4188 | `.detail-content dl > div` | `gap: 15px` | review |  |
| `styles.css` | 4190 | `.detail-content dl > div` | `padding: 8px 0` | review |  |
| `styles.css` | 4212 | `.detail-content dl.inventory-detail-list` | `column-gap: 20px` | review |  |
| `styles.css` | 4304 | `.subsection` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4305 | `.subsection` | `padding: 16px` | review |  |
| `styles.css` | 4307 | `.subsection` | `margin-bottom: 15px` | review |  |
| `styles.css` | 4310 | `.subsection` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4317 | `.subsection-header` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4318 | `.subsection-header` | `padding-bottom: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4347 | `.image-gallery` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4348 | `.image-gallery` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4349 | `.image-gallery` | `min-height: 100px` | review |  |
| `styles.css` | 4358 | `.image-gallery .empty-state` | `padding: 40px 20px` | review |  |
| `styles.css` | 4364 | `.image-gallery .empty-state i` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4371 | `.image-gallery .image-item` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4389 | `.image-gallery .image-item .btn-delete` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4391 | `.image-gallery .image-item .btn-delete` | `height: 28px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 4408 | `.order-items-modal` | `max-height: 85vh` | review |  |
| `styles.css` | 4436 | `.order-items-modal .order-items-modal-body::-webkit-scrollbar-track` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4441 | `.order-items-modal .order-items-modal-body::-webkit-scrollbar-thumb` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4497 | `.metrics-comparison-container` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4498 | `.metrics-comparison-container` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4513 | `.metrics-comparison-container .metrics-subtitle` | `margin: 0 0 8px 0` | review |  |
| `styles.css` | 4514 | `.metrics-comparison-container .metrics-subtitle` | `padding-bottom: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4529 | `.metrics-comparison-container .metric` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4530 | `.metrics-comparison-container .metric` | `padding: 5px 0` | review |  |
| `styles.css` | 4582 | `.table-secondary` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4590 | `.stacked-inputs` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4608 | `.order-items-services-table th:nth-child(3)` | `padding-left: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4609 | `.order-items-services-table th:nth-child(3)` | `padding-right: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4615 | `.order-items-services-table td:nth-child(6)` | `padding-left: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4616 | `.order-items-services-table td:nth-child(6)` | `padding-right: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4630 | `.modal-window.work-orders-modal` | `max-height: 90vh` | review |  |
| `styles.css` | 4634 | `.work-orders-modal h3[data-modal-title]` | `margin-bottom: 15px` | review |  |
| `styles.css` | 4636 | `.work-orders-modal h3[data-modal-title]` | `padding-right: 40px` | review |  |
| `styles.css` | 4640 | `.work-orders-modal .modal-alert` | `margin-bottom: 15px` | review |  |
| `styles.css` | 4658 | `.work-orders-modal-body` | `padding-right: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4667 | `.work-orders-modal-body::-webkit-scrollbar-track` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4672 | `.work-orders-modal-body::-webkit-scrollbar-thumb` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4680 | `.work-orders-modal-footer` | `padding-top: 15px` | review |  |
| `styles.css` | 4699 | `.rescreen-batches-modal` | `max-height: 88vh` | review |  |
| `styles.css` | 4701 | `.rescreen-batches-modal` | `padding: 20px 20px 16px` | review |  |
| `styles.css` | 4706 | `.rescreen-batches-modal h3` | `margin-bottom: 14px` | review |  |
| `styles.css` | 4711 | `.rescreen-batches-modal > .modal-alert` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4718 | `.rescreen-batches-modal form` | `gap: 14px` | review |  |
| `styles.css` | 4734 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-header` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4736 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-header` | `margin: 0 0 8px` | review |  |
| `styles.css` | 4737 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-header` | `padding: 0 0 6px` | review |  |
| `styles.css` | 4741 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-body` | `padding-left: 2px` | review |  |
| `styles.css` | 4742 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-body` | `padding-right: 2px` | review |  |
| `styles.css` | 4756 | `[data-rescreen-batches-modal] .rescreen-section-title` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4801 | `.rescreen-section-helper` | `margin: 0 0 12px` | review |  |
| `styles.css` | 4805 | `.rescreen-source-summary-grid` | `min-height: 128px` | review |  |
| `styles.css` | 4811 | `.rescreen-source-card` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4814 | `.rescreen-source-card` | `gap: 14px` | review |  |
| `styles.css` | 4815 | `.rescreen-source-card` | `padding: 16px 18px` | review |  |
| `styles.css` | 4829 | `.rescreen-source-card-header` | `gap: 0.75rem` | review |  |
| `styles.css` | 4835 | `.rescreen-source-card-title-group` | `gap: 0.2rem` | review |  |
| `styles.css` | 4856 | `.rescreen-source-card-title-group p` | `margin: 0.15rem 0 0` | review |  |
| `styles.css` | 4862 | `.rescreen-source-card-badge` | `border-radius: 999px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4867 | `.rescreen-source-card-badge` | `padding: 0.35rem 0.8rem` | review |  |
| `styles.css` | 4878 | `.rescreen-source-card-body` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4885 | `.rescreen-source-fact` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4887 | `.rescreen-source-fact` | `gap: 0.35rem` | review |  |
| `styles.css` | 4888 | `.rescreen-source-fact` | `padding: 0.8rem 0.9rem` | review |  |
| `styles.css` | 4916 | `.rescreen-source-state` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4918 | `.rescreen-source-state` | `gap: 0.35rem` | review |  |
| `styles.css` | 4919 | `.rescreen-source-state` | `padding: 16px 18px` | review |  |
| `styles.css` | 4953 | `.rescreen-batches-modal-body` | `padding-right: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4962 | `.rescreen-batches-modal-body::-webkit-scrollbar-track` | `border-radius: 999px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4967 | `.rescreen-batches-modal-body::-webkit-scrollbar-thumb` | `border-radius: 999px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4979 | `.rescreen-batches-modal-footer` | `padding-top: 14px` | review |  |
| `styles.css` | 4989 | `[data-rescreen-batches-detail-modal] .modal-window.xlarge` | `max-height: 88vh` | review |  |
| `styles.css` | 4997 | `[data-rescreen-batches-detail-modal] .detail-content` | `padding: 4px 0 0` | review |  |
| `styles.css` | 5003 | `[data-rescreen-batches-detail-modal] .form-actions` | `margin-top: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5004 | `[data-rescreen-batches-detail-modal] .form-actions` | `padding-top: 14px` | review |  |
| `styles.css` | 5010 | `[data-rescreen-batches-detail-modal] .detail-content .detail-section p` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 5016 | `[data-rescreen-batches-detail-modal] .detail-content .detail-grid` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5023 | `[data-rescreen-batches-detail-modal] .detail-content .detail-item` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 5026 | `[data-rescreen-batches-detail-modal] .detail-content .detail-item` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5027 | `[data-rescreen-batches-detail-modal] .detail-content .detail-item` | `padding: 12px 14px` | review |  |
| `styles.css` | 5070 | `.rescreen-batches-modal` | `padding: 16px 16px 14px` | review |  |
| `styles.css` | 5093 | `.work-orders-section-layout` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5095 | `.work-orders-section-layout` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5134 | `.work-order-schedule-section .weekday-badge` | `padding: 4px 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5153 | `.work-orders-section-right .table-responsive` | `min-height: 280px` | review |  |
| `styles.css` | 5162 | `.work-order-type-top-section` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5171 | `.work-order-source-mode-hint` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5172 | `.work-order-source-mode-hint` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5174 | `.work-order-source-mode-hint` | `border-radius: 5px` | review |  |
| `styles.css` | 5186 | `.work-order-collapsible-section details` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5194 | `.work-order-collapsible-section summary` | `padding-bottom: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5195 | `.work-order-collapsible-section summary` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5207 | `.work-order-collapsible-section summary::before` | `margin-right: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5291 | `.work-orders-section-right .table-responsive` | `min-height: 220px` | review |  |
| `styles.css` | 5312 | `.work-order-live-time-row` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5313 | `.work-order-live-time-row` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 5315 | `.work-order-live-time-row` | `padding: 10px 14px` | review |  |
| `styles.css` | 5436 | `.work-order-edit-first-piece-card` | `min-height: 200px` | review |  |
| `styles.css` | 5441 | `.work-order-edit-first-piece-card .subsection-body` | `min-height: 140px` | review |  |
| `styles.css` | 5462 | `.work-order-edit-images-card .table-responsive` | `min-height: 120px` | review |  |
| `styles.css` | 5486 | `.work-order-production-mode-tabs` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5487 | `.work-order-production-mode-tabs` | `padding: 0 2px` | review |  |
| `styles.css` | 5495 | `.work-order-production-mode-tabs .tab-btn` | `border-radius: 4px 4px 0 0` | review |  |
| `styles.css` | 5496 | `.work-order-production-mode-tabs .tab-btn` | `padding: 6px 14px` | review |  |
| `styles.css` | 5566 | `.work-order-production-mode-panel` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5575 | `.work-order-execution-image-tabs` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5589 | `.work-order-image-sections-grid` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5612 | `.work-order-production-mode-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5653 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `height: min(850px, 94vh)` | review |  |
| `styles.css` | 5655 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `max-height: 94vh` | review |  |
| `styles.css` | 5680 | `[data-work-orders-edit-modal] form` | `padding-top: 42px` | review |  |
| `styles.css` | 5864 | `[data-work-orders-edit-modal] .work-order-edit-drawing-card` | `min-height: 82px` | review |  |
| `styles.css` | 5979 | `[data-work-orders-edit-modal] .work-order-edit-service-section` | `min-height: 170px` | review |  |
| `styles.css` | 5987 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card` | `min-height: 170px` | review |  |
| `styles.css` | 5999 | `[data-work-orders-edit-modal] .work-order-edit-service-section .table-responsive` | `min-height: 126px` | review |  |
| `styles.css` | 6000 | `[data-work-orders-edit-modal] .work-order-edit-service-section .table-responsive` | `max-height: 126px` | review |  |
| `styles.css` | 6049 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card .subsection-actions .btn` | `min-height: 25px` | review |  |
| `styles.css` | 6055 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card .subsection-body` | `min-height: 122px` | review |  |
| `styles.css` | 6083 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card textarea` | `height: 24px` | review |  |
| `styles.css` | 6084 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card textarea` | `min-height: 24px` | review |  |
| `styles.css` | 6097 | `[data-work-orders-edit-modal] .work-order-edit-production-records` | `min-height: 230px` | review |  |
| `styles.css` | 6115 | `[data-work-orders-edit-modal] .work-order-production-mode-tabs` | `min-height: 30px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 6127 | `[data-work-orders-edit-modal] .work-order-production-mode-header` | `min-height: 25px` | review |  |
| `styles.css` | 6135 | `[data-work-orders-edit-modal] .work-order-production-mode-header .btn` | `min-height: 25px` | review |  |
| `styles.css` | 6151 | `[data-work-orders-edit-modal] .production-records-table select` | `height: 25px` | review |  |
| `styles.css` | 6152 | `[data-work-orders-edit-modal] .production-records-table select` | `min-height: 25px` | review |  |
| `styles.css` | 6215 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `height: 92vh` | review |  |
| `styles.css` | 6216 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `max-height: 92vh` | review |  |
| `styles.css` | 6418 | `.work-order-mobile-quick-entry-card` | `margin-top: 14px` | review |  |
| `styles.css` | 6419 | `.work-order-mobile-quick-entry-card` | `padding-top: 2px` | review |  |
| `styles.css` | 6424 | `.work-order-mobile-quick-entry-body` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6428 | `.work-order-mobile-quick-entry-qr` | `min-height: 232px` | review |  |
| `styles.css` | 6430 | `.work-order-mobile-quick-entry-qr` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 6435 | `.work-order-mobile-quick-entry-qr` | `padding: 14px` | review |  |
| `styles.css` | 6463 | `.work-order-mobile-quick-entry-actions` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6502 | `[data-work-orders-edit-modal] .work-order-edit-drawing-card` | `min-height: 86px` | review |  |
| `styles.css` | 6668 | `.searchable-select-native` | `height: 1px !important` | review |  |
| `styles.css` | 6712 | `.searchable-select-list` | `max-height: 220px` | review |  |
| `styles.css` | 6772 | `[data-machine-picker-modal] .machine-picker-layout` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6779 | `[data-machine-picker-modal] .machine-picker-groups` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6780 | `[data-machine-picker-modal] .machine-picker-groups` | `max-height: min(52vh, 420px)` | review |  |
| `styles.css` | 6782 | `[data-machine-picker-modal] .machine-picker-groups` | `padding-right: 4px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 6787 | `[data-machine-picker-modal] .machine-picker-group-btn` | `min-height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 6788 | `[data-machine-picker-modal] .machine-picker-group-btn` | `padding: 7px 10px` | review |  |
| `styles.css` | 6816 | `[data-machine-picker-modal] .machine-picker-panel-header` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6817 | `[data-machine-picker-modal] .machine-picker-panel-header` | `margin-top: 2px` | review |  |
| `styles.css` | 6818 | `[data-machine-picker-modal] .machine-picker-panel-header` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 6835 | `[data-machine-picker-modal] .machine-picker-grid` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6836 | `[data-machine-picker-modal] .machine-picker-grid` | `max-height: min(46vh, 360px)` | review |  |
| `styles.css` | 6844 | `[data-machine-picker-modal] .machine-picker-option` | `column-gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6846 | `[data-machine-picker-modal] .machine-picker-option` | `min-height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 6847 | `[data-machine-picker-modal] .machine-picker-option` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 6849 | `[data-machine-picker-modal] .machine-picker-option` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 6936 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card` | `min-height: 175px` | review |  |
| `styles.css` | 6949 | `[data-work-orders-edit-modal] .work-order-edit-production-records` | `min-height: 260px` | review |  |
| `styles.css` | 7056 | `[data-work-orders-edit-modal] .work-order-edit-summary-value > span` | `height: 1px` | review |  |
| `styles.css` | 7402 | `[data-work-orders-edit-modal] .work-order-tool-analysis-empty` | `margin-bottom: 0.75rem` | review |  |
| `styles.css` | 7471 | `[data-work-orders-edit-modal] .work-order-edit-service-section .table-responsive` | `max-height: 210px` | review |  |
| `styles.css` | 7609 | `[data-work-orders-edit-modal] .split-work-order-header h4` | `margin: 0 0 4px` | review |  |
| `styles.css` | 7628 | `[data-work-orders-edit-modal] .split-machine-tab` | `min-height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 7721 | `[data-work-orders-edit-modal] .split-machine-settings-card` | `min-height: 175px` | review |  |
| `styles.css` | 7763 | `[data-work-orders-edit-modal] .split-machine-settings-grid label.full-width textarea` | `min-height: 72px` | review |  |
| `styles.css` | 7890 | `.split-work-order-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7891 | `.split-work-order-header` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7892 | `.split-work-order-header` | `padding-bottom: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7897 | `.split-work-order-header h4` | `margin: 0 0 4px` | review |  |
| `styles.css` | 7903 | `.split-work-order-layout` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7910 | `.split-machine-tabs` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7917 | `.split-machine-tab` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7918 | `.split-machine-tab` | `padding: 8px 12px` | review |  |
| `styles.css` | 7923 | `.split-machine-tab` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7925 | `.split-machine-tab` | `min-height: 42px` | review |  |
| `styles.css` | 7939 | `.split-machine-empty-tabs` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7940 | `.split-machine-empty-tabs` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7948 | `.split-machine-empty-state` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7952 | `.split-machine-empty-state` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7953 | `.split-machine-empty-state` | `padding: 18px` | review |  |
| `styles.css` | 7974 | `.split-machine-content-stack` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7979 | `.split-machine-card` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7980 | `.split-machine-card` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7985 | `.split-machine-card h5` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7993 | `.split-machine-card-header` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7994 | `.split-machine-card-header` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8014 | `.split-production-record-mode-tabs` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8015 | `.split-production-record-mode-tabs` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8036 | `.split-partial-receipt-box` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8037 | `.split-partial-receipt-box` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8039 | `.split-partial-receipt-box` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8043 | `.split-partial-receipt-box` | `margin-top: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8103 | `.work-order-balance-alert` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8104 | `.work-order-balance-alert` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8105 | `.work-order-balance-alert` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8135 | `.work-order-partial-tools-field` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8139 | `.work-order-partial-tools-empty` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8148 | `.work-order-partial-tools-list` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8154 | `.work-order-partial-tool-row` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8156 | `.work-order-partial-tool-row` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8174 | `.work-order-partial-tool-toggle input` | `height: 18px` | review |  |
| `styles.css` | 8179 | `.work-order-partial-tool-meta` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8194 | `.work-order-partial-tool-qty` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8209 | `.work-order-partial-tools-summary` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8210 | `.work-order-partial-tools-summary` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8217 | `.work-order-partial-tools-metric` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8242 | `.work-order-completion-summary` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8243 | `.work-order-completion-summary` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8249 | `.work-order-completion-summary-row` | `gap: 16px` | review |  |
| `styles.css` | 8251 | `.work-order-completion-summary-row` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8252 | `.work-order-completion-summary-row` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8270 | `.work-order-reverse-impact-list` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8271 | `.work-order-reverse-impact-list` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8275 | `.work-order-reverse-impact-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8276 | `.work-order-reverse-impact-item` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8286 | `.inventory-receipt-badge` | `margin-left: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8287 | `.inventory-receipt-badge` | `padding: 2px 6px` | review |  |
| `styles.css` | 8288 | `.inventory-receipt-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8307 | `.split-summary-grid` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8318 | `.split-summary-grid strong` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8328 | `.split-machine-settings-card .subsection-header` | `margin: 0 0 8px` | review |  |
| `styles.css` | 8329 | `.split-machine-settings-card .subsection-header` | `padding: 0 0 6px` | review |  |
| `styles.css` | 8338 | `.split-machine-card-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8344 | `.split-machine-settings-grid` | `gap: 8px 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8356 | `.split-machine-settings-grid label.inline-label > span` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8363 | `.split-machine-settings-grid textarea` | `min-height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 8364 | `.split-machine-settings-grid textarea` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 8365 | `.split-machine-settings-grid textarea` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8373 | `.split-machine-settings-grid label.full-width textarea` | `min-height: 72px` | review |  |
| `styles.css` | 8427 | `.source-selection-section` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8429 | `.source-selection-section` | `border-radius: 5px` | review |  |
| `styles.css` | 8430 | `.source-selection-section` | `padding: 15px` | review |  |
| `styles.css` | 8437 | `.source-selection-section .tabs` | `margin-bottom: 15px` | review |  |
| `styles.css` | 8441 | `.source-selection-section .tab-btn` | `padding: 10px 20px` | review |  |
| `styles.css` | 8474 | `.search-grid` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8476 | `.search-grid` | `margin-bottom: 15px` | review |  |
| `styles.css` | 8485 | `.search-results` | `margin-top: 15px` | review |  |
| `styles.css` | 8487 | `.search-results` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8510 | `.profile-tabs` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8515 | `.profile-tab` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8524 | `.profile-tab` | `margin-bottom: -2px` | review |  |
| `styles.css` | 8538 | `.profile-tab i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8568 | `.version-info-content` | `padding: 20px 0` | review |  |
| `styles.css` | 8573 | `.system-logo` | `margin-bottom: 15px` | review |  |
| `styles.css` | 8580 | `.system-name` | `margin: 10px 0 5px` | review |  |
| `styles.css` | 8586 | `.system-subtitle` | `margin-bottom: 25px` | review |  |
| `styles.css` | 8591 | `.version-details` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8592 | `.version-details` | `padding: 20px` | review |  |
| `styles.css` | 8593 | `.version-details` | `margin: 20px 0` | review |  |
| `styles.css` | 8601 | `.version-item` | `padding: 8px 0` | review |  |
| `styles.css` | 8623 | `.version-features` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8624 | `.version-features` | `padding: 20px` | review |  |
| `styles.css` | 8625 | `.version-features` | `margin: 20px 0` | review |  |
| `styles.css` | 8630 | `.version-features h5` | `margin: 0 0 15px 0` | review |  |
| `styles.css` | 8642 | `.version-features li` | `padding: 6px 0` | review |  |
| `styles.css` | 8651 | `.version-features li::before` | `margin-right: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8657 | `.version-update-list` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8662 | `.version-update-list .version-update-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8663 | `.version-update-list .version-update-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8678 | `.version-update-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8679 | `.version-update-header` | `margin-bottom: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8696 | `.version-update-summary` | `padding-left: 16px` | review |  |
| `styles.css` | 8701 | `.version-update-summary li` | `padding: 2px 0` | review |  |
| `styles.css` | 8709 | `.version-update-empty` | `padding: 6px 0` | review |  |
| `styles.css` | 8713 | `.version-links` | `margin: 25px 0` | review |  |
| `styles.css` | 8719 | `.version-links .btn` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8720 | `.version-links .btn` | `padding: 10px 24px` | review |  |
| `styles.css` | 8725 | `.version-copyright` | `margin-top: 25px` | review |  |
| `styles.css` | 8726 | `.version-copyright` | `padding-top: 20px` | review |  |
| `styles.css` | 8731 | `.version-copyright p` | `margin: 5px 0` | review |  |
| `styles.css` | 8743 | `.menu-divider` | `margin: 8px 0` | review |  |
| `styles.css` | 8752 | `.message-list-container` | `min-height: 300px` | review |  |
| `styles.css` | 8759 | `.message-list` | `gap: 1px` | review |  |
| `styles.css` | 8767 | `.message-item` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8768 | `.message-item` | `padding: 16px` | review |  |
| `styles.css` | 8792 | `.message-avatar` | `height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 8822 | `.message-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8823 | `.message-header` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8843 | `.notification-meta` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8869 | `.notification-footer` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8875 | `.message-actions` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8889 | `.priority-badge` | `padding: 2px 8px` | review |  |
| `styles.css` | 8890 | `.priority-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8918 | `.expired-badge` | `padding: 2px 6px` | review |  |
| `styles.css` | 8919 | `.expired-badge` | `border-radius: 3px` | review |  |
| `styles.css` | 8945 | `.loading-state` | `padding: 60px 20px` | review |  |
| `styles.css` | 8952 | `.loading-state i` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9002 | `.sidebar-tabs-layout` | `min-height: 500px` | review |  |
| `styles.css` | 9057 | `.sidebar-tab-btn .tab-badge` | `height: 20px` | review |  |
| `styles.css` | 9354 | `.message-detail-content` | `padding: 16px 0` | review |  |
| `styles.css` | 9360 | `.detail-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9361 | `.detail-header` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9367 | `.detail-type` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9376 | `.detail-title` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9382 | `.detail-meta` | `gap: 16px` | review |  |
| `styles.css` | 9385 | `.detail-meta` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9386 | `.detail-meta` | `padding-bottom: 16px` | review |  |
| `styles.css` | 9393 | `.detail-meta span` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9409 | `.message-detail-header` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9410 | `.message-detail-header` | `padding-bottom: 16px` | review |  |
| `styles.css` | 9416 | `.message-detail-row` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9417 | `.message-detail-row` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9432 | `.message-detail-subject` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9433 | `.message-detail-subject` | `padding-bottom: 16px` | review |  |
| `styles.css` | 9448 | `.filter-bar` | `gap: 16px` | review |  |
| `styles.css` | 9449 | `.filter-bar` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9451 | `.filter-bar` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9452 | `.filter-bar` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9458 | `.filter-group` | `gap: 16px` | review |  |
| `styles.css` | 9464 | `.filter-group label` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9470 | `.filter-group select` | `padding: 6px 10px` | review |  |
| `styles.css` | 9472 | `.filter-group select` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9481 | `.checkbox-label input[type="checkbox"]` | `margin-right: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9489 | `.form-hint` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9520 | `.table-header-actions` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9521 | `.table-header-actions` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9540 | `.filter-row` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9546 | `.filter-field` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9557 | `.filter-field select` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9559 | `.filter-field select` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9588 | `.section-title` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9592 | `.section-title` | `margin-bottom: 15px` | review |  |
| `styles.css` | 9593 | `.section-title` | `padding-bottom: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9639 | `.event-popup-card` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9643 | `.event-popup-card` | `margin: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9653 | `.event-popup-close` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9671 | `.event-popup-header` | `padding: 20px 20px 16px` | review |  |
| `styles.css` | 9677 | `.event-popup-type-badge` | `padding: 4px 10px` | review |  |
| `styles.css` | 9678 | `.event-popup-type-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9682 | `.event-popup-type-badge` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9691 | `.event-popup-header h4` | `padding-right: 30px` | review |  |
| `styles.css` | 9695 | `.event-popup-body` | `padding: 20px` | review |  |
| `styles.css` | 9701 | `.event-popup-info` | `gap: 14px` | review |  |
| `styles.css` | 9707 | `.event-popup-row` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9715 | `.event-popup-row i` | `margin-top: 2px` | review |  |
| `styles.css` | 9723 | `.event-popup-time` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9729 | `.event-popup-time-separator` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9741 | `.event-popup-footer` | `padding: 16px 20px` | review |  |
| `styles.css` | 9745 | `.event-popup-footer` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9749 | `.event-popup-footer button` | `padding: 10px 20px` | review |  |
| `styles.css` | 9752 | `.event-popup-footer button` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9780 | `.event-popup-footer button.primary i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9785 | `.event-popup-card` | `margin: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9786 | `.event-popup-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9790 | `.event-popup-header` | `padding: 16px` | review |  |
| `styles.css` | 9794 | `.event-popup-body` | `padding: 16px` | review |  |
| `styles.css` | 9798 | `.event-popup-footer` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9816 | `.dashboard-calendar .fc-toolbar` | `padding: 12px 8px` | review |  |
| `styles.css` | 9819 | `.dashboard-calendar .fc-toolbar` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9830 | `.dashboard-calendar .fc-button-group` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9836 | `.dashboard-calendar .fc-button` | `padding: 8px 16px !important` | review |  |
| `styles.css` | 9864 | `.dashboard-calendar .fc-today-button` | `border-radius: 4px !important` | review |  |
| `styles.css` | 9865 | `.dashboard-calendar .fc-today-button` | `margin-right: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9875 | `.dashboard-calendar .fc-next-button` | `padding: 8px 12px !important` | review |  |
| `styles.css` | 9878 | `.dashboard-calendar .fc-next-button` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9892 | `.dashboard-calendar .fc-next-button` | `margin-left: -1px` | review |  |
| `styles.css` | 9901 | `.dashboard-calendar .fc-col-header-cell` | `padding: 12px 0 !important` | review |  |
| `styles.css` | 9933 | `.dashboard-calendar .fc-daygrid-day-frame` | `min-height: 100px` | review |  |
| `styles.css` | 9938 | `.dashboard-calendar .fc-daygrid-day-number` | `padding: 8px !important` | review |  |
| `styles.css` | 9942 | `.dashboard-calendar .fc-daygrid-day-number` | `height: 28px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9947 | `.dashboard-calendar .fc-daygrid-day-number` | `margin: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9973 | `.dashboard-calendar .fc-event` | `border-radius: 4px !important` | review |  |
| `styles.css` | 9974 | `.dashboard-calendar .fc-event` | `padding: 2px 6px !important` | review |  |
| `styles.css` | 9977 | `.dashboard-calendar .fc-event` | `margin: 1px 4px !important` | review |  |
| `styles.css` | 9983 | `.dashboard-calendar .fc-event.dashboard-node-event` | `border-radius: 999px !important` | review |  |
| `styles.css` | 9984 | `.dashboard-calendar .fc-event.dashboard-node-event` | `padding: 1px 8px !important` | review |  |
| `styles.css` | 9998 | `.dashboard-calendar .fc-event-main` | `padding: 1px 2px` | review |  |
| `styles.css` | 10004 | `.dashboard-calendar .fc-event-time` | `margin-right: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10015 | `.dashboard-calendar .fc-daygrid-event-dot` | `height: 8px` | review |  |
| `styles.css` | 10016 | `.dashboard-calendar .fc-daygrid-event-dot` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10024 | `.dashboard-calendar .fc-more-link` | `padding: 2px 6px` | review |  |
| `styles.css` | 10025 | `.dashboard-calendar .fc-more-link` | `margin: 2px 4px` | review |  |
| `styles.css` | 10036 | `.dashboard-calendar .fc-popover` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10043 | `.dashboard-calendar .fc-popover-header` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10049 | `.dashboard-calendar .fc-popover-body` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10054 | `.dashboard-calendar .fc-timegrid-slot` | `height: 48px !important` | review |  |
| `styles.css` | 10062 | `.dashboard-calendar .fc-timegrid-slot-label` | `padding-top: 4px !important` | review |  |
| `styles.css` | 10087 | `.dashboard-calendar .fc-timegrid-allday .fc-timegrid-col-frame` | `min-height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10093 | `.dashboard-calendar .fc-list` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10099 | `.dashboard-calendar .fc-list-day-cushion` | `padding: 12px 16px !important` | review |  |
| `styles.css` | 10119 | `.dashboard-calendar .fc-list-event-time` | `padding: 12px 16px !important` | review |  |
| `styles.css` | 10123 | `.dashboard-calendar .fc-list-event-graphic` | `padding: 12px 8px !important` | review |  |
| `styles.css` | 10129 | `.dashboard-calendar .fc-list-event-dot` | `height: 10px` | review |  |
| `styles.css` | 10133 | `.dashboard-calendar .fc-list-event-title` | `padding: 12px 16px !important` | review |  |
| `styles.css` | 10139 | `.dashboard-calendar .fc-list-empty` | `padding: 40px` | review |  |
| `styles.css` | 10154 | `.dashboard-calendar .fc-toolbar-title` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10158 | `.dashboard-calendar .fc-toolbar-chunk` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10162 | `.dashboard-calendar .fc-button` | `padding: 6px 10px !important` | review |  |
| `styles.css` | 10167 | `.dashboard-calendar .fc-daygrid-day-frame` | `min-height: 70px` | review |  |
| `styles.css` | 10171 | `.dashboard-calendar-section .dashboard-calendar` | `min-height: 500px` | review |  |
| `styles.css` | 10184 | `.announcement-bar-section` | `height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10185 | `.announcement-bar-section` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10194 | `.announcement-bar-label` | `padding: 0 14px` | review |  |
| `styles.css` | 10197 | `.announcement-bar-label` | `gap: 7px` | review |  |
| `styles.css` | 10214 | `.announcement-bar-track` | `height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10222 | `.ticker-placeholder` | `padding: 0 16px` | review |  |
| `styles.css` | 10230 | `.ticker-item` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10232 | `.ticker-item` | `padding: 0 16px` | review |  |
| `styles.css` | 10264 | `.ticker-type-badge` | `padding: 1px 6px` | review |  |
| `styles.css` | 10265 | `.ticker-type-badge` | `border-radius: 2px` | review |  |
| `styles.css` | 10293 | `.announcement-bar-count` | `padding: 0 12px` | review |  |
| `styles.css` | 10305 | `.announcement-modal-meta` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10306 | `.announcement-modal-meta` | `padding: 8px 0 12px` | review |  |
| `styles.css` | 10308 | `.announcement-modal-meta` | `margin-bottom: 14px` | review |  |
| `styles.css` | 10316 | `.announcement-modal-meta .announcement-type-tag` | `padding: 2px 8px` | review |  |
| `styles.css` | 10317 | `.announcement-modal-meta .announcement-type-tag` | `border-radius: 2px` | review |  |
| `styles.css` | 10331 | `.announcement-modal-content` | `max-height: 50vh` | review |  |
| `styles.css` | 10333 | `.announcement-modal-content` | `padding-right: 4px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10340 | `.dashboard-section` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10347 | `.dashboard-section .section-header` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10351 | `.dashboard-section .section-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10361 | `.dashboard-section .section-header h3` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10371 | `.section-header-actions` | `gap: 16px` | review |  |
| `styles.css` | 10379 | `.stats-cards-row` | `gap: 16px` | review |  |
| `styles.css` | 10380 | `.stats-cards-row` | `padding: 16px` | review |  |
| `styles.css` | 10396 | `.stats-card-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10397 | `.stats-card-header` | `padding: 10px 14px` | review |  |
| `styles.css` | 10423 | `.stats-card-body` | `padding: 14px` | review |  |
| `styles.css` | 10426 | `.stats-card-body` | `gap: 16px` | review |  |
| `styles.css` | 10437 | `.stats-main` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10438 | `.stats-main` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10456 | `.stats-sub` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10482 | `.stats-chart-small` | `height: 80px` | review |  |
| `styles.css` | 10495 | `.charts-row` | `gap: 16px` | review |  |
| `styles.css` | 10496 | `.charts-row` | `padding: 0 16px 16px` | review |  |
| `styles.css` | 10505 | `.chart-card.wide` | `min-height: 220px` | review |  |
| `styles.css` | 10509 | `.chart-card.narrow` | `min-height: 220px` | review |  |
| `styles.css` | 10516 | `.chart-card-header` | `padding: 10px 14px` | review |  |
| `styles.css` | 10526 | `.chart-card-header i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10534 | `.chart-year-badge` | `padding: 2px 8px` | review |  |
| `styles.css` | 10538 | `.chart-card-body` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10539 | `.chart-card-body` | `height: 180px` | review |  |
| `styles.css` | 10551 | `.recent-cards-row` | `gap: 16px` | review |  |
| `styles.css` | 10552 | `.recent-cards-row` | `padding: 16px` | review |  |
| `styles.css` | 10563 | `.recent-card-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10564 | `.recent-card-header` | `padding: 10px 14px` | review |  |
| `styles.css` | 10577 | `.recent-card-body` | `max-height: 250px` | review |  |
| `styles.css` | 10589 | `.recent-list .no-data-message` | `padding: 30px` | review |  |
| `styles.css` | 10603 | `.recent-item` | `padding: 10px 14px` | review |  |
| `styles.css` | 10621 | `.item-header` | `margin-bottom: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10632 | `.item-status` | `padding: 2px 8px` | review |  |
| `styles.css` | 10649 | `.item-body` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10664 | `.calendar-container` | `padding: 16px` | review |  |
| `styles.css` | 10668 | `.dashboard-calendar` | `min-height: 500px` | review |  |
| `styles.css` | 10675 | `.calendar-filter-control` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10686 | `.calendar-filter-select` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10689 | `.calendar-filter-select` | `padding: 0 10px` | review |  |
| `styles.css` | 10699 | `.calendar-legend` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10707 | `.legend-item` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10721 | `.dashboard-node-content` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10758 | `.stats-chart-small` | `height: 100px` | review |  |
| `styles.css` | 10780 | `.logo-section` | `margin-top: 1rem` | review |  |
| `styles.css` | 10787 | `.logo-edit-area` | `gap: 1.5rem` | review |  |
| `styles.css` | 10788 | `.logo-edit-area` | `margin-top: 0.5rem` | review |  |
| `styles.css` | 10798 | `.logo-edit-area .file-input-group` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10812 | `.logo-library` | `gap: 0.5rem` | review |  |
| `styles.css` | 10819 | `.logo-empty-state` | `padding: 0.75rem 1rem` | review |  |
| `styles.css` | 10828 | `.logo-create-hint` | `gap: 0.5rem` | review |  |
| `styles.css` | 10829 | `.logo-create-hint` | `padding: 1rem` | review |  |
| `styles.css` | 10832 | `.logo-create-hint` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10851 | `.logo-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10852 | `.logo-item` | `padding: 0.5rem` | review |  |
| `styles.css` | 10869 | `.logo-preview` | `height: 55px` | review |  |
| `styles.css` | 10874 | `.logo-preview` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10905 | `.logo-actions` | `gap: 0.25rem` | review |  |
| `styles.css` | 10906 | `.logo-actions` | `margin-top: 0.4rem` | review |  |
| `styles.css` | 10910 | `.logo-actions .btn` | `padding: 3px 6px` | review |  |
| `styles.css` | 10921 | `.logo-badge` | `padding: 0.1rem 0.4rem` | review |  |
| `styles.css` | 10922 | `.logo-badge` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10946 | `.logo-lightbox img` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10968 | `.rich-editor-toolbar` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10969 | `.rich-editor-toolbar` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10973 | `.rich-editor-toolbar` | `border-radius: 6px 6px 0 0` | review |  |
| `styles.css` | 10979 | `.rich-editor-toolbar button` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10986 | `.rich-editor-toolbar button` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11002 | `.rich-editor-toolbar select` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 11003 | `.rich-editor-toolbar select` | `padding: 4px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11005 | `.rich-editor-toolbar select` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11013 | `.toolbar-separator` | `height: 24px` | review |  |
| `styles.css` | 11015 | `.toolbar-separator` | `margin: 0 4px` | review |  |
| `styles.css` | 11019 | `.rich-editor-content` | `min-height: 200px` | review |  |
| `styles.css` | 11020 | `.rich-editor-content` | `max-height: 400px` | review |  |
| `styles.css` | 11022 | `.rich-editor-content` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11024 | `.rich-editor-content` | `border-radius: 0 0 6px 6px` | review |  |
| `styles.css` | 11044 | `.rich-editor-content p` | `margin: 0 0 8px 0` | review |  |
| `styles.css` | 11049 | `.rich-editor-content ol` | `margin: 8px 0` | review |  |
| `styles.css` | 11050 | `.rich-editor-content ol` | `padding-left: 24px` | review |  |
| `styles.css` | 11055 | `.rich-editor-content h4` | `margin: 12px 0 8px 0` | review |  |
| `styles.css` | 11062 | `.attachment-preview-list` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11063 | `.attachment-preview-list` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11069 | `.attachment-preview-item` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11070 | `.attachment-preview-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11073 | `.attachment-preview-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11099 | `.attachment-preview-item .remove-attachment` | `height: 24px` | review |  |
| `styles.css` | 11118 | `.message-attachments` | `margin-top: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11119 | `.message-attachments` | `padding-top: 16px` | review |  |
| `styles.css` | 11125 | `.message-attachments > strong` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11136 | `.attachment-list` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11146 | `.attachment-link` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11147 | `.attachment-link` | `padding: 8px 12px` | review |  |
| `styles.css` | 11150 | `.attachment-link` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11177 | `.attachment-image-preview` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11178 | `.attachment-image-preview` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11183 | `.attachment-image-preview .preview-thumb` | `height: 90px` | review |  |
| `styles.css` | 11185 | `.attachment-image-preview .preview-thumb` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11199 | `.attachment-actions` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11200 | `.attachment-actions` | `margin-left: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11205 | `.attachment-actions button` | `height: 28px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 11212 | `.attachment-actions button` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11241 | `.image-lightbox-overlay img` | `max-height: 90vh` | review |  |
| `styles.css` | 11243 | `.image-lightbox-overlay img` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11270 | `.existing-attachment-item` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11271 | `.existing-attachment-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11274 | `.existing-attachment-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11287 | `.existing-attachment-item .existing-badge` | `padding: 1px 6px` | review |  |
| `styles.css` | 11288 | `.existing-attachment-item .existing-badge` | `border-radius: 3px` | review |  |
| `styles.css` | 11294 | `.badge-sm` | `padding: 2px 6px` | review |  |
| `styles.css` | 11297 | `.badge-sm` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11332 | `.message-reply-info` | `margin-top: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11333 | `.message-reply-info` | `padding: 10px 14px` | review |  |
| `styles.css` | 11335 | `.message-reply-info` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11341 | `.message-reply-info i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11349 | `.info-box` | `padding: 1rem` | review |  |
| `styles.css` | 11352 | `.info-box` | `margin-bottom: 1rem` | review |  |
| `styles.css` | 11374 | `.settings-section .section-desc` | `margin: -8px 0 16px` | review |  |
| `styles.css` | 11402 | `.toggle-control` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11409 | `.toggle-control input[type="checkbox"]` | `height: 1px` | review |  |
| `styles.css` | 11419 | `.toggle-switch` | `height: 24px` | review |  |
| `styles.css` | 11421 | `.toggle-switch` | `border-radius: 24px` | review |  |
| `styles.css` | 11432 | `.toggle-switch::after` | `height: 18px` | review |  |
| `styles.css` | 11455 | `.settings-note-list` | `margin: 4px 0 0` | review |  |
| `styles.css` | 11456 | `.settings-note-list` | `padding-left: 20px` | review |  |
| `styles.css` | 11463 | `.settings-note-list li + li` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11468 | `.system-update-upload-grid` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11474 | `.system-update-maintenance-row` | `gap: 10px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11476 | `.system-update-maintenance-row` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11477 | `.system-update-maintenance-row` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11479 | `.system-update-maintenance-row` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11486 | `.system-update-maintenance-status` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11493 | `.system-update-actions` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11494 | `.system-update-actions` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11499 | `.system-update-status` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11500 | `.system-update-status` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11501 | `.system-update-status` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11525 | `.system-rollback-panel` | `margin: 0 0 12px` | review |  |
| `styles.css` | 11526 | `.system-rollback-panel` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11528 | `.system-rollback-panel` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11533 | `.system-rollback-panel h5` | `margin: 0 0 8px` | review |  |
| `styles.css` | 11541 | `.system-rollback-controls` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11554 | `.system-update-meta` | `gap: 8px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11555 | `.system-update-meta` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11556 | `.system-update-meta` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11558 | `.system-update-meta` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11566 | `.system-update-meta-item` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11580 | `.system-update-change-list h5` | `margin: 0 0 8px` | review |  |
| `styles.css` | 11587 | `.system-update-change-list ul` | `padding-left: 18px` | review |  |
| `styles.css` | 11591 | `.system-update-change-list li` | `margin: 4px 0` | review |  |
| `styles.css` | 11644 | `.production-schedule-tab-panel` | `min-height: 520px` | review |  |
| `styles.css` | 11688 | `.production-schedule-column` | `min-height: 440px` | review |  |
| `styles.css` | 11755 | `.schedule-run-label` | `margin-top: 2px` | review |  |
| `styles.css` | 11777 | `.work-order-type-badge` | `padding: 3px 8px` | review |  |
| `styles.css` | 11779 | `.work-order-type-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11811 | `.work-order-second-screening-empty` | `gap: 0.75rem` | review |  |
| `styles.css` | 11817 | `.work-order-second-screening-cards` | `gap: 0.75rem` | review |  |
| `styles.css` | 11823 | `.work-order-second-screening-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11825 | `.work-order-second-screening-card` | `gap: 0.4rem` | review |  |
| `styles.css` | 11826 | `.work-order-second-screening-card` | `padding: 0.75rem` | review |  |
| `styles.css` | 11832 | `.work-order-inline-rescreen-card` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11834 | `.work-order-inline-rescreen-card` | `gap: 0.85rem` | review |  |
| `styles.css` | 11835 | `.work-order-inline-rescreen-card` | `padding: 1rem` | review |  |
| `styles.css` | 11842 | `.work-order-inline-rescreen-actions` | `gap: 0.75rem` | review |  |
| `styles.css` | 11847 | `.work-order-inline-rescreen-header p` | `margin: 0.2rem 0 0` | review |  |
| `styles.css` | 11853 | `.work-order-inline-rescreen-actions` | `padding-top: 0.75rem` | review |  |
| `styles.css` | 11858 | `.work-order-second-screening-detail-block` | `margin-top: 0.1rem` | review |  |
| `styles.css` | 11859 | `.work-order-second-screening-detail-block` | `padding-top: 0.45rem` | review |  |
| `styles.css` | 11865 | `.work-order-second-screening-inline-list` | `gap: 0.35rem 0.75rem` | review |  |
| `styles.css` | 11872 | `.work-order-second-screening-detail-list` | `gap: 0.35rem` | review |  |
| `styles.css` | 11874 | `.work-order-second-screening-detail-list` | `margin: 0.45rem 0 0` | review |  |
| `styles.css` | 11882 | `.work-order-second-screening-detail-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11884 | `.work-order-second-screening-detail-item` | `gap: 0.15rem` | review |  |
| `styles.css` | 11885 | `.work-order-second-screening-detail-item` | `padding: 0.45rem 0.55rem` | review |  |
| `styles.css` | 11901 | `.rescreen-image-upload-panel` | `gap: 0.75rem` | review |  |
| `styles.css` | 11906 | `.rescreen-image-grid` | `gap: 0.75rem` | review |  |
| `styles.css` | 11913 | `.rescreen-image-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11915 | `.rescreen-image-card` | `gap: 0.5rem` | review |  |
| `styles.css` | 11916 | `.rescreen-image-card` | `padding: 0.65rem` | review |  |
| `styles.css` | 11921 | `.rescreen-image-card img` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11922 | `.rescreen-image-card img` | `height: 120px` | review |  |
| `styles.css` | 11942 | `.form-section-heading` | `gap: 0.75rem` | review |  |
| `styles.css` | 11964 | `.schedule-status-chip` | `padding: 3px 8px` | review |  |
| `styles.css` | 11966 | `.schedule-status-chip` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11974 | `.production-time-content` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11978 | `.production-status-content` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11991 | `.machine-status-detail-wrap` | `padding: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 12007 | `.machine-status-detail-empty` | `padding: 12px 10px` | review |  |
| `styles.css` | 12017 | `.schedule-empty` | `padding: 18px 10px` | review |  |
| `styles.css` | 12025 | `.schedule-live-time-row` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 12026 | `.schedule-live-time-row` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |

