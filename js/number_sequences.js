/**
 * Number Sequences Module - 流水號管理
 */
(function () {
    'use strict';

    function initializeNumberSequencesModule(container) {
        const moduleRoot = container.querySelector('[data-module="number_sequences"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        // DOM 元素
        const alertBox = moduleRoot.querySelector('[data-number-sequences-alert]');
        const filterForm = moduleRoot.querySelector('[data-number-sequences-filter]');
        const tableBody = moduleRoot.querySelector('[data-number-sequences-table] tbody');
        const paginationContainer = moduleRoot.querySelector('[data-number-sequences-pagination]');
        const summaryLabel = moduleRoot.querySelector('[data-number-sequences-summary]');

        // Modal 元素
        const modal = moduleRoot.querySelector('[data-number-sequences-modal]');
        const modalTitle = modal ? modal.querySelector('[data-modal-title]') : null;
        const modalAlert = modal ? modal.querySelector('[data-number-sequences-modal-alert]') : null;
        const modalForm = modal ? modal.querySelector('[data-number-sequences-form]') : null;

        // 狀態
        const state = {
            loading: false,
            page: 1,
            perPage: 10,
            total: 0,
            totalPages: 0,
            keyword: '',
            activeOn: '',
            data: [],
            editingId: null,
        };

        let dataSyncHelper = null;
        const managedSequenceDefaults = {
            ORDER: { prefix: 'ORDER' },
            WO: { prefix: 'WO' },
            INV: { prefix: 'INV' },
            SO: { prefix: 'SO' },
            RO: { prefix: 'RO' },
            WOPR: { prefix: 'WOPR' },
        };

        function getCurrentTabId() {
            const tabContent = moduleRoot.closest('.tab-content[data-tab-id]');
            return tabContent?.dataset.tabId || null;
        }

        function markCurrentTabChangesClean() {
            const tabId = getCurrentTabId();
            if (tabId && typeof window.markTabChangesClean === 'function') {
                window.markTabChangesClean(tabId);
            }
        }

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
            if (state.activeOn) params.set('active_on', state.activeOn);

            try {
                const response = await fetch(`api/number_sequences/?${params.toString()}`);
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
                    <td>${escapeHtml(item.seq_key)}</td>
                    <td>${escapeHtml(item.seq_prefix || '-')}</td>
                    <td>${escapeHtml(formatDateTime(item.active_from) || '-')}</td>
                    <td>${escapeHtml(formatDateTime(item.active_until) || '未停用')}</td>
                    <td>${escapeHtml(item.current_value)}</td>
                    <td>${escapeHtml(formatDateTime(item.updated_at) || '-')}</td>
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

        function formatDateTime(value) {
            if (!value) {
                return '';
            }

            const date = new Date(String(value).replace(' ', 'T'));
            if (Number.isNaN(date.getTime())) {
                return String(value);
            }

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hour = String(date.getHours()).padStart(2, '0');
            const minute = String(date.getMinutes()).padStart(2, '0');
            return `${year}/${month}/${day} ${hour}:${minute}`;
        }

        function toDateTimeLocalValue(value) {
            if (!value) {
                return '';
            }

            const date = value instanceof Date ? value : new Date(String(value).replace(' ', 'T'));
            if (Number.isNaN(date.getTime())) {
                return '';
            }

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hour = String(date.getHours()).padStart(2, '0');
            const minute = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hour}:${minute}`;
        }

        function updateSummary() {
            if (!summaryLabel) return;
            summaryLabel.textContent = `共 ${state.total} 筆資料`;
        }

        function syncPrefixFromSeqKey() {
            if (!modalForm) return;

            const seqKeyField = modalForm.querySelector('[name="seq_key"]');
            const prefixField = modalForm.querySelector('[name="seq_prefix"]');
            if (!seqKeyField || !prefixField) return;

            const selected = managedSequenceDefaults[String(seqKeyField.value || '').toUpperCase()];
            if (!selected) return;

            const currentValue = String(prefixField.value || '').trim().toUpperCase();
            const knownPrefixes = Object.values(managedSequenceDefaults).map(item => item.prefix);

            if (currentValue === '' || knownPrefixes.includes(currentValue)) {
                prefixField.value = selected.prefix;
            }
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
                    console.warn(`number_sequences: 欄位不存在 - ${name}`);
                }
            }

            clearAlert(true);
            modalForm.reset();

            if (mode === 'add') {
                state.editingId = null;
                if (modalTitle) modalTitle.textContent = '新增流水號';
                setFieldValue('id', '');
                const now = new Date();
                now.setSeconds(0, 0);
                const localValue = toDateTimeLocalValue(now);
                setFieldValue('seq_key', '');
                setFieldValue('seq_prefix', '');
                setFieldValue('active_from', localValue);
                setFieldValue('active_until', '');
                setFieldValue('current_value', 0);
            } else if (mode === 'edit' && data) {
                state.editingId = data.id;
                if (modalTitle) modalTitle.textContent = '編輯流水號';
                setFieldValue('id', data.id);
                setFieldValue('seq_key', data.seq_key);
                setFieldValue('seq_prefix', data.seq_prefix);
                setFieldValue('active_from', toDateTimeLocalValue(data.active_from));
                setFieldValue('active_until', toDateTimeLocalValue(data.active_until));
                setFieldValue('current_value', data.current_value || 0);
            }

            syncPrefixFromSeqKey();
            modal.classList.remove('hidden');
        }

        function closeModal() {
            if (!modal) return;
            modal.classList.add('hidden');
            state.editingId = null;
            markCurrentTabChangesClean();
        }

        async function handleFormSubmit(e) {
            e.preventDefault();
            clearAlert(true);

            const formData = new FormData(modalForm);
            const payload = {
                seq_key: formData.get('seq_key'),
                seq_prefix: formData.get('seq_prefix'),
                active_from: formData.get('active_from'),
                active_until: formData.get('active_until') || null,
                current_value: parseInt(formData.get('current_value'), 10) || 0,
            };

            const isEdit = state.editingId !== null;
            const url = isEdit
                ? `api/number_sequences/update.php?id=${state.editingId}`
                : 'api/number_sequences/';
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
                showAlert('success', isEdit ? '流水號已更新' : '流水號已新增');
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
            if (!await window.AppFeedback.confirm({ title: '刪除流水號設定', message: '確定要刪除此流水號嗎？', impact: '後續單據編號產生' })) return;

            try {
                const response = await fetch(`api/number_sequences/delete.php?id=${id}`, {
                    method: 'DELETE',
                });
                const json = await response.json();

                if (!json.success) {
                    showAlert('error', json.message || '刪除失敗');
                    return;
                }

                showAlert('success', '流水號已刪除');
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
            state.activeOn = formData.get('active_on') || '';
            state.page = 1;
            fetchData();
        }

        function handleReset() {
            if (filterForm) filterForm.reset();
            state.keyword = '';
            state.activeOn = '';
            state.page = 1;
            fetchData();
        }

        // 綁定事件 - 使用事件委派模式
        moduleRoot.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;

            switch (action) {
                case 'create':
                case 'add-number-sequence':
                    openModal('add');
                    break;
                case 'refresh':
                case 'refresh-number-sequences':
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
            modalForm.addEventListener('change', (e) => {
                if (e.target?.name === 'seq_key') {
                    syncPrefixFromSeqKey();
                }
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
        }

        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('number_sequences', {
                onRefresh: fetchData
            });
        }

        // 初始載入
        fetchData();
    }

    window.initializeNumberSequencesModule = initializeNumberSequencesModule;
})();
