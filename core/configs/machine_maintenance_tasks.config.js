/**
 * 機台維修任務模組配置
 */
ModuleConfig.register('machine_maintenance_tasks', {
    title: '機台維修任務',
    subtitle: '排程與管理機台保養、故障維修與例行檢查',

    // 標題區按鈕
    actions: [
        { label: '新增任務', icon: 'fa-plus', action: 'create', style: 'primary' }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選工具列
    filters: [
        {
            name: 'machine_id',
            label: '機台',
            type: 'select',
            placeholder: '全部機台',
            options: []
        },
        {
            name: 'task_type',
            label: '任務類型',
            type: 'select',
            placeholder: '全部類型',
            options: []
        },
        {
            name: 'status',
            label: '狀態',
            type: 'select',
            placeholder: '全部狀態',
            options: []
        },
        { name: 'date_from', label: '預定日期從', type: 'date' },
        { name: 'date_to', label: '預定日期至', type: 'date' },
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
        { key: 'machine', label: '機台', sortable: false, selectable: true },
        { key: 'task_type', label: '任務類型', sortable: false, selectable: true },
        { key: 'title', label: '標題', sortable: false, selectable: true },
        { key: 'scheduled_start', label: '預定開始', sortable: false, selectable: true },
        { key: 'scheduled_end', label: '預定結束', sortable: false, selectable: true },
        { key: 'status', label: '狀態', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 表單
    modal: {
        title: '新增機台維修任務',
        size: 'large',        hiddenFields: ['id'],        formRows: [
            {
                sections: [
                    {
                        title: '基本資訊',
                        fields: [
                            { name: 'machine_id', label: '機台', type: 'select', required: true, placeholder: '請選擇', options: [] },
                            { name: 'task_type', label: '任務類型', type: 'select', required: true, placeholder: '請選擇', options: [] },
                            { name: 'status', label: '狀態', type: 'select', options: [{ value: 'pending', label: '待執行' }] }
                        ]
                    },
                    {
                        title: '時間排程',
                        fields: [
                            { name: 'scheduled_start', label: '預定開始', type: 'datetime-local', required: true },
                            { name: 'scheduled_end', label: '預定結束', type: 'datetime-local' },
                            { name: 'next_due_date', label: '下次到期日', type: 'date' }
                        ]
                    }
                ]
            },
            {
                sections: [
                    {
                        title: '實際執行時間',
                        fields: [
                            { name: 'actual_start', label: '實際開始', type: 'datetime-local' },
                            { name: 'actual_end', label: '實際結束', type: 'datetime-local' }
                        ]
                    }
                ]
            }
        ],
        sections: [
            {
                title: '任務內容',
                fields: [
                    { name: 'title', label: '任務標題', type: 'text', required: true, maxlength: 150, fullWidth: true, placeholder: '請輸入任務標題' },
                    { name: 'description', label: '任務描述', type: 'textarea', rows: 3, fullWidth: true, placeholder: '請輸入任務詳細描述' }
                ]
            }
        ]
    }
});
