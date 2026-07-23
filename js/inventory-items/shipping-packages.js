(function () {
    'use strict';

    function formatToolStatistics(raw) {
        if (!raw) return '-';
        try {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (Array.isArray(parsed)) {
                return parsed
                    .map((tool) => `${tool.tool_name || tool.tool_number || '載具'} ${Number(tool.quantity || 0).toLocaleString('zh-TW')}個`)
                    .join('、') || '-';
            }
        } catch (error) {
            // 舊資料為純文字，交由呼叫端轉義後顯示。
        }
        return String(raw);
    }

    function renderDetailPackages(item, packages, escapeHtml, formatNumber) {
        if (item.stock_category !== 'defect') return '';
        const rows = (packages || []).map((itemPackage) => `
            <tr>
                <td>${escapeHtml(itemPackage.package_number)}</td>
                <td>${formatNumber(itemPackage.package_quantity)}</td>
                <td>${formatNumber(itemPackage.contained_units)}</td>
                <td>${Number(itemPackage.content_weight_kg || 0).toFixed(3)}</td>
                <td>${escapeHtml(itemPackage.package_status)}</td>
            </tr>
        `).join('');
        return `
            <div class="detail-section">
                <h4>不良品包／袋</h4>
                <div class="table-responsive">
                    <table class="data-table compact ui-compact-table">
                        <thead><tr><th>袋號</th><th>袋數</th><th>支數</th><th>內容物重量(kg)</th><th>狀態</th></tr></thead>
                        <tbody>${rows || '<tr class="empty-row"><td colspan="5" class="text-center">尚無包裝資料</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function configurePackageSelection(form, item, packages, escapeHtml, formatNumber) {
        const quantityInput = form.querySelector('[name="quantity"]');
        const section = form.querySelector('[data-shipping-package-section]');
        const body = form.querySelector('[data-shipping-package-body]');
        const isDefect = item.stock_category === 'defect';
        quantityInput.readOnly = isDefect;
        form.dataset.stockCategory = item.stock_category || 'good';
        if (!section || !body) return;

        const availablePackages = (packages || []).filter((itemPackage) => itemPackage.package_status === 'available');
        section.classList.toggle('hidden', !isDefect);
        body.innerHTML = isDefect
            ? (availablePackages.map((itemPackage) => `
                <tr>
                    <td><input type="checkbox" data-shipping-package-checkbox value="${itemPackage.id}" data-contained-units="${itemPackage.contained_units}"></td>
                    <td>${escapeHtml(itemPackage.package_number || '-')}</td>
                    <td>${formatNumber(itemPackage.package_quantity || 0)}</td>
                    <td>${formatNumber(itemPackage.contained_units || 0)}</td>
                    <td>${Number(itemPackage.content_weight_kg || 0).toFixed(3)}</td>
                </tr>
            `).join('') || '<tr class="empty-row"><td colspan="5" class="text-center">無可用包／袋</td></tr>')
            : '';
        if (!isDefect) return;

        quantityInput.value = '';
        body.onchange = (event) => {
            if (!event.target.matches('[data-shipping-package-checkbox]')) return;
            const selectedUnits = Array.from(body.querySelectorAll('[data-shipping-package-checkbox]:checked'))
                .reduce((sum, selectedPackage) => sum + Number(selectedPackage.dataset.containedUnits || 0), 0);
            quantityInput.value = selectedUnits > 0 ? String(selectedUnits) : '';
        };
    }

    async function loadPendingOrders(form, customerId, stockCategory, escapeHtml) {
        const select = form.querySelector('[name="shipping_order_id"]');
        if (!select) return;
        select.innerHTML = '<option value="">載入中...</option>';
        try {
            const response = await fetch(`api/shipping_orders/pending.php?customer_id=${customerId || ''}`, {
                credentials: 'include'
            });
            const data = await response.json();
            const orders = (data.data || data.orders || []).filter((order) => {
                const purpose = order.shipment_purpose || 'normal';
                return stockCategory === 'defect'
                    ? ['defect_return', 'mixed'].includes(purpose)
                    : ['normal', 'mixed'].includes(purpose);
            });
            const rows = orders.map((order) => {
                const date = order.created_at ? new Date(order.created_at).toLocaleDateString() : '';
                const purposeLabel = order.shipment_purpose === 'defect_return'
                    ? '不良回送'
                    : (order.shipment_purpose === 'mixed' ? '混合出貨' : '一般出貨');
                return `<option value="${order.id}">${escapeHtml(order.shipping_order_number)}／${purposeLabel} (${date}, ${order.item_count || 0}項)</option>`;
            }).join('');
            select.innerHTML = `<option value="new">＋ 建立新出貨單</option>${rows ? `<optgroup label="草稿出貨單">${rows}</optgroup>` : ''}`;
        } catch (error) {
            console.error('載入出貨單失敗:', error);
            select.innerHTML = '<option value="new">＋ 建立新出貨單</option>';
        }
    }

    function selectedPackageIds(form) {
        return Array.from(form.querySelectorAll('[data-shipping-package-checkbox]:checked'))
            .map((checkbox) => Number.parseInt(checkbox.value, 10))
            .filter(Number.isInteger);
    }

    function reset(form) {
        delete form.dataset.stockCategory;
        form.querySelector('[name="quantity"]').readOnly = false;
        form.querySelector('[data-shipping-package-section]')?.classList.add('hidden');
    }

    window.InventoryItemShippingPackages = Object.freeze({
        configurePackageSelection,
        formatToolStatistics,
        loadPendingOrders,
        renderDetailPackages,
        reset,
        selectedPackageIds
    });
})();
