/**
 * Domain Event Outbox Module - 領域事件 Outbox 管理
 */
(function () {
    'use strict';

    function initializeDomainEventOutboxModule(container) {
        const moduleRoot = container.querySelector('[data-module="domain_event_outbox"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        // DOM 元素
        const alertBox = moduleRoot.querySelector('[data-domain-event-outbox-alert]');
        const filterForm = moduleRoot.querySelector('[data-domain-event-outbox-filter]');
        const tableBody = moduleRoot.querySelector('[data-domain-event-outbox-table] tbody');
        const paginationContainer = moduleRoot.querySelector('[data-domain-event-outbox-pagination]');
        const summaryLabel = moduleRoot.querySelector('[data-domain-event-outbox-summary]');

        // Modal 元素
        const modal = moduleRoot.querySelector('[data-domain-event-outbox-modal]');
        const modalTitle = modal ? modal.querySelector('[data-modal-title]') : null;
        const modalAlert = modal ? modal.querySelector('[data-domain-event-outbox-modal-alert]') : null;
        const modalForm = modal ? modal.querySelector('[data-domain-event-outbox-form]') : null;

        // 詳情 Modal
        const detailModal = moduleRoot.querySelector('[data-domain-event-outbox-detail-modal]');
        const detailContent = detailModal ? detailModal.querySelector('[data-domain-event-outbox-details]') : null;

        // 狀態
        const state = {
            loading: false,
            page: 1,
            perPage: 10,
            total: 0,
            totalPages: 0,
            aggregateType: '',
            eventType: '',
            processStatus: '',
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

        function getStatusBadge(status) {
            const statusMap = {
                'pending': { class: 'pending', text: '待處理' },
                'processing': { class: 'in-progress', text: '處理中' },
                'processed': { class: 'completed', text: '已處理' },
                'failed': { class: 'cancelled', text: '失敗' },
            };
            const info = statusMap[status] || { class: 'pending', text: status || '-' };
            return `<span class="status-badge ${info.class}">${info.text}</span>`;
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
            if (state.aggregateType) params.set('aggregate_type', state.aggregateType);
            if (state.eventType) params.set('event_type', state.eventType);
            if (state.processStatus) params.set('process_status', state.processStatus);

            try {
                const response = await fetch(`api/domain_event_outbox/?${params.toString()}`);
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
                tableBody.innerHTML = `<tr><td colspan="6" class="text-center">目前沒有資料</td></tr>`;
                return;
            }

            tableBody.innerHTML = state.data.map(item => `
                <tr data-id="${item.id}">
                    <td>${escapeHtml(item.aggregate_type)}</td>
                    <td>${escapeHtml(item.event_type)}</td>
                    <td>${getStatusBadge(item.process_status)}</td>
                    <td>${escapeHtml(item.retry_count)}</td>
                    <td>${formatDateTime(item.created_at)}</td>
                    <td class="actions">
                        <button type="button" class="btn text" data-action="view" data-id="${item.id}" title="檢視詳情">
                            <i class="fas fa-eye"></i>
                        </button>
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
                    console.warn(`domain_event_outbox: 欄位不存在 - ${name}`);
                }
            }

            if (mode === 'add') {
                state.editingId = null;
                if (modalTitle) modalTitle.textContent = '新增事件';
                setFieldValue('id', '');
            } else if (mode === 'edit' && data) {
                state.editingId = data.id;
                if (modalTitle) modalTitle.textContent = '編輯事件';
                setFieldValue('id', data.id);
                setFieldValue('aggregate_type', data.aggregate_type);
                setFieldValue('aggregate_id', data.aggregate_id);
                setFieldValue('event_type', data.event_type);
                setFieldValue('payload', data.payload);
                setFieldValue('process_status', data.process_status || 'pending');
            }

            modal.classList.remove('hidden');
        }

        function closeModal() {
            if (!modal) return;
            modal.classList.add('hidden');
            state.editingId = null;
        }

        function openDetailModal(data) {
            if (!detailModal || !detailContent) return;

            let payloadFormatted = data.payload;
            try {
                payloadFormatted = JSON.stringify(JSON.parse(data.payload), null, 2);
            } catch (e) {
                // 保持原始格式
            }

            detailContent.innerHTML = `
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>ID</label>
                        <span>${escapeHtml(data.id)}</span>
                    </div>
                    <div class="detail-item">
                        <label>聚合類型</label>
                        <span>${escapeHtml(data.aggregate_type)}</span>
                    </div>
                    <div class="detail-item">
                        <label>聚合 ID</label>
                        <span>${escapeHtml(data.aggregate_id)}</span>
                    </div>
                    <div class="detail-item">
                        <label>事件類型</label>
                        <span>${escapeHtml(data.event_type)}</span>
                    </div>
                    <div class="detail-item">
                        <label>處理狀態</label>
                        <span>${getStatusBadge(data.process_status)}</span>
                    </div>
                    <div class="detail-item">
                        <label>重試次數</label>
                        <span>${escapeHtml(data.retry_count)}</span>
                    </div>
                    <div class="detail-item">
                        <label>建立時間</label>
                        <span>${formatDateTime(data.created_at)}</span>
                    </div>
                    <div class="detail-item">
                        <label>處理時間</label>
                        <span>${formatDateTime(data.processed_at)}</span>
                    </div>
                    <div class="detail-item full-width">
                        <label>最後錯誤</label>
                        <span>${escapeHtml(data.last_error) || '-'}</span>
                    </div>
                    <div class="detail-item full-width">
                        <label>Payload</label>
                        <pre class="payload-content">${escapeHtml(payloadFormatted)}</pre>
                    </div>
                </div>
            `;

            detailModal.classList.remove('hidden');
        }

        function closeDetailModal() {
            if (!detailModal) return;
            detailModal.classList.add('hidden');
        }

        async function handleFormSubmit(e) {
            e.preventDefault();
            clearAlert(true);

            const formData = new FormData(modalForm);
            const payload = {
                aggregate_type: formData.get('aggregate_type'),
                aggregate_id: parseInt(formData.get('aggregate_id'), 10),
                event_type: formData.get('event_type'),
                payload: formData.get('payload'),
                process_status: formData.get('process_status'),
            };

            const isEdit = state.editingId !== null;
            const url = isEdit
                ? `api/domain_event_outbox/update.php?id=${state.editingId}`
                : 'api/domain_event_outbox/';
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
                showAlert('success', isEdit ? '事件已更新' : '事件已新增');
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
            if (!confirm('確定要刪除此事件嗎？')) return;

            try {
                const response = await fetch(`api/domain_event_outbox/delete.php?id=${id}`, {
                    method: 'DELETE',
                });
                const json = await response.json();

                if (!json.success) {
                    showAlert('error', json.message || '刪除失敗');
                    return;
                }

                showAlert('success', '事件已刪除');
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

            if (action === 'view') {
                const item = state.data.find(d => d.id === id);
                if (item) openDetailModal(item);
            } else if (action === 'edit') {
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
            state.aggregateType = formData.get('aggregate_type') || '';
            state.eventType = formData.get('event_type') || '';
            state.processStatus = formData.get('process_status') || '';
            state.page = 1;
            fetchData();
        }

        function handleReset() {
            if (filterForm) filterForm.reset();
            state.aggregateType = '';
            state.eventType = '';
            state.processStatus = '';
            state.page = 1;
            fetchData();
        }

        // 綁定事件
        moduleRoot.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;

            switch (action) {
                case 'add-event':
                    openModal('add');
                    break;
                case 'refresh-events':
                    fetchData();
                    break;
                case 'reset-filter':
                    handleReset();
                    break;
                case 'close-modal':
                case 'cancel':
                    closeModal();
                    break;
                case 'close-detail-modal':
                    closeDetailModal();
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

        if (detailModal) {
            detailModal.addEventListener('click', (e) => {
                if (e.target === detailModal) closeDetailModal();
            });
        }

        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('domain_event_outbox', {
                onRefresh: fetchData
            });
        }

        // 初始載入
        fetchData();
    }

    window.initializeDomainEventOutboxModule = initializeDomainEventOutboxModule;
})();
