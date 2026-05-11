/**
 * Domain Event Outbox 模組配置
 */
ModuleConfig.register('domain_event_outbox', {
    title: '領域事件Outbox',
    subtitle: '管理系統領域事件的發送與處理狀態',
    icon: 'fa-envelope-open-text',

    // 標題區按鈕
    actions: [
        { label: '新增事件', icon: 'fa-plus', style: 'primary', action: 'add-event' },
        { label: '重新整理', icon: 'fa-sync-alt', style: 'outline', action: 'refresh-events' }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選欄位
    filters: [
        { name: 'aggregate_type', type: 'text', label: '聚合類型', placeholder: '輸入聚合類型' },
        { name: 'event_type', type: 'text', label: '事件類型', placeholder: '輸入事件類型' },
        {
            name: 'process_status', type: 'select', label: '處理狀態',
            options: [
                { value: '', label: '全部' },
                { value: 'pending', label: '待處理' },
                { value: 'processing', label: '處理中' },
                { value: 'processed', label: '已處理' },
                { value: 'failed', label: '失敗' }
            ]
        }
    ],

    // 表格欄位
    columns: [
        { key: 'aggregate_type', label: '聚合類型', selectable: true },
        { key: 'event_type', label: '事件類型', selectable: true },
        { key: 'process_status', label: '處理狀態', selectable: true },
        { key: 'retry_count', label: '重試次數', selectable: true },
        { key: 'created_at', label: '建立時間', selectable: true },
        { key: 'actions', label: '操作', selectable: false }
    ],

    // 新增/編輯 Modal
    modal: {
        createTitle: '新增事件',
        editTitle: '編輯事件',
        size: 'large',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '聚合資訊',
                        fields: [
                            { name: 'aggregate_type', type: 'text', label: '聚合類型', required: true, placeholder: '例如：Order, Customer' },
                            { name: 'aggregate_id', type: 'number', label: '聚合 ID', required: true, placeholder: '請輸入聚合 ID' }
                        ]
                    },
                    {
                        title: '事件資訊',
                        fields: [
                            { name: 'event_type', type: 'text', label: '事件類型', required: true, placeholder: '例如：Created, Updated' },
                            { name: 'process_status', type: 'select', label: '處理狀態', options: [{ value: 'pending', label: '待處理' }, { value: 'processing', label: '處理中' }, { value: 'processed', label: '已處理' }, { value: 'failed', label: '失敗' }] }
                        ]
                    }
                ]
            }
        ],
        sections: [
            {
                title: 'Payload',
                fields: [
                    { name: 'payload', type: 'textarea', label: 'Payload (JSON)', rows: 6, placeholder: '{"key": "value"}', fullWidth: true }
                ]
            }
        ]
    },

    // 詳情 Modal
    detailModal: {
        title: '事件詳情',
        icon: 'fa-info-circle',
        size: 'large'
    }
});
