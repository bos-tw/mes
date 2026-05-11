/**
 * daily_machine_inspection_items 模組
 *
 * 處理每日機台檢驗項目明細的前端邏輯
 *
 * @file   js/daily_machine_inspection_items.js
 */
(function () {
    'use strict';

    const API_BASE = 'api/daily_machine_inspection_items';

    /* =====================
     * 初始化
     * ===================== */
    function initializeDailyMachineInspectionItemsModule(container) {
        const moduleRoot = container.querySelector('[data-module="daily_machine_inspection_items"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        const state = {
            page: 1,
            perPage: 20,
            inspectionId: '',
            isPass: '',
            keyword: '',
            inspections: [],
            editingId: null,
        };

        let dataSyncHelper = null;

        // DOM 參照
        const $alert       = moduleRoot.querySelector('[data-daily-machine-inspection-items-alert]');
        const $table       = moduleRoot.querySelector('[data-daily-machine-inspection-items-table]');
        const $tbody       = $table ? $table.querySelector('tbody') : null;
        const $pagination  = moduleRoot.querySelector('[data-daily-machine-inspection-items-pagination]');
        const $filter      = moduleRoot.querySelector('[data-daily-machine-inspection-items-filter]');
        const $modal       = moduleRoot.querySelector('[data-daily-machine-inspection-items-modal]');
        const $modalTitle  = moduleRoot.querySelector('[data-modal-title]');
        const $modalAlert  = moduleRoot.querySelector('[data-daily-machine-inspection-items-modal-alert]');
        const $form        = moduleRoot.querySelector('[data-daily-machine-inspection-items-form]');

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

        /* ---------- Modal ---------- */
        function openModal(editMode = false, data = null) {
            hideAlert($modalAlert);
            if ($form) $form.reset();
            state.editingId = editMode && data ? data.id : null;
            if ($modalTitle) {
                $modalTitle.textContent = editMode ? '編輯檢驗項目明細' : '新增檢驗項目明細';
            }
            populateDropdowns();
            if (editMode && data) {
                fillForm(data);
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

            // 安全的欄位設定函數
            function setFieldValue(name, value) {
                const field = $form.querySelector(`[name="${name}"]`);
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = !!value;
                    } else {
                        field.value = value || '';
                    }
                } else {
                    console.warn(`daily_machine_inspection_items: 欄位不存在 - ${name}`);
                }
            }

            setFieldValue('id', data.id);
            setFieldValue('inspection_id', data.inspection_id);
            setFieldValue('item_name', data.item_name);
            setFieldValue('standard', data.standard);
            setFieldValue('actual_result', data.actual_result);
            setFieldValue('is_pass', data.is_pass ? '1' : '0');
            setFieldValue('remarks', data.remarks);
        }

        /* ---------- 下拉選單填充 ---------- */
        function populateDropdowns() {
            // 所屬檢驗紀錄
            const inspectionSelect = $form ? $form.querySelector('[name="inspection_id"]') : null;
            if (inspectionSelect) {
                inspectionSelect.innerHTML = '<option value="">請選擇</option>';
                state.inspections.forEach(i => {
                    const opt = document.createElement('option');
                    opt.value = i.id;
                    opt.textContent = `${i.inspection_date} - ${i.machine_code} ${i.machine_name}`;
                    inspectionSelect.appendChild(opt);
                });
            }
        }

        /* ---------- 篩選器下拉填充 ---------- */
        function populateFilterDropdowns() {
            const inspectionSelect = $filter ? $filter.querySelector('[name="inspection_id"]') : null;
            if (inspectionSelect && inspectionSelect.options.length <= 1) {
                state.inspections.forEach(i => {
                    const opt = document.createElement('option');
                    opt.value = i.id;
                    opt.textContent = `${i.inspection_date} - ${i.machine_code} ${i.machine_name}`;
                    inspectionSelect.appendChild(opt);
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
                if (state.inspectionId) params.append('inspection_id', state.inspectionId);
                if (state.isPass !== '') params.append('is_pass', state.isPass);
                if (state.keyword) params.append('keyword', state.keyword);

                const resp = await fetch(`${API_BASE}/?${params}`);
                const json = await resp.json();
                if (!resp.ok) throw new Error(json.error || '載入失敗');

                state.inspections = json.inspections || [];
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
                $tbody.innerHTML = '<tr><td colspan="8" class="text-center">無資料</td></tr>';
                return;
            }
            $tbody.innerHTML = rows.map(r => `
                <tr>
                    <td>${escapeHtml(r.inspection_date)} - ${escapeHtml(r.machine_code)}</td>
                    <td>${escapeHtml(r.item_name)}</td>
                    <td>${escapeHtml(r.standard) || '-'}</td>
                    <td>${escapeHtml(r.actual_result) || '-'}</td>
                    <td><span class="status-badge ${r.is_pass ? 'active' : 'inactive'}">${r.is_pass ? '通過' : '不通過'}</span></td>
                    <td class="text-truncate" title="${escapeHtml(r.remarks)}">${escapeHtml(r.remarks ? r.remarks.substring(0, 15) : '-')}${r.remarks && r.remarks.length > 15 ? '...' : ''}</td>
                    <td>
                        <button type="button" class="btn text" data-action="edit" data-id="${r.id}" title="編輯">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn text danger" data-action="delete" data-id="${r.id}" title="刪除">
                            <i class="fas fa-trash-alt"></i>
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
                inspection_id: parseInt(formData.get('inspection_id'), 10),
                item_name:     formData.get('item_name'),
                standard:      formData.get('standard'),
                actual_result: formData.get('actual_result'),
                is_pass:       formData.get('is_pass') === '1',
                remarks:       formData.get('remarks'),
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
            if (!confirm('確定要刪除此檢驗項目明細嗎？')) return;

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
                state.inspectionId = fd.get('inspection_id') || '';
                state.isPass = fd.get('is_pass') ?? '';
                state.keyword = fd.get('keyword') || '';
                state.perPage = parseInt(fd.get('perPage'), 10) || 20;
                state.page = 1;
                loadData();
            });
            $filter.addEventListener('click', e => {
                if (e.target.closest('[data-action="reset-filter"]')) {
                    $filter.reset();
                    state.inspectionId = '';
                    state.isPass = '';
                    state.keyword = '';
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
            dataSyncHelper = DataSync.createModuleHelper('daily_machine_inspection_items', {
                onRefresh: loadData
            });
        }

        // 初始載入
        loadData();
    }

    window.initializeDailyMachineInspectionItemsModule = initializeDailyMachineInspectionItemsModule;
})();
