/**
 * 公司基本資料模組配置
 */
(function() {
    'use strict';

    ModuleConfig.register('companies', {
        title: '公司基本資料',
        subtitle: '維護公司基本資料與聯絡資訊',

        // 標題列動作按鈕
        actions: [
            { action: 'create', label: '新增', icon: 'fa-plus', style: 'primary' },
            { action: 'batch-print', label: '批次列印', icon: 'fa-print', style: 'outline', wrapLabel: true },
            { action: 'batch-export', label: '批次匯出', icon: 'fa-download', style: 'outline', wrapLabel: true }
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
                placeholder: '公司名稱 / 地址 / 電話 / Email / 統一編號'
            },
            {
                name: 'perPage',
                label: '每頁筆數',
                type: 'select',
                // 不設 placeholder，直接顯示選項
                options: [
                    { value: '10', label: '10' },
                    { value: '20', label: '20' },
                    { value: '50', label: '50' }
                ]
            }
        ],

        // 表格欄位
        columns: [
            { key: 'name', label: '公司名稱', sortable: true },
            { key: 'address', label: '地址', sortable: true },
            { key: 'phone', label: '電話', sortable: true },
            { key: 'email', label: '電子郵件', sortable: true },
            { key: 'tax_id', label: '統一編號', sortable: true },
            { key: 'actions', label: '操作', sortable: false, selectable: false }
        ],

        // Modal 配置
        modal: {
            title: '新增公司',
            size: 'medium',
            hiddenFields: ['id'],
            // 使用 formRows 實現二欄佈局
            formRows: [
                {
                    sections: [
                        {
                            title: '<i class="fas fa-building"></i> 基本資訊',
                            fields: [
                                { name: 'name', label: '公司名稱', required: true, placeholder: '請輸入公司名稱' },
                                { name: 'name_en', label: '公司英文名稱', placeholder: '請輸入公司英文名稱' },
                                { name: 'tax_id', label: '統一編號', placeholder: '請輸入統一編號' },
                                { name: 'address', label: '公司地址', fullWidth: true, placeholder: '請輸入公司地址' }
                            ]
                        },
                        {
                            title: '<i class="fas fa-address-book"></i> 聯絡資訊',
                            fields: [
                                { name: 'phone', label: '聯絡電話', type: 'tel', placeholder: '請輸入聯絡電話' },
                                { name: 'fax', label: '傳真號碼', type: 'tel', placeholder: '請輸入傳真號碼' },
                                { name: 'email', label: '電子郵件', type: 'email', placeholder: '請輸入電子郵件' }
                            ]
                        }
                    ]
                }
            ],
            // formRows 後的獨立 section（LOGO 管理）
            sections: [
                {
                    title: '<i class="fas fa-image"></i> LOGO 管理',
                    className: 'logo-section',
                    dataAttr: 'data-logo-section',
                    fields: [],
                    // 自訂 HTML 區塊
                    customHtml: `
                <!-- 新增模式提示 -->
                <div class="logo-create-hint" data-logo-create-hint>
                    <i class="fas fa-info-circle"></i>
                    <span>請先儲存公司資料後，再上傳 LOGO</span>
                </div>

                <!-- 編輯模式：上傳按鈕(左) + LOGO列表(右) 並排 -->
                <div class="logo-edit-area hidden" data-logo-edit-area>
                    <div class="file-input-group">
                        <input type="file"
                               id="company-logo-file-input"
                               data-logo-file-input
                               accept="image/png,image/jpeg,image/svg+xml,image/webp"
                               hidden>
                        <label for="company-logo-file-input" class="file-upload-btn">
                            <i class="fas fa-upload"></i> 選擇圖片上傳
                        </label>
                        <span class="file-hint">PNG, JPG, SVG, WebP (最大 2MB)</span>
                    </div>
                    <!-- LOGO 庫列表 -->
                    <div class="logo-library" data-logo-library>
                        <div class="logo-empty-state">尚無 LOGO</div>
                    </div>
                </div>`
                }
            ],
            submitLabel: '儲存',
            submitDataAction: 'submit'
        },

        // API 端點
        api: {
            list: 'api/companies/',
            create: 'api/companies/',
            update: 'api/companies/{id}',
            delete: 'api/companies/{id}',
            detail: 'api/companies/{id}'
        }
    });

})();
