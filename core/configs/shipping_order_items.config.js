/**
 * 出貨品項模組配置
 * 僅查詢功能，無新增/編輯 Modal
 */
ModuleConfig.register('shipping_order_items', {
    title: '出貨品項',
    subtitle: '查詢所有出貨單的品項明細，支援跨出貨單統計分析',

    // 無標題按鈕（僅查詢模組）
    actions: [],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 統計摘要卡片
    summaryCards: [
        {
            icon: 'fa-box',
            label: '總項目數',
            dataAttr: 'data-total-items',
            defaultValue: '0'
        },
        {
            icon: 'fa-calculator',
            label: '總出貨數量',
            dataAttr: 'data-total-quantity',
            defaultValue: '0'
        }
    ],

    // 篩選欄位
    filters: [
        { name: 'keyword', type: 'text', label: '關鍵字', placeholder: '庫存編號/產品/出貨單號' },
        { name: 'customer_id', type: 'select', label: '客戶', options: [{ value: '', label: '-- 所有客戶 --' }] },
        { name: 'status', type: 'select', label: '出貨單狀態', options: [{ value: '', label: '-- 所有狀態 --' }] },
        { name: 'start_date', type: 'date', label: '出貨日期(起)' },
        { name: 'end_date', type: 'date', label: '出貨日期(迄)' },
        { name: 'perPage', type: 'select', label: '每頁筆數', options: [
            { value: '10', label: '10' },
            { value: '20', label: '20', selected: true },
            { value: '50', label: '50' },
            { value: '100', label: '100' }
        ]}
    ],

    // 表格欄位
    columns: [
        { key: 'shipping_order_number', label: '出貨單號', sortable: true, sortKey: 'so.shipping_order_number', selectable: true },
        { key: 'customer_name', label: '客戶', sortable: true, sortKey: 'c.name', selectable: true },
        { key: 'inventory_number', label: '庫存編號', sortable: true, sortKey: 'ii.inventory_number', selectable: true },
        { key: 'screening_item_name', label: '產品名稱', selectable: true },
        { key: 'shipped_quantity', label: '出貨數量', sortable: true, sortKey: 'soi.shipped_quantity', selectable: true },
        { key: 'net_weight_kg', label: '單位淨重(kg)', selectable: true },
        { key: 'shipping_date', label: '出貨日期', sortable: true, sortKey: 'so.shipping_date', selectable: true },
        { key: 'order_status', label: '狀態', sortable: true, sortKey: 'so.status', selectable: true },
        { key: 'created_at', label: '建立時間', sortable: true, sortKey: 'soi.created_at', selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ]

    // 無 Modal（僅查詢模組）
});
