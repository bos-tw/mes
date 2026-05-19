/**
 * 員工角色關聯模組配置
 */
ModuleConfig.register('employee_roles', {
    title: '員工角色關聯',
    subtitle: '設定員工所屬的角色',

    // 標題區按鈕
    actions: [
        { label: '新增關聯', icon: 'fa-plus', action: 'create', style: 'primary' }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選工具列
    filters: [
        {
            name: 'employee_id',
            label: '員工',
            type: 'select',
            options: [{ value: '', label: '全部員工' }]
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

    // 資料表格欄位
    columns: [
        { key: 'employee_name', label: '員工', sortable: false, selectable: true },
        { key: 'role_name', label: '角色', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 配置
    modal: {
        size: 'small',
        createTitle: '新增員工角色',
        editTitle: '編輯員工角色',
        hiddenFields: ['id'],
        sections: [
            {
                title: '指派角色',
                fields: [
                    { name: 'employee_id', label: '員工', type: 'select', required: true, options: [{ value: '', label: '請選擇員工' }], fullWidth: true },
                    { name: 'role_id', label: '角色', type: 'select', required: true, options: [{ value: '', label: '請選擇角色' }], fullWidth: true }
                ]
            }
        ]
    }
});
