/**
 * 生產紀錄模組配置
 * 此模組為唯讀檢視介面，新增/編輯/刪除請至「生產工單」操作
 */
ModuleConfig.register('production_records', {
    title: '生產紀錄',
    titleIcon: 'fa-industry',
    subtitle: '快速檢視與搜尋生產紀錄（紀錄新增請至「生產工單」操作）',

    // 無新增按鈕（唯讀模式）
    actions: [],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選工具列
    filters: [
        { 
            name: 'work_order_id', 
            label: '工單', 
            type: 'select',
            options: [{ value: '', label: '全部工單' }]
        },
        { 
            name: 'machine_id', 
            label: '機台', 
            type: 'select',
            options: [{ value: '', label: '全部機台' }]
        },
        { 
            name: 'employee_id', 
            label: '作業員', 
            type: 'select',
            options: [{ value: '', label: '全部作業員' }]
        },
        { name: 'date_from', label: '起始日期', type: 'date' },
        { name: 'date_to', label: '結束日期', type: 'date' },
        { name: 'card_number', label: '卡號', type: 'text', placeholder: '搜尋卡號' }
    ],

    // 資料表格欄位
    columns: [
        { key: 'work_order', label: '工單編號', sortable: true, sortKey: 'work_order_number', selectable: true },
        { key: 'card_number', label: '卡號', sortable: true, selectable: true },
        { key: 'production_date', label: '生產日期', sortable: true, selectable: true },
        { key: 'production_time', label: '生產時間', sortable: true, selectable: true },
        { key: 'weight_kg', label: '重量 (kg)', sortable: true, selectable: true },
        { key: 'machine', label: '機台', sortable: true, sortKey: 'machine_name', selectable: true },
        { key: 'employee', label: '作業員', sortable: true, sortKey: 'employee_name', selectable: true },
        { key: 'notes', label: '備註', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // 詳情 Modal（唯讀模式，無編輯按鈕）
    detailModal: {
        title: '生產紀錄詳情',
        titleIcon: 'fa-info-circle',
        showEditButton: false
    }
});
