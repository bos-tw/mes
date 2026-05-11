/**
 * 出貨品質檢驗模組配置
 */
ModuleConfig.register('shipping_quality_inspections', {
    title: '出貨品質檢驗',
    titleIcon: 'fa-clipboard-check',
    subtitle: '管理出貨品質檢驗紀錄',

    // 標題區按鈕
    actions: [
        { label: '新增檢驗', icon: 'fa-plus', action: 'create', style: 'primary' }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選工具列
    filters: [
        {
            name: 'shipping_order_id',
            label: '出貨單',
            type: 'select',
            options: [{ value: '', label: '全部出貨單' }]
        },
        {
            name: 'inspection_result',
            label: '檢驗結果',
            type: 'select',
            options: [
                { value: '', label: '全部結果' },
                { value: 'pass', label: '合格' },
                { value: 'fail', label: '不合格' },
                { value: 'conditional', label: '有條件合格' }
            ]
        },
        { name: 'date_from', label: '起始日期', type: 'date' },
        { name: 'date_to', label: '結束日期', type: 'date' }
    ],

    // 資料表格欄位
    columns: [
        { key: 'shipping_order', label: '出貨單', sortable: true, sortKey: 'shipping_order_number', selectable: true },
        { key: 'inspection_datetime', label: '檢驗時間', sortable: true, selectable: true },
        { key: 'inspector', label: '檢驗員', sortable: true, sortKey: 'inspector_name', selectable: true },
        { key: 'sample_quantity', label: '抽樣數量', sortable: true, sortKey: 'sample_quantity_pcs', selectable: true },
        { key: 'defective_quantity', label: '不良數量', sortable: true, sortKey: 'defective_quantity_pcs', selectable: true },
        { key: 'ppm', label: 'PPM', sortable: true, sortKey: 'rejection_rate_ppm', selectable: true },
        { key: 'result', label: '檢驗結果', sortable: true, sortKey: 'inspection_result', selectable: true },
        { key: 'notes', label: '備註', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 配置
    modal: {
        createTitle: '新增出貨品質檢驗',
        editTitle: '編輯出貨品質檢驗',
        size: 'large',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '基本資訊',
                        fields: [
                            {
                                name: 'shipping_order_id',
                                label: '出貨單',
                                type: 'select',
                                required: true,
                                options: [{ value: '', label: '請選擇出貨單' }]
                            },
                            { name: 'inspection_datetime', label: '檢驗時間', type: 'datetime-local', required: true },
                            {
                                name: 'inspector_id',
                                label: '檢驗員',
                                type: 'select',
                                required: true,
                                options: [{ value: '', label: '請選擇檢驗員' }]
                            }
                        ]
                    },
                    {
                        title: '數量與結果',
                        fields: [
                            { name: 'sample_quantity_pcs', label: '抽樣數量 (pcs)', type: 'number', required: true, min: '1', placeholder: '請輸入' },
                            { name: 'defective_quantity_pcs', label: '不良數量 (pcs)', type: 'number', min: '0', value: '0', placeholder: '請輸入' },
                            {
                                name: 'inspection_result',
                                label: '檢驗結果',
                                type: 'select',
                                required: true,
                                options: [
                                    { value: 'pass', label: '合格' },
                                    { value: 'fail', label: '不合格' },
                                    { value: 'conditional', label: '有條件合格' }
                                ]
                            }
                        ]
                    }
                ]
            }
        ],
        sections: [
            {
                title: '備註',
                fields: [
                    { name: 'notes', label: '備註', type: 'textarea', rows: 3, fullWidth: true, placeholder: '請輸入備註' }
                ]
            }
        ]
    },

    // 詳情 Modal
    detailModal: {
        title: '出貨品質檢驗詳情',
        titleIcon: 'fa-info-circle',
        showEditButton: true
    }
});
