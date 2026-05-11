/**
 * 角色權限關聯模組配置
 */
ModuleConfig.register('role_permissions', {
    title: '角色權限關聯',
    subtitle: '設定角色可使用的功能權限',

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
            name: 'role_id',
            label: '角色',
            type: 'select',
            options: [{ value: '', label: '全部角色' }]
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
        { key: 'role_name', label: '角色名稱', sortable: false, selectable: true },
        { key: 'permission_name', label: '權限名稱', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 配置
    modal: {
        size: 'small',
        createTitle: '新增角色權限',
        editTitle: '編輯角色權限',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '指派權限',
                        fields: [
                            { name: 'role_id', label: '角色', type: 'select', required: true, options: [{ value: '', label: '請選擇角色' }] },
                            { name: 'permission_id', label: '權限', type: 'select', required: true, options: [{ value: '', label: '請選擇權限' }] }
                        ]
                    }
                ]
            }
        ]
    }
});
