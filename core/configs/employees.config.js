/**
 * 員工管理模組配置
 */
ModuleConfig.register('employees', {
    title: '員工基本資料',
    subtitle: '維護員工基本資料與帳號資訊',

    // 標題區按鈕
    actions: [
        { label: '新增', icon: 'fa-plus', action: 'create', style: 'primary' },
        {
            label: '批次列印',
            icon: 'fa-print',
            action: 'batch-print',
            style: 'outline',
            wrapLabel: true,
            extraHtml: '\n            <span class="selection-count hidden" data-selection-count>0</span>'
        },
        { label: '批次匯出', icon: 'fa-download', action: 'batch-export', style: 'outline', wrapLabel: true }
    ],

    // 欄位選擇器
    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選工具列
    filters: [
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '員工編號 / 姓名 / 帳號 / Email' },
        {
            name: 'status',
            label: '狀態',
            type: 'select',
            dataAttr: 'data-lookup-domain="EMPLOYEE_STATUS"',
            placeholder: '全部',
            options: []  // 由 JS 動態載入
        },
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
        { key: 'checkbox', label: '', sortable: false, selectable: false, isCheckbox: true },
        { key: 'employee_number', label: '員工編號', sortable: true, selectable: true },
        { key: 'name', label: '姓名', sortable: true, selectable: true },
        { key: 'department.name', label: '所屬部門', sortable: true, selectable: true },
        { key: 'job_title', label: '職稱', sortable: true, selectable: true },
        { key: 'email', label: '電子郵件', sortable: true, selectable: true },
        { key: 'status', label: '狀態', sortable: true, selectable: true },
        { key: 'last_login_at', label: '最近登入', sortable: true, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 表單 - 使用 formRows 二欄佈局
    modal: {
        title: '新增員工',
        size: 'medium',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '帳號資訊',
                        fields: [
                            {
                                name: 'employee_number',
                                label: '員工編號',
                                type: 'text',
                                required: true,
                                maxlength: 50,
                                placeholder: '請輸入員工編號'
                            },
                            {
                                name: 'account',
                                label: '登入帳號',
                                type: 'text',
                                required: true,
                                maxlength: 100,
                                placeholder: '請輸入登入帳號'
                            },
                            {
                                name: 'password',
                                label: '登入密碼',
                                type: 'password',
                                required: true,
                                minlength: 8,
                                labelDataAttr: 'data-password-field',
                                placeholder: '請輸入登入密碼',
                                helpText: '更新時若不變更密碼請留空。'
                            },
                            {
                                name: 'status_lookup_id',
                                label: '狀態',
                                type: 'select',
                                required: true,
                                dataAttr: 'data-lookup-domain="EMPLOYEE_STATUS"',
                                placeholder: '請選擇狀態',
                                options: []
                            }
                        ]
                    },
                    {
                        title: '個人資訊',
                        fields: [
                            {
                                name: 'name',
                                label: '姓名',
                                type: 'text',
                                required: true,
                                maxlength: 100,
                                placeholder: '請輸入員工姓名'
                            },
                            {
                                name: 'email',
                                label: '電子郵件',
                                type: 'email',
                                required: true,
                                maxlength: 100,
                                placeholder: '請輸入電子郵件'
                            },
                            {
                                name: 'department_id',
                                label: '部門',
                                type: 'select',
                                placeholder: '請選擇部門',
                                options: []
                            },
                            {
                                name: 'job_title',
                                label: '職稱',
                                type: 'text',
                                maxlength: 100,
                                placeholder: '請輸入職稱'
                            }
                        ]
                    }
                ]
            }
        ]
    }
});
