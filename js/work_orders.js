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
        screeningServicesBody: moduleRoot.querySelector('[data-screening-services-body]'),
        liveTimeLabel: moduleRoot.querySelector('[data-work-orders-live-time]')
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
        splitMachineRuns: {
            create: [],
            edit: []
        },
        createSourceMode: 'manual',
        machines: [],
        employees: [],
        currentUser: null,
        liveTimeIntervalId: null
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

    function init() {
        loadCurrentUser();
        loadMachines();
        loadEmployees();
        loadStatuses();
        loadWorkOrders();
        attachEventListeners();
        setupMirroredFormFields(elements.createModalForm, ['machine_id', 'assigned_employee_id', 'calibration_employee_id']);
        setupMirroredFormFields(elements.editModalForm, ['machine_id', 'assigned_employee_id', 'calibration_employee_id']);
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
                        }
                    });
                });
            });
        });
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

    function parseDateTime(value) {
        if (!value) {
            return null;
        }
        const normalized = String(value).trim().replace(' ', 'T');
        const date = new Date(normalized);
        return Number.isNaN(date.getTime()) ? null : date;
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
            production_records: [],
            defects: buildMachineRunDefects([])
        };
    }

    function createEmptySplitProductionRecord(run = {}) {
        return {
            card_number: '',
            weight_kg: '',
            production_date: '',
            production_time: '',
            machine_id: run.machine_id || '',
            notes: ''
        };
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
            const labelParts = [
                machine.machine_number ? String(machine.machine_number) : '',
                machine.name ? String(machine.name) : ''
            ].filter(Boolean);
            options.push(`<option value="${escapeHtml(id)}"${selected}>${escapeHtml(labelParts.join(' - ') || id)}</option>`);
        });
        return options.join('');
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
                    <td>${escapeHtml(defect.service_name || `項目 ${defect.screening_service_id}`)}</td>
                    <td class="text-right">${escapeHtml(tolerancePlus)}</td>
                    <td class="text-right">${escapeHtml(toleranceMinus)}</td>
                    <td class="text-right">${escapeHtml(ppm)}</td>
                    <td>
                        <input type="number" min="0" step="1" value="${escapeHtml(String(defect.defect_quantity ?? 0))}" data-split-field="defect_quantity" data-defect-index="${defectIndex}" style="width: 100%; padding: 4px;">
                    </td>
                    <td>${escapeHtml(defect.notes || '')}</td>
                </tr>
            `;
        }).join('');
        const productionRecordsHtml = getSplitProductionRecordsHtml(run);
        const machineName = getMachineDisplayName(run.machine_id) || '未選機台';

        editor.innerHTML = `
            <div class="split-machine-content-stack" data-run-index="${activeIndex}">
                <section class="split-machine-card">
                    <h5>拆分統計</h5>
                    <div class="split-summary-grid">
                        <span>主工單淨重</span><strong data-split-summary="expected">0.00 kg</strong>
                        <span>機台完成淨重</span><strong data-split-summary="completed">0.00 kg</strong>
                        <span>尚可分配</span><strong data-split-summary="remaining">0.00 kg</strong>
                    </div>
                </section>

                <section class="split-machine-card">
                    <div class="split-machine-card-header">
                        <h5>生產排程資訊</h5>
                        <span class="split-machine-name">${escapeHtml(machineName)}</span>
                    </div>
                    <div class="form-grid form-grid-four-columns">
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
                </section>

                <section class="split-machine-card">
                    <div class="split-machine-card-header">
                        <h5>生產履歷</h5>
                        <button type="button" class="btn outline small" data-action="add-split-production-record">
                            <i class="fas fa-plus"></i> 新增履歷
                        </button>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table compact split-production-records-table">
                            <thead>
                                <tr>
                                    <th>卡號</th>
                                    <th>重量(kg)</th>
                                    <th>日期</th>
                                    <th>時間</th>
                                    <th>備註</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>${productionRecordsHtml}</tbody>
                        </table>
                    </div>
                </section>

                <section class="split-machine-card">
                    <h5>篩分服務明細（自動帶入）</h5>
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
                </section>

                <section class="split-machine-card">
                    <h5>生產設定</h5>
                    <div class="form-grid form-grid-four-columns">
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
            </div>
        `;
        updateSplitSummary(isEditMode);
    }

    function getSplitProductionRecordsHtml(run) {
        const records = Array.isArray(run.production_records) ? run.production_records : [];
        if (!records.length) {
            return '<tr class="empty-row"><td colspan="6" class="text-center text-muted">尚未建立此機台的生產履歷</td></tr>';
        }

        return records.map((record, index) => `
            <tr data-split-production-record-row data-record-index="${index}">
                <td><input type="text" value="${escapeHtml(record.card_number || '')}" data-split-record-field="card_number" placeholder="卡號"></td>
                <td><input type="number" step="0.01" value="${escapeHtml(String(record.weight_kg || ''))}" data-split-record-field="weight_kg" placeholder="重量"></td>
                <td><input type="date" value="${escapeHtml(record.production_date || '')}" data-split-record-field="production_date"></td>
                <td><input type="time" value="${escapeHtml(record.production_time ? String(record.production_time).substring(0, 5) : '')}" data-split-record-field="production_time"></td>
                <td><input type="text" value="${escapeHtml(record.notes || '')}" data-split-record-field="notes" placeholder="備註"></td>
                <td>
                    <button type="button" class="btn icon danger" data-action="remove-split-production-record" aria-label="移除生產履歷">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
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

    async function askMachineSelectionDialog({ title = '選擇機台', message = '請先選擇要加入拆分流程的機台。' } = {}) {
        return new Promise((resolve) => {
            document.querySelector('[data-machine-picker-modal]')?.remove();

            const availableMachines = state.machines;
            if (!availableMachines.length) {
                showAlert('目前沒有可選機台，請先到機台設備管理確認機台資料。', 'warning');
                resolve('');
                return;
            }

            const machineOptions = availableMachines
                .map((machine) => `<option value="${escapeHtml(String(machine.id))}">${escapeHtml(getMachineDisplayName(machine.id))}</option>`)
                .join('');

            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.setAttribute('data-machine-picker-modal', 'true');
            overlay.style.zIndex = '3000';
            overlay.innerHTML = `
                <div class="modal-window small" role="dialog" aria-modal="true" aria-labelledby="machine-picker-title">
                    <h3 id="machine-picker-title">${escapeHtml(title)}</h3>
                    <p class="text-muted" style="margin-bottom: 12px;">${escapeHtml(message)}</p>
                    <label class="inline-label">
                        <span>機台設備</span>
                        <select data-machine-picker-select>
                            <option value="">-- 請選擇機台 --</option>
                            ${machineOptions}
                        </select>
                    </label>
                    <div class="form-actions align-right" style="margin-top: 14px;">
                        <button type="button" class="btn outline" data-choice="cancel">取消</button>
                        <button type="button" class="btn primary" data-choice="confirm">確認新增</button>
                    </div>
                </div>
            `;

            const select = overlay.querySelector('[data-machine-picker-select]');

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
                const selectedId = select ? String(select.value || '') : '';
                if (!selectedId) {
                    showAlert('請先選擇機台設備。', 'warning');
                    return;
                }
                cleanup(selectedId);
            });

            document.addEventListener('keydown', handleKeydown);
            document.body.appendChild(overlay);
            select?.focus();
        });
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
            });
            if (!selectedMachineId) {
                return;
            }
            run.machine_id = selectedMachineId;
            run.production_records = (run.production_records || []).map(record => ({
                ...record,
                machine_id: selectedMachineId
            }));
            renderSplitMachineRuns(isEditMode);
            return;
        }

        if (actionEl.dataset.action === 'select-machine-run') {
            panel.dataset.activeRunIndex = String(parseInt(actionEl.dataset.runIndex || '0', 10) || 0);
            renderSplitMachineRuns(isEditMode);
            return;
        }

        if (actionEl.dataset.action === 'add-split-production-record') {
            const activeIndex = parseInt(panel.dataset.activeRunIndex || '0', 10) || 0;
            const run = runs[activeIndex];
            if (!run) return;
            if (!Array.isArray(run.production_records)) {
                run.production_records = [];
            }
            run.production_records.push(createEmptySplitProductionRecord(run));
            renderSplitMachineRuns(isEditMode);
            return;
        }

        if (actionEl.dataset.action === 'remove-split-production-record') {
            const activeIndex = parseInt(panel.dataset.activeRunIndex || '0', 10) || 0;
            const recordRow = actionEl.closest('[data-split-production-record-row]');
            const recordIndex = parseInt(recordRow?.dataset.recordIndex || '-1', 10);
            const run = runs[activeIndex];
            if (!run || !Array.isArray(run.production_records) || recordIndex < 0) return;
            run.production_records.splice(recordIndex, 1);
            renderSplitMachineRuns(isEditMode);
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
            if (!run || !Array.isArray(run.production_records) || recordIndex < 0 || !run.production_records[recordIndex]) return;
            run.production_records[recordIndex][recordField.dataset.splitRecordField] = recordField.value;
            run.production_records[recordIndex].machine_id = run.machine_id || '';
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
        } else {
            run[fieldName] = field.value;
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
            production_records: Array.isArray(run.production_records) ? run.production_records : [],
            defects: buildMachineRunDefects(run.defects || [])
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
            production_records: (run.production_records || [])
                .filter(record => hasSubmittedValue(record.card_number)
                    && ['weight_kg', 'production_date', 'production_time', 'notes'].some(field => hasSubmittedValue(record[field])))
                .map(record => ({
                    card_number: record.card_number || '',
                    weight_kg: record.weight_kg || null,
                    production_date: record.production_date || null,
                    production_time: record.production_time || null,
                    machine_id: run.machine_id || null,
                    notes: record.notes || null
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
                handleSplitMachineInput(e, false);
            });

            elements.createModalForm.addEventListener('click', async (e) => {
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
                handleSplitMachineInput(e, true);
            });

            elements.editModalForm.addEventListener('change', (e) => {
                handleSplitMachineInput(e, true);
            });

            elements.editModalForm.addEventListener('click', async (e) => {
                const typeSwitchButton = e.target.closest('[data-action="set-work-order-type"]');
                if (typeSwitchButton) {
                    setWorkOrderType(elements.editModalForm, typeSwitchButton.dataset.value || 'normal');
                    return;
                }
                if (e.target.closest('[data-action="create-work-order-partial-receipt"]')) {
                    await createPartialReceiptForWorkOrder();
                    return;
                }
                await handleSplitMachineAction(e, true);
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

    async function submitPartialReceipt(payload) {
        try {
            const response = await fetch('api/work_orders/partial_receipt.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (!result.success) {
                showModalAlert('error', result.message || '部分完工入庫失敗。', false, true);
                return;
            }

            showModalAlert('success', result.message || '部分完工入庫完成。', true, true);
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
        } catch (error) {
            console.error('Create partial receipt error:', error);
            showModalAlert('error', '部分完工入庫時發生錯誤，請檢查網路連線或主控台。', false, true);
        }
    }

    async function createPartialReceiptForMachineRun(run) {
        if (!state.editingId || !run || !run.id) {
            showModalAlert('error', '請先儲存拆分機台明細後，再執行部分完工入庫。', false, true);
            return;
        }

        const completedNetWeight = parseFloat(run.completed_net_weight_kg) || 0;
        const receivedNetWeight = parseFloat(run.partial_receipt_net_weight_kg) || 0;
        const remainingNetWeight = Math.max(0, completedNetWeight - receivedNetWeight);
        if (run.status !== 'completed' || remainingNetWeight <= 0.0001) {
            showModalAlert('error', '只有已完成且尚有剩餘淨重的機台可以部分入庫。', false, true);
            return;
        }

        const confirmed = confirm(`確定要將「${run.run_label || '機台'}」剩餘 ${remainingNetWeight.toFixed(2)} kg 建立為部分完工入庫嗎？\n\n主工單仍需所有機台完成後才可結案。`);
        if (!confirmed) {
            return;
        }

        await submitPartialReceipt({
            work_order_id: state.editingId,
            machine_run_id: run.id
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

        const confirmed = confirm('確定要為此一般工單建立部分完工入庫嗎？\n\n系統會以工單剩餘可入庫淨重建立庫存。');
        if (!confirmed) {
            return;
        }

        await submitPartialReceipt({
            work_order_id: state.editingId
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
        return ['weight_kg', 'production_date', 'production_time', 'machine_id', 'notes']
            .some(field => hasSubmittedValue(record[field]));
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
                const record = {
                    card_number: cardInput.value,
                    weight_kg: weightInput ? weightInput.value : null,
                    production_date: dateInput ? dateInput.value : null,
                    production_time: timeInput ? timeInput.value : null,
                    machine_id: machineSelect ? machineSelect.value : null,
                    operator_name: operatorInput ? operatorInput.value : (state.currentUser?.name || ''),
                    notes: notesInput ? notesInput.value : null
                };

                if (hasSubmittedValue(record.card_number) && isMeaningfulProductionRecord(record)) {
                    productionRecords.push(record);
                }
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
            if (hasSubmittedValue(value)) {
                fpData[field.replace('fp_', '')] = value;
            }
        });

        if (Object.keys(fpData).length > 0) {
            data.first_piece_dimensions = fpData;
        }

        const workOrderType = form.querySelector('[name="work_order_type"]')?.value || 'normal';
        data.work_order_type = workOrderType;
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
                ? (customerIsActive ? escapeHtml(item.customer_name) : `${escapeHtml(item.customer_name)} <span class="text-muted">(已停用)</span>`)
                : '';

            // checkbox 狀態
            const isChecked = selectedWorkOrders.has(item.id) ? 'checked' : '';

            return `
            <tr data-id="${item.id}" data-status-key="${statusKeyAttr}" data-status-label="${statusLabelAttr}"${completedRowClass}>
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
                    <button type="button" class="btn text op-action-btn op-role-print" data-action="print-work-order" title="${item.is_printed ? '再次列印（已列印過）' : '列印工單'}" aria-label="${item.is_printed ? '再次列印（已列印過）' : '列印工單'}">
                        <i class="fas fa-print"></i>
                    </button>
                    <button type="button" class="btn text op-action-btn op-role-screening-report" data-action="print-screening-report" title="列印篩分檢驗結果報表" aria-label="列印篩分檢驗結果報表">
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
    }

    // 開啟編輯工單 Modal (不含頁籤,直接編輯)
    async function openEditModal(id) {
        state.editingId = id;

        // Reset UI
        elements.editModalForm.reset();
        hideModalAlert(true);
        setSplitRuns(true, []);

        await loadWorkOrderData(id);

        elements.editModal.classList.remove('hidden');
        startLiveTimeTicker();
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
        setSplitRuns(false, []);
    }

    function closeEditModal() {
        elements.editModal.classList.add('hidden');
        hideModalAlert(true);
        elements.editModalForm.reset();
        stopLiveTimeTicker();
        state.editingId = null;
        state.editingStatusLookupId = null;
        state.editingHasInventory = false;
        state.editingInventoryItemId = null;
        state.orderItemDetails = null;
        state.images = [];
        setSplitRuns(true, []);
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

        const currentType = form.querySelector('[name="work_order_type"]')?.value || data.work_order_type || 'normal';
        if (currentType === 'split') {
            const runs = normalizeMachineRunsFromApi(data.machine_runs || []);
            setSplitRuns(isEditMode, runs);
        } else {
            setSplitRuns(isEditMode, []);
        }
        syncSplitPanelVisibility(form, isEditMode);

        // 自動生成並填充生產紀錄表格 (僅在新增模式或無紀錄時)
        // 根據需求: 總支數/載具數量 = 卡號
        if (currentType === 'split') {
            // 拆分工單的生產履歷掛在各機台頁籤內，避免主工單與機台履歷混在一起。
        } else if (!isEditMode && data.total_units && data.tool_quantity) {
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
                    <td colspan="6" class="text-center text-muted">此客戶批號無篩分服務</td>
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

        // 計算實際淨重 = SUM(使用者輸入重量) - 載具總重量（最低為 0）
        const actualNetWeight = Math.max(totalProductionWeight - totalToolWeight, 0);

        // 計算不良品分布支數（人工輸入）
        let totalDefectsDistribution = 0;
        const defectInputs = form.querySelectorAll('[name^="defect_quantity_"]');
        defectInputs.forEach(input => {
            totalDefectsDistribution += parseInt(input.value) || 0;
        });

        // 重量優先口徑：不良品重量 = 訂單淨重 - 篩分後淨重
        const defectWeightKg = Math.max(orderNetWeight - actualNetWeight, 0);

        // 良品支數 = (篩分後淨重 * 1000) / 產品單重(g)
        const goodUnits = weightPerUnit > 0 ? Math.max(Math.floor((actualNetWeight * 1000) / weightPerUnit), 0) : 0;

        // 不良品支數（重量換算）
        const defectUnits = weightPerUnit > 0 ? Math.max(Math.round((defectWeightKg * 1000) / weightPerUnit), 0) : 0;
        const defectUnitsDiff = defectUnits - totalDefectsDistribution;

        // 總支數 = 良品支數 + 不良品支數（重量換算）
        const actualTotalUnits = goodUnits + defectUnits;

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
        setMetricValue(`${prefix}defect-units`, formatNumber(defectUnits));
        setMetricValue(`${prefix}defect-units-distribution`, formatNumber(totalDefectsDistribution));
        setMetricValue(`${prefix}defect-units-diff`, formatNumber(defectUnitsDiff), defectUnitsDiff);
        setMetricValue(`${prefix}defect-weight`, defectWeightKg.toFixed(3)); // 不良品重量 (kg)
        setMetricValue(`${prefix}actual-total-units`, formatNumber(actualTotalUnits));
        setMetricValue(`${prefix}actual-total-weight`, actualTotalWeight.toFixed(2)); // 總重量 = 淨重 + 載具重量 + 不良品重量

        const defectMetric = document.querySelector(`[data-metric="${prefix}defect-units"]`);
        if (defectMetric) {
            defectMetric.title = `分布合計：${formatNumber(totalDefectsDistribution)} 支`;
        }

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
