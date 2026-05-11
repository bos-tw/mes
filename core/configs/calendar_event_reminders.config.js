/**
 * Calendar Event Reminders 模組配置
 */
ModuleConfig.register('calendar_event_reminders', {
    title: '行事曆提醒',
    subtitle: '管理行事曆事件的提醒設定。',

    // 標題區按鈕
    actions: [
        { label: '新增提醒', icon: 'fa-plus', style: 'primary', action: 'add-reminder' },
        { label: '重新整理', icon: 'fa-sync-alt', style: 'outline', action: 'refresh-reminders' }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選欄位
    filters: [
        { name: 'event_id', type: 'number', label: '事件ID', placeholder: '請輸入事件ID' },
        {
            name: 'is_sent', type: 'select', label: '發送狀態',
            options: [
                { value: '', label: '全部' },
                { value: '0', label: '待發送' },
                { value: '1', label: '已發送' }
            ]
        }
    ],

    // 表格欄位
    columns: [
        { key: 'event_title', label: '事件標題', selectable: true },
        { key: 'employee_name', label: '提醒員工', selectable: true },
        { key: 'reminder_datetime', label: '提醒時間', selectable: true },
        { key: 'reminder_type', label: '提醒方式', selectable: true },
        { key: 'is_sent', label: '發送狀態', selectable: true },
        { key: 'actions', label: '操作', selectable: false }
    ],

    // 新增/編輯 Modal
    modal: {
        createTitle: '新增提醒',
        editTitle: '編輯提醒',
        size: 'medium',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '事件設定',
                        fields: [
                            { name: 'event_id', type: 'select', label: '事件', required: true, options: [{ value: '', label: '請選擇事件' }] },
                            { name: 'employee_id', type: 'select', label: '提醒員工', required: true, options: [{ value: '', label: '請選擇員工' }] }
                        ]
                    },
                    {
                        title: '提醒設定',
                        fields: [
                            { name: 'reminder_datetime', type: 'datetime-local', label: '提醒時間', required: true },
                            { name: 'reminder_type', type: 'select', label: '提醒方式', options: [{ value: '', label: '請選擇' }, { value: 'email', label: 'Email' }, { value: 'system', label: '系統通知' }, { value: 'sms', label: '簡訊' }] }
                        ]
                    }
                ]
            }
        ]
    }
});
