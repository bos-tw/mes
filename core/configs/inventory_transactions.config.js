/**
 * 庫存異動紀錄模組配置
 * 
 * 設計決策說明：
 * ================
 * 此模組為「唯讀查詢」模組，特性如下：
 * - 無新增/編輯功能（資料由系統自動產生）
 * - 提供統計摘要卡片顯示整體異動情況
 * - 支援多種篩選條件
 * - 提供詳情 Modal 檢視單筆記錄
 * 
 * 統計摘要區使用 customHtml 原因：
 * - 摘要卡片為此模組特有 UI 元件
 * - 不適合抽象為通用配置項目
 * - 使用 customHtml 保持渲染器簡潔
 * 
 * 排序欄位使用 sortKey 原因：
 * - 此模組涉及多表 JOIN 查詢
 * - 需明確指定排序欄位的完整路徑（含表別名）
 */
ModuleConfig.register('inventory_transactions', {
    title: '庫存異動紀錄',
    subtitle: '追蹤每一次入庫、出庫與調整，對照庫存項目變化',

    // ========================================
    // 標題區按鈕 - 無（僅查詢模組）
    // ========================================
    actions: [],

    // ========================================
    // 欄位選擇器設定
    // ========================================
    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // ========================================
    // 統計摘要區 - 使用 customHtml
    // ========================================
    // 資料由 JS 動態更新（inventory_transactions.js）
    // 選擇器：[data-inventory-transactions-summary]
    customHtml: `
    <section class="summary-cards" data-inventory-transactions-summary>
        <div class="summary-card">
            <div class="summary-icon"><i class="fas fa-list"></i></div>
            <div class="summary-content">
                <span class="summary-label">總筆數</span>
                <span class="summary-value" data-total-items>0</span>
            </div>
        </div>
        <div class="summary-card">
            <div class="summary-icon"><i class="fas fa-arrow-down"></i></div>
            <div class="summary-content">
                <span class="summary-label">入庫數量</span>
                <span class="summary-value" data-total-inbound>0</span>
            </div>
        </div>
        <div class="summary-card">
            <div class="summary-icon"><i class="fas fa-arrow-up"></i></div>
            <div class="summary-content">
                <span class="summary-label">出庫數量</span>
                <span class="summary-value" data-total-outbound>0</span>
            </div>
        </div>
        <div class="summary-card">
            <div class="summary-icon"><i class="fas fa-exchange-alt"></i></div>
            <div class="summary-content">
                <span class="summary-label">調整淨變化</span>
                <span class="summary-value" data-total-net>0</span>
            </div>
        </div>
    </section>`,

    // ========================================
    // 篩選工具列
    // ========================================
    filters: [
        { 
            name: 'keyword', 
            label: '關鍵字', 
            type: 'text', 
            placeholder: '庫存編號 / 來源類型' 
        },
        { 
            name: 'direction', 
            label: '異動方向', 
            type: 'select',
            options: [
                { value: '', label: '-- 全部 --' },
                { value: 'inbound', label: '入庫' },
                { value: 'outbound', label: '出庫' },
                { value: 'adjustment', label: '調整' }
            ]
        },
        { 
            name: 'ref_type', 
            label: '來源類型', 
            type: 'select',
            options: [
                { value: '', label: '-- 全部 --' },
                { value: 'work_order', label: '生產工單' },
                { value: 'shipping_order', label: '出貨單' },
                { value: 'return_order', label: '退貨單' },
                { value: 'order', label: '訂單' },
                { value: 'adjustment', label: '手動調整' }
            ]
        },
        { name: 'start_date', label: '日期(起)', type: 'date' },
        { name: 'end_date', label: '日期(迄)', type: 'date' },
        { 
            name: 'perPage', 
            label: '每頁筆數', 
            type: 'select',
            options: [
                { value: '10', label: '10' },
                { value: '20', label: '20', selected: true },
                { value: '50', label: '50' },
                { value: '100', label: '100' }
            ]
        }
    ],

    // ========================================
    // 資料表格欄位定義
    // ========================================
    // 注意：sortKey 用於多表 JOIN 查詢時指定完整欄位路徑
    columns: [
        { key: 'inventory_number', label: '庫存編號', sortable: true, sortKey: 'ii.inventory_number', selectable: true },
        { key: 'product', label: '產品', sortable: false, selectable: true },
        { key: 'customer', label: '客戶', sortable: false, selectable: true },
        { key: 'order_number', label: '訂單', sortable: true, sortKey: 'o.order_number', selectable: true },
        { key: 'work_order_number', label: '工單', sortable: true, sortKey: 'wo.work_order_number', selectable: true },
        { key: 'source', label: '來源', sortable: false, selectable: true },
        { key: 'direction', label: '方向', sortable: true, sortKey: 'it.direction', selectable: true },
        { key: 'quantity', label: '變動數量', sortable: true, sortKey: 'it.quantity', selectable: true, className: 'text-right' },
        { key: 'after_quantity', label: '異動後庫存', sortable: true, sortKey: 'it.after_quantity', selectable: true, className: 'text-right' },
        { key: 'created_by', label: '建立人', sortable: false, selectable: true },
        { key: 'created_at', label: '時間', sortable: true, sortKey: 'it.created_at', selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],

    // ========================================
    // 詳情 Modal
    // ========================================
    // 僅提供檢視功能，無編輯按鈕
    // contentDataAttr: 自訂詳情內容選擇器（向後相容原 JS）
    detailModal: {
        title: '庫存異動詳情',
        icon: 'fa-info-circle',
        size: 'medium',
        contentDataAttr: 'data-inventory-transactions-detail-content',
        buttons: [
            { action: 'close-detail-modal', label: '關閉', style: 'secondary' }
        ]
    }
});
