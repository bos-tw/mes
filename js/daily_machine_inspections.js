/**
 * daily_machine_inspections 模組
 *
 * 處理每日機台檢驗的前端邏輯
 *
 * @file   js/daily_machine_inspections.js
 */
(function () {
    'use strict';

    const API_BASE = 'api/daily_machine_inspections';

    /* =====================
     * 初始化
     * ===================== */
    function initializeDailyMachineInspectionsModule(container) {
        const moduleRoot = container.querySelector('[data-module="daily_machine_inspections"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        const state = {
            page: 1,
            perPage: 20,
            machineId: '',
            inspectorId: '',
            isQualified: '',
            dateFrom: '',
            dateTo: '',
            machines: [],
            employees: [],
            editingId: null,
        };

        let dataSyncHelper = null;

        // DOM 參照
        const $alert       = moduleRoot.querySelector('[data-daily-machine-inspections-alert]');
        const $table       = moduleRoot.querySelector('[data-daily-machine-inspections-table]');
        const $tbody       = $table ? $table.querySelector('tbody') : null;
        const $pagination  = moduleRoot.querySelector('[data-daily-machine-inspections-pagination]');
        const $filter      = moduleRoot.querySelector('[data-daily-machine-inspections-filter]');
        const $modal       = moduleRoot.querySelector('[data-daily-machine-inspections-modal]');
        const $modalTitle  = moduleRoot.querySelector('[data-modal-title]');
        const $modalAlert  = moduleRoot.querySelector('[data-daily-machine-inspections-modal-alert]');
        const $form        = moduleRoot.querySelector('[data-daily-machine-inspections-form]');

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

        function setFieldValue(name, value, form = $form) {
            if (!form) return;
            const field = form.querySelector(`[name="${name}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = !!value;
                } else {
                    field.value = value ?? '';
                }
            } else {
                console.warn(`daily_machine_inspections: 欄位不存在 - ${name}`);
            }
        }

        /* ---------- Modal ---------- */
        function openModal(editMode = false, data = null) {
            hideAlert($modalAlert);
            if ($form) $form.reset();
            state.editingId = editMode && data ? data.id : null;
            if ($modalTitle) {
                $modalTitle.textContent = editMode ? '編輯每日機台檢驗' : '新增每日機台檢驗';
            }
            populateDropdowns();
            if (editMode && data) {
                fillForm(data);
            } else {
                // 預設今天日期
                const today = new Date().toISOString().slice(0, 10);
                if ($form) {
                    const dateInput = $form.querySelector('[name="inspection_date"]');
                    if (dateInput) dateInput.value = today;
                }
            }
            $modal && $modal.classList.remove('hidden');
        }
        function closeModal() {
            $modal && $modal.classList.add('hidden');
            hideAlert($modalAlert);
            state.editingId = null;
        }

        /* ---------- 填入表單 ---------- */
        function fillForm(data) {
            if (!$form) return;

            const idField = $form.querySelector('[name="id"]');
            const dateField = $form.querySelector('[name="inspection_date"]');
            const machineField = $form.querySelector('[name="machine_id"]');
            const inspectorField = $form.querySelector('[name="inspector_id"]');
            const qualifiedField = $form.querySelector('[name="is_qualified"]');
            const notesField = $form.querySelector('[name="notes"]');

            if (idField) idField.value = data.id || '';
            if (dateField) dateField.value = data.inspection_date || '';
            if (machineField) machineField.value = data.machine_id || '';
            if (inspectorField) inspectorField.value = data.inspector_id || '';
            if (qualifiedField) qualifiedField.value = data.is_qualified ? '1' : '0';
            if (notesField) notesField.value = data.notes || '';
        }

        /* ---------- 下拉選單填充 ---------- */
        function populateDropdowns() {
            function getMachineCode(machine) {
                return machine.code || machine.machine_code || machine.machine_number || '';
            }

            function getMachineLabel(machine) {
                const code = getMachineCode(machine);
                const name = machine.name || machine.machine_name || '';
                if (code && name) return `${code} - ${name}`;
                return code || name || `機台 ${machine.id || ''}`.trim();
            }

            // 機台
            const machineSelect = $form ? $form.querySelector('[name="machine_id"]') : null;
            if (machineSelect) {
                machineSelect.innerHTML = '<option value="">請選擇</option>';
                state.machines.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.id;
                    opt.textContent = getMachineLabel(m);
                    machineSelect.appendChild(opt);
                });
            }
            // 檢驗員
            const inspectorSelect = $form ? $form.querySelector('[name="inspector_id"]') : null;
            if (inspectorSelect) {
                inspectorSelect.innerHTML = '<option value="">請選擇</option>';
                state.employees.forEach(e => {
                    const opt = document.createElement('option');
                    opt.value = e.id;
                    opt.textContent = `${e.employee_number} - ${e.name}`;
                    inspectorSelect.appendChild(opt);
                });
            }
        }

        /* ---------- 篩選器下拉填充 ---------- */
        function populateFilterDropdowns() {
            function getMachineCode(machine) {
                return machine.code || machine.machine_code || machine.machine_number || '';
            }

            function getMachineLabel(machine) {
                const code = getMachineCode(machine);
                const name = machine.name || machine.machine_name || '';
                if (code && name) return `${code} - ${name}`;
                return code || name || `機台 ${machine.id || ''}`.trim();
            }

            const machineSelect = $filter ? $filter.querySelector('[name="machine_id"]') : null;
            if (machineSelect && machineSelect.options.length <= 1) {
                state.machines.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.id;
                    opt.textContent = getMachineLabel(m);
                    machineSelect.appendChild(opt);
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
                if (state.machineId) params.append('machine_id', state.machineId);
                if (state.inspectorId) params.append('inspector_id', state.inspectorId);
                if (state.isQualified !== '') params.append('is_qualified', state.isQualified);
                if (state.dateFrom) params.append('date_from', state.dateFrom);
                if (state.dateTo) params.append('date_to', state.dateTo);

                const resp = await fetch(`${API_BASE}/?${params}`);
                const json = await resp.json();
                if (!resp.ok) throw new Error(json.error || '載入失敗');

                state.machines  = json.machines || [];
                state.employees = json.employees || [];
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
                $tbody.innerHTML = '<tr><td colspan="7" class="text-center">無資料</td></tr>';
                return;
            }
            $tbody.innerHTML = rows.map(r => `
                <tr>
                    <td>${escapeHtml(r.inspection_date)}</td>
                    <td>${escapeHtml(r.machine_code)} - ${escapeHtml(r.machine_name)}</td>
                    <td>${escapeHtml(r.inspector_number)} - ${escapeHtml(r.inspector_name)}</td>
                    <td><span class="status-badge ${r.is_qualified ? 'active' : 'inactive'}">${r.is_qualified ? '合格' : '不合格'}</span></td>
                    <td class="text-truncate" title="${escapeHtml(r.notes)}">${escapeHtml(r.notes ? r.notes.substring(0, 20) : '-')}${r.notes && r.notes.length > 20 ? '...' : ''}</td>
                    <td>
                        <button type="button" class="btn text" data-action="edit" data-id="${r.id}" title="編輯">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn text danger" data-action="delete" data-id="${r.id}" title="刪除">
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

        /* ---------- 新增/更新 ---------- */
        async function handleSubmit(formData) {
            const payload = {
                inspection_date: formData.get('inspection_date'),
                machine_id:      parseInt(formData.get('machine_id'), 10),
                inspector_id:    parseInt(formData.get('inspector_id'), 10),
                is_qualified:    formData.get('is_qualified') === '1',
                notes:           formData.get('notes'),
            };

            const isEdit = !!state.editingId;
            const url = isEdit ? `${API_BASE}/update.php?id=${state.editingId}` : `${API_BASE}/`;
            const method = isEdit ? 'PUT' : 'POST';

            const resp = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const json = await resp.json();
            if (!resp.ok) throw new Error(json.error || '操作失敗');

            closeModal();
            showAlert($alert, isEdit ? '更新成功' : '新增成功', 'success');
            loadData();

            if (dataSyncHelper) {
                if (isEdit) {
                    dataSyncHelper.notifyUpdated(json.data);
                } else {
                    dataSyncHelper.notifyCreated(json.data);
                }
            }
        }

        /* ---------- 編輯 ---------- */
        async function handleEdit(id) {
            try {
                const resp = await fetch(`${API_BASE}/show.php?id=${id}`);
                const json = await resp.json();
                if (!resp.ok) throw new Error(json.error || '載入失敗');
                openModal(true, json.data);
            } catch (err) {
                showAlert($alert, err.message);
            }
        }

        /* ---------- 刪除 ---------- */
        async function handleDelete(id) {
            if (!await window.AppFeedback.confirm({ title: '刪除機台檢驗', message: '確定要刪除此每日機台檢驗紀錄嗎？', impact: '機台點檢追溯資料' })) return;

            try {
                const resp = await fetch(`${API_BASE}/delete.php?id=${id}`, {
                    method: 'DELETE',
                });
                const json = await resp.json();
                if (!resp.ok) throw new Error(json.error || '刪除失敗');

                showAlert($alert, '刪除成功', 'success');
                loadData();

                if (dataSyncHelper) {
                    dataSyncHelper.notifyDeleted({ id });
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
            const id = btn.dataset.id;

            switch (action) {
                case 'edit':
                    handleEdit(id);
                    break;
                case 'delete':
                    handleDelete(id);
                    break;
                case 'close-modal':
                case 'cancel':
                    closeModal();
                    break;
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
                state.machineId = fd.get('machine_id') || '';
                state.isQualified = fd.get('is_qualified') ?? '';
                state.dateFrom = fd.get('date_from') || '';
                state.dateTo = fd.get('date_to') || '';
                state.perPage = parseInt(fd.get('perPage'), 10) || 20;
                state.page = 1;
                loadData();
            });
            $filter.addEventListener('click', e => {
                if (e.target.closest('[data-action="reset-filter"]')) {
                    $filter.reset();
                    state.machineId = '';
                    state.inspectorId = '';
                    state.isQualified = '';
                    state.dateFrom = '';
                    state.dateTo = '';
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
                    await handleSubmit(new FormData($form));
                } catch (err) {
                    showAlert($modalAlert, err.message);
                }
            });
        }

        /* ---------- 工具函式 ---------- */
        // DataSync 訂閱
        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('daily_machine_inspections', {
                onRefresh: loadData
            });
        }

        // 初始載入
        loadData();
    }

    window.initializeDailyMachineInspectionsModule = initializeDailyMachineInspectionsModule;
})();
