# UI Style Audit

Generated: 2026-07-08T10:42:19.387Z

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
| `styles.css` | 151 | `@page` | `margin: 12mm` | review |  |
| `styles.css` | 186 | `.app-container` | `height: 100vh` | review |  |
| `styles.css` | 428 | `.dropdown-divider` | `height: 1px` | review |  |
| `styles.css` | 450 | `.weekday-badge` | `padding: 4px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 463 | `.weekday-text` | `margin-left: 5px` | review |  |
| `styles.css` | 491 | `.record-link-button:focus-visible` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 497 | `.status-badge` | `padding: 4px 12px` | review |  |
| `styles.css` | 498 | `.status-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 628 | `.source-tag` | `padding: 2px 8px` | review |  |
| `styles.css` | 629 | `.source-tag` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 668 | `.subtext` | `margin-top: 2px` | review |  |
| `styles.css` | 690 | `.text-warning i` | `margin-right: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 790 | `.menu-item` | `margin-bottom: 2px` | review |  |
| `styles.css` | 824 | `.menu-item.active > .menu-link` | `padding-left: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 843 | `.menu-item.active .submenu` | `max-height: 500px` | review |  |
| `styles.css` | 972 | `.tab-header` | `padding: 10px 15px` | review |  |
| `styles.css` | 976 | `.tab-header` | `margin-bottom: -1px` | review |  |
| `styles.css` | 978 | `.tab-header` | `border-top-left-radius: 5px` | review |  |
| `styles.css` | 979 | `.tab-header` | `border-top-right-radius: 5px` | review |  |
| `styles.css` | 982 | `.tab-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1000 | `.tab-header .close-tab` | `margin-left: 5px` | review |  |
| `styles.css` | 1013 | `.tab-content-area` | `padding: 20px` | review |  |
| `styles.css` | 1028 | `.example-table-container` | `margin-top: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1072 | `.icon-btn` | `margin: 0 2px` | review |  |
| `styles.css` | 1073 | `.icon-btn` | `padding: 5px` | review |  |
| `styles.css` | 1074 | `.icon-btn` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1115 | `.data-table input[type="checkbox"]` | `height: 16px` | review |  |
| `styles.css` | 1212 | `body.login-page` | `min-height: 100vh` | review |  |
| `styles.css` | 1222 | `.login-wrapper` | `padding: 32px 16px` | review |  |
| `styles.css` | 1229 | `.login-card` | `padding: 48px` | review |  |
| `styles.css` | 1232 | `.login-card` | `gap: 32px` | review |  |
| `styles.css` | 1240 | `.login-brand` | `padding-right: 32px` | review |  |
| `styles.css` | 1246 | `.login-brand h1` | `margin-top: 18px` | review |  |
| `styles.css` | 1252 | `.brand-logo img.company-logo-img` | `height: 68px` | review |  |
| `styles.css` | 1259 | `.login-brand p` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1265 | `.login-brand .system-subtitle` | `margin-top: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1272 | `.login-brand .login-hint` | `margin-top: 14px` | review |  |
| `styles.css` | 1277 | `.brand-logo` | `height: 76px` | review |  |
| `styles.css` | 1295 | `.login-card form` | `gap: 18px` | review |  |
| `styles.css` | 1301 | `.form-group label` | `margin-bottom: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1307 | `.form-group .form-control` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1332 | `.toggle-password` | `padding: 4px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1344 | `.remember-me` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1349 | `.login-button` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1354 | `.login-button` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1372 | `.login-success` | `margin-top: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1373 | `.login-success` | `padding: 12px 14px` | review |  |
| `styles.css` | 1391 | `.login-hint` | `padding: 24px` | review |  |
| `styles.css` | 1397 | `.login-hint h2` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1409 | `.sample-accounts td` | `padding: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1421 | `.sample-accounts code` | `padding: 2px 5px` | review |  |
| `styles.css` | 1430 | `.login-footer` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1435 | `.login-card` | `padding: 32px` | review |  |
| `styles.css` | 1442 | `.login-brand` | `padding-bottom: 24px` | review |  |
| `styles.css` | 1456 | `.content-header.with-actions` | `gap: 16px` | review |  |
| `styles.css` | 1474 | `.content-header.with-actions.sticky` | `padding: 16px 20px` | review |  |
| `styles.css` | 1475 | `.content-header.with-actions.sticky` | `margin: -20px -20px 20px -20px` | review |  |
| `styles.css` | 1483 | `.content-header.with-actions .subtitle` | `margin: 4px 0 0` | review |  |
| `styles.css` | 1491 | `.header-actions` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1498 | `.btn` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1499 | `.btn` | `padding: 6px 14px` | review |  |
| `styles.css` | 1500 | `.btn` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1539 | `.btn.text` | `padding: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1543 | `.btn.text` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1549 | `.btn.text` | `height: 30px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 1770 | `.btn .selection-count` | `padding: 2px 6px` | review |  |
| `styles.css` | 1771 | `.btn .selection-count` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1772 | `.btn .selection-count` | `margin-left: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 1788 | `.btn-dropdown-wrapper .dropdown-menu` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1796 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1797 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item` | `padding: 10px 14px` | review |  |
| `styles.css` | 1813 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item:first-child` | `border-radius: 6px 6px 0 0` | review |  |
| `styles.css` | 1817 | `.btn-dropdown-wrapper .dropdown-menu button.dropdown-item:last-child` | `border-radius: 0 0 6px 6px` | review |  |
| `styles.css` | 1852 | `.btn.btn-print-new` | `padding: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1856 | `.btn.btn-print-new` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1862 | `.btn.btn-print-new` | `height: 30px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 1875 | `.btn.btn-print-done` | `padding: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1879 | `.btn.btn-print-done` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1885 | `.btn.btn-print-done` | `height: 30px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 1909 | `.summary-cards` | `gap: 1rem` | review |  |
| `styles.css` | 1911 | `.summary-cards` | `margin-bottom: 1rem` | review |  |
| `styles.css` | 1917 | `.summary-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1918 | `.summary-card` | `padding: 1rem 1.25rem` | review |  |
| `styles.css` | 1921 | `.summary-card` | `gap: 1rem` | review |  |
| `styles.css` | 1942 | `.summary-card .summary-label` | `margin-bottom: 0.25rem` | review |  |
| `styles.css` | 1968 | `.filter-summary-bar` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 1975 | `.filter-summary-content` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 1983 | `.filter-chip` | `padding: 4px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 1987 | `.filter-chip` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 2000 | `.filter-count` | `height: 18px` | review |  |
| `styles.css` | 2035 | `.filter-drawer` | `height: 100vh` | review |  |
| `styles.css` | 2179 | `.filter-form .form-grid label:not(.filter-checkbox) > select` | `min-height: 38px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 2260 | `.checkbox-label` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 2431 | `.form-grid label.inline-label input[type="checkbox"]` | `height: 16px` | review |  |
| `styles.css` | 2706 | `.modal-alert::before` | `margin-top: 1px` | review |  |
| `styles.css` | 2765 | `.form-panel` | `margin-top: 25px` | review |  |
| `styles.css` | 2766 | `.form-panel` | `padding: 20px` | review |  |
| `styles.css` | 2768 | `.form-panel` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 2774 | `.form-panel h3` | `margin-bottom: 15px` | review |  |
| `styles.css` | 2780 | `.form-panel small` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 2787 | `.table-actions` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 2803 | `:is(td.table-actions, td.actions, td.actions-cell, td.actions-col) .op-action-btn` | `height: 30px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 2804 | `:is(td.table-actions, td.actions, td.actions-cell, td.actions-col) .op-action-btn` | `padding: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 2805 | `:is(td.table-actions, td.actions, td.actions-cell, td.actions-col) .op-action-btn` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3035 | `.btn-icon` | `padding: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3036 | `.btn-icon` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3042 | `.btn-icon` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3079 | `.link` | `padding: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3080 | `.link` | `margin-right: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3081 | `.link` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3087 | `.link` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3135 | `.modal-overlay` | `padding: 20px` | review |  |
| `styles.css` | 3144 | `.modal-window` | `max-height: 80vh` | review |  |
| `styles.css` | 3193 | `.column-selector` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3198 | `.column-selector` | `max-height: 80vh` | review |  |
| `styles.css` | 3206 | `.column-selector-header` | `padding: 15px` | review |  |
| `styles.css` | 3212 | `.column-selector-header` | `border-radius: 8px 8px 0 0` | review |  |
| `styles.css` | 3228 | `.column-selector-header .close-btn` | `height: 28px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3232 | `.column-selector-header .close-btn` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3244 | `.column-selector-body` | `padding: 15px` | review |  |
| `styles.css` | 3250 | `.column-selector-body .column-option` | `padding: 8px 0` | review |  |
| `styles.css` | 3260 | `.column-selector-body .column-option input[type="checkbox"]` | `margin-right: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3262 | `.column-selector-body .column-option input[type="checkbox"]` | `height: 18px` | review |  |
| `styles.css` | 3272 | `.column-selector-footer` | `padding: 12px 15px` | review |  |
| `styles.css` | 3275 | `.column-selector-footer` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3278 | `.column-selector-footer` | `border-radius: 0 0 8px 8px` | review |  |
| `styles.css` | 3375 | `.role-permission-transfer-section label.inline-label` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3384 | `.role-permission-transfer-section label.inline-label span` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3389 | `.role-permission-transfer-section label.inline-label select` | `min-height: 260px` | review |  |
| `styles.css` | 3390 | `.role-permission-transfer-section label.inline-label select` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3403 | `.role-permission-transfer-controls-box` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3404 | `.role-permission-transfer-controls-box` | `min-height: 260px` | review |  |
| `styles.css` | 3409 | `.role-permission-transfer-controls-box .btn` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3429 | `.form-address` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3435 | `.form-address label` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3477 | `.screening-create-panel` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3486 | `.screening-create-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3497 | `.screening-create-header` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3509 | `.screening-create-body` | `padding: 16px` | review |  |
| `styles.css` | 3519 | `.screening-create-footer` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3521 | `.screening-create-footer` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3529 | `.screening-create-footer .btn.small` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3535 | `.checkbox-field` | `gap: 5px` | review |  |
| `styles.css` | 3545 | `.checkbox-field input[type="checkbox"]` | `height: 18px` | review |  |
| `styles.css` | 3552 | `.file-input-group` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3562 | `.file-input-group label.file-upload-btn` | `padding: 6px 12px` | review |  |
| `styles.css` | 3585 | `.file-input-group label.file-upload-btn i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3591 | `.file-input-group .file-hint` | `margin-left: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3597 | `.invoice-stamp-preview` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3599 | `.invoice-stamp-preview` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3600 | `.invoice-stamp-preview` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3606 | `.invoice-stamp-preview img` | `max-height: 200px` | review |  |
| `styles.css` | 3608 | `.invoice-stamp-preview img` | `margin: 0 auto 8px` | review |  |
| `styles.css` | 3610 | `.invoice-stamp-preview img` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3616 | `.invoice-stamp-preview .preview-actions` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3621 | `.invoice-stamp-preview .icon-button` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3622 | `.invoice-stamp-preview .icon-button` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3631 | `.attachment-preview` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3633 | `.attachment-preview` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 3634 | `.attachment-preview` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3644 | `.attachment-preview .preview-info` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3656 | `.attachment-preview .preview-actions` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3661 | `.attachment-preview .icon-button` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 3662 | `.attachment-preview .icon-button` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3670 | `.field-hint` | `margin-top: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3686 | `.modal-window form .form-grid label small` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3697 | `.modal-window.number-sequences-modal .form-grid` | `gap: 14px` | review |  |
| `styles.css` | 3724 | `.modal-window.number-sequences-modal label.inline-label > small` | `margin-top: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3809 | `.modal-window.customers-modal form[data-customers-form]` | `gap: 14px 12px` | review |  |
| `styles.css` | 3838 | `.modal-window.customers-modal .form-row > .form-section > .customer-modal-grid` | `gap: 8px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3909 | `.modal-window.customers-modal .customer-stamp-field` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 3910 | `.modal-window.customers-modal .customer-stamp-field` | `min-height: 72px` | review |  |
| `styles.css` | 3919 | `.modal-window.customers-modal .customer-stamp-field > span` | `padding: 4px 10px` | review |  |
| `styles.css` | 3932 | `.modal-window.customers-modal .customer-stamp-control` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 3938 | `.modal-window.customers-modal .customer-stamp-control .field-hint` | `margin: 6px 0 0` | review |  |
| `styles.css` | 3946 | `.modal-window.customers-modal .customer-stamp-control .file-input-group` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 3992 | `.modal-window.suppliers-modal form[data-suppliers-form]` | `gap: 14px 12px` | review |  |
| `styles.css` | 4021 | `.modal-window.suppliers-modal .form-row > .form-section > .supplier-modal-grid` | `gap: 8px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4051 | `.modal-window.suppliers-modal .supplier-attachment-field` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4052 | `.modal-window.suppliers-modal .supplier-attachment-field` | `min-height: 72px` | review |  |
| `styles.css` | 4061 | `.modal-window.suppliers-modal .supplier-attachment-field > span` | `padding: 4px 10px` | review |  |
| `styles.css` | 4074 | `.modal-window.suppliers-modal .supplier-attachment-control` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4080 | `.modal-window.suppliers-modal .supplier-attachment-control .field-hint` | `margin: 6px 0 0` | review |  |
| `styles.css` | 4088 | `.modal-window.suppliers-modal .supplier-attachment-control .file-input-group` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4153 | `.detail-content` | `padding: 10px 0` | review |  |
| `styles.css` | 4159 | `.detail-content dl` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4160 | `.detail-content dl` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4161 | `.detail-content dl` | `padding: 15px` | review |  |
| `styles.css` | 4163 | `.detail-content dl` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4169 | `.detail-content dl > div` | `gap: 15px` | review |  |
| `styles.css` | 4171 | `.detail-content dl > div` | `padding: 8px 0` | review |  |
| `styles.css` | 4193 | `.detail-content dl.inventory-detail-list` | `column-gap: 20px` | review |  |
| `styles.css` | 4285 | `.subsection` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4286 | `.subsection` | `padding: 16px` | review |  |
| `styles.css` | 4288 | `.subsection` | `margin-bottom: 15px` | review |  |
| `styles.css` | 4291 | `.subsection` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4298 | `.subsection-header` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4299 | `.subsection-header` | `padding-bottom: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4328 | `.image-gallery` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4329 | `.image-gallery` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4330 | `.image-gallery` | `min-height: 100px` | review |  |
| `styles.css` | 4339 | `.image-gallery .empty-state` | `padding: 40px 20px` | review |  |
| `styles.css` | 4345 | `.image-gallery .empty-state i` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4352 | `.image-gallery .image-item` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4370 | `.image-gallery .image-item .btn-delete` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4372 | `.image-gallery .image-item .btn-delete` | `height: 28px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 4389 | `.order-items-modal` | `max-height: 85vh` | review |  |
| `styles.css` | 4417 | `.order-items-modal .order-items-modal-body::-webkit-scrollbar-track` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4422 | `.order-items-modal .order-items-modal-body::-webkit-scrollbar-thumb` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4478 | `.metrics-comparison-container` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4479 | `.metrics-comparison-container` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4494 | `.metrics-comparison-container .metrics-subtitle` | `margin: 0 0 8px 0` | review |  |
| `styles.css` | 4495 | `.metrics-comparison-container .metrics-subtitle` | `padding-bottom: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4510 | `.metrics-comparison-container .metric` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4511 | `.metrics-comparison-container .metric` | `padding: 5px 0` | review |  |
| `styles.css` | 4563 | `.table-secondary` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4571 | `.stacked-inputs` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4589 | `.order-items-services-table th:nth-child(3)` | `padding-left: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4590 | `.order-items-services-table th:nth-child(3)` | `padding-right: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4596 | `.order-items-services-table td:nth-child(6)` | `padding-left: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4597 | `.order-items-services-table td:nth-child(6)` | `padding-right: 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4611 | `.modal-window.work-orders-modal` | `max-height: 90vh` | review |  |
| `styles.css` | 4615 | `.work-orders-modal h3[data-modal-title]` | `margin-bottom: 15px` | review |  |
| `styles.css` | 4617 | `.work-orders-modal h3[data-modal-title]` | `padding-right: 40px` | review |  |
| `styles.css` | 4621 | `.work-orders-modal .modal-alert` | `margin-bottom: 15px` | review |  |
| `styles.css` | 4639 | `.work-orders-modal-body` | `padding-right: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4648 | `.work-orders-modal-body::-webkit-scrollbar-track` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4653 | `.work-orders-modal-body::-webkit-scrollbar-thumb` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4661 | `.work-orders-modal-footer` | `padding-top: 15px` | review |  |
| `styles.css` | 4680 | `.rescreen-batches-modal` | `max-height: 88vh` | review |  |
| `styles.css` | 4682 | `.rescreen-batches-modal` | `padding: 20px 20px 16px` | review |  |
| `styles.css` | 4687 | `.rescreen-batches-modal h3` | `margin-bottom: 14px` | review |  |
| `styles.css` | 4692 | `.rescreen-batches-modal > .modal-alert` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4699 | `.rescreen-batches-modal form` | `gap: 14px` | review |  |
| `styles.css` | 4715 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-header` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4717 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-header` | `margin: 0 0 8px` | review |  |
| `styles.css` | 4718 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-header` | `padding: 0 0 6px` | review |  |
| `styles.css` | 4722 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-body` | `padding-left: 2px` | review |  |
| `styles.css` | 4723 | `[data-rescreen-batches-modal] .rescreen-batches-collapsible-section > .subsection-body` | `padding-right: 2px` | review |  |
| `styles.css` | 4737 | `[data-rescreen-batches-modal] .rescreen-section-title` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4782 | `.rescreen-section-helper` | `margin: 0 0 12px` | review |  |
| `styles.css` | 4786 | `.rescreen-source-summary-grid` | `min-height: 128px` | review |  |
| `styles.css` | 4792 | `.rescreen-source-card` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4795 | `.rescreen-source-card` | `gap: 14px` | review |  |
| `styles.css` | 4796 | `.rescreen-source-card` | `padding: 16px 18px` | review |  |
| `styles.css` | 4810 | `.rescreen-source-card-header` | `gap: 0.75rem` | review |  |
| `styles.css` | 4816 | `.rescreen-source-card-title-group` | `gap: 0.2rem` | review |  |
| `styles.css` | 4837 | `.rescreen-source-card-title-group p` | `margin: 0.15rem 0 0` | review |  |
| `styles.css` | 4843 | `.rescreen-source-card-badge` | `border-radius: 999px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4848 | `.rescreen-source-card-badge` | `padding: 0.35rem 0.8rem` | review |  |
| `styles.css` | 4859 | `.rescreen-source-card-body` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 4866 | `.rescreen-source-fact` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4868 | `.rescreen-source-fact` | `gap: 0.35rem` | review |  |
| `styles.css` | 4869 | `.rescreen-source-fact` | `padding: 0.8rem 0.9rem` | review |  |
| `styles.css` | 4897 | `.rescreen-source-state` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4899 | `.rescreen-source-state` | `gap: 0.35rem` | review |  |
| `styles.css` | 4900 | `.rescreen-source-state` | `padding: 16px 18px` | review |  |
| `styles.css` | 4934 | `.rescreen-batches-modal-body` | `padding-right: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 4943 | `.rescreen-batches-modal-body::-webkit-scrollbar-track` | `border-radius: 999px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4948 | `.rescreen-batches-modal-body::-webkit-scrollbar-thumb` | `border-radius: 999px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4960 | `.rescreen-batches-modal-footer` | `padding-top: 14px` | review |  |
| `styles.css` | 4970 | `[data-rescreen-batches-detail-modal] .modal-window.xlarge` | `max-height: 88vh` | review |  |
| `styles.css` | 4978 | `[data-rescreen-batches-detail-modal] .detail-content` | `padding: 4px 0 0` | review |  |
| `styles.css` | 4984 | `[data-rescreen-batches-detail-modal] .form-actions` | `margin-top: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 4985 | `[data-rescreen-batches-detail-modal] .form-actions` | `padding-top: 14px` | review |  |
| `styles.css` | 4991 | `[data-rescreen-batches-detail-modal] .detail-content .detail-section p` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 4997 | `[data-rescreen-batches-detail-modal] .detail-content .detail-grid` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5004 | `[data-rescreen-batches-detail-modal] .detail-content .detail-item` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 5007 | `[data-rescreen-batches-detail-modal] .detail-content .detail-item` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5008 | `[data-rescreen-batches-detail-modal] .detail-content .detail-item` | `padding: 12px 14px` | review |  |
| `styles.css` | 5051 | `.rescreen-batches-modal` | `padding: 16px 16px 14px` | review |  |
| `styles.css` | 5074 | `.work-orders-section-layout` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5076 | `.work-orders-section-layout` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5115 | `.work-order-schedule-section .weekday-badge` | `padding: 4px 6px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5134 | `.work-orders-section-right .table-responsive` | `min-height: 280px` | review |  |
| `styles.css` | 5143 | `.work-order-type-top-section` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5152 | `.work-order-source-mode-hint` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5153 | `.work-order-source-mode-hint` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5155 | `.work-order-source-mode-hint` | `border-radius: 5px` | review |  |
| `styles.css` | 5167 | `.work-order-collapsible-section details` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5175 | `.work-order-collapsible-section summary` | `padding-bottom: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 5176 | `.work-order-collapsible-section summary` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5188 | `.work-order-collapsible-section summary::before` | `margin-right: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5272 | `.work-orders-section-right .table-responsive` | `min-height: 220px` | review |  |
| `styles.css` | 5293 | `.work-order-live-time-row` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5294 | `.work-order-live-time-row` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 5296 | `.work-order-live-time-row` | `padding: 10px 14px` | review |  |
| `styles.css` | 5417 | `.work-order-edit-first-piece-card` | `min-height: 200px` | review |  |
| `styles.css` | 5422 | `.work-order-edit-first-piece-card .subsection-body` | `min-height: 140px` | review |  |
| `styles.css` | 5443 | `.work-order-edit-images-card .table-responsive` | `min-height: 120px` | review |  |
| `styles.css` | 5467 | `.work-order-production-mode-tabs` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5468 | `.work-order-production-mode-tabs` | `padding: 0 2px` | review |  |
| `styles.css` | 5476 | `.work-order-production-mode-tabs .tab-btn` | `border-radius: 4px 4px 0 0` | review |  |
| `styles.css` | 5477 | `.work-order-production-mode-tabs .tab-btn` | `padding: 6px 14px` | review |  |
| `styles.css` | 5487 | `.work-order-screening-tabs-section` | `padding: 10px 14px` | review |  |
| `styles.css` | 5517 | `.work-order-production-mode-panel` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5526 | `.work-order-execution-image-tabs` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 5540 | `.work-order-image-sections-grid` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5563 | `.work-order-production-mode-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 5604 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `height: min(850px, 94vh)` | review |  |
| `styles.css` | 5606 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `max-height: 94vh` | review |  |
| `styles.css` | 5631 | `[data-work-orders-edit-modal] form` | `padding-top: 42px` | review |  |
| `styles.css` | 5815 | `[data-work-orders-edit-modal] .work-order-edit-drawing-card` | `min-height: 82px` | review |  |
| `styles.css` | 5930 | `[data-work-orders-edit-modal] .work-order-edit-service-section` | `min-height: 170px` | review |  |
| `styles.css` | 5938 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card` | `min-height: 170px` | review |  |
| `styles.css` | 5950 | `[data-work-orders-edit-modal] .work-order-edit-service-section .table-responsive` | `min-height: 126px` | review |  |
| `styles.css` | 5951 | `[data-work-orders-edit-modal] .work-order-edit-service-section .table-responsive` | `max-height: 126px` | review |  |
| `styles.css` | 6000 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card .subsection-actions .btn` | `min-height: 25px` | review |  |
| `styles.css` | 6006 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card .subsection-body` | `min-height: 122px` | review |  |
| `styles.css` | 6034 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card textarea` | `height: 24px` | review |  |
| `styles.css` | 6035 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card textarea` | `min-height: 24px` | review |  |
| `styles.css` | 6048 | `[data-work-orders-edit-modal] .work-order-edit-production-records` | `min-height: 230px` | review |  |
| `styles.css` | 6066 | `[data-work-orders-edit-modal] .work-order-production-mode-tabs` | `min-height: 30px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 6078 | `[data-work-orders-edit-modal] .work-order-production-mode-header` | `min-height: 25px` | review |  |
| `styles.css` | 6086 | `[data-work-orders-edit-modal] .work-order-production-mode-header .btn` | `min-height: 25px` | review |  |
| `styles.css` | 6102 | `[data-work-orders-edit-modal] .production-records-table select` | `height: 25px` | review |  |
| `styles.css` | 6103 | `[data-work-orders-edit-modal] .production-records-table select` | `min-height: 25px` | review |  |
| `styles.css` | 6166 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `height: 92vh` | review |  |
| `styles.css` | 6167 | `[data-work-orders-edit-modal] .modal-window.work-orders-modal` | `max-height: 92vh` | review |  |
| `styles.css` | 6369 | `.work-order-mobile-quick-entry-card` | `margin-top: 14px` | review |  |
| `styles.css` | 6370 | `.work-order-mobile-quick-entry-card` | `padding-top: 2px` | review |  |
| `styles.css` | 6375 | `.work-order-mobile-quick-entry-body` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6379 | `.work-order-mobile-quick-entry-qr` | `min-height: 232px` | review |  |
| `styles.css` | 6381 | `.work-order-mobile-quick-entry-qr` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 6386 | `.work-order-mobile-quick-entry-qr` | `padding: 14px` | review |  |
| `styles.css` | 6414 | `.work-order-mobile-quick-entry-actions` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6453 | `[data-work-orders-edit-modal] .work-order-edit-drawing-card` | `min-height: 86px` | review |  |
| `styles.css` | 6619 | `.searchable-select-native` | `height: 1px !important` | review |  |
| `styles.css` | 6663 | `.searchable-select-list` | `max-height: 220px` | review |  |
| `styles.css` | 6723 | `[data-machine-picker-modal] .machine-picker-layout` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6730 | `[data-machine-picker-modal] .machine-picker-groups` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6731 | `[data-machine-picker-modal] .machine-picker-groups` | `max-height: min(52vh, 420px)` | review |  |
| `styles.css` | 6733 | `[data-machine-picker-modal] .machine-picker-groups` | `padding-right: 4px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 6738 | `[data-machine-picker-modal] .machine-picker-group-btn` | `min-height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 6739 | `[data-machine-picker-modal] .machine-picker-group-btn` | `padding: 7px 10px` | review |  |
| `styles.css` | 6767 | `[data-machine-picker-modal] .machine-picker-panel-header` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6768 | `[data-machine-picker-modal] .machine-picker-panel-header` | `margin-top: 2px` | review |  |
| `styles.css` | 6769 | `[data-machine-picker-modal] .machine-picker-panel-header` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 6786 | `[data-machine-picker-modal] .machine-picker-grid` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6787 | `[data-machine-picker-modal] .machine-picker-grid` | `max-height: min(46vh, 360px)` | review |  |
| `styles.css` | 6795 | `[data-machine-picker-modal] .machine-picker-option` | `column-gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 6797 | `[data-machine-picker-modal] .machine-picker-option` | `min-height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 6798 | `[data-machine-picker-modal] .machine-picker-option` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 6800 | `[data-machine-picker-modal] .machine-picker-option` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 6887 | `[data-work-orders-edit-modal] .work-order-edit-first-piece-card` | `min-height: 175px` | review |  |
| `styles.css` | 6900 | `[data-work-orders-edit-modal] .work-order-edit-production-records` | `min-height: 260px` | review |  |
| `styles.css` | 7007 | `[data-work-orders-edit-modal] .work-order-edit-summary-value > span` | `height: 1px` | review |  |
| `styles.css` | 7353 | `[data-work-orders-edit-modal] .work-order-tool-analysis-empty` | `margin-bottom: 0.75rem` | review |  |
| `styles.css` | 7422 | `[data-work-orders-edit-modal] .work-order-edit-service-section .table-responsive` | `max-height: 210px` | review |  |
| `styles.css` | 7560 | `[data-work-orders-edit-modal] .split-work-order-header h4` | `margin: 0 0 4px` | review |  |
| `styles.css` | 7579 | `[data-work-orders-edit-modal] .split-machine-tab` | `min-height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 7672 | `[data-work-orders-edit-modal] .split-machine-settings-card` | `min-height: 175px` | review |  |
| `styles.css` | 7714 | `[data-work-orders-edit-modal] .split-machine-settings-grid label.full-width textarea` | `min-height: 72px` | review |  |
| `styles.css` | 7841 | `.split-work-order-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7842 | `.split-work-order-header` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7843 | `.split-work-order-header` | `padding-bottom: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7848 | `.split-work-order-header h4` | `margin: 0 0 4px` | review |  |
| `styles.css` | 7854 | `.split-work-order-layout` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7861 | `.split-machine-tabs` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7868 | `.split-machine-tab` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7869 | `.split-machine-tab` | `padding: 8px 12px` | review |  |
| `styles.css` | 7874 | `.split-machine-tab` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7876 | `.split-machine-tab` | `min-height: 42px` | review |  |
| `styles.css` | 7890 | `.split-machine-empty-tabs` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7891 | `.split-machine-empty-tabs` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7899 | `.split-machine-empty-state` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7903 | `.split-machine-empty-state` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7904 | `.split-machine-empty-state` | `padding: 18px` | review |  |
| `styles.css` | 7925 | `.split-machine-content-stack` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7930 | `.split-machine-card` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7931 | `.split-machine-card` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7936 | `.split-machine-card h5` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7944 | `.split-machine-card-header` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7945 | `.split-machine-card-header` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7965 | `.split-production-record-mode-tabs` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7966 | `.split-production-record-mode-tabs` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 7987 | `.split-partial-receipt-box` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 7988 | `.split-partial-receipt-box` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 7990 | `.split-partial-receipt-box` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 7994 | `.split-partial-receipt-box` | `margin-top: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8054 | `.work-order-balance-alert` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8055 | `.work-order-balance-alert` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8056 | `.work-order-balance-alert` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8086 | `.work-order-partial-tools-field` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8090 | `.work-order-partial-tools-empty` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8099 | `.work-order-partial-tools-list` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8105 | `.work-order-partial-tool-row` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8107 | `.work-order-partial-tool-row` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8125 | `.work-order-partial-tool-toggle input` | `height: 18px` | review |  |
| `styles.css` | 8130 | `.work-order-partial-tool-meta` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8145 | `.work-order-partial-tool-qty` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8160 | `.work-order-partial-tools-summary` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8161 | `.work-order-partial-tools-summary` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8168 | `.work-order-partial-tools-metric` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8193 | `.work-order-completion-summary` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8194 | `.work-order-completion-summary` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8200 | `.work-order-completion-summary-row` | `gap: 16px` | review |  |
| `styles.css` | 8202 | `.work-order-completion-summary-row` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8203 | `.work-order-completion-summary-row` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8221 | `.work-order-reverse-impact-list` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8222 | `.work-order-reverse-impact-list` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8226 | `.work-order-reverse-impact-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8227 | `.work-order-reverse-impact-item` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8237 | `.inventory-receipt-badge` | `margin-left: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8238 | `.inventory-receipt-badge` | `padding: 2px 6px` | review |  |
| `styles.css` | 8239 | `.inventory-receipt-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8258 | `.split-summary-grid` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8269 | `.split-summary-grid strong` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8279 | `.split-machine-settings-card .subsection-header` | `margin: 0 0 8px` | review |  |
| `styles.css` | 8280 | `.split-machine-settings-card .subsection-header` | `padding: 0 0 6px` | review |  |
| `styles.css` | 8289 | `.split-machine-card-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8295 | `.split-machine-settings-grid` | `gap: 8px 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8307 | `.split-machine-settings-grid label.inline-label > span` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8314 | `.split-machine-settings-grid textarea` | `min-height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 8315 | `.split-machine-settings-grid textarea` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 8316 | `.split-machine-settings-grid textarea` | `padding: 6px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8324 | `.split-machine-settings-grid label.full-width textarea` | `min-height: 72px` | review |  |
| `styles.css` | 8378 | `.source-selection-section` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8380 | `.source-selection-section` | `border-radius: 5px` | review |  |
| `styles.css` | 8381 | `.source-selection-section` | `padding: 15px` | review |  |
| `styles.css` | 8388 | `.source-selection-section .tabs` | `margin-bottom: 15px` | review |  |
| `styles.css` | 8392 | `.source-selection-section .tab-btn` | `padding: 10px 20px` | review |  |
| `styles.css` | 8425 | `.search-grid` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8427 | `.search-grid` | `margin-bottom: 15px` | review |  |
| `styles.css` | 8436 | `.search-results` | `margin-top: 15px` | review |  |
| `styles.css` | 8438 | `.search-results` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8461 | `.profile-tabs` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8466 | `.profile-tab` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8475 | `.profile-tab` | `margin-bottom: -2px` | review |  |
| `styles.css` | 8489 | `.profile-tab i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8519 | `.version-info-content` | `padding: 20px 0` | review |  |
| `styles.css` | 8524 | `.system-logo` | `margin-bottom: 15px` | review |  |
| `styles.css` | 8531 | `.system-name` | `margin: 10px 0 5px` | review |  |
| `styles.css` | 8537 | `.system-subtitle` | `margin-bottom: 25px` | review |  |
| `styles.css` | 8542 | `.version-details` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8543 | `.version-details` | `padding: 20px` | review |  |
| `styles.css` | 8544 | `.version-details` | `margin: 20px 0` | review |  |
| `styles.css` | 8552 | `.version-item` | `padding: 8px 0` | review |  |
| `styles.css` | 8574 | `.version-features` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8575 | `.version-features` | `padding: 20px` | review |  |
| `styles.css` | 8576 | `.version-features` | `margin: 20px 0` | review |  |
| `styles.css` | 8581 | `.version-features h5` | `margin: 0 0 15px 0` | review |  |
| `styles.css` | 8593 | `.version-features li` | `padding: 6px 0` | review |  |
| `styles.css` | 8602 | `.version-features li::before` | `margin-right: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8608 | `.version-update-list` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8613 | `.version-update-list .version-update-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8614 | `.version-update-list .version-update-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 8629 | `.version-update-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8630 | `.version-update-header` | `margin-bottom: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8647 | `.version-update-summary` | `padding-left: 16px` | review |  |
| `styles.css` | 8652 | `.version-update-summary li` | `padding: 2px 0` | review |  |
| `styles.css` | 8660 | `.version-update-empty` | `padding: 6px 0` | review |  |
| `styles.css` | 8664 | `.version-links` | `margin: 25px 0` | review |  |
| `styles.css` | 8670 | `.version-links .btn` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8671 | `.version-links .btn` | `padding: 10px 24px` | review |  |
| `styles.css` | 8676 | `.version-copyright` | `margin-top: 25px` | review |  |
| `styles.css` | 8677 | `.version-copyright` | `padding-top: 20px` | review |  |
| `styles.css` | 8682 | `.version-copyright p` | `margin: 5px 0` | review |  |
| `styles.css` | 8694 | `.menu-divider` | `margin: 8px 0` | review |  |
| `styles.css` | 8703 | `.message-list-container` | `min-height: 300px` | review |  |
| `styles.css` | 8710 | `.message-list` | `gap: 1px` | review |  |
| `styles.css` | 8718 | `.message-item` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8719 | `.message-item` | `padding: 16px` | review |  |
| `styles.css` | 8743 | `.message-avatar` | `height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 8773 | `.message-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8774 | `.message-header` | `margin-bottom: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8794 | `.notification-meta` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8820 | `.notification-footer` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8826 | `.message-actions` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 8840 | `.priority-badge` | `padding: 2px 8px` | review |  |
| `styles.css` | 8841 | `.priority-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 8869 | `.expired-badge` | `padding: 2px 6px` | review |  |
| `styles.css` | 8870 | `.expired-badge` | `border-radius: 3px` | review |  |
| `styles.css` | 8896 | `.loading-state` | `padding: 60px 20px` | review |  |
| `styles.css` | 8903 | `.loading-state i` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 8953 | `.sidebar-tabs-layout` | `min-height: 500px` | review |  |
| `styles.css` | 9008 | `.sidebar-tab-btn .tab-badge` | `height: 20px` | review |  |
| `styles.css` | 9133 | `.message-detail-content` | `padding: 16px 0` | review |  |
| `styles.css` | 9139 | `.detail-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9140 | `.detail-header` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9146 | `.detail-type` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9155 | `.detail-title` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9161 | `.detail-meta` | `gap: 16px` | review |  |
| `styles.css` | 9164 | `.detail-meta` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9165 | `.detail-meta` | `padding-bottom: 16px` | review |  |
| `styles.css` | 9172 | `.detail-meta span` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9188 | `.message-detail-header` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9189 | `.message-detail-header` | `padding-bottom: 16px` | review |  |
| `styles.css` | 9195 | `.message-detail-row` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9196 | `.message-detail-row` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9211 | `.message-detail-subject` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9212 | `.message-detail-subject` | `padding-bottom: 16px` | review |  |
| `styles.css` | 9227 | `.filter-bar` | `gap: 16px` | review |  |
| `styles.css` | 9228 | `.filter-bar` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9230 | `.filter-bar` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9231 | `.filter-bar` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9237 | `.filter-group` | `gap: 16px` | review |  |
| `styles.css` | 9243 | `.filter-group label` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9249 | `.filter-group select` | `padding: 6px 10px` | review |  |
| `styles.css` | 9251 | `.filter-group select` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9260 | `.checkbox-label input[type="checkbox"]` | `margin-right: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9268 | `.form-hint` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9299 | `.table-header-actions` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9300 | `.table-header-actions` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9319 | `.filter-row` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9325 | `.filter-field` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9336 | `.filter-field select` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9338 | `.filter-field select` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9367 | `.section-title` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9371 | `.section-title` | `margin-bottom: 15px` | review |  |
| `styles.css` | 9372 | `.section-title` | `padding-bottom: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9418 | `.event-popup-card` | `border-radius: 12px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9422 | `.event-popup-card` | `margin: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9432 | `.event-popup-close` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9450 | `.event-popup-header` | `padding: 20px 20px 16px` | review |  |
| `styles.css` | 9456 | `.event-popup-type-badge` | `padding: 4px 10px` | review |  |
| `styles.css` | 9457 | `.event-popup-type-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9461 | `.event-popup-type-badge` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9470 | `.event-popup-header h4` | `padding-right: 30px` | review |  |
| `styles.css` | 9474 | `.event-popup-body` | `padding: 20px` | review |  |
| `styles.css` | 9480 | `.event-popup-info` | `gap: 14px` | review |  |
| `styles.css` | 9486 | `.event-popup-row` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9494 | `.event-popup-row i` | `margin-top: 2px` | review |  |
| `styles.css` | 9502 | `.event-popup-time` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9508 | `.event-popup-time-separator` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9520 | `.event-popup-footer` | `padding: 16px 20px` | review |  |
| `styles.css` | 9524 | `.event-popup-footer` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9528 | `.event-popup-footer button` | `padding: 10px 20px` | review |  |
| `styles.css` | 9531 | `.event-popup-footer button` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9559 | `.event-popup-footer button.primary i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9564 | `.event-popup-card` | `margin: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9565 | `.event-popup-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9569 | `.event-popup-header` | `padding: 16px` | review |  |
| `styles.css` | 9573 | `.event-popup-body` | `padding: 16px` | review |  |
| `styles.css` | 9577 | `.event-popup-footer` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9595 | `.dashboard-calendar .fc-toolbar` | `padding: 12px 8px` | review |  |
| `styles.css` | 9598 | `.dashboard-calendar .fc-toolbar` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 9609 | `.dashboard-calendar .fc-button-group` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9615 | `.dashboard-calendar .fc-button` | `padding: 8px 16px !important` | review |  |
| `styles.css` | 9643 | `.dashboard-calendar .fc-today-button` | `border-radius: 4px !important` | review |  |
| `styles.css` | 9644 | `.dashboard-calendar .fc-today-button` | `margin-right: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9654 | `.dashboard-calendar .fc-next-button` | `padding: 8px 12px !important` | review |  |
| `styles.css` | 9657 | `.dashboard-calendar .fc-next-button` | `height: 36px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9671 | `.dashboard-calendar .fc-next-button` | `margin-left: -1px` | review |  |
| `styles.css` | 9680 | `.dashboard-calendar .fc-col-header-cell` | `padding: 12px 0 !important` | review |  |
| `styles.css` | 9712 | `.dashboard-calendar .fc-daygrid-day-frame` | `min-height: 100px` | review |  |
| `styles.css` | 9717 | `.dashboard-calendar .fc-daygrid-day-number` | `padding: 8px !important` | review |  |
| `styles.css` | 9721 | `.dashboard-calendar .fc-daygrid-day-number` | `height: 28px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9726 | `.dashboard-calendar .fc-daygrid-day-number` | `margin: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9752 | `.dashboard-calendar .fc-event` | `border-radius: 4px !important` | review |  |
| `styles.css` | 9753 | `.dashboard-calendar .fc-event` | `padding: 2px 6px !important` | review |  |
| `styles.css` | 9756 | `.dashboard-calendar .fc-event` | `margin: 1px 4px !important` | review |  |
| `styles.css` | 9762 | `.dashboard-calendar .fc-event.dashboard-node-event` | `border-radius: 999px !important` | review |  |
| `styles.css` | 9763 | `.dashboard-calendar .fc-event.dashboard-node-event` | `padding: 1px 8px !important` | review |  |
| `styles.css` | 9777 | `.dashboard-calendar .fc-event-main` | `padding: 1px 2px` | review |  |
| `styles.css` | 9783 | `.dashboard-calendar .fc-event-time` | `margin-right: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9794 | `.dashboard-calendar .fc-daygrid-event-dot` | `height: 8px` | review |  |
| `styles.css` | 9795 | `.dashboard-calendar .fc-daygrid-event-dot` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9803 | `.dashboard-calendar .fc-more-link` | `padding: 2px 6px` | review |  |
| `styles.css` | 9804 | `.dashboard-calendar .fc-more-link` | `margin: 2px 4px` | review |  |
| `styles.css` | 9815 | `.dashboard-calendar .fc-popover` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9822 | `.dashboard-calendar .fc-popover-header` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9828 | `.dashboard-calendar .fc-popover-body` | `padding: 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 9833 | `.dashboard-calendar .fc-timegrid-slot` | `height: 48px !important` | review |  |
| `styles.css` | 9841 | `.dashboard-calendar .fc-timegrid-slot-label` | `padding-top: 4px !important` | review |  |
| `styles.css` | 9866 | `.dashboard-calendar .fc-timegrid-allday .fc-timegrid-col-frame` | `min-height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9872 | `.dashboard-calendar .fc-list` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 9878 | `.dashboard-calendar .fc-list-day-cushion` | `padding: 12px 16px !important` | review |  |
| `styles.css` | 9898 | `.dashboard-calendar .fc-list-event-time` | `padding: 12px 16px !important` | review |  |
| `styles.css` | 9902 | `.dashboard-calendar .fc-list-event-graphic` | `padding: 12px 8px !important` | review |  |
| `styles.css` | 9908 | `.dashboard-calendar .fc-list-event-dot` | `height: 10px` | review |  |
| `styles.css` | 9912 | `.dashboard-calendar .fc-list-event-title` | `padding: 12px 16px !important` | review |  |
| `styles.css` | 9918 | `.dashboard-calendar .fc-list-empty` | `padding: 40px` | review |  |
| `styles.css` | 9933 | `.dashboard-calendar .fc-toolbar-title` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9937 | `.dashboard-calendar .fc-toolbar-chunk` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9941 | `.dashboard-calendar .fc-button` | `padding: 6px 10px !important` | review |  |
| `styles.css` | 9946 | `.dashboard-calendar .fc-daygrid-day-frame` | `min-height: 70px` | review |  |
| `styles.css` | 9950 | `.dashboard-calendar-section .dashboard-calendar` | `min-height: 500px` | review |  |
| `styles.css` | 9963 | `.announcement-bar-section` | `height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 9964 | `.announcement-bar-section` | `margin-bottom: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 9973 | `.announcement-bar-label` | `padding: 0 14px` | review |  |
| `styles.css` | 9976 | `.announcement-bar-label` | `gap: 7px` | review |  |
| `styles.css` | 9993 | `.announcement-bar-track` | `height: 40px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10001 | `.ticker-placeholder` | `padding: 0 16px` | review |  |
| `styles.css` | 10009 | `.ticker-item` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10011 | `.ticker-item` | `padding: 0 16px` | review |  |
| `styles.css` | 10043 | `.ticker-type-badge` | `padding: 1px 6px` | review |  |
| `styles.css` | 10044 | `.ticker-type-badge` | `border-radius: 2px` | review |  |
| `styles.css` | 10072 | `.announcement-bar-count` | `padding: 0 12px` | review |  |
| `styles.css` | 10084 | `.announcement-modal-meta` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10085 | `.announcement-modal-meta` | `padding: 8px 0 12px` | review |  |
| `styles.css` | 10087 | `.announcement-modal-meta` | `margin-bottom: 14px` | review |  |
| `styles.css` | 10095 | `.announcement-modal-meta .announcement-type-tag` | `padding: 2px 8px` | review |  |
| `styles.css` | 10096 | `.announcement-modal-meta .announcement-type-tag` | `border-radius: 2px` | review |  |
| `styles.css` | 10110 | `.announcement-modal-content` | `max-height: 50vh` | review |  |
| `styles.css` | 10112 | `.announcement-modal-content` | `padding-right: 4px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10119 | `.dashboard-section` | `margin-bottom: 20px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10126 | `.dashboard-section .section-header` | `padding: 12px 16px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10130 | `.dashboard-section .section-header` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10140 | `.dashboard-section .section-header h3` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10150 | `.section-header-actions` | `gap: 16px` | review |  |
| `styles.css` | 10158 | `.stats-cards-row` | `gap: 16px` | review |  |
| `styles.css` | 10159 | `.stats-cards-row` | `padding: 16px` | review |  |
| `styles.css` | 10175 | `.stats-card-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10176 | `.stats-card-header` | `padding: 10px 14px` | review |  |
| `styles.css` | 10202 | `.stats-card-body` | `padding: 14px` | review |  |
| `styles.css` | 10205 | `.stats-card-body` | `gap: 16px` | review |  |
| `styles.css` | 10216 | `.stats-main` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10217 | `.stats-main` | `margin-bottom: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10235 | `.stats-sub` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10261 | `.stats-chart-small` | `height: 80px` | review |  |
| `styles.css` | 10274 | `.charts-row` | `gap: 16px` | review |  |
| `styles.css` | 10275 | `.charts-row` | `padding: 0 16px 16px` | review |  |
| `styles.css` | 10284 | `.chart-card.wide` | `min-height: 220px` | review |  |
| `styles.css` | 10288 | `.chart-card.narrow` | `min-height: 220px` | review |  |
| `styles.css` | 10295 | `.chart-card-header` | `padding: 10px 14px` | review |  |
| `styles.css` | 10305 | `.chart-card-header i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10313 | `.chart-year-badge` | `padding: 2px 8px` | review |  |
| `styles.css` | 10317 | `.chart-card-body` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10318 | `.chart-card-body` | `height: 180px` | review |  |
| `styles.css` | 10330 | `.recent-cards-row` | `gap: 16px` | review |  |
| `styles.css` | 10331 | `.recent-cards-row` | `padding: 16px` | review |  |
| `styles.css` | 10342 | `.recent-card-header` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10343 | `.recent-card-header` | `padding: 10px 14px` | review |  |
| `styles.css` | 10356 | `.recent-card-body` | `max-height: 250px` | review |  |
| `styles.css` | 10368 | `.recent-list .no-data-message` | `padding: 30px` | review |  |
| `styles.css` | 10382 | `.recent-item` | `padding: 10px 14px` | review |  |
| `styles.css` | 10400 | `.item-header` | `margin-bottom: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10411 | `.item-status` | `padding: 2px 8px` | review |  |
| `styles.css` | 10428 | `.item-body` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10443 | `.calendar-container` | `padding: 16px` | review |  |
| `styles.css` | 10447 | `.dashboard-calendar` | `min-height: 500px` | review |  |
| `styles.css` | 10454 | `.calendar-filter-control` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10465 | `.calendar-filter-select` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10468 | `.calendar-filter-select` | `padding: 0 10px` | review |  |
| `styles.css` | 10478 | `.calendar-legend` | `gap: 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10486 | `.legend-item` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10500 | `.dashboard-node-content` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10537 | `.stats-chart-small` | `height: 100px` | review |  |
| `styles.css` | 10559 | `.logo-section` | `margin-top: 1rem` | review |  |
| `styles.css` | 10566 | `.logo-edit-area` | `gap: 1.5rem` | review |  |
| `styles.css` | 10567 | `.logo-edit-area` | `margin-top: 0.5rem` | review |  |
| `styles.css` | 10577 | `.logo-edit-area .file-input-group` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10591 | `.logo-library` | `gap: 0.5rem` | review |  |
| `styles.css` | 10598 | `.logo-empty-state` | `padding: 0.75rem 1rem` | review |  |
| `styles.css` | 10607 | `.logo-create-hint` | `gap: 0.5rem` | review |  |
| `styles.css` | 10608 | `.logo-create-hint` | `padding: 1rem` | review |  |
| `styles.css` | 10611 | `.logo-create-hint` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10630 | `.logo-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10631 | `.logo-item` | `padding: 0.5rem` | review |  |
| `styles.css` | 10648 | `.logo-preview` | `height: 55px` | review |  |
| `styles.css` | 10653 | `.logo-preview` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10684 | `.logo-actions` | `gap: 0.25rem` | review |  |
| `styles.css` | 10685 | `.logo-actions` | `margin-top: 0.4rem` | review |  |
| `styles.css` | 10689 | `.logo-actions .btn` | `padding: 3px 6px` | review |  |
| `styles.css` | 10700 | `.logo-badge` | `padding: 0.1rem 0.4rem` | review |  |
| `styles.css` | 10701 | `.logo-badge` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10725 | `.logo-lightbox img` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10747 | `.rich-editor-toolbar` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10748 | `.rich-editor-toolbar` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10752 | `.rich-editor-toolbar` | `border-radius: 6px 6px 0 0` | review |  |
| `styles.css` | 10758 | `.rich-editor-toolbar button` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10765 | `.rich-editor-toolbar button` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10781 | `.rich-editor-toolbar select` | `height: 32px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10782 | `.rich-editor-toolbar select` | `padding: 4px 8px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10784 | `.rich-editor-toolbar select` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10792 | `.toolbar-separator` | `height: 24px` | review |  |
| `styles.css` | 10794 | `.toolbar-separator` | `margin: 0 4px` | review |  |
| `styles.css` | 10798 | `.rich-editor-content` | `min-height: 200px` | review |  |
| `styles.css` | 10799 | `.rich-editor-content` | `max-height: 400px` | review |  |
| `styles.css` | 10801 | `.rich-editor-content` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10803 | `.rich-editor-content` | `border-radius: 0 0 6px 6px` | review |  |
| `styles.css` | 10823 | `.rich-editor-content p` | `margin: 0 0 8px 0` | review |  |
| `styles.css` | 10828 | `.rich-editor-content ol` | `margin: 8px 0` | review |  |
| `styles.css` | 10829 | `.rich-editor-content ol` | `padding-left: 24px` | review |  |
| `styles.css` | 10834 | `.rich-editor-content h4` | `margin: 12px 0 8px 0` | review |  |
| `styles.css` | 10841 | `.attachment-preview-list` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10842 | `.attachment-preview-list` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10848 | `.attachment-preview-item` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10849 | `.attachment-preview-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 10852 | `.attachment-preview-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10878 | `.attachment-preview-item .remove-attachment` | `height: 24px` | review |  |
| `styles.css` | 10897 | `.message-attachments` | `margin-top: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10898 | `.message-attachments` | `padding-top: 16px` | review |  |
| `styles.css` | 10904 | `.message-attachments > strong` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10915 | `.attachment-list` | `gap: 6px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10925 | `.attachment-link` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10926 | `.attachment-link` | `padding: 8px 12px` | review |  |
| `styles.css` | 10929 | `.attachment-link` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10956 | `.attachment-image-preview` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10957 | `.attachment-image-preview` | `margin-top: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10962 | `.attachment-image-preview .preview-thumb` | `height: 90px` | review |  |
| `styles.css` | 10964 | `.attachment-image-preview .preview-thumb` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 10978 | `.attachment-actions` | `gap: 4px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 10979 | `.attachment-actions` | `margin-left: 8px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 10984 | `.attachment-actions button` | `height: 28px` | token-candidate | --ui-control-height or calc(var(--ui-control-height) +/- npx) |
| `styles.css` | 10991 | `.attachment-actions button` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11020 | `.image-lightbox-overlay img` | `max-height: 90vh` | review |  |
| `styles.css` | 11022 | `.image-lightbox-overlay img` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11049 | `.existing-attachment-item` | `gap: 10px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11050 | `.existing-attachment-item` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11053 | `.existing-attachment-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11066 | `.existing-attachment-item .existing-badge` | `padding: 1px 6px` | review |  |
| `styles.css` | 11067 | `.existing-attachment-item .existing-badge` | `border-radius: 3px` | review |  |
| `styles.css` | 11073 | `.badge-sm` | `padding: 2px 6px` | review |  |
| `styles.css` | 11076 | `.badge-sm` | `border-radius: 4px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11111 | `.message-reply-info` | `margin-top: 16px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11112 | `.message-reply-info` | `padding: 10px 14px` | review |  |
| `styles.css` | 11114 | `.message-reply-info` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11120 | `.message-reply-info i` | `margin-right: 6px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11128 | `.info-box` | `padding: 1rem` | review |  |
| `styles.css` | 11131 | `.info-box` | `margin-bottom: 1rem` | review |  |
| `styles.css` | 11153 | `.settings-section .section-desc` | `margin: -8px 0 16px` | review |  |
| `styles.css` | 11181 | `.toggle-control` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11188 | `.toggle-control input[type="checkbox"]` | `height: 1px` | review |  |
| `styles.css` | 11198 | `.toggle-switch` | `height: 24px` | review |  |
| `styles.css` | 11200 | `.toggle-switch` | `border-radius: 24px` | review |  |
| `styles.css` | 11211 | `.toggle-switch::after` | `height: 18px` | review |  |
| `styles.css` | 11234 | `.settings-note-list` | `margin: 4px 0 0` | review |  |
| `styles.css` | 11235 | `.settings-note-list` | `padding-left: 20px` | review |  |
| `styles.css` | 11242 | `.settings-note-list li + li` | `margin-top: 4px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11247 | `.system-update-upload-grid` | `margin-bottom: 10px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11253 | `.system-update-maintenance-row` | `gap: 10px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11255 | `.system-update-maintenance-row` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11256 | `.system-update-maintenance-row` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11258 | `.system-update-maintenance-row` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11265 | `.system-update-maintenance-status` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11272 | `.system-update-actions` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11273 | `.system-update-actions` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11278 | `.system-update-status` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11279 | `.system-update-status` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11280 | `.system-update-status` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11304 | `.system-rollback-panel` | `margin: 0 0 12px` | review |  |
| `styles.css` | 11305 | `.system-rollback-panel` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11307 | `.system-rollback-panel` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11312 | `.system-rollback-panel h5` | `margin: 0 0 8px` | review |  |
| `styles.css` | 11320 | `.system-rollback-controls` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11333 | `.system-update-meta` | `gap: 8px 12px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11334 | `.system-update-meta` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11335 | `.system-update-meta` | `padding: 10px 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11337 | `.system-update-meta` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11345 | `.system-update-meta-item` | `gap: 8px` | token-candidate | --ui-section-gap / --ui-metric-gap |
| `styles.css` | 11359 | `.system-update-change-list h5` | `margin: 0 0 8px` | review |  |
| `styles.css` | 11366 | `.system-update-change-list ul` | `padding-left: 18px` | review |  |
| `styles.css` | 11370 | `.system-update-change-list li` | `margin: 4px 0` | review |  |
| `styles.css` | 11423 | `.production-schedule-tab-panel` | `min-height: 520px` | review |  |
| `styles.css` | 11467 | `.production-schedule-column` | `min-height: 440px` | review |  |
| `styles.css` | 11534 | `.schedule-run-label` | `margin-top: 2px` | review |  |
| `styles.css` | 11556 | `.work-order-type-badge` | `padding: 3px 8px` | review |  |
| `styles.css` | 11558 | `.work-order-type-badge` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11590 | `.work-order-second-screening-empty` | `gap: 0.75rem` | review |  |
| `styles.css` | 11596 | `.work-order-second-screening-cards` | `gap: 0.75rem` | review |  |
| `styles.css` | 11602 | `.work-order-second-screening-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11604 | `.work-order-second-screening-card` | `gap: 0.4rem` | review |  |
| `styles.css` | 11605 | `.work-order-second-screening-card` | `padding: 0.75rem` | review |  |
| `styles.css` | 11611 | `.work-order-inline-rescreen-card` | `border-radius: 10px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11613 | `.work-order-inline-rescreen-card` | `gap: 0.85rem` | review |  |
| `styles.css` | 11614 | `.work-order-inline-rescreen-card` | `padding: 1rem` | review |  |
| `styles.css` | 11621 | `.work-order-inline-rescreen-actions` | `gap: 0.75rem` | review |  |
| `styles.css` | 11626 | `.work-order-inline-rescreen-header p` | `margin: 0.2rem 0 0` | review |  |
| `styles.css` | 11632 | `.work-order-inline-rescreen-actions` | `padding-top: 0.75rem` | review |  |
| `styles.css` | 11637 | `.work-order-second-screening-detail-block` | `margin-top: 0.1rem` | review |  |
| `styles.css` | 11638 | `.work-order-second-screening-detail-block` | `padding-top: 0.45rem` | review |  |
| `styles.css` | 11644 | `.work-order-second-screening-inline-list` | `gap: 0.35rem 0.75rem` | review |  |
| `styles.css` | 11651 | `.work-order-second-screening-detail-list` | `gap: 0.35rem` | review |  |
| `styles.css` | 11653 | `.work-order-second-screening-detail-list` | `margin: 0.45rem 0 0` | review |  |
| `styles.css` | 11661 | `.work-order-second-screening-detail-item` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11663 | `.work-order-second-screening-detail-item` | `gap: 0.15rem` | review |  |
| `styles.css` | 11664 | `.work-order-second-screening-detail-item` | `padding: 0.45rem 0.55rem` | review |  |
| `styles.css` | 11680 | `.rescreen-image-upload-panel` | `gap: 0.75rem` | review |  |
| `styles.css` | 11685 | `.rescreen-image-grid` | `gap: 0.75rem` | review |  |
| `styles.css` | 11692 | `.rescreen-image-card` | `border-radius: 8px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11694 | `.rescreen-image-card` | `gap: 0.5rem` | review |  |
| `styles.css` | 11695 | `.rescreen-image-card` | `padding: 0.65rem` | review |  |
| `styles.css` | 11700 | `.rescreen-image-card img` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11701 | `.rescreen-image-card img` | `height: 120px` | review |  |
| `styles.css` | 11721 | `.form-section-heading` | `gap: 0.75rem` | review |  |
| `styles.css` | 11743 | `.schedule-status-chip` | `padding: 3px 8px` | review |  |
| `styles.css` | 11745 | `.schedule-status-chip` | `border-radius: 6px` | token-candidate | --ui-radius-control / --ui-radius-card / --ui-radius-panel / --ui-radius-pill |
| `styles.css` | 11753 | `.production-time-content` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11757 | `.production-status-content` | `padding: 12px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11770 | `.machine-status-detail-wrap` | `padding: 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |
| `styles.css` | 11786 | `.machine-status-detail-empty` | `padding: 12px 10px` | review |  |
| `styles.css` | 11796 | `.schedule-empty` | `padding: 18px 10px` | review |  |
| `styles.css` | 11804 | `.schedule-live-time-row` | `margin-bottom: 12px` | token-candidate | --ui-section-gap or component stack token |
| `styles.css` | 11805 | `.schedule-live-time-row` | `padding: 8px 10px` | token-candidate | --ui-control-padding-* / --ui-table-cell-padding-* / --ui-card-padding-* |

