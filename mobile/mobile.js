(function () {
    'use strict';

    const bootstrapEl = document.getElementById('mobile-bootstrap');
    const bootstrap = bootstrapEl ? JSON.parse(bootstrapEl.textContent || '{}') : {};
    const state = {
        mode: bootstrap.authenticated ? 'app' : 'guest',
        csrfToken: bootstrap.csrfToken || '',
        basePath: bootstrap.basePath || '../',
        currentUser: bootstrap.currentUser || null,
        statuses: [],
        statusByKey: {},
        machines: [],
        workOrders: [],
        pagination: null,
        selectedWorkOrderId: null,
        currentWorkOrder: null,
        modalAction: null,
        pendingUploadWorkOrderId: null,
        uploadDraft: [],
        currentSection: bootstrap.requestedSection || 'work_orders',
        detailSectionState: {
            work_order_info: false,
            screening_services: false,
            production_records: true,
        },
        inspections: [],
        inspectionsPagination: null,
        inspectionsMeta: {
            machines: [],
            employees: [],
        },
        qualityIssueMeta: {
            departments: [],
            statusOptions: [],
            sourceTypeOptions: [],
        },
        detailProductionRecordAction: null,
    };

    const MOBILE_SECTION_META = {
        work_orders: {
            title: '生產工單',
            kicker: 'WORK ORDERS',
            subtitle: '現場工單清單、開工、部分入庫、完工、異常與拍照回報。',
            emptyTitle: '手機版生產工單已可使用',
            emptyText: '此頁面已完成第一版手機操作流程，供現場人員直接使用。',
        },
        machines: {
            title: '機台設備管理',
            kicker: 'MACHINES',
            subtitle: '預留手機版機台資訊入口，後續可補上查詢與點檢相關操作。',
            emptyTitle: '機台設備管理手機頁面已建立入口',
            emptyText: '目前先保留手機版頁面位置，後續可逐步補上查詢、狀態查看與現場操作。',
        },
        machine_capabilities: {
            title: '機台能力管理',
            kicker: 'CAPABILITIES',
            subtitle: '預留手機版機台能力管理入口。',
            emptyTitle: '機台能力管理手機頁面已建立入口',
            emptyText: '目前先提供手機版導覽與頁面骨架，後續可接續補齊功能。',
        },
        machine_maintenance_tasks: {
            title: '機台維修任務',
            kicker: 'MAINTENANCE',
            subtitle: '預留手機版維修任務入口，供後續擴充。',
            emptyTitle: '機台維修任務手機頁面已建立入口',
            emptyText: '目前先保留手機版頁面位置，後續可接續補上任務查詢與回報。',
        },
        daily_machine_inspections: {
            title: '每日機台檢驗',
            kicker: 'INSPECTIONS',
            subtitle: '現場每日檢驗查詢、新增與修正紀錄。',
            emptyTitle: '每日機台檢驗已可於手機操作',
            emptyText: '可直接在手機建立與更新每日機台檢驗紀錄，方便現場巡檢。',
        },
        production_work_order_schedule: {
            title: '生產工單排程',
            kicker: 'SCHEDULE',
            subtitle: '預留手機版工單排程入口。',
            emptyTitle: '生產工單排程手機頁面已建立入口',
            emptyText: '目前先提供手機版導覽入口，後續可補上行動版排程檢視。',
        },
    };

    const API_BASE = `${state.basePath}api`;
    const MOBILE_INDEX_URL = `${window.location.pathname}${window.location.search}`;
    const MOBILE_DATA_SYNC_DEPENDENCIES = {
        work_order_completion_images: ['work_orders'],
        work_order_defect_images: ['work_orders'],
        work_order_tool_condition_images: ['work_orders'],
        work_orders: ['order_items', 'orders', 'work_order_images', 'work_order_first_piece_dimensions', 'inventory_items', 'inventory_transactions', 'dashboard', 'production_records', 'production_work_order_schedule'],
        quality_issue_reports: ['dashboard'],
        daily_machine_inspections: ['daily_machine_inspection_items'],
    };

    document.addEventListener('DOMContentLoaded', () => {
        if (state.mode === 'guest') {
            initGuestMode();
            return;
        }

        initAppMode();
    });

    function initGuestMode() {
        const form = document.getElementById('mobile-login-form');
        const accountInput = document.getElementById('mobile-account');
        const passwordInput = document.getElementById('mobile-password');
        const rememberCheckbox = document.getElementById('mobile-remember-me');
        const submitButton = form ? form.querySelector('button[type="submit"]') : null;
        const yearEl = document.getElementById('mobile-login-year');

        if (yearEl) {
            yearEl.textContent = String(new Date().getFullYear());
        }

        loadCompanyBranding();
        initFuiParticles();
        renderGuestReasonNotice();
        bindPasswordToggle(passwordInput, document.getElementById('mobile-toggle-password'));

        if (!form || !accountInput || !passwordInput || !rememberCheckbox) {
            showGuestFeedback('error', '登入表單載入失敗，請重新整理頁面。');
            return;
        }

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const account = accountInput.value.trim();
            const password = passwordInput.value;
            const rememberMe = rememberCheckbox.checked;

            if (!account || !password) {
                showGuestFeedback('error', '請輸入帳號與密碼。');
                return;
            }

            toggleGuestSubmitting(true, submitButton);

            try {
                const result = await fetchJson(`${API_BASE}/login.php`, {
                    method: 'POST',
                    body: {
                        account,
                        password,
                        rememberMe,
                    },
                });

                if (result.csrf_token) {
                    sessionStorage.setItem('csrf_token', result.csrf_token);
                }

                showGuestFeedback('success', result.message || '登入成功，正在進入手機版...');
                window.setTimeout(() => {
                    window.location.href = MOBILE_INDEX_URL;
                }, 500);
            } catch (error) {
                showGuestFeedback('error', error.message || '登入失敗，請稍後再試。');
            } finally {
                toggleGuestSubmitting(false, submitButton);
            }
        });
    }

    async function initAppMode() {
        const refreshButton = document.getElementById('mobile-refresh-button');
        const filterForm = document.getElementById('mobile-filter-form');
        const resetButton = document.getElementById('mobile-filter-reset-button');
        const logoutButton = document.getElementById('mobile-logout-button');
        const menuButton = document.getElementById('mobile-menu-button');
        const detailSheet = document.getElementById('mobile-detail-sheet');
        const actionModal = document.getElementById('mobile-action-modal');
        const drawer = document.getElementById('mobile-drawer');
        const actionForm = document.getElementById('mobile-action-form');
        const inspectionsRefreshButton = document.getElementById('mobile-inspections-refresh-button');
        const inspectionsCreateButton = document.getElementById('mobile-inspections-create-button');
        const inspectionsFilterForm = document.getElementById('mobile-inspections-filter-form');
        const inspectionsResetButton = document.getElementById('mobile-inspections-filter-reset-button');

        if (sessionStorage.getItem('csrf_token') && !state.csrfToken) {
            state.csrfToken = sessionStorage.getItem('csrf_token') || '';
        }

        if (!state.csrfToken) {
            try {
                const sessionResult = await fetchJson(`${API_BASE}/session.php`);
                state.csrfToken = sessionResult.csrf_token || '';
            } catch (_error) {
                // 留給後續寫入操作時再處理
            }
        }

        loadCompanyBranding();

        refreshButton?.addEventListener('click', () => loadWorkOrders(true));
        resetButton?.addEventListener('click', handleFilterReset);
        filterForm?.addEventListener('submit', (event) => {
            event.preventDefault();
            loadWorkOrders(true);
        });
        inspectionsRefreshButton?.addEventListener('click', () => loadDailyInspections(true));
        inspectionsCreateButton?.addEventListener('click', () => openInspectionModal('create'));
        inspectionsResetButton?.addEventListener('click', handleInspectionFilterReset);
        inspectionsFilterForm?.addEventListener('submit', (event) => {
            event.preventDefault();
            loadDailyInspections(true);
        });
        logoutButton?.addEventListener('click', handleLogout);
        menuButton?.addEventListener('click', toggleDrawer);
        window.addEventListener('scroll', syncTopbarCompactState, { passive: true });
        window.addEventListener('popstate', () => {
            const section = new URL(window.location.href).searchParams.get('section') || 'work_orders';
            applySectionState(section, { replaceHistory: true });
        });
        syncTopbarCompactState();

        drawer?.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) {
                return;
            }
            if (target.dataset.action === 'close-drawer') {
                closeDrawer();
                return;
            }

            const link = target.closest('.mobile-drawer-link');
            if (link instanceof HTMLAnchorElement) {
                event.preventDefault();
                closeDrawer();
                applySectionState(link.dataset.section || 'work_orders', { pushHistory: true });
            }
        });

        detailSheet?.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) {
                return;
            }
            if (target.dataset.action === 'close-detail') {
                closeDetailSheet();
            }
        });

        actionModal?.addEventListener('click', (event) => {
            const target = event.target instanceof HTMLElement ? event.target.closest('button[data-action]') : null;
            if (!(target instanceof HTMLElement)) {
                return;
            }

            if (target.dataset.action === 'close-modal') {
                closeActionModal();
                return;
            }
            if (target.dataset.action === 'remove-upload-file') {
                event.preventDefault();
                removeUploadDraftFile(target.dataset.uploadDraftId || '');
                return;
            }
            if (target.dataset.action === 'toggle-production-mode') {
                event.preventDefault();
                handleProductionRecordModeToggle(String(target.dataset.mode || 'preset'));
                return;
            }
            if (target.dataset.action === 'add-production-row') {
                event.preventDefault();
                addProductionRecordDraftRow();
                return;
            }
            if (target.dataset.action === 'remove-production-row') {
                event.preventDefault();
                removeProductionRecordDraftRow(Number(target.dataset.rowIndex || -1));
            }
        });

        actionForm?.addEventListener('submit', handleActionSubmit);
        actionForm?.addEventListener('change', handleActionFormChange);
        actionForm?.addEventListener('input', handleActionFormChange);

        document.getElementById('mobile-work-order-list')?.addEventListener('click', handleListActionClick);
        document.getElementById('mobile-detail-content')?.addEventListener('click', handleDetailActionClick);
        document.getElementById('mobile-detail-content')?.addEventListener('change', handleDetailContentChange);
        document.getElementById('mobile-inspections-list')?.addEventListener('click', handleInspectionListClick);

        await Promise.all([loadStatuses(), loadMachines(), loadQualityIssueMeta()]);
        applySectionState(state.currentSection, { replaceHistory: true });
        await loadWorkOrders(true);

        const requestedId = parseInt(new URLSearchParams(window.location.search).get('work_order_id') || '', 10);
        if (requestedId > 0) {
            openWorkOrderDetail(requestedId);
        }
    }

    async function loadStatuses() {
        const result = await fetchJson(`${API_BASE}/lookup_values/index.php?domain_key=status_work_order`);
        state.statuses = Array.isArray(result.data) ? result.data : [];
        state.statusByKey = {};
        state.statuses.forEach((status) => {
            state.statusByKey[String(status.value_key || '')] = status;
        });

        const select = document.getElementById('mobile-filter-status');
        if (select) {
            select.innerHTML = '<option value="">全部狀態</option>' + state.statuses
                .map((status) => `<option value="${escapeHtml(String(status.value_key || ''))}">${escapeHtml(String(status.value_label || ''))}</option>`)
                .join('');
        }
    }

    async function loadMachines() {
        const result = await fetchJson(`${API_BASE}/machines/index.php?perPage=500`);
        state.machines = Array.isArray(result.data) ? result.data : [];

        const select = document.getElementById('mobile-filter-machine');
        if (select) {
            select.innerHTML = '<option value="">全部機台</option>' + state.machines
                .map((machine) => `<option value="${escapeHtml(String(machine.id || ''))}">${escapeHtml(String(machine.name || '未命名機台'))}</option>`)
                .join('');
        }
    }

    async function loadQualityIssueMeta() {
        try {
            const result = await fetchJson(`${API_BASE}/quality_issue_reports/index.php?perPage=1`);
            state.qualityIssueMeta.departments = Array.isArray(result.departments) ? result.departments : [];
            state.qualityIssueMeta.statusOptions = Array.isArray(result.statusOptions) ? result.statusOptions : [];
            state.qualityIssueMeta.sourceTypeOptions = Array.isArray(result.sourceTypeOptions) ? result.sourceTypeOptions : [];
        } catch (_error) {
            state.qualityIssueMeta.departments = [];
            state.qualityIssueMeta.statusOptions = [];
            state.qualityIssueMeta.sourceTypeOptions = [];
        }
    }

    async function loadDailyInspections(resetSelection) {
        const params = new URLSearchParams();
        const machineId = getInputValue('mobile-inspections-filter-machine');
        const isQualified = getInputValue('mobile-inspections-filter-qualified');
        const dateFrom = getInputValue('mobile-inspections-filter-date-from');
        const dateTo = getInputValue('mobile-inspections-filter-date-to');

        if (machineId) params.set('machine_id', machineId);
        if (isQualified !== '') params.set('is_qualified', isQualified);
        if (dateFrom) params.set('date_from', dateFrom);
        if (dateTo) params.set('date_to', dateTo);
        params.set('perPage', '50');

        setInspectionListState('載入每日機台檢驗中...');

        try {
            const result = await fetchJson(`${API_BASE}/daily_machine_inspections/index.php?${params.toString()}`);
            state.inspections = Array.isArray(result.data) ? result.data : [];
            state.inspectionsPagination = result.pagination || null;
            state.inspectionsMeta.machines = Array.isArray(result.machines) ? result.machines : [];
            state.inspectionsMeta.employees = Array.isArray(result.employees) ? result.employees : [];

            populateInspectionMachineFilter();
            renderInspectionCards(state.inspections);
            setInspectionListState(`目前共 ${state.inspectionsPagination?.total ?? state.inspections.length} 筆每日機台檢驗`);

            if (resetSelection && state.modalAction?.type === 'inspection_edit') {
                const exists = state.inspections.some((item) => Number(item.id) === Number(state.modalAction.inspectionId));
                if (!exists) {
                    closeActionModal();
                }
            }
        } catch (error) {
            state.inspections = [];
            renderInspectionCards([]);
            setInspectionListState(error.message || '載入每日機台檢驗失敗。');
        }
    }

    async function loadWorkOrders(resetSelection) {
        const params = new URLSearchParams();
        const keyword = getInputValue('mobile-filter-keyword');
        const status = getInputValue('mobile-filter-status');
        const machineId = getInputValue('mobile-filter-machine');
        const startDate = getInputValue('mobile-filter-start-date');
        const endDate = getInputValue('mobile-filter-end-date');

        if (keyword) params.set('keyword', keyword);
        if (status) params.set('status', status);
        if (machineId) params.set('machine_id', machineId);
        if (startDate) params.set('start_date', startDate);
        if (endDate) params.set('end_date', endDate);
        params.set('perPage', '50');
        params.set('sortBy', 'id');
        params.set('sortOrder', 'DESC');

        setListState('載入工單中...');

        try {
            const result = await fetchJson(`${API_BASE}/work_orders/index.php?${params.toString()}`);
            state.workOrders = Array.isArray(result.data) ? result.data : [];
            state.pagination = result.pagination || null;
            renderSummary(state.workOrders);
            renderWorkOrderCards(state.workOrders);
            setListState(`目前共 ${state.pagination?.total ?? state.workOrders.length} 張工單`);

            if (resetSelection && state.selectedWorkOrderId) {
                const stillExists = state.workOrders.some((item) => Number(item.id) === Number(state.selectedWorkOrderId));
                if (!stillExists) {
                    closeDetailSheet();
                }
            }
        } catch (error) {
            state.workOrders = [];
            renderSummary([]);
            renderWorkOrderCards([]);
            setListState(error.message || '載入工單失敗。');
        }
    }

    function renderSummary(workOrders) {
        const summary = {
            total: workOrders.length,
            inProgress: 0,
            paused: 0,
            completed: 0,
        };

        workOrders.forEach((item) => {
            const key = String(item.status_key || '');
            if (key === 'in_progress') summary.inProgress += 1;
            if (key === 'paused') summary.paused += 1;
            if (key === 'completed') summary.completed += 1;
        });

        setText('mobile-summary-total', String(summary.total));
        setText('mobile-summary-in-progress', String(summary.inProgress));
        setText('mobile-summary-paused', String(summary.paused));
        setText('mobile-summary-completed', String(summary.completed));
    }

    function renderWorkOrderCards(workOrders) {
        const container = document.getElementById('mobile-work-order-list');
        if (!container) {
            return;
        }

        container.dataset.initialised = 'true';

        if (!workOrders.length) {
            container.innerHTML = '<div class="mobile-empty-state"><strong>查無符合條件的工單</strong><p class="mobile-empty-text">你可以調整搜尋條件，或直接重新整理清單。</p></div>';
            return;
        }

        container.innerHTML = workOrders.map((item) => {
            const actions = buildActionButtons(item);
            return `
                <article class="mobile-work-order-card" data-work-order-id="${item.id}">
                    <div class="mobile-card-header">
                        <div>
                            <h3 class="mobile-card-title">${escapeHtml(item.work_order_number || '未命名工單')}</h3>
                            <p class="mobile-card-subtitle">${escapeHtml(item.customer_name || '未指定客戶')} / ${escapeHtml(item.screening_item_name || '未指定品項')}</p>
                        </div>
                        ${renderStatusBadge(item.status_key, item.status_label)}
                    </div>

                    <div class="mobile-chip-row">
                        ${item.work_order_type === 'split' ? '<span class="mobile-chip">拆分工單</span>' : '<span class="mobile-chip">一般工單</span>'}
                        ${item.machine_name ? `<span class="mobile-chip">${escapeHtml(item.machine_name)}</span>` : ''}
                        ${item.has_inventory ? '<span class="mobile-chip">已有入庫</span>' : ''}
                        ${Number(item.total_image_count || 0) > 0 ? `<span class="mobile-chip">現場照片 ${escapeHtml(String(item.total_image_count || 0))}</span>` : ''}
                    </div>

                    <div class="mobile-card-meta">
                        <span>訂單：${escapeHtml(item.order_number || '-')}</span>
                        <span>開始：${escapeHtml(formatDateTime(item.actual_start_date) || '-')}</span>
                        <span>完成：${escapeHtml(formatDateTime(item.actual_end_date) || '-')}</span>
                    </div>

                    ${
                        Number(item.total_image_count || 0) > 0
                            ? `
                                <div class="mobile-detail-note">
                                    已回傳
                                    完工 ${escapeHtml(String(item.completion_image_count || 0))} 張 /
                                    不良 ${escapeHtml(String(item.defect_image_count || 0))} 張 /
                                    載具 ${escapeHtml(String(item.tool_condition_image_count || 0))} 張
                                </div>
                            `
                            : ''
                    }

                    <div class="mobile-card-actions">
                        <button type="button" class="mobile-secondary-button" data-action="view" data-id="${item.id}">
                            <i class="fas fa-eye"></i>
                            查看詳情
                        </button>
                        ${actions}
                    </div>
                </article>
            `;
        }).join('');
    }

    function populateInspectionMachineFilter() {
        const select = document.getElementById('mobile-inspections-filter-machine');
        if (!(select instanceof HTMLSelectElement)) {
            return;
        }

        const currentValue = select.value;
        const machineOptions = (state.inspectionsMeta.machines.length ? state.inspectionsMeta.machines : state.machines)
            .map((machine) => {
                const id = String(machine.id || '');
                const label = machine.machine_number
                    ? `${String(machine.machine_number)} / ${String(machine.name || '未命名機台')}`
                    : String(machine.name || '未命名機台');
                return `<option value="${escapeAttribute(id)}">${escapeHtml(label)}</option>`;
            })
            .join('');

        select.innerHTML = '<option value="">全部機台</option>' + machineOptions;
        select.value = currentValue;
    }

    function renderInspectionCards(inspections) {
        const container = document.getElementById('mobile-inspections-list');
        if (!container) {
            return;
        }

        if (!inspections.length) {
            container.innerHTML = '<div class="mobile-empty-state"><strong>查無符合條件的檢驗紀錄</strong><p class="mobile-empty-text">你可以調整查詢條件，或直接新增今日巡檢。</p></div>';
            return;
        }

        container.innerHTML = inspections.map((item) => `
            <article class="mobile-work-order-card" data-inspection-id="${item.id}">
                <div class="mobile-card-header">
                    <div>
                        <h3 class="mobile-card-title">${escapeHtml(item.machine_name || '未指定機台')}</h3>
                        <p class="mobile-card-subtitle">${escapeHtml(item.machine_code || '未設定機台編號')} / 檢驗人：${escapeHtml(item.inspector_name || '未指定')}</p>
                    </div>
                    ${renderInspectionBadge(item.is_qualified)}
                </div>

                <div class="mobile-card-meta">
                    <span>檢驗日期：${escapeHtml(item.inspection_date || '-')}</span>
                    <span>建立時間：${escapeHtml(formatDateTime(item.created_at) || '-')}</span>
                    <span>更新時間：${escapeHtml(formatDateTime(item.updated_at) || '-')}</span>
                </div>

                <div class="mobile-detail-note">${escapeHtml(item.notes || '未填寫備註')}</div>

                <div class="mobile-card-actions">
                    <button type="button" class="mobile-secondary-button" data-action="inspection-edit" data-id="${item.id}">
                        <i class="fas fa-pen"></i>
                        編輯檢驗
                    </button>
                </div>
            </article>
        `).join('');
    }

    function buildActionButtons(item) {
        const statusKey = String(item.status_key || '');
        const buttons = [];

        if (statusKey === 'pending') {
            buttons.push(renderActionButton('start', item.id, 'fa-play', '開工', 'mobile-primary-button'));
        }
        if (statusKey === 'in_progress') {
            buttons.push(renderActionButton('pause', item.id, 'fa-pause', '暫停', 'mobile-secondary-button'));
            buttons.push(renderActionButton('partial', item.id, 'fa-box-open', '部分入庫', 'mobile-ghost-button'));
            buttons.push(renderActionButton('complete', item.id, 'fa-flag-checkered', '完工', 'mobile-primary-button'));
        }
        if (statusKey === 'paused') {
            buttons.push(renderActionButton('resume', item.id, 'fa-play', '恢復', 'mobile-primary-button'));
            buttons.push(renderActionButton('partial', item.id, 'fa-box-open', '部分入庫', 'mobile-ghost-button'));
        }
        if (statusKey === 'completed') {
            buttons.push(renderActionButton('upload', item.id, 'fa-camera', '補傳照片', 'mobile-secondary-button'));
        } else {
            buttons.push(renderActionButton('upload', item.id, 'fa-camera', '拍照', 'mobile-secondary-button'));
            buttons.push(renderActionButton('issue', item.id, 'fa-triangle-exclamation', '異常回報', 'mobile-secondary-button'));
        }

        return buttons.join('');
    }

    function renderActionButton(action, id, icon, label, className, extraAttributes = '') {
        return `
            <button type="button" class="${className}" data-action="${action}" data-id="${id}" ${extraAttributes}>
                <i class="fas ${icon}"></i>
                ${label}
            </button>
        `;
    }

    async function openWorkOrderDetail(id) {
        state.selectedWorkOrderId = Number(id);
        const sheet = document.getElementById('mobile-detail-sheet');
        sheet?.classList.remove('hidden');
        sheet?.setAttribute('aria-hidden', 'false');
        setText('mobile-detail-title', '工單詳情');
        setText('mobile-detail-subtitle', '讀取中...');
        const content = document.getElementById('mobile-detail-content');
        if (content) {
            content.innerHTML = '<div class="mobile-detail-loading">載入工單明細中...</div>';
        }

        try {
            const result = await fetchJson(`${API_BASE}/work_orders/show.php?id=${id}`);
            state.currentWorkOrder = result.data || null;
            initializeDetailProductionRecordState(result.data || null);
            renderWorkOrderDetail(result.data || null);
        } catch (error) {
            if (content) {
                content.innerHTML = `<div class="mobile-empty-state"><strong>載入失敗</strong><p class="mobile-empty-text">${escapeHtml(error.message || '無法取得工單明細。')}</p></div>`;
            }
        }
    }

    function renderWorkOrderDetail(workOrder) {
        const content = document.getElementById('mobile-detail-content');
        if (!content || !workOrder) {
            return;
        }

        setText('mobile-detail-title', workOrder.work_order_number || '工單詳情');
        setText(
            'mobile-detail-subtitle',
            `${workOrder.customer_name || '未指定客戶'} / ${workOrder.screening_item_name || '未指定品項'}`
        );

        const actionButtons = buildDetailActionButtons(workOrder);
        const screeningServices = Array.isArray(workOrder.screening_services_details) ? workOrder.screening_services_details : [];
        const images = Array.isArray(workOrder.images) ? workOrder.images : [];
        const completionImages = Array.isArray(workOrder.completion_images) ? workOrder.completion_images : [];
        const defectImages = Array.isArray(workOrder.defect_images) ? workOrder.defect_images : [];
        const toolConditionImages = Array.isArray(workOrder.tool_condition_images) ? workOrder.tool_condition_images : [];
        const operationLogs = Array.isArray(workOrder.operation_logs) ? workOrder.operation_logs : [];
        const machineRuns = Array.isArray(workOrder.machine_runs) ? workOrder.machine_runs : [];
        const partialReceipts = Array.isArray(workOrder.partial_receipts) ? workOrder.partial_receipts : [];
        const balanceSummary = buildWorkOrderCompletionPreview(workOrder);
        const infoSectionContent = `
            <div class="mobile-info-list">
                ${renderInfoCard('訂單號', workOrder.order_number)}
                ${renderInfoCard('客戶批號', workOrder.customer_batch_number)}
                ${renderInfoCard('圖號', workOrder.drawing_number)}
                ${renderInfoCard('客戶', workOrder.customer_name)}
                ${renderInfoCard('產品 / 規格', workOrder.screening_item_name)}
                ${renderInfoCard('機台能力', workOrder.machine_capability_name)}
                ${renderInfoCard('單重 (g)', formatNumber(workOrder.weight_per_unit_g))}
                ${renderInfoCard('載具統計', workOrder.tool_statistics || '-')}
                ${renderInfoCard('實際開始', formatDateTime(workOrder.actual_start_date))}
                ${renderInfoCard('實際完成', formatDateTime(workOrder.actual_end_date))}
                ${renderInfoCard('備註', workOrder.other_notes || '-')}
            </div>
        `;
        const screeningServicesContent = screeningServices.length
            ? screeningServices.map((service) => `
                <article class="mobile-record-card">
                    <strong>${escapeHtml(service.custom_service_name || service.screening_service_name || '未命名服務')}</strong>
                    <div class="mobile-card-meta">
                        <span>+公差：${escapeHtml(service.tolerance_plus_value || '-')}</span>
                        <span>-公差：${escapeHtml(service.tolerance_minus_value || '-')}</span>
                        <span>PPM：${escapeHtml(service.ppm_standard || '-')}</span>
                    </div>
                </article>
            `).join('')
            : '<div class="mobile-empty-state"><p class="mobile-empty-text">此工單目前沒有篩分服務明細。</p></div>';
        const productionRecordsContent = renderInlineProductionRecordSection();
        const productionRecordActions = '';

        content.innerHTML = `
            <section class="mobile-detail-section">
                <div class="mobile-detail-grid">
                    <article class="mobile-detail-card">
                        <span>工單狀態</span>
                        <strong>${escapeHtml(workOrder.status_label || '-')}</strong>
                    </article>
                    <article class="mobile-detail-card">
                        <span>指定機台</span>
                        <strong>${escapeHtml(workOrder.machine_name || '-')}</strong>
                    </article>
                    <article class="mobile-detail-card">
                        <span>預計淨重</span>
                        <strong>${escapeHtml(formatWeight(workOrder.net_weight))}</strong>
                    </article>
                    <article class="mobile-detail-card">
                        <span>預計支數</span>
                        <strong>${escapeHtml(formatNumber(workOrder.total_units))}</strong>
                    </article>
                </div>
            </section>

            <section class="mobile-detail-section">
                <div class="mobile-detail-section-header">
                    <h3>現場操作</h3>
                    ${renderStatusBadge(workOrder.status_key, workOrder.status_label)}
                </div>
                <div class="mobile-inline-actions">
                    ${actionButtons}
                </div>
            </section>

            <section class="mobile-detail-section">
                <div class="mobile-detail-section-header">
                    <h3>部分入庫 / 數量平衡</h3>
                </div>
                <div class="mobile-info-list">
                    ${renderInfoCard('工單預計', formatWeightUnits(balanceSummary.expected_net_weight_kg, balanceSummary.expected_units))}
                    ${renderInfoCard('現場已生產', formatWeightUnits(balanceSummary.produced_net_weight_kg, balanceSummary.produced_units))}
                    ${renderInfoCard('累計部分入庫', formatWeightUnits(balanceSummary.partial_received_net_weight_kg, balanceSummary.partial_received_units))}
                    ${renderInfoCard('部分入庫已出貨', formatWeightUnits(balanceSummary.partial_shipped_net_weight_kg, balanceSummary.partial_shipped_units))}
                    ${renderInfoCard('部分入庫待出貨', formatWeightUnits(balanceSummary.partial_allocated_net_weight_kg, balanceSummary.partial_allocated_units))}
                    ${renderInfoCard('部分入庫可再出貨', formatWeightUnits(balanceSummary.partial_available_to_ship_net_weight_kg, balanceSummary.partial_available_to_ship_units))}
                    ${renderInfoCard('部分入庫未出貨', formatWeightUnits(balanceSummary.partial_unshipped_net_weight_kg, balanceSummary.partial_in_stock_units))}
                    ${renderInfoCard('最終補入庫', formatWeightUnits(balanceSummary.final_received_net_weight_kg, balanceSummary.final_received_units))}
                    ${renderInfoCard('真實短缺', formatWeightUnits(balanceSummary.shortage_net_weight_kg, balanceSummary.shortage_units))}
                    ${renderInfoCard('剩餘可部分入庫', formatWeight(Math.max(Number(workOrder.partial_receipt_remaining_net_weight_kg || 0), 0)))}
                </div>
                ${
                    partialReceipts.length
                        ? `<div class="mobile-inline-list">
                            ${partialReceipts.map((receipt) => `
                                <article class="mobile-record-card">
                                    <strong>${escapeHtml(receipt.receipt_number || `PR-${receipt.id}`)}</strong>
                                    <div class="mobile-card-meta">
                                        <span>來源：${escapeHtml(receipt.source_label || '一般工單')}</span>
                                        <span>原始入庫：${escapeHtml(formatWeightUnits(receipt.net_weight_kg, receipt.calculated_units))}</span>
                                        <span>已出貨：${escapeHtml(formatWeightUnits(receipt.shipped_net_weight_kg, receipt.quantity_shipped))}</span>
                                        <span>待出貨：${escapeHtml(formatWeightUnits(receipt.allocated_net_weight_kg, receipt.quantity_allocated))}</span>
                                        <span>可再出貨：${escapeHtml(formatWeightUnits(receipt.available_to_ship_net_weight_kg, receipt.quantity_available_to_ship))}</span>
                                        <span>未出貨：${escapeHtml(formatWeightUnits(receipt.unshipped_net_weight_kg, receipt.quantity_on_hand))}</span>
                                        <span>出貨載具：${escapeHtml(receipt.shipping_tool_details || '-')}</span>
                                        <span>狀態：${escapeHtml(receipt.receipt_status === 'settled' ? '已結清' : (receipt.receipt_status === 'reversed' ? '已沖銷' : '有效'))}</span>
                                    </div>
                                </article>
                            `).join('')}
                        </div>`
                        : '<div class="mobile-empty-state"><p class="mobile-empty-text">尚無部分入庫紀錄。</p></div>'
                }
            </section>

            ${renderCollapsibleDetailSection('work_order_info', '工單資訊', infoSectionContent)}
            ${renderCollapsibleDetailSection('screening_services', '篩分服務', screeningServicesContent)}
            ${renderCollapsibleDetailSection('production_records', '生產紀錄', productionRecordsContent, productionRecordActions)}

            <section class="mobile-detail-section">
                <div class="mobile-detail-section-header">
                    <h3>操作紀錄</h3>
                </div>
                ${
                    operationLogs.length
                        ? renderOperationLogList(operationLogs)
                        : '<div class="mobile-empty-state"><p class="mobile-empty-text">尚未建立操作紀錄。</p></div>'
                }
            </section>

            <section class="mobile-detail-section">
                <div class="mobile-detail-section-header">
                    <h3>拆分機台 / 部分入庫</h3>
                </div>
                ${
                    machineRuns.length
                        ? machineRuns.map((run) => `
                            <article class="mobile-run-card">
                                <strong>${escapeHtml(run.run_label || run.machine_name || '拆分機台')}</strong>
                                <div class="mobile-card-meta">
                                    <span>機台：${escapeHtml(run.machine_name || '-')}</span>
                                    <span>狀態：${escapeHtml(run.status || '-')}</span>
                                    <span>完成淨重：${escapeHtml(formatWeight(run.completed_net_weight_kg))}</span>
                                    <span>已部分入庫：${escapeHtml(formatWeight(run.partial_receipt_net_weight_kg))}</span>
                                    <span>剩餘可入庫：${escapeHtml(formatWeight(Math.max((Number(run.completed_net_weight_kg) || 0) - (Number(run.partial_receipt_net_weight_kg) || 0), 0)))}</span>
                                </div>
                                <div class="mobile-run-actions">
                                    <button type="button" class="mobile-ghost-button" data-action="partial-run" data-id="${workOrder.id}" data-run-id="${run.id}">
                                        <i class="fas fa-box-open"></i>
                                        此機台部分入庫
                                    </button>
                                </div>
                            </article>
                        `).join('')
                        : '<div class="mobile-empty-state"><p class="mobile-empty-text">目前沒有拆分機台資料；一般工單可直接使用「部分入庫」功能。</p></div>'
                }
            </section>

            <section class="mobile-detail-section">
                <div class="mobile-detail-section-header">
                    <h3>完工圖片</h3>
                    <button type="button" class="mobile-secondary-button" data-action="upload" data-id="${workOrder.id}" data-upload-target="completion">
                        <i class="fas fa-camera"></i>
                        上傳完工圖片
                    </button>
                </div>
                ${
                    completionImages.length
                        ? renderExecutionImageGrid(completionImages, 'completion', workOrder.id)
                        : '<div class="mobile-empty-state"><p class="mobile-empty-text">尚未上傳完工圖片。</p></div>'
                }
            </section>

            <section class="mobile-detail-section">
                <div class="mobile-detail-section-header">
                    <h3>不良品圖片</h3>
                    <button type="button" class="mobile-secondary-button" data-action="upload" data-id="${workOrder.id}" data-upload-target="defect">
                        <i class="fas fa-camera"></i>
                        上傳不良品圖片
                    </button>
                </div>
                ${
                    defectImages.length
                        ? renderExecutionImageGrid(defectImages, 'defect', workOrder.id)
                        : '<div class="mobile-empty-state"><p class="mobile-empty-text">尚未上傳不良品圖片。</p></div>'
                }
            </section>

            <section class="mobile-detail-section">
                <div class="mobile-detail-section-header">
                    <h3>載具狀況圖片</h3>
                    <button type="button" class="mobile-secondary-button" data-action="upload" data-id="${workOrder.id}" data-upload-target="tool_condition">
                        <i class="fas fa-camera"></i>
                        上傳載具圖片
                    </button>
                </div>
                ${
                    toolConditionImages.length
                        ? renderExecutionImageGrid(toolConditionImages, 'tool_condition', workOrder.id)
                        : '<div class="mobile-empty-state"><p class="mobile-empty-text">尚未上傳載具狀況圖片。</p></div>'
                }
            </section>

            <section class="mobile-detail-section">
                <div class="mobile-detail-section-header">
                    <h3>既有工單圖片</h3>
                </div>
                ${
                    images.length
                        ? renderLegacyImageGrid(images)
                        : '<div class="mobile-empty-state"><p class="mobile-empty-text">尚未保留任何舊版工單圖片。</p></div>'
                }
                <div class="mobile-info-card">
                    <strong>舊流程資料</strong>
                    <p class="mobile-detail-note">此區保留桌面既有工單圖片的唯讀顯示；手機現場回傳請改用上方三個新圖片區塊。</p>
                </div>
            </section>
        `;
    }

    function renderExecutionImageGrid(images, uploadTarget, workOrderId) {
        return `<div class="mobile-photo-grid">${images.map((image) => `
            <article class="mobile-photo-card">
                <strong>${escapeHtml(image.file_name || '工單圖片')}</strong>
                <span>${escapeHtml(formatDateTime(image.uploaded_at) || '-')}</span>
                <img src="${escapeAttribute(state.basePath + String(image.file_path || '').replace(/^\/+/, ''))}" alt="${escapeAttribute(image.description || image.file_name || '工單圖片')}">
                <p class="mobile-detail-note">${escapeHtml(image.description || '無照片說明')}</p>
                <p class="mobile-detail-note">上傳者：${escapeHtml(image.uploaded_by_name || '-')}</p>
                <div class="mobile-photo-actions">
                    <a class="mobile-photo-link" href="${escapeAttribute(state.basePath + String(image.file_path || '').replace(/^\/+/, ''))}" target="_blank" rel="noopener">
                        開啟原圖
                    </a>
                    <button
                        type="button"
                        class="mobile-icon-button mobile-danger-button"
                        data-action="delete-execution-image"
                        data-id="${escapeAttribute(String(workOrderId || 0))}"
                        data-image-id="${escapeAttribute(String(image.id || 0))}"
                        data-upload-target="${escapeAttribute(uploadTarget || 'completion')}"
                        aria-label="刪除此圖片"
                        title="刪除"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </article>
        `).join('')}</div>`;
    }

    function renderLegacyImageGrid(images) {
        return `<div class="mobile-photo-grid">${images.map((image) => `
            <article class="mobile-photo-card">
                <strong>${escapeHtml(getImageTypeLabel(image.image_type))}</strong>
                <span>${escapeHtml(formatDateTime(image.uploaded_at) || '-')}</span>
                <img src="${escapeAttribute(state.basePath + String(image.file_path || '').replace(/^\/+/, ''))}" alt="${escapeAttribute(image.description || image.image_type || '工單照片')}">
                <p class="mobile-detail-note">${escapeHtml(image.description || '無照片說明')}</p>
                <p class="mobile-detail-note">上傳者：${escapeHtml(image.uploaded_by_name || '-')}</p>
                <a class="mobile-photo-link" href="${escapeAttribute(state.basePath + String(image.file_path || '').replace(/^\/+/, ''))}" target="_blank" rel="noopener">
                    開啟原圖
                </a>
            </article>
        `).join('')}</div>`;
    }

    function renderOperationLogList(logs) {
        return logs.map((log) => `
            <article class="mobile-record-card">
                <strong>${escapeHtml(log.action_label || '操作紀錄')}</strong>
                <div class="mobile-card-meta">
                    <span>時間：${escapeHtml(formatDateTime(log.created_at) || '-')}</span>
                    <span>人員：${escapeHtml(log.created_by_name || '-')}</span>
                    ${
                        log.status_to_label
                            ? `<span>狀態：${escapeHtml(log.status_from_label || '-') } -> ${escapeHtml(log.status_to_label || '-')}</span>`
                            : ''
                    }
                </div>
                <p class="mobile-detail-note">${escapeHtml(log.notes || '無補充說明')}</p>
            </article>
        `).join('');
    }

    function renderProductionRecordList(records, workOrder) {
        if (!records.length) {
            return '<div class="mobile-empty-state"><p class="mobile-empty-text">尚未建立生產紀錄。</p></div>';
        }

        const filledWeightCount = records.filter((record) => hasSubmittedValue(record.weight_kg)).length;
        const assignedMachineCount = records.filter((record) => hasSubmittedValue(record.machine_id)).length;

        return `
            <div class="mobile-info-card mobile-production-summary-card">
                <strong>生產紀錄摘要</strong>
                <div class="mobile-card-meta">
                    <span>載具筆數：${escapeHtml(String(records.length))}</span>
                    <span>已填重量：${escapeHtml(String(filledWeightCount))}</span>
                    <span>已指定機台：${escapeHtml(String(assignedMachineCount))}</span>
                    <span>工單載具統計：${escapeHtml(workOrder.tool_statistics || '-')}</span>
                </div>
                <p class="mobile-detail-note">此區會沿用桌面版的生產紀錄資料；預設模式會先帶入卡號、載具類型與載具重量，現場再逐筆補實際裝載重量。</p>
            </div>
            <div class="mobile-production-records-block">
                <div class="mobile-production-records-header">
                    <span class="mobile-chip mobile-production-records-chip">逐筆載具明細</span>
                    <p class="mobile-empty-text">以下每筆卡號都是獨立載具；摘要只看整體狀態，明細才是逐筆作業資料。</p>
                </div>
                <div class="mobile-production-records-list">
                    ${records.map((record, index) => renderProductionRecordCard(record, workOrder, index)).join('')}
                </div>
            </div>
        `;
    }

    function initializeDetailProductionRecordState(workOrder) {
        if (!workOrder) {
            state.detailProductionRecordAction = null;
            return;
        }

        state.detailProductionRecordAction = {
            type: 'production_records',
            workOrderId: Number(workOrder.id || 0),
            workOrder,
            records: Array.isArray(workOrder.production_records) ? workOrder.production_records : [],
        };
        initializeProductionRecordModalState(state.detailProductionRecordAction);
    }

    function renderInlineProductionRecordSection() {
        if (!state.detailProductionRecordAction) {
            return '<div class="mobile-empty-state"><p class="mobile-empty-text">目前無法編輯生產紀錄。</p></div>';
        }

        return renderProductionRecordEditor(state.detailProductionRecordAction, {
            inline: true,
            showSaveButton: true,
        });
    }

    function renderCollapsibleDetailSection(sectionKey, title, contentHtml, actionsHtml = '') {
        const isExpanded = state.detailSectionState[sectionKey] !== false;
        return `
            <section class="mobile-detail-section mobile-collapsible-section${isExpanded ? ' is-expanded' : ' is-collapsed'}" data-detail-section="${escapeAttribute(sectionKey)}">
                <div class="mobile-detail-section-header mobile-collapsible-header">
                    <button
                        type="button"
                        class="mobile-detail-section-toggle"
                        data-action="toggle-detail-section"
                        data-section="${escapeAttribute(sectionKey)}"
                        aria-expanded="${isExpanded ? 'true' : 'false'}"
                    >
                        <span>${escapeHtml(title)}</span>
                        <i class="fas fa-chevron-down" aria-hidden="true"></i>
                    </button>
                    ${actionsHtml ? `<div class="mobile-detail-section-actions">${actionsHtml}</div>` : ''}
                </div>
                <div class="mobile-detail-section-body${isExpanded ? '' : ' hidden'}" data-detail-section-body="${escapeAttribute(sectionKey)}">
                    ${contentHtml}
                </div>
            </section>
        `;
    }

    function renderProductionRecordCard(record, workOrder, index) {
        const weightFilled = hasSubmittedValue(record.weight_kg);
        const statusClass = weightFilled ? 'mobile-status-completed' : 'mobile-status-pending';
        const statusLabel = weightFilled ? '已填實際重量' : '待填實際重量';
        const sourceMode = String(record.production_source_mode || 'preset') === 'manual' ? '自行輸入' : '預設';
        const machineTypeLabel = record.machine_type || getProductionRecordMachineType(record.machine_id) || '-';
        const operatorLabel = record.employee_name || record.operator_name || getProductionRecordOperatorName(record) || '-';

        return `
            <article class="mobile-record-card mobile-production-record-card">
                <div class="mobile-record-card-header">
                    <strong>${escapeHtml(record.card_number ? `卡號 ${record.card_number}` : `生產紀錄 ${index + 1}`)}</strong>
                    <span class="mobile-status-badge ${statusClass}">${escapeHtml(statusLabel)}</span>
                </div>
                <div class="mobile-card-meta">
                    <span>來源：${escapeHtml(sourceMode)}</span>
                    <span>載具類型：${escapeHtml(record.tool_name || '未設定')}</span>
                    <span>載具重量：${escapeHtml(formatWeight(record.tool_weight_kg))}</span>
                    <span>實際裝載重量：${escapeHtml(weightFilled ? formatWeight(record.weight_kg) : '待填寫')}</span>
                    <span>機台：${escapeHtml(record.machine_name || workOrder.machine_name || '尚未指定機台')}</span>
                    <span>機台種類：${escapeHtml(machineTypeLabel)}</span>
                    <span>日期：${escapeHtml(record.production_date || '-')}</span>
                    <span>時間：${escapeHtml(formatTimeValue(record.production_time) || '-')}</span>
                    <span>登錄者：${escapeHtml(operatorLabel)}</span>
                </div>
                <p class="mobile-detail-note">${escapeHtml(record.notes || '無備註')}</p>
            </article>
        `;
    }

    function initializeProductionRecordModalState(config) {
        if (config.productionRecordBuffers) {
            return;
        }

        const records = Array.isArray(config.records) ? config.records : [];
        const presetRecords = records
            .filter((record) => String(record.production_source_mode || 'preset') !== 'manual')
            .map((record) => normalizeProductionRecordDraft(record, 'preset'));
        const manualRecords = records
            .filter((record) => String(record.production_source_mode || 'preset') === 'manual')
            .map((record) => normalizeProductionRecordDraft(record, 'manual'));

        config.productionRecordBuffers = {
            preset: presetRecords,
            manual: manualRecords.length
                ? manualRecords
                : (presetRecords.length
                    ? presetRecords.map((record) => ({ ...record, production_source_mode: 'manual' }))
                    : [createEmptyProductionRecordDraft('manual')]),
        };

        if (!config.productionRecordBuffers.preset.length && records.length) {
            config.productionRecordBuffers.preset = records.map((record) => normalizeProductionRecordDraft(record, 'preset'));
        }

        config.productionRecordMode = config.productionRecordMode
            || (manualRecords.length > 0 && presetRecords.length === 0 ? 'manual' : 'preset');
    }

    function normalizeProductionRecordDraft(record, fallbackMode) {
        return {
            card_number: String(record.card_number || '').trim(),
            tool_name: String(record.tool_name || '').trim(),
            tool_weight_kg: hasSubmittedValue(record.tool_weight_kg) ? String(record.tool_weight_kg).trim() : '',
            weight_kg: hasSubmittedValue(record.weight_kg) ? String(record.weight_kg).trim() : '',
            production_date: String(record.production_date || '').trim(),
            production_time: normalizeTimeInputValue(record.production_time),
            machine_id: hasSubmittedValue(record.machine_id) ? String(record.machine_id).trim() : '',
            machine_type: String(record.machine_type || getProductionRecordMachineType(record.machine_id) || '').trim(),
            operator_name: String(record.operator_name || record.employee_name || getProductionRecordOperatorName(record)).trim(),
            notes: String(record.notes || '').trim(),
            production_source_mode: fallbackMode,
        };
    }

    function createEmptyProductionRecordDraft(mode) {
        return {
            card_number: '',
            tool_name: '',
            tool_weight_kg: '',
            weight_kg: '',
            production_date: '',
            production_time: '',
            machine_id: '',
            machine_type: '',
            operator_name: getProductionRecordOperatorName(),
            notes: '',
            production_source_mode: mode,
        };
    }

    function renderProductionRecordEditor(config, options = {}) {
        initializeProductionRecordModalState(config);

        const mode = String(config.productionRecordMode || 'preset') === 'manual' ? 'manual' : 'preset';
        const records = mode === 'manual'
            ? (config.productionRecordBuffers.manual || [])
            : (config.productionRecordBuffers.preset || []);
        const filledWeightCount = records.filter((record) => hasSubmittedValue(record.weight_kg)).length;
        const showSaveButton = options.showSaveButton === true;

        return `
            <div class="mobile-action-grid">
                <div class="mobile-info-card mobile-production-summary-card">
                    <strong>生產紀錄操作說明</strong>
                    <div class="mobile-card-meta">
                        <span>目前模式：${escapeHtml(mode === 'manual' ? '自行輸入' : '預設')}</span>
                        <span>載具筆數：${escapeHtml(String(records.length))}</span>
                        <span>已填重量：${escapeHtml(String(filledWeightCount))}</span>
                    </div>
                    <p class="mobile-detail-note">
                        ${mode === 'manual'
                            ? '自行輸入模式可增減載具筆數；系統仍會依總支數自動分配卡號，現場請逐筆填寫載具、重量、機台、時間與備註。'
                            : '預設模式會沿用桌面版依客戶批號帶入的卡號與載具基礎資料；現場仍可補填載具類型、載具重量、實際裝載重量、日期、時間、機台與備註。'}
                    </p>
                </div>

                <div class="mobile-production-mode-switch" role="tablist" aria-label="生產紀錄模式">
                    <button type="button" class="mobile-production-mode-button${mode === 'preset' ? ' active' : ''}" data-action="toggle-production-mode" data-mode="preset">
                        預設
                    </button>
                    <button type="button" class="mobile-production-mode-button${mode === 'manual' ? ' active' : ''}" data-action="toggle-production-mode" data-mode="manual">
                        自行輸入
                    </button>
                </div>

                <div class="mobile-production-toolbar">
                    <span class="mobile-empty-text">欄位口徑已對齊桌面版；卡號為系統分配，其餘現場欄位請逐筆填寫。</span>
                    ${mode === 'manual'
                        ? `<button type="button" class="mobile-secondary-button" data-action="add-production-row">
                            <i class="fas fa-plus"></i>
                            新增載具
                        </button>`
                        : ''}
                </div>

                <div class="mobile-production-editor-list">
                    ${records.map((record, index) => renderProductionRecordEditorRow(record, index, mode)).join('')}
                </div>

                ${showSaveButton
                    ? `<div class="mobile-action-feedback" data-inline-production-feedback></div>
                    <div class="mobile-inline-actions">
                        <button type="button" class="mobile-primary-button" data-action="save-inline-production-records" data-id="${escapeAttribute(String(config.workOrderId || 0))}">
                            <i class="fas fa-floppy-disk"></i>
                            儲存生產紀錄
                        </button>
                    </div>`
                    : ''}
            </div>
        `;
    }

    function renderProductionRecordEditorRow(record, index, mode) {
        const isManual = mode === 'manual';
        const machineOptions = getProductionRecordMachineOptions(record.machine_id);
        const machineType = record.machine_type || getProductionRecordMachineType(record.machine_id);
        const operatorName = record.operator_name || getProductionRecordOperatorName(record);
        return `
            <article class="mobile-record-card mobile-production-editor-card" data-production-row="${index}">
                <div class="mobile-record-card-header">
                    <strong>${escapeHtml(record.card_number ? `卡號 ${record.card_number}` : `載具 ${index + 1}`)}</strong>
                    ${isManual
                        ? `<button type="button" class="mobile-icon-button" data-action="remove-production-row" data-row-index="${index}" aria-label="刪除此載具">
                            <i class="fas fa-trash"></i>
                        </button>`
                        : `<span class="mobile-chip">預設載具</span>`}
                </div>
                <div class="mobile-production-editor-grid">
                    <label class="mobile-field">
                        <span>卡號（系統分配）</span>
                        <input type="text" name="pr_card_number[]" value="${escapeAttribute(record.card_number)}" readonly>
                    </label>
                    <label class="mobile-field">
                        <span>載具類型</span>
                        <input type="text" name="pr_tool_name[]" value="${escapeAttribute(record.tool_name)}" placeholder="請填載具類型">
                    </label>
                    <label class="mobile-field">
                        <span>載具重量 (kg)</span>
                        <input type="number" name="pr_tool_weight_kg[]" value="${escapeAttribute(record.tool_weight_kg)}" step="0.001" min="0" placeholder="例如 10.000">
                    </label>
                    <label class="mobile-field">
                        <span>實際裝載重量 (kg)</span>
                        <input type="number" name="pr_weight_kg[]" value="${escapeAttribute(record.weight_kg)}" step="0.01" min="0" placeholder="請填實際重量">
                    </label>
                    <label class="mobile-field">
                        <span>日期</span>
                        <input type="date" name="pr_date[]" value="${escapeAttribute(record.production_date)}">
                    </label>
                    <label class="mobile-field">
                        <span>時間</span>
                        <input type="time" name="pr_time[]" value="${escapeAttribute(record.production_time)}">
                    </label>
                    <label class="mobile-field">
                        <span>機台</span>
                        <select name="pr_machine_id[]">
                            ${machineOptions}
                        </select>
                    </label>
                    <label class="mobile-field">
                        <span>機台種類</span>
                        <input type="text" name="pr_machine_type[]" value="${escapeAttribute(machineType)}" readonly data-machine-type-display>
                    </label>
                    <label class="mobile-field">
                        <span>登錄者</span>
                        <input type="text" name="pr_operator_name[]" value="${escapeAttribute(operatorName)}" readonly>
                    </label>
                    <label class="mobile-field mobile-field-full">
                        <span>備註</span>
                        <textarea name="pr_notes[]" placeholder="補充裝載狀況、臨時換載具或其他說明">${escapeHtml(record.notes)}</textarea>
                    </label>
                </div>
            </article>
        `;
    }

    function getProductionRecordMachineOptions(selectedId) {
        const selected = String(selectedId || '').trim();
        return ['<option value="">未指定機台</option>']
            .concat(state.machines.map((machine) => {
                const id = String(machine.id || '');
                const label = machine.machine_number
                    ? `${String(machine.machine_number)} / ${String(machine.name || '未命名機台')}`
                    : String(machine.name || '未命名機台');
                return `<option value="${escapeAttribute(id)}"${id === selected ? ' selected' : ''}>${escapeHtml(label)}</option>`;
            }))
            .join('');
    }

    function getProductionRecordMachineType(machineId) {
        const selected = String(machineId || '').trim();
        if (!selected) {
            return '';
        }

        const machine = state.machines.find((item) => String(item.id || '') === selected);
        return machine ? String(machine.name || '').trim() : '';
    }

    function getProductionRecordOperatorName(record = null) {
        return String(record?.operator_name || record?.employee_name || state.currentUser?.name || '').trim();
    }

    function buildDetailActionButtons(workOrder) {
        const buttons = [
            renderActionButton('view', workOrder.id, 'fa-rotate-right', '重新載入', 'mobile-secondary-button'),
            renderActionButton('upload', workOrder.id, 'fa-camera', '拍照 / 上傳', 'mobile-secondary-button'),
            renderActionButton('issue', workOrder.id, 'fa-triangle-exclamation', '異常回報', 'mobile-secondary-button'),
        ];

        const statusKey = String(workOrder.status_key || '');
        if (statusKey === 'pending') {
            buttons.unshift(renderActionButton('start', workOrder.id, 'fa-play', '開工', 'mobile-primary-button'));
        }
        if (statusKey === 'in_progress') {
            buttons.unshift(renderActionButton('complete', workOrder.id, 'fa-flag-checkered', '完工', 'mobile-primary-button'));
            buttons.unshift(renderActionButton('partial', workOrder.id, 'fa-box-open', '部分入庫', 'mobile-ghost-button'));
            buttons.unshift(renderActionButton('pause', workOrder.id, 'fa-pause', '暫停', 'mobile-secondary-button'));
        }
        if (statusKey === 'paused') {
            buttons.unshift(renderActionButton('partial', workOrder.id, 'fa-box-open', '部分入庫', 'mobile-ghost-button'));
            buttons.unshift(renderActionButton('resume', workOrder.id, 'fa-play', '恢復', 'mobile-primary-button'));
        }

        return buttons.join('');
    }

    function renderInfoCard(label, value) {
        return `
            <article class="mobile-info-card">
                <strong>${escapeHtml(label)}</strong>
                <p class="mobile-detail-note">${escapeHtml(value || '-')}</p>
            </article>
        `;
    }

    function handleListActionClick(event) {
        const button = event.target instanceof HTMLElement ? event.target.closest('button[data-action]') : null;
        if (!button) {
            return;
        }
        handleActionClick(button);
    }

    function handleDetailActionClick(event) {
        const button = event.target instanceof HTMLElement ? event.target.closest('button[data-action]') : null;
        if (!button) {
            return;
        }

        if (button.dataset.action === 'toggle-detail-section') {
            event.preventDefault();
            toggleDetailSection(String(button.dataset.section || ''));
            return;
        }

        if (state.detailProductionRecordAction) {
            const inlineAction = button.dataset.action || '';
            if (inlineAction === 'toggle-production-mode') {
                event.preventDefault();
                syncDetailProductionRecordDraft();
                state.detailProductionRecordAction.productionRecordMode = button.dataset.mode === 'manual' ? 'manual' : 'preset';
                rerenderDetailProductionRecordSection();
                return;
            }
            if (inlineAction === 'add-production-row') {
                event.preventDefault();
                syncDetailProductionRecordDraft();
                const records = state.detailProductionRecordAction.productionRecordBuffers.manual || [];
                records.push(createEmptyProductionRecordDraft('manual'));
                rerenderDetailProductionRecordSection();
                return;
            }
            if (inlineAction === 'remove-production-row') {
                event.preventDefault();
                syncDetailProductionRecordDraft();
                const records = state.detailProductionRecordAction.productionRecordBuffers.manual || [];
                const index = Number(button.dataset.rowIndex || -1);
                if (index >= 0 && index < records.length) {
                    records.splice(index, 1);
                }
                if (!records.length) {
                    records.push(createEmptyProductionRecordDraft('manual'));
                }
                rerenderDetailProductionRecordSection();
                return;
            }
            if (inlineAction === 'save-inline-production-records') {
                event.preventDefault();
                saveDetailProductionRecords();
                return;
            }
        }

        handleActionClick(button);
    }

    function handleDetailContentChange(event) {
        if (!state.detailProductionRecordAction) {
            return;
        }

        const target = event.target;
        if (!(target instanceof HTMLSelectElement)) {
            return;
        }

        if (target.name !== 'pr_machine_id[]') {
            return;
        }

        const row = target.closest('[data-production-row]');
        if (!(row instanceof HTMLElement)) {
            return;
        }

        const machineTypeInput = row.querySelector('[name="pr_machine_type[]"]');
        if (machineTypeInput instanceof HTMLInputElement) {
            machineTypeInput.value = getProductionRecordMachineType(target.value);
        }
    }

    function rerenderDetailProductionRecordSection() {
        const sectionBody = document.querySelector('[data-detail-section-body="production_records"]');
        if (!(sectionBody instanceof HTMLElement) || !state.detailProductionRecordAction) {
            return;
        }

        sectionBody.innerHTML = renderInlineProductionRecordSection();
    }

    function syncProductionRecordDraftFromContainer(container, actionState) {
        if (!actionState || actionState.type !== 'production_records') {
            return;
        }

        const mode = String(actionState.productionRecordMode || 'preset') === 'manual' ? 'manual' : 'preset';
        const rows = Array.from(container.querySelectorAll('[data-production-row]'));
        actionState.productionRecordBuffers[mode] = rows.map((row) => {
            const scope = row instanceof HTMLElement ? row : null;
            return {
                card_number: String(scope?.querySelector('[name="pr_card_number[]"]')?.value || '').trim(),
                tool_name: String(scope?.querySelector('[name="pr_tool_name[]"]')?.value || '').trim(),
                tool_weight_kg: String(scope?.querySelector('[name="pr_tool_weight_kg[]"]')?.value || '').trim(),
                weight_kg: String(scope?.querySelector('[name="pr_weight_kg[]"]')?.value || '').trim(),
                production_date: String(scope?.querySelector('[name="pr_date[]"]')?.value || '').trim(),
                production_time: String(scope?.querySelector('[name="pr_time[]"]')?.value || '').trim(),
                machine_id: String(scope?.querySelector('[name="pr_machine_id[]"]')?.value || '').trim(),
                machine_type: String(scope?.querySelector('[name="pr_machine_type[]"]')?.value || '').trim(),
                operator_name: String(scope?.querySelector('[name="pr_operator_name[]"]')?.value || '').trim(),
                notes: String(scope?.querySelector('[name="pr_notes[]"]')?.value || '').trim(),
                production_source_mode: mode,
            };
        });
    }

    function syncDetailProductionRecordDraft() {
        const container = document.querySelector('[data-detail-section-body="production_records"]');
        if (!(container instanceof HTMLElement) || !state.detailProductionRecordAction) {
            return;
        }
        syncProductionRecordDraftFromContainer(container, state.detailProductionRecordAction);
    }

    async function saveDetailProductionRecords() {
        if (!state.detailProductionRecordAction) {
            return;
        }

        syncDetailProductionRecordDraft();
        await submitProductionRecordsFromState(state.detailProductionRecordAction);
    }

    function toggleDetailSection(sectionKey) {
        if (!sectionKey) {
            return;
        }

        const currentValue = state.detailSectionState[sectionKey] !== false;
        state.detailSectionState[sectionKey] = !currentValue;

        const root = document.querySelector(`[data-detail-section="${sectionKey}"]`);
        if (!(root instanceof HTMLElement)) {
            return;
        }

        const body = root.querySelector(`[data-detail-section-body="${sectionKey}"]`);
        const toggle = root.querySelector(`[data-action="toggle-detail-section"][data-section="${sectionKey}"]`);
        const isExpanded = state.detailSectionState[sectionKey] !== false;

        root.classList.toggle('is-expanded', isExpanded);
        root.classList.toggle('is-collapsed', !isExpanded);

        if (body instanceof HTMLElement) {
            body.classList.toggle('hidden', !isExpanded);
        }

        if (toggle instanceof HTMLElement) {
            toggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        }
    }

    function handleInspectionListClick(event) {
        const button = event.target instanceof HTMLElement ? event.target.closest('button[data-action]') : null;
        if (!button) {
            return;
        }

        const action = button.dataset.action || '';
        const id = Number(button.dataset.id || 0);
        if (action !== 'inspection-edit' || !id) {
            return;
        }

        const inspection = state.inspections.find((item) => Number(item.id) === id) || null;
        openInspectionModal('edit', inspection);
    }

    async function loadWorkOrderActionContext(workOrderId) {
        if (state.currentWorkOrder && Number(state.currentWorkOrder.id || 0) === Number(workOrderId || 0)) {
            return state.currentWorkOrder;
        }
        const result = await fetchJson(`${API_BASE}/work_orders/show.php?id=${workOrderId}`);
        return result.data || null;
    }

    async function handleActionClick(button) {
        const action = button.dataset.action || '';
        const id = Number(button.dataset.id || 0);
        const runId = Number(button.dataset.runId || 0);
        const uploadTarget = String(button.dataset.uploadTarget || '').trim();
        const imageId = Number(button.dataset.imageId || 0);

        if (action === 'view') {
            if (state.currentWorkOrder && state.currentWorkOrder.id === id) {
                openWorkOrderDetail(id);
                return;
            }
            openWorkOrderDetail(id);
            return;
        }

        if (action === 'delete-execution-image') {
            if (!id || !imageId) {
                return;
            }
            deleteExecutionImage(id, imageId, uploadTarget || 'completion');
            return;
        }

        if (!id) {
            return;
        }

        if (action === 'start') {
            executeStatusAction(id, 'in_progress', {
                actual_start_date: getCurrentDateTimeString(),
            }, '已開始生產。');
            return;
        }

        if (action === 'pause') {
            executeStatusAction(id, 'paused', {}, '工單已暫停。');
            return;
        }

        if (action === 'resume') {
            executeStatusAction(id, 'in_progress', {}, '工單已恢復生產。');
            return;
        }

        if (action === 'partial') {
            try {
                const workOrder = await loadWorkOrderActionContext(id);
                if (!workOrder) {
                    window.alert('找不到工單資料。');
                    return;
                }
                if (!hasRelaxedPermission(['work_orders.partial_receipt', 'manage_work_orders'])) {
                    window.alert('目前帳號沒有部分入庫權限。');
                    return;
                }
                if (String(workOrder.work_order_type || 'normal') === 'split') {
                    window.alert('拆分工單請從下方來源機台執行部分入庫，不能直接以整張工單建立。');
                    if (state.currentWorkOrder?.id !== workOrder.id) {
                        await openWorkOrderDetail(id);
                    }
                    return;
                }
                if (workOrder.lifecycle_locked == 1 || workOrder.completed_at || workOrder.has_inventory == 1) {
                    window.alert('此工單已完成或已有正式庫存，不能再建立部分入庫。');
                    return;
                }
                const summary = workOrder.partial_receipt_summary || {};
                const remainingNetWeightKg = Math.max(
                    Number(workOrder.partial_receipt_remaining_net_weight_kg || 0),
                    Number(summary.expected_net_weight_kg || 0) - Number(summary.partial_received_net_weight_kg || 0),
                    0
                );
                if (remainingNetWeightKg <= 0.0001) {
                    window.alert('此工單目前沒有可再部分入庫的剩餘淨重。');
                    return;
                }
                if (getPartialReceiptAvailableTools(workOrder).length === 0) {
                    window.alert('此工單尚未設定可帶入的載具資料，請先到訂單品項維護載具設定。');
                    return;
                }
                openActionModal({
                    type: 'partial',
                    workOrderId: id,
                    machineRunId: null,
                    workOrder,
                    remainingNetWeightKg,
                    sourceLabel: `一般工單：${workOrder.work_order_number || id}`,
                });
            } catch (error) {
                window.alert(error.message || '載入工單部分入庫資訊失敗。');
            }
            return;
        }

        if (action === 'partial-run') {
            try {
                const workOrder = await loadWorkOrderActionContext(id);
                if (!workOrder) {
                    window.alert('找不到工單資料。');
                    return;
                }
                if (!hasRelaxedPermission(['work_orders.partial_receipt', 'manage_work_orders'])) {
                    window.alert('目前帳號沒有部分入庫權限。');
                    return;
                }
                const runs = Array.isArray(workOrder.machine_runs) ? workOrder.machine_runs : [];
                const run = runs.find((item) => Number(item.id || 0) === runId);
                if (!run) {
                    window.alert('找不到來源機台資料。');
                    return;
                }
                const remainingNetWeightKg = Math.max((Number(run.completed_net_weight_kg) || 0) - (Number(run.partial_receipt_net_weight_kg) || 0), 0);
                if (String(run.status || '') !== 'completed' || remainingNetWeightKg <= 0.0001) {
                    window.alert('只有已完成且仍有剩餘淨重的來源機台可以部分入庫。');
                    return;
                }
                if (getPartialReceiptAvailableTools(workOrder).length === 0) {
                    window.alert('此工單尚未設定可帶入的載具資料，請先到訂單品項維護載具設定。');
                    return;
                }
                openActionModal({
                    type: 'partial',
                    workOrderId: id,
                    machineRunId: runId || null,
                    workOrder,
                    remainingNetWeightKg,
                    sourceLabel: `拆分機台：${run.run_label || run.machine_name || run.id}`,
                    machineRun: run,
                });
            } catch (error) {
                window.alert(error.message || '載入來源機台部分入庫資訊失敗。');
            }
            return;
        }

        if (action === 'complete') {
            try {
                const workOrder = await loadWorkOrderActionContext(id);
                if (!workOrder) {
                    window.alert('找不到工單資料。');
                    return;
                }
                const preview = buildWorkOrderCompletionPreview(workOrder);
                if (!hasRelaxedPermission(['work_orders.confirm_shortage', 'manage_work_orders']) && preview.shortage_net_weight_kg > 0.0001) {
                    window.alert('此工單有真實短缺，但目前帳號沒有短缺確認權限。');
                    return;
                }
                openActionModal({
                    type: 'complete',
                    workOrderId: id,
                    workOrder,
                    completionPreview: preview,
                });
            } catch (error) {
                window.alert(error.message || '載入工單結案資訊失敗。');
            }
            return;
        }

        if (action === 'production-records') {
            openActionModal({
                type: 'production_records',
                workOrderId: id,
                workOrder: state.currentWorkOrder,
                records: Array.isArray(state.currentWorkOrder?.production_records) ? state.currentWorkOrder.production_records : [],
            });
            return;
        }

        if (action === 'upload') {
            openActionModal({
                type: 'upload',
                workOrderId: id,
                uploadTarget: uploadTarget || 'completion',
            });
            return;
        }

        if (action === 'issue') {
            openActionModal({
                type: 'issue',
                workOrderId: id,
            });
        }
    }

    async function executeStatusAction(workOrderId, statusKey, extraPayload, successMessage) {
        const status = state.statusByKey[statusKey];
        if (!status || !status.id) {
            window.alert('找不到對應的工單狀態設定，請先確認狀態 lookup。');
            return;
        }

        try {
            await fetchJson(`${API_BASE}/work_orders/update.php?id=${workOrderId}`, {
                method: 'PUT',
                body: {
                    status_lookup_id: status.id,
                    ...extraPayload,
                },
                withCsrf: true,
            });
            await refreshAfterMutation(workOrderId, successMessage);
        } catch (error) {
            window.alert(error.message || '更新工單狀態失敗。');
        }
    }

    function openInspectionModal(mode, inspection) {
        const employees = state.inspectionsMeta.employees.length ? state.inspectionsMeta.employees : [];
        const machines = state.inspectionsMeta.machines.length ? state.inspectionsMeta.machines : state.machines;
        const currentUserId = Number(state.currentUser?.id || 0);

        openActionModal({
            type: mode === 'edit' ? 'inspection_edit' : 'inspection_create',
            inspectionId: inspection?.id || null,
            values: {
                inspection_date: inspection?.inspection_date || getCurrentDateString(),
                machine_id: String(inspection?.machine_id || ''),
                inspector_id: String(inspection?.inspector_id || currentUserId || ''),
                is_qualified: inspection ? (inspection.is_qualified ? '1' : '0') : '1',
                notes: inspection?.notes || '',
            },
            machines,
            employees,
        });
    }

    function getPartialReceiptAvailableTools(workOrder) {
        const sourceTools = Array.isArray(workOrder?.tool_details) ? workOrder.tool_details : [];
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

    function renderPartialReceiptToolSelector(workOrder) {
        const tools = getPartialReceiptAvailableTools(workOrder);
        if (tools.length === 0) {
            return `
                <div class="mobile-partial-tools-empty">
                    此工單尚未設定可帶入的載具資料，請先到訂單品項維護載具設定。
                </div>
            `;
        }

        return `
            <div class="mobile-partial-tools-list">
                ${tools.map((tool) => {
                    const detailParts = [];
                    if (tool.tool_number) {
                        detailParts.push(`編號 ${tool.tool_number}`);
                    }
                    detailParts.push(`單重 ${Number(tool.unit_weight_kg || 0).toFixed(3)} kg`);
                    if (tool.quantity > 0) {
                        detailParts.push(`原設定 ${formatNumber(Math.round(tool.quantity))} 個`);
                    }

                    return `
                        <div class="mobile-partial-tool-row" data-partial-tool-row data-unit-weight-kg="${escapeAttribute(String(tool.unit_weight_kg || 0))}" data-tool-label="${escapeAttribute(formatPartialReceiptToolLabel(tool))}">
                            <label class="mobile-partial-tool-check">
                                <input type="checkbox" value="${escapeAttribute(String(tool.id))}" data-partial-tool-toggle>
                                <span>${escapeHtml(formatPartialReceiptToolLabel(tool))}</span>
                            </label>
                            <span class="mobile-partial-tool-meta">${escapeHtml(detailParts.join(' ｜ '))}</span>
                            <label class="mobile-field mobile-partial-tool-qty">
                                <span>本次數量</span>
                                <input type="number" min="1" step="1" placeholder="請輸入" data-partial-tool-quantity disabled>
                            </label>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="mobile-partial-tools-summary">
                <div class="mobile-info-card">
                    <strong>參考載具總重</strong>
                    <p class="mobile-detail-note" data-partial-tool-total-weight>0.000 kg</p>
                </div>
                <div class="mobile-info-card">
                    <strong>系統摘要</strong>
                    <p class="mobile-detail-note" data-partial-tool-summary>尚未選擇本次出貨載具。</p>
                </div>
            </div>
        `;
    }

    function updateMobilePartialReceiptToolSummary(form, summaryText, totalWeightKg, isError = false) {
        const summaryInput = form.querySelector('[name="shipping_tool_details"]');
        const summaryTarget = form.querySelector('[data-partial-tool-summary]');
        const totalWeightTarget = form.querySelector('[data-partial-tool-total-weight]');

        if (summaryInput instanceof HTMLInputElement) {
            summaryInput.value = isError ? '' : summaryText;
        }
        if (summaryTarget instanceof HTMLElement) {
            summaryTarget.textContent = summaryText || '尚未選擇本次出貨載具。';
            summaryTarget.classList.toggle('mobile-text-danger', isError);
        }
        if (totalWeightTarget instanceof HTMLElement) {
            totalWeightTarget.textContent = `${Number(totalWeightKg || 0).toFixed(3)} kg`;
        }
    }

    function collectMobilePartialReceiptShippingTools(form) {
        const rows = Array.from(form.querySelectorAll('[data-partial-tool-row]'));
        const items = [];
        const summaryParts = [];
        let totalWeightKg = 0;

        for (const row of rows) {
            const toggle = row.querySelector('[data-partial-tool-toggle]');
            const quantityInput = row.querySelector('[data-partial-tool-quantity]');
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
            const lineWeightKg = Number((unitWeightKg * quantityNumber).toFixed(3));
            totalWeightKg += lineWeightKg;
            items.push({
                order_item_tool_id: orderItemToolId,
                quantity: quantityNumber,
            });
            summaryParts.push(
                `${row.dataset.toolLabel || `載具#${orderItemToolId}`} x ${quantityNumber}（${unitWeightKg.toFixed(3)} kg/個，小計 ${lineWeightKg.toFixed(3)} kg）`
            );
        }

        totalWeightKg = Number(totalWeightKg.toFixed(3));
        const summary = summaryParts.length > 0
            ? `${summaryParts.join('；')}；參考載具總重 ${totalWeightKg.toFixed(3)} kg`
            : '';

        return {
            items,
            summary,
            totalWeightKg,
            error: '',
        };
    }

    function syncMobilePartialReceiptToolSummary(form) {
        const selection = collectMobilePartialReceiptShippingTools(form);
        if (selection.error) {
            updateMobilePartialReceiptToolSummary(form, selection.error, 0, true);
            return selection;
        }

        updateMobilePartialReceiptToolSummary(form, selection.summary, selection.totalWeightKg, false);
        return selection;
    }

    function openActionModal(config) {
        state.modalAction = config;
        const modal = document.getElementById('mobile-action-modal');
        const title = document.getElementById('mobile-action-title');
        const kicker = document.getElementById('mobile-action-kicker');
        const body = document.getElementById('mobile-action-body');
        const submit = document.getElementById('mobile-action-submit');
        const feedback = document.getElementById('mobile-action-feedback');

        if (!modal || !title || !kicker || !body || !submit || !feedback) {
            return;
        }

        feedback.className = 'mobile-action-feedback';
        feedback.textContent = '';

        if (config.type === 'partial') {
            const workOrder = config.workOrder || null;
            const summary = workOrder?.partial_receipt_summary || {};
            const remainingNetWeightKg = Number(config.remainingNetWeightKg || workOrder?.partial_receipt_remaining_net_weight_kg || 0);
            title.textContent = '部分入庫';
            kicker.textContent = 'PARTIAL RECEIPT';
            submit.textContent = '確認部分入庫';
            body.innerHTML = `
                <div class="mobile-action-grid">
                    <div class="mobile-info-card">
                        <strong>${escapeHtml(config.sourceLabel || (config.machineRun ? `拆分機台：${config.machineRun.run_label || config.machineRun.machine_name || config.machineRun.id}` : '一般工單'))}</strong>
                        <p class="mobile-detail-note">工單：${escapeHtml(workOrder?.work_order_number || String(config.workOrderId || ''))}</p>
                    </div>
                    <div class="mobile-info-card">
                        <strong>工單預計</strong>
                        <p class="mobile-detail-note">${escapeHtml(formatWeightUnits(summary.expected_net_weight_kg || 0, summary.expected_units || 0))}</p>
                    </div>
                    <div class="mobile-info-card">
                        <strong>累計已部分入庫</strong>
                        <p class="mobile-detail-note">${escapeHtml(formatWeightUnits(summary.partial_received_net_weight_kg || 0, summary.partial_received_units || 0))}</p>
                    </div>
                    <div class="mobile-info-card">
                        <strong>剩餘可入庫</strong>
                        <p class="mobile-detail-note">${escapeHtml(formatWeight(remainingNetWeightKg))}</p>
                    </div>
                    <label class="mobile-field">
                        <span>本次入庫淨重 (kg)</span>
                        <input type="number" name="net_weight_kg" min="0.01" step="0.01" placeholder="例如 25.50" required>
                    </label>
                    <input type="hidden" name="shipping_tool_details" value="">
                    <div class="mobile-field">
                        <span>本次出貨載具</span>
                        ${renderPartialReceiptToolSelector(workOrder)}
                    </div>
                    <label class="mobile-field">
                        <span>備註</span>
                        <textarea name="notes" placeholder="可填寫本次部分入庫、交班、急單交付或異常狀況"></textarea>
                    </label>
                </div>
            `;
        } else if (config.type === 'complete') {
            const preview = config.completionPreview || buildWorkOrderCompletionPreview(config.workOrder || state.currentWorkOrder);
            title.textContent = '完工回報';
            kicker.textContent = 'COMPLETE';
            submit.textContent = '確認完工';
            body.innerHTML = `
                <div class="mobile-action-grid">
                    <div class="mobile-info-card">
                        <strong>工單預計</strong>
                        <p class="mobile-detail-note">${escapeHtml(formatWeightUnits(preview.expected_net_weight_kg, preview.expected_units))}</p>
                    </div>
                    <div class="mobile-info-card">
                        <strong>現場已生產</strong>
                        <p class="mobile-detail-note">${escapeHtml(formatWeightUnits(preview.produced_net_weight_kg, preview.produced_units))}</p>
                    </div>
                    <div class="mobile-info-card">
                        <strong>已部分入庫</strong>
                        <p class="mobile-detail-note">${escapeHtml(formatWeightUnits(preview.partial_received_net_weight_kg, preview.partial_received_units))}</p>
                    </div>
                    <div class="mobile-info-card">
                        <strong>本次最終補入</strong>
                        <p class="mobile-detail-note">${escapeHtml(formatWeightUnits(preview.final_received_net_weight_kg, preview.final_received_units))}</p>
                    </div>
                    <div class="mobile-info-card">
                        <strong>真實短缺</strong>
                        <p class="mobile-detail-note">${escapeHtml(formatWeightUnits(preview.shortage_net_weight_kg, preview.shortage_units))}</p>
                    </div>
                    <div class="mobile-info-card">
                        <strong>平衡差異</strong>
                        <p class="mobile-detail-note">${escapeHtml(`${Number(preview.balance_difference_net_weight_kg || 0).toFixed(2)} kg`)}</p>
                    </div>
                    <label class="mobile-field">
                        <span>入庫設定</span>
                        <select name="auto_create_inventory">
                            <option value="1"${preview.final_received_net_weight_kg > 0.0001 ? ' selected' : ''}>依平衡結果自動建立最終入庫</option>
                            <option value="0"${preview.final_received_net_weight_kg <= 0.0001 ? ' selected' : ''}>只更新工單狀態</option>
                        </select>
                    </label>
                    <label class="mobile-field">
                        <span>短缺原因</span>
                        <select name="shortage_reason_code">
                            <option value="">-- 無短缺可留空 --</option>
                            <option value="material_loss"${String(config.workOrder?.shortage_reason_code || '') === 'material_loss' ? ' selected' : ''}>遺失 / 散落</option>
                            <option value="mixed_material"${String(config.workOrder?.shortage_reason_code || '') === 'mixed_material' ? ' selected' : ''}>混料 / 混批</option>
                            <option value="damaged"${String(config.workOrder?.shortage_reason_code || '') === 'damaged' ? ' selected' : ''}>破損 / 報廢</option>
                            <option value="count_error"${String(config.workOrder?.shortage_reason_code || '') === 'count_error' ? ' selected' : ''}>計數 / 重量誤差</option>
                            <option value="other"${String(config.workOrder?.shortage_reason_code || '') === 'other' ? ' selected' : ''}>其他</option>
                        </select>
                    </label>
                    <label class="mobile-field">
                        <span>短缺說明</span>
                        <textarea name="shortage_notes" placeholder="若有真實短缺，請補充原因與現場說明">${escapeHtml(String(config.workOrder?.shortage_notes || ''))}</textarea>
                    </label>
                    <label class="mobile-field">
                        <span>結案備註</span>
                        <textarea name="notes" placeholder="可補充完工狀況、交接資訊、庫存或短缺說明"></textarea>
                    </label>
                </div>
            `;
        } else if (config.type === 'production_records') {
            title.textContent = '編輯生產紀錄';
            kicker.textContent = 'PRODUCTION RECORDS';
            submit.textContent = '儲存生產紀錄';
            body.innerHTML = renderProductionRecordEditor(config);
        } else if (config.type === 'upload') {
            const uploadTarget = String(config.uploadTarget || 'completion');
            const uploadConfig = getExecutionImageUploadConfig(uploadTarget);
            title.textContent = `上傳${uploadConfig.label}`;
            kicker.textContent = 'PHOTO UPLOAD';
            submit.textContent = `上傳${uploadConfig.label}`;
            resetUploadDraft();
            body.innerHTML = `
                <div class="mobile-action-grid">
                    <div class="mobile-info-card">
                        <strong>手機拍照上傳</strong>
                        <p class="mobile-detail-note">可直接拍照，或從手機相簿一次選多張圖片後一起送出。</p>
                    </div>
                    <label class="mobile-field">
                        <span>圖片用途</span>
                        <select name="upload_target">
                            <option value="completion"${uploadTarget === 'completion' ? ' selected' : ''}>完工圖片</option>
                            <option value="defect"${uploadTarget === 'defect' ? ' selected' : ''}>不良品圖片</option>
                            <option value="tool_condition"${uploadTarget === 'tool_condition' ? ' selected' : ''}>載具狀況圖片</option>
                        </select>
                    </label>
                    <label class="mobile-field">
                        <span>照片說明</span>
                        <textarea name="description" placeholder="例如：完工包裝、現場首件、異常位置"></textarea>
                    </label>
                    <label class="mobile-field">
                        <span>直接拍照</span>
                        <input type="file" name="camera_image" accept="image/*" capture="environment">
                    </label>
                    <label class="mobile-field">
                        <span>相簿 / 多張選取</span>
                        <input type="file" name="gallery_images" accept="image/*" multiple>
                    </label>
                    <div class="mobile-upload-queue" id="mobile-upload-queue">
                        <div class="mobile-empty-state">
                            <strong>尚未選擇照片</strong>
                            <p class="mobile-empty-text">請先拍照，或從手機相簿選取要上傳的圖片。</p>
                        </div>
                    </div>
                </div>
            `;
        } else if (config.type === 'inspection_create' || config.type === 'inspection_edit') {
            const values = config.values || {};
            const machineOptions = ['<option value="">請選擇機台</option>']
                .concat((config.machines || []).map((machine) => {
                    const machineId = String(machine.id || '');
                    const label = machine.machine_number
                        ? `${String(machine.machine_number)} / ${String(machine.name || '未命名機台')}`
                        : String(machine.name || '未命名機台');
                    return `
                        <option value="${escapeAttribute(machineId)}"${machineId === String(values.machine_id || '') ? ' selected' : ''}>
                            ${escapeHtml(label)}
                        </option>
                    `;
                }))
                .join('');
            const employeeOptions = ['<option value="">請選擇檢驗人</option>']
                .concat((config.employees || []).map((employee) => {
                    const employeeId = String(employee.id || '');
                    const label = employee.employee_number
                        ? `${String(employee.employee_number)} / ${String(employee.name || '未命名人員')}`
                        : String(employee.name || '未命名人員');
                    return `
                        <option value="${escapeAttribute(employeeId)}"${employeeId === String(values.inspector_id || '') ? ' selected' : ''}>
                            ${escapeHtml(label)}
                        </option>
                    `;
                }))
                .join('');

            title.textContent = config.type === 'inspection_edit' ? '編輯每日機台檢驗' : '新增每日機台檢驗';
            kicker.textContent = 'DAILY INSPECTION';
            submit.textContent = config.type === 'inspection_edit' ? '儲存檢驗' : '建立檢驗';
            body.innerHTML = `
                <div class="mobile-action-grid">
                    <label class="mobile-field">
                        <span>檢驗日期</span>
                        <input type="date" name="inspection_date" value="${escapeAttribute(String(values.inspection_date || ''))}" required>
                    </label>
                    <label class="mobile-field">
                        <span>機台</span>
                        <select name="machine_id" required>
                            ${machineOptions}
                        </select>
                    </label>
                    <label class="mobile-field">
                        <span>檢驗人</span>
                        <select name="inspector_id" required>
                            ${employeeOptions}
                        </select>
                    </label>
                    <label class="mobile-field">
                        <span>檢驗結果</span>
                        <select name="is_qualified">
                            <option value="1"${String(values.is_qualified || '1') === '1' ? ' selected' : ''}>合格</option>
                            <option value="0"${String(values.is_qualified || '1') === '0' ? ' selected' : ''}>不合格</option>
                        </select>
                    </label>
                    <label class="mobile-field">
                        <span>備註</span>
                        <textarea name="notes" placeholder="可填寫巡檢觀察、異常位置、後續追蹤事項">${escapeHtml(String(values.notes || ''))}</textarea>
                    </label>
                </div>
            `;
        } else if (config.type === 'issue') {
            const sourceTypeOptions = (state.qualityIssueMeta.sourceTypeOptions.length
                ? state.qualityIssueMeta.sourceTypeOptions
                : [
                    { value: 'process_inspection', label: '製程檢驗' },
                    { value: 'other', label: '其他' },
                ])
                .map((option) => `
                    <option value="${escapeAttribute(option.value)}"${option.value === 'process_inspection' ? ' selected' : ''}>
                        ${escapeHtml(option.label)}
                    </option>
                `)
                .join('');
            const statusOptions = (state.qualityIssueMeta.statusOptions.length
                ? state.qualityIssueMeta.statusOptions
                : [{ value: 'pending', label: '待處理' }])
                .map((option) => `
                    <option value="${escapeAttribute(option.value)}"${option.value === 'pending' ? ' selected' : ''}>
                        ${escapeHtml(option.label)}
                    </option>
                `)
                .join('');
            const departmentOptions = ['<option value="">未指定責任部門</option>']
                .concat(
                    state.qualityIssueMeta.departments.map((department) => `
                        <option value="${escapeAttribute(String(department.id || ''))}">
                            ${escapeHtml(String(department.name || '未命名部門'))}
                        </option>
                    `)
                )
                .join('');

            title.textContent = '異常回報';
            kicker.textContent = 'QUALITY ISSUE';
            submit.textContent = '送出異常';
            body.innerHTML = `
                <div class="mobile-action-grid">
                    <div class="mobile-info-card">
                        <strong>回報工單</strong>
                        <p class="mobile-detail-note">工單 ID：${escapeHtml(String(config.workOrderId))}</p>
                    </div>
                    <label class="mobile-field">
                        <span>異常來源類型</span>
                        <select name="issue_source_type">
                            ${sourceTypeOptions}
                        </select>
                    </label>
                    <label class="mobile-field">
                        <span>責任部門</span>
                        <select name="responsible_department_id">
                            ${departmentOptions}
                        </select>
                    </label>
                    <label class="mobile-field">
                        <span>處理狀態</span>
                        <select name="status">
                            ${statusOptions}
                        </select>
                    </label>
                    <label class="mobile-field">
                        <span>異常描述</span>
                        <textarea name="issue_description" placeholder="請描述異常狀況、影響範圍、批號或現場觀察" required></textarea>
                    </label>
                    <label class="mobile-field">
                        <span>原因分析</span>
                        <textarea name="root_cause_analysis" placeholder="可先填現場初步判斷，若尚未確認可留空"></textarea>
                    </label>
                    <label class="mobile-field">
                        <span>暫時處置</span>
                        <textarea name="corrective_actions" placeholder="例如：暫停生產、隔離批次、通知班長"></textarea>
                    </label>
                    <label class="mobile-field">
                        <span>預防措施</span>
                        <textarea name="preventive_actions" placeholder="若目前尚無，可先留空，後續由主管補充"></textarea>
                    </label>
                    <div class="mobile-info-card">
                        <strong>補充說明</strong>
                        <p class="mobile-detail-note">若需要附照片，送出異常後可再用「拍照 / 上傳」補工單現場照片。</p>
                    </div>
                </div>
            `;
        }

        const actionForm = document.getElementById('mobile-action-form');
        if (config.type === 'partial' && actionForm instanceof HTMLFormElement) {
            updateMobilePartialReceiptToolSummary(actionForm, '', 0, false);
        }

        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeActionModal() {
        const modal = document.getElementById('mobile-action-modal');
        const form = document.getElementById('mobile-action-form');
        const feedback = document.getElementById('mobile-action-feedback');
        if (modal) {
            modal.classList.add('hidden');
            modal.setAttribute('aria-hidden', 'true');
        }
        if (form) {
            form.reset();
        }
        if (feedback) {
            feedback.className = 'mobile-action-feedback';
            feedback.textContent = '';
        }
        resetUploadDraft();
        state.modalAction = null;
    }

    function handleProductionRecordModeToggle(mode) {
        if (!state.modalAction || state.modalAction.type !== 'production_records') {
            return;
        }

        const form = document.getElementById('mobile-action-form');
        if (form instanceof HTMLFormElement) {
            syncProductionRecordDraftFromForm(form);
        }

        state.modalAction.productionRecordMode = mode === 'manual' ? 'manual' : 'preset';
        rerenderProductionRecordModal();
    }

    function addProductionRecordDraftRow() {
        if (!state.modalAction || state.modalAction.type !== 'production_records') {
            return;
        }

        const form = document.getElementById('mobile-action-form');
        if (form instanceof HTMLFormElement) {
            syncProductionRecordDraftFromForm(form);
        }

        const mode = String(state.modalAction.productionRecordMode || 'preset') === 'manual' ? 'manual' : 'preset';
        if (mode !== 'manual') {
            return;
        }

        state.modalAction.productionRecordBuffers.manual.push(createEmptyProductionRecordDraft('manual'));
        rerenderProductionRecordModal();
    }

    function removeProductionRecordDraftRow(index) {
        if (!state.modalAction || state.modalAction.type !== 'production_records') {
            return;
        }

        const form = document.getElementById('mobile-action-form');
        if (form instanceof HTMLFormElement) {
            syncProductionRecordDraftFromForm(form);
        }

        const records = state.modalAction.productionRecordBuffers.manual || [];
        if (index < 0 || index >= records.length) {
            return;
        }

        records.splice(index, 1);
        if (!records.length) {
            records.push(createEmptyProductionRecordDraft('manual'));
        }
        rerenderProductionRecordModal();
    }

    function rerenderProductionRecordModal() {
        if (!state.modalAction || state.modalAction.type !== 'production_records') {
            return;
        }

        const body = document.getElementById('mobile-action-body');
        if (!(body instanceof HTMLElement)) {
            return;
        }

        body.innerHTML = renderProductionRecordEditor(state.modalAction);
    }

    function syncProductionRecordDraftFromForm(form) {
        if (!state.modalAction || state.modalAction.type !== 'production_records') {
            return;
        }
        syncProductionRecordDraftFromContainer(form, state.modalAction);
    }

    function closeDetailSheet() {
        const sheet = document.getElementById('mobile-detail-sheet');
        if (sheet) {
            sheet.classList.add('hidden');
            sheet.setAttribute('aria-hidden', 'true');
        }
        state.selectedWorkOrderId = null;
        state.currentWorkOrder = null;
    }

    async function handleActionSubmit(event) {
        event.preventDefault();
        if (!state.modalAction) {
            return;
        }

        const form = event.currentTarget;
        if (!(form instanceof HTMLFormElement)) {
            return;
        }

        const submitButton = document.getElementById('mobile-action-submit');
        toggleActionSubmitting(true, submitButton);

        try {
            if (state.modalAction.type === 'partial') {
                await submitPartialReceipt(form, state.modalAction);
                return;
            }
            if (state.modalAction.type === 'inspection_create' || state.modalAction.type === 'inspection_edit') {
                await submitInspectionAction(form, state.modalAction);
                return;
            }
            if (state.modalAction.type === 'production_records') {
                await submitProductionRecords(form, state.modalAction);
                return;
            }
            if (state.modalAction.type === 'complete') {
                await submitCompleteAction(form, state.modalAction);
                return;
            }
            if (state.modalAction.type === 'upload') {
                await submitPhotoUpload(form, state.modalAction);
                return;
            }
            if (state.modalAction.type === 'issue') {
                await submitQualityIssueReport(form, state.modalAction);
            }
        } finally {
            toggleActionSubmitting(false, submitButton);
        }
    }

    function handleActionFormChange(event) {
        if (!state.modalAction) {
            return;
        }

        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        if (state.modalAction.type === 'partial') {
            if (target instanceof HTMLInputElement && target.dataset.partialToolToggle !== undefined) {
                const row = target.closest('[data-partial-tool-row]');
                const quantityInput = row?.querySelector('[data-partial-tool-quantity]');
                if (quantityInput instanceof HTMLInputElement) {
                    quantityInput.disabled = !target.checked;
                    if (target.checked) {
                        if (!quantityInput.value.trim() || Number(quantityInput.value) <= 0) {
                            quantityInput.value = '1';
                        }
                    } else {
                        quantityInput.value = '';
                    }
                }
            }

            const form = target.closest('form');
            if (form instanceof HTMLFormElement) {
                syncMobilePartialReceiptToolSummary(form);
            }
            return;
        }

        if (state.modalAction.type === 'production_records' && target instanceof HTMLSelectElement && target.name === 'pr_machine_id[]') {
            const row = target.closest('[data-production-row]');
            if (row instanceof HTMLElement) {
                const machineTypeInput = row.querySelector('[name="pr_machine_type[]"]');
                if (machineTypeInput instanceof HTMLInputElement) {
                    machineTypeInput.value = getProductionRecordMachineType(target.value);
                }
            }
            return;
        }

        if (state.modalAction.type !== 'upload' || !(target instanceof HTMLInputElement) || target.type !== 'file') {
            return;
        }

        const files = Array.from(target.files || []);
        if (!files.length) {
            return;
        }

        appendUploadDraftFiles(files);
        target.value = '';
    }

    function appendUploadDraftFiles(files) {
        const allowedMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']);
        const nextItems = [];

        files.forEach((file) => {
            if (!(file instanceof File)) {
                return;
            }
            if (!allowedMimeTypes.has(file.type)) {
                showActionFeedback('error', `不支援的圖片格式：${file.name}`);
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                showActionFeedback('error', `圖片不可超過 10MB：${file.name}`);
                return;
            }

            nextItems.push({
                id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
                file,
                previewUrl: URL.createObjectURL(file),
            });
        });

        if (!nextItems.length) {
            renderUploadDraftQueue();
            return;
        }

        state.uploadDraft = state.uploadDraft.concat(nextItems);
        showActionFeedback('success', `已加入 ${nextItems.length} 張待上傳照片。`);
        renderUploadDraftQueue();
    }

    function removeUploadDraftFile(draftId) {
        const nextDraft = [];
        state.uploadDraft.forEach((item) => {
            if (item.id === draftId) {
                if (item.previewUrl) {
                    URL.revokeObjectURL(item.previewUrl);
                }
                return;
            }
            nextDraft.push(item);
        });
        state.uploadDraft = nextDraft;
        renderUploadDraftQueue();
    }

    function resetUploadDraft() {
        state.uploadDraft.forEach((item) => {
            if (item.previewUrl) {
                URL.revokeObjectURL(item.previewUrl);
            }
        });
        state.uploadDraft = [];
    }

    function renderUploadDraftQueue() {
        const queue = document.getElementById('mobile-upload-queue');
        if (!(queue instanceof HTMLElement)) {
            return;
        }

        if (!state.uploadDraft.length) {
            queue.innerHTML = `
                <div class="mobile-empty-state">
                    <strong>尚未選擇照片</strong>
                    <p class="mobile-empty-text">請先拍照，或從手機相簿選取要上傳的圖片。</p>
                </div>
            `;
            return;
        }

        queue.innerHTML = `
            <div class="mobile-upload-queue-header">
                <strong>待上傳 ${state.uploadDraft.length} 張</strong>
                <span class="mobile-empty-text">送出前可先刪除不要的照片</span>
            </div>
            <div class="mobile-upload-preview-grid">
                ${state.uploadDraft.map((item, index) => `
                    <article class="mobile-upload-preview-card">
                        <button type="button" class="mobile-upload-remove" data-action="remove-upload-file" data-upload-draft-id="${escapeAttribute(item.id)}" aria-label="移除此照片">
                            <i class="fas fa-xmark"></i>
                        </button>
                        <img src="${escapeAttribute(item.previewUrl)}" alt="${escapeAttribute(item.file.name || `照片 ${index + 1}`)}">
                        <div class="mobile-upload-preview-meta">
                            <strong>${escapeHtml(item.file.name || `照片 ${index + 1}`)}</strong>
                            <span>${escapeHtml(formatFileSize(item.file.size))}</span>
                        </div>
                    </article>
                `).join('')}
            </div>
        `;
    }

    async function submitPartialReceipt(form, action) {
        const formData = new FormData(form);
        const weightValue = String(formData.get('net_weight_kg') || '').trim();
        if (!weightValue) {
            showActionFeedback('error', '請填寫本次入庫淨重。');
            return;
        }
        const shippingToolSelection = syncMobilePartialReceiptToolSummary(form);
        const shippingToolDetails = String(shippingToolSelection.summary || '').trim();
        if (shippingToolSelection.error) {
            showActionFeedback('error', shippingToolSelection.error);
            return;
        }
        if (!shippingToolDetails || shippingToolSelection.items.length === 0) {
            showActionFeedback('error', '請至少選擇一種本次出貨載具並填寫數量。');
            return;
        }

        const notes = String(formData.get('notes') || '').trim();
        const payload = {
            work_order_id: action.workOrderId,
            net_weight_kg: parseFloat(weightValue),
            shipping_tool_details: shippingToolDetails,
            shipping_tools: shippingToolSelection.items,
            notes,
        };

        if (action.machineRunId) {
            payload.machine_run_id = action.machineRunId;
        }

        try {
            const result = await fetchJson(`${API_BASE}/work_orders/partial_receipt.php`, {
                method: 'POST',
                body: payload,
                withCsrf: true,
            });
            const receiptNumber = result.data?.receipt_number ? `單號 ${result.data.receipt_number}` : '部分入庫單';
            const remainingWeight = Number(result.data?.remaining_work_order_net_weight_kg || 0).toFixed(2);
            await refreshAfterMutation(action.workOrderId, `${result.message || '部分入庫完成。'} ${receiptNumber}，工單剩餘可入庫 ${remainingWeight} kg。`, true);
        } catch (error) {
            showActionFeedback('error', error.message || '部分入庫失敗。');
        }
    }

    async function submitProductionRecords(form, action) {
        syncProductionRecordDraftFromForm(form);
        await submitProductionRecordsFromState(action);
    }

    async function submitProductionRecordsFromState(action) {
        const mode = String(action.productionRecordMode || 'preset') === 'manual' ? 'manual' : 'preset';
        const records = Array.isArray(action.productionRecordBuffers?.[mode]) ? action.productionRecordBuffers[mode] : [];
        const normalizedRecords = records
            .map((record) => ({
                card_number: String(record.card_number || '').trim(),
                tool_name: String(record.tool_name || '').trim(),
                tool_weight_kg: hasSubmittedValue(record.tool_weight_kg) ? String(record.tool_weight_kg).trim() : null,
                weight_kg: hasSubmittedValue(record.weight_kg) ? String(record.weight_kg).trim() : null,
                production_date: String(record.production_date || '').trim() || null,
                production_time: String(record.production_time || '').trim() || null,
                machine_id: String(record.machine_id || '').trim() || null,
                machine_type: String(record.machine_type || '').trim() || null,
                operator_name: String(record.operator_name || '').trim() || null,
                notes: String(record.notes || '').trim() || null,
                production_source_mode: mode,
            }))
            .filter((record) => hasSubmittedValue(record.card_number) && isMeaningfulProductionRecord(record));

        if (!normalizedRecords.length) {
            showProductionRecordFeedback(action, 'error', '請至少保留一筆有卡號，且已填載具或生產資訊的生產紀錄。');
            return;
        }

        try {
            const result = await fetchJson(`${API_BASE}/work_orders/update.php?id=${action.workOrderId}`, {
                method: 'PUT',
                body: {
                    production_records: normalizedRecords,
                },
                withCsrf: true,
            });
            await refreshAfterMutation(
                action.workOrderId,
                result.message || '生產紀錄已更新。',
                action !== state.detailProductionRecordAction
            );
        } catch (error) {
            showProductionRecordFeedback(action, 'error', error.message || '生產紀錄更新失敗。');
        }
    }

    async function submitCompleteAction(form, action) {
        const formData = new FormData(form);
        const notes = String(formData.get('notes') || '').trim();
        const autoCreateInventory = String(formData.get('auto_create_inventory') || '1') !== '0';
        const shortageReasonCode = String(formData.get('shortage_reason_code') || '').trim();
        const shortageNotes = String(formData.get('shortage_notes') || '').trim();
        const preview = action.completionPreview || buildWorkOrderCompletionPreview(action.workOrder || state.currentWorkOrder);
        const existingNotes = action.workOrder?.other_notes || state.currentWorkOrder?.other_notes || '';
        const mergedNotes = mergeOperationalNote(existingNotes, '完工回報', notes);
        const status = state.statusByKey.completed;

        if (!status || !status.id) {
            showActionFeedback('error', '找不到已完成狀態設定。');
            return;
        }
        if (preview.final_received_net_weight_kg > 0.0001 && !autoCreateInventory) {
            showActionFeedback('error', '尚有最終補入庫重量時，不能只更新工單狀態。');
            return;
        }
        if (preview.shortage_net_weight_kg > 0.0001 && !shortageReasonCode) {
            showActionFeedback('error', '有真實短缺時，必須填寫短缺原因。');
            return;
        }
        if (preview.shortage_net_weight_kg > 0.0001 && shortageReasonCode === 'other' && !shortageNotes) {
            showActionFeedback('error', '短缺原因選擇其他時，必須填寫短缺說明。');
            return;
        }

        try {
            const result = await fetchJson(`${API_BASE}/work_orders/update.php?id=${action.workOrderId}`, {
                method: 'PUT',
                body: {
                    status_lookup_id: status.id,
                    actual_end_date: getCurrentDateTimeString(),
                    auto_create_inventory: autoCreateInventory,
                    shortage_reason_code: preview.shortage_net_weight_kg > 0.0001 ? shortageReasonCode : '',
                    shortage_notes: preview.shortage_net_weight_kg > 0.0001 ? shortageNotes : '',
                    other_notes: mergedNotes || undefined,
                },
                withCsrf: true,
            });
            await refreshAfterMutation(action.workOrderId, result.message || '工單已完工。', true);
        } catch (error) {
            showActionFeedback('error', error.message || '完工回報失敗。');
        }
    }

    async function submitPhotoUpload(form, action) {
        const formData = new FormData(form);
        if (!state.uploadDraft.length) {
            showActionFeedback('error', '請先拍照或選擇要上傳的照片。');
            return;
        }

        try {
            const uploadTarget = String(formData.get('upload_target') || 'completion');
            const description = String(formData.get('description') || '').trim();
            const uploadConfig = getExecutionImageUploadConfig(uploadTarget);

            for (let index = 0; index < state.uploadDraft.length; index += 1) {
                const draft = state.uploadDraft[index];
                const uploadData = new FormData();
                uploadData.append('work_order_id', String(action.workOrderId));
                uploadData.append('description', description);
                uploadData.append('sort_order', String(index + 1));
                uploadData.append('image', draft.file);

                showActionFeedback('success', `正在上傳第 ${index + 1} / ${state.uploadDraft.length} 張${uploadConfig.label}...`);
                await fetchJson(`${API_BASE}/${uploadConfig.endpoint}/index.php`, {
                    method: 'POST',
                    body: uploadData,
                    withCsrf: true,
                    isFormData: true,
                });
            }

            emitMobileDataSyncWithDependencies(uploadConfig.endpoint, 'created', {
                work_order_id: action.workOrderId,
                upload_target: uploadTarget,
                image_count: state.uploadDraft.length,
            });

            await refreshAfterMutation(
                action.workOrderId,
                state.uploadDraft.length > 1 ? `已上傳 ${state.uploadDraft.length} 張${uploadConfig.label}。` : `${uploadConfig.label}上傳成功。`,
                true
            );
        } catch (error) {
            showActionFeedback('error', error.message || '圖片上傳失敗。');
        }
    }

    async function submitQualityIssueReport(form, action) {
        const formData = new FormData(form);
        const issueDescription = String(formData.get('issue_description') || '').trim();
        if (!issueDescription) {
            showActionFeedback('error', '請填寫異常描述。');
            return;
        }

        const payload = {
            report_datetime: getCurrentDateTimeString(),
            reported_by_employee_id: Number(state.currentUser?.id || 0),
            issue_source_type: String(formData.get('issue_source_type') || 'process_inspection'),
            issue_source_id: action.workOrderId,
            issue_description: issueDescription,
            root_cause_analysis: String(formData.get('root_cause_analysis') || '').trim(),
            corrective_actions: String(formData.get('corrective_actions') || '').trim(),
            preventive_actions: String(formData.get('preventive_actions') || '').trim(),
            responsible_department_id: String(formData.get('responsible_department_id') || '').trim() || null,
            status: String(formData.get('status') || 'pending'),
            completion_date: null,
        };

        try {
            const result = await fetchJson(`${API_BASE}/quality_issue_reports/index.php`, {
                method: 'POST',
                body: payload,
                withCsrf: true,
            });
            await refreshAfterMutation(action.workOrderId, result.message || '異常回報已送出。', true);
        } catch (error) {
            showActionFeedback('error', error.message || '異常回報失敗。');
        }
    }

    async function deleteExecutionImage(workOrderId, imageId, uploadTarget) {
        const uploadConfig = getExecutionImageUploadConfig(uploadTarget);

        if (!window.confirm(`確定要刪除此${uploadConfig.label}嗎？`)) {
            return;
        }

        try {
            const result = await fetchJson(`${API_BASE}/${uploadConfig.endpoint}/delete.php`, {
                method: 'DELETE',
                body: { id: imageId },
                withCsrf: true,
            });

            emitMobileDataSyncWithDependencies(uploadConfig.endpoint, 'deleted', {
                id: imageId,
                work_order_id: workOrderId,
                upload_target: uploadTarget,
            });

            await refreshAfterMutation(workOrderId, result.message || `${uploadConfig.label}已刪除。`, false);
        } catch (error) {
            window.alert(error.message || '刪除圖片失敗。');
        }
    }

    async function submitInspectionAction(form, action) {
        const formData = new FormData(form);
        const payload = {
            inspection_date: String(formData.get('inspection_date') || '').trim(),
            machine_id: Number(formData.get('machine_id') || 0),
            inspector_id: Number(formData.get('inspector_id') || 0),
            is_qualified: String(formData.get('is_qualified') || '1') !== '0',
            notes: String(formData.get('notes') || '').trim(),
        };

        if (!payload.inspection_date) {
            showActionFeedback('error', '請選擇檢驗日期。');
            return;
        }
        if (!payload.machine_id) {
            showActionFeedback('error', '請選擇機台。');
            return;
        }
        if (!payload.inspector_id) {
            showActionFeedback('error', '請選擇檢驗人。');
            return;
        }

        try {
            const isEdit = action.type === 'inspection_edit' && action.inspectionId;
            const result = await fetchJson(
                isEdit
                    ? `${API_BASE}/daily_machine_inspections/update.php?id=${action.inspectionId}`
                    : `${API_BASE}/daily_machine_inspections/index.php`,
                {
                    method: isEdit ? 'PUT' : 'POST',
                    body: payload,
                    withCsrf: true,
                }
            );
            await loadDailyInspections(false);
            closeActionModal();
            window.alert(result.message || (isEdit ? '每日機台檢驗更新成功。' : '每日機台檢驗新增成功。'));
        } catch (error) {
            showActionFeedback('error', error.message || '每日機台檢驗送出失敗。');
        }
    }

    async function refreshAfterMutation(workOrderId, successMessage, closeModalAfterSuccess) {
        await loadWorkOrders(false);
        if (workOrderId) {
            await openWorkOrderDetail(workOrderId);
            emitMobileDataSyncWithDependencies('work_orders', 'updated', { id: workOrderId });
        }

        if (closeModalAfterSuccess) {
            closeActionModal();
        }

        if (successMessage) {
            window.alert(successMessage);
        }
    }

    async function handleLogout() {
        try {
            await fetchJson(`${API_BASE}/logout.php`, {
                method: 'POST',
                body: {},
                withCsrf: true,
            });
        } catch (_error) {
            // 即使失敗也回到登入頁，避免把使用者困在頁面上
        } finally {
            sessionStorage.removeItem('csrf_token');
            window.location.href = `${window.location.pathname}?reason=manual_logout`;
        }
    }

    function handleFilterReset() {
        ['mobile-filter-keyword', 'mobile-filter-status', 'mobile-filter-machine', 'mobile-filter-start-date', 'mobile-filter-end-date']
            .forEach((id) => {
                const field = document.getElementById(id);
                if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
                    field.value = '';
                }
            });
        loadWorkOrders(true);
    }

    function handleInspectionFilterReset() {
        [
            'mobile-inspections-filter-machine',
            'mobile-inspections-filter-qualified',
            'mobile-inspections-filter-date-from',
            'mobile-inspections-filter-date-to',
        ].forEach((id) => {
            const field = document.getElementById(id);
            if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
                field.value = '';
            }
        });
        loadDailyInspections(true);
    }

    function applySectionState(section, options = {}) {
        const resolvedSection = MOBILE_SECTION_META[section] ? section : 'work_orders';
        state.currentSection = resolvedSection;
        const implementedSections = new Set(['work_orders', 'daily_machine_inspections']);
        const visibleSection = implementedSections.has(resolvedSection) ? resolvedSection : 'placeholder';

        document.querySelectorAll('[data-mobile-section]').forEach((element) => {
            if (element instanceof HTMLElement) {
                element.classList.toggle('hidden', element.dataset.mobileSection !== visibleSection);
            }
        });

        if (resolvedSection !== 'work_orders') {
            closeDetailSheet();
        }

        document.querySelectorAll('.mobile-drawer-link').forEach((link) => {
            if (link instanceof HTMLElement) {
                link.classList.toggle('active', link.dataset.section === resolvedSection);
            }
        });

        const meta = MOBILE_SECTION_META[resolvedSection] || MOBILE_SECTION_META.work_orders;
        setText('mobile-placeholder-kicker', meta.kicker);
        setText('mobile-placeholder-title', meta.title);
        setText('mobile-placeholder-subtitle', meta.subtitle);
        setText('mobile-placeholder-empty-title', meta.emptyTitle);
        setText('mobile-placeholder-empty-text', meta.emptyText);

        const url = new URL(window.location.href);
        if (resolvedSection === 'work_orders') {
            url.searchParams.delete('section');
        } else {
            url.searchParams.set('section', resolvedSection);
        }

        if (options.pushHistory) {
            window.history.pushState({}, document.title, url.toString());
        } else if (options.replaceHistory) {
            window.history.replaceState({}, document.title, url.toString());
        }

        if (resolvedSection === 'daily_machine_inspections') {
            loadDailyInspections(true);
        }
    }

    function emitMobileDataSync(module, action, data = null) {
        const timestamp = Date.now();
        const eventDetail = {
            module,
            action,
            data,
            timestamp,
            eventId: `${timestamp}_mobile_${module}_${action}_${Math.random().toString(36).slice(2, 8)}`,
            sourceTabId: `mobile_${Math.random().toString(36).slice(2, 10)}`,
        };

        try {
            window.dispatchEvent(new CustomEvent('dataSync', { detail: eventDetail }));
            localStorage.setItem('dataSync', JSON.stringify(eventDetail));
            localStorage.removeItem('dataSync');
        } catch (error) {
            console.error('[MobileDataSync] 發送通知失敗:', error);
        }
    }

    function emitMobileDataSyncWithDependencies(module, action, data = null) {
        emitMobileDataSync(module, action, data);
        const dependents = MOBILE_DATA_SYNC_DEPENDENCIES[module] || [];
        dependents.forEach((dependentModule) => {
            emitMobileDataSync(dependentModule, 'dependency_updated', {
                sourceModule: module,
                sourceAction: action,
                sourceData: data,
            });
        });
    }

    function syncTopbarCompactState() {
        const topbar = document.querySelector('.mobile-topbar');
        if (!(topbar instanceof HTMLElement)) {
            return;
        }

        const shouldCompact = window.scrollY > 12;
        topbar.classList.toggle('compact', shouldCompact);
    }

    function toggleDrawer() {
        const drawer = document.getElementById('mobile-drawer');
        const menuButton = document.getElementById('mobile-menu-button');
        if (!(drawer instanceof HTMLElement) || !(menuButton instanceof HTMLElement)) {
            return;
        }

        const isHidden = drawer.classList.contains('hidden');
        if (isHidden) {
            drawer.classList.remove('hidden');
            drawer.setAttribute('aria-hidden', 'false');
            menuButton.setAttribute('aria-expanded', 'true');
        } else {
            closeDrawer();
        }
    }

    function closeDrawer() {
        const drawer = document.getElementById('mobile-drawer');
        const menuButton = document.getElementById('mobile-menu-button');
        if (drawer instanceof HTMLElement) {
            drawer.classList.add('hidden');
            drawer.setAttribute('aria-hidden', 'true');
        }
        if (menuButton instanceof HTMLElement) {
            menuButton.setAttribute('aria-expanded', 'false');
        }
    }

    async function fetchJson(url, options = {}) {
        const requestOptions = {
            method: options.method || 'GET',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
            },
        };

        if (options.withCsrf && state.csrfToken) {
            requestOptions.headers['X-CSRF-Token'] = state.csrfToken;
        }

        if (options.isFormData) {
            requestOptions.body = options.body;
        } else if (options.body !== undefined) {
            requestOptions.headers['Content-Type'] = 'application/json';
            requestOptions.body = JSON.stringify(options.body);
        }

        const response = await fetch(url, requestOptions);
        const rawText = await response.text();
        let result;

        try {
            result = rawText ? JSON.parse(rawText) : {};
        } catch (_error) {
            throw new Error(`伺服器回應格式異常（HTTP ${response.status}）。`);
        }

        if (!response.ok || result.success === false) {
            if (response.status === 401 && state.mode === 'app') {
                window.location.href = `${window.location.pathname}?reason=session_expired`;
                throw new Error('登入已過期，請重新登入。');
            }
            throw new Error(result.message || `請求失敗（HTTP ${response.status}）。`);
        }

        return result;
    }

    function loadCompanyBranding() {
        Promise.allSettled([
            fetch(`${API_BASE}/companies/public_info.php?id=1`, { credentials: 'include' }),
            fetch(`${API_BASE}/companies/public_logo.php?company_id=1`, { credentials: 'include' }),
        ]).then(async ([infoResult, logoResult]) => {
            if (infoResult.status === 'fulfilled' && infoResult.value.ok) {
                const info = await infoResult.value.json().catch(() => null);
                if (info?.success && info.data?.name) {
                    const nameEl = document.getElementById('company-full-name');
                    if (nameEl) {
                        nameEl.textContent = info.data.name;
                    }
                }
            }

            if (logoResult.status === 'fulfilled' && logoResult.value.ok) {
                const logo = await logoResult.value.json().catch(() => null);
                if (logo?.success && logo.data?.file_path) {
                    const wrap = document.getElementById('company-logo-wrap');
                    const fallback = document.getElementById('company-logo-fallback');
                    if (wrap) {
                        const img = document.createElement('img');
                        img.src = `${state.basePath}${String(logo.data.file_path).replace(/^\/+/, '')}`;
                        img.alt = '公司 LOGO';
                        img.className = 'company-logo-img';
                        img.onerror = function () {
                            img.remove();
                            if (fallback) {
                                fallback.style.display = '';
                            }
                        };
                        if (fallback) {
                            fallback.style.display = 'none';
                        }
                        wrap.appendChild(img);
                    }
                }
            }
        }).catch(() => {
            // 保持預設外觀
        });
    }

    function renderGuestReasonNotice() {
        const noticeEl = document.getElementById('login-timeout-notice');
        if (!(noticeEl instanceof HTMLElement)) {
            return;
        }

        const reason = noticeEl.dataset.loginReason || '';
        if (reason === 'idle_timeout' || reason === 'session_expired' || reason === 'manual_logout') {
            noticeEl.textContent = '你已經登出，請再次登入手機版。';
            noticeEl.style.display = 'block';
        }
    }

    function bindPasswordToggle(passwordInput, toggleButton) {
        if (!(passwordInput instanceof HTMLInputElement) || !(toggleButton instanceof HTMLElement)) {
            return;
        }

        toggleButton.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            const icon = toggleButton.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }

    function toggleGuestSubmitting(isSubmitting, button) {
        if (!(button instanceof HTMLButtonElement)) {
            return;
        }
        button.disabled = isSubmitting;
        button.textContent = isSubmitting ? '登入中...' : '登入手機版';
    }

    function toggleActionSubmitting(isSubmitting, button) {
        if (!(button instanceof HTMLButtonElement)) {
            return;
        }
        button.disabled = isSubmitting;
        if (isSubmitting) {
            button.dataset.originalText = button.textContent;
            button.textContent = '送出中...';
        } else if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
        }
    }

    function showGuestFeedback(type, message) {
        const errorEl = document.getElementById('mobile-login-error');
        const successEl = document.getElementById('mobile-login-success');
        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
        }
        if (successEl) {
            successEl.style.display = 'none';
            successEl.textContent = '';
        }

        const target = type === 'error' ? errorEl : successEl;
        if (target) {
            target.textContent = message;
            target.style.display = 'block';
        }
    }

    function showActionFeedback(type, message) {
        const feedback = document.getElementById('mobile-action-feedback');
        if (!feedback) {
            return;
        }
        feedback.className = `mobile-action-feedback is-${type}`;
        feedback.textContent = message;
    }

    function showProductionRecordFeedback(action, type, message) {
        if (action === state.detailProductionRecordAction) {
            const feedback = document.querySelector('[data-inline-production-feedback]');
            if (feedback instanceof HTMLElement) {
                feedback.className = `mobile-action-feedback is-${type}`;
                feedback.textContent = message;
                return;
            }
            window.alert(message);
            return;
        }

        showActionFeedback(type, message);
    }

    function setListState(message) {
        setText('mobile-list-state', message);
    }

    function setInspectionListState(message) {
        setText('mobile-inspections-list-state', message);
    }

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    function getInputValue(id) {
        const element = document.getElementById(id);
        if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement) {
            return element.value.trim();
        }
        return '';
    }

    function mergeOperationalNote(existingNotes, label, note) {
        const trimmedNote = String(note || '').trim();
        if (!trimmedNote) {
            return existingNotes || undefined;
        }

        const operatorName = state.currentUser?.name ? ` / ${state.currentUser.name}` : '';
        const stamp = formatDateTime(getCurrentDateTimeString()) || getCurrentDateTimeString();
        const appended = `[${stamp}] ${label}${operatorName}\n${trimmedNote}`;
        return [String(existingNotes || '').trim(), appended].filter(Boolean).join('\n\n');
    }

    function hasRelaxedPermission(permissionNames) {
        const permissions = Array.isArray(state.currentUser?.permissions) ? state.currentUser.permissions : [];
        if (permissions.length === 0) {
            return true;
        }
        const names = Array.isArray(permissionNames) ? permissionNames : [permissionNames];
        return names.some((permissionName) => permissions.includes(permissionName));
    }

    function calculateWholeUnitsFromWeight(netWeightKg, weightPerUnitG) {
        const weight = Number(netWeightKg) || 0;
        const unitWeight = Number(weightPerUnitG) || 0;
        if (weight <= 0 || unitWeight <= 0) {
            return 0;
        }
        return Math.max(Math.floor(((weight * 1000) / unitWeight) + 0.000001), 0);
    }

    function formatWeightUnits(netWeightKg, units) {
        return `${formatWeight(netWeightKg)} / ${formatNumber(Math.round(Number(units) || 0))} 支`;
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

    function buildWorkOrderCompletionPreview(workOrder) {
        const summary = workOrder?.partial_receipt_summary || {};
        const expectedNetWeightKg = Number(summary.expected_net_weight_kg || workOrder?.total_weight_kg || 0);
        const producedNetWeightKg = Number(summary.produced_net_weight_kg || 0);
        const weightPerUnitG = Number(workOrder?.weight_per_unit_g || 0);
        const partialReceivedNetWeightKg = Number(summary.partial_received_net_weight_kg || 0);
        const partialReceivedUnits = Math.round(Number(summary.partial_received_units || 0));
        const finalReceivedNetWeightKg = Number(summary.final_received_net_weight_kg || Math.max(producedNetWeightKg - partialReceivedNetWeightKg, 0));
        const finalReceivedUnits = Math.round(Number(summary.final_received_units || calculateWholeUnitsFromWeight(finalReceivedNetWeightKg, weightPerUnitG)));
        const shortageNetWeightKg = Number(summary.shortage_net_weight_kg || Math.max(expectedNetWeightKg - producedNetWeightKg, 0));
        const shortageUnits = Math.round(Number(summary.shortage_units || calculateWholeUnitsFromWeight(shortageNetWeightKg, weightPerUnitG)));
        return {
            expected_net_weight_kg: expectedNetWeightKg,
            expected_units: Math.round(Number(summary.expected_units || calculateWholeUnitsFromWeight(expectedNetWeightKg, weightPerUnitG))),
            produced_net_weight_kg: producedNetWeightKg,
            produced_units: Math.round(Number(summary.produced_units || calculateWholeUnitsFromWeight(producedNetWeightKg, weightPerUnitG))),
            partial_received_net_weight_kg: partialReceivedNetWeightKg,
            partial_received_units: partialReceivedUnits,
            partial_shipped_net_weight_kg: Number(summary.partial_shipped_net_weight_kg || 0),
            partial_shipped_units: Math.round(Number(summary.partial_shipped_units || 0)),
            partial_allocated_net_weight_kg: Number(summary.partial_allocated_net_weight_kg || 0),
            partial_allocated_units: Math.round(Number(summary.partial_allocated_units || 0)),
            partial_available_to_ship_net_weight_kg: Number(summary.partial_available_to_ship_net_weight_kg || 0),
            partial_available_to_ship_units: Math.round(Number(summary.partial_available_to_ship_units || 0)),
            partial_unshipped_net_weight_kg: Number(summary.partial_unshipped_net_weight_kg || 0),
            partial_in_stock_units: Math.round(Number(summary.partial_in_stock_units || 0)),
            final_received_net_weight_kg: finalReceivedNetWeightKg,
            final_received_units: finalReceivedUnits,
            shortage_net_weight_kg: shortageNetWeightKg,
            shortage_units: shortageUnits,
            balance_difference_net_weight_kg: Number(summary.balance_difference_net_weight_kg || 0),
        };
    }

    function renderStatusBadge(statusKey, statusLabel) {
        const key = String(statusKey || '').trim();
        const safeClass = key ? `mobile-status-${escapeAttribute(key)}` : 'mobile-status-default';
        return `<span class="mobile-status-badge ${safeClass}">${escapeHtml(statusLabel || '未設定')}</span>`;
    }

    function renderInspectionBadge(isQualified) {
        return isQualified
            ? '<span class="mobile-status-badge mobile-status-completed">合格</span>'
            : '<span class="mobile-status-badge mobile-status-cancelled">不合格</span>';
    }

    function formatDateTime(value) {
        if (!value) {
            return '';
        }
        const normalized = String(value).replace(' ', 'T');
        const date = new Date(normalized);
        if (Number.isNaN(date.getTime())) {
            return String(value);
        }
        return new Intl.DateTimeFormat('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    }

    function formatWeight(value) {
        const numeric = Number(value || 0);
        if (!Number.isFinite(numeric) || numeric <= 0) {
            return '0 kg';
        }
        return `${numeric.toFixed(2)} kg`;
    }

    function formatNumber(value) {
        const numeric = Number(value || 0);
        if (!Number.isFinite(numeric)) {
            return '0';
        }
        return new Intl.NumberFormat('zh-TW', {
            maximumFractionDigits: 2,
        }).format(numeric);
    }

    function formatFileSize(value) {
        const bytes = Number(value || 0);
        if (!Number.isFinite(bytes) || bytes <= 0) {
            return '0 KB';
        }
        if (bytes >= 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        }
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    function hasSubmittedValue(value) {
        return value !== null && value !== undefined && String(value).trim() !== '';
    }

    function isMeaningfulProductionRecord(record) {
        return ['weight_kg', 'production_date', 'production_time', 'machine_id', 'tool_name', 'tool_weight_kg', 'notes']
            .some((field) => hasSubmittedValue(record[field]));
    }

    function normalizeTimeInputValue(value) {
        if (!value) {
            return '';
        }
        const text = String(value).trim();
        if (!text) {
            return '';
        }
        return text.length >= 5 ? text.slice(0, 5) : text;
    }

    function formatTimeValue(value) {
        return normalizeTimeInputValue(value);
    }

    function getCurrentDateTimeString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');
        const second = String(now.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }

    function getCurrentDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getImageTypeLabel(type) {
        const labels = {
            general: '一般紀錄',
            defect: '異常 / 不良',
            setup: '機台設定',
            sample: '樣品 / 成品',
        };
        return labels[type] || type || '照片';
    }

    function getExecutionImageUploadConfig(target) {
        const configs = {
            completion: {
                endpoint: 'work_order_completion_images',
                label: '完工圖片',
            },
            defect: {
                endpoint: 'work_order_defect_images',
                label: '不良品圖片',
            },
            tool_condition: {
                endpoint: 'work_order_tool_condition_images',
                label: '載具狀況圖片',
            },
        };
        return configs[target] || configs.completion;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttribute(value) {
        return escapeHtml(value).replace(/`/g, '&#96;');
    }

    function initFuiParticles() {
        const container = document.getElementById('fui-particles');
        if (!container) {
            return;
        }
        const count = 24;
        for (let index = 0; index < count; index += 1) {
            const particle = document.createElement('span');
            const isGray = Math.random() < 0.3;
            const size = Math.random() > 0.66 ? 3 : 2;
            particle.className = `fui-particle${isGray ? ' fui-particle-gray' : ''}`;
            particle.style.cssText = [
                `left:${Math.random() * 100}vw`,
                `width:${size}px`,
                `height:${size}px`,
                `animation-duration:${12 + Math.random() * 18}s`,
                `animation-delay:${Math.random() * 14}s`,
                `opacity:${0.25 + Math.random() * 0.75}`,
            ].join(';');
            container.appendChild(particle);
        }
    }
})();
