/**
 * 流水號管理模組配置
 */
ModuleConfig.register('number_sequences', {
    title: '流水號管理',
    subtitle: '管理系統流水號序列。',

    // 標題區按鈕
    actions: [
        { label: '新增流水號', icon: 'fa-plus', action: 'create', style: 'primary', wrapLabel: true },
        { label: '重新整理', icon: 'fa-sync', action: 'refresh', style: 'outline', wrapLabel: true }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選工具列
    filters: [
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '搜尋序列鍵' },
        { name: 'date_scope', label: '日期範圍', type: 'date' }
    ],

    // 資料表格欄位
    columns: [
        { key: 'seq_key', label: '序列鍵', sortable: false, selectable: true },
        { key: 'date_scope', label: '日期範圍', sortable: false, selectable: true },
        { key: 'current_value', label: '目前值', sortable: false, selectable: true },
        { key: 'updated_at', label: '更新時間', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 表單
    modal: {
        title: '新增流水號',
        size: 'small',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '序列設定',
                        fields: [
                            { name: 'seq_key', label: '序列鍵', type: 'text', required: true, placeholder: '例如：ORDER' },
                            { name: 'date_scope', label: '日期範圍', type: 'date', required: true },
                            { name: 'current_value', label: '目前值', type: 'number', min: 0, defaultValue: '0' }
                        ]
                    }
                ]
            }
        ]
    }
});
