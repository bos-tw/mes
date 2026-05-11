/**
 * Calendar Event Participants 模組配置
 */
ModuleConfig.register('calendar_event_participants', {
    title: '行事曆參與者',
    subtitle: '管理行事曆事件的參與成員。',

    // 標題區按鈕
    actions: [
        { label: '新增參與者', icon: 'fa-plus', style: 'primary', action: 'add-participant', wrapLabel: true },
        { label: '重新整理', icon: 'fa-sync', style: 'ghost', action: 'refresh-participants', wrapLabel: true }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選欄位
    filters: [
        { name: 'event_id', type: 'number', label: '事件 ID', placeholder: '篩選特定事件' },
        { name: 'keyword', type: 'text', label: '關鍵字', placeholder: '搜尋事件標題或員工姓名' }
    ],

    // 表格欄位
    columns: [
        { key: 'event_title', label: '事件標題', selectable: true },
        { key: 'start_datetime', label: '開始時間', selectable: true },
        { key: 'employee_name', label: '參與員工', selectable: true },
        { key: 'employee_number', label: '員工編號', selectable: true },
        { key: 'actions', label: '操作', selectable: false }
    ],

    // 新增/編輯 Modal
    modal: {
        createTitle: '新增參與者',
        editTitle: '編輯參與者',
        size: 'small',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '參與者資訊',
                        fields: [
                            { name: 'event_id', type: 'select', label: '事件', required: true, options: [{ value: '', label: '請選擇事件' }] },
                            { name: 'employee_id', type: 'select', label: '員工', required: true, options: [{ value: '', label: '請選擇員工' }] }
                        ]
                    }
                ]
            }
        ]
    }
});
