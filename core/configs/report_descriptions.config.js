/**
 * 列印報表說明模組配置
 */
ModuleConfig.register('report_descriptions', {
    title: '列印報表說明',
    subtitle: '管理各類列印報表的說明文字',

    // 標題區按鈕
    actions: [
        { label: '新增', icon: 'fa-plus', action: 'create', style: 'primary' }
    ],

    // 資料表格欄位
    columns: [
        { key: 'report_code', label: '報表代碼', sortable: true },
        { key: 'report_name', label: '報表名稱', sortable: true },
        { key: 'report_name_en', label: '英文名稱', sortable: false },
        { key: 'used_in', label: '使用報表', sortable: false },
        { key: 'description', label: '說明摘要', sortable: false },
        { key: 'is_active', label: '狀態', sortable: true },
        { key: 'updated_at', label: '更新時間', sortable: true },
        { key: 'actions', label: '操作', sortable: false }
    ],

    // Modal 表單
    modal: {
        title: '新增報表說明',
        size: 'large',
        hiddenFields: ['id'],
        sections: [
            {
                title: '基本資訊',
                fields: [
                    { name: 'report_code', label: '報表代碼', type: 'text', required: true, placeholder: '例如: screening_inspection', fullWidth: true },
                    { name: 'report_name', label: '報表名稱（中文）', type: 'text', required: true, placeholder: '例如: 篩分檢驗結果報表', fullWidth: true },
                    { name: 'report_name_en', label: '報表名稱（英文）', type: 'text', placeholder: '例如: Screening Inspection Report', fullWidth: true },
                    { name: 'is_active', label: '是否啟用', type: 'select', fullWidth: true, options: [
                        { value: '1', label: '啟用' },
                        { value: '0', label: '停用' }
                    ]}
                ]
            },
            {
                title: '備註說明',
                fields: [
                    { name: 'description', label: '備註說明（中文）', type: 'textarea', fullWidth: true, rows: 5, placeholder: '請輸入備註說明內容，將顯示在列印報表上' },
                    { name: 'description_en', label: '備註說明（英文）', type: 'textarea', fullWidth: true, rows: 5, placeholder: 'Please enter the note description in English' }
                ]
            }
        ]
    }
});
