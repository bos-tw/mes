/**
 * 代碼值模組配置
 * 
 * 特殊說明：此模組會根據查詢條件動態切換表頭
 * - 無條件查詢：顯示代碼領域列表（領域 ID / Domain Key / 描述）
 * - 指定 Domain：顯示代碼值列表（值 ID / 鍵值 / 顯示文字 / 排序 / 啟用）
 * 
 * 表頭由 JS 動態生成，配置僅提供初始結構
 */
ModuleConfig.register('lookup_values', {
    title: '代碼值',
    subtitle: '檢視並查詢所有代碼領域與其對應的代碼值。',

    // 標題區按鈕
    actions: [
        { label: '重新整理', icon: 'fa-sync', action: 'refresh-lookup-values', style: 'outline', wrapLabel: true }
    ],

    tableHeaderActions: true,
    tableHeaderActionsInHeader: true,
    filterLayout: 'drawer',
    useGenericFilterDrawer: true,

    // 篩選工具列
    filters: [
        { name: 'domain_key', label: 'Domain Key', type: 'text', placeholder: '例如：EMPLOYEE_STATUS' },
        { name: 'domain_id', label: 'Domain ID', type: 'number', min: 1, placeholder: '純數字 ID' }
    ],

    // 篩選表單額外提示文字
    filterHint: '若未輸入任何條件，將列出所有啟用中的代碼領域。Domain Key 優先於 Domain ID。',

    // 篩選按鈕自訂標籤
    filterSubmitLabel: '查詢',

    // 表格前顯示摘要
    tableMeta: true,

    // 不使用 table-responsive，使用 table-wrapper
    tableWrapperClass: 'table-wrapper',

    // 資料表格欄位（初始狀態：代碼領域模式）
    // 注意：JS 會動態切換表頭，這裡僅為初始結構
    columns: [
        { key: 'domain_key', label: 'Domain Key', sortable: false, selectable: false },
        { key: 'description', label: '描述', sortable: false, selectable: false }
    ],

    // 不需要分頁
    noPagination: true
});
