/**
 * 載具管理模組配置
 */
ModuleConfig.register('tools', {
    title: '載具管理',
    subtitle: '維護載具基本資料與重量容量資訊',

    // 標題區按鈕
    actions: [
        { label: '新增', icon: 'fa-plus', action: 'create', style: 'primary' },
        { label: '列印', icon: 'fa-print', action: 'print', style: 'outline', wrapLabel: true }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選工具列
    filters: [
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '載具編號 / 名稱 / 位置' },
        {
            name: 'status',
            label: '狀態',
            type: 'select',
            dataAttr: 'data-lookup-domain="TOOL_STATUS"',
            placeholder: '全部',
            options: []  // 由 JS 動態載入
        },
        { name: 'type', label: '類型', type: 'text', placeholder: '例如：桶 / 箱 / 車' },
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
        { key: 'tool_number', label: '載具編號', sortable: true, selectable: true },
        { key: 'name', label: '名稱', sortable: true, selectable: true },
        { key: 'type', label: '類型', sortable: true, selectable: true },
        { key: 'status', label: '狀態', sortable: true, selectable: true },
        { key: 'current_location', label: '目前位置', sortable: true, selectable: true },
        { key: 'weight_kg', label: '重量(kg)', sortable: true, selectable: true },
        { key: 'capacity_kg', label: '最大承重(kg)', sortable: true, selectable: true },
        { key: 'updated_at', label: '更新時間', sortable: true, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 表單 - 使用 formRows 二欄佈局
    modal: {
        title: '新增載具',
        size: 'large',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '基本資訊',
                        fields: [
                            {
                                name: 'tool_number',
                                label: '載具編號',
                                type: 'text',
                                required: true,
                                maxlength: 50,
                                placeholder: '請輸入載具編號'
                            },
                            {
                                name: 'name',
                                label: '載具名稱',
                                type: 'text',
                                required: true,
                                maxlength: 100,
                                placeholder: '請輸入載具名稱'
                            },
                            {
                                name: 'type',
                                label: '類型',
                                type: 'text',
                                maxlength: 50,
                                placeholder: '請輸入載具類型'
                            },
                            {
                                name: 'status_lookup_id',
                                label: '狀態',
                                type: 'select',
                                dataAttr: 'data-lookup-domain="TOOL_STATUS"',
                                placeholder: '請選擇狀態',
                                options: []
                            }
                        ]
                    },
                    {
                        title: '規格資訊',
                        fields: [
                            {
                                name: 'current_location',
                                label: '目前位置',
                                type: 'text',
                                maxlength: 100,
                                placeholder: '請輸入目前位置'
                            },
                            {
                                name: 'weight_kg',
                                label: '重量(kg)',
                                type: 'number',
                                required: true,
                                min: 0,
                                step: 0.01,
                                placeholder: '請輸入重量'
                            },
                            {
                                name: 'capacity_kg',
                                label: '最大承重(kg)',
                                type: 'number',
                                min: 0,
                                step: 0.01,
                                placeholder: '請輸入最大承重'
                            }
                        ]
                    }
                ]
            }
        ]
    }
});
