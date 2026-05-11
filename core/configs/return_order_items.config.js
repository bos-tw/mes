/**
 * 退貨品項模組配置
 * 注意：此模組目前為佔位頁面，待實作
 */
ModuleConfig.register('return_order_items', {
    title: '退貨品項',
    subtitle: '退貨品項紀錄每筆退貨單中的商品品項與退回數量，便於後續重工或報銷。',

    // 無標題按鈕（目前為佔位頁面）
    actions: [],

    // 表格欄位
    columns: [
        { key: 'checkbox', label: '', type: 'checkbox' },
        { key: 'returned_quantity', label: '退貨數量' },
        { key: 'returned_unit', label: '退貨單位' },
        { key: 'created_at', label: '建立時間' }
    ],

    rowActions: true,

    // 佔位訊息
    emptyMessage: '目前尚無退貨品項資料，請於退貨單建立後維護明細。'
});
