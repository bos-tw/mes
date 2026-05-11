/**
 * 出貨單管理模組配置
 */
ModuleConfig.register('shipping_orders', {
    title: '出貨單',
    subtitle: '管理產品出貨與配送',

    // 標題區按鈕
    actions: [
        { label: '新增出貨單', icon: 'fa-plus', action: 'create', style: 'primary' },
        { label: '批次列印', icon: 'fa-print', action: 'batch-print', style: 'outline', wrapLabel: true },
        { label: '批次匯出', icon: 'fa-download', action: 'batch-export', style: 'outline', wrapLabel: true }
    ],

    // 欄位選擇器
    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選工具列
    filters: [
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '搜尋出貨單號、客戶名稱' },
        {
            name: 'customer_id',
            label: '客戶',
            type: 'select',
            options: [{ value: '', label: '-- 所有客戶 --' }]
        },
        {
            name: 'status',
            label: '狀態',
            type: 'select',
            options: [
                { value: '', label: '-- 所有狀態 --' },
                { value: 'draft', label: '草稿' },
                { value: 'confirmed', label: '已確認' },
                { value: 'shipped', label: '已出貨' },
                { value: 'delivered', label: '已送達' },
                { value: 'cancelled', label: '已取消' }
            ]
        },
        { name: 'start_date', label: '出貨日期(起)', type: 'date' },
        { name: 'end_date', label: '出貨日期(迄)', type: 'date' },
        {
            name: 'perPage',
            label: '每頁筆數',
            type: 'select',
            options: [
                { value: '10', label: '10' },
                { value: '20', label: '20', selected: true },
                { value: '50', label: '50' }
            ]
        }
    ],

    // 資料表格欄位
    columns: [
        { key: 'checkbox', label: '', sortable: false, selectable: false, isCheckbox: true },
        { key: 'shipping_order_number', label: '出貨單號', sortable: true, selectable: true },
        { key: 'customer_name', label: '客戶', sortable: true, selectable: true },
        { key: 'shipping_date', label: '出貨日期', sortable: true, selectable: true },
        { key: 'item_count', label: '項目數', sortable: false, selectable: true },
        { key: 'total_quantity', label: '總數量', sortable: false, selectable: true },
        { key: 'delivery_method', label: '配送方式', sortable: true, selectable: true },
        { key: 'status', label: '狀態', sortable: true, selectable: true },
        { key: 'created_at', label: '建立時間', sortable: true, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 表單
    modal: {
        title: '新增出貨單',
        size: 'large',
        submitDataAction: 'submit',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '基本資訊',
                        gridColumns: 2,
                        fields: [
                            { name: 'shipping_order_number', label: '出貨單號', type: 'text', required: true, placeholder: '自動產生', readonly: true },
                            {
                                name: 'customer_id',
                                label: '客戶',
                                type: 'select',
                                required: true,
                                options: [{ value: '', label: '-- 請選擇客戶 --' }]
                            },
                            {
                                name: 'order_id',
                                label: '關聯訂單',
                                type: 'select',
                                options: [{ value: '', label: '-- 不關聯訂單 --' }]
                            },
                            { name: 'shipping_date', label: '出貨日期', type: 'date' },
                            {
                                name: 'delivery_method',
                                label: '配送方式',
                                type: 'select',
                                options: [
                                    { value: '', label: '-- 請選擇 --' },
                                    { value: 'pickup', label: '自取' },
                                    { value: 'delivery', label: '宅配' },
                                    { value: 'freight', label: '貨運' }
                                ]
                            },
                            {
                                name: 'status',
                                label: '狀態',
                                type: 'select',
                                required: true,
                                options: [
                                    { value: 'draft', label: '草稿' },
                                    { value: 'confirmed', label: '已確認' },
                                    { value: 'shipped', label: '已出貨' },
                                    { value: 'delivered', label: '已送達' },
                                    { value: 'cancelled', label: '已取消' }
                                ]
                            }
                        ]
                    },
                    {
                        title: '收件與追蹤',
                        gridColumns: 2,
                        fields: [
                            { name: 'consignee_name', label: '收件人', type: 'text', placeholder: '收件人姓名' },
                            { name: 'carrier', label: '物流公司', type: 'text', placeholder: '例如：宅配通、黑貓...' },
                            { name: 'consignee_address', label: '收件地址', type: 'text', fullWidth: true, placeholder: '收件地址' },
                            { name: 'tracking_number', label: '追蹤編號', type: 'text', fullWidth: true, placeholder: '貨運追蹤編號' }
                        ]
                    }
                ]
            }
        ],
        sections: [
            {
                title: '備註',
                gridColumns: 2,
                fields: [
                    { name: 'notes', label: '備註', type: 'textarea', rows: 2, fullWidth: true, placeholder: '出貨備註（選填）' }
                ]
            }
        ]
    },

    // 詳情 Modal
    detailModal: {
        title: '出貨單詳情',
        icon: 'fa-shipping-fast',
        hasEdit: true,
        hasPrint: true
    },

    // 新增出貨項目 Modal
    addItemModal: {
        title: '新增出貨項目',
        icon: 'fa-plus',
        size: 'medium',
        sections: [
            {
                title: '選擇庫存項目',
                fields: [
                    {
                        name: 'inventory_item_id',
                        label: '庫存項目',
                        type: 'select',
                        required: true,
                        options: [{ value: '', label: '載入中...' }]
                    },
                    { name: 'quantity', label: '出貨數量', type: 'number', required: true, min: 1, placeholder: '輸入數量' }
                ]
            },
            {
                title: '項目資訊',
                customHtml: `
                <div class="detail-grid" data-selected-item-info>
                    <p class="text-muted">請先選擇庫存項目</p>
                </div>`
            },
            {
                title: '備註',
                fields: [
                    { name: 'notes', label: '備註', type: 'textarea', rows: 2, fullWidth: true, placeholder: '項目備註（選填）' }
                ]
            }
        ],
        submitLabel: '加入',
        submitIcon: 'fa-plus',
        submitStyle: 'success'
    }
});
