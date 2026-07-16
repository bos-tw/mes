/**
 * Roles Module
 * 角色管理模組
 */
(function() {
    'use strict';

    function initializeRolesModule(container) {
        const moduleRoot = container.querySelector('[data-module="roles"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        // ===== DOM 元素快取 =====
        const alertBox = moduleRoot.querySelector('[data-roles-alert]');
        const filterForm = moduleRoot.querySelector('[data-roles-filter]');
        const tableElement = moduleRoot.querySelector('[data-roles-table]');
        const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
        const paginationContainer = moduleRoot.querySelector('[data-roles-pagination]');

        const modalOverlay = moduleRoot.querySelector('[data-roles-modal]');
        const modalAlertBox = modalOverlay ? modalOverlay.querySelector('[data-roles-modal-alert]') : null;
        const modalForm = modalOverlay ? modalOverlay.querySelector('[data-roles-form]') : null;
        const modalTitle = modalOverlay ? modalOverlay.querySelector('[data-modal-title]') : null;
        const modalCloseButton = modalOverlay ? modalOverlay.querySelector('[data-action="close-modal"]') : null;
        const cancelButton = modalOverlay ? modalOverlay.querySelector('[data-action="cancel"]') : null;

        const headerCreateButton = moduleRoot.querySelector('.content-header [data-action="create"]');
        const resetFilterButton = moduleRoot.querySelector('[data-action="reset-filter"]');

        const nameInput = modalForm ? modalForm.querySelector('input[name="name"]') : null;
        const descriptionInput = modalForm ? modalForm.querySelector('textarea[name="description"]') : null;

        // ===== 狀態管理 =====
        const rolesCache = new Map();
        const state = {
            page: 1,
            perPage: 10,
            totalPages: 1,
            total: 0,
            currentEditingId: null,
            formInitialSnapshot: null,
        };

        let dataSyncHelper = null;
        let isFormDirty = false;

        // ===== Alert 函式 =====
        function showAlert(type, message) {
            if (!alertBox) return;
            alertBox.textContent = message;
            alertBox.classList.remove('hidden', 'success', 'error', 'warning', 'info');
            alertBox.classList.add(type === 'success' ? 'success' : 'error');
        }

        function hideAlert() {
            if (!alertBox) return;
            alertBox.classList.add('hidden');
            alertBox.textContent = '';
            alertBox.classList.remove('success', 'error', 'warning', 'info');
        }

        function showModalAlert(type, message, autoHide = true) {
            if (!modalAlertBox) {
                showAlert(type, message);
                return;
            }
            modalAlertBox.textContent = message;
            modalAlertBox.classList.remove('hidden', 'success', 'error', 'warning', 'info');
            modalAlertBox.classList.add(type === 'success' ? 'success' : 'error');
            if (autoHide && type === 'success') {
                setTimeout(() => hideModalAlert(), 3000);
            }
            const modalWindow = modalOverlay?.querySelector('.modal-window');
            if (modalWindow) modalWindow.scrollTop = 0;
        }

        function hideModalAlert() {
            if (!modalAlertBox) return;
            modalAlertBox.classList.add('hidden');
            modalAlertBox.textContent = '';
            modalAlertBox.classList.remove('success', 'error', 'warning', 'info');
        }

        function setFieldValue(name, value) {
            if (!modalForm) {
                return;
            }

            const field = modalForm.querySelector(`[name="${name}"]`);
            if (field) {
                field.value = value || '';
            } else {
                console.warn(`roles: 欄位不存在 - ${name}`);
            }
        }

        // ===== 輔助函式 =====
        function formatDateTime(value) {
            return value && value !== '' ? value : '-';
        }

        // ===== 表單快照與髒檢查 =====
        function getFormSnapshot() {
            if (!modalForm) return {};
            return {
                name: nameInput ? nameInput.value.trim() : '',
                description: descriptionInput ? descriptionInput.value.trim() : '',
            };
        }

        function setFormInitialSnapshot() {
            state.formInitialSnapshot = getFormSnapshot();
            isFormDirty = false;
        }

        function hasUnsavedChanges() {
            if (!modalForm || !state.formInitialSnapshot) return false;
            const current = getFormSnapshot();
            return Object.keys(state.formInitialSnapshot).some(
                (key) => state.formInitialSnapshot[key] !== current[key]
            );
        }

        function updateDirtyState() {
            isFormDirty = hasUnsavedChanges();
        }

        // ===== 渲染函式 =====
        function renderLoadingRow() {
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">資料載入中...</td></tr>';
            }
        }

        function renderTableRows(rows) {
            if (!tableBody) return;

            if (!rows || rows.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">尚無符合條件的資料。</td></tr>';
                return;
            }

            const html = rows.map((role) => {
                rolesCache.set(role.id, role);

                return `
                    <tr data-id="${role.id}">
                        <td>${escapeHtml(role.name)}</td>
                        <td>${escapeHtml(role.description) || '-'}</td>
                        <td>${formatDateTime(role.created_at)}</td>
                        <td class="table-actions">
                            <button type="button" class="btn text" data-action="edit" title="編輯">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="btn text danger" data-action="delete" title="刪除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            tableBody.innerHTML = html;

            // 欄位管理器：重新套用欄位可見性
            const manager = window.rolesColumnManager;
            if (manager) manager.onTableUpdated();
        }

        function renderPagination() {
            if (!paginationContainer) return;

            if (state.totalPages <= 1) {
                paginationContainer.innerHTML = '';
                return;
            }

            const prevDisabled = state.page <= 1 ? 'disabled' : '';
            const nextDisabled = state.page >= state.totalPages ? 'disabled' : '';

            paginationContainer.innerHTML = `
                <button type="button" data-page="${state.page - 1}" ${prevDisabled}>上一頁</button>
                <span>第 ${state.page} / ${state.totalPages} 頁，共 ${state.total} 筆</span>
                <button type="button" data-page="${state.page + 1}" ${nextDisabled}>下一頁</button>
            `;
        }

        // ===== API 呼叫 =====
        async function loadRoles(page = 1) {
            hideAlert();
            renderLoadingRow();

            const formData = filterForm ? new FormData(filterForm) : new FormData();
            const params = new URLSearchParams();

            const keyword = (formData.get('keyword') || '').toString().trim();
            const perPageValue = parseInt((formData.get('perPage') || '10').toString(), 10);

            state.page = Math.max(1, page);
            state.perPage = Number.isFinite(perPageValue) && perPageValue > 0 ? perPageValue : 10;

            params.set('page', String(state.page));
            params.set('perPage', String(state.perPage));
            if (keyword !== '') {
                params.set('keyword', keyword);
            }

            try {
                const response = await fetch(`api/roles/index.php?${params.toString()}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' },
                });

                if (!response.ok) {
                    throw new Error(`載入失敗（${response.status}）`);
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || '載入失敗，請稍後再試。');
                }

                const roles = Array.isArray(result.data) ? result.data : [];
                rolesCache.clear();

                renderTableRows(roles);

                if (result.pagination) {
                    state.page = result.pagination.page || state.page;
                    state.perPage = result.pagination.perPage || state.perPage;
                    state.totalPages = result.pagination.totalPages || 1;
                    state.total = result.pagination.total || roles.length;
                }

                renderPagination();
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '載入失敗，請稍後再試。');
                renderTableRows([]);
            }
        }

        async function handleSubmit(event) {
            event.preventDefault();
            hideModalAlert();

            const formData = new FormData(modalForm);
            const payload = {
                name: (formData.get('name') || '').toString().trim(),
                description: (formData.get('description') || '').toString().trim(),
            };

            const isEdit = state.currentEditingId !== null;
            const url = isEdit
                ? `api/roles/update.php?id=${state.currentEditingId}`
                : 'api/roles/index.php';
            const method = isEdit ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method: method,
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                const result = await response.json();

                if (!result.success) {
                    if (result.errors) {
                        const errorMessages = Object.values(result.errors).join('、');
                        throw new Error(errorMessages);
                    }
                    throw new Error(result.message || '儲存失敗。');
                }

                showAlert('success', result.message || '儲存成功。');
                closeModal(true);
                loadRoles(state.page);

                // 通知其他分頁
                if (dataSyncHelper) {
                    if (isEdit) {
                        dataSyncHelper.notifyUpdated(result.data);
                    } else {
                        dataSyncHelper.notifyCreated(result.data);
                    }
                }
            } catch (error) {
                console.error(error);
                showModalAlert('error', error.message || '儲存失敗，請稍後再試。');
            }
        }

        async function handleDelete(id) {
            if (!await window.AppFeedback.confirm({ title: '刪除角色', message: '確定要刪除此角色嗎？', impact: '角色權限與員工角色指派' })) {
                return;
            }

            try {
                const response = await fetch(`api/roles/delete.php?id=${id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' },
                });

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message || '刪除失敗。');
                }

                showAlert('success', result.message || '刪除成功。');
                loadRoles(state.page);

                if (dataSyncHelper) {
                    dataSyncHelper.notifyDeleted({ id });
                }
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '刪除失敗，請稍後再試。');
            }
        }

        // ===== Modal 處理 =====
        function openModal(mode, role = null) {
            if (!modalOverlay || !modalForm) return;

            modalForm.reset();
            hideModalAlert();
            state.currentEditingId = mode === 'edit' && role ? role.id : null;

            if (modalTitle) {
                modalTitle.textContent = mode === 'edit' ? '編輯角色' : '新增角色';
            }

            if (role) {
                if (nameInput) nameInput.value = role.name || '';
                if (descriptionInput) descriptionInput.value = role.description || '';
            }

            modalOverlay.classList.remove('hidden');
            setFormInitialSnapshot();

            if (nameInput) nameInput.focus();
        }

        function closeModal(force = false) {
            if (!modalOverlay || modalOverlay.classList.contains('hidden')) return;

            if (!force && isFormDirty && hasUnsavedChanges()) {
                const confirmed = window.confirm('表單資料尚未儲存，確定要關閉嗎？');
                if (!confirmed) return;
            }

            if (modalForm) modalForm.reset();
            modalOverlay.classList.add('hidden');
            hideModalAlert();
            state.currentEditingId = null;
            state.formInitialSnapshot = null;
            isFormDirty = false;
        }

        // ===== 事件綁定 =====
        if (tableBody) {
            tableBody.addEventListener('click', (event) => {
                const button = event.target.closest('[data-action]');
                if (!button) return;

                const action = button.dataset.action;
                const row = button.closest('tr');
                const id = row ? parseInt(row.dataset.id, 10) : null;

                if (!id) return;

                switch (action) {
                    case 'edit':
                        const role = rolesCache.get(id);
                        if (role) openModal('edit', role);
                        break;
                    case 'delete':
                        handleDelete(id);
                        break;
                }
            });
        }

        if (paginationContainer) {
            paginationContainer.addEventListener('click', (event) => {
                const button = event.target.closest('[data-page]');
                if (button && !button.disabled) {
                    loadRoles(parseInt(button.dataset.page, 10));
                }
            });
        }

        if (filterForm) {
            filterForm.addEventListener('submit', (event) => {
                event.preventDefault();
                loadRoles(1);
            });
        }

        if (resetFilterButton) {
            resetFilterButton.addEventListener('click', () => {
                if (filterForm) filterForm.reset();
                loadRoles(1);
            });
        }

        if (headerCreateButton) {
            headerCreateButton.addEventListener('click', () => openModal('create'));
        }

        if (modalForm) {
            modalForm.addEventListener('submit', handleSubmit);
            modalForm.addEventListener('input', updateDirtyState);
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', (event) => {
                if (event.target === modalOverlay) {
                    closeModal();
                }
            });
        }

        if (modalCloseButton) {
            modalCloseButton.addEventListener('click', () => closeModal());
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', () => closeModal());
        }

        // ESC 鍵關閉 Modal
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modalOverlay && !modalOverlay.classList.contains('hidden')) {
                closeModal();
            }
        });

        // ===== 初始化 =====
        loadRoles(1);

        // 訂閱跨分頁同步
        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('roles', {
                onRefresh: () => loadRoles(state.page)
            });
        }
    }

    window.initializeRolesModule = initializeRolesModule;
})();
