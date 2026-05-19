/**
 * 權限設定模組配置
 */
(function() {
    'use strict';

    ModuleConfig.register('permissions', {
        title: '權限設定',
        subtitle: '管理系統功能權限定義',

        // 標題列動作按鈕
        actions: [
            { action: 'create', label: '新增權限', icon: 'fa-plus', style: 'primary' }
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
                placeholder: '搜尋權限名稱、描述...'
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
            { key: 'name', label: '權限名稱', sortable: false, selectable: true },
            { key: 'description', label: '描述', sortable: false, selectable: true },
            { key: 'created_at', label: '建立時間', sortable: false, selectable: true },
            { key: 'actions', label: '操作', sortable: false, selectable: false }
        ],

        // Modal 配置
        modal: {
            title: '新增權限',
            size: 'small',
            sections: [
                {
                    title: '權限資訊',
                    fields: [
                        { name: 'name', label: '權限名稱', type: 'text', required: true, maxlength: 100, placeholder: '例如：manage_orders', fullWidth: true },
                        { name: 'description', label: '描述', type: 'textarea', rows: 3, maxlength: 255, placeholder: '請輸入權限描述', fullWidth: true }
                    ]
                }
            ],
            hiddenFields: ['id'],
            submitLabel: '儲存'
        },

        // API 端點
        api: {
            list: 'api/permissions/',
            create: 'api/permissions/',
            update: 'api/permissions/{id}',
            delete: 'api/permissions/{id}',
            detail: 'api/permissions/{id}'
        }
    });

})();
