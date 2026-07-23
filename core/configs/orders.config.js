/**
 * 訂單管理模組配置
 */
ModuleConfig.register('orders', {
    title: '訂單主表管理',
    subtitle: '管理客戶訂單與相關資訊',

    // 標題區按鈕
    actions: [
        { label: '新增', icon: 'fa-plus', action: 'create', style: 'primary' },
        {
            label: '批次列印',
            icon: 'fa-print',
            action: 'batch-print',
            style: 'outline',
            wrapLabel: true,
            disabled: true,
            extraHtml: '<span class="selection-count hidden" data-selection-count>0</span>'
        },
        {
            label: '批次匯出',
            icon: 'fa-download',
            action: 'batch-export',
            style: 'outline',
            wrapLabel: true,
            disabled: true,
            extraHtml: '<span class="selection-count hidden" data-export-count>0</span>'
        }
    ],

    // 欄位選擇器
    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,

    // 篩選工具列
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,
    filters: [
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '搜尋訂單號碼、客戶名稱、客戶訂單號碼' },
        {
            name: 'customer_id',
            label: '客戶',
            type: 'select',
            options: [{ value: '', label: '-- 請選擇客戶 --' }]
        },
        {
            name: 'status',
            label: '訂單狀態',
            type: 'select',
            options: [{ value: '', label: '-- 所有狀態 --' }]
        },
        { name: 'start_date', label: '訂單日期(起)', type: 'date' },
        { name: 'end_date', label: '訂單日期(迄)', type: 'date' },
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

    customHtml: `
    <div class="filter-drawer-overlay hidden" data-orders-detail-overlay></div>
    <aside class="filter-drawer order-detail-drawer hidden" data-orders-detail-drawer aria-hidden="true" aria-labelledby="orders-detail-title">
        <div class="filter-drawer-header">
            <div>
                <h3 id="orders-detail-title"><i class="fas fa-eye"></i> 訂單詳細檢視</h3>
                <p data-orders-detail-subtitle>載入訂單完整資料</p>
            </div>
            <button type="button" class="filter-drawer-close" data-action="close-order-detail" aria-label="關閉訂單詳細檢視">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="order-detail-drawer-content" data-orders-detail-content>
            <div class="order-items-inline-state" data-orders-detail-loading>請選擇訂單。</div>
            <div class="hidden" data-orders-detail-sections>
                <section class="detail-section">
                    <h4>訂單基本資料</h4>
                    <div class="table-responsive">
                        <table class="data-table compact order-detail-basic-table" data-no-hard-row-number="true" data-no-column-resize="true">
                            <thead><tr><th>訂單號碼</th><th>客戶名稱</th><th>訂單日期</th><th>預訂交期</th></tr></thead>
                            <tbody><tr><td data-order-detail-field="order_number">-</td><td data-order-detail-field="customer_name">-</td><td data-order-detail-field="order_date">-</td><td data-order-detail-field="expected_delivery">-</td></tr></tbody>
                        </table>
                    </div>
                </section>
                <section class="detail-section">
                    <h4>訂單明細</h4>
                    <div class="order-detail-item-list" data-orders-detail-items></div>
                </section>
            </div>
        </div>
    </aside>
    <div class="modal-overlay hidden" data-orders-screening-history-modal>
        <div class="modal-window medium screening-history-modal" role="dialog" aria-modal="true" aria-labelledby="orders-screening-history-title">
            <button type="button" class="modal-close" data-action="close-screening-history" aria-label="關閉受篩產品歷史">
                <i class="fas fa-times"></i>
            </button>
            <h3 id="orders-screening-history-title"><i class="fas fa-history"></i> 受篩產品歷史</h3>
            <p class="screening-history-customer" data-orders-screening-history-customer>載入客戶資料</p>
            <form data-orders-screening-history-form>
                <div class="form-grid">
                    <label class="inline-label ui-compact-form-row">
                        <span>搜尋</span>
                        <input type="search" data-orders-screening-history-search placeholder="搜尋訂單日期、產品料號或規格" autocomplete="off">
                    </label>
                </div>
            </form>
            <div class="order-items-inline-state" data-orders-screening-history-state>請選擇訂單。</div>
            <div class="table-responsive hidden" data-orders-screening-history-results>
                <table class="data-table compact" data-no-hard-row-number="true" data-no-column-resize="true">
                    <thead><tr><th>訂單日期</th><th>受篩產品</th></tr></thead>
                    <tbody data-orders-screening-history-rows></tbody>
                </table>
            </div>
        </div>
    </div>`,

    // 資料表格欄位
    columns: [
        { key: 'checkbox', label: '', sortable: false, isCheckbox: true },
        { key: 'order_number', label: '訂單號碼', sortable: true, selectable: true },
        { key: 'customer.name', label: '客戶名稱', sortable: true, selectable: true },
        { key: 'order_date', label: '訂單日期', sortable: true, selectable: true },
        { key: 'expected_delivery_date', label: '預訂交期', sortable: true, selectable: true },
        { key: 'customer_po_number', label: '客戶訂單編號', sortable: true, selectable: true },
        { key: 'status_label', label: '狀態', sortable: true, selectable: true },
        { key: 'total_amount', label: '預估總金額', sortable: true, selectable: true },
        { key: 'created_at', label: '建立時間', sortable: true, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 表單 - 使用 formRows 模式
    modal: {
        title: '新增訂單',
        size: 'medium',
        hiddenFields: ['id'],
        formRows: [
            {
                sections: [
                    {
                        title: '訂單基本資訊',
                        customHtml: `
                <div class="form-grid">
                    <label class="inline-label">
                        <span>訂單號碼</span>
                        <input type="text" value="系統自動生成" disabled readonly style="background-color: #f8f9fa; color: #6c757d;">
                    </label>
                    <label class="inline-label">
                        <span>客戶 <abbr title="必填">*</abbr></span>
                        <select name="customer_id" required>
                            <option value="">-- 請選擇客戶 --</option>
                        </select>
                    </label>
                    <label class="inline-label">
                        <span>訂單日期 <abbr title="必填">*</abbr></span>
                        <input type="date" name="order_date" required>
                        <span class="weekday-badge" data-weekday-for="order_date"></span>
                    </label>
                    <label class="inline-label">
                        <span>預訂交期</span>
                        <input type="date" name="expected_delivery_date">
                        <span class="weekday-badge" data-weekday-for="expected_delivery_date"></span>
                    </label>
                    <label class="inline-label">
                        <span>預訂交期時段</span>
                        <select name="expected_delivery_period">
                            <option value="">-- 請選擇時段 --</option>
                            <option value="morning">上午</option>
                            <option value="noon">中午</option>
                            <option value="afternoon">下午</option>
                            <option value="evening">晚間</option>
                        </select>
                    </label>
                    <small class="field-hint full-width">預訂交期由使用者自行維護；新增訂單細項時會預帶此值，細項後續變更不會回寫訂單主表。</small>
                    <label class="inline-label">
                        <span>客戶訂單號碼</span>
                        <input type="text" name="customer_po_number" maxlength="100" placeholder="請輸入客戶訂單號碼" autocomplete="off">
                    </label>
                    <label class="inline-label">
                        <span>訂單狀態</span>
                        <select name="status">
                            <option value="">-- 請選擇狀態 --</option>
                        </select>
                    </label>
                </div>`
                    },
                    {
                        title: '金額與備註',
                        customHtml: `
                <div class="form-grid">
                    <label class="inline-label">
                        <span>訂單總金額</span>
                        <input type="number" name="total_amount" min="0" step="0.01" placeholder="0.00">
                    </label>
                    <label class="inline-label">
                        <span>最終報價（元/M）</span>
                        <input type="number" name="final_quote_per_m" min="0" step="0.01" placeholder="請輸入最終報價">
                    </label>
                    <label class="inline-label">
                        <span>單一 PPM</span>
                        <input type="number" name="single_ppm" min="0" step="1" placeholder="請輸入單一 PPM">
                    </label>
                </div>
                <div class="form-grid">
                    <label class="full-width">
                        <span>備註</span>
                        <textarea name="notes" rows="3" placeholder="請輸入備註"></textarea>
                    </label>
                </div>`
                    }
                ]
            }
        ]
    }
});
