/**
 * 通用欄位顯示/隱藏管理器 v2.0
 *
 * 設計原則：
 * 1. 自動初始化 - 使用 MutationObserver 監聽 DOM，模組載入時自動初始化
 * 2. 零耦合 - 各模組 JS 不需要任何欄位管理器相關程式碼
 * 3. 標記驅動 - 只需在 HTML 中加入正確的 data 屬性即可
 * 4. 防重複 - 使用 WeakMap 追蹤已初始化的元素，避免重複初始化
 *
 * ============================================================
 * 【新增模組時必讀】請參考 .github/copilot-instructions.md
 * ============================================================
 *
 * 快速指南：
 * 1. 在模組 HTML 加入：
 *    - data-module="模組名稱"
 *    - data-模組名稱-column-selector (欄位選擇器)
 *    - data-模組名稱-table (表格)
 * 2. 表格更新後呼叫 manager.onTableUpdated()
 *
 * 注意：模組名稱用 snake_case，data 屬性用 kebab-case
 * 例如：order_items -> data-order-items-table
 */

(function() {
    'use strict';

    // 使用 WeakMap 追蹤已初始化的模組元素，避免記憶體洩漏
    const initializedModules = new WeakMap();

    /**
     * 共用表格欄寬管理器
     *
     * - 拖曳標題分隔線可調整欄寬
     * - 雙擊分隔線可依標題與目前資料自動適寬
     * - 序號、勾選與操作欄維持系統固定寬度
     * - 只有實際調整或已有儲存設定時才啟用 fixed layout，避免改變既有表格初始版面
     */
    const TableColumnResizer = (() => {
        const TABLE_SELECTOR = '[data-module] .table-section table.data-table';
        const STORAGE_PREFIX = 'mes_table_column_widths:';
        const tableStates = new WeakMap();
        const pendingTables = new Set();
        let refreshFrame = null;
        let measureElement = null;

        function readCssPixel(name, fallback) {
            const value = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
            return Number.isFinite(value) && value > 0 ? value : fallback;
        }

        function getMinimumWidth() {
            return readCssPixel('--ui-table-column-min-width', 72);
        }

        function getMaximumWidth() {
            return Math.max(getMinimumWidth(), readCssPixel('--ui-table-column-max-width', 480));
        }

        function clampWidth(width) {
            return Math.min(getMaximumWidth(), Math.max(getMinimumWidth(), Math.round(width)));
        }

        function getHeaders(table) {
            if (!table.tHead || table.tHead.rows.length !== 1) {
                return [];
            }
            return Array.from(table.tHead.rows[0].cells).filter((cell) => cell.tagName === 'TH');
        }

        function isSupportedTable(table) {
            return table instanceof HTMLTableElement
                && table.matches(TABLE_SELECTOR)
                && !table.closest('.modal-window')
                && table.dataset.noColumnResize !== 'true'
                && getHeaders(table).length > 1;
        }

        function isFixedHeader(header) {
            const label = getHeaderLabel(header);
            return header.matches([
                '[data-hard-row-number]',
                '[data-no-column-resize]',
                '.row-number-col',
                '.checkbox-col',
                '.actions-col',
                '.table-actions',
                '[data-column="actions"]'
            ].join(',')) || label === '操作';
        }

        function getHeaderLabel(header) {
            const clone = header.cloneNode(true);
            clone.querySelectorAll('[data-column-resize-handle], i').forEach((element) => element.remove());
            return clone.textContent.replace(/\s+/g, ' ').trim() || '未命名';
        }

        function getColumnKey(header, index) {
            if (header.dataset.hardRowNumber !== undefined || header.classList.contains('row-number-col')) {
                return '__row_number';
            }
            if (header.classList.contains('checkbox-col')) {
                return '__checkbox';
            }
            if (isFixedHeader(header)) {
                return '__actions';
            }
            if (header.dataset.column) {
                return `column:${header.dataset.column}`;
            }
            if (header.dataset.sort) {
                return `sort:${header.dataset.sort}`;
            }
            return `position:${index}:${getHeaderLabel(header)}`;
        }

        function getTableIdentity(table) {
            const moduleRoot = table.closest('[data-module]');
            const moduleName = moduleRoot?.dataset.module || 'unknown';
            const tableAttribute = Array.from(table.attributes).find((attribute) => (
                attribute.name.startsWith('data-')
                && attribute.name.endsWith('-table')
            ));
            return `${moduleName}:${table.id || tableAttribute?.name || 'primary'}`;
        }

        function loadWidths(table) {
            try {
                const saved = localStorage.getItem(`${STORAGE_PREFIX}${getTableIdentity(table)}`);
                const parsed = saved ? JSON.parse(saved) : {};
                return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
            } catch (error) {
                console.warn('[TableColumnResizer] 載入欄寬設定失敗', error);
                return {};
            }
        }

        function saveWidths(table, widths) {
            try {
                localStorage.setItem(`${STORAGE_PREFIX}${getTableIdentity(table)}`, JSON.stringify(widths));
            } catch (error) {
                console.warn('[TableColumnResizer] 儲存欄寬設定失敗', error);
            }
        }

        function getState(table) {
            if (!tableStates.has(table)) {
                tableStates.set(table, {
                    active: false,
                    currentWidths: new Map(),
                    savedWidths: loadWidths(table)
                });
            }
            return tableStates.get(table);
        }

        function getFixedColumnMinimumWidth(table, header, index) {
            const headerWidth = Math.ceil(header.scrollWidth || header.getBoundingClientRect().width || 0);
            const columnKey = getColumnKey(header, index);
            if (columnKey === '__row_number') {
                const rowNumberWidth = Number.parseFloat(getComputedStyle(header).minWidth);
                return Number.isFinite(rowNumberWidth) && rowNumberWidth > 0
                    ? Math.ceil(rowNumberWidth)
                    : headerWidth;
            }

            if (columnKey !== '__actions') {
                return Math.max(1, headerWidth);
            }

            const actionSize = readCssPixel('--ui-table-action-size', 24);
            const actionGap = readCssPixel('--ui-table-action-gap', 2);
            const cellPadding = readCssPixel('--ui-table-cell-padding-x', 6) * 2;
            const actionCells = Array.from(table.tBodies)
                .flatMap((body) => Array.from(body.rows))
                .map((row) => row.cells[index])
                .filter((cell) => cell && cell.colSpan === 1);

            const requiredWidth = actionCells.reduce((maximum, cell) => {
                const actionCount = cell.querySelectorAll('button, a').length;
                const buttonWidth = actionCount > 0
                    ? (actionCount * actionSize) + (Math.max(actionCount - 1, 0) * actionGap) + cellPadding
                    : 0;
                return Math.max(maximum, Math.ceil(cell.scrollWidth || 0), buttonWidth);
            }, headerWidth);

            return Math.max(getMinimumWidth(), requiredWidth);
        }

        function enforceFixedColumnWidths(table, headers, columns) {
            const state = getState(table);
            columns.forEach((column, index) => {
                const header = headers[index];
                if (!header || !isFixedHeader(header)) {
                    return;
                }

                const minimumWidth = getFixedColumnMinimumWidth(table, header, index);
                const currentWidth = Number.parseFloat(column.style.width) || 0;
                const isRowNumber = getColumnKey(header, index) === '__row_number';
                if ((isRowNumber && minimumWidth !== currentWidth) || (!isRowNumber && minimumWidth > currentWidth)) {
                    column.style.width = `${minimumWidth}px`;
                    state.currentWidths.set(getColumnKey(header, index), minimumWidth);
                }
            });
        }

        function createColgroup(table, headers, measuredWidths) {
            const state = getState(table);
            table.querySelector('colgroup[data-column-resizer-group]')?.remove();

            const colgroup = document.createElement('colgroup');
            colgroup.dataset.columnResizerGroup = '';
            headers.forEach((header, index) => {
                const key = getColumnKey(header, index);
                const savedWidth = Number(state.savedWidths[key]);
                const currentWidth = Number(state.currentWidths.get(key));
                const measuredWidth = Number(measuredWidths[index]);
                const fixedMinimumWidth = getFixedColumnMinimumWidth(table, header, index);
                const width = isFixedHeader(header)
                    ? key === '__row_number'
                        ? fixedMinimumWidth
                        : Math.max(
                            fixedMinimumWidth,
                            Math.round(measuredWidth || currentWidth || savedWidth || getMinimumWidth())
                        )
                    : currentWidth > 0
                        ? currentWidth
                        : savedWidth > 0
                            ? clampWidth(savedWidth)
                            : Math.max(1, Math.round(measuredWidth || getMinimumWidth()));
                const column = document.createElement('col');
                column.dataset.columnResizeKey = key;
                column.style.width = `${width}px`;
                state.currentWidths.set(key, width);
                colgroup.appendChild(column);
            });

            table.insertBefore(colgroup, table.firstChild);
            table.classList.add('table-column-resize-active');
            state.active = true;
            syncLayout(table);
        }

        function activate(table) {
            const state = getState(table);
            const headers = getHeaders(table);
            if (state.active || headers.length === 0) return state.active;
            if (table.getBoundingClientRect().width <= 0) return false;

            const measuredWidths = headers.map((header) => header.getBoundingClientRect().width);
            createColgroup(table, headers, measuredWidths);
            return true;
        }

        function structureMatches(table, headers) {
            const columns = Array.from(table.querySelectorAll('colgroup[data-column-resizer-group] > col'));
            return columns.length === headers.length && columns.every((column, index) => (
                column.dataset.columnResizeKey === getColumnKey(headers[index], index)
            ));
        }

        function syncLayout(table) {
            const state = getState(table);
            if (!state.active) return;

            const headers = getHeaders(table);
            const columns = Array.from(table.querySelectorAll('colgroup[data-column-resizer-group] > col'));
            let visibleWidth = 0;

            enforceFixedColumnWidths(table, headers, columns);

            columns.forEach((column, index) => {
                const header = headers[index];
                const isHidden = !header || header.classList.contains('hidden-column');
                column.classList.toggle('hidden-column', isHidden);
                if (!isHidden) {
                    visibleWidth += Number.parseFloat(column.style.width) || header.getBoundingClientRect().width;
                }
            });

            if (visibleWidth > 0) {
                table.style.width = `${Math.ceil(visibleWidth)}px`;
            }
        }

        function rebuildIfNeeded(table) {
            const state = getState(table);
            const headers = getHeaders(table);
            if (!state.active || structureMatches(table, headers)) {
                syncLayout(table);
                return;
            }

            const measuredWidths = headers.map((header, index) => {
                const key = getColumnKey(header, index);
                return state.currentWidths.get(key) || header.getBoundingClientRect().width;
            });
            createColgroup(table, headers, measuredWidths);
        }

        function updateHandleValue(table, index, width) {
            const header = getHeaders(table)[index];
            const handle = header?.querySelector('[data-column-resize-handle]');
            if (handle) {
                handle.setAttribute('aria-valuenow', String(Math.round(width)));
            }
        }

        function applyWidth(table, index, width, shouldPersist = false) {
            if (!activate(table)) return;
            rebuildIfNeeded(table);

            const headers = getHeaders(table);
            const header = headers[index];
            const column = table.querySelectorAll('colgroup[data-column-resizer-group] > col')[index];
            if (!header || !column || isFixedHeader(header)) return;

            const nextWidth = clampWidth(width);
            const key = getColumnKey(header, index);
            const state = getState(table);
            column.style.width = `${nextWidth}px`;
            state.currentWidths.set(key, nextWidth);
            updateHandleValue(table, index, nextWidth);
            syncLayout(table);

            if (shouldPersist) {
                state.savedWidths[key] = nextWidth;
                saveWidths(table, state.savedWidths);
            }
        }

        function getMeasureElement() {
            if (measureElement?.isConnected) return measureElement;
            measureElement = document.createElement('span');
            measureElement.className = 'table-column-measure';
            measureElement.setAttribute('aria-hidden', 'true');
            document.body.appendChild(measureElement);
            return measureElement;
        }

        function getCellText(cell) {
            const input = cell.querySelector('input, select, textarea');
            if (input) {
                return input.value || input.options?.[input.selectedIndex]?.text || input.placeholder || '';
            }
            const clone = cell.cloneNode(true);
            clone.querySelectorAll('[data-column-resize-handle], i').forEach((element) => element.remove());
            return clone.textContent.replace(/\s+/g, ' ').trim();
        }

        function measureCell(cell) {
            const computed = getComputedStyle(cell);
            const measure = getMeasureElement();
            measure.style.font = computed.font;
            measure.style.fontWeight = computed.fontWeight;
            measure.style.letterSpacing = computed.letterSpacing;
            measure.style.textTransform = computed.textTransform;
            measure.textContent = getCellText(cell) || ' ';

            const horizontalSpacing = ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth']
                .reduce((sum, property) => sum + (Number.parseFloat(computed[property]) || 0), 0);
            const inlineContent = Array.from(cell.children).reduce((sum, child) => {
                if (child.matches('i')) {
                    const childStyle = getComputedStyle(child);
                    return sum + child.getBoundingClientRect().width
                        + (Number.parseFloat(childStyle.marginLeft) || 0)
                        + (Number.parseFloat(childStyle.marginRight) || 0);
                }
                return sum;
            }, 0);
            return measure.getBoundingClientRect().width + horizontalSpacing + inlineContent + 2;
        }

        function autoFit(table, index) {
            const headers = getHeaders(table);
            const header = headers[index];
            if (!header || isFixedHeader(header)) return;

            const cells = [header];
            Array.from(table.tBodies).forEach((tbody) => {
                Array.from(tbody.rows).forEach((row) => {
                    if (row.hidden || row.classList.contains('hidden') || row.cells.length !== headers.length) return;
                    const cell = row.cells[index];
                    if (cell && !cell.classList.contains('hidden-column')) {
                        cells.push(cell);
                    }
                });
            });
            const width = Math.max(...cells.map(measureCell));
            applyWidth(table, index, width, true);
        }

        function bindHandle(table, header) {
            if (header.querySelector('[data-column-resize-handle]')) return;

            const handle = document.createElement('span');
            const label = getHeaderLabel(header);
            handle.className = 'table-column-resize-handle';
            handle.dataset.columnResizeHandle = '';
            handle.setAttribute('role', 'separator');
            handle.setAttribute('aria-label', `調整「${label}」欄寬`);
            handle.setAttribute('aria-orientation', 'vertical');
            handle.setAttribute('aria-valuemin', String(getMinimumWidth()));
            handle.setAttribute('aria-valuemax', String(getMaximumWidth()));
            handle.setAttribute('aria-valuenow', String(Math.round(header.getBoundingClientRect().width)));
            handle.setAttribute('tabindex', '0');
            handle.title = '拖曳調整欄寬；雙擊自動適寬';

            handle.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
            });
            handle.addEventListener('dblclick', (event) => {
                event.preventDefault();
                event.stopPropagation();
                autoFit(table, getHeaders(table).indexOf(header));
            });
            handle.addEventListener('keydown', (event) => {
                const index = getHeaders(table).indexOf(header);
                if (index < 0) return;
                if (event.key === 'Enter') {
                    event.preventDefault();
                    event.stopPropagation();
                    autoFit(table, index);
                    return;
                }
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                event.preventDefault();
                event.stopPropagation();
                activate(table);
                const column = table.querySelectorAll('colgroup[data-column-resizer-group] > col')[index];
                const currentWidth = Number.parseFloat(column?.style.width) || header.getBoundingClientRect().width;
                const direction = event.key === 'ArrowRight' ? 1 : -1;
                applyWidth(table, index, currentWidth + direction * (event.shiftKey ? 4 : 16), true);
            });
            handle.addEventListener('pointerdown', (event) => {
                if (event.button !== 0) return;
                event.preventDefault();
                event.stopPropagation();
                activate(table);

                const index = getHeaders(table).indexOf(header);
                const column = table.querySelectorAll('colgroup[data-column-resizer-group] > col')[index];
                if (index < 0 || !column) return;

                const startX = event.clientX;
                const startWidth = Number.parseFloat(column.style.width) || header.getBoundingClientRect().width;
                handle.setPointerCapture(event.pointerId);
                handle.classList.add('is-active');
                document.body.classList.add('is-resizing-table-column');

                const onPointerMove = (moveEvent) => {
                    applyWidth(table, index, startWidth + moveEvent.clientX - startX);
                };
                const finishResize = (finishEvent) => {
                    handle.removeEventListener('pointermove', onPointerMove);
                    handle.removeEventListener('pointerup', finishResize);
                    handle.removeEventListener('pointercancel', finishResize);
                    handle.classList.remove('is-active');
                    document.body.classList.remove('is-resizing-table-column');
                    if (handle.hasPointerCapture(finishEvent.pointerId)) {
                        handle.releasePointerCapture(finishEvent.pointerId);
                    }
                    const activeColumn = table.querySelectorAll('colgroup[data-column-resizer-group] > col')[index];
                    const finalWidth = Number.parseFloat(activeColumn?.style.width);
                    if (Number.isFinite(finalWidth)) {
                        applyWidth(table, index, finalWidth, true);
                    }
                };
                handle.addEventListener('pointermove', onPointerMove);
                handle.addEventListener('pointerup', finishResize);
                handle.addEventListener('pointercancel', finishResize);
            });

            header.classList.add('table-column-resizable');
            header.appendChild(handle);
        }

        function refresh(table) {
            if (!isSupportedTable(table)) return;
            const headers = getHeaders(table);
            headers.forEach((header) => {
                if (!isFixedHeader(header)) {
                    bindHandle(table, header);
                }
            });

            const state = getState(table);
            if (!state.active && Object.keys(state.savedWidths).some((key) => (
                headers.some((header, index) => getColumnKey(header, index) === key)
            ))) {
                activate(table);
            } else {
                rebuildIfNeeded(table);
            }
        }

        function scan(root = document) {
            if (root instanceof HTMLTableElement && root.matches(TABLE_SELECTOR)) {
                refresh(root);
            }
            root.querySelectorAll?.(TABLE_SELECTOR).forEach(refresh);
        }

        function schedule(table) {
            if (!isSupportedTable(table)) return;
            pendingTables.add(table);
            if (refreshFrame !== null) return;
            refreshFrame = requestAnimationFrame(() => {
                pendingTables.forEach((pendingTable) => {
                    if (pendingTable.isConnected) refresh(pendingTable);
                });
                pendingTables.clear();
                refreshFrame = null;
            });
        }

        function setupObserver() {
            const tabContentArea = document.getElementById('tab-content-area');
            if (!tabContentArea) {
                setTimeout(setupObserver, 100);
                return;
            }

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    const targetTable = mutation.target.closest?.('table');
                    if (targetTable) schedule(targetTable);
                    if (mutation.type === 'attributes') {
                        scan(mutation.target);
                    }
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType !== Node.ELEMENT_NODE) return;
                        const addedTable = node.matches?.('table') ? node : node.closest?.('table');
                        if (addedTable) schedule(addedTable);
                        scan(node);
                    });
                });
            });
            observer.observe(tabContentArea, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'hidden']
            });
        }

        function init() {
            scan();
            setupObserver();
        }

        return { init, refresh, scan };
    })();

    /**
     * 欄位管理器類別
     */
    class ColumnManager {
        /**
         * @param {string} moduleName - 模組名稱
         * @param {HTMLElement} moduleRoot - 模組根元素
         */
        constructor(moduleName, moduleRoot) {
            this.moduleName = moduleName;
            this.moduleRoot = moduleRoot;
            this.storageKey = `${moduleName}_visible_columns`;

            // 將底線轉換為連字號用於 data 屬性
            const dataAttrName = moduleName.replace(/_/g, '-');

            // 在模組範圍內查找元素
            this.columnSelector = moduleRoot.querySelector(`[data-${dataAttrName}-column-selector]`);
            this.table = moduleRoot.querySelector(`[data-${dataAttrName}-table]`);

            if (!this.columnSelector || !this.table) {
                // 不是所有模組都有欄位設定功能，這是正常的
                this.initialized = false;
                return;
            }

            this.initialized = true;
            this._init();
        }

        _init() {
            this._loadSettings();
            this._bindEvents();
            this.applyColumnVisibility();
            console.debug(`[ColumnManager] ${this.moduleName}: 初始化完成`);
        }

        _bindEvents() {
            // 切換欄位選擇器
            this._bindAction('toggle-column-selector', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._toggleColumnSelector(e.currentTarget);
            });

            // 關閉欄位選擇器
            this._bindAction('close-column-selector', () => {
                this._closeColumnSelector();
            });

            // 全選
            this._bindAction('select-all-columns', () => {
                this._selectAll();
            });

            // 全不選
            this._bindAction('deselect-all-columns', () => {
                this._deselectAll();
            });

            // 套用設定
            this._bindAction('apply-column-settings', () => {
                this._applySettings();
            });

            // 點擊外部關閉（使用 capture 階段以確保優先處理）
            this._outsideClickHandler = (e) => {
                if (!this.columnSelector) return;

                // 統一使用 hidden class 判斷可見性
                if (this.columnSelector.classList.contains('hidden')) return;

                // 檢查點擊是否在選擇器內部或 toggle 按鈕上
                if (this.columnSelector.contains(e.target)) return;
                if (e.target.closest('[data-action="toggle-column-selector"]')) return;

                this._closeColumnSelector();
            };
            document.addEventListener('click', this._outsideClickHandler, true);
        }

        /**
         * 在模組範圍內綁定 data-action 事件
         */
        _bindAction(actionName, handler) {
            const elements = this.moduleRoot.querySelectorAll(`[data-action="${actionName}"]`);
            elements.forEach(el => {
                el.addEventListener('click', handler);
            });
        }

        _toggleColumnSelector(triggerButton) {
            if (this.columnSelector) {
                // 統一用 hidden class 控制顯隱，不設定 inline display style
                // 這樣 CSS 的 display: flex 才能正確生效，避免覆蓋為 block 導致佈局錯誤
                const isHidden = this.columnSelector.classList.contains('hidden');

                if (isHidden) {
                    this.columnSelector.classList.remove('hidden');
                    this.columnSelector.style.display = '';  // 清除 inline style，讓 CSS flex 生效
                    this._positionColumnSelector(triggerButton);
                } else {
                    this._closeColumnSelector();
                }
            }
        }

        _positionColumnSelector(triggerButton) {
            if (!this.columnSelector || !triggerButton) return;

            const triggerRect = triggerButton.getBoundingClientRect();
            const panelWidth = this.columnSelector.offsetWidth || 280;
            const panelHeight = this.columnSelector.offsetHeight || 320;
            const viewportPadding = 12;
            const left = Math.max(
                viewportPadding,
                Math.min(triggerRect.right - panelWidth, window.innerWidth - panelWidth - viewportPadding)
            );
            const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
            const spaceAbove = triggerRect.top - viewportPadding;
            const openAbove = spaceBelow < Math.min(panelHeight, 240) && spaceAbove > spaceBelow;
            const availableHeight = Math.max(160, openAbove ? spaceAbove - 8 : spaceBelow - 8);
            const top = openAbove
                ? Math.max(viewportPadding, triggerRect.top - Math.min(panelHeight, availableHeight) - 8)
                : triggerRect.bottom + 8;

            this.columnSelector.style.top = `${top}px`;
            this.columnSelector.style.left = `${left}px`;
            this.columnSelector.style.right = 'auto';
            this.columnSelector.style.transform = 'none';
            this.columnSelector.style.maxHeight = `${availableHeight}px`;
        }

        _closeColumnSelector() {
            if (this.columnSelector) {
                this.columnSelector.classList.add('hidden');
                this.columnSelector.style.display = '';  // 清除 inline style
                this.columnSelector.style.top = '';
                this.columnSelector.style.left = '';
                this.columnSelector.style.right = '';
                this.columnSelector.style.transform = '';
                this.columnSelector.style.maxHeight = '';
            }
        }

        _selectAll() {
            const checkboxes = this.columnSelector.querySelectorAll('input[type="checkbox"][data-column]');
            checkboxes.forEach(cb => cb.checked = true);
        }

        _deselectAll() {
            const checkboxes = this.columnSelector.querySelectorAll('input[type="checkbox"][data-column]');
            checkboxes.forEach(cb => cb.checked = false);
        }

        _applySettings() {
            this._saveSettings();
            this.applyColumnVisibility();
            this._closeColumnSelector();
        }

        _loadSettings() {
            try {
                const saved = localStorage.getItem(this.storageKey);
                if (saved) {
                    const visibleColumns = JSON.parse(saved);
                    const checkboxes = this.columnSelector.querySelectorAll('input[type="checkbox"][data-column]');
                    checkboxes.forEach(cb => {
                        cb.checked = visibleColumns.includes(cb.dataset.column);
                    });
                }
            } catch (error) {
                console.warn(`[ColumnManager] ${this.moduleName}: 載入設定失敗`, error);
            }
        }

        _saveSettings() {
            try {
                const checkboxes = this.columnSelector.querySelectorAll('input[type="checkbox"][data-column]:checked');
                const visibleColumns = Array.from(checkboxes).map(cb => cb.dataset.column);
                localStorage.setItem(this.storageKey, JSON.stringify(visibleColumns));
            } catch (error) {
                console.warn(`[ColumnManager] ${this.moduleName}: 儲存設定失敗`, error);
            }
        }

        /**
         * 套用欄位可見性到表格
         * 這是公開方法，供外部在表格更新後調用
         */
        applyColumnVisibility() {
            if (!this.table || !this.columnSelector) return;

            const checkboxes = this.columnSelector.querySelectorAll('input[type="checkbox"][data-column]');
            const allThs = Array.from(this.table.querySelectorAll('thead th'));

            checkboxes.forEach(checkbox => {
                const column = checkbox.dataset.column;
                const isVisible = checkbox.checked;

                // 找到對應的 th 元素
                const thElement = allThs.find(th => th.dataset.column === column);
                if (!thElement) return;

                // 計算這個 th 在所有 th 中的索引位置
                const thIndex = allThs.indexOf(thElement);

                // 顯示/隱藏 th
                thElement.classList.toggle('hidden-column', !isVisible);

                // 顯示/隱藏對應的 td
                const tbody = this.table.tBodies && this.table.tBodies[0] ? this.table.tBodies[0] : this.table.querySelector('tbody');
                const trs = tbody ? Array.from(tbody.rows) : [];
                trs.forEach(tr => {
                    if (tr.dataset.columnManagerSkip === 'true') {
                        return;
                    }

                    const tds = tr.querySelectorAll('td');
                    const td = tds[thIndex];
                    if (td) {
                        td.classList.toggle('hidden-column', !isVisible);
                    }
                });
            });

            TableColumnResizer.refresh(this.table);
        }

        /**
         * 當表格內容更新時調用此方法
         * 使用 requestAnimationFrame 確保 DOM 已更新
         */
        onTableUpdated() {
            requestAnimationFrame(() => {
                this.applyColumnVisibility();
            });
        }

        /**
         * 清理資源（當模組被移除時調用）
         */
        destroy() {
            if (this._outsideClickHandler) {
                document.removeEventListener('click', this._outsideClickHandler, true);
            }
        }
    }

    /**
     * 欄位管理器自動初始化系統
     */
    const ColumnManagerAutoInit = {
        /**
         * 嘗試初始化指定的模組元素
         */
        initModule(moduleRoot) {
            // 檢查是否已初始化
            if (initializedModules.has(moduleRoot)) {
                return initializedModules.get(moduleRoot);
            }

            const moduleName = moduleRoot.dataset.module;
            if (!moduleName) return null;

            // 建立欄位管理器
            const manager = new ColumnManager(moduleName, moduleRoot);

            if (manager.initialized) {
                // 儲存到 WeakMap
                initializedModules.set(moduleRoot, manager);

                // 同時設定到 window 供外部存取（向後相容）
                const managerKey = this._getManagerKey(moduleName);
                window[managerKey] = manager;

                return manager;
            }

            return null;
        },

        /**
         * 取得管理器在 window 上的 key
         * 既有模組沿用舊全域名稱；新模組自動轉成 camelCase。
         */
        _getManagerKey(moduleName) {
            // 模組名稱 -> window 變數名稱 (camelCase + ColumnManager)
            const keyMap = {
                'customers': 'customerColumnManager',
                'suppliers': 'supplierColumnManager',
                'orders': 'orderColumnManager',
                'order_items': 'orderItemColumnManager',
                'employees': 'employeeColumnManager',
                'machines': 'machineColumnManager',
                'tools': 'toolColumnManager',
                'screening_items': 'screeningItemColumnManager',
                'screening_services': 'screeningServiceColumnManager',
                'work_orders': 'workOrderColumnManager',
                'inventory_items': 'inventoryItemColumnManager',
                'audit_logs': 'auditLogColumnManager',
                'companies': 'companyColumnManager',
                'departments': 'departmentColumnManager',
                'shipping_orders': 'shippingOrderColumnManager',
                'shipping_order_items': 'shippingOrderItemColumnManager',
                'inventory_transactions': 'inventoryTransactionColumnManager',
                'production_quality_records': 'productionQualityRecordsColumnManager',
                'defect_history_records': 'defectHistoryRecordColumnManager',
                'return_orders': 'returnOrderColumnManager',
                'roles': 'roleColumnManager',
                'permissions': 'permissionColumnManager',
                'role_permissions': 'rolePermissionColumnManager',
                'lookup_domains': 'lookupDomainColumnManager',
                'number_sequences': 'numberSequenceColumnManager',
                'employee_roles': 'employeeRoleColumnManager',
                'calendar_event_participants': 'calendarEventParticipantColumnManager',
                'calendar_event_reminders': 'calendarEventReminderColumnManager',
                'daily_machine_inspection_items': 'dailyMachineInspectionItemColumnManager',
                'daily_machine_inspections': 'dailyMachineInspectionColumnManager',
                'dashboard_calendar_events': 'dashboardCalendarEventColumnManager',
                'machine_maintenance_tasks': 'machineMaintenanceTaskColumnManager',
                'production_records': 'productionRecordColumnManager',
                'quality_issue_reports': 'qualityIssueReportColumnManager',
                'shipping_quality_inspections': 'shippingQualityInspectionColumnManager',
                'system_parameters': 'systemParameterColumnManager',
                'work_order_first_piece_dimensions': 'workOrderFirstPieceDimensionColumnManager'
                // 新增模組時在此加入
            };
            const camelName = moduleName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            return keyMap[moduleName] || `${camelName}ColumnManager`;
        },

        /**
         * 掃描並初始化所有模組
         */
        scanAndInit() {
            document.querySelectorAll('[data-module]').forEach(moduleRoot => {
                this.initModule(moduleRoot);
            });
        },

        /**
         * 取得指定模組的管理器
         */
        getManager(moduleName) {
            const moduleRoot = document.querySelector(`[data-module="${moduleName}"]`);
            if (moduleRoot && initializedModules.has(moduleRoot)) {
                return initializedModules.get(moduleRoot);
            }
            return null;
        },

        /**
         * 取得指定元素的管理器
         */
        getManagerByElement(moduleRoot) {
            return initializedModules.get(moduleRoot) || null;
        }
    };

    /**
     * 設定 MutationObserver 監聽 DOM 變化
     */
    function setupObserver() {
        const tabContentArea = document.getElementById('tab-content-area');
        if (!tabContentArea) {
            // 如果還沒有 tab-content-area，稍後重試
            setTimeout(setupObserver, 100);
            return;
        }

        const observer = new MutationObserver((mutations) => {
            let needsScan = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 檢查新增的節點是否是模組或包含模組
                            if (node.dataset?.module || node.querySelector?.('[data-module]')) {
                                needsScan = true;
                                break;
                            }
                        }
                    }
                }
                if (needsScan) break;
            }

            if (needsScan) {
                // 使用 requestAnimationFrame 確保 DOM 完全更新
                requestAnimationFrame(() => {
                    ColumnManagerAutoInit.scanAndInit();
                });
            }
        });

        observer.observe(tabContentArea, {
            childList: true,
            subtree: true
        });

        console.debug('[ColumnManager] MutationObserver 已啟動');
    }

    /**
     * 初始化入口
     */
    function init() {
        // 先掃描現有的模組
        ColumnManagerAutoInit.scanAndInit();

        // 初始化所有主資料表的共用欄寬管理
        TableColumnResizer.init();

        // 設定 Observer 監聽新載入的模組
        setupObserver();
    }

    // 根據 DOM 狀態決定初始化時機
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========================================
    // 向後相容 API（保留給現有程式碼使用）
    // ========================================

    /**
     * 建立向後相容的初始化函數
     * @deprecated 新程式碼不需要呼叫，會自動初始化
     */
    function createLegacyInit(moduleName) {
        return function(container = null) {
            let moduleRoot = null;

            if (container) {
                moduleRoot = container.querySelector(`[data-module="${moduleName}"]`);
                if (!moduleRoot && container.matches?.(`[data-module="${moduleName}"]`)) {
                    moduleRoot = container;
                }
            }

            if (!moduleRoot) {
                moduleRoot = document.querySelector(`[data-module="${moduleName}"]`);
            }

            if (moduleRoot) {
                return ColumnManagerAutoInit.initModule(moduleRoot);
            }
            return null;
        };
    }

    // 保留舊的 API 供向後相容（實際上會被自動初始化處理）
    window.initCustomerColumnManager = createLegacyInit('customers');
    window.initSupplierColumnManager = createLegacyInit('suppliers');
    window.initOrderColumnManager = createLegacyInit('orders');
    window.initOrderItemColumnManager = createLegacyInit('order_items');

    // 匯出新的 API
    window.ColumnManager = ColumnManager;
    window.ColumnManagerAutoInit = ColumnManagerAutoInit;
    window.TableColumnResizer = TableColumnResizer;

})();

