/**
 * Orders Module
 * 訂單管理模組
 */
(function() {
    'use strict';

    function initializeOrdersModule(container) {
        const moduleRoot = container.querySelector('[data-module="orders"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';
        // 欄位管理器由 column_manager.js 自動初始化，不需要手動呼叫

        const alertBox = moduleRoot.querySelector('[data-orders-alert]');
        const filterForm = moduleRoot.querySelector('[data-orders-filter]');
        const tableElement = moduleRoot.querySelector('[data-orders-table]');
        const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
        const paginationContainer = moduleRoot.querySelector('[data-orders-pagination]');
        const modalOverlay = moduleRoot.querySelector('[data-orders-modal]');
        const modalAlertBox = modalOverlay ? modalOverlay.querySelector('[data-orders-modal-alert]') : null;
        const modalForm = modalOverlay ? modalOverlay.querySelector('[data-orders-form]') : null;
        const modalTitle = modalOverlay ? modalOverlay.querySelector('[data-modal-title]') : null;
        const modalCloseButton = modalOverlay ? modalOverlay.querySelector('[data-action="close-modal"]') : null;
        const cancelButton = modalOverlay ? modalOverlay.querySelector('[data-action="cancel"]') : null;
        const resetFilterButton = moduleRoot.querySelector('[data-action="reset-filter"]');
        const openFilterDrawerButton = moduleRoot.querySelector('[data-action="open-filter-drawer"]');
        const closeFilterDrawerButton = moduleRoot.querySelector('[data-action="close-filter-drawer"]');
        const filterDrawer = moduleRoot.querySelector('[data-orders-filter-drawer]');
        const filterOverlay = moduleRoot.querySelector('[data-orders-filter-overlay]');
        const filterSummary = moduleRoot.querySelector('[data-orders-filter-summary]');
        const filterCountBadge = moduleRoot.querySelector('[data-orders-filter-count]');
        const orderDetailDrawer = moduleRoot.querySelector('[data-orders-detail-drawer]');
        const orderDetailOverlay = moduleRoot.querySelector('[data-orders-detail-overlay]');
        const orderDetailCloseButton = moduleRoot.querySelector('[data-action="close-order-detail"]');
        const orderDetailSubtitle = moduleRoot.querySelector('[data-orders-detail-subtitle]');
        const orderDetailLoading = moduleRoot.querySelector('[data-orders-detail-loading]');
        const orderDetailSections = moduleRoot.querySelector('[data-orders-detail-sections]');
        const orderDetailItemsBody = moduleRoot.querySelector('[data-orders-detail-items]');
        const screeningHistoryModal = moduleRoot.querySelector('[data-orders-screening-history-modal]');
        const screeningHistoryCloseButton = moduleRoot.querySelector('[data-action="close-screening-history"]');
        const screeningHistoryCustomer = moduleRoot.querySelector('[data-orders-screening-history-customer]');
        const screeningHistoryForm = moduleRoot.querySelector('[data-orders-screening-history-form]');
        const screeningHistorySearch = moduleRoot.querySelector('[data-orders-screening-history-search]');
        const screeningHistoryState = moduleRoot.querySelector('[data-orders-screening-history-state]');
        const screeningHistoryResults = moduleRoot.querySelector('[data-orders-screening-history-results]');
        const screeningHistoryRows = moduleRoot.querySelector('[data-orders-screening-history-rows]');

        const headerCreateButton = moduleRoot.querySelector('.content-header [data-action="create"]');
        const batchPrintButton = moduleRoot.querySelector('.content-header [data-action="batch-print"]');
        const selectionCountBadge = moduleRoot.querySelector('[data-selection-count]');

        // 批次匯出按鈕 - 動態包裹成 dropdown wrapper
        const batchExportButtonRaw = moduleRoot.querySelector('.content-header [data-action="batch-export"]');
        const exportCountBadge = moduleRoot.querySelector('[data-export-count]');
        let exportMenu = null;
        if (batchExportButtonRaw) {
            const wrapper = document.createElement('div');
            wrapper.className = 'btn-dropdown-wrapper';
            batchExportButtonRaw.parentNode.insertBefore(wrapper, batchExportButtonRaw);
            wrapper.appendChild(batchExportButtonRaw);
            exportMenu = document.createElement('div');
            exportMenu.className = 'dropdown-menu hidden';
            exportMenu.setAttribute('data-export-menu', '');
            exportMenu.innerHTML = `
                <button type="button" class="dropdown-item" data-action="batch-export-csv"><i class="fas fa-file-csv"></i> 匯出 CSV</button>
                <button type="button" class="dropdown-item" data-action="batch-export-pdf"><i class="fas fa-file-pdf"></i> 匯出 PDF</button>
            `;
            wrapper.appendChild(exportMenu);
        }
        const batchExportButton = batchExportButtonRaw;
        const exportCsvButton = exportMenu ? exportMenu.querySelector('[data-action="batch-export-csv"]') : null;
        const exportPdfButton = exportMenu ? exportMenu.querySelector('[data-action="batch-export-pdf"]') : null;

        const selectAllCheckbox = tableElement ? tableElement.querySelector('[data-action="select-all"]') : null;

        const orderNumberInput = modalForm ? modalForm.querySelector('input[name="order_number"]') : null;
        const customerIdSelect = modalForm ? modalForm.querySelector('select[name="customer_id"]') : null;
        const orderDateInput = modalForm ? modalForm.querySelector('input[name="order_date"]') : null;
        const expectedDeliveryDateInput = modalForm ? modalForm.querySelector('input[name="expected_delivery_date"]') : null;
        const expectedDeliveryPeriodSelect = modalForm ? modalForm.querySelector('select[name="expected_delivery_period"]') : null;
        const customerPoNumberInput = modalForm ? modalForm.querySelector('input[name="customer_po_number"]') : null;
        const statusSelect = modalForm ? modalForm.querySelector('select[name="status"]') : null;
        const totalAmountInput = modalForm ? modalForm.querySelector('input[name="total_amount"]') : null;
        const finalQuotePerMInput = modalForm ? modalForm.querySelector('input[name="final_quote_per_m"]') : null;
        const singlePpmInput = modalForm ? modalForm.querySelector('input[name="single_ppm"]') : null;
        const notesTextarea = modalForm ? modalForm.querySelector('textarea[name="notes"]') : null;

        const filterCustomerSelect = filterForm ? filterForm.querySelector('select[name="customer_id"]') : null;
        const filterStatusSelect = filterForm ? filterForm.querySelector('select[name="status"]') : null;

        const ordersCache = new Map();
        const selectedOrders = new Set();
        const expandedOrderIds = new Set();
        const orderItemsCache = new Map();
        const loadingOrderItemIds = new Set();
        const state = {
            page: 1,
            perPage: 10,
            totalPages: 1,
            total: 0,
            currentEditingId: null,
            formInitialSnapshot: null,
            sortField: null,
            sortDirection: 'asc',
            currentRows: [],
        };
        let isFormDirty = false;
        let dataSyncHelper = null;
        let orderDetailRequestSequence = 0;
        let screeningHistoryRequestSequence = 0;
        let screeningHistoryOrderId = null;
        let screeningHistoryItems = [];
        const orderItemSelection = window.OrdersOrderItemSelection?.create({
            showAlert,
            onCopied: async (orderId) => {
                await loadOrders(state.page);
                expandedOrderIds.add(orderId);
                await loadOrderItemsForOrder(orderId, true);
            },
        }) || null;

        // Modal 內部錯誤訊息顯示
        function showModalAlert(type, message, autoHide = true) {
            if (!modalAlertBox) {
                // 如果 modal alert 不存在,fallback 到頁面 alert
                showAlert(type, message);
                return;
            }

            modalAlertBox.textContent = message;
            modalAlertBox.classList.remove('hidden', 'success', 'error', 'warning', 'info');
            modalAlertBox.classList.add(type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'info' ? 'info' : 'error');

            // 自動隱藏 (成功訊息 3 秒,錯誤訊息不自動隱藏)
            if (autoHide && type === 'success') {
                setTimeout(() => {
                    hideModalAlert();
                }, 3000);
            }

            // 滾動到 modal 頂部,確保用戶看到訊息
            const modalWindow = modalOverlay ? modalOverlay.querySelector('.modal-window') : null;
            if (modalWindow) {
                modalWindow.scrollTop = 0;
            }
        }

        function hideModalAlert() {
            if (!modalAlertBox) {
                return;
            }

            modalAlertBox.classList.add('hidden');
            modalAlertBox.textContent = '';
            modalAlertBox.classList.remove('success', 'error', 'warning', 'info');
        }

        function setFieldValue(name, value) {
            if (!modalForm) {
                return;
            }

            const field = modalForm.querySelector(`[name="${name}"]`);
            if (field) {
                field.value = value || '';
            } else {
                console.warn(`orders: 欄位不存在 - ${name}`);
            }
        }

        function showAlert(type, message) {
            if (!alertBox) {
                return;
            }

            alertBox.textContent = message;
            alertBox.classList.remove('hidden', 'success', 'error');
            alertBox.classList.add(type === 'success' ? 'success' : 'error');
        }

        function hideAlert() {
            if (!alertBox) {
                return;
            }

            alertBox.classList.add('hidden');
            alertBox.textContent = '';
            alertBox.classList.remove('success', 'error');
        }

        function setFilterDrawerOpen(isOpen) {
            const controller = window.ModuleRenderer?.getFilterDrawerController?.('orders', moduleRoot);
            if (isOpen) controller?.open();
            else controller?.close();
        }

        function openFilterDrawer() { setFilterDrawerOpen(true); }

        function closeFilterDrawer() { setFilterDrawerOpen(false); }

        function getSelectedText(select) {
            if (!select || !select.value) return '';
            const option = select.options[select.selectedIndex];
            return option ? option.textContent.trim() : select.value;
        }

        function updateFilterSummary() {
            window.ModuleRenderer?.getFilterDrawerController?.('orders', moduleRoot)?.updateSummary();
        }

        function formatDateTime(value) {
            return value && value !== '' ? value : '-';
        }

        function formatNumber(value, decimals = 0) {
            const number = Number(value);
            if (!Number.isFinite(number)) {
                return decimals > 0 ? (0).toFixed(decimals) : '0';
            }

            return number.toLocaleString('zh-TW', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            });
        }

        function getWeekdayText(dateStr) {
            if (!dateStr) return '';
            const days = ['\u65e5', '\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d'];
            const parts = String(dateStr).split('-');
            if (parts.length < 3) return '';
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            if (isNaN(d.getTime())) return '';
            return '\u9031' + days[d.getDay()];
        }

        function updateModalWeekday(name) {
            if (!modalOverlay) return;
            const badge = modalOverlay.querySelector(`[data-weekday-for="${name}"]`);
            if (!badge) return;
            const input = modalForm ? modalForm.querySelector(`[name="${name}"]`) : null;
            badge.textContent = input ? getWeekdayText(input.value) : '';
        }

        function formatCurrency(value) {
            if (value === null || value === undefined || value === '') {
                return '0.00';
            }
            return Number(value).toLocaleString('zh-TW', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }

        function normalizeNullableText(value) {
            if (value === null || value === undefined) {
                return '';
            }
            const text = String(value).trim();
            return text.toLowerCase() === 'null' ? '' : text;
        }

        function displayNullableText(value, fallback = '-') {
            const text = normalizeNullableText(value);
            return text === '' ? fallback : text;
        }

        function toUrlEncodedPayload(payload, methodOverride) {
            const params = new URLSearchParams();
            Object.entries(payload).forEach(([key, value]) => {
                params.append(key, value === null || value === undefined ? '' : String(value));
            });
            params.append('_method', methodOverride);
            return params;
        }

        async function readJsonResponse(response, fallbackMessage) {
            const raw = await response.text();
            if (!raw || raw.trim() === '') {
                throw new Error(`${fallbackMessage}（伺服器未回傳內容，HTTP ${response.status}）`);
            }

            try {
                return JSON.parse(raw);
            } catch (error) {
                console.error('orders: 非 JSON 回應內容', raw);
                throw new Error(`${fallbackMessage}（伺服器回應格式錯誤，HTTP ${response.status}）`);
            }
        }

        function updateSortIndicators() {
            if (!tableElement) return;

            const allHeaders = tableElement.querySelectorAll('th[data-sort]');
            allHeaders.forEach(header => {
                header.classList.remove('sort-asc', 'sort-desc');
            });

            if (state.sortField) {
                const currentHeader = tableElement.querySelector(`th[data-sort="${state.sortField}"]`);
                if (currentHeader) {
                    currentHeader.classList.add(state.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
                }
            }
        }

        function sortOrders(orders) {
            if (!state.sortField) return orders;

            return orders.sort((a, b) => {
                let aValue = getNestedProperty(a, state.sortField);
                let bValue = getNestedProperty(b, state.sortField);

                if (aValue == null && bValue == null) return 0;
                if (aValue == null) return state.sortDirection === 'asc' ? 1 : -1;
                if (bValue == null) return state.sortDirection === 'asc' ? -1 : 1;

                aValue = String(aValue).toLowerCase();
                bValue = String(bValue).toLowerCase();

                if (state.sortDirection === 'asc') {
                    return aValue.localeCompare(bValue);
                } else {
                    return bValue.localeCompare(aValue);
                }
            });
        }

        function getNestedProperty(obj, path) {
            return path.split('.').reduce((current, key) => current && current[key], obj);
        }

        function getTableColumnCount() {
            if (!tableElement || !tableElement.tHead || !tableElement.tHead.rows.length) {
                return 11;
            }

            const headerCells = tableElement.tHead.rows[0].cells;
            const headerCount = headerCells.length || 11;
            const hasHardRowNumber = headerCells[0] && headerCells[0].hasAttribute('data-hard-row-number');
            return hasHardRowNumber ? headerCount : headerCount + 1;
        }

        function getOrderContext(orderId, extra = {}) {
            const order = ordersCache.get(orderId) || null;
            return {
                orderId,
                orderNumber: order?.order_number ?? null,
                customerName: order?.customer?.name ?? order?.customer_name ?? null,
                customerId: order?.customer_id ?? order?.customer?.id ?? null,
                createdAt: order?.created_at ?? null,
                expectedDeliveryDate: order?.expected_delivery_date ?? null,
                expectedDeliveryPeriod: order?.expected_delivery_period ?? null,
                ...extra,
            };
        }

        function getOrderItemScreeningLabel(item) {
            if (!item || !item.screening_item) {
                return '-';
            }

            const screeningItem = item.screening_item;
            return [screeningItem.item_number, screeningItem.name].filter(Boolean).join(' - ') || '-';
        }

        function getOrderItemDeleteLabel(item) {
            if (!item) {
                return '此訂單品項';
            }

            return item.customer_batch_number || getOrderItemScreeningLabel(item) || `ID ${item.id}`;
        }

        function setOrderDetailDrawerOpen(isOpen) {
            if (!orderDetailDrawer || !orderDetailOverlay) return;
            orderDetailDrawer.classList.toggle('hidden', !isOpen);
            orderDetailOverlay.classList.toggle('hidden', !isOpen);
            orderDetailDrawer.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            if (isOpen) {
                orderDetailCloseButton?.focus();
            }
        }

        function closeOrderDetailDrawer() {
            orderDetailRequestSequence += 1;
            setOrderDetailDrawerOpen(false);
        }

        function closeScreeningHistoryModal() {
            screeningHistoryRequestSequence += 1;
            screeningHistoryOrderId = null;
            screeningHistoryItems = [];
            screeningHistoryModal?.classList.add('hidden');
        }

        function getScreeningHistoryLabel(item) {
            const screeningItem = item?.screening_item || {};
            return [screeningItem.item_number, screeningItem.name].filter(Boolean).join(' - ') || '-';
        }

        function renderScreeningHistoryRows() {
            if (!screeningHistoryRows || !screeningHistoryResults || !screeningHistoryState) return;
            const keyword = String(screeningHistorySearch?.value || '').trim().toLocaleLowerCase('zh-Hant');
            const filteredItems = screeningHistoryItems.filter((item) => {
                const haystack = `${item.order_date || ''} ${getScreeningHistoryLabel(item)}`.toLocaleLowerCase('zh-Hant');
                return !keyword || haystack.includes(keyword);
            });

            screeningHistoryRows.replaceChildren();
            if (filteredItems.length === 0) {
                screeningHistoryResults.classList.add('hidden');
                screeningHistoryState.textContent = keyword ? '找不到符合搜尋條件的歷史受篩產品。' : '此客戶尚無其他訂單的受篩產品歷史。';
                screeningHistoryState.classList.remove('hidden');
                return;
            }

            filteredItems.forEach((item) => {
                const row = document.createElement('tr');
                const dateCell = document.createElement('td');
                const productCell = document.createElement('td');
                const selectButton = document.createElement('button');

                dateCell.textContent = item.order_date || '-';
                selectButton.type = 'button';
                selectButton.className = 'record-link-button';
                selectButton.dataset.action = 'select-screening-history';
                selectButton.dataset.screeningItemId = String(item.screening_item?.id || '');
                selectButton.textContent = getScreeningHistoryLabel(item);
                selectButton.title = '帶入新的訂單細項';
                productCell.appendChild(selectButton);
                row.append(dateCell, productCell);
                screeningHistoryRows.appendChild(row);
            });

            screeningHistoryState.classList.add('hidden');
            screeningHistoryResults.classList.remove('hidden');
        }

        async function openScreeningHistoryModal(orderId) {
            if (!screeningHistoryModal) {
                showAlert('error', '受篩產品歷史視窗尚未載入，請重新整理後再試。');
                return;
            }

            const requestSequence = ++screeningHistoryRequestSequence;
            screeningHistoryOrderId = orderId;
            screeningHistoryItems = [];
            if (screeningHistorySearch) screeningHistorySearch.value = '';
            if (screeningHistoryCustomer) screeningHistoryCustomer.textContent = '客戶資料載入中…';
            if (screeningHistoryState) {
                screeningHistoryState.textContent = '歷史受篩產品載入中…';
                screeningHistoryState.classList.remove('hidden');
            }
            screeningHistoryResults?.classList.add('hidden');
            screeningHistoryModal.classList.remove('hidden');

            try {
                const response = await fetch(`api/orders/screening-item-history.php?order_id=${encodeURIComponent(orderId)}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' },
                });
                const result = await readJsonResponse(response, '載入受篩產品歷史失敗');
                if (!response.ok || !result.success || !result.data) {
                    throw new Error(result.message || '載入受篩產品歷史失敗。');
                }
                if (requestSequence !== screeningHistoryRequestSequence) return;
                screeningHistoryItems = Array.isArray(result.data.items) ? result.data.items : [];
                if (screeningHistoryCustomer) screeningHistoryCustomer.textContent = `客戶：${result.data.customer?.name || '-'}`;
                renderScreeningHistoryRows();
                screeningHistorySearch?.focus();
            } catch (error) {
                if (requestSequence !== screeningHistoryRequestSequence) return;
                if (screeningHistoryCustomer) screeningHistoryCustomer.textContent = '客戶：-';
                if (screeningHistoryState) {
                    screeningHistoryState.textContent = error instanceof Error ? error.message : '載入受篩產品歷史失敗。';
                    screeningHistoryState.classList.remove('hidden');
                }
            }
        }

        function setOrderDetailField(name, value) {
            const field = orderDetailSections?.querySelector(`[data-order-detail-field="${name}"]`);
            if (field) {
                field.textContent = value === null || value === undefined || String(value).trim() === '' ? '-' : String(value);
            }
        }

        function formatOrderDetailValue(value, decimals = null) {
            if (value === null || value === undefined || String(value).trim() === '') return '-';
            return decimals === null ? String(value) : formatNumber(value, decimals);
        }

        function appendOrderDetailTable(container, title, headers, rows) {
            const section = document.createElement('section');
            const heading = document.createElement('h5');
            const responsive = document.createElement('div');
            const table = document.createElement('table');
            const tableHead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            const tableBody = document.createElement('tbody');

            section.className = 'order-detail-subtable';
            heading.textContent = title;
            responsive.className = 'table-responsive';
            table.className = 'data-table compact';
            table.dataset.noHardRowNumber = 'true';
            table.dataset.noColumnResize = 'true';
            headers.forEach((header) => {
                const cell = document.createElement('th');
                cell.textContent = header;
                headerRow.appendChild(cell);
            });
            tableHead.appendChild(headerRow);

            const safeRows = Array.isArray(rows) && rows.length > 0 ? rows : [['無資料']];
            safeRows.forEach((values) => {
                const row = document.createElement('tr');
                values.forEach((value) => {
                    const cell = document.createElement('td');
                    cell.textContent = formatOrderDetailValue(value);
                    row.appendChild(cell);
                });
                if (values.length === 1 && headers.length > 1) {
                    row.firstElementChild.colSpan = headers.length;
                    row.firstElementChild.className = 'text-center';
                }
                tableBody.appendChild(row);
            });

            table.append(tableHead, tableBody);
            responsive.appendChild(table);
            section.append(heading, responsive);
            container.appendChild(section);
        }

        function renderOrderDetailItems(items, order) {
            if (!orderDetailItemsBody) return;
            orderDetailItemsBody.replaceChildren();

            if (!Array.isArray(items) || items.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'order-items-inline-state';
                emptyState.textContent = '此訂單尚無明細。';
                orderDetailItemsBody.appendChild(emptyState);
                return;
            }

            items.forEach((item) => {
                const itemSection = document.createElement('article');
                const itemHeading = document.createElement('h4');
                const totals = item.totals || {};
                const screeningItem = item.screening_item || {};
                const tools = Array.isArray(item.tools) ? item.tools : [];
                const services = Array.isArray(item.screening_details) ? item.screening_details : [];
                const drawings = Array.isArray(item.drawings) ? item.drawings : [];
                const attachments = Array.isArray(item.attachments) ? item.attachments : [];
                const weightTolerance = order?.customer?.weight_tolerance_percentage;

                itemSection.className = 'order-detail-item-card';
                itemHeading.textContent = item.order_item_number || '訂單明細';
                itemSection.appendChild(itemHeading);

                appendOrderDetailTable(itemSection, '受篩產品、重量與狀態', ['欄位', '內容', '欄位', '內容'], [
                    ['受篩產品', getOrderItemScreeningLabel(item), '單價 (元/M)', formatOrderDetailValue(item.unit_price_per_thousand, 2)],
                    ['總重量(含桶重) (kg)', formatOrderDetailValue(item.total_weight_kg, 2), '生產狀態', item.status_label || item.status],
                    ['單支重量 (g)', formatOrderDetailValue(screeningItem.weight_per_unit_g, 4), '客戶樣品狀態', getOrderItemSampleStatusLabel(item)],
                    ['品項編號', item.sub_item_number, '料號', item.part_number],
                    ['客戶批號', item.customer_batch_number, '訂單明細編號', item.order_item_number],
                ]);

                appendOrderDetailTable(itemSection, '重量追蹤', ['客戶提供重量 (kg)', '我方確認重量 (kg)', '實際生產重量 (kg)', '重量公差限制'], [[
                    formatOrderDetailValue(item.customer_provided_weight, 2),
                    formatOrderDetailValue(item.confirmed_weight, 2),
                    formatOrderDetailValue(item.actual_production_weight, 2),
                    weightTolerance != null ? `±${formatNumber(weightTolerance, 2)}%` : '-',
                ]]);

                appendOrderDetailTable(itemSection, '備註資訊', ['細項交期', '交期時段', '指送地點', '備註'], [[
                    item.expected_delivery_date,
                    getExpectedDeliveryPeriodLabel(item.expected_delivery_period),
                    item.delivery_location,
                    item.notes,
                ]]);
                appendOrderDetailTable(itemSection, '計算指標', [
                    '總重量(含桶重) (kg)', '載具重量合計 (kg)', '淨重 (kg)', '單支重 (g)',
                    '總支數', '單價 (元/M)', '單價合計 (參考)', '預估總金額',
                ], [[
                    formatOrderDetailValue(item.total_weight_kg, 2),
                    formatOrderDetailValue(totals.tool_weight_kg, 2),
                    formatOrderDetailValue(totals.net_weight_kg, 2),
                    formatOrderDetailValue(screeningItem.weight_per_unit_g, 4),
                    formatOrderDetailValue(item.total_units, 0),
                    formatOrderDetailValue(item.unit_price_per_thousand, 2),
                    formatOrderDetailValue(totals.service_unit_price_sum, 4),
                    formatOrderDetailValue(item.total_price, 2),
                ]]);

                appendOrderDetailTable(itemSection, '載具設定', ['載具', '類型', '數量', '單件重量(kg)', '小計重量(kg)'], tools.map((tool) => [
                    [tool.tool_number, tool.tool_name].filter(Boolean).join(' - ') || '-',
                    tool.tool_type,
                    formatOrderDetailValue(tool.quantity, 0),
                    formatOrderDetailValue(tool.weight_kg, 4),
                    formatOrderDetailValue(tool.total_weight_kg, 4),
                ]));

                appendOrderDetailTable(itemSection, '篩分服務', ['服務項目', '服務名稱 (客製)', '實際單價 (每支)', '公差 (+)', '公差 (-)', 'PPM', '備註', '描述'], services.map((service) => [
                    service.defaults?.name,
                    service.service_name,
                    formatOrderDetailValue(service.actual_price_per_unit, 4),
                    `${formatOrderDetailValue(service.tolerance_plus_value, 4)} / Over ${formatOrderDetailValue(service.tolerance_plus_over, 4)}`,
                    `${formatOrderDetailValue(service.tolerance_minus_value, 4)} / Over ${formatOrderDetailValue(service.tolerance_minus_over, 4)}`,
                    formatOrderDetailValue(service.ppm_standard, 3),
                    service.notes,
                    service.description,
                ]));

                appendOrderDetailTable(itemSection, '圖面附件', ['檔案名稱'], drawings.map((drawing) => [drawing.file_name]));
                appendOrderDetailTable(itemSection, '檔案附件', ['檔案名稱'], attachments.map((attachment) => [attachment.file_name]));
                orderDetailItemsBody.appendChild(itemSection);
            });
        }

        function populateOrderDetailDrawer(order) {
            const customer = order.customer || {};
            const periodLabels = {
                morning: '上午',
                noon: '中午',
                afternoon: '下午',
                evening: '晚間',
            };
            const deliveryDate = order.expected_delivery_date || '-';
            const deliveryPeriod = periodLabels[order.expected_delivery_period] || order.expected_delivery_period || '';
            const expectedDelivery = deliveryPeriod ? `${deliveryDate} ${deliveryPeriod}` : deliveryDate;

            setOrderDetailField('order_number', order.order_number);
            setOrderDetailField('customer_name', customer.name || order.customer_name);
            setOrderDetailField('order_date', order.order_date);
            setOrderDetailField('expected_delivery', expectedDelivery);
            renderOrderDetailItems(order.items, order);

            if (orderDetailSubtitle) orderDetailSubtitle.textContent = order.order_number || '訂單詳細資料';
            orderDetailLoading?.classList.add('hidden');
            orderDetailSections?.classList.remove('hidden');
        }

        async function openOrderDetailDrawer(orderId) {
            if (!orderDetailDrawer || !orderDetailOverlay) {
                showAlert('error', '訂單詳細檢視尚未載入，請重新整理後再試。');
                return;
            }

            const requestSequence = ++orderDetailRequestSequence;
            orderDetailSections?.classList.add('hidden');
            if (orderDetailLoading) {
                orderDetailLoading.textContent = '訂單詳細資料載入中…';
                orderDetailLoading.classList.remove('hidden');
            }
            if (orderDetailSubtitle) orderDetailSubtitle.textContent = '載入訂單完整資料';
            setOrderDetailDrawerOpen(true);

            try {
                const response = await fetch(`api/orders/show.php?id=${encodeURIComponent(orderId)}&include=customer,items`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' },
                });
                const result = await readJsonResponse(response, '載入訂單詳細資料失敗');
                if (!response.ok || !result.success || !result.data) {
                    throw new Error(result.message || '載入訂單詳細資料失敗。');
                }
                if (requestSequence !== orderDetailRequestSequence) return;
                ordersCache.set(orderId, result.data);
                populateOrderDetailDrawer(result.data);
            } catch (error) {
                if (requestSequence !== orderDetailRequestSequence) return;
                orderDetailSections?.classList.add('hidden');
                if (orderDetailLoading) {
                    orderDetailLoading.textContent = error instanceof Error ? error.message : '載入訂單詳細資料失敗。';
                    orderDetailLoading.classList.remove('hidden');
                }
            }
        }

        function getOrderItemSampleStatusLabel(item) {
            const label = item?.customer_sample_status_label;
            if (label !== null && label !== undefined && String(label).trim() !== '') {
                return String(label).trim();
            }

            const raw = String(item?.customer_sample_status || '').trim();
            const normalized = raw.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
            if (normalized === 'yes') return '有';
            if (normalized === 'no') return '無';
            if (['yes_return', 'yes_need_return', 'need_return', 'return', 'return_required'].includes(normalized)) return '有，須歸還';
            if (['no_return', 'return_not_required', 'no_need_return'].includes(normalized)) return '有，不須歸還';
            return raw || '-';
        }

        function getOrderItemShippingStatus(item) {
            const status = item?.shipping_status || 'not_shipped';
            const definitions = {
                not_shipped: { label: '未出貨', className: 'pending' },
                partial_shipped: { label: '部分出貨', className: 'warning' },
                fully_shipped: { label: '已全部出貨', className: 'shipped' },
            };
            return definitions[status] || { label: status, className: '' };
        }

        function getOrderStatusBadge(status, statusLabel = null) {
            const normalizedStatus = String(status || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
            const normalizedLabel = String(statusLabel || '').trim();
            const classByStatus = {
                pending: 'pending',
                confirmed: 'active',
                in_progress: 'in-progress',
                completed: 'completed',
                cancelled: 'cancelled',
                scheduled: 'scheduled',
                paused: 'paused',
            };
            const classByLabel = {
                待處理: 'pending',
                待開始: 'scheduled',
                已確認: 'active',
                進行中: 'in-progress',
                已完成: 'completed',
                已取消: 'cancelled',
                暫停: 'paused',
            };

            return {
                label: normalizedLabel || String(status || '-'),
                className: classByStatus[normalizedStatus] || classByLabel[normalizedLabel] || 'secondary',
            };
        }

        function getExpectedDeliveryPeriodLabel(period) {
            const labels = {
                morning: '上午',
                noon: '中午',
                afternoon: '下午',
                evening: '晚間',
            };
            const normalized = String(period || '').trim();
            return labels[normalized] || normalized;
        }

        function getOrderItemExpectedDeliveryLabel(item) {
            const date = String(item?.expected_delivery_date || '').trim();
            const period = getExpectedDeliveryPeriodLabel(item?.expected_delivery_period);
            return [date, period].filter(Boolean).join(' ') || '-';
        }

        function renderOrderStatusBadge(status, statusLabel = null) {
            const badge = getOrderStatusBadge(status, statusLabel);
            return `<span class="status-badge ${badge.className}">${escapeHtml(badge.label)}</span>`;
        }

        function getOrderItemWeightVarianceText(orderId, item) {
            const confirmedWeight = Number(item?.confirmed_weight);
            const actualWeight = Number(item?.actual_production_weight);
            if (!Number.isFinite(confirmedWeight) || !Number.isFinite(actualWeight)) return '-';

            const variance = actualWeight - confirmedWeight;
            const variancePercent = confirmedWeight > 0 ? (variance / confirmedWeight) * 100 : 0;
            const order = ordersCache.get(orderId) || {};
            const toleranceValue = Number(order.customer?.weight_tolerance_percentage ?? order.weight_tolerance_percentage ?? 3);
            const tolerance = Number.isFinite(toleranceValue) ? toleranceValue : 3;
            const sign = variance >= 0 ? '+' : '';
            const display = `${sign}${formatNumber(variance, 2)} kg (${sign}${formatNumber(variancePercent, 2)}%)`;
            return Math.abs(variancePercent) > tolerance ? `⚠ ${display}` : display;
        }

        function renderCurrentOrders() {
            renderTableRows(state.currentRows);
            updateSortIndicators();
        }

        function renderLoadingRow() {
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="11" class="text-center">資料載入中...</td></tr>';
            }
            // 套用欄位可見性設定
            if (window.orderColumnManager) {
                window.orderColumnManager.onTableUpdated();
            }
        }

        /**
         * 從訂單細項開啟新增工單表單並自動帶入客戶批號資料。
         * 這裡沿用客戶批號頁面的既有轉工單流程。
         *
         * @param {number} orderItemId 客戶批號 ID
         */
        function handleCreateWorkOrder(orderItemId) {
            window.openTab('work_orders', '生產工單', 'modules/work_orders.html');

            setTimeout(() => {
                if (window.openWorkOrderFromOrderItem && typeof window.openWorkOrderFromOrderItem === 'function') {
                    window.openWorkOrderFromOrderItem(orderItemId);
                } else {
                    console.error('工單模組未正確載入,openWorkOrderFromOrderItem 函數不存在');
                }
            }, 500);
        }

        function renderOrderItemsDetailRow(orderId) {
            const colspan = getTableColumnCount();
            const items = orderItemsCache.get(orderId);
            const isLoading = loadingOrderItemIds.has(orderId);

            let bodyHtml = '';
            if (isLoading) {
                bodyHtml = '<div class="order-items-inline-state">訂單細項載入中...</div>';
            } else if (!Array.isArray(items)) {
                bodyHtml = '<div class="order-items-inline-state">尚未載入訂單細項。</div>';
            } else if (items.length === 0) {
                bodyHtml = '<div class="order-items-inline-state">此訂單尚無細項。</div>';
            } else {
                const sortedItems = orderItemSelection?.sortItems(orderId, items) || items;
                const sortableHeader = (field, label, className = '') => {
                    const sortClass = orderItemSelection?.getSortClass(orderId, field) || '';
                    const ariaSort = orderItemSelection?.getAriaSort(orderId, field) || 'none';
                    return `<th class="${escapeHtml(`${className} ${sortClass}`.trim())}" data-column="${escapeHtml(field)}" data-sort="${escapeHtml(field)}" aria-sort="${escapeHtml(ariaSort)}">${escapeHtml(label)}<i class="fas fa-sort" aria-hidden="true"></i></th>`;
                };
                const plainHeader = (field, label, className = '') => `<th class="${escapeHtml(className)}" data-column="${escapeHtml(field)}">${escapeHtml(label)}</th>`;
                const rowsHtml = sortedItems.map((item, index) => {
                    const totals = item.totals || {};
                    const screeningLabel = getOrderItemScreeningLabel(item);
                    const statusLabel = item.status_label || item.status || '-';
                    const sampleStatusLabel = getOrderItemSampleStatusLabel(item);
                    const shippingStatus = getOrderItemShippingStatus(item);
                    const isSelected = orderItemSelection?.isSelected(orderId, item.id) || false;
                    const tools = Array.isArray(item.tools) ? item.tools : [];
                    const toolTypes = [...new Set(tools.map((tool) => String(tool.tool_type || '').trim()).filter(Boolean))];
                    const toolTypesLabel = toolTypes.length > 0 ? toolTypes.join(', ') : '-';
                    const hasWorkOrder = item.has_work_order == 1;
                    const workOrderBtnTitle = hasWorkOrder
                        ? `已轉成工單 ${escapeHtml(item.work_order_number || '')}`.trim()
                        : '轉為工單';
                    const workOrderBtnAttr = hasWorkOrder ? 'data-has-work-order="true" disabled aria-disabled="true"' : '';

                    return `
                        <tr data-order-item-id="${escapeHtml(item.id)}">
                            <td class="checkbox-col">
                                <input type="checkbox" data-action="select-order-item-inline" data-order-id="${orderId}" data-order-item-id="${escapeHtml(item.id)}" aria-label="選取訂單細項 ${escapeHtml(item.order_item_number || String(index + 1))}" ${isSelected ? 'checked' : ''}>
                            </td>
                            <td>${escapeHtml(item.order_item_number || '-')}</td>
                            <td>${escapeHtml(item.customer_batch_number || '-')}</td>
                            <td>${escapeHtml(item.order_number || '-')}</td>
                            <td>${escapeHtml(item.customer_name || '-')}</td>
                            <td class="screening-item-cell">
                                <div class="screening-item-cell-main">
                                    <div class="table-primary">${escapeHtml(screeningLabel)}</div>
                                    <button type="button" class="btn text op-action-btn op-role-view" data-action="open-screening-history" data-order-id="${orderId}" title="受篩產品歷史" aria-label="查看此客戶的受篩產品歷史">
                                        <i class="fas fa-history" aria-hidden="true"></i>
                                    </button>
                                </div>
                                ${item.drawing_number ? `<div class="table-secondary">圖面：${escapeHtml(item.drawing_number)}</div>` : ''}
                            </td>
                            <td>${escapeHtml(getOrderItemExpectedDeliveryLabel(item))}</td>
                            <td class="text-right">${formatNumber(item.total_weight_kg ?? 0, 2)}</td>
                            <td class="text-right">${formatNumber(totals.tool_weight_kg ?? 0, 2)}</td>
                            <td class="text-right">${formatNumber(totals.net_weight_kg ?? 0, 2)}</td>
                            <td class="text-right">${formatNumber(item.total_units ?? 0, 0)}</td>
                            <td class="text-right">${formatNumber(item.unit_price_per_thousand ?? 0, 2)}</td>
                            <td class="text-right">${formatCurrency(item.total_price ?? 0)}</td>
                            <td>${renderOrderStatusBadge(item.status, statusLabel)}</td>
                            <td>${escapeHtml(sampleStatusLabel)}</td>
                            <td>${escapeHtml(formatDateTime(item.updated_at))}</td>
                            <td class="text-right">${formatNumber(item.total_shipped_quantity ?? 0, 0)}</td>
                            <td><span class="status-badge ${shippingStatus.className}">${escapeHtml(shippingStatus.label)}</span></td>
                            <td>${item.work_order_count ? `${escapeHtml(item.work_order_count)} 筆` : '-'}</td>
                            <td>${item.inventory_item_count ? `${escapeHtml(item.inventory_item_count)} 筆` : '-'}</td>
                            <td>${item.shipping_order_item_count ? `${escapeHtml(item.shipping_order_item_count)} 筆` : '-'}</td>
                            <td>${item.return_order_item_count ? `${escapeHtml(item.return_order_item_count)} 筆` : '-'}</td>
                            <td class="text-right">${item.customer_provided_weight != null ? formatNumber(item.customer_provided_weight, 2) : '-'}</td>
                            <td class="text-right">${item.confirmed_weight != null ? formatNumber(item.confirmed_weight, 2) : '-'}</td>
                            <td class="text-right">${item.actual_production_weight != null ? formatNumber(item.actual_production_weight, 2) : '-'}</td>
                            <td class="text-right">${escapeHtml(getOrderItemWeightVarianceText(orderId, item))}</td>
                            <td>${escapeHtml(toolTypesLabel)}</td>
                            <td class="text-right">${tools.length > 0 ? tools.map((tool) => formatNumber(tool.weight_kg ?? 0, 4)).join(', ') : '-'}</td>
                            <td class="text-right">${tools.length > 0 ? tools.map((tool) => formatNumber(tool.quantity ?? 0, 0)).join(', ') : '-'}</td>
                            <td class="table-actions order-items-inline-actions">
                                <button type="button" class="btn text" data-action="create-work-order" data-order-id="${orderId}" data-order-item-id="${item.id}" title="${workOrderBtnTitle}" ${workOrderBtnAttr}>
                                    <i class="fas fa-cogs" aria-hidden="true"></i>
                                </button>
                                <button type="button" class="btn text" data-action="edit-order-item-inline" data-order-id="${orderId}" data-order-item-id="${item.id}" title="編輯客戶批號" aria-label="編輯客戶批號">
                                    <i class="fas fa-edit" aria-hidden="true"></i>
                                </button>
                                <button type="button" class="btn text danger" data-action="delete-order-item-inline" data-order-id="${orderId}" data-order-item-id="${item.id}" title="刪除客戶批號" aria-label="刪除客戶批號">
                                    <i class="fas fa-trash" aria-hidden="true"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');

                bodyHtml = `
                    <div class="table-section order-items-inline-table-wrap">
                        <table class="data-table order-items-inline-table" data-order-items-order-context-table>
                            <thead>
                                <tr>
                                    <th class="checkbox-col">選取</th>
                                    ${sortableHeader('order_item_number', '訂單明細')}
                                    ${sortableHeader('customer_batch_number', '客戶批號')}
                                    ${sortableHeader('order_number', '訂單號碼')}
                                    ${sortableHeader('customer_name', '客戶名稱')}
                                    ${sortableHeader('screening_label', '受篩品項')}
                                    ${sortableHeader('expected_delivery_date', '細項交期')}
                                    ${sortableHeader('total_weight_kg', '總重量(kg)', 'text-right')}
                                    ${sortableHeader('tool_weight_kg', '載具重量(kg)', 'text-right')}
                                    ${sortableHeader('net_weight_kg', '淨重(kg)', 'text-right')}
                                    ${sortableHeader('total_units', '總支數', 'text-right')}
                                    ${sortableHeader('unit_price_per_thousand', '單價 (元/M)', 'text-right')}
                                    ${sortableHeader('total_price', '預估總金額', 'text-right')}
                                    ${sortableHeader('status_label', '狀態')}
                                    ${sortableHeader('sample_status_label', '客戶樣品狀態')}
                                    ${sortableHeader('updated_at', '更新時間')}
                                    ${sortableHeader('total_shipped_quantity', '已出貨數量', 'text-right')}
                                    ${sortableHeader('shipping_status', '出貨狀態')}
                                    ${sortableHeader('work_order_count', '工單')}
                                    ${sortableHeader('inventory_item_count', '庫存')}
                                    ${sortableHeader('shipping_order_item_count', '出貨明細')}
                                    ${sortableHeader('return_order_item_count', '退貨明細')}
                                    ${sortableHeader('customer_provided_weight', '客戶提供重量', 'text-right')}
                                    ${sortableHeader('confirmed_weight', '我方確認重量', 'text-right')}
                                    ${sortableHeader('actual_production_weight', '實際生產重量', 'text-right')}
                                    ${plainHeader('weight_variance', '重量差異', 'text-right')}
                                    ${plainHeader('tool_types', '載具類型')}
                                    ${plainHeader('tool_unit_weight', '載具單重(kg)', 'text-right')}
                                    ${plainHeader('tool_quantity', '載具數量', 'text-right')}
                                    <th class="order-items-inline-actions">操作</th>
                                </tr>
                            </thead>
                            <tbody>${rowsHtml}</tbody>
                        </table>
                    </div>
                `;
            }

            const selectedOrderItemId = orderItemSelection?.getSelected(orderId) || null;

            return `
                <tr class="order-items-detail-row" data-parent-id="${orderId}" data-skip-row-number="true" data-column-manager-skip="true">
                    <td colspan="${colspan}">
                        <div class="order-items-inline-panel" data-module="order_items_order_context">
                            <div class="order-items-inline-header">
                                <strong>訂單細項</strong>
                                <div class="header-actions">
                                    <button type="button" class="btn outline small" data-action="copy-order-item" data-order-id="${orderId}" title="${selectedOrderItemId ? '複製已選取的訂單細項' : '請先勾選一筆訂單細項'}" aria-disabled="${selectedOrderItemId ? 'false' : 'true'}">
                                        <i class="fas fa-copy" aria-hidden="true"></i> 複製
                                    </button>
                                    <button type="button" class="btn primary small" data-action="add-order-item" data-order-id="${orderId}" title="新增訂單細項">
                                        <i class="fas fa-plus" aria-hidden="true"></i> 新增
                                    </button>
                                    <button type="button" class="btn outline small" data-action="open-order-items" data-order-id="${orderId}" title="批號一覽">
                                        <i class="fas fa-list-ul" aria-hidden="true"></i> 批號一覽
                                    </button>
                                    <button type="button" class="btn outline small" data-action="toggle-column-selector" title="欄位設定" aria-label="開啟訂單細項欄位設定">
                                        <i class="fas fa-columns" aria-hidden="true"></i> 欄位設定
                                    </button>
                                </div>
                            </div>
                            ${bodyHtml}
                            <div class="column-selector hidden" data-order-items-order-context-column-selector>
                                <div class="column-selector-header">
                                    <h4>顯示欄位設定</h4>
                                    <button type="button" class="close-btn" data-action="close-column-selector" title="關閉" aria-label="關閉欄位設定">
                                        <i class="fas fa-times" aria-hidden="true"></i>
                                    </button>
                                </div>
                                <div class="column-selector-body">
                                    <label class="column-option"><input type="checkbox" data-column="order_item_number" checked><span>訂單明細</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="customer_batch_number" checked><span>客戶批號</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="order_number" checked><span>訂單號碼</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="customer_name" checked><span>客戶名稱</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="screening_label" checked><span>受篩品項</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="expected_delivery_date" checked><span>細項交期</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="total_weight_kg" checked><span>總重量(kg)</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="tool_weight_kg" checked><span>載具重量(kg)</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="net_weight_kg" checked><span>淨重(kg)</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="total_units" checked><span>總支數</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="unit_price_per_thousand" checked><span>單價 (元/M)</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="total_price" checked><span>預估總金額</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="status_label" checked><span>狀態</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="sample_status_label" checked><span>客戶樣品狀態</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="updated_at" checked><span>更新時間</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="total_shipped_quantity"><span>已出貨數量</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="shipping_status"><span>出貨狀態</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="work_order_count" checked><span>工單</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="inventory_item_count" checked><span>庫存</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="shipping_order_item_count" checked><span>出貨明細</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="return_order_item_count" checked><span>退貨明細</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="customer_provided_weight"><span>客戶提供重量</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="confirmed_weight"><span>我方確認重量</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="actual_production_weight"><span>實際生產重量</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="weight_variance"><span>重量差異</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="tool_types"><span>載具類型</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="tool_unit_weight"><span>載具單重(kg)</span></label>
                                    <label class="column-option"><input type="checkbox" data-column="tool_quantity"><span>載具數量</span></label>
                                </div>
                                <div class="column-selector-footer">
                                    <button type="button" class="btn outline small" data-action="select-all-columns">全選</button>
                                    <button type="button" class="btn outline small" data-action="deselect-all-columns">全不選</button>
                                    <button type="button" class="btn primary small" data-action="apply-column-settings">套用</button>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }

        function renderTableRows(rows) {
            if (!tableBody) {
                return;
            }

            if (!rows || rows.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="11" class="text-center">尚無符合條件的資料。</td></tr>';
                // 套用欄位可見性設定
                if (window.orderColumnManager) {
                    window.orderColumnManager.onTableUpdated();
                }
                updateSelectionUI();
                return;
            }

            const html = rows.map((order) => {
                const orderId = Number.parseInt(order.id, 10);
                ordersCache.set(orderId, order);
                const customerObj = order.customer || {};
                const customerName = customerObj.name ? customerObj.name : (order.customer_name || '-');
                const customerId = Number.parseInt(customerObj.id || order.customer_id, 10);
                const customerIsActive = order.customer_is_active !== 0 && order.customer_is_active !== '0' && order.customer_is_active !== false;
                const inactiveCustomerSuffix = customerName !== '-' && !customerIsActive ? ' <span class="text-muted">(已停用)</span>' : '';
                const customerOpenLabel = escapeHtml(`查看客戶基本資料：${customerName}`);
                const statusLabel = order.status_label || order.status || '-';
                const isChecked = selectedOrders.has(orderId) ? 'checked' : '';
                const isExpanded = expandedOrderIds.has(orderId);
                const detailsIcon = isExpanded ? 'fa-chevron-up' : 'fa-chevron-down';
                const detailsTitle = isExpanded ? '收合細項' : '展開細項';

                // 最低委託額度警示
                const minimumAmount = order.customer?.minimum_order_amount || 0;
                const isBelowMinimum = order.is_below_minimum_amount || (minimumAmount > 0 && order.total_amount < minimumAmount);
                const amountWarning = isBelowMinimum
                    ? `<span class="text-warning" title="低於最低委託額度 $${formatCurrency(minimumAmount)}"><i class="fas fa-exclamation-triangle"></i></span>`
                    : '';

                const mainRow = `
                    <tr data-id="${orderId}"${isBelowMinimum ? ' class="row-warning"' : ''}>
                        <td class="checkbox-col"><input type="checkbox" data-action="select-row" ${isChecked}></td>
                        <td>${escapeHtml(order.order_number)}</td>
                        <td>${Number.isInteger(customerId) && customerId > 0 && customerName !== '-' ? `<button type="button" class="record-link-button" data-action="open-customer" data-customer-id="${customerId}" title="${customerOpenLabel}" aria-label="${customerOpenLabel}">${escapeHtml(customerName)}</button>` : escapeHtml(customerName)}${inactiveCustomerSuffix}</td>
                        <td>${formatDateTime(order.order_date)}${order.order_date ? ` <span class="weekday-text">${getWeekdayText(order.order_date)}</span>` : ''}</td>
                        <td>${formatDateTime(order.expected_delivery_date)}${order.expected_delivery_date ? ` <span class="weekday-text">${getWeekdayText(order.expected_delivery_date)}</span>` : ''}${order.expected_delivery_period ? ` ${escapeHtml(getExpectedDeliveryPeriodLabel(order.expected_delivery_period))}` : ''}</td>
                        <td>${escapeHtml(displayNullableText(order.customer_po_number))}</td>
                        <td>${renderOrderStatusBadge(order.status, statusLabel)}</td>
                        <td class="text-right">$${formatCurrency(order.total_amount)} ${amountWarning}</td>
                        <td>${formatDateTime(order.created_at)}</td>
                        <td class="table-actions">
                            <button type="button" class="btn text op-action-btn op-role-print" data-action="print-single" title="列印"><i class="fas fa-print"></i></button>
                            <button type="button" class="btn text op-action-btn op-role-expand" data-action="details" title="${detailsTitle}" aria-label="${detailsTitle}" aria-expanded="${isExpanded ? 'true' : 'false'}"><i class="fas ${detailsIcon}"></i></button>
                            <button type="button" class="btn text op-action-btn op-role-view" data-action="view-order-details" data-order-id="${orderId}" title="詳細檢視" aria-label="詳細檢視"><i class="fas fa-eye" aria-hidden="true"></i></button>
                            <button type="button" class="btn text op-action-btn op-role-edit" data-action="edit" title="編輯"><i class="fas fa-edit"></i></button>
                            <button type="button" class="btn text danger op-action-btn op-role-delete" data-action="delete" title="刪除"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>
                `;

                return isExpanded ? mainRow + renderOrderItemsDetailRow(orderId) : mainRow;
            }).join('');

            tableBody.innerHTML = html;

            // 套用欄位可見性設定
            if (window.orderColumnManager) {
                window.orderColumnManager.onTableUpdated();
            } else {
                console.warn('[orders.js] window.orderColumnManager 不存在');
            }

            updateSelectionUI();
        }

        function renderPagination() {
            if (!paginationContainer) {
                return;
            }

            if (state.totalPages <= 1) {
                paginationContainer.innerHTML = '';
                return;
            }

            const prevDisabled = state.page <= 1 ? 'disabled' : '';
            const nextDisabled = state.page >= state.totalPages ? 'disabled' : '';

            paginationContainer.innerHTML = `
                <button type="button" data-page="${state.page - 1}" ${prevDisabled}>上一頁</button>
                <span>第 ${state.page} / ${state.totalPages} 頁，共 ${state.total} 筆</span>
                <button type="button" data-page="${state.page + 1}" ${nextDisabled}>下一頁</button>
            `;
        }

        /**
         * 載入客戶資料到下拉選單
         * @param {Object} options - 選項
         * @param {boolean} options.includeInactive - 是否包含已停用的客戶
         * @param {string|number} options.currentCustomerId - 當前選中的客戶 ID（編輯模式時使用）
         */
        async function loadCustomers(options = {}) {
            const { includeInactive = false, currentCustomerId = null } = options;

            try {
                const response = await fetch('api/customers/index.php?perPage=1000&sortField=customer_number&sortDirection=asc', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`載入客戶資料失敗（${response.status}）`);
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || '載入客戶資料失敗。');
                }

                const allCustomers = Array.isArray(result.data) ? result.data : [];

                // 分離啟用和停用的客戶
                const activeCustomers = allCustomers.filter(c => c.is_active === 1 || c.is_active === '1' || c.is_active === true);
                const inactiveCustomers = allCustomers.filter(c => c.is_active === 0 || c.is_active === '0' || c.is_active === false);

                if (customerIdSelect) {
                    customerIdSelect.innerHTML = '<option value="">-- 請選擇客戶 --</option>';

                    // 先添加啟用中的客戶
                    activeCustomers.forEach(customer => {
                        const option = document.createElement('option');
                        option.value = customer.id;
                        option.textContent = `${customer.name} (${customer.customer_number})`;
                        customerIdSelect.appendChild(option);
                    });

                    // 如果是編輯模式，添加已停用的客戶（標註並灰顯）
                    if (includeInactive && inactiveCustomers.length > 0) {
                        // 添加分隔線
                        const separator = document.createElement('option');
                        separator.disabled = true;
                        separator.textContent = '──── 已停用客戶 ────';
                        customerIdSelect.appendChild(separator);

                        inactiveCustomers.forEach(customer => {
                            const option = document.createElement('option');
                            option.value = customer.id;
                            option.textContent = `${customer.name} (${customer.customer_number}) [已停用]`;
                            option.classList.add('inactive-option');
                            // 只有當前選中的客戶可以被選取，其他停用客戶禁止選取
                            if (String(customer.id) !== String(currentCustomerId)) {
                                option.disabled = true;
                            }
                            customerIdSelect.appendChild(option);
                        });
                    }
                }

                // 篩選器下拉選單顯示所有客戶（含停用標記）
                if (filterCustomerSelect) {
                    filterCustomerSelect.innerHTML = '<option value="">-- 請選擇客戶 --</option>';

                    activeCustomers.forEach(customer => {
                        const option = document.createElement('option');
                        option.value = customer.id;
                        option.textContent = `${customer.name} (${customer.customer_number})`;
                        filterCustomerSelect.appendChild(option);
                    });

                    if (inactiveCustomers.length > 0) {
                        const separator = document.createElement('option');
                        separator.disabled = true;
                        separator.textContent = '──── 已停用客戶 ────';
                        filterCustomerSelect.appendChild(separator);

                        inactiveCustomers.forEach(customer => {
                            const option = document.createElement('option');
                            option.value = customer.id;
                            option.textContent = `${customer.name} (${customer.customer_number}) [已停用]`;
                            option.classList.add('inactive-option');
                            filterCustomerSelect.appendChild(option);
                        });
                    }
                }

            } catch (error) {
                console.error('載入客戶資料失敗:', error);
            }
        }

        async function loadOrderStatuses() {
            try {
                const response = await fetch('api/lookup_values/index.php?domain_key=status_order', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    return;
                }

                const result = await response.json();
                if (!result.success) {
                    return;
                }

                const statuses = Array.isArray(result.data) ? result.data : [];

                if (statusSelect) {
                    statusSelect.innerHTML = '<option value="">-- 請選擇狀態 --</option>';
                    statuses.forEach(status => {
                        const option = document.createElement('option');
                        option.value = status.value_key;
                        option.textContent = status.value_label;
                        statusSelect.appendChild(option);
                    });
                }

                if (filterStatusSelect) {
                    filterStatusSelect.innerHTML = '<option value="">-- 所有狀態 --</option>';
                    statuses.forEach(status => {
                        const option = document.createElement('option');
                        option.value = status.value_key;
                        option.textContent = status.value_label;
                        filterStatusSelect.appendChild(option);
                    });
                }

            } catch (error) {
                console.error('載入訂單狀態失敗:', error);
            }
        }

        async function loadOrders(page = 1) {
            if (!filterForm) {
                return;
            }

            hideAlert();
            renderLoadingRow();

            const formData = new FormData(filterForm);
            const params = new URLSearchParams();
            const keyword = (formData.get('keyword') || '').toString().trim();
            const customerId = (formData.get('customer_id') || '').toString().trim();
            const status = (formData.get('status') || '').toString().trim();
            const startDate = (formData.get('start_date') || '').toString().trim();
            const endDate = (formData.get('end_date') || '').toString().trim();
            const perPageValue = parseInt((formData.get('perPage') || '10').toString(), 10);

            state.page = Math.max(1, page);
            state.perPage = Number.isFinite(perPageValue) && perPageValue > 0 ? perPageValue : 10;

            params.set('page', String(state.page));
            params.set('perPage', String(state.perPage));
            if (keyword !== '') {
                params.set('keyword', keyword);
            }
            if (customerId !== '') {
                params.set('customer_id', customerId);
            }
            if (status !== '') {
                params.set('status', status);
            }
            if (startDate !== '') {
                params.set('start_date', startDate);
            }
            if (endDate !== '') {
                params.set('end_date', endDate);
            }

            try {
                const response = await fetch(`api/orders/index.php?${params.toString()}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`載入失敗（${response.status}）`);
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || '載入失敗，請稍後再試。');
                }

                const orders = Array.isArray(result.data) ? result.data : [];
                ordersCache.clear();

                const sortedOrders = sortOrders(orders);
                state.currentRows = sortedOrders;
                renderTableRows(sortedOrders);

                if (result.pagination) {
                    state.page = result.pagination.page || state.page;
                    state.perPage = result.pagination.perPage || state.perPage;
                    state.totalPages = result.pagination.totalPages || 1;
                    state.total = result.pagination.total || orders.length;
                } else {
                    state.totalPages = 1;
                    state.total = orders.length;
                }

                renderPagination();
                updateSortIndicators();
                updateFilterSummary();

            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '載入失敗，請稍後再試。');
                state.currentRows = [];
                renderTableRows([]);
            }
        }

        async function loadOrderItemsForOrder(orderId, force = false) {
            if (!force && orderItemsCache.has(orderId)) {
                return orderItemsCache.get(orderId);
            }

            loadingOrderItemIds.add(orderId);
            renderCurrentOrders();

            try {
                const response = await fetch(`api/orders/show.php?id=${encodeURIComponent(orderId)}&include=items`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`載入訂單細項失敗（${response.status}）`);
                }

                const result = await response.json();
                if (!result.success || !result.data) {
                    throw new Error(result.message || '載入訂單細項失敗。');
                }

                const items = Array.isArray(result.data.items) ? result.data.items : [];
                orderItemsCache.set(orderId, items);
                orderItemSelection?.reconcile(orderId, items);
                if (result.data.id) {
                    ordersCache.set(Number.parseInt(result.data.id, 10), result.data);
                }
                return items;
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '載入訂單細項失敗。');
                orderItemsCache.set(orderId, []);
                return [];
            } finally {
                loadingOrderItemIds.delete(orderId);
                renderCurrentOrders();
            }
        }

        function getOrderIdsFromDataSyncPayload(sourceData) {
            const orderIds = new Set();
            const records = Array.isArray(sourceData) ? sourceData : [sourceData];

            records.forEach((record) => {
                if (!record || typeof record !== 'object') {
                    return;
                }

                const rawOrderId = record.order_id ?? record.orderId ?? record.order?.id;
                const orderId = Number.parseInt(rawOrderId, 10);
                if (Number.isFinite(orderId) && orderId > 0) {
                    orderIds.add(orderId);
                    return;
                }

                const rawOrderItemId = record.order_item_id ?? record.orderItemId ?? record.order_item?.id;
                const orderItemId = Number.parseInt(rawOrderItemId, 10);
                if (!Number.isFinite(orderItemId) || orderItemId <= 0) {
                    return;
                }

                orderItemsCache.forEach((items, cachedOrderId) => {
                    if (!Array.isArray(items)) {
                        return;
                    }

                    const matched = items.some((item) => Number.parseInt(item.id, 10) === orderItemId);
                    if (matched) {
                        orderIds.add(cachedOrderId);
                    }
                });
            });

            return Array.from(orderIds);
        }

        function isOrderItemsRelatedSource(sourceModule) {
            return sourceModule === 'order_items' || sourceModule === 'work_orders';
        }

        async function refreshOrdersForDataSync(sourceModule = null, sourceAction = null, sourceData = null) {
            if (sourceModule === 'customers') {
                await loadCustomers();
            }

            let affectedOrderIds = [];
            if (isOrderItemsRelatedSource(sourceModule)) {
                affectedOrderIds = getOrderIdsFromDataSyncPayload(sourceData);
                if (affectedOrderIds.length > 0) {
                    affectedOrderIds.forEach((orderId) => orderItemsCache.delete(orderId));
                } else {
                    orderItemsCache.clear();
                }
            }

            await loadOrders(state.page);

            if (isOrderItemsRelatedSource(sourceModule)) {
                await refreshExpandedOrderItems(affectedOrderIds);
            }

            if (modalOverlay && !modalOverlay.classList.contains('hidden') && state.currentEditingId) {
                await openEditModal(state.currentEditingId);
            }
        }

        function getVisibleExpandedOrderIds(candidateOrderIds = []) {
            const visibleOrderIds = new Set(
                state.currentRows
                    .map((order) => Number.parseInt(order.id, 10))
                    .filter((orderId) => Number.isFinite(orderId))
            );
            const candidateSet = candidateOrderIds.length > 0 ? new Set(candidateOrderIds) : null;

            return Array.from(expandedOrderIds).filter((orderId) => {
                if (!visibleOrderIds.has(orderId)) {
                    return false;
                }
                return !candidateSet || candidateSet.has(orderId);
            });
        }

        async function refreshExpandedOrderItems(candidateOrderIds = []) {
            const targetOrderIds = getVisibleExpandedOrderIds(candidateOrderIds);
            if (targetOrderIds.length === 0) {
                return;
            }

            await Promise.all(targetOrderIds.map((orderId) => loadOrderItemsForOrder(orderId, true)));
        }

        async function toggleOrderItems(orderId) {
            if (expandedOrderIds.has(orderId)) {
                expandedOrderIds.delete(orderId);
                renderCurrentOrders();
                return;
            }

            expandedOrderIds.add(orderId);
            renderCurrentOrders();
            await loadOrderItemsForOrder(orderId);
        }

        async function openEditModal(id) {
            try {
                const response = await fetch(`api/orders/show.php?id=${id}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`讀取訂單資料失敗（${response.status}）`);
                }

                const result = await response.json();
                if (!result.success || !result.data) {
                    throw new Error(result.message || '讀取訂單資料失敗。');
                }

                ordersCache.set(result.data.id, result.data);
                await openModal('edit', result.data);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '無法讀取訂單資料。');
            }
        }

        async function checkWorkflowDelete(moduleName, id) {
            const response = await fetch(`api/workflow_guard/check.php?module=${encodeURIComponent(moduleName)}&action=delete&id=${encodeURIComponent(id)}`, {
                credentials: 'include'
            });
            const result = await readJsonResponse(response, '流程檢查失敗。');
            if (!response.ok || !result.success) {
                throw new Error(result.message || '流程檢查失敗。');
            }
            return result.data || {};
        }

        function buildWorkflowConfirmMessage(assessment, fallbackMessage) {
            const impacts = Array.isArray(assessment.impacts) && assessment.impacts.length > 0
                ? `\n\n影響範圍：\n${assessment.impacts.map((impact) => `- ${impact}`).join('\n')}`
                : '';
            return `${assessment.message || fallbackMessage}${impacts}\n\n確定繼續嗎？`;
        }

        async function confirmWorkflowDelete(assessment, fallbackMessage, confirmText = '確定刪除') {
            if (typeof window.showWorkflowImpactConfirm === 'function') {
                return window.showWorkflowImpactConfirm({
                    title: '流程影響確認',
                    message: assessment.message || fallbackMessage,
                    impacts: Array.isArray(assessment.impacts) ? assessment.impacts : [],
                    recommendedAction: assessment.recommended_action || '',
                    severity: assessment.severity || 'info',
                    allowConfirm: !!assessment.allowed,
                    confirmText,
                    cancelText: '取消'
                });
            }
            if (!assessment.allowed) {
                return false;
            }
            return window.AppFeedback.confirm({ title: '流程影響確認', message: assessment.message || fallbackMessage, impact: (assessment.impacts || []).join('、'), guidance: assessment.recommended_action || '', confirmLabel: confirmText });
        }

        async function deleteOrder(id) {
            let assessment;
            try {
                assessment = await checkWorkflowDelete('orders', id);
            } catch (error) {
                showAlert('error', error.message || '流程檢查失敗。');
                return;
            }

            if (!assessment.allowed) {
                await confirmWorkflowDelete(assessment, '此訂單目前不可刪除。');
                return;
            }

            const confirmed = await confirmWorkflowDelete(assessment, '確認刪除此訂單資料？');
            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch(`api/orders/delete.php?id=${id}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ _method: 'DELETE' }),
                });

                const result = await readJsonResponse(response, '刪除失敗，請稍後再試。');
                if (!response.ok || !result.success) {
                    throw new Error(result.message || '刪除失敗，請稍後再試。');
                }

                showAlert('success', '訂單資料已刪除。');
                loadOrders(state.page);

                if (dataSyncHelper) {
                    dataSyncHelper.notifyDeleted({ id });
                }
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '刪除失敗，請稍後再試。');
            }
        }

        async function openModal(mode, data = null) {
            if (!modalOverlay || !modalForm || !modalTitle) {
                return;
            }

            state.currentEditingId = mode === 'edit' && data ? data.id : null;

            // 根據模式載入客戶列表
            // 新增模式：只顯示啟用中的客戶
            // 編輯模式：顯示全部，已停用的標註並灰顯（但允許選取當前已選的客戶）
            const currentCustomerId = mode === 'edit' && data ? (data.customer?.id || null) : null;
            await loadCustomers({
                includeInactive: mode === 'edit',
                currentCustomerId: currentCustomerId
            });

            if (mode === 'create') {
                modalTitle.textContent = '新增訂單';
                modalForm.reset();

                if (orderDateInput) {
                    const today = new Date().toISOString().split('T')[0];
                    orderDateInput.value = today;
                }
                if (statusSelect) {
                    statusSelect.value = 'pending';
                }

            } else if (mode === 'edit' && data) {
                modalTitle.textContent = '修改訂單';
                if (orderNumberInput) orderNumberInput.value = data.order_number || '';
                if (customerIdSelect) customerIdSelect.value = data.customer?.id || '';
                if (orderDateInput) orderDateInput.value = data.order_date || '';
                if (expectedDeliveryDateInput) expectedDeliveryDateInput.value = data.expected_delivery_date || '';
                if (expectedDeliveryPeriodSelect) expectedDeliveryPeriodSelect.value = data.expected_delivery_period || '';
                if (customerPoNumberInput) customerPoNumberInput.value = normalizeNullableText(data.customer_po_number);
                if (statusSelect) statusSelect.value = data.status || '';
                if (totalAmountInput) totalAmountInput.value = data.total_amount || '';
                if (finalQuotePerMInput) finalQuotePerMInput.value = data.final_quote_per_m ?? '';
                if (singlePpmInput) singlePpmInput.value = data.single_ppm ?? '';
                if (notesTextarea) notesTextarea.value = data.notes || '';
            }

            updateModalWeekday('order_date');
            updateModalWeekday('expected_delivery_date');
            state.formInitialSnapshot = new FormData(modalForm);
            isFormDirty = false;
            modalOverlay.classList.remove('hidden');
            if (orderNumberInput) orderNumberInput.focus();
        }

        function closeModal() {
            if (!modalOverlay) {
                return;
            }

            modalOverlay.classList.add('hidden');
            hideModalAlert();
            state.currentEditingId = null;
            state.formInitialSnapshot = null;
            isFormDirty = false;
        }

        async function submitForm() {
            if (!modalForm) {
                return;
            }

            const formData = new FormData(modalForm);
            const payload = {};

            for (const [key, value] of formData.entries()) {
                const trimmedValue = value.toString().trim();
                payload[key] = trimmedValue === '' ? null : trimmedValue;
            }

            const isEdit = state.currentEditingId !== null;

            // 更新時不要發送 order_number,因為訂單號碼不允許修改
            if (isEdit && payload.hasOwnProperty('order_number')) {
                delete payload.order_number;
            }
            const url = isEdit ? `api/orders/update.php?id=${state.currentEditingId}` : 'api/orders/index.php';
            const method = isEdit ? 'PUT' : 'POST';

            try {
                let requestOptions = {
                    method: method,
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(payload),
                };

                if (method === 'PUT') {
                    requestOptions = {
                        method: 'POST',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Accept': 'application/json',
                        },
                        body: toUrlEncodedPayload(payload, 'PUT'),
                    };
                }

                const response = await fetch(url, requestOptions);
                const result = await readJsonResponse(response, '訂單資料儲存失敗');

                if (!response.ok || !result.success) {
                    const validationDetails = result.errors && typeof result.errors === 'object'
                        ? Object.values(result.errors).filter(Boolean).join('、')
                        : '';
                    const message = result.message || '操作失敗，請稍後再試。';
                    throw new Error(validationDetails ? `${message} ${validationDetails}` : message);
                }

                const message = isEdit ? '訂單資料已更新。' : '訂單資料已建立。';
                showAlert('success', message);
                closeModal();
                await loadOrders(state.page);

                if (!isEdit && result.data?.id) {
                    const createdOrderId = Number.parseInt(result.data.id, 10);
                    if (Number.isInteger(createdOrderId) && state.currentRows.some((order) => Number.parseInt(order.id, 10) === createdOrderId)) {
                        expandedOrderIds.add(createdOrderId);
                        await loadOrderItemsForOrder(createdOrderId, true);
                        await openCreateOrderItemEditor(createdOrderId);
                    } else {
                        showAlert('success', `${message} 請在訂單列表展開該訂單以建立明細。`);
                    }
                }

                if (dataSyncHelper) {
                    if (isEdit) {
                        dataSyncHelper.notifyUpdated(result.data);
                    } else {
                        dataSyncHelper.notifyCreated(result.data);
                    }
                }
            } catch (error) {
                console.error(error);
                showModalAlert('error', error.message || '操作失敗，請稍後再試。', false);
            }
        }

        function openOrderItems(orderId) {
            if (typeof window.openTab === 'function') {
                window.openTab('order_items', '客戶批號', 'modules/order_items.html', {
                    // 此入口固定維持全域一覽，不把目前訂單情境覆蓋到同一個分頁。
                    context: null,
                });
            }
        }

        let orderItemEditorPromise = null;

        async function loadOrderItemEditor() {
            const existingRoot = moduleRoot.querySelector('[data-orders-order-item-editor-host] [data-module="order_items"]');
            if (existingRoot?.orderItemsController) {
                return existingRoot.orderItemsController;
            }
            if (orderItemEditorPromise) {
                return orderItemEditorPromise;
            }

            orderItemEditorPromise = (async () => {
                if (!window.ModuleAssets || typeof window.ModuleAssets.load !== 'function') {
                    throw new Error('模組資產載入器不可用。');
                }
                await window.ModuleAssets.load('order_items');

                const assetVersion = window.APP_ASSET_VERSION || document.documentElement.dataset.assetVersion || 'dev';
                const response = await fetch(`modules/order_items.html?v=${encodeURIComponent(assetVersion)}`, {
                    method: 'GET',
                    credentials: 'include',
                    cache: 'no-store',
                });
                if (!response.ok) {
                    throw new Error(`載入完整客戶批號表單失敗（${response.status}）。`);
                }

                const html = await response.text();
                const documentFragment = new DOMParser().parseFromString(html, 'text/html');
                const sourceModal = documentFragment.querySelector('[data-order-items-modal]');
                if (!sourceModal) {
                    throw new Error('找不到完整客戶批號表單。');
                }

                const host = document.createElement('div');
                host.setAttribute('data-orders-order-item-editor-host', '');
                const editorRoot = document.createElement('div');
                editorRoot.setAttribute('data-module', 'order_items');
                editorRoot.className = 'order-items-editor-only';
                editorRoot.appendChild(document.importNode(sourceModal, true));
                host.appendChild(editorRoot);
                moduleRoot.appendChild(host);

                if (typeof window.initializeOrderItemsModule !== 'function') {
                    throw new Error('完整客戶批號編輯器未正確載入。');
                }

                const controller = window.initializeOrderItemsModule(host, {
                    editorOnly: true,
                    onSaved: async (savedItem) => {
                        const affectedOrderId = Number.parseInt(savedItem?.order_id, 10);
                        await loadOrders(state.page);
                        if (Number.isInteger(affectedOrderId) && affectedOrderId > 0) {
                            expandedOrderIds.add(affectedOrderId);
                            await loadOrderItemsForOrder(affectedOrderId, true);
                        }
                        showAlert('success', '訂單細項已儲存。');
                    },
                });
                if (!controller) {
                    throw new Error('完整客戶批號編輯器初始化失敗。');
                }
                return controller;
            })().catch((error) => {
                moduleRoot.querySelectorAll('[data-orders-order-item-editor-host]').forEach((host) => {
                    const editorRoot = host.querySelector('[data-module="order_items"]');
                    if (!editorRoot?.orderItemsController) {
                        host.remove();
                    }
                });
                orderItemEditorPromise = null;
                throw error;
            });

            return orderItemEditorPromise;
        }

        async function openOrderItemEditor(orderId, orderItemId) {
            try {
                const editor = await loadOrderItemEditor();
                await editor.openEdit(getOrderContext(orderId), orderItemId);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '完整客戶批號編輯器尚未載入。');
            }
        }

        async function openCreateOrderItemEditor(orderId, initialData = null) {
            try {
                const editor = await loadOrderItemEditor();
                await editor.openCreate(getOrderContext(orderId), initialData);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '完整客戶批號編輯器尚未載入。');
            }
        }

        async function deleteOrderItemInline(orderId, orderItemId) {
            const items = orderItemsCache.get(orderId) || [];
            const item = items.find((candidate) => Number.parseInt(candidate.id, 10) === orderItemId);
            const confirmed = await window.AppFeedback.confirm({ title: '刪除訂單品項', message: `確認刪除「${getOrderItemDeleteLabel(item)}」？`, impact: '相關工單、庫存或出貨資料可能阻擋此操作', confirmLabel: '確認刪除' });
            if (!confirmed) {
                return;
            }

            try {
                const response = await fetch(`api/order_items/delete.php?id=${encodeURIComponent(orderItemId)}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ _method: 'DELETE' }),
                });

                const result = await readJsonResponse(response, '刪除訂單細項失敗。');
                if (!response.ok || !result.success) {
                    throw new Error(result.message || '刪除訂單細項失敗。');
                }

                showAlert('success', '訂單細項已刪除。');
                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('order_items', DataSync.EVENT_TYPES.DELETED, { id: orderItemId, order_id: orderId });
                }

                await loadOrderItemsForOrder(orderId, true);
                await loadOrders(state.page);
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '刪除訂單細項失敗。');
            }
        }

        // ========== 勾選與批次列印功能 ==========

        function updateSelectionUI() {
            const count = selectedOrders.size;

            // 更新批次列印按鈕狀態
            if (batchPrintButton) {
                batchPrintButton.disabled = count === 0;
            }

            // 更新批次匯出按鈕狀態
            if (batchExportButton) {
                batchExportButton.disabled = count === 0;
                // 關閉下拉（若剛變為 disabled）
                if (count === 0 && exportMenu) exportMenu.classList.add('hidden');
            }

            // 更新匯出數量 badge
            if (exportCountBadge) {
                exportCountBadge.textContent = count;
                if (count > 0) {
                    exportCountBadge.classList.remove('hidden');
                } else {
                    exportCountBadge.classList.add('hidden');
                }
            }

            // 更新選取數量 badge
            if (selectionCountBadge) {
                selectionCountBadge.textContent = count;
                if (count > 0) {
                    selectionCountBadge.classList.remove('hidden');
                } else {
                    selectionCountBadge.classList.add('hidden');
                }
            }

            // 更新全選 checkbox 狀態
            if (selectAllCheckbox && tableBody) {
                const checkboxes = tableBody.querySelectorAll('input[data-action="select-row"]');
                const checkedCount = tableBody.querySelectorAll('input[data-action="select-row"]:checked').length;
                selectAllCheckbox.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
                selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
            }
        }

        function handleRowSelect(checkbox, row) {
            const id = parseInt(row.dataset.id, 10);
            if (checkbox.checked) {
                selectedOrders.add(id);
            } else {
                selectedOrders.delete(id);
            }
            updateSelectionUI();
        }

        function handleSelectAll(checked) {
            if (!tableBody) return;

            const checkboxes = tableBody.querySelectorAll('input[data-action="select-row"]');
            checkboxes.forEach(cb => {
                cb.checked = checked;
                const row = cb.closest('tr');
                if (row) {
                    const id = parseInt(row.dataset.id, 10);
                    if (checked) {
                        selectedOrders.add(id);
                    } else {
                        selectedOrders.delete(id);
                    }
                }
            });
            updateSelectionUI();
        }

        // 格式化民國年日期
        function formatTaiwanDate(dateStr) {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const year = date.getFullYear() - 1911;
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        // 列印單筆訂單
        async function printSingleOrder(orderId) {
            try {
                // 先從快取取得基本資訊
                const order = ordersCache.get(orderId);
                if (!order) {
                    showAlert('error', '找不到訂單資料');
                    return;
                }

                // 取得客戶 ID
                const customerId = order.customer_id || '';

                // 開啟列印頁面，傳入訂單 ID、客戶 ID 和公司 ID
                const printUrl = `print/order_confirmation_print.html?order_id=${orderId}&customer_id=${customerId}&company_id=1`;
                window.open(printUrl, '_blank');

            } catch (error) {
                console.error('列印失敗:', error);
                showAlert('error', error.message || '列印失敗，請稍後再試');
            }
        }

        // ========== 批次匯出 CSV ==========
        async function batchExportCsv() {
            if (selectedOrders.size === 0) {
                showAlert('warning', '請先勾選要匯出的訂單');
                return;
            }

            showAlert('info', `正在準備 ${selectedOrders.size} 筆訂單的 CSV 資料...`);

            const orderIds = Array.from(selectedOrders);
            const allOrders = [];

            for (const orderId of orderIds) {
                const response = await fetch(`api/orders/show.php?id=${orderId}&include=items,customer`, {
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) allOrders.push(result.data);
                }
            }

            if (allOrders.length === 0) {
                showAlert('error', '無法載入任何訂單資料');
                return;
            }

            // 組合 CSV
            const BOM = '\uFEFF';
            const lines = [];

            // 訂單主表標題
            lines.push([
                '訂單ID', '訂單編號', '客戶名稱', '客戶訂單號', '訂單日期', '預訂交期', '狀態', '預估總金額', '最終報價(元/M)', '備註'
            ].map(escapeCsvCell).join(','));

            for (const order of allOrders) {
                const customer = order.customer || {};
                // 訂單主表行
                lines.push([
                    order.id,
                    order.order_number,
                    customer.name || '',
                    normalizeNullableText(order.customer_po_number),
                    order.order_date || '',
                    order.expected_delivery_date || '',
                    order.status_label || order.status || '',
                    order.total_amount || '',
                    order.final_quote_per_m || '',
                    order.notes || ''
                ].map(escapeCsvCell).join(','));

                const items = order.items || order.order_items || [];
                if (items.length > 0) {
                    // 明細標題（僅輸出一次，在第一筆明細前）
                    lines.push([
                        '', '明細-批號', '明細-客戶批號', '明細-料號', '明細-圖號', '明細-受篩產品', '明細-總重(kg)',
                        '明細-單重(g)', '明細-支數', '明細-交期', '明細-交期時段', '明細-指送地點', '明細-客戶樣品狀態', '明細-重量追蹤-客戶提供重量(kg)',
                        '明細-重量追蹤-確認重量(kg)', '明細-備註'
                    ].map(escapeCsvCell).join(','));
                    for (const item of items) {
                        const itemName = item.screening_item ? (item.screening_item.name || '') : '';
                        const unitW = item.screening_item && item.screening_item.weight_per_unit_g
                            ? formatNumber(item.screening_item.weight_per_unit_g, 4) : '';
                        lines.push([
                            '',
                            item.sub_item_number || '',
                            item.customer_batch_number || '',
                            item.part_number || '',
                            item.drawing_number || '',
                            itemName,
                            item.total_weight_kg != null && item.total_weight_kg !== '' ? formatNumber(item.total_weight_kg, 2) : '',
                            unitW,
                            item.total_units || '',
                            item.expected_delivery_date || '',
                            getExpectedDeliveryPeriodLabel(item.expected_delivery_period),
                            item.delivery_location || '',
                            item.customer_sample_status_label || item.customer_sample_status || '',
                            item.customer_provided_weight != null && item.customer_provided_weight !== '' ? formatNumber(item.customer_provided_weight, 2) : '',
                            item.confirmed_weight != null && item.confirmed_weight !== '' ? formatNumber(item.confirmed_weight, 2) : '',
                            item.notes || ''
                        ].map(escapeCsvCell).join(','));
                    }
                }
            }

            const csvContent = BOM + lines.join('\r\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orders_batch_${formatDateForFilename()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            showAlert('success', `已匯出 ${allOrders.length} 筆訂單的 CSV 檔案`);
        }

        function escapeCsvCell(val) {
            const s = String(val === null || val === undefined ? '' : val);
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                return '"' + s.replace(/"/g, '""') + '"';
            }
            return s;
        }

        function formatDateForFilename() {
            const d = new Date();
            const pad = n => String(n).padStart(2, '0');
            return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
        }

        // ========== 批次匯出 PDF（新視窗列印另存） ==========
        async function batchExportPdf() {
            if (selectedOrders.size === 0) {
                showAlert('warning', '請先勾選要匯出的訂單');
                return;
            }

            const printWindow = window.open('', '_blank', 'width=900,height=700');
            if (!printWindow) {
                showAlert('error', '無法開啟新視窗，請允許彈出視窗');
                return;
            }

            printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>訂單批次匯出 PDF</title>
<style>
@page { size: A4; margin: 10mm; }
body { font-family: "Microsoft JhengHei", "微軟正黑體", sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
.page-container { background: #fff; padding: 16mm; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,.15); page-break-after: always; }
.page-container:last-child { page-break-after: auto; }
.title { font-size: 18pt; font-weight: bold; text-align: center; margin-bottom: 16px; }
.order-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 14px; border: 1px solid #ccc; padding: 10px; border-radius: 4px; }
.order-meta .row { display: contents; }
.order-meta .label { font-size: 9pt; color: #555; }
.order-meta .value { font-size: 9pt; font-weight: bold; }
table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 9pt; }
thead tr { background: #f0f0f0; }
th, td { border: 1px solid #ccc; padding: 5px 7px; text-align: left; vertical-align: top; }
th { font-weight: bold; white-space: nowrap; }
.section-title { font-size: 11pt; font-weight: bold; margin: 14px 0 6px; border-bottom: 2px solid #333; padding-bottom: 3px; }
.no-print { position: fixed; bottom: 24px; right: 24px; z-index: 999; }
.no-print button { padding: 12px 24px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,.25); }
@media print {
    .no-print { display: none !important; }
    body { background: white; padding: 0; }
    .page-container { box-shadow: none; margin: 0; }
}
</style></head><body>`);

            printWindow.document.write(`<div class="loading" style="text-align:center;padding:40px"><i>載入中…</i></div>`);

            const orderIds = Array.from(selectedOrders);
            const allOrders = [];

            for (const orderId of orderIds) {
                const response = await fetch(`api/orders/show.php?id=${orderId}&include=items,customer`, {
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) allOrders.push(result.data);
                }
            }

            if (allOrders.length === 0) {
                printWindow.close();
                showAlert('error', '無法載入任何訂單資料');
                return;
            }

            const pagesHtml = allOrders.map(order => {
                const customer = order.customer || {};
                const items = order.items || order.order_items || [];
                const itemsHtml = items.length > 0 ? `
<div class="section-title">批號明細</div>
<table>
    <thead><tr>
        <th>批號</th><th>客戶批號</th><th>受篩產品</th><th>細項交期</th><th>總重(kg)</th><th>載具重(kg)</th>
        <th>單重(g)</th><th>支數</th><th>指送地點</th><th>備註</th>
    </tr></thead>
    <tbody>${items.map(item => {
        const itemName = item.screening_item ? (item.screening_item.name || '-') : '-';
        const unitW = item.screening_item && item.screening_item.weight_per_unit_g ? formatNumber(item.screening_item.weight_per_unit_g, 4) : '-';
        const toolW = item.totals ? (item.totals.tool_weight_kg || 0) : 0;
        return `<tr>
            <td>${escapeHtml(item.sub_item_number || '-')}</td>
            <td>${escapeHtml(item.customer_batch_number || '-')}</td>
            <td>${escapeHtml(itemName)}</td>
            <td>${escapeHtml(getOrderItemExpectedDeliveryLabel(item))}</td>
            <td style="text-align:right">${item.total_weight_kg != null && item.total_weight_kg !== '' ? formatNumber(item.total_weight_kg, 2) : '-'}</td>
            <td style="text-align:right">${formatNumber(toolW, 2)}</td>
            <td style="text-align:right">${unitW}</td>
            <td style="text-align:right">${item.total_units ? Number(item.total_units).toLocaleString() : '-'}</td>
            <td>${escapeHtml(item.delivery_location || '-')}</td>
            <td>${escapeHtml(item.notes || '')}</td>
        </tr>`;
    }).join('')}</tbody>
</table>` : '<p style="color:#999;font-size:9pt">（無批號明細）</p>';

                return `
<div class="page-container">
    <div class="title">訂單資料 - ${escapeHtml(order.order_number)}</div>
    <div class="order-meta">
        <span class="label">訂單編號</span><span class="value">${escapeHtml(order.order_number)}</span>
        <span class="label">客戶名稱</span><span class="value">${escapeHtml(customer.name || '-')}</span>
        <span class="label">客戶訂單號</span><span class="value">${escapeHtml(displayNullableText(order.customer_po_number))}</span>
        <span class="label">訂單日期</span><span class="value">${order.order_date || '-'}</span>
        <span class="label">預訂交期</span><span class="value">${order.expected_delivery_date || '-'}${order.expected_delivery_period ? ` ${escapeHtml(getExpectedDeliveryPeriodLabel(order.expected_delivery_period))}` : ''}</span>
        <span class="label">狀態</span><span class="value">${escapeHtml(order.status_label || order.status || '-')}</span>
        <span class="label">預估總金額</span><span class="value">${order.total_amount ? '$' + Number(order.total_amount).toLocaleString('zh-TW', {minimumFractionDigits:2}) : '-'}</span>
        <span class="label">最終報價(元/M)</span><span class="value">${order.final_quote_per_m !== null && order.final_quote_per_m !== undefined && order.final_quote_per_m !== '' ? Number(order.final_quote_per_m).toLocaleString('zh-TW', {minimumFractionDigits:2, maximumFractionDigits:2}) : '-'}</span>
        <span class="label">備註</span><span class="value">${escapeHtml(order.notes || '-')}</span>
    </div>
    ${itemsHtml}
</div>`;
            }).join('');

            printWindow.document.open();
            printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>訂單批次匯出 PDF</title>
<style>
@page { size: A4; margin: 10mm; }
body { font-family: "Microsoft JhengHei", "微軟正黑體", sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
.page-container { background: #fff; padding: 16mm; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,.15); page-break-after: always; }
.page-container:last-child { page-break-after: auto; }
.title { font-size: 18pt; font-weight: bold; text-align: center; margin-bottom: 16px; }
.order-meta { display: grid; grid-template-columns: max-content 1fr max-content 1fr; gap: 6px 16px; margin-bottom: 14px; border: 1px solid #ccc; padding: 10px; border-radius: 4px; font-size: 9pt; }
.order-meta .label { color: #555; white-space: nowrap; }
.order-meta .value { font-weight: bold; }
table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 9pt; }
thead tr { background: #f0f0f0; }
th, td { border: 1px solid #ccc; padding: 5px 7px; text-align: left; vertical-align: top; }
th { font-weight: bold; white-space: nowrap; }
.section-title { font-size: 11pt; font-weight: bold; margin: 14px 0 6px; border-bottom: 2px solid #333; padding-bottom: 3px; }
.no-print { position: fixed; bottom: 24px; right: 24px; z-index: 999; }
.no-print button { padding: 12px 24px; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,.25); }
@media print { .no-print { display: none !important; } body { background: white; padding: 0; } .page-container { box-shadow: none; margin: 0; } }
</style></head><body>
${pagesHtml}
<div class="no-print">
    <button onclick="window.print()">列印 / 另存 PDF（${allOrders.length} 筆）</button>
</div>
</body></html>`);
            printWindow.document.close();
        }

        // 批次列印
        async function printBatchOrders() {
            if (selectedOrders.size === 0) {
                showAlert('warning', '請先勾選要列印的訂單');
                return;
            }

            const confirmed = await window.AppFeedback.confirm({ title: '批次列印訂單', message: `將開啟 ${selectedOrders.size} 筆訂單的列印頁。`, danger: false, confirmLabel: '繼續列印' });
            if (!confirmed) return;

            try {
                const printWindow = window.open('', '_blank');
                if (!printWindow) {
                    showAlert('error', '無法開啟列印視窗，請檢查瀏覽器是否封鎖彈出視窗');
                    return;
                }

                // 顯示載入中
                printWindow.document.write(`
                    <!DOCTYPE html>
                    <html lang="zh-TW">
                    <head>
                        <meta charset="UTF-8">
                        <title>批次列印中...</title>
                        <style>
                            body { font-family: "Microsoft JhengHei", sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                            .loading { text-align: center; }
                            .loading i { font-size: 48px; color: #4CAF50; animation: spin 1s linear infinite; }
                            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                        </style>
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
                    </head>
                    <body>
                        <div class="loading">
                            <i class="fas fa-spinner"></i>
                            <p>正在準備 ${selectedOrders.size} 筆訂單資料...</p>
                        </div>
                    </body>
                    </html>
                `);

                // 逐筆取得訂單資料
                const orderIds = Array.from(selectedOrders);
                const ordersData = [];

                for (const orderId of orderIds) {
                    const response = await fetch(`api/orders/show.php?id=${orderId}&include=items,customer`, {
                        method: 'GET',
                        credentials: 'include',
                        headers: { 'Accept': 'application/json' }
                    });

                    if (response.ok) {
                        const result = await response.json();
                        if (result.success && result.data) {
                            ordersData.push(result.data);
                        }
                    }
                }

                if (ordersData.length === 0) {
                    printWindow.close();
                    showAlert('error', '無法載入任何訂單資料');
                    return;
                }

                // 產生批次列印內容
                const printContent = generateBatchPrintContent(ordersData);
                printWindow.document.open();
                printWindow.document.write(printContent);
                printWindow.document.close();

            } catch (error) {
                console.error('批次列印失敗:', error);
                showAlert('error', error.message || '批次列印失敗，請稍後再試');
            }
        }

        // 產生批次列印內容（多頁）
        function generateBatchPrintContent(orders) {
            const creatorName = window.currentUser && (window.currentUser.name || window.currentUser.account)
                ? String(window.currentUser.name || window.currentUser.account)
                : '';
            const pages = orders.map(order => {
                const customer = order.customer || {};
                const items = order.items || order.order_items || [];
                const batchSectionsHtml = items.length > 0 ? items.map(item => {
                    const si = item.screening_item || {};
                    const toolsSummary = item.tools_summary || {};
                    const itemName = [si.item_number, si.name].filter(Boolean).join(' - ') || '-';
                    const toolWeight = Number((toolsSummary && toolsSummary.total_weight_kg) || (item.totals && item.totals.tool_weight_kg) || 0);
                    const productWeight = Number(item.total_weight_kg || 0);
                    const totalWeightWithTool = productWeight + toolWeight;
                    const netWeight = item.totals && item.totals.net_weight_kg != null
                        ? Number(item.totals.net_weight_kg)
                        : Math.max(0, productWeight - toolWeight);
                    const toolsDisplay = item.tools && item.tools.length > 0
                        ? item.tools.map(t => `${t.quantity} ${t.tool_name || ''}`.trim()).join(', ')
                        : (toolsSummary.total_quantity > 0 ? String(toolsSummary.total_quantity) : '');
                    const sampleStatus = item.customer_sample_status_label || mapSampleStatusToZh(item.customer_sample_status) || '';

                    return `
    <div class="batch-section">
        <div class="batch-subtitle">批號：${escapeHtml(item.customer_batch_number || '-')}</div>
        <table class="batch-info-table">
            <tbody>
                <tr>
                    <th>受篩品項</th>
                    <td colspan="3">${escapeHtml(itemName)}</td>
                    <th>圖面編號</th>
                    <td colspan="3">${item.drawing_number ? escapeHtml(item.drawing_number) : '&nbsp;'}</td>
                </tr>
                <tr>
                    <th class="weight-total-label">總重量(含載具kg)</th>
                    <td class="text-right">${Number.isFinite(totalWeightWithTool) ? formatNumber(totalWeightWithTool, 2) : '&nbsp;'}</td>
                    <th>載具數</th>
                    <td>${toolsDisplay ? escapeHtml(toolsDisplay) : '&nbsp;'}</td>
                    <th>載具重(kg)</th>
                    <td class="text-right">${toolWeight ? formatNumber(toolWeight, 2) : '&nbsp;'}</td>
                    <th>單重(g)</th>
                    <td class="text-right">${si.weight_per_unit_g ? formatNumber(si.weight_per_unit_g, 2) : '&nbsp;'}</td>
                </tr>
                <tr>
                    <th>支數</th>
                    <td class="text-right">${item.total_units ? formatNumber(Math.round(item.total_units)) : '&nbsp;'}</td>
                    <th>樣品狀態</th>
                    <td>${sampleStatus ? escapeHtml(sampleStatus) : '&nbsp;'}</td>
                    <th>料號</th>
                    <td>${item.part_number ? escapeHtml(item.part_number) : '&nbsp;'}</td>
                    <th>淨重(kg)</th>
                    <td class="text-right">${Number.isFinite(netWeight) ? formatNumber(netWeight, 2) : '&nbsp;'}</td>
                </tr>
                <tr>
                    <th>細項交期</th>
                    <td colspan="3">${item.expected_delivery_date ? escapeHtml(getOrderItemExpectedDeliveryLabel(item)) : '&nbsp;'}</td>
                    <th>指送地點</th>
                    <td>${item.delivery_location ? escapeHtml(item.delivery_location) : '&nbsp;'}</td>
                    <th>備註</th>
                    <td>${item.notes ? escapeHtml(item.notes) : '&nbsp;'}</td>
                </tr>
            </tbody>
        </table>
    </div>`;
                }).join('') : '<p style="color: #999; font-size: 10pt;">（無批號明細）</p>';

                return `
<div class="page-container">
    <div class="header-section">
        <div class="main-title">客戶光篩代工委託確認單</div>
    </div>

    <div class="info-grid">
        <div class="customer-info">
            <div class="name">${escapeHtml(customer.name || '-')}</div>
            <div class="detail">${escapeHtml(customer.address || '-')}</div>
            <div class="detail">${escapeHtml(customer.phone || '-')} &nbsp;&nbsp;&nbsp;&nbsp; 聯絡窗口：${escapeHtml(customer.contact_person || '-')}</div>
        </div>
        <div class="order-info">
            <div class="order-no">${escapeHtml(order.order_number)}</div>
            <div class="order-date">${formatTaiwanDate(order.order_date)}</div>
        </div>
    </div>

    <div class="customer-po-row">
        <span class="label">客戶訂單編號</span>
        <span>${escapeHtml(displayNullableText(order.customer_po_number))}</span>
    </div>

    ${batchSectionsHtml}

    <div class="notes-container">
        <div class="notes-header">備註</div>
        <div class="notes-box">
            ${order.notes ? `<p>${escapeHtml(order.notes)}</p>` : ''}
            <ol class="notes-list">
                <li>請依第三項貴司指定篩選項目及各項公差值複驗品質，唯在篩選過程中，會有輕微電鍍磨損，望貴司知悉。</li>
                <li>入貨檢驗請貴司務必於貨物入廠簽收完成後(一週內)進行進貨檢驗動作，經檢驗發現品質異常時，煩請於第一時間回饋本公司，本公司將竭盡所能進行對策改善及服務。超出期限，恕不負責。</li>
                <li>茲因貨物一旦未於期限驗收完成，出貨到海外有諸多不可控因素，實為我司無法掌控，望請貴司海涵。</li>
            </ol>
        </div>
    </div>

    <div class="blessing">祈貴公司生意興隆，雙方合作愉快。</div>

    <div class="confirmation-area">
        <div class="confirm-stamp">客戶確認</div>
        <div class="confirm-signature"></div>
        <div class="confirm-msg">以上訂單資料、篩選內容確認無誤後，盡速回傳以利安排上線。謝謝。</div>
    </div>

    <div class="sign-area">
        <div class="sign-box">承認</div>
        <div class="sign-box">審核</div>
        <div class="sign-box"><span class="sign-title">作成</span><span class="sign-name">${escapeHtml(creatorName)}</span></div>
    </div>

    <footer>
        <div class="footer-brand">
            <div class="zh">羽全有限公司</div>
            <div class="en">YU CYUAN CO., LTD</div>
        </div>
        <div class="footer-contacts">
            高雄市路竹區大仁路 584-23 號<br>
            電話：07-696-2727<br>
            傳真：07-696-1919<br>
            統編：59182131
        </div>
    </footer>
</div>`;
            }).join('\n');

            return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>批次列印 - 客戶光篩代工委託確認單 (${orders.length} 筆)</title>
    <style>
        @page { size: A4; margin: 8mm; }
        * { box-sizing: border-box; }
        body {
            font-family: "Microsoft JhengHei", "SimHei", sans-serif;
            margin: 0; padding: 0;
            background-color: #f4f4f4;
            color: #000; font-size: 9pt; line-height: 1.25;
        }
        .page-container {
            background-color: white;
            width: 210mm; height: 297mm;
            margin: 10px auto; padding: 8mm;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            overflow: hidden;
            page-break-after: always;
        }
        .page-container:last-child { page-break-after: auto; }
        .header-section {
            display: flex; justify-content: flex-start; align-items: center;
            border-bottom: 2px solid #000;
            margin-bottom: 6px; padding-bottom: 4px;
        }
        .main-title { font-size: 22pt; font-weight: bold; letter-spacing: 2px; }
        .info-grid {
            display: flex; justify-content: space-between; align-items: flex-end;
            margin-bottom: 8px;
        }
        .customer-info { line-height: 1.3; }
        .customer-info .name { font-size: 14pt; font-weight: bold; margin-bottom: 2px; }
        .customer-info .detail { font-size: 9pt; }
        .order-info { text-align: right; line-height: 1.4; }
        .order-info .order-no { font-size: 12pt; }
        .order-info .order-date { font-size: 10pt; }
        .customer-po-row {
            display: grid;
            grid-template-columns: 24mm 1fr;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            margin-bottom: 4px;
            font-size: 8.8pt;
        }
        .customer-po-row .label {
            background-color: #e6e6e6;
            font-weight: bold;
            padding: 2px 4px;
        }
        .customer-po-row span:last-child { padding: 2px 4px; }
        table {
            width: 100%; border-collapse: collapse; table-layout: fixed;
            margin-bottom: 8px;
            border-top: 1px solid #000; border-bottom: 1px solid #000;
            border-left: none; border-right: none;
        }
        th, td {
            border: 1px solid #777; padding: 3px 5px;
            text-align: left; vertical-align: middle; font-size: 9pt;
        }
        th:first-child, td:first-child { border-left: none; }
        th:last-child, td:last-child { border-right: none; }
        th { background-color: #e6e6e6; font-weight: bold; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .batch-section { margin-bottom: 4px; }
        .batch-subtitle {
            font-size: 9.5pt;
            font-weight: bold;
            margin: 1px 0;
        }
        .batch-info-table { margin-bottom: 2px; }
        .batch-info-table th {
            width: 12%;
            white-space: nowrap;
            font-size: 8.5pt;
        }
        .batch-info-table td { font-size: 8.8pt; }
        .batch-info-table th,
        .batch-info-table td { padding: 2px 4px; }
        .batch-info-table th.weight-total-label {
            font-size: 7.2pt;
            padding-left: 2px;
            padding-right: 2px;
            white-space: nowrap;
        }
        .notes-container { margin-top: 10px; }
        .notes-header {
            background-color: #e6e6e6; border: 1px solid #000; border-bottom: none;
            padding: 3px 10px; font-weight: bold; display: inline-block; font-size: 9pt;
        }
        .notes-box {
            border: 1px solid #000; border-left: none; border-right: none;
            padding: 6px 10px; font-size: 8pt; line-height: 1.4; background-color: #fff;
        }
        .notes-list { margin: 0; padding-left: 18px; }
        .notes-list li { margin-bottom: 2px; }
        .blessing { text-align: center; margin: 10px 0; font-size: 9pt; }
        .confirmation-area {
            display: grid;
            grid-template-columns: auto 1fr;
            border: 2px solid #000;
            margin-bottom: 15px;
        }
        .confirm-stamp {
            background-color: #e6e6e6; border-right: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 8px 25px; font-weight: bold; font-size: 12pt; white-space: nowrap;
            grid-column: 1; grid-row: 1;
        }
        .confirm-signature {
            grid-column: 2; grid-row: 1;
            min-height: 52px;
            border-bottom: 2px solid #000;
        }
        .confirm-msg {
            grid-column: 2; grid-row: 2;
            padding: 6px 15px; font-size: 9pt;
        }
        .sign-area {
            display: flex; justify-content: flex-start; margin-top: 12px;
            margin-bottom: 2mm;
            border-top: 1px solid #ccc; padding-top: 6px;
        }
        .sign-box { width: 120px; text-align: center; margin-left: 30px; font-size: 10pt; line-height: 1; }
        .sign-box:first-child { margin-left: 0; }
        .sign-box .sign-title { display: inline-block; vertical-align: top; line-height: 11pt; }
        .sign-box .sign-name {
            display: inline-block;
            min-height: 0;
            margin-left: 6px;
            font-size: 11pt;
            font-weight: 700;
            vertical-align: top;
            line-height: 11pt;
        }
        footer {
            margin-top: 6px; border-top: 2px solid #000; padding-top: 8px;
            display: flex; justify-content: space-between; align-items: flex-end;
            min-height: 18mm;
            overflow: hidden;
        }
        .footer-brand .zh { font-size: 18pt; font-weight: bold; line-height: 1; }
        .footer-brand .en { font-size: 9pt; letter-spacing: 1px; margin-top: 2px; }
        .footer-contacts { text-align: right; font-size: 8pt; line-height: 1.25; }
        @media print {
            .no-print { display: none !important; }
            body { background-color: white; -webkit-print-color-adjust: exact; }
            .page-container { margin: 0; width: 100%; height: auto; box-shadow: none; padding: 8mm; }
        }
        @media screen {
            body { padding: 20px; }
        }
    </style>
</head>
<body>
${pages}
<div class="no-print" style="position: fixed; bottom: 30px; right: 30px; z-index: 999;">
    <button onclick="window.print()" style="padding: 15px 30px; background: #4CAF50; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
        列印全部 ${orders.length} 筆 (A4)
    </button>
</div>
</body>
</html>`;
        }

        if (headerCreateButton) {
            headerCreateButton.addEventListener('click', () => openModal('create'));
        }

        // 批次列印按鈕
        if (batchPrintButton) {
            batchPrintButton.addEventListener('click', printBatchOrders);
        }

        // 批次匯出按鈕（切換下拉選單）
        if (batchExportButton && exportMenu) {
            batchExportButton.addEventListener('click', (e) => {
                e.stopPropagation();
                exportMenu.classList.toggle('hidden');
            });
            // 點擊其他地方關閉下拉
            document.addEventListener('click', () => exportMenu.classList.add('hidden'));
        }
        if (exportCsvButton) {
            exportCsvButton.addEventListener('click', () => {
                exportMenu.classList.add('hidden');
                batchExportCsv();
            });
        }
        if (exportPdfButton) {
            exportPdfButton.addEventListener('click', () => {
                exportMenu.classList.add('hidden');
                batchExportPdf();
            });
        }

        // 全選 checkbox
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                handleSelectAll(e.target.checked);
            });
        }

        if (modalCloseButton) {
            modalCloseButton.addEventListener('click', closeModal);
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', closeModal);
        }

        if (orderDateInput) {
            orderDateInput.addEventListener('change', () => updateModalWeekday('order_date'));
        }

        if (expectedDeliveryDateInput) {
            expectedDeliveryDateInput.addEventListener('change', () => updateModalWeekday('expected_delivery_date'));
        }

        if (modalForm) {
            modalForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                await submitForm();
            });
        }

        if (filterForm) {
            filterForm.addEventListener('submit', (event) => {
                event.preventDefault();
                closeFilterDrawer();
                loadOrders(1);
            });
        }

        if (resetFilterButton) {
            resetFilterButton.addEventListener('click', () => {
                if (filterForm) {
                    filterForm.reset();
                    updateFilterSummary();
                    loadOrders(1);
                }
            });
        }

        if (tableBody) {
            tableBody.addEventListener('click', (event) => {
                const inlineSortHeader = event.target.closest('.order-items-inline-table th[data-sort]');
                if (inlineSortHeader) {
                    const detailRow = inlineSortHeader.closest('.order-items-detail-row');
                    const orderId = Number.parseInt(detailRow?.dataset.parentId || '', 10);
                    if (Number.isInteger(orderId) && orderItemSelection) {
                        orderItemSelection.toggleSort(orderId, inlineSortHeader.dataset.sort);
                        renderCurrentOrders();
                    }
                    return;
                }

                const target = event.target.closest('button[data-action]');

                // 處理 checkbox 點擊
                if (event.target.matches('input[data-action="select-row"]')) {
                    const row = event.target.closest('tr');
                    if (row) {
                        handleRowSelect(event.target, row);
                    }
                    return;
                }

                if (event.target.matches('input[data-action="select-order-item-inline"]')) {
                    orderItemSelection?.select(event.target);
                    return;
                }

                if (!target) return;

                const action = target.dataset.action;
                if (action === 'copy-order-item') {
                    const orderId = Number.parseInt(target.dataset.orderId || '', 10);
                    if (Number.isInteger(orderId) && orderItemSelection) {
                        orderItemSelection.copy(orderId, target);
                    } else if (!orderItemSelection) {
                        showAlert('error', '訂單細項複製功能尚未載入，請重新整理後再試。');
                    }
                    return;
                }

                if (action === 'add-order-item') {
                    const orderId = Number.parseInt(target.dataset.orderId || '', 10);
                    if (Number.isInteger(orderId)) {
                        openCreateOrderItemEditor(orderId);
                    }
                    return;
                }

                if (action === 'open-screening-history') {
                    const orderId = Number.parseInt(target.dataset.orderId || '', 10);
                    if (Number.isInteger(orderId)) {
                        openScreeningHistoryModal(orderId);
                    }
                    return;
                }

                if (action === 'edit-order-item-inline') {
                    const orderId = Number.parseInt(target.dataset.orderId || '', 10);
                    const orderItemId = Number.parseInt(target.dataset.orderItemId || '', 10);
                    if (Number.isInteger(orderId) && Number.isInteger(orderItemId)) {
                        openOrderItemEditor(orderId, orderItemId);
                    }
                    return;
                }

                if (action === 'create-work-order') {
                    const orderItemId = Number.parseInt(target.dataset.orderItemId || '', 10);
                    if (!Number.isInteger(orderItemId)) {
                        return;
                    }

                    const hasWorkOrder = target.getAttribute('data-has-work-order') === 'true';
                    if (hasWorkOrder) {
                        showAlert('error', '此客戶批號已轉成工單，請勿重複建立。');
                        return;
                    }

                    handleCreateWorkOrder(orderItemId);
                    return;
                }

                if (action === 'delete-order-item-inline') {
                    const orderId = Number.parseInt(target.dataset.orderId || '', 10);
                    const orderItemId = Number.parseInt(target.dataset.orderItemId || '', 10);
                    if (Number.isInteger(orderId) && Number.isInteger(orderItemId)) {
                        deleteOrderItemInline(orderId, orderItemId);
                    }
                    return;
                }

                if (action === 'view-order-details') {
                    const orderId = Number.parseInt(target.dataset.orderId || '', 10);
                    if (Number.isInteger(orderId)) {
                        openOrderDetailDrawer(orderId);
                    }
                    return;
                }

                if (action === 'open-order-items') {
                    const orderId = Number.parseInt(target.dataset.orderId || '', 10);
                    if (Number.isInteger(orderId)) {
                        openOrderItems(orderId);
                    }
                    return;
                }

                if (action === 'open-customer') {
                    const customerId = Number.parseInt(target.dataset.customerId || '', 10);
                    if (Number.isInteger(customerId) && typeof window.openTab === 'function') {
                        window.openTab('customers', '客戶基本資料', 'modules/customers.html', {
                            context: { customerId }
                        });
                    }
                    return;
                }

                const row = target.closest('tr');
                const id = row ? parseInt(row.dataset.id, 10) : null;

                if (!id) return;

                switch (action) {
                    case 'print-single':
                        printSingleOrder(id);
                        break;
                    case 'details':
                        toggleOrderItems(id);
                        break;
                    case 'edit':
                        openEditModal(id);
                        break;
                    case 'delete':
                        deleteOrder(id);
                        break;
                }
            });
        }

        orderDetailCloseButton?.addEventListener('click', closeOrderDetailDrawer);
        orderDetailOverlay?.addEventListener('click', closeOrderDetailDrawer);
        screeningHistoryCloseButton?.addEventListener('click', closeScreeningHistoryModal);
        screeningHistoryModal?.addEventListener('click', (event) => {
            if (event.target === screeningHistoryModal) {
                closeScreeningHistoryModal();
                return;
            }
            const selectButton = event.target.closest('button[data-action="select-screening-history"]');
            if (!selectButton || !screeningHistoryOrderId) return;
            const screeningItemId = Number.parseInt(selectButton.dataset.screeningItemId || '', 10);
            const selected = screeningHistoryItems.find((item) => Number.parseInt(item.screening_item?.id, 10) === screeningItemId);
            if (!selected) return;
            const orderId = screeningHistoryOrderId;
            closeScreeningHistoryModal();
            openCreateOrderItemEditor(orderId, { screening_item: selected.screening_item });
        });
        screeningHistoryForm?.addEventListener('submit', (event) => event.preventDefault());
        screeningHistorySearch?.addEventListener('input', renderScreeningHistoryRows);
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && screeningHistoryModal && !screeningHistoryModal.classList.contains('hidden')) {
                closeScreeningHistoryModal();
                return;
            }
            if (event.key === 'Escape' && orderDetailDrawer && !orderDetailDrawer.classList.contains('hidden')) {
                closeOrderDetailDrawer();
            }
        });

        if (paginationContainer) {
            paginationContainer.addEventListener('click', (event) => {
                const target = event.target.closest('button[data-page]');
                if (!target) return;

                const page = parseInt(target.dataset.page, 10);
                if (page >= 1 && page <= state.totalPages) {
                    loadOrders(page);
                }
            });
        }

        if (tableElement) {
            const headers = tableElement.querySelectorAll('th[data-sort]');
            headers.forEach(header => {
                header.style.cursor = 'pointer';
                header.addEventListener('click', function() {
                    const sortField = this.getAttribute('data-sort');
                    if (sortField) {
                        if (state.sortField === sortField) {
                            state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
                        } else {
                            state.sortField = sortField;
                            state.sortDirection = 'asc';
                        }
                        loadOrders();
                    }
                });
            });
        }

        loadCustomers();
        loadOrderStatuses();
        loadOrders(1);

        // 建立資料同步輔助器
        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('orders', {
                onRefresh: () => refreshOrdersForDataSync(),
                onDependencyUpdate: (sourceModule, sourceAction, sourceData) => refreshOrdersForDataSync(sourceModule, sourceAction, sourceData),
                debounceMs: 300
            });
        }

        // 暴露模組方法供跨模組導航使用
        window.ordersModule = {
            viewDetail: openEditModal
        };
    }

    window.initializeOrdersModule = initializeOrdersModule;
})();
