(function() {
    'use strict';

    function getSourceTypeLabel(sourceType) {
        const labels = {
            rescreen_batch_item: '二次篩選來源明細',
            work_order_stage_output: '工單製程終點輸出'
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
        const imageLinks = (source) => String(source.source_machine_image_paths || '')
            .split('|')
            .filter(Boolean)
            .map((imagePath, index) => `<a href="${escapeHtml(imagePath)}" target="_blank" rel="noopener">圖片${index + 1}</a>`)
            .join('、');

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
                                <th>製程結果</th>
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
                                    <td>
                                        ${source.source_machine_result_id ? `
                                            <div>${escapeHtml(source.source_stage_type === 'secondary'
                                                ? `二次篩分／${source.source_stage_secondary_mode === 'second_process' ? '第二道工序' : '放寬標準'}`
                                                : '生產與篩分')}－${escapeHtml(source.source_machine_label || `機台結果#${source.source_machine_result_id}`)}</div>
                                            <div class="text-muted small">
                                                良品 ${escapeHtml(source.source_machine_good_units || 0)}；
                                                原始不良 ${escapeHtml(source.source_machine_defect_units || 0)} →
                                                入庫不良 ${escapeHtml(source.source_settled_defect_units || 0)}；
                                                差異 ${escapeHtml(source.source_defect_difference_units || 0)}
                                            </div>
                                            <div class="text-muted small">
                                                不良實秤 ${escapeHtml(source.source_defect_weight_kg || 0)} kg；
                                                單支重快照 ${escapeHtml(source.source_weight_per_unit_g || 0)} g；
                                                圖片 ${source.source_image_requirement === 'required'
                                                    ? `必填${escapeHtml(source.source_image_min_count || 0)}張`
                                                    : '選填'}／已上傳${escapeHtml(source.source_machine_image_count || 0)}張
                                                ${imageLinks(source) ? `（${imageLinks(source)}）` : ''}
                                            </div>
                                            <div class="text-muted small">
                                                ${escapeHtml(source.source_transfer_quality === 'defect' ? '不良品' : '良品')} →
                                                ${escapeHtml(source.source_transfer_route === 'secondary_screening' ? '二次篩分' : '庫存')}
                                            </div>
                                        ` : '-'}
                                    </td>
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
