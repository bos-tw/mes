/**
 * 客戶批號管理模組配置
 * 
 * 設計決策說明：
 * ================
 * 此模組的 Modal 極為複雜（約 320 行），包含：
 * - 受篩產品選擇與即時新增面板
 * - 圖面附件子表（可上傳/預覽/刪除）
 * - 檔案附件子表（可上傳/預覽/刪除）
 * - 載具設定子表（含類型統計）
 * - 篩分服務子表（含公差/PPM 設定）
 * - 底部即時計算面板（8 個指標）
 * 
 * 因此採用「混合配置模式」：
 * - 頁面結構（header、banner、table、guidance）由配置生成
 * - Modal 從原始 HTML 檔案載入（設置 requiresHtmlModal: true）
 * 
 * 這樣的好處：
 * 1. 頁面基本結構仍享有配置化的一致性
 * 2. 複雜 Modal 保持原有彈性，不會因過度抽象而難以維護
 * 3. JS 選擇器完全相容，無需修改業務邏輯
 */
ModuleConfig.register('order_items', {
    title: '客戶批號',
    subtitle: '維護篩分明細、載具與金額，並自動回寫訂單總額',

    // ========================================
    // 混合配置模式標記
    // ========================================
    // 設為 true 時，系統會先渲染配置部分，再從原 HTML 載入 Modal
    requiresHtmlModal: true,

    // ========================================
    // 標題區按鈕
    // ========================================
    // 注意：這些按鈕初始為 disabled，由 JS 在選擇訂單後啟用
    actions: [
        { 
            label: '新增品項', 
            icon: 'fa-plus', 
            action: 'create', 
            style: 'primary', 
            disabled: true, 
            wrapLabel: true 
        },
        { 
            label: '匯出', 
            icon: 'fa-file-export', 
            action: 'export', 
            style: 'outline', 
            disabled: true, 
            wrapLabel: true 
        }
    ],

    // ========================================
    // 欄位選擇器設定
    // ========================================
    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,

    // ========================================
    // 自訂 HTML：訂單資訊橫幅
    // ========================================
    // 此區塊會在選擇訂單後由 JS 動態更新內容
    customHtml: `
    <section class="info-banner" data-order-items-banner>
        <div class="empty-state">
            <i class="fas fa-clipboard-list"></i>
            <p>請先於「訂單管理」的操作欄點擊 <span class="label">明細</span>，即可載入該訂單的品項資料。</p>
        </div>
    </section>`,

    // ========================================
    // 資料表格欄位定義
    // ========================================
    // 無篩選工具列（資料由訂單帶入，不需要獨立篩選）
    columns: [
        { key: 'customer_batch_number', label: '客戶批號', sortable: true, selectable: true },
        { key: 'screening_label', label: '受篩品項', sortable: true, selectable: true },
        { key: 'total_weight_kg', label: '總重量(kg)', sortable: true, selectable: true, className: 'text-right' },
        { key: 'tool_weight_kg', label: '載具重量(kg)', sortable: true, selectable: true, className: 'text-right' },
        { key: 'net_weight_kg', label: '淨重(kg)', sortable: true, selectable: true, className: 'text-right' },
        { key: 'total_units', label: '總支數', sortable: true, selectable: true, className: 'text-right' },
        { key: 'unit_price_per_thousand', label: '單價 (元/M)', sortable: true, selectable: true, className: 'text-right' },
        { key: 'total_price', label: '預估總金額', sortable: true, selectable: true, className: 'text-right' },
        { key: 'status_label', label: '狀態', sortable: true, selectable: true },
        { key: 'sample_status_label', label: '客戶樣品狀態', sortable: true, selectable: true },
        { key: 'updated_at', label: '更新時間', sortable: true, selectable: true },
        { key: 'total_shipped_quantity', label: '已出貨數量', sortable: true, selectable: true, className: 'text-right' },
        { key: 'shipping_status', label: '出貨狀態', sortable: true, selectable: true },
        { key: 'customer_provided_weight', label: '客戶提供重量', sortable: true, selectable: true, className: 'text-right' },
        { key: 'confirmed_weight', label: '確認重量', sortable: true, selectable: true, className: 'text-right' },
        { key: 'actual_production_weight', label: '實際生產重量', sortable: true, selectable: true, className: 'text-right' },
        { key: 'weight_variance', label: '重量差異', sortable: false, selectable: true, className: 'text-right' },
        { key: 'tool_types', label: '載具類型', sortable: false, selectable: true },
        { key: 'tool_unit_weight', label: '載具單重(kg)', sortable: false, selectable: true, className: 'text-right' },
        { key: 'tool_quantity', label: '載具數量', sortable: false, selectable: true, className: 'text-right' },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // ========================================
    // 表格後引導說明區
    // ========================================
    // 提供使用者操作指引，選擇訂單後此區會被隱藏
    afterTableHtml: `
    <div class="order-items-guidance" data-order-items-guidance>
        <h3>如何開始？</h3>
        <ol>
            <li>到 <strong>訂單管理</strong> 模組尋找目標訂單。</li>
            <li>點擊操作欄的 <span class="label">明細</span> 按鈕。</li>
            <li>系統會自動帶入訂單資訊，並啟用新增、匯出與編輯功能。</li>
        </ol>
        <p class="tip">完成訂單品項後，系統會自動累計並回寫品項金額至訂單。</p>
    </div>`,

    // ========================================
    // Modal 配置：使用混合配置模式
    // ========================================
    // 由於 Modal 結構極為複雜，使用 requiresHtmlModal: true
    // 系統會自動從原始 HTML (modules/order_items.html) 載入 Modal
    // 請參考原 HTML 第 143-465 行
    modal: null
});
