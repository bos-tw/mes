/**
 * Dashboard Calendar Events Module - 行事曆事件管理
 */
(function () {
    'use strict';

    function initializeDashboardCalendarEventsModule(container) {
        const moduleRoot = container.querySelector('[data-module="dashboard_calendar_events"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        // DOM 元素
        const alertBox = moduleRoot.querySelector('[data-dashboard-calendar-events-alert]');
        const filterForm = moduleRoot.querySelector('[data-dashboard-calendar-events-filter]');
        const tableBody = moduleRoot.querySelector('[data-dashboard-calendar-events-table] tbody');
        const paginationContainer = moduleRoot.querySelector('[data-dashboard-calendar-events-pagination]');
        const summaryLabel = moduleRoot.querySelector('[data-dashboard-calendar-events-summary]');

        // Modal 元素
        const modal = moduleRoot.querySelector('[data-dashboard-calendar-events-modal]');
        const modalTitle = modal ? modal.querySelector('[data-modal-title]') : null;
        const modalAlert = modal ? modal.querySelector('[data-dashboard-calendar-events-modal-alert]') : null;
        const modalForm = modal ? modal.querySelector('[data-dashboard-calendar-events-form]') : null;

        // 狀態
        const state = {
            loading: false,
            page: 1,
            perPage: 10,
            total: 0,
            totalPages: 0,
            keyword: '',
            eventType: '',
            status: '',
            data: [],
            editingId: null,
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

        // 事件類型英→中映射
        const eventTypeMap = {
            'meeting': '會議',
            'maintenance': '維護',
            'order': '訂單節點',
            'reminder': '提醒',
            'other': '其他',
        };
        function getEventTypeLabel(type) {
            return eventTypeMap[type] || type || '-';
        }

        // 判斷事件是否已過期
        function isExpired(item) {
            if (item.status === 'completed' || item.status === 'cancelled') return false;
            const endDate = item.end_datetime || item.start_datetime;
            if (!endDate) return false;
            return new Date(endDate) < new Date();
        }

        function getStatusBadge(status) {
            const statusMap = {
                'pending': { class: 'pending', text: '待處理' },
                'in_progress': { class: 'in-progress', text: '進行中' },
                'completed': { class: 'completed', text: '已完成' },
                'cancelled': { class: 'cancelled', text: '已取消' },
            };
            const info = statusMap[status] || { class: 'inactive', text: status || '-' };
            return `<span class="status-badge ${info.class}">${escapeHtml(info.text)}</span>`;
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
            if (state.keyword) params.set('keyword', state.keyword);
            if (state.eventType) params.set('event_type', state.eventType);
            if (state.status) params.set('status', state.status);

            try {
                const response = await fetch(`api/dashboard_calendar_events/?${params.toString()}`);
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
                tableBody.innerHTML = `<tr><td colspan="9" class="text-center">目前沒有資料</td></tr>`;
                return;
            }

            tableBody.innerHTML = state.data.map(item => {
                const expired = isExpired(item);
                const expiredBadge = expired
                    ? '<span class="status-badge inactive">已過期</span>'
                    : '<span class="status-badge completed">未過期</span>';
                return `
                <tr data-id="${item.id}"${expired ? ' style="opacity: 0.75;"' : ''}>
                    <td>${escapeHtml(item.title)}</td>
                    <td>${escapeHtml(getEventTypeLabel(item.event_type))}</td>
                    <td>${formatDateTime(item.start_datetime)}</td>
                    <td>${formatDateTime(item.end_datetime)}</td>
                    <td>${expiredBadge}</td>
                    <td>${getStatusBadge(item.status)}</td>
                    <td>${escapeHtml(item.creator_name ?? '-')}</td>
                    <td class="actions">
                        <button type="button" class="btn text" data-action="edit" data-id="${item.id}" title="編輯">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn text danger" data-action="delete" data-id="${item.id}" title="刪除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
            }).join('');
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
            clearAlert(true);
            modalForm.reset();

            // 安全的欄位設定輔助函數
            function setFieldValue(name, value) {
                const field = modalForm.querySelector(`[name="${name}"]`);
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = !!value;
                    } else {
                        field.value = value || '';
                    }
                } else {
                    console.warn(`dashboard_calendar_events: 欄位不存在 - ${name}`);
                }
            }

            if (mode === 'add') {
                state.editingId = null;
                if (modalTitle) modalTitle.textContent = '新增行事曆事件';
                // 清除過期提示
                const expiredHint = modal.querySelector('.expired-hint');
                if (expiredHint) expiredHint.remove();
                setFieldValue('id', '');
                // 設定預設開始時間為現在
                const now = new Date();
                const localDatetime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                setFieldValue('start_datetime', localDatetime);
            } else if (mode === 'edit' && data) {
                state.editingId = data.id;
                if (modalTitle) modalTitle.textContent = '編輯行事曆事件';

                // 顯示過期提示
                const expiredHint = modal.querySelector('.expired-hint');
                if (expiredHint) expiredHint.remove();
                if (isExpired(data)) {
                    const hint = document.createElement('div');
                    hint.className = 'expired-hint';
                    hint.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 此事件已過期';
                    hint.style.cssText = 'color: var(--color-danger); background: #fff0f0; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; font-size: 14px;';
                    modalTitle.insertAdjacentElement('afterend', hint);
                }

                setFieldValue('id', data.id);
                setFieldValue('title', data.title);
                setFieldValue('event_type', data.event_type);
                setFieldValue('description', data.description);
                setFieldValue('start_datetime', data.start_datetime ? data.start_datetime.slice(0, 16) : '');
                setFieldValue('end_datetime', data.end_datetime ? data.end_datetime.slice(0, 16) : '');
                setFieldValue('is_all_day', data.is_all_day);
                setFieldValue('status', data.status);
                setFieldValue('priority', data.priority);
                setFieldValue('color', data.color || '#3788d8');
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
                title: formData.get('title'),
                event_type: formData.get('event_type'),
                description: formData.get('description'),
                start_datetime: formData.get('start_datetime'),
                end_datetime: formData.get('end_datetime') || null,
                is_all_day: modalForm.querySelector('input[name="is_all_day"]').checked,
                status: formData.get('status'),
                priority: formData.get('priority'),
                color: formData.get('color'),
            };

            const isEdit = state.editingId !== null;
            const url = isEdit
                ? `api/dashboard_calendar_events/update.php?id=${state.editingId}`
                : 'api/dashboard_calendar_events/';
            const method = isEdit ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const json = await response.json();

                if (!json.success) {
                    let errorMsg = json.message || '操作失敗';
                    // 如果有詳細的欄位驗證錯誤，只顯示訊息（不曝露欄位名）
                    if (json.errors) {
                        const errorMessages = Object.values(json.errors).join('、');
                        errorMsg = errorMessages;
                    }
                    showAlert('error', errorMsg, true);
                    return;
                }

                closeModal();
                showAlert('success', isEdit ? '行事曆事件已更新' : '行事曆事件已新增');
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
            if (!confirm('確定要刪除此行事曆事件嗎？')) return;

            try {
                const response = await fetch(`api/dashboard_calendar_events/delete.php?id=${id}`, {
                    method: 'DELETE',
                });
                const json = await response.json();

                if (!json.success) {
                    showAlert('error', json.message || '刪除失敗');
                    return;
                }

                showAlert('success', '行事曆事件已刪除');
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
            state.keyword = formData.get('keyword') || '';
            state.eventType = formData.get('event_type') || '';
            state.status = formData.get('status') || '';
            state.page = 1;
            fetchData();
        }

        function handleReset() {
            if (filterForm) filterForm.reset();
            state.keyword = '';
            state.eventType = '';
            state.status = '';
            state.page = 1;
            fetchData();
        }

        // 綁定事件 - 使用事件委派模式
        moduleRoot.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;

            switch (action) {
                case 'add-calendar-event':
                    openModal('add');
                    break;
                case 'refresh-calendar-events':
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
            dataSyncHelper = DataSync.createModuleHelper('dashboard_calendar_events', {
                onRefresh: fetchData
            });
        }

        // 初始載入
        fetchData();
    }

    window.initializeDashboardCalendarEventsModule = initializeDashboardCalendarEventsModule;
})();
