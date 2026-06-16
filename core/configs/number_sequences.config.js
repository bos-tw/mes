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
        { name: 'active_on', label: '涵蓋日期', type: 'date' }
    ],

    // 資料表格欄位
    columns: [
        { key: 'seq_key', label: '序列鍵', sortable: false, selectable: true },
        { key: 'seq_prefix', label: '前綴', sortable: false, selectable: true },
        { key: 'active_from', label: '啟用時間', sortable: false, selectable: true },
        { key: 'active_until', label: '停用時間', sortable: false, selectable: true },
        { key: 'current_value', label: '目前值', sortable: false, selectable: true },
        { key: 'updated_at', label: '更新時間', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 表單
    modal: {
        title: '新增流水號',
        size: 'medium',
        className: 'number-sequences-modal',
        hiddenFields: ['id'],
        sections: [
            {
                title: '序列設定',
                fields: [
                    {
                        name: 'seq_key',
                        label: '序列鍵',
                        type: 'select',
                        required: true,
                        options: [
                            { value: 'ORDER', label: 'ORDER - 訂單' },
                            { value: 'WO', label: 'WO - 工單' },
                            { value: 'INV', label: 'INV - 庫存' },
                            { value: 'SO', label: 'SO - 出貨單' },
                            { value: 'RO', label: 'RO - 退貨單' },
                            { value: 'WOPR', label: 'WOPR - 部分入庫' }
                        ],
                        helpText: '管理系統內建單據流水號類型。'
                    },
                    { name: 'seq_prefix', label: '流水號前綴', type: 'text', required: true, placeholder: '例如：ORDER、WO、INV', maxlength: 50 },
                    { name: 'active_from', label: '啟用時間', type: 'datetime-local', required: true, helpText: '此設定開始生效的時間點。' },
                    { name: 'active_until', label: '停用時間', type: 'datetime-local', helpText: '留空代表持續生效，直到後續新規則接手。' },
                    { name: 'current_value', label: '目前值', type: 'number', min: 0, defaultValue: '0', helpText: '下一次產號會從目前值加 1 開始。' }
                ]
            }
        ]
    }
});
