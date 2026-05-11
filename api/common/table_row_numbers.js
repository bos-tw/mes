/**
 * Global table row number manager.
 *
 * Adds a hard, non-configurable row number column to every main module list.
 * This keeps row numbering in one place instead of making each module render
 * its own serial-number cells.
 */
(function() {
    'use strict';

    const HEADER_ATTR = 'data-hard-row-number';
    const CELL_ATTR = 'data-hard-row-number-cell';
    const MANAGED_ATTR = 'data-row-number-managed';
    const TABLE_SELECTOR = '[data-module] .table-section table.data-table';

    function getModuleRoot(table) {
        return table.closest('[data-module]');
    }

    function getPageStart(table) {
        const moduleRoot = getModuleRoot(table);
        const tableSection = table.closest('.table-section');
        const pagination = tableSection ? tableSection.querySelector('.pagination') : null;
        const paginationText = pagination ? pagination.textContent || '' : '';

        const rangeMatch = paginationText.match(/顯示\s*(\d+)\s*[-~～]/);
        if (rangeMatch) {
            const first = Number.parseInt(rangeMatch[1], 10);
            return Number.isFinite(first) && first > 0 ? first - 1 : 0;
        }

        const pageMatch = paginationText.match(/第\s*(\d+)\s*\/\s*\d+\s*頁/);
        if (!pageMatch || !moduleRoot) {
            return 0;
        }

        const page = Number.parseInt(pageMatch[1], 10);
        const perPageSelect = moduleRoot.querySelector('.filter-form select[name="perPage"]');
        const perPage = perPageSelect ? Number.parseInt(perPageSelect.value, 10) : Number.NaN;

        if (!Number.isFinite(page) || page < 1 || !Number.isFinite(perPage) || perPage < 1) {
            return 0;
        }

        return (page - 1) * perPage;
    }

    function getHeaderRow(table) {
        return table.tHead ? table.tHead.querySelector('tr') : table.querySelector('thead tr');
    }

    function ensureHeader(table) {
        const headerRow = getHeaderRow(table);
        if (!headerRow) {
            return false;
        }

        const firstHeader = headerRow.firstElementChild;
        if (firstHeader && firstHeader.hasAttribute(HEADER_ATTR)) {
            return true;
        }

        const header = document.createElement('th');
        header.className = 'row-number-col';
        header.textContent = '序號';
        header.setAttribute(HEADER_ATTR, 'true');
        headerRow.insertBefore(header, firstHeader);
        return true;
    }

    function isPlaceholderRow(row) {
        const cells = Array.from(row.cells || []);
        if (cells.length !== 1) {
            return false;
        }

        const cell = cells[0];
        const text = (cell.textContent || '').trim();
        return cell.classList.contains('text-center') || /載入中|尚無|無資料|查無/.test(text);
    }

    function syncPlaceholderColspan(table, row) {
        const headerRow = getHeaderRow(table);
        const headerCount = headerRow ? headerRow.cells.length : 0;
        if (headerCount > 0 && row.cells[0]) {
            if (row.cells[0].colSpan !== headerCount) {
                row.cells[0].colSpan = headerCount;
            }
        }
    }

    function ensureBodyRows(table) {
        const tbody = table.tBodies && table.tBodies[0] ? table.tBodies[0] : table.querySelector('tbody');
        if (!tbody) {
            return;
        }

        const pageStart = getPageStart(table);
        let rowNumber = 1;

        Array.from(tbody.rows).forEach((row) => {
            if (row.dataset.skipRowNumber === 'true') {
                return;
            }

            if (isPlaceholderRow(row)) {
                syncPlaceholderColspan(table, row);
                return;
            }

            const firstCell = row.firstElementChild;
            let numberCell = firstCell && firstCell.hasAttribute(CELL_ATTR) ? firstCell : null;

            if (!numberCell) {
                numberCell = document.createElement('td');
                numberCell.className = 'row-number-col';
                numberCell.setAttribute(CELL_ATTR, 'true');
                row.insertBefore(numberCell, firstCell);
            }

            const nextNumber = String(pageStart + rowNumber);
            if (numberCell.textContent !== nextNumber) {
                numberCell.textContent = nextNumber;
            }
            rowNumber += 1;
        });
    }

    function applyRowNumbers(table) {
        if (!(table instanceof HTMLTableElement)) {
            return;
        }

        if (table.dataset.noHardRowNumber === 'true' || table.closest('.modal-window')) {
            return;
        }

        if (!ensureHeader(table)) {
            return;
        }

        table.setAttribute(MANAGED_ATTR, 'true');
        ensureBodyRows(table);
    }

    function applyAll(root = document) {
        root.querySelectorAll(TABLE_SELECTOR).forEach(applyRowNumbers);
    }

    function init() {
        applyAll();

        const observer = new MutationObserver((mutations) => {
            const pendingTables = new Set();

            mutations.forEach((mutation) => {
                const target = mutation.target;
                if (target instanceof Element) {
                    const table = target.closest ? target.closest(TABLE_SELECTOR) : null;
                    if (table) {
                        pendingTables.add(table);
                    }
                }

                mutation.addedNodes.forEach((node) => {
                    if (!(node instanceof Element)) {
                        return;
                    }

                    if (node.matches && node.matches(TABLE_SELECTOR)) {
                        pendingTables.add(node);
                    }

                    if (node.querySelectorAll) {
                        node.querySelectorAll(TABLE_SELECTOR).forEach((table) => pendingTables.add(table));
                    }
                });
            });

            pendingTables.forEach(applyRowNumbers);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        window.TableRowNumbers = {
            apply: applyRowNumbers,
            applyAll,
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
