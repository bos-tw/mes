(function() {
    'use strict';

    function getSourceTypeLabel(sourceType) {
        const labels = {
            rescreen_batch_item: '二次篩選來源明細'
        };
        return labels[sourceType] || sourceType || '-';
    }

    function getSecondScreeningReasonLabel(reason) {
        const labels = {
            relaxed_after_high_defect: '不良過多，客戶放寬後再篩',
            customer_required_second_pass: '客戶每批要求二次篩選'
        };
        return labels[reason] || reason || '-';
    }

    function getRescreenTypeLabel(type) {
        const labels = {
            relaxed_rescreen: '放寬後重篩',
            strict_rescreen: '嚴格重篩'
        };
        return labels[type] || type || '-';
    }

    function renderSection(sourceChain, options = {}) {
        const escapeHtml = typeof options.escapeHtml === 'function'
            ? options.escapeHtml
            : (value) => String(value ?? '');

        if (!Array.isArray(sourceChain) || sourceChain.length === 0) {
            return '';
        }

        return `
            <div class="detail-section">
                <h4>來源鏈明細</h4>
                <div class="table-responsive">
                    <table class="data-table compact">
                        <thead>
                            <tr>
                                <th>來源類型</th>
                                <th>訂單</th>
                                <th>工單</th>
                                <th>出貨 / 退貨</th>
                                <th>二次篩選</th>
                                <th>備註</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sourceChain.map((source) => `
                                <tr>
                                    <td>${escapeHtml(getSourceTypeLabel(source.source_type))}</td>
                                    <td>${escapeHtml(source.order_number || '-')}</td>
                                    <td>${escapeHtml(source.work_order_number || '-')}</td>
                                    <td>${escapeHtml([source.shipping_order_number, source.return_order_number].filter(Boolean).join(' / ') || '-')}</td>
                                    <td>
                                        ${escapeHtml(source.rescreen_batch_number || '-')}
                                        <div class="text-muted small">${escapeHtml(getSecondScreeningReasonLabel(source.second_screening_reason))}</div>
                                        <div class="text-muted small">${escapeHtml(getRescreenTypeLabel(source.rescreen_type))}</div>
                                    </td>
                                    <td>${escapeHtml(source.notes || '-')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    window.InventoryItemsSourceChain = {
        renderSection,
    };
})();
