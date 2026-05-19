/**
 * 角色權限關聯模組配置
 */
ModuleConfig.register('role_permissions', {
    title: '角色權限關聯',
    subtitle: '檢視各權限可瀏覽的角色並快速調整',

    // 標題區按鈕
    actions: [],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選工具列
    filters: [
        {
            name: 'permission_id',
            label: '權限',
            type: 'select',
            options: [{ value: '', label: '全部權限' }]
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
        { key: 'permission_name', label: '權限名稱', sortable: false, selectable: true },
        { key: 'roles_summary', label: '可瀏覽角色', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 配置
    modal: {
        size: 'medium',
        createTitle: '編輯權限可瀏覽角色',
        editTitle: '編輯權限可瀏覽角色',
        hiddenFields: ['id', 'permission_id'],
        sections: [
            {
                title: '權限設定',
                fields: [
                    { name: 'permission_name', label: '權限名稱', type: 'text', readonly: true, disabled: true, fullWidth: true }
                ]
            },
            {
                title: '角色調整',
                className: 'role-permission-transfer-section',
                gridColumns: 3,
                fields: [
                    {
                        name: 'available_role_ids',
                        label: '未加入',
                        type: 'select',
                        required: false,
                        multiple: true,
                        attributes: { size: '12' },
                        options: [],
                        containerDataAttr: 'data-role-permissions-available-container'
                    },
                    {
                        name: 'transfer_controls',
                        label: '調整',
                        type: 'static',
                        value: '',
                        containerDataAttr: 'data-role-permissions-transfer-controls'
                    },
                    {
                        name: 'role_ids',
                        label: '已加入',
                        type: 'select',
                        required: false,
                        multiple: true,
                        attributes: { size: '12' },
                        options: [],
                        containerDataAttr: 'data-role-permissions-selected-container'
                    }
                ]
            }
        ]
    }
});
