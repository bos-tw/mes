/**
 * 退貨品項管理模組。
 *
 * @module return_order_items
 * @requires DataSync
 */
(function () {
    'use strict';

    function initializeReturnOrderItemsModule(container) {
        const root = container.querySelector('[data-module="return_order_items"]');
        if (!root || root.dataset.initialised === 'true') return;
        root.dataset.initialised = 'true';

        const elements = {
            alert: root.querySelector('[data-return-order-items-alert]'),
            filter: root.querySelector('[data-return-order-items-filter]'),
            tableBody: root.querySelector('[data-return-order-items-table] tbody'),
            pagination: root.querySelector('[data-return-order-items-pagination]'),
            summary: root.querySelector('[data-return-order-items-summary]'),
            modal: root.querySelector('[data-return-order-items-modal]'),
            modalForm: root.querySelector('[data-return-order-items-form]'),
            modalTitle: root.querySelector('[data-modal-title]'),
            modalAlert: root.querySelector('[data-return-order-items-modal-alert]')
        };
        const state = {
            page: 1,
            perPage: 20,
            totalPages: 0,
            total: 0,
            rows: [],
            returnOrders: [],
            editingId: null,
            loading: false
        };
        let dataSyncHelper = null;

        const escapeHtml = (value) => String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        function showAlert(message, modal = false, type = 'error') {
            const target = modal ? elements.modalAlert : elements.alert;
            if (!target) return;
            target.textContent = message;
            target.classList.remove('hidden', 'success', 'error');
            target.classList.add(type);
        }

        function clearAlert(modal = false) {
            const target = modal ? elements.modalAlert : elements.alert;
            if (!target) return;
            target.textContent = '';
            target.classList.add('hidden');
            target.classList.remove('success', 'error');
        }

        function setFieldValue(name, value) {
            const field = elements.modalForm?.elements[name];
            if (field) field.value = value ?? '';
        }

        async function request(url, options = {}) {
            const response = await fetch(url, { credentials: 'include', ...options });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.success) {
                const error = new Error(result.message || `請求失敗（HTTP ${response.status}）`);
                error.details = result.errors || null;
                throw error;
            }
            return result;
        }

        function populateSelect(select, rows, placeholder, valueGetter, labelGetter) {
            if (!select) return;
            const current = select.value;
            select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>`;
            rows.forEach(row => {
                const option = document.createElement('option');
                option.value = String(valueGetter(row));
                option.textContent = labelGetter(row);
                select.appendChild(option);
            });
            if (Array.from(select.options).some(option => option.value === current)) {
                select.value = current;
            }
        }

        async function loadReturnOrders() {
            const result = await request('api/return_orders/index.php?page=1&perPage=100&sortField=return_date&sortDirection=DESC');
            state.returnOrders = (result.data || []).filter(order => ['pending', 'processing'].includes(order.processing_status));
            const label = order => `${order.return_order_number}｜${order.shipping_order_number || '未指定出貨單'}`;
            populateSelect(elements.filter?.elements.return_order_id, result.data || [], '-- 所有退貨單 --', order => order.id, label);
            populateSelect(elements.modalForm?.elements.return_order_id, state.returnOrders, '-- 請選擇退貨單 --', order => order.id, label);
        }

        async function loadSourceItems(returnOrderId) {
            const sourceSelect = elements.modalForm?.elements.shipping_order_item_id;
            const order = state.returnOrders.find(row => Number(row.id) === Number(returnOrderId));
            if (!sourceSelect) return;
            sourceSelect.innerHTML = '<option value="">-- 請先選擇退貨單 --</option>';
            sourceSelect.disabled = true;
            if (!order?.original_shipping_order_id) return;

            const result = await request(`api/shipping_orders/show.php?id=${encodeURIComponent(order.original_shipping_order_id)}`);
            const items = (result.order?.items || []).filter(item => Number(item.returnable_quantity) > 0);
            populateSelect(
                sourceSelect,
                items,
                '-- 請選擇原出貨品項 --',
                item => item.id,
                item => `${item.inventory_number || item.id}｜${item.screening_item_name || '未命名品項'}｜可退 ${Number(item.returnable_quantity)} ${item.shipped_unit || ''}`
            );
            sourceSelect.disabled = false;
        }

        function getFilters() {
            const data = new FormData(elements.filter);
            return {
                keyword: String(data.get('keyword') || '').trim(),
                returnOrderId: String(data.get('return_order_id') || '').trim(),
                perPage: Math.max(1, Number(data.get('perPage') || 20))
            };
        }

        async function loadRows() {
            if (state.loading) return;
            state.loading = true;
            clearAlert();
            const filters = getFilters();
            state.perPage = filters.perPage;
            const params = new URLSearchParams({ page: state.page, perPage: state.perPage });
            if (filters.keyword) params.set('keyword', filters.keyword);
            if (filters.returnOrderId) params.set('return_order_id', filters.returnOrderId);
            try {
                const result = await request(`api/return_order_items/index.php?${params}`);
                state.rows = result.data || [];
                state.total = result.pagination?.total || 0;
                state.totalPages = result.pagination?.totalPages || 0;
                renderTable();
                renderPagination();
                if (elements.summary) elements.summary.textContent = `共 ${state.total} 筆資料`;
            } catch (error) {
                showAlert(error.message);
            } finally {
                state.loading = false;
            }
        }

        function renderTable() {
            if (!elements.tableBody) return;
            if (state.rows.length === 0) {
                elements.tableBody.innerHTML = '<tr><td colspan="10" class="text-center">目前沒有退貨品項</td></tr>';
                return;
            }
            elements.tableBody.innerHTML = state.rows.map(row => {
                const mutable = ['pending', 'processing'].includes(row.processing_status);
                return `<tr data-id="${row.id}">
                    <td>${escapeHtml(row.return_order_number || '-')}</td>
                    <td>${escapeHtml(row.shipping_order_number || '-')}</td>
                    <td>${escapeHtml(row.inventory_number || '-')}</td>
                    <td>${escapeHtml(row.customer_batch_number || '-')}</td>
                    <td>${escapeHtml(row.screening_item_name || row.part_number || '-')}</td>
                    <td>${escapeHtml(`${Number(row.returned_quantity)} ${row.returned_unit || ''}`)}</td>
                    <td>${escapeHtml(row.reason || '-')}</td>
                    <td><span class="status-badge">${escapeHtml(row.processing_status || '-')}</span></td>
                    <td>${escapeHtml(row.created_at || '-')}</td>
                    <td class="actions" data-id="${row.id}">${mutable ? `
                        <button type="button" class="btn text" data-action="edit" data-id="${row.id}" title="編輯"><i class="fas fa-edit"></i></button>
                        <button type="button" class="btn text danger" data-action="delete" data-id="${row.id}" title="刪除"><i class="fas fa-trash"></i></button>
                    ` : '<span class="text-muted">已鎖定</span>'}</td>
                </tr>`;
            }).join('');
        }

        function renderPagination() {
            if (!elements.pagination) return;
            if (state.totalPages <= 1) {
                elements.pagination.innerHTML = '';
                return;
            }
            const pages = [];
            for (let page = 1; page <= state.totalPages; page += 1) {
                if (page === 1 || page === state.totalPages || Math.abs(page - state.page) <= 2) pages.push(page);
            }
            elements.pagination.innerHTML = [
                `<button type="button" class="btn-page" data-page="${state.page - 1}" ${state.page <= 1 ? 'disabled' : ''}>«</button>`,
                ...[...new Set(pages)].map(page => `<button type="button" class="btn-page ${page === state.page ? 'active' : ''}" data-page="${page}">${page}</button>`),
                `<button type="button" class="btn-page" data-page="${state.page + 1}" ${state.page >= state.totalPages ? 'disabled' : ''}>»</button>`
            ].join('');
        }

        function openCreateModal() {
            state.editingId = null;
            elements.modalForm.reset();
            elements.modalForm.elements.return_order_id.disabled = false;
            elements.modalForm.elements.shipping_order_item_id.disabled = true;
            elements.modalForm.elements.shipping_order_item_id.innerHTML = '<option value="">-- 請先選擇退貨單 --</option>';
            elements.modalForm.elements.returned_unit.value = '支';
            elements.modalTitle.textContent = '新增退貨品項';
            clearAlert(true);
            elements.modal.classList.remove('hidden');
        }

        function openEditModal(id) {
            const row = state.rows.find(item => Number(item.id) === Number(id));
            if (!row) return;
            state.editingId = row.id;
            elements.modalForm.reset();
            const returnSelect = elements.modalForm.elements.return_order_id;
            const sourceSelect = elements.modalForm.elements.shipping_order_item_id;
            if (!Array.from(returnSelect.options).some(option => Number(option.value) === Number(row.return_order_id))) {
                const option = new Option(row.return_order_number, row.return_order_id);
                returnSelect.add(option);
            }
            returnSelect.value = row.return_order_id;
            returnSelect.disabled = true;
            sourceSelect.innerHTML = '';
            sourceSelect.add(new Option(`${row.inventory_number || row.shipping_order_item_id}｜原出貨 ${Number(row.shipped_quantity)} ${row.shipped_unit || ''}`, row.shipping_order_item_id));
            sourceSelect.value = row.shipping_order_item_id;
            sourceSelect.disabled = true;
            elements.modalForm.elements.returned_quantity.value = row.returned_quantity;
            elements.modalForm.elements.returned_unit.value = row.returned_unit || row.shipped_unit || '支';
            elements.modalForm.elements.reason.value = row.reason || '';
            elements.modalTitle.textContent = '編輯退貨品項';
            clearAlert(true);
            elements.modal.classList.remove('hidden');
        }

        function closeModal() {
            elements.modal.classList.add('hidden');
            state.editingId = null;
        }

        async function submitForm(event) {
            event.preventDefault();
            clearAlert(true);
            const form = elements.modalForm;
            const payload = {
                returned_quantity: form.elements.returned_quantity.value,
                returned_unit: form.elements.returned_unit.value,
                reason: form.elements.reason.value
            };
            if (!state.editingId) {
                payload.return_order_id = form.elements.return_order_id.value;
                payload.shipping_order_item_id = form.elements.shipping_order_item_id.value;
            }
            const editingId = state.editingId;
            try {
                const result = await request(
                    editingId ? `api/return_order_items/update.php?id=${editingId}` : 'api/return_order_items/index.php',
                    {
                        method: editingId ? 'PUT' : 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }
                );
                closeModal();
                showAlert(result.message, false, 'success');
                if (dataSyncHelper) {
                    if (editingId) dataSyncHelper.notifyUpdated({ id: editingId });
                    else dataSyncHelper.notifyCreated(result.data || payload);
                }
                await loadRows();
            } catch (error) {
                showAlert(error.message, true);
            }
        }

        async function deleteItem(id) {
            if (!await window.AppFeedback.confirm({ title: '刪除退貨品項', message: '出貨單的退貨狀態會同步重算。', impact: '退貨數量與原出貨品項狀態', confirmLabel: '確認刪除' })) return;
            try {
                const result = await request(`api/return_order_items/delete.php?id=${id}`, { method: 'DELETE' });
                showAlert(result.message, false, 'success');
                dataSyncHelper?.notifyDeleted({ id });
                await loadRows();
            } catch (error) {
                showAlert(error.message);
            }
        }

        root.addEventListener('click', event => {
            const actionElement = event.target.closest('[data-action]');
            if (!actionElement) return;
            const action = actionElement.dataset.action;
            const id = Number(actionElement.dataset.id || 0);
            if (action === 'create') openCreateModal();
            if (action === 'refresh') loadRows();
            if (action === 'edit') openEditModal(id);
            if (action === 'delete') deleteItem(id);
            if (action === 'close-modal' || action === 'cancel') closeModal();
        });
        elements.filter?.addEventListener('submit', event => {
            event.preventDefault();
            state.page = 1;
            loadRows();
        });
        elements.pagination?.addEventListener('click', event => {
            const button = event.target.closest('[data-page]');
            if (!button || button.disabled) return;
            state.page = Number(button.dataset.page);
            loadRows();
        });
        elements.modalForm?.addEventListener('submit', submitForm);
        elements.modalForm?.elements.return_order_id?.addEventListener('change', event => loadSourceItems(event.target.value).catch(error => showAlert(error.message, true)));
        elements.modal?.addEventListener('click', event => {
            if (event.target === elements.modal) closeModal();
        });

        if (typeof DataSync !== 'undefined') {
            dataSyncHelper = DataSync.createModuleHelper('return_order_items', {
                onRefresh: loadRows,
                onDependencyUpdate: () => Promise.all([loadReturnOrders(), loadRows()])
            });
        }

        Promise.all([loadReturnOrders(), loadRows()]).catch(error => showAlert(error.message));
    }

    window.initializeReturnOrderItemsModule = initializeReturnOrderItemsModule;
})();
