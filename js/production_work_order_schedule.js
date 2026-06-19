(function () {
    'use strict';

    function initializeProductionWorkOrderScheduleModule(container) {
        const moduleRoot = container.querySelector('[data-module="production_work_order_schedule"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        const elements = {
            alert: moduleRoot.querySelector('[data-production-work-order-schedule-alert]'),
            refreshButton: moduleRoot.querySelector('[data-action="refresh-schedule"]'),
            liveTime: moduleRoot.querySelector('[data-schedule-live-time]'),
            tabNav: moduleRoot.querySelector('[data-schedule-tab-nav]'),
            tabPanels: moduleRoot.querySelectorAll('[data-schedule-tab-panel]'),
            machineTabCount: moduleRoot.querySelector('[data-schedule-machine-tab-count]'),
            timeTabCount: moduleRoot.querySelector('[data-schedule-time-tab-count]'),
            statusTabCount: moduleRoot.querySelector('[data-schedule-status-tab-count]'),
            machineFilterForm: moduleRoot.querySelector('[data-schedule-machine-filter]'),
            machineSelect: moduleRoot.querySelector('[data-schedule-machine-select]'),
            queueCount: moduleRoot.querySelector('[data-queue-count]'),
            selectedMachineName: moduleRoot.querySelector('[data-selected-machine-name]'),
            selectedMachineCount: moduleRoot.querySelector('[data-selected-machine-count]'),
            queueBody: moduleRoot.querySelector('[data-schedule-queue-body]'),
            machineBody: moduleRoot.querySelector('[data-schedule-machine-body]'),
            timeBody: moduleRoot.querySelector('[data-schedule-time-body]'),
            statusBody: moduleRoot.querySelector('[data-schedule-status-body]'),
            scheduleModal: moduleRoot.querySelector('[data-schedule-work-order-modal]'),
            scheduleModalTitle: moduleRoot.querySelector('[data-schedule-modal-title]'),
            scheduleModalAlert: moduleRoot.querySelector('[data-schedule-modal-alert]'),
            scheduleModalForm: moduleRoot.querySelector('[data-schedule-work-order-form]'),
            scheduleModalLiveTime: moduleRoot.querySelector('[data-schedule-modal-live-time]'),
            warningModal: moduleRoot.querySelector('[data-schedule-warning-modal]'),
            warningMessage: moduleRoot.querySelector('[data-schedule-warning-message]')
        };

        const state = {
            machines: [],
            workOrders: [],
            draggingId: null,
            currentModalMode: 'view',
            clockTimer: null,
            dataSyncHelper: null,
            activeTab: 'machine',
            selectedMachineId: null,
            conflictOrderIds: new Set(),
            expandedMachineStatusIds: new Set()
        };

        init();

        function init() {
            bindEvents();
            startLiveClock();

            if (typeof DataSync !== 'undefined' && typeof DataSync.createModuleHelper === 'function') {
                state.dataSyncHelper = DataSync.createModuleHelper('production_work_order_schedule', {
                    onRefresh: () => loadBoardData(),
                    onDependencyUpdate: (sourceModule) => {
                        if (sourceModule === 'machines') {
                            loadMachinesOnly()
                                .then(() => {
                                    ensureSelectedMachine();
                                    renderAllViews();
                                })
                                .catch((error) => {
                                    console.error('[production_work_order_schedule] loadMachinesOnly error:', error);
                                });
                            return;
                        }
                        loadBoardData();
                    }
                });
            }

            loadBoardData();
        }

        function bindEvents() {
            if (elements.refreshButton) {
                elements.refreshButton.addEventListener('click', () => loadBoardData());
            }

            if (elements.machineFilterForm) {
                elements.machineFilterForm.addEventListener('submit', (event) => {
                    event.preventDefault();
                });
            }

            if (elements.machineSelect) {
                elements.machineSelect.addEventListener('change', () => {
                    const nextMachineId = parseInt(elements.machineSelect.value || '', 10);
                    state.selectedMachineId = Number.isFinite(nextMachineId) ? nextMachineId : null;
                    renderMachineTab();
                });
            }

            if (elements.scheduleModalForm) {
                elements.scheduleModalForm.addEventListener('submit', handleScheduleSubmit);
                ['scheduled_start_date', 'scheduled_end_date', 'actual_start_date', 'actual_end_date', 'machine_id'].forEach((name) => {
                    const field = elements.scheduleModalForm.querySelector(`[name="${name}"]`);
                    if (field) {
                        field.addEventListener('change', () => {
                            validateModalSchedule(false);
                        });
                    }
                });
            }

            moduleRoot.addEventListener('click', async (event) => {
                const actionElement = event.target.closest('[data-action]');
                if (!actionElement) {
                    return;
                }

                const action = actionElement.dataset.action;

                if (action === 'switch-schedule-tab') {
                    switchTab(actionElement.dataset.tabValue || 'machine');
                    return;
                }

                if (action === 'details') {
                    const statusRow = actionElement.closest('[data-machine-status-row]');
                    if (statusRow) {
                        const machineId = parseInt(statusRow.dataset.machineId || '', 10);
                        if (machineId > 0) {
                            toggleMachineStatusDetails(machineId);
                        }
                        return;
                    }
                }

                if (action === 'prev-machine') {
                    shiftSelectedMachine(-1);
                    return;
                }

                if (action === 'next-machine') {
                    shiftSelectedMachine(1);
                    return;
                }

                if (action === 'view-work-order' || action === 'edit-work-order') {
                    const row = actionElement.closest('[data-work-order-id]');
                    const workOrderId = row ? parseInt(row.dataset.workOrderId || '', 10) : 0;
                    if (!workOrderId) {
                        return;
                    }

                    await openScheduleModal(workOrderId, action === 'edit-work-order' ? 'edit' : 'view', row?.dataset.nodeKey || '');
                    return;
                }

                if (action === 'remove-from-machine-schedule') {
                    const row = actionElement.closest('[data-work-order-id]');
                    const nodeKey = row?.dataset.nodeKey || '';
                    if (!nodeKey) {
                        return;
                    }

                    await removeFromMachineSchedule(nodeKey);
                    return;
                }

                if (action === 'goto-work-order') {
                    const row = actionElement.closest('[data-work-order-id]');
                    const workOrderId = row ? parseInt(row.dataset.workOrderId || '', 10) : 0;
                    if (!workOrderId) {
                        return;
                    }

                    openWorkOrderPage(workOrderId);
                    return;
                }

                if (action === 'close-schedule-modal') {
                    closeScheduleModal();
                    return;
                }

                if (action === 'close-warning-modal') {
                    closeWarningModal();
                }
            });

            moduleRoot.addEventListener('dragstart', handleDragStart);
            moduleRoot.addEventListener('dragover', handleDragOver);
            moduleRoot.addEventListener('drop', handleDrop);
            moduleRoot.addEventListener('dragend', handleDragEnd);
        }

        async function loadBoardData() {
            showAlert('info', '正在載入排程資料...');
            try {
                await Promise.all([loadMachinesOnly(), loadWorkOrdersOnly()]);
                ensureSelectedMachine();
                renderAllViews();
                hideAlert();
            } catch (error) {
                console.error('[production_work_order_schedule] loadBoardData error:', error);
                showAlert('error', '載入排程資料失敗，請稍後再試。');
            }
        }

        async function loadMachinesOnly() {
            state.machines = await fetchAllMachines();

            applyMachineOptions(elements.machineSelect, '-- 請選擇機台 --');
            if (elements.scheduleModalForm) {
                const machineSelect = elements.scheduleModalForm.querySelector('[name="machine_id"]');
                applyMachineOptions(machineSelect, '-- 未排機台 --');
            }
        }

        async function fetchAllMachines() {
            const perPage = 100;
            let page = 1;
            let totalPages = 1;
            const machines = [];

            while (page <= totalPages) {
                const params = new URLSearchParams({
                    page: String(page),
                    perPage: String(perPage)
                });

                const response = await fetch(`api/machines/index.php?${params.toString()}`, { credentials: 'include' });
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || '載入機台資料失敗。');
                }

                const rows = Array.isArray(result.data) ? result.data : [];
                machines.push(...rows);

                const pageCount = parseInt(result.pagination && result.pagination.totalPages ? result.pagination.totalPages : '1', 10);
                totalPages = Number.isFinite(pageCount) && pageCount > 0 ? pageCount : 1;
                page += 1;
            }

            const deduped = new Map();
            machines.forEach((machine) => {
                const machineId = parseInt(machine && machine.id ? machine.id : '', 10);
                if (machineId > 0) {
                    deduped.set(machineId, machine);
                }
            });

            return Array.from(deduped.values()).sort((a, b) => {
                const codeA = String(a.machine_number || '');
                const codeB = String(b.machine_number || '');
                const codeCompare = codeA.localeCompare(codeB, 'zh-Hant');
                if (codeCompare !== 0) {
                    return codeCompare;
                }

                return String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hant');
            });
        }

        function formatMachineLabel(machine) {
            const code = String(machine && machine.machine_number ? machine.machine_number : '').trim();
            const name = String(machine && machine.name ? machine.name : '').trim();
            if (code && name) {
                return `${code} - ${name}`;
            }
            if (code) {
                return code;
            }
            if (name) {
                return name;
            }
            return `機台 #${machine && machine.id ? machine.id : '-'}`;
        }

        function applyMachineOptions(selectElement, emptyLabel) {
            if (!selectElement) {
                return;
            }

            const currentValue = selectElement.value || '';
            selectElement.innerHTML = '';

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = emptyLabel;
            selectElement.appendChild(defaultOption);

            state.machines.forEach((machine) => {
                const option = document.createElement('option');
                option.value = String(machine.id);
                option.textContent = formatMachineLabel(machine);
                selectElement.appendChild(option);
            });

            if (currentValue && selectElement.querySelector(`option[value="${currentValue}"]`)) {
                selectElement.value = currentValue;
            }
        }

        async function loadWorkOrdersOnly() {
            const response = await fetch('api/work_orders/schedule_nodes.php', { credentials: 'include' });
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || '載入排程節點失敗。');
            }

            const rows = Array.isArray(result.data) ? result.data : [];
            state.workOrders = rows.filter((row) => !isCompleted(row)).map((row) => ({
                ...row,
                id: row.node_key || row.id,
                node_key: row.node_key || `wo:${row.work_order_id || row.id}`,
                work_order_id: row.work_order_id ? parseInt(row.work_order_id, 10) : parseInt(row.id, 10),
                node_id: row.node_id ? parseInt(row.node_id, 10) : null,
                machine_run_id: row.machine_run_id ? parseInt(row.machine_run_id, 10) : null,
                machine_id: row.machine_id ? parseInt(row.machine_id, 10) : null,
                machine_sequence: row.machine_sequence ? parseInt(row.machine_sequence, 10) : null
            }));
            assignInitialRanks();
        }

        function assignInitialRanks() {
            const queueOrders = state.workOrders
                .filter((order) => !order.machine_id)
                .sort(compareByStoredSequence);

            queueOrders.forEach((order, index) => {
                order.queue_rank = index + 1;
                order.machine_sequence = order.queue_rank;
            });

            const groupedByMachine = new Map();
            state.workOrders.forEach((order) => {
                if (!order.machine_id) {
                    return;
                }
                const machineId = parseInt(order.machine_id, 10);
                if (!groupedByMachine.has(machineId)) {
                    groupedByMachine.set(machineId, []);
                }
                groupedByMachine.get(machineId).push(order);
            });

            groupedByMachine.forEach((orders) => {
                orders.sort(compareByStoredSequence).forEach((order, index) => {
                    order.machine_rank = index + 1;
                    order.machine_sequence = order.machine_rank;
                });
            });
        }

        function ensureSelectedMachine() {
            if (state.selectedMachineId && state.machines.some((machine) => parseInt(machine.id, 10) === state.selectedMachineId)) {
                if (elements.machineSelect) {
                    elements.machineSelect.value = String(state.selectedMachineId);
                }
                return;
            }

            if (!state.machines.length) {
                state.selectedMachineId = null;
                if (elements.machineSelect) {
                    elements.machineSelect.value = '';
                }
                return;
            }

            state.selectedMachineId = parseInt(state.machines[0].id, 10);
            if (elements.machineSelect) {
                elements.machineSelect.value = String(state.selectedMachineId);
            }
        }

        function renderAllViews() {
            renderMachineTab();
            renderTimeTab();
            renderStatusTab();
        }

        function switchTab(tabValue) {
            const targetTab = tabValue === 'time'
                ? 'time'
                : (tabValue === 'status' ? 'status' : 'machine');
            state.activeTab = targetTab;

            if (elements.tabNav) {
                elements.tabNav.querySelectorAll('.sidebar-tab-btn').forEach((button) => {
                    button.classList.toggle('active', button.dataset.tabValue === targetTab);
                });
            }

            elements.tabPanels.forEach((panel) => {
                const panelValue = panel.dataset.scheduleTabPanel || '';
                panel.classList.toggle('hidden', panelValue !== targetTab);
            });

            if (targetTab === 'time') {
                renderTimeTab();
                return;
            }

            if (targetTab === 'status') {
                renderStatusTab();
            }
        }

        function shiftSelectedMachine(step) {
            if (!state.machines.length) {
                return;
            }

            const sortedMachineIds = state.machines
                .slice()
                .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hant'))
                .map((machine) => parseInt(machine.id, 10));

            const currentIndex = sortedMachineIds.indexOf(state.selectedMachineId);
            const fallbackIndex = currentIndex >= 0 ? currentIndex : 0;
            let nextIndex = fallbackIndex + step;

            if (nextIndex < 0) {
                nextIndex = sortedMachineIds.length - 1;
            }
            if (nextIndex >= sortedMachineIds.length) {
                nextIndex = 0;
            }

            state.selectedMachineId = sortedMachineIds[nextIndex];
            if (elements.machineSelect) {
                elements.machineSelect.value = String(state.selectedMachineId);
            }
            renderMachineTab();
        }

        function renderMachineTab() {
            if (!elements.queueBody || !elements.machineBody) {
                return;
            }

            const queueOrders = state.workOrders
                .filter((order) => !order.machine_id)
                .sort((a, b) => compareByRank(a, b, 'queue_rank'));

            const selectedMachineOrders = state.selectedMachineId
                ? state.workOrders
                    .filter((order) => parseInt(order.machine_id || 0, 10) === state.selectedMachineId)
                    .sort((a, b) => compareByRank(a, b, 'machine_rank'))
                : [];

            renderScheduleRows(elements.queueBody, queueOrders, null, '目前沒有待排程工單。');
            renderScheduleRows(
                elements.machineBody,
                selectedMachineOrders,
                state.selectedMachineId,
                state.selectedMachineId ? '此機台目前無排程工單。' : '請先選擇機台。'
            );

            if (elements.queueCount) {
                elements.queueCount.textContent = String(queueOrders.length);
            }

            const selectedMachineName = resolveMachineName(state.selectedMachineId) || '-- 請選擇機台 --';
            if (elements.selectedMachineName) {
                elements.selectedMachineName.textContent = selectedMachineName;
            }
            if (elements.selectedMachineCount) {
                elements.selectedMachineCount.textContent = String(selectedMachineOrders.length);
            }

            if (elements.machineTabCount) {
                const totalCount = queueOrders.length + selectedMachineOrders.length;
                elements.machineTabCount.dataset.count = String(totalCount);
                elements.machineTabCount.textContent = String(totalCount);
            }

            validateBoardConflicts(false);
        }

        function renderScheduleRows(tbody, orders, machineId, emptyText) {
            if (!tbody) {
                return;
            }

            const listType = tbody.dataset.scheduleListType === 'queue' ? 'queue' : 'machine';
            const columnCount = listType === 'queue' ? 3 : 6;

            tbody.innerHTML = '';
            tbody.dataset.machineId = machineId ? String(machineId) : '';

            if (!orders.length) {
                const row = document.createElement('tr');
                row.className = 'schedule-empty-row';
                row.innerHTML = `<td colspan="${columnCount}" class="schedule-empty">${escapeHtmlSafe(emptyText)}</td>`;
                tbody.appendChild(row);
                return;
            }

            orders.forEach((order, index) => {
                const row = listType === 'queue'
                    ? createQueueScheduleRow(order, index + 1)
                    : createScheduleRow(order, index + 1);
                tbody.appendChild(row);
            });

            applyConflictMarks();
        }

        function createScheduleRow(order, sequence) {
            const row = document.createElement('tr');
            row.className = `schedule-row${isSplitWorkOrder(order) ? ' schedule-row-split' : ''}`;
            row.draggable = true;
            row.dataset.workOrderId = String(order.work_order_id || order.id);
            row.dataset.nodeKey = String(order.node_key || order.id);

            const statusText = escapeHtmlSafe(order.status_label || '未設定');
            const scheduledText = `${formatDateTime(order.scheduled_start_date)} ~ ${formatDateTime(order.scheduled_end_date)}`;

            row.innerHTML = `
                <td class="schedule-sequence">${sequence}</td>
                <td>${renderScheduleWorkOrderLabel(order)}</td>
                <td>${escapeHtmlSafe(order.customer_name || '-')}</td>
                <td>${scheduledText}</td>
                <td><span class="schedule-status-chip">${statusText}</span></td>
                <td class="table-actions">
                    <button type="button" class="btn text" data-action="view-work-order" title="檢視" aria-label="檢視">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn text" data-action="edit-work-order" title="編輯" aria-label="編輯">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn text" data-action="remove-from-machine-schedule" title="移回待排程" aria-label="移回待排程">
                        <i class="fas fa-reply"></i>
                    </button>
                    <button type="button" class="btn text" data-action="goto-work-order" title="前往工單" aria-label="前往工單">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                </td>
            `;

            return row;
        }

        function createQueueScheduleRow(order, sequence) {
            const row = document.createElement('tr');
            row.className = `schedule-row schedule-queue-row${isSplitWorkOrder(order) ? ' schedule-row-split' : ''}`;
            row.draggable = true;
            row.dataset.workOrderId = String(order.work_order_id || order.id);
            row.dataset.nodeKey = String(order.node_key || order.id);

            const workOrderNumber = escapeHtmlSafe(order.work_order_number || `#${order.id}`);
            const tooltipText = escapeHtmlSafe(buildWorkOrderTooltip(order)).replace(/\n/g, '&#10;');

            row.innerHTML = `
                <td class="schedule-sequence">${sequence}</td>
                <td>
                    <span class="schedule-work-order-code" tabindex="0" title="${tooltipText}">${workOrderNumber}</span>
                    ${renderSplitBadge(order)}
                </td>
                <td class="table-actions">
                    <button type="button" class="btn text" data-action="view-work-order" title="檢視" aria-label="檢視">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn text" data-action="edit-work-order" title="編輯" aria-label="編輯">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn text" data-action="goto-work-order" title="前往工單" aria-label="前往工單">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                </td>
            `;

            return row;
        }

        function buildWorkOrderTooltip(order) {
            const machineName = resolveMachineName(order.machine_id) || '未排機台';
            const scheduledText = `${formatDateTime(order.scheduled_start_date)} ~ ${formatDateTime(order.scheduled_end_date)}`;
            const statusText = order.status_label || '未設定';

            return [
                `工單號碼：${order.work_order_number || `#${order.id}`}`,
                `訂單號碼：${order.order_number || '-'}`,
                `客戶名稱：${order.customer_name || '-'}`,
                `機台：${machineName}`,
                `預定時段：${scheduledText}`,
                `狀態：${statusText}`
            ].join('\n');
        }

        function openWorkOrderPage(workOrderId) {
            if (typeof window.openTab !== 'function') {
                showAlert('error', '無法切換到生產工單頁面。');
                return;
            }

            window.openTab('work_orders', '生產工單', 'modules/work_orders.html');

            const startedAt = Date.now();
            const timer = window.setInterval(() => {
                if (window.workOrdersModule && typeof window.workOrdersModule.viewDetail === 'function') {
                    window.clearInterval(timer);
                    window.workOrdersModule.viewDetail(workOrderId);
                    return;
                }

                if (Date.now() - startedAt > 5000) {
                    window.clearInterval(timer);
                }
            }, 120);
        }

        function renderTimeTab() {
            if (!elements.timeBody) {
                return;
            }

            const now = new Date();
            const runningOrders = state.workOrders
                .filter((order) => isNowInProduction(order, now))
                .sort((a, b) => {
                    const machineCompare = String(resolveMachineName(a.machine_id)).localeCompare(String(resolveMachineName(b.machine_id)), 'zh-Hant');
                    if (machineCompare !== 0) {
                        return machineCompare;
                    }
                    return compareByScheduledStart(a, b);
                });

            if (elements.timeTabCount) {
                elements.timeTabCount.dataset.count = String(runningOrders.length);
                elements.timeTabCount.textContent = String(runningOrders.length);
            }

            elements.timeBody.innerHTML = '';
            if (!runningOrders.length) {
                const row = document.createElement('tr');
                row.className = 'schedule-empty-row';
                row.innerHTML = '<td colspan="6" class="schedule-empty">目前沒有正在生產中的工單。</td>';
                elements.timeBody.appendChild(row);
                return;
            }

            runningOrders.forEach((order) => {
                const row = document.createElement('tr');
                row.dataset.workOrderId = String(order.work_order_id || order.id);
                row.dataset.nodeKey = String(order.node_key || order.id);
                row.className = `schedule-time-row${isSplitWorkOrder(order) ? ' schedule-row-split' : ''}`;

                const windowText = `${formatDateTime(resolveProductionStart(order))} ~ ${formatDateTime(resolveProductionEnd(order))}`;
                row.innerHTML = `
                    <td>${escapeHtmlSafe(resolveMachineName(order.machine_id) || '-')}</td>
                    <td>${renderScheduleWorkOrderLabel(order)}</td>
                    <td>${escapeHtmlSafe(order.customer_name || '-')}</td>
                    <td>${windowText}</td>
                    <td>${escapeHtmlSafe(getRemainingText(order, now))}</td>
                    <td class="table-actions">
                        <button type="button" class="btn text" data-action="view-work-order" title="檢視" aria-label="檢視">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn text" data-action="edit-work-order" title="編輯" aria-label="編輯">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn text" data-action="goto-work-order" title="前往工單" aria-label="前往工單">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                    </td>
                `;

                elements.timeBody.appendChild(row);
            });

            applyConflictMarks();
        }

        function toggleMachineStatusDetails(machineId) {
            if (state.expandedMachineStatusIds.has(machineId)) {
                state.expandedMachineStatusIds.delete(machineId);
            } else {
                state.expandedMachineStatusIds.add(machineId);
            }
            renderStatusTab();
        }

        function renderStatusTab() {
            if (!elements.statusBody) {
                return;
            }

            const machines = state.machines.slice().sort((a, b) => {
                const codeA = String(a.machine_number || '');
                const codeB = String(b.machine_number || '');
                const codeCompare = codeA.localeCompare(codeB, 'zh-Hant');
                if (codeCompare !== 0) {
                    return codeCompare;
                }
                return String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hant');
            });

            if (elements.statusTabCount) {
                elements.statusTabCount.textContent = String(machines.length);
                elements.statusTabCount.dataset.count = String(machines.length);
            }

            elements.statusBody.innerHTML = '';

            if (!machines.length) {
                const emptyRow = document.createElement('tr');
                emptyRow.className = 'schedule-empty-row';
                emptyRow.innerHTML = '<td colspan="5" class="schedule-empty">目前沒有可用機台。</td>';
                elements.statusBody.appendChild(emptyRow);
                return;
            }

            machines.forEach((machine) => {
                const machineId = parseInt(machine.id, 10);
                if (!machineId) {
                    return;
                }

                const queueOrders = state.workOrders
                    .filter((order) => parseInt(order.machine_id || 0, 10) === machineId)
                    .sort((a, b) => compareByRank(a, b, 'machine_rank'));
                const firstOrder = queueOrders[0] || null;
                const isExpanded = state.expandedMachineStatusIds.has(machineId);
                const detailsTitle = isExpanded ? '收合細項' : '展開細項';

                const summaryRow = document.createElement('tr');
                summaryRow.dataset.machineStatusRow = 'true';
                summaryRow.dataset.machineId = String(machineId);
                summaryRow.innerHTML = `
                    <td>${escapeHtmlSafe(formatMachineLabel(machine))}</td>
                    <td>${queueOrders.length}</td>
                    <td>${firstOrder ? renderScheduleWorkOrderLabel(firstOrder) : '-'}</td>
                    <td>${firstOrder ? formatDateTime(firstOrder.scheduled_start_date) : '-'}</td>
                    <td class="table-actions">
                        <button type="button" class="btn text" data-action="details" title="${detailsTitle}" aria-label="${detailsTitle}">
                            <i class="fas ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i>
                        </button>
                    </td>
                `;
                elements.statusBody.appendChild(summaryRow);

                if (!isExpanded) {
                    return;
                }

                const detailsRow = document.createElement('tr');
                detailsRow.className = 'machine-status-detail-row';
                detailsRow.innerHTML = `
                    <td colspan="5">
                        ${renderMachineQueueDetailsHtml(queueOrders)}
                    </td>
                `;
                elements.statusBody.appendChild(detailsRow);
            });
        }

        function renderMachineQueueDetailsHtml(queueOrders) {
            if (!Array.isArray(queueOrders) || queueOrders.length === 0) {
                return '<div class="machine-status-detail-empty">此機台目前沒有排程工單。</div>';
            }

            const rowsHtml = queueOrders.map((order, index) => {
                const scheduledText = `${formatDateTime(order.scheduled_start_date)} ~ ${formatDateTime(order.scheduled_end_date)}`;
                const statusText = escapeHtmlSafe(order.status_label || '未設定');
                const rowClass = isSplitWorkOrder(order) ? ' class="schedule-row-split"' : '';
                const workOrderId = escapeHtmlSafe(String(order.work_order_id || order.id || ''));
                const nodeKey = escapeHtmlSafe(String(order.node_key || order.id || ''));
                return `
                    <tr${rowClass} data-work-order-id="${workOrderId}" data-node-key="${nodeKey}">
                        <td>${index + 1}</td>
                        <td>${renderScheduleWorkOrderLabel(order)}</td>
                        <td>${escapeHtmlSafe(order.customer_name || '-')}</td>
                        <td>${scheduledText}</td>
                        <td><span class="schedule-status-chip">${statusText}</span></td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="machine-status-detail-wrap">
                    <table class="data-table compact machine-status-detail-table">
                        <thead>
                            <tr>
                                <th class="col-50">順序</th>
                                <th>工單號碼</th>
                                <th>客戶名稱</th>
                                <th>預定時段</th>
                                <th class="col-120">狀態</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            `;
        }

        function isSplitWorkOrder(order) {
            return String(order.work_order_type || '').toLowerCase() === 'split'
                || (parseInt(order.machine_run_count || 0, 10) > 1);
        }

        function renderSplitBadge(order) {
            if (!isSplitWorkOrder(order)) {
                return '';
            }
            const totalCount = parseInt(order.machine_run_count || 0, 10);
            const scheduledCount = parseInt(order.scheduled_machine_run_count || 0, 10);
            const countText = totalCount > 0
                ? ` ${scheduledCount}/${totalCount}台`
                : '';
            const title = totalCount > 0
                ? `拆分工單：已排程 ${scheduledCount} 台 / 共 ${totalCount} 台`
                : '拆分工單';
            return `<span class="schedule-split-badge" title="${escapeHtmlSafe(title)}">${escapeHtmlSafe(`拆分工單${countText}`)}</span>`;
        }

        function renderScheduleWorkOrderLabel(order) {
            const runLabel = order.node_type === 'machine_run' && order.run_label
                ? `<small class="schedule-run-label">${escapeHtmlSafe(order.run_label)}</small>`
                : '';
            return `<span class="schedule-work-order-label">${escapeHtmlSafe(order.work_order_number || `#${order.work_order_id || order.id}`)}</span>${renderSplitBadge(order)}${runLabel}`;
        }

        function handleDragStart(event) {
            const row = event.target.closest('tr.schedule-row');
            const list = row ? row.closest('tbody[data-schedule-list-type]') : null;
            if (!row || !list) {
                return;
            }

            state.draggingId = row.dataset.nodeKey || row.dataset.workOrderId || '';
            row.classList.add('dragging');
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', String(state.draggingId));
            }
        }

        function handleDragOver(event) {
            const list = event.target.closest('tbody[data-schedule-list-type]');
            const draggingRow = moduleRoot.querySelector('tr.schedule-row.dragging');
            if (!list || !draggingRow) {
                return;
            }

            event.preventDefault();
            const afterElement = getDragAfterRow(list, event.clientY);
            if (!afterElement) {
                list.appendChild(draggingRow);
            } else {
                list.insertBefore(draggingRow, afterElement);
            }
        }

        async function handleDrop(event) {
            const list = event.target.closest('tbody[data-schedule-list-type]');
            if (!list || !state.draggingId) {
                return;
            }

            event.preventDefault();

            if (list.dataset.scheduleListType === 'machine' && !state.selectedMachineId) {
                showAlert('warning', '請先選擇機台，再將工單拖入機台排程。');
                return;
            }

            const draggedOrder = getOrderById(state.draggingId);
            if (!draggedOrder) {
                return;
            }

            const oldMachineId = draggedOrder.machine_id ? parseInt(draggedOrder.machine_id, 10) : null;
            syncWorkOrdersFromDom();

            const changedOrder = getOrderById(state.draggingId);
            const newMachineId = changedOrder && changedOrder.machine_id ? parseInt(changedOrder.machine_id, 10) : null;

            const issues = validateBoardConflicts(true);
            if (issues.length > 0) {
                showWarningModal(issues);
            }

            await persistScheduleSequences(state.draggingId, oldMachineId, newMachineId);

            renderMachineTab();
            if (state.activeTab === 'time') {
                renderTimeTab();
            }
        }

        function handleDragEnd() {
            state.draggingId = null;
            moduleRoot.querySelectorAll('tr.schedule-row.dragging').forEach((row) => {
                row.classList.remove('dragging');
            });
        }

        function syncWorkOrdersFromDom() {
            if (elements.queueBody) {
                elements.queueBody.querySelectorAll('tr.schedule-row[data-node-key]').forEach((row, index) => {
                    const order = getOrderById(row.dataset.nodeKey || '');
                    if (order) {
                        order.machine_id = null;
                        order.queue_rank = index + 1;
                        order.machine_rank = null;
                        order.machine_sequence = order.queue_rank;
                    }
                });
            }

            if (elements.machineBody && state.selectedMachineId) {
                elements.machineBody.querySelectorAll('tr.schedule-row[data-node-key]').forEach((row, index) => {
                    const order = getOrderById(row.dataset.nodeKey || '');
                    if (order) {
                        order.machine_id = state.selectedMachineId;
                        order.machine_rank = index + 1;
                        order.machine_sequence = order.machine_rank;
                    }
                });
            }
        }

        async function persistScheduleSequences(changedWorkOrderId, oldMachineId, newMachineId, successMessage) {
            const targets = collectOrdersForPersist(changedWorkOrderId, oldMachineId, newMachineId);
            if (!targets.length) {
                return;
            }

            try {
                for (const order of targets) {
                    const payload = {
                        machine_id: order.machine_id || '',
                        machine_sequence: order.machine_sequence || ''
                    };

                    const response = await fetch('api/work_orders/schedule_nodes.php', {
                        method: 'PUT',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            ...payload,
                            node_key: order.node_key || order.id,
                            scheduled_start_date: order.scheduled_start_date || '',
                            scheduled_end_date: order.scheduled_end_date || '',
                            actual_start_date: order.actual_start_date || '',
                            actual_end_date: order.actual_end_date || ''
                        })
                    });
                    const result = await response.json();
                    if (!result.success) {
                        throw new Error(result.message || `更新工單 ${order.work_order_number || order.id} 排程失敗。`);
                    }
                }

                if (typeof DataSync !== 'undefined' && typeof DataSync.notifyWithDependencies === 'function') {
                    const changedIds = targets.map((order) => order.work_order_id || order.id);
                    DataSync.notifyWithDependencies('work_orders', DataSync.EVENT_TYPES.BULK_UPDATED, { ids: changedIds });
                }
                if (state.dataSyncHelper && typeof state.dataSyncHelper.notifyBulkUpdated === 'function') {
                    state.dataSyncHelper.notifyBulkUpdated({ ids: targets.map((order) => order.node_key || order.id) });
                }

                showAlert('success', successMessage || '排程順序已儲存。');
            } catch (error) {
                console.error('[production_work_order_schedule] persistScheduleSequences error:', error);
                showAlert('error', `排程儲存失敗：${error.message}`);
                await loadBoardData();
            }
        }

        function collectOrdersForPersist(changedWorkOrderId, oldMachineId, newMachineId) {
            const changedOrder = getOrderById(changedWorkOrderId);
            if (!changedOrder) {
                return [];
            }

            const targetMachineIds = new Set();
            const normalizedOldMachineId = oldMachineId ? parseInt(oldMachineId, 10) : null;
            const normalizedNewMachineId = newMachineId ? parseInt(newMachineId, 10) : null;

            if (normalizedOldMachineId) {
                targetMachineIds.add(normalizedOldMachineId);
            }
            if (normalizedNewMachineId) {
                targetMachineIds.add(normalizedNewMachineId);
            }

            const result = [];
            const seenIds = new Set();

            state.workOrders.forEach((order) => {
                const orderId = String(order.node_key || order.id);
                if (seenIds.has(orderId)) {
                    return;
                }

                const orderMachineId = order.machine_id ? parseInt(order.machine_id, 10) : null;
                const affectsQueue = !orderMachineId && (!normalizedOldMachineId || !normalizedNewMachineId || normalizedOldMachineId !== normalizedNewMachineId);
                const affectsMachine = orderMachineId && targetMachineIds.has(orderMachineId);
                const isChangedOrder = orderId === String(changedWorkOrderId);

                if (affectsQueue || affectsMachine || isChangedOrder) {
                    seenIds.add(orderId);
                    result.push(order);
                }
            });

            return result;
        }

        async function openScheduleModal(workOrderId, mode, nodeKey = '') {
            try {
                const response = await fetch(`api/work_orders/show.php?id=${workOrderId}`, { credentials: 'include' });
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || '載入工單資料失敗。');
                }

                const node = nodeKey ? getOrderById(nodeKey) : null;
                fillScheduleModal(result.data, node);
                setScheduleModalMode(mode);
                elements.scheduleModal.classList.remove('hidden');
                clearModalAlert();
                validateModalSchedule(false);
            } catch (error) {
                console.error('[production_work_order_schedule] openScheduleModal error:', error);
                showAlert('error', `無法開啟工單：${error.message}`);
            }
        }

        function closeScheduleModal() {
            if (elements.scheduleModal) {
                elements.scheduleModal.classList.add('hidden');
            }
            clearModalAlert();
            clearModalFieldConflict();
        }

        function setScheduleModalMode(mode) {
            state.currentModalMode = mode === 'edit' ? 'edit' : 'view';
            if (!elements.scheduleModalForm || !elements.scheduleModalTitle) {
                return;
            }

            const isEdit = state.currentModalMode === 'edit';
            elements.scheduleModalTitle.textContent = isEdit ? '工單排程編輯' : '工單排程檢視';

            const editableFields = ['machine_id', 'scheduled_start_date', 'scheduled_end_date', 'actual_start_date', 'actual_end_date'];
            elements.scheduleModalForm.querySelectorAll('input, select, textarea').forEach((field) => {
                const name = field.getAttribute('name');
                if (!name) {
                    return;
                }
                if (editableFields.includes(name)) {
                    field.disabled = !isEdit;
                } else {
                    field.disabled = true;
                }
            });

            const saveButton = elements.scheduleModalForm.querySelector('[data-action="save-schedule"]');
            if (saveButton) {
                saveButton.classList.toggle('hidden', !isEdit);
            }
        }

        function fillScheduleModal(data, node = null) {
            if (!elements.scheduleModalForm) {
                return;
            }

            setFieldValue('id', data.id || '');
            setFieldValue('node_key', node?.node_key || `wo:${data.id || ''}`);
            setFieldValue('work_order_number', data.work_order_number || '');
            setFieldValue('customer_name', data.customer_name || '');
            setFieldValue('order_number', data.order_number || '');
            setFieldValue('machine_id', node?.machine_id || data.machine_id || '');
            setFieldValue('scheduled_start_date', toDateTimeLocalValue(node?.scheduled_start_date || data.scheduled_start_date));
            setFieldValue('scheduled_end_date', toDateTimeLocalValue(node?.scheduled_end_date || data.scheduled_end_date));
            setFieldValue('actual_start_date', toDateTimeLocalValue(node?.actual_start_date || data.actual_start_date));
            setFieldValue('actual_end_date', toDateTimeLocalValue(node?.actual_end_date || data.actual_end_date));
        }

        function setFieldValue(name, value) {
            if (!elements.scheduleModalForm) {
                return;
            }
            const field = elements.scheduleModalForm.querySelector(`[name="${name}"]`);
            if (field) {
                field.value = value ?? '';
            }
        }

        async function handleScheduleSubmit(event) {
            event.preventDefault();
            if (state.currentModalMode !== 'edit' || !elements.scheduleModalForm) {
                return;
            }

            const validation = validateModalSchedule(true);
            if (!validation.valid) {
                return;
            }

            const id = parseInt(elements.scheduleModalForm.querySelector('[name="id"]').value || '', 10);
            if (!id) {
                showModalAlert('error', '工單資料不完整，無法儲存。');
                return;
            }

            const nodeKey = elements.scheduleModalForm.querySelector('[name="node_key"]')?.value || `wo:${id}`;
            const payload = {
                node_key: nodeKey,
                machine_id: elements.scheduleModalForm.querySelector('[name="machine_id"]').value || '',
                scheduled_start_date: elements.scheduleModalForm.querySelector('[name="scheduled_start_date"]').value || '',
                scheduled_end_date: elements.scheduleModalForm.querySelector('[name="scheduled_end_date"]').value || '',
                actual_start_date: elements.scheduleModalForm.querySelector('[name="actual_start_date"]').value || '',
                actual_end_date: elements.scheduleModalForm.querySelector('[name="actual_end_date"]').value || ''
            };

            try {
                const response = await fetch('api/work_orders/schedule_nodes.php', {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || '儲存排程失敗。');
                }

                if (typeof DataSync !== 'undefined' && typeof DataSync.notifyWithDependencies === 'function') {
                    DataSync.notifyWithDependencies('work_orders', DataSync.EVENT_TYPES.UPDATED, { id });
                }
                if (state.dataSyncHelper && typeof state.dataSyncHelper.notifyUpdated === 'function') {
                    state.dataSyncHelper.notifyUpdated({ id });
                }

                closeScheduleModal();
                await loadBoardData();
                showAlert('success', '排程已更新。');
            } catch (error) {
                console.error('[production_work_order_schedule] handleScheduleSubmit error:', error);
                showModalAlert('error', `儲存失敗：${error.message}`);
            }
        }

        async function removeFromMachineSchedule(nodeKey) {
            const order = getOrderById(nodeKey);
            if (!order) {
                showAlert('error', '找不到工單資料，請重新整理後再試。');
                return;
            }

            const oldMachineId = order.machine_id ? parseInt(order.machine_id, 10) : null;
            if (!oldMachineId) {
                showAlert('warning', '此工單目前未指定機台。');
                return;
            }

            const workOrderNumber = order.work_order_number
                ? order.work_order_number
                : `#${order.work_order_id || order.id || nodeKey}`;

            if (!window.confirm(`確定將工單 ${workOrderNumber} 從機台排程移除，並回到待排程清單嗎？`)) {
                return;
            }

            try {
                const maxQueueRank = state.workOrders.reduce((maxRank, item) => {
                    if (String(item.node_key || item.id) === String(nodeKey)) {
                        return maxRank;
                    }
                    const itemMachineId = item.machine_id ? parseInt(item.machine_id, 10) : null;
                    if (itemMachineId) {
                        return maxRank;
                    }
                    const rank = Number.isFinite(parseInt(item.queue_rank, 10)) ? parseInt(item.queue_rank, 10) : 0;
                    return Math.max(maxRank, rank);
                }, 0);

                order.machine_id = null;
                order.machine_rank = null;
                order.queue_rank = maxQueueRank + 1;
                order.machine_sequence = order.queue_rank;

                await persistScheduleSequences(
                    nodeKey,
                    oldMachineId,
                    null,
                    `工單 ${workOrderNumber} 已移回待排程。`
                );

                if (state.activeTab === 'time') {
                    renderTimeTab();
                }
            } catch (error) {
                console.error('[production_work_order_schedule] removeFromMachineSchedule error:', error);
                showAlert('error', `移除機台排程失敗：${error.message}`);
                await loadBoardData();
            }
        }

        function validateModalSchedule(showWarning) {
            if (!elements.scheduleModalForm) {
                return { valid: true, issues: [] };
            }

            clearModalFieldConflict();
            clearModalAlert();

            const machineId = parseInt(elements.scheduleModalForm.querySelector('[name="machine_id"]').value || '', 10) || null;
            const workOrderId = parseInt(elements.scheduleModalForm.querySelector('[name="id"]').value || '', 10) || 0;
            const currentNodeKey = elements.scheduleModalForm.querySelector('[name="node_key"]')?.value || `wo:${workOrderId}`;
            const scheduledStartRaw = elements.scheduleModalForm.querySelector('[name="scheduled_start_date"]').value || '';
            const scheduledEndRaw = elements.scheduleModalForm.querySelector('[name="scheduled_end_date"]').value || '';
            const actualStartRaw = elements.scheduleModalForm.querySelector('[name="actual_start_date"]').value || '';
            const actualEndRaw = elements.scheduleModalForm.querySelector('[name="actual_end_date"]').value || '';

            const scheduledStart = parseDateTime(scheduledStartRaw);
            const scheduledEnd = parseDateTime(scheduledEndRaw);
            const actualStart = parseDateTime(actualStartRaw);
            const actualEnd = parseDateTime(actualEndRaw);

            const issues = [];

            if (scheduledStart && scheduledEnd && scheduledEnd <= scheduledStart) {
                markFieldConflict(['scheduled_start_date', 'scheduled_end_date']);
                issues.push('預定結束日期需晚於預定開始日期。');
            }

            if (actualStart && actualEnd && actualEnd <= actualStart) {
                markFieldConflict(['actual_start_date', 'actual_end_date']);
                issues.push('實際結束日期需晚於實際開始日期。');
            }

            if (machineId && scheduledStart && scheduledEnd && scheduledEnd > scheduledStart) {
                const overlapOrder = state.workOrders.find((order) => {
                    if (String(order.node_key || order.id) === String(currentNodeKey)) {
                        return false;
                    }
                    if ((parseInt(order.machine_id || 0, 10) || null) !== machineId) {
                        return false;
                    }

                    const otherStart = parseDateTime(order.scheduled_start_date);
                    const otherEnd = parseDateTime(order.scheduled_end_date);
                    if (!otherStart || !otherEnd) {
                        return false;
                    }
                    return scheduledStart < otherEnd && scheduledEnd > otherStart;
                });

                if (overlapOrder) {
                    markFieldConflict(['scheduled_start_date', 'scheduled_end_date']);
                    issues.push(`與工單 ${overlapOrder.work_order_number || overlapOrder.id} 的預定時段重疊。`);
                }
            }

            if (issues.length > 0) {
                if (showWarning) {
                    showModalAlert('warning', issues.join(' '));
                    showWarningModal(issues);
                }
                return { valid: false, issues };
            }

            return { valid: true, issues: [] };
        }

        function validateBoardConflicts(shouldMark) {
            const issues = [];
            const conflictIds = new Set();

            const groupedByMachine = new Map();
            state.workOrders.forEach((order) => {
                const machineId = parseInt(order.machine_id || 0, 10);
                if (!machineId) {
                    return;
                }
                if (!groupedByMachine.has(machineId)) {
                    groupedByMachine.set(machineId, []);
                }
                groupedByMachine.get(machineId).push(order);
            });

            groupedByMachine.forEach((orders, machineId) => {
                const sortedOrders = orders.slice().sort(compareByScheduledStart);
                let previousOrder = null;

                sortedOrders.forEach((order) => {
                    const start = parseDateTime(order.scheduled_start_date);
                    const end = parseDateTime(order.scheduled_end_date);

                    if (start && end && end <= start) {
                        conflictIds.add(String(order.node_key || order.id));
                        issues.push(`工單 ${order.work_order_number || order.id} 的預定結束時間需晚於預定開始時間。`);
                        previousOrder = order;
                        return;
                    }

                    if (previousOrder) {
                        const previousEnd = parseDateTime(previousOrder.scheduled_end_date);
                        if (start && previousEnd && start < previousEnd) {
                            conflictIds.add(String(order.node_key || order.id));
                            conflictIds.add(String(previousOrder.node_key || previousOrder.id));
                            issues.push(`機台 ${resolveMachineName(machineId)} 的排程時間發生重疊。`);
                        }
                    }

                    if (end) {
                        previousOrder = order;
                    }
                });
            });

            state.conflictOrderIds = conflictIds;
            applyConflictMarks();

            if (!shouldMark) {
                return [];
            }

            return Array.from(new Set(issues));
        }

        function applyConflictMarks() {
            moduleRoot.querySelectorAll('[data-work-order-id]').forEach((node) => {
                const id = node.dataset.nodeKey || node.dataset.workOrderId || '';
                const hasConflict = state.conflictOrderIds.has(String(id));
                node.classList.toggle('schedule-row-conflict', hasConflict);
            });
        }

        function markFieldConflict(fieldNames) {
            if (!elements.scheduleModalForm) {
                return;
            }
            fieldNames.forEach((name) => {
                const field = elements.scheduleModalForm.querySelector(`[name="${name}"]`);
                if (field) {
                    field.classList.add('schedule-field-conflict');
                }
            });
        }

        function clearModalFieldConflict() {
            if (!elements.scheduleModalForm) {
                return;
            }
            elements.scheduleModalForm.querySelectorAll('.schedule-field-conflict').forEach((field) => {
                field.classList.remove('schedule-field-conflict');
            });
        }

        function showWarningModal(issues) {
            if (!elements.warningModal || !elements.warningMessage) {
                return;
            }
            const messages = issues.slice(0, 4).join(' ');
            elements.warningMessage.textContent = messages || '排程時間有衝突，請調整後再儲存。';
            elements.warningModal.classList.remove('hidden');
        }

        function closeWarningModal() {
            if (elements.warningModal) {
                elements.warningModal.classList.add('hidden');
            }
        }

        function showModalAlert(type, message) {
            if (!elements.scheduleModalAlert) {
                return;
            }
            elements.scheduleModalAlert.textContent = message;
            elements.scheduleModalAlert.className = `modal-alert alert alert-${type}`;
            elements.scheduleModalAlert.classList.remove('hidden');
        }

        function clearModalAlert() {
            if (!elements.scheduleModalAlert) {
                return;
            }
            elements.scheduleModalAlert.textContent = '';
            elements.scheduleModalAlert.className = 'modal-alert hidden';
        }

        function showAlert(type, message) {
            if (!elements.alert) {
                return;
            }

            elements.alert.textContent = message;
            elements.alert.className = `module-alert alert alert-${type}`;
            elements.alert.classList.remove('hidden');

            if (type === 'success' || type === 'info') {
                setTimeout(() => {
                    hideAlert();
                }, 2200);
            }
        }

        function hideAlert() {
            if (!elements.alert) {
                return;
            }
            elements.alert.className = 'module-alert hidden';
            elements.alert.textContent = '';
        }

        function startLiveClock() {
            const update = () => {
                const now = new Date();
                const nowText = formatLiveTime(now);
                if (elements.liveTime) {
                    elements.liveTime.textContent = nowText;
                }
                if (elements.scheduleModalLiveTime) {
                    elements.scheduleModalLiveTime.textContent = nowText;
                }
                if (state.activeTab === 'time') {
                    renderTimeTab();
                }
            };

            update();
            state.clockTimer = window.setInterval(update, 1000);
        }

        function getDragAfterRow(container, y) {
            const rows = [...container.querySelectorAll('tr.schedule-row:not(.dragging)')];

            return rows.reduce((closest, row) => {
                const box = row.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset, element: row };
                }
                return closest;
            }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
        }

        function getOrderById(id) {
            return state.workOrders.find((item) => String(item.node_key || item.id) === String(id)
                || String(item.work_order_id || '') === String(id));
        }

        function resolveMachineName(machineId) {
            if (!machineId) {
                return '';
            }
            const machine = state.machines.find((item) => parseInt(item.id, 10) === parseInt(machineId, 10));
            return machine ? formatMachineLabel(machine) : `機台 #${machineId}`;
        }

        function compareByScheduledStart(a, b) {
            const startA = parseDateTime(a.scheduled_start_date);
            const startB = parseDateTime(b.scheduled_start_date);

            if (!startA && !startB) {
                return parseInt(a.id, 10) - parseInt(b.id, 10);
            }
            if (!startA) {
                return 1;
            }
            if (!startB) {
                return -1;
            }
            return startA.getTime() - startB.getTime();
        }

        function compareByStoredSequence(a, b) {
            const seqA = Number.isFinite(parseInt(a.machine_sequence, 10)) ? parseInt(a.machine_sequence, 10) : Number.MAX_SAFE_INTEGER;
            const seqB = Number.isFinite(parseInt(b.machine_sequence, 10)) ? parseInt(b.machine_sequence, 10) : Number.MAX_SAFE_INTEGER;

            if (seqA !== seqB) {
                return seqA - seqB;
            }

            return compareByScheduledStart(a, b);
        }

        function compareByRank(a, b, rankKey) {
            const rankA = Number.isFinite(parseInt(a[rankKey], 10)) ? parseInt(a[rankKey], 10) : Number.MAX_SAFE_INTEGER;
            const rankB = Number.isFinite(parseInt(b[rankKey], 10)) ? parseInt(b[rankKey], 10) : Number.MAX_SAFE_INTEGER;

            if (rankA !== rankB) {
                return rankA - rankB;
            }
            return compareByScheduledStart(a, b);
        }

        function isCompleted(order) {
            const key = String(order.status_key || '').toLowerCase();
            const label = String(order.status_label || '');
            return key === 'completed' || label === '已完成';
        }

        function resolveProductionStart(order) {
            return order.actual_start_date || order.scheduled_start_date || '';
        }

        function resolveProductionEnd(order) {
            return order.actual_end_date || order.scheduled_end_date || '';
        }

        function isNowInProduction(order, now) {
            const machineId = parseInt(order.machine_id || 0, 10);
            if (!machineId) {
                return false;
            }

            const start = parseDateTime(resolveProductionStart(order));
            const end = parseDateTime(resolveProductionEnd(order));
            if (!start || !end) {
                return false;
            }

            return now >= start && now <= end;
        }

        function getRemainingText(order, now) {
            const end = parseDateTime(resolveProductionEnd(order));
            if (!end) {
                return '-';
            }

            const diffMs = end.getTime() - now.getTime();
            if (diffMs <= 0) {
                return '已逾時';
            }

            const diffMinutes = Math.ceil(diffMs / 60000);
            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;
            if (hours <= 0) {
                return `${minutes} 分鐘`;
            }
            return `${hours} 小時 ${minutes} 分鐘`;
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

        function formatDateTime(value) {
            const date = parseDateTime(value);
            if (!date) {
                return '-';
            }
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hour = String(date.getHours()).padStart(2, '0');
            const minute = String(date.getMinutes()).padStart(2, '0');
            return `${month}/${day} ${hour}:${minute}`;
        }

        function formatLiveTime(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hour = String(date.getHours()).padStart(2, '0');
            const minute = String(date.getMinutes()).padStart(2, '0');
            const second = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        }

        function escapeHtmlSafe(value) {
            if (typeof window.escapeHtml === 'function') {
                return window.escapeHtml(value || '');
            }
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
    }

    window.initializeProductionWorkOrderScheduleModule = initializeProductionWorkOrderScheduleModule;
})();
