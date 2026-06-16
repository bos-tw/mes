/**
 * 機台能力管理模組配置
 */
ModuleConfig.register('machine_capabilities', {
    title: '機台能力管理',
    subtitle: '維護機台可支援的篩分能力與設備指派依據',

    actions: [
        { label: '新增能力', icon: 'fa-plus', action: 'create', style: 'primary' },
        { label: '重新整理', icon: 'fa-sync-alt', action: 'refresh', style: 'outline' }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    filters: [
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '能力代碼 / 能力名稱 / 描述' },
        {
            name: 'is_active',
            label: '狀態',
            type: 'select',
            options: [
                { value: '', label: '全部狀態' },
                { value: '1', label: '啟用' },
                { value: '0', label: '停用' }
            ]
        }
    ],

    columns: [
        { key: 'capability_code', label: '能力代碼', sortable: false, selectable: true },
        { key: 'capability_name', label: '能力名稱', sortable: false, selectable: true },
        { key: 'description', label: '描述', sortable: false, selectable: true },
        { key: 'machine_count', label: '已套用機台數', sortable: false, selectable: true },
        { key: 'sort_order', label: '排序', sortable: false, selectable: true },
        { key: 'is_active', label: '狀態', sortable: false, selectable: true },
        { key: 'updated_at', label: '更新時間', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    modal: {
        title: '新增機台能力',
        size: 'small',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '能力資訊',
                        fields: [
                            { name: 'capability_code', label: '能力代碼', type: 'text', required: true, maxlength: 50, placeholder: '例如：CONTINUOUS' },
                            { name: 'capability_name', label: '能力名稱', type: 'text', required: true, maxlength: 100, placeholder: '例如：連續' },
                            { name: 'sort_order', label: '排序', type: 'number', min: 0, step: 1, placeholder: '請輸入排序值' },
                            { name: 'is_active', label: '啟用', type: 'checkbox' },
                            { name: 'description', label: '描述', type: 'textarea', rows: 3, fullWidth: true, placeholder: '請輸入能力用途或說明' }
                        ]
                    }
                ]
            }
        ]
    }
});
