/**
 * 庫存項目模組配置
 * 
 * 設計決策說明：
 * ================
 * 此模組包含三個 Modal：
 * 1. 主表單 Modal - 新增/編輯入庫項目（配置化）
 * 2. 詳情 Modal - 檢視庫存詳情（配置化）
 * 3. 出貨 Modal - 加入出貨單（customModalHtml）
 * 
 * shippingModal 使用 customModalHtml 原因：
 * - 結構與主 Modal 不同，是功能性 Modal
 * - 包含動態顯示的庫存資訊區塊
 * - 避免過度抽象導致難以維護
 */
ModuleConfig.register('inventory_items', {
    title: '庫存項目',
    subtitle: '管理生產完工入庫項目、追溯工單與訂單資訊',

    // ========================================
    // 標題區按鈕
    // ========================================
    actions: [
        { label: '新增入庫', icon: 'fa-plus', action: 'create', style: 'primary' },
        { label: '批次匯出', icon: 'fa-download', action: 'batch-export', style: 'outline', wrapLabel: true }
    ],

    // ========================================
    // 欄位選擇器設定
    // ========================================
    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // ========================================
    // 篩選工具列
    // ========================================
    filters: [
        { 
            name: 'keyword', 
            label: '關鍵字', 
            type: 'text', 
            placeholder: '搜尋庫存編號、工單號、客戶批號、客戶名' 
        },
        { 
            name: 'customer_id', 
            label: '客戶', 
            type: 'select',
            options: [{ value: '', label: '-- 所有客戶 --' }]
        },
        { 
            name: 'screening_item_id', 
            label: '受篩產品', 
            type: 'select',
            options: [{ value: '', label: '-- 所有產品 --' }]
        },
        { 
            name: 'status', 
            label: '庫存狀態', 
            type: 'select',
            options: [
                { value: '', label: '-- 所有狀態 --' },
                { value: 'in_stock', label: '在庫' },
                { value: 'allocated', label: '已配貨' },
                { value: 'shipped', label: '已出貨' },
                { value: 'consumed', label: '已耗用' }
            ]
        },
        { 
            name: 'quality_status', 
            label: '質量狀態', 
            type: 'select',
            options: [
                { value: '', label: '-- 所有狀態 --' },
                { value: 'qualified', label: '合格' },
                { value: 'quarantine', label: '隔離' },
                { value: 'rejected', label: '拒收' }
            ]
        },
        { name: 'start_date', label: '入庫日期(起)', type: 'date' },
        { name: 'end_date', label: '入庫日期(迄)', type: 'date' },
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

    // ========================================
    // 資料表格欄位定義
    // ========================================
    columns: [
        { key: 'inventory_number', label: '庫存編號', sortable: true, selectable: true },
        { key: 'work_order_number', label: '工單號碼', sortable: true, selectable: true },
        { key: 'customer_name', label: '客戶', sortable: true, selectable: true },
        { key: 'customer_batch_number', label: '客戶批號', sortable: true, selectable: true },
        { key: 'screening_item_name', label: '受篩產品', sortable: true, selectable: true },
        { key: 'quantity_on_hand', label: '現有數量', sortable: true, selectable: true, className: 'text-right' },
        { key: 'net_weight_kg', label: '淨重(kg)', sortable: true, selectable: true, className: 'text-right' },
        { key: 'quality_status', label: '質量狀態', sortable: true, selectable: true },
        { key: 'status', label: '庫存狀態', sortable: true, selectable: true },
        { key: 'received_at', label: '入庫時間', sortable: true, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // ========================================
    // 主 Modal 表單 - 使用 formRows 二欄並排佈局
    // ========================================
    modal: {
        title: '新增入庫項目',
        size: 'xlarge',
        submitDataAction: 'submit',
        formRows: [
            {
                sections: [
                    {
                        title: '來源追溯資訊',
                        fields: [
                            { name: 'work_order_id', label: '生產工單', type: 'select', required: true, options: [{ value: '', label: '-- 請選擇工單 --' }], dataAttr: 'data-action="load-work-order-details"' },
                            { name: 'inventory_number', label: '庫存編號', type: 'text', disabled: true, placeholder: '系統自動生成' },
                            { name: 'internal_lot_number', label: '內部批號', type: 'text', placeholder: '選填,內部管理用' }
                        ]
                    },
                    {
                        title: '工單詳細資訊',
                        className: 'info-section',
                        fields: [
                            { name: 'customer_name', label: '客戶名稱', type: 'text', readonly: true },
                            { name: 'order_number', label: '訂單號碼', type: 'text', readonly: true },
                            { name: 'customer_batch_number', label: '客戶批號', type: 'text', readonly: true },
                            { name: 'screening_item_name', label: '受篩產品', type: 'text', readonly: true }
                        ]
                    }
                ]
            },
            {
                sections: [
                    {
                        title: '數量與重量資訊',
                        fields: [
                            { name: 'total_good_units', label: '良品總支數', type: 'number', required: true, step: '0.01' },
                            { name: 'total_defect_units', label: '不良品總支數', type: 'number', step: '0.01' },
                            { name: 'defect_weight_kg', label: '不良品重量 (kg)', type: 'number', step: '0.001', readonly: true },
                            { name: 'quantity_on_hand', label: '現有庫存數量', type: 'number', step: '0.01', placeholder: '預設=良品總數' },
                            { name: 'quantity_allocated', label: '已配貨數量', type: 'number', step: '0.01', readonly: true },
                            { name: 'net_weight_kg', label: '淨重 (kg)', type: 'number', required: true, step: '0.01' },
                            { name: 'gross_weight_kg', label: '總重 (kg,含載具)', type: 'number', required: true, step: '0.01' },
                            { name: 'tool_weight_kg', label: '載具總重 (kg)', type: 'number', step: '0.01' },
                            { name: 'weight_per_unit_g', label: '產品單支重 (g)', type: 'number', required: true, step: '0.001' }
                        ]
                    },
                    {
                        title: '載具資訊',
                        fields: [
                            { name: 'tool_statistics', label: '載具統計', type: 'text', placeholder: '例: 10kg標準桶 2個、52kg標準船 1個' },
                            { name: 'total_tool_quantity', label: '載具總數量', type: 'number' }
                        ]
                    }
                ]
            },
            {
                sections: [
                    {
                        title: '質量與檢驗',
                        fields: [
                            { name: 'quality_status', label: '質量狀態', type: 'select', options: [{ value: 'qualified', label: '合格' }, { value: 'quarantine', label: '隔離' }, { value: 'rejected', label: '拒收' }] },
                            { name: 'inspection_date', label: '檢驗日期', type: 'datetime-local' },
                            { name: 'inspector_employee_id', label: '檢驗人員', type: 'select', options: [{ value: '', label: '-- 請選擇 --' }] },
                            { name: 'status', label: '庫存狀態', type: 'select', options: [{ value: 'in_stock', label: '在庫' }, { value: 'allocated', label: '已配貨' }, { value: 'shipped', label: '已出貨' }, { value: 'consumed', label: '已耗用' }] }
                        ]
                    },
                    {
                        title: '儲位資訊',
                        fields: [
                            { name: 'warehouse_location', label: '倉庫位置', type: 'text', placeholder: '例: A倉' },
                            { name: 'storage_zone', label: '儲區', type: 'text', placeholder: '例: A1區' },
                            { name: 'shelf_number', label: '貨架號', type: 'text', placeholder: '例: A1-01' },
                            { name: 'received_at', label: '入庫時間', type: 'datetime-local', required: true }
                        ]
                    }
                ]
            }
        ],
        sections: [
            {
                title: '備註',
                fields: [
                    { name: 'quality_notes', label: '質量備註', type: 'textarea', rows: 2, fullWidth: true, placeholder: '質量相關說明...' },
                    { name: 'notes', label: '一般備註', type: 'textarea', rows: 2, fullWidth: true, placeholder: '其他說明...' }
                ]
            }
        ],
        hiddenFields: ['id', 'screening_item_id']
    },

    // ========================================
    // 詳情 Modal
    // ========================================
    detailModal: {
        title: '庫存項目詳情',
        hasEdit: true
    },

    // ========================================
    // 出貨 Modal - 使用 customModalHtml
    // ========================================
    // 此 Modal 用於將庫存項目加入出貨單
    // 結構特殊，包含：
    // - 庫存項目資訊顯示區（唯讀）
    // - 出貨單選擇下拉
    // - 出貨數量輸入
    customModalHtml: `
    <div class="modal-overlay hidden" data-shipping-modal>
        <div class="modal-window medium">
            <button type="button" class="modal-close" data-action="close-shipping-modal" aria-label="關閉">
                <i class="fas fa-times"></i>
            </button>
            <h3><i class="fas fa-shipping-fast"></i> 加入出貨單</h3>

            <div class="modal-alert hidden" data-shipping-modal-alert role="alert"></div>

            <form data-shipping-form>
                <input type="hidden" name="inventory_item_id">
                <input type="hidden" name="customer_id">

                <!-- 庫存項目資訊 -->
                <section class="form-section">
                    <h4>庫存項目資訊</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">庫存編號</span>
                            <span class="detail-value" data-shipping-inventory-number>-</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">客戶</span>
                            <span class="detail-value" data-shipping-customer-name>-</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">產品</span>
                            <span class="detail-value" data-shipping-product-name>-</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">可用數量</span>
                            <span class="detail-value" data-shipping-available-qty>-</span>
                        </div>
                    </div>
                </section>

                <!-- 出貨單選擇 -->
                <section class="form-section">
                    <h4>選擇出貨單</h4>
                    <div class="form-grid">
                        <label class="inline-label">
                            <span>出貨單 <abbr title="必填">*</abbr></span>
                            <select name="shipping_order_id" required>
                                <option value="">載入中...</option>
                            </select>
                            <small class="form-hint">選擇現有草稿或建立新出貨單</small>
                        </label>
                        <label class="inline-label">
                            <span>出貨數量 <abbr title="必填">*</abbr></span>
                            <input type="number" name="quantity" min="1" required placeholder="輸入出貨數量" autocomplete="off">
                            <small class="form-hint" data-shipping-max-qty></small>
                        </label>
                    </div>
                </section>

                <!-- 備註 -->
                <section class="form-section">
                    <h4>備註</h4>
                    <div class="form-grid">
                        <label class="inline-label full-width">
                            <span>備註</span>
                            <textarea name="notes" rows="2" placeholder="出貨備註（選填）"></textarea>
                        </label>
                    </div>
                </section>

                <div class="form-actions">
                    <button type="button" class="outline" data-action="close-shipping-modal">取消</button>
                    <button type="submit" class="success">
                        <i class="fas fa-plus"></i> 加入出貨單
                    </button>
                </div>
            </form>
        </div>
    </div>`
});
