/**
 * 出貨單管理模組配置
 */
ModuleConfig.register('shipping_orders', {
    title: '出貨單',
    subtitle: '管理產品出貨與配送',

    // 標題區按鈕
    actions: [
        { label: '新增出貨單', icon: 'fa-plus', action: 'create', style: 'primary' },
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
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '搜尋出貨單號、客戶名稱' },
        {
            name: 'customer_id',
            label: '客戶',
            type: 'select',
            options: [{ value: '', label: '-- 所有客戶 --' }]
        },
        {
            name: 'status',
            label: '狀態',
            type: 'select',
            options: [
                { value: '', label: '-- 所有狀態 --' },
                { value: 'draft', label: '草稿' },
                { value: 'confirmed', label: '已確認' },
                { value: 'shipped', label: '已出貨' },
                { value: 'delivered', label: '已送達' },
                { value: 'cancelled', label: '已取消' }
            ]
        },
        { name: 'start_date', label: '出貨日期(起)', type: 'date' },
        { name: 'end_date', label: '出貨日期(迄)', type: 'date' },
        {
            name: 'perPage',
            label: '每頁筆數',
            type: 'select',
            options: [
                { value: '10', label: '10' },
                { value: '20', label: '20', selected: true },
                { value: '50', label: '50' }
            ]
        }
    ],

    // 資料表格欄位
    columns: [
        { key: 'checkbox', label: '', sortable: false, selectable: false, isCheckbox: true },
        { key: 'shipping_order_number', label: '出貨單號', sortable: true, selectable: true },
        { key: 'customer_name', label: '客戶', sortable: true, selectable: true },
        { key: 'shipping_date', label: '出貨日期', sortable: true, selectable: true },
        { key: 'item_count', label: '項目數', sortable: false, selectable: true },
        { key: 'total_quantity', label: '總數量', sortable: false, selectable: true },
        { key: 'delivery_method', label: '配送方式', sortable: true, selectable: true },
        { key: 'status', label: '狀態', sortable: true, selectable: true },
        { key: 'created_at', label: '建立時間', sortable: true, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 表單
    modal: {
        title: '新增出貨單',
        size: 'large',
        submitDataAction: 'submit',
        hiddenFields: ['id', 'defect_source_shipping_order_id', 'defect_source_work_order_id', 'defect_source_inventory_item_id'],
        formRows: [
            {
                sections: [
                    {
                        title: '基本資訊',
                        gridColumns: 2,
                        fields: [
                            { name: 'shipping_order_number', label: '出貨單號', type: 'text', required: true, placeholder: '自動產生', readonly: true },
                            {
                                name: 'customer_id',
                                label: '客戶',
                                type: 'select',
                                required: true,
                                options: [{ value: '', label: '-- 請選擇客戶 --' }]
                            },
                            {
                                name: 'order_id',
                                label: '關聯訂單',
                                type: 'select',
                                options: [{ value: '', label: '-- 不關聯訂單 --' }]
                            },
                            {
                                name: 'shipment_purpose',
                                label: '出貨性質',
                                type: 'select',
                                required: true,
                                options: [
                                    { value: 'normal', label: '一般出貨' },
                                    { value: 'defect_return', label: '不良回送' },
                                    { value: 'tool_return', label: '載具歸還' },
                                    { value: 'mixed', label: '混合出貨' }
                                ]
                            },
                            { name: 'shipping_date', label: '出貨日期', type: 'date' },
                            {
                                name: 'delivery_method',
                                label: '配送方式',
                                type: 'select',
                                options: [
                                    { value: '', label: '-- 請選擇 --' },
                                    { value: 'pickup', label: '自取' },
                                    { value: 'delivery', label: '宅配' },
                                    { value: 'freight', label: '貨運' }
                                ]
                            },
                            {
                                name: 'status',
                                label: '狀態',
                                type: 'select',
                                required: true,
                                options: [
                                    { value: 'draft', label: '草稿' },
                                    { value: 'confirmed', label: '已確認' },
                                    { value: 'shipped', label: '已出貨' },
                                    { value: 'delivered', label: '已送達' },
                                    { value: 'cancelled', label: '已取消' }
                                ]
                            }
                        ]
                    },
                    {
                        title: '收件與追蹤',
                        gridColumns: 2,
                        fields: [
                            { name: 'consignee_name', label: '收件人', type: 'text', placeholder: '收件人姓名' },
                            { name: 'carrier', label: '物流公司', type: 'text', placeholder: '例如：宅配通、黑貓...' },
                            { name: 'consignee_address', label: '收件地址', type: 'text', fullWidth: true, placeholder: '收件地址' },
                            { name: 'tracking_number', label: '追蹤編號', type: 'text', fullWidth: true, placeholder: '貨運追蹤編號' }
                        ]
                    }
                ]
            }
        ],
        sections: [
            {
                title: '備註',
                gridColumns: 2,
                fields: [
                    { name: 'notes', label: '備註', type: 'textarea', rows: 2, fullWidth: true, placeholder: '出貨備註（選填）' }
                ]
            },
            {
                title: '出貨品質檢驗',
                customHtml: `
                <div class="detail-grid">
                    <div class="detail-item" style="grid-column: 1 / -1;">
                        <span class="detail-label">關聯狀態</span>
                        <span class="detail-value" data-shipping-quality-summary-text>請先儲存出貨單後，再建立或查看出貨品質檢驗。</span>
                    </div>
                </div>
                <div class="subsection-actions" style="margin-top: 0.75rem;">
                    <button type="button" class="btn outline" data-action="open-quality-inspection-list" disabled>
                        <i class="fas fa-clipboard-list"></i> 查看品質檢驗
                    </button>
                    <button type="button" class="btn primary" data-action="open-quality-inspection-create" disabled>
                        <i class="fas fa-plus"></i> 建立品質檢驗
                    </button>
                </div>
                <p class="text-muted small" style="margin-top: 0.75rem;">第二階段先提供可視、可建、可追入口，暫不把品質檢驗設為出貨守門條件。</p>`
            },
            {
                title: '不良品摘要',
                gridColumns: 4,
                fields: [
                    { name: 'defect_quantity', label: '不良品總數量', type: 'number', min: 0, step: '0.01', placeholder: '0' },
                    { name: 'defect_weight_per_unit_g', label: '不良品單重 (g)', type: 'number', min: 0, step: '0.001', placeholder: '0.000' },
                    { name: 'defect_total_weight_kg', label: '不良品總重量 (kg)', type: 'number', min: 0, step: '0.001', placeholder: '0.000', readonly: true },
                    { name: 'defect_notes', label: '不良品摘要備註', type: 'textarea', rows: 2, fullWidth: true, placeholder: '例如：待二次重篩 / 客戶要求回送' }
                ]
            },
            {
                title: '客戶載具摘要',
                customHtml: `
                <div class="subsection-header">
                    <h4>本次歸還載具</h4>
                    <div class="subsection-actions">
                        <button type="button" class="btn outline small" data-action="add-tool-summary">
                            <i class="fas fa-plus"></i> 新增載具
                        </button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="data-table compact ui-compact-table">
                        <thead>
                            <tr>
                                <th>載具名稱</th>
                                <th>類型</th>
                                <th>數量</th>
                                <th>單重(kg)</th>
                                <th>總重(kg)</th>
                                <th>備註</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody data-tool-summary-rows>
                            <tr class="empty-row">
                                <td colspan="7" class="text-center">尚未新增載具摘要</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p class="text-muted small">第一階段先記錄本次出貨隨貨歸還的載具摘要，不在此處建立客戶載具往來總帳。</p>`
            }
        ]
    },

    // 詳情 Modal
    detailModal: {
        title: '出貨單詳情',
        icon: 'fa-shipping-fast',
        hasEdit: true,
        hasPrint: true
    },

    // 新增出貨項目 Modal
    addItemModal: {
        title: '新增出貨項目',
        icon: 'fa-plus',
        size: 'medium',
        submitDataAction: 'submit-add-item',
        sections: [
            {
                title: '選擇庫存項目',
                fields: [
                    {
                        name: 'inventory_item_id',
                        label: '庫存項目',
                        type: 'select',
                        required: true,
                        options: [{ value: '', label: '載入中...' }]
                    },
                    { name: 'quantity', label: '出貨數量', type: 'number', required: true, min: 1, placeholder: '輸入數量' }
                ]
            },
            {
                title: '項目資訊',
                customHtml: `
                <div class="detail-grid" data-selected-item-info>
                    <p class="text-muted">請先選擇庫存項目</p>
                </div>`
            },
            {
                title: '備註',
                fields: [
                    { name: 'notes', label: '備註', type: 'textarea', rows: 2, fullWidth: true, placeholder: '項目備註（選填）' }
                ]
            }
        ],
        submitLabel: '加入',
        submitIcon: 'fa-plus',
        submitStyle: 'success'
    }
});
