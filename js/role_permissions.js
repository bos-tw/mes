/**
 * Role Permissions Module
 * 角色權限關聯模組
 */
(function() {
    'use strict';

    function initializeRolePermissionsModule(container) {
        const moduleRoot = container.querySelector('[data-module="role_permissions"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        // ===== DOM 元素快取 =====
        const alertBox = moduleRoot.querySelector('[data-role-permissions-alert]');
        const filterForm = moduleRoot.querySelector('[data-role-permissions-filter]');
        const tableElement = moduleRoot.querySelector('[data-role-permissions-table]');
        const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
        const paginationContainer = moduleRoot.querySelector('[data-role-permissions-pagination]');

        const modalOverlay = moduleRoot.querySelector('[data-role-permissions-modal]');
        const modalAlertBox = modalOverlay ? modalOverlay.querySelector('[data-role-permissions-modal-alert]') : null;
        const modalForm = modalOverlay ? modalOverlay.querySelector('[data-role-permissions-form]') : null;
        const modalTitle = modalOverlay ? modalOverlay.querySelector('[data-modal-title]') : null;
        const modalCloseButton = modalOverlay ? modalOverlay.querySelector('[data-action="close-modal"]') : null;
        const cancelButton = modalOverlay ? modalOverlay.querySelector('[data-action="cancel"]') : null;

        const headerCreateButton = moduleRoot.querySelector('.content-header [data-action="create"]');
        const resetFilterButton = moduleRoot.querySelector('[data-action="reset-filter"]');

        const roleSelect = modalForm ? modalForm.querySelector('select[name="role_id"]') : null;
        const permissionSelect = modalForm ? modalForm.querySelector('select[name="permission_id"]') : null;
        const filterRoleSelect = filterForm ? filterForm.querySelector('select[name="role_id"]') : null;

        // ===== 狀態管理 =====
        const state = {
            page: 1,
            perPage: 10,
            totalPages: 1,
            total: 0,
            roles: [],
            permissions: [],
        };

        let dataSyncHelper = null;

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
                console.warn(`role_permissions: 欄位不存在 - ${name}`);
            }
        }

        // ===== 輔助函式 =====
        // ===== 渲染函式 =====
        function renderLoadingRow() {
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center">資料載入中...</td></tr>';
            }
        }

        function renderTableRows(rows) {
            if (!tableBody) return;

            if (!rows || rows.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="3" class="text-center">尚無符合條件的資料。</td></tr>';
                return;
            }

            const html = rows.map((rp) => {
                return `
                    <tr data-role-id="${rp.role_id}" data-permission-id="${rp.permission_id}">
                        <td>${escapeHtml(rp.role_name) || '-'}</td>
                        <td>${escapeHtml(rp.permission_name) || '-'}</td>
                        <td class="table-actions">
                            <button type="button" class="btn text danger" data-action="delete" title="刪除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            tableBody.innerHTML = html;
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

        function populateRoleSelect(selectElement, roles, selectedValue = '') {
            if (!selectElement) return;
            const options = roles.map(r =>
                `<option value="${r.id}" ${r.id == selectedValue ? 'selected' : ''}>${escapeHtml(r.name)}</option>`
            ).join('');
            selectElement.innerHTML = '<option value="">請選擇角色</option>' + options;
        }

        function populatePermissionSelect(permissions) {
            if (!permissionSelect) return;
            const options = permissions.map(p =>
                `<option value="${p.id}">${escapeHtml(p.name)} - ${escapeHtml(p.description) || ''}</option>`
            ).join('');
            permissionSelect.innerHTML = '<option value="">請選擇權限</option>' + options;
        }

        // ===== API 呼叫 =====
        async function loadRolePermissions(page = 1) {
            hideAlert();
            renderLoadingRow();

            const formData = filterForm ? new FormData(filterForm) : new FormData();
            const params = new URLSearchParams();

            const roleId = (formData.get('role_id') || '').toString().trim();
            const perPageValue = parseInt((formData.get('perPage') || '10').toString(), 10);

            state.page = Math.max(1, page);
            state.perPage = Number.isFinite(perPageValue) && perPageValue > 0 ? perPageValue : 10;

            params.set('page', String(state.page));
            params.set('perPage', String(state.perPage));
            if (roleId !== '') {
                params.set('role_id', roleId);
            }

            try {
                const response = await fetch(`api/role_permissions/index.php?${params.toString()}`, {
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

                const rolePermissions = Array.isArray(result.data) ? result.data : [];

                // 更新角色與權限清單
                if (result.roles) {
                    state.roles = result.roles;
                    populateRoleSelect(filterRoleSelect, state.roles);
                    populateRoleSelect(roleSelect, state.roles);
                }
                if (result.permissions) {
                    state.permissions = result.permissions;
                    populatePermissionSelect(state.permissions);
                }

                renderTableRows(rolePermissions);

                if (result.pagination) {
                    state.page = result.pagination.page || state.page;
                    state.perPage = result.pagination.perPage || state.perPage;
                    state.totalPages = result.pagination.totalPages || 1;
                    state.total = result.pagination.total || rolePermissions.length;
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
                role_id: parseInt((formData.get('role_id') || '0').toString(), 10),
                permission_id: parseInt((formData.get('permission_id') || '0').toString(), 10),
            };

            if (!payload.role_id || !payload.permission_id) {
                showModalAlert('error', '請選擇角色和權限。');
                return;
            }

            try {
                const response = await fetch('api/role_permissions/index.php', {
                    method: 'POST',
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
                    throw new Error(result.message || '新增失敗。');
                }

                showAlert('success', result.message || '新增成功。');
                closeModal(true);
                loadRolePermissions(state.page);

                if (dataSyncHelper) {
                    dataSyncHelper.notifyCreated(result.data);
                }
            } catch (error) {
                console.error(error);
                showModalAlert('error', error.message || '新增失敗，請稍後再試。');
            }
        }

        async function handleDelete(roleId, permissionId) {
            if (!confirm('確定要刪除此角色權限關聯嗎？')) {
                return;
            }

            try {
                const response = await fetch(`api/role_permissions/delete.php?role_id=${roleId}&permission_id=${permissionId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' },
                });

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message || '刪除失敗。');
                }

                showAlert('success', result.message || '刪除成功。');
                loadRolePermissions(state.page);

                if (dataSyncHelper) {
                    dataSyncHelper.notifyDeleted({ role_id: roleId, permission_id: permissionId });
                }
            } catch (error) {
                console.error(error);
                showAlert('error', error.message || '刪除失敗，請稍後再試。');
            }
        }

        // ===== Modal 處理 =====
        function openModal() {
            if (!modalOverlay || !modalForm) return;

            modalForm.reset();
            hideModalAlert();

            if (modalTitle) {
                modalTitle.textContent = '新增角色權限';
            }

            modalOverlay.classList.remove('hidden');

            if (roleSelect) roleSelect.focus();
        }

        function closeModal(force = false) {
            if (!modalOverlay || modalOverlay.classList.contains('hidden')) return;

            if (modalForm) modalForm.reset();
            modalOverlay.classList.add('hidden');
            hideModalAlert();
        }

        // ===== 事件綁定 =====
        if (tableBody) {
            tableBody.addEventListener('click', (event) => {
                const button = event.target.closest('[data-action]');
                if (!button) return;

                const action = button.dataset.action;
                const row = button.closest('tr');
                const roleId = row ? parseInt(row.dataset.roleId, 10) : null;
                const permissionId = row ? parseInt(row.dataset.permissionId, 10) : null;

                if (!roleId || !permissionId) return;

                if (action === 'delete') {
                    handleDelete(roleId, permissionId);
                }
            });
        }

        if (paginationContainer) {
            paginationContainer.addEventListener('click', (event) => {
                const button = event.target.closest('[data-page]');
                if (button && !button.disabled) {
                    loadRolePermissions(parseInt(button.dataset.page, 10));
                }
            });
        }

        if (filterForm) {
            filterForm.addEventListener('submit', (event) => {
                event.preventDefault();
                loadRolePermissions(1);
            });
        }

        if (resetFilterButton) {
            resetFilterButton.addEventListener('click', () => {
                if (filterForm) filterForm.reset();
                loadRolePermissions(1);
            });
        }

        if (headerCreateButton) {
            headerCreateButton.addEventListener('click', () => openModal());
        }

        if (modalForm) {
            modalForm.addEventListener('submit', handleSubmit);
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

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modalOverlay && !modalOverlay.classList.contains('hidden')) {
                closeModal();
            }
        });

        // ===== 初始化 =====
        loadRolePermissions(1);

        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('role_permissions', {
                onRefresh: () => loadRolePermissions(state.page)
            });
        }
    }

    window.initializeRolePermissionsModule = initializeRolePermissionsModule;
})();
