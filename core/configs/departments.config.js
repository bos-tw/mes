/**
 * 部門管理模組配置
 */
ModuleConfig.register('departments', {
    title: '部門基本資料',
    subtitle: '維護部門結構與階層資訊',

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
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '搜尋部門名稱' },
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

    // 不使用 data-column 屬性
    noDataColumn: true,

    // 資料表格欄位
    columns: [
        { key: 'name', label: '部門名稱', sortable: true, selectable: true },
        { key: 'parent.name', label: '上級部門', sortable: true, selectable: true },
        { key: 'created_at', label: '建立時間', sortable: true, selectable: true },
        { key: 'updated_at', label: '更新時間', sortable: true, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 表單
    modal: {
        title: '新增部門',
        size: 'small',
        hiddenFields: ['id'],
        sections: [
            {
                title: '基本資訊',
                fields: [
                    { name: 'name', label: '部門名稱', type: 'text', required: true, maxlength: 100, fullWidth: true, placeholder: '請輸入部門名稱' },
                    { name: 'parent_department_id', label: '上級部門 ID', type: 'number', min: 1, step: 1, fullWidth: true, placeholder: '無則留空' }
                ]
            }
        ]
    }
});
