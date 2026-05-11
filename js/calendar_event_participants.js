/**
 * Calendar Event Participants Module - 行事曆事件參與者管理
 */
(function () {
    'use strict';

    function initializeCalendarEventParticipantsModule(container) {
        const moduleRoot = container.querySelector('[data-module="calendar_event_participants"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        // DOM 元素
        const alertBox = moduleRoot.querySelector('[data-calendar-event-participants-alert]');
        const filterForm = moduleRoot.querySelector('[data-calendar-event-participants-filter]');
        const tableBody = moduleRoot.querySelector('[data-calendar-event-participants-table] tbody');
        const paginationContainer = moduleRoot.querySelector('[data-calendar-event-participants-pagination]');
        const summaryLabel = moduleRoot.querySelector('[data-calendar-event-participants-summary]');

        // Modal 元素
        const modal = moduleRoot.querySelector('[data-calendar-event-participants-modal]');
        const modalTitle = modal ? modal.querySelector('[data-modal-title]') : null;
        const modalAlert = modal ? modal.querySelector('[data-calendar-event-participants-modal-alert]') : null;
        const modalForm = modal ? modal.querySelector('[data-calendar-event-participants-form]') : null;

        // 狀態
        const state = {
            loading: false,
            page: 1,
            perPage: 10,
            total: 0,
            totalPages: 0,
            eventId: '',
            keyword: '',
            data: [],
            events: [],
            employees: [],
        };

        let dataSyncHelper = null;

        // 工具函式
        function setFieldValue(name, value, form = modalForm) {
            if (!form) return;
            const field = form.querySelector(`[name="${name}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = !!value;
                } else {
                    field.value = value ?? '';
                }
            } else {
                console.warn(`calendar_event_participants: 欄位不存在 - ${name}`);
            }
        }

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

        // 載入事件和員工下拉選項
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
            if (state.keyword) params.set('keyword', state.keyword);

            try {
                const response = await fetch(`api/calendar_event_participants/?${params.toString()}`);
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
                tableBody.innerHTML = `<tr><td colspan="5" class="text-center">目前沒有資料</td></tr>`;
                return;
            }

            tableBody.innerHTML = state.data.map(item => `
                <tr>
                    <td>${escapeHtml(item.event_title)}</td>
                    <td>${formatDateTime(item.start_datetime)}</td>
                    <td>${escapeHtml(item.employee_name)}</td>
                    <td>${escapeHtml(item.employee_number ?? '-')}</td>
                    <td class="actions">
                        <button type="button" class="btn text danger" data-action="delete" data-event-id="${item.event_id}" data-employee-id="${item.employee_id}" title="移除">
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
        function openModal() {
            if (!modal || !modalForm) return;
            clearAlert(true);
            modalForm.reset();
            if (modalTitle) modalTitle.textContent = '新增參與者';
            modal.classList.remove('hidden');
        }

        function closeModal() {
            if (!modal) return;
            modal.classList.add('hidden');
        }

        async function handleFormSubmit(e) {
            e.preventDefault();
            clearAlert(true);

            const formData = new FormData(modalForm);
            const payload = {
                event_id: parseInt(formData.get('event_id'), 10),
                employee_id: parseInt(formData.get('employee_id'), 10),
            };

            if (!payload.event_id || !payload.employee_id) {
                showAlert('error', '請選擇事件和員工', true);
                return;
            }

            try {
                const response = await fetch('api/calendar_event_participants/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const json = await response.json();

                if (!json.success) {
                    showAlert('error', json.message || '新增失敗', true);
                    return;
                }

                closeModal();
                showAlert('success', '參與者已新增');
                if (dataSyncHelper) {
                    dataSyncHelper.notifyCreated(payload);
                }
                fetchData();
            } catch (error) {
                showAlert('error', '網路錯誤：' + error.message, true);
            }
        }

        async function handleDelete(eventId, employeeId) {
            if (!confirm('確定要移除此參與者嗎？')) return;

            try {
                const response = await fetch(`api/calendar_event_participants/delete.php?event_id=${eventId}&employee_id=${employeeId}`, {
                    method: 'DELETE',
                });
                const json = await response.json();

                if (!json.success) {
                    showAlert('error', json.message || '刪除失敗');
                    return;
                }

                showAlert('success', '參與者已移除');
                if (dataSyncHelper) {
                    dataSyncHelper.notifyDeleted({ event_id: eventId, employee_id: employeeId });
                }
                fetchData();
            } catch (error) {
                showAlert('error', '網路錯誤：' + error.message);
            }
        }

        // 事件處理
        function handleTableClick(e) {
            const btn = e.target.closest('button[data-action="delete"]');
            if (!btn) return;

            const eventId = parseInt(btn.dataset.eventId, 10);
            const employeeId = parseInt(btn.dataset.employeeId, 10);
            handleDelete(eventId, employeeId);
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
            state.keyword = formData.get('keyword') || '';
            state.page = 1;
            fetchData();
        }

        function handleReset() {
            if (filterForm) filterForm.reset();
            state.eventId = '';
            state.keyword = '';
            state.page = 1;
            fetchData();
        }

        // 綁定事件 - 使用事件委派模式
        moduleRoot.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;

            switch (action) {
                case 'add-participant':
                    openModal();
                    break;
                case 'refresh-participants':
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
            dataSyncHelper = DataSync.createModuleHelper('calendar_event_participants', {
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

    window.initializeCalendarEventParticipantsModule = initializeCalendarEventParticipantsModule;
})();
