/**
 * 角色設定模組配置
 */
(function() {
    'use strict';

    ModuleConfig.register('roles', {
        title: '角色設定',
        subtitle: '管理系統角色與權限群組',

        // 標題列動作按鈕
        actions: [
            { action: 'create', label: '新增角色', icon: 'fa-plus', style: 'primary' }
        ],

        hasColumnSelector: true,
        tableHeaderActions: true,
        tableHeaderActionsInHeader: true,
        filterLayout: 'drawer',
        useGenericFilterDrawer: true,

        // 篩選欄位
        filters: [
            {
                name: 'keyword',
                label: '關鍵字',
                type: 'text',
                placeholder: '搜尋角色名稱、描述...'
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

        // 表格欄位
        columns: [
            { key: 'name', label: '角色名稱', sortable: false, selectable: true },
            { key: 'description', label: '描述', sortable: false, selectable: true },
            { key: 'created_at', label: '建立時間', sortable: false, selectable: true },
            { key: 'actions', label: '操作', sortable: false, selectable: false }
        ],

        // Modal 配置
        modal: {
            title: '新增角色',
            size: 'small',
            sections: [
                {
                    title: '角色資訊',
                    fields: [
                        { name: 'name', label: '角色名稱', type: 'text', required: true, maxlength: 50, placeholder: '請輸入角色名稱', fullWidth: true },
                        { name: 'description', label: '描述', type: 'textarea', rows: 3, maxlength: 255, placeholder: '請輸入角色描述', fullWidth: true }
                    ]
                }
            ],
            hiddenFields: ['id'],
            submitLabel: '儲存'
        },

        // API 端點
        api: {
            list: 'api/roles/',
            create: 'api/roles/',
            update: 'api/roles/{id}',
            delete: 'api/roles/{id}',
            detail: 'api/roles/{id}'
        }
    });

})();
