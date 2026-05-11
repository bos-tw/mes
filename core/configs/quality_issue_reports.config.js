/**
 * 品質異常報告模組配置
 */
ModuleConfig.register('quality_issue_reports', {
    title: '品質異常報告',
    subtitle: '記錄與追蹤品質異常問題',

    // 標題區按鈕
    actions: [
        { label: '新增報告', icon: 'fa-plus', action: 'create', style: 'primary' }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選工具列
    filters: [
        {
            name: 'status',
            label: '狀態',
            type: 'select',
            options: [{ value: '', label: '全部狀態' }]
        },
        { name: 'date_from', label: '日期從', type: 'date' },
        { name: 'date_to', label: '日期至', type: 'date' },
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '異常描述搜尋' },
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
        { key: 'report_datetime', label: '報告時間', sortable: false, selectable: true },
        { key: 'reported_by', label: '報告者', sortable: false, selectable: true },
        { key: 'issue_source_type', label: '異常來源', sortable: false, selectable: true },
        { key: 'issue_description', label: '異常描述', sortable: false, selectable: true },
        { key: 'status', label: '狀態', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 配置
    modal: {
        size: 'large',
        createTitle: '新增品質異常報告',
        editTitle: '編輯品質異常報告',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '報告資訊',
                        fields: [
                            { name: 'report_datetime', label: '報告時間', type: 'datetime-local', required: true },
                            {
                                name: 'reported_by_employee_id',
                                label: '報告者',
                                type: 'select',
                                required: true,
                                options: [{ value: '', label: '請選擇' }]
                            },
                            {
                                name: 'responsible_department_id',
                                label: '責任部門',
                                type: 'select',
                                options: [{ value: '', label: '請選擇' }]
                            }
                        ]
                    },
                    {
                        title: '來源與狀態',
                        fields: [
                            {
                                name: 'issue_source_type',
                                label: '異常來源類型',
                                type: 'select',
                                required: true,
                                options: [{ value: '', label: '請選擇' }]
                            },
                            { name: 'issue_source_id', label: '異常來源 ID', type: 'number', placeholder: '關聯單據 ID' },
                            {
                                name: 'status',
                                label: '狀態',
                                type: 'select',
                                options: [{ value: 'pending', label: '待處理' }]
                            },
                            { name: 'completion_date', label: '完成日期', type: 'date' }
                        ]
                    }
                ]
            }
        ],
        sections: [
            {
                title: '異常描述與分析',
                fields: [
                    { name: 'issue_description', label: '異常描述', type: 'textarea', rows: 3, required: true, fullWidth: true, placeholder: '請詳細描述異常情況' },
                    { name: 'root_cause_analysis', label: '根本原因分析', type: 'textarea', rows: 3, fullWidth: true, placeholder: '分析異常發生的根本原因' }
                ]
            },
            {
                title: '改善措施',
                fields: [
                    { name: 'corrective_actions', label: '矯正措施', type: 'textarea', rows: 2, fullWidth: true, placeholder: '採取的矯正措施' },
                    { name: 'preventive_actions', label: '預防措施', type: 'textarea', rows: 2, fullWidth: true, placeholder: '未來的預防措施' }
                ]
            }
        ]
    },

    // 詳情 Modal
    detailModal: {
        title: '品質異常報告詳情',
        titleIcon: 'fa-info-circle',
        showEditButton: true
    }
});
