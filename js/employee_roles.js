/**
 * employee_roles 模組
 *
 * 處理員工角色關聯的前端邏輯
 *
 * @file   js/employee_roles.js
 */
(function () {
    'use strict';

    const API_BASE = 'api/employee_roles';

    /* =====================
     * 初始化
     * ===================== */
    function initializeEmployeeRolesModule(container) {
        const moduleRoot = container.querySelector('[data-module="employee_roles"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        const state = {
            page: 1,
            perPage: 20,
            employeeId: '',
            roleId: '',
            employees: [],
            roles: [],
        };

        let dataSyncHelper = null;

        // DOM 參照
        const $alert       = moduleRoot.querySelector('[data-employee-roles-alert]');
        const $table       = moduleRoot.querySelector('[data-employee-roles-table]');
        const $tbody       = $table ? $table.querySelector('tbody') : null;
        const $pagination  = moduleRoot.querySelector('[data-employee-roles-pagination]');
        const $filter      = moduleRoot.querySelector('[data-employee-roles-filter]');
        const $modal       = moduleRoot.querySelector('[data-employee-roles-modal]');
        const $modalAlert  = moduleRoot.querySelector('[data-employee-roles-modal-alert]');
        const $form        = moduleRoot.querySelector('[data-employee-roles-form]');

        /* ---------- 訊息顯示 ---------- */
        function showAlert(el, msg, type = 'error') {
            if (!el) return;
            el.textContent = msg;
            el.className = `module-alert ${type}`;
            el.classList.remove('hidden');
        }
        function hideAlert(el) {
            if (!el) return;
            el.classList.add('hidden');
            el.textContent = '';
        }

        function setFieldValue(name, value) {
            if (!$form) {
                return;
            }

            const field = $form.querySelector(`[name="${name}"]`);
            if (field) {
                field.value = value || '';
            } else {
                console.warn(`employee_roles: 欄位不存在 - ${name}`);
            }
        }

        function getApiMessage(json, fallback) {
            if (json && typeof json === 'object') {
                if (typeof json.message === 'string' && json.message.trim()) {
                    return json.message.trim();
                }
                if (typeof json.error === 'string' && json.error.trim()) {
                    return json.error.trim();
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

        /* ---------- Modal ---------- */
        function openModal() {
            hideAlert($modalAlert);
            if ($form) $form.reset();
            populateDropdowns();
            $modal && $modal.classList.remove('hidden');
        }
        function closeModal() {
            $modal && $modal.classList.add('hidden');
            hideAlert($modalAlert);
        }

        /* ---------- 下拉選單填充 ---------- */
        function populateDropdowns() {
            // 員工下拉
            const employeeSelect = $form ? $form.querySelector('[name="employee_id"]') : null;
            if (employeeSelect) {
                employeeSelect.innerHTML = '<option value="">請選擇員工</option>';
                state.employees.forEach(e => {
                    const opt = document.createElement('option');
                    opt.value = e.id;
                    opt.textContent = `${e.employee_number} - ${e.name}`;
                    employeeSelect.appendChild(opt);
                });
            }
            // 角色下拉
            const roleSelect = $form ? $form.querySelector('[name="role_id"]') : null;
            if (roleSelect) {
                roleSelect.innerHTML = '<option value="">請選擇角色</option>';
                state.roles.forEach(r => {
                    const opt = document.createElement('option');
                    opt.value = r.id;
                    opt.textContent = r.name;
                    roleSelect.appendChild(opt);
                });
            }
        }

        /* ---------- 篩選器下拉填充 ---------- */
        function populateFilterDropdowns() {
            const employeeSelect = $filter ? $filter.querySelector('[name="employee_id"]') : null;
            if (employeeSelect && employeeSelect.options.length <= 1) {
                state.employees.forEach(e => {
                    const opt = document.createElement('option');
                    opt.value = e.id;
                    opt.textContent = `${e.employee_number} - ${e.name}`;
                    employeeSelect.appendChild(opt);
                });
            }
        }

        /* ---------- 載入資料 ---------- */
        async function loadData() {
            try {
                const params = new URLSearchParams({
                    page: state.page,
                    perPage: state.perPage,
                });
                if (state.employeeId) params.append('employee_id', state.employeeId);
                if (state.roleId) params.append('role_id', state.roleId);

                const resp = await fetch(`${API_BASE}/?${params}`);
                const json = await parseJsonSafe(resp);
                if (!resp.ok) {
                    throw new Error(getApiMessage(json, '載入失敗'));
                }

                state.employees = json.employees || [];
                state.roles     = json.roles || [];
                populateFilterDropdowns();
                renderTable(json.data || []);
                renderPagination(json);
                hideAlert($alert);
            } catch (err) {
                showAlert($alert, err.message);
            }
        }

        /* ---------- 渲染表格 ---------- */
        function renderTable(rows) {
            if (!$tbody) return;
            if (!rows.length) {
                $tbody.innerHTML = '<tr><td colspan="3" class="text-center">無資料</td></tr>';
                return;
            }
            $tbody.innerHTML = rows.map(r => `
                <tr>
                    <td>${escapeHtml(r.employee_number)} - ${escapeHtml(r.employee_name)}</td>
                    <td>${escapeHtml(r.role_name)}</td>
                    <td>
                        <button type="button" class="btn text danger" data-action="delete" data-employee-id="${r.employee_id}" data-role-id="${r.role_id}" title="刪除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }

        /* ---------- 分頁 ---------- */
        function renderPagination(json) {
            if (!$pagination) return;
            const { page, totalPages, total } = json.pagination || json;
            if (totalPages <= 1) {
                $pagination.innerHTML = `<span class="page-info">共 ${Number(total)} 筆</span>`;
                return;
            }
            let html = `<span class="page-info">第 ${page} / ${totalPages} 頁，共 ${total} 筆</span>`;
            html += `<button type="button" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>上一頁</button>`;
            html += `<button type="button" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>下一頁</button>`;
            $pagination.innerHTML = html;
        }

        /* ---------- 新增 ---------- */
        async function employeeRoleExists(employeeId, roleId) {
            const params = new URLSearchParams({
                page: '1',
                perPage: '1',
                employee_id: String(employeeId),
                role_id: String(roleId),
            });

            const resp = await fetch(`${API_BASE}/?${params}`);
            const json = await parseJsonSafe(resp);
            if (!resp.ok) {
                throw new Error(getApiMessage(json, '檢查角色關聯失敗'));
            }

            return Array.isArray(json.data) && json.data.length > 0;
        }

        async function handleCreate(formData) {
            const payload = {
                employee_id: parseInt(formData.get('employee_id'), 10),
                role_id:     parseInt(formData.get('role_id'), 10),
            };

            if (await employeeRoleExists(payload.employee_id, payload.role_id)) {
                throw new Error('此員工已擁有該角色');
            }

            const resp = await fetch(`${API_BASE}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const json = await parseJsonSafe(resp);
            if (!resp.ok) {
                throw new Error(getApiMessage(json, '新增失敗'));
            }

            closeModal();
            showAlert($alert, '員工角色新增成功', 'success');
            loadData();

            if (dataSyncHelper) {
                dataSyncHelper.notifyCreated(json.data);
            }
        }

        /* ---------- 刪除 ---------- */
        async function handleDelete(employeeId, roleId) {
            if (!await window.AppFeedback.confirm({ title: '移除員工角色', message: '確定要移除此員工角色關聯嗎？', impact: '員工登入後可使用的功能權限' })) return;

            try {
                const resp = await fetch(`${API_BASE}/delete.php?employee_id=${employeeId}&role_id=${roleId}`, {
                    method: 'DELETE',
                });
                const json = await parseJsonSafe(resp);
                if (!resp.ok) {
                    throw new Error(getApiMessage(json, '刪除失敗'));
                }

                showAlert($alert, '員工角色刪除成功', 'success');
                loadData();

                if (dataSyncHelper) {
                    dataSyncHelper.notifyDeleted({ employee_id: employeeId, role_id: roleId });
                }
            } catch (err) {
                showAlert($alert, err.message);
            }
        }

        /* ---------- 事件監聽 ---------- */
        // Header 新增按鈕
        const headerContainer = moduleRoot.querySelector('.content-header.with-actions');
        if (headerContainer) {
            headerContainer.addEventListener('click', e => {
                if (e.target.closest('[data-action="create"]')) {
                    openModal();
                }
            });
        }

        // 表格 & Modal 按鈕
        moduleRoot.addEventListener('click', e => {
            const btn = e.target.closest('button[data-action]');
            if (!btn) return;
            const action = btn.dataset.action;

            if (action === 'delete') {
                const employeeId = btn.dataset.employeeId;
                const roleId = btn.dataset.roleId;
                handleDelete(employeeId, roleId);
            } else if (action === 'close-modal' || action === 'cancel') {
                closeModal();
            }
        });

        // 分頁
        if ($pagination) {
            $pagination.addEventListener('click', e => {
                const btn = e.target.closest('button[data-page]');
                if (btn && !btn.disabled) {
                    state.page = parseInt(btn.dataset.page, 10);
                    loadData();
                }
            });
        }

        // 篩選表單
        if ($filter) {
            $filter.addEventListener('submit', e => {
                e.preventDefault();
                const fd = new FormData($filter);
                state.employeeId = fd.get('employee_id') || '';
                state.perPage = parseInt(fd.get('perPage'), 10) || 20;
                state.page = 1;
                loadData();
            });
            $filter.addEventListener('click', e => {
                if (e.target.closest('[data-action="reset-filter"]')) {
                    $filter.reset();
                    state.employeeId = '';
                    state.roleId = '';
                    state.page = 1;
                    loadData();
                }
            });
        }

        // 表單送出
        if ($form) {
            $form.addEventListener('submit', async e => {
                e.preventDefault();
                hideAlert($modalAlert);
                try {
                    await handleCreate(new FormData($form));
                } catch (err) {
                    showAlert($modalAlert, err.message);
                }
            });
        }

        /* ---------- 工具函式 ---------- */
        // DataSync 訂閱
        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('employee_roles', {
                onRefresh: loadData
            });
        }

        // 初始載入
        loadData();
    }

    window.initializeEmployeeRolesModule = initializeEmployeeRolesModule;
})();
