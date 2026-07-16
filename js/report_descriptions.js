(function() {
    'use strict';

    // 使用全域 escapeHtml；若異常未載入 utils.js，提供安全 fallback 以避免整頁故障
    const safeEscapeHtml = typeof window.escapeHtml === 'function'
        ? window.escapeHtml
        : function(value) {
            if (value === null || value === undefined) return '';
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

    /**
     * 列印報表說明模組
     */
    function initializeReportDescriptionsModule(container) {
        const moduleRoot = container.querySelector('[data-module="report_descriptions"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        // DOM 元素
        const table = moduleRoot.querySelector('[data-report-descriptions-table]');
        const tbody = table ? table.querySelector('tbody') : null;
        const pagination = moduleRoot.querySelector('[data-report-descriptions-pagination]');
        const modal = moduleRoot.querySelector('[data-report-descriptions-modal]');
        const form = moduleRoot.querySelector('[data-report-descriptions-form]');
        const filterForm = moduleRoot.querySelector('[data-report-descriptions-filter]');
        const modalTitle = modal ? modal.querySelector('[data-modal-title]') : null;
        const moduleAlert = moduleRoot.querySelector('[data-report-descriptions-alert]');
        const modalAlert = modal ? modal.querySelector('[data-report-descriptions-modal-alert]') : null;

        // 狀態
        let currentPage = 1;
        let totalPages = 1;
        let perPage = 20;
        let sortField = 'report_code';
        let sortOrder = 'asc';
        let editingId = null;
        let filters = {
            keyword: '',
            is_active: ''
        };

        let dataSyncHelper = null;

        // 初始化
        init();

        function init() {
            bindEvents();
            if (typeof DataSync !== 'undefined') {
                dataSyncHelper = DataSync.createModuleHelper('report_descriptions', {
                    onRefresh: loadData
                });
            }
            loadData();
        }

        function bindEvents() {
            // 表頭排序
            if (table) {
                table.querySelectorAll('th[data-sort]').forEach(th => {
                    th.style.cursor = 'pointer';
                    th.addEventListener('click', () => {
                        const field = th.dataset.sort;
                        if (sortField === field) {
                            sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
                        } else {
                            sortField = field;
                            sortOrder = 'asc';
                        }
                        updateSortIcons();
                        loadData();
                    });
                });
            }

            // 按鈕事件
            moduleRoot.addEventListener('click', handleClick);

            // 表單提交
            if (form) {
                form.addEventListener('submit', handleSubmit);
            }

            // 篩選表單
            if (filterForm) {
                filterForm.addEventListener('submit', handleFilter);
            }
        }

        function handleClick(e) {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const id = target.dataset.id;
            const reportCode = target.dataset.reportCode;

            switch (action) {
                case 'create':
                    openModal();
                    break;
                case 'edit':
                    openModal(id);
                    break;
                case 'preview':
                    openPreview(reportCode);
                    break;
                case 'delete':
                    confirmDelete(id);
                    break;
                case 'close-modal':
                case 'cancel':
                    closeModal();
                    break;
                case 'prev-page':
                    if (currentPage > 1) {
                        currentPage--;
                        loadData();
                    }
                    break;
                case 'next-page':
                    if (currentPage < totalPages) {
                        currentPage++;
                        loadData();
                    }
                    break;
                case 'reset-filter':
                    resetFilter();
                    break;
                case 'goto-page':
                    const page = parseInt(target.dataset.page);
                    if (page && page !== currentPage) {
                        currentPage = page;
                        loadData();
                    }
                    break;
            }
        }

        function getPreviewUrl(reportCode) {
            const previewPageMap = {
                order_confirmation: 'print/order_confirmation_print.html?preview=1',
                return_order: 'print/return_order_print.html?preview=1',
                shipping_order: 'print/shipping_order_print.html?preview=1',
                screening_inspection: 'print/screening_inspection_print.html?preview=1',
                work_order: 'print/work_order_print.html?preview=1'
            };
            return previewPageMap[reportCode] || '';
        }

        function openPreview(reportCode) {
            const previewUrl = getPreviewUrl(reportCode);
            if (!previewUrl) {
                showAlert('此報表尚未提供預覽功能', 'error');
                return;
            }
            window.open(previewUrl, '_blank', 'noopener');
        }

        function handleFilter(e) {
            e.preventDefault();
            const formData = new FormData(filterForm);
            filters.keyword = formData.get('keyword') || '';
            filters.is_active = formData.get('is_active') || '';
            perPage = parseInt(formData.get('perPage')) || 20;
            currentPage = 1;
            loadData();
        }

        function resetFilter() {
            if (filterForm) {
                filterForm.reset();
            }
            filters = { keyword: '', is_active: '' };
            perPage = 20;
            currentPage = 1;
            loadData();
        }

        async function loadData() {
            try {
                const params = new URLSearchParams({
                    page: currentPage,
                    per_page: perPage,
                    sort: sortField,
                    order: sortOrder
                });

                // 加入篩選條件
                if (filters.keyword) {
                    params.append('keyword', filters.keyword);
                }
                if (filters.is_active !== '') {
                    params.append('is_active', filters.is_active);
                }

                const response = await fetch(`api/report_descriptions/index.php?${params}`, {
                    credentials: 'include'
                });
                const result = await response.json();

                if (!result.success) {
                    showAlert(result.message || '載入失敗', 'error');
                    return;
                }

                renderTable(result.data || []);
                renderPagination(result.pagination || {});
            } catch (error) {
                console.error('載入報表說明失敗:', error);
                showAlert('載入資料時發生錯誤', 'error');
            }
        }

        function renderTable(data) {
            if (!tbody) return;

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">目前沒有資料</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(item => {
                const descSummary = item.description ?
                    (item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description) : '-';
                const statusClass = item.is_active == 1 ? 'status-active' : 'status-inactive';
                const statusText = item.is_active == 1 ? '啟用' : '停用';
                const previewUrl = getPreviewUrl(item.report_code);

                // 根據 report_code 判斷使用報表
                let usedInText = '-';
                if (item.report_code === 'screening_inspection') {
                    usedInText = '品質檢驗報表';
                } else if (item.report_code === 'work_order') {
                    usedInText = '生產命令單';
                } else if (item.report_code === 'shipping_order') {
                    usedInText = '出貨單';
                } else if (item.report_code === 'return_order') {
                    usedInText = '退貨單';
                } else if (item.report_code === 'order_confirmation') {
                    usedInText = '客戶光篩代工委託確認單';
                }

                return `
                    <tr>
                        <td><code>${safeEscapeHtml(item.report_code)}</code></td>
                        <td>${safeEscapeHtml(item.report_name)}</td>
                        <td>${safeEscapeHtml(item.report_name_en) || '-'}</td>
                        <td class="text-muted">${safeEscapeHtml(usedInText)}</td>
                        <td title="${safeEscapeHtml(item.description || '')}">${safeEscapeHtml(descSummary)}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>${formatDateTime(item.updated_at)}</td>
                        <td>
                            ${previewUrl ? `
                            <button type="button" class="btn text" data-action="preview" data-report-code="${safeEscapeHtml(item.report_code)}" title="預覽空白表單">
                                <i class="fas fa-eye"></i>
                            </button>
                            ` : ''}
                            <button type="button" class="btn text" data-action="edit" data-id="${item.id}" title="編輯">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="btn text danger" data-action="delete" data-id="${item.id}" title="刪除">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        function renderPagination(paginationData) {
            if (!pagination) return;

            totalPages = paginationData.total_pages || 1;
            currentPage = paginationData.current_page || 1;
            const totalCount = paginationData.total_count || 0;

            if (totalPages <= 1) {
                pagination.innerHTML = totalCount > 0 ? `<span class="pagination-info">共 ${Number(totalCount)} 筆資料</span>` : '';
                return;
            }

            const prevDisabled = currentPage <= 1 ? 'disabled' : '';
            const nextDisabled = currentPage >= totalPages ? 'disabled' : '';

            pagination.innerHTML = `
                <button type="button" class="btn outline small" data-action="prev-page" ${prevDisabled}>
                    <i class="fas fa-chevron-left"></i> 上一頁
                </button>
                <span class="pagination-info">第 ${currentPage} / ${totalPages} 頁，共 ${totalCount} 筆</span>
                <button type="button" class="btn outline small" data-action="next-page" ${nextDisabled}>
                    下一頁 <i class="fas fa-chevron-right"></i>
                </button>
            `;
        }

        function updateSortIcons() {
            if (!table) return;

            table.querySelectorAll('th[data-sort]').forEach(th => {
                const icon = th.querySelector('i');
                if (!icon) return;

                if (th.dataset.sort === sortField) {
                    icon.className = sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
                } else {
                    icon.className = 'fas fa-sort';
                }
            });
        }

        async function openModal(id = null) {
            if (!modal || !form) return;

            editingId = id;
            form.reset();
            hideModalAlert();

            if (id) {
                // 編輯模式
                if (modalTitle) modalTitle.textContent = '編輯報表說明';
                try {
                    const response = await fetch(`api/report_descriptions/show.php?id=${id}`, {
                        credentials: 'include'
                    });
                    const result = await response.json();

                    if (!result.success) {
                        showAlert(result.message || '載入資料失敗', 'error');
                        return;
                    }

                    // 安全的欄位設定函數
                    function setFieldValue(name, value) {
                        const field = form.querySelector(`[name="${name}"]`);
                        if (field) {
                            if (field.type === 'checkbox') {
                                field.checked = !!value;
                            } else {
                                field.value = value || '';
                            }
                        } else {
                            console.warn(`report_descriptions: 欄位不存在 - ${name}`);
                        }
                    }

                    const data = result.data;
                    setFieldValue('id', data.id);
                    setFieldValue('report_code', data.report_code);
                    setFieldValue('report_name', data.report_name);
                    setFieldValue('report_name_en', data.report_name_en);
                    setFieldValue('description', data.description);
                    setFieldValue('description_en', data.description_en);
                    setFieldValue('is_active', data.is_active == null ? '1' : String(data.is_active));
                } catch (error) {
                    console.error('載入報表說明失敗:', error);
                    showAlert('載入資料時發生錯誤', 'error');
                    return;
                }
            } else {
                // 新增模式
                if (modalTitle) modalTitle.textContent = '新增報表說明';
                const field = form.querySelector('[name="is_active"]');
                if (field) field.value = '1';
            }

            modal.classList.remove('hidden');
        }

        function closeModal() {
            if (!modal) return;
            modal.classList.add('hidden');
            editingId = null;
        }

        async function handleSubmit(e) {
            e.preventDefault();

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // 驗證必填欄位
            if (!data.report_code || !data.report_name) {
                showModalAlert('請填寫必填欄位', 'error');
                return;
            }

            try {
                const url = editingId
                    ? 'api/report_descriptions/update.php'
                    : 'api/report_descriptions/index.php';

                const response = await fetch(url, {
                    method: editingId ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (!result.success) {
                    showModalAlert(result.message || '儲存失敗', 'error');
                    return;
                }

                closeModal();
                showAlert(editingId ? '更新成功' : '新增成功', 'success');
                if (dataSyncHelper) {
                    if (editingId) {
                        dataSyncHelper.notifyUpdated({ id: editingId });
                    } else {
                        dataSyncHelper.notifyCreated(data);
                    }
                }
                loadData();
            } catch (error) {
                console.error('儲存報表說明失敗:', error);
                showModalAlert('儲存時發生錯誤', 'error');
            }
        }

        async function confirmDelete(id) {
            if (!await window.AppFeedback.confirm({ title: '刪除報表說明', message: '確定要刪除此報表說明嗎？' })) return;

            try {
                const response = await fetch('api/report_descriptions/delete.php', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ id })
                });

                const result = await response.json();

                if (!result.success) {
                    showAlert(result.message || '刪除失敗', 'error');
                    return;
                }

                showAlert('刪除成功', 'success');
                if (dataSyncHelper) {
                    dataSyncHelper.notifyDeleted({ id });
                }
                loadData();
            } catch (error) {
                console.error('刪除報表說明失敗:', error);
                showAlert('刪除時發生錯誤', 'error');
            }
        }

        function showAlert(message, type = 'info') {
            if (!moduleAlert) return;
            moduleAlert.textContent = message;
            moduleAlert.className = `module-alert alert-${type}`;
            moduleAlert.classList.remove('hidden');
            setTimeout(() => moduleAlert.classList.add('hidden'), 5000);
        }

        function showModalAlert(message, type = 'error') {
            if (!modalAlert) return;
            modalAlert.textContent = message;
            modalAlert.className = `modal-alert alert-${type}`;
            modalAlert.classList.remove('hidden');
        }

        function hideModalAlert() {
            if (!modalAlert) return;
            modalAlert.classList.add('hidden');
        }

        function formatDateTime(dateStr) {
            if (!dateStr) return '-';
            const date = new Date(dateStr);
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const h = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            return `${y}-${m}-${d} ${h}:${min}`;
        }
    }

    window.initializeReportDescriptionsModule = initializeReportDescriptionsModule;
})();
