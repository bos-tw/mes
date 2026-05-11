/**
 * 生產工單模組配置
 *
 * 設計決策說明：
 * ================
 * 此模組為系統最複雜的模組之一：
 * - HTML: 1,184 行
 * - JS: 2,054 行
 * - 包含 3 個複雜 Modal（新增、編輯、生產記錄）
 * - 新增 Modal 含 Tab 切換（依客戶/訂單選擇 vs 快速搜尋）
 * - 編輯 Modal 含多個子表（篩分服務、首件尺寸、工單圖片、生產記錄）
 * - 生產統計面板（訂單 vs 實際對比）
 *
 * 因此採用「混合配置模式」：
 * - 頁面結構（header、filter、column-selector、table）由配置生成
 * - 3 個複雜 Modal 從原始 HTML 檔案載入（設置 requiresHtmlModal: true）
 *
 * 這樣的好處：
 * 1. 頁面基本結構仍享有配置化的一致性
 * 2. 複雜 Modal 保持原有彈性，不會因過度抽象而難以維護
 * 3. JS 選擇器完全相容，無需修改業務邏輯
 * 4. 未來若需調整頁面結構，只需修改配置檔
 */
ModuleConfig.register('work_orders', {
    title: '生產工單',
    subtitle: '管理生產工單、首件尺寸與生產記錄',

    // ========================================
    // 混合配置模式標記
    // ========================================
    // 設為 true 時，系統會先渲染配置部分，再從原 HTML 載入 Modal
    requiresHtmlModal: true,

    // ========================================
    // 標題區按鈕
    // ========================================
    actions: [
        {
            label: '新增工單',
            icon: 'fa-plus',
            action: 'create',
            style: 'primary'
        },
        {
            label: '批次列印',
            icon: 'fa-print',
            action: 'batch-print',
            style: 'outline',
            disabled: true,
            wrapLabel: true,
            extraHtml: '\n            <span class="selection-count hidden" data-selection-count>0</span>'
        },
        {
            label: '批次匯出',
            icon: 'fa-download',
            action: 'batch-export',
            style: 'outline',
            wrapLabel: true
        }
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
            placeholder: '搜尋工單號碼、訂單號碼、客戶名稱'
        },
        {
            name: 'machine_id',
            label: '機台',
            type: 'select',
            options: [{ value: '', label: '-- 所有機台 --' }]
        },
        {
            name: 'status',
            label: '工單狀態',
            type: 'select',
            options: [{ value: '', label: '-- 所有狀態 --' }]
        },
        { name: 'start_date', label: '開始日期(起)', type: 'date' },
        { name: 'end_date', label: '開始日期(迄)', type: 'date' },
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
        { key: 'checkbox', type: 'checkbox', sortable: false, selectable: false },
        { key: 'work_order_number', label: '工單號碼', sortable: true, selectable: true },
        { key: 'order_number', label: '訂單號碼', sortable: true, selectable: true },
        { key: 'customer_name', label: '客戶名稱', sortable: true, selectable: true },
        { key: 'screening_item', label: '受篩產品', sortable: false, selectable: true },
        { key: 'machine_name', label: '機台', sortable: true, selectable: true },
        { key: 'actual_start_date', label: '開始日期', sortable: true, selectable: true },
        { key: 'actual_end_date', label: '結束日期', sortable: true, selectable: true },
        { key: 'status', label: '狀態', sortable: true, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // ========================================
    // Modal 配置：使用混合配置模式
    // ========================================
    // 由於 Modal 結構極為複雜，使用 requiresHtmlModal: true
    // 系統會自動從原始 HTML (modules/work_orders.html) 載入 Modal
    // 包含：
    // 1. 新增 Modal (data-work-orders-create-modal) - 含 Tab 切換、子表
    // 2. 編輯 Modal (data-work-orders-edit-modal) - 含多個可展開區塊
    // 3. 生產記錄 Modal (data-production-record-modal)
    modal: null
});
