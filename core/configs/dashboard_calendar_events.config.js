/**
 * Dashboard Calendar Events 模組配置
 */
ModuleConfig.register('dashboard_calendar_events', {
    title: '行事曆事件',
    subtitle: '管理系統行事曆事件，整合訂單節點、設備維護與會議排程。',

    // 標題區按鈕
    actions: [
        { label: '新增事件', icon: 'fa-plus', style: 'primary', action: 'add-calendar-event', wrapLabel: true },
        { label: '重新整理', icon: 'fa-sync', style: 'ghost', action: 'refresh-calendar-events', wrapLabel: true }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選欄位
    filters: [
        { name: 'keyword', type: 'text', label: '關鍵字', placeholder: '搜尋標題或描述' },
        {
            name: 'event_type', type: 'select', label: '事件類型',
            options: [
                { value: '', label: '全部' },
                { value: 'meeting', label: '會議' },
                { value: 'maintenance', label: '維護' },
                { value: 'order', label: '訂單節點' },
                { value: 'other', label: '其他' }
            ]
        },
        {
            name: 'status', type: 'select', label: '狀態',
            options: [
                { value: '', label: '全部' },
                { value: 'pending', label: '待處理' },
                { value: 'in_progress', label: '進行中' },
                { value: 'completed', label: '已完成' },
                { value: 'cancelled', label: '已取消' }
            ]
        }
    ],

    // 表格欄位
    columns: [
        { key: 'title', label: '標題', selectable: true },
        { key: 'event_type', label: '事件類型', selectable: true },
        { key: 'start_datetime', label: '開始時間', selectable: true },
        { key: 'end_datetime', label: '結束時間', selectable: true },
        { key: 'expired', label: '是否過期', selectable: true },
        { key: 'status', label: '狀態', selectable: true },
        { key: 'creator', label: '建立者', selectable: true },
        { key: 'actions', label: '操作', selectable: false }
    ],

    // 新增/編輯 Modal
    modal: {
        createTitle: '新增行事曆事件',
        editTitle: '編輯行事曆事件',
        size: 'large',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '基本資訊',
                        gridClass: 'single-column',
                        fields: [
                            { name: 'title', type: 'text', label: '標題', required: true, placeholder: '事件標題' },
                            {
                                name: 'event_type', type: 'select', label: '事件類型', required: true,
                                options: [
                                    { value: '', label: '請選擇' },
                                    { value: 'meeting', label: '會議' },
                                    { value: 'maintenance', label: '維護' },
                                    { value: 'order', label: '訂單節點' },
                                    { value: 'other', label: '其他' }
                                ]
                            },
                            {
                                name: 'status', type: 'select', label: '狀態',
                                options: [
                                    { value: '', label: '請選擇' },
                                    { value: 'pending', label: '待處理' },
                                    { value: 'in_progress', label: '進行中' },
                                    { value: 'completed', label: '已完成' },
                                    { value: 'cancelled', label: '已取消' }
                                ]
                            },
                            {
                                name: 'priority', type: 'select', label: '優先級',
                                options: [
                                    { value: '', label: '請選擇' },
                                    { value: 'low', label: '低' },
                                    { value: 'medium', label: '中' },
                                    { value: 'high', label: '高' },
                                    { value: 'urgent', label: '緊急' }
                                ]
                            }
                        ]
                    },
                    {
                        title: '時間設定',
                        gridClass: 'single-column',
                        fields: [
                            { name: 'start_datetime', type: 'datetime-local', label: '開始時間', required: true },
                            { name: 'end_datetime', type: 'datetime-local', label: '結束時間' },
                            { name: 'is_all_day', type: 'checkbox', label: '全天事件' },
                            { name: 'color', type: 'color', label: '顯示顏色', defaultValue: '#3788d8' }
                        ]
                    }
                ]
            }
        ],
        sections: [
            {
                title: '描述',
                fields: [
                    { name: 'description', type: 'textarea', label: '事件描述', rows: 4, placeholder: '事件詳細描述', fullWidth: true }
                ]
            }
        ]
    }
});
