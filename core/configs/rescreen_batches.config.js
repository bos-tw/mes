ModuleConfig.register('rescreen_batches', {
    title: '二次篩選歷史紀錄',
    subtitle: '查詢放寬後二篩、客戶每批要求二篩、執行工單與追溯結果',

    requiresHtmlModal: true,
    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    actions: [
        { label: '新增二篩紀錄', icon: 'fa-plus', action: 'create', style: 'primary' }
    ],

    filters: [
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '搜尋二篩編號 / 退貨單 / 出貨單 / 工單 / 客戶' },
        {
            name: 'customer_id',
            label: '客戶',
            type: 'select',
            options: [{ value: '', label: '-- 所有客戶 --' }]
        },
        {
            name: 'rescreen_type',
            label: '二篩類型',
            type: 'select',
            options: [
                { value: '', label: '-- 所有類型 --' },
                { value: 'strict_rescreen', label: '嚴格二篩' },
                { value: 'relaxed_rescreen', label: '放寬二篩' }
            ]
        },
        {
            name: 'status',
            label: '狀態',
            type: 'select',
            options: [
                { value: '', label: '-- 所有狀態 --' },
                { value: 'draft', label: '草稿' },
                { value: 'planned', label: '已排程' },
                { value: 'in_progress', label: '進行中' },
                { value: 'completed', label: '已完成' },
                { value: 'cancelled', label: '已取消' }
            ]
        },
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

    columns: [
        { key: 'rescreen_batch_number', label: '二篩編號', sortable: true, selectable: true },
        { key: 'rescreen_type', label: '二篩方式', sortable: false, selectable: true },
        { key: 'second_screening_reason', label: '二篩原因', sortable: false, selectable: true },
        { key: 'customer_name', label: '客戶', sortable: true, selectable: true },
        { key: 'return_order_number', label: '退貨單', sortable: false, selectable: true },
        { key: 'shipping_order_number', label: '原出貨單', sortable: false, selectable: true },
        { key: 'source_work_order_number', label: '原始工單', sortable: false, selectable: true },
        { key: 'rescreen_work_order_number', label: '二篩工單', sortable: false, selectable: true },
        { key: 'received_total_quantity', label: '來源數量', sortable: false, selectable: true },
        { key: 'status', label: '狀態', sortable: true, selectable: true },
        { key: 'created_at', label: '建立時間', sortable: true, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    detailModal: {
        title: '二次篩選歷史詳情',
        icon: 'fa-redo',
        hasEdit: true
    }
});
