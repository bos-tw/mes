/**
 * Work Orders Module
 * 管理生產工單的 CRUD 操作
 */

(function() {
    'use strict';

    // 初始化函數,當模組被載入時呼叫
    function initializeWorkOrdersModule(container) {
        const moduleRoot = container.querySelector('[data-module="work_orders"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';

    // DOM Elements
    const elements = {
        alert: moduleRoot.querySelector('[data-work-orders-alert]'),
        table: moduleRoot.querySelector('[data-work-orders-table]'),
        tbody: moduleRoot.querySelector('[data-work-orders-table] tbody'),
        pagination: moduleRoot.querySelector('[data-work-orders-pagination]'),
        filterForm: moduleRoot.querySelector('[data-work-orders-filter]'),
        filterDrawer: moduleRoot.querySelector('[data-work-orders-filter-drawer]'),
        filterOverlay: moduleRoot.querySelector('[data-work-orders-filter-overlay]'),
        filterSummary: moduleRoot.querySelector('[data-work-orders-filter-summary]'),
        filterCountBadge: moduleRoot.querySelector('[data-work-orders-filter-count]'),
        // 建立工單 Modal (含頁籤)
        createModal: moduleRoot.querySelector('[data-work-orders-create-modal]'),
        createModalForm: moduleRoot.querySelector('[data-work-orders-create-form]'),
        // 編輯工單 Modal (不含頁籤)
        editModal: moduleRoot.querySelector('[data-work-orders-edit-modal]'),
        editModalForm: moduleRoot.querySelector('[data-work-orders-edit-form]'),
        createButton: moduleRoot.querySelector('.content-header [data-action="create"]'),
        printButton: moduleRoot.querySelector('.content-header [data-action="print"]'),
        batchPrintButton: moduleRoot.querySelector('.content-header [data-action="batch-print"]'),
        batchExportButton: moduleRoot.querySelector('.content-header [data-action="batch-export"], .content-header [data-action="export"]'),
        openFilterDrawerButton: moduleRoot.querySelector('[data-action="open-filter-drawer"]'),
        closeFilterDrawerButton: moduleRoot.querySelector('[data-action="close-filter-drawer"]'),
        selectionCountBadge: moduleRoot.querySelector('[data-selection-count]'),
        selectAllCheckbox: moduleRoot.querySelector('[data-work-orders-table] [data-action="select-all"]'),
        firstPieceSection: moduleRoot.querySelector('[data-first-piece-section]'),
        productionRecordsSection: moduleRoot.querySelector('[data-production-records-section]'),
        imagesRows: moduleRoot.querySelector('[data-images-rows]'),
        editImagesRows: moduleRoot.querySelector('[data-edit-images-rows]'),
        screeningServicesTable: moduleRoot.querySelector('[data-screening-services-table]'),
        screeningServicesBody: moduleRoot.querySelector('[data-screening-services-body]')
    };

    const createModalAlertBox = elements.createModal?.querySelector('[data-work-orders-create-modal-alert]');
    const editModalAlertBox = elements.editModal?.querySelector('[data-work-orders-edit-modal-alert]');

    // 工單快取與選取狀態
    const workOrdersCache = new Map();
    const selectedWorkOrders = new Set();

    // State
    const state = {
        currentPage: 1,
        perPage: 20,
        totalPages: 1,
        sortField: 'id',
        sortDirection: 'DESC',
        editingId: null,
        editingStatusLookupId: null,
        editingHasInventory: false,
        editingInventoryItemId: null,
        orderItemDetails: null,
        firstPieceDimensions: null,
        images: [],
        productionRecords: [],
        machines: [],
        currentUser: null
    };

    // Initialize
    init();

    function showModalAlert(type, message, autoHide = true, isEditMode = false) {
        const alertBox = isEditMode ? editModalAlertBox : createModalAlertBox;
        if (!alertBox) return;
        alertBox.textContent = message;
        alertBox.className = `modal-alert alert alert-${type}`;
        alertBox.removeAttribute('hidden');
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (autoHide && type === 'success') {
            setTimeout(() => hideModalAlert(isEditMode), 3000);
        }
    }

    function hideModalAlert(isEditMode = false) {
        const alertBox = isEditMode ? editModalAlertBox : createModalAlertBox;
        if (!alertBox) return;
        alertBox.setAttribute('hidden', '');
        alertBox.className = 'modal-alert hidden';
        alertBox.textContent = '';
    }

    function init() {
        loadCurrentUser();
        loadMachines();
        loadEmployees();
        loadStatuses();
        loadWorkOrders();
        attachEventListeners();
    }

    // 輔助函數: 星期顯示
    function getWeekdayText(datetimeStr) {
        if (!datetimeStr) return '';
        const d = new Date(datetimeStr);
        if (isNaN(d.getTime())) return '';
        return ['週日', '週一', '週二', '週三', '週四', '週五', '週六'][d.getDay()];
    }

    function updateWorkOrderWeekday(form, prefix, fieldName) {
        const input = form.querySelector(`[name="${fieldName}"]`);
        const badge = form.closest('.modal-overlay')?.querySelector(`[data-weekday-for="${prefix}_${fieldName}"]`);
        if (!badge) return;
        const text = input ? getWeekdayText(input.value) : '';
        badge.textContent = text;
        badge.style.display = text ? '' : 'none';
    }

    function updateAllScheduleWeekdays(form, prefix) {
        ['scheduled_start_date', 'scheduled_end_date', 'actual_start_date', 'actual_end_date'].forEach(name => {
            updateWorkOrderWeekday(form, prefix, name);
        });
    }

    // 輔助函數: 取得當前活動的 modal 和 form
    function getCurrentModal() {
        if (!elements.editModal.classList.contains('hidden')) {
            return { modal: elements.editModal, form: elements.editModalForm, isEditMode: true };
        }
        if (!elements.createModal.classList.contains('hidden')) {
            return { modal: elements.createModal, form: elements.createModalForm, isEditMode: false };
        }
        return { modal: null, form: null, isEditMode: false };
    }

    function attachEventListeners() {
        // Header buttons
        if (elements.createButton) {
            elements.createButton.addEventListener('click', () => openCreateModal());
        }

        if (elements.printButton) {
            elements.printButton.addEventListener('click', handlePrint);
        }

        // Filter form
        if (elements.filterForm) {
            elements.filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                state.currentPage = 1;
                closeFilterDrawer();
                loadWorkOrders();
            });

            const resetButton = elements.filterForm.querySelector('[data-action="reset-filter"]');
            if (resetButton) {
                resetButton.addEventListener('click', () => {
                    elements.filterForm.reset();
                    if ('perPage' in elements.filterForm.elements) {
                        elements.filterForm.elements.perPage.value = '20';
                    }
                    state.currentPage = 1;
                    closeFilterDrawer();
                    updateFilterSummary();
                    loadWorkOrders();
                });
            }
        }

        // 建立工單 Modal (含頁籤)
        if (elements.createModalForm) {
            elements.createModalForm.addEventListener('submit', handleFormSubmit);

            const cancelButton = elements.createModalForm.querySelector('[data-action="cancel"]');
            if (cancelButton) {
                cancelButton.addEventListener('click', closeCreateModal);
            }

            const closeButton = elements.createModal?.querySelector('.modal-close[data-action="close-create-modal"]');
            if (closeButton) {
                closeButton.addEventListener('click', closeCreateModal);
            }

            // Order item change event (Cascade Select)
            const orderItemSelect = elements.createModalForm.querySelector('[name="order_item_id"]');
            if (orderItemSelect) {
                orderItemSelect.addEventListener('change', handleOrderItemChange);
            }

            // Cascade Selects
            const customerSelect = elements.createModalForm.querySelector('[name="source_customer_id"]');
            if (customerSelect) {
                customerSelect.addEventListener('change', (e) => {
                    if (e.target.value) {
                        loadOrdersForSelect(e.target.value);
                    } else {
                        const orderSelect = elements.createModalForm.querySelector('[name="source_order_id"]');
                        const itemSelect = elements.createModalForm.querySelector('[name="order_item_id"]');
                        if (orderSelect) {
                            orderSelect.innerHTML = '<option value="">-- 請先選擇客戶 --</option>';
                            orderSelect.disabled = true;
                        }
                        if (itemSelect) {
                            itemSelect.innerHTML = '<option value="">-- 請先選擇訂單 --</option>';
                            itemSelect.disabled = true;
                        }
                    }
                });
            }

            const orderSelect = elements.createModalForm.querySelector('[name="source_order_id"]');
            if (orderSelect) {
                orderSelect.addEventListener('change', (e) => {
                    if (e.target.value) {
                        loadOrderItemsForSelect(e.target.value);
                    } else {
                        const itemSelect = elements.createModalForm.querySelector('[name="order_item_id"]');
                        if (itemSelect) {
                            itemSelect.innerHTML = '<option value="">-- 請先選擇訂單 --</option>';
                            itemSelect.disabled = true;
                        }
                    }
                });
            }

            // Tab Switching
            const tabBtns = elements.createModalForm.querySelectorAll('.tab-btn');
            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    tabBtns.forEach(b => b.classList.remove('active'));
                    elements.createModalForm.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    btn.classList.add('active');
                    const tabName = btn.dataset.tab;
                    const content = elements.createModalForm.querySelector(`.tab-content[data-tab-content="${tabName}"]`);
                    if (content) content.classList.add('active');
                });
            });

            // Search Actions
            const searchBtn = elements.createModalForm.querySelector('[data-action="search-items"]');
            if (searchBtn) {
                searchBtn.addEventListener('click', performSearch);
            }

            // Search Result Selection
            const searchResults = elements.createModalForm.querySelector('[data-search-results]');
            if (searchResults) {
                searchResults.addEventListener('click', async (e) => {
                    const selectBtn = e.target.closest('[data-action="select-search-item"]');
                    if (selectBtn) {
                        const id = selectBtn.dataset.id;
                        await fetchOrderItemDetails(id);

                        if (orderItemSelect) {
                            let option = orderItemSelect.querySelector(`option[value="${id}"]`);
                            if (!option) {
                                option = document.createElement('option');
                                option.value = id;
                                option.textContent = `(搜尋選取) #${id}`;
                                orderItemSelect.appendChild(option);
                            }
                            orderItemSelect.value = id;
                            orderItemSelect.disabled = false;
                        }

                        elements.createModalForm.querySelector('.form-section')?.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            }

            // First piece toggle
            const fpToggleButton = elements.createModal?.querySelector('[data-action="toggle-first-piece"]');
            if (fpToggleButton) {
                fpToggleButton.addEventListener('click', () => {
                    const section = elements.createModalForm.querySelector('[data-first-piece-section]');
                    if (section) {
                        section.classList.toggle('hidden');
                        const icon = fpToggleButton.querySelector('i');
                        if (icon) {
                            icon.classList.toggle('fa-chevron-down');
                            icon.classList.toggle('fa-chevron-up');
                        }
                    }
                });
            }

            // Metrics Panel 即時更新 - 監聽影響指標的輸入欄位
            const totalWeightInput = elements.createModalForm.querySelector('[name="total_weight_kg"]');
            if (totalWeightInput) {
                totalWeightInput.addEventListener('input', () => {
                    updateMetricsPanel(false); // false = create mode
                });
            }

            const totalUnitsInput = elements.createModalForm.querySelector('[name="total_units"]');
            if (totalUnitsInput) {
                totalUnitsInput.addEventListener('input', () => {
                    updateMetricsPanel(false);
                });
            }

            // 事件委派: 監聽動態生成的篩分服務缺陷數量輸入
            elements.createModalForm.addEventListener('input', (e) => {
                if (e.target.name && e.target.name.startsWith('defect_quantity_')) {
                    updateMetricsPanel(false);
                }
                // 監聽生產紀錄重量輸入變化
                if (e.target.name === 'pr_weight_kg[]') {
                    updateMetricsPanel(false);
                }
            });

            // 排程日期星期顯示
            ['scheduled_start_date', 'scheduled_end_date', 'actual_start_date', 'actual_end_date'].forEach(name => {
                const input = elements.createModalForm.querySelector(`[name="${name}"]`);
                if (input) {
                    input.addEventListener('change', () => updateWorkOrderWeekday(elements.createModalForm, 'create', name));
                }
            });
        }

        // 編輯工單 Modal (不含頁籤)
        if (elements.editModalForm) {
            elements.editModalForm.addEventListener('submit', handleFormSubmit);

            const cancelButton = elements.editModalForm.querySelector('[data-action="cancel"]');
            if (cancelButton) {
                cancelButton.addEventListener('click', closeEditModal);
            }

            const closeButton = elements.editModal?.querySelector('.modal-close[data-action="close-edit-modal"]');
            if (closeButton) {
                closeButton.addEventListener('click', closeEditModal);
            }

            // First piece toggle
            const fpToggleButton = elements.editModal?.querySelector('[data-action="toggle-first-piece"]');
            if (fpToggleButton) {
                fpToggleButton.addEventListener('click', () => {
                    const section = elements.editModalForm.querySelector('[data-edit-first-piece-section]');
                    if (section) {
                        section.classList.toggle('hidden');
                        const icon = fpToggleButton.querySelector('i');
                        if (icon) {
                            icon.classList.toggle('fa-chevron-down');
                            icon.classList.toggle('fa-chevron-up');
                        }
                    }
                });
            }

            // Images toggle
            const imagesToggleButton = elements.editModal?.querySelector('[data-action="toggle-images"]');
            if (imagesToggleButton) {
                imagesToggleButton.addEventListener('click', () => {
                    const section = elements.editModalForm.querySelector('[data-edit-images-section]');
                    if (section) {
                        section.classList.toggle('hidden');
                        const icon = imagesToggleButton.querySelector('i');
                        if (icon) {
                            icon.classList.toggle('fa-chevron-down');
                            icon.classList.toggle('fa-chevron-up');
                        }
                    }
                });
            }

            // Metrics Panel 即時更新 - 編輯模式
            const editTotalWeightInput = elements.editModalForm.querySelector('[name="total_weight_kg"]');
            if (editTotalWeightInput) {
                editTotalWeightInput.addEventListener('input', () => {
                    updateMetricsPanel(true); // true = edit mode
                });
            }

            const editTotalUnitsInput = elements.editModalForm.querySelector('[name="total_units"]');
            if (editTotalUnitsInput) {
                editTotalUnitsInput.addEventListener('input', () => {
                    updateMetricsPanel(true);
                });
            }

            // 事件委派: 監聽動態生成的篩分服務缺陷數量輸入 (編輯模式)
            elements.editModalForm.addEventListener('input', (e) => {
                if (e.target.name && e.target.name.startsWith('defect_quantity_')) {
                    updateMetricsPanel(true);
                }
                // 監聽生產紀錄重量輸入變化
                if (e.target.name === 'pr_weight_kg[]') {
                    updateMetricsPanel(true);
                }
            });

            // 排程日期星期顯示
            ['scheduled_start_date', 'scheduled_end_date', 'actual_start_date', 'actual_end_date'].forEach(name => {
                const input = elements.editModalForm.querySelector(`[name="${name}"]`);
                if (input) {
                    input.addEventListener('change', () => updateWorkOrderWeekday(elements.editModalForm, 'edit', name));
                }
            });
        }

        // 共用的開啟專用頁籤按鈕
        const openFirstPieceTabButtons = moduleRoot.querySelectorAll('[data-action="open-first-piece-tab"]');
        openFirstPieceTabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                openDedicatedModule(
                    'work_order_first_piece_dimensions',
                    '首件尺寸檢驗',
                    'modules/work_order_first_piece_dimensions.html'
                );
            });
        });

        const openImagesTabButtons = moduleRoot.querySelectorAll('[data-action="open-images-tab"]');
        openImagesTabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                openDedicatedModule(
                    'work_order_images',
                    '工單圖片',
                    'modules/work_order_images.html'
                );
            });
        });

        // Add Image buttons
        const addImageButtons = moduleRoot.querySelectorAll('[data-action="add-image"]');
        addImageButtons.forEach(btn => {
            btn.addEventListener('click', () => handleAddImage(false));
        });

        const addImageEditButtons = moduleRoot.querySelectorAll('[data-action="add-image-edit"]');
        addImageEditButtons.forEach(btn => {
            btn.addEventListener('click', () => handleAddImage(true));
        });

        // Image rows event delegation
        if (elements.imagesRows) {
            elements.imagesRows.addEventListener('click', handleImageAction);
        }
        if (elements.editImagesRows) {
            elements.editImagesRows.addEventListener('click', handleImageAction);
        }

        // Table row actions
        if (elements.tbody) {
            elements.tbody.addEventListener('click', handleTableAction);
        }

        // Pagination
        if (elements.pagination) {
            elements.pagination.addEventListener('click', handlePaginationClick);
        }

        // Table sorting
        if (elements.table) {
            const headers = elements.table.querySelectorAll('th[data-sort]');
            headers.forEach(header => {
                header.style.cursor = 'pointer';
                header.addEventListener('click', () => {
                    const sortField = header.getAttribute('data-sort');
                    if (state.sortField === sortField) {
                        state.sortDirection = state.sortDirection === 'ASC' ? 'DESC' : 'ASC';
                    } else {
                        state.sortField = sortField;
                        state.sortDirection = 'ASC';
                    }
                    loadWorkOrders();
                });
            });
        }

        // 批次列印按鈕
        if (elements.batchPrintButton) {
            elements.batchPrintButton.addEventListener('click', printBatchWorkOrders);
        }

        // 批次匯出按鈕
        if (elements.batchExportButton) {
            elements.batchExportButton.addEventListener('click', handleBatchExport);
        }

        // 全選 checkbox
        if (elements.selectAllCheckbox) {
            elements.selectAllCheckbox.addEventListener('change', (e) => {
                handleSelectAll(e.target.checked);
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeFilterDrawer();
            }
        });
    }

    function setFilterDrawerOpen(isOpen) {
        const controller = window.ModuleRenderer?.getFilterDrawerController?.('work_orders', moduleRoot);
        if (isOpen) controller?.open();
        else controller?.close();
    }

    function openFilterDrawer() {
        setFilterDrawerOpen(true);
    }

    function closeFilterDrawer() {
        setFilterDrawerOpen(false);
    }

    function collectFilterValues() {
        if (!elements.filterForm) {
            return {
                keyword: '',
                machineId: '',
                machineLabel: '',
                status: '',
                statusLabel: '',
                startDate: '',
                endDate: '',
                perPage: 20
            };
        }

        const formData = new FormData(elements.filterForm);
        const getTextValue = (name) => (formData.get(name) || '').toString().trim();
        const getOptionLabel = (name) => {
            const field = elements.filterForm.elements[name];
            if (!(field instanceof HTMLSelectElement)) {
                return '';
            }

            const selectedOption = field.options[field.selectedIndex];
            if (!selectedOption) {
                return '';
            }

            const value = (selectedOption.value || '').toString().trim();
            if (value === '') {
                return '';
            }

            return (selectedOption.textContent || '').replace(/^--\s*|\s*--$/g, '').trim();
        };

        const perPageValue = Number.parseInt(getTextValue('perPage') || '20', 10);

        return {
            keyword: getTextValue('keyword'),
            machineId: getTextValue('machine_id'),
            machineLabel: getOptionLabel('machine_id'),
            status: getTextValue('status'),
            statusLabel: getOptionLabel('status'),
            startDate: getTextValue('start_date'),
            endDate: getTextValue('end_date'),
            perPage: Number.isFinite(perPageValue) && perPageValue > 0 ? perPageValue : 20
        };
    }

    function updateFilterSummary() {
        window.ModuleRenderer?.getFilterDrawerController?.('work_orders', moduleRoot)?.updateSummary();
    }

    function buildWorkOrderQueryParams(page = state.currentPage) {
        const values = collectFilterValues();
        state.perPage = values.perPage;

        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('perPage', String(state.perPage));
        params.set('sortBy', state.sortField);
        params.set('sortOrder', state.sortDirection);

        if (values.keyword) params.set('keyword', values.keyword);
        if (values.machineId) params.set('machine_id', values.machineId);
        if (values.status) params.set('status', values.status);
        if (values.startDate) params.set('start_date', values.startDate);
        if (values.endDate) params.set('end_date', values.endDate);

        return params;
    }

    // API Functions
    async function loadWorkOrders(page = state.currentPage) {
        try {
            const params = buildWorkOrderQueryParams(page);

            const response = await fetch(`api/work_orders/index.php?${params}`);
            const result = await response.json();

            if (result.success) {
                state.currentPage = result.pagination.page;
                state.totalPages = result.pagination.totalPages;
                renderTable(result.data);
                renderPagination(result.pagination);
                updateFilterSummary();
            } else {
                showAlert(result.message || '載入工單失敗', 'error');
                updateFilterSummary();
            }
        } catch (error) {
            console.error('Load work orders error:', error);
            showAlert('載入工單時發生錯誤', 'error');
            updateFilterSummary();
        }
    }

    async function loadCurrentUser() {
        try {
            const response = await fetch('api/session.php');
            const result = await response.json();
            if (result.success) {
                state.currentUser = result.data;
            }
        } catch (error) {
            console.error('Load current user error:', error);
        }
    }

    async function loadMachines() {
        try {
            const response = await fetch('api/machines/index.php');
            const result = await response.json();
            if (result.success) {
                state.machines = result.data;
                populateSelect('[name="machine_id"]', result.data, 'id', 'name');
                populateSelect('[data-field="pr-machine"]', result.data, 'id', 'name');
                updateFilterSummary();
            }
        } catch (error) {
            console.error('Load machines error:', error);
        }
    }

    async function loadEmployees() {
        try {
            const response = await fetch('api/employees/index.php');
            const result = await response.json();
            if (result.success) {
                populateSelect('[name="assigned_employee_id"]', result.data, 'id', 'name');
                populateSelect('[name="calibration_employee_id"]', result.data, 'id', 'name');
                populateSelect('[name="fp_measured_by_employee_id"]', result.data, 'id', 'name');
            }
        } catch (error) {
            console.error('Load employees error:', error);
        }
    }

    async function loadStatuses() {
        try {
            const response = await fetch('api/lookup_values/index.php?domain_key=status_work_order');
            const result = await response.json();
            if (result.success) {
                populateSelect('[name="status_lookup_id"]', result.data, 'id', 'value_label');
                populateSelect('[name="status"]', result.data, 'value_key', 'value_label');
                updateFilterSummary();
            }
        } catch (error) {
            console.error('Load statuses error:', error);
        }
    }

    async function fetchOrderItemDetails(orderItemId) {
        try {
            const response = await fetch(`api/work_orders/helpers.php?action=get_order_item_details&order_item_id=${orderItemId}`);
            const result = await response.json();

            if (result.success) {
                state.orderItemDetails = result.data;
                populateOrderItemFields(result.data);
            } else {
                showAlert(result.message || '載入客戶批號詳細資料失敗', 'error');
            }
        } catch (error) {
            console.error('Fetch order item details error:', error);
            showAlert('載入客戶批號詳細資料時發生錯誤', 'error');
        }
    }

    async function saveWorkOrder(data, isEditMode = false) {
        try {
            const url = state.editingId
                ? `api/work_orders/update.php?id=${state.editingId}`
                : 'api/work_orders/index.php';

            const method = state.editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                showAlert(result.message, 'success');
                // 通知 DataSync 資料已變更
                if (typeof DataSync !== 'undefined') {
                    const eventType = state.editingId ? DataSync.EVENT_TYPES.UPDATED : DataSync.EVENT_TYPES.CREATED;
                    DataSync.notifyWithDependencies('work_orders', eventType, result.data);
                    if (result.data && result.data.inventory_created) {
                        DataSync.notifyWithDependencies('inventory_items', DataSync.EVENT_TYPES.CREATED, {
                            id: result.data.inventory_item_id,
                            work_order_id: result.data.id
                        });
                    }
                    if (result.data && result.data.inventory_deleted) {
                        DataSync.notifyWithDependencies('inventory_items', DataSync.EVENT_TYPES.DELETED, {
                            id: result.data.deleted_inventory_item_id,
                            work_order_id: result.data.id
                        });
                    }
                }
                if (isEditMode) {
                    closeEditModal();
                } else {
                    closeCreateModal();
                }
                loadWorkOrders();
            } else {
                let errorMessage = result.message || '儲存失敗';
                if (result.error) {
                    errorMessage += `: ${result.error}`;
                }
                showModalAlert('error', errorMessage, false, isEditMode);
                console.error('Server-side save error:', result);
            }
        } catch (error) {
            console.error('Save work order error:', error);
            showModalAlert('error', '儲存時發生無法預期的錯誤，請檢查網路連線或主控台。', false, isEditMode);
        }
    }

    function askWorkOrderChoiceDialog({ title, message, choices, primaryChoice }) {
        return new Promise((resolve) => {
            document.querySelector('[data-work-order-choice-modal]')?.remove();

            const overlay = document.createElement('div');
            overlay.setAttribute('data-work-order-choice-modal', 'true');
            overlay.className = 'modal-overlay';
            overlay.style.zIndex = '3000';
            const modalSizeClass = choices.length > 3 ? 'medium' : 'small';
            const buttonsHtml = choices.map((choice) => {
                const btnClass = choice.className || (choice.value === primaryChoice ? 'btn primary' : 'btn outline');
                return `<button type="button" class="${btnClass}" data-choice="${choice.value}">${choice.label}</button>`;
            }).join('');
            overlay.innerHTML = `
                <div class="modal-window ${modalSizeClass}" role="dialog" aria-modal="true" aria-labelledby="work-order-choice-title" style="max-height: none;">
                    <h3 id="work-order-choice-title">${title}</h3>
                    <div style="margin-bottom: 1.25rem; color: var(--color-text); line-height: 1.6;">
                        ${message}
                    </div>
                    <div class="form-actions align-right" style="display: flex; justify-content: flex-end; gap: 0.5rem; flex-wrap: nowrap;">
                        ${buttonsHtml}
                    </div>
                </div>
            `;

            const cleanup = (choice) => {
                document.removeEventListener('keydown', handleKeydown);
                overlay.remove();
                resolve(choice);
            };

            const handleKeydown = (event) => {
                if (event.key === 'Escape') {
                    cleanup('cancel');
                }
            };

            overlay.addEventListener('click', (event) => {
                const button = event.target.closest('[data-choice]');
                if (!button) {
                    return;
                }
                cleanup(button.dataset.choice);
            });

            document.addEventListener('keydown', handleKeydown);
            document.body.appendChild(overlay);
            overlay.querySelector(`[data-choice="${primaryChoice}"]`)?.focus();
        });
    }

    function askCompletionInventoryChoice() {
        return askWorkOrderChoiceDialog({
            title: '工單已完成',
            message: '<p>此工單狀態將改為已完成，請選擇是否同步建立庫存項目。</p>',
            primaryChoice: 'convert',
            choices: [
                { value: 'cancel', label: '取消', className: 'btn outline' },
                { value: 'skip', label: '不轉成庫存', className: 'btn outline' },
                { value: 'convert', label: '轉成庫存', className: 'btn primary' }
            ]
        });
    }

    function askReopenCompletedWorkOrderChoice() {
        const choices = [
            { value: 'cancel', label: '取消', className: 'btn outline' },
            { value: 'goto_inventory', label: '前往庫存項目', className: 'btn outline' }
        ];

        if (state.editingInventoryItemId) {
            choices.push({
                value: 'delete_inventory',
                label: '刪除庫存並變更狀態',
                className: 'btn outline'
            });
        }

        choices.push({ value: 'keep', label: '保留庫存並變更狀態', className: 'btn primary' });

        return askWorkOrderChoiceDialog({
            title: '工單已建立庫存',
            message: '<p>此工單已建立庫存項目。若將狀態改回非已完成，可保留庫存、前往庫存項目確認，或在庫存尚未被配貨/出貨時直接刪除庫存。</p>',
            primaryChoice: 'keep',
            choices
        });
    }

    async function deleteWorkOrder(id) {
        if (!confirm('確定要刪除此工單嗎?')) return;

        try {
            const response = await fetch(`api/work_orders/delete.php?id=${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                showAlert(result.message, 'success');
                // 通知 DataSync 資料已刪除
                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('work_orders', DataSync.EVENT_TYPES.DELETED, { id });
                }
                loadWorkOrders();
            } else {
                showAlert(result.message || '刪除失敗', 'error');
            }
        } catch (error) {
            console.error('Delete work order error:', error);
            showAlert('刪除時發生錯誤', 'error');
        }
    }

    function handleConvertToInventory(workOrderId) {
        if (!confirm('確定要將此工單轉為庫存項目嗎?\n\n系統將自動帶入工單相關資訊,請在確認後儲存。')) {
            return;
        }

        // 使用 window.openTab 切換到庫存管理模組
        if (typeof window.openTab === 'function') {
            // 切換到庫存管理模組，並傳遞 context
            window.openTab('inventory_items', '庫存項目', 'modules/inventory_items.html', {
                context: {
                    workOrderId: workOrderId
                }
            });
        } else {
            showAlert('無法切換模組,請檢查系統設定', 'error');
        }
    }

    function openLinkedInventoryItem() {
        if (typeof window.openTab !== 'function') {
            showModalAlert('error', '無法切換到庫存項目模組，請檢查系統設定。', false, true);
            return;
        }

        const context = state.editingInventoryItemId
            ? { inventoryItemId: state.editingInventoryItemId }
            : { workOrderId: state.editingId };

        window.openTab('inventory_items', '庫存項目', 'modules/inventory_items.html', {
            context
        });
    }

    // Event Handlers
    async function handleOrderItemChange(e) {
        const orderItemId = e.target.value;
        if (orderItemId) {
            await fetchOrderItemDetails(orderItemId);
        } else {
            clearOrderItemFields();
        }
    }

    function handleTableAction(e) {
        const selectCheckbox = e.target.closest('[data-action="select-row"]');
        const printButton = e.target.closest('[data-action="print-work-order"]');
        const printScreeningReportButton = e.target.closest('[data-action="print-screening-report"]');
        const editButton = e.target.closest('[data-action="edit-work-order"]');
        const deleteButton = e.target.closest('[data-action="delete-work-order"]');
        const convertButton = e.target.closest('[data-action="convert-to-inventory"]');

        if (selectCheckbox) {
            const row = selectCheckbox.closest('tr');
            handleRowSelect(selectCheckbox, row);
        } else if (printButton) {
            const row = printButton.closest('tr');
            const id = row.dataset.id;
            printSingleWorkOrder(id);
        } else if (printScreeningReportButton) {
            const row = printScreeningReportButton.closest('tr');
            const id = row.dataset.id;
            printScreeningInspectionReport(id);
        } else if (editButton) {
            const row = editButton.closest('tr');
            const id = row.dataset.id;
            openModal(id);
        } else if (deleteButton) {
            const row = deleteButton.closest('tr');
            const id = row.dataset.id;
            deleteWorkOrder(id);
        } else if (convertButton) {
            if (convertButton.disabled || convertButton.hasAttribute('disabled')) {
                return; // 已轉為庫存，不可重複操作
            }
            const row = convertButton.closest('tr');
            const id = row.dataset.id;
            handleConvertToInventory(id);
        }
    }

    function handlePaginationClick(e) {
        const pageButton = e.target.closest('[data-page]');
        if (pageButton) {
            const page = parseInt(pageButton.dataset.page);
            if (page >= 1 && page <= state.totalPages) {
                loadWorkOrders(page);
            }
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();

        // 判斷當前是哪個 modal
        const { form, isEditMode } = getCurrentModal();
        if (!form) return;

        const formData = new FormData(form);
        const data = {};

        // 定義不應該提交到後端的顯示欄位（這些欄位僅供查看，實際資料從 OrderItems 關聯查詢）
        // 這些欄位設為 readonly 是為了防止使用者修改，確保與訂單資料一致
        const displayOnlyFields = [
            'customer_name', 'customer_po_number', 'customer_batch_number', 'sub_item_number', 'drawing_number',
            'screening_item_name', 'total_weight_kg', 'weight_per_unit_g', 'total_units',
            'tool_statistics', 'expected_delivery_date', 'customer_sample_status',
            'part_number', 'delivery_location' // 新增的訂單資訊欄位也設為 display-only
        ];

        // 收集篩分服務缺陷數量
        const screeningDefects = [];

        for (const [key, value] of formData.entries()) {
            // 特殊處理: 收集 defect_quantity_* 欄位
            if (key.startsWith('defect_quantity_')) {
                const serviceId = key.replace('defect_quantity_', '');
                const defectQuantity = parseInt(value) || 0;
                if (defectQuantity > 0) {
                    screeningDefects.push({
                        screening_service_id: serviceId,
                        defect_quantity: defectQuantity
                    });
                }
            }
            // 只提交工單專屬欄位，不提交訂單資訊顯示欄位
            else if (!displayOnlyFields.includes(key)) {
                data[key] = value;
            }
        }

        // 將篩分服務缺陷數量加入 payload
        if (screeningDefects.length > 0) {
            data.screening_defects = screeningDefects;
        }

        // 收集生產紀錄 (Production Records)
        const productionRecords = [];
        const prRows = form.querySelectorAll('.production-record-row');
        prRows.forEach(row => {
            const cardInput = row.querySelector('[name="pr_card_number[]"]');
            const weightInput = row.querySelector('[name="pr_weight_kg[]"]');
            const dateInput = row.querySelector('[name="pr_date[]"]');
            const timeInput = row.querySelector('[name="pr_time[]"]');
            const machineSelect = row.querySelector('[name="pr_machine_id[]"]');
            const operatorInput = row.querySelector('[name="pr_operator_name[]"]');
            const notesInput = row.querySelector('[name="pr_notes[]"]');

            if (cardInput) {
                productionRecords.push({
                    card_number: cardInput.value,
                    weight_kg: weightInput ? weightInput.value : null,
                    production_date: dateInput ? dateInput.value : null,
                    production_time: timeInput ? timeInput.value : null,
                    machine_id: machineSelect ? machineSelect.value : null,
                    operator_name: operatorInput ? operatorInput.value : (state.currentUser?.name || ''),
                    notes: notesInput ? notesInput.value : null
                });
            }
        });

        if (productionRecords.length > 0) {
            data.production_records = productionRecords;
        }

        // Add first piece dimensions if filled
        // 將 fp 欄位直接嵌入 data.first_piece_dimensions，讓 API 統一處理新增/更新
        const fpData = {};
        const fpFields = [
            'fp_head_height', 'fp_head_width', 'fp_length', 'fp_thread_outer_diameter',
            'fp_washer_diameter', 'fp_outer_diameter', 'fp_hole_diameter', 'fp_thickness',
            'fp_measured_at', 'fp_measured_by_employee_id', 'fp_notes'
        ];

        fpFields.forEach(field => {
            const value = formData.get(field);
            if (value) {
                fpData[field.replace('fp_', '')] = value;
            }
        });

        if (Object.keys(fpData).length > 0) {
            data.first_piece_dimensions = fpData;
        }

        if (isEditMode) {
            const newStatusId = data.status_lookup_id ? parseInt(data.status_lookup_id, 10) : null;
            const oldStatusId = state.editingStatusLookupId ? parseInt(state.editingStatusLookupId, 10) : null;
            if (newStatusId === 28 && oldStatusId !== 28) {
                const inventoryChoice = await askCompletionInventoryChoice();
                if (inventoryChoice === 'cancel') {
                    return;
                }
                data.auto_create_inventory = inventoryChoice === 'convert';
            } else if (oldStatusId === 28 && newStatusId !== 28 && state.editingHasInventory) {
                const inventoryChoice = await askReopenCompletedWorkOrderChoice();
                if (inventoryChoice === 'cancel') {
                    return;
                }
                if (inventoryChoice === 'goto_inventory') {
                    openLinkedInventoryItem();
                    return;
                }
                if (inventoryChoice === 'delete_inventory') {
                    data.delete_inventory_on_reopen = true;
                }
            }
        }

        await saveWorkOrder(data, isEditMode);
        // first_piece_dimensions 已嵌入 data 物件，由 API 統一新增或更新，無需額外呼叫
    }

    async function saveFirstPieceDimensions(workOrderId, data) {
        try {
            data.work_order_id = workOrderId;

            const response = await fetch('api/work_order_first_piece_dimensions/index.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!result.success) {
                console.error('Save first piece dimensions failed:', result.message);
            }
        } catch (error) {
            console.error('Save first piece dimensions error:', error);
        }
    }

    async function handleAddImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;

        input.addEventListener('change', async (e) => {
            const files = e.target.files;
            if (!files.length) return;

            for (const file of files) {
                await uploadImage(file);
            }
        });

        input.click();
    }

    async function uploadImage(file) {
        if (!state.editingId) {
            showAlert('請先儲存工單後再上傳圖片', 'warning');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('work_order_id', state.editingId);
            formData.append('image', file);

            const response = await fetch('api/work_order_images/index.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                state.images.push(result.data);
                renderImages();
                showAlert('圖片上傳成功', 'success');
            } else {
                showAlert(result.message || '圖片上傳失敗', 'error');
            }
        } catch (error) {
            console.error('Upload image error:', error);
            showAlert('圖片上傳時發生錯誤', 'error');
        }
    }

    function openDedicatedModule(tabId, title, url) {
        if (!state.editingId) {
            showAlert('請先儲存工單後再使用此功能。', 'warning');
            return;
        }
        if (typeof window.openTab !== 'function') {
            showAlert('目前無法開啟新頁籤，請重新載入頁面再試。', 'error');
            return;
        }
        window.openTab(tabId, title, url, {
            context: {
                workOrderId: state.editingId
            }
        });
    }

    /**
     * 處理單一工單列印功能
     * @param {string|number} workOrderId - 工單ID
     * @param {HTMLElement} button - 點擊的按鈕元素
     */
    async function handlePrintWorkOrder(workOrderId, button) {
        try {
            // 開啟列印頁面
            const printUrl = `print_work_order.html?type=work_order&id=${workOrderId}`;
            const printWindow = window.open(printUrl, '_blank');

            // 標記為已列印
            const response = await fetch('api/work_orders/print.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: workOrderId })
            });

            const result = await response.json();

            if (result.success) {
                // 更新按鈕樣式為已列印狀態
                button.classList.remove('btn-print-new');
                button.classList.add('btn-print-done');
                button.title = '再次列印（已列印過）';

                // 發送 DataSync 通知
                DataSync.notifyWithDependencies('work_orders', DataSync.EVENT_TYPES.UPDATED, { id: workOrderId });
            }
        } catch (error) {
            console.error('列印工單失敗:', error);
            showAlert('列印工單時發生錯誤', 'error');
        }
    }

    // ========== 勾選與批次列印功能 ==========

    /**
     * 更新選取狀態 UI
     */
    function updateSelectionUI() {
        const count = selectedWorkOrders.size;

        // 更新批次列印按鈕狀態
        if (elements.batchPrintButton) {
            elements.batchPrintButton.disabled = count === 0;
        }

        // 更新選取數量 badge
        if (elements.selectionCountBadge) {
            elements.selectionCountBadge.textContent = count;
            if (count > 0) {
                elements.selectionCountBadge.classList.remove('hidden');
            } else {
                elements.selectionCountBadge.classList.add('hidden');
            }
        }

        // 更新全選 checkbox 狀態
        if (elements.selectAllCheckbox && elements.tbody) {
            const checkboxes = elements.tbody.querySelectorAll('input[data-action="select-row"]');
            const checkedCount = elements.tbody.querySelectorAll('input[data-action="select-row"]:checked').length;
            elements.selectAllCheckbox.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
            elements.selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
        }
    }

    /**
     * 處理單行選取
     */
    function handleRowSelect(checkbox, row) {
        const id = parseInt(row.dataset.id, 10);
        if (checkbox.checked) {
            selectedWorkOrders.add(id);
        } else {
            selectedWorkOrders.delete(id);
        }
        updateSelectionUI();
    }

    /**
     * 處理全選/取消全選
     */
    function handleSelectAll(checked) {
        if (!elements.tbody) return;

        const checkboxes = elements.tbody.querySelectorAll('input[data-action="select-row"]');
        checkboxes.forEach(cb => {
            cb.checked = checked;
            const row = cb.closest('tr');
            if (row) {
                const id = parseInt(row.dataset.id, 10);
                if (checked) {
                    selectedWorkOrders.add(id);
                } else {
                    selectedWorkOrders.delete(id);
                }
            }
        });
        updateSelectionUI();
    }

    /**
     * 列印單筆工單
     */
    async function printSingleWorkOrder(workOrderId) {
        try {
            // 從快取取得工單資訊
            const workOrder = workOrdersCache.get(parseInt(workOrderId));

            // 開啟列印頁面
            const printUrl = `print/work_order_print.html?id=${workOrderId}`;
            window.open(printUrl, '_blank');

            // 標記為已列印
            const response = await fetch('api/work_orders/print.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: workOrderId })
            });

            const result = await response.json();

            if (result.success) {
                // 發送 DataSync 通知
                DataSync.notifyWithDependencies('work_orders', DataSync.EVENT_TYPES.UPDATED, { id: workOrderId });
            }
        } catch (error) {
            console.error('列印工單失敗:', error);
            showAlert('列印工單時發生錯誤', 'error');
        }
    }

    /**
     * 批次列印工單
     */
    async function printBatchWorkOrders() {
        if (selectedWorkOrders.size === 0) {
            showAlert('請先勾選要列印的工單', 'warning');
            return;
        }

        const confirmed = window.confirm(`確定要列印 ${selectedWorkOrders.size} 筆工單？`);
        if (!confirmed) return;

        try {
            // 將選取的 ID 組合成參數
            const ids = Array.from(selectedWorkOrders).join(',');
            const printUrl = `print/work_order_print.html?ids=${ids}`;
            window.open(printUrl, '_blank');

            // 逐筆標記為已列印
            for (const workOrderId of selectedWorkOrders) {
                try {
                    await fetch('api/work_orders/print.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: workOrderId })
                    });
                } catch (err) {
                    console.error(`標記工單 ${workOrderId} 已列印失敗:`, err);
                }
            }

            // 發送 DataSync 通知
            DataSync.notifyWithDependencies('work_orders', DataSync.EVENT_TYPES.BULK_UPDATED, {});

            // 清除選取狀態並重新載入
            selectedWorkOrders.clear();
            updateSelectionUI();
            loadWorkOrders();

        } catch (error) {
            console.error('批次列印失敗:', error);
            showAlert('批次列印時發生錯誤', 'error');
        }
    }

    async function handleBatchExport() {
        try {
            const selectedIds = Array.from(selectedWorkOrders);
            const params = buildWorkOrderQueryParams(1);
            params.set('perPage', selectedIds.length > 0 ? String(Math.max(selectedIds.length, 100)) : '5000');

            const response = await fetch(`api/work_orders/index.php?${params.toString()}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || '匯出失敗');
            }

            let rows = Array.isArray(result.data) ? result.data : [];
            if (selectedIds.length > 0) {
                const selectedIdSet = new Set(selectedIds.map(id => Number.parseInt(id, 10)));
                rows = rows.filter(row => selectedIdSet.has(Number.parseInt(row.id, 10)));
            }

            if (rows.length === 0) {
                showAlert('沒有可匯出的工單資料', 'warning');
                return;
            }

            const csvRows = [
                ['工單號碼', '訂單號碼', '客戶名稱', '受篩產品', '機台', '開始日期', '結束日期', '狀態'],
                ...rows.map((row) => [
                    row.work_order_number || '',
                    row.order_number || '',
                    row.customer_name || '',
                    row.screening_item_name || '',
                    row.machine_name || '',
                    row.actual_start_date || '',
                    row.actual_end_date || '',
                    row.status_label || ''
                ])
            ];

            const csvContent = '\uFEFF' + csvRows.map(line => line.map(csvEscape).join(',')).join('\r\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `work_orders_${formatDateForFileName()}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showAlert(`已匯出 ${rows.length} 筆工單資料`, 'success');
        } catch (error) {
            console.error('批次匯出失敗:', error);
            showAlert(error.message || '批次匯出失敗', 'error');
        }
    }

    /**
     * 列印篩分檢驗結果報表
     * @param {number|string} workOrderId - 工單 ID
     */
    function printScreeningInspectionReport(workOrderId) {
        if (!workOrderId) {
            showAlert('缺少工單 ID', 'error');
            return;
        }

        // 開啟篩分檢驗報表列印頁面
        const printUrl = `print/screening_inspection_print.html?work_order_id=${workOrderId}`;
        window.open(printUrl, '_blank');
    }

    // Render Functions
    function renderTable(data) {
        if (!elements.tbody) return;

        // 清除快取
        workOrdersCache.clear();

        if (!data || data.length === 0) {
            elements.tbody.innerHTML = '<tr><td colspan="10" class="text-center">無資料</td></tr>';
            updateSelectionUI();
            return;
        }

        const html = data.map(item => {
            // 儲存到快取
            workOrdersCache.set(item.id, item);

            // 根據狀態鍵值設定 CSS 類別
            const statusClass = item.status_key ? item.status_key.toLowerCase().replace(/_/g, '-') : 'scheduled';

            // 只有完成狀態才顯示轉為庫存項目按鈕
            const showConvertButton = item.status_key === 'completed';
            const hasInventory = item.has_inventory == 1 || item.has_inventory === true;

            // 客戶名稱處理（停用顯示）
            const customerIsActive = item.customer_is_active !== 0 && item.customer_is_active !== '0' && item.customer_is_active !== false;
            const customerDisplay = item.customer_name
                ? (customerIsActive ? escapeHtml(item.customer_name) : `${escapeHtml(item.customer_name)} <span class="text-muted">(已停用)</span>`)
                : '';

            // checkbox 狀態
            const isChecked = selectedWorkOrders.has(item.id) ? 'checked' : '';

            return `
            <tr data-id="${item.id}">
                <td class="checkbox-col"><input type="checkbox" data-action="select-row" ${isChecked}></td>
                <td>${escapeHtml(item.work_order_number)}</td>
                <td>${escapeHtml(item.order_number || '')}</td>
                <td>${customerDisplay}</td>
                <td>${escapeHtml(item.screening_item_name || '')}</td>
                <td>${escapeHtml(item.machine_name || '')}</td>
                <td>${formatDateTime(item.actual_start_date)}${item.actual_start_date ? ` <span class="weekday-text">${getWeekdayText(item.actual_start_date)}</span>` : ''}</td>
                <td>${formatDateTime(item.actual_end_date)}${item.actual_end_date ? ` <span class="weekday-text">${getWeekdayText(item.actual_end_date)}</span>` : ''}</td>
                <td><span class="status-badge ${statusClass}">${escapeHtml(item.status_label || '')}</span></td>
                <td class="table-actions">
                    <button type="button" class="btn text" data-action="print-work-order" title="${item.is_printed ? '再次列印（已列印過）' : '列印工單'}">
                        <i class="fas fa-print"></i>
                    </button>
                    <button type="button" class="btn text" data-action="print-screening-report" title="列印篩分檢驗報表">
                        <i class="fas fa-file-medical-alt"></i>
                    </button>
                    <button type="button" class="btn text" data-action="edit-work-order" title="編輯">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${showConvertButton ? `
                    <button type="button" class="btn text" data-action="convert-to-inventory" title="${hasInventory ? '已轉為庫存項目' : '轉為庫存項目'}"${hasInventory ? ' disabled' : ''}>
                        <i class="fas fa-cogs"></i>
                    </button>
                    ` : ''}
                    <button type="button" class="btn text danger" data-action="delete-work-order" title="刪除">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
        }).join('');

        elements.tbody.innerHTML = html;

        // 更新選取狀態 UI
        updateSelectionUI();

        // 更新表格後重新套用欄位可見性
        const manager = window.workOrderColumnManager;
        if (manager && manager.onTableUpdated) {
            manager.onTableUpdated();
        }
    }

    function renderPagination(pagination) {
        if (!elements.pagination) return;

        const { page, totalPages } = pagination;
        let html = '';

        if (page > 1) {
            html += `<button type="button" data-page="${page - 1}">上一頁</button>`;
        }

        for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
            html += `<button type="button" data-page="${i}" ${i === page ? 'class="active"' : ''}>${i}</button>`;
        }

        if (page < totalPages) {
            html += `<button type="button" data-page="${page + 1}">下一頁</button>`;
        }

        elements.pagination.innerHTML = html;
    }

    function renderImages() {
        if (!elements.imagesGallery) return;

        if (!state.images || state.images.length === 0) {
            elements.imagesGallery.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-images"></i>
                    <p>尚未上傳圖片</p>
                </div>
            `;
            return;
        }

        const html = state.images.map(img => `
            <div class="image-item">
                <img src="${escapeHtml(img.file_path)}" alt="${escapeHtml(img.file_name)}">
                <button type="button" class="btn-delete" data-action="delete-image" data-id="${img.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        elements.imagesGallery.innerHTML = html;
    }

    // Modal Functions
    // 開啟建立工單 Modal (含頁籤選擇)
    function openCreateModal() {
        state.editingId = null;

        // Reset UI
        elements.createModalForm.reset();
        hideModalAlert(false);

        // Reset Tabs
        const tabBtns = elements.createModalForm.querySelectorAll('.tab-btn');
        const tabContents = elements.createModalForm.querySelectorAll('.tab-content');
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        if (tabBtns[0]) tabBtns[0].classList.add('active');
        if (tabContents[0]) tabContents[0].classList.add('active');

        // Reset Search Results
        const searchResults = elements.createModalForm.querySelector('[data-search-results]');
        if (searchResults) searchResults.classList.add('hidden');
        const tbody = searchResults?.querySelector('tbody');
        if (tbody) tbody.innerHTML = '';

        // Reset Cascade Selects
        const customerSelect = elements.createModalForm.querySelector('[name="source_customer_id"]');
        const orderSelect = elements.createModalForm.querySelector('[name="source_order_id"]');
        const itemSelect = elements.createModalForm.querySelector('[name="order_item_id"]');

        if (customerSelect) {
            customerSelect.innerHTML = '<option value="">-- 請選擇客戶 --</option>';
            loadCustomersForSelect();
        }
        if (orderSelect) {
            orderSelect.innerHTML = '<option value="">-- 請先選擇客戶 --</option>';
            orderSelect.disabled = true;
        }
        if (itemSelect) {
            itemSelect.innerHTML = '<option value="">-- 請先選擇訂單 --</option>';
            itemSelect.disabled = true;
        }

        clearOrderItemFields(false);
        state.images = [];
        renderImages(false);

        elements.createModal.classList.remove('hidden');
    }

    // 開啟編輯工單 Modal (不含頁籤,直接編輯)
    async function openEditModal(id) {
        state.editingId = id;

        // Reset UI
        elements.editModalForm.reset();
        hideModalAlert(true);

        await loadWorkOrderData(id);

        elements.editModal.classList.remove('hidden');
    }

    function closeCreateModal() {
        elements.createModal.classList.add('hidden');
        hideModalAlert(false);
        elements.createModalForm.reset();
        state.editingId = null;
        state.editingStatusLookupId = null;
        state.editingHasInventory = false;
        state.editingInventoryItemId = null;
        state.orderItemDetails = null;
        state.images = [];
    }

    function closeEditModal() {
        elements.editModal.classList.add('hidden');
        hideModalAlert(true);
        elements.editModalForm.reset();
        state.editingId = null;
        state.editingStatusLookupId = null;
        state.editingHasInventory = false;
        state.editingInventoryItemId = null;
        state.orderItemDetails = null;
        state.images = [];
    }

    async function openModal(id = null) {
        if (id) {
            await openEditModal(id);
        } else {
            openCreateModal();
        }
    }

    async function loadWorkOrderData(id) {
        try {
            const response = await fetch(`api/work_orders/show.php?id=${id}`);
            const result = await response.json();

            if (result.success) {
                state.editingStatusLookupId = result.data.status_lookup_id ?? null;
                state.editingHasInventory = result.data.has_inventory == 1 || result.data.has_inventory === true;
                state.editingInventoryItemId = result.data.inventory_item_id ? parseInt(result.data.inventory_item_id, 10) : null;
                populateForm(result.data, true);
                state.images = result.data.images || [];
                renderImages(true);

                // Load work order images
                await loadWorkOrderImages(id, true);

                // 載入篩分服務明細(合併缺陷數量資料)
                if (result.data.screening_services_details) {
                    const services = result.data.screening_services_details;
                    const defects = result.data.screening_defects || [];

                    // 建立缺陷數量查詢表
                    const defectsMap = {};
                    defects.forEach(defect => {
                        defectsMap[defect.screening_service_id] = defect.defect_quantity;
                    });

                    // 合併缺陷數量到服務列表
                    services.forEach(service => {
                        service.defect_quantity = defectsMap[service.id] || 0;
                    });

                    renderScreeningServicesTable(services, true);
                }

                // 載入生產記錄 (需檢查是否與訂單資料一致)
                const totalUnits = parseFloat(result.data.total_units) || 0;
                const toolQty = parseInt(result.data.tool_quantity) || 0;
                const existingRecords = result.data.production_records || [];

                // 如果載具數量與現有紀錄數不符，需要重新計算卡號
                if (toolQty > 0 && existingRecords.length !== toolQty) {
                    // 重新生成紀錄，但保留已填寫的資料
                    regenerateProductionRecordsWithData(totalUnits, toolQty, existingRecords, true);
                } else if (existingRecords.length > 0) {
                    // 數量一致但卡號可能需要更新
                    updateProductionRecordsCardNumbers(totalUnits, toolQty, existingRecords, true);
                } else if (toolQty > 0) {
                    // 沒有現有紀錄，自動生成
                    generateProductionRecords(totalUnits, toolQty, true);
                }

                // 更新 Metrics Panel (編輯模式)
                updateMetricsPanel(true);
            } else {
                showAlert(result.message || '載入工單資料失敗', 'error');
            }
        } catch (error) {
            console.error('Load work order data error:', error);
            showAlert('載入工單資料時發生錯誤', 'error');
        }
    }

    function populateForm(data, isEditMode = false) {
        const form = isEditMode ? elements.editModalForm : elements.createModalForm;

        if (!form) {
            console.error('Form element not found in populateForm');
            return;
        }

        for (const [key, value] of Object.entries(data)) {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = !!value;
                } else if (input.tagName === 'SELECT') {
                    input.value = value || '';
                } else if (input.type === 'datetime-local' && value) {
                    input.value = value.substring(0, 16);
                } else {
                    input.value = value || '';
                }
            }
        }

        // 更新排程日期星期顯示
        const prefix = isEditMode ? 'edit' : 'create';
        updateAllScheduleWeekdays(form, prefix);

        // Populate first piece dimensions
        if (data.first_piece_dimensions) {
            const fpd = data.first_piece_dimensions;
            for (const [key, value] of Object.entries(fpd)) {
                const input = form.querySelector(`[name="fp_${key}"]`);
                if (input && value !== null) {
                    input.value = value;
                }
            }
        }

        // Populate order item details
        if (data.order_item_id) {
            populateOrderItemFields(data, isEditMode);
        }
    }

    function populateOrderItemFields(data, isEditMode = false) {
        // 判斷當前是哪個模態框
        const form = isEditMode ? elements.editModalForm : elements.createModalForm;

        if (!form) {
            return;
        }

        // 使用 name 屬性來設定欄位，因為這些欄位會被提交到後端
        const fieldMappings = {
            'customer_name': data.customer_name,
            'customer_po_number': data.customer_po_number,
            'customer_batch_number': data.customer_batch_number,
            'sub_item_number': data.sub_item_number,
            'part_number': data.part_number,
            'drawing_number': data.drawing_number,
            'screening_item_name': data.screening_item_name,
            'customer_sample_status': data.customer_sample_status_label || data.customer_sample_status || '',
            'delivery_location': data.delivery_location,
            'order_total_weight': data.total_weight_kg,
            'order_net_weight': (((parseFloat(data.total_weight_kg) || 0) - (parseFloat(data.total_tool_weight) || 0)).toFixed(2)),
            'order_total_units': data.total_units,
            'total_weight_kg': (((parseFloat(data.total_weight_kg) || 0) - (parseFloat(data.total_tool_weight) || 0)).toFixed(2)),
            'weight_per_unit_g': data.weight_per_unit_g,
            'total_units': data.total_units,
            'tool_statistics': data.tool_statistics || '',
            'expected_delivery_date': data.expected_delivery_date
        };

        // 同時使用 name 和 data-field 屬性來查找並設定欄位
        for (const [fieldName, value] of Object.entries(fieldMappings)) {
            // 先嘗試用 name 屬性查找
            let input = form?.querySelector(`[name="${fieldName}"]`);

            if (input) {
                const displayValue = value !== null && value !== undefined ? value : '';
                input.value = displayValue;
            }
        }

        // 設定訂單資訊欄位為唯讀
        setOrderInfoFieldsReadonly(isEditMode);

        // 儲存訂單資訊用於 Metrics Panel
        state.orderItemDetails = {
            ...data,
            tool_quantity: data.tool_quantity || 0,
            total_tool_weight: data.total_tool_weight || 0,
            weight_per_unit_g: data.weight_per_unit_g || 0
        };

        // 填充篩分服務明細表格
        renderScreeningServicesTable(data.screening_services_details || [], isEditMode);

        // 自動生成並填充生產紀錄表格 (僅在新增模式或無紀錄時)
        // 根據需求: 總支數/載具數量 = 卡號
        if (!isEditMode && data.total_units && data.tool_quantity) {
            generateProductionRecords(data.total_units, data.tool_quantity, isEditMode);
        } else if (isEditMode && data.production_records && data.production_records.length > 0) {
            // 如果是編輯模式且有紀錄，則顯示現有紀錄
            renderProductionRecords(data.production_records, isEditMode);
        } else if (isEditMode && data.total_units && data.tool_quantity) {
            // 如果是編輯模式但沒有紀錄,自動生成
            generateProductionRecords(data.total_units, data.tool_quantity, isEditMode);
        }

        // 更新 Metrics Panel
        updateMetricsPanel(isEditMode);
    }

    /**
     * 自動生成生產紀錄
     * @param {number} totalUnits 總支數
     * @param {number} containerQty 載具數量
     * @param {boolean} isEditMode 是否為編輯模式
     */
    function generateProductionRecords(totalUnits, containerQty, isEditMode) {
        const form = isEditMode ? elements.editModalForm : elements.createModalForm;
        const bodySelector = isEditMode ? '[data-edit-production-records-rows]' : '[data-production-records-rows]';
        const tbody = form?.querySelector(bodySelector);

        if (!tbody) {
            console.error('Production records tbody not found');
            return;
        }

        if (containerQty <= 0) {
            console.warn('Container quantity is 0 or invalid');
            return;
        }

        const piecesPerContainer = Math.ceil(totalUnits / containerQty);
        let html = '';

        for (let i = 0; i < containerQty; i++) {
            const start = i * piecesPerContainer + 1;
            const end = Math.min((i + 1) * piecesPerContainer, totalUnits);
            // 卡號格式: 3001, 6002, 9003 (累積數量)
            // 需求說明: "卡號就是篩分機器上會顯示目前處理到了第幾支... 所以是總支數/載具數量=卡號"
            // 範例: 3001, 6002, 9003. 這代表的是 "累積" 數量，也就是該桶裝滿時的計數器數值。
            const cardNumber = end;

            html += `
            <tr class="production-record-row">
                <td>
                    <input type="text" name="pr_card_number[]" value="${cardNumber}" readonly class="form-control-plaintext" style="width: 80px;">
                </td>
                <td>
                    <input type="number" name="pr_weight_kg[]" step="0.01" class="form-control" style="width: 80px;" placeholder="重量">
                </td>
                <td>
                    <input type="date" name="pr_date[]" class="form-control" style="width: 130px;">
                </td>
                <td>
                    <input type="time" name="pr_time[]" class="form-control" style="width: 110px;">
                </td>
                <td>
                    <select name="pr_machine_id[]" class="form-control" style="width: 120px;" onchange="updateMachineType(this)">
                        <option value="">選擇機台</option>
                        ${getMachineOptionsHtml()}
                    </select>
                </td>
                <td>
                    <input type="text" name="pr_machine_type[]" readonly class="form-control-plaintext" style="width: 100px;">
                </td>
                <td>
                    <span class="current-user-name">${state.currentUser?.name || '當前用戶'}</span>
                    <input type="hidden" name="pr_operator_name[]" value="${state.currentUser?.name || ''}">
                </td>
                <td>
                    <input type="text" name="pr_notes[]" class="form-control" placeholder="備註">
                </td>
                <td>
                    <button type="button" class="btn icon danger" onclick="this.closest('tr').remove()">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
            `;
        }

        tbody.innerHTML = html;

        // 綁定重量變更事件以更新 Metrics Panel
        attachProductionRecordEvents(form, isEditMode);
    }

    function renderProductionRecords(records, isEditMode) {
        const form = isEditMode ? elements.editModalForm : elements.createModalForm;
        const bodySelector = isEditMode ? '[data-edit-production-records-rows]' : '[data-production-records-rows]';
        const tbody = form?.querySelector(bodySelector);

        if (!tbody) return;

        let html = '';
        records.forEach(record => {
            html += `
            <tr class="production-record-row">
                <td>
                    <input type="text" name="pr_card_number[]" value="${record.card_number || ''}" readonly class="form-control-plaintext" style="width: 80px;">
                </td>
                <td>
                    <input type="number" name="pr_weight_kg[]" value="${record.weight_kg || ''}" step="0.01" class="form-control" style="width: 80px;" placeholder="重量">
                </td>
                <td>
                    <input type="date" name="pr_date[]" value="${record.production_date || ''}" class="form-control" style="width: 130px;">
                </td>
                <td>
                    <input type="time" name="pr_time[]" value="${record.production_time ? record.production_time.substring(0, 5) : ''}" class="form-control" style="width: 110px;">
                </td>
                <td>
                    <select name="pr_machine_id[]" class="form-control" style="width: 120px;" onchange="updateMachineType(this)">
                        <option value="">選擇機台</option>
                        ${getMachineOptionsHtml(record.machine_id)}
                    </select>
                </td>
                <td>
                    <input type="text" name="pr_machine_type[]" value="${record.machine_type || ''}" readonly class="form-control-plaintext" style="width: 100px;">
                </td>
                <td>
                    <span class="current-user-name">${record.employee_name || state.currentUser?.name || ''}</span>
                    <input type="hidden" name="pr_operator_name[]" value="${record.employee_name || state.currentUser?.name || ''}">
                </td>
                <td>
                    <input type="text" name="pr_notes[]" value="${record.notes || ''}" class="form-control" placeholder="備註">
                </td>
                <td>
                    <button type="button" class="btn icon danger" onclick="this.closest('tr').remove()">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
            `;
        });

        tbody.innerHTML = html;

        // 綁定重量變更事件以更新 Metrics Panel
        attachProductionRecordEvents(form, isEditMode);
    }

    /**
     * 更新現有生產紀錄的卡號（當總支數改變但載具數量不變時）
     */
    function updateProductionRecordsCardNumbers(totalUnits, containerQty, existingRecords, isEditMode) {
        if (containerQty <= 0) return;

        const piecesPerContainer = Math.ceil(totalUnits / containerQty);

        // 重新計算每個卡號
        const updatedRecords = existingRecords.map((record, i) => {
            const end = Math.min((i + 1) * piecesPerContainer, totalUnits);
            return {
                ...record,
                card_number: end
            };
        });

        renderProductionRecords(updatedRecords, isEditMode);
    }

    /**
     * 重新生成生產紀錄（當載具數量改變時），保留已填寫的資料
     */
    function regenerateProductionRecordsWithData(totalUnits, containerQty, existingRecords, isEditMode) {
        const form = isEditMode ? elements.editModalForm : elements.createModalForm;
        const bodySelector = isEditMode ? '[data-edit-production-records-rows]' : '[data-production-records-rows]';
        const tbody = form?.querySelector(bodySelector);

        if (!tbody || containerQty <= 0) return;

        const piecesPerContainer = Math.ceil(totalUnits / containerQty);
        let html = '';

        for (let i = 0; i < containerQty; i++) {
            const end = Math.min((i + 1) * piecesPerContainer, totalUnits);
            const cardNumber = end;

            // 嘗試從現有紀錄中取得已填寫的資料
            const existingRecord = existingRecords[i] || {};

            html += `
            <tr class="production-record-row">
                <td>
                    <input type="text" name="pr_card_number[]" value="${cardNumber}" readonly class="form-control-plaintext" style="width: 80px;">
                </td>
                <td>
                    <input type="number" name="pr_weight_kg[]" value="${existingRecord.weight_kg || ''}" step="0.01" class="form-control" style="width: 80px;" placeholder="重量">
                </td>
                <td>
                    <input type="date" name="pr_date[]" value="${existingRecord.production_date || ''}" class="form-control" style="width: 130px;">
                </td>
                <td>
                    <input type="time" name="pr_time[]" value="${existingRecord.production_time ? existingRecord.production_time.substring(0, 5) : ''}" class="form-control" style="width: 110px;">
                </td>
                <td>
                    <select name="pr_machine_id[]" class="form-control" style="width: 120px;" onchange="updateMachineType(this)">
                        <option value="">選擇機台</option>
                        ${getMachineOptionsHtml(existingRecord.machine_id)}
                    </select>
                </td>
                <td>
                    <input type="text" name="pr_machine_type[]" value="${existingRecord.machine_type || ''}" readonly class="form-control-plaintext" style="width: 100px;">
                </td>
                <td>
                    <span class="current-user-name">${existingRecord.employee_name || state.currentUser?.name || '當前用戶'}</span>
                    <input type="hidden" name="pr_operator_name[]" value="${existingRecord.employee_name || state.currentUser?.name || ''}">
                </td>
                <td>
                    <input type="text" name="pr_notes[]" value="${existingRecord.notes || ''}" class="form-control" placeholder="備註">
                </td>
                <td>
                    <button type="button" class="btn icon danger" onclick="this.closest('tr').remove()">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
            `;
        }

        tbody.innerHTML = html;

        // 綁定重量變更事件以更新 Metrics Panel
        attachProductionRecordEvents(form, isEditMode);
    }

    /**
     * 綁定生產紀錄的事件（重量變更時更新 Metrics Panel）
     */
    function attachProductionRecordEvents(form, isEditMode) {
        const weightInputs = form.querySelectorAll('[name="pr_weight_kg[]"]');
        weightInputs.forEach(input => {
            input.removeEventListener('input', handleWeightChange);
            input.addEventListener('input', () => updateMetricsPanel(isEditMode));
        });
    }

    function handleWeightChange() {
        // 此函數僅作為事件處理的佔位符
    }

    // 輔助函式：取得機台選項 HTML (需確保 state.machines 已載入)
    function getMachineOptionsHtml(selectedId = null) {
        if (!state.machines) return '';
        return state.machines.map(m => {
            const selected = (selectedId && m.id == selectedId) ? 'selected' : '';
            return `<option value="${m.id}" data-type="${m.name}" ${selected}>${m.machine_number} - ${m.name}</option>`;
        }).join('');
    }

    // 全局函式供行內 onchange 使用
    window.updateMachineType = function(select) {
        const option = select.options[select.selectedIndex];
        const type = option.getAttribute('data-type') || '';
        const row = select.closest('tr');
        const typeInput = row.querySelector('[name="pr_machine_type[]"]');
        if (typeInput) typeInput.value = type;
    };

    /**
     * 設定訂單資訊欄位的唯讀狀態
     * @param {boolean} isEditMode - 是否為編輯模式
     */
    function setOrderInfoFieldsReadonly(isEditMode) {
        const form = isEditMode ? elements.editModalForm : elements.createModalForm;

        // 使用 name 屬性來查找欄位
        const orderInfoFieldNames = [
            'customer_name', 'customer_po_number', 'sub_item_number', 'part_number',
            'drawing_number', 'screening_item_name', 'customer_sample_status',
            'delivery_location', 'total_weight_kg', 'weight_per_unit_g', 'total_units',
            'tool_statistics', 'expected_delivery_date'
        ];

        orderInfoFieldNames.forEach(fieldName => {
            const input = form?.querySelector(`[name="${fieldName}"]`);
            if (input) {
                input.setAttribute('readonly', 'readonly');
                input.style.backgroundColor = '#f8f9fa';
                input.style.color = '#6c757d';
                input.style.cursor = 'not-allowed';
            }
        });
    }

    function renderScreeningServicesTable(services, isEditMode = false) {
        // 根據模式選擇正確的元素
        const form = isEditMode ? elements.editModalForm : elements.createModalForm;
        const bodySelector = isEditMode ? '[data-edit-screening-services-body]' : '[data-screening-services-body]';
        const screeningServicesBody = form?.querySelector(bodySelector);

        if (!screeningServicesBody) {
            return;
        }

        if (!services || services.length === 0) {
            screeningServicesBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="7" class="text-center text-muted">此客戶批號無篩分服務</td>
                </tr>
            `;
            return;
        }

        const html = services.map((service, index) => {
            // 格式化公差(+)
            let tolerancePlus = '';
            if (service.tolerance_plus_value != null) {
                tolerancePlus = parseFloat(service.tolerance_plus_value).toFixed(2);
            }

            // 格式化公差(-)
            let toleranceMinus = '';
            if (service.tolerance_minus_value != null) {
                toleranceMinus = parseFloat(service.tolerance_minus_value).toFixed(2);
            }

            // 格式化 PPM
            let ppm = '';
            if (service.ppm_standard != null) {
                ppm = parseFloat(service.ppm_standard).toFixed(0);
            }

            // 不良品數量 (編輯時可輸入)
            const defectQuantity = service.defect_quantity || 0;
            const defectInput = isEditMode
                ? `<input type="number" name="defect_quantity_${service.id || index}"
                          value="${defectQuantity}" min="0" step="1"
                          data-service-id="${service.id || index}"
                          style="width: 100%; padding: 4px;" />`
                : `<span>${defectQuantity}</span>`;

            return `
            <tr data-service-index="${index}">
                <td>${escapeHtml(service.screening_service_name || '')}</td>
                <td>${escapeHtml(service.custom_service_name || '')}</td>
                <td class="text-right">${tolerancePlus}</td>
                <td class="text-right">${toleranceMinus}</td>
                <td class="text-right">${ppm}</td>
                <td class="text-center">${defectInput}</td>
                <td>${escapeHtml(service.notes || '')}</td>
            </tr>
            `;
        }).join('');

        screeningServicesBody.innerHTML = html;
    }

    function clearOrderItemFields(isEditMode = false) {
        const form = isEditMode ? elements.editModalForm : elements.createModalForm;
        if (!form) return;

        // 使用 name 屬性來查找並清空欄位
        const fieldNames = [
            'customer_name', 'customer_po_number', 'sub_item_number', 'part_number', 'drawing_number',
            'screening_item_name', 'customer_sample_status', 'delivery_location',
            'total_weight_kg', 'weight_per_unit_g', 'total_units',
            'tool_statistics', 'expected_delivery_date'
        ];

        fieldNames.forEach(fieldName => {
            const input = form.querySelector(`[name="${fieldName}"]`);
            if (input) {
                input.value = '';
            }
        });

        // 清空篩分服務明細表格
        renderScreeningServicesTable([], isEditMode);
    }

    /**
     * 更新 Metrics Panel 統計數據
     * @param {boolean} isEditMode - 是否為編輯模式
     */
    function updateMetricsPanel(isEditMode = false) {
        const prefix = isEditMode ? 'edit-' : '';
        const form = isEditMode ? elements.editModalForm : elements.createModalForm;

        if (!form || !state.orderItemDetails) {
            console.warn('Cannot update metrics panel: missing form or order item details');
            return;
        }

        // 訂單預期數據
        const orderTotalWeight = parseFloat(state.orderItemDetails.total_weight_kg) || 0;
        const orderToolQty = parseInt(state.orderItemDetails.tool_quantity) || 0;
        const orderUnits = parseFloat(state.orderItemDetails.total_units) || 0;
        const totalToolWeight = parseFloat(state.orderItemDetails.total_tool_weight) || 0;
        const weightPerUnit = parseFloat(state.orderItemDetails.weight_per_unit_g) || 0; // 產品單重(g)

        // 訂單淨重 = 總重量 - 載具總重
        const orderNetWeight = orderTotalWeight - totalToolWeight;

        // 從生產紀錄計算實際數據
        const productionRecordRows = form.querySelectorAll('.production-record-row');
        let actualToolQty = 0;
        let totalProductionWeight = 0; // 使用者輸入重量總和(含載具)

        productionRecordRows.forEach(row => {
            // 計算載具數量 (每一筆生產紀錄代表一個載具)
            actualToolQty++;

            // 累積使用者輸入的重量(含載具)
            const weightInput = row.querySelector('[name="pr_weight_kg[]"]');
            const weight = weightInput ? parseFloat(weightInput.value) || 0 : 0;
            totalProductionWeight += weight;
        });

        // 計算實際淨重 = SUM(使用者輸入重量) - 載具總重量
        const actualNetWeight = totalProductionWeight - totalToolWeight;

        // 計算不良品總數 (從篩分服務表格收集)
        let totalDefects = 0;
        const defectInputs = form.querySelectorAll('[name^="defect_quantity_"]');
        defectInputs.forEach(input => {
            totalDefects += parseInt(input.value) || 0;
        });

        // 不良品重量 (kg) = 不良品支數 × 產品單重(g) ÷ 1000
        const defectWeightKg = (totalDefects * weightPerUnit) / 1000;

        // 良品支數 = (實際淨重 * 1000) / 產品單重(g)
        const goodUnits = weightPerUnit > 0 ? Math.floor((actualNetWeight * 1000) / weightPerUnit) : 0;

        // 總支數 = 良品支數 + 不良品支數
        const actualTotalUnits = goodUnits + totalDefects;

        // 總重量 (kg) = 淨重(kg) + 載具重量合計(kg) + 不良品重量(kg)
        const actualTotalWeight = actualNetWeight + totalToolWeight + defectWeightKg;

        // 計算差值 (四捨五入到 2 位小數,避免浮點數精度問題)
        const weightDiff = Math.round((orderNetWeight - actualNetWeight) * 100) / 100;
        const toolDiff = orderToolQty - actualToolQty;
        const unitsDiff = Math.round((orderUnits - actualTotalUnits) * 100) / 100;

        // 更新訂單預期
        setMetricValue(`${prefix}order-net-weight`, orderNetWeight.toFixed(2));
        setMetricValue(`${prefix}order-tool-quantity`, orderToolQty);
        setMetricValue(`${prefix}order-tool-weight`, totalToolWeight.toFixed(2));
        setMetricValue(`${prefix}order-total-units`, formatNumber(orderUnits));

        // 更新實際篩分後
        setMetricValue(`${prefix}actual-net-weight`, actualNetWeight.toFixed(2)); // 實際淨重 = 輸入重量總和 - 載具總重
        setMetricValue(`${prefix}actual-tool-quantity`, actualToolQty);
        setMetricValue(`${prefix}actual-tool-weight`, totalToolWeight.toFixed(2)); // 載具重量合計
        setMetricValue(`${prefix}good-units`, formatNumber(goodUnits));
        setMetricValue(`${prefix}defect-units`, formatNumber(totalDefects));
        setMetricValue(`${prefix}defect-weight`, defectWeightKg.toFixed(3)); // 不良品重量 (kg)
        setMetricValue(`${prefix}actual-total-units`, formatNumber(actualTotalUnits));
        setMetricValue(`${prefix}actual-total-weight`, actualTotalWeight.toFixed(2)); // 總重量 = 淨重 + 載具重量 + 不良品重量

        // 更新差值 (正值顯示綠色,負值顯示紅色)
        setMetricValue(`${prefix}weight-diff`, weightDiff.toFixed(2), weightDiff);
        setMetricValue(`${prefix}tool-diff`, toolDiff, toolDiff);
        setMetricValue(`${prefix}units-diff`, formatNumber(unitsDiff), unitsDiff);
    }

    /**
     * 設定 metric 數值並處理顏色
     * @param {string} metricName - metric 的 data-metric 值
     * @param {string|number} value - 要顯示的值
     * @param {number} numericValue - 用於判斷正負的數值 (選填)
     */
    function setMetricValue(metricName, value, numericValue = null) {
        const element = document.querySelector(`[data-metric="${metricName}"]`);
        if (!element) {
            console.warn(`Metric element not found: ${metricName}`);
            return;
        }

        element.textContent = value;

        // 處理差值顏色
        if (numericValue !== null && metricName.includes('diff')) {
            element.classList.remove('positive', 'negative');
            if (numericValue > 0) {
                element.classList.add('positive');
            } else if (numericValue < 0) {
                element.classList.add('negative');
            }
        }
    }

    /**
     * 格式化數字 (加千分位)
     * @param {number} num - 數字
     * @returns {string} 格式化後的字串
     */
    function formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        // 先四捨五入到 2 位小數,避免浮點數精度問題
        const rounded = Math.round(num * 100) / 100;
        return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    function csvEscape(value) {
        const text = value == null ? '' : String(value);
        if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
            return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
    }

    function formatDateForFileName() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    }

    // Utility Functions
    function populateSelect(selector, data, valueKey, textKey) {
        const selects = moduleRoot.querySelectorAll(selector);
        selects.forEach(select => {
            const currentValue = select.value;
            const defaultOption = select.querySelector('option[value=""]');
            select.innerHTML = defaultOption ? defaultOption.outerHTML : '<option value="">-- 請選擇 --</option>';

            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item[valueKey];
                option.textContent = item[textKey];
                select.appendChild(option);
            });

            select.value = currentValue;
        });
    }

    function showAlert(message, type = 'info') {
        if (!elements.alert) return;

        elements.alert.className = `module-alert ${type}`;
        elements.alert.textContent = message;
        elements.alert.classList.remove('hidden');

        setTimeout(() => {
            elements.alert.classList.add('hidden');
        }, 5000);
    }

    /**
     * 從客戶批號開啟新增工單表單並自動帶入資料
     * @param {number} orderItemId - 客戶批號 ID
     */
    async function openWorkOrderFromOrderItem(orderItemId) {
        try {
            // 1. 先取得客戶批號詳細資料
            const orderItemResponse = await fetch(`api/order_items/show.php?id=${orderItemId}`);
            const orderItemResult = await orderItemResponse.json();

            if (!orderItemResult.success || !orderItemResult.data) {
                throw new Error(orderItemResult.message || '無法取得客戶批號資料');
            }

            const orderItem = orderItemResult.data;
            if (orderItem.has_work_order) {
                const workOrderNumber = orderItem.work_order_number ? `（${orderItem.work_order_number}）` : '';
                showAlert(`此客戶批號已轉成工單${workOrderNumber}，請勿重複建立。`, 'error');
                return;
            }
            const orderId = orderItem.order_id;

            // 2. 取得訂單資料以獲取客戶 ID
            const orderResponse = await fetch(`api/orders/show.php?id=${orderId}`);
            const orderResult = await orderResponse.json();

            if (!orderResult.success || !orderResult.data) {
                throw new Error(orderResult.message || '無法取得訂單資料');
            }

            const order = orderResult.data;
            const customerId = order.customer?.id || order.customer_id;

            // 3. 開啟新增表單（這會重設所有欄位和下拉選單）
            openCreateModal();

            // 等待 DOM 更新和初始載入完成
            await new Promise(resolve => setTimeout(resolve, 300));

            // 4. 取得下拉選單元素
            const customerSelect = elements.createModalForm.querySelector('[name="source_customer_id"]');
            const orderSelect = elements.createModalForm.querySelector('[name="source_order_id"]');
            const orderItemSelect = elements.createModalForm.querySelector('[name="order_item_id"]');

            // 5. 選擇客戶（客戶已在 openCreateModal 中載入）
            if (customerSelect) {
                customerSelect.value = customerId;
            }

            // 6. 載入該客戶的訂單列表並選中
            if (orderSelect && customerId) {
                await loadOrdersForSelect(customerId);
                orderSelect.value = orderId;
            }

            // 7. 載入該訂單的品項列表並選中
            if (orderItemSelect && orderId) {
                await loadOrderItemsForSelect(orderId);
                orderItemSelect.value = orderItemId;

                // 8. 觸發 change 事件以載入詳細資料到表單欄位
                const event = new Event('change', { bubbles: true });
                orderItemSelect.dispatchEvent(event);
            }

        } catch (error) {
            console.error('開啟工單表單失敗:', error);
            showAlert('開啟工單表單失敗: ' + error.message, 'error');
        }
    }

    // 暴露函數供外部呼叫
    window.openWorkOrderFromOrderItem = openWorkOrderFromOrderItem;

    // New Helper Functions for Modal
    /**
     * 載入客戶資料到下拉選單（只顯示啟用中的客戶）
     */
    async function loadCustomersForSelect() {
        try {
            const response = await fetch('api/customers/index.php?perPage=1000&sortField=customer_number&sortDirection=asc');
            const result = await response.json();
            if (result.success) {
                const select = elements.createModalForm.querySelector('[name="source_customer_id"]');
                if (select) {
                    select.innerHTML = '<option value="">-- 請選擇客戶 --</option>';

                    // 分離啟用和停用的客戶
                    const allCustomers = result.data || [];
                    const activeCustomers = allCustomers.filter(c => c.is_active === 1 || c.is_active === '1' || c.is_active === true);
                    const inactiveCustomers = allCustomers.filter(c => c.is_active === 0 || c.is_active === '0' || c.is_active === false);

                    // 只添加啟用中的客戶
                    activeCustomers.forEach(item => {
                        const option = document.createElement('option');
                        option.value = item.id;
                        option.textContent = `${item.customer_number} - ${item.name}`;
                        select.appendChild(option);
                    });

                    // 如果有停用的客戶，添加分隔線和提示
                    if (inactiveCustomers.length > 0) {
                        const separator = document.createElement('option');
                        separator.disabled = true;
                        separator.textContent = `──── 另有 ${inactiveCustomers.length} 個已停用客戶 ────`;
                        select.appendChild(separator);
                    }
                }
            }
        } catch (error) {
            console.error('Load customers error:', error);
        }
    }

    async function loadOrdersForSelect(customerId) {
        const select = elements.createModalForm.querySelector('[name="source_order_id"]');
        const itemSelect = elements.createModalForm.querySelector('[name="order_item_id"]');

        if (!select) return;

        select.innerHTML = '<option value="">載入中...</option>';
        select.disabled = true;
        if (itemSelect) {
            itemSelect.innerHTML = '<option value="">-- 請先選擇訂單 --</option>';
            itemSelect.disabled = true;
        }

        try {
            const response = await fetch(`api/orders/index.php?customer_id=${customerId}&perPage=1000`);
            const result = await response.json();
            if (result.success) {
                select.innerHTML = '<option value="">-- 請選擇訂單 --</option>';
                result.data.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.id;
                    option.textContent = `${item.order_number} (PO: ${item.customer_po_number || '無'})`;
                    select.appendChild(option);
                });
                select.disabled = false;
            } else {
                select.innerHTML = '<option value="">無訂單資料</option>';
            }
        } catch (error) {
            console.error('Load orders error:', error);
            select.innerHTML = '<option value="">載入失敗</option>';
        }
    }

    async function loadOrderItemsForSelect(orderId) {
        const select = elements.createModalForm.querySelector('[name="order_item_id"]');
        if (!select) return;

        select.innerHTML = '<option value="">載入中...</option>';
        select.disabled = true;

        try {
            const response = await fetch(`api/order_items/index.php?order_id=${orderId}&exclude_has_work_order=1`);
            const result = await response.json();
            if (result.success) {
                select.innerHTML = '<option value="">-- 請選擇客戶批號 --</option>';
                result.data.forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.id;
                    // 顯示: 客戶批號 - 受篩產品名稱
                    const batchNo = item.customer_batch_number || '無批號';
                    const screeningName = item.screening_item?.name || '未命名產品';
                    option.textContent = `${batchNo} - ${screeningName}`;
                    select.appendChild(option);
                });
                select.disabled = false;
            } else {
                select.innerHTML = '<option value="">無品項資料</option>';
            }
        } catch (error) {
            console.error('Load order items error:', error);
            select.innerHTML = '<option value="">載入失敗</option>';
        }
    }

    async function performSearch() {
        const keyword = elements.createModalForm.querySelector('#search_keyword').value.trim();
        const startDate = elements.createModalForm.querySelector('#search_start_date').value;
        const endDate = elements.createModalForm.querySelector('#search_end_date').value;
        const resultsContainer = elements.createModalForm.querySelector('[data-search-results]');
        const tbody = resultsContainer.querySelector('tbody');

        if (!keyword && !startDate && !endDate) {
            alert('請輸入至少一個搜尋條件');
            return;
        }

        tbody.innerHTML = '<tr><td colspan="5" class="text-center">搜尋中...</td></tr>';
        resultsContainer.classList.remove('hidden');

        try {
            const params = new URLSearchParams({
                keyword: keyword,
                start_date: startDate,
                end_date: endDate
            });
            params.append('exclude_has_work_order', '1');
            const response = await fetch(`api/work_orders/search_order_items.php?${params}`);
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                tbody.innerHTML = '';
                result.data.forEach(item => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${escapeHtml(item.order_number)}</td>
                        <td>${escapeHtml(item.customer_name)}</td>
                        <td>${escapeHtml(item.customer_batch_number || '-')}</td>
                        <td>${escapeHtml(item.drawing_number || '-')}</td>
                        <td>
                            <button type="button" class="btn small primary" data-action="select-search-item" data-id="${item.id}">
                                選擇
                            </button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">查無資料</td></tr>';
            }
        } catch (error) {
            console.error('Search error:', error);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">搜尋發生錯誤</td></tr>';
        }
    }

    // Handle add image button click
    function handleAddImage(isEditMode = false) {
        // Get work order ID
        let workOrderId = null;
        if (isEditMode && state.editingId) {
            workOrderId = state.editingId;
        }

        if (!workOrderId && isEditMode) {
            showModalAlert('warning', '無法獲取工單ID', true, isEditMode);
            return;
        }

        if (!workOrderId && !isEditMode) {
            // For create mode, we need to save the work order first
            showModalAlert('warning', '請先儲存工單後再上傳圖片', true, isEditMode);
            return;
        }

        // Create file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = false;

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('image', file);
            formData.append('work_order_id', workOrderId);
            formData.append('image_type', 'general');
            formData.append('description', '');

            try {
                const response = await fetch('api/work_order_images/index.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    showModalAlert('success', '圖片上傳成功', true, isEditMode);
                    // Reload images
                    await loadWorkOrderImages(workOrderId, isEditMode);
                } else {
                    showModalAlert('danger', result.message || '圖片上傳失敗', false, isEditMode);
                }
            } catch (error) {
                console.error('Upload error:', error);
                showModalAlert('danger', '圖片上傳發生錯誤', false, isEditMode);
            }
        });

        input.click();
    }

    // Handle image row actions (preview, delete)
    function handleImageAction(event) {
        const target = event.target.closest('button');
        if (!target) return;

        const action = target.dataset.action;
        const row = target.closest('tr');
        if (!row) return;

        const imageId = row.dataset.imageId;
        const filePath = row.dataset.filePath;

        if (action === 'preview-image' && filePath) {
            window.open(filePath, '_blank');
        } else if (action === 'remove-image' && imageId) {
            const isEditMode = row.closest('[data-edit-images-rows]') !== null;
            const workOrderId = state.editingId;
            if (confirm('確定要刪除此圖片嗎?')) {
                handleDeleteImage(imageId, workOrderId, isEditMode);
            }
        }
    }

    // Load work order images
    async function loadWorkOrderImages(workOrderId, isEditMode = false) {
        try {
            const response = await fetch(`api/work_order_images/index.php?work_order_id=${workOrderId}`);
            const result = await response.json();

            if (!result.success) {
                console.error('Failed to load images:', result.message);
                return;
            }

            const images = result.data || [];
            const tbody = isEditMode ? elements.editImagesRows : elements.imagesRows;

            if (!tbody) return;

            if (images.length === 0) {
                tbody.innerHTML = `
                    <tr class="empty-row">
                        <td colspan="6" class="text-center">尚未上傳圖片</td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = images.map(img => `
                    <tr data-image-id="${img.id}" data-file-path="${img.file_path}">
                        <td>
                            <img src="${img.file_path}" alt="縮圖" style="width: 60px; height: 60px; object-fit: cover; cursor: pointer;" onclick="window.open('${img.file_path}', '_blank')">
                        </td>
                        <td>${getImageTypeLabel(img.image_type)}</td>
                        <td>${img.description || '-'}</td>
                        <td>${formatDateTime(img.uploaded_at)}</td>
                        <td>
                            <button type="button" class="btn ghost small" data-action="preview-image" title="預覽">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                        <td>
                            <button type="button" class="btn ghost small danger" data-action="remove-image" title="刪除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Load images error:', error);
        }
    }

    // Get image type label
    function getImageTypeLabel(type) {
        const labels = {
            'general': '一般紀錄',
            'defect': '缺失/不良',
            'setup': '機台設定',
            'sample': '樣品/客戶提供'
        };
        return labels[type] || type;
    }

    // Format datetime
    function formatDateTime(datetime) {
        if (!datetime) return '-';
        const d = new Date(datetime);
        return d.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Handle delete image
    async function handleDeleteImage(imageId, workOrderId, isEditMode) {
        if (!confirm('確定要刪除此圖片嗎?')) return;

        try {
            const response = await fetch('api/work_order_images/delete.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: imageId })
            });

            const result = await response.json();

            if (result.success) {
                showModalAlert('success', '圖片已刪除', true, isEditMode);
                await loadWorkOrderImages(workOrderId, isEditMode);
            } else {
                showModalAlert('danger', result.message || '刪除失敗', false, isEditMode);
            }
        } catch (error) {
            console.error('Delete error:', error);
            showModalAlert('danger', '刪除發生錯誤', false, isEditMode);
        }
    }

        // 建立資料同步輔助器
        if (typeof DataSync !== 'undefined') {
            DataSync.createModuleHelper('work_orders', {
                onRefresh: () => loadWorkOrders(),
                debounceMs: 300
            });
        }

        // 暴露模組方法供跨模組導航使用
        window.workOrdersModule = {
            viewDetail: openEditModal
        };
    } // End of initializeWorkOrdersModule

    // 暴露模組初始化函數到全域
    window.initializeWorkOrdersModule = initializeWorkOrdersModule;
})();
