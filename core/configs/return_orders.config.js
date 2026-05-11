/**
 * 退貨單管理模組配置
 */
ModuleConfig.register('return_orders', {
    title: '退貨單',
    subtitle: '管理產品退貨與處理',

    // 啟用混合模式，使用自訂 Modal
    requiresHtmlModal: true,

    // 標題區按鈕
    actions: [
        { label: '新增退貨單', icon: 'fa-plus', action: 'create', style: 'primary' },
        {
            label: '批次列印',
            icon: 'fa-print',
            action: 'batch-print',
            style: 'outline',
            wrapLabel: true,
            extraHtml: '\n            <span class="selection-count hidden" data-selection-count>0</span>'
        },
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
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '搜尋退貨單號、客戶名稱' },
        {
            name: 'customer_id',
            label: '客戶',
            type: 'select',
            options: [{ value: '', label: '-- 所有客戶 --' }]
        },
        {
            name: 'processing_status',
            label: '處理狀態',
            type: 'select',
            options: [
                { value: '', label: '-- 所有狀態 --' },
                { value: 'pending', label: '待處理' },
                { value: 'processing', label: '處理中' },
                { value: 'completed', label: '已完成' },
                { value: 'rejected', label: '已拒絕' }
            ]
        },
        { name: 'start_date', label: '退貨日期(起)', type: 'date' },
        { name: 'end_date', label: '退貨日期(迄)', type: 'date' },
        {
            name: 'perPage',
            label: '每頁筆數',
            type: 'select',
            defaultValue: '20',
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
        { key: 'return_order_number', label: '退貨單號', sortable: true, selectable: true },
        { key: 'customer_name', label: '客戶', sortable: true, selectable: true },
        { key: 'shipping_order_number', label: '原出貨單', sortable: true, selectable: true },
        { key: 'return_date', label: '退貨日期', sortable: true, selectable: true },
        { key: 'item_count', label: '項目數', sortable: false, selectable: true },
        { key: 'total_quantity', label: '退貨總數', sortable: false, selectable: true },
        { key: 'processing_status', label: '處理狀態', sortable: true, selectable: true },
        { key: 'created_at', label: '建立時間', sortable: true, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false } // 包含列印、檢視、編輯、刪除
    ],

    // 移除 modal 配置，使用 mixed mode 的 HTML modal
    /* modal: { ... } */

    // 詳情 Modal 保留或移除視情況而定，如果需要自訂詳情也建議用 HTML
    detailModal: {
        title: '退貨單詳情',
        icon: 'fa-undo-alt',
        hasEdit: true
    }
});
