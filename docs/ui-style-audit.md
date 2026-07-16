# UI Style Audit

Generated: 2026-07-16T06:46:34.016Z

Scanned files: `styles.css`

## Summary

| Item | Count |
|------|------:|
| Total hardcoded spacing/radius findings | 786 |
| Token candidates | 408 |
| Needs review | 378 |
| Covered by ui-token-exception | 0 |

## Top Properties

| Property | Count |
|----------|------:|
| `padding` | 186 |
| `gap` | 159 |
| `border-radius` | 109 |
| `margin-bottom` | 70 |
| `height` | 54 |
| `min-height` | 49 |
| `margin-top` | 40 |
| `margin` | 38 |
| `max-height` | 19 |
| `margin-right` | 14 |
| `padding-right` | 10 |
| `padding-top` | 10 |
| `padding-bottom` | 9 |
| `padding-left` | 8 |
| `margin-left` | 7 |
| `column-gap` | 2 |
| `border-top-left-radius` | 1 |
| `border-top-right-radius` | 1 |

## Top Values

| Value | Count |
|-------|------:|
| `gap: 8px` | 39 |
| `border-radius: 6px` | 32 |
| `border-radius: 4px` | 28 |
| `gap: 12px` | 24 |
| `gap: 10px` | 21 |
| `margin-bottom: 12px` | 19 |
| `border-radius: 8px` | 17 |
| `gap: 6px` | 15 |
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
| `height: 32px` | 6 |
| `margin-bottom: 10px` | 6 |
| `margin-right: 6px` | 6 |
| `margin-top: 4px` | 6 |
| `padding: 20px` | 6 |
| `padding: 6px` | 6 |
| `height: 18px` | 5 |
| `height: 36px` | 5 |

## Findings

