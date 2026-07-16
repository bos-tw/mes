/**
 * 退貨品項管理模組配置。
 */
ModuleConfig.register('return_order_items', {
    title: '退貨品項',
    subtitle: '依原出貨品項維護退回數量，並即時同步出貨單退貨狀態',

    actions: [
        { label: '新增退貨品項', icon: 'fa-plus', action: 'create', style: 'primary' },
        { label: '重新整理', icon: 'fa-sync-alt', action: 'refresh', style: 'outline' }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,
    tableMeta: true,

    filters: [
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '退貨單號 / 出貨單號 / 庫存編號 / 客戶批號' },
        {
            name: 'return_order_id',
            label: '退貨單',
            type: 'select',
            options: [{ value: '', label: '-- 所有退貨單 --' }]
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

    columns: [
        { key: 'return_order_number', label: '退貨單號', selectable: true },
        { key: 'shipping_order_number', label: '原出貨單', selectable: true },
        { key: 'inventory_number', label: '庫存編號', selectable: true },
        { key: 'customer_batch_number', label: '客戶批號', selectable: true },
        { key: 'screening_item_name', label: '品項', selectable: true },
        { key: 'returned_quantity', label: '退貨數量', selectable: true },
        { key: 'reason', label: '退貨原因', selectable: true },
        { key: 'processing_status', label: '處理狀態', selectable: true },
        { key: 'created_at', label: '建立時間', selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    modal: {
        title: '新增退貨品項',
        size: 'medium',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '來源與數量',
                        fields: [
                            { name: 'return_order_id', label: '退貨單', type: 'select', required: true, options: [] },
                            { name: 'shipping_order_item_id', label: '原出貨品項', type: 'select', required: true, options: [], helpText: '只能選擇該退貨單原出貨單中仍有可退數量的品項。' },
                            { name: 'returned_quantity', label: '退貨數量', type: 'number', required: true, min: 0.01, step: 0.01 },
                            { name: 'returned_unit', label: '退貨單位', type: 'text', required: true, maxlength: 50, placeholder: '例如：支' },
                            { name: 'reason', label: '退貨原因', type: 'textarea', maxlength: 255, fullWidth: true, rows: 3 }
                        ]
                    }
                ]
            }
        ]
    }
});
