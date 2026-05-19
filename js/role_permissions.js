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

        const resetFilterButton = moduleRoot.querySelector('[data-action="reset-filter"]');
        const availableRoleMultiSelect = modalForm ? modalForm.querySelector('select[name="available_role_ids"]') : null;
        const roleMultiSelect = modalForm ? modalForm.querySelector('select[name="role_ids"]') : null;
        const transferControlsContainer = modalForm ? modalForm.querySelector('[data-role-permissions-transfer-controls]') : null;
        const permissionNameInput = modalForm ? modalForm.querySelector('[name="permission_name"]') : null;
        const permissionIdInput = modalForm ? modalForm.querySelector('[name="permission_id"]') : null;
        const filterPermissionSelect = filterForm ? filterForm.querySelector('[name="permission_id"]') : null;

        const state = {
            page: 1,
            perPage: 10,
            totalPages: 1,
            total: 0,
            roles: [],
            permissions: [],
            rows: [],
        };

        let dataSyncHelper = null;

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
            if (modalWindow) {
                modalWindow.scrollTop = 0;
            }
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

        function getApiMessage(result, fallback) {
            if (!result || typeof result !== 'object') {
                return fallback;
            }

            if (typeof result.message === 'string' && result.message.trim()) {
                return result.message.trim();
            }

            if (typeof result.error === 'string' && result.error.trim()) {
                return result.error.trim();
            }

            if (result.errors && typeof result.errors === 'object') {
                const messages = Object.values(result.errors).filter(Boolean);
                if (messages.length > 0) {
                    return messages.join('、');
                }
            }

            return fallback;
        }

        async function parseJsonSafe(response) {
            try {
                return await response.json();
            } catch (error) {
                return {};
            }
        }

        function renderLoadingRow() {
            if (!tableBody) return;
            tableBody.innerHTML = '<tr><td colspan="3" class="text-center">資料載入中...</td></tr>';
        }

        function renderTableRows(rows) {
            if (!tableBody) return;

            if (!rows || rows.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="3" class="text-center">尚無符合條件的資料。</td></tr>';
                return;
            }

            const html = rows.map((item) => {
                const permissionDisplayName = item.permission_display_name || item.permission_name || '-';
                const rolesSummary = item.roles_summary || '尚未指派角色';
                const permissionId = Number(item.permission_id) || 0;

                return `
                    <tr data-permission-id="${permissionId}">
                        <td>${escapeHtml(permissionDisplayName)}</td>
                        <td>${escapeHtml(rolesSummary)}</td>
                        <td class="table-actions">
                            <button type="button" class="btn text" data-action="edit" title="編輯">
                                <i class="fas fa-edit"></i>
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

        function populatePermissionFilterOptions(selectedValue = '') {
            if (!filterPermissionSelect) return;

            const options = state.permissions.map(permission => {
                const displayName = permission.display_name || permission.name || '';
                const selected = Number(permission.id) === Number(selectedValue) ? ' selected' : '';
                return `<option value="${permission.id}"${selected}>${escapeHtml(displayName)}</option>`;
            }).join('');

            filterPermissionSelect.innerHTML = '<option value="">全部權限</option>' + options;
        }

        function sortSelectOptions(selectElement) {
            if (!selectElement) {
                return;
            }

            const options = Array.from(selectElement.options);
            options.sort((a, b) => a.text.localeCompare(b.text, 'zh-Hant'));

            selectElement.innerHTML = '';
            options.forEach(option => {
                option.selected = false;
                selectElement.appendChild(option);
            });
        }

        function moveSelectedOptions(sourceSelect, targetSelect) {
            if (!sourceSelect || !targetSelect) {
                return;
            }

            const selectedOptions = Array.from(sourceSelect.selectedOptions);
            if (selectedOptions.length === 0) {
                return;
            }

            const targetValues = new Set(Array.from(targetSelect.options).map(option => option.value));
            selectedOptions.forEach(option => {
                if (targetValues.has(option.value)) {
                    option.selected = false;
                    return;
                }

                const movedOption = option.cloneNode(true);
                movedOption.selected = false;
                targetSelect.appendChild(movedOption);
                option.remove();
            });

            sortSelectOptions(sourceSelect);
            sortSelectOptions(targetSelect);
        }

        function setupTransferControls() {
            if (!transferControlsContainer) {
                return;
            }

            transferControlsContainer.innerHTML = `
                <div class="role-permission-transfer-controls-box">
                    <button type="button" class="btn outline small" data-action="move-to-selected" title="加入右側">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                    <button type="button" class="btn outline small" data-action="move-to-available" title="移回左側">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                </div>
            `;
        }

        function populateRoleTransferLists(selectedRoleIds) {
            if (!availableRoleMultiSelect || !roleMultiSelect) {
                return;
            }

            const selectedSet = new Set((selectedRoleIds || []).map(id => Number(id)));
            const availableRoles = [];
            const selectedRoles = [];

            state.roles.forEach(role => {
                const roleId = Number(role.id);
                const roleName = role.name || '';
                const optionHtml = `<option value="${roleId}">${escapeHtml(roleName)}</option>`;

                if (selectedSet.has(roleId)) {
                    selectedRoles.push(optionHtml);
                } else {
                    availableRoles.push(optionHtml);
                }
            });

            availableRoleMultiSelect.innerHTML = availableRoles.join('');
            roleMultiSelect.innerHTML = selectedRoles.join('');

            sortSelectOptions(availableRoleMultiSelect);
            sortSelectOptions(roleMultiSelect);
        }

        function getSelectedRoleIds() {
            if (!roleMultiSelect) return [];

            return Array.from(roleMultiSelect.options)
                .map(option => Number(option.value))
                .filter(id => Number.isInteger(id) && id > 0);
        }

        function findRowByPermissionId(permissionId) {
            return state.rows.find(row => Number(row.permission_id) === Number(permissionId)) || null;
        }

        async function loadRolePermissions(page = 1) {
            hideAlert();
            renderLoadingRow();

            const formData = filterForm ? new FormData(filterForm) : new FormData();
            const params = new URLSearchParams();

            const permissionId = (formData.get('permission_id') || '').toString().trim();
            const perPageValue = parseInt((formData.get('perPage') || '10').toString(), 10);

            state.page = Math.max(1, page);
            state.perPage = Number.isFinite(perPageValue) && perPageValue > 0 ? perPageValue : 10;

            params.set('page', String(state.page));
            params.set('perPage', String(state.perPage));
            if (permissionId !== '') {
                params.set('permission_id', permissionId);
            }

            try {
                const response = await fetch(`api/role_permissions/index.php?${params.toString()}`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Accept': 'application/json' },
                });

                const result = await parseJsonSafe(response);

                if (!response.ok || !result.success) {
                    throw new Error(getApiMessage(result, `載入失敗（${response.status}）`));
                }

                state.rows = Array.isArray(result.data) ? result.data : [];
                state.roles = Array.isArray(result.roles) ? result.roles : [];
                state.permissions = Array.isArray(result.permissions) ? result.permissions : [];

                populatePermissionFilterOptions(permissionId);
                renderTableRows(state.rows);

                if (result.pagination) {
                    state.page = result.pagination.page || state.page;
                    state.perPage = result.pagination.perPage || state.perPage;
                    state.totalPages = result.pagination.totalPages || 1;
                    state.total = result.pagination.total || state.rows.length;
                }

                renderPagination();
            } catch (error) {
                console.error(error);
                state.rows = [];
                showAlert('error', error.message || '載入失敗，請稍後再試。');
                renderTableRows([]);
            }
        }

        function openEditModal(row) {
            if (!modalOverlay || !modalForm || !row) {
                return;
            }

            modalForm.reset();
            hideModalAlert();

            if (modalTitle) {
                modalTitle.textContent = '編輯權限可瀏覽角色';
            }

            const permissionName = row.permission_display_name || row.permission_name || '';
            const roleIds = Array.isArray(row.role_ids) ? row.role_ids : [];

            if (permissionNameInput) {
                permissionNameInput.value = permissionName;
            }
            if (permissionIdInput) {
                permissionIdInput.value = String(row.permission_id || '');
            }

            setFieldValue('permission_name', permissionName);
            setFieldValue('permission_id', row.permission_id || '');
            populateRoleTransferLists(roleIds);

            modalOverlay.classList.remove('hidden');

            if (availableRoleMultiSelect) {
                availableRoleMultiSelect.focus();
            }
        }

        function closeModal() {
            if (!modalOverlay || modalOverlay.classList.contains('hidden')) return;

            if (modalForm) {
                modalForm.reset();
            }

            modalOverlay.classList.add('hidden');
            hideModalAlert();
        }

        async function handleSubmit(event) {
            event.preventDefault();
            hideModalAlert();

            const permissionId = Number(permissionIdInput ? permissionIdInput.value : 0);
            const roleIds = getSelectedRoleIds();

            if (!permissionId) {
                showModalAlert('error', '權限資料遺失，請重新操作。', false);
                return;
            }

            try {
                const response = await fetch('api/role_permissions/index.php', {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        permission_id: permissionId,
                        role_ids: roleIds,
                    }),
                });

                const result = await parseJsonSafe(response);

                if (!response.ok || !result.success) {
                    throw new Error(getApiMessage(result, '更新失敗，請稍後再試。'));
                }

                closeModal();
                showAlert('success', result.message || '權限角色設定已更新。');
                await loadRolePermissions(state.page);

                if (dataSyncHelper) {
                    dataSyncHelper.notifyUpdated(result.data || { permission_id: permissionId, role_ids: roleIds });
                }
            } catch (error) {
                console.error(error);
                showModalAlert('error', error.message || '更新失敗，請稍後再試。', false);
            }
        }

        if (tableBody) {
            tableBody.addEventListener('click', (event) => {
                const button = event.target.closest('[data-action]');
                if (!button) return;
                if (button.dataset.action !== 'edit') return;

                const row = button.closest('tr');
                const permissionId = row ? parseInt(row.dataset.permissionId || '0', 10) : 0;
                if (!permissionId) return;

                const rowData = findRowByPermissionId(permissionId);
                openEditModal(rowData);
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
                if (filterForm) {
                    filterForm.reset();
                }
                loadRolePermissions(1);
            });
        }

        if (modalForm) {
            modalForm.addEventListener('submit', handleSubmit);
        }

        if (modalForm) {
            modalForm.addEventListener('click', (event) => {
                const button = event.target.closest('[data-action]');
                if (!button) {
                    return;
                }

                if (button.dataset.action === 'move-to-selected') {
                    moveSelectedOptions(availableRoleMultiSelect, roleMultiSelect);
                }

                if (button.dataset.action === 'move-to-available') {
                    moveSelectedOptions(roleMultiSelect, availableRoleMultiSelect);
                }
            });
        }

        if (availableRoleMultiSelect) {
            availableRoleMultiSelect.addEventListener('dblclick', () => {
                moveSelectedOptions(availableRoleMultiSelect, roleMultiSelect);
            });
        }

        if (roleMultiSelect) {
            roleMultiSelect.addEventListener('dblclick', () => {
                moveSelectedOptions(roleMultiSelect, availableRoleMultiSelect);
            });
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

        setupTransferControls();

        loadRolePermissions(1);

        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('role_permissions', {
                onRefresh: () => loadRolePermissions(state.page)
            });
        }
    }

    window.initializeRolePermissionsModule = initializeRolePermissionsModule;
})();
