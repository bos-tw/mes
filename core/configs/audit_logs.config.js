/**
 * 操作日誌模組配置
 * 
 * 注意：此模組使用 dataPrefix: 'auditlogs' 來匹配 JS 中的選擇器
 * （JS 使用 data-auditlogs-* 而非 data-audit-logs-*）
 * 
 * 使用混合配置模式：頁面結構由配置渲染，詳情 Modal 從原 HTML 載入
 */
ModuleConfig.register('audit_logs', {
    // 自定義 data 屬性前綴（無底線）
    dataPrefix: 'auditlogs',
    
    // 使用混合模式：Modal 從原 HTML 載入
    requiresHtmlModal: true,
    
    title: '操作日誌',
    subtitle: '唯讀檢視與匯出系統自動產生的不可變操作紀錄',

    // 標題區按鈕
    actions: [
        { label: '匯出', icon: 'fa-file-export', action: 'export', style: 'outline', wrapLabel: true }
    ],

    hasColumnSelector: true,
    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選工具列
    filters: [
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '動作 / 目標資料表 / IP' },
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

    // 資料表格欄位（含排序和 checkbox）
    columns: [
        { key: 'employee_name', label: '員工', sortable: true, selectable: true },
        { key: 'action', label: '動作', sortable: true, selectable: true },
        { key: 'target_table', label: '目標資料表', sortable: true, selectable: true },
        { key: 'ip_address', label: 'IP 位址', sortable: true, selectable: true },
        { key: 'created_at', label: '建立時間', sortable: true, selectable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ]
});
