/**
 * 供應商管理模組配置
 */
ModuleConfig.register('suppliers', {
    title: '供應商基本資料',
    subtitle: '維護供應商基本資料、聯絡方式與付款資訊',

    // 標題區按鈕
    actions: [
        { label: '新增', icon: 'fa-plus', action: 'create', style: 'primary', wrapLabel: true },
        { label: '批次列印', icon: 'fa-print', action: 'batch-print', style: 'outline', wrapLabel: true },
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
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '供應商編號 / 名稱 / 聯絡人 / 統一編號 / 電子郵件' },
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
        { key: 'supplier_number', label: '供應商編號', sortable: true, selectable: true },
        { key: 'name', label: '供應商名稱', sortable: true, selectable: true },
        { key: 'service_type', label: '服務類型', sortable: true, selectable: true },
        { key: 'supplier_type', label: '供應商性質', sortable: true, selectable: true },
        { key: 'contact_person', label: '聯絡人', sortable: true, selectable: true },
        { key: 'phone', label: '聯絡電話', sortable: true, selectable: true },
        { key: 'email', label: '電子郵件', sortable: true, selectable: true },
        { key: 'payment_method', label: '付款方式', sortable: true, selectable: true },
        { key: 'tax_id', label: '統一編號', sortable: true, selectable: true },
        { key: 'created_at', label: '建立時間', sortable: true, selectable: true },
        { key: 'updated_at', label: '更新時間', sortable: true, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 表單 - 依資料屬性分為基本資訊、聯絡資訊、財務資訊、其他資訊
    modal: {
        title: '新增供應商',
        size: 'xlarge',
        className: 'suppliers-modal',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '<i class="fas fa-info-circle"></i> 基本資訊',
                        customHtml: `
                <div class="form-grid supplier-modal-grid supplier-modal-grid-basic">
                    <label class="inline-label">
                        <span>供應商編號<abbr title="必填">*</abbr></span>
                        <input type="text" name="supplier_number" maxlength="50" required placeholder="請輸入供應商編號" autocomplete="off">
                    </label>
                    <label class="inline-label" data-span-two>
                        <span>供應商名稱<abbr title="必填">*</abbr></span>
                        <input type="text" name="name" maxlength="255" required placeholder="請輸入供應商名稱" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>服務類型</span>
                        <input type="text" name="service_type" maxlength="100" placeholder="例如:五金加工" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>供應商性質</span>
                        <input type="text" name="supplier_type" maxlength="100" placeholder="例如:原料供應商" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>供應產品別</span>
                        <input type="text" name="product_category" maxlength="100" placeholder="請輸入供應產品別" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>負責人</span>
                        <input type="text" name="owner" maxlength="100" placeholder="請輸入負責人" autocomplete="off">
                    </label>
                    <label class="inline-label full-width">
                        <span>公司地址</span>
                        <input type="text" name="address" placeholder="請輸入公司地址" autocomplete="off">
                    </label>
                    <label class="inline-label full-width">
                        <span>工廠地址</span>
                        <input type="text" name="factory_address" placeholder="請輸入工廠地址" autocomplete="off">
                    </label>
                </div>`
                    },
                    {
                        title: '<i class="fas fa-phone"></i> 聯絡資訊',
                        customHtml: `
                <div class="form-grid supplier-modal-grid supplier-modal-grid-contact">
                    <label class="inline-label">
                        <span>聯絡人</span>
                        <input type="text" name="contact_person" maxlength="100" placeholder="請輸入聯絡人" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>手機</span>
                        <input type="text" name="contact_mobile" maxlength="50" placeholder="請輸入手機" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>聯絡電話</span>
                        <input type="text" name="phone" maxlength="50" placeholder="請輸入聯絡電話" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>傳真</span>
                        <input type="text" name="fax" maxlength="50" placeholder="請輸入傳真" autocomplete="off">
                    </label>
                    <label class="inline-label" data-span-two>
                        <span>電子郵件</span>
                        <input type="email" name="email" maxlength="100" placeholder="請輸入電子郵件" autocomplete="off">
                    </label>
                </div>`
                    }
                ]
            },
            {
                sections: [
                    {
                        title: '<i class="fas fa-file-invoice-dollar"></i> 財務資訊',
                        customHtml: `
                <div class="form-grid supplier-modal-grid supplier-modal-grid-finance">
                    <label class="inline-label">
                        <span>付款方式</span>
                        <input type="text" name="payment_method" maxlength="100" placeholder="例如:月結30天" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>統一編號</span>
                        <input type="text" name="tax_id" maxlength="50" placeholder="請輸入統一編號" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>匯款戶名</span>
                        <input type="text" name="bank_account_name" maxlength="100" placeholder="請輸入匯款戶名" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>銀行代號</span>
                        <input type="text" name="bank_code" maxlength="10" placeholder="請輸入銀行代號" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>銀行名稱</span>
                        <input type="text" name="bank_name" maxlength="100" placeholder="請輸入銀行名稱" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>分行代號</span>
                        <input type="text" name="bank_branch_code" maxlength="10" placeholder="請輸入分行代號" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>分行名稱</span>
                        <input type="text" name="bank_branch_name" maxlength="100" placeholder="請輸入分行名稱" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>匯款帳號</span>
                        <input type="text" name="bank_account_number" maxlength="50" placeholder="請輸入匯款帳號" autocomplete="off">
                    </label>
                </div>`
                    },
                    {
                        title: '<i class="fas fa-clipboard-list"></i> 其他資訊',
                        customHtml: `
                <div class="form-grid supplier-modal-grid supplier-modal-grid-other">
                    <div class="inline-label supplier-attachment-field" data-attachment-field>
                        <span>附件</span>
                        <div class="supplier-attachment-control">
                            <div class="file-input-group">
                                <input type="file" name="attachment_file" accept="*/*" data-attachment-input id="supplier-attachment-file-input">
                                <label for="supplier-attachment-file-input" class="file-upload-btn">
                                    <i class="fas fa-upload"></i> 選擇檔案
                                </label>
                                <input type="hidden" name="attachment_path" value="">
                                <input type="hidden" name="remove_attachment" value="0" data-remove-attachment>
                            </div>
                            <div class="attachment-preview hidden" data-attachment-preview>
                                <div class="preview-info">
                                    <i class="fas fa-file"></i>
                                    <span data-attachment-filename></span>
                                </div>
                                <div class="preview-actions">
                                    <a href="#" target="_blank" rel="noopener" data-action="open-attachment" class="link icon-button" title="開啟附件" aria-label="開啟附件">
                                        <i class="fas fa-external-link-alt"></i>
                                    </a>
                                    <button type="button" class="link icon-button danger" data-action="clear-attachment" title="移除附件" aria-label="移除附件">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                            <p class="field-hint">最大 10 MB</p>
                        </div>
                    </div>
                    <label class="inline-label full-width" data-other-notes>
                        <span>備註</span>
                        <textarea name="notes" rows="2" placeholder="請輸入備註"></textarea>
                    </label>
                </div>`
                    }
                ]
            }
        ]
    }
});
