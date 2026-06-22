/**
 * 不良品歷史紀錄模組配置
 */
ModuleConfig.register('defect_history_records', {
    title: '不良品歷史紀錄',
    subtitle: '整合工單不良與出貨不良摘要，供訂單與工單追溯查詢',

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    filters: [
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '訂單 / 工單 / 出貨單 / 客戶 / 不良項目' },
        {
            name: 'source_type',
            label: '來源類型',
            type: 'select',
            options: [{ value: '', label: '全部來源' }]
        },
        {
            name: 'customer_id',
            label: '客戶',
            type: 'select',
            options: [{ value: '', label: '全部客戶' }]
        },
        { name: 'date_from', label: '起始日期', type: 'date' },
        { name: 'date_to', label: '結束日期', type: 'date' },
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
        { key: 'occurred_at', label: '發生時間', sortable: false, selectable: true },
        { key: 'source_type_label', label: '來源', sortable: false, selectable: true },
        { key: 'order_number', label: '訂單編號', sortable: false, selectable: true },
        { key: 'work_order_number', label: '工單編號', sortable: false, selectable: true },
        { key: 'shipping_order_number', label: '出貨單編號', sortable: false, selectable: true },
        { key: 'customer_name', label: '客戶', sortable: false, selectable: true },
        { key: 'defect_item_name', label: '不良項目', sortable: false, selectable: true },
        { key: 'recorded_defect_quantity', label: '記錄數量', sortable: false, selectable: true },
        { key: 'defect_units_estimated', label: '推算不良支數', sortable: false, selectable: true },
        { key: 'defect_weight_kg', label: '推算不良重量(kg)', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    detailModal: {
        title: '不良品歷史詳情',
        titleIcon: 'fa-info-circle',
        size: 'large',
        showEditButton: false
    }
});
