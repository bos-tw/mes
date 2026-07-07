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
        partialReceiptModal: moduleRoot.querySelector('[data-work-order-partial-receipt-modal]'),
        partialReceiptForm: moduleRoot.querySelector('[data-partial-receipt-form]'),
        partialReceiptRows: moduleRoot.querySelector('[data-work-order-partial-receipts-rows]'),
        customerToolAnalysis: moduleRoot.querySelector('[data-work-order-customer-tool-analysis]'),
        balanceAlert: moduleRoot.querySelector('[data-work-order-balance-alert]'),
        completionModal: moduleRoot.querySelector('[data-work-order-completion-modal]'),
        completionForm: moduleRoot.querySelector('[data-work-order-completion-form]'),
        reversePartialModal: moduleRoot.querySelector('[data-work-order-reverse-partial-modal]'),
        reversePartialForm: moduleRoot.querySelector('[data-work-order-reverse-partial-form]'),
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
        editPreProductionImagesRows: moduleRoot.querySelector('[data-edit-pre-production-images-rows]'),
        editCompletionImagesRows: moduleRoot.querySelector('[data-edit-completion-images-rows]'),
        editDefectImagesRows: moduleRoot.querySelector('[data-edit-defect-images-rows]'),
        editToolConditionImagesRows: moduleRoot.querySelector('[data-edit-tool-condition-images-rows]'),
        editOrderDrawingsRows: moduleRoot.querySelector('[data-edit-order-drawings-rows]'),
        screeningServicesTable: moduleRoot.querySelector('[data-screening-services-table]'),
        screeningServicesBody: moduleRoot.querySelector('[data-screening-services-body]'),
        liveTimeLabel: moduleRoot.querySelector('[data-work-orders-live-time]'),
        mobileQuickEntryQr: moduleRoot.querySelector('[data-work-order-mobile-qr]'),
        mobileQuickEntryText: moduleRoot.querySelector('[data-work-order-mobile-qr-text]'),
        mobileQuickEntryOpenButton: moduleRoot.querySelector('[data-action="open-mobile-quick-entry"]'),
        mobileQuickEntryCopyButton: moduleRoot.querySelector('[data-action="copy-mobile-quick-entry"]')
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
        currentWorkOrder: null,
        partialReceiptContext: null,
        completionContext: null,
        reversePartialContext: null,
        orderItemDetails: null,
        firstPieceDimensions: null,
        images: [],
        productionRecords: [],
        productionRecordModes: {
            create: 'preset',
            edit: 'preset'
        },
        productionRecordBuffers: {
            create: { preset: [], manual: [] },
            edit: { preset: [], manual: [] }
        },
        deletedOrderDrawingIds: [],
        splitMachineRuns: {
            create: [],
            edit: []
        },
        createSourceMode: 'manual',
        machines: [],
        employees: [],
        currentUser: null,
        liveTimeIntervalId: null,
        formSnapshots: {
            create: null,
            edit: null
        },
        mobileQuickEntryUrl: '',
        qrCodeLibraryPromise: null
    };

    // Initialize
    init();

    function showModalAlert(type, message, autoHide = true, isEditMode = false) {
        const alertBox = isEditMode ? editModalAlertBox : createModalAlertBox;
        if (!alertBox) return;
        const normalizedType = type === 'danger' ? 'error' : (type || 'info');
        alertBox.textContent = message;
        alertBox.className = `modal-alert ${normalizedType}`;
        alertBox.removeAttribute('hidden');
        alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (autoHide && normalizedType === 'success') {
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

    function getSampleStatusLabel(status, label) {
        if (label !== null && label !== undefined && String(label).trim() !== '') {
            return String(label).trim();
        }

        if (status === null || status === undefined) {
            return '';
        }

        const raw = String(status).trim();
        if (!raw) {
            return '';
        }

        const normalized = raw.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
        if (normalized === 'yes') return '有';
        if (normalized === 'no') return '無';
        if (['yes_return', 'yes_need_return', 'need_return', 'return', 'return_required'].includes(normalized)) {
            return '有，須歸還';
        }
        if (['no_return', 'return_not_required', 'no_need_return'].includes(normalized)) {
            return '有，不須歸還';
        }

        return raw;
    }

    function getMobileQuickEntryBaseUrl() {
        return new URL('mobile/', window.location.href).toString();
    }

    function buildMobileQuickEntryUrl(workOrderId) {
        const normalizedId = Number.parseInt(workOrderId, 10) || 0;
        if (normalizedId <= 0) {
            return '';
        }

        const url = new URL(getMobileQuickEntryBaseUrl());
        url.searchParams.set('work_order_id', String(normalizedId));
        return url.toString();
    }

    function buildWorkOrderPrintUrl(params) {
        const url = new URL('print/work_order_print.html', window.location.href);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, String(value));
        });
        url.searchParams.set('mobile_base', getMobileQuickEntryBaseUrl());
        return url.toString();
    }

    function ensureQrCodeLibrary() {
        if (window.QRCode) {
            return Promise.resolve(window.QRCode);
        }
        if (state.qrCodeLibraryPromise) {
            return state.qrCodeLibraryPromise;
        }

        state.qrCodeLibraryPromise = new Promise((resolve, reject) => {
            const existingScript = document.querySelector('script[data-qrcodejs-loader="true"]');
            if (existingScript) {
                existingScript.addEventListener('load', () => resolve(window.QRCode));
                existingScript.addEventListener('error', () => reject(new Error('QR Code 套件載入失敗。')));
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
            script.async = true;
            script.dataset.qrcodejsLoader = 'true';
            script.addEventListener('load', () => {
                if (window.QRCode) {
                    resolve(window.QRCode);
                    return;
                }
                reject(new Error('QR Code 套件載入後未初始化。'));
            });
            script.addEventListener('error', () => reject(new Error('QR Code 套件載入失敗。')));
            document.head.appendChild(script);
        }).catch((error) => {
            state.qrCodeLibraryPromise = null;
            throw error;
        });

        return state.qrCodeLibraryPromise;
    }

    function setMobileQuickEntryPlaceholder(message) {
        if (!elements.mobileQuickEntryQr) {
            return;
        }
        elements.mobileQuickEntryQr.innerHTML = `<div class="work-order-mobile-quick-entry-placeholder">${escapeHtml(message)}</div>`;
    }

    function resetMobileQuickEntry() {
        state.mobileQuickEntryUrl = '';
        setMobileQuickEntryPlaceholder('請先載入工單');
        if (elements.mobileQuickEntryText) {
            elements.mobileQuickEntryText.textContent = '掃描 QR Code 或開啟手機版，即可直接進入此工單的手機上傳頁面。';
        }
        if (elements.mobileQuickEntryOpenButton) {
            elements.mobileQuickEntryOpenButton.disabled = true;
        }
        if (elements.mobileQuickEntryCopyButton) {
            elements.mobileQuickEntryCopyButton.disabled = true;
        }
    }

    async function renderMobileQuickEntry(workOrder) {
        const workOrderId = Number.parseInt(workOrder?.id, 10) || 0;
        const workOrderNumber = String(workOrder?.work_order_number || '').trim();
        const quickEntryUrl = buildMobileQuickEntryUrl(workOrderId);

        state.mobileQuickEntryUrl = quickEntryUrl;
        if (!quickEntryUrl) {
            resetMobileQuickEntry();
            return;
        }

        if (elements.mobileQuickEntryOpenButton) {
            elements.mobileQuickEntryOpenButton.disabled = false;
        }
        if (elements.mobileQuickEntryCopyButton) {
            elements.mobileQuickEntryCopyButton.disabled = false;
        }
        if (elements.mobileQuickEntryText) {
            elements.mobileQuickEntryText.textContent = workOrderNumber
                ? `掃描後可直接開啟工單 ${workOrderNumber} 的手機頁面，進行完工、不良品或載具狀況圖片回傳。`
                : '掃描後可直接進入此工單的手機頁面。';
        }
        setMobileQuickEntryPlaceholder('QR Code 產生中...');

        try {
            const QRCode = await ensureQrCodeLibrary();
            if (!elements.mobileQuickEntryQr) {
                return;
            }
            elements.mobileQuickEntryQr.innerHTML = '';
            new QRCode(elements.mobileQuickEntryQr, {
                text: quickEntryUrl,
                width: 200,
                height: 200,
                correctLevel: QRCode.CorrectLevel.H
            });
        } catch (error) {
            console.error('Render mobile quick entry QR failed:', error);
            setMobileQuickEntryPlaceholder('QR Code 載入失敗，請改用下方按鈕開啟或複製連結。');
        }
    }

    function openMobileQuickEntry() {
        if (!state.mobileQuickEntryUrl) {
            showAlert('找不到手機快速入口連結', 'warning');
            return;
        }
        window.open(state.mobileQuickEntryUrl, '_blank', 'noopener');
    }

    async function copyMobileQuickEntry() {
        if (!state.mobileQuickEntryUrl) {
            showAlert('找不到手機快速入口連結', 'warning');
            return;
        }

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(state.mobileQuickEntryUrl);
            } else {
                const tempInput = document.createElement('input');
                tempInput.value = state.mobileQuickEntryUrl;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
            }
            showAlert('手機快速入口連結已複製', 'success');
        } catch (error) {
            console.error('Copy mobile quick entry failed:', error);
            showAlert('複製手機快速入口連結失敗', 'error');
        }
    }

    function init() {
        loadCurrentUser();
        loadMachines();
        loadEmployees();
        loadStatuses();
        loadWorkOrders();
        resetMobileQuickEntry();
        attachEventListeners();
        setupMirroredFormFields(elements.createModalForm, ['machine_id', 'assigned_employee_id', 'calibration_employee_id']);
        setupMirroredFormFields(elements.editModalForm, ['machine_id', 'assigned_employee_id', 'calibration_employee_id']);
        enhanceScheduleSearchableSelects();
        syncMachinePickerFields();
    }

    function setupMirroredFormFields(form, fieldNames) {
        if (!form) {
            return;
        }

        fieldNames.forEach((fieldName) => {
            const fields = Array.from(form.querySelectorAll(`[name="${fieldName}"]`));
            if (fields.length < 2) {
                return;
            }

            fields.forEach((field) => {
                field.addEventListener('change', () => {
                    const value = field.value;
                    fields.forEach((target) => {
                        if (target !== field && target.value !== value) {
                            target.value = value;
                            refreshSearchableSelect(target);
                            syncMachinePickerField(target.closest('[data-primary-machine-field]'));
                        }
                    });
                    refreshSearchableSelect(field);
                    syncMachinePickerField(field.closest('[data-primary-machine-field]'));
                });
            });
        });
    }

    function syncMachinePickerField(field) {
        if (!field) {
            return;
        }
        const select = field.querySelector('select[name="machine_id"]');
        const label = field.querySelector('[data-machine-picker-label]');
        if (!select || !label) {
            return;
        }
        const selectedOption = select.options[select.selectedIndex];
        label.textContent = select.value
            ? (selectedOption?.textContent || getMachineDisplayName(select.value) || '-- 請選擇 --')
            : '-- 請選擇 --';
    }

    function syncMachinePickerFields(scope = moduleRoot) {
        scope.querySelectorAll('[data-primary-machine-field]').forEach(syncMachinePickerField);
    }

    function getSearchableSelectLabel(select) {
        if (!select || !select.value) {
            return '';
        }
        return select.options[select.selectedIndex]?.textContent?.trim() || '';
    }

    function refreshSearchableSelect(select) {
        const widget = select?.nextElementSibling?.classList?.contains('searchable-select')
            ? select.nextElementSibling
            : select?.parentElement?.querySelector(`.searchable-select[data-select-name="${select.name}"]`);
        if (!widget) {
            return;
        }
        const input = widget.querySelector('[data-searchable-select-input]');
        if (input) {
            input.value = getSearchableSelectLabel(select);
            input.placeholder = '-- 請選擇 --';
        }
    }

    function renderSearchableSelectOptions(select, widget, keyword = '') {
        const list = widget.querySelector('[data-searchable-select-list]');
        if (!list) {
            return;
        }
        const normalizedKeyword = keyword.trim().toLowerCase();
        const options = Array.from(select.options).filter((option) => {
            const label = option.textContent.trim();
            if (option.value === '') {
                return normalizedKeyword === '';
            }
            return label.toLowerCase().includes(normalizedKeyword);
        });

        if (options.length === 0) {
            list.innerHTML = '<button type="button" class="searchable-select-option empty" disabled>查無選項</button>';
            return;
        }

        list.innerHTML = options.map((option) => `
            <button type="button"
                    class="searchable-select-option${option.value === select.value ? ' selected' : ''}"
                    data-value="${escapeHtml(option.value)}">
                ${escapeHtml(option.textContent.trim() || '-- 請選擇 --')}
            </button>
        `).join('');
    }

    function closeSearchableSelects(exceptWidget = null) {
        moduleRoot.querySelectorAll('.searchable-select.open').forEach((widget) => {
            if (widget !== exceptWidget) {
                widget.classList.remove('open');
            }
        });
    }

    function openSearchableSelect(select, widget, keyword = '') {
        closeSearchableSelects(widget);
        renderSearchableSelectOptions(select, widget, keyword);
        widget.classList.add('open');
    }

    function enhanceSearchableSelect(select) {
        if (!select || select.dataset.searchableEnhanced === 'true') {
            return;
        }
        select.dataset.searchableEnhanced = 'true';
        select.classList.add('searchable-select-native');

        const widget = document.createElement('div');
        widget.className = 'searchable-select';
        widget.dataset.selectName = select.name;
        widget.innerHTML = `
            <div class="searchable-select-control">
                <input type="text" data-searchable-select-input placeholder="-- 請選擇 --" autocomplete="off">
                <button type="button" class="searchable-select-arrow" data-searchable-select-toggle aria-label="展開選單">
                    <i class="fas fa-chevron-down" aria-hidden="true"></i>
                </button>
            </div>
            <div class="searchable-select-list" data-searchable-select-list></div>
        `;
        select.insertAdjacentElement('afterend', widget);

        const input = widget.querySelector('[data-searchable-select-input]');
        const toggle = widget.querySelector('[data-searchable-select-toggle]');
        refreshSearchableSelect(select);

        input.addEventListener('focus', () => openSearchableSelect(select, widget, input.value));
        input.addEventListener('input', () => openSearchableSelect(select, widget, input.value));
        toggle.addEventListener('click', () => {
            if (widget.classList.contains('open')) {
                widget.classList.remove('open');
                return;
            }
            input.focus();
            openSearchableSelect(select, widget, '');
        });
        widget.addEventListener('click', (event) => {
            const optionButton = event.target.closest('[data-value]');
            if (!optionButton) {
                return;
            }
            select.value = optionButton.dataset.value || '';
            select.dispatchEvent(new Event('change', { bubbles: true }));
            refreshSearchableSelect(select);
            widget.classList.remove('open');
        });
        select.addEventListener('change', () => refreshSearchableSelect(select));
    }

    function enhanceScheduleSearchableSelects(scope = moduleRoot) {
        const selectors = [
            '.work-order-edit-schedule-grid select[name="assigned_employee_id"]',
            '.work-order-edit-schedule-grid select[name="calibration_employee_id"]',
            '.work-order-edit-schedule-grid select[name="machine_id"]',
            '[data-work-orders-create-form] select[name="assigned_employee_id"]',
            '[data-work-orders-create-form] select[name="calibration_employee_id"]',
            '[data-work-orders-create-form] [data-primary-machine-field] select[name="machine_id"]'
        ];
        scope.querySelectorAll(selectors.join(',')).forEach(enhanceSearchableSelect);
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
        badge.textContent = text || '週別';
        badge.style.display = '';
        badge.classList.toggle('is-placeholder', !text);
    }

    function updateAllScheduleWeekdays(form, prefix) {
        ['scheduled_start_date', 'scheduled_end_date', 'actual_start_date', 'actual_end_date'].forEach(name => {
            updateWorkOrderWeekday(form, prefix, name);
        });
    }

    function syncEditStatusDisplay() {
        const statusSelect = elements.editModalForm?.querySelector('[name="status_lookup_id"]');
        const statusDisplay = elements.editModalForm?.querySelector('[data-edit-summary-status]');
        if (!statusSelect || !statusDisplay) {
            return;
        }

        const selectedOption = statusSelect.options[statusSelect.selectedIndex];
        const label = statusSelect.value ? (selectedOption?.textContent?.trim() || '--') : '--';
        statusDisplay.textContent = label;
        statusDisplay.className = `status-badge ${getStatusBadgeClassByLabel(label)} work-order-edit-summary-status-badge`;
    }

    function getStatusBadgeClassByLabel(label) {
        const normalizedLabel = String(label || '').trim();
        switch (normalizedLabel) {
            case '待開始':
                return 'scheduled';
            case '進行中':
                return 'in-progress';
            case '已完成':
                return 'completed';
            case '暫停':
                return 'paused';
            case '已取消':
                return 'cancelled';
            default:
                return 'secondary';
        }
    }

    function hasRelaxedWorkOrderPermission(permissionName) {
        const permissions = Array.isArray(state.currentUser?.permissions) ? state.currentUser.permissions : [];
        if (permissions.length === 0) {
            return true;
        }
        if (typeof window.hasPermission === 'function') {
            return window.hasPermission(permissionName);
        }
        return permissions.includes(permissionName);
    }

    function hasAnyRelaxedWorkOrderPermission(permissionNames) {
        if (!Array.isArray(permissionNames) || permissionNames.length === 0) {
            return true;
        }
        return permissionNames.some((permissionName) => hasRelaxedWorkOrderPermission(permissionName));
    }

    function getPartialReceiptLockMessage(workOrder = null) {
        const currentWorkOrder = workOrder || state.currentWorkOrder || {};
        if (!hasAnyRelaxedWorkOrderPermission(['work_orders.partial_receipt', 'manage_work_orders'])) {
            return '目前帳號沒有工單部分入庫權限。';
        }
        if (currentWorkOrder.lifecycle_locked == 1 || currentWorkOrder.completed_at) {
            return '此工單已完成，不能再建立部分入庫。若需更正，請先退回工單並處理既有庫存。';
        }
        if (currentWorkOrder.has_inventory == 1 || state.editingHasInventory) {
            return '此工單已有正式庫存，不能再建立部分入庫。若需更正，請先退回工單並處理既有庫存。';
        }
        const statusKey = String(currentWorkOrder.status_key || '').trim();
        if (!['in_progress', 'paused'].includes(statusKey)) {
            return '只有進行中或暫停中的工單可以建立部分入庫。';
        }
        return '';
    }

    function roundWorkOrderWeight(value, digits = 2) {
        const numeric = Number(value) || 0;
        return Number(numeric.toFixed(digits));
    }

    function calculateWholeUnitsFromWeight(netWeightKg, weightPerUnitG) {
        const netWeight = Number(netWeightKg) || 0;
        const unitWeight = Number(weightPerUnitG) || 0;
        if (netWeight <= 0 || unitWeight <= 0) {
            return 0;
        }
        return Math.max(Math.floor(((netWeight * 1000) / unitWeight) + 0.000001), 0);
    }

    function formatWeightUnits(netWeightKg, units, digits = 2) {
        return `${roundWorkOrderWeight(netWeightKg, digits).toFixed(digits)} kg / ${formatNumber(Math.round(Number(units) || 0))} 支`;
    }

    function getShortageReasonLabel(reasonCode) {
        const labels = {
            material_loss: '遺失 / 散落',
            mixed_material: '混料 / 混批',
            damaged: '破損 / 報廢',
            count_error: '計數 / 重量誤差',
            other: '其他',
        };
        return labels[String(reasonCode || '').trim()] || '';
    }

    function mergeWorkOrderOperationalNote(baseNote, label, extraNote) {
        const baseText = String(baseNote || '').trim();
        const nextText = String(extraNote || '').trim();
        if (!nextText) {
            return baseText || undefined;
        }
        const stampedNote = `[${label}] ${nextText}`;
        return baseText ? `${baseText}\n${stampedNote}` : stampedNote;
    }

    function toggleSectionBody(button, body) {
        if (!button || !body) {
            return;
        }

        body.classList.toggle('hidden');
        const icon = button.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
        }
    }

    function parseDateTime(value) {
        if (!value) {
            return null;
        }
        const normalized = String(value).trim().replace(' ', 'T');
        const date = new Date(normalized);
        return Number.isNaN(date.getTime()) ? null : date;
    }

    function formatFileSize(bytes) {
        const numericBytes = Number(bytes) || 0;
        if (numericBytes <= 0) {
            return '0 B';
        }

        const units = ['B', 'KB', 'MB', 'GB'];
        const exponent = Math.min(Math.floor(Math.log(numericBytes) / Math.log(1024)), units.length - 1);
        const size = numericBytes / Math.pow(1024, exponent);
        return `${size.toFixed(exponent === 0 ? 0 : 2)} ${units[exponent]}`;
    }

    function toDateTimeLocalValue(value) {
        const date = parseDateTime(value);
        if (!date) {
            return '';
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hour}:${minute}`;
    }

    function formatLiveTimestamp(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        const second = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }

    function updateLiveTimeLabel() {
        if (!elements.liveTimeLabel) {
            return;
        }
        elements.liveTimeLabel.textContent = formatLiveTimestamp(new Date());
    }

    function startLiveTimeTicker() {
        stopLiveTimeTicker();
        updateLiveTimeLabel();
        state.liveTimeIntervalId = window.setInterval(updateLiveTimeLabel, 1000);
    }

    function stopLiveTimeTicker() {
        if (state.liveTimeIntervalId) {
            clearInterval(state.liveTimeIntervalId);
            state.liveTimeIntervalId = null;
        }
    }

    function getSplitModeKey(isEditMode) {
        return isEditMode ? 'edit' : 'create';
    }

    function getSplitRuns(isEditMode) {
        return state.splitMachineRuns[getSplitModeKey(isEditMode)];
    }

    function setSplitRuns(isEditMode, runs) {
        state.splitMachineRuns[getSplitModeKey(isEditMode)] = Array.isArray(runs) ? runs : [];
    }

    function getProductionRecordContextKey(isEditMode) {
        return isEditMode ? 'edit' : 'create';
    }

    function getProductionRecordBuffers(isEditMode) {
        return state.productionRecordBuffers[getProductionRecordContextKey(isEditMode)];
    }

    function getProductionRecordMode(isEditMode) {
        return state.productionRecordModes[getProductionRecordContextKey(isEditMode)] || 'preset';
    }

    function getFormSnapshotKey(isEditMode) {
        return isEditMode ? 'edit' : 'create';
    }

    function stableStringify(value) {
        if (Array.isArray(value)) {
            return `[${value.map((item) => stableStringify(item)).join(',')}]`;
        }

        if (value && typeof value === 'object') {
            const keys = Object.keys(value).sort();
            return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
        }

        return JSON.stringify(value);
    }

    function normalizeSnapshotValue(value) {
        if (value instanceof File) {
            return {
                name: value.name,
                size: value.size,
                type: value.type
            };
        }

        return value == null ? '' : String(value);
    }

    function getOrderDrawingSnapshot() {
        if (!elements.editOrderDrawingsRows) {
            return {
                rows: [],
                deletedIds: []
            };
        }

        const rows = Array.from(elements.editOrderDrawingsRows.querySelectorAll('.drawing-row')).map((row) => ({
            drawingId: row.dataset.drawingId || '',
            drawingNumber: row.querySelector('[data-field="drawing-number"]')?.value.trim() || '',
            hasFileObject: Boolean(row.fileObject),
            fileName: row.fileObject?.name || '',
            fileSize: row.fileObject?.size || 0,
            filePath: row.dataset.filePath || ''
        }));

        return {
            rows,
            deletedIds: [...state.deletedOrderDrawingIds].map((id) => String(id)).sort()
        };
    }

    function buildWorkOrderFormSnapshot(isEditMode) {
        const form = isEditMode ? elements.editModalForm : elements.createModalForm;
        if (!form) {
            return null;
        }

        if (isEditMode) {
            syncProductionRecordBufferFromForm(true);
        }

        const formEntries = Array.from(new FormData(form).entries())
            .map(([key, value]) => [key, normalizeSnapshotValue(value)]);

        const snapshot = {
            visible: isEditMode ? !elements.editModal.classList.contains('hidden') : !elements.createModal.classList.contains('hidden'),
            formEntries,
            orderItemId: getCurrentOrderItemId(),
            sourceMode: isEditMode ? null : state.createSourceMode,
            workOrderType: form.querySelector('[name="work_order_type"]')?.value || 'normal',
            productionRecordMode: getProductionRecordMode(isEditMode),
            productionRecordBuffers: getProductionRecordBuffers(isEditMode),
            splitMachineRuns: getSplitRuns(isEditMode),
            orderDrawings: isEditMode ? getOrderDrawingSnapshot() : null
        };

        return stableStringify(snapshot);
    }

    function resetWorkOrderFormSnapshot(isEditMode) {
        state.formSnapshots[getFormSnapshotKey(isEditMode)] = buildWorkOrderFormSnapshot(isEditMode);
    }

    function hasUnsavedWorkOrderChanges(isEditMode) {
        const form = isEditMode ? elements.editModalForm : elements.createModalForm;
        const modal = isEditMode ? elements.editModal : elements.createModal;
        if (!form || !modal || modal.classList.contains('hidden')) {
            return false;
        }

        const currentSnapshot = buildWorkOrderFormSnapshot(isEditMode);
        const baselineSnapshot = state.formSnapshots[getFormSnapshotKey(isEditMode)];
        return currentSnapshot !== baselineSnapshot;
    }

    function hasAnyUnsavedWorkOrderChanges() {
        return hasUnsavedWorkOrderChanges(false) || hasUnsavedWorkOrderChanges(true);
    }

    function confirmDiscardUnsavedWorkOrderChanges() {
        return window.confirm('目前有尚未儲存的工單資料，若直接關閉將會遺失。確定要繼續關閉嗎？');
    }

    function cloneProductionRecord(record = {}) {
        return {
            card_number: record.card_number || '',
            tool_name: record.tool_name || '',
            tool_weight_kg: record.tool_weight_kg ?? '',
            weight_kg: record.weight_kg ?? '',
            production_date: record.production_date || '',
            production_time: record.production_time || '',
            machine_id: record.machine_id || '',
            machine_type: getMachineCapabilityName(record.machine_id) || record.machine_type || '',
            operator_name: record.operator_name || record.employee_name || state.currentUser?.name || '',
            notes: record.notes || '',
            production_source_mode: record.production_source_mode || 'preset'
        };
    }

    function recalculateProductionRecordCards(records, totalUnits) {
        const safeRecords = Array.isArray(records) ? records.map((record) => cloneProductionRecord(record)) : [];
        const rowCount = safeRecords.length;
        if (rowCount <= 0) {
            return safeRecords;
        }

        const piecesPerContainer = Math.ceil((parseFloat(totalUnits) || 0) / rowCount);
        return safeRecords.map((record, index) => {
            const cardNumber = rowCount > 0
                ? Math.min((index + 1) * piecesPerContainer, parseFloat(totalUnits) || 0)
                : '';
            return {
                ...record,
                card_number: cardNumber > 0 ? String(cardNumber) : ''
            };
        });
    }

    function buildPresetProductionRecordsFromOrder(orderItemDetails, totalUnits) {
        const toolDetails = Array.isArray(orderItemDetails?.tool_details) ? orderItemDetails.tool_details : [];
        const rows = [];

        toolDetails.forEach((detail) => {
            const quantity = Math.max(0, Math.round(parseFloat(detail.quantity) || 0));
            const unitWeight = parseFloat(detail.unit_weight_kg) || 0;
            const toolName = detail.tool_name || detail.tool_type || '';
            for (let i = 0; i < quantity; i += 1) {
                rows.push(cloneProductionRecord({
                    tool_name: toolName,
                    tool_weight_kg: unitWeight ? unitWeight.toFixed(3) : '',
                    production_source_mode: 'preset'
                }));
            }
        });

        return recalculateProductionRecordCards(rows, totalUnits);
    }

    function buildManualProductionRecords(orderItemDetails, totalUnits, existingRecords = []) {
        if (Array.isArray(existingRecords) && existingRecords.length > 0) {
            return recalculateProductionRecordCards(existingRecords.map((record) => ({
                ...record,
                production_source_mode: 'manual'
            })), totalUnits);
        }

        const fallbackCount = Math.max(1, parseInt(orderItemDetails?.tool_quantity, 10) || 0);
        const rows = Array.from({ length: fallbackCount }, () => cloneProductionRecord({
            production_source_mode: 'manual'
        }));
        return recalculateProductionRecordCards(rows, totalUnits);
    }

    function addOrderDrawingRow(drawing = null) {
        const tbody = elements.editOrderDrawingsRows;
        if (!tbody) return null;
        tbody.querySelector('.empty-row')?.remove();
        const row = document.createElement('tr');
        row.className = 'drawing-row';
        if (drawing?.id) row.dataset.drawingId = String(drawing.id);
        if (drawing?.file_path) row.dataset.filePath = drawing.file_path;
        row.innerHTML = `
            <td><input type="text" data-field="drawing-number" maxlength="100" placeholder="請輸入圖面編號" value="${escapeHtml(drawing?.drawing_number || '')}"></td>
            <td class="drawing-file-cell">${drawing?.file_name ? escapeHtml(drawing.file_name) : '<input type="file" accept="image/*,.pdf" data-field="drawing-file">'}</td>
            <td data-field="drawing-size">${drawing?.file_size ? escapeHtml(formatFileSize(drawing.file_size)) : '-'}</td>
            <td data-field="drawing-time">${drawing?.uploaded_at ? escapeHtml(formatDateTime(drawing.uploaded_at)) : '-'}</td>
            <td class="text-center">${drawing?.file_path ? '<button type="button" class="btn ghost icon-only" data-action="preview-order-drawing" title="預覽"><i class="fas fa-eye"></i></button>' : '-'}</td>
            <td class="text-center"><button type="button" class="btn ghost icon-only" data-action="remove-order-drawing" title="移除"><i class="fas fa-trash"></i></button></td>
        `;
        tbody.appendChild(row);
        return row;
    }

    function renderOrderDrawings(drawings = []) {
        const tbody = elements.editOrderDrawingsRows;
        if (!tbody) return;
        tbody.innerHTML = '';
        state.deletedOrderDrawingIds = [];
        drawings.forEach(addOrderDrawingRow);
        if (!drawings.length) tbody.innerHTML = '<tr class="empty-row"><td colspan="6" class="text-center">尚未上傳圖面</td></tr>';
    }

    function getCurrentOrderItemId() {
        const orderItemId = state.orderItemDetails?.order_item_id ?? state.orderItemDetails?.id ?? null;
        const normalizedId = Number.parseInt(orderItemId, 10);
        return Number.isInteger(normalizedId) && normalizedId > 0 ? normalizedId : null;
    }

    function hasPendingOrderDrawingChanges() {
        if (!elements.editOrderDrawingsRows) {
            return false;
        }

        if (state.deletedOrderDrawingIds.length > 0) {
            return true;
        }

        return Array.from(elements.editOrderDrawingsRows.querySelectorAll('.drawing-row')).some((row) => {
            const number = row.querySelector('[data-field="drawing-number"]')?.value.trim() || '';
            return Boolean(row.fileObject) || Boolean(number && !row.dataset.drawingId);
        });
    }

    async function syncOrderItemDrawings() {
        const orderItemId = getCurrentOrderItemId();
        if (!orderItemId) {
            if (hasPendingOrderDrawingChanges()) {
                throw new Error('目前工單缺少對應的客戶批號 ID，無法儲存圖面附件。請重新開啟工單後再試。');
            }
            return;
        }
        const formData = new FormData();
        formData.append('_method', 'PUT');
        const drawingNumbers = [];
        const numberOnly = [];
        elements.editOrderDrawingsRows.querySelectorAll('.drawing-row').forEach((row) => {
            const number = row.querySelector('[data-field="drawing-number"]')?.value.trim() || '';
            if (row.fileObject) {
                formData.append('drawing_files[]', row.fileObject);
                drawingNumbers.push(number);
            } else if (row.dataset.drawingId) {
                formData.append(`existing_drawing_numbers[${row.dataset.drawingId}]`, number);
            } else if (number) {
                numberOnly.push(number);
            }
        });
        if (drawingNumbers.length) formData.append('drawing_numbers', JSON.stringify(drawingNumbers));
        if (numberOnly.length) formData.append('new_drawing_numbers_only', JSON.stringify(numberOnly));
        if (state.deletedOrderDrawingIds.length) formData.append('deleted_drawing_ids', JSON.stringify(state.deletedOrderDrawingIds));
        const response = await fetch(`api/order_items/update.php?id=${encodeURIComponent(orderItemId)}`, { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || '圖面附件儲存失敗');
    }

    function getProductionRecordsTableBody(isEditMode, mode) {
        const form = isEditMode ? elements.editModalForm : elements.createModalForm;
        const selector = isEditMode
            ? (mode === 'manual' ? '[data-edit-production-records-manual-rows]' : '[data-edit-production-records-preset-rows]')
            : '[data-production-records-rows]';
        return form?.querySelector(selector) || null;
    }

    function getProductionRecordRowsFromForm(isEditMode, mode = null) {
        const activeMode = mode || getProductionRecordMode(isEditMode);
        const tbody = getProductionRecordsTableBody(isEditMode, activeMode);
        if (!tbody) {
            return [];
        }

        return Array.from(tbody.querySelectorAll('.production-record-row')).map((row) => {
            const machineSelect = row.querySelector('[name="pr_machine_id[]"]');
            const machineTypeInput = row.querySelector('[name="pr_machine_type[]"]');
            const operatorInput = row.querySelector('[name="pr_operator_name[]"]');

            return cloneProductionRecord({
                card_number: row.querySelector('[name="pr_card_number[]"]')?.value || '',
                tool_name: row.querySelector('[name="pr_tool_name[]"]')?.value || '',
                tool_weight_kg: row.querySelector('[name="pr_tool_weight_kg[]"]')?.value || '',
                weight_kg: row.querySelector('[name="pr_weight_kg[]"]')?.value || '',
                production_date: row.querySelector('[name="pr_date[]"]')?.value || '',
                production_time: row.querySelector('[name="pr_time[]"]')?.value || '',
                machine_id: machineSelect?.value || '',
            machine_type: machineTypeInput?.value || getMachineCapabilityName(machineSelect?.value || '') || '',
                operator_name: operatorInput?.value || state.currentUser?.name || '',
                notes: row.querySelector('[name="pr_notes[]"]')?.value || '',
                production_source_mode: activeMode
            });
        });
    }

    function syncProductionRecordBufferFromForm(isEditMode) {
        const mode = getProductionRecordMode(isEditMode);
        const buffers = getProductionRecordBuffers(isEditMode);
        buffers[mode] = getProductionRecordRowsFromForm(isEditMode, mode);
    }

    function toggleProductionRecordPanelInputs(form, activeMode) {
        const panels = form?.querySelectorAll('[data-production-record-mode-panel]');
        panels?.forEach((panel) => {
            const panelMode = panel.getAttribute('data-production-record-mode-panel');
            const isActive = panelMode === activeMode;
            panel.classList.toggle('active', isActive);
            panel.querySelectorAll('input, select, textarea, button').forEach((element) => {
                if (element.getAttribute('data-action') === 'switch-production-record-mode') {
                    return;
                }
                if (element.matches('button')) {
                    element.disabled = !isActive && !element.hasAttribute('data-file-path');
                    return;
                }
                element.disabled = !isActive;
            });
        });

        const tabs = form?.querySelectorAll('[data-action="switch-production-record-mode"]');
        tabs?.forEach((tab) => {
            const isActive = tab.getAttribute('data-mode') === activeMode;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    function switchExecutionImageTab(tabName = 'completion', scope = null) {
        const section = scope?.closest('[data-edit-execution-images-section], [data-create-execution-images-section]')
            || elements.editModalForm?.querySelector('[data-edit-execution-images-section]')
            || elements.createModalForm?.querySelector('[data-create-execution-images-section]');
        if (!section) {
            return;
        }

        section.querySelectorAll('[data-action="switch-execution-image-tab"]').forEach((tab) => {
            const isActive = tab.getAttribute('data-image-tab') === tabName;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        section.querySelectorAll('[data-execution-image-panel]').forEach((panel) => {
            panel.classList.toggle('active', panel.getAttribute('data-execution-image-panel') === tabName);
        });
    }

    function switchScreeningStage(stage = 'primary', scope = null) {
        const form = scope?.closest('[data-work-orders-create-form], [data-work-orders-edit-form]')
            || elements.editModalForm
            || elements.createModalForm;
        if (!form) {
            return;
        }

        form.querySelectorAll('[data-action="switch-screening-stage"]').forEach((tab) => {
            const isActive = tab.getAttribute('data-screening-stage') === stage;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        form.querySelectorAll('[data-screening-stage-panel]').forEach((panel) => {
            panel.classList.toggle('active', panel.getAttribute('data-screening-stage-panel') === stage);
        });
    }

    function renderProductionRecordRows(records, isEditMode, mode) {
        const tbody = getProductionRecordsTableBody(isEditMode, mode);
        if (!tbody) {
            return;
        }

        const normalizedRecords = recalculateProductionRecordCards(records, parseFloat((isEditMode ? elements.editModalForm : elements.createModalForm)?.querySelector('[name="total_units"]')?.value || state.orderItemDetails?.total_units || 0));
        if (!normalizedRecords.length) {
            tbody.innerHTML = mode === 'manual'
                ? '<tr class="empty-row"><td colspan="11" class="text-center">尚無自行輸入的載具記錄</td></tr>'
                : '<tr class="empty-row"><td colspan="10" class="text-center">尚無預設生產記錄</td></tr>';
            return;
        }

        tbody.innerHTML = normalizedRecords.map((record) => `
            <tr class="production-record-row">
                <td><span class="readonly-cell">${escapeHtml(record.card_number || '')}</span><input type="hidden" name="pr_card_number[]" value="${escapeHtml(record.card_number || '')}"></td>
                <td><input type="text" name="pr_tool_name[]" value="${escapeHtml(record.tool_name || '')}" placeholder="載具種類"></td>
                <td><input type="number" name="pr_tool_weight_kg[]" value="${escapeHtml(String(record.tool_weight_kg || ''))}" step="0.001" min="0" placeholder="0.000"></td>
                <td><input type="number" name="pr_weight_kg[]" value="${escapeHtml(String(record.weight_kg || ''))}" step="0.01" min="0" placeholder="重量"></td>
                <td><input type="date" name="pr_date[]" value="${escapeHtml(record.production_date || '')}"></td>
                <td><input type="time" name="pr_time[]" value="${escapeHtml(record.production_time ? String(record.production_time).substring(0, 5) : '')}"></td>
                <td>
                    <select name="pr_machine_id[]" onchange="updateMachineType(this)">
                        <option value="">選擇機台</option>
                        ${getMachineOptionsHtml(record.machine_id)}
                    </select>
                </td>
                <td><input type="text" name="pr_machine_type[]" value="${escapeHtml(getMachineCapabilityName(record.machine_id) || record.machine_type || '')}" readonly class="form-control-plaintext"></td>
                <td>
                    <span class="current-user-name">${escapeHtml(record.operator_name || state.currentUser?.name || '')}</span>
                    <input type="hidden" name="pr_operator_name[]" value="${escapeHtml(record.operator_name || state.currentUser?.name || '')}">
                </td>
                <td><input type="text" name="pr_notes[]" value="${escapeHtml(record.notes || '')}" placeholder="備註"></td>
                ${mode === 'manual'
                    ? `<td><button type="button" class="btn icon danger" data-action="remove-manual-production-record"><i class="fas fa-trash-alt"></i></button></td>`
                    : ''}
            </tr>
        `).join('');
    }

    function renderProductionRecordEditor(isEditMode) {
        const form = isEditMode ? elements.editModalForm : elements.createModalForm;
        if (!form || isEditMode === false) {
            return;
        }

        const mode = getProductionRecordMode(isEditMode);
        const buffers = getProductionRecordBuffers(isEditMode);
        const hiddenModeInput = form.querySelector('[name="production_record_mode"]');
        if (hiddenModeInput) {
            hiddenModeInput.value = mode;
        }

        renderProductionRecordRows(buffers.preset || [], isEditMode, 'preset');
        renderProductionRecordRows(buffers.manual || [], isEditMode, 'manual');
        toggleProductionRecordPanelInputs(form, mode);
        attachProductionRecordEvents(form, isEditMode);
    }

    function setProductionRecordMode(isEditMode, mode) {
        const normalizedMode = mode === 'manual' ? 'manual' : 'preset';
        if (getProductionRecordMode(isEditMode) === normalizedMode) {
            return;
        }
        syncProductionRecordBufferFromForm(isEditMode);
        state.productionRecordModes[getProductionRecordContextKey(isEditMode)] = normalizedMode;
        renderProductionRecordEditor(isEditMode);
        updateMetricsPanel(isEditMode);
    }

    function createEmptyMachineRun(index = 0) {
        const unitWeight = parseFloat(state.orderItemDetails?.weight_per_unit_g) || 0;
        return {
            run_label: '',
            machine_id: '',
            scheduled_start_date: '',
            scheduled_end_date: '',
            actual_start_date: '',
            actual_end_date: '',
            assigned_employee_id: '',
            calibration_employee_id: '',
            quantity_to_produce: '',
            screening_speed: '',
            planned_net_weight_kg: '',
            completed_net_weight_kg: '',
            weight_per_unit_g: unitWeight || '',
            status: 'pending',
            notes: '',
            production_record_mode: 'preset',
            production_record_buffers: {
                preset: [],
                manual: []
            },
            production_records: [],
            defects: buildMachineRunDefects([]),
            split_ui_state: {
                scheduleCollapsed: false,
                inspectionCollapsed: false,
                productionCollapsed: false
            }
        };
    }

    function createEmptySplitProductionRecord(run = {}) {
        return {
            card_number: '',
            tool_name: '',
            tool_weight_kg: '',
            weight_kg: '',
            production_date: '',
            production_time: '',
            machine_id: run.machine_id || '',
            machine_type: getMachineCapabilityName(run.machine_id || '') || '',
            notes: ''
        };
    }

    function getSplitRunReferenceUnits(run = {}) {
        return parseFloat(run.completed_units || run.planned_units || state.orderItemDetails?.total_units || 0) || 0;
    }

    function ensureSplitRunProductionBuffers(run) {
        if (!run.production_record_buffers) {
            const existingRecords = Array.isArray(run.production_records) ? run.production_records.map((record) => cloneProductionRecord(record)) : [];
            const referenceUnits = getSplitRunReferenceUnits(run);
            const presetRecords = existingRecords.filter((record) => (record.production_source_mode || 'preset') !== 'manual');
            const manualRecords = existingRecords.filter((record) => record.production_source_mode === 'manual');
            run.production_record_buffers = {
                preset: presetRecords.length > 0
                    ? recalculateProductionRecordCards(presetRecords, referenceUnits)
                    : buildPresetProductionRecordsFromOrder(state.orderItemDetails, referenceUnits),
                manual: buildManualProductionRecords(state.orderItemDetails, referenceUnits, manualRecords)
            };
        }
        if (!run.production_record_mode) {
            run.production_record_mode = 'preset';
        }
        return run.production_record_buffers;
    }

    function ensureSplitRunUiState(run) {
        if (!run.split_ui_state) {
            run.split_ui_state = {
                scheduleCollapsed: false,
                inspectionCollapsed: false,
                productionCollapsed: false
            };
        }
        return run.split_ui_state;
    }

    function buildMachineRunDefects(existingDefects = []) {
        const services = state.orderItemDetails?.screening_services_details || [];
        const existingMap = new Map();
        existingDefects.forEach(defect => {
            existingMap.set(String(defect.screening_service_id), defect);
        });

        return services.map(service => ({
            screening_service_id: service.id,
            service_name: service.screening_service_name || service.custom_service_name || '',
            tolerance_plus_value: service.tolerance_plus_value ?? '',
            tolerance_minus_value: service.tolerance_minus_value ?? '',
            ppm_standard: service.ppm_standard ?? '',
            notes: service.notes || '',
            defect_quantity: existingMap.has(String(service.id))
                ? (existingMap.get(String(service.id))?.defect_quantity ?? 0)
                : 0
        }));
    }

    function getExpectedNetWeightForSplit() {
        const { form } = getCurrentModal();
        const formValue = form ? parseFloat(form.querySelector('[name="total_weight_kg"]')?.value) : NaN;
        if (!Number.isNaN(formValue) && formValue > 0) {
            return formValue;
        }
        return parseFloat(state.orderItemDetails?.net_weight || state.orderItemDetails?.total_weight_kg) || 0;
    }

    function getMachineOptionsHtml(selectedValue = '') {
        const options = ['<option value="">-- 請選擇 --</option>'];
        state.machines.forEach(machine => {
            const id = String(machine.id);
            const selected = id === String(selectedValue || '') ? ' selected' : '';
            const capability = machine.machine_capability_name || machine.capability_names || machine.machine_capability_code || '';
            const labelParts = [
                machine.machine_number ? String(machine.machine_number) : '',
                machine.name ? String(machine.name) : ''
            ].filter(Boolean);
            options.push(`<option value="${escapeHtml(id)}" data-capability="${escapeHtml(capability)}" data-type="${escapeHtml(capability)}"${selected}>${escapeHtml(labelParts.join(' - ') || id)}</option>`);
        });
        return options.join('');
    }

    function getMachineCapabilityName(machineId) {
        const id = String(machineId || '');
        if (!id) {
            return '';
        }
        const machine = state.machines.find(item => String(item.id) === id);
        if (!machine) {
            return '';
        }
        return machine.machine_capability_name || machine.capability_names || machine.machine_capability_code || '';
    }

    function getMachineDisplayName(machineId) {
        const id = String(machineId || '');
        if (!id) {
            return '';
        }
        const machine = state.machines.find(item => String(item.id) === id);
        if (!machine) {
            return '';
        }
        return [machine.machine_number || '', machine.name || ''].filter(Boolean).join(' - ') || id;
    }

    function getMachineGroupLabel(machine) {
        if (!machine) {
            return '未分類';
        }
        return machine.machine_capability_name || machine.capability_names || machine.machine_capability_code || '未分類';
    }

    function syncProductionRecordMachineCapability(select) {
        if (!select) {
            return;
        }
        const option = select.options[select.selectedIndex];
        const selectedMachineId = select.value || '';
        const capability = option?.getAttribute('data-capability')
            || option?.getAttribute('data-type')
            || getMachineCapabilityName(selectedMachineId)
            || '';
        const row = select.closest('tr');
        const typeInput = row?.querySelector('[name="pr_machine_type[]"]');
        if (typeInput) {
            typeInput.value = capability;
            return;
        }

        const form = select.closest('form');
        const standaloneCapabilityInput = form?.querySelector('[data-field="pr-machine-type"], [name="machine_type"]');
        if (standaloneCapabilityInput) {
            standaloneCapabilityInput.value = capability;
        }
    }

    function getEmployeeOptionsHtml(selectedValue = '') {
        const options = ['<option value="">-- 請選擇 --</option>'];
        state.employees.forEach(employee => {
            const id = String(employee.id);
            const selected = id === String(selectedValue || '') ? ' selected' : '';
            options.push(`<option value="${escapeHtml(id)}"${selected}>${escapeHtml(employee.name || id)}</option>`);
        });
        return options.join('');
    }

    function setWorkOrderType(form, nextType) {
        if (!form) return;
        const normalizedType = nextType === 'split' ? 'split' : 'normal';
        const hiddenInput = form.querySelector('input[name="work_order_type"]');
        if (hiddenInput) {
            hiddenInput.value = normalizedType;
        }
        form.querySelectorAll('[data-work-order-type-switch] .tab-btn').forEach((button) => {
            const active = button.dataset.value === normalizedType;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        syncSplitPanelVisibility(form, form === elements.editModalForm);
    }

    function setCreateSourceTab(tabName) {
        if (!elements.createModalForm) {
            return;
        }
        const sourceSection = elements.createModalForm.querySelector('[data-source-selection-section]');
        if (!sourceSection) {
            return;
        }
        const tabs = sourceSection.querySelectorAll('.tab-btn[data-tab]');
        const contents = sourceSection.querySelectorAll('.tab-content[data-tab-content]');
        tabs.forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        contents.forEach((content) => {
            content.classList.toggle('active', content.dataset.tabContent === tabName);
        });
    }

    function setCreateSourceMode(mode = 'manual') {
        if (!elements.createModalForm) {
            return;
        }
        const normalizedMode = mode === 'order_item' ? 'order_item' : 'manual';
        state.createSourceMode = normalizedMode;
        const sourceSection = elements.createModalForm.querySelector('[data-source-selection-section]');
        const sourceHint = elements.createModalForm.querySelector('[data-work-order-source-mode-hint]');
        const shouldHideSourceSection = normalizedMode === 'order_item';

        if (sourceSection) {
            sourceSection.classList.toggle('hidden', shouldHideSourceSection);
        }
        if (sourceHint) {
            sourceHint.classList.toggle('hidden', !shouldHideSourceSection);
        }
    }

    function syncSplitPanelVisibility(form, isEditMode) {
        if (!form) return;
        const type = form.querySelector('[name="work_order_type"]')?.value || 'normal';
        const panel = form.querySelector('[data-split-work-order-panel]');
        const isSplit = type === 'split';
        if (!panel) return;
        panel.classList.toggle('hidden', !isSplit);

        form.querySelectorAll('[data-primary-machine-field]').forEach((field) => {
            field.classList.toggle('hidden', isSplit);
            const select = field.querySelector('select[name="machine_id"]');
            if (select) {
                select.disabled = isSplit;
                if (isSplit) {
                    select.value = '';
                }
                syncMachinePickerField(field);
            }
        });

        form.querySelectorAll('[data-split-mode-hidden]').forEach((section) => {
            section.classList.toggle('hidden', isSplit);
        });

        renderSplitMachineRuns(isEditMode);
    }

    function renderSplitMachineRuns(isEditMode) {
        const form = isEditMode ? elements.editModalForm : elements.createModalForm;
        if (!form) return;
        const panel = form.querySelector('[data-split-work-order-panel]');
        if (!panel || panel.classList.contains('hidden')) return;

        const runs = getSplitRuns(isEditMode);
        const tabs = panel.querySelector('[data-split-machine-tabs]');
        const editor = panel.querySelector('[data-split-machine-editor]');
        const activeIndex = Math.min(parseInt(panel.dataset.activeRunIndex || '0', 10) || 0, Math.max(runs.length - 1, 0));
        panel.dataset.activeRunIndex = String(activeIndex);

        if (tabs) {
            tabs.innerHTML = runs.map((run, index) => `
                <button type="button" class="split-machine-tab ${index === activeIndex ? 'active' : ''}" data-action="select-machine-run" data-run-index="${index}">
                    <i class="fas fa-industry"></i>
                    <span>${escapeHtml(getSplitRunTabLabel(run, index))}</span>
                </button>
            `).join('');
        }

        if (!editor) return;
        if (runs.length === 0) {
            if (tabs) {
                tabs.innerHTML = '<div class="split-machine-empty-tabs">尚未選擇機台</div>';
            }
            editor.innerHTML = `
                <div class="split-machine-empty-state">
                    <strong>尚未建立拆分機台</strong>
                    <span>請先按「選擇機台新增」，從機台設備管理清單加入實際生產機台。</span>
                </div>
            `;
            updateSplitSummary(isEditMode);
            return;
        }

        const run = runs[activeIndex];
        const uiState = ensureSplitRunUiState(run);
        const completedNetWeight = parseFloat(run.completed_net_weight_kg) || 0;
        const partialReceiptNetWeight = parseFloat(run.partial_receipt_net_weight_kg) || 0;
        const partialReceiptRemaining = Math.max(0, completedNetWeight - partialReceiptNetWeight);
        const defectsHtml = (run.defects || []).map((defect, defectIndex) => {
            const tolerancePlus = defect.tolerance_plus_value !== null && defect.tolerance_plus_value !== undefined && defect.tolerance_plus_value !== ''
                ? Number.parseFloat(defect.tolerance_plus_value).toFixed(2)
                : '';
            const toleranceMinus = defect.tolerance_minus_value !== null && defect.tolerance_minus_value !== undefined && defect.tolerance_minus_value !== ''
                ? Number.parseFloat(defect.tolerance_minus_value).toFixed(2)
                : '';
            const ppm = defect.ppm_standard !== null && defect.ppm_standard !== undefined && defect.ppm_standard !== ''
                ? Number.parseFloat(defect.ppm_standard).toFixed(0)
                : '';

            return `
                <tr data-split-defect-row data-defect-index="${defectIndex}">
                    <td class="split-defect-service-cell">${escapeHtml(defect.service_name || `項目 ${defect.screening_service_id}`)}</td>
                    <td class="text-right split-defect-number-cell">${escapeHtml(tolerancePlus)}</td>
                    <td class="text-right split-defect-number-cell">${escapeHtml(toleranceMinus)}</td>
                    <td class="text-right split-defect-number-cell">${escapeHtml(ppm)}</td>
                    <td class="split-defect-quantity-cell">
                        <input type="number" min="0" step="1" value="${escapeHtml(String(defect.defect_quantity ?? 0))}" data-split-field="defect_quantity" data-defect-index="${defectIndex}" style="width: 100%; padding: 4px;">
                    </td>
                    <td class="split-defect-notes-cell">
                        <input type="text" value="${escapeHtml(defect.notes || '')}" data-split-field="defect_notes" data-defect-index="${defectIndex}" placeholder="請輸入備註">
                    </td>
                </tr>
            `;
        }).join('');
        const productionRecordsHtml = getSplitProductionRecordsHtml(run);

        editor.innerHTML = `
            <div class="split-machine-content-stack" data-run-index="${activeIndex}">
                <section class="form-section work-order-edit-schedule-section split-machine-schedule-section" data-split-collapsible-section>
                    <header class="subsection-header">
                        <div class="subsection-actions">
                            <button type="button" class="btn ghost small section-toggle-box" data-action="toggle-split-section" data-section="schedule" title="展開/收合"><i class="fas ${uiState.scheduleCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}"></i></button>
                        </div>
                        <h4>生產排程</h4>
                    </header>
                    <div class="subsection-body${uiState.scheduleCollapsed ? ' hidden' : ''}" data-split-section-body="schedule">
                    <div class="form-grid work-order-edit-schedule-grid">
                        <label class="inline-label">
                            <span>預定開始</span>
                            <input type="datetime-local" value="${escapeHtml(toDateTimeLocalValue(run.scheduled_start_date || ''))}" data-split-field="scheduled_start_date">
                        </label>
                        <label class="inline-label">
                            <span>預定結束</span>
                            <input type="datetime-local" value="${escapeHtml(toDateTimeLocalValue(run.scheduled_end_date || ''))}" data-split-field="scheduled_end_date">
                        </label>
                        <label class="inline-label">
                            <span>實際開始</span>
                            <input type="datetime-local" value="${escapeHtml(toDateTimeLocalValue(run.actual_start_date || ''))}" data-split-field="actual_start_date">
                        </label>
                        <label class="inline-label">
                            <span>實際結束</span>
                            <input type="datetime-local" value="${escapeHtml(toDateTimeLocalValue(run.actual_end_date || ''))}" data-split-field="actual_end_date">
                        </label>
                    </div>
                    </div>
                </section>

                <section class="form-section work-order-edit-inspection-section split-machine-inspection-section" data-split-collapsible-section>
                    <header class="subsection-header">
                        <div class="subsection-actions">
                            <button type="button" class="btn ghost small section-toggle-box" data-action="toggle-split-section" data-section="inspection" title="展開/收合"><i class="fas ${uiState.inspectionCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}"></i></button>
                        </div>
                        <h4>篩分明細 / 生產設定</h4>
                    </header>
                    <div class="subsection-body${uiState.inspectionCollapsed ? ' hidden' : ''}" data-split-section-body="inspection">
                    <div class="work-order-edit-middle-row">
                        <section class="form-section info-section work-order-edit-service-section split-machine-service-section">
                            <header class="subsection-header">
                                <h4>篩分服務明細</h4>
                            </header>
                            <div class="subsection-body">
                            <div class="table-responsive">
                                <table class="data-table compact split-defects-table">
                            <thead>
                                <tr>
                                    <th>服務項目</th>
                                    <th class="col-100">公差(+)</th>
                                    <th class="col-100">公差(-)</th>
                                    <th class="col-80">PPM</th>
                                    <th class="col-120">不良品數量</th>
                                    <th>備註</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${defectsHtml || '<tr class="empty-row"><td colspan="6" class="text-center text-muted">請先選擇客戶批號以載入確認單服務項目。</td></tr>'}
                            </tbody>
                                </table>
                            </div>
                            </div>
                        </section>

                        <section class="subsection work-order-edit-first-piece-card split-machine-settings-card">
                            <header class="subsection-header">
                                <h4>機台設定</h4>
                            </header>
                            <div class="subsection-body">
                            <div class="form-grid split-machine-settings-grid">
                                <label class="inline-label">
                                    <span>指定員工</span>
                                    <select data-split-field="assigned_employee_id">${getEmployeeOptionsHtml(run.assigned_employee_id)}</select>
                                </label>
                                <label class="inline-label">
                                    <span>校機人員</span>
                                    <select data-split-field="calibration_employee_id">${getEmployeeOptionsHtml(run.calibration_employee_id)}</select>
                                </label>
                                <label class="inline-label">
                                    <span>生產數量</span>
                                    <input type="number" min="0" step="0.01" value="${escapeHtml(String(run.quantity_to_produce || ''))}" data-split-field="quantity_to_produce" placeholder="請輸入生產數量">
                                </label>
                                <label class="inline-label">
                                    <span>篩選速度</span>
                                    <input type="text" maxlength="50" value="${escapeHtml(run.screening_speed || '')}" data-split-field="screening_speed" placeholder="例如: 300支/分">
                                </label>
                                <label class="inline-label">
                                    <span>流程備註</span>
                                    <input type="text" value="${escapeHtml(run.run_label || '')}" data-split-field="run_label" placeholder="例如：急件先跑、夜班接續">
                                </label>
                                <label class="inline-label">
                                    <span>分配淨重 (kg)</span>
                                    <input type="number" min="0" step="0.01" value="${escapeHtml(String(run.planned_net_weight_kg || ''))}" data-split-field="planned_net_weight_kg">
                                </label>
                                <label class="inline-label">
                                    <span>完成淨重 (kg)</span>
                                    <input type="number" min="0" step="0.01" value="${escapeHtml(String(run.completed_net_weight_kg || ''))}" data-split-field="completed_net_weight_kg">
                                </label>
                                <label class="inline-label">
                                    <span>狀態</span>
                                    <select data-split-field="status">
                                        <option value="pending"${run.status === 'pending' ? ' selected' : ''}>待排程</option>
                                        <option value="scheduled"${run.status === 'scheduled' ? ' selected' : ''}>已排程</option>
                                        <option value="in_progress"${run.status === 'in_progress' ? ' selected' : ''}>生產中</option>
                                        <option value="completed"${run.status === 'completed' ? ' selected' : ''}>已完成</option>
                                    </select>
                                </label>
                                <label class="inline-label full-width">
                                    <span>備註</span>
                                    <textarea rows="2" data-split-field="notes">${escapeHtml(run.notes || '')}</textarea>
                                </label>
                            </div>
                            <div class="split-partial-receipt-box">
                                <strong>部分入庫統計</strong>
                                <span>已入庫 ${partialReceiptNetWeight.toFixed(2)} kg，尚可入庫 ${partialReceiptRemaining.toFixed(2)} kg</span>
                                <span class="text-muted small">請使用視窗底部「部分入庫」按鈕執行入庫；拆分工單會以目前機台頁籤作為來源。</span>
                            </div>
                            <div class="form-actions align-right">
                                <button type="button" class="btn outline small" data-action="change-machine-run">
                                    <i class="fas fa-exchange-alt"></i> 更換機台
                                </button>
                                <button type="button" class="btn outline small danger" data-action="remove-machine-run">
                                    <i class="fas fa-trash"></i> 移除機台
                                </button>
                            </div>
                            </div>
                        </section>
                    </div>
                    </div>
                </section>

                <section class="subsection work-order-edit-production-records split-machine-production-records-section" data-split-collapsible-section>
                    <header class="subsection-header">
                        <div class="subsection-actions">
                            <button type="button" class="btn ghost small section-toggle-box" data-action="toggle-split-section" data-section="production" title="展開/收合"><i class="fas ${uiState.productionCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}"></i></button>
                        </div>
                        <h4>生產記錄</h4>
                    </header>
                    <div class="subsection-body${uiState.productionCollapsed ? ' hidden' : ''}" data-split-section-body="production">
                        ${productionRecordsHtml}
                    </div>
                </section>
            </div>
        `;
        updateSplitSummary(isEditMode);
    }

    function getSplitProductionRecordsHtml(run) {
        const buffers = ensureSplitRunProductionBuffers(run);
        const activeMode = run.production_record_mode === 'manual' ? 'manual' : 'preset';
        const referenceUnits = getSplitRunReferenceUnits(run);
        buffers.preset = recalculateProductionRecordCards(buffers.preset || [], referenceUnits);
        buffers.manual = recalculateProductionRecordCards(buffers.manual || [], referenceUnits);

        const buildRows = (records, mode) => {
            if (!records.length) {
                return `<tr class="empty-row"><td colspan="${mode === 'manual' ? '8' : '7'}" class="text-center text-muted">尚未建立此機台的生產履歷</td></tr>`;
            }

            return records.map((record, index) => `
                <tr data-split-production-record-row data-record-index="${index}" data-split-production-record-mode="${mode}">
                    <td><span class="readonly-cell">${escapeHtml(record.card_number || '')}</span></td>
                    <td><input type="text" value="${escapeHtml(record.tool_name || '')}" data-split-record-field="tool_name" placeholder="載具種類"></td>
                    <td><input type="number" step="0.001" min="0" value="${escapeHtml(String(record.tool_weight_kg || ''))}" data-split-record-field="tool_weight_kg" placeholder="載具重"></td>
                    <td><input type="number" step="0.01" min="0" value="${escapeHtml(String(record.weight_kg || ''))}" data-split-record-field="weight_kg" placeholder="生產重量"></td>
                    <td><input type="date" value="${escapeHtml(record.production_date || '')}" data-split-record-field="production_date"></td>
                    <td><input type="time" value="${escapeHtml(record.production_time ? String(record.production_time).substring(0, 5) : '')}" data-split-record-field="production_time"></td>
                    <td><input type="text" value="${escapeHtml(record.notes || '')}" data-split-record-field="notes" placeholder="備註"></td>
                    ${mode === 'manual' ? `
                        <td>
                            <button type="button" class="btn icon danger" data-action="remove-split-production-record" aria-label="移除生產履歷">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    ` : ''}
                </tr>
            `).join('');
        };

        return `
            <div class="split-production-record-mode-tabs work-order-production-mode-tabs">
                <button type="button" class="tab-btn${activeMode === 'preset' ? ' active' : ''}" data-action="switch-split-production-record-mode" data-mode="preset">預設</button>
                <button type="button" class="tab-btn${activeMode === 'manual' ? ' active' : ''}" data-action="switch-split-production-record-mode" data-mode="manual">自行輸入</button>
            </div>
            <div class="split-production-record-mode-panel${activeMode === 'preset' ? ' active' : ''}" data-split-production-panel="preset">
                <div class="work-order-production-mode-header">
                    <p class="text-muted small">依訂單載具預設帶入此機台的生產履歷，卡號依目前機台支數與載具列數自動分配。</p>
                    <button type="button" class="btn outline small" data-action="reset-split-production-records-preset">
                        <i class="fas fa-sync-alt"></i> 重新帶入
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="data-table compact split-production-records-table production-records-table">
                        <thead>
                            <tr>
                                <th>卡號</th>
                                <th>載具種類</th>
                                <th>載具重量(kg)</th>
                                <th>生產重量(kg)</th>
                                <th>日期</th>
                                <th>時間</th>
                                <th>備註</th>
                            </tr>
                        </thead>
                        <tbody>${buildRows(buffers.preset || [], 'preset')}</tbody>
                    </table>
                </div>
            </div>
            <div class="split-production-record-mode-panel${activeMode === 'manual' ? ' active' : ''}" data-split-production-panel="manual">
                <div class="work-order-production-mode-header">
                    <p class="text-muted small">由現場自行輸入此機台的載具種類與載具重量，卡號依目前列數自動重算。</p>
                    <button type="button" class="btn outline small" data-action="add-split-production-record">
                        <i class="fas fa-plus"></i> 新增履歷
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="data-table compact split-production-records-table production-records-table">
                        <thead>
                            <tr>
                                <th>卡號</th>
                                <th>載具種類</th>
                                <th>載具重量(kg)</th>
                                <th>生產重量(kg)</th>
                                <th>日期</th>
                                <th>時間</th>
                                <th>備註</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>${buildRows(buffers.manual || [], 'manual')}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function getSplitRunTabLabel(run, index) {
        const machineName = getMachineDisplayName(run.machine_id);
        if (machineName) {
            return machineName;
        }
        if (run.run_label && !/^機台 \d+$/.test(run.run_label)) {
            return run.run_label;
        }
        return `未選機台 ${index + 1}`;
    }

    function updateSplitSummary(isEditMode) {
        const form = isEditMode ? elements.editModalForm : elements.createModalForm;
        const panel = form?.querySelector('[data-split-work-order-panel]');
        if (!panel) return;
        const expected = getExpectedNetWeightForSplit();
        const completed = getSplitRuns(isEditMode).reduce((sum, run) => sum + (parseFloat(run.completed_net_weight_kg) || 0), 0);
        const remaining = expected - completed;
        const set = (key, value) => {
            const el = panel.querySelector(`[data-split-summary="${key}"]`);
            if (el) {
                el.textContent = `${value.toFixed(2)} kg`;
                el.classList.toggle('negative', value < -0.0001);
            }
        };
        set('expected', expected);
        set('completed', completed);
        set('remaining', remaining);
    }

    async function askMachineSelectionDialog({ title = '選擇機台', message = '請先選擇要加入拆分流程的機台。', selectedMachineId = '' } = {}) {
        return new Promise((resolve) => {
            document.querySelector('[data-machine-picker-modal]')?.remove();

            const availableMachines = state.machines;
            if (!availableMachines.length) {
                showAlert('目前沒有可選機台，請先到機台設備管理確認機台資料。', 'warning');
                resolve('');
                return;
            }

            let currentSelection = String(selectedMachineId || '');
            const machineGroupsMap = new Map();
            availableMachines.forEach((machine) => {
                const groupLabel = getMachineGroupLabel(machine);
                if (!machineGroupsMap.has(groupLabel)) {
                    machineGroupsMap.set(groupLabel, []);
                }
                machineGroupsMap.get(groupLabel).push(machine);
            });
            const groupLabels = Array.from(machineGroupsMap.keys());
            const selectedMachine = availableMachines.find((machine) => String(machine.id) === currentSelection);
            let activeGroup = selectedMachine ? getMachineGroupLabel(selectedMachine) : (groupLabels[0] || '');

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.setAttribute('data-machine-picker-modal', 'true');
            overlay.style.zIndex = '3000';
            overlay.innerHTML = `
                <div class="modal-window small" role="dialog" aria-modal="true" aria-labelledby="machine-picker-title">
                    <h3 id="machine-picker-title">${escapeHtml(title)}</h3>
                    <p class="text-muted" style="margin-bottom: 12px;">${escapeHtml(message)}</p>
                    <div class="machine-picker-layout">
                        <div class="machine-picker-groups" data-machine-picker-groups></div>
                        <div class="machine-picker-panel">
                            <div class="machine-picker-panel-header">
                                <strong data-machine-picker-group-title></strong>
                                <span class="machine-picker-panel-count" data-machine-picker-group-count></span>
                            </div>
                            <div class="machine-picker-grid" data-machine-picker-grid></div>
                        </div>
                    </div>
                    <div class="form-actions align-right" style="margin-top: 14px;">
                        <button type="button" class="btn outline" data-choice="cancel">取消</button>
                        <button type="button" class="btn primary" data-choice="confirm">確認新增</button>
                    </div>
                </div>
            `;

            const groupsContainer = overlay.querySelector('[data-machine-picker-groups]');
            const groupTitle = overlay.querySelector('[data-machine-picker-group-title]');
            const groupCount = overlay.querySelector('[data-machine-picker-group-count]');
            const grid = overlay.querySelector('[data-machine-picker-grid]');

            groupLabels.forEach((groupLabel) => {
                const groupButton = document.createElement('button');
                groupButton.type = 'button';
                groupButton.className = `machine-picker-group-btn${groupLabel === activeGroup ? ' is-active' : ''}`;
                groupButton.dataset.machineGroup = groupLabel;
                groupButton.textContent = groupLabel;
                groupsContainer?.appendChild(groupButton);
            });

            const renderMachineOptions = () => {
                if (!grid) {
                    return [];
                }
                grid.innerHTML = '';
                const machines = machineGroupsMap.get(activeGroup) || [];
                if (groupTitle) {
                    groupTitle.textContent = activeGroup || '未分類';
                }
                if (groupCount) {
                    groupCount.textContent = `${machines.length} 台`;
                }

                machines.forEach((machine) => {
                    const machineId = String(machine.id);
                    const capability = getMachineGroupLabel(machine);
                    const optionButton = document.createElement('button');
                    optionButton.type = 'button';
                    optionButton.className = `machine-picker-option${currentSelection === machineId ? ' is-selected' : ''}`;
                    optionButton.dataset.machineOption = machineId;

                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'machine-picker-option-name';
                    nameSpan.textContent = getMachineDisplayName(machine.id);

                    const metaSpan = document.createElement('span');
                    metaSpan.className = 'machine-picker-option-meta';
                    metaSpan.textContent = capability || `機台 ID: ${machineId}`;

                    optionButton.appendChild(nameSpan);
                    optionButton.appendChild(metaSpan);
                    grid.appendChild(optionButton);
                });

                return Array.from(grid.querySelectorAll('[data-machine-option]'));
            };

            const syncGroupState = () => {
                groupsContainer?.querySelectorAll('[data-machine-group]').forEach((button) => {
                    button.classList.toggle('is-active', button.dataset.machineGroup === activeGroup);
                });
            };

            let options = renderMachineOptions();

            const cleanup = (value) => {
                document.removeEventListener('keydown', handleKeydown);
                overlay.remove();
                resolve(value);
            };

            const handleKeydown = (event) => {
                if (event.key === 'Escape') {
                    cleanup('');
                }
            };

            overlay.addEventListener('click', (event) => {
                const button = event.target.closest('[data-choice]');
                if (!button) {
                    return;
                }
                if (button.dataset.choice === 'cancel') {
                    cleanup('');
                    return;
                }
                if (!currentSelection) {
                    showAlert('請先選擇機台設備。', 'warning');
                    return;
                }
                cleanup(currentSelection);
                return;
            });

            overlay.addEventListener('click', (event) => {
                const groupButton = event.target.closest('[data-machine-group]');
                if (groupButton) {
                    activeGroup = String(groupButton.dataset.machineGroup || '');
                    syncGroupState();
                    options = renderMachineOptions();
                    return;
                }

                const option = event.target.closest('[data-machine-option]');
                if (!option) {
                    return;
                }
                currentSelection = String(option.dataset.machineOption || '');
                options = renderMachineOptions();
            });

            document.addEventListener('keydown', handleKeydown);
            document.body.appendChild(overlay);
            syncGroupState();
            options[0]?.focus();
        });
    }

    async function openPrimaryMachinePicker(form) {
        if (!form) {
            return;
        }
        const activeField = document.activeElement?.closest('[data-primary-machine-field]')
            || form.querySelector('[data-primary-machine-field]:not(.hidden)');
        const select = activeField?.querySelector('select[name="machine_id"]');
        if (!select || select.disabled) {
            return;
        }

        const selectedMachineId = await askMachineSelectionDialog({
            title: '選擇指定機台',
            message: '請從機台設備清單中選擇要指派的機台，清單以二欄顯示方便快速挑選。',
            selectedMachineId: select.value || ''
        });

        if (!selectedMachineId || String(select.value || '') === String(selectedMachineId)) {
            return;
        }

        select.value = String(selectedMachineId);
        select.dispatchEvent(new Event('change', { bubbles: true }));
        syncMachinePickerFields(form);
    }

    async function handleSplitMachineAction(event, isEditMode) {
        const actionEl = event.target.closest('[data-action]');
        if (!actionEl) return;
        const form = isEditMode ? elements.editModalForm : elements.createModalForm;
        const panel = form?.querySelector('[data-split-work-order-panel]');
        if (!panel || !panel.contains(actionEl)) return;

        const runs = getSplitRuns(isEditMode);
            if (actionEl.dataset.action === 'add-machine-run') {
                const selectedMachineId = await askMachineSelectionDialog({
                    title: '新增拆分機台',
                    message: '請從機台設備管理清單選擇要加入的機台。',
                    selectedMachineId: ''
                });
            if (!selectedMachineId) {
                return;
            }
            const run = createEmptyMachineRun(runs.length);
            run.machine_id = selectedMachineId;
            runs.push(run);
            panel.dataset.activeRunIndex = String(runs.length - 1);
            renderSplitMachineRuns(isEditMode);
            return;
        }

            if (actionEl.dataset.action === 'change-machine-run') {
            const activeIndex = parseInt(panel.dataset.activeRunIndex || '0', 10) || 0;
            const run = runs[activeIndex];
            if (!run) return;
                const selectedMachineId = await askMachineSelectionDialog({
                    title: '更換拆分機台',
                    message: '請從機台設備管理清單選擇此頁籤要對應的機台。',
                    selectedMachineId: run.machine_id || ''
                });
            if (!selectedMachineId) {
                return;
            }
            run.machine_id = selectedMachineId;
            ensureSplitRunProductionBuffers(run);
            ['preset', 'manual'].forEach((mode) => {
                run.production_record_buffers[mode] = (run.production_record_buffers[mode] || []).map((record) => ({
                    ...record,
                    machine_id: selectedMachineId,
                    machine_type: getMachineCapabilityName(selectedMachineId) || ''
                }));
            });
            renderSplitMachineRuns(isEditMode);
            return;
        }

        if (actionEl.dataset.action === 'toggle-split-section') {
            const activeIndex = parseInt(panel.dataset.activeRunIndex || '0', 10) || 0;
            const run = runs[activeIndex];
            if (!run) return;
            const uiState = ensureSplitRunUiState(run);
            const section = String(actionEl.dataset.section || '');

            if (section === 'schedule') {
                uiState.scheduleCollapsed = !uiState.scheduleCollapsed;
            } else if (section === 'inspection') {
                uiState.inspectionCollapsed = !uiState.inspectionCollapsed;
            } else if (section === 'production') {
                uiState.productionCollapsed = !uiState.productionCollapsed;
            } else {
                return;
            }

            renderSplitMachineRuns(isEditMode);
            return;
        }

        if (actionEl.dataset.action === 'select-machine-run') {
            panel.dataset.activeRunIndex = String(parseInt(actionEl.dataset.runIndex || '0', 10) || 0);
            renderSplitMachineRuns(isEditMode);
            return;
        }

        if (actionEl.dataset.action === 'switch-split-production-record-mode') {
            const activeIndex = parseInt(panel.dataset.activeRunIndex || '0', 10) || 0;
            const run = runs[activeIndex];
            if (!run) return;
            ensureSplitRunProductionBuffers(run);
            run.production_record_mode = actionEl.dataset.mode === 'manual' ? 'manual' : 'preset';
            renderSplitMachineRuns(isEditMode);
            updateMetricsPanel(isEditMode);
            return;
        }

        if (actionEl.dataset.action === 'reset-split-production-records-preset') {
            const activeIndex = parseInt(panel.dataset.activeRunIndex || '0', 10) || 0;
            const run = runs[activeIndex];
            if (!run) return;
            ensureSplitRunProductionBuffers(run);
            run.production_record_buffers.preset = buildPresetProductionRecordsFromOrder(state.orderItemDetails, getSplitRunReferenceUnits(run));
            run.production_record_mode = 'preset';
            renderSplitMachineRuns(isEditMode);
            updateMetricsPanel(isEditMode);
            return;
        }

        if (actionEl.dataset.action === 'add-split-production-record') {
            const activeIndex = parseInt(panel.dataset.activeRunIndex || '0', 10) || 0;
            const run = runs[activeIndex];
            if (!run) return;
            ensureSplitRunProductionBuffers(run);
            run.production_record_mode = 'manual';
            run.production_record_buffers.manual.push(createEmptySplitProductionRecord(run));
            run.production_record_buffers.manual = recalculateProductionRecordCards(run.production_record_buffers.manual, getSplitRunReferenceUnits(run));
            renderSplitMachineRuns(isEditMode);
            updateMetricsPanel(isEditMode);
            return;
        }

        if (actionEl.dataset.action === 'remove-split-production-record') {
            const activeIndex = parseInt(panel.dataset.activeRunIndex || '0', 10) || 0;
            const recordRow = actionEl.closest('[data-split-production-record-row]');
            const recordIndex = parseInt(recordRow?.dataset.recordIndex || '-1', 10);
            const run = runs[activeIndex];
            if (!run || recordIndex < 0) return;
            ensureSplitRunProductionBuffers(run);
            run.production_record_buffers.manual.splice(recordIndex, 1);
            run.production_record_buffers.manual = recalculateProductionRecordCards(run.production_record_buffers.manual, getSplitRunReferenceUnits(run));
            renderSplitMachineRuns(isEditMode);
            updateMetricsPanel(isEditMode);
            return;
        }

        if (actionEl.dataset.action === 'remove-machine-run') {
            const activeIndex = parseInt(panel.dataset.activeRunIndex || '0', 10) || 0;
            runs.splice(activeIndex, 1);
            runs.forEach((run, index) => {
                if (!run.run_label || /^機台 \d+$/.test(run.run_label)) {
                    run.run_label = '';
                }
            });
            panel.dataset.activeRunIndex = String(Math.max(0, activeIndex - 1));
            renderSplitMachineRuns(isEditMode);
        }
    }

    function handleSplitMachineInput(event, isEditMode) {
        const recordField = event.target.closest('[data-split-record-field]');
        if (recordField) {
            const form = isEditMode ? elements.editModalForm : elements.createModalForm;
            const panel = form?.querySelector('[data-split-work-order-panel]');
            if (!panel || !panel.contains(recordField)) return;
            const activeIndex = parseInt(panel.dataset.activeRunIndex || '0', 10) || 0;
            const recordRow = recordField.closest('[data-split-production-record-row]');
            const recordIndex = parseInt(recordRow?.dataset.recordIndex || '-1', 10);
            const run = getSplitRuns(isEditMode)[activeIndex];
            if (!run || recordIndex < 0) return;
            ensureSplitRunProductionBuffers(run);
            const mode = recordRow?.dataset.splitProductionRecordMode === 'manual' ? 'manual' : 'preset';
            const targetRecords = run.production_record_buffers[mode] || [];
            if (!targetRecords[recordIndex]) return;
            targetRecords[recordIndex][recordField.dataset.splitRecordField] = recordField.value;
            targetRecords[recordIndex].machine_id = run.machine_id || '';
            targetRecords[recordIndex].machine_type = getMachineCapabilityName(run.machine_id || '') || '';
            if (recordField.dataset.splitRecordField === 'weight_kg' || recordField.dataset.splitRecordField === 'tool_weight_kg') {
                updateMetricsPanel(isEditMode);
            }
            return;
        }

        const field = event.target.closest('[data-split-field]');
        if (!field) return;
        const form = isEditMode ? elements.editModalForm : elements.createModalForm;
        const panel = form?.querySelector('[data-split-work-order-panel]');
        if (!panel || !panel.contains(field)) return;

        const activeIndex = parseInt(panel.dataset.activeRunIndex || '0', 10) || 0;
        const runs = getSplitRuns(isEditMode);
        const run = runs[activeIndex];
        if (!run) return;

        const fieldName = field.dataset.splitField;
        if (fieldName === 'defect_quantity') {
            const defectIndex = parseInt(field.dataset.defectIndex || '0', 10) || 0;
            if (run.defects && run.defects[defectIndex]) {
                run.defects[defectIndex].defect_quantity = field.value;
            }
        } else if (fieldName === 'defect_notes') {
            const defectIndex = parseInt(field.dataset.defectIndex || '0', 10) || 0;
            if (run.defects && run.defects[defectIndex]) {
                run.defects[defectIndex].notes = field.value;
            }
        } else {
            run[fieldName] = field.value;
            if (fieldName === 'planned_net_weight_kg' || fieldName === 'completed_net_weight_kg') {
                const unitWeight = parseFloat(run.weight_per_unit_g || state.orderItemDetails?.weight_per_unit_g || 0) || 0;
                run.planned_units = unitWeight > 0 ? Math.round(((parseFloat(run.planned_net_weight_kg) || 0) * 1000 / unitWeight) * 100) / 100 : 0;
                run.completed_units = unitWeight > 0 ? Math.round(((parseFloat(run.completed_net_weight_kg) || 0) * 1000 / unitWeight) * 100) / 100 : 0;
                ensureSplitRunProductionBuffers(run);
                const referenceUnits = getSplitRunReferenceUnits(run);
                run.production_record_buffers.preset = recalculateProductionRecordCards(run.production_record_buffers.preset, referenceUnits);
                run.production_record_buffers.manual = recalculateProductionRecordCards(run.production_record_buffers.manual, referenceUnits);
            }
            if (fieldName === 'run_label' || fieldName === 'machine_id') {
                renderSplitMachineRuns(isEditMode);
                return;
            }
        }
        updateSplitSummary(isEditMode);
    }

    function normalizeMachineRunsFromApi(machineRuns = []) {
        return machineRuns.map((run, index) => ({
            id: run.id || '',
            run_label: run.run_label || '',
            machine_id: run.machine_id || '',
            scheduled_start_date: toDateTimeLocalValue(run.scheduled_start_date || ''),
            scheduled_end_date: toDateTimeLocalValue(run.scheduled_end_date || ''),
            actual_start_date: toDateTimeLocalValue(run.actual_start_date || ''),
            actual_end_date: toDateTimeLocalValue(run.actual_end_date || ''),
            assigned_employee_id: run.assigned_employee_id || '',
            calibration_employee_id: run.calibration_employee_id || '',
            quantity_to_produce: run.quantity_to_produce || '',
            screening_speed: run.screening_speed || '',
            planned_net_weight_kg: run.planned_net_weight_kg || '',
            completed_net_weight_kg: run.completed_net_weight_kg || '',
            weight_per_unit_g: run.weight_per_unit_g || state.orderItemDetails?.weight_per_unit_g || '',
            status: run.status || 'pending',
            notes: run.notes || '',
            partial_receipt_count: run.partial_receipt_count || 0,
            partial_receipt_net_weight_kg: run.partial_receipt_net_weight_kg || 0,
            partial_receipt_units: run.partial_receipt_units || 0,
            production_record_mode: Array.isArray(run.production_records) && run.production_records[0]?.production_source_mode === 'manual' ? 'manual' : 'preset',
            production_record_buffers: null,
            production_records: Array.isArray(run.production_records) ? run.production_records.map((record) => cloneProductionRecord(record)) : [],
            defects: buildMachineRunDefects(run.defects || []),
            split_ui_state: {
                scheduleCollapsed: false,
                inspectionCollapsed: false,
                productionCollapsed: false
            }
        }));
    }

    function collectSplitMachineRuns(isEditMode) {
        return getSplitRuns(isEditMode).map((run, index) => ({
            run_label: run.run_label || '',
            machine_id: run.machine_id || null,
            scheduled_start_date: run.scheduled_start_date || null,
            scheduled_end_date: run.scheduled_end_date || null,
            actual_start_date: run.actual_start_date || null,
            actual_end_date: run.actual_end_date || null,
            assigned_employee_id: run.assigned_employee_id === '' ? null : run.assigned_employee_id,
            calibration_employee_id: run.calibration_employee_id === '' ? null : run.calibration_employee_id,
            quantity_to_produce: run.quantity_to_produce === '' ? null : run.quantity_to_produce,
            screening_speed: run.screening_speed || '',
            planned_net_weight_kg: run.planned_net_weight_kg || 0,
            completed_net_weight_kg: run.completed_net_weight_kg || 0,
            weight_per_unit_g: run.weight_per_unit_g || state.orderItemDetails?.weight_per_unit_g || 0,
            status: run.status || 'pending',
            notes: run.notes || '',
            production_records: (((ensureSplitRunProductionBuffers(run), run.production_record_buffers?.[run.production_record_mode === 'manual' ? 'manual' : 'preset']) || []))
                .filter(record => hasSubmittedValue(record.card_number)
                    && ['weight_kg', 'production_date', 'production_time', 'tool_name', 'tool_weight_kg', 'notes'].some(field => hasSubmittedValue(record[field])))
                .map(record => ({
                    card_number: record.card_number || '',
                    tool_name: record.tool_name || '',
                    tool_weight_kg: record.tool_weight_kg || null,
                    weight_kg: record.weight_kg || null,
                    production_date: record.production_date || null,
                    production_time: record.production_time || null,
                    machine_id: run.machine_id || null,
                    notes: record.notes || null,
                    production_source_mode: run.production_record_mode === 'manual' ? 'manual' : 'preset'
                })),
            defects: (run.defects || []).map(defect => ({
                screening_service_id: defect.screening_service_id,
                defect_quantity: defect.defect_quantity === '' || defect.defect_quantity === null ? '' : parseInt(defect.defect_quantity, 10)
            }))
        }));
    }

    function validateSplitMachineRunsBeforeSubmit(isEditMode) {
        const runs = collectSplitMachineRuns(isEditMode);
        if (runs.length === 0) {
            return '請先使用「選擇機台新增」加入至少 1 台實際機台。';
        }
        const expected = getExpectedNetWeightForSplit();
        const completed = runs.reduce((sum, run) => sum + (parseFloat(run.completed_net_weight_kg) || 0), 0);
        if (completed - expected > 0.0001) {
            return `機台完成淨重合計 ${completed.toFixed(2)} kg 已超過主工單預期淨重 ${expected.toFixed(2)} kg。`;
        }
        for (const run of runs) {
            if (!run.machine_id) {
                return '拆分工單每個機台頁籤都必須從機台資料表選擇實際機台，不可留下未選機台。';
            }
            for (const defect of run.defects || []) {
                if (defect.defect_quantity === '' || Number.isNaN(defect.defect_quantity) || defect.defect_quantity < 0) {
                    return '拆分工單每個不良項目都必須填 0 或正整數。';
                }
            }
        }
        return '';
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
        moduleRoot.addEventListener('module:before-close', (event) => {
            if (!hasAnyUnsavedWorkOrderChanges()) {
                return;
            }

            if (!confirmDiscardUnsavedWorkOrderChanges()) {
                event.preventDefault();
            }
        });

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
            const sourceSection = elements.createModalForm.querySelector('[data-source-selection-section]');
            const sourceTabBtns = sourceSection ? sourceSection.querySelectorAll('.tab-btn[data-tab]') : [];
            sourceTabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    setCreateSourceTab(btn.dataset.tab || 'cascade');
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
                handleSplitMachineInput(e, false);
            });

            elements.createModalForm.addEventListener('change', (e) => {
                if (e.target.matches('[name="pr_machine_id[]"], [data-field="pr-machine"]')) {
                    syncProductionRecordMachineCapability(e.target);
                }
                syncMachinePickerField(e.target.closest('[data-primary-machine-field]'));
                handleSplitMachineInput(e, false);
            });

            elements.createModalForm.addEventListener('click', async (e) => {
                const machinePickerButton = e.target.closest('[data-action="open-machine-picker"]');
                if (machinePickerButton) {
                    await openPrimaryMachinePicker(elements.createModalForm);
                    return;
                }
                const executionImagesToggleButton = e.target.closest('[data-action="toggle-execution-images-section"]');
                if (executionImagesToggleButton) {
                    toggleSectionBody(executionImagesToggleButton, elements.createModalForm.querySelector('[data-create-execution-images-section]'));
                    return;
                }
                const preProductionImagesToggleButton = e.target.closest('[data-action="toggle-pre-production-images-section"]');
                if (preProductionImagesToggleButton) {
                    toggleSectionBody(preProductionImagesToggleButton, elements.createModalForm.querySelector('[data-create-pre-production-images-section]'));
                    return;
                }
                const scheduleToggleButton = e.target.closest('[data-action="toggle-schedule-section"]');
                if (scheduleToggleButton) {
                    toggleSectionBody(scheduleToggleButton, elements.createModalForm.querySelector('[data-create-schedule-section]'));
                    return;
                }
                const productionRecordsToggleButton = e.target.closest('[data-action="toggle-production-records-section"]');
                if (productionRecordsToggleButton) {
                    toggleSectionBody(productionRecordsToggleButton, elements.createModalForm.querySelector('[data-create-production-records-section]'));
                    return;
                }
                const typeSwitchButton = e.target.closest('[data-action="set-work-order-type"]');
                if (typeSwitchButton) {
                    setWorkOrderType(elements.createModalForm, typeSwitchButton.dataset.value || 'normal');
                    return;
                }
                await handleSplitMachineAction(e, false);
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
                    syncProductionRecordBufferFromForm(true);
                    const totalUnitsValue = editTotalUnitsInput.value || state.orderItemDetails?.total_units || 0;
                    state.productionRecordBuffers.edit.preset = recalculateProductionRecordCards(state.productionRecordBuffers.edit.preset, totalUnitsValue);
                    state.productionRecordBuffers.edit.manual = recalculateProductionRecordCards(state.productionRecordBuffers.edit.manual, totalUnitsValue);
                    renderProductionRecordEditor(true);
                    updateMetricsPanel(true);
                });
            }

            const editStatusSelect = elements.editModalForm.querySelector('[name="status_lookup_id"]');
            if (editStatusSelect) {
                editStatusSelect.addEventListener('change', syncEditStatusDisplay);
            }

            // 事件委派: 監聽動態生成的篩分服務缺陷數量輸入 (編輯模式)
            elements.editModalForm.addEventListener('input', (e) => {
                if (e.target.name && e.target.name.startsWith('defect_quantity_')) {
                    updateMetricsPanel(true);
                }
                // 監聽生產紀錄重量輸入變化
                if (e.target.name === 'pr_weight_kg[]' || e.target.name === 'pr_tool_weight_kg[]') {
                    updateMetricsPanel(true);
                }
                handleSplitMachineInput(e, true);
            });

            elements.editModalForm.addEventListener('change', (e) => {
                if (e.target.matches('[data-field="drawing-file"]')) {
                    const file = e.target.files?.[0];
                    const row = e.target.closest('.drawing-row');
                    if (file && row) {
                        if (file.size > 10 * 1024 * 1024) {
                            showModalAlert('error', '圖面檔案大小不能超過 10MB。', false, true);
                            e.target.value = '';
                            return;
                        }
                        row.fileObject = file;
                        row.previewUrl = URL.createObjectURL(file);
                        row.querySelector('[data-field="drawing-size"]').textContent = formatFileSize(file.size);
                        row.querySelector('[data-field="drawing-time"]').textContent = new Date().toLocaleString('zh-TW');
                        row.children[4].innerHTML = '<button type="button" class="btn ghost icon-only" data-action="preview-order-drawing" title="預覽"><i class="fas fa-eye"></i></button>';
                    }
                }
                syncMachinePickerField(e.target.closest('[data-primary-machine-field]'));
                handleSplitMachineInput(e, true);
            });

            elements.editModalForm.addEventListener('click', async (e) => {
                const machinePickerButton = e.target.closest('[data-action="open-machine-picker"]');
                if (machinePickerButton) {
                    await openPrimaryMachinePicker(elements.editModalForm);
                    return;
                }
                const typeSwitchButton = e.target.closest('[data-action="set-work-order-type"]');
                if (typeSwitchButton) {
                    setWorkOrderType(elements.editModalForm, typeSwitchButton.dataset.value || 'normal');
                    return;
                }
                const serviceToggleButton = e.target.closest('[data-action="toggle-service-section"]');
                if (serviceToggleButton) {
                    toggleSectionBody(serviceToggleButton, elements.editModalForm.querySelector('[data-edit-service-section]'));
                    return;
                }
                const detailToggleButton = e.target.closest('[data-action="toggle-detail-section"]');
                if (detailToggleButton) {
                    toggleSectionBody(detailToggleButton, elements.editModalForm.querySelector('[data-edit-detail-section]'));
                    return;
                }
                const scheduleToggleButton = e.target.closest('[data-action="toggle-schedule-section"]');
                if (scheduleToggleButton) {
                    toggleSectionBody(scheduleToggleButton, elements.editModalForm.querySelector('[data-edit-schedule-section]'));
                    return;
                }
                const partialHistoryToggleButton = e.target.closest('[data-action="toggle-partial-history-section"]');
                if (partialHistoryToggleButton) {
                    toggleSectionBody(partialHistoryToggleButton, elements.editModalForm.querySelector('[data-work-order-partial-history-section]'));
                    return;
                }
                const inspectionToggleButton = e.target.closest('[data-action="toggle-inspection-section"]');
                if (inspectionToggleButton) {
                    toggleSectionBody(inspectionToggleButton, elements.editModalForm.querySelector('[data-edit-inspection-section]'));
                    return;
                }
                const executionImagesToggleButton = e.target.closest('[data-action="toggle-execution-images-section"]');
                if (executionImagesToggleButton) {
                    toggleSectionBody(executionImagesToggleButton, elements.editModalForm.querySelector('[data-edit-execution-images-section]'));
                    return;
                }
                const preProductionImagesToggleButton = e.target.closest('[data-action="toggle-pre-production-images-section"]');
                if (preProductionImagesToggleButton) {
                    toggleSectionBody(preProductionImagesToggleButton, elements.editModalForm.querySelector('[data-edit-pre-production-images-section]'));
                    return;
                }
                const preProductionImageButton = e.target.closest('[data-action="add-pre-production-image"]');
                if (preProductionImageButton) {
                    await handleAddPreProductionImage();
                    return;
                }
                const productionRecordsToggleButton = e.target.closest('[data-action="toggle-production-records-section"]');
                if (productionRecordsToggleButton) {
                    toggleSectionBody(productionRecordsToggleButton, elements.editModalForm.querySelector('[data-edit-production-records-section]'));
                    return;
                }
                const productionModeButton = e.target.closest('[data-action="switch-production-record-mode"]');
                if (productionModeButton) {
                    setProductionRecordMode(true, productionModeButton.dataset.mode || 'preset');
                    return;
                }
                if (e.target.closest('[data-action="reset-production-records-preset"]')) {
                    state.productionRecordBuffers.edit.preset = buildPresetProductionRecordsFromOrder(
                        state.orderItemDetails,
                        elements.editModalForm.querySelector('[name="total_units"]')?.value || state.orderItemDetails?.total_units || 0
                    );
                    renderProductionRecordEditor(true);
                    updateMetricsPanel(true);
                    return;
                }
                if (e.target.closest('[data-action="add-manual-production-record"]')) {
                    syncProductionRecordBufferFromForm(true);
                    const totalUnits = elements.editModalForm.querySelector('[name="total_units"]')?.value || state.orderItemDetails?.total_units || 0;
                    state.productionRecordBuffers.edit.manual.push(cloneProductionRecord({
                        production_source_mode: 'manual'
                    }));
                    state.productionRecordBuffers.edit.manual = recalculateProductionRecordCards(state.productionRecordBuffers.edit.manual, totalUnits);
                    state.productionRecordModes.edit = 'manual';
                    renderProductionRecordEditor(true);
                    updateMetricsPanel(true);
                    return;
                }
                if (e.target.closest('[data-action="remove-manual-production-record"]')) {
                    syncProductionRecordBufferFromForm(true);
                    const row = e.target.closest('.production-record-row');
                    const tbody = row?.closest('tbody');
                    const rows = tbody ? Array.from(tbody.querySelectorAll('.production-record-row')) : [];
                    const index = rows.indexOf(row);
                    if (index >= 0) {
                        state.productionRecordBuffers.edit.manual.splice(index, 1);
                        state.productionRecordBuffers.edit.manual = recalculateProductionRecordCards(
                            state.productionRecordBuffers.edit.manual,
                            elements.editModalForm.querySelector('[name="total_units"]')?.value || state.orderItemDetails?.total_units || 0
                        );
                        renderProductionRecordEditor(true);
                        updateMetricsPanel(true);
                    }
                    return;
                }
                const previewOrderDrawingButton = e.target.closest('[data-action="preview-order-drawing"]');
                if (previewOrderDrawingButton) {
                    const row = previewOrderDrawingButton.closest('.drawing-row');
                    const filePath = row?.previewUrl || row?.dataset.filePath;
                    if (filePath) {
                        window.open(filePath, '_blank');
                    }
                    return;
                }
                if (e.target.closest('[data-action="add-order-drawing"]')) {
                    addOrderDrawingRow();
                    return;
                }
                const removeDrawingButton = e.target.closest('[data-action="remove-order-drawing"]');
                if (removeDrawingButton) {
                    const row = removeDrawingButton.closest('.drawing-row');
                    if (row?.dataset.drawingId) state.deletedOrderDrawingIds.push(Number(row.dataset.drawingId));
                    if (row?.previewUrl) URL.revokeObjectURL(row.previewUrl);
                    row?.remove();
                    if (!elements.editOrderDrawingsRows.querySelector('.drawing-row')) {
                        elements.editOrderDrawingsRows.innerHTML = '<tr class="empty-row"><td colspan="6" class="text-center">尚未上傳圖面</td></tr>';
                    }
                    return;
                }
                if (e.target.closest('[data-action="create-work-order-partial-receipt"]')) {
                    const partialReceiptButton = e.target.closest('[data-action="create-work-order-partial-receipt"]');
                    const lockMessage = partialReceiptButton?.dataset.lockMessage || '';
                    if (partialReceiptButton?.getAttribute('aria-disabled') === 'true' && lockMessage) {
                        showModalAlert('error', lockMessage, false, true);
                        return;
                    }
                    await createPartialReceiptForWorkOrder();
                    return;
                }
                const secondScreeningSummaryButton = e.target.closest('[data-action="open-second-screening-summary"]');
                if (secondScreeningSummaryButton) {
                    openSecondScreeningFromEditSummary(secondScreeningSummaryButton);
                    return;
                }
                if (e.target.closest('[data-action="cancel-inline-second-screening"]')) {
                    renderEditSecondScreeningSummary(state.currentWorkOrder || {});
                    return;
                }
                const submitInlineSecondScreeningButton = e.target.closest('[data-action="submit-inline-second-screening"]');
                if (submitInlineSecondScreeningButton) {
                    await submitInlineSecondScreening(submitInlineSecondScreeningButton);
                    return;
                }
                if (e.target.closest('[data-action="view-partial-receipt-inventory"]')) {
                    openInventoryItemDetail(e.target.closest('[data-action="view-partial-receipt-inventory"]')?.dataset.inventoryId);
                    return;
                }
                if (e.target.closest('[data-action="view-partial-receipt-shipping"]')) {
                    openShippingOrderDetail(e.target.closest('[data-action="view-partial-receipt-shipping"]')?.dataset.shippingOrderId);
                    return;
                }
                if (e.target.closest('[data-action="reverse-work-order-partial-receipt"]')) {
                    await openReversePartialReceiptModal(e.target.closest('[data-action="reverse-work-order-partial-receipt"]')?.dataset.partialReceiptId);
                    return;
                }
                await handleSplitMachineAction(e, true);
            });

            elements.editModalForm.addEventListener('change', (e) => {
                if (e.target.matches('[name="pr_machine_id[]"], [data-field="pr-machine"]')) {
                    syncProductionRecordMachineCapability(e.target);
                }
                syncMachinePickerField(e.target.closest('[data-primary-machine-field]'));
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

        if (elements.partialReceiptForm && elements.partialReceiptModal) {
            elements.partialReceiptForm.addEventListener('submit', handlePartialReceiptSubmit);
            elements.partialReceiptForm.addEventListener('change', handlePartialReceiptFormMutation);
            elements.partialReceiptForm.addEventListener('input', handlePartialReceiptFormMutation);
            elements.partialReceiptModal.addEventListener('click', (event) => {
                if (event.target === elements.partialReceiptModal || event.target.closest('[data-action="close-partial-receipt-modal"]')) {
                    closePartialReceiptModal();
                }
            });
        }
        if (elements.completionForm && elements.completionModal) {
            elements.completionForm.addEventListener('submit', handleCompletionModalSubmit);
            elements.completionModal.addEventListener('click', (event) => {
                if (event.target === elements.completionModal || event.target.closest('[data-action="close-work-order-completion-modal"]')) {
                    closeCompletionModal(null);
                }
            });
        }
        if (elements.reversePartialForm && elements.reversePartialModal) {
            elements.reversePartialForm.addEventListener('submit', handleReversePartialReceiptSubmit);
            elements.reversePartialModal.addEventListener('click', (event) => {
                if (event.target === elements.reversePartialModal || event.target.closest('[data-action="close-work-order-reverse-partial-modal"]')) {
                    closeReversePartialModal();
                }
            });
        }
        if (elements.editCompletionImagesRows) {
            elements.editCompletionImagesRows.addEventListener('click', handleImageAction);
        }
        if (elements.editPreProductionImagesRows) {
            elements.editPreProductionImagesRows.addEventListener('click', handleImageAction);
        }
        if (elements.editDefectImagesRows) {
            elements.editDefectImagesRows.addEventListener('click', handleImageAction);
        }
        if (elements.editToolConditionImagesRows) {
            elements.editToolConditionImagesRows.addEventListener('click', handleImageAction);
        }
        moduleRoot.querySelectorAll('[data-action="switch-execution-image-tab"]').forEach((button) => {
            button.addEventListener('click', () => {
                switchExecutionImageTab(button.getAttribute('data-image-tab') || 'completion', button);
            });
        });
        moduleRoot.querySelectorAll('[data-action="switch-screening-stage"]').forEach((button) => {
            button.addEventListener('click', () => {
                switchScreeningStage(button.getAttribute('data-screening-stage') || 'primary', button);
            });
        });
        if (elements.mobileQuickEntryOpenButton) {
            elements.mobileQuickEntryOpenButton.addEventListener('click', openMobileQuickEntry);
        }
        if (elements.mobileQuickEntryCopyButton) {
            elements.mobileQuickEntryCopyButton.addEventListener('click', () => {
                copyMobileQuickEntry();
            });
        }
        document.addEventListener('click', (event) => {
            if (!moduleRoot.contains(event.target) || !event.target.closest('.searchable-select')) {
                closeSearchableSelects();
            }
        });

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

        moduleRoot.addEventListener('change', (event) => {
            if (event.target.matches('[data-field="pr-machine"]')) {
                syncProductionRecordMachineCapability(event.target);
            }
        });

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
            const response = await fetch('api/machines/index.php?perPage=100');
            const result = await response.json();
            if (result.success) {
                state.machines = result.data;
                populateSelect('[name="machine_id"]', result.data, 'id', 'name');
                populateSelect('[data-field="pr-machine"]', result.data, 'id', 'name');
                moduleRoot.querySelectorAll('[name="pr_machine_id[]"], [data-field="pr-machine"]').forEach(syncProductionRecordMachineCapability);
                syncMachinePickerFields();
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
                state.employees = result.data || [];
                populateSelect('[name="assigned_employee_id"]', result.data, 'id', 'name');
                populateSelect('[name="calibration_employee_id"]', result.data, 'id', 'name');
                populateSelect('[name="fp_measured_by_employee_id"]', result.data, 'id', 'name');
                renderSplitMachineRuns(false);
                renderSplitMachineRuns(true);
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

            const rawText = await response.text();
            let result = null;
            try {
                result = JSON.parse(rawText);
            } catch (parseError) {
                console.error('Save work order response is not valid JSON:', rawText);
                showModalAlert('error', `儲存失敗：伺服器回應格式異常（HTTP ${response.status}）。`, false, isEditMode);
                return;
            }

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
                    closeEditModal(true);
                } else {
                    closeCreateModal(true);
                }
                loadWorkOrders();
            } else {
                let errorMessage = result.message || '儲存失敗';
                if (result.error) {
                    errorMessage += `: ${result.error}`;
                }
                if (!response.ok) {
                    errorMessage = `${errorMessage}（HTTP ${response.status}）`;
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
                    <h3 id="work-order-choice-title">${escapeHtml(title)}</h3>
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

    async function checkWorkflowDelete(moduleName, id) {
        const response = await fetch(`api/workflow_guard/check.php?module=${encodeURIComponent(moduleName)}&action=delete&id=${encodeURIComponent(id)}`, {
            credentials: 'include'
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || '流程檢查失敗');
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
        return window.confirm(buildWorkflowConfirmMessage(assessment, fallbackMessage));
    }

    async function deleteWorkOrder(id) {
        let assessment;
        try {
            assessment = await checkWorkflowDelete('work_orders', id);
        } catch (error) {
            showAlert(error.message || '流程檢查失敗', 'error');
            return;
        }

        if (!assessment.allowed) {
            await confirmWorkflowDelete(assessment, '此工單目前不可刪除。');
            return;
        }

        const confirmed = await confirmWorkflowDelete(assessment, '確定要刪除此工單嗎?');
        if (!confirmed) return;

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

    function openInventoryItemDetail(inventoryItemId) {
        const normalizedId = Number.parseInt(inventoryItemId, 10) || 0;
        if (normalizedId <= 0) {
            showModalAlert('error', '找不到對應的庫存項目。', false, true);
            return;
        }
        if (typeof window.openTab !== 'function') {
            showModalAlert('error', '無法切換到庫存項目模組，請檢查系統設定。', false, true);
            return;
        }
        window.openTab('inventory_items', '庫存項目', 'modules/inventory_items.html', {
            context: {
                inventoryItemId: normalizedId
            }
        });
    }

    function openShippingOrderDetail(shippingOrderId) {
        const normalizedId = Number.parseInt(shippingOrderId, 10) || 0;
        if (normalizedId <= 0) {
            showModalAlert('error', '找不到對應的出貨單。', false, true);
            return;
        }
        if (typeof window.openTab !== 'function') {
            showModalAlert('error', '無法切換到出貨單模組，請檢查系統設定。', false, true);
            return;
        }
        window.openTab('shipping_orders', '出貨管理', 'modules/shipping_orders.html', {
            context: {
                shippingOrderId: normalizedId
            }
        });
    }

    function renderWorkOrderCustomerToolAnalysis(workOrder) {
        const container = elements.customerToolAnalysis;
        if (!container) {
            return;
        }

        const analysis = workOrder?.customer_tool_analysis || null;
        const toolDetails = Array.isArray(workOrder?.tool_details) ? workOrder.tool_details : [];
        const partialReceipts = Array.isArray(workOrder?.partial_receipts) ? workOrder.partial_receipts : [];

        if (!analysis) {
            container.classList.add('text-muted');
            container.innerHTML = '尚無客戶載具分析資料。';
            return;
        }

        const outstandingRecords = Array.isArray(analysis.outstanding_records)
            ? analysis.outstanding_records.filter((record) =>
                Number(record.incoming_quantity || 0) > 0 || Number(record.returned_quantity || 0) > 0
            )
            : [];

        container.classList.remove('text-muted');
        container.innerHTML = `
            <div class="detail-grid" style="margin-bottom: 0.75rem;">
                <div class="detail-item">
                    <div class="detail-label">工單來源載具</div>
                    <div class="detail-value">${escapeHtml(String(toolDetails.length || 0))} 種</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">部分入庫載具紀錄</div>
                    <div class="detail-value">${escapeHtml(String(partialReceipts.filter((receipt) => String(receipt.shipping_tool_details || '').trim() !== '').length))} 筆</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">客戶可能仍留廠</div>
                    <div class="detail-value ${Number(analysis.outstanding_total_quantity || 0) > 0 ? 'text-danger' : 'text-success'}">${escapeHtml(String(analysis.outstanding_total_quantity || 0))} 個</div>
                </div>
                <div class="detail-item full-width">
                    <div class="detail-label">分析口徑</div>
                    <div class="detail-value">${escapeHtml(analysis.basis_note || '-')}</div>
                </div>
            </div>
            ${toolDetails.length > 0 ? `
            <div class="table-responsive" style="margin-bottom: 0.75rem;">
                <table class="data-table compact">
                    <thead>
                        <tr>
                            <th>工單載具名稱</th>
                            <th>類型</th>
                            <th>數量</th>
                            <th>單重(kg)</th>
                            <th>總重(kg)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${toolDetails.map((tool) => `
                        <tr>
                            <td>${escapeHtml(tool.tool_name || '-')}</td>
                            <td>${escapeHtml(tool.tool_type || '-')}</td>
                            <td class="text-right">${escapeHtml(String(tool.quantity || 0))}</td>
                            <td class="text-right">${escapeHtml(String(tool.unit_weight_kg || 0))}</td>
                            <td class="text-right">${escapeHtml(String(tool.total_weight_kg || 0))}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : '<div class="text-muted" style="margin-bottom: 0.75rem;">此工單目前沒有訂單載具設定。</div>'}
            ${outstandingRecords.length > 0 ? `
            <div class="table-responsive">
                <table class="data-table compact">
                    <thead>
                        <tr>
                            <th>載具名稱</th>
                            <th>類型</th>
                            <th>進場</th>
                            <th>已歸還</th>
                            <th>可能留廠</th>
                            <th>狀態</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${outstandingRecords.slice(0, 8).map((record) => `
                        <tr>
                            <td>${escapeHtml(record.tool_name || '-')}</td>
                            <td>${escapeHtml(record.tool_type || '-')}</td>
                            <td class="text-right">${escapeHtml(String(record.incoming_quantity || 0))}</td>
                            <td class="text-right">${escapeHtml(String(record.returned_quantity || 0))}</td>
                            <td class="text-right ${Number(record.outstanding_quantity || 0) > 0 ? 'text-danger' : ''}">${escapeHtml(String(record.outstanding_quantity || 0))}</td>
                            <td>${escapeHtml(record.status_label || '-')}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : '<div class="text-muted">目前沒有可分析的客戶載具進出紀錄。</div>'}
        `;
    }

    function calculateCurrentProducedNetWeightKg() {
        if (!elements.editModalForm) {
            return 0;
        }

        const workOrderType = elements.editModalForm.querySelector('[name="work_order_type"]')?.value || 'normal';
        if (workOrderType === 'split') {
            return roundWorkOrderWeight(getSplitRuns(true).reduce((sum, run) => {
                return sum + (parseFloat(run.completed_net_weight_kg) || 0);
            }, 0));
        }

        syncProductionRecordBufferFromForm(true);
        const activeMode = getProductionRecordMode(true);
        const activeRecords = getProductionRecordBuffers(true)[activeMode] || [];
        const totalProductionWeight = activeRecords.reduce((sum, record) => sum + (parseFloat(record.weight_kg) || 0), 0);
        const totalToolWeight = activeRecords.reduce((sum, record) => sum + (parseFloat(record.tool_weight_kg) || 0), 0);
        return roundWorkOrderWeight(Math.max(totalProductionWeight - totalToolWeight, 0));
    }

    function buildCompletionPreview() {
        const workOrder = state.currentWorkOrder || {};
        const summary = workOrder.partial_receipt_summary || {};
        const expectedNetWeightKg = roundWorkOrderWeight(summary.expected_net_weight_kg ?? workOrder.total_weight_kg ?? 0);
        const weightPerUnitG = Number(workOrder.weight_per_unit_g || state.orderItemDetails?.weight_per_unit_g || 0);
        const producedNetWeightKg = calculateCurrentProducedNetWeightKg();
        const producedUnits = calculateWholeUnitsFromWeight(producedNetWeightKg, weightPerUnitG);
        const partialReceivedNetWeightKg = roundWorkOrderWeight(summary.partial_received_net_weight_kg || 0);
        const partialReceivedUnits = Math.round(Number(summary.partial_received_units) || 0);
        const partialShippedUnits = Math.round(Number(summary.partial_shipped_units) || 0);
        const partialAllocatedUnits = Math.round(Number(summary.partial_allocated_units) || 0);
        const partialAvailableToShipUnits = Math.round(Number(summary.partial_available_to_ship_units) || 0);
        const partialInStockUnits = Math.round(Number(summary.partial_in_stock_units) || 0);
        const finalReceivedNetWeightKg = roundWorkOrderWeight(Math.max(producedNetWeightKg - partialReceivedNetWeightKg, 0));
        const finalReceivedUnits = calculateWholeUnitsFromWeight(finalReceivedNetWeightKg, weightPerUnitG);
        const shortageNetWeightKg = roundWorkOrderWeight(Math.max(expectedNetWeightKg - producedNetWeightKg, 0));
        const shortageUnits = calculateWholeUnitsFromWeight(shortageNetWeightKg, weightPerUnitG);
        const balanceDifferenceNetWeightKg = roundWorkOrderWeight(
            expectedNetWeightKg - partialReceivedNetWeightKg - finalReceivedNetWeightKg - shortageNetWeightKg
        );

        const warnings = [];
        const blockingErrors = [];
        if (producedNetWeightKg - expectedNetWeightKg > 0.0001) {
            blockingErrors.push(`現場已生產 ${producedNetWeightKg.toFixed(2)} kg，已超過工單預計 ${expectedNetWeightKg.toFixed(2)} kg。`);
        }
        if (partialReceivedNetWeightKg - producedNetWeightKg > 0.0001) {
            blockingErrors.push(`累計部分入庫 ${partialReceivedNetWeightKg.toFixed(2)} kg 已超過現場已生產 ${producedNetWeightKg.toFixed(2)} kg。`);
        }
        if (partialShippedUnits > partialReceivedUnits) {
            blockingErrors.push(`部分入庫已出貨 ${formatNumber(partialShippedUnits)} 支，已超過有效部分入庫 ${formatNumber(partialReceivedUnits)} 支。`);
        }
        if (partialInStockUnits + partialShippedUnits > partialReceivedUnits) {
            warnings.push(`部分入庫已出貨 ${formatNumber(partialShippedUnits)} 支 + 尚在庫 ${formatNumber(partialInStockUnits)} 支，已高於有效部分入庫 ${formatNumber(partialReceivedUnits)} 支，請確認庫存帳。`);
        }
        if (Math.abs(balanceDifferenceNetWeightKg) > 0.0001) {
            warnings.push(`平衡差異為 ${balanceDifferenceNetWeightKg.toFixed(2)} kg，請確認部分入庫、最終補入與短缺是否一致。`);
        }

        return {
            expected_net_weight_kg: expectedNetWeightKg,
            expected_units: calculateWholeUnitsFromWeight(expectedNetWeightKg, weightPerUnitG),
            produced_net_weight_kg: producedNetWeightKg,
            produced_units: producedUnits,
            partial_received_net_weight_kg: partialReceivedNetWeightKg,
            partial_received_units: partialReceivedUnits,
            partial_shipped_units: partialShippedUnits,
            partial_allocated_units: partialAllocatedUnits,
            partial_available_to_ship_units: partialAvailableToShipUnits,
            partial_in_stock_units: partialInStockUnits,
            final_received_net_weight_kg: finalReceivedNetWeightKg,
            final_received_units: finalReceivedUnits,
            shortage_net_weight_kg: shortageNetWeightKg,
            shortage_units: shortageUnits,
            balance_difference_net_weight_kg: balanceDifferenceNetWeightKg,
            warnings,
            blockingErrors,
        };
    }

    function setBalanceMetricValue(metricName, value, isDanger = false) {
        const element = moduleRoot.querySelector(`[data-balance-metric="${metricName}"]`);
        if (!element) {
            return;
        }
        element.textContent = value;
        element.classList.toggle('text-danger', !!isDanger);
    }

    function renderWorkOrderBalanceSummary(summary) {
        const data = summary || {};
        setBalanceMetricValue('expected', formatWeightUnits(data.expected_net_weight_kg || 0, data.expected_units || 0));
        setBalanceMetricValue('produced', formatWeightUnits(data.produced_net_weight_kg || 0, data.produced_units || 0));
        setBalanceMetricValue('partial_received', formatWeightUnits(data.partial_received_net_weight_kg || 0, data.partial_received_units || 0));
        setBalanceMetricValue('partial_shipped', formatWeightUnits(data.partial_shipped_net_weight_kg || 0, data.partial_shipped_units || 0));
        setBalanceMetricValue('partial_allocated', formatWeightUnits(data.partial_allocated_net_weight_kg || 0, data.partial_allocated_units || 0));
        setBalanceMetricValue('partial_available_to_ship', formatWeightUnits(data.partial_available_to_ship_net_weight_kg || 0, data.partial_available_to_ship_units || 0));
        setBalanceMetricValue('partial_in_stock', formatWeightUnits(data.partial_unshipped_net_weight_kg || 0, data.partial_in_stock_units || 0));
        setBalanceMetricValue('final_received', formatWeightUnits(data.final_received_net_weight_kg || 0, data.final_received_units || 0));
        setBalanceMetricValue('shortage', formatWeightUnits(data.shortage_net_weight_kg || 0, data.shortage_units || 0));
        setBalanceMetricValue(
            'balance_difference',
            `${roundWorkOrderWeight(data.balance_difference_net_weight_kg || 0).toFixed(2)} kg`,
            Math.abs(Number(data.balance_difference_net_weight_kg) || 0) > 0.0001
        );
    }

    function renderWorkOrderBalanceAlert(messages, type = 'warning') {
        if (!elements.balanceAlert) {
            return;
        }
        const list = Array.isArray(messages) ? messages.filter(Boolean) : [];
        if (list.length === 0) {
            elements.balanceAlert.className = 'work-order-balance-alert hidden';
            elements.balanceAlert.textContent = '';
            return;
        }
        elements.balanceAlert.className = `work-order-balance-alert ${type === 'error' ? 'error' : 'warning'}`;
        elements.balanceAlert.innerHTML = list.map((message) => `<div>${escapeHtml(message)}</div>`).join('');
    }

    function renderPartialReceiptHistory(receipts) {
        if (!elements.partialReceiptRows) {
            return;
        }

        const rows = Array.isArray(receipts) ? receipts : [];
        if (rows.length === 0) {
            elements.partialReceiptRows.innerHTML = '<tr class="empty-row"><td colspan="10" class="text-center">尚無部分入庫紀錄</td></tr>';
            return;
        }

        const canReversePartialReceipt = hasAnyRelaxedWorkOrderPermission(['work_orders.reverse_partial_receipt', 'manage_work_orders']);
        const fragment = document.createDocumentFragment();

        const createCell = (text, tagName = 'td', className = '') => {
            const cell = document.createElement(tagName);
            if (className) {
                cell.className = className;
            }
            cell.textContent = text;
            return cell;
        };
        const appendSummaryLine = (container, label, value, className = '') => {
            const line = document.createElement('div');
            if (className) {
                line.className = className;
            }
            line.textContent = `${label}：${value}`;
            container.appendChild(line);
        };
        const formatShippingToolSummary = (receipt) => {
            const tools = Array.isArray(receipt.shipping_tools) ? receipt.shipping_tools : [];
            if (tools.length > 0) {
                const totalWeight = Number(receipt.shipping_tool_total_weight_kg || 0);
                return `${formatNumber(tools.length)} 種載具 / ${totalWeight.toFixed(3)} kg`;
            }
            return receipt.shipping_tool_details ? '已記錄' : '-';
        };

        rows.forEach((receipt) => {
            const shippingLinks = Array.isArray(receipt.shipping_orders) ? receipt.shipping_orders.filter((item) => Number(item.shipping_order_id || 0) > 0) : [];
            const receiptStatus = String(receipt.receipt_status || 'partial');
            const receiptStatusLabel = receiptStatus === 'settled'
                ? '已結清'
                : (receiptStatus === 'reversed' ? '已沖銷' : '有效');
            const row = document.createElement('tr');
            row.dataset.partialReceiptId = String(receipt.id || '');

            const receiptNumberCell = document.createElement('td');
            const strong = document.createElement('strong');
            strong.textContent = receipt.receipt_number || `PR-${receipt.id}`;
            receiptNumberCell.appendChild(strong);
            row.appendChild(receiptNumberCell);
            row.appendChild(createCell(formatDateTime(receipt.created_at)));
            row.appendChild(createCell(receipt.created_by_name || '-'));
            row.appendChild(createCell(receipt.source_label || '一般工單'));
            row.appendChild(createCell(formatWeightUnits(receipt.net_weight_kg || 0, receipt.calculated_units || 0)));
            const shippingToolCell = createCell(formatShippingToolSummary(receipt), 'td', 'partial-receipt-tools-cell');
            shippingToolCell.title = receipt.shipping_tool_details || '';
            row.appendChild(shippingToolCell);

            const inventoryCell = document.createElement('td');
            if (Number(receipt.inventory_item_id || 0) > 0) {
                const inventoryButton = document.createElement('button');
                inventoryButton.type = 'button';
                inventoryButton.className = 'btn ghost small';
                inventoryButton.dataset.action = 'view-partial-receipt-inventory';
                inventoryButton.dataset.inventoryId = String(receipt.inventory_item_id);
                inventoryButton.textContent = '檢視庫存';
                inventoryCell.appendChild(inventoryButton);
            } else {
                const emptyInventory = document.createElement('span');
                emptyInventory.className = 'text-muted small';
                emptyInventory.textContent = '無庫存';
                inventoryCell.appendChild(emptyInventory);
            }
            row.appendChild(inventoryCell);

            const shippingCell = document.createElement('td');
            const shippingSummary = document.createElement('div');
            appendSummaryLine(
                shippingSummary,
                '已出貨',
                formatWeightUnits(receipt.shipped_net_weight_kg || 0, receipt.quantity_shipped || 0)
            );
            appendSummaryLine(
                shippingSummary,
                '待出貨',
                formatWeightUnits(receipt.allocated_net_weight_kg || 0, receipt.quantity_allocated || 0)
            );
            appendSummaryLine(
                shippingSummary,
                '可再出貨',
                formatWeightUnits(receipt.available_to_ship_net_weight_kg || 0, receipt.quantity_available_to_ship || 0)
            );
            appendSummaryLine(
                shippingSummary,
                '未出貨',
                formatWeightUnits(receipt.unshipped_net_weight_kg || 0, receipt.quantity_on_hand || 0)
            );
            shippingCell.appendChild(shippingSummary);
            const shippingActions = document.createElement('div');
            shippingActions.className = 'text-muted small';
            if (shippingLinks.length > 0) {
                shippingLinks.forEach((shippingOrder) => {
                    const shippingButton = document.createElement('button');
                    shippingButton.type = 'button';
                    shippingButton.className = 'btn ghost small';
                    shippingButton.dataset.action = 'view-partial-receipt-shipping';
                    shippingButton.dataset.shippingOrderId = String(shippingOrder.shipping_order_id);
                    shippingButton.textContent = shippingOrder.shipping_order_number || `出貨單 #${shippingOrder.shipping_order_id}`;
                    shippingActions.appendChild(shippingButton);
                });
            } else {
                shippingActions.textContent = '尚未出貨';
            }
            shippingCell.appendChild(shippingActions);
            row.appendChild(shippingCell);

            const statusCell = document.createElement('td');
            const statusWrap = document.createElement('div');
            const badge = document.createElement('span');
            badge.className = `status-badge ${receiptStatus === 'reversed' ? 'cancelled' : (receiptStatus === 'settled' ? 'completed' : 'in-progress')}`;
            badge.textContent = receiptStatusLabel;
            statusWrap.appendChild(badge);
            statusCell.appendChild(statusWrap);
            if (receiptStatus === 'reversed' || receiptStatus === 'settled') {
                const meta = document.createElement('div');
                meta.className = 'text-muted small';
                meta.textContent = receiptStatus === 'reversed'
                    ? `${formatDateTime(receipt.reversed_at)} / ${receipt.reversed_by_name || '-'}`
                    : `${formatDateTime(receipt.settled_at)} / ${receipt.settled_by_name || '-'}`;
                statusCell.appendChild(meta);
            }
            row.appendChild(statusCell);

            const actionCell = document.createElement('td');
            const actionWrap = document.createElement('div');
            actionWrap.className = 'inline-actions-wrap';
            if (receiptStatus !== 'reversed' && canReversePartialReceipt) {
                const reverseButton = document.createElement('button');
                reverseButton.type = 'button';
                reverseButton.className = 'btn ghost small danger';
                reverseButton.dataset.action = 'reverse-work-order-partial-receipt';
                reverseButton.dataset.partialReceiptId = String(receipt.id || '');
                reverseButton.textContent = '沖銷';
                actionWrap.appendChild(reverseButton);
            } else {
                const actionNote = document.createElement('span');
                actionNote.className = 'text-muted small';
                actionNote.textContent = receiptStatus !== 'reversed' ? '無沖銷權限' : '-';
                actionWrap.appendChild(actionNote);
            }
            actionCell.appendChild(actionWrap);
            row.appendChild(actionCell);
            fragment.appendChild(row);
        });

        elements.partialReceiptRows.replaceChildren(fragment);
    }

    function refreshWorkOrderBalancePresentation(workOrder) {
        const currentWorkOrder = workOrder || state.currentWorkOrder || {};
        const summary = currentWorkOrder.partial_receipt_summary || {};
        renderWorkOrderBalanceSummary(summary);

        const messages = [];
        const balanceDiff = Number(summary.balance_difference_net_weight_kg || 0);
        if (Math.abs(balanceDiff) > 0.0001) {
            messages.push(`平衡差異 ${balanceDiff.toFixed(2)} kg，請確認部分入庫、最終補入與短缺是否一致。`);
        }
        if ((Number(summary.partial_received_net_weight_kg) || 0) - (Number(summary.produced_net_weight_kg) || 0) > 0.0001) {
            messages.push('有效部分入庫已超過現場已生產重量，結案前必須先處理。');
        }
        if ((Number(summary.partial_shipped_units) || 0) > (Number(summary.partial_received_units) || 0)) {
            messages.push('部分入庫已出貨支數高於有效部分入庫支數，請先檢查出貨帳。');
        }
        renderWorkOrderBalanceAlert(messages, messages.length > 0 ? 'error' : 'warning');
        renderPartialReceiptHistory(currentWorkOrder.partial_receipts || []);
    }

    async function submitPartialReceipt(payload) {
        try {
            const response = await fetch('api/work_orders/partial_receipt.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (!result.success) {
                if (elements.partialReceiptModal && !elements.partialReceiptModal.classList.contains('hidden')) {
                    showPartialReceiptModalAlert(result.message || '部分入庫失敗。');
                } else {
                    showModalAlert('error', result.message || '部分入庫失敗。', false, true);
                }
                return;
            }

            const successMessage = `${result.message || '部分入庫完成。'} 單號：${result.data?.receipt_number || '-'}，工單剩餘可入庫 ${roundWorkOrderWeight(result.data?.remaining_work_order_net_weight_kg || 0).toFixed(2)} kg。`;
            showModalAlert('success', successMessage, true, true);
            if (typeof DataSync !== 'undefined') {
                DataSync.notifyWithDependencies('inventory_items', DataSync.EVENT_TYPES.CREATED, {
                    id: result.data?.inventory_item_id,
                    work_order_id: state.editingId
                });
                DataSync.notifyWithDependencies('work_orders', DataSync.EVENT_TYPES.UPDATED, {
                    id: state.editingId
                });
            }

            await openModal(state.editingId);
            loadWorkOrders();
            closePartialReceiptModal();
        } catch (error) {
            console.error('Create partial receipt error:', error);
            if (elements.partialReceiptModal && !elements.partialReceiptModal.classList.contains('hidden')) {
                showPartialReceiptModalAlert('部分入庫時發生錯誤，請稍後重試。');
            } else {
                showModalAlert('error', '部分入庫時發生錯誤，請稍後重試。', false, true);
            }
        }
    }

    function showPartialReceiptModalAlert(message) {
        const alertBox = elements.partialReceiptModal?.querySelector('[data-partial-receipt-modal-alert]');
        if (!alertBox) {
            return;
        }
        alertBox.textContent = message;
        alertBox.className = 'modal-alert error';
        alertBox.removeAttribute('hidden');
    }

    function getPartialReceiptAvailableTools() {
        const sourceTools = Array.isArray(state.currentWorkOrder?.tool_details)
            ? state.currentWorkOrder.tool_details
            : (Array.isArray(state.orderItemDetails?.tool_details) ? state.orderItemDetails.tool_details : []);
        return sourceTools
            .map((tool) => ({
                id: Number.parseInt(tool?.id, 10) || 0,
                tool_id: Number.parseInt(tool?.tool_id, 10) || 0,
                tool_number: String(tool?.tool_number || '').trim(),
                tool_name: String(tool?.tool_name || '').trim(),
                tool_type: String(tool?.tool_type || '').trim(),
                quantity: Math.max(0, Number(tool?.quantity) || 0),
                unit_weight_kg: Math.max(0, Number(tool?.unit_weight_kg) || 0),
                total_weight_kg: Math.max(0, Number(tool?.total_weight_kg) || 0),
            }))
            .filter((tool) => tool.id > 0);
    }

    function formatPartialReceiptToolLabel(tool) {
        const name = String(tool?.tool_name || '').trim();
        const type = String(tool?.tool_type || '').trim();
        const fallback = name || type || `載具#${Number.parseInt(tool?.id, 10) || 0}`;
        return type && type !== fallback ? `${fallback} / ${type}` : fallback;
    }

    function updatePartialReceiptToolSummaryDisplay(summaryText, totalWeightKg, isError = false) {
        if (!elements.partialReceiptForm) {
            return;
        }

        const hiddenInput = elements.partialReceiptForm.querySelector('[name="shipping_tool_details"]');
        const totalWeightTarget = elements.partialReceiptForm.querySelector('[data-partial-receipt-tool-total-weight]');
        const summaryTarget = elements.partialReceiptForm.querySelector('[data-partial-receipt-tool-summary]');

        if (hiddenInput) {
            hiddenInput.value = isError ? '' : summaryText;
        }
        if (totalWeightTarget) {
            totalWeightTarget.textContent = `${roundWorkOrderWeight(totalWeightKg || 0, 3).toFixed(3)} kg`;
        }
        if (summaryTarget) {
            summaryTarget.textContent = summaryText || '尚未選擇本次出貨載具。';
            summaryTarget.classList.toggle('text-danger', isError);
        }
    }

    function collectPartialReceiptShippingTools() {
        if (!elements.partialReceiptForm) {
            return {
                items: [],
                summary: '',
                totalWeightKg: 0,
                error: '部分入庫視窗尚未載入完成。',
            };
        }

        const rows = Array.from(elements.partialReceiptForm.querySelectorAll('[data-partial-receipt-tool-row]'));
        const selectedItems = [];
        const summaryParts = [];
        let totalWeightKg = 0;

        for (const row of rows) {
            const toggle = row.querySelector('[data-partial-receipt-tool-toggle]');
            const quantityInput = row.querySelector('[data-partial-receipt-tool-quantity]');
            if (!(toggle instanceof HTMLInputElement) || !(quantityInput instanceof HTMLInputElement) || !toggle.checked) {
                continue;
            }

            const orderItemToolId = Number.parseInt(toggle.value, 10) || 0;
            const quantityRaw = quantityInput.value.trim();
            const quantityNumber = Number(quantityRaw);
            if (orderItemToolId <= 0 || !/^[1-9]\d*$/.test(quantityRaw) || !Number.isInteger(quantityNumber) || quantityNumber <= 0) {
                return {
                    items: [],
                    summary: '',
                    totalWeightKg: 0,
                    error: '請為每筆已勾選載具填寫正整數數量。',
                };
            }

            const unitWeightKg = Number(row.dataset.unitWeightKg || 0) || 0;
            const lineWeightKg = roundWorkOrderWeight(unitWeightKg * quantityNumber, 3);
            totalWeightKg += lineWeightKg;

            selectedItems.push({
                order_item_tool_id: orderItemToolId,
                quantity: quantityNumber,
            });

            summaryParts.push(
                `${row.dataset.toolLabel || `載具#${orderItemToolId}`} x ${quantityNumber}（${roundWorkOrderWeight(unitWeightKg, 3).toFixed(3)} kg/個，小計 ${lineWeightKg.toFixed(3)} kg）`
            );
        }

        totalWeightKg = roundWorkOrderWeight(totalWeightKg, 3);
        const summary = summaryParts.length > 0
            ? `${summaryParts.join('；')}；參考載具總重 ${totalWeightKg.toFixed(3)} kg`
            : '';

        return {
            items: selectedItems,
            summary,
            totalWeightKg,
            error: '',
        };
    }

    function syncPartialReceiptToolSummary() {
        const selection = collectPartialReceiptShippingTools();
        if (selection.error) {
            updatePartialReceiptToolSummaryDisplay(selection.error, 0, true);
            return selection;
        }

        updatePartialReceiptToolSummaryDisplay(selection.summary, selection.totalWeightKg, false);
        return selection;
    }

    function togglePartialReceiptToolRowState(toggleInput) {
        if (!(toggleInput instanceof HTMLInputElement)) {
            return;
        }

        const row = toggleInput.closest('[data-partial-receipt-tool-row]');
        if (!(row instanceof HTMLElement)) {
            return;
        }

        const quantityInput = row.querySelector('[data-partial-receipt-tool-quantity]');
        if (!(quantityInput instanceof HTMLInputElement)) {
            return;
        }

        row.classList.toggle('is-selected', toggleInput.checked);
        quantityInput.disabled = !toggleInput.checked;
        if (toggleInput.checked) {
            if (!quantityInput.value.trim() || Number(quantityInput.value) <= 0) {
                quantityInput.value = '1';
            }
        } else {
            quantityInput.value = '';
        }
    }

    function renderPartialReceiptToolSelector() {
        if (!elements.partialReceiptForm) {
            return 0;
        }

        const list = elements.partialReceiptForm.querySelector('[data-partial-receipt-tools-list]');
        const emptyState = elements.partialReceiptForm.querySelector('[data-partial-receipt-tools-empty]');
        if (!(list instanceof HTMLElement) || !(emptyState instanceof HTMLElement)) {
            return 0;
        }

        list.innerHTML = '';
        const tools = getPartialReceiptAvailableTools();
        if (tools.length === 0) {
            emptyState.classList.remove('hidden');
            updatePartialReceiptToolSummaryDisplay('此工單尚未設定可帶入的載具資料。', 0, true);
            return 0;
        }

        emptyState.classList.add('hidden');
        const fragment = document.createDocumentFragment();

        tools.forEach((tool) => {
            const row = document.createElement('div');
            row.className = 'work-order-partial-tool-row';
            row.dataset.partialReceiptToolRow = 'true';
            row.dataset.unitWeightKg = String(tool.unit_weight_kg || 0);
            row.dataset.toolLabel = formatPartialReceiptToolLabel(tool);

            const toggleWrap = document.createElement('div');
            toggleWrap.className = 'work-order-partial-tool-toggle';
            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.value = String(tool.id);
            toggle.dataset.partialReceiptToolToggle = 'true';
            toggle.setAttribute('aria-label', `選擇 ${formatPartialReceiptToolLabel(tool)}`);
            toggleWrap.appendChild(toggle);

            const meta = document.createElement('div');
            meta.className = 'work-order-partial-tool-meta';
            const title = document.createElement('strong');
            title.textContent = formatPartialReceiptToolLabel(tool);
            meta.appendChild(title);
            const detail = document.createElement('span');
            const detailParts = [];
            if (tool.tool_number) {
                detailParts.push(`編號 ${tool.tool_number}`);
            }
            detailParts.push(`單重 ${roundWorkOrderWeight(tool.unit_weight_kg || 0, 3).toFixed(3)} kg`);
            if (tool.quantity > 0) {
                detailParts.push(`原設定 ${formatNumber(Math.round(tool.quantity))} 個`);
            }
            detail.textContent = detailParts.join(' ｜ ');
            meta.appendChild(detail);

            const qtyWrap = document.createElement('label');
            qtyWrap.className = 'work-order-partial-tool-qty';
            const qtyLabel = document.createElement('span');
            qtyLabel.textContent = '本次數量';
            const qtyInput = document.createElement('input');
            qtyInput.type = 'number';
            qtyInput.min = '1';
            qtyInput.step = '1';
            qtyInput.placeholder = '請輸入';
            qtyInput.disabled = true;
            qtyInput.dataset.partialReceiptToolQuantity = 'true';
            qtyWrap.appendChild(qtyLabel);
            qtyWrap.appendChild(qtyInput);

            row.appendChild(toggleWrap);
            row.appendChild(meta);
            row.appendChild(qtyWrap);
            fragment.appendChild(row);
        });

        list.appendChild(fragment);
        updatePartialReceiptToolSummaryDisplay('', 0, false);
        return tools.length;
    }

    function handlePartialReceiptFormMutation(event) {
        const target = event.target;
        if (!(target instanceof HTMLElement) || !elements.partialReceiptForm?.contains(target)) {
            return;
        }

        if (target instanceof HTMLInputElement && target.dataset.partialReceiptToolToggle === 'true') {
            togglePartialReceiptToolRowState(target);
        }
        syncPartialReceiptToolSummary();
    }

    function closePartialReceiptModal() {
        if (!elements.partialReceiptModal || !elements.partialReceiptForm) {
            return;
        }
        elements.partialReceiptModal.classList.add('hidden');
        elements.partialReceiptForm.reset();
        const list = elements.partialReceiptForm.querySelector('[data-partial-receipt-tools-list]');
        const emptyState = elements.partialReceiptForm.querySelector('[data-partial-receipt-tools-empty]');
        if (list instanceof HTMLElement) {
            list.innerHTML = '';
        }
        if (emptyState instanceof HTMLElement) {
            emptyState.classList.add('hidden');
        }
        updatePartialReceiptToolSummaryDisplay('', 0, false);
        state.partialReceiptContext = null;
        const alertBox = elements.partialReceiptModal.querySelector('[data-partial-receipt-modal-alert]');
        if (alertBox) {
            alertBox.className = 'modal-alert hidden';
            alertBox.setAttribute('hidden', '');
            alertBox.textContent = '';
        }
    }

    function showCompletionModalAlert(message) {
        const alertBox = elements.completionModal?.querySelector('[data-work-order-completion-modal-alert]');
        if (!alertBox) {
            return;
        }
        if (!message) {
            alertBox.className = 'modal-alert hidden';
            alertBox.setAttribute('hidden', '');
            alertBox.textContent = '';
            return;
        }
        alertBox.textContent = message;
        alertBox.className = 'modal-alert error';
        alertBox.removeAttribute('hidden');
    }

    function closeCompletionModal(resolveValue = null) {
        if (elements.completionModal) {
            elements.completionModal.classList.add('hidden');
        }
        if (elements.completionForm) {
            elements.completionForm.reset();
        }
        showCompletionModalAlert('');
        const resolver = state.completionContext?.resolve;
        state.completionContext = null;
        if (typeof resolver === 'function') {
            resolver(resolveValue);
        }
    }

    function renderCompletionModalSummary(summary) {
        const targets = elements.completionModal?.querySelectorAll('[data-completion-summary]') || [];
        const mapping = {
            expected: formatWeightUnits(summary.expected_net_weight_kg || 0, summary.expected_units || 0),
            produced: formatWeightUnits(summary.produced_net_weight_kg || 0, summary.produced_units || 0),
            partial_received: formatWeightUnits(summary.partial_received_net_weight_kg || 0, summary.partial_received_units || 0),
            final_received: formatWeightUnits(summary.final_received_net_weight_kg || 0, summary.final_received_units || 0),
            shortage: formatWeightUnits(summary.shortage_net_weight_kg || 0, summary.shortage_units || 0),
            balance_difference: `${roundWorkOrderWeight(summary.balance_difference_net_weight_kg || 0).toFixed(2)} kg`,
        };
        targets.forEach((target) => {
            const key = target.dataset.completionSummary || '';
            target.textContent = mapping[key] || '--';
            target.classList.toggle('text-danger', key === 'balance_difference' && Math.abs(Number(summary.balance_difference_net_weight_kg) || 0) > 0.0001);
        });
    }

    function requestCompletionConfirmation(basePayload) {
        if (!elements.completionModal || !elements.completionForm) {
            return Promise.resolve(null);
        }

        const preview = buildCompletionPreview();
        state.completionContext = {
            basePayload: { ...basePayload },
            preview,
            resolve: null,
        };
        renderCompletionModalSummary(preview);

        const autoCreateInventoryField = elements.completionForm.querySelector('[name="auto_create_inventory"]');
        const shortageReasonField = elements.completionForm.querySelector('[name="shortage_reason_code"]');
        const shortageNotesField = elements.completionForm.querySelector('[name="shortage_notes"]');
        const completionNotesField = elements.completionForm.querySelector('[name="completion_notes"]');
        if (autoCreateInventoryField) {
            autoCreateInventoryField.value = preview.final_received_net_weight_kg > 0.0001 ? '1' : '0';
        }
        if (shortageReasonField) {
            shortageReasonField.value = String(state.currentWorkOrder?.shortage_reason_code || '');
        }
        if (shortageNotesField) {
            shortageNotesField.value = String(state.currentWorkOrder?.shortage_notes || '');
        }
        if (completionNotesField) {
            completionNotesField.value = '';
        }

        const initialMessage = preview.blockingErrors[0] || preview.warnings[0] || '';
        showCompletionModalAlert(initialMessage);
        elements.completionModal.classList.remove('hidden');

        return new Promise((resolve) => {
            if (state.completionContext) {
                state.completionContext.resolve = resolve;
            } else {
                resolve(null);
            }
        });
    }

    async function handleCompletionModalSubmit(event) {
        event.preventDefault();
        if (!state.completionContext || !elements.completionForm) {
            return;
        }

        const preview = buildCompletionPreview();
        state.completionContext.preview = preview;
        renderCompletionModalSummary(preview);

        const formData = new FormData(elements.completionForm);
        const autoCreateInventory = String(formData.get('auto_create_inventory') || '1') !== '0';
        const shortageReasonCode = String(formData.get('shortage_reason_code') || '').trim();
        const shortageNotes = String(formData.get('shortage_notes') || '').trim();
        const completionNotes = String(formData.get('completion_notes') || '').trim();
        const errors = [...preview.blockingErrors];

        if (preview.final_received_net_weight_kg > 0.0001 && !autoCreateInventory) {
            errors.push('尚有最終補入庫重量時，不能只更新工單狀態。');
        }
        if (preview.shortage_net_weight_kg > 0.0001 && shortageReasonCode === '') {
            errors.push('有真實短缺時，必須填寫短缺原因。');
        }
        if (preview.shortage_net_weight_kg > 0.0001 && shortageReasonCode === 'other' && shortageNotes === '') {
            errors.push('短缺原因選擇「其他」時，必須補充短缺說明。');
        }

        if (errors.length > 0) {
            showCompletionModalAlert(errors[0]);
            return;
        }

        const payload = {
            auto_create_inventory: autoCreateInventory,
            shortage_reason_code: preview.shortage_net_weight_kg > 0.0001 ? shortageReasonCode : '',
            shortage_notes: preview.shortage_net_weight_kg > 0.0001 ? shortageNotes : '',
            other_notes: mergeWorkOrderOperationalNote(
                state.completionContext.basePayload.other_notes,
                '結案備註',
                completionNotes
            ),
        };
        closeCompletionModal(payload);
    }

    function showReversePartialModalAlert(message, type = 'error') {
        const alertBox = elements.reversePartialModal?.querySelector('[data-work-order-reverse-partial-modal-alert]');
        if (!alertBox) {
            return;
        }
        if (!message) {
            alertBox.className = 'modal-alert hidden';
            alertBox.setAttribute('hidden', '');
            alertBox.textContent = '';
            return;
        }
        alertBox.textContent = message;
        alertBox.className = `modal-alert ${type}`;
        alertBox.removeAttribute('hidden');
    }

    function closeReversePartialModal() {
        if (elements.reversePartialModal) {
            elements.reversePartialModal.classList.add('hidden');
        }
        if (elements.reversePartialForm) {
            elements.reversePartialForm.reset();
            const submitButton = elements.reversePartialForm.querySelector('[type="submit"]');
            if (submitButton) {
                submitButton.disabled = false;
            }
        }
        showReversePartialModalAlert('');
        if (elements.reversePartialModal) {
            const impactList = elements.reversePartialModal.querySelector('[data-work-order-reverse-impact-list]');
            if (impactList) {
                impactList.innerHTML = '';
            }
        }
        state.reversePartialContext = null;
    }

    async function openReversePartialReceiptModal(partialReceiptId) {
        const receiptId = Number.parseInt(partialReceiptId, 10) || 0;
        const receipts = Array.isArray(state.currentWorkOrder?.partial_receipts) ? state.currentWorkOrder.partial_receipts : [];
        const receipt = receipts.find((item) => Number(item.id || 0) === receiptId);
        if (!receipt || !elements.reversePartialModal || !elements.reversePartialForm) {
            showModalAlert('error', '找不到要沖銷的部分入庫紀錄。', false, true);
            return;
        }

        try {
            const response = await fetch(`api/workflow_guard/check.php?module=work_order_partial_receipts&action=reverse&id=${receiptId}`, {
                credentials: 'include'
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || '部分入庫流程檢查失敗。');
            }

            const assessment = result.data || {};
            state.reversePartialContext = { receipt, assessment };
            const summaryTargets = elements.reversePartialModal.querySelectorAll('[data-reverse-summary]');
            const summaryMapping = {
                receipt_number: receipt.receipt_number || `PR-${receipt.id}`,
                source_label: receipt.source_label || '一般工單',
                receipt_quantity: formatWeightUnits(receipt.net_weight_kg || 0, receipt.calculated_units || 0),
                impact_title: assessment.message || (assessment.allowed ? '可沖銷' : '目前不可沖銷'),
            };
            summaryTargets.forEach((target) => {
                const key = target.dataset.reverseSummary || '';
                target.textContent = summaryMapping[key] || '--';
            });

            const impactList = elements.reversePartialModal.querySelector('[data-work-order-reverse-impact-list]');
            if (impactList) {
                const impacts = Array.isArray(assessment.impacts) ? assessment.impacts : [];
                impactList.innerHTML = impacts.length > 0
                    ? impacts.map((impact) => `<div class="work-order-reverse-impact-item">${escapeHtml(impact)}</div>`).join('')
                    : '<div class="work-order-reverse-impact-item">無額外流程影響。</div>';
            }

            const submitButton = elements.reversePartialForm.querySelector('[type="submit"]');
            if (submitButton) {
                submitButton.disabled = !assessment.allowed;
            }

            showReversePartialModalAlert(
                assessment.allowed
                    ? '沖銷後會作廢原部分入庫與關聯庫存，並保留完整庫存異動紀錄。'
                    : (assessment.message || '此部分入庫目前不可沖銷。'),
                assessment.allowed ? 'info' : 'error'
            );
            elements.reversePartialModal.classList.remove('hidden');
        } catch (error) {
            console.error('Open reverse partial receipt modal error:', error);
            showModalAlert('error', error.message || '載入部分入庫沖銷資訊失敗。', false, true);
        }
    }

    async function handleReversePartialReceiptSubmit(event) {
        event.preventDefault();
        if (!state.reversePartialContext || !elements.reversePartialForm) {
            return;
        }

        const reverseReason = String(new FormData(elements.reversePartialForm).get('reverse_reason') || '').trim();
        if (!reverseReason) {
            showReversePartialModalAlert('請填寫沖銷原因。');
            return;
        }
        if (!state.reversePartialContext.assessment?.allowed) {
            showReversePartialModalAlert(state.reversePartialContext.assessment?.message || '此部分入庫目前不可沖銷。');
            return;
        }

        try {
            const response = await fetch('api/work_orders/reverse_partial_receipt.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    partial_receipt_id: state.reversePartialContext.receipt.id,
                    reverse_reason: reverseReason,
                })
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                showReversePartialModalAlert(result.message || '部分入庫沖銷失敗。');
                return;
            }

            if (typeof DataSync !== 'undefined') {
                if (state.reversePartialContext.receipt.inventory_item_id) {
                    DataSync.notifyWithDependencies('inventory_items', DataSync.EVENT_TYPES.DELETED, {
                        id: state.reversePartialContext.receipt.inventory_item_id,
                        work_order_id: state.editingId
                    });
                }
                DataSync.notifyWithDependencies('work_orders', DataSync.EVENT_TYPES.UPDATED, {
                    id: state.editingId
                });
            }

            closeReversePartialModal();
            showModalAlert('success', result.message || '部分入庫已沖銷。', true, true);
            await openModal(state.editingId);
            loadWorkOrders();
        } catch (error) {
            console.error('Reverse partial receipt error:', error);
            showReversePartialModalAlert('部分入庫沖銷時發生錯誤，請稍後重試。');
        }
    }

    function openPartialReceiptModal({ machineRunId = null, sourceLabel, remainingNetWeightKg, receivedNetWeightKg = 0 }) {
        if (!elements.partialReceiptModal || !elements.partialReceiptForm) {
            showModalAlert('error', '部分入庫視窗載入失敗。', false, true);
            return;
        }

        if (getPartialReceiptAvailableTools().length === 0) {
            showModalAlert('error', '此工單尚未設定可帶入的載具資料，請先到訂單品項維護載具設定。', false, true);
            return;
        }

        const remaining = Math.max(0, Number(remainingNetWeightKg) || 0);
        if (remaining <= 0.0001) {
            showModalAlert('error', '目前已無可部分入庫的剩餘淨重。', false, true);
            return;
        }

        state.partialReceiptContext = {
            workOrderId: state.editingId,
            machineRunId,
            remainingNetWeightKg: remaining,
        };
        const sourceInput = elements.partialReceiptForm.querySelector('[name="source_label"]');
        const remainingInput = elements.partialReceiptForm.querySelector('[name="remaining_net_weight_kg"]');
        const receivedInput = elements.partialReceiptForm.querySelector('[name="received_net_weight_kg"]');
        const weightInput = elements.partialReceiptForm.querySelector('[name="net_weight_kg"]');
        if (!sourceInput || !remainingInput || !weightInput) {
            showModalAlert('error', '部分入庫欄位載入失敗。', false, true);
            return;
        }
        sourceInput.value = sourceLabel;
        remainingInput.value = remaining.toFixed(2);
        if (receivedInput) {
            receivedInput.value = roundWorkOrderWeight(receivedNetWeightKg || 0).toFixed(2);
        }
        weightInput.value = '';
        weightInput.max = remaining.toFixed(2);
        renderPartialReceiptToolSelector();
        elements.partialReceiptModal.classList.remove('hidden');
        window.setTimeout(() => weightInput.focus(), 0);
    }

    async function handlePartialReceiptSubmit(event) {
        event.preventDefault();
        const context = state.partialReceiptContext;
        if (!context || !elements.partialReceiptForm) {
            return;
        }

        const formData = new FormData(elements.partialReceiptForm);
        const netWeightKg = Number(formData.get('net_weight_kg'));
        if (!Number.isFinite(netWeightKg) || netWeightKg <= 0) {
            showPartialReceiptModalAlert('請填寫大於 0 的本次入庫淨重。');
            return;
        }
        if (netWeightKg - context.remainingNetWeightKg > 0.0001) {
            showPartialReceiptModalAlert(`本次入庫不可超過剩餘 ${context.remainingNetWeightKg.toFixed(2)} kg。`);
            return;
        }
        const shippingToolSelection = syncPartialReceiptToolSummary();
        const shippingToolDetails = String(shippingToolSelection.summary || '').trim();
        if (shippingToolSelection.error) {
            showPartialReceiptModalAlert(shippingToolSelection.error);
            return;
        }
        if (shippingToolSelection.items.length === 0 || !shippingToolDetails) {
            showPartialReceiptModalAlert('請至少選擇一種本次出貨載具並填寫數量。');
            return;
        }

        await submitPartialReceipt({
            work_order_id: context.workOrderId,
            machine_run_id: context.machineRunId,
            net_weight_kg: netWeightKg,
            shipping_tool_details: shippingToolDetails,
            shipping_tools: shippingToolSelection.items,
            notes: String(formData.get('notes') || '').trim(),
        });
    }

    async function createPartialReceiptForMachineRun(run) {
        if (!state.editingId || !run || !run.id) {
            showModalAlert('error', '請先儲存拆分機台明細後，再執行部分入庫。', false, true);
            return;
        }

        const completedNetWeight = parseFloat(run.completed_net_weight_kg) || 0;
        const receivedNetWeight = parseFloat(run.partial_receipt_net_weight_kg) || 0;
        const remainingNetWeight = Math.max(0, completedNetWeight - receivedNetWeight);
        if (run.status !== 'completed' || remainingNetWeight <= 0.0001) {
            showModalAlert('error', '只有已完成且尚有剩餘淨重的機台可以部分入庫。', false, true);
            return;
        }

        openPartialReceiptModal({
            machineRunId: run.id,
            sourceLabel: `拆分機台：${run.run_label || run.machine_name || run.id}`,
            remainingNetWeightKg: remainingNetWeight,
            receivedNetWeightKg: receivedNetWeight,
        });
    }

    async function createPartialReceiptForWorkOrder() {
        if (!state.editingId || !elements.editModalForm) {
            showModalAlert('error', '請先開啟工單後再執行部分入庫。', false, true);
            return;
        }

        const workOrderType = elements.editModalForm.querySelector('[name="work_order_type"]')?.value || 'normal';
        if (workOrderType === 'split') {
            const runs = getSplitRuns(true);
            const activeIndex = parseInt(elements.editModalForm.querySelector('[data-split-work-order-panel]')?.dataset.activeRunIndex || '0', 10) || 0;
            const activeRun = runs[activeIndex];
            const completedNetWeight = parseFloat(activeRun?.completed_net_weight_kg) || 0;
            const receivedNetWeight = parseFloat(activeRun?.partial_receipt_net_weight_kg) || 0;
            const remainingNetWeight = Math.max(0, completedNetWeight - receivedNetWeight);

            if (!activeRun || !activeRun.id || activeRun.status !== 'completed' || remainingNetWeight <= 0.0001) {
                showModalAlert('error', '拆分工單請先切到「已完成且有剩餘淨重」的機台頁籤，再執行部分入庫。', false, true);
                return;
            }

            await createPartialReceiptForMachineRun(activeRun);
            return;
        }

        const currentWorkOrder = state.currentWorkOrder || {};
        if (currentWorkOrder.lifecycle_locked == 1 || currentWorkOrder.completed_at || state.editingHasInventory) {
            showModalAlert('error', '此工單已完成或已有正式庫存，不能再建立部分入庫。若需更正，請先退回工單並處理既有庫存。', false, true);
            return;
        }

        const expectedNetWeight = Number(currentWorkOrder.total_weight_kg || elements.editModalForm.querySelector('[name="total_weight_kg"]')?.value || 0);
        const receivedNetWeight = Number(currentWorkOrder.partial_receipt_net_weight_kg || 0);
        openPartialReceiptModal({
            sourceLabel: `一般工單：${currentWorkOrder.work_order_number || state.editingId}`,
            remainingNetWeightKg: Math.max(0, expectedNetWeight - receivedNetWeight),
            receivedNetWeightKg: receivedNetWeight,
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

    function openSecondScreeningFromWorkOrder(workOrderId) {
        const normalizedId = Number.parseInt(workOrderId, 10);
        if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
            showAlert('缺少工單 ID，無法開啟二次篩選。', 'warning');
            return;
        }
        if (typeof window.openTab !== 'function') {
            showAlert('無法開啟二次篩選模組。', 'warning');
            return;
        }

        const item = workOrdersCache.get(normalizedId) || {};
        const isExecutionWorkOrder = item.work_order_type === 'rescreen';
        const existingBatchId = Number.parseInt(item.second_screening_batch_id || item.source_rescreen_batch_id || '', 10);
        const hasExistingBatch = Number.isInteger(existingBatchId) && existingBatchId > 0;

        window.openTab('rescreen_batches', '二次篩選紀錄', 'modules/rescreen_batches.html', {
            context: hasExistingBatch
                ? {
                    action: 'view',
                    rescreenBatchId: existingBatchId,
                    sourceWorkOrderId: isExecutionWorkOrder ? '' : normalizedId,
                }
                : {
                    action: 'create',
                    sourceWorkOrderId: normalizedId,
                    workOrderId: normalizedId,
                },
        });
    }

    function openSecondScreeningFromEditSummary(button) {
        const mode = button?.dataset.mode || 'create';
        const batchId = Number.parseInt(button?.dataset.batchId || '', 10);
        const workOrderId = Number.parseInt(String(state.editingId || state.currentWorkOrder?.id || ''), 10);
        if (mode === 'view' && Number.isInteger(batchId) && batchId > 0) {
            if (typeof window.openTab !== 'function') {
                showAlert('無法開啟二次篩選模組。', 'warning');
                return;
            }
            window.openTab('rescreen_batches', '二次篩選紀錄', 'modules/rescreen_batches.html', {
                context: {
                    action: 'view',
                    rescreenBatchId: batchId,
                    sourceWorkOrderId: workOrderId,
                },
            });
            return;
        }

        showInlineSecondScreeningCreateForm();
    }

    function showInlineSecondScreeningCreateForm() {
        const container = elements.editModalForm?.querySelector('[data-work-order-second-screening-summary]');
        const workOrderId = Number.parseInt(String(state.editingId || state.currentWorkOrder?.id || ''), 10);
        if (!container || !Number.isInteger(workOrderId) || workOrderId <= 0) {
            showAlert('缺少工單 ID，無法建立二次篩選。', 'warning');
            return;
        }

        container.innerHTML = renderInlineSecondScreeningCreateForm();
        container.querySelectorAll('select[data-rescreen-field]').forEach(enhanceSearchableSelect);
    }

    function getInlineSecondScreeningSelectOptions(selector) {
        const source = elements.editModalForm?.querySelector(selector);
        if (!source) {
            return '<option value="">-- 請選擇 --</option>';
        }
        return Array.from(source.options)
            .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.textContent || '')}</option>`)
            .join('');
    }

    function renderInlineSecondScreeningCreateForm() {
        const currentWorkOrder = state.currentWorkOrder || {};
        const defaultReason = currentWorkOrder.shortage_reason_code === 'defect_rescreen'
            ? '一次篩分後不良品需二次篩分確認'
            : '客戶每批要求二次篩選';
        return `
            <div class="work-order-inline-rescreen-card" data-inline-second-screening-form>
                <div class="work-order-inline-rescreen-header">
                    <div>
                        <strong>建立二次篩分案件</strong>
                        <p class="text-muted small">在原工單內建立追蹤案件，儲存後會立即刷新此區塊。</p>
                    </div>
                    <button type="button" class="btn ghost small" data-action="cancel-inline-second-screening">取消</button>
                </div>
                <div class="form-grid form-grid-three-columns">
                    <label class="inline-label">
                        <span>二次篩分類型</span>
                        <select data-rescreen-field="rescreen_type">
                            <option value="strict_rescreen">嚴格二篩</option>
                            <option value="relaxed_rescreen">放寬二篩</option>
                        </select>
                    </label>
                    <label class="inline-label">
                        <span>預定開始日期</span>
                        <input type="datetime-local" data-rescreen-field="scheduled_start_date">
                    </label>
                    <label class="inline-label">
                        <span>預定結束日期</span>
                        <input type="datetime-local" data-rescreen-field="scheduled_end_date">
                    </label>
                    <label class="inline-label">
                        <span>實際開始日期</span>
                        <input type="datetime-local" data-rescreen-field="actual_start_date">
                    </label>
                    <label class="inline-label">
                        <span>實際結束日期</span>
                        <input type="datetime-local" data-rescreen-field="actual_end_date">
                    </label>
                    <label class="inline-label">
                        <span>生產數量</span>
                        <input type="number" min="0" step="0.01" data-rescreen-field="quantity_to_produce">
                    </label>
                    <label class="inline-label">
                        <span>指派員工</span>
                        <select data-rescreen-field="assigned_employee_id">${getInlineSecondScreeningSelectOptions('[name="assigned_employee_id"]')}</select>
                    </label>
                    <label class="inline-label">
                        <span>校機人員</span>
                        <select data-rescreen-field="calibration_employee_id">${getInlineSecondScreeningSelectOptions('[name="calibration_employee_id"]')}</select>
                    </label>
                    <label class="inline-label">
                        <span>指定機台</span>
                        <select data-rescreen-field="machine_id">${getInlineSecondScreeningSelectOptions('[name="machine_id"]')}</select>
                    </label>
                    <label class="inline-label">
                        <span>篩選速度</span>
                        <input type="text" maxlength="50" placeholder="例如: 300支/分" data-rescreen-field="screening_speed">
                    </label>
                    <label class="inline-label full-width">
                        <span>二次篩分原因 <abbr title="必填">*</abbr></span>
                        <textarea rows="2" maxlength="500" data-rescreen-field="second_screening_reason">${escapeHtml(defaultReason)}</textarea>
                    </label>
                    <label class="inline-label full-width">
                        <span>放寬佐證 / 客戶同意紀錄</span>
                        <textarea rows="2" maxlength="500" placeholder="放寬二篩時請填寫客戶同意或佐證資料" data-rescreen-field="customer_approval_reference"></textarea>
                    </label>
                    <label class="inline-label full-width">
                        <span>備註</span>
                        <textarea rows="2" maxlength="500" data-rescreen-field="notes"></textarea>
                    </label>
                </div>
                <div class="work-order-inline-rescreen-actions">
                    <button type="button" class="btn outline small" data-action="cancel-inline-second-screening">取消</button>
                    <button type="button" class="btn primary small" data-action="submit-inline-second-screening">建立二次篩分</button>
                </div>
            </div>
        `;
    }

    function collectInlineSecondScreeningPayload(container) {
        const workOrderId = Number.parseInt(String(state.editingId || state.currentWorkOrder?.id || ''), 10);
        if (!Number.isInteger(workOrderId) || workOrderId <= 0) {
            throw new Error('缺少工單 ID，無法建立二次篩選。');
        }

        const payload = {
            source_work_order_id: workOrderId,
            status: 'draft',
        };
        container.querySelectorAll('[data-rescreen-field]').forEach((field) => {
            const key = field.getAttribute('data-rescreen-field');
            if (!key) {
                return;
            }
            const value = String(field.value || '').trim();
            if (value !== '') {
                payload[key] = value;
            }
        });

        if (!payload.second_screening_reason) {
            throw new Error('請輸入二次篩分原因。');
        }
        if (payload.rescreen_type === 'relaxed_rescreen' && !payload.customer_approval_reference) {
            throw new Error('放寬二篩需填寫客戶同意或佐證資料。');
        }

        return payload;
    }

    async function submitInlineSecondScreening(button) {
        const container = button?.closest('[data-inline-second-screening-form]');
        if (!container) {
            return;
        }

        let payload;
        try {
            payload = collectInlineSecondScreeningPayload(container);
        } catch (error) {
            showModalAlert('error', error.message || '二次篩分資料不完整。', false, true);
            return;
        }

        button.disabled = true;
        button.textContent = '建立中...';
        try {
            const response = await fetch('api/rescreen_batches/index.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || '建立二次篩分案件失敗。');
            }

            showModalAlert('success', result.message || '二次篩分案件已建立。', false, true);
            if (typeof DataSync !== 'undefined') {
                DataSync.notifyWithDependencies('rescreen_batches', DataSync.EVENT_TYPES.CREATED, result.data || {});
            }
            await loadWorkOrderData(payload.source_work_order_id);
            loadWorkOrders();
            switchScreeningStage('secondary', elements.editModalForm);
        } catch (error) {
            console.error('Create inline second screening failed:', error);
            showModalAlert('error', error.message || '建立二次篩分案件時發生錯誤。', false, true);
            button.disabled = false;
            button.textContent = '建立二次篩分';
        }
    }

    function handleTableAction(e) {
        const selectCheckbox = e.target.closest('[data-action="select-row"]');
        const customerButton = e.target.closest('[data-action="open-customer"]');
        const secondScreeningButton = e.target.closest('[data-action="open-second-screening"]');
        const printButton = e.target.closest('[data-action="print-work-order"]');
        const printScreeningReportButton = e.target.closest('[data-action="print-screening-report"]');
        const editButton = e.target.closest('[data-action="edit-work-order"]');
        const deleteButton = e.target.closest('[data-action="delete-work-order"]');
        const convertButton = e.target.closest('[data-action="convert-to-inventory"]');

        if (selectCheckbox) {
            const row = selectCheckbox.closest('tr');
            handleRowSelect(selectCheckbox, row);
        } else if (customerButton) {
            const customerId = Number.parseInt(customerButton.dataset.customerId || '', 10);
            if (Number.isInteger(customerId) && typeof window.openTab === 'function') {
                window.openTab('customers', '客戶基本資料', 'modules/customers.html', {
                    context: { customerId }
                });
            }
        } else if (secondScreeningButton) {
            const row = secondScreeningButton.closest('tr');
            openSecondScreeningFromWorkOrder(row?.dataset.id);
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
            if (
                deleteButton.disabled
                || deleteButton.getAttribute('aria-disabled') === 'true'
                || row?.dataset.statusKey === 'completed'
                || row?.dataset.statusLabel === '已完成'
            ) {
                showAlert(deleteButton.getAttribute('title') || '此工單目前不可刪除。', 'warning');
                return;
            }
            const id = row.dataset.id;
            deleteWorkOrder(id);
        } else if (convertButton) {
            if (convertButton.getAttribute('aria-disabled') === 'true') {
                showAlert(convertButton.getAttribute('title') || '已轉為庫存項目', 'warning');
                return;
            }
            const row = convertButton.closest('tr');
            const id = row.dataset.id;
            handleConvertToInventory(id);
        }
    }

    function isCompletedWorkOrder(item) {
        const statusKey = String(item.status_key || '').trim().toLowerCase();
        const legacyStatus = String(item.status || '').trim().toLowerCase();
        const statusLabel = String(item.status_label || '').trim();
        const lifecycleLocked = item.lifecycle_locked == 1
            || item.lifecycle_locked === true
            || Boolean(item.completed_at);

        return lifecycleLocked
            || statusKey === 'completed'
            || legacyStatus === 'completed'
            || statusLabel === '已完成';
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

    function hasSubmittedValue(value) {
        return value !== null && value !== undefined && String(value).trim() !== '';
    }

    function isMeaningfulProductionRecord(record) {
        return ['weight_kg', 'production_date', 'production_time', 'machine_id', 'tool_name', 'tool_weight_kg', 'notes']
            .some(field => hasSubmittedValue(record[field]));
    }

    function collectPrimaryScheduleFields(form, data) {
        if (!form || !data || data.work_order_type === 'split') {
            return;
        }

        const scheduleSection = form.querySelector('[data-edit-schedule-section], [data-create-schedule-section]') || form;
        const scheduleFields = [
            'assigned_employee_id',
            'machine_id',
            'calibration_employee_id',
            'quantity_to_produce'
        ];

        scheduleFields.forEach((fieldName) => {
            const field = scheduleSection.querySelector(`[name="${fieldName}"]`);
            if (!field || field.disabled) {
                return;
            }
            data[fieldName] = field.value;
        });
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

        // 收集篩分服務缺陷與備註
        const screeningDefects = [];

        for (const [key, value] of formData.entries()) {
            // 只提交工單專屬欄位，不提交訂單資訊顯示欄位與表格內明細欄位
            if (!displayOnlyFields.includes(key) && !key.startsWith('defect_quantity_') && !key.startsWith('screening_notes_')) {
                data[key] = value;
            }
        }

        const screeningServiceRows = form.querySelectorAll(
            isEditMode ? '[data-edit-screening-services-body] tr[data-service-id]' : '[data-screening-services-body] tr[data-service-id]'
        );
        for (const row of screeningServiceRows) {
            const serviceId = String(row.dataset.serviceId || '').trim();
            if (!serviceId) {
                continue;
            }

            const defectInput = row.querySelector('[name^="defect_quantity_"]');
            const notesInput = row.querySelector('[name^="screening_notes_"]');
            const rawDefectQuantity = String(defectInput?.value || '0').trim();
            const numericDefectQuantity = rawDefectQuantity === '' ? 0 : Number(rawDefectQuantity);
            const notes = notesInput ? notesInput.value.trim() : '';

            if (!Number.isInteger(numericDefectQuantity) || numericDefectQuantity < 0) {
                showModalAlert('error', '不良品數量必須為 0 或正整數。', false, isEditMode);
                return;
            }

            const defectQuantity = numericDefectQuantity;
            if (defectQuantity > 0 || notes !== '') {
                screeningDefects.push({
                    screening_service_id: serviceId,
                    defect_quantity: defectQuantity,
                    notes: notes || null
                });
            }
        }

        // 表格已載入時一律送出目前狀態，讓使用者可把既有不良數量清為 0。
        if (screeningServiceRows.length > 0) {
            data.screening_defects = screeningDefects;
        }

        // 收集生產紀錄 (Production Records)
        const productionRecords = [];
        if (isEditMode) {
            syncProductionRecordBufferFromForm(true);
            const activeMode = getProductionRecordMode(true);
            const activeRecords = getProductionRecordBuffers(true)[activeMode] || [];
            activeRecords.forEach((record) => {
                const normalizedRecord = {
                    card_number: record.card_number || '',
                    tool_name: record.tool_name || '',
                    tool_weight_kg: record.tool_weight_kg || null,
                    weight_kg: record.weight_kg || null,
                    production_date: record.production_date || null,
                    production_time: record.production_time || null,
                    machine_id: record.machine_id || null,
                    machine_type: getMachineCapabilityName(record.machine_id) || record.machine_type || null,
                    operator_name: record.operator_name || (state.currentUser?.name || ''),
                    notes: record.notes || null,
                    production_source_mode: activeMode
                };

                if (hasSubmittedValue(normalizedRecord.card_number) && isMeaningfulProductionRecord(normalizedRecord)) {
                    productionRecords.push(normalizedRecord);
                }
            });
            data.production_record_mode = activeMode;
        } else {
            const prRows = form.querySelectorAll('.production-record-row');
            prRows.forEach(row => {
                const cardInput = row.querySelector('[name="pr_card_number[]"]');
                const weightInput = row.querySelector('[name="pr_weight_kg[]"]');
                const toolNameInput = row.querySelector('[name="pr_tool_name[]"]');
                const toolWeightInput = row.querySelector('[name="pr_tool_weight_kg[]"]');
                const dateInput = row.querySelector('[name="pr_date[]"]');
                const timeInput = row.querySelector('[name="pr_time[]"]');
                const machineSelect = row.querySelector('[name="pr_machine_id[]"]');
                const machineTypeInput = row.querySelector('[name="pr_machine_type[]"]');
                const operatorInput = row.querySelector('[name="pr_operator_name[]"]');
                const notesInput = row.querySelector('[name="pr_notes[]"]');

                if (cardInput) {
                    const record = {
                        card_number: cardInput.value,
                        tool_name: toolNameInput ? toolNameInput.value : null,
                        tool_weight_kg: toolWeightInput ? toolWeightInput.value : null,
                        weight_kg: weightInput ? weightInput.value : null,
                        production_date: dateInput ? dateInput.value : null,
                        production_time: timeInput ? timeInput.value : null,
                        machine_id: machineSelect ? machineSelect.value : null,
                        machine_type: machineTypeInput ? machineTypeInput.value : getMachineCapabilityName(machineSelect?.value || '') || null,
                        operator_name: operatorInput ? operatorInput.value : (state.currentUser?.name || ''),
                        notes: notesInput ? notesInput.value : null,
                        production_source_mode: 'preset'
                    };

                    if (hasSubmittedValue(record.card_number) && isMeaningfulProductionRecord(record)) {
                        productionRecords.push(record);
                    }
                }
            });
        }

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
            if (hasSubmittedValue(value)) {
                fpData[field.replace('fp_', '')] = value;
            }
        });

        if (Object.keys(fpData).length > 0) {
            data.first_piece_dimensions = fpData;
        }

        const workOrderType = form.querySelector('[name="work_order_type"]')?.value || 'normal';
        data.work_order_type = workOrderType;
        collectPrimaryScheduleFields(form, data);
        if (workOrderType === 'split') {
            data.machine_id = null;
            const splitValidationMessage = validateSplitMachineRunsBeforeSubmit(isEditMode);
            if (splitValidationMessage) {
                showModalAlert('error', splitValidationMessage, false, isEditMode);
                return;
            }
            data.machine_runs = collectSplitMachineRuns(isEditMode);
        }

        if (isEditMode) {
            const newStatusId = data.status_lookup_id ? parseInt(data.status_lookup_id, 10) : null;
            const oldStatusId = state.editingStatusLookupId ? parseInt(state.editingStatusLookupId, 10) : null;
            if (newStatusId === 28 && oldStatusId !== 28) {
                const completionPayload = await requestCompletionConfirmation(data);
                if (!completionPayload) {
                    return;
                }
                Object.assign(data, completionPayload);
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

        if (isEditMode) {
            try {
                await syncOrderItemDrawings();
            } catch (error) {
                showModalAlert('error', error.message || '圖面附件儲存失敗。', false, true);
                return;
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

    async function handleAddPreProductionImage() {
        if (!state.editingId) {
            showModalAlert('warning', '請先儲存工單後再上傳工單圖片附件。', false, true);
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;

        input.addEventListener('change', async (event) => {
            const files = Array.from(event.target.files || []);
            if (files.length === 0) {
                return;
            }

            for (const file of files) {
                await uploadPreProductionImage(file);
            }
        });

        input.click();
    }

    async function uploadPreProductionImage(file) {
        try {
            const formData = new FormData();
            formData.append('work_order_id', state.editingId);
            formData.append('image', file);

            const response = await fetch('api/work_order_pre_production_images/index.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                await loadPreProductionImages(state.editingId);

                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('work_order_pre_production_images', DataSync.EVENT_TYPES.CREATED, {
                        id: result.data?.id || 0,
                        work_order_id: state.editingId || 0
                    });
                }

                showModalAlert('success', result.message || '工單圖片附件上傳成功。', true, true);
            } else {
                showModalAlert('danger', result.message || '工單圖片附件上傳失敗。', false, true);
            }
        } catch (error) {
            console.error('Upload pre-production image error:', error);
            showModalAlert('danger', '工單圖片附件上傳時發生錯誤。', false, true);
        }
    }

    async function loadPreProductionImages(workOrderId) {
        if (!workOrderId || !elements.editPreProductionImagesRows) {
            return;
        }

        try {
            const response = await fetch(`api/work_order_pre_production_images/index.php?work_order_id=${encodeURIComponent(workOrderId)}&limit=100`);
            const result = await response.json();
            if (!result.success) {
                console.error('Load pre-production images failed:', result.message);
                return;
            }
            renderExecutionImageRows(
                elements.editPreProductionImagesRows,
                result.data || [],
                '尚未上傳工單圖片附件'
            );
        } catch (error) {
            console.error('Load pre-production images error:', error);
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
            const printUrl = buildWorkOrderPrintUrl({ id: workOrderId });
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
            const printUrl = buildWorkOrderPrintUrl({ ids });
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
                ['工單號碼', '工單類型', '訂單號碼', '客戶名稱', '受篩產品', '機台', '開始日期', '結束日期', '狀態'],
                ...rows.map((row) => [
                    row.work_order_number || '',
                    getWorkOrderTypeLabel(row.work_order_type, Number.parseInt(row.machine_run_count, 10) || 0, row.rescreen_batch_number || ''),
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
     * 列印品質檢驗報表
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

    function getWorkOrderTypeLabel(workOrderType, machineRunCount = 0, rescreenBatchNumber = '') {
        const normalizedType = String(workOrderType || 'normal').toLowerCase();
        if (normalizedType === 'split') {
            return `拆分工單${machineRunCount > 0 ? ` (${machineRunCount} 台)` : ''}`;
        }
        if (normalizedType === 'rescreen') {
            return rescreenBatchNumber ? `二次篩選工單 (${rescreenBatchNumber})` : '二次篩選工單';
        }
        return '一般工單';
    }

    function getSecondScreeningReasonLabel(reason) {
        const map = {
            relaxed_after_high_defect: '放寬後二篩',
            customer_required_second_pass: '每批二篩',
        };
        const normalizedReason = String(reason || '').trim();
        return map[normalizedReason] || normalizedReason;
    }

    function getSecondScreeningStatusLabel(status) {
        const map = {
            draft: '草稿',
            planned: '已排程',
            in_progress: '進行中',
            completed: '已完成',
            cancelled: '已取消',
        };
        return map[String(status || '').trim()] || (status || '-');
    }

    function getSecondScreeningDispositionLabel(disposition) {
        const map = {
            rework: '可再處理',
            scrap: '報廢',
            return_to_customer: '退回客戶',
            hold: '暫留待判',
            other: '其他',
        };
        const normalizedDisposition = String(disposition || '').trim();
        return map[normalizedDisposition] || normalizedDisposition || '-';
    }

    function formatSecondScreeningMetric(value, suffix = '') {
        if (value === null || value === undefined || value === '') {
            return '-';
        }

        return `${String(value)}${suffix}`;
    }

    function formatSecondScreeningProductionMoment(record) {
        const dateText = String(record?.production_date || '').trim();
        const timeText = String(record?.production_time || '').trim();
        if (!dateText && !timeText) {
            return '-';
        }

        return [dateText || '-', timeText].filter(Boolean).join(' ');
    }

    function renderSecondScreeningDefectDetails(defects) {
        if (!Array.isArray(defects) || defects.length === 0) {
            return '<p class="text-muted small">尚未記錄服務明細。</p>';
        }

        return `
            <ul class="work-order-second-screening-detail-list">
                ${defects.map((defect) => `
                    <li class="work-order-second-screening-detail-item">
                        <strong>${escapeHtml(defect.service_name || '-')}</strong>
                        <span>${escapeHtml([
                            `不良 ${formatSecondScreeningMetric(defect.defect_quantity)}`,
                            `支數 ${formatSecondScreeningMetric(defect.defect_units)}`,
                            `處置 ${getSecondScreeningDispositionLabel(defect.disposition)}`,
                            defect.defect_recorded_by_name ? `人員 ${defect.defect_recorded_by_name}` : '',
                            defect.defect_recorded_at ? `時間 ${formatDateTime(defect.defect_recorded_at)}` : '',
                        ].filter(Boolean).join(' / '))}</span>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    function renderSecondScreeningProductionDetails(records) {
        if (!Array.isArray(records) || records.length === 0) {
            return '<p class="text-muted small">尚未記錄生產記錄。</p>';
        }

        return `
            <ul class="work-order-second-screening-detail-list">
                ${records.map((record) => `
                    <li class="work-order-second-screening-detail-item">
                        <strong>${escapeHtml(record.card_number || formatSecondScreeningProductionMoment(record))}</strong>
                        <span>${escapeHtml([
                            `重量 ${formatSecondScreeningMetric(record.weight_kg, ' kg')}`,
                            `時間 ${formatSecondScreeningProductionMoment(record)}`,
                            `機台 ${record.machine_name || record.machine_type || '-'}`,
                            `載具 ${record.tool_name || '-'}`,
                            record.tool_weight_kg !== null && record.tool_weight_kg !== undefined && record.tool_weight_kg !== ''
                                ? `載具重 ${formatSecondScreeningMetric(record.tool_weight_kg, ' kg')}`
                                : '',
                            record.employee_name ? `人員 ${record.employee_name}` : '',
                        ].filter(Boolean).join(' / '))}</span>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    function getSecondScreeningSummary(item) {
        if (item.work_order_type === 'rescreen') {
            const reasonLabel = getSecondScreeningReasonLabel(item.execution_second_screening_reason || item.second_screening_reasons);
            return {
                label: item.rescreen_batch_number || '二篩執行',
                reasonLabel,
                title: '檢視此二次篩選案件',
            };
        }

        const count = Number.parseInt(item.second_screening_count, 10) || 0;
        if (count <= 0) {
            return null;
        }

        const reasonLabels = String(item.second_screening_reasons || '')
            .split('||')
            .map((reason) => getSecondScreeningReasonLabel(reason.trim()))
            .filter(Boolean)
            .join('、');
        const batchNumbers = item.second_screening_batch_numbers || `${count} 筆`;
        return {
            label: batchNumbers,
            reasonLabel: reasonLabels,
            title: '檢視二次篩選案件',
        };
    }

    function renderEditSecondScreeningSummary(data) {
        const container = elements.editModalForm?.querySelector('[data-work-order-second-screening-summary]');
        if (!container) {
            return;
        }

        const batches = Array.isArray(data.second_screening_batches) ? data.second_screening_batches : [];
        if (batches.length === 0) {
            container.innerHTML = `
                <div class="work-order-second-screening-empty">
                    <span class="text-muted">此工單尚未建立二次篩選。</span>
                    <button type="button" class="btn outline small" data-action="open-second-screening-summary" data-mode="create">建立二次篩選</button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="work-order-second-screening-cards">
                ${batches.map((batch) => {
                    const reasonLabel = getSecondScreeningReasonLabel(batch.second_screening_reason) || '-';
                    const resultText = [
                        `良品 ${escapeHtml(String(batch.rescreen_output_good_units ?? '-'))}`,
                        `再次不良 ${escapeHtml(String(batch.rescreen_output_defect_units ?? '-'))}`,
                        `報廢 ${escapeHtml(String(batch.rescreen_output_scrap_units ?? '-'))}`,
                    ].join(' / ');
                    const serviceResults = Array.isArray(batch.defects) ? batch.defects : [];
                    const productionRecords = Array.isArray(batch.production_records) ? batch.production_records : [];
                    const images = Array.isArray(batch.images) ? batch.images : [];
                    const scheduleText = [
                        `預定 ${formatDateTime(batch.scheduled_start_date || '') || '-'} ~ ${formatDateTime(batch.scheduled_end_date || '') || '-'}`,
                        `實際 ${formatDateTime(batch.actual_start_date || batch.started_at || '') || '-'} ~ ${formatDateTime(batch.actual_end_date || batch.completed_at || '') || '-'}`,
                        `機台 ${batch.machine_name || '-'}`,
                        `指派 ${batch.assigned_employee_name || '-'}`,
                        `校機 ${batch.calibration_employee_name || '-'}`,
                    ].join(' / ');
                    const firstPieceText = [
                        `量測 ${formatDateTime(batch.first_piece_measured_at || '') || '-'}`,
                        `人員 ${batch.first_piece_measured_by_name || '-'}`,
                        `長度 ${batch.first_piece_length ?? '-'}`,
                        `外徑 ${batch.first_piece_outer_diameter ?? '-'}`,
                        `厚度 ${batch.first_piece_thickness ?? '-'}`,
                    ].join(' / ');
                    return `
                        <article class="work-order-second-screening-card">
                            <div>
                                <strong>${escapeHtml(batch.rescreen_batch_number || '-')}</strong>
                                <span class="text-muted">${escapeHtml(reasonLabel)}</span>
                            </div>
                            <div class="text-muted small">案件狀態：${escapeHtml(getSecondScreeningStatusLabel(batch.status))}</div>
                            <div class="text-muted small">排程：${escapeHtml(scheduleText)}</div>
                            <div class="text-muted small">首件：${escapeHtml(firstPieceText)}</div>
                            <div class="text-muted small">結果：${resultText}</div>
                            <div class="work-order-second-screening-detail-block">
                                <div class="text-muted small">服務明細：${serviceResults.length > 0 ? `${serviceResults.length} 項` : '尚未記錄'}</div>
                                ${renderSecondScreeningDefectDetails(serviceResults)}
                            </div>
                            <div class="work-order-second-screening-detail-block">
                                <div class="text-muted small">生產記錄：${productionRecords.length > 0 ? `${productionRecords.length} 筆` : '尚未記錄'}</div>
                                ${renderSecondScreeningProductionDetails(productionRecords)}
                            </div>
                            <div class="work-order-second-screening-detail-block">
                                <div class="text-muted small">現場圖片：${images.length > 0 ? `${images.length} 張` : '尚未上傳'}</div>
                            </div>
                            <button type="button" class="btn outline small" data-action="open-second-screening-summary" data-mode="view" data-batch-id="${escapeHtml(String(batch.id || ''))}">檢視二次篩選</button>
                        </article>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Render Functions
    function renderTable(data) {
        if (!elements.tbody) return;

        // 清除快取
        workOrdersCache.clear();

        if (!data || data.length === 0) {
            elements.tbody.innerHTML = '<tr><td colspan="12" class="text-center">無資料</td></tr>';
            updateSelectionUI();
            return;
        }

        function renderCustomerRecordLink(customerId, customerName, isActive = true) {
            const normalizedCustomerId = Number.parseInt(customerId, 10);
            const trimmedCustomerName = (customerName || '').toString().trim();
            if (!trimmedCustomerName) {
                return '-';
            }

            const escapedCustomerName = escapeHtml(trimmedCustomerName);
            const inactiveSuffix = !isActive ? ' <span class="text-muted">(已停用)</span>' : '';
            if (!Number.isInteger(normalizedCustomerId) || normalizedCustomerId <= 0) {
                return `${escapedCustomerName}${inactiveSuffix}`;
            }

            const openLabel = escapeHtml(`查看客戶基本資料：${trimmedCustomerName}`);
            return `<button type="button" class="record-link-button" data-action="open-customer" data-customer-id="${normalizedCustomerId}" title="${openLabel}" aria-label="${openLabel}">${escapedCustomerName}</button>${inactiveSuffix}`;
        }

        const html = data.map(item => {
            // 儲存到快取
            workOrdersCache.set(item.id, item);

            // 根據狀態鍵值設定 CSS 類別
            const statusClass = item.status_key ? item.status_key.toLowerCase().replace(/_/g, '-') : 'scheduled';

            // 只有完成狀態才顯示轉為庫存項目按鈕
            const statusKey = String(item.status_key || '').trim().toLowerCase();
            const statusLabel = String(item.status_label || '').trim();
            const showConvertButton = statusKey === 'completed';
            const hasInventory = item.has_inventory == 1 || item.has_inventory === true;
            const isCompleted = isCompletedWorkOrder(item);
            const completedRowClass = isCompleted ? ' class="is-completed-work-order"' : '';
            const statusKeyAttr = escapeHtml(statusKey);
            const statusLabelAttr = escapeHtml(statusLabel);
            const convertButtonLabel = hasInventory ? '已轉為庫存項目' : '轉為庫存項目';
            const convertButtonLabelAttr = escapeHtml(convertButtonLabel);
            const deleteBlockedLabel = '此工單已進入完成或追溯流程，無法刪除';
            const deleteBlockedLabelAttr = escapeHtml(deleteBlockedLabel);
            const deleteButtonClass = isCompleted ? 'btn text' : 'btn text danger';
            const deleteDisabledAttr = isCompleted
                ? ` aria-disabled="true" data-disabled-reason="completed" title="${deleteBlockedLabelAttr}" aria-label="${deleteBlockedLabelAttr}"`
                : ' title="刪除"';

            // 客戶名稱處理（停用顯示）
            const customerIsActive = item.customer_is_active !== 0 && item.customer_is_active !== '0' && item.customer_is_active !== false;
            const customerDisplay = item.customer_name
                ? renderCustomerRecordLink(item.customer_id, item.customer_name, customerIsActive)
                : '-';

            // checkbox 狀態
            const isChecked = selectedWorkOrders.has(item.id) ? 'checked' : '';
            const isSplitWorkOrder = item.work_order_type === 'split';
            const isRescreenWorkOrder = item.work_order_type === 'rescreen';
            const machineRunCount = Math.max(0, Number.parseInt(item.machine_run_count, 10) || 0);
            const workOrderTypeLabel = getWorkOrderTypeLabel(item.work_order_type, machineRunCount, item.rescreen_batch_number || '');
            const workOrderTypeClass = isSplitWorkOrder ? 'split' : (isRescreenWorkOrder ? 'rescreen' : 'normal');
            const secondScreeningSummary = getSecondScreeningSummary(item);

            return `
            <tr data-id="${item.id}" data-status-key="${statusKeyAttr}" data-status-label="${statusLabelAttr}"${completedRowClass}>
                <td class="checkbox-col"><input type="checkbox" data-action="select-row" ${isChecked}></td>
                <td>${escapeHtml(item.work_order_number)}</td>
                <td><span class="work-order-type-badge ${workOrderTypeClass}">${escapeHtml(workOrderTypeLabel)}</span></td>
                <td>${secondScreeningSummary ? `<button type="button" class="record-link-button" data-action="open-second-screening" title="${escapeHtml(secondScreeningSummary.title)}">${escapeHtml(secondScreeningSummary.label)}</button>${secondScreeningSummary.reasonLabel ? `<span class="text-muted"> ${escapeHtml(secondScreeningSummary.reasonLabel)}</span>` : ''}` : ''}</td>
                <td>${escapeHtml(item.order_number || '')}</td>
                <td>${customerDisplay}</td>
                <td>${escapeHtml(item.screening_item_name || '')}</td>
                <td>${escapeHtml(item.machine_name || '')}</td>
                <td>${formatDateTime(item.actual_start_date)}${item.actual_start_date ? ` <span class="weekday-text">${getWeekdayText(item.actual_start_date)}</span>` : ''}</td>
                <td>${formatDateTime(item.actual_end_date)}${item.actual_end_date ? ` <span class="weekday-text">${getWeekdayText(item.actual_end_date)}</span>` : ''}</td>
                <td><span class="status-badge ${statusClass}">${escapeHtml(item.status_label || '')}</span></td>
                <td class="table-actions">
                    <button type="button" class="btn text op-action-btn op-role-print" data-action="print-work-order" title="${item.is_printed ? '再次列印（已列印過）' : '列印工單'}" aria-label="${item.is_printed ? '再次列印（已列印過）' : '列印工單'}">
                        <i class="fas fa-print"></i>
                    </button>
                    <button type="button" class="btn text op-action-btn op-role-screening-report" data-action="print-screening-report" title="列印品質檢驗報表" aria-label="列印品質檢驗報表">
                        <i class="fas fa-file-medical-alt"></i>
                    </button>
                    <button type="button" class="btn text" data-action="edit-work-order" title="編輯" aria-label="編輯工單">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${showConvertButton ? `
                    ${hasInventory ? `
                    <span class="op-disabled-title-wrap" title="${convertButtonLabelAttr}" aria-label="${convertButtonLabelAttr}">
                        <button type="button" class="btn text op-action-btn op-role-workflow" data-action="convert-to-inventory" title="${convertButtonLabelAttr}" aria-label="${convertButtonLabelAttr}" aria-disabled="true" data-disabled-reason="already-inventory">
                            <i class="fas fa-cogs"></i>
                        </button>
                    </span>
                    ` : `
                    <button type="button" class="btn text op-action-btn op-role-workflow" data-action="convert-to-inventory" title="${convertButtonLabelAttr}" aria-label="${convertButtonLabelAttr}">
                        <i class="fas fa-cogs"></i>
                    </button>
                    `}
                    ` : ''}
                    ${isCompleted ? `
                    <span class="op-disabled-title-wrap" title="${deleteBlockedLabelAttr}" aria-label="${deleteBlockedLabelAttr}">
                        <button type="button" class="${deleteButtonClass}" data-action="delete-work-order"${deleteDisabledAttr}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </span>
                    ` : `
                    <button type="button" class="${deleteButtonClass}" data-action="delete-work-order" aria-label="刪除工單"${deleteDisabledAttr}>
                        <i class="fas fa-trash"></i>
                    </button>
                    `}
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
    function openCreateModal(options = {}) {
        const sourceMode = options.sourceMode === 'order_item' ? 'order_item' : 'manual';
        state.editingId = null;

        // Reset UI
        elements.createModalForm.reset();
        hideModalAlert(false);

        // Reset Tabs
        setCreateSourceTab('cascade');
        setCreateSourceMode(sourceMode);

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
        setSplitRuns(false, []);
        setWorkOrderType(elements.createModalForm, 'normal');
        state.images = [];
        renderImages(false);

        elements.createModal.classList.remove('hidden');
        resetWorkOrderFormSnapshot(false);
    }

    // 開啟編輯工單 Modal (不含頁籤,直接編輯)
    async function openEditModal(id) {
        state.editingId = id;
        resetMobileQuickEntry();

        // Reset UI
        elements.editModalForm.reset();
        hideModalAlert(true);
        setSplitRuns(true, []);
        setWorkOrderType(elements.editModalForm, 'normal');
        state.productionRecordModes.edit = 'preset';
        state.productionRecordBuffers.edit = { preset: [], manual: [] };
        renderOrderDrawings([]);
        renderWorkOrderBalanceSummary({});
        renderWorkOrderBalanceAlert([]);
        renderPartialReceiptHistory([]);

        await loadWorkOrderData(id);
        setWorkOrderType(elements.editModalForm, 'normal');

        elements.editModal.classList.remove('hidden');
        startLiveTimeTicker();
        resetWorkOrderFormSnapshot(true);
    }

    function closeCreateModal(force = false) {
        if (!force && hasUnsavedWorkOrderChanges(false) && !confirmDiscardUnsavedWorkOrderChanges()) {
            return;
        }

        elements.createModal.classList.add('hidden');
        hideModalAlert(false);
        elements.createModalForm.reset();
        state.editingId = null;
        state.editingStatusLookupId = null;
        state.editingHasInventory = false;
        state.editingInventoryItemId = null;
        state.currentWorkOrder = null;
        state.orderItemDetails = null;
        state.images = [];
        state.productionRecordModes.create = 'preset';
        state.productionRecordBuffers.create = { preset: [], manual: [] };
        setSplitRuns(false, []);
        state.formSnapshots.create = null;
    }

    function closeEditModal(force = false) {
        if (!force && hasUnsavedWorkOrderChanges(true) && !confirmDiscardUnsavedWorkOrderChanges()) {
            return;
        }

        elements.editModal.classList.add('hidden');
        hideModalAlert(true);
        elements.editModalForm.reset();
        closePartialReceiptModal();
        closeCompletionModal(null);
        closeReversePartialModal();
        stopLiveTimeTicker();
        state.editingId = null;
        state.editingStatusLookupId = null;
        state.editingHasInventory = false;
        state.editingInventoryItemId = null;
        state.orderItemDetails = null;
        state.images = [];
        state.productionRecordModes.edit = 'preset';
        state.productionRecordBuffers.edit = { preset: [], manual: [] };
        renderOrderDrawings([]);
        resetMobileQuickEntry();
        setSplitRuns(true, []);
        renderWorkOrderBalanceSummary({});
        renderWorkOrderBalanceAlert([]);
        renderPartialReceiptHistory([]);
        renderWorkOrderCustomerToolAnalysis(null);
        state.formSnapshots.edit = null;
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
                state.currentWorkOrder = result.data;
                state.editingStatusLookupId = result.data.status_lookup_id ?? null;
                state.editingHasInventory = result.data.has_inventory == 1 || result.data.has_inventory === true;
                state.editingInventoryItemId = result.data.inventory_item_id ? parseInt(result.data.inventory_item_id, 10) : null;
                const partialReceiptButton = elements.editModalForm.querySelector('[data-action="create-work-order-partial-receipt"]');
                if (partialReceiptButton) {
                    const partialReceiptLockMessage = getPartialReceiptLockMessage(result.data);
                    const partialReceiptLocked = partialReceiptLockMessage !== '';
                    partialReceiptButton.disabled = false;
                    partialReceiptButton.setAttribute('aria-disabled', partialReceiptLocked ? 'true' : 'false');
                    partialReceiptButton.dataset.lockMessage = partialReceiptLockMessage;
                    partialReceiptButton.title = partialReceiptLocked
                        ? partialReceiptLockMessage
                        : '建立本次部分入庫';
                }
                populateForm(result.data, true);
                renderWorkOrderCustomerToolAnalysis(result.data);
                refreshWorkOrderBalancePresentation(result.data);
                state.images = result.data.images || [];
                renderImages(true);
                renderOrderDrawings(result.data.drawings || []);
                renderExecutionImageRows(
                    elements.editPreProductionImagesRows,
                    result.data.pre_production_images || [],
                    '尚未上傳工單圖片附件'
                );
                renderExecutionImageRows(
                    elements.editCompletionImagesRows,
                    result.data.completion_images || [],
                    '尚未上傳完工圖片'
                );
                renderExecutionImageRows(
                    elements.editDefectImagesRows,
                    result.data.defect_images || [],
                    '尚未上傳不良品圖片'
                );
                renderExecutionImageRows(
                    elements.editToolConditionImagesRows,
                    result.data.tool_condition_images || [],
                    '尚未上傳載具狀況圖片'
                );
                await renderMobileQuickEntry(result.data);

                // Load work order images
                await loadWorkOrderImages(id, true);

                // 載入篩分服務明細(合併缺陷數量資料)
                if (result.data.screening_services_details) {
                    const services = result.data.screening_services_details;
                    const defects = result.data.screening_defects || [];

                    // 建立缺陷數量查詢表
                    const defectsMap = {};
                    const notesMap = {};
                    defects.forEach(defect => {
                        const defectKey = String(defect.screening_service_id || '');
                        defectsMap[defectKey] = defect.defect_quantity;
                        notesMap[defectKey] = defect.notes || '';
                    });

                    // 合併缺陷數量到服務列表
                    services.forEach(service => {
                        const serviceKey = String(service.id || service.screening_service_id || service.index || services.indexOf(service));
                        service.defect_quantity = defectsMap[serviceKey] || 0;
                        if (notesMap[serviceKey]) {
                            service.notes = notesMap[serviceKey];
                        }
                    });

                    renderScreeningServicesTable(services, true);
                }

                const totalUnits = parseFloat(result.data.total_units) || 0;
                const existingRecords = Array.isArray(result.data.production_records) ? result.data.production_records.map((record) => cloneProductionRecord(record)) : [];
                const presetRecords = existingRecords.filter((record) => (record.production_source_mode || 'preset') !== 'manual');
                const manualRecords = existingRecords.filter((record) => record.production_source_mode === 'manual');
                state.productionRecordBuffers.edit = {
                    preset: presetRecords.length > 0
                        ? recalculateProductionRecordCards(presetRecords, totalUnits)
                        : buildPresetProductionRecordsFromOrder(result.data, totalUnits),
                    manual: buildManualProductionRecords(result.data, totalUnits, manualRecords)
                };
                state.productionRecordModes.edit = manualRecords.length > 0 && presetRecords.length === 0 ? 'manual' : (existingRecords[0]?.production_source_mode === 'manual' ? 'manual' : 'preset');
                renderProductionRecordEditor(true);

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
            const inputs = form.querySelectorAll(`[name="${key}"]`);
            if (!inputs.length) {
                continue;
            }

            inputs.forEach((input) => {
                if (input.type === 'checkbox') {
                    input.checked = !!value;
                    return;
                }

                if (input.tagName === 'SELECT') {
                    const normalizedValue = value || '';
                    input.value = normalizedValue;

                    // 選項尚未載入完成時，暫存目標值，待 populateSelect 後套用。
                    if (normalizedValue !== '' && input.value !== String(normalizedValue)) {
                        input.dataset.pendingValue = String(normalizedValue);
                    } else {
                        delete input.dataset.pendingValue;
                    }
                    return;
                }

                if (input.type === 'datetime-local' && value) {
                    input.value = value.substring(0, 16);
                } else {
                    input.value = value || '';
                }
            });
        }

        // 更新排程日期星期顯示
        const prefix = isEditMode ? 'edit' : 'create';
        updateAllScheduleWeekdays(form, prefix);
        setWorkOrderType(form, form.querySelector('[name="work_order_type"]')?.value || 'normal');
        if (isEditMode) {
            syncEditStatusDisplay();
            renderEditSecondScreeningSummary(data);
        }
        syncMachinePickerFields(form);

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
            'customer_sample_status': getSampleStatusLabel(data.customer_sample_status, data.customer_sample_status_label),
            'delivery_location': data.delivery_location,
            'total_weight_kg': (((parseFloat(data.total_weight_kg) || 0) - (parseFloat(data.total_tool_weight) || 0)).toFixed(2)),
            'weight_per_unit_g': data.weight_per_unit_g,
            'total_units': data.total_units,
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

        if (isEditMode) {
            const workOrderSummary = form.querySelector('[data-edit-summary-work-order]');
            const customerSummary = form.querySelector('[data-edit-summary-customer]');
            const productSummary = form.querySelector('[data-edit-summary-product]');
            if (workOrderSummary) {
                workOrderSummary.textContent = data.work_order_number || '--';
            }
            if (customerSummary) {
                customerSummary.textContent = data.customer_name || '--';
            }
            if (productSummary) {
                productSummary.textContent = [
                    data.part_number || '',
                    data.screening_item_name || ''
                ].filter(Boolean).join(' / ') || '--';
            }
        }

        // 設定訂單資訊欄位為唯讀
        setOrderInfoFieldsReadonly(isEditMode);

        // 儲存訂單資訊用於 Metrics Panel
        state.orderItemDetails = {
            ...data,
            order_item_id: data.order_item_id || state.orderItemDetails?.order_item_id || null,
            tool_quantity: data.tool_quantity || 0,
            total_tool_weight: data.total_tool_weight || 0,
            weight_per_unit_g: data.weight_per_unit_g || 0,
            tool_details: Array.isArray(data.tool_details) ? data.tool_details : [],
            drawings: Array.isArray(data.drawings) ? data.drawings : []
        };

        // 填充篩分服務明細表格
        renderScreeningServicesTable(data.screening_services_details || [], isEditMode);

        const currentType = form.querySelector('[name="work_order_type"]')?.value || data.work_order_type || 'normal';
        if (currentType === 'split') {
            const runs = normalizeMachineRunsFromApi(data.machine_runs || []);
            setSplitRuns(isEditMode, runs);
        } else {
            setSplitRuns(isEditMode, []);
        }
        syncSplitPanelVisibility(form, isEditMode);

        if (isEditMode) {
            renderOrderDrawings(data.drawings || []);
        }

        if (!isEditMode && currentType !== 'split') {
            state.productionRecordBuffers.create = {
                preset: buildPresetProductionRecordsFromOrder(data, data.total_units),
                manual: buildManualProductionRecords(data, data.total_units)
            };
            state.productionRecordModes.create = 'preset';
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
                    <span class="current-user-name">${escapeHtml(state.currentUser?.name || '當前用戶')}</span>
                    <input type="hidden" name="pr_operator_name[]" value="${escapeHtml(state.currentUser?.name || '')}">
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
                    <input type="text" name="pr_card_number[]" value="${escapeHtml(record.card_number || '')}" readonly class="form-control-plaintext" style="width: 80px;">
                </td>
                <td>
                    <input type="number" name="pr_weight_kg[]" value="${record.weight_kg || ''}" step="0.01" class="form-control" style="width: 80px;" placeholder="重量">
                </td>
                <td>
                    <input type="date" name="pr_date[]" value="${escapeHtml(record.production_date || '')}" class="form-control" style="width: 130px;">
                </td>
                <td>
                    <input type="time" name="pr_time[]" value="${escapeHtml(record.production_time ? record.production_time.substring(0, 5) : '')}" class="form-control" style="width: 110px;">
                </td>
                <td>
                    <select name="pr_machine_id[]" class="form-control" style="width: 120px;" onchange="updateMachineType(this)">
                        <option value="">選擇機台</option>
                        ${getMachineOptionsHtml(record.machine_id)}
                    </select>
                </td>
                <td>
                    <input type="text" name="pr_machine_type[]" value="${escapeHtml(getMachineCapabilityName(record.machine_id) || record.machine_type || '')}" readonly class="form-control-plaintext" style="width: 100px;">
                </td>
                <td>
                    <span class="current-user-name">${escapeHtml(record.employee_name || state.currentUser?.name || '')}</span>
                    <input type="hidden" name="pr_operator_name[]" value="${escapeHtml(record.employee_name || state.currentUser?.name || '')}">
                </td>
                <td>
                    <input type="text" name="pr_notes[]" value="${escapeHtml(record.notes || '')}" class="form-control" placeholder="備註">
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
                    <input type="date" name="pr_date[]" value="${escapeHtml(existingRecord.production_date || '')}" class="form-control" style="width: 130px;">
                </td>
                <td>
                    <input type="time" name="pr_time[]" value="${escapeHtml(existingRecord.production_time ? existingRecord.production_time.substring(0, 5) : '')}" class="form-control" style="width: 110px;">
                </td>
                <td>
                    <select name="pr_machine_id[]" class="form-control" style="width: 120px;" onchange="updateMachineType(this)">
                        <option value="">選擇機台</option>
                        ${getMachineOptionsHtml(existingRecord.machine_id)}
                    </select>
                </td>
                <td>
                    <input type="text" name="pr_machine_type[]" value="${escapeHtml(getMachineCapabilityName(existingRecord.machine_id) || existingRecord.machine_type || '')}" readonly class="form-control-plaintext" style="width: 100px;">
                </td>
                <td>
                    <span class="current-user-name">${escapeHtml(existingRecord.employee_name || state.currentUser?.name || '當前用戶')}</span>
                    <input type="hidden" name="pr_operator_name[]" value="${escapeHtml(existingRecord.employee_name || state.currentUser?.name || '')}">
                </td>
                <td>
                    <input type="text" name="pr_notes[]" value="${escapeHtml(existingRecord.notes || '')}" class="form-control" placeholder="備註">
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

    // 全局函式供行內 onchange 使用
    window.updateMachineType = function(select) {
        syncProductionRecordMachineCapability(select);
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
                    <td colspan="6" class="text-center text-muted">此客戶批號無篩分服務</td>
                </tr>
            `;
            return;
        }

        const html = services.map((service, index) => {
            const serviceKey = String(service.id || index);
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
            const defectQuantity = service.defect_quantity ?? 0;
            const defectInput = isEditMode
                ? `<input type="number" name="defect_quantity_${serviceKey}"
                          value="${escapeHtml(String(defectQuantity))}" min="0" step="1" inputmode="numeric"
                          data-service-id="${serviceKey}"
                          class="screening-service-defect-input" />`
                : `<span>${defectQuantity}</span>`;

            const notesValue = service.notes || '';
            const notesCell = isEditMode
                ? `<input type="text" name="screening_notes_${serviceKey}" value="${escapeHtml(notesValue)}" data-service-id="${serviceKey}" class="screening-service-notes-input" placeholder="請輸入備註" />`
                : `<span class="screening-service-notes-text">${escapeHtml(notesValue || '-')}</span>`;

            return `
            <tr data-service-index="${index}" data-service-id="${serviceKey}">
                <td>${escapeHtml(service.screening_service_name || '')}</td>
                <td class="text-right">${tolerancePlus}</td>
                <td class="text-right">${toleranceMinus}</td>
                <td class="text-right">${ppm}</td>
                <td class="text-center">${defectInput}</td>
                <td>${notesCell}</td>
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
        const orderUnits = Math.max(Math.round(parseFloat(state.orderItemDetails.total_units) || 0), 0);
        const totalToolWeight = parseFloat(state.orderItemDetails.total_tool_weight) || 0;
        const weightPerUnit = parseFloat(state.orderItemDetails.weight_per_unit_g) || 0; // 產品單重(g)
        const toolStatistics = String(state.orderItemDetails.tool_statistics || '').trim() || '--';

        // 訂單淨重 = 總重量 - 載具總重
        const orderNetWeight = orderTotalWeight - totalToolWeight;

        const workOrderType = form.querySelector('[name="work_order_type"]')?.value || 'normal';

        // 從生產紀錄計算實際數據
        let actualToolQty = 0;
        let totalProductionWeight = 0;
        let actualToolWeight = 0;

        if (workOrderType === 'split') {
            getSplitRuns(isEditMode).forEach((run) => {
                const buffers = ensureSplitRunProductionBuffers(run);
                const activeRecords = buffers[run.production_record_mode === 'manual' ? 'manual' : 'preset'] || [];
                actualToolQty += activeRecords.length;
                activeRecords.forEach((record) => {
                    totalProductionWeight += parseFloat(record.weight_kg) || 0;
                    actualToolWeight += parseFloat(record.tool_weight_kg) || 0;
                });
            });
        } else if (isEditMode) {
            syncProductionRecordBufferFromForm(true);
            const activeMode = getProductionRecordMode(true);
            const activeRecords = getProductionRecordBuffers(true)[activeMode] || [];
            actualToolQty = activeRecords.length;
            activeRecords.forEach((record) => {
                totalProductionWeight += parseFloat(record.weight_kg) || 0;
                actualToolWeight += parseFloat(record.tool_weight_kg) || 0;
            });
        } else {
            const productionRecordRows = form.querySelectorAll('.production-record-row');
            productionRecordRows.forEach(row => {
                actualToolQty++;
                totalProductionWeight += parseFloat(row.querySelector('[name="pr_weight_kg[]"]')?.value || 0) || 0;
            });
            actualToolWeight = totalToolWeight;
        }

        const hasProductionWeight = totalProductionWeight > 0;
        // 計算實際淨重 = SUM(使用者輸入重量) - 載具總重量（最低為 0）
        const actualNetWeightFromRecords = Math.max(totalProductionWeight - actualToolWeight, 0);

        // 計算不良品分布支數（人工輸入）
        let totalDefectsDistribution = 0;
        if (workOrderType === 'split') {
            getSplitRuns(isEditMode).forEach((run) => {
                (run.defects || []).forEach((defect) => {
                    totalDefectsDistribution += parseInt(defect.defect_quantity, 10) || 0;
                });
            });
        } else {
            const defectInputs = form.querySelectorAll('[name^="defect_quantity_"]');
            defectInputs.forEach(input => {
                totalDefectsDistribution += parseInt(input.value, 10) || 0;
            });
        }

        const defectUnits = totalDefectsDistribution;
        const defectWeightKg = weightPerUnit > 0
            ? (defectUnits * weightPerUnit) / 1000
            : Math.max(orderNetWeight - actualNetWeightFromRecords, 0);
        const displayActualNetWeight = hasProductionWeight
            ? actualNetWeightFromRecords
            : Math.max(orderNetWeight - defectWeightKg, 0);
        const goodUnits = hasProductionWeight && weightPerUnit > 0
            ? Math.max(Math.floor((displayActualNetWeight * 1000) / weightPerUnit), 0)
            : Math.max(orderUnits - defectUnits, 0);
        const actualTotalUnits = goodUnits + defectUnits;

        // 更新訂單預期
        setMetricValue(`${prefix}order-net-weight`, orderNetWeight.toFixed(2));
        setMetricValue(`${prefix}order-tool-quantity`, orderToolQty);
        setMetricValue(`${prefix}order-tool-weight`, totalToolWeight.toFixed(2));
        setMetricValue(`${prefix}order-tool-statistics`, toolStatistics);
        setMetricValue(`${prefix}order-total-units`, formatNumber(orderUnits));

        // 更新實際篩分後
        setMetricValue(`${prefix}actual-net-weight`, displayActualNetWeight.toFixed(2));
        setMetricValue(`${prefix}actual-tool-quantity`, actualToolQty);
        setMetricValue(`${prefix}actual-tool-weight`, actualToolWeight.toFixed(2)); // 載具重量合計
        setMetricValue(`${prefix}good-units`, formatNumber(goodUnits));
        setMetricValue(`${prefix}defect-units`, formatNumber(defectUnits));
        setMetricValue(`${prefix}defect-weight`, defectWeightKg.toFixed(3)); // 不良品重量 (kg)
        setMetricValue(`${prefix}actual-total-units`, formatNumber(actualTotalUnits));

        const defectMetric = document.querySelector(`[data-metric="${prefix}defect-units"]`);
        if (defectMetric) {
            defectMetric.title = '';
        }

        if (isEditMode && state.currentWorkOrder) {
            const preview = buildCompletionPreview();
            renderWorkOrderBalanceSummary(preview);
            const messages = preview.blockingErrors.length > 0 ? preview.blockingErrors : preview.warnings;
            renderWorkOrderBalanceAlert(messages, preview.blockingErrors.length > 0 ? 'error' : 'warning');
        }
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
            const pendingValue = select.dataset.pendingValue || '';
            const defaultOption = select.querySelector('option[value=""]');
            select.innerHTML = defaultOption ? defaultOption.outerHTML : '<option value="">-- 請選擇 --</option>';

            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item[valueKey];
                option.textContent = item[textKey];
                select.appendChild(option);
            });

            const restoreValue = pendingValue || currentValue;
            select.value = restoreValue;
            if (pendingValue && select.value === pendingValue) {
                delete select.dataset.pendingValue;
            }
        });
        if (selector === '[name="status_lookup_id"]') {
            syncEditStatusDisplay();
        }
        if (selector === '[name="machine_id"]') {
            syncMachinePickerFields();
        }
        enhanceScheduleSearchableSelects();
        selects.forEach(refreshSearchableSelect);
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
            openCreateModal({ sourceMode: 'order_item' });

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
    async function handleImageAction(event) {
        const target = event.target.closest('button');
        if (!target) return;

        const action = target.dataset.action;
        const row = target.closest('tr');
        if (!row) return;

        const imageId = row.dataset.imageId;
        const filePath = row.dataset.filePath;
        const tbody = row.parentElement;

        if (action === 'preview-image' && filePath) {
            window.open(filePath, '_blank');
        } else if (action === 'remove-image' && imageId) {
            const isEditMode = row.closest('[data-edit-images-rows]') !== null;
            const workOrderId = state.editingId;
            await handleDeleteImage(imageId, workOrderId, isEditMode);
        } else if (action === 'delete-execution-image' && imageId && tbody instanceof HTMLElement) {
            await handleDeleteExecutionImage(imageId, tbody);
        }
    }

    function getExecutionImageTableConfig(tbody) {
        if (tbody === elements.editPreProductionImagesRows) {
            return {
                endpoint: 'work_order_pre_production_images',
                label: '工單圖片附件',
                emptyMessage: '尚未上傳工單圖片附件'
            };
        }

        if (tbody === elements.editCompletionImagesRows) {
            return {
                endpoint: 'work_order_completion_images',
                label: '完工圖片',
                emptyMessage: '尚未上傳完工圖片'
            };
        }

        if (tbody === elements.editDefectImagesRows) {
            return {
                endpoint: 'work_order_defect_images',
                label: '不良品圖片',
                emptyMessage: '尚未上傳不良品圖片'
            };
        }

        if (tbody === elements.editToolConditionImagesRows) {
            return {
                endpoint: 'work_order_tool_condition_images',
                label: '載具狀況圖片',
                emptyMessage: '尚未上傳載具狀況圖片'
            };
        }

        return null;
    }

    function renderExecutionImageRows(tbody, images, emptyMessage) {
        if (!tbody) {
            return;
        }

        if (!Array.isArray(images) || images.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6" class="text-center">${escapeHtml(emptyMessage || '尚未上傳圖片')}</td>
                </tr>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();

        images.forEach((image) => {
            const filePath = String(image.file_path || '');
            const fileName = String(image.file_name || '現場圖片');
            const description = String(image.description || '-');
            const uploadedAt = formatDateTime(image.uploaded_at);
            const uploadedBy = String(image.uploaded_by_name || image.uploaded_by_employee_name || '-');

            const row = document.createElement('tr');
            row.dataset.imageId = String(image.id || '');
            row.dataset.filePath = filePath;

            const previewCell = document.createElement('td');
            const previewImage = document.createElement('img');
            previewImage.src = filePath;
            previewImage.alt = fileName;
            previewImage.style.width = '60px';
            previewImage.style.height = '60px';
            previewImage.style.objectFit = 'cover';
            previewImage.style.cursor = 'pointer';
            previewImage.addEventListener('click', () => {
                window.open(filePath, '_blank');
            });
            previewCell.appendChild(previewImage);

            const descriptionCell = document.createElement('td');
            descriptionCell.textContent = description;

            const uploadedAtCell = document.createElement('td');
            uploadedAtCell.textContent = uploadedAt;

            const uploadedByCell = document.createElement('td');
            uploadedByCell.textContent = uploadedBy;

            const actionCell = document.createElement('td');
            actionCell.className = 'text-center';
            const previewButton = document.createElement('button');
            previewButton.type = 'button';
            previewButton.className = 'btn ghost icon-only';
            previewButton.dataset.action = 'preview-image';
            previewButton.title = '預覽';
            previewButton.setAttribute('aria-label', '預覽圖片');
            previewButton.innerHTML = '<i class="fas fa-eye"></i>';
            actionCell.appendChild(previewButton);

            const deleteCell = document.createElement('td');
            deleteCell.className = 'text-center';
            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'btn ghost icon-only';
            deleteButton.dataset.action = 'delete-execution-image';
            deleteButton.title = '刪除';
            deleteButton.setAttribute('aria-label', '刪除此圖片');
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteCell.appendChild(deleteButton);

            row.appendChild(previewCell);
            row.appendChild(descriptionCell);
            row.appendChild(uploadedAtCell);
            row.appendChild(uploadedByCell);
            row.appendChild(actionCell);
            row.appendChild(deleteCell);
            fragment.appendChild(row);
        });

        tbody.replaceChildren(fragment);
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
        return escapeHtml(labels[type] || type || '-');
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

    async function handleDeleteExecutionImage(imageId, tbody) {
        const tableConfig = getExecutionImageTableConfig(tbody);
        if (!tableConfig) {
            return;
        }

        if (!confirm(`確定要刪除此${tableConfig.label}嗎?`)) {
            return;
        }

        try {
            const response = await fetch(`api/${tableConfig.endpoint}/delete.php`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: imageId })
            });

            const result = await response.json();

            if (result.success) {
                const targetRow = Array.from(tbody.querySelectorAll('tr[data-image-id]'))
                    .find((currentRow) => String(currentRow.dataset.imageId || '') === String(imageId));

                if (targetRow) {
                    targetRow.remove();
                }

                if (!tbody.querySelector('tr[data-image-id]')) {
                    renderExecutionImageRows(tbody, [], tableConfig.emptyMessage);
                }

                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies(tableConfig.endpoint, DataSync.EVENT_TYPES.DELETED, {
                        id: Number.parseInt(imageId, 10) || 0,
                        work_order_id: state.editingId || 0
                    });
                }

                showModalAlert('success', result.message || `${tableConfig.label}已刪除。`, true, true);
            } else {
                showModalAlert('danger', result.message || '刪除失敗', false, true);
            }
        } catch (error) {
            console.error('Delete execution image error:', error);
            showModalAlert('danger', '刪除發生錯誤', false, true);
        }
    }

        function isModalVisible(modal) {
            return modal && !modal.classList.contains('hidden');
        }

        async function refreshCreateModalSourcesForDataSync(sourceModule = null) {
            if (!isModalVisible(elements.createModal)) {
                return;
            }

            const customerSelect = elements.createModalForm.querySelector('[name="source_customer_id"]');
            const orderSelect = elements.createModalForm.querySelector('[name="source_order_id"]');
            const itemSelect = elements.createModalForm.querySelector('[name="order_item_id"]');
            const currentCustomerId = customerSelect?.value || '';
            const currentOrderId = orderSelect?.value || '';
            const currentOrderItemId = itemSelect?.value || '';

            if (sourceModule === 'customers') {
                await loadCustomersForSelect();
                if (customerSelect && currentCustomerId) {
                    customerSelect.value = currentCustomerId;
                }
            }

            if (currentCustomerId && ['customers', 'orders', 'order_items'].includes(sourceModule)) {
                await loadOrdersForSelect(currentCustomerId);
                if (orderSelect && currentOrderId) {
                    orderSelect.value = currentOrderId;
                }
            }

            if (currentOrderId && ['orders', 'order_items', 'work_orders'].includes(sourceModule)) {
                await loadOrderItemsForSelect(currentOrderId);
                if (itemSelect && currentOrderItemId) {
                    itemSelect.value = currentOrderItemId;
                }
            }

            const searchResults = elements.createModalForm.querySelector('[data-search-results]');
            if (
                searchResults &&
                !searchResults.classList.contains('hidden') &&
                ['orders', 'order_items', 'work_orders'].includes(sourceModule)
            ) {
                await performSearch();
            }
        }

        async function refreshOpenWorkOrderModalForDataSync(sourceModule = null) {
            if (isModalVisible(elements.editModal) && state.editingId) {
                await loadWorkOrderData(state.editingId);
            }

            await refreshCreateModalSourcesForDataSync(sourceModule);
        }

        async function refreshWorkOrdersForDataSync(sourceModule = null) {
            if (sourceModule === 'machines') {
                await loadMachines();
            }
            if (sourceModule === 'employees') {
                await loadEmployees();
            }
            if (sourceModule === 'lookup_values') {
                await loadStatuses();
            }
            await loadWorkOrders();
            await refreshOpenWorkOrderModalForDataSync(sourceModule);
        }

        // 建立資料同步輔助器
        if (typeof DataSync !== 'undefined') {
            DataSync.createModuleHelper('work_orders', {
                onRefresh: () => refreshWorkOrdersForDataSync(),
                onDependencyUpdate: (sourceModule) => refreshWorkOrdersForDataSync(sourceModule),
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
