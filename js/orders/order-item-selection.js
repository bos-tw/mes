(function() {
    'use strict';

    function create(options = {}) {
        const selectedByOrder = new Map();
        const sortByOrder = new Map();
        const showAlert = typeof options.showAlert === 'function' ? options.showAlert : () => {};
        const onCopied = typeof options.onCopied === 'function' ? options.onCopied : async () => {};

        function getSelected(orderId) {
            return selectedByOrder.get(orderId) || null;
        }

        function isSelected(orderId, orderItemId) {
            return selectedByOrder.get(orderId) === Number.parseInt(orderItemId, 10);
        }

        function reconcile(orderId, items) {
            const selectedOrderItemId = selectedByOrder.get(orderId);
            if (selectedOrderItemId && !items.some((item) => Number.parseInt(item.id, 10) === selectedOrderItemId)) {
                selectedByOrder.delete(orderId);
            }
        }

        function getSortValue(item, field) {
            const totals = item?.totals || {};
            const screeningItem = item?.screening_item || {};
            const values = {
                order_item_number: item?.order_item_number || '',
                customer_batch_number: item?.customer_batch_number || '',
                order_number: item?.order_number || '',
                customer_name: item?.customer_name || '',
                screening_label: [screeningItem.item_number, screeningItem.name].filter(Boolean).join(' - '),
                total_weight_kg: Number(item?.total_weight_kg) || 0,
                tool_weight_kg: Number(totals.tool_weight_kg) || 0,
                net_weight_kg: Number(totals.net_weight_kg) || 0,
                total_units: Number(item?.total_units) || 0,
                unit_price_per_thousand: Number(item?.unit_price_per_thousand) || 0,
                total_price: Number(item?.total_price) || 0,
                status_label: item?.status_label || item?.status || '',
                sample_status_label: item?.customer_sample_status_label || item?.customer_sample_status || '',
                updated_at: item?.updated_at || '',
                total_shipped_quantity: Number(item?.total_shipped_quantity) || 0,
                shipping_status: item?.shipping_status || 'not_shipped',
                work_order_count: Number(item?.work_order_count) || 0,
                inventory_item_count: Number(item?.inventory_item_count) || 0,
                shipping_order_item_count: Number(item?.shipping_order_item_count) || 0,
                return_order_item_count: Number(item?.return_order_item_count) || 0,
                customer_provided_weight: Number(item?.customer_provided_weight) || 0,
                confirmed_weight: Number(item?.confirmed_weight) || 0,
                actual_production_weight: Number(item?.actual_production_weight) || 0,
            };
            return values[field] ?? '';
        }

        function toggleSort(orderId, field) {
            const current = sortByOrder.get(orderId);
            sortByOrder.set(orderId, {
                field,
                direction: current?.field === field && current.direction === 'asc' ? 'desc' : 'asc',
            });
        }

        function sortItems(orderId, items) {
            const sort = sortByOrder.get(orderId);
            if (!sort || !Array.isArray(items)) {
                return Array.isArray(items) ? [...items] : [];
            }

            return items.map((item, index) => ({ item, index })).sort((left, right) => {
                const leftValue = getSortValue(left.item, sort.field);
                const rightValue = getSortValue(right.item, sort.field);
                let comparison = 0;
                if (typeof leftValue === 'number' && typeof rightValue === 'number') {
                    comparison = leftValue - rightValue;
                } else {
                    comparison = String(leftValue).localeCompare(String(rightValue), 'zh-Hant', {
                        numeric: true,
                        sensitivity: 'base',
                    });
                }
                return comparison === 0
                    ? left.index - right.index
                    : comparison * (sort.direction === 'desc' ? -1 : 1);
            }).map(({ item }) => item);
        }

        function getSortClass(orderId, field) {
            const sort = sortByOrder.get(orderId);
            return sort?.field === field ? `sort-${sort.direction}` : '';
        }

        function getAriaSort(orderId, field) {
            const sort = sortByOrder.get(orderId);
            if (sort?.field !== field) return 'none';
            return sort.direction === 'desc' ? 'descending' : 'ascending';
        }

        function select(checkbox) {
            const orderId = Number.parseInt(checkbox.dataset.orderId || '', 10);
            const orderItemId = Number.parseInt(checkbox.dataset.orderItemId || '', 10);
            if (!Number.isInteger(orderId) || !Number.isInteger(orderItemId)) {
                checkbox.checked = false;
                return;
            }

            const detailRow = checkbox.closest('.order-items-detail-row');
            if (checkbox.checked) {
                selectedByOrder.set(orderId, orderItemId);
                detailRow?.querySelectorAll('input[data-action="select-order-item-inline"]').forEach((candidate) => {
                    if (candidate !== checkbox) {
                        candidate.checked = false;
                    }
                });
            } else if (selectedByOrder.get(orderId) === orderItemId) {
                selectedByOrder.delete(orderId);
            }

            const copyButton = detailRow?.querySelector('button[data-action="copy-order-item"]');
            if (copyButton) {
                const hasSelection = selectedByOrder.has(orderId);
                copyButton.setAttribute('aria-disabled', hasSelection ? 'false' : 'true');
                copyButton.title = hasSelection ? '複製已選取的訂單細項' : '請先勾選一筆訂單細項';
            }
        }

        async function readJsonResponse(response) {
            const raw = await response.text();
            if (!raw || raw.trim() === '') {
                throw new Error(`複製訂單細項失敗（伺服器未回傳內容，HTTP ${response.status}）。`);
            }
            try {
                return JSON.parse(raw);
            } catch (error) {
                throw new Error(`複製訂單細項失敗（伺服器回應格式錯誤，HTTP ${response.status}）。`);
            }
        }

        async function copy(orderId, button) {
            const sourceOrderItemId = selectedByOrder.get(orderId);
            if (!sourceOrderItemId) {
                showAlert('error', '請先勾選一筆要複製的訂單細項。');
                return;
            }

            const originalHtml = button.innerHTML;
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> 複製中…';

            try {
                const response = await fetch('api/order_items/copy.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ source_order_item_id: sourceOrderItemId }),
                });
                const result = await readJsonResponse(response);
                if (!response.ok || !result.success || !result.data) {
                    throw new Error(result.message || '複製訂單細項失敗。');
                }

                const copiedOrderItemId = Number.parseInt(result.data.id, 10);
                if (Number.isInteger(copiedOrderItemId)) {
                    selectedByOrder.set(orderId, copiedOrderItemId);
                }
                if (typeof DataSync !== 'undefined') {
                    DataSync.notifyWithDependencies('order_items', DataSync.EVENT_TYPES.CREATED, result.data);
                }
                await onCopied(orderId, result.data);
                showAlert('success', result.message || '訂單細項已複製。');
            } catch (error) {
                showAlert('error', error instanceof Error ? error.message : '複製訂單細項失敗。');
            } finally {
                if (button.isConnected) {
                    button.disabled = false;
                    button.innerHTML = originalHtml;
                }
            }
        }

        return Object.freeze({
            getSelected,
            isSelected,
            reconcile,
            select,
            copy,
            toggleSort,
            sortItems,
            getSortClass,
            getAriaSort,
        });
    }

    window.OrdersOrderItemSelection = Object.freeze({ create });
})();
