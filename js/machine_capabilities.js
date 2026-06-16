/**
 * Machine Capabilities Module
 * 機台能力管理模組
 */
(function () {
    'use strict';

    function initializeMachineCapabilitiesModule(container) {
        const moduleRoot = container.querySelector('[data-module="machine_capabilities"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        const alertBox = moduleRoot.querySelector('[data-machine-capabilities-alert]');
        const filterForm = moduleRoot.querySelector('[data-machine-capabilities-filter]');
        const tableBody = moduleRoot.querySelector('[data-machine-capabilities-table] tbody');
        const paginationContainer = moduleRoot.querySelector('[data-machine-capabilities-pagination]');
        const modal = moduleRoot.querySelector('[data-machine-capabilities-modal]');
        const modalTitle = modal ? modal.querySelector('[data-modal-title]') : null;
        const modalAlert = modal ? modal.querySelector('[data-machine-capabilities-modal-alert]') : null;
        const modalForm = modal ? modal.querySelector('[data-machine-capabilities-form]') : null;

        const state = {
            page: 1,
            perPage: 10,
            total: 0,
            totalPages: 1,
            editingId: null,
            keyword: '',
            is_active: '',
            loading: false,
            data: [],
        };

        let dataSyncHelper = null;

        function showAlert(type, message, isModal = false) {
            const box = isModal ? modalAlert : alertBox;
            if (!box) {
                return;
            }

            box.textContent = message;
            box.classList.remove('hidden', 'success', 'error');
            box.classList.add(type === 'success' ? 'success' : 'error');
        }

        function clearAlert(isModal = false) {
            const box = isModal ? modalAlert : alertBox;
            if (!box) {
                return;
            }

            box.textContent = '';
            box.classList.add('hidden');
            box.classList.remove('success', 'error');
        }

        function setLoading(isLoading) {
            state.loading = isLoading;
            moduleRoot.classList.toggle('is-loading', isLoading);
        }

        async function fetchData() {
            if (state.loading) {
                return;
            }

            setLoading(true);
            clearAlert();

            const params = new URLSearchParams({
                page: String(state.page),
                perPage: String(state.perPage),
            });

            if (state.keyword !== '') {
                params.set('keyword', state.keyword);
            }
            if (state.is_active !== '') {
                params.set('is_active', state.is_active);
            }

            try {
                const response = await fetch(`api/machine_capabilities/index.php?${params.toString()}`, {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                });
                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.message || '載入機台能力資料失敗。');
                }

                state.data = Array.isArray(result.data) ? result.data : [];
                state.total = result.pagination?.total || 0;
                state.totalPages = result.pagination?.totalPages || 1;
                state.page = result.pagination?.page || 1;

                renderTable();
                renderPagination();
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '載入機台能力資料失敗。');
                renderEmptyState('載入失敗');
            } finally {
                setLoading(false);
            }
        }

        function renderEmptyState(message = '目前沒有資料') {
            if (!tableBody) {
                return;
            }

            tableBody.innerHTML = `<tr><td colspan="8" class="text-center">${escapeHtml(message)}</td></tr>`;
        }

        function renderTable() {
            if (!tableBody) {
                return;
            }

            if (state.data.length === 0) {
                renderEmptyState();
                return;
            }

            tableBody.innerHTML = state.data.map((item) => `
                <tr data-id="${item.id}">
                    <td>${escapeHtml(item.capability_code || '-')}</td>
                    <td>${escapeHtml(item.capability_name || '-')}</td>
                    <td>${escapeHtml(item.description || '-')}</td>
                    <td>${escapeHtml(String(item.machine_count ?? 0))}</td>
                    <td>${escapeHtml(String(item.sort_order ?? 0))}</td>
                    <td>${item.is_active ? '啟用' : '停用'}</td>
                    <td>${escapeHtml(item.updated_at || '-')}</td>
                    <td class="table-actions">
                        <button type="button" class="btn text" data-action="edit" data-id="${item.id}" title="編輯"><i class="fas fa-edit"></i></button>
                        <button type="button" class="btn text danger" data-action="delete" data-id="${item.id}" title="刪除"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');
        }

        function renderPagination() {
            if (!paginationContainer) {
                return;
            }

            if (state.totalPages <= 1) {
                paginationContainer.innerHTML = '';
                return;
            }

            paginationContainer.innerHTML = `
                <button type="button" data-page="${state.page - 1}" ${state.page <= 1 ? 'disabled' : ''}>上一頁</button>
                <span>第 ${state.page} / ${state.totalPages} 頁，共 ${state.total} 筆資料</span>
                <button type="button" data-page="${state.page + 1}" ${state.page >= state.totalPages ? 'disabled' : ''}>下一頁</button>
            `;
        }

        function setFieldValue(name, value) {
            if (!modalForm) {
                return;
            }

            const field = modalForm.querySelector(`[name="${name}"]`);
            if (!field) {
                return;
            }

            if (field.type === 'checkbox') {
                field.checked = value === true || value === 1 || value === '1';
                return;
            }

            field.value = value ?? '';
        }

        function openModal(mode, data = null) {
            if (!modal || !modalForm) {
                return;
            }

            modalForm.reset();
            clearAlert(true);
            state.editingId = null;

            if (mode === 'edit' && data) {
                state.editingId = Number(data.id);
                if (modalTitle) {
                    modalTitle.textContent = '編輯機台能力';
                }
                setFieldValue('capability_code', data.capability_code || '');
                setFieldValue('capability_name', data.capability_name || '');
                setFieldValue('description', data.description || '');
                setFieldValue('sort_order', data.sort_order ?? 0);
                setFieldValue('is_active', Number(data.is_active) === 1);
            } else {
                if (modalTitle) {
                    modalTitle.textContent = '新增機台能力';
                }
                setFieldValue('sort_order', 0);
                setFieldValue('is_active', true);
            }

            modal.classList.remove('hidden');
        }

        function closeModal() {
            if (!modal) {
                return;
            }

            modal.classList.add('hidden');
            state.editingId = null;
            clearAlert(true);
        }

        async function submitForm(event) {
            event.preventDefault();
            if (!modalForm) {
                return;
            }

            clearAlert(true);

            const payload = {
                capability_code: (modalForm.querySelector('[name="capability_code"]')?.value || '').trim(),
                capability_name: (modalForm.querySelector('[name="capability_name"]')?.value || '').trim(),
                description: (modalForm.querySelector('[name="description"]')?.value || '').trim(),
                sort_order: (modalForm.querySelector('[name="sort_order"]')?.value || '0').trim(),
                is_active: modalForm.querySelector('[name="is_active"]')?.checked ? 1 : 0,
            };

            const isEdit = state.editingId !== null;
            const url = isEdit
                ? `api/machine_capabilities/update.php?id=${state.editingId}`
                : 'api/machine_capabilities/index.php';
            const requestPayload = isEdit ? { ...payload, _method: 'PUT' } : payload;

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestPayload),
                });
                const result = await response.json();

                if (!response.ok || !result.success) {
                    const errorText = result.errors ? Object.values(result.errors).join('、') : '';
                    throw new Error(result.message ? `${result.message}${errorText ? `（${errorText}）` : ''}` : '儲存失敗。');
                }

                closeModal();
                showAlert('success', isEdit ? '機台能力已更新。' : '機台能力已新增。');
                if (dataSyncHelper) {
                    if (isEdit) {
                        dataSyncHelper.notifyUpdated(result.data || { id: state.editingId });
                    } else {
                        dataSyncHelper.notifyCreated(result.data || payload);
                    }
                }
                fetchData();
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '儲存失敗。', true);
            }
        }

        async function handleDelete(id) {
            if (!window.confirm('確定要刪除此機台能力嗎？')) {
                return;
            }

            try {
                const response = await fetch(`api/machine_capabilities/delete.php?id=${id}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ _method: 'DELETE' }),
                });
                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.message || '刪除失敗。');
                }

                showAlert('success', '機台能力已刪除。');
                if (dataSyncHelper) {
                    dataSyncHelper.notifyDeleted({ id });
                }
                fetchData();
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '刪除失敗。');
            }
        }

        moduleRoot.addEventListener('click', (event) => {
            const action = event.target.closest('[data-action]')?.dataset.action;
            if (!action) {
                return;
            }

            if (action === 'create' || action === 'add-machine-capability') {
                openModal('create');
                return;
            }

            if (action === 'refresh') {
                fetchData();
                return;
            }

            if (action === 'close-modal' || action === 'cancel') {
                closeModal();
            }
        });

        if (filterForm) {
            filterForm.addEventListener('submit', (event) => {
                event.preventDefault();
                const formData = new FormData(filterForm);
                state.keyword = (formData.get('keyword') || '').toString().trim();
                state.is_active = (formData.get('is_active') || '').toString();
                state.page = 1;
                fetchData();
            });
        }

        if (tableBody) {
            tableBody.addEventListener('click', (event) => {
                const actionElement = event.target.closest('[data-action]');
                if (!actionElement) {
                    return;
                }

                const id = Number.parseInt(actionElement.dataset.id || '', 10);
                if (!Number.isInteger(id)) {
                    return;
                }

                if (actionElement.dataset.action === 'edit') {
                    const item = state.data.find((entry) => Number(entry.id) === id);
                    if (item) {
                        openModal('edit', item);
                    }
                } else if (actionElement.dataset.action === 'delete') {
                    handleDelete(id);
                }
            });
        }

        if (paginationContainer) {
            paginationContainer.addEventListener('click', (event) => {
                const pageAttr = event.target.getAttribute('data-page');
                if (!pageAttr) {
                    return;
                }

                const nextPage = Number.parseInt(pageAttr, 10);
                if (!Number.isInteger(nextPage) || nextPage < 1 || nextPage > state.totalPages) {
                    return;
                }

                state.page = nextPage;
                fetchData();
            });
        }

        if (modal) {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    closeModal();
                }
            });
        }

        if (modalForm) {
            modalForm.addEventListener('submit', submitForm);
        }

        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('machine_capabilities', {
                onRefresh: fetchData,
            });
        }

        fetchData();
    }

    window.initializeMachineCapabilitiesModule = initializeMachineCapabilitiesModule;
})();
