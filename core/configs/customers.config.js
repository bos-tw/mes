/**
 * 客戶管理模組配置
 */
ModuleConfig.register('customers', {
    title: '客戶基本資料',
    subtitle: '維護客戶基本資料與聯絡資訊',

    // 標題區按鈕
    actions: [
        { label: '新增', icon: 'fa-plus', action: 'create', style: 'primary' },
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
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '客戶編號 / 客戶名稱 / 聯絡人 / Email' },
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
        { key: 'customer_number', label: '客戶編號', sortable: true, selectable: true },
        { key: 'name', label: '客戶名稱', sortable: true, selectable: true },
        { key: 'is_active', label: '狀態', sortable: true, selectable: true },
        { key: 'contact_person', label: '聯絡人', sortable: true, selectable: true },
        { key: 'phone', label: '聯絡電話', sortable: true, selectable: true },
        { key: 'fax', label: '傳真電話', sortable: true, selectable: true },
        { key: 'email', label: '電子郵件', sortable: true, selectable: true },
        { key: 'address', label: '地址', sortable: true, selectable: true },
        { key: 'billing_day', label: '結帳日', sortable: true, selectable: true },
        { key: 'payment_method', label: '付款方式', sortable: true, selectable: true },
        { key: 'minimum_order_amount', label: '最低委託額度', sortable: true, selectable: true },
        { key: 'weight_tolerance_percentage', label: '重量公差(%)', sortable: true, selectable: true },
        { key: 'tax_id', label: '統一編號', sortable: true, selectable: true },
        { key: 'notes', label: '備註', sortable: true, selectable: true },
        { key: 'created_at', label: '建立時間', sortable: true, selectable: true },
        { key: 'updated_at', label: '更新時間', sortable: true, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 表單 - 依資料屬性分為基本資訊、業務資訊、財務資訊、其他資訊
    modal: {
        title: '新增客戶基本資料',
        size: 'xlarge',
        className: 'customers-modal',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '<i class="fas fa-info-circle"></i> 基本資訊',
                        customHtml: `
                <div class="form-grid customer-modal-grid customer-modal-grid-basic">
                    <label class="inline-label">
                        <span>客戶編號<abbr title="必填">*</abbr></span>
                        <input type="text" name="customer_number" maxlength="50" required placeholder="請輸入客戶編號" autocomplete="off">
                    </label>
                    <label class="inline-label" data-span-two>
                        <span>客戶名稱<abbr title="必填">*</abbr></span>
                        <input type="text" name="name" maxlength="255" required placeholder="請輸入客戶名稱" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>狀態</span>
                        <select name="is_active">
                            <option value="">請選擇</option>
                            <option value="1">啟用</option>
                            <option value="0">停用</option>
                        </select>
                    </label>
                    <label class="inline-label">
                        <span>商品別</span>
                        <input type="text" name="product_category" maxlength="100" placeholder="請輸入商品別" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>公司網址</span>
                        <input type="url" name="website" maxlength="255" placeholder="https://example.com" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>主要聯絡人</span>
                        <input type="text" name="contact_person" maxlength="100" placeholder="請輸入聯絡人姓名" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>聯絡電話</span>
                        <input type="text" name="phone" maxlength="50" placeholder="請輸入聯絡電話" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>傳真</span>
                        <input type="text" name="fax" maxlength="50" placeholder="請輸入傳真號碼" autocomplete="off">
                    </label>
                    <label class="inline-label" data-span-two>
                        <span>電子郵件</span>
                        <input type="email" name="email" maxlength="100" placeholder="請輸入電子郵件" autocomplete="off">
                    </label>
                    <label class="inline-label full-width" data-source-address>
                        <span>公司登記地址</span>
                        <input type="text" name="company_registered_address" placeholder="請輸入公司登記地址" autocomplete="off">
                    </label>
                    <label class="inline-label full-width" data-target-address>
                        <span>公司營業地址</span>
                        <input type="text" name="address" placeholder="請輸入公司營業住址" autocomplete="off">
                    </label>
                    <button type="button" class="btn success small" data-action="copy-registered-address" data-target="address">
                        <i class="fas fa-copy"></i> 複製公司登記地址
                    </button>
                </div>`
                    },
                    {
                        title: '<i class="fas fa-user-tie"></i> 業務資訊',
                        customHtml: `
                <div class="form-grid customer-modal-grid customer-modal-grid-business">
                    <label class="inline-label">
                        <span>業務聯絡人</span>
                        <input type="text" name="sales_contact_person" maxlength="100" placeholder="請輸入業務聯絡人" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>分機</span>
                        <input type="text" name="sales_contact_extension" maxlength="20" placeholder="請輸入分機" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>手機</span>
                        <input type="text" name="sales_contact_mobile" maxlength="50" placeholder="請輸入手機" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>Email</span>
                        <input type="email" name="sales_contact_email" maxlength="255" placeholder="請輸入 Email" autocomplete="off">
                    </label>
                    <label class="inline-label" data-target-address>
                        <span>收/送貨地址</span>
                        <input type="text" name="shipping_address" placeholder="請輸入收/送貨地址" autocomplete="off">
                    </label>
                    <button type="button" class="btn success small" data-action="copy-registered-address" data-target="shipping_address">
                        <i class="fas fa-copy"></i> 複製公司登記地址
                    </button>
                </div>`
                    }
                ]
            },
            {
                sections: [
                    {
                        title: '<i class="fas fa-file-invoice-dollar"></i> 財務資訊',
                        customHtml: `
                <div class="form-grid customer-modal-grid customer-modal-grid-finance">
                    <label class="inline-label" data-finance-half>
                        <span>財務聯絡人</span>
                        <input type="text" name="finance_contact_person" maxlength="100" placeholder="請輸入財務聯絡人" autocomplete="off">
                    </label>
                    <label class="inline-label" data-finance-half>
                        <span>分機</span>
                        <input type="text" name="finance_contact_extension" maxlength="20" placeholder="請輸入分機" autocomplete="off">
                    </label>
                    <label class="inline-label" data-finance-half>
                        <span>手機</span>
                        <input type="text" name="finance_contact_mobile" maxlength="50" placeholder="請輸入手機" autocomplete="off">
                    </label>
                    <label class="inline-label" data-finance-half>
                        <span>Email</span>
                        <input type="email" name="finance_contact_email" maxlength="255" placeholder="請輸入 Email" autocomplete="off">
                    </label>
                    <label class="inline-label" data-finance-cycle>
                        <span>結帳日</span>
                        <select name="billing_day">
                            <option value="">請選擇</option>
                            ${Array.from({length: 31}, (_, i) => `<option value="${i+1}">${i+1}日</option>`).join('')}
                        </select>
                    </label>
                    <label class="inline-label" data-finance-cycle>
                        <span>對帳日</span>
                        <select name="reconciliation_day">
                            <option value="">請選擇</option>
                            ${Array.from({length: 31}, (_, i) => `<option value="${i+1}">${i+1}日</option>`).join('')}
                        </select>
                    </label>
                    <label class="inline-label" data-finance-cycle>
                        <span>付款方式</span>
                        <select name="payment_method">
                            <option value="">請選擇付款方式</option>
                            <option value="現金">現金</option>
                            <option value="月結30天">月結30天</option>
                            <option value="月結60天">月結60天</option>
                            <option value="月結90天">月結90天</option>
                            <option value="票期30天">票期30天</option>
                            <option value="票期60天">票期60天</option>
                            <option value="票期90天">票期90天</option>
                        </select>
                    </label>
                    <label class="inline-label" data-finance-title>
                        <span>發票抬頭</span>
                        <input type="text" name="invoice_title" maxlength="255" placeholder="請輸入發票抬頭" autocomplete="off">
                    </label>
                    <label class="inline-label" data-finance-tax-id>
                        <span>統一編號</span>
                        <input type="text" name="tax_id" maxlength="50" placeholder="請輸入統一編號" autocomplete="off">
                    </label>
                    <label class="inline-label" data-target-address>
                        <span>發票寄送地址</span>
                        <input type="text" name="invoice_address" placeholder="請輸入發票寄送地址" autocomplete="off">
                    </label>
                    <button type="button" class="btn success small" data-action="copy-registered-address" data-target="invoice_address">
                        <i class="fas fa-copy"></i> 複製公司登記地址
                    </button>
                </div>`
                    },
                    {
                        title: '<i class="fas fa-clipboard-list"></i> 其他資訊',
                        customHtml: `
                <div class="form-grid customer-modal-grid customer-modal-grid-other">
                    <label class="inline-label" data-other-amount>
                        <span>單筆最低委託額度</span>
                        <input type="number" name="minimum_order_amount" min="0" step="0.01" placeholder="請輸入最低委託額度" autocomplete="off">
                    </label>
                    <label class="inline-label" data-other-tolerance>
                        <span>重量公差 (%)</span>
                        <input type="number" name="weight_tolerance_percentage" min="0" max="100" step="0.01" value="3.00" placeholder="預設3%" autocomplete="off">
                    </label>
                    <div class="inline-label customer-stamp-field" data-invoice-stamp-field>
                        <span>發票印章附件</span>
                        <div class="customer-stamp-control">
                            <div class="file-input-group">
                                <input type="file" name="invoice_stamp_file" accept="image/*" data-invoice-stamp-input id="invoice-stamp-file-input">
                                <label for="invoice-stamp-file-input" class="file-upload-btn">
                                    <i class="fas fa-upload"></i> 選擇檔案
                                </label>
                                <input type="hidden" name="invoice_attachment_path" value="">
                                <input type="hidden" name="remove_invoice_attachment" value="0" data-remove-invoice-stamp>
                            </div>
                            <div class="invoice-stamp-preview hidden" data-invoice-stamp-preview>
                                <img src="" alt="發票印章附件預覽" data-invoice-stamp-preview-image>
                                <div class="preview-actions">
                                    <a href="#" target="_blank" rel="noopener" data-action="open-invoice-stamp" class="link icon-button" title="在新視窗開啟附件" aria-label="在新視窗開啟附件">
                                        <i class="fas fa-external-link-alt"></i>
                                    </a>
                                    <button type="button" class="link icon-button danger" data-action="clear-invoice-stamp" title="移除附件" aria-label="移除附件">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                            <p class="field-hint">支援 JPG、PNG、GIF 檔，最大 5 MB。</p>
                        </div>
                    </div>
                    <label class="inline-label full-width" data-other-notes>
                        <span>備註</span>
                        <textarea name="notes" rows="3" placeholder="請輸入備註"></textarea>
                    </label>
                    <div class="inline-label full-width customer-tool-analysis-panel" data-customer-tool-analysis-panel>
                        <span>客戶載具紀錄與遺留分析</span>
                        <div class="customer-tool-analysis-content text-muted" data-customer-tool-analysis>
                            開啟既有客戶後顯示分析結果。
                        </div>
                    </div>
                </div>`
                    }
                ]
            }
        ]
    }
});
