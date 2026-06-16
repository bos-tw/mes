/**
 * 機台設備管理模組配置
 */
ModuleConfig.register('machines', {
    title: '機台設備管理',
    subtitle: '維護機台基本資料與運轉狀態',

    // 標題區按鈕
    actions: [
        { label: '新增', icon: 'fa-plus', action: 'create', style: 'primary' },
        { label: '列印', icon: 'fa-print', action: 'print', style: 'outline', wrapLabel: true }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選工具列
    filters: [
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '機台編號 / 名稱 / 型號 / 備註' },
        {
            name: 'status_lookup_id',
            label: '機台狀態',
            type: 'select',
            dataAttr: 'data-lookup-domain="MACHINE_STATUS"',
            placeholder: '全部狀態',
            options: []
        },
        {
            name: 'department_id',
            label: '責任部門',
            type: 'select',
            placeholder: '全部部門',
            options: []
        },
        {
            name: 'machine_capability_id',
            label: '機台能力',
            type: 'select',
            placeholder: '全部能力',
            options: []
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

    // 不使用 data-column，表頭無排序
    noDataColumn: true,
    noSort: true,

    // 資料表格欄位（無排序）
    columns: [
        { key: 'machine_number', label: '機台編號', sortable: false, selectable: true },
        { key: 'name', label: '名稱', sortable: false, selectable: true },
        { key: 'model', label: '型號', sortable: false, selectable: true },
        { key: 'department', label: '責任部門', sortable: false, selectable: true },
        { key: 'capability_names', label: '機台能力', sortable: false, selectable: true },
        { key: 'lens_count', label: '鏡頭數', sortable: false, selectable: true },
        { key: 'length_mm', label: '長度 (mm)', sortable: false, selectable: true },
        { key: 'thread_outer_diameter_mm', label: '牙外徑 (mm)', sortable: false, selectable: true },
        { key: 'status', label: '狀態', sortable: false, selectable: true },
        { key: 'updated_at', label: '更新時間', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 表單 - 使用 formRows 模式（並排 section）
    modal: {
        title: '新增機台',
        size: 'large',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '基本資訊',
                        fields: [
                            { name: 'machine_number', label: '機台編號', type: 'text', required: true, maxlength: 50, placeholder: '請輸入機台編號' },
                            { name: 'name', label: '機台名稱', type: 'text', required: true, maxlength: 100, placeholder: '請輸入機台名稱' },
                            { name: 'model', label: '型號', type: 'text', maxlength: 100, placeholder: '請輸入機台型號' },
                            { name: 'department_id', label: '責任部門', type: 'select', placeholder: '請選擇部門', options: [] },
                            { name: 'status_lookup_id', label: '機台狀態', type: 'select', dataAttr: 'data-lookup-domain="MACHINE_STATUS"', placeholder: '請選擇狀態', options: [] },
                            { name: 'machine_capability_id', label: '機台能力', type: 'select', placeholder: '請選擇機台能力', options: [], helpText: '每台機台對應一種篩分能力類型。' }
                        ]
                    },
                    {
                        title: '規格資訊',
                        fields: [
                            { name: 'purchase_date', label: '採購日期', type: 'date', placeholder: 'YYYY-MM-DD' },
                            { name: 'lens_count', label: '鏡頭數', type: 'number', min: 0, step: 1, placeholder: '請輸入鏡頭數量' },
                            { name: 'length_mm', label: '長度 (mm)', type: 'number', min: 0, step: 0.01, placeholder: '請輸入長度' },
                            { name: 'thread_outer_diameter_mm', label: '牙外徑 (mm)', type: 'number', min: 0, step: 0.01, placeholder: '請輸入牙外徑' },
                            { name: 'notes', label: '備註', type: 'textarea', rows: 3, fullWidth: true, placeholder: '請輸入備註' }
                        ]
                    }
                ]
            }
        ]
    }
});
