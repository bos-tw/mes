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

    // 資料表格欄位
    columns: [
        { key: 'checkbox', label: '', sortable: false, isCheckbox: true },
        { key: 'order_number', label: '訂單號碼', sortable: true, selectable: true },
        { key: 'customer.name', label: '客戶名稱', sortable: true, selectable: true },
        { key: 'order_date', label: '訂單日期', sortable: true, selectable: true },
        { key: 'expected_delivery_date', label: '預計交期', sortable: true, selectable: true },
        { key: 'customer_po_number', label: '客戶訂單編號', sortable: true, selectable: true },
        { key: 'status_label', label: '狀態', sortable: true, selectable: true },
        { key: 'total_amount', label: '預估總金額', sortable: true, selectable: true },
        { key: 'created_at', label: '建立時間', sortable: true, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 表單 - 使用 formRows 模式
    modal: {
        title: '新增訂單',
        size: 'large',
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
                        <span>預計交期</span>
                        <input type="date" name="expected_delivery_date">
                        <span class="weekday-badge" data-weekday-for="expected_delivery_date"></span>
                    </label>
                    <label class="inline-label">
                        <span>預計交期時段</span>
                        <select name="expected_delivery_period">
                            <option value="">-- 請選擇時段 --</option>
                            <option value="morning">上午</option>
                            <option value="noon">中午</option>
                            <option value="afternoon">下午</option>
                            <option value="evening">晚間</option>
                        </select>
                    </label>
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
