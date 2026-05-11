/**
 * 每日機台檢驗模組配置
 */
ModuleConfig.register('daily_machine_inspections', {
    title: '每日機台檢驗',
    subtitle: '記錄現場設備每日檢點狀態與負責人',

    // 標題區按鈕
    actions: [
        { label: '新增檢驗', icon: 'fa-plus', action: 'create', style: 'primary' }
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
            name: 'is_qualified',
            label: '合格狀態',
            type: 'select',
            placeholder: '全部',
            options: [
                { value: '1', label: '合格' },
                { value: '0', label: '不合格' }
            ]
        },
        { name: 'date_from', label: '日期從', type: 'date' },
        { name: 'date_to', label: '日期至', type: 'date' },
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
        { key: 'inspection_date', label: '檢驗日期', sortable: false, selectable: true },
        { key: 'machine', label: '機台', sortable: false, selectable: true },
        { key: 'inspector', label: '檢驗員', sortable: false, selectable: true },
        { key: 'is_qualified', label: '合格狀態', sortable: false, selectable: true },
        { key: 'notes', label: '備註', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 表單
    modal: {
        title: '新增每日機台檢驗',
        size: 'medium',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '檢驗資訊',
                        fields: [
                            { name: 'inspection_date', label: '檢驗日期', type: 'date', required: true },
                            { name: 'machine_id', label: '機台', type: 'select', required: true, placeholder: '請選擇', options: [] },
                            { name: 'inspector_id', label: '檢驗員', type: 'select', required: true, placeholder: '請選擇', options: [] }
                        ]
                    },
                    {
                        title: '檢驗結果',
                        fields: [
                            { name: 'is_qualified', label: '合格狀態', type: 'select', options: [{ value: '1', label: '合格' }, { value: '0', label: '不合格' }] }
                        ]
                    }
                ]
            }
        ],
        sections: [
            {
                title: '備註',
                fields: [
                    { name: 'notes', label: '備註', type: 'textarea', rows: 3, fullWidth: true, placeholder: '請輸入備註' }
                ]
            }
        ]
    }
});
