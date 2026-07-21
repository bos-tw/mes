/**
 * 受篩產品模組配置
 */
(function() {
    'use strict';

    ModuleConfig.register('screening_items', {
        title: '受篩產品',
        subtitle: '管理受篩產品規格、重量與材質資訊',

        // 標題列動作按鈕
        actions: [
            { action: 'create', label: '新增', icon: 'fa-plus', style: 'primary', wrapLabel: true }
        ],

        hasColumnSelector: true,
        tableHeaderActions: true,
        tableHeaderActionsInHeader: true,
        filterLayout: 'drawer',
        useGenericFilterDrawer: true,

        // 篩選欄位
        filters: [
            {
                name: 'keyword',
                label: '關鍵字',
                type: 'text',
                placeholder: '料號 / 規格 / 材質'
            },
            {
                name: 'material',
                label: '材質',
                type: 'text',
                placeholder: '例如：鋼 / 不銹鋼'
            },
            {
                name: 'thread_type',
                label: '螺紋類型',
                type: 'text',
                placeholder: '例如：公制 / 英制'
            },
            {
                name: 'unit',
                label: '計量單位',
                type: 'text',
                placeholder: '例如：pcs'
            },
            {
                name: 'perPage',
                label: '每頁筆數',
                type: 'select',
                options: [
                    { value: '10', label: '10' },
                    { value: '20', label: '20' },
                    { value: '50', label: '50' }
                ]
            }
        ],

        // 表格欄位
        columns: [
            { key: 'item_number', label: '料號', sortable: true, selectable: true },
            { key: 'name', label: '產品規格', sortable: true, selectable: true },
            { key: 'material', label: '材質', sortable: true, selectable: true },
            { key: 'thread_type', label: '螺紋類型', sortable: true, selectable: true },
            { key: 'weight_per_unit_g', label: '單支重量(g)', sortable: true, selectable: true },
            { key: 'unit_price', label: '單價(元/M)', sortable: true, selectable: true },
            { key: 'unit', label: '計量單位', sortable: true, selectable: true },
            { key: 'updated_at', label: '更新時間', sortable: true, selectable: true },
            { key: 'actions', label: '操作', sortable: false, selectable: false }
        ],

        // Modal 配置 - 使用 formRows 模式（並排 section）
        modal: {
            title: '新增受篩產品',
            size: 'medium',
            hiddenFields: ['id'],
            // formRows: 每個 row 內的 sections 會並排顯示
            formRows: [
                {
                    sections: [
                        {
                            title: '基本資訊',
                            fields: [
                                { name: 'item_number', label: '產品料號', maxlength: 50, placeholder: '請輸入或自動產生' },
                                { name: 'name', label: '產品規格名稱', required: true, maxlength: 255, placeholder: '例如：M3-1.5x13.5' },
                                { name: 'material', label: '材質', maxlength: 50, placeholder: '例如：鋼 / SUS' }
                            ]
                        },
                        {
                            title: '規格資訊',
                            fields: [
                                { name: 'thread_type', label: '螺紋類型', maxlength: 50, placeholder: '例如：公制' },
                                { name: 'weight_per_unit_g', label: '單支重量(g)', type: 'number', required: true, min: 0.0001, step: 0.0001, placeholder: '例如：0.45' },
                                { name: 'unit_price', label: '單價(元/M)', type: 'number', min: 0, step: 0.01, placeholder: '例如：15.00' },
                                { name: 'unit', label: '計量單位', placeholder: '預設：pcs' }
                            ]
                        }
                    ]
                }
            ],
            // 額外的 sections（不並排）
            sections: [
                {
                    title: '備註',
                    fields: [
                        { name: 'notes', label: '備註', type: 'textarea', fullWidth: true, rows: 3, maxlength: 2000, placeholder: '其他補充資訊' }
                    ]
                }
            ],
            submitLabel: '儲存',
            submitDataAction: 'submit'
        },

        // API 端點
        api: {
            list: 'api/screening_items/',
            create: 'api/screening_items/',
            update: 'api/screening_items/{id}',
            delete: 'api/screening_items/{id}',
            detail: 'api/screening_items/{id}'
        }
    });

})();
