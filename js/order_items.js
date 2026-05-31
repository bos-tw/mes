/**
 * Order Items Module
 * 客戶批號 / 訂單項目管理模組
 */
(function () {
    'use strict';

    function initializeOrderItemsModule(container, initialContext = null) {
        const moduleRoot = container.querySelector('[data-module="order_items"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';
        // 欄位管理器由 column_manager.js 自動初始化，不需要手動呼叫

        const alertBox = moduleRoot.querySelector('[data-order-items-alert]');
        const bannerElement = moduleRoot.querySelector('[data-order-items-banner]');
    const tableElement = moduleRoot.querySelector('[data-order-items-table]');
    const tableHead = tableElement ? tableElement.querySelector('thead') : null;
    const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
        const guidanceElement = moduleRoot.querySelector('[data-order-items-guidance]');
        const modalOverlay = moduleRoot.querySelector('[data-order-items-modal]');
        const modalAlertBox = modalOverlay ? modalOverlay.querySelector('[data-order-items-modal-alert]') : null;
        const modalForm = modalOverlay ? modalOverlay.querySelector('[data-order-items-form]') : null;
        const modalTitle = modalOverlay ? modalOverlay.querySelector('[data-modal-title]') : null;
        const modalCloseButton = modalOverlay ? modalOverlay.querySelector('[data-action="close-modal"]') : null;
        const modalCancelButton = modalOverlay ? modalOverlay.querySelector('[data-action="cancel"]') : null;
        const submitButton = modalOverlay ? modalOverlay.querySelector('[data-action="submit"]') : null;
        const addToolButton = modalOverlay ? modalOverlay.querySelector('[data-action="add-tool"]') : null;
        const addServiceButton = modalOverlay ? modalOverlay.querySelector('[data-action="add-service"]') : null;
        const addDrawingButton = modalOverlay ? modalOverlay.querySelector('[data-action="add-drawing"]') : null;
        const addAttachmentButton = modalOverlay ? modalOverlay.querySelector('[data-action="add-attachment"]') : null;
        const toolsTableBody = modalOverlay ? modalOverlay.querySelector('[data-tools-rows]') : null;
        const servicesTableBody = modalOverlay ? modalOverlay.querySelector('[data-services-rows]') : null;
        const drawingsTableBody = modalOverlay ? modalOverlay.querySelector('[data-drawings-rows]') : null;
        const attachmentsTableBody = modalOverlay ? modalOverlay.querySelector('[data-attachments-rows]') : null;
        const toolTypeSummary = modalOverlay ? modalOverlay.querySelector('[data-tool-type-summary]') : null;
        const toolTypeContent = modalOverlay ? modalOverlay.querySelector('[data-tool-type-content]') : null;
        const metricsPanel = modalOverlay ? modalOverlay.querySelector('[data-metrics]') : null;
        const headerCreateButton = moduleRoot.querySelector('.content-header [data-action="create"]');
        const exportButton = moduleRoot.querySelector('.content-header [data-action="export"]');

        const screeningItemSelect = modalForm ? modalForm.querySelector('select[name="screening_item_id"]') : null;
        const screeningCreatePanel = modalForm ? modalForm.querySelector('[data-screening-create-panel]') : null;
        const screeningCreateToggleButton = modalForm ? modalForm.querySelector('[data-action="toggle-screening-create"]') : null;
        const screeningCreateConfirmButton = modalForm ? modalForm.querySelector('[data-action="confirm-screening-create"]') : null;
        const screeningCreateCancelButtons = modalForm ? modalForm.querySelectorAll('[data-action="cancel-screening-create"]') : [];
        const screeningCreateFields = screeningCreatePanel ? {
            itemNumber: screeningCreatePanel.querySelector('[data-field="new-screening-item-number"]'),
            name: screeningCreatePanel.querySelector('[data-field="new-screening-item-name"]'),
            material: screeningCreatePanel.querySelector('[data-field="new-screening-item-material"]'),
            threadType: screeningCreatePanel.querySelector('[data-field="new-screening-item-thread"]'),
            weight: screeningCreatePanel.querySelector('[data-field="new-screening-item-weight"]'),
            unitPrice: screeningCreatePanel.querySelector('[data-field="new-screening-item-price"]'),
            unit: screeningCreatePanel.querySelector('[data-field="new-screening-item-unit"]'),
            notes: screeningCreatePanel.querySelector('[data-field="new-screening-item-notes"]'),
        } : null;
        const totalWeightInput = modalForm ? modalForm.querySelector('input[name="total_weight_kg"]') : null;
        const unitPriceInput = modalForm ? modalForm.querySelector('input[name="unit_price_per_thousand"]') : null;
        const weightPerUnitDisplay = modalForm ? modalForm.querySelector('input[name="weight_per_unit_g_display"]') : null;
        const statusSelect = modalForm ? modalForm.querySelector('select[name="status"]') : null;
        const sampleStatusSelect = modalForm ? modalForm.querySelector('select[name="customer_sample_status"]') : null;
        const drawingNumberInput = modalForm ? modalForm.querySelector('input[name="drawing_number"]') : null;
        const subItemNumberInput = modalForm ? modalForm.querySelector('input[name="sub_item_number"]') : null;
        const partNumberInput = modalForm ? modalForm.querySelector('input[name="part_number"]') : null;
        const customerBatchNumberInput = modalForm ? modalForm.querySelector('input[name="customer_batch_number"]') : null;
        const deliveryLocationInput = modalForm ? modalForm.querySelector('[name="delivery_location"]') : null;
        const notesInput = modalForm ? modalForm.querySelector('textarea[name="notes"]') : null;

        // 三階段重量追蹤欄位
        const customerProvidedWeightInput = modalForm ? modalForm.querySelector('input[name="customer_provided_weight"]') : null;
        const confirmedWeightInput = modalForm ? modalForm.querySelector('input[name="confirmed_weight"]') : null;
        const actualProductionWeightInput = modalForm ? modalForm.querySelector('input[name="actual_production_weight"]') : null;
        const weightToleranceDisplay = modalForm ? modalForm.querySelector('input[name="weight_tolerance_display"]') : null;
        const weightVarianceAlert = modalForm ? modalForm.querySelector('[data-weight-variance-alert]') : null;
        const weightVarianceMessage = modalForm ? modalForm.querySelector('[data-weight-variance-message]') : null;

        const metricsFields = metricsPanel ? {
            totalWeight: metricsPanel.querySelector('[data-metric="total-weight"]'),
            toolWeight: metricsPanel.querySelector('[data-metric="tool-weight"]'),
            netWeight: metricsPanel.querySelector('[data-metric="net-weight"]'),
            unitWeight: metricsPanel.querySelector('[data-metric="unit-weight"]'),
            totalUnits: metricsPanel.querySelector('[data-metric="total-units"]'),
            unitPrice: metricsPanel.querySelector('[data-metric="unit-price"]'),
            unitPriceSum: metricsPanel.querySelector('[data-metric="unit-price-sum"]'),
            totalPrice: metricsPanel.querySelector('[data-metric="total-price"]'),
        } : null;

        const defaultBannerHtml = bannerElement ? bannerElement.innerHTML : '';
        const defaultToolsTableHtml = toolsTableBody ? toolsTableBody.innerHTML : '';
        const defaultServicesTableHtml = servicesTableBody ? servicesTableBody.innerHTML : '';
        const defaultAttachmentsTableHtml = attachmentsTableBody ? attachmentsTableBody.innerHTML : '';

        function normalizeOrderContext(context) {
            if (!context || !context.orderId) {
                return null;
            }

            const parsed = Number.parseInt(context.orderId, 10);
            return {
                orderId: Number.isNaN(parsed) ? context.orderId : parsed,
                orderNumber: context.orderNumber ?? null,
                customerName: context.customerName ?? null,
                createdAt: context.createdAt ?? null,
                editItemId: context.editItemId ?? null,
            };
        }

        const state = {
            orderContext: normalizeOrderContext(initialContext),
            isLoading: false,
            isSubmitting: false,
            options: null,
            optionsLoaded: false,
            items: [],
            itemMap: new Map(),
            currentMode: 'create',
            currentEditingId: null,
            activeRequestToken: null,
            lastNotifiedOrderId: null,
            screeningCreationVisible: false,
            isCreatingScreeningItem: false,
            sortField: 'id',
            sortDirection: 'asc',
            deletedDrawingIds: [], // 追蹤要刪除的圖面 ID
            deletedAttachmentIds: [], // 追蹤要刪除的檔案附件 ID
            isCopyMode: false, // 標記是否為複製模式
            customerWeightTolerance: 3.0, // 客戶重量公差百分比，預設 3%
        };

        function formatScreeningItemLabel(item) {
            if (!item) {
                return '';
            }
            const parts = [];
            if (item.item_number) {
                parts.push(item.item_number);
            }
            if (item.name) {
                parts.push(item.name);
            }
            return parts.length > 0 ? parts.join(' - ') : `#${item.id}`;
        }

        function getOrderItemScreeningLabel(item) {
            if (!item || typeof item !== 'object') {
                return '-';
            }
            const screeningItem = item.screening_item || {};
            const parts = [];
            if (screeningItem.item_number) {
                parts.push(screeningItem.item_number);
            }
            if (screeningItem.name) {
                parts.push(screeningItem.name);
            }
            return parts.length > 0 ? parts.join(' - ') : '-';
        }

        /**
         * 計算並顯示重量差異與公差警示
         * @param {Object} item - 訂單品項資料
         * @returns {string} HTML 字串
         */
        function getWeightVarianceCell(item) {
            const confirmedWeight = item.confirmed_weight;
            const actualWeight = item.actual_production_weight;

            // 若任一重量缺失，顯示 -
            if (confirmedWeight == null || actualWeight == null) {
                return '-';
            }

            const variance = actualWeight - confirmedWeight;
            const variancePercent = confirmedWeight > 0 ? (variance / confirmedWeight) * 100 : 0;
            const tolerance = state.customerWeightTolerance || 3.0;
            const isOutOfTolerance = Math.abs(variancePercent) > tolerance;

            const sign = variance >= 0 ? '+' : '';
            const varianceDisplay = `${sign}${formatNumber(variance, 2)} kg (${sign}${formatNumber(variancePercent, 2)}%)`;

            if (isOutOfTolerance) {
                return `<span class="text-warning" title="超出公差範圍 ±${tolerance}%"><i class="fas fa-exclamation-triangle"></i> ${varianceDisplay}</span>`;
            }

            return varianceDisplay;
        }

        function clearScreeningCreateValidation() {
            if (!screeningCreatePanel) {
                return;
            }
            screeningCreatePanel.querySelectorAll('.has-error').forEach((element) => {
                element.classList.remove('has-error');
                element.removeAttribute('aria-invalid');
            });
        }

        function resetScreeningCreateForm() {
            if (!screeningCreateFields) {
                return;
            }
            Object.values(screeningCreateFields).forEach((field) => {
                if (field) {
                    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
                        field.value = '';
                    }
                }
            });
            clearScreeningCreateValidation();
        }

        function openScreeningCreatePanel() {
            if (!screeningCreatePanel) {
                return;
            }
            screeningCreatePanel.classList.remove('hidden');
            state.screeningCreationVisible = true;
            if (screeningCreateToggleButton) {
                screeningCreateToggleButton.setAttribute('aria-expanded', 'true');
            }
            setTimeout(() => {
                if (screeningCreateFields?.name) {
                    screeningCreateFields.name.focus();
                }
            }, 50);
        }

        function closeScreeningCreatePanel() {
            if (!screeningCreatePanel) {
                return;
            }
            screeningCreatePanel.classList.add('hidden');
            state.screeningCreationVisible = false;
            if (screeningCreateToggleButton) {
                screeningCreateToggleButton.setAttribute('aria-expanded', 'false');
            }
            resetScreeningCreateForm();
        }

        function readScreeningCreateForm() {
            if (!screeningCreateFields) {
                return null;
            }

            clearScreeningCreateValidation();

            const getValue = (element) => {
                if (!element) {
                    return '';
                }
                return element.value.trim();
            };

            const nameValue = getValue(screeningCreateFields.name);
            if (nameValue === '') {
                if (screeningCreateFields.name) {
                    screeningCreateFields.name.classList.add('has-error');
                    screeningCreateFields.name.setAttribute('aria-invalid', 'true');
                    screeningCreateFields.name.focus();
                }
                showModalAlert('error', '請輸入受篩產品名稱。', false);
                return null;
            }

            const weightRaw = screeningCreateFields?.weight ? screeningCreateFields.weight.value : '';
            const weightValue = Number.parseFloat(weightRaw);
            if (!Number.isFinite(weightValue) || weightValue <= 0) {
                if (screeningCreateFields?.weight) {
                    screeningCreateFields.weight.classList.add('has-error');
                    screeningCreateFields.weight.setAttribute('aria-invalid', 'true');
                    screeningCreateFields.weight.focus();
                }
                showModalAlert('error', '請輸入大於 0 的單支重量 (克)。', false);
                return null;
            }

            const unitPriceRaw = screeningCreateFields?.unitPrice ? screeningCreateFields.unitPrice.value : '';
            let unitPriceValue = null;
            if (unitPriceRaw !== '') {
                const parsedPrice = Number.parseFloat(unitPriceRaw);
                if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
                    if (screeningCreateFields?.unitPrice) {
                        screeningCreateFields.unitPrice.classList.add('has-error');
                        screeningCreateFields.unitPrice.setAttribute('aria-invalid', 'true');
                        screeningCreateFields.unitPrice.focus();
                    }
                    showModalAlert('error', '請輸入有效的單價 (元/M)。', false);
                    return null;
                }
                unitPriceValue = Number(parsedPrice.toFixed(4));
            }

            return {
                item_number: getValue(screeningCreateFields.itemNumber) || null,
                name: nameValue,
                material: getValue(screeningCreateFields.material) || null,
                thread_type: getValue(screeningCreateFields.threadType) || null,
                weight_per_unit_g: Number(weightValue.toFixed(4)),
                unit_price: unitPriceValue,
                unit: getValue(screeningCreateFields.unit) || null,
                notes: getValue(screeningCreateFields.notes) || null,
            };
        }

        async function submitScreeningCreate() {
            if (state.isCreatingScreeningItem) {
                return;
            }

            const payload = readScreeningCreateForm();
            if (!payload) {
                return;
            }

            state.isCreatingScreeningItem = true;
            if (screeningCreateConfirmButton) {
                screeningCreateConfirmButton.disabled = true;
                if (!screeningCreateConfirmButton.dataset.originalContent) {
                    screeningCreateConfirmButton.dataset.originalContent = screeningCreateConfirmButton.innerHTML;
                }
                screeningCreateConfirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>新增中…</span>';
            }

            try {
                const response = await fetch('api/screening_items/index.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    const message = result?.message || `HTTP ${response.status}`;
                    const errors = result?.errors;
                    if (errors && typeof errors === 'object') {
                        const firstKey = Object.keys(errors)[0];
                        const firstMessage = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey];
                        if (typeof firstMessage === 'string') {
                            showModalAlert('error', firstMessage, false);
                        } else {
                            showModalAlert('error', message, false);
                        }
                    } else {
                        showModalAlert('error', message, false);
                    }
                    return;
                }

                const newItem = result.data;
                if (!newItem || !newItem.id) {
                    showModalAlert('error', '受篩產品建立成功，但未取得資料。', false);
                    return;
                }

                if (!state.options) {
                    state.options = {};
                }
                if (!Array.isArray(state.options.screening_items)) {
                    state.options.screening_items = [];
                }

                const normalizedItem = {
                    id: Number.parseInt(newItem.id, 10),
                    item_number: newItem.item_number ?? null,
                    name: newItem.name ?? null,
                    material: newItem.material ?? null,
                    thread_type: newItem.thread_type ?? null,
                    weight_per_unit_g: typeof newItem.weight_per_unit_g === 'number'
                        ? newItem.weight_per_unit_g
                        : Number.parseFloat(newItem.weight_per_unit_g ?? 'NaN'),
                    unit_price: typeof newItem.unit_price === 'number'
                        ? newItem.unit_price
                        : (newItem.unit_price != null ? Number.parseFloat(newItem.unit_price) : null),
                    unit: newItem.unit ?? null,
                };

                state.options.screening_items.push(normalizedItem);
                state.options.screening_items.sort((a, b) => {
                    const labelA = formatScreeningItemLabel(a);
                    const labelB = formatScreeningItemLabel(b);
                    return labelA.localeCompare(labelB, 'zh-TW', { numeric: true, sensitivity: 'base' });
                });

                populateModalSelects();

                if (screeningItemSelect) {
                    screeningItemSelect.value = String(normalizedItem.id);
                    screeningItemSelect.dispatchEvent(new Event('change', { bubbles: true }));

                    // 確保單價欄位有被更新 (Fallback)
                    if (unitPriceInput && normalizedItem.unit_price != null) {
                        unitPriceInput.value = String(normalizedItem.unit_price);
                        updateMetrics();
                    }
                }

                showAlert('success', result.message || '受篩產品新增成功。');
                closeScreeningCreatePanel();
            } catch (error) {
                const message = error instanceof Error ? error.message : '新增受篩產品失敗。';
                showModalAlert('error', message, false);
            } finally {
                state.isCreatingScreeningItem = false;
                if (screeningCreateConfirmButton) {
                    screeningCreateConfirmButton.disabled = false;
                    if (screeningCreateConfirmButton.dataset.originalContent) {
                        screeningCreateConfirmButton.innerHTML = screeningCreateConfirmButton.dataset.originalContent;
                        delete screeningCreateConfirmButton.dataset.originalContent;
                    }
                }
            }
        }

        function formatNumber(value, fractionDigits = 2) {
            const numericValue = typeof value === 'number' ? value : Number.parseFloat(String(value));
            const digits = Number.isInteger(fractionDigits) ? Math.max(0, fractionDigits) : 2;
            if (!Number.isFinite(numericValue)) {
                return (0).toLocaleString('zh-TW', {
                    minimumFractionDigits: digits,
                    maximumFractionDigits: digits,
                });
            }
            return numericValue.toLocaleString('zh-TW', {
                minimumFractionDigits: digits,
                maximumFractionDigits: digits,
            });
        }

        function formatCurrency(value) {
            return formatNumber(value ?? 0, 2);
        }

        function formatDateTime(value) {
            if (!value) {
                return '-';
            }

            if (typeof value === 'string' && value.includes('T')) {
                return value.replace('T', ' ').replace('Z', '');
            }

            return value;
        }

        function getSortValue(item, field) {
            if (!item || typeof item !== 'object') {
                return null;
            }

            const totals = item.totals || {};

            switch (field) {
                case 'id':
                    return Number(item.id ?? NaN);
                case 'screening_label':
                    return getOrderItemScreeningLabel(item);
                case 'total_weight_kg':
                    return Number(item.total_weight_kg ?? NaN);
                case 'tool_weight_kg':
                    return Number(totals.tool_weight_kg ?? NaN);
                case 'net_weight_kg':
                    return Number(totals.net_weight_kg ?? NaN);
                case 'total_units':
                    return Number(item.total_units ?? NaN);
                case 'unit_price_per_thousand':
                    return Number(item.unit_price_per_thousand ?? NaN);
                case 'total_price':
                    return Number(item.total_price ?? NaN);
                case 'status_label':
                    return item.status_label || item.status || '';
                case 'sample_status_label':
                    return item.customer_sample_status_label || item.customer_sample_status || '';
                case 'updated_at': {
                    const raw = item.updated_at;
                    if (!raw) {
                        return null;
                    }
                    const normalizedRaw = (typeof raw === 'string' && raw.includes(' ') && !raw.includes('T'))
                        ? raw.replace(' ', 'T')
                        : raw;
                    const timestamp = Date.parse(normalizedRaw);
                    return Number.isNaN(timestamp) ? raw : timestamp;
                }
                default:
                    return null;
            }
        }

        function sortItems(items) {
            if (!Array.isArray(items) || items.length === 0) {
                return [];
            }

            if (!state.sortField) {
                return [...items];
            }

            const direction = state.sortDirection === 'desc' ? -1 : 1;

            return [...items].sort((a, b) => {
                const aValue = getSortValue(a, state.sortField);
                const bValue = getSortValue(b, state.sortField);

                if (aValue == null && bValue == null) {
                    return 0;
                }
                if (aValue == null) {
                    return 1;
                }
                if (bValue == null) {
                    return -1;
                }

                if (typeof aValue === 'number' || typeof bValue === 'number') {
                    const aNum = Number(aValue);
                    const bNum = Number(bValue);

                    const aValid = Number.isFinite(aNum);
                    const bValid = Number.isFinite(bNum);

                    if (!aValid && !bValid) {
                        return 0;
                    }
                    if (!aValid) {
                        return 1;
                    }
                    if (!bValid) {
                        return -1;
                    }
                    if (aNum === bNum) {
                        return 0;
                    }
                    return aNum > bNum ? direction : -direction;
                }

                const aString = String(aValue);
                const bString = String(bValue);
                const compareResult = aString.localeCompare(bString, 'zh-TW', {
                    numeric: true,
                    sensitivity: 'base',
                });
                return compareResult * direction;
            });
        }

        function updateSortIndicators() {
            if (!tableElement) {
                return;
            }

            const headers = tableElement.querySelectorAll('th[data-sort]');
            headers.forEach((header) => {
                header.classList.remove('sort-asc', 'sort-desc');
                const icon = header.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-sort-up', 'fa-sort-down');
                    if (!icon.classList.contains('fa-sort')) {
                        icon.classList.add('fa-sort');
                    }
                }
            });

            if (!state.sortField) {
                return;
            }

            const activeHeader = tableElement.querySelector(`th[data-sort="${state.sortField}"]`);
            if (!activeHeader) {
                return;
            }

            activeHeader.classList.add(state.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            const activeIcon = activeHeader.querySelector('i');
            if (activeIcon) {
                activeIcon.classList.remove('fa-sort');
                activeIcon.classList.add(state.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down');
            }
        }

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

        function showAlert(type, message) {
            if (!alertBox || !message) {
                return;
            }

            alertBox.classList.remove('hidden', 'success', 'error');
            alertBox.classList.add(type === 'success' ? 'success' : 'error');
            alertBox.textContent = message;
        }

        function clearAlert() {
            if (!alertBox) {
                return;
            }

            alertBox.classList.add('hidden');
            alertBox.classList.remove('success', 'error');
            alertBox.textContent = '';
        }

    
function updateButtons() {
            const hasOrder = Boolean(state.orderContext);
            const disableCreate = !hasOrder || state.isLoading;

            if (headerCreateButton) {
                headerCreateButton.disabled = disableCreate;
                headerCreateButton.title = hasOrder ? '新增客戶批號' : '請先選擇訂單';
            }

            if (exportButton) {
                exportButton.disabled = !hasOrder;
                exportButton.title = hasOrder ? '匯出客戶批號' : '請先選擇訂單';
            }
        }

        function renderGuidance(visible) {
            if (!guidanceElement) {
                return;
            }

            guidanceElement.classList.toggle('hidden', !visible);
        }

        function renderEmptyTable(message) {
            if (!tableBody) {
                return;
            }

            tableBody.innerHTML = `
                <tr>
                    <td colspan="20" class="text-center">${escapeHtml(message)}</td>
                </tr>
            `;

            updateSortIndicators();

            // 套用欄位可見性設定
            if (window.orderItemColumnManager) {
                window.orderItemColumnManager.onTableUpdated();
            }
        }

        function renderLoadingRow() {
            renderEmptyTable('資料載入中，請稍候…');
        }

        function renderRows(items) {
            if (!tableBody) {
                console.warn('[order_items] tableBody is null, cannot render');
                return;
            }

            if (!Array.isArray(items) || items.length === 0) {
                renderEmptyTable('尚無客戶批號資料。');
                return;
            }

            const sortedItems = sortItems(items);

            const rowsHtml = sortedItems.map((item) => {
                const statusLabel = item.status_label || item.status || '-';
                const sampleLabel = item.customer_sample_status_label || item.customer_sample_status || '-';
                const totals = item.totals || {};
                const updatedAtLabel = formatDateTime(item.updated_at);
                const screeningLabel = getOrderItemScreeningLabel(item);

                const hasWorkOrder = item.has_work_order == 1;
                const workOrderBtnTitle = hasWorkOrder
                    ? `已轉成工單 ${escapeHtml(item.work_order_number || '')}`.trim()
                    : '轉為工單';
                const workOrderBtnAttr = hasWorkOrder ? 'data-has-work-order="true" disabled aria-disabled="true"' : '';

                // 出貨狀態標籤
                const shippingStatusMap = {
                    'not_shipped': '未出貨',
                    'partial_shipped': '部分出貨',
                    'fully_shipped': '已全部出貨'
                };
                const shippingStatusClass = {
                    'not_shipped': '',
                    'partial_shipped': 'text-warning',
                    'fully_shipped': 'text-success'
                };
                const shippingStatus = item.shipping_status || 'not_shipped';
                const shippingStatusLabel = shippingStatusMap[shippingStatus] || shippingStatus;
                const shippingStatusCls = shippingStatusClass[shippingStatus] || '';

                return `
                    <tr data-id="${escapeHtml(item.id)}">
                        <td>${escapeHtml(item.customer_batch_number || '-')}</td>
                        <td>
                            <div class="table-primary">${escapeHtml(screeningLabel)}</div>
                            ${item.drawing_number ? `<div class="table-secondary">圖面：${escapeHtml(item.drawing_number)}</div>` : ''}
                        </td>
                        <td class="text-right">${formatNumber(item.total_weight_kg ?? 0, 2)}</td>
                        <td class="text-right">${formatNumber(totals.tool_weight_kg ?? 0, 2)}</td>
                        <td class="text-right">${formatNumber(totals.net_weight_kg ?? 0, 2)}</td>
                        <td class="text-right">${formatNumber(item.total_units ?? 0, 0)}</td>
                        <td class="text-right">${formatNumber(item.unit_price_per_thousand ?? 0, 2)}</td>
                        <td class="text-right">${formatCurrency(item.total_price ?? 0)}</td>
                        <td>${escapeHtml(statusLabel)}</td>
                        <td>${escapeHtml(sampleLabel)}</td>
                        <td>${escapeHtml(updatedAtLabel)}</td>
                        <td class="text-right">${formatNumber(item.total_shipped_quantity ?? 0, 0)}</td>
                        <td class="${shippingStatusCls}">${escapeHtml(shippingStatusLabel)}</td>
                        <td class="text-right">${item.customer_provided_weight != null ? formatNumber(item.customer_provided_weight, 2) : '-'}</td>
                        <td class="text-right">${item.confirmed_weight != null ? formatNumber(item.confirmed_weight, 2) : '-'}</td>
                        <td class="text-right">${item.actual_production_weight != null ? formatNumber(item.actual_production_weight, 2) : '-'}</td>
                        <td class="text-right">${getWeightVarianceCell(item)}</td>
                        <td>${item.tools && item.tools.length > 0 ? [...new Set(item.tools.map(t => escapeHtml(t.tool_type || '')).filter(Boolean))].join(', ') || '-' : '-'}</td>
                        <td class="text-right">${item.tools && item.tools.length > 0 ? item.tools.map(t => formatNumber(t.weight_kg ?? 0, 4)).join(', ') : '-'}</td>
                        <td class="text-right">${item.tools && item.tools.length > 0 ? item.tools.map(t => t.quantity ?? 0).join(', ') : '-'}</td>
                        <td class="table-actions">
                            <button type="button" class="btn text" data-action="create-work-order" title="${workOrderBtnTitle}" ${workOrderBtnAttr}>
                                <i class="fas fa-cogs"></i>
                            </button>
                            <button type="button" class="btn text" data-action="edit-order-item" title="修改">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="btn text" data-action="copy-order-item" title="複製">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button type="button" class="btn text danger" data-action="delete-order-item" title="刪除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            tableBody.innerHTML = rowsHtml;
            updateSortIndicators();

            // 套用欄位可見性設定
            if (window.orderItemColumnManager) {
                window.orderItemColumnManager.onTableUpdated();
            }
        }

        function updateBanner() {
            if (!bannerElement) {
                return;
            }

            if (!state.orderContext) {
                bannerElement.innerHTML = defaultBannerHtml;
                return;
            }

            const { orderId, orderNumber, customerName, createdAt } = state.orderContext;
            const orderLabel = orderNumber ? orderNumber : `ID ${orderId}`;
            const customerLabel = customerName || '—';
            const createdLabel = createdAt || '—';

            bannerElement.innerHTML = `
                <div class="order-summary">
                    <div class="summary-item">
                        <span class="summary-label">訂單</span>
                        <strong>${escapeHtml(orderLabel)}</strong>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">客戶</span>
                        <strong>${escapeHtml(customerLabel)}</strong>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">建立時間</span>
                        <strong>${escapeHtml(createdLabel)}</strong>
                    </div>
                </div>
            `;
        }

        function setLoading(loading) {
            state.isLoading = loading;
            if (tableElement) {
                tableElement.classList.toggle('is-loading', loading);
            }
            if (loading) {
                renderLoadingRow();
            }
            updateButtons();
        }

        function clearFormValidation() {
            if (!modalForm) {
                return;
            }

            modalForm.querySelectorAll('.has-error').forEach((element) => {
                element.classList.remove('has-error');
                element.removeAttribute('aria-invalid');
            });
        }

        function resetToolsTable() {
            if (toolsTableBody) {
                toolsTableBody.innerHTML = defaultToolsTableHtml;
            }
            // 重置時隱藏載具類型統計
            if (toolTypeSummary) {
                toolTypeSummary.style.display = 'none';
            }
        }

        function resetServicesTable() {
            if (servicesTableBody) {
                servicesTableBody.innerHTML = defaultServicesTableHtml;
            }
        }

        function resetModalForm() {
            if (!modalForm) {
                return;
            }

            modalForm.reset();
            clearFormValidation();
            modalForm.querySelectorAll('[data-user-edited]').forEach((element) => {
                delete element.dataset.userEdited;
            });
            // 清空單支重量顯示
            if (weightPerUnitDisplay) {
                weightPerUnitDisplay.value = '';
            }
            // 清空三階段重量欄位
            if (customerProvidedWeightInput) {
                customerProvidedWeightInput.value = '';
            }
            if (confirmedWeightInput) {
                confirmedWeightInput.value = '';
            }
            if (actualProductionWeightInput) {
                actualProductionWeightInput.value = '';
            }
            // 更新公差顯示
            if (weightToleranceDisplay) {
                weightToleranceDisplay.value = `±${state.customerWeightTolerance || 3.0}%`;
            }
            // 隱藏公差警示
            if (weightVarianceAlert) {
                weightVarianceAlert.classList.add('hidden');
            }
            resetToolsTable();
            resetServicesTable();
            resetDrawingsTable(); // 清空圖面表格
            resetAttachmentsTable(); // 清空檔案附件表格
            closeScreeningCreatePanel();
            updateMetrics();
        }

        function populateModalSelects() {
            if (!state.options) {
                return;
            }

            if (screeningItemSelect) {
                const previous = screeningItemSelect.value;
                screeningItemSelect.innerHTML = '<option value="">-- 請選擇 --</option>';
                const screeningItems = [...(state.options.screening_items || [])];
                screeningItems.sort((a, b) => formatScreeningItemLabel(a).localeCompare(
                    formatScreeningItemLabel(b),
                    'zh-TW',
                    { numeric: true, sensitivity: 'base' },
                ));
                screeningItems.forEach((item) => {
                    const option = document.createElement('option');
                    option.value = String(item.id);
                    option.textContent = formatScreeningItemLabel(item);
                    option.dataset.weightPerUnit = item.weight_per_unit_g != null ? String(item.weight_per_unit_g) : '';
                    screeningItemSelect.appendChild(option);
                });
                if (previous) {
                    screeningItemSelect.value = previous;
                }
            }

            if (statusSelect) {
                const previous = statusSelect.value;
                statusSelect.innerHTML = '<option value="">-- 請選擇 --</option>';
                (state.options.statuses || []).forEach((item) => {
                    const option = document.createElement('option');
                    option.value = item.value ?? '';
                    option.textContent = item.label ?? item.value ?? '';
                    statusSelect.appendChild(option);
                });
                if (previous) {
                    statusSelect.value = previous;
                }
            }

            if (sampleStatusSelect) {
                const previous = sampleStatusSelect.value;
                sampleStatusSelect.innerHTML = '<option value="">-- 請選擇 --</option>';
                (state.options.customer_sample_statuses || []).forEach((item) => {
                    const option = document.createElement('option');
                    option.value = item.value ?? '';
                    option.textContent = item.label ?? item.value ?? '';
                    sampleStatusSelect.appendChild(option);
                });
                if (previous) {
                    sampleStatusSelect.value = previous;
                }
            }
        }

        async function loadOptionsIfNeeded() {
            if (state.optionsLoaded) {
                return state.options;
            }

            try {
                const response = await fetch('api/order_items/options.php', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result?.message || `HTTP ${response.status}`);
                }

                state.options = result.data || {};
                state.optionsLoaded = true;
                populateModalSelects();
                return state.options;
            } catch (error) {
                const message = error instanceof Error ? error.message : '載入選項失敗。';
                showAlert('error', `無法載入受篩產品與篩分服務選項：${message}`);
                throw error;
            }
        }

        function refreshToolRow(row) {
            if (!row) {
                return;
            }

            const select = row.querySelector('[data-field="tool-id"]');
            const quantityInput = row.querySelector('[data-field="tool-quantity"]');
            const typeCell = row.querySelector('[data-field="tool-type"]');
            const weightCell = row.querySelector('[data-field="tool-weight"]');
            const totalCell = row.querySelector('[data-field="tool-total-weight"]');

            const toolId = select ? select.value : '';
            const tool = state.options ? (state.options.tools || []).find((item) => String(item.id) === toolId) : null;
            const weightKg = tool && typeof tool.weight_kg === 'number' ? tool.weight_kg : 0;

            const quantity = quantityInput ? parseInt(quantityInput.value, 10) : NaN;
            const totalWeight = Number.isFinite(quantity) ? quantity * weightKg : 0;

            row.dataset.toolWeight = String(weightKg);
            row.dataset.toolTotalWeight = String(totalWeight);

            // 更新載具類型顯示
            if (typeCell && tool) {
                typeCell.textContent = tool.type || '-';
            }

            if (weightCell) {
                weightCell.textContent = formatNumber(weightKg, 2);
            }
            if (totalCell) {
                totalCell.textContent = formatNumber(totalWeight, 2);
            }

            // 更新載具類型統計
            updateToolTypeSummary();
            // 更新載具總重量合計
            updateToolTotalWeightDisplay();
        }

        function updateToolTotalWeightDisplay() {
            if (!toolsTableBody) return;

            const rows = toolsTableBody.querySelectorAll('.tool-row');
            let totalWeight = 0;

            rows.forEach(row => {
                const rowTotal = parseFloat(row.dataset.toolTotalWeight || '0');
                if (!isNaN(rowTotal)) {
                    totalWeight += rowTotal;
                }
            });

            const displayEl = document.querySelector('[data-tool-total-weight-display]');
            if (displayEl) {
                displayEl.textContent = formatNumber(totalWeight, 2);
            }
        }

        function refreshServiceRow(row, { applyDefaults = false } = {}) {
            if (!row) {
                return;
            }

            const serviceSelect = row.querySelector('[data-field="service-id"]');
            const serviceId = serviceSelect ? serviceSelect.value : '';
            const service = state.options ? (state.options.screening_services || []).find((item) => String(item.id) === serviceId) : null;

            if (applyDefaults && service) {
                const nameInput = row.querySelector('[data-field="service-name"]');
                if (nameInput && (!nameInput.value || nameInput.dataset.userEdited !== 'true')) {
                    nameInput.value = service.name || '';
                }

                const priceInput = row.querySelector('[data-field="service-price"]');
                if (priceInput && (!priceInput.value || priceInput.dataset.userEdited !== 'true')) {
                    if (service.default_price_per_unit != null) {
                        priceInput.value = String(service.default_price_per_unit);
                    }
                }
            }
        }

        function addToolRow(initialData = null) {
            if (!toolsTableBody) {
                return null;
            }

            const emptyRow = toolsTableBody.querySelector('.empty-row');
            if (emptyRow) {
                emptyRow.remove();
            }

            const row = document.createElement('tr');
            row.classList.add('tool-row');

            const selectCell = document.createElement('td');
            const toolSelect = document.createElement('select');
            toolSelect.setAttribute('data-field', 'tool-id');
            toolSelect.innerHTML = '<option value="">-- 請選擇 --</option>';
            (state.options?.tools || []).forEach((tool) => {
                const option = document.createElement('option');
                option.value = String(tool.id);
                const labelParts = [];
                if (tool.tool_number) {
                    labelParts.push(tool.tool_number);
                }
                if (tool.name) {
                    labelParts.push(tool.name);
                }
                option.textContent = labelParts.length > 0 ? labelParts.join(' - ') : `#${tool.id}`;
                toolSelect.appendChild(option);
            });
            if (initialData && initialData.tool_id != null) {
                toolSelect.value = String(initialData.tool_id);
            }
            selectCell.appendChild(toolSelect);

            // 載具類型欄位 (只讀顯示)
            const typeCell = document.createElement('td');
            typeCell.setAttribute('data-field', 'tool-type');
            typeCell.textContent = '-';

            // 優先使用 initialData 的 tool_type (編輯時的快照)
            if (initialData && initialData.tool_type) {
                typeCell.textContent = initialData.tool_type;
            } else if (initialData && initialData.tool_id != null) {
                // 否則從 options 中查找當前的 tool type
                const tool = (state.options?.tools || []).find((t) => String(t.id) === String(initialData.tool_id));
                if (tool && tool.type) {
                    typeCell.textContent = tool.type;
                }
            }

            const quantityCell = document.createElement('td');
            quantityCell.classList.add('text-right');
            const quantityInput = document.createElement('input');
            quantityInput.type = 'number';
            quantityInput.min = '0';
            quantityInput.step = '1';
            quantityInput.placeholder = '0';
            quantityInput.setAttribute('data-field', 'tool-quantity');
            if (initialData && initialData.quantity != null) {
                quantityInput.value = String(Math.round(initialData.quantity));
            }
            quantityCell.appendChild(quantityInput);

            const weightCell = document.createElement('td');
            weightCell.classList.add('text-right');
            weightCell.setAttribute('data-field', 'tool-weight');
            weightCell.textContent = '0.00';

            const totalCell = document.createElement('td');
            totalCell.classList.add('text-right');
            totalCell.setAttribute('data-field', 'tool-total-weight');
            totalCell.textContent = '0.00';

            const actionCell = document.createElement('td');
            actionCell.classList.add('text-center');
            actionCell.innerHTML = `
                <button type="button" class="btn ghost icon-only" data-action="remove-tool" title="移除載具">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            row.appendChild(selectCell);
            row.appendChild(typeCell);
            row.appendChild(quantityCell);
            row.appendChild(weightCell);
            row.appendChild(totalCell);
            row.appendChild(actionCell);

            toolsTableBody.appendChild(row);

            // 監聽移除按鈕
            const removeBtn = actionCell.querySelector('[data-action="remove-tool"]');
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    row.remove();
                    updateToolTypeSummary();
                    updateToolTotalWeightDisplay();
                    if (!toolsTableBody.querySelector('.tool-row')) {
                        resetToolsTable();
                    }
                });
            }

            refreshToolRow(row);

            return row;
        }

        function addServiceRow(initialData = null, config = {}) {
            if (!servicesTableBody) {
                return null;
            }

            const emptyRow = servicesTableBody.querySelector('.empty-row');
            if (emptyRow) {
                emptyRow.remove();
            }

            const { applyDefaults = !initialData } = config;

            const row = document.createElement('tr');
            row.classList.add('service-row');

            const serviceCell = document.createElement('td');
            const serviceSelect = document.createElement('select');
            serviceSelect.setAttribute('data-field', 'service-id');
            serviceSelect.innerHTML = '<option value="">-- 請選擇 --</option>';
            (state.options?.screening_services || []).forEach((service) => {
                const option = document.createElement('option');
                option.value = String(service.id);
                const labelParts = [];
                if (service.service_number) {
                    labelParts.push(service.service_number);
                }
                if (service.name) {
                    labelParts.push(service.name);
                }
                option.textContent = labelParts.length > 0 ? labelParts.join(' - ') : `#${service.id}`;
                serviceSelect.appendChild(option);
            });
            if (initialData && initialData.screening_service_id != null) {
                serviceSelect.value = String(initialData.screening_service_id);
            }
            serviceCell.appendChild(serviceSelect);

            const nameCell = document.createElement('td');
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.maxLength = 255;
            nameInput.placeholder = '可覆寫服務名稱';
            nameInput.setAttribute('data-field', 'service-name');
            if (initialData && initialData.service_name) {
                nameInput.value = initialData.service_name;
            }
            nameCell.appendChild(nameInput);

            const priceCell = document.createElement('td');
            priceCell.classList.add('text-right');
            const priceInput = document.createElement('input');
            priceInput.type = 'number';
            priceInput.min = '0';
            priceInput.step = '0.0001';
            priceInput.placeholder = '0.0000';
            priceInput.setAttribute('data-field', 'service-price');
            if (initialData && initialData.actual_price_per_unit != null) {
                priceInput.value = String(initialData.actual_price_per_unit);
            }
            priceCell.appendChild(priceInput);

            const tolerancePlusCell = document.createElement('td');
            tolerancePlusCell.classList.add('text-right');
            const tolerancePlusWrapper = document.createElement('div');
            tolerancePlusWrapper.classList.add('stacked-inputs');
            const tolerancePlusValueInput = document.createElement('input');
            tolerancePlusValueInput.type = 'number';
            tolerancePlusValueInput.step = '0.0001';
            tolerancePlusValueInput.placeholder = '值';
            tolerancePlusValueInput.setAttribute('data-field', 'tolerance-plus-value');
            if (initialData && initialData.tolerance_plus_value != null) {
                tolerancePlusValueInput.value = String(initialData.tolerance_plus_value);
            }
            const tolerancePlusOverInput = document.createElement('input');
            tolerancePlusOverInput.type = 'number';
            tolerancePlusOverInput.step = '0.0001';
            tolerancePlusOverInput.placeholder = 'Over';
            tolerancePlusOverInput.setAttribute('data-field', 'tolerance-plus-over');
            if (initialData && initialData.tolerance_plus_over != null) {
                tolerancePlusOverInput.value = String(initialData.tolerance_plus_over);
            }
            tolerancePlusWrapper.appendChild(tolerancePlusValueInput);
            tolerancePlusWrapper.appendChild(tolerancePlusOverInput);
            tolerancePlusCell.appendChild(tolerancePlusWrapper);

            const toleranceMinusCell = document.createElement('td');
            toleranceMinusCell.classList.add('text-right');
            const toleranceMinusWrapper = document.createElement('div');
            toleranceMinusWrapper.classList.add('stacked-inputs');
            const toleranceMinusValueInput = document.createElement('input');
            toleranceMinusValueInput.type = 'number';
            toleranceMinusValueInput.step = '0.0001';
            toleranceMinusValueInput.placeholder = '值';
            toleranceMinusValueInput.setAttribute('data-field', 'tolerance-minus-value');
            if (initialData && initialData.tolerance_minus_value != null) {
                toleranceMinusValueInput.value = String(initialData.tolerance_minus_value);
            }
            const toleranceMinusOverInput = document.createElement('input');
            toleranceMinusOverInput.type = 'number';
            toleranceMinusOverInput.step = '0.0001';
            toleranceMinusOverInput.placeholder = 'Over';
            toleranceMinusOverInput.setAttribute('data-field', 'tolerance-minus-over');
            if (initialData && initialData.tolerance_minus_over != null) {
                toleranceMinusOverInput.value = String(initialData.tolerance_minus_over);
            }
            toleranceMinusWrapper.appendChild(toleranceMinusValueInput);
            toleranceMinusWrapper.appendChild(toleranceMinusOverInput);
            toleranceMinusCell.appendChild(toleranceMinusWrapper);

            const ppmCell = document.createElement('td');
            ppmCell.classList.add('text-right');
            const ppmInput = document.createElement('input');
            ppmInput.type = 'number';
            ppmInput.step = '0.001';
            ppmInput.placeholder = '0';
            ppmInput.setAttribute('data-field', 'ppm');
            if (initialData && initialData.ppm_standard != null) {
                ppmInput.value = String(initialData.ppm_standard);
            }
            ppmCell.appendChild(ppmInput);

            const notesCell = document.createElement('td');
            const notesInputElement = document.createElement('input');
            notesInputElement.type = 'text';
            notesInputElement.maxLength = 255;
            notesInputElement.placeholder = '備註';
            notesInputElement.setAttribute('data-field', 'service-notes');
            if (initialData && initialData.notes) {
                notesInputElement.value = initialData.notes;
            }
            notesCell.appendChild(notesInputElement);

            const actionCell = document.createElement('td');
            actionCell.classList.add('text-center');
            actionCell.innerHTML = `
                <button type="button" class="btn ghost icon-only" data-action="remove-service" title="移除服務">
                    <i class="fas fa-trash"></i>
                </button>
            `;

            row.appendChild(serviceCell);
            row.appendChild(nameCell);
            row.appendChild(priceCell);
            row.appendChild(tolerancePlusCell);
            row.appendChild(toleranceMinusCell);
            row.appendChild(ppmCell);
            row.appendChild(notesCell);
            row.appendChild(actionCell);

            servicesTableBody.appendChild(row);

            refreshServiceRow(row, { applyDefaults });

            return row;
        }

        function addDrawingRow(fileData = null) {
            if (!drawingsTableBody) {
                return null;
            }

            const emptyRow = drawingsTableBody.querySelector('.empty-row');
            if (emptyRow) {
                emptyRow.remove();
            }

            const row = document.createElement('tr');
            row.classList.add('drawing-row');

            const isExisting = fileData && fileData.isExisting;

            // 如果是已存在的圖面,儲存其 ID
            if (isExisting && fileData.id) {
                row.setAttribute('data-drawing-id', String(fileData.id));
            }

            // 圖面編號
            const numberCell = document.createElement('td');
            const numberInput = document.createElement('input');
            numberInput.type = 'text';
            numberInput.placeholder = '請輸入圖面編號';
            numberInput.maxLength = 100;
            numberInput.setAttribute('data-field', 'drawing-number');
            if (fileData && fileData.drawing_number) {
                numberInput.value = fileData.drawing_number;
            }
            numberCell.appendChild(numberInput);

            // 檔案名稱
            const nameCell = document.createElement('td');
            if (fileData) {
                nameCell.textContent = fileData.name || '未命名檔案';
                row.setAttribute('data-file-name', fileData.name || '');
                if (!isExisting) {
                    // 新檔案需要有 file input (隱藏的)
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.style.display = 'none';
                    fileInput.setAttribute('data-field', 'drawing-file');
                    nameCell.appendChild(fileInput);
                }
            } else {
                nameCell.innerHTML = '<input type="file" accept="image/*,.pdf" data-field="drawing-file" />';
            }

            // 檔案大小
            const sizeCell = document.createElement('td');
            if (fileData && fileData.size) {
                sizeCell.textContent = formatFileSize(fileData.size);
                row.setAttribute('data-file-size', String(fileData.size));
            } else {
                sizeCell.textContent = '-';
            }

            // 上傳時間
            const timeCell = document.createElement('td');
            if (fileData && fileData.time) {
                timeCell.textContent = fileData.time;
            } else {
                timeCell.textContent = '-';
            }

            // 預覽
            const previewCell = document.createElement('td');
            previewCell.classList.add('text-center');
            if (fileData && fileData.path) {
                const previewBtn = document.createElement('button');
                previewBtn.type = 'button';
                previewBtn.className = 'btn ghost icon-only';
                previewBtn.setAttribute('data-action', 'preview-drawing');
                previewBtn.setAttribute('title', '預覽');
                previewBtn.innerHTML = '<i class="fas fa-eye"></i>';
                previewCell.appendChild(previewBtn);
                row.setAttribute('data-file-path', fileData.path);
            } else {
                previewCell.textContent = '-';
            }

            // 操作
            const actionCell = document.createElement('td');
            actionCell.classList.add('text-center');
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn ghost icon-only';
            removeBtn.setAttribute('data-action', 'remove-drawing');
            removeBtn.setAttribute('title', '移除');
            removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
            actionCell.appendChild(removeBtn);

            row.appendChild(numberCell);
            row.appendChild(nameCell);
            row.appendChild(sizeCell);
            row.appendChild(timeCell);
            row.appendChild(previewCell);
            row.appendChild(actionCell);

            drawingsTableBody.appendChild(row);

            // 如果是新增檔案輸入,監聽檔案選擇
            if (!fileData) {
                const fileInput = row.querySelector('input[type="file"]');
                if (fileInput) {
                    fileInput.addEventListener('change', (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            handleFileSelection(row, file);
                        }
                    });
                }
            }

            return row;
        }

        function handleFileSelection(row, file) {
            // 驗證檔案大小 (最大 10MB)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                showAlert('檔案大小不能超過 10MB', 'error', alertBox);
                row.remove();
                if (!drawingsTableBody?.querySelector('.drawing-row')) {
                    resetDrawingsTable();
                }
                return;
            }

            // 更新行顯示 (注意:現在第一欄是圖面編號)
            const nameCell = row.querySelector('td:nth-child(2)');
            const sizeCell = row.querySelector('td:nth-child(3)');
            const timeCell = row.querySelector('td:nth-child(4)');
            const previewCell = row.querySelector('td:nth-child(5)');

            if (nameCell) nameCell.textContent = file.name;
            if (sizeCell) sizeCell.textContent = formatFileSize(file.size);
            if (timeCell) timeCell.textContent = new Date().toLocaleString('zh-TW');

            // 儲存檔案物件到 row
            row.fileObject = file;
            row.setAttribute('data-file-name', file.name);
            row.setAttribute('data-file-size', String(file.size));

            // 添加預覽按鈕
            if (previewCell && file.type.startsWith('image/')) {
                previewCell.innerHTML = '';
                const previewBtn = document.createElement('button');
                previewBtn.type = 'button';
                previewBtn.className = 'btn ghost icon-only';
                previewBtn.setAttribute('data-action', 'preview-drawing');
                previewBtn.setAttribute('title', '預覽');
                previewBtn.innerHTML = '<i class="fas fa-eye"></i>';
                previewCell.appendChild(previewBtn);

                // 創建預覽 URL
                const reader = new FileReader();
                reader.onload = (e) => {
                    row.setAttribute('data-preview-url', e.target?.result || '');
                };
                reader.readAsDataURL(file);
            }
        }

        function addAttachmentRow(fileData = null) {
            if (!attachmentsTableBody) {
                return null;
            }

            const emptyRow = attachmentsTableBody.querySelector('.empty-row');
            if (emptyRow) {
                emptyRow.remove();
            }

            const row = document.createElement('tr');
            row.classList.add('attachment-row');

            const isExisting = fileData && fileData.isExisting;

            // 如果是已存在的附件,儲存其 ID
            if (isExisting && fileData.id) {
                row.setAttribute('data-attachment-id', String(fileData.id));
            }

            // 檔案名稱
            const nameCell = document.createElement('td');
            if (fileData) {
                nameCell.textContent = fileData.name || '未命名檔案';
                row.setAttribute('data-file-name', fileData.name || '');
                if (!isExisting) {
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.style.display = 'none';
                    fileInput.setAttribute('data-field', 'attachment-file');
                    nameCell.appendChild(fileInput);
                }
            } else {
                nameCell.innerHTML = '<input type="file" data-field="attachment-file" />';
            }

            // 檔案大小
            const sizeCell = document.createElement('td');
            if (fileData && fileData.size) {
                sizeCell.textContent = formatFileSize(fileData.size);
                row.setAttribute('data-file-size', String(fileData.size));
            } else {
                sizeCell.textContent = '-';
            }

            // 上傳時間
            const timeCell = document.createElement('td');
            if (fileData && fileData.time) {
                timeCell.textContent = fileData.time;
            } else {
                timeCell.textContent = '-';
            }

            // 預覽
            const previewCell = document.createElement('td');
            previewCell.classList.add('text-center');
            if (fileData && fileData.path) {
                const previewBtn = document.createElement('button');
                previewBtn.type = 'button';
                previewBtn.className = 'btn ghost icon-only';
                previewBtn.setAttribute('data-action', 'preview-attachment');
                previewBtn.setAttribute('title', '預覽');
                previewBtn.innerHTML = '<i class="fas fa-eye"></i>';
                previewCell.appendChild(previewBtn);
                row.setAttribute('data-file-path', fileData.path);
            } else {
                previewCell.textContent = '-';
            }

            // 操作
            const actionCell = document.createElement('td');
            actionCell.classList.add('text-center');
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn ghost icon-only';
            removeBtn.setAttribute('data-action', 'remove-attachment');
            removeBtn.setAttribute('title', '移除');
            removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
            actionCell.appendChild(removeBtn);

            row.appendChild(nameCell);
            row.appendChild(sizeCell);
            row.appendChild(timeCell);
            row.appendChild(previewCell);
            row.appendChild(actionCell);

            attachmentsTableBody.appendChild(row);

            // 如果是新增檔案輸入,監聽檔案選擇
            if (!fileData) {
                const fileInput = row.querySelector('input[type="file"]');
                if (fileInput) {
                    fileInput.addEventListener('change', (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            handleAttachmentFileSelection(row, file);
                        }
                    });
                }
            }

            return row;
        }

        function handleAttachmentFileSelection(row, file) {
            // 驗證檔案大小 (最大 10MB)
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                showModalAlert('error', '檔案大小不能超過 10MB', false);
                row.remove();
                if (!attachmentsTableBody?.querySelector('.attachment-row')) {
                    resetAttachmentsTable();
                }
                return;
            }

            // 更新檔案名稱
            const nameCell = row.querySelector('td:nth-child(1)');
            if (nameCell) {
                nameCell.textContent = file.name;
            }

            // 更新檔案大小
            const sizeCell = row.querySelector('td:nth-child(2)');
            if (sizeCell) {
                sizeCell.textContent = formatFileSize(file.size);
            }

            // 更新上傳時間為現在
            const timeCell = row.querySelector('td:nth-child(3)');
            if (timeCell) {
                timeCell.textContent = formatDateTime(new Date().toISOString());
            }

            // 更新預覽
            const previewCell = row.querySelector('td:nth-child(4)');
            row.fileObject = file;
            row.setAttribute('data-file-name', file.name);
            row.setAttribute('data-file-size', String(file.size));

            // 添加預覽按鈕
            if (previewCell) {
                previewCell.innerHTML = '';
                const previewBtn = document.createElement('button');
                previewBtn.type = 'button';
                previewBtn.className = 'btn ghost icon-only';
                previewBtn.setAttribute('data-action', 'preview-attachment');
                previewBtn.setAttribute('title', '預覽');
                previewBtn.innerHTML = '<i class="fas fa-eye"></i>';
                previewCell.appendChild(previewBtn);

                // 創建預覽 URL（如果是圖片）
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        row.setAttribute('data-preview-url', e.target?.result || '');
                    };
                    reader.readAsDataURL(file);
                }
            }
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }

        function resetDrawingsTable() {
            if (!drawingsTableBody) {
                return;
            }
            drawingsTableBody.innerHTML = '<tr class="empty-row"><td colspan="5" class="text-center">尚未上傳圖面</td></tr>';
        }

        function resetAttachmentsTable() {
            if (!attachmentsTableBody) {
                return;
            }
            attachmentsTableBody.innerHTML = '<tr class="empty-row"><td colspan="5" class="text-center">尚未上傳檔案</td></tr>';
        }

        function updateToolTypeSummary() {
            if (!toolsTableBody || !toolTypeSummary || !toolTypeContent) {
                return;
            }

            const typeMap = new Map();
            const toolRows = toolsTableBody.querySelectorAll('.tool-row');

            toolRows.forEach((row) => {
                const toolSelect = row.querySelector('[data-field="tool-id"]');
                const quantityInput = row.querySelector('[data-field="tool-quantity"]');

                if (!toolSelect || !quantityInput) return;

                const toolId = toolSelect.value;
                const quantity = parseInt(quantityInput.value, 10) || 0;

                if (!toolId || quantity <= 0) return;

                // 從 options 中找到對應的 tool
                const tool = (state.options?.tools || []).find(t => String(t.id) === toolId);
                if (!tool || !tool.type) return;

                const currentQty = typeMap.get(tool.type) || 0;
                typeMap.set(tool.type, currentQty + quantity);
            });

            if (typeMap.size === 0) {
                toolTypeSummary.style.display = 'none';
                return;
            }

            // 生成統計顯示
            const badges = Array.from(typeMap.entries())
                .map(([type, qty]) => `
                    <span class="type-badge">
                        <span class="type-name">${type}</span>
                        <span class="type-count">${Math.round(qty)}</span>
                    </span>
                `).join('');

            toolTypeContent.innerHTML = badges;
            toolTypeSummary.style.display = 'block';
        }

        function preloadServiceRows() {
            if (!servicesTableBody) {
                return;
            }

            resetServicesTable();

            const services = Array.isArray(state.options?.screening_services)
                ? state.options.screening_services
                : [];

            if (services.length === 0) {
                addServiceRow();
                return;
            }

            services.forEach((service) => {
                addServiceRow({
                    screening_service_id: service.id,
                    service_name: service.name || null,
                    actual_price_per_unit: service.default_price_per_unit ?? null,
                });
            });
        }

        function readToolRows() {
            if (!toolsTableBody) {
                return [];
            }

            const rows = Array.from(toolsTableBody.querySelectorAll('tr.tool-row'));
            const result = [];

            rows.forEach((row) => {
                const select = row.querySelector('[data-field="tool-id"]');
                const quantityInput = row.querySelector('[data-field="tool-quantity"]');

                if (!select || !quantityInput) {
                    return;
                }

                const toolId = Number.parseInt(select.value, 10);
                const quantity = parseInt(quantityInput.value, 10);

                if (!Number.isInteger(toolId) || toolId <= 0) {
                    return;
                }
                if (!Number.isFinite(quantity) || quantity <= 0) {
                    return;
                }

                result.push({
                    tool_id: toolId,
                    quantity: Number(quantity.toFixed(2)),
                });
            });

            return result;
        }

        function parseNumberOrNull(value, fractionDigits = null) {
            if (value === null || value === undefined) {
                return null;
            }

            const trimmed = typeof value === 'string' ? value.trim() : value;
            if (trimmed === '') {
                return null;
            }

            const parsed = Number.parseFloat(trimmed);
            if (!Number.isFinite(parsed)) {
                return null;
            }

            if (fractionDigits !== null) {
                const factor = 10 ** fractionDigits;
                return Math.round(parsed * factor) / factor;
            }

            return parsed;
        }

        function readServiceRows() {
            if (!servicesTableBody) {
                return [];
            }

            const rows = Array.from(servicesTableBody.querySelectorAll('tr.service-row'));
            const result = [];

            rows.forEach((row) => {
                const serviceSelect = row.querySelector('[data-field="service-id"]');
                if (!serviceSelect) {
                    return;
                }

                const serviceId = Number.parseInt(serviceSelect.value, 10);
                if (!Number.isInteger(serviceId) || serviceId <= 0) {
                    return;
                }

                const getValue = (selector) => {
                    const element = row.querySelector(selector);
                    return element ? element.value : '';
                };

                const serviceName = getValue('[data-field="service-name"]').trim();
                const actualPrice = parseNumberOrNull(getValue('[data-field="service-price"]'), 4);
                const tolerancePlusValue = parseNumberOrNull(getValue('[data-field="tolerance-plus-value"]'), 4);
                const tolerancePlusOver = parseNumberOrNull(getValue('[data-field="tolerance-plus-over"]'), 4);
                const toleranceMinusValue = parseNumberOrNull(getValue('[data-field="tolerance-minus-value"]'), 4);
                const toleranceMinusOver = parseNumberOrNull(getValue('[data-field="tolerance-minus-over"]'), 4);
                const ppm = parseNumberOrNull(getValue('[data-field="ppm"]'), 3);
                const notesValue = getValue('[data-field="service-notes"]').trim();

                result.push({
                    screening_service_id: serviceId,
                    service_name: serviceName !== '' ? serviceName : null,
                    actual_price_per_unit: actualPrice,
                    tolerance_plus_value: tolerancePlusValue,
                    tolerance_plus_over: tolerancePlusOver,
                    tolerance_minus_value: toleranceMinusValue,
                    tolerance_minus_over: toleranceMinusOver,
                    ppm_standard: ppm,
                    notes: notesValue !== '' ? notesValue : null,
                });
            });

            return result;
        }

        function updateMetrics() {
            if (!metricsFields) {
                return;
            }

            const totalWeight = totalWeightInput ? Number.parseFloat(totalWeightInput.value) : NaN;
            const totalWeightValue = Number.isFinite(totalWeight) ? totalWeight : 0;

            let toolWeight = 0;
            if (toolsTableBody) {
                const rows = Array.from(toolsTableBody.querySelectorAll('tr.tool-row'));
                rows.forEach((row) => {
                    const stored = Number.parseFloat(row.dataset.toolTotalWeight || 'NaN');
                    if (Number.isFinite(stored)) {
                        toolWeight += stored;
                    } else {
                        const select = row.querySelector('[data-field="tool-id"]');
                        const quantityInput = row.querySelector('[data-field="tool-quantity"]');
                        const toolId = select ? select.value : '';
                        const tool = state.options ? (state.options.tools || []).find((item) => String(item.id) === toolId) : null;
                        const weightKg = tool && typeof tool.weight_kg === 'number' ? tool.weight_kg : 0;
                        const quantity = quantityInput ? parseInt(quantityInput.value, 10) : NaN;
                        if (Number.isFinite(quantity)) {
                            toolWeight += quantity * weightKg;
                        }
                    }
                });
            }

            if (!Number.isFinite(toolWeight)) {
                toolWeight = 0;
            }

            // 更新載具總重量顯示
            updateToolTotalWeightDisplay();

            const screeningItem = screeningItemSelect && state.options
                ? (state.options.screening_items || []).find((item) => String(item.id) === screeningItemSelect.value)
                : null;
            const weightPerUnitG = screeningItem && typeof screeningItem.weight_per_unit_g === 'number'
                ? screeningItem.weight_per_unit_g
                : null;

            let netWeight = totalWeightValue - toolWeight;
            if (!Number.isFinite(netWeight) || netWeight < 0) {
                netWeight = 0;
            }

            let totalUnits = 0;
            if (weightPerUnitG && weightPerUnitG > 0 && netWeight > 0) {
                totalUnits = (netWeight * 1000) / weightPerUnitG;
            }

            let unitPriceSum = 0;
            if (servicesTableBody) {
                const rows = Array.from(servicesTableBody.querySelectorAll('tr.service-row'));
                rows.forEach((row) => {
                    const priceInput = row.querySelector('[data-field="service-price"]');
                    const value = priceInput ? Number.parseFloat(priceInput.value) : NaN;
                    if (Number.isFinite(value)) {
                        unitPriceSum += value;
                    }
                });
            }

            // 獲取單價(元/M)
            const unitPrice = unitPriceInput ? Number.parseFloat(unitPriceInput.value) : NaN;
            const unitPriceValue = Number.isFinite(unitPrice) ? unitPrice : 0;

            // 新計算公式: 總支數 × 單價(元/M) ÷ 1000
            const totalPrice = totalUnits * unitPriceValue / 1000;

            if (metricsFields.totalWeight) {
                metricsFields.totalWeight.textContent = formatNumber(totalWeightValue, 2);
            }
            if (metricsFields.toolWeight) {
                metricsFields.toolWeight.textContent = formatNumber(toolWeight, 2);
            }
            if (metricsFields.netWeight) {
                metricsFields.netWeight.textContent = formatNumber(netWeight, 2);
            }
            if (metricsFields.unitWeight) {
                metricsFields.unitWeight.textContent = weightPerUnitG ? formatNumber(weightPerUnitG, 4) : '0';
            }
            if (metricsFields.totalUnits) {
                metricsFields.totalUnits.textContent = formatNumber(totalUnits, 0);
            }
            if (metricsFields.unitPrice) {
                metricsFields.unitPrice.textContent = formatNumber(unitPriceValue, 2);
            }
            if (metricsFields.unitPriceSum) {
                metricsFields.unitPriceSum.textContent = formatNumber(unitPriceSum, 2);
            }
            if (metricsFields.totalPrice) {
                metricsFields.totalPrice.textContent = formatCurrency(totalPrice);
            }
        }

        function collectFormData() {
            if (!state.orderContext) {
                showModalAlert('error', '請先選擇訂單後再進行操作。', false);
                return null;
            }

            if (!modalForm) {
                return null;
            }

            clearFormValidation();

            const screeningId = screeningItemSelect ? Number.parseInt(screeningItemSelect.value, 10) : NaN;
            if (!Number.isInteger(screeningId) || screeningId <= 0) {
                if (screeningItemSelect) {
                    screeningItemSelect.classList.add('has-error');
                    screeningItemSelect.setAttribute('aria-invalid', 'true');
                    screeningItemSelect.focus();
                }
                showModalAlert('error', '請選擇受篩產品，或新增一筆受篩產品。', false);
                return null;
            }

            const totalWeight = totalWeightInput ? Number.parseFloat(totalWeightInput.value) : NaN;
            if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
                if (totalWeightInput) {
                    totalWeightInput.classList.add('has-error');
                    totalWeightInput.setAttribute('aria-invalid', 'true');
                    totalWeightInput.focus();
                }
                showModalAlert('error', '請輸入大於 0 的總重量 (kg)。', false);
                return null;
            }

            const unitPrice = unitPriceInput ? Number.parseFloat(unitPriceInput.value) : NaN;
            const unitPriceValue = Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : null;

            const services = readServiceRows();
            if (services.length === 0) {
                showModalAlert('error', '至少需要設定一項篩分服務。', false);
                return null;
            }

            const tools = readToolRows();

            const firstDrawingRowInput = drawingsTableBody ? drawingsTableBody.querySelector('.drawing-row input[data-field="drawing-number"]') : null;
            const mainDrawingNumber = firstDrawingRowInput ? firstDrawingRowInput.value.trim() : null;

            // 收集檔案附件資料
            const attachmentRows = attachmentsTableBody ? attachmentsTableBody.querySelectorAll('.attachment-row') : [];
            const attachmentFiles = [];
            const existingAttachmentIds = [];

            attachmentRows.forEach((row) => {
                if (row.fileObject) {
                    // 新上傳的檔案
                    attachmentFiles.push(row.fileObject);
                } else {
                    // 現有的附件
                    const attachmentId = row.getAttribute('data-attachment-id');
                    if (attachmentId) {
                        existingAttachmentIds.push(Number.parseInt(attachmentId, 10));
                    }
                }
            });

            return {
                order_id: state.orderContext.orderId,
                screening_item_id: screeningId,
                unit_price_per_thousand: unitPriceValue,
                total_weight_kg: Number(totalWeight.toFixed(2)),
                status: statusSelect && statusSelect.value !== '' ? statusSelect.value : null,
                customer_sample_status: sampleStatusSelect && sampleStatusSelect.value !== '' ? sampleStatusSelect.value : null,
                drawing_number: mainDrawingNumber && mainDrawingNumber !== '' ? mainDrawingNumber : null,
                sub_item_number: subItemNumberInput && subItemNumberInput.value.trim() !== '' ? subItemNumberInput.value.trim() : null,
                part_number: partNumberInput && partNumberInput.value.trim() !== '' ? partNumberInput.value.trim() : null,
                customer_batch_number: customerBatchNumberInput && customerBatchNumberInput.value.trim() !== '' ? customerBatchNumberInput.value.trim() : null,
                delivery_location: deliveryLocationInput && deliveryLocationInput.value.trim() !== '' ? deliveryLocationInput.value.trim() : null,
                notes: notesInput && notesInput.value.trim() !== '' ? notesInput.value.trim() : null,
                // 三階段重量追蹤
                customer_provided_weight: customerProvidedWeightInput && customerProvidedWeightInput.value.trim() !== '' ? parseFloat(customerProvidedWeightInput.value) : null,
                confirmed_weight: confirmedWeightInput && confirmedWeightInput.value.trim() !== '' ? parseFloat(confirmedWeightInput.value) : null,
                actual_production_weight: actualProductionWeightInput && actualProductionWeightInput.value.trim() !== '' ? parseFloat(actualProductionWeightInput.value) : null,
                tools,
                screening_details: services,
                attachment_files: attachmentFiles,
                existing_attachment_ids: existingAttachmentIds,
            };
        }

        function applyServerValidationErrors(errors) {
            if (!errors || typeof errors !== 'object') {
                return;
            }

            const messages = [];
            Object.keys(errors).forEach((key) => {
                const value = errors[key];
                if (typeof value === 'string') {
                    messages.push(value);
                } else if (Array.isArray(value)) {
                    value.forEach((item) => {
                        if (typeof item === 'string') {
                            messages.push(item);
                        }
                    });
                }
            });

            if (messages.length > 0) {
                showModalAlert('error', messages[0], false);
            }
        }

        async function submitForm() {
            if (state.isSubmitting) {
                return;
            }

            const payload = collectFormData();
            if (!payload) {
                return;
            }

            state.isSubmitting = true;
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = '儲存中…';
            }

            try {
                const isEdit = state.currentMode === 'edit' && state.currentEditingId;
                const url = isEdit
                    ? `api/order_items/update.php?id=${encodeURIComponent(state.currentEditingId)}`
                    : 'api/order_items/index.php';

                // 使用 FormData 以支援檔案上傳
                const formData = new FormData();

                // 添加基本欄位
                Object.entries(payload).forEach(([key, value]) => {
                    if (key === 'tools' || key === 'screening_details' || key === 'drawing_files' || key === 'attachment_files' || key === 'existing_attachment_ids') {
                        // 這些會單獨處理
                        return;
                    }
                    formData.append(key, value ?? '');
                });

                // 添加載具數據
                formData.append('tools', JSON.stringify(payload.tools));

                // 添加篩分服務數據
                formData.append('screening_details', JSON.stringify(payload.screening_details));

                // 添加圖面檔案和圖面編號
                if (drawingsTableBody) {
                    const drawingRows = drawingsTableBody.querySelectorAll('.drawing-row');
                    const drawingNumbers = [];
                    const newDrawingNumbersOnly = []; // New array
                    const copiedDrawingIds = [];
                    const copiedDrawingNumbers = {};
                    drawingRows.forEach((row) => {
                        const numberInput = row.querySelector('[data-field="drawing-number"]');
                        const drawingNumber = numberInput ? numberInput.value.trim() : '';

                        if (row.fileObject) {
                            // 新上傳的檔案
                            formData.append(`drawing_files[]`, row.fileObject);
                            drawingNumbers.push(drawingNumber);
                        } else {
                            const drawingId = row.getAttribute('data-drawing-id');
                            if (drawingId) {
                                if (isEdit) {
                                    // 已存在的圖面,如果圖面編號有變更,需要更新
                                    formData.append(`existing_drawing_numbers[${drawingId}]`, drawingNumber);
                                } else {
                                    // 複製模式：沿用既有圖面關聯（不重傳實體檔）
                                    const parsedDrawingId = Number.parseInt(drawingId, 10);
                                    if (Number.isInteger(parsedDrawingId) && parsedDrawingId > 0) {
                                        copiedDrawingIds.push(parsedDrawingId);
                                        copiedDrawingNumbers[drawingId] = drawingNumber;
                                    }
                                }
                            } else if (drawingNumber) {
                                // 新增的列，但只有圖面編號
                                newDrawingNumbersOnly.push(drawingNumber);
                            }
                        }
                    });

                    // 將新圖面的編號以 JSON 格式送出
                    if (drawingNumbers.length > 0) {
                        formData.append('drawing_numbers', JSON.stringify(drawingNumbers));
                    }
                    // 將只有編號的新圖面以 JSON 格式送出
                    if (newDrawingNumbersOnly.length > 0) {
                        formData.append('new_drawing_numbers_only', JSON.stringify(newDrawingNumbersOnly));
                    }
                    if (!isEdit && copiedDrawingIds.length > 0) {
                        formData.append('copied_drawing_ids', JSON.stringify(copiedDrawingIds));
                        formData.append('copied_drawing_numbers', JSON.stringify(copiedDrawingNumbers));
                    }
                }

                // 添加要刪除的圖面 ID
                if (isEdit && state.deletedDrawingIds && state.deletedDrawingIds.length > 0) {
                    formData.append('deleted_drawing_ids', JSON.stringify(state.deletedDrawingIds));
                }

                // 添加檔案附件
                if (payload.attachment_files && payload.attachment_files.length > 0) {
                    payload.attachment_files.forEach((file) => {
                        formData.append('attachment_files[]', file);
                    });
                }

                // 添加現有的檔案附件 ID
                if (isEdit && payload.existing_attachment_ids && payload.existing_attachment_ids.length > 0) {
                    formData.append('existing_attachment_ids', JSON.stringify(payload.existing_attachment_ids));
                }
                if (!isEdit && payload.existing_attachment_ids && payload.existing_attachment_ids.length > 0) {
                    formData.append('copied_attachment_ids', JSON.stringify(payload.existing_attachment_ids));
                }

                // 添加要刪除的檔案附件 ID
                if (isEdit && state.deletedAttachmentIds && state.deletedAttachmentIds.length > 0) {
                    formData.append('deleted_attachment_ids', JSON.stringify(state.deletedAttachmentIds));
                }

                if (isEdit) {
                    formData.append('_method', 'PUT');
                }

                const response = await fetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                    body: formData,
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    const message = result?.message || `HTTP ${response.status}`;
                    applyServerValidationErrors(result?.errors);
                    showModalAlert('error', message, false);
                    return;
                }

                // 根據是否為複製模式顯示不同的提示訊息
                if (state.isCopyMode) {
                    showAlert('success', '已複製並儲存品項資料（已同步圖面與檔案附件）。');
                } else {
                    showAlert('success', result.message || '操作成功。');
                }
                // 通知 DataSync 資料已變更
                if (typeof DataSync !== 'undefined') {
                    const eventType = isEdit ? DataSync.EVENT_TYPES.UPDATED : DataSync.EVENT_TYPES.CREATED;
                    DataSync.notifyWithDependencies('order_items', eventType, result.data);
                }
                closeModal();
                await loadItems();
            } catch (error) {
                const message = error instanceof Error ? error.message : '儲存失敗。';
                showModalAlert('error', `儲存客戶批號失敗：${message}`, false);
            } finally {
                state.isSubmitting = false;
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = '儲存';
                }
            }
        }

        function handleEscapeKey(event) {
            if (event.key === 'Escape') {
                closeModal();
            }
        }

        function closeModal() {
            if (!modalOverlay) {
                return;
            }

            modalOverlay.classList.add('hidden');
            hideModalAlert();
            document.removeEventListener('keydown', handleEscapeKey);
            state.currentMode = 'create';
            state.currentEditingId = null;
            state.deletedDrawingIds = []; // 清空待刪除的圖面 ID
            state.deletedAttachmentIds = []; // 清空待刪除的檔案附件 ID
            state.isCopyMode = false; // 清除複製模式標記
            resetModalForm();
        }

        function openModal(mode, data = null) {
            if (!modalOverlay) {
                return;
            }

            state.currentMode = mode;
            state.currentEditingId = mode === 'edit' && data ? data.id : null;
            state.deletedDrawingIds = []; // 初始化待刪除的圖面 ID
            state.deletedAttachmentIds = []; // 初始化待刪除的檔案附件 ID

            if (modalTitle) {
                modalTitle.textContent = mode === 'edit' ? '編輯客戶批號' : '新增品項';
            }

            resetModalForm();
            populateModalSelects();

            const formatWeightInput = (value) => {
                const numericValue = Number.parseFloat(String(value));
                if (!Number.isFinite(numericValue)) {
                    return '';
                }
                return numericValue.toFixed(2);
            };

            if (data) {
                // 編輯模式或複製模式都填入資料
                if (screeningItemSelect && data.screening_item && data.screening_item.id) {
                    screeningItemSelect.value = String(data.screening_item.id);
                    // 更新單支重量顯示
                    if (weightPerUnitDisplay && data.screening_item.weight_per_unit_g != null) {
                        weightPerUnitDisplay.value = formatNumber(data.screening_item.weight_per_unit_g, 4) + ' g';
                    }
                }
                if (unitPriceInput && data.unit_price_per_thousand != null) {
                    unitPriceInput.value = String(data.unit_price_per_thousand);
                }
                if (totalWeightInput && data.total_weight_kg != null) {
                    totalWeightInput.value = formatWeightInput(data.total_weight_kg);
                }
                if (statusSelect && data.status) {
                    statusSelect.value = data.status;
                }
                if (sampleStatusSelect && data.customer_sample_status) {
                    sampleStatusSelect.value = data.customer_sample_status;
                }
                if (drawingNumberInput && data.drawing_number) {
                    drawingNumberInput.value = data.drawing_number;
                }
                if (subItemNumberInput && data.sub_item_number) {
                    subItemNumberInput.value = data.sub_item_number;
                }
                if (partNumberInput && data.part_number) {
                    partNumberInput.value = data.part_number;
                }
                if (customerBatchNumberInput && data.customer_batch_number) {
                    customerBatchNumberInput.value = data.customer_batch_number;
                }
                if (deliveryLocationInput && data.delivery_location) {
                    deliveryLocationInput.value = data.delivery_location;
                }
                if (notesInput && data.notes) {
                    notesInput.value = data.notes;
                }

                // 填入三階段重量追蹤資料
                if (customerProvidedWeightInput && data.customer_provided_weight != null) {
                    customerProvidedWeightInput.value = formatWeightInput(data.customer_provided_weight);
                }
                if (confirmedWeightInput && data.confirmed_weight != null) {
                    confirmedWeightInput.value = formatWeightInput(data.confirmed_weight);
                }
                if (actualProductionWeightInput && data.actual_production_weight != null) {
                    actualProductionWeightInput.value = formatWeightInput(data.actual_production_weight);
                }

                if (Array.isArray(data.tools) && data.tools.length > 0) {
                    data.tools.forEach((tool) => addToolRow(tool));
                }

                if (Array.isArray(data.screening_details) && data.screening_details.length > 0) {
                    data.screening_details.forEach((detail) => addServiceRow(detail));
                } else {
                    preloadServiceRows();
                }

                // 清空並載入圖面
                resetDrawingsTable();
                if (Array.isArray(data.drawings) && data.drawings.length > 0) {
                    data.drawings.forEach((drawing) => {
                        addDrawingRow({
                            id: drawing.id,
                            drawing_number: drawing.drawing_number,
                            name: drawing.file_name,
                            size: drawing.file_size,
                            time: drawing.uploaded_at,
                            path: drawing.file_path,
                            isExisting: drawing.isExisting !== false, // 複製模式時 isExisting 為 false
                        });
                    });
                }

                // 清空並載入檔案附件
                resetAttachmentsTable();
                if (Array.isArray(data.attachments) && data.attachments.length > 0) {
                    data.attachments.forEach((attachment) => {
                        addAttachmentRow({
                            id: attachment.id,
                            name: attachment.file_name,
                            size: attachment.file_size,
                            time: attachment.uploaded_at,
                            path: attachment.file_path,
                            isExisting: attachment.isExisting !== false,
                        });
                    });
                }
            } else {
                preloadServiceRows();
            }

            updateMetrics();

            modalOverlay.classList.remove('hidden');
            document.addEventListener('keydown', handleEscapeKey);

            setTimeout(() => {
                if (screeningItemSelect) {
                    screeningItemSelect.focus();
                }
            }, 50);
        }

        /**
         * 載入訂單詳情以獲取客戶公差設定
         * @param {number} orderId - 訂單 ID
         */
        async function loadOrderDetails(orderId) {
            try {
                const response = await fetch(`api/orders/show.php?id=${orderId}&include=customer`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' },
                });
                const result = await response.json();
                if (response.ok && result.success && result.data) {
                    const customer = result.data.customer;
                    if (customer && customer.weight_tolerance_percentage != null) {
                        state.customerWeightTolerance = customer.weight_tolerance_percentage;
                    } else {
                        state.customerWeightTolerance = 3.0; // 預設 3%
                    }
                    // 更新公差顯示
                    if (weightToleranceDisplay) {
                        weightToleranceDisplay.value = `±${state.customerWeightTolerance}%`;
                    }
                }
            } catch (error) {
                console.warn('[order_items] 載入訂單詳情失敗:', error);
                state.customerWeightTolerance = 3.0;
            }
        }

        async function loadItems() {
            if (!state.orderContext) {
                renderEmptyTable('尚未選擇訂單，表格將於載入訂單後顯示。');
                return false;
            }

            setLoading(true);

            try {
                const apiUrl = `api/order_items/index.php?order_id=${encodeURIComponent(state.orderContext.orderId)}`;
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result?.message || `HTTP ${response.status}`);
                }

                const data = Array.isArray(result.data) ? result.data : [];
                state.items = data;
                state.itemMap = new Map(data.map((item) => [item.id, item]));

                if (data.length === 0) {
                    renderEmptyTable('尚無客戶批號資料。');
                    renderGuidance(true);
                } else {
                    renderRows(data);
                    renderGuidance(false);
                }

                return true;
            } catch (error) {
                console.error('[order_items] loadItems error:', error);
                const message = error instanceof Error ? error.message : '資料載入失敗。';
                showAlert('error', `載入客戶批號失敗：${message}`);
                renderEmptyTable('無法載入客戶批號資料。');
                return false;
            } finally {
                setLoading(false);
            }
        }

        async function openEditModal(id) {
            try {
                await loadOptionsIfNeeded();

                const response = await fetch(`api/order_items/show.php?id=${encodeURIComponent(id)}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result?.message || `HTTP ${response.status}`);
                }

                const item = result.data;
                if (item) {
                    state.itemMap.set(item.id, item);
                    openModal('edit', item);
                }
            } catch (error) {
                console.error('Failed to load order item:', error);
                showAlert('error', error instanceof Error ? error.message : '載入品項失敗，請稍後再試。');
            }
        }

        async function openCopyModal(id) {
            try {
                await loadOptionsIfNeeded();

                const response = await fetch(`api/order_items/show.php?id=${encodeURIComponent(id)}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result?.message || `HTTP ${response.status}`);
                }

                const item = result.data;
                if (item) {
                    // 複製模式：移除 ID，將其視為新品項
                    const copiedItem = {
                        ...item,
                        id: undefined, // 移除 ID，表示這是新品項
                        // 複製載具資料（移除各載具的 ID）
                        tools: (item.tools || []).map(tool => ({
                            ...tool,
                            id: undefined, // 移除載具 ID
                            order_item_id: undefined
                        })),
                        // 複製篩分服務資料（移除各服務的 ID）
                        screening_details: (item.screening_details || []).map(detail => ({
                            ...detail,
                            id: undefined, // 移除服務 ID
                            order_item_id: undefined
                        })),
                        // 複製圖面與附件關聯，避免重複儲存實體檔案
                        drawings: (item.drawings || []).map(drawing => ({
                            ...drawing,
                            isExisting: true,
                        })),
                        attachments: (item.attachments || []).map(attachment => ({
                            ...attachment,
                            isExisting: true,
                        })),
                    };
                    openModal('create', copiedItem);
                    // 提示訊息將在使用者確認儲存後才顯示
                    state.isCopyMode = true; // 標記為複製模式
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : '資料載入失敗。';
                showAlert('error', `載入客戶批號明細失敗：${message}`);
            }
        }

        async function readJsonResponse(response, fallbackMessage) {
            const raw = await response.text();
            if (!raw || raw.trim() === '') {
                throw new Error(`${fallbackMessage}（伺服器未回傳內容，HTTP ${response.status}）`);
            }

            try {
                return JSON.parse(raw);
            } catch (error) {
                console.error('order_items: 非 JSON 回應內容', raw);
                throw new Error(`${fallbackMessage}（伺服器回應格式錯誤，HTTP ${response.status}）`);
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
            const impacts = Array.isArray(assessment.impacts) && assessment.impacts.length > 0
                ? `\n\n影響範圍：\n${assessment.impacts.map((impact) => `- ${impact}`).join('\n')}`
                : '';
            return window.confirm(`${assessment.message || fallbackMessage}${impacts}\n\n確定繼續嗎？`);
        }

        async function handleDelete(id) {
            if (!state.orderContext) {
                return;
            }

            const item = state.itemMap.get(id);
            const screeningLabel = item && item.screening_item
                ? [item.screening_item.item_number, item.screening_item.name].filter(Boolean).join(' - ')
                : `ID ${id}`;

            let assessment;
            try {
                assessment = await checkWorkflowDelete('order_items', id);
            } catch (error) {
                const message = error instanceof Error ? error.message : '流程檢查失敗。';
                showAlert('error', message);
                return;
            }

            if (!assessment.allowed) {
                await confirmWorkflowDelete(assessment, `此客戶批號「${screeningLabel || `ID ${id}`}」目前不可刪除。`);
                return;
            }

            const shouldDelete = await confirmWorkflowDelete(assessment, `確定要刪除「${screeningLabel || `ID ${id}`}」嗎？刪除後將無法復原。`);
            if (!shouldDelete) {
                return;
            }

            try {
                const response = await fetch(`api/order_items/delete.php?id=${encodeURIComponent(id)}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ _method: 'DELETE' }),
                });

                const result = await readJsonResponse(response, '刪除客戶批號失敗。');

                if (!response.ok || !result.success) {
                    throw new Error(result?.message || `HTTP ${response.status}`);
                }

                showAlert('success', result.message || '客戶批號已刪除。');
                // 通知 DataSync 資料已刪除
                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('order_items', DataSync.EVENT_TYPES.DELETED, {
                        id,
                        order_id: item?.order_id ?? state.orderContext.orderId
                    });
                }
                await loadItems();
            } catch (error) {
                const message = error instanceof Error ? error.message : '刪除失敗。';
                showAlert('error', `刪除客戶批號失敗：${message}`);
            }
        }

        async function handleCreateWorkOrder(orderItemId) {
            if (!state.orderContext) {
                return;
            }

            // 切換到工單模組
            window.openTab('work_orders', '生產工單', 'modules/work_orders.html');

            // 等待工單模組初始化和 DOM 更新
            setTimeout(() => {
                // 呼叫工單模組的函數來開啟新增工單表單並帶入客戶批號資料
                if (window.openWorkOrderFromOrderItem && typeof window.openWorkOrderFromOrderItem === 'function') {
                    window.openWorkOrderFromOrderItem(orderItemId);
                } else {
                    console.error('工單模組未正確載入,openWorkOrderFromOrderItem 函數不存在');
                }
            }, 500);
        }

        function downloadExport() {
            if (!state.orderContext) {
                return;
            }
            const url = `api/order_items/export.php?order_id=${encodeURIComponent(state.orderContext.orderId)}`;
            window.open(url, '_blank');
        }

        async function applyOrderContext(context) {
            const normalized = normalizeOrderContext(context);
            if (!normalized) {
                state.orderContext = null;
                state.items = [];
                state.itemMap.clear();
                updateBanner();
                updateButtons();
                renderGuidance(true);
                renderEmptyTable('尚未選擇訂單，表格將於載入訂單後顯示。');
                return;
            }

            state.orderContext = normalized;
            updateBanner();
            updateButtons();
            clearAlert();

            const requestToken = Symbol('order-items');
            state.activeRequestToken = requestToken;

            try {
                // 載入訂單詳情以獲取客戶公差設定
                await loadOrderDetails(normalized.orderId);

                await loadOptionsIfNeeded();
                if (state.activeRequestToken !== requestToken) {
                    return;
                }

                const loaded = await loadItems();
                if (loaded && state.lastNotifiedOrderId !== normalized.orderId) {
                    const orderLabel = normalized.orderNumber ? normalized.orderNumber : `ID ${normalized.orderId}`;
                    showAlert('success', `已切換至訂單 ${orderLabel}。`);
                    state.lastNotifiedOrderId = normalized.orderId;
                }

                if (loaded && normalized.editItemId) {
                    await openEditModal(normalized.editItemId);
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : '載入客戶批號資料時發生錯誤。';
                showAlert('error', message);
            }
        }

        if (headerCreateButton) {
            headerCreateButton.addEventListener('click', async () => {
                if (!state.orderContext || state.isLoading) {
                    return;
                }
                try {
                    await loadOptionsIfNeeded();
                    openModal('create');
                } catch {
                    // 錯誤已於 loadOptionsIfNeeded 顯示
                }
            });
        }

        if (exportButton) {
            exportButton.addEventListener('click', downloadExport);
        }

        if (tableHead) {
            tableHead.addEventListener('click', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                const header = target.closest('th[data-sort]');
                if (!header || !(header instanceof HTMLElement)) {
                    return;
                }

                const sortField = header.getAttribute('data-sort');
                if (!sortField) {
                    return;
                }

                if (state.sortField === sortField) {
                    state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    state.sortField = sortField;
                    state.sortDirection = 'asc';
                }

                renderRows(state.items);
            });
        }

        if (tableBody) {
            tableBody.addEventListener('click', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                const actionElement = target.closest('[data-action]');
                if (!actionElement) {
                    return;
                }

                const action = actionElement.getAttribute('data-action');
                const row = actionElement.closest('tr');
                if (!row) {
                    return;
                }

                const id = Number.parseInt(row.getAttribute('data-id') || '', 10);
                if (!Number.isInteger(id)) {
                    return;
                }

                if (action === 'edit-order-item') {
                    openEditModal(id);
                } else if (action === 'copy-order-item') {
                    openCopyModal(id);
                } else if (action === 'delete-order-item') {
                    handleDelete(id);
                } else if (action === 'create-work-order') {
                    const hasWorkOrder = actionElement.getAttribute('data-has-work-order') === 'true';
                    if (hasWorkOrder) {
                        showAlert('error', '此客戶批號已轉成工單，請勿重複建立。');
                        return;
                    }
                    handleCreateWorkOrder(id);
                }
            });
        }

        // 移除點擊外部關閉功能，避免用戶在填寫複雜客戶批號資料時誤觸關閉
        // 僅允許透過「儲存」、「取消」按鈕或右上角「X」關閉 modal
        // if (modalOverlay) {
        //     modalOverlay.addEventListener('click', (event) => {
        //         if (event.target === modalOverlay) {
        //             closeModal();
        //         }
        //     });
        // }

        if (modalCloseButton) {
            modalCloseButton.addEventListener('click', closeModal);
        }

        if (modalCancelButton) {
            modalCancelButton.addEventListener('click', closeModal);
        }

        if (screeningCreateToggleButton) {
            screeningCreateToggleButton.addEventListener('click', async (event) => {
                event.preventDefault();

                if (!state.optionsLoaded) {
                    try {
                        await loadOptionsIfNeeded();
                    } catch (error) {
                        console.error('Failed to load options before opening create panel:', error);
                        return;
                    }
                }

                if (state.screeningCreationVisible) {
                    closeScreeningCreatePanel();
                } else {
                    openScreeningCreatePanel();
                }
            });
        }

        if (screeningCreateConfirmButton) {
            screeningCreateConfirmButton.addEventListener('click', (event) => {
                event.preventDefault();
                submitScreeningCreate();
            });
        }

        if (screeningCreateCancelButtons && screeningCreateCancelButtons.length > 0) {
            screeningCreateCancelButtons.forEach((button) => {
               button.addEventListener('click', (event) => {
                    event.preventDefault();
                    if (state.isCreatingScreeningItem) {
                        return;
                    }
                    closeScreeningCreatePanel();
                });
            });
        }

        if (modalForm) {
            modalForm.addEventListener('submit', (event) => {
                event.preventDefault();
                submitForm();
            });

            modalForm.addEventListener('input', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                if (target.classList.contains('has-error')) {
                    target.classList.remove('has-error');
                    target.removeAttribute('aria-invalid');
                }

                if (target.dataset.field === 'service-name' || target.dataset.field === 'service-price' || target.dataset.field === 'service-notes') {
                    target.dataset.userEdited = 'true';
                }

                if (['total-weight', 'tool-quantity', 'service-price', 'tolerance-plus-value', 'tolerance-plus-over', 'tolerance-minus-value', 'tolerance-minus-over', 'ppm'].includes(target.dataset.field || '')) {
                    updateMetrics();
                }
            });

            modalForm.addEventListener('change', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                if (target.classList.contains('has-error')) {
                    target.classList.remove('has-error');
                    target.removeAttribute('aria-invalid');
                }

                if (target.dataset.field === 'screening-item') {
                    updateMetrics();
                }

                if (target.dataset.field === 'tool-id') {
                    const row = target.closest('tr');
                    refreshToolRow(row);
                    updateMetrics();
                }

                if (target.dataset.field === 'service-id') {
                    const row = target.closest('tr');
                    refreshServiceRow(row, { applyDefaults: true });
                    updateMetrics();
                }
            });
        }

        if (screeningItemSelect) {
            screeningItemSelect.addEventListener('change', () => {
                const screeningId = screeningItemSelect.value;
                const item = state.options ? (state.options.screening_items || []).find((i) => String(i.id) === screeningId) : null;

                if (item && item.unit_price != null && unitPriceInput) {
                    unitPriceInput.value = String(item.unit_price);
                }

                // 更新單支重量顯示
                if (weightPerUnitDisplay) {
                    if (item && item.weight_per_unit_g != null) {
                        weightPerUnitDisplay.value = formatNumber(item.weight_per_unit_g, 4) + ' g';
                    } else {
                        weightPerUnitDisplay.value = '';
                    }
                }

                updateMetrics();
            });
        }

        if (unitPriceInput) {
            unitPriceInput.addEventListener('input', () => {
                updateMetrics();
            });
        }

        if (totalWeightInput) {
            totalWeightInput.addEventListener('input', () => {
                updateMetrics();
            });
        }

        // 三階段重量欄位變更時更新公差警示
        function updateWeightVarianceAlert() {
            if (!weightVarianceAlert || !weightVarianceMessage) {
                return;
            }
            const confirmedWeight = confirmedWeightInput ? parseFloat(confirmedWeightInput.value) : NaN;
            const actualWeight = actualProductionWeightInput ? parseFloat(actualProductionWeightInput.value) : NaN;

            if (isNaN(confirmedWeight) || isNaN(actualWeight) || confirmedWeight <= 0) {
                weightVarianceAlert.classList.add('hidden');
                return;
            }

            const variance = actualWeight - confirmedWeight;
            const variancePercent = (variance / confirmedWeight) * 100;
            const tolerance = state.customerWeightTolerance || 3.0;
            const isOutOfTolerance = Math.abs(variancePercent) > tolerance;

            if (isOutOfTolerance) {
                const sign = variance >= 0 ? '+' : '';
                weightVarianceMessage.textContent = `重量差異 ${sign}${variance.toFixed(2)} kg (${sign}${variancePercent.toFixed(2)}%) 超出客戶允許公差 ±${tolerance}%`;
                weightVarianceAlert.classList.remove('hidden');
                if (Math.abs(variancePercent) > tolerance * 2) {
                    weightVarianceAlert.classList.add('danger');
                } else {
                    weightVarianceAlert.classList.remove('danger');
                }
            } else {
                weightVarianceAlert.classList.add('hidden');
            }
        }

        if (confirmedWeightInput) {
            confirmedWeightInput.addEventListener('input', updateWeightVarianceAlert);
        }
        if (actualProductionWeightInput) {
            actualProductionWeightInput.addEventListener('input', updateWeightVarianceAlert);
        }

        if (addToolButton) {
            addToolButton.addEventListener('click', () => {
                if (!state.optionsLoaded) {
                    return;
                }
                addToolRow();
                updateMetrics();
            });
        }

        if (addServiceButton) {
            addServiceButton.addEventListener('click', () => {
                if (!state.optionsLoaded) {
                    return;
                }
                addServiceRow();
                updateMetrics();
            });
        }

        if (addDrawingButton) {
            addDrawingButton.addEventListener('click', () => {
                addDrawingRow();
            });
        }

        if (addAttachmentButton) {
            addAttachmentButton.addEventListener('click', () => {
                addAttachmentRow();
            });
        }

        if (drawingsTableBody) {
            drawingsTableBody.addEventListener('click', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                // 處理移除圖面
                const removeAction = target.closest('[data-action="remove-drawing"]');
                if (removeAction) {
                    const row = removeAction.closest('tr');
                    if (row) {
                        if (confirm('確定要移除此圖面嗎?')) {
                            const drawingId = row.getAttribute('data-drawing-id');

                            // 如果是已存在的圖面,記錄要刪除的 ID
                            if (drawingId) {
                                if (!state.deletedDrawingIds) {
                                    state.deletedDrawingIds = [];
                                }
                                state.deletedDrawingIds.push(parseInt(drawingId));
                            }

                            row.remove();
                            if (!drawingsTableBody.querySelector('.drawing-row')) {
                                resetDrawingsTable();
                            }
                        }
                    }
                    return;
                }

                // 處理預覽圖面
                const previewAction = target.closest('[data-action="preview-drawing"]');
                if (previewAction) {
                    const row = previewAction.closest('tr');
                    if (row) {
                        let previewUrl = row.getAttribute('data-file-path');
                        if (previewUrl) {
                            // 如果路徑不是完整 URL,加上相對路徑前綴
                            if (!previewUrl.startsWith('http')) {
                                previewUrl = previewUrl.startsWith('/') ? previewUrl : '/' + previewUrl;
                            }
                            window.open(previewUrl, '_blank');
                        }
                    }
                    return;
                }
            });
        }

        if (attachmentsTableBody) {
            attachmentsTableBody.addEventListener('click', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                // 處理移除附件
                const removeAction = target.closest('[data-action="remove-attachment"]');
                if (removeAction) {
                    const row = removeAction.closest('tr');
                    if (row) {
                        if (confirm('確定要移除此附件嗎?')) {
                            const attachmentId = row.getAttribute('data-attachment-id');

                            // 如果是已存在的附件,記錄要刪除的 ID
                            if (attachmentId) {
                                if (!state.deletedAttachmentIds) {
                                    state.deletedAttachmentIds = [];
                                }
                                state.deletedAttachmentIds.push(parseInt(attachmentId));
                            }

                            row.remove();
                            if (!attachmentsTableBody.querySelector('.attachment-row')) {
                                resetAttachmentsTable();
                            }
                        }
                    }
                    return;
                }

                // 處理預覽附件
                const previewAction = target.closest('[data-action="preview-attachment"]');
                if (previewAction) {
                    const row = previewAction.closest('tr');
                    if (row) {
                        let previewUrl = row.getAttribute('data-file-path');
                        if (previewUrl) {
                            // 如果路徑不是完整 URL,加上相對路徑前綴
                            if (!previewUrl.startsWith('http')) {
                                previewUrl = previewUrl.startsWith('/') ? previewUrl : '/' + previewUrl;
                            }
                            window.open(previewUrl, '_blank');
                        }
                    }
                    return;
                }
            });

            attachmentsTableBody.addEventListener('change', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                const fileInput = target.closest('input[type="file"]');
                if (fileInput && fileInput.dataset.field === 'attachment-file') {
                    const row = fileInput.closest('tr');
                    if (row) {
                        handleAttachmentFileSelection(row, fileInput);
                    }
                }
            });
        }

        if (toolsTableBody) {
            toolsTableBody.addEventListener('click', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                const actionElement = target.closest('[data-action="remove-tool"]');
                if (!actionElement) {
                    return;
                }

                const row = actionElement.closest('tr');
                if (!row) {
                    return;
                }

                row.remove();
                if (!toolsTableBody.querySelector('.tool-row')) {
                    resetToolsTable();
                }
                updateMetrics();
            });

            toolsTableBody.addEventListener('input', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                if (target.dataset.field === 'tool-quantity') {
                    const row = target.closest('tr');
                    refreshToolRow(row);
                    updateMetrics();
                }
            });

            toolsTableBody.addEventListener('change', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                if (target.dataset.field === 'tool-id') {
                    const row = target.closest('tr');
                    refreshToolRow(row);
                    updateMetrics();
                }
            });
        }

        if (servicesTableBody) {
            servicesTableBody.addEventListener('click', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                const actionElement = target.closest('[data-action="remove-service"]');
                if (!actionElement) {
                    return;
                }

                const row = actionElement.closest('tr');
                if (!row) {
                    return;
                }

                row.remove();
                if (!servicesTableBody.querySelector('.service-row')) {
                    resetServicesTable();
                }
                updateMetrics();
            });

            servicesTableBody.addEventListener('input', (event) => {
                const target = event.target;
                if (!(target instanceof HTMLElement)) {
                    return;
                }

                if (target.dataset.field === 'service-price') {
                    target.dataset.userEdited = 'true';
                    updateMetrics();
                }
            });
        }

        container.addEventListener('module:context', (event) => {
            if (!(event instanceof CustomEvent)) {
                return;
            }

            const detail = event.detail || {};
            if (detail.moduleId && detail.moduleId !== 'order_items') {
                return;
            }

            applyOrderContext(detail.context || null);
        });

        updateButtons();
        updateBanner();

        if (state.orderContext) {
            applyOrderContext(state.orderContext);
        } else {
            renderGuidance(true);
            renderEmptyTable('尚未選擇訂單，表格將於載入訂單後顯示。');
        }

        async function refreshOrderItemsForDataSync(sourceModule = null) {
            if (['screening_items', 'screening_services', 'tools'].includes(sourceModule)) {
                state.optionsLoaded = false;
                await loadOptionsIfNeeded();
            }
            if (sourceModule === 'orders' && state.orderContext) {
                await loadOrderDetails(state.orderContext.orderId);
                updateBanner();
            }

            await loadItems();

            if (
                modalOverlay &&
                !modalOverlay.classList.contains('hidden') &&
                state.currentMode === 'edit' &&
                state.currentEditingId
            ) {
                await openEditModal(state.currentEditingId);
            }
        }

        // 建立資料同步輔助器
        if (typeof DataSync !== 'undefined') {
            DataSync.createModuleHelper('order_items', {
                onRefresh: () => refreshOrderItemsForDataSync(),
                onDependencyUpdate: (sourceModule) => refreshOrderItemsForDataSync(sourceModule),
                debounceMs: 300
            });

            // 監聽 screening_items 的變更，更新本地快取和 UI
            DataSync.subscribeDebounced('screening_items', (type, data) => {

                if (!state.options || !Array.isArray(state.options.screening_items)) {
                    return;
                }

                if (type === DataSync.EVENT_TYPES.UPDATED && data && data.id) {
                    // 找到並更新對應的 screening_item
                    const index = state.options.screening_items.findIndex(
                        item => String(item.id) === String(data.id)
                    );

                    if (index !== -1) {
                        // 更新快取中的資料
                        const updatedItem = {
                            ...state.options.screening_items[index],
                            item_number: data.item_number ?? state.options.screening_items[index].item_number,
                            name: data.name ?? state.options.screening_items[index].name,
                            material: data.material ?? state.options.screening_items[index].material,
                            thread_type: data.thread_type ?? state.options.screening_items[index].thread_type,
                            weight_per_unit_g: data.weight_per_unit_g != null
                                ? (typeof data.weight_per_unit_g === 'number'
                                    ? data.weight_per_unit_g
                                    : Number.parseFloat(data.weight_per_unit_g))
                                : state.options.screening_items[index].weight_per_unit_g,
                            unit_price: data.unit_price != null
                                ? (typeof data.unit_price === 'number'
                                    ? data.unit_price
                                    : Number.parseFloat(data.unit_price))
                                : state.options.screening_items[index].unit_price,
                            unit: data.unit ?? state.options.screening_items[index].unit,
                        };

                        state.options.screening_items[index] = updatedItem;

                        // 檢查 modal 是否開啟（不是隱藏狀態）
                        const isModalOpen = modalOverlay && !modalOverlay.classList.contains('hidden');

                        // 如果 modal 開啟且選中的是被更新的受篩產品，更新 UI
                        if (isModalOpen && screeningItemSelect && String(screeningItemSelect.value) === String(data.id)) {
                            // 更新單支重量顯示欄位
                            if (weightPerUnitDisplay && updatedItem.weight_per_unit_g != null) {
                                weightPerUnitDisplay.value = formatNumber(updatedItem.weight_per_unit_g, 4) + ' g';
                            }
                            // 更新單價欄位
                            if (unitPriceInput && updatedItem.unit_price != null) {
                                unitPriceInput.value = String(updatedItem.unit_price);
                            }
                            // 重新計算 metrics panel
                            updateMetrics();
                        }

                        // 更新下拉選單中的選項文字
                        const option = screeningItemSelect?.querySelector(`option[value="${data.id}"]`);
                        if (option) {
                            option.textContent = formatScreeningItemLabel(updatedItem);
                            option.dataset.weightPerUnit = updatedItem.weight_per_unit_g != null
                                ? String(updatedItem.weight_per_unit_g)
                                : '';
                        }

                        // 檢查變更的受篩產品是否被當前表格中的項目使用，如果是則刷新表格
                        const isUsedInTable = state.items.some(
                            item => item.screening_item && String(item.screening_item.id) === String(data.id)
                        );
                        if (isUsedInTable) {
                            loadItems();
                        }
                    }
                } else if (type === DataSync.EVENT_TYPES.CREATED && data && data.id) {
                    // 新增的受篩產品，加入快取
                    const exists = state.options.screening_items.some(
                        item => String(item.id) === String(data.id)
                    );
                    if (!exists) {
                        const newItem = {
                            id: Number.parseInt(data.id, 10),
                            item_number: data.item_number ?? null,
                            name: data.name ?? null,
                            material: data.material ?? null,
                            thread_type: data.thread_type ?? null,
                            weight_per_unit_g: data.weight_per_unit_g != null
                                ? (typeof data.weight_per_unit_g === 'number'
                                    ? data.weight_per_unit_g
                                    : Number.parseFloat(data.weight_per_unit_g))
                                : null,
                            unit_price: data.unit_price != null
                                ? (typeof data.unit_price === 'number'
                                    ? data.unit_price
                                    : Number.parseFloat(data.unit_price))
                                : null,
                            unit: data.unit ?? null,
                        };
                        state.options.screening_items.push(newItem);
                        state.options.screening_items.sort((a, b) => {
                            const labelA = formatScreeningItemLabel(a);
                            const labelB = formatScreeningItemLabel(b);
                            return labelA.localeCompare(labelB, 'zh-TW', { numeric: true, sensitivity: 'base' });
                        });
                        // 重新渲染下拉選單
                        populateModalSelects();
                    }
                } else if (type === DataSync.EVENT_TYPES.DELETED && data && data.id) {
                    // 刪除的受篩產品，從快取移除
                    const index = state.options.screening_items.findIndex(
                        item => String(item.id) === String(data.id)
                    );
                    if (index !== -1) {
                        state.options.screening_items.splice(index, 1);
                        // 重新渲染下拉選單
                        populateModalSelects();
                    }
                }
            });

        }
    }

    window.initializeOrderItemsModule = initializeOrderItemsModule;
})();