| File | Line | Selector | Declaration | Classification | Suggested token |
|------|-----:|----------|-------------|----------------|-----------------|
| `styles.css` | 152 | `@page` | `margin: 12mm` | review |  |
| `styles.css` | 187 | `.app-container` | `height: 100vh` | review |  |
| `styles.css` | 429 | `.dropdown-divider` | `height: 1px` | review |  |
| `styles.css` | 451 | `.weekday-badge` | `padding: 4px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 464 | `.weekday-text` | `margin-left: 5px` | review |  |
| `styles.css` | 492 | `.record-link-button:focus-visible` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 498 | `.status-badge` | `padding: 4px 12px` | review |  |
| `styles.css` | 499 | `.status-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 629 | `.source-tag` | `padding: 2px 8px` | review |  |
| `styles.css` | 630 | `.source-tag` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 669 | `.subtext` | `margin-top: 2px` | review |  |
| `styles.css` | 691 | `.text-warning i` | `margin-right: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 791 | `.menu-item` | `margin-bottom: 2px` | review |  |
| `styles.css` | 825 | `.menu-item.active > .menu-link` | `padding-left: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 844 | `.menu-item.active .submenu` | `max-height: 500px` | review |  |
| `styles.css` | 973 | `.tab-header` | `padding: 10px 15px` | review |  |
| `styles.css` | 977 | `.tab-header` | `margin-bottom: -1px` | review |  |
| `styles.css` | 979 | `.tab-header` | `border-top-left-radius: 5px` | review |  |
| `styles.css` | 980 | `.tab-header` | `border-top-right-radius: 5px` | review |  |
| `styles.css` | 983 | `.tab-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1001 | `.tab-header .close-tab` | `margin-left: 5px` | review |  |
| `styles.css` | 1014 | `.tab-content-area` | `padding: 20px` | review |  |
| `styles.css` | 1029 | `.example-table-container` | `margin-top: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1073 | `.icon-btn` | `margin: 0 2px` | review |  |
| `styles.css` | 1074 | `.icon-btn` | `padding: 5px` | review |  |
| `styles.css` | 1075 | `.icon-btn` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1116 | `.data-table input[type="checkbox"]` | `height: 16px` | review |  |
| `styles.css` | 1213 | `body.login-page` | `min-height: 100vh` | review |  |
| `styles.css` | 1223 | `.login-wrapper` | `padding: 32px 16px` | review |  |
| `styles.css` | 1230 | `.login-card` | `padding: 48px` | review |  |
| `styles.css` | 1233 | `.login-card` | `gap: 32px` | review |  |
| `styles.css` | 1241 | `.login-brand` | `padding-right: 32px` | review |  |
| `styles.css` | 1247 | `.login-brand h1` | `margin-top: 18px` | review |  |
| `styles.css` | 1253 | `.brand-logo img.company-logo-img` | `height: 68px` | review |  |
| `styles.css` | 1260 | `.login-brand p` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1266 | `.login-brand .system-subtitle` | `margin-top: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1273 | `.login-brand .login-hint` | `margin-top: 14px` | review |  |
| `styles.css` | 1278 | `.brand-logo` | `height: 76px` | review |  |
| `styles.css` | 1296 | `.login-card form` | `gap: 18px` | review |  |
| `styles.css` | 1302 | `.form-group label` | `margin-bottom: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1308 | `.form-group .form-control` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1333 | `.toggle-password` | `padding: 4px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1345 | `.remember-me` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1350 | `.login-button` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1355 | `.login-button` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1373 | `.login-success` | `margin-top: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1374 | `.login-success` | `padding: 12px 14px` | review |  |
| `styles.css` | 1392 | `.login-hint` | `padding: 24px` | review |  |
| `styles.css` | 1398 | `.login-hint h2` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1410 | `.sample-accounts td` | `padding: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1422 | `.sample-accounts code` | `padding: 2px 5px` | review |  |
| `styles.css` | 1431 | `.login-footer` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1436 | `.login-card` | `padding: 32px` | review |  |
| `styles.css` | 1443 | `.login-brand` | `padding-bottom: 24px` | review |  |
| `styles.css` | 1457 | `.content-header.with-actions` | `gap: 16px` | review |  |
| `styles.css` | 1475 | `.content-header.with-actions.sticky` | `padding: 16px 20px` | review |  |
| `styles.css` | 1476 | `.content-header.with-actions.sticky` | `margin: -20px -20px 20px -20px` | review |  |
| `styles.css` | 1484 | `.content-header.with-actions .subtitle` | `margin: 4px 0 0` | review |  |
| `styles.css` | 1492 | `.header-actions` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1499 | `.btn` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1500 | `.btn` | `padding: 6px 14px` | review |  |
| `styles.css` | 1501 | `.btn` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1540 | `.btn.text` | `padding: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1544 | `.btn.text` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1550 | `.btn.text` | `height: 30px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 1771 | `.btn .selection-count` | `padding: 2px 6px` | review |  |
| `styles.css` | 1772 | `.btn .selection-count` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1773 | `.btn .selection-count` | `margin-left: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1789 | `.btn-dropdown-wrapper .dropdown-menu` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1797 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1798 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item` | `padding: 10px 14px` | review |  |
| `styles.css` | 1814 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item:first-child` | `border-radius: 6px 6px 0 0` | review |  |
| `styles.css` | 1818 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item:last-child` | `border-radius: 0 0 6px 6px` | review |  |
| `styles.css` | 1853 | `.btn.btn-print-new` | `padding: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1857 | `.btn.btn-print-new` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1863 | `.btn.btn-print-new` | `height: 30px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 1876 | `.btn.btn-print-done` | `padding: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1880 | `.btn.btn-print-done` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1886 | `.btn.btn-print-done` | `height: 30px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 1910 | `.summary-cards` | `gap: 1rem` | review |  |
| `styles.css` | 1912 | `.summary-cards` | `margin-bottom: 1rem` | review |  |
| `styles.css` | 1918 | `.summary-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1919 | `.summary-card` | `padding: 1rem 1.25rem` | review |  |
| `styles.css` | 1922 | `.summary-card` | `gap: 1rem` | review |  |
| `styles.css` | 1943 | `.summary-card .summary-label` | `margin-bottom: 0.25rem` | review |  |
| `styles.css` | 1969 | `.filter-summary-bar` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1976 | `.filter-summary-content` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1984 | `.filter-chip` | `padding: 4px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1988 | `.filter-chip` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 2001 | `.filter-count` | `height: 18px` | review |  |
| `styles.css` | 2036 | `.filter-drawer` | `height: 100vh` | review |  |
| `styles.css` | 2180 | `.filter-form .form-grid label:not(.filter-checkbox) > select` | `min-height: 38px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 2261 | `.checkbox-label` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 2432 | `.form-grid label.inline-label input[type="checkbox"]` | `height: 16px` | review |  |
| `styles.css` | 2707 | `.modal-alert::before` | `margin-top: 1px` | review |  |
| `styles.css` | 2766 | `.form-panel` | `margin-top: 25px` | review |  |
| `styles.css` | 2767 | `.form-panel` | `padding: 20px` | review |  |
| `styles.css` | 2769 | `.form-panel` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 2775 | `.form-panel h3` | `margin-bottom: 15px` | review |  |
| `styles.css` | 2781 | `.form-panel small` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 2788 | `.table-actions` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 2804 | `:is(td.table-actions, td.actions, td.actions-cell, td.actions-col) .op-action-btn` | `height: 30px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 2805 | `:is(td.table-actions, td.actions, td.actions-cell, td.actions-col) .op-action-btn` | `padding: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 2806 | `:is(td.table-actions, td.actions, td.actions-cell, td.actions-col) .op-action-btn` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3036 | `.btn-icon` | `padding: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3037 | `.btn-icon` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3043 | `.btn-icon` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3080 | `.link` | `padding: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3081 | `.link` | `margin-right: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3082 | `.link` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3088 | `.link` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3136 | `.modal-overlay` | `padding: 20px` | review |  |
| `styles.css` | 3145 | `.modal-window` | `max-height: 80vh` | review |  |
| `styles.css` | 3194 | `.column-selector` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3199 | `.column-selector` | `max-height: 80vh` | review |  |
| `styles.css` | 3207 | `.column-selector-header` | `padding: 15px` | review |  |
| `styles.css` | 3213 | `.column-selector-header` | `border-radius: 8px 8px 0 0` | review |  |
| `styles.css` | 3229 | `.column-selector-header .close-btn` | `height: 28px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3233 | `.column-selector-header .close-btn` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3245 | `.column-selector-body` | `padding: 15px` | review |  |
| `styles.css` | 3251 | `.column-selector-body .column-option` | `padding: 8px 0` | review |  |
| `styles.css` | 3261 | `.column-selector-body .column-option input[type="checkbox"]` | `margin-right: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3263 | `.column-selector-body .column-option input[type="checkbox"]` | `height: 18px` | review |  |
| `styles.css` | 3273 | `.column-selector-footer` | `padding: 12px 15px` | review |  |
| `styles.css` | 3276 | `.column-selector-footer` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3279 | `.column-selector-footer` | `border-radius: 0 0 8px 8px` | review |  |
| `styles.css` | 3376 | `.role-permission-transfer-section label.inline-label` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3385 | `.role-permission-transfer-section label.inline-label span` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3390 | `.role-permission-transfer-section label.inline-label select` | `min-height: 260px` | review |  |
| `styles.css` | 3391 | `.role-permission-transfer-section label.inline-label select` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3404 | `.role-permission-transfer-controls-box` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3405 | `.role-permission-transfer-controls-box` | `min-height: 260px` | review |  |
| `styles.css` | 3410 | `.role-permission-transfer-controls-box .btn` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3430 | `.form-address` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3436 | `.form-address label` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3478 | `.screening-create-panel` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3487 | `.screening-create-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3498 | `.screening-create-header` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3510 | `.screening-create-body` | `padding: 16px` | review |  |
| `styles.css` | 3520 | `.screening-create-footer` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3522 | `.screening-create-footer` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3530 | `.screening-create-footer .btn.small` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3536 | `.checkbox-field` | `gap: 5px` | review |  |
| `styles.css` | 3546 | `.checkbox-field input[type="checkbox"]` | `height: 18px` | review |  |
| `styles.css` | 3553 | `.file-input-group` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3563 | `.file-input-group label.file-upload-btn` | `padding: 6px 12px` | review |  |
| `styles.css` | 3586 | `.file-input-group label.file-upload-btn i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3592 | `.file-input-group .file-hint` | `margin-left: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3598 | `.invoice-stamp-preview` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3600 | `.invoice-stamp-preview` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3601 | `.invoice-stamp-preview` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3607 | `.invoice-stamp-preview img` | `max-height: 200px` | review |  |
| `styles.css` | 3609 | `.invoice-stamp-preview img` | `margin: 0 auto 8px` | review |  |
| `styles.css` | 3611 | `.invoice-stamp-preview img` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3617 | `.invoice-stamp-preview .preview-actions` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3622 | `.invoice-stamp-preview .icon-button` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3623 | `.invoice-stamp-preview .icon-button` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3632 | `.attachment-preview` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3634 | `.attachment-preview` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3635 | `.attachment-preview` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3645 | `.attachment-preview .preview-info` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3657 | `.attachment-preview .preview-actions` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3662 | `.attachment-preview .icon-button` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3663 | `.attachment-preview .icon-button` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3671 | `.field-hint` | `margin-top: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3687 | `.modal-window form .form-grid label small` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3698 | `.modal-window.number-sequences-modal .form-grid` | `gap: 14px` | review |  |
| `styles.css` | 3725 | `.modal-window.number-sequences-modal label.inline-label > small` | `margin-top: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3810 | `.modal-window.customers-modal form[data-customers-form]` | `gap: 14px 12px` | review |  |
| `styles.css` | 3839 | `.modal-window.customers-modal .form-row > .form-section > .customer-modal-grid` | `gap: 8px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3910 | `.modal-window.customers-modal .customer-stamp-field` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3911 | `.modal-window.customers-modal .customer-stamp-field` | `min-height: 72px` | review |  |
| `styles.css` | 3920 | `.modal-window.customers-modal .customer-stamp-field > span` | `padding: 4px 10px` | review |  |
| `styles.css` | 3933 | `.modal-window.customers-modal .customer-stamp-control` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3939 | `.modal-window.customers-modal .customer-stamp-control .field-hint` | `margin: 6px 0 0` | review |  |
| `styles.css` | 3947 | `.modal-window.customers-modal .customer-stamp-control .file-input-group` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3993 | `.modal-window.suppliers-modal form[data-suppliers-form]` | `gap: 14px 12px` | review |  |
| `styles.css` | 4022 | `.modal-window.suppliers-modal .form-row > .form-section > .supplier-modal-grid` | `gap: 8px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4052 | `.modal-window.suppliers-modal .supplier-attachment-field` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4053 | `.modal-window.suppliers-modal .supplier-attachment-field` | `min-height: 72px` | review |  |
| `styles.css` | 4062 | `.modal-window.suppliers-modal .supplier-attachment-field > span` | `padding: 4px 10px` | review |  |
| `styles.css` | 4075 | `.modal-window.suppliers-modal .supplier-attachment-control` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4081 | `.modal-window.suppliers-modal .supplier-attachment-control .field-hint` | `margin: 6px 0 0` | review |  |
| `styles.css` | 4089 | `.modal-window.suppliers-modal .supplier-attachment-control .file-input-group` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4154 | `.detail-content` | `padding: 10px 0` | review |  |
| `styles.css` | 4160 | `.detail-content dl` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4161 | `.detail-content dl` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4162 | `.detail-content dl` | `padding: 15px` | review |  |
| `styles.css` | 4164 | `.detail-content dl` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4170 | `.detail-content dl > div` | `gap: 15px` | review |  |
| `styles.css` | 4172 | `.detail-content dl > div` | `padding: 8px 0` | review |  |
| `styles.css` | 4194 | `.detail-content dl.inventory-detail-list` | `column-gap: 20px` | review |  |
| `styles.css` | 4286 | `.subsection` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4287 | `.subsection` | `padding: 16px` | review |  |
| `styles.css` | 4289 | `.subsection` | `margin-bottom: 15px` | review |  |
| `styles.css` | 4292 | `.subsection` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4299 | `.subsection-header` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4300 | `.subsection-header` | `padding-bottom: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4329 | `.image-gallery` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4330 | `.image-gallery` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4331 | `.image-gallery` | `min-height: 100px` | review |  |
| `styles.css` | 4340 | `.image-gallery .empty-state` | `padding: 40px 20px` | review |  |
| `styles.css` | 4346 | `.image-gallery .empty-state i` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4353 | `.image-gallery .image-item` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4371 | `.image-gallery .image-item .btn-delete` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4373 | `.image-gallery .image-item .btn-delete` | `height: 28px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 4390 | `.order-items-modal` | `max-height: 85vh` | review |  |
| `styles.css` | 4418 | `.order-items-modal .order-items-modal-body::-webkit-scrollbar-track` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4423 | `.order-items-modal .order-items-modal-body::-webkit-scrollbar-thumb` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4479 | `.metrics-comparison-container` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4480 | `.metrics-comparison-container` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4495 | `.metrics-comparison-container .metrics-subtitle` | `margin: 0 0 8px 0` | review |  |
| `styles.css` | 4496 | `.metrics-comparison-container .metrics-subtitle` | `padding-bottom: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4511 | `.metrics-comparison-container .metric` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4512 | `.metrics-comparison-container .metric` | `padding: 5px 0` | review |  |
| `styles.css` | 4564 | `.table-secondary` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4572 | `.stacked-inputs` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4590 | `.order-items-services-table th:nth-child(3)` | `padding-left: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4591 | `.order-items-services-table th:nth-child(3)` | `padding-right: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4597 | `.order-items-services-table td:nth-child(6)` | `padding-left: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4598 | `.order-items-services-table td:nth-child(6)` | `padding-right: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4612 | `.modal-window.work-orders-modal` | `max-height: 90vh` | review |  |
| `styles.css` | 4616 | `.work-orders-modal h3[data-modal-title]` | `margin-bottom: 15px` | review |  |
| `styles.css` | 4618 | `.work-orders-modal h3[data-modal-title]` | `padding-right: 40px` | review |  |
| `styles.css` | 4622 | `.work-orders-modal .modal-alert` | `margin-bottom: 15px` | review |  |
| `styles.css` | 4640 | `.work-orders-modal-body` | `padding-right: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4649 | `.work-orders-modal-body::-webkit-scrollbar-track` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4654 | `.work-orders-modal-body::-webkit-scrollbar-thumb` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4662 | `.work-orders-modal-footer` | `padding-top: 15px` | review |  |
| `styles.css` | 4681 | `.rescreen-batches-modal` | `max-height: 88vh` | review |  |
| `styles.css` | 4683 | `.rescreen-batches-modal` | `padding: 20px 20px 16px` | review |  |
| `styles.css` | 4688 | `.rescreen-batches-modal h3` | `margin-bottom: 14px` | review |  |
| `styles.css` | 4693 | `.rescreen-batches-modal > .modal-alert` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4700 | `.rescreen-batches-modal form` | `gap: 14px` | review |  |
| `styles.css` | 4716 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-header` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4718 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-header` | `margin: 0 0 8px` | review |  |
| `styles.css` | 4719 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-header` | `padding: 0 0 6px` | review |  |
| `styles.css` | 4723 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-body` | `padding-left: 2px` | review |  |
| `styles.css` | 4724 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-body` | `padding-right: 2px` | review |  |
| `styles.css` | 4738 | `[data-rescreen-batches-modal] .rescreen-section-title` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4783 | `.rescreen-section-helper` | `margin: 0 0 12px` | review |  |
| `styles.css` | 4787 | `.rescreen-source-summary-grid` | `min-height: 128px` | review |  |
| `styles.css` | 4793 | `.rescreen-source-card` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4796 | `.rescreen-source-card` | `gap: 14px` | review |  |
| `styles.css` | 4797 | `.rescreen-source-card` | `padding: 16px 18px` | review |  |
| `styles.css` | 4811 | `.rescreen-source-card-header` | `gap: 0.75rem` | review |  |
| `styles.css` | 4817 | `.rescreen-source-card-title-group` | `gap: 0.2rem` | review |  |
| `styles.css` | 4838 | `.rescreen-source-card-title-group p` | `margin: 0.15rem 0 0` | review |  |
| `styles.css` | 4844 | `.rescreen-source-card-badge` | `border-radius: 999px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4849 | `.rescreen-source-card-badge` | `padding: 0.35rem 0.8rem` | review |  |
| `styles.css` | 4860 | `.rescreen-source-card-body` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4867 | `.rescreen-source-fact` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4869 | `.rescreen-source-fact` | `gap: 0.35rem` | review |  |
| `styles.css` | 4870 | `.rescreen-source-fact` | `padding: 0.8rem 0.9rem` | review |  |
| `styles.css` | 4898 | `.rescreen-source-state` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4900 | `.rescreen-source-state` | `gap: 0.35rem` | review |  |
| `styles.css` | 4901 | `.rescreen-source-state` | `padding: 16px 18px` | review |  |
| `styles.css` | 4935 | `.rescreen-batches-modal-body` | `padding-right: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4944 | `.rescreen-batches-modal-body::-webkit-scrollbar-track` | `border-radius: 999px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4949 | `.rescreen-batches-modal-body::-webkit-scrollbar-thumb` | `border-radius: 999px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4961 | `.rescreen-batches-modal-footer` | `padding-top: 14px` | review |  |
| `styles.css` | 4971 | `[data-rescreen-batches-detail-modal] .modal-window.xlarge` | `max-height: 88vh` | review |  |
| `styles.css` | 4979 | `[data-rescreen-batches-detail-modal] .detail-content` | `padding: 4px 0 0` | review |  |
| `styles.css` | 4985 | `[data-rescreen-batches-detail-modal] .form-actions` | `margin-top: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4986 | `[data-rescreen-batches-detail-modal] .form-actions` | `padding-top: 14px` | review |  |
| `styles.css` | 4992 | `[data-rescreen-batches-detail-modal] .detail-content .detail-section p` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4998 | `[data-rescreen-batches-detail-modal] .detail-content .detail-grid` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5005 | `[data-rescreen-batches-detail-modal] .detail-content .detail-item` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 5008 | `[data-rescreen-batches-detail-modal] .detail-content .detail-item` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5009 | `[data-rescreen-batches-detail-modal] .detail-content .detail-item` | `padding: 12px 14px` | review |  |
| `styles.css` | 5052 | `.rescreen-batches-modal` | `padding: 16px 16px 14px` | review |  |
| `styles.css` | 5075 | `.work-orders-section-layout` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5077 | `.work-orders-section-layout` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5116 | `.work-order-schedule-section .weekday-badge` | `padding: 4px 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5135 | `.work-orders-section-right .table-responsive` | `min-height: 280px` | review |  |
| `styles.css` | 5144 | `.work-order-type-top-section` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5153 | `.work-order-source-mode-hint` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5154 | `.work-order-source-mode-hint` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5156 | `.work-order-source-mode-hint` | `border-radius: 5px` | review |  |
| `styles.css` | 5168 | `.work-order-collapsible-section details` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5176 | `.work-order-collapsible-section summary` | `padding-bottom: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5177 | `.work-order-collapsible-section summary` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5189 | `.work-order-collapsible-section summary::before` | `margin-right: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5273 | `.work-orders-section-right .table-responsive` | `min-height: 220px` | review |  |
| `styles.css` | 5294 | `.work-order-live-time-row` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5295 | `.work-order-live-time-row` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 5297 | `.work-order-live-time-row` | `padding: 10px 14px` | review |  |
| `styles.css` | 5418 | `.work-order-edit-first-piece-card` | `min-height: 200px` | review |  |
| `styles.css` | 5423 | `.work-order-edit-first-piece-card .subsection-body` | `min-height: 140px` | review |  |
| `styles.css` | 5444 | `.work-order-edit-images-card .table-responsive` | `min-height: 120px` | review |  |
| `styles.css` | 5468 | `.work-order-production-mode-tabs` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5469 | `.work-order-production-mode-tabs` | `padding: 0 2px` | review |  |
| `styles.css` | 5477 | `.work-order-production-mode-tabs .tab-btn` | `border-radius: 4px 4px 0 0` | review |  |
| `styles.css` | 5478 | `.work-order-production-mode-tabs .tab-btn` | `padding: 6px 14px` | review |  |
| `styles.css` | 5488 | `.work-order-screening-tabs-section` | `padding: 10px 14px` | review |  |
| `styles.css` | 5518 | `.work-order-production-mode-panel` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5527 | `.work-order-execution-image-tabs` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5541 | `.work-order-image-sections-grid` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5564 | `.work-order-production-mode-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5605 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `height: min(850px, 94vh)` | review |  |
| `styles.css` | 5607 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `max-height: 94vh` | review |  |
| `styles.css` | 5632 | `[data-work-orders-edit-modal] form` | `padding-top: 42px` | review |  |
| `styles.css` | 5816 | `[data-work-orders-edit-modal] .work-order-edit-drawing-card` | `min-height: 82px` | review |  |
| `styles.css` | 5931 | `[data-work-orders-edit-modal] .work-order-edit-service-section` | `min-height: 170px` | review |  |
| `styles.css` | 5939 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card` | `min-height: 170px` | review |  |
| `styles.css` | 5951 | `[data-work-orders-edit-modal] .work-order-edit-service-section .table-responsive` | `min-height: 126px` | review |  |
| `styles.css` | 5952 | `[data-work-orders-edit-modal] .work-order-edit-service-section .table-responsive` | `max-height: 126px` | review |  |
| `styles.css` | 6001 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card .subsection-actions .btn` | `min-height: 25px` | review |  |
| `styles.css` | 6007 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card .subsection-body` | `min-height: 122px` | review |  |
| `styles.css` | 6035 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card textarea` | `height: 24px` | review |  |
| `styles.css` | 6036 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card textarea` | `min-height: 24px` | review |  |
| `styles.css` | 6049 | `[data-work-orders-edit-modal] .work-order-edit-production-records` | `min-height: 230px` | review |  |
| `styles.css` | 6067 | `[data-work-orders-edit-modal] .work-order-production-mode-tabs` | `min-height: 30px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 6079 | `[data-work-orders-edit-modal] .work-order-production-mode-header` | `min-height: 25px` | review |  |
| `styles.css` | 6087 | `[data-work-orders-edit-modal] .work-order-production-mode-header .btn` | `min-height: 25px` | review |  |
| `styles.css` | 6103 | `[data-work-orders-edit-modal] .production-records-table select` | `height: 25px` | review |  |
| `styles.css` | 6104 | `[data-work-orders-edit-modal] .production-records-table select` | `min-height: 25px` | review |  |
| `styles.css` | 6167 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `height: 92vh` | review |  |
| `styles.css` | 6168 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `max-height: 92vh` | review |  |
| `styles.css` | 6370 | `.work-order-mobile-quick-entry-card` | `margin-top: 14px` | review |  |
| `styles.css` | 6371 | `.work-order-mobile-quick-entry-card` | `padding-top: 2px` | review |  |
| `styles.css` | 6376 | `.work-order-mobile-quick-entry-body` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6380 | `.work-order-mobile-quick-entry-qr` | `min-height: 232px` | review |  |
| `styles.css` | 6382 | `.work-order-mobile-quick-entry-qr` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 6387 | `.work-order-mobile-quick-entry-qr` | `padding: 14px` | review |  |
| `styles.css` | 6415 | `.work-order-mobile-quick-entry-actions` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6454 | `[data-work-orders-edit-modal] .work-order-edit-drawing-card` | `min-height: 86px` | review |  |
| `styles.css` | 6620 | `.searchable-select-native` | `height: 1px !important` | review |  |
| `styles.css` | 6664 | `.searchable-select-list` | `max-height: 220px` | review |  |
| `styles.css` | 6724 | `[data-machine-picker-modal] .machine-picker-layout` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6731 | `[data-machine-picker-modal] .machine-picker-groups` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6732 | `[data-machine-picker-modal] .machine-picker-groups` | `max-height: min(52vh, 420px)` | review |  |
| `styles.css` | 6734 | `[data-machine-picker-modal] .machine-picker-groups` | `padding-right: 4px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 6739 | `[data-machine-picker-modal] .machine-picker-group-btn` | `min-height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 6740 | `[data-machine-picker-modal] .machine-picker-group-btn` | `padding: 7px 10px` | review |  |
| `styles.css` | 6768 | `[data-machine-picker-modal] .machine-picker-panel-header` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6769 | `[data-machine-picker-modal] .machine-picker-panel-header` | `margin-top: 2px` | review |  |
| `styles.css` | 6770 | `[data-machine-picker-modal] .machine-picker-panel-header` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 6787 | `[data-machine-picker-modal] .machine-picker-grid` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6788 | `[data-machine-picker-modal] .machine-picker-grid` | `max-height: min(46vh, 360px)` | review |  |
| `styles.css` | 6796 | `[data-machine-picker-modal] .machine-picker-option` | `column-gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6798 | `[data-machine-picker-modal] .machine-picker-option` | `min-height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 6799 | `[data-machine-picker-modal] .machine-picker-option` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 6801 | `[data-machine-picker-modal] .machine-picker-option` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 6888 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card` | `min-height: 175px` | review |  |
| `styles.css` | 6901 | `[data-work-orders-edit-modal] .work-order-edit-production-records` | `min-height: 260px` | review |  |
| `styles.css` | 7008 | `[data-work-orders-edit-modal] .work-order-edit-summary-value > span` | `height: 1px` | review |  |
| `styles.css` | 7354 | `[data-work-orders-edit-modal] .work-order-tool-analysis-empty` | `margin-bottom: 0.75rem` | review |  |
| `styles.css` | 7423 | `[data-work-orders-edit-modal] .work-order-edit-service-section .table-responsive` | `max-height: 210px` | review |  |
| `styles.css` | 7561 | `[data-work-orders-edit-modal] .split-work-order-header h4` | `margin: 0 0 4px` | review |  |
| `styles.css` | 7580 | `[data-work-orders-edit-modal] .split-machine-tab` | `min-height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 7673 | `[data-work-orders-edit-modal] .split-machine-settings-card` | `min-height: 175px` | review |  |
| `styles.css` | 7715 | `[data-work-orders-edit-modal] .split-machine-settings-grid label.full-width textarea` | `min-height: 72px` | review |  |
| `styles.css` | 7842 | `.split-work-order-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7843 | `.split-work-order-header` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7844 | `.split-work-order-header` | `padding-bottom: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7849 | `.split-work-order-header h4` | `margin: 0 0 4px` | review |  |
| `styles.css` | 7855 | `.split-work-order-layout` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7862 | `.split-machine-tabs` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7869 | `.split-machine-tab` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7870 | `.split-machine-tab` | `padding: 8px 12px` | review |  |
| `styles.css` | 7875 | `.split-machine-tab` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7877 | `.split-machine-tab` | `min-height: 42px` | review |  |
| `styles.css` | 7891 | `.split-machine-empty-tabs` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7892 | `.split-machine-empty-tabs` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7900 | `.split-machine-empty-state` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7904 | `.split-machine-empty-state` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7905 | `.split-machine-empty-state` | `padding: 18px` | review |  |
| `styles.css` | 7926 | `.split-machine-content-stack` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7931 | `.split-machine-card` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7932 | `.split-machine-card` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7937 | `.split-machine-card h5` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7945 | `.split-machine-card-header` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7946 | `.split-machine-card-header` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7966 | `.split-production-record-mode-tabs` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7967 | `.split-production-record-mode-tabs` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7988 | `.split-partial-receipt-box` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7989 | `.split-partial-receipt-box` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7991 | `.split-partial-receipt-box` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7995 | `.split-partial-receipt-box` | `margin-top: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8055 | `.work-order-balance-alert` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8056 | `.work-order-balance-alert` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8057 | `.work-order-balance-alert` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8087 | `.work-order-partial-tools-field` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8091 | `.work-order-partial-tools-empty` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8100 | `.work-order-partial-tools-list` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8106 | `.work-order-partial-tool-row` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8108 | `.work-order-partial-tool-row` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8126 | `.work-order-partial-tool-toggle input` | `height: 18px` | review |  |
| `styles.css` | 8131 | `.work-order-partial-tool-meta` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8146 | `.work-order-partial-tool-qty` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8161 | `.work-order-partial-tools-summary` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8162 | `.work-order-partial-tools-summary` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8169 | `.work-order-partial-tools-metric` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8194 | `.work-order-completion-summary` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8195 | `.work-order-completion-summary` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8201 | `.work-order-completion-summary-row` | `gap: 16px` | review |  |
| `styles.css` | 8203 | `.work-order-completion-summary-row` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8204 | `.work-order-completion-summary-row` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8222 | `.work-order-reverse-impact-list` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8223 | `.work-order-reverse-impact-list` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8227 | `.work-order-reverse-impact-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8228 | `.work-order-reverse-impact-item` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8238 | `.inventory-receipt-badge` | `margin-left: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8239 | `.inventory-receipt-badge` | `padding: 2px 6px` | review |  |
| `styles.css` | 8240 | `.inventory-receipt-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8259 | `.split-summary-grid` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8270 | `.split-summary-grid strong` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8280 | `.split-machine-settings-card .subsection-header` | `margin: 0 0 8px` | review |  |
| `styles.css` | 8281 | `.split-machine-settings-card .subsection-header` | `padding: 0 0 6px` | review |  |
| `styles.css` | 8290 | `.split-machine-card-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8296 | `.split-machine-settings-grid` | `gap: 8px 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8308 | `.split-machine-settings-grid label.inline-label > span` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8315 | `.split-machine-settings-grid textarea` | `min-height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 8316 | `.split-machine-settings-grid textarea` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 8317 | `.split-machine-settings-grid textarea` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8325 | `.split-machine-settings-grid label.full-width textarea` | `min-height: 72px` | review |  |
| `styles.css` | 8379 | `.source-selection-section` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8381 | `.source-selection-section` | `border-radius: 5px` | review |  |
| `styles.css` | 8382 | `.source-selection-section` | `padding: 15px` | review |  |
| `styles.css` | 8389 | `.source-selection-section .tabs` | `margin-bottom: 15px` | review |  |
| `styles.css` | 8393 | `.source-selection-section .tab-btn` | `padding: 10px 20px` | review |  |
| `styles.css` | 8426 | `.search-grid` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8428 | `.search-grid` | `margin-bottom: 15px` | review |  |
| `styles.css` | 8437 | `.search-results` | `margin-top: 15px` | review |  |
| `styles.css` | 8439 | `.search-results` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8462 | `.profile-tabs` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8467 | `.profile-tab` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8476 | `.profile-tab` | `margin-bottom: -2px` | review |  |
| `styles.css` | 8490 | `.profile-tab i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8520 | `.version-info-content` | `padding: 20px 0` | review |  |
| `styles.css` | 8525 | `.system-logo` | `margin-bottom: 15px` | review |  |
| `styles.css` | 8532 | `.system-name` | `margin: 10px 0 5px` | review |  |
| `styles.css` | 8538 | `.system-subtitle` | `margin-bottom: 25px` | review |  |
| `styles.css` | 8543 | `.version-details` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8544 | `.version-details` | `padding: 20px` | review |  |
| `styles.css` | 8545 | `.version-details` | `margin: 20px 0` | review |  |
| `styles.css` | 8553 | `.version-item` | `padding: 8px 0` | review |  |
| `styles.css` | 8575 | `.version-features` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8576 | `.version-features` | `padding: 20px` | review |  |
| `styles.css` | 8577 | `.version-features` | `margin: 20px 0` | review |  |
| `styles.css` | 8582 | `.version-features h5` | `margin: 0 0 15px 0` | review |  |
| `styles.css` | 8594 | `.version-features li` | `padding: 6px 0` | review |  |
| `styles.css` | 8603 | `.version-features li::before` | `margin-right: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8609 | `.version-update-list` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8614 | `.version-update-list .version-update-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8615 | `.version-update-list .version-update-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8630 | `.version-update-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8631 | `.version-update-header` | `margin-bottom: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8648 | `.version-update-summary` | `padding-left: 16px` | review |  |
| `styles.css` | 8653 | `.version-update-summary li` | `padding: 2px 0` | review |  |
| `styles.css` | 8661 | `.version-update-empty` | `padding: 6px 0` | review |  |
| `styles.css` | 8665 | `.version-links` | `margin: 25px 0` | review |  |
| `styles.css` | 8671 | `.version-links .btn` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8672 | `.version-links .btn` | `padding: 10px 24px` | review |  |
| `styles.css` | 8677 | `.version-copyright` | `margin-top: 25px` | review |  |
| `styles.css` | 8678 | `.version-copyright` | `padding-top: 20px` | review |  |
| `styles.css` | 8683 | `.version-copyright p` | `margin: 5px 0` | review |  |
| `styles.css` | 8695 | `.menu-divider` | `margin: 8px 0` | review |  |
| `styles.css` | 8704 | `.message-list-container` | `min-height: 300px` | review |  |
| `styles.css` | 8711 | `.message-list` | `gap: 1px` | review |  |
| `styles.css` | 8719 | `.message-item` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8720 | `.message-item` | `padding: 16px` | review |  |
| `styles.css` | 8744 | `.message-avatar` | `height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 8774 | `.message-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8775 | `.message-header` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8795 | `.notification-meta` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8821 | `.notification-footer` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8827 | `.message-actions` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8841 | `.priority-badge` | `padding: 2px 8px` | review |  |
| `styles.css` | 8842 | `.priority-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8870 | `.expired-badge` | `padding: 2px 6px` | review |  |
| `styles.css` | 8871 | `.expired-badge` | `border-radius: 3px` | review |  |
| `styles.css` | 8897 | `.loading-state` | `padding: 60px 20px` | review |  |
| `styles.css` | 8904 | `.loading-state i` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8954 | `.sidebar-tabs-layout` | `min-height: 500px` | review |  |
| `styles.css` | 9009 | `.sidebar-tab-btn .tab-badge` | `height: 20px` | review |  |
| `styles.css` | 9134 | `.message-detail-content` | `padding: 16px 0` | review |  |
| `styles.css` | 9140 | `.detail-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9141 | `.detail-header` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9147 | `.detail-type` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9156 | `.detail-title` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9162 | `.detail-meta` | `gap: 16px` | review |  |
| `styles.css` | 9165 | `.detail-meta` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9166 | `.detail-meta` | `padding-bottom: 16px` | review |  |
| `styles.css` | 9173 | `.detail-meta span` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9189 | `.message-detail-header` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9190 | `.message-detail-header` | `padding-bottom: 16px` | review |  |
| `styles.css` | 9196 | `.message-detail-row` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9197 | `.message-detail-row` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9212 | `.message-detail-subject` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9213 | `.message-detail-subject` | `padding-bottom: 16px` | review |  |
| `styles.css` | 9228 | `.filter-bar` | `gap: 16px` | review |  |
| `styles.css` | 9229 | `.filter-bar` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9231 | `.filter-bar` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9232 | `.filter-bar` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9238 | `.filter-group` | `gap: 16px` | review |  |
| `styles.css` | 9244 | `.filter-group label` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9250 | `.filter-group select` | `padding: 6px 10px` | review |  |
| `styles.css` | 9252 | `.filter-group select` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9261 | `.checkbox-label input[type="checkbox"]` | `margin-right: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9269 | `.form-hint` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9300 | `.table-header-actions` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9301 | `.table-header-actions` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9320 | `.filter-row` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9326 | `.filter-field` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9337 | `.filter-field select` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9339 | `.filter-field select` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9368 | `.section-title` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9372 | `.section-title` | `margin-bottom: 15px` | review |  |
| `styles.css` | 9373 | `.section-title` | `padding-bottom: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9419 | `.event-popup-card` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9423 | `.event-popup-card` | `margin: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9433 | `.event-popup-close` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9451 | `.event-popup-header` | `padding: 20px 20px 16px` | review |  |
| `styles.css` | 9457 | `.event-popup-type-badge` | `padding: 4px 10px` | review |  |
| `styles.css` | 9458 | `.event-popup-type-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9462 | `.event-popup-type-badge` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9471 | `.event-popup-header h4` | `padding-right: 30px` | review |  |
| `styles.css` | 9475 | `.event-popup-body` | `padding: 20px` | review |  |
| `styles.css` | 9481 | `.event-popup-info` | `gap: 14px` | review |  |
| `styles.css` | 9487 | `.event-popup-row` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9495 | `.event-popup-row i` | `margin-top: 2px` | review |  |
| `styles.css` | 9503 | `.event-popup-time` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9509 | `.event-popup-time-separator` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9521 | `.event-popup-footer` | `padding: 16px 20px` | review |  |
| `styles.css` | 9525 | `.event-popup-footer` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9529 | `.event-popup-footer button` | `padding: 10px 20px` | review |  |
| `styles.css` | 9532 | `.event-popup-footer button` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9560 | `.event-popup-footer button.primary i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9565 | `.event-popup-card` | `margin: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9566 | `.event-popup-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9570 | `.event-popup-header` | `padding: 16px` | review |  |
| `styles.css` | 9574 | `.event-popup-body` | `padding: 16px` | review |  |
| `styles.css` | 9578 | `.event-popup-footer` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9596 | `.dashboard-calendar .fc-toolbar` | `padding: 12px 8px` | review |  |
| `styles.css` | 9599 | `.dashboard-calendar .fc-toolbar` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9610 | `.dashboard-calendar .fc-button-group` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9616 | `.dashboard-calendar .fc-button` | `padding: 8px 16px !important` | review |  |
| `styles.css` | 9644 | `.dashboard-calendar .fc-today-button` | `border-radius: 4px !important` | review |  |
| `styles.css` | 9645 | `.dashboard-calendar .fc-today-button` | `margin-right: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9655 | `.dashboard-calendar .fc-next-button` | `padding: 8px 12px !important` | review |  |
| `styles.css` | 9658 | `.dashboard-calendar .fc-next-button` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9672 | `.dashboard-calendar .fc-next-button` | `margin-left: -1px` | review |  |
| `styles.css` | 9681 | `.dashboard-calendar .fc-col-header-cell` | `padding: 12px 0 !important` | review |  |
| `styles.css` | 9713 | `.dashboard-calendar .fc-daygrid-day-frame` | `min-height: 100px` | review |  |
| `styles.css` | 9718 | `.dashboard-calendar .fc-daygrid-day-number` | `padding: 8px !important` | review |  |
| `styles.css` | 9722 | `.dashboard-calendar .fc-daygrid-day-number` | `height: 28px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9727 | `.dashboard-calendar .fc-daygrid-day-number` | `margin: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9753 | `.dashboard-calendar .fc-event` | `border-radius: 4px !important` | review |  |
| `styles.css` | 9754 | `.dashboard-calendar .fc-event` | `padding: 2px 6px !important` | review |  |
| `styles.css` | 9757 | `.dashboard-calendar .fc-event` | `margin: 1px 4px !important` | review |  |
| `styles.css` | 9763 | `.dashboard-calendar .fc-event.dashboard-node-event` | `border-radius: 999px !important` | review |  |
| `styles.css` | 9764 | `.dashboard-calendar .fc-event.dashboard-node-event` | `padding: 1px 8px !important` | review |  |
| `styles.css` | 9778 | `.dashboard-calendar .fc-event-main` | `padding: 1px 2px` | review |  |
| `styles.css` | 9784 | `.dashboard-calendar .fc-event-time` | `margin-right: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9795 | `.dashboard-calendar .fc-daygrid-event-dot` | `height: 8px` | review |  |
| `styles.css` | 9796 | `.dashboard-calendar .fc-daygrid-event-dot` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9804 | `.dashboard-calendar .fc-more-link` | `padding: 2px 6px` | review |  |
| `styles.css` | 9805 | `.dashboard-calendar .fc-more-link` | `margin: 2px 4px` | review |  |
| `styles.css` | 9816 | `.dashboard-calendar .fc-popover` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9823 | `.dashboard-calendar .fc-popover-header` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9829 | `.dashboard-calendar .fc-popover-body` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9834 | `.dashboard-calendar .fc-timegrid-slot` | `height: 48px !important` | review |  |
| `styles.css` | 9842 | `.dashboard-calendar .fc-timegrid-slot-label` | `padding-top: 4px !important` | review |  |
| `styles.css` | 9867 | `.dashboard-calendar .fc-timegrid-allday .fc-timegrid-col-frame` | `min-height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9873 | `.dashboard-calendar .fc-list` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9879 | `.dashboard-calendar .fc-list-day-cushion` | `padding: 12px 16px !important` | review |  |
| `styles.css` | 9899 | `.dashboard-calendar .fc-list-event-time` | `padding: 12px 16px !important` | review |  |
| `styles.css` | 9903 | `.dashboard-calendar .fc-list-event-graphic` | `padding: 12px 8px !important` | review |  |
| `styles.css` | 9909 | `.dashboard-calendar .fc-list-event-dot` | `height: 10px` | review |  |
| `styles.css` | 9913 | `.dashboard-calendar .fc-list-event-title` | `padding: 12px 16px !important` | review |  |
| `styles.css` | 9919 | `.dashboard-calendar .fc-list-empty` | `padding: 40px` | review |  |
| `styles.css` | 9934 | `.dashboard-calendar .fc-toolbar-title` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9938 | `.dashboard-calendar .fc-toolbar-chunk` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9942 | `.dashboard-calendar .fc-button` | `padding: 6px 10px !important` | review |  |
| `styles.css` | 9947 | `.dashboard-calendar .fc-daygrid-day-frame` | `min-height: 70px` | review |  |
| `styles.css` | 9951 | `.dashboard-calendar-section .dashboard-calendar` | `min-height: 500px` | review |  |
| `styles.css` | 9964 | `.announcement-bar-section` | `height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9965 | `.announcement-bar-section` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9974 | `.announcement-bar-label` | `padding: 0 14px` | review |  |
| `styles.css` | 9977 | `.announcement-bar-label` | `gap: 7px` | review |  |
| `styles.css` | 9994 | `.announcement-bar-track` | `height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10002 | `.ticker-placeholder` | `padding: 0 16px` | review |  |
| `styles.css` | 10010 | `.ticker-item` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10012 | `.ticker-item` | `padding: 0 16px` | review |  |
| `styles.css` | 10044 | `.ticker-type-badge` | `padding: 1px 6px` | review |  |
| `styles.css` | 10045 | `.ticker-type-badge` | `border-radius: 2px` | review |  |
| `styles.css` | 10073 | `.announcement-bar-count` | `padding: 0 12px` | review |  |
| `styles.css` | 10085 | `.announcement-modal-meta` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10086 | `.announcement-modal-meta` | `padding: 8px 0 12px` | review |  |
| `styles.css` | 10088 | `.announcement-modal-meta` | `margin-bottom: 14px` | review |  |
| `styles.css` | 10096 | `.announcement-modal-meta .announcement-type-tag` | `padding: 2px 8px` | review |  |
| `styles.css` | 10097 | `.announcement-modal-meta .announcement-type-tag` | `border-radius: 2px` | review |  |
| `styles.css` | 10111 | `.announcement-modal-content` | `max-height: 50vh` | review |  |
| `styles.css` | 10113 | `.announcement-modal-content` | `padding-right: 4px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10120 | `.dashboard-section` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10127 | `.dashboard-section .section-header` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10131 | `.dashboard-section .section-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10141 | `.dashboard-section .section-header h3` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10151 | `.section-header-actions` | `gap: 16px` | review |  |
| `styles.css` | 10159 | `.stats-cards-row` | `gap: 16px` | review |  |
| `styles.css` | 10160 | `.stats-cards-row` | `padding: 16px` | review |  |
| `styles.css` | 10176 | `.stats-card-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10177 | `.stats-card-header` | `padding: 10px 14px` | review |  |
| `styles.css` | 10203 | `.stats-card-body` | `padding: 14px` | review |  |
| `styles.css` | 10206 | `.stats-card-body` | `gap: 16px` | review |  |
| `styles.css` | 10217 | `.stats-main` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10218 | `.stats-main` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10236 | `.stats-sub` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10262 | `.stats-chart-small` | `height: 80px` | review |  |
| `styles.css` | 10275 | `.charts-row` | `gap: 16px` | review |  |
| `styles.css` | 10276 | `.charts-row` | `padding: 0 16px 16px` | review |  |
| `styles.css` | 10285 | `.chart-card.wide` | `min-height: 220px` | review |  |
| `styles.css` | 10289 | `.chart-card.narrow` | `min-height: 220px` | review |  |
| `styles.css` | 10296 | `.chart-card-header` | `padding: 10px 14px` | review |  |
| `styles.css` | 10306 | `.chart-card-header i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10314 | `.chart-year-badge` | `padding: 2px 8px` | review |  |
| `styles.css` | 10318 | `.chart-card-body` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10319 | `.chart-card-body` | `height: 180px` | review |  |
| `styles.css` | 10331 | `.recent-cards-row` | `gap: 16px` | review |  |
| `styles.css` | 10332 | `.recent-cards-row` | `padding: 16px` | review |  |
| `styles.css` | 10343 | `.recent-card-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10344 | `.recent-card-header` | `padding: 10px 14px` | review |  |
| `styles.css` | 10357 | `.recent-card-body` | `max-height: 250px` | review |  |
| `styles.css` | 10369 | `.recent-list .no-data-message` | `padding: 30px` | review |  |
| `styles.css` | 10383 | `.recent-item` | `padding: 10px 14px` | review |  |
| `styles.css` | 10401 | `.item-header` | `margin-bottom: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10412 | `.item-status` | `padding: 2px 8px` | review |  |
| `styles.css` | 10429 | `.item-body` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10444 | `.calendar-container` | `padding: 16px` | review |  |
| `styles.css` | 10448 | `.dashboard-calendar` | `min-height: 500px` | review |  |
| `styles.css` | 10455 | `.calendar-filter-control` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10466 | `.calendar-filter-select` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10469 | `.calendar-filter-select` | `padding: 0 10px` | review |  |
| `styles.css` | 10479 | `.calendar-legend` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10487 | `.legend-item` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10501 | `.dashboard-node-content` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10538 | `.stats-chart-small` | `height: 100px` | review |  |
| `styles.css` | 10560 | `.logo-section` | `margin-top: 1rem` | review |  |
| `styles.css` | 10567 | `.logo-edit-area` | `gap: 1.5rem` | review |  |
| `styles.css` | 10568 | `.logo-edit-area` | `margin-top: 0.5rem` | review |  |
| `styles.css` | 10578 | `.logo-edit-area .file-input-group` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10592 | `.logo-library` | `gap: 0.5rem` | review |  |
| `styles.css` | 10599 | `.logo-empty-state` | `padding: 0.75rem 1rem` | review |  |
| `styles.css` | 10608 | `.logo-create-hint` | `gap: 0.5rem` | review |  |
| `styles.css` | 10609 | `.logo-create-hint` | `padding: 1rem` | review |  |
| `styles.css` | 10612 | `.logo-create-hint` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10631 | `.logo-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10632 | `.logo-item` | `padding: 0.5rem` | review |  |
| `styles.css` | 10649 | `.logo-preview` | `height: 55px` | review |  |
| `styles.css` | 10654 | `.logo-preview` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10685 | `.logo-actions` | `gap: 0.25rem` | review |  |
| `styles.css` | 10686 | `.logo-actions` | `margin-top: 0.4rem` | review |  |
| `styles.css` | 10690 | `.logo-actions .btn` | `padding: 3px 6px` | review |  |
| `styles.css` | 10701 | `.logo-badge` | `padding: 0.1rem 0.4rem` | review |  |
| `styles.css` | 10702 | `.logo-badge` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10726 | `.logo-lightbox img` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10748 | `.rich-editor-toolbar` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10749 | `.rich-editor-toolbar` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10753 | `.rich-editor-toolbar` | `border-radius: 6px 6px 0 0` | review |  |
| `styles.css` | 10759 | `.rich-editor-toolbar button` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10766 | `.rich-editor-toolbar button` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10782 | `.rich-editor-toolbar select` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10783 | `.rich-editor-toolbar select` | `padding: 4px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10785 | `.rich-editor-toolbar select` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10793 | `.toolbar-separator` | `height: 24px` | review |  |
| `styles.css` | 10795 | `.toolbar-separator` | `margin: 0 4px` | review |  |
| `styles.css` | 10799 | `.rich-editor-content` | `min-height: 200px` | review |  |
| `styles.css` | 10800 | `.rich-editor-content` | `max-height: 400px` | review |  |
| `styles.css` | 10802 | `.rich-editor-content` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10804 | `.rich-editor-content` | `border-radius: 0 0 6px 6px` | review |  |
| `styles.css` | 10824 | `.rich-editor-content p` | `margin: 0 0 8px 0` | review |  |
| `styles.css` | 10829 | `.rich-editor-content ol` | `margin: 8px 0` | review |  |
| `styles.css` | 10830 | `.rich-editor-content ol` | `padding-left: 24px` | review |  |
| `styles.css` | 10835 | `.rich-editor-content h4` | `margin: 12px 0 8px 0` | review |  |
| `styles.css` | 10842 | `.attachment-preview-list` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10843 | `.attachment-preview-list` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10849 | `.attachment-preview-item` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10850 | `.attachment-preview-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10853 | `.attachment-preview-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10879 | `.attachment-preview-item .remove-attachment` | `height: 24px` | review |  |
| `styles.css` | 10898 | `.message-attachments` | `margin-top: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10899 | `.message-attachments` | `padding-top: 16px` | review |  |
| `styles.css` | 10905 | `.message-attachments > strong` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10916 | `.attachment-list` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10926 | `.attachment-link` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10927 | `.attachment-link` | `padding: 8px 12px` | review |  |
| `styles.css` | 10930 | `.attachment-link` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10957 | `.attachment-image-preview` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10958 | `.attachment-image-preview` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10963 | `.attachment-image-preview .preview-thumb` | `height: 90px` | review |  |
| `styles.css` | 10965 | `.attachment-image-preview .preview-thumb` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10979 | `.attachment-actions` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10980 | `.attachment-actions` | `margin-left: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10985 | `.attachment-actions button` | `height: 28px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10992 | `.attachment-actions button` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11021 | `.image-lightbox-overlay img` | `max-height: 90vh` | review |  |
| `styles.css` | 11023 | `.image-lightbox-overlay img` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11050 | `.existing-attachment-item` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11051 | `.existing-attachment-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11054 | `.existing-attachment-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11067 | `.existing-attachment-item .existing-badge` | `padding: 1px 6px` | review |  |
| `styles.css` | 11068 | `.existing-attachment-item .existing-badge` | `border-radius: 3px` | review |  |
| `styles.css` | 11074 | `.badge-sm` | `padding: 2px 6px` | review |  |
| `styles.css` | 11077 | `.badge-sm` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11112 | `.message-reply-info` | `margin-top: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11113 | `.message-reply-info` | `padding: 10px 14px` | review |  |
| `styles.css` | 11115 | `.message-reply-info` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11121 | `.message-reply-info i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11129 | `.info-box` | `padding: 1rem` | review |  |
| `styles.css` | 11132 | `.info-box` | `margin-bottom: 1rem` | review |  |
| `styles.css` | 11154 | `.settings-section .section-desc` | `margin: -8px 0 16px` | review |  |
| `styles.css` | 11182 | `.toggle-control` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11189 | `.toggle-control input[type="checkbox"]` | `height: 1px` | review |  |
| `styles.css` | 11199 | `.toggle-switch` | `height: 24px` | review |  |
| `styles.css` | 11201 | `.toggle-switch` | `border-radius: 24px` | review |  |
| `styles.css` | 11212 | `.toggle-switch::after` | `height: 18px` | review |  |
| `styles.css` | 11235 | `.settings-note-list` | `margin: 4px 0 0` | review |  |
| `styles.css` | 11236 | `.settings-note-list` | `padding-left: 20px` | review |  |
| `styles.css` | 11243 | `.settings-note-list li + li` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11248 | `.system-update-upload-grid` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11254 | `.system-update-maintenance-row` | `gap: 10px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11256 | `.system-update-maintenance-row` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11257 | `.system-update-maintenance-row` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11259 | `.system-update-maintenance-row` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11266 | `.system-update-maintenance-status` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11273 | `.system-update-actions` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11274 | `.system-update-actions` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11279 | `.system-update-status` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11280 | `.system-update-status` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11281 | `.system-update-status` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11305 | `.system-rollback-panel` | `margin: 0 0 12px` | review |  |
| `styles.css` | 11306 | `.system-rollback-panel` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11308 | `.system-rollback-panel` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11313 | `.system-rollback-panel h5` | `margin: 0 0 8px` | review |  |
| `styles.css` | 11321 | `.system-rollback-controls` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11334 | `.system-update-meta` | `gap: 8px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11335 | `.system-update-meta` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11336 | `.system-update-meta` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11338 | `.system-update-meta` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11346 | `.system-update-meta-item` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11360 | `.system-update-change-list h5` | `margin: 0 0 8px` | review |  |
| `styles.css` | 11367 | `.system-update-change-list ul` | `padding-left: 18px` | review |  |
| `styles.css` | 11371 | `.system-update-change-list li` | `margin: 4px 0` | review |  |
| `styles.css` | 11424 | `.production-schedule-tab-panel` | `min-height: 520px` | review |  |
| `styles.css` | 11468 | `.production-schedule-column` | `min-height: 440px` | review |  |
| `styles.css` | 11535 | `.schedule-run-label` | `margin-top: 2px` | review |  |
| `styles.css` | 11557 | `.work-order-type-badge` | `padding: 3px 8px` | review |  |
| `styles.css` | 11559 | `.work-order-type-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11591 | `.work-order-second-screening-empty` | `gap: 0.75rem` | review |  |
| `styles.css` | 11597 | `.work-order-second-screening-cards` | `gap: 0.75rem` | review |  |
| `styles.css` | 11603 | `.work-order-second-screening-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11605 | `.work-order-second-screening-card` | `gap: 0.4rem` | review |  |
| `styles.css` | 11606 | `.work-order-second-screening-card` | `padding: 0.75rem` | review |  |
| `styles.css` | 11612 | `.work-order-inline-rescreen-card` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11614 | `.work-order-inline-rescreen-card` | `gap: 0.85rem` | review |  |
| `styles.css` | 11615 | `.work-order-inline-rescreen-card` | `padding: 1rem` | review |  |
| `styles.css` | 11622 | `.work-order-inline-rescreen-actions` | `gap: 0.75rem` | review |  |
| `styles.css` | 11627 | `.work-order-inline-rescreen-header p` | `margin: 0.2rem 0 0` | review |  |
| `styles.css` | 11633 | `.work-order-inline-rescreen-actions` | `padding-top: 0.75rem` | review |  |
| `styles.css` | 11638 | `.work-order-second-screening-detail-block` | `margin-top: 0.1rem` | review |  |
| `styles.css` | 11639 | `.work-order-second-screening-detail-block` | `padding-top: 0.45rem` | review |  |
| `styles.css` | 11645 | `.work-order-second-screening-inline-list` | `gap: 0.35rem 0.75rem` | review |  |
| `styles.css` | 11652 | `.work-order-second-screening-detail-list` | `gap: 0.35rem` | review |  |
| `styles.css` | 11654 | `.work-order-second-screening-detail-list` | `margin: 0.45rem 0 0` | review |  |
| `styles.css` | 11662 | `.work-order-second-screening-detail-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11664 | `.work-order-second-screening-detail-item` | `gap: 0.15rem` | review |  |
| `styles.css` | 11665 | `.work-order-second-screening-detail-item` | `padding: 0.45rem 0.55rem` | review |  |
| `styles.css` | 11681 | `.rescreen-image-upload-panel` | `gap: 0.75rem` | review |  |
| `styles.css` | 11686 | `.rescreen-image-grid` | `gap: 0.75rem` | review |  |
| `styles.css` | 11693 | `.rescreen-image-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11695 | `.rescreen-image-card` | `gap: 0.5rem` | review |  |
| `styles.css` | 11696 | `.rescreen-image-card` | `padding: 0.65rem` | review |  |
| `styles.css` | 11701 | `.rescreen-image-card img` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11702 | `.rescreen-image-card img` | `height: 120px` | review |  |
| `styles.css` | 11722 | `.form-section-heading` | `gap: 0.75rem` | review |  |
| `styles.css` | 11744 | `.schedule-status-chip` | `padding: 3px 8px` | review |  |
| `styles.css` | 11746 | `.schedule-status-chip` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11754 | `.production-time-content` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11758 | `.production-status-content` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11771 | `.machine-status-detail-wrap` | `padding: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11787 | `.machine-status-detail-empty` | `padding: 12px 10px` | review |  |
| `styles.css` | 11797 | `.schedule-empty` | `padding: 18px 10px` | review |  |
| `styles.css` | 11805 | `.schedule-live-time-row` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11806 | `.schedule-live-time-row` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |

