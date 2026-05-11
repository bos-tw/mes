/**
 * 生產品質檢驗模組配置
 * 
 * 設計決策說明：
 * ================
 * 此模組結構較複雜：
 * - 使用 formRows 模式（多欄並排 section）
 * - 包含 column-selector 欄位選擇器
 * - Modal 表單使用 id 選擇器而非 data 屬性
 * - 有計算欄位（不良率自動計算）
 * 
 * 採用混合配置模式：
 * - 頁面結構由配置生成
 * - Modal 從原始 HTML 載入
 */
ModuleConfig.register('production_quality_records', {
    title: '生產品質檢驗',
    subtitle: '管理生產過程中的品質檢驗記錄',

    // 混合配置模式
    requiresHtmlModal: true,

    // 標題區按鈕
    actions: [
        { label: '新增', icon: 'fa-plus', action: 'create', style: 'primary' },
        { label: '列印', icon: 'fa-print', action: 'print', style: 'outline', wrapLabel: true },
        { label: '匯出', icon: 'fa-file-export', action: 'export', style: 'outline', wrapLabel: true }
    ],

    // 欄位選擇器
    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選工具列
    filters: [
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '工單編號 / 卡號 / 檢驗員' },
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

    // 欄位選擇器設定
    columnSelectorFields: [
        { key: 'work_order_number', label: '工單編號', checked: true },
        { key: 'card_number', label: '卡號', checked: true },
        { key: 'inspection_datetime', label: '檢驗時間', checked: true },
        { key: 'inspector_name', label: '檢驗員', checked: true },
        { key: 'sample_quantity_pcs', label: '抽樣數量', checked: true },
        { key: 'defective_quantity_pcs', label: '不良數量', checked: true },
        { key: 'rejection_rate_ppm', label: '不良率(ppm)', checked: true },
        { key: 'inspection_result', label: '檢驗結果', checked: true },
        { key: 'rework_needed', label: '需要重工', checked: true },
        { key: 'notes', label: '備註', checked: true }
    ],

    // 資料表格欄位
    columns: [
        { key: 'work_order_number', label: '工單編號', sortable: true, selectable: true },
        { key: 'card_number', label: '卡號', sortable: false, selectable: true },
        { key: 'inspection_datetime', label: '檢驗時間', sortable: true, selectable: true },
        { key: 'inspector_name', label: '檢驗員', sortable: false, selectable: true },
        { key: 'sample_quantity_pcs', label: '抽樣數量', sortable: true, selectable: true },
        { key: 'defective_quantity_pcs', label: '不良數量', sortable: true, selectable: true },
        { key: 'rejection_rate_ppm', label: '不良率(ppm)', sortable: true, selectable: true },
        { key: 'inspection_result', label: '檢驗結果', sortable: false, selectable: true },
        { key: 'rework_needed', label: '需要重工', sortable: true, selectable: true },
        { key: 'notes', label: '備註', sortable: false, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // Modal 由原 HTML 載入
    modal: null
});
