/**
 * 系統參數管理模組配置
 */
ModuleConfig.register('system_parameters', {
    title: '系統參數',
    subtitle: '管理系統全域參數設定。',

    // 標題區按鈕
    actions: [
        { label: '新增參數', icon: 'fa-plus', action: 'create', style: 'primary', wrapLabel: true },
        { label: '重新整理', icon: 'fa-sync', action: 'refresh', style: 'outline', wrapLabel: true }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選工具列
    filters: [
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '搜尋參數鍵值、參數值或描述' }
    ],

    // 資料表格欄位
    columns: [
        { key: 'param_key', label: '參數鍵值', sortable: false, selectable: true },
        { key: 'param_value', label: '參數值', sortable: false, selectable: true },
        { key: 'description', label: '描述', sortable: false, selectable: true },
        { key: 'updated_at', label: '更新時間', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 表單
    modal: {
        title: '新增系統參數',
        size: 'medium',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '參數設定',
                        fields: [
                            { name: 'param_key', label: '參數鍵值', type: 'text', required: true, placeholder: '例如：company_name' },
                            { name: 'description', label: '描述', type: 'text', placeholder: '參數描述' }
                        ]
                    }
                ]
            }
        ],
        sections: [
            {
                title: '參數內容',
                fields: [
                    { name: 'param_value', label: '參數值', type: 'textarea', rows: 4, required: true, fullWidth: true, placeholder: '請輸入參數值' }
                ]
            }
        ]
    }
});
