/**
 * Calendar Event Reminders Module - 行事曆提醒管理
 */
(function () {
    'use strict';

    function initializeCalendarEventRemindersModule(container) {
        const moduleRoot = container.querySelector('[data-module="calendar_event_reminders"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        // DOM 元素
        const alertBox = moduleRoot.querySelector('[data-calendar-event-reminders-alert]');
        const filterForm = moduleRoot.querySelector('[data-calendar-event-reminders-filter]');
        const tableBody = moduleRoot.querySelector('[data-calendar-event-reminders-table] tbody');
        const paginationContainer = moduleRoot.querySelector('[data-calendar-event-reminders-pagination]');
        const summaryLabel = moduleRoot.querySelector('[data-calendar-event-reminders-summary]');

        // Modal 元素
        const modal = moduleRoot.querySelector('[data-calendar-event-reminders-modal]');
        const modalTitle = modal ? modal.querySelector('[data-modal-title]') : null;
        const modalAlert = modal ? modal.querySelector('[data-calendar-event-reminders-modal-alert]') : null;
        const modalForm = modal ? modal.querySelector('[data-calendar-event-reminders-form]') : null;

        // 狀態
        const state = {
            loading: false,
            page: 1,
            perPage: 10,
            total: 0,
            totalPages: 0,
            eventId: '',
            isSent: '',
            data: [],
            editingId: null,
            events: [],
            employees: [],
        };

        let dataSyncHelper = null;

        // 工具函式
        function showAlert(type, message, isModal = false) {
            const box = isModal ? modalAlert : alertBox;
            if (!box || !message) return;
            box.textContent = message;
            box.classList.remove('hidden', 'success', 'error');
            box.classList.add(type === 'success' ? 'success' : 'error');
        }

        function clearAlert(isModal = false) {
            const box = isModal ? modalAlert : alertBox;
            if (!box) return;
            box.textContent = '';
            box.classList.add('hidden');
            box.classList.remove('success', 'error');
        }

        function setLoading(isLoading) {
            state.loading = isLoading;
            moduleRoot.classList.toggle('is-loading', isLoading);
        }

        function formatDateTime(dateStr) {
            if (!dateStr) return '-';
            const d = new Date(dateStr);
            return d.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        }

        function getSentBadge(isSent) {
            if (isSent) {
                return '<span class="status-badge completed">已發送</span>';
            }
            return '<span class="status-badge pending">待發送</span>';
        }

        // 載入下拉選項
        async function loadDropdownOptions() {
            try {
                const [eventsRes, employeesRes] = await Promise.all([
                    fetch('api/dashboard_calendar_events/?perPage=100'),
                    fetch('api/employees/?perPage=100'),
                ]);
                const eventsJson = await eventsRes.json();
                const employeesJson = await employeesRes.json();

                if (eventsJson.success) {
                    state.events = eventsJson.data || [];
                    updateEventDropdown();
                }
                if (employeesJson.success) {
                    state.employees = employeesJson.data || [];
                    updateEmployeeDropdown();
                }
            } catch (error) {
                console.error('載入下拉選項失敗', error);
            }
        }

        function updateEventDropdown() {
            const select = modalForm?.querySelector('select[name="event_id"]');
            if (!select) return;
            select.innerHTML = '<option value="">請選擇事件</option>' +
                state.events.map(e => `<option value="${e.id}">${escapeHtml(e.title)}</option>`).join('');
        }

        function updateEmployeeDropdown() {
            const select = modalForm?.querySelector('select[name="employee_id"]');
            if (!select) return;
            select.innerHTML = '<option value="">請選擇員工</option>' +
                state.employees.map(e => `<option value="${e.id}">${escapeHtml(e.name)} (${escapeHtml(e.employee_number)})</option>`).join('');
        }

        // API 請求
        async function fetchData() {
            if (state.loading) return;
            setLoading(true);
            clearAlert();

            const params = new URLSearchParams({
                page: state.page.toString(),
                perPage: state.perPage.toString(),
            });
            if (state.eventId) params.set('event_id', state.eventId);
            if (state.isSent !== '') params.set('is_sent', state.isSent);

            try {
                const response = await fetch(`api/calendar_event_reminders/?${params.toString()}`);
                const json = await response.json();

                if (!json.success) {
                    showAlert('error', json.message || '載入資料失敗');
                    return;
                }

                state.data = json.data || [];
                state.total = json.pagination?.total || 0;
                state.totalPages = json.pagination?.totalPages || 0;
                state.page = json.pagination?.page || 1;

                renderTable();
                renderPagination();
                updateSummary();
            } catch (error) {
                showAlert('error', '網路錯誤：' + error.message);
            } finally {
                setLoading(false);
            }
        }

        function renderTable() {
            if (!tableBody) return;

            if (state.data.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="7" class="text-center">目前沒有資料</td></tr>`;
                return;
            }

            tableBody.innerHTML = state.data.map(item => `
                <tr data-id="${item.id}">
                    <td>${escapeHtml(item.event_title)}</td>
                    <td>${escapeHtml(item.employee_name ?? '-')}</td>
                    <td>${formatDateTime(item.reminder_datetime)}</td>
                    <td>${escapeHtml(item.reminder_type ?? '-')}</td>
                    <td>${getSentBadge(item.is_sent)}</td>
                    <td class="actions">
                        <button type="button" class="btn text" data-action="edit" data-id="${item.id}" title="編輯">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn text danger" data-action="delete" data-id="${item.id}" title="刪除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        function renderPagination() {
            if (!paginationContainer) return;

            if (state.totalPages <= 1) {
                paginationContainer.innerHTML = '';
                return;
            }

            let html = '';
            html += `<button type="button" class="btn-page" data-page="${state.page - 1}" ${state.page <= 1 ? 'disabled' : ''}>«</button>`;

            for (let i = 1; i <= state.totalPages; i++) {
                if (i === 1 || i === state.totalPages || (i >= state.page - 2 && i <= state.page + 2)) {
                    html += `<button type="button" class="btn-page ${i === state.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
                } else if (i === state.page - 3 || i === state.page + 3) {
                    html += `<span class="pagination-ellipsis">…</span>`;
                }
            }

            html += `<button type="button" class="btn-page" data-page="${state.page + 1}" ${state.page >= state.totalPages ? 'disabled' : ''}>»</button>`;
            paginationContainer.innerHTML = html;
        }

        function updateSummary() {
            if (!summaryLabel) return;
            summaryLabel.textContent = `共 ${state.total} 筆資料`;
        }

        // Modal 操作
        function openModal(mode, data = null) {
            if (!modal || !modalForm) return;

            // 安全的欄位設定函數
            function setFieldValue(name, value) {
                const field = modalForm.querySelector(`[name="${name}"]`);
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = !!value;
                    } else {
                        field.value = value || '';
                    }
                } else {
                    console.warn(`calendar_event_reminders: 欄位不存在 - ${name}`);
                }
            }

            clearAlert(true);
            modalForm.reset();

            if (mode === 'add') {
                state.editingId = null;
                if (modalTitle) modalTitle.textContent = '新增提醒';
                setFieldValue('id', '');
            } else if (mode === 'edit' && data) {
                state.editingId = data.id;
                if (modalTitle) modalTitle.textContent = '編輯提醒';
                setFieldValue('id', data.id);
                setFieldValue('event_id', data.event_id);
                setFieldValue('employee_id', data.employee_id);
                setFieldValue('reminder_datetime', data.reminder_datetime ? data.reminder_datetime.slice(0, 16) : '');
                setFieldValue('reminder_type', data.reminder_type);
            }

            modal.classList.remove('hidden');
        }

        function closeModal() {
            if (!modal) return;
            modal.classList.add('hidden');
            state.editingId = null;
        }

        async function handleFormSubmit(e) {
            e.preventDefault();
            clearAlert(true);

            const formData = new FormData(modalForm);
            const payload = {
                event_id: parseInt(formData.get('event_id'), 10),
                employee_id: parseInt(formData.get('employee_id'), 10),
                reminder_datetime: formData.get('reminder_datetime'),
                reminder_type: formData.get('reminder_type'),
            };

            const isEdit = state.editingId !== null;
            const url = isEdit
                ? `api/calendar_event_reminders/update.php?id=${state.editingId}`
                : 'api/calendar_event_reminders/';
            const method = isEdit ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const json = await response.json();

                if (!json.success) {
                    showAlert('error', json.message || '操作失敗', true);
                    return;
                }

                closeModal();
                showAlert('success', isEdit ? '提醒已更新' : '提醒已新增');
                if (dataSyncHelper) {
                    if (isEdit) {
                        dataSyncHelper.notifyUpdated({ id: state.editingId });
                    } else {
                        dataSyncHelper.notifyCreated(payload);
                    }
                }
                fetchData();
            } catch (error) {
                showAlert('error', '網路錯誤：' + error.message, true);
            }
        }

        async function handleDelete(id) {
            if (!confirm('確定要刪除此提醒嗎？')) return;

            try {
                const response = await fetch(`api/calendar_event_reminders/delete.php?id=${id}`, {
                    method: 'DELETE',
                });
                const json = await response.json();

                if (!json.success) {
                    showAlert('error', json.message || '刪除失敗');
                    return;
                }

                showAlert('success', '提醒已刪除');
                if (dataSyncHelper) {
                    dataSyncHelper.notifyDeleted({ id });
                }
                fetchData();
            } catch (error) {
                showAlert('error', '網路錯誤：' + error.message);
            }
        }

        // 事件處理
        function handleTableClick(e) {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;

            const action = btn.dataset.action;
            const id = parseInt(btn.dataset.id, 10);

            if (action === 'edit') {
                const item = state.data.find(d => d.id === id);
                if (item) openModal('edit', item);
            } else if (action === 'delete') {
                handleDelete(id);
            }
        }

        function handlePaginationClick(e) {
            const btn = e.target.closest('button[data-page]');
            if (!btn || btn.disabled) return;

            const page = parseInt(btn.dataset.page, 10);
            if (page >= 1 && page <= state.totalPages) {
                state.page = page;
                fetchData();
            }
        }

        function handleFilterSubmit(e) {
            e.preventDefault();
            const formData = new FormData(filterForm);
            state.eventId = formData.get('event_id') || '';
            state.isSent = formData.get('is_sent') || '';
            state.page = 1;
            fetchData();
        }

        function handleReset() {
            if (filterForm) filterForm.reset();
            state.eventId = '';
            state.isSent = '';
            state.page = 1;
            fetchData();
        }

        // 綁定事件
        moduleRoot.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;

            switch (action) {
                case 'add-reminder':
                    openModal('add');
                    break;
                case 'refresh-reminders':
                    fetchData();
                    break;
                case 'reset-filter':
                    handleReset();
                    break;
                case 'close-modal':
                case 'cancel':
                    closeModal();
                    break;
            }
        });

        if (tableBody) {
            tableBody.addEventListener('click', handleTableClick);
        }

        if (paginationContainer) {
            paginationContainer.addEventListener('click', handlePaginationClick);
        }

        if (filterForm) {
            filterForm.addEventListener('submit', handleFilterSubmit);
        }

        if (modalForm) {
            modalForm.addEventListener('submit', handleFormSubmit);
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }

        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('calendar_event_reminders', {
                onRefresh: fetchData,
                onDependencyUpdate: (sourceModule) => {
                    if (sourceModule === 'dashboard_calendar_events' || sourceModule === 'employees') {
                        loadDropdownOptions();
                    }
                    fetchData();
                }
            });
        }

        // 初始載入
        loadDropdownOptions();
        fetchData();
    }

    window.initializeCalendarEventRemindersModule = initializeCalendarEventRemindersModule;
})();
