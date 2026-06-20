/**
 * 篩分服務項目模組配置
 */
(function() {
    'use strict';

    ModuleConfig.register('screening_services', {
        title: '篩分服務項目',
        subtitle: '維護篩分服務內容、單價與容許公差設定',

        // 標題列動作按鈕
        actions: [
            { action: 'create', label: '新增', icon: 'fa-plus', style: 'primary' },
            { action: 'print', label: '列印', icon: 'fa-print', style: 'outline', wrapLabel: true }
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
                placeholder: '服務編號 / 名稱 / 類別'
            },
            {
                name: 'category',
                label: '類別',
                type: 'select',
                placeholder: '-- 全部 --',
                options: [
                    { value: '一般全檢', label: '一般全檢' },
                    { value: '特殊加選', label: '特殊加選' }
                ]
            },
            {
                name: 'isActive',
                label: '啟用狀態',
                type: 'select',
                placeholder: '全部',
                options: [
                    { value: '1', label: '啟用' },
                    { value: '0', label: '停用' }
                ]
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
            { key: 'service_number', label: '服務編號', sortable: true, selectable: true },
            { key: 'name', label: '服務名稱', sortable: true, selectable: true },
            { key: 'name_en', label: '英文名稱', sortable: true, selectable: true },
            { key: 'category', label: '類別', sortable: true, selectable: true },
            { key: 'default_price_per_unit', label: '預設單價', sortable: true, selectable: true },
            { key: 'tolerance_plus_value', label: '公差(+)', sortable: false, selectable: true },
            { key: 'tolerance_minus_value', label: '公差(-)', sortable: false, selectable: true },
            { key: 'ppm_standard', label: 'PPM 標準', sortable: true, selectable: true },
            { key: 'is_active', label: '狀態', sortable: true, selectable: true },
            { key: 'updated_at', label: '更新時間', sortable: true, selectable: true },
            { key: 'actions', label: '操作', sortable: false, selectable: false }
        ],

        // Modal 配置 - 使用 formRows 模式（並排 section）
        modal: {
            title: '新增篩分服務項目',
            size: 'medium',
            hiddenFields: ['id'],
            // formRows: 每個 row 內的 sections 會並排顯示
            formRows: [
                {
                    sections: [
                        {
                            title: '基本資訊',
                            fields: [
                                { name: 'service_number', label: '服務編號', maxlength: 50, placeholder: '請輸入服務編號' },
                                { name: 'name', label: '服務名稱', required: true, maxlength: 255, placeholder: '請輸入服務名稱' },
                                { name: 'name_en', label: '英文名稱', maxlength: 255, placeholder: '請輸入英文名稱 (用於報表)' },
                                {
                                    name: 'category',
                                    label: '類別',
                                    type: 'select',
                                    placeholder: '-- 請選擇類別 --',
                                    options: [
                                        { value: '一般全檢', label: '一般全檢' },
                                        { value: '特殊加選', label: '特殊加選' }
                                    ]
                                },
                                { name: 'default_price_per_unit', label: '單價 (每支)', type: 'number', required: true, min: 0, step: 0.01, placeholder: '請輸入預設單價' },
                                { name: 'ppm_standard', label: 'PPM 標準', type: 'number', min: 0, step: 1, placeholder: '請輸入PPM標準' }
                            ]
                        },
                        {
                            title: '公差與啟用設定',
                            fields: [
                                { name: 'is_active', label: '啟用', type: 'checkbox', checked: true },
                                { name: 'tolerance_plus_value', label: '公差(+)', type: 'number', step: 0.0001, placeholder: '請輸入正公差值' },
                                { name: 'tolerance_plus_over', label: '正值(+)', type: 'number', step: 0.0001, placeholder: '請輸入正值' },
                                { name: 'tolerance_minus_value', label: '公差(-)', type: 'number', step: 0.0001, placeholder: '請輸入負公差值' },
                                { name: 'tolerance_minus_over', label: '負值(-)', type: 'number', step: 0.0001, placeholder: '請輸入負值' }
                            ]
                        }
                    ]
                }
            ],
            // 額外的 sections（不並排）
            sections: [
                {
                    title: '服務描述',
                    fields: [
                        { name: 'description', label: '服務描述', type: 'textarea', fullWidth: true, rows: 3, maxlength: 2000, placeholder: '請輸入服務內容描述' }
                    ]
                }
            ],
            submitLabel: '儲存',
            submitDataAction: 'submit'
        },

        // API 端點
        api: {
            list: 'api/screening_services/',
            create: 'api/screening_services/',
            update: 'api/screening_services/{id}',
            delete: 'api/screening_services/{id}',
            detail: 'api/screening_services/{id}'
        }
    });

})();
