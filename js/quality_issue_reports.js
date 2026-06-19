/**
 * quality_issue_reports 模組
 *
 * 處理品質異常報告的前端邏輯
 *
 * @file   js/quality_issue_reports.js
 */
(function () {
    'use strict';

    const API_BASE = 'api/quality_issue_reports';

    /* =====================
     * 初始化
     * ===================== */
    function initializeQualityIssueReportsModule(container) {
        const moduleRoot = container.querySelector('[data-module="quality_issue_reports"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        const state = {
            page: 1,
            perPage: 20,
            status: '',
            reportedBy: '',
            dateFrom: '',
            dateTo: '',
            keyword: '',
            employees: [],
            departments: [],
            statusOptions: [],
            sourceTypeOptions: [],
            editingId: null,
        };

        let dataSyncHelper = null;

        // DOM 參照
        const $alert       = moduleRoot.querySelector('[data-quality-issue-reports-alert]');
        const $table       = moduleRoot.querySelector('[data-quality-issue-reports-table]');
        const $tbody       = $table ? $table.querySelector('tbody') : null;
        const $pagination  = moduleRoot.querySelector('[data-quality-issue-reports-pagination]');
        const $filter      = moduleRoot.querySelector('[data-quality-issue-reports-filter]');
        const $modal       = moduleRoot.querySelector('[data-quality-issue-reports-modal]');
        const $modalTitle  = moduleRoot.querySelector('[data-modal-title]');
        const $modalAlert  = moduleRoot.querySelector('[data-quality-issue-reports-modal-alert]');
        const $form        = moduleRoot.querySelector('[data-quality-issue-reports-form]');
        const $detailModal = moduleRoot.querySelector('[data-quality-issue-reports-detail-modal]');
        const $detailContent = moduleRoot.querySelector('[data-quality-issue-reports-details]');

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
                $modalTitle.textContent = editMode ? '編輯品質異常報告' : '新增品質異常報告';
            }
            populateDropdowns();
            if (editMode && data) {
                fillForm(data);
            } else {
                // 預設報告時間
                const now = new Date();
                const datetime = now.toISOString().slice(0, 16);
                if ($form) {
                    const dtInput = $form.querySelector('[name="report_datetime"]');
                    if (dtInput) dtInput.value = datetime;
                }
            }
            $modal && $modal.classList.remove('hidden');
        }
        function closeModal() {
            $modal && $modal.classList.add('hidden');
            hideAlert($modalAlert);
            state.editingId = null;
        }
        function openDetailModal() {
            $detailModal && $detailModal.classList.remove('hidden');
        }
        function closeDetailModal() {
            $detailModal && $detailModal.classList.add('hidden');
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
                    console.warn(`quality_issue_reports: 欄位不存在 - ${name}`);
                }
            }

            setFieldValue('id', data.id);
            setFieldValue('report_datetime', data.report_datetime ? data.report_datetime.replace(' ', 'T').slice(0, 16) : '');
            setFieldValue('reported_by_employee_id', data.reported_by_employee_id);
            setFieldValue('issue_source_type', data.issue_source_type);
            setFieldValue('issue_source_id', data.issue_source_id);
            setFieldValue('issue_description', data.issue_description);
            setFieldValue('root_cause_analysis', data.root_cause_analysis);
            setFieldValue('corrective_actions', data.corrective_actions);
            setFieldValue('preventive_actions', data.preventive_actions);
            setFieldValue('responsible_department_id', data.responsible_department_id);
            setFieldValue('status', data.status || 'pending');
            setFieldValue('completion_date', data.completion_date ? data.completion_date.slice(0, 10) : '');
        }

        /* ---------- 下拉選單填充 ---------- */
        function populateDropdowns() {
            // 員工
            const empSelect = $form ? $form.querySelector('[name="reported_by_employee_id"]') : null;
            if (empSelect) {
                empSelect.innerHTML = '<option value="">請選擇</option>';
                state.employees.forEach(e => {
                    const opt = document.createElement('option');
                    opt.value = e.id;
                    opt.textContent = `${e.employee_number} - ${e.name}`;
                    empSelect.appendChild(opt);
                });
            }
            // 部門
            const deptSelect = $form ? $form.querySelector('[name="responsible_department_id"]') : null;
            if (deptSelect) {
                deptSelect.innerHTML = '<option value="">請選擇</option>';
                state.departments.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = d.id;
                    opt.textContent = d.name;
                    deptSelect.appendChild(opt);
                });
            }
            // 狀態
            const statusSelect = $form ? $form.querySelector('[name="status"]') : null;
            if (statusSelect) {
                statusSelect.innerHTML = '';
                state.statusOptions.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.value;
                    opt.textContent = s.label;
                    statusSelect.appendChild(opt);
                });
            }
            // 異常來源類型
            const sourceSelect = $form ? $form.querySelector('[name="issue_source_type"]') : null;
            if (sourceSelect) {
                sourceSelect.innerHTML = '<option value="">請選擇</option>';
                state.sourceTypeOptions.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.value;
                    opt.textContent = s.label;
                    sourceSelect.appendChild(opt);
                });
            }
        }

        /* ---------- 篩選器下拉填充 ---------- */
        function populateFilterDropdowns() {
            const statusSelect = $filter ? $filter.querySelector('[name="status"]') : null;
            if (statusSelect && statusSelect.options.length <= 1) {
                state.statusOptions.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.value;
                    opt.textContent = s.label;
                    statusSelect.appendChild(opt);
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
                if (state.status) params.append('status', state.status);
                if (state.reportedBy) params.append('reported_by_employee_id', state.reportedBy);
                if (state.dateFrom) params.append('date_from', state.dateFrom);
                if (state.dateTo) params.append('date_to', state.dateTo);
                if (state.keyword) params.append('keyword', state.keyword);

                const resp = await fetch(`${API_BASE}/?${params}`);
                const json = await resp.json();
                if (!resp.ok) throw new Error(json.error || '載入失敗');

                state.employees        = json.employees || [];
                state.departments      = json.departments || [];
                state.statusOptions    = json.statusOptions || [];
                state.sourceTypeOptions= json.sourceTypeOptions || [];
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
                    <td>${escapeHtml(r.report_datetime)}</td>
                    <td>${escapeHtml(r.reported_by_number)} - ${escapeHtml(r.reported_by_name)}</td>
                    <td>${escapeHtml(getSourceTypeLabel(r.issue_source_type))}</td>
                    <td class="text-truncate" title="${escapeHtml(r.issue_description)}">${escapeHtml(r.issue_description.substring(0, 30))}${r.issue_description.length > 30 ? '...' : ''}</td>
                    <td><span class="status-badge ${getStatusBadge(r.status)}">${escapeHtml(getStatusLabel(r.status))}</span></td>
                    <td>
                        <button type="button" class="btn text" data-action="view" data-id="${r.id}" title="檢視">
                            <i class="fas fa-eye"></i>
                        </button>
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

        function getSourceTypeLabel(val) {
            const opt = state.sourceTypeOptions.find(o => o.value === val);
            return opt ? opt.label : val;
        }
        function getStatusLabel(val) {
            const opt = state.statusOptions.find(o => o.value === val);
            return opt ? opt.label : val;
        }
        function getStatusBadge(status) {
            const map = {
                'pending': 'pending',
                'in_progress': 'in-progress',
                'resolved': 'completed',
                'closed': 'cancelled',
            };
            return map[status] || 'pending';
        }

        /* ---------- 分頁 ---------- */
        function renderPagination(json) {
            if (!$pagination) return;

            let dataSyncHelper = null;
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
                report_datetime:           formData.get('report_datetime').replace('T', ' ') + ':00',
                reported_by_employee_id:   parseInt(formData.get('reported_by_employee_id'), 10),
                issue_source_type:         formData.get('issue_source_type'),
                issue_source_id:           formData.get('issue_source_id') || null,
                issue_description:         formData.get('issue_description'),
                root_cause_analysis:       formData.get('root_cause_analysis'),
                corrective_actions:        formData.get('corrective_actions'),
                preventive_actions:        formData.get('preventive_actions'),
                responsible_department_id: formData.get('responsible_department_id') || null,
                status:                    formData.get('status'),
                completion_date:           formData.get('completion_date') || null,
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

        /* ---------- 檢視 ---------- */
        async function handleView(id) {
            try {
                const resp = await fetch(`${API_BASE}/show.php?id=${id}`);
                const json = await resp.json();
                if (!resp.ok) throw new Error(json.error || '載入失敗');
                renderDetail(json.data);
                openDetailModal();
            } catch (err) {
                showAlert($alert, err.message);
            }
        }

        function renderDetail(data) {
            if (!$detailContent) return;
            $detailContent.innerHTML = `
                <div class="detail-grid">
                    <div class="detail-item"><label>ID</label><span>${data.id}</span></div>
                    <div class="detail-item"><label>報告時間</label><span>${escapeHtml(data.report_datetime)}</span></div>
                    <div class="detail-item"><label>報告者</label><span>${escapeHtml(data.reported_by_number)} - ${escapeHtml(data.reported_by_name)}</span></div>
                    <div class="detail-item"><label>狀態</label><span class="status-badge ${getStatusBadge(data.status)}">${escapeHtml(getStatusLabel(data.status))}</span></div>
                    <div class="detail-item"><label>異常來源類型</label><span>${escapeHtml(getSourceTypeLabel(data.issue_source_type))}</span></div>
                    <div class="detail-item"><label>異常來源ID</label><span>${data.issue_source_id || '-'}</span></div>
                    <div class="detail-item"><label>責任部門</label><span>${escapeHtml(data.responsible_department_name) || '-'}</span></div>
                    <div class="detail-item"><label>完成日期</label><span>${data.completion_date || '-'}</span></div>
                    <div class="detail-item full-width"><label>異常描述</label><span>${escapeHtml(data.issue_description)}</span></div>
                    <div class="detail-item full-width"><label>根本原因分析</label><span>${escapeHtml(data.root_cause_analysis) || '-'}</span></div>
                    <div class="detail-item full-width"><label>矯正措施</label><span>${escapeHtml(data.corrective_actions) || '-'}</span></div>
                    <div class="detail-item full-width"><label>預防措施</label><span>${escapeHtml(data.preventive_actions) || '-'}</span></div>
                </div>
            `;
            $detailContent.dataset.currentId = data.id;
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
            if (!confirm('確定要刪除此品質異常報告嗎？')) return;

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
                case 'view':
                    handleView(id);
                    break;
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
                case 'close-detail-modal':
                    closeDetailModal();
                    break;
                case 'edit-from-detail':
                    const currentId = $detailContent ? $detailContent.dataset.currentId : null;
                    if (currentId) {
                        closeDetailModal();
                        handleEdit(currentId);
                    }
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
                state.status = fd.get('status') || '';
                state.dateFrom = fd.get('date_from') || '';
                state.dateTo = fd.get('date_to') || '';
                state.keyword = fd.get('keyword') || '';
                state.perPage = parseInt(fd.get('perPage'), 10) || 20;
                state.page = 1;
                loadData();
            });
            $filter.addEventListener('click', e => {
                if (e.target.closest('[data-action="reset-filter"]')) {
                    $filter.reset();
                    state.status = '';
                    state.reportedBy = '';
                    state.dateFrom = '';
                    state.dateTo = '';
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
            dataSyncHelper = DataSync.createModuleHelper('quality_issue_reports', {
                onRefresh: loadData
            });
        }

        // 初始載入
        loadData();
    }

    window.initializeQualityIssueReportsModule = initializeQualityIssueReportsModule;
})();
