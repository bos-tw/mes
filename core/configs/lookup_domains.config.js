/**
 * 代碼領域管理模組配置
 */
ModuleConfig.register('lookup_domains', {
    title: '代碼領域',
    subtitle: '管理系統代碼領域設定',

    // 標題區按鈕
    actions: [
        { label: '新增領域', icon: 'fa-plus', action: 'create', style: 'primary' },
        { label: '重新整理', icon: 'fa-sync-alt', action: 'refresh', style: 'outline' }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選工具列
    filters: [
        { name: 'domain_key', label: '領域鍵值', type: 'text', placeholder: '輸入領域鍵值' }
    ],

    // 資料表格欄位
    columns: [
        { key: 'domain_key', label: '領域鍵值', sortable: false, selectable: true },
        { key: 'description', label: '描述', sortable: false, selectable: true },
        { key: 'created_at', label: '建立時間', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 表單
    modal: {
        title: '新增領域',
        size: 'small',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '領域資訊',
                        fields: [
                            { name: 'domain_key', label: '領域鍵值', type: 'text', required: true, placeholder: '例如：status_order' },
                            { name: 'description', label: '描述', type: 'text', placeholder: '請輸入領域描述' }
                        ]
                    }
                ]
            }
        ]
    }
});
