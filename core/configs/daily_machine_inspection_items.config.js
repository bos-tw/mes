/**
 * 機台檢驗項目明細設定模組配置
 */
ModuleConfig.register('daily_machine_inspection_items', {
    title: '機台檢驗項目明細設定',
    subtitle: '每日機台檢驗的項目明細與實際檢查結果',

    // 標題區按鈕
    actions: [
        { label: '新增項目', icon: 'fa-plus', action: 'create', style: 'primary' }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選工具列
    filters: [
        {
            name: 'inspection_id',
            label: '所屬檢驗',
            type: 'select',
            placeholder: '全部檢驗',
            options: []
        },
        {
            name: 'is_pass',
            label: '通過狀態',
            type: 'select',
            placeholder: '全部',
            options: [
                { value: '1', label: '通過' },
                { value: '0', label: '不通過' }
            ]
        },
        { name: 'keyword', label: '項目名稱', type: 'text', placeholder: '搜尋項目名稱' },
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
        { key: 'inspection', label: '所屬檢驗', sortable: false, selectable: true },
        { key: 'item_name', label: '檢驗項目', sortable: false, selectable: true },
        { key: 'standard', label: '標準', sortable: false, selectable: true },
        { key: 'actual_result', label: '實際結果', sortable: false, selectable: true },
        { key: 'is_pass', label: '是否通過', sortable: false, selectable: true },
        { key: 'remarks', label: '備註', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 表單
    modal: {
        title: '新增檢驗項目明細',
        size: 'medium',        hiddenFields: ['id'],        formRows: [
            {
                sections: [
                    {
                        title: '基本資訊',
                        fields: [
                            { name: 'inspection_id', label: '所屬檢驗紀錄', type: 'select', required: true, placeholder: '請選擇', options: [] },
                            { name: 'item_name', label: '檢驗項目名稱', type: 'text', required: true, maxlength: 100, placeholder: '請輸入檢驗項目' },
                            { name: 'is_pass', label: '是否通過', type: 'select', options: [{ value: '1', label: '通過' }, { value: '0', label: '不通過' }] }
                        ]
                    },
                    {
                        title: '檢驗結果',
                        fields: [
                            { name: 'standard', label: '檢驗標準', type: 'text', maxlength: 255, placeholder: '標準值或範圍' },
                            { name: 'actual_result', label: '實際結果', type: 'text', maxlength: 255, placeholder: '實際量測值' },
                            { name: 'remarks', label: '備註', type: 'text', maxlength: 255, placeholder: '備註說明' }
                        ]
                    }
                ]
            }
        ]
    }
});
