/**
 * Work Order Images Module
 * 工單圖片管理模組
 */
(function() {
    'use strict';

    function initializeWorkOrderImagesModule(container) {
        const moduleRoot = container.querySelector('[data-module="work_order_images"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') return;
        moduleRoot.dataset.initialised = 'true';

    // 狀態管理
    const state = {
        currentPage: 1,
        perPage: 20,
        totalItems: 0,
        totalPages: 1,
        filters: {
            keyword: '',
            image_type: '',
            start_date: '',
            end_date: ''
        }
    };

    let dataSyncHelper = null;

    // DOM 元素快取
    const elements = {
        alert: moduleRoot.querySelector('[data-image-alert]'),
        filterForm: moduleRoot.querySelector('[data-image-filter]'),
        table: moduleRoot.querySelector('[data-image-table] tbody'),
        pagination: moduleRoot.querySelector('[data-image-pagination]'),
        previewModal: moduleRoot.querySelector('[data-preview-modal]'),
        previewImage: moduleRoot.querySelector('[data-preview-image]'),
        previewDescription: moduleRoot.querySelector('[data-preview-description]')
    };

    // 初始化
    function init() {
        bindEvents();
        loadData();
    }

    // 事件綁定
    function bindEvents() {
        // 篩選表單
        elements.filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            state.filters.keyword = formData.get('keyword').trim();
            state.filters.image_type = formData.get('image_type');
            state.filters.start_date = formData.get('start_date');
            state.filters.end_date = formData.get('end_date');
            state.perPage = parseInt(formData.get('perPage'));
            state.currentPage = 1;
            loadData();
        });

        // 重設篩選
        moduleRoot.querySelector('[data-action="reset-filter"]').addEventListener('click', () => {
            elements.filterForm.reset();
            state.filters = { keyword: '', image_type: '', start_date: '', end_date: '' };
            state.currentPage = 1;
            loadData();
        });

        // 預覽 Modal 關閉
        moduleRoot.querySelector('[data-action="close-preview"]').addEventListener('click', closePreviewModal);

        // 表格操作 (預覽/前往工單)
        elements.table.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const action = btn.dataset.action;

            if (action === 'preview') {
                const row = btn.closest('tr');
                const data = JSON.parse(decodeURIComponent(row.dataset.json));
                openPreviewModal(data);
            } else if (action === 'goto-work-order') {
                const workOrderId = btn.dataset.id;
                if (workOrderId) {
                    // 開啟生產工單頁面並帶入工單 ID
                    if (typeof window.openTabWithContext === 'function') {
                        window.openTabWithContext('work_orders', '生產工單', { workOrderId: workOrderId });
                    } else {
                        // fallback: 直接開啟 work_orders 頁籤
                        const menuLink = document.querySelector('[data-page="work_orders"]');
                        if (menuLink) menuLink.click();
                    }
                }
            }
        });

        // 分頁點擊
        elements.pagination.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const page = parseInt(e.target.dataset.page);
                if (page && page !== state.currentPage) {
                    state.currentPage = page;
                    loadData();
                }
            }
        });
    }

    // 載入資料
    async function loadData() {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: state.currentPage,
                limit: state.perPage,
                ...state.filters
            });

            const response = await fetch(`api/work_order_images/index.php?${params}`);
            const result = await response.json();

            if (result.success) {
                state.totalItems = result.pagination.total;
                state.totalPages = result.pagination.pages;
                renderTable(result.data);
                renderPagination();
            } else {
                showAlert('error', result.message || '載入資料失敗');
            }
        } catch (error) {
            console.error('Load data error:', error);
            showAlert('error', '系統發生錯誤，請稍後再試');
        } finally {
            setLoading(false);
        }
    }

    // 渲染表格（escapeHtml 由 js/utils.js 提供，作為 window.escapeHtml 全域函數）
    function renderTable(data) {
        if (!data || data.length === 0) {
            elements.table.innerHTML = '<tr><td colspan="7" class="text-center">查無資料</td></tr>';
            return;
        }

        elements.table.innerHTML = data.map(item => {
            const json = encodeURIComponent(JSON.stringify(item));
            const itemId = Number.parseInt(item.id, 10) || 0;
            const workOrderId = Number.parseInt(item.work_order_id, 10) || 0;
            const typeLabels = {
                'general': '一般紀錄',
                'defect': '缺失/不良',
                'setup': '機台設定',
                'sample': '樣品/客戶提供'
            };
            const typeLabel = escapeHtml(typeLabels[item.image_type] || item.image_type || '-');

            // 縮圖路徑處理 (假設後端回傳的是相對路徑)
            const thumbPath = sanitizeImagePath(item.file_path);

            return `
                <tr data-json="${json}">
                    <td>${escapeHtml(item.work_order_number) || '-'}</td>
                    <td>
                        ${thumbPath ? `<img src="${thumbPath}" alt="Thumbnail" style="width: 60px; height: 60px; object-fit: cover; cursor: pointer;" data-action="preview">` : '<span class="text-muted">無圖片</span>'}
                    </td>
                    <td>${typeLabel}</td>
                    <td>${escapeHtml(item.description) || '-'}</td>
                    <td>${escapeHtml(item.uploaded_at) || '-'}</td>
                    <td>${escapeHtml(item.uploaded_by_name) || '-'}</td>
                    <td>
                        <div class="btn-group">
                            <button type="button" class="btn text" data-action="preview" data-id="${itemId}" title="預覽">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button type="button" class="btn text" data-action="goto-work-order" data-id="${workOrderId}" title="前往工單">
                                <i class="fas fa-external-link-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function sanitizeImagePath(path) {
        if (typeof path !== 'string') return '';
        const trimmed = path.trim();
        if (!trimmed) return '';
        if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed)) return '';
        return escapeHtml(trimmed);
    }

    // 渲染分頁
    function renderPagination() {
        const { currentPage, totalPages } = state;
        let html = '';

        if (totalPages > 1) {
            html += `<button type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>&lt;</button>`;

            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                    html += `<button type="button" data-page="${i}" class="${i === currentPage ? 'active' : ''}">${i}</button>`;
                } else if (i === currentPage - 3 || i === currentPage + 3) {
                    html += `<span>...</span>`;
                }
            }

            html += `<button type="button" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>&gt;</button>`;
        }

        elements.pagination.innerHTML = html;
    }

    // 開啟預覽 Modal
    function openPreviewModal(data) {
        if (!data.file_path) return;
        elements.previewImage.src = data.file_path;
        elements.previewDescription.textContent = data.description || '';
        elements.previewModal.classList.remove('hidden');
    }

    function closePreviewModal() {
        elements.previewModal.classList.add('hidden');
        elements.previewImage.src = '';
    }

    // 顯示全域訊息
    function showAlert(type, message) {
        elements.alert.textContent = message;
        elements.alert.className = `module-alert ${type}`;
        setTimeout(() => {
            elements.alert.className = 'module-alert hidden';
        }, 3000);
    }

    // 設定載入狀態
    function setLoading(isLoading) {
        if (isLoading) {
            elements.table.innerHTML = '<tr><td colspan="7" class="text-center">載入中...</td></tr>';
        }
    }

    // 啟動
    if (typeof DataSync !== 'undefined') {
        dataSyncHelper = DataSync.createModuleHelper('work_order_images', {
            onRefresh: loadData
        });
    }
    init();
}

    window.initializeWorkOrderImagesModule = initializeWorkOrderImagesModule;
})();
