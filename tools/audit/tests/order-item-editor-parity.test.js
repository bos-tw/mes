'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const modalHtml = fs.readFileSync(path.join(ROOT, 'modules', 'order_items.html'), 'utf8');
const ordersScript = fs.readFileSync(path.join(ROOT, 'js', 'orders.js'), 'utf8');
const orderItemsScript = fs.readFileSync(path.join(ROOT, 'js', 'order_items.js'), 'utf8');
const inlineSelectionScript = fs.readFileSync(path.join(ROOT, 'js', 'orders', 'order-item-selection.js'), 'utf8');
const moduleAssetsScript = fs.readFileSync(path.join(ROOT, 'core', 'module-assets.js'), 'utf8');
const copyApi = fs.readFileSync(path.join(ROOT, 'api', 'order_items', 'copy.php'), 'utf8');
const orderItemsConfig = fs.readFileSync(path.join(ROOT, 'core', 'configs', 'order_items.config.js'), 'utf8');
const screeningItemsConfig = fs.readFileSync(path.join(ROOT, 'core', 'configs', 'screening_items.config.js'), 'utf8');
const ordersConfig = fs.readFileSync(path.join(ROOT, 'core', 'configs', 'orders.config.js'), 'utf8');
const ordersHelpers = fs.readFileSync(path.join(ROOT, 'api', 'orders', 'helpers.php'), 'utf8');
const screeningHistoryApi = fs.readFileSync(path.join(ROOT, 'api', 'orders', 'screening-item-history.php'), 'utf8');
const orderItemsHelpers = fs.readFileSync(path.join(ROOT, 'api', 'order_items', 'helpers.php'), 'utf8');
const globalScript = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
const styles = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');

const requiredModalContracts = [
    'data-order-items-modal',
    'name="screening_item_id"',
    'data-screening-create-panel',
    'name="total_weight_kg"',
    'name="customer_batch_number"',
    'data-drawings-rows',
    'data-attachments-rows',
    'data-tools-rows',
    'data-services-rows',
    'data-metrics',
];

requiredModalContracts.forEach((contract) => {
    assert.ok(modalHtml.includes(contract), `完整客戶批號 Modal 缺少契約：${contract}`);
});

assert.ok(
    ordersScript.includes('fetch(`modules/order_items.html'),
    '訂單主表必須直接載入 modules/order_items.html 的完整 Modal',
);
assert.ok(
    ordersScript.includes('editor.openCreate(getOrderContext(orderId), initialData)'),
    '訂單主表新增明細必須呼叫共用完整編輯器',
);
assert.ok(
    ordersScript.includes('editor.openEdit(getOrderContext(orderId), orderItemId)'),
    '訂單主表編輯明細必須呼叫共用完整編輯器',
);
assert.ok(!ordersScript.includes('OrderItemQuickEditor'), '訂單主表禁止重新接回縮水快速表單');
assert.ok(!ordersScript.includes('loadOrderItemQuickEditor'), '訂單主表禁止載入縮水快速表單');
assert.ok(orderItemsScript.includes('editorOnly'), 'order_items 必須保留 editor-only 共用模式');
assert.ok(orderItemsScript.includes('orderItemsController'), 'order_items 必須公開共用 Modal 控制器');
assert.ok(orderItemsScript.includes("'api/order_items/index.php'"), '共用新增流程必須使用正式訂單明細 API');

const inlineCopyButtonIndex = ordersScript.indexOf('data-action="copy-order-item"');
const inlineCreateButtonIndex = ordersScript.indexOf('data-action="add-order-item"');
const batchOverviewButtonIndex = ordersScript.indexOf('data-action="open-order-items"', inlineCreateButtonIndex);
const inlineColumnSettingsButtonIndex = ordersScript.indexOf('data-action="toggle-column-selector"', batchOverviewButtonIndex);
assert.ok(inlineCopyButtonIndex >= 0, '訂單主表內嵌明細必須提供複製按鈕');
assert.ok(inlineCreateButtonIndex > inlineCopyButtonIndex, '新增按鈕必須位於複製按鈕右側');
assert.ok(batchOverviewButtonIndex > inlineCreateButtonIndex, '批號一覽按鈕必須位於新增按鈕右側');
assert.ok(inlineColumnSettingsButtonIndex > batchOverviewButtonIndex, '欄位設定按鈕必須位於批號一覽右側');
assert.ok(ordersScript.includes('data-action="view-order-details"'), '訂單主列必須提供詳細檢視按鈕');
assert.ok(ordersScript.includes('title="詳細檢視"'), '訂單詳細檢視按鈕必須使用正式名稱');
assert.ok(ordersScript.includes('data-action="view-order-details" data-order-id="${orderId}" title="詳細檢視" aria-label="詳細檢視"><i class="fas fa-eye"'), '詳細檢視必須使用 fa-eye 圖示');
assert.ok(ordersConfig.includes('data-orders-detail-drawer'), '訂單模組必須提供右側詳細檢視抽屜');
assert.ok(ordersConfig.includes('data-orders-detail-items'), '訂單詳細檢視必須包含訂單明細');
const orderDetailConfig = ordersConfig.slice(
    ordersConfig.indexOf('data-orders-detail-sections'),
    ordersConfig.indexOf('</aside>`'),
);
assert.deepStrictEqual(
    Array.from(orderDetailConfig.matchAll(/data-order-detail-field="([^"]+)"/g), (match) => match[1]),
    ['order_number', 'customer_name', 'order_date', 'expected_delivery'],
    '訂單基本資料只能顯示訂單號碼、客戶名稱、訂單日期與預計交期',
);
assert.ok(ordersScript.includes('&include=customer,items'), '訂單詳細檢視必須載入客戶與明細完整資料');
assert.ok(ordersScript.includes("orderDetailItemsBody.replaceChildren()"), '訂單明細必須以 DOM API 安全渲染');
[
    '受篩產品、重量與狀態',
    '重量追蹤',
    '備註資訊',
    '計算指標',
    '載具設定',
    '篩分服務',
    '圖面附件',
    '檔案附件',
].forEach((section) => {
    assert.ok(ordersScript.includes(`'${section}'`), `訂單詳細檢視缺少 Modal 資訊表：${section}`);
});
assert.ok(ordersScript.includes('drawings.map((drawing) => [drawing.file_name])'), '圖面附件只能顯示檔名');
assert.ok(ordersScript.includes('attachments.map((attachment) => [attachment.file_name])'), '檔案附件只能顯示檔名');
assert.ok(styles.includes('--ui-detail-drawer-width: 50vw'), '訂單詳細檢視抽屜在桌面必須佔畫面一半');
assert.ok(styles.includes('.order-detail-drawer [data-orders-detail-subtitle]'), '訂單號碼必須使用重要資訊字級');
assert.ok(styles.includes('.order-detail-basic-table tbody td'), '訂單基本資料內容必須使用重要資訊字級');
assert.ok(styles.includes('.order-detail-drawer .order-detail-item-card > h4'), '訂單明細編號必須降為一般資訊字級');
assert.ok(styles.includes('overflow-wrap: anywhere'), '訂單詳細表格必須允許內容斷行以避免水平捲軸');
assert.ok(
    /\.order-items-inline-table\s*\{[\s\S]*?margin:\s*var\(--ui-section-gap\) 0 var\(--ui-section-gap\) var\(--ui-section-gap\);/.test(styles),
    '內嵌訂單明細表格的上、左、下邊界必須統一使用 ui-section-gap',
);
assert.ok(globalScript.includes("'view-order-details': '詳細檢視'"), '共用操作語意必須登錄詳細檢視名稱');
assert.ok(ordersScript.includes('data-action="select-order-item-inline"'), '訂單細項必須在系統序號右側提供單筆勾選欄');
assert.ok(ordersScript.includes('data-action="create-work-order" data-order-id="${orderId}" data-order-item-id="${item.id}"'), '訂單細項操作欄必須提供轉為工單按鈕');
assert.ok(ordersScript.includes('class="btn text" data-action="create-work-order"'), '轉為工單必須沿用客戶批號頁面的標準按鈕 class');
assert.ok(ordersScript.includes('<i class="fas fa-cogs" aria-hidden="true"></i>'), '轉為工單必須沿用 fa-cogs 圖示');
assert.ok(ordersScript.includes('function handleCreateWorkOrder(orderItemId)'), '訂單細項必須沿用既有轉為工單流程入口');
assert.ok(ordersScript.includes('window.openWorkOrderFromOrderItem(orderItemId)'), '訂單細項轉為工單必須呼叫既有客戶批號預填流程');
assert.ok(ordersScript.includes("此客戶批號已轉成工單，請勿重複建立。"), '已建立工單的客戶批號必須阻擋重複建立');
assert.ok(ordersScript.includes('function renderOrderStatusBadge'), '訂單狀態必須使用共用 status-badge 渲染器');
assert.ok(ordersScript.includes("pending: 'pending'"), '待處理訂單必須沿用系統預設 pending badge');
assert.ok(ordersScript.includes("in_progress: 'in-progress'"), '進行中訂單必須沿用系統預設 in-progress badge');
assert.ok(ordersScript.includes('renderOrderStatusBadge(order.status, statusLabel)'), '訂單主列必須以狀態徽章顯示');
assert.ok(ordersScript.includes('renderOrderStatusBadge(item.status, statusLabel)'), '訂單細項列必須以狀態徽章顯示');
assert.ok(!ordersScript.includes('<th class="row-number-col">序號</th>'), '內嵌訂單細項不可自行渲染序號欄，避免與共用序號管理器重複');
assert.ok(ordersScript.includes('data-module="order_items_order_context"'), '內嵌訂單細項必須有獨立欄位管理範圍');
assert.ok(ordersScript.includes('data-order-items-order-context-column-selector'), '內嵌訂單細項必須提供共用欄位設定面板');
assert.ok(ordersScript.includes('class="data-table order-items-inline-table"'), '內嵌訂單細項必須接入共用欄寬調整器');
assert.ok(ordersScript.includes('data-order-items-order-context-table'), '內嵌訂單細項必須提供欄位管理表格契約');
assert.ok(ordersScript.includes('data-action="open-screening-history"'), '受篩品項右側必須提供同客戶歷史按鈕');
assert.ok(ordersScript.includes('class="screening-item-cell-main"'), '歷史按鈕必須併入受篩品項欄位右側');
assert.ok(!ordersScript.includes('class="screening-history-col"'), '受篩產品歷史不可保留獨立欄位');
assert.ok(ordersScript.includes('op-action-btn op-role-view'), '歷史按鈕必須沿用系統標準表格操作按鈕尺寸與角色樣式');
assert.ok(ordersConfig.includes('data-orders-screening-history-modal'), '訂單模組必須提供受篩產品歷史 Modal');
assert.ok(screeningItemsConfig.includes("size: 'medium'"), '編輯受篩產品 Modal 必須以 medium 為正式尺寸來源');
assert.ok(ordersConfig.includes('modal-window medium screening-history-modal'), '受篩產品歷史 Modal 必須與編輯受篩產品 Modal 同為 medium 尺寸');
assert.ok(/modal:\s*\{[\s\S]*?title:\s*'新增訂單',[\s\S]*?size:\s*'medium'/.test(ordersConfig), '新增／修改訂單 Modal 必須與編輯受篩產品 Modal 同為 medium 尺寸');
assert.ok(ordersConfig.includes('data-orders-screening-history-search'), '歷史 Modal 最上方必須提供搜尋欄位');
assert.ok(ordersConfig.includes('inline-label ui-compact-form-row'), '歷史 Modal 搜尋欄必須沿用系統標準輸入元件');
assert.ok(ordersConfig.includes('<th>訂單日期</th><th>受篩產品</th>'), '歷史 Modal 僅呈現訂單日期與受篩產品');
assert.ok(ordersScript.includes("screeningHistoryRows.replaceChildren()"), '歷史資料必須以 DOM API 安全渲染');
assert.ok(ordersScript.includes("dataset.action = 'select-screening-history'"), '歷史受篩產品必須可點選');
assert.ok(ordersScript.includes('openCreateOrderItemEditor(orderId, { screening_item: selected.screening_item })'), '點選歷史受篩產品必須帶入新的訂單細項');
assert.ok(orderItemsScript.includes('async openCreate(context, initialData = null)'), '完整訂單細項編輯器必須接受安全的新增預填資料');
assert.ok(orderItemsScript.includes("openModal('create', initialData)"), '歷史產品必須透過完整新增 Modal 預填');
assert.ok(screeningHistoryApi.includes('findCustomerScreeningItemHistory(db(), $orderId)'), '歷史 API 必須使用正式同客戶查詢 helper');
assert.ok(ordersHelpers.includes('o.customer_id = :customer_id'), '歷史查詢必須限制為目前訂單所屬客戶');
assert.ok(ordersHelpers.includes('o.id <> :order_id'), '歷史查詢必須排除目前訂單');

const configColumnsSection = orderItemsConfig.split('columns: [')[1].split('],')[0];
const customerBatchColumns = Array.from(configColumnsSection.matchAll(/key:\s*'([^']+)'/g), (match) => match[1])
    .filter((column) => column !== 'actions');
const customerBatchSortableColumns = Array.from(
    configColumnsSection.matchAll(/\{\s*key:\s*'([^']+)'[^\n]*sortable:\s*true/g),
    (match) => match[1],
);
const inlineSelectorStart = ordersScript.indexOf('data-order-items-order-context-column-selector');
const inlineSelectorEnd = ordersScript.indexOf('<div class="column-selector-footer">', inlineSelectorStart);
const inlineSelectorHtml = ordersScript.slice(inlineSelectorStart, inlineSelectorEnd);
const inlineColumns = Array.from(inlineSelectorHtml.matchAll(/data-column="([^"]+)"/g), (match) => match[1]);
assert.deepStrictEqual(
    inlineColumns,
    customerBatchColumns,
    '訂單內嵌明細的欄位、順序必須與客戶批號全域頁面一致',
);
customerBatchColumns.forEach((column) => {
    assert.ok(ordersScript.includes(`data-column="${column}"`), `內嵌訂單細項欄位設定缺少：${column}`);
});
customerBatchSortableColumns.forEach((column) => {
    assert.ok(ordersScript.includes(`sortableHeader('${column}'`), `內嵌訂單細項排序契約缺少：${column}`);
});
['inventory_item_count', 'shipping_order_item_count', 'return_order_item_count'].forEach((field) => {
    assert.ok(orderItemsHelpers.includes(`AS ${field}`), `訂單範圍客戶批號查詢缺少正確關聯統計：${field}`);
});
assert.ok(inlineSelectionScript.includes('toggleSort'), '內嵌訂單細項必須提供排序切換');
assert.ok(inlineSelectionScript.includes("localeCompare(String(rightValue), 'zh-Hant'"), '文字排序必須支援繁體中文與數字自然順序');

const selectionContext = { window: {} };
vm.runInNewContext(inlineSelectionScript, selectionContext);
const inlineController = selectionContext.window.OrdersOrderItemSelection.create();
const sortableItems = [
    { id: 1, customer_batch_number: 'B10', total_units: 20 },
    { id: 2, customer_batch_number: 'B2', total_units: 5 },
    { id: 3, customer_batch_number: 'B1', total_units: 12 },
];
inlineController.toggleSort(99, 'customer_batch_number');
assert.deepStrictEqual(
    Array.from(inlineController.sortItems(99, sortableItems), (item) => item.id),
    [3, 2, 1],
    '客戶批號應以繁體中文的數字自然順序排列',
);
inlineController.toggleSort(99, 'total_units');
inlineController.toggleSort(99, 'total_units');
assert.deepStrictEqual(
    Array.from(inlineController.sortItems(99, sortableItems), (item) => item.id),
    [1, 3, 2],
    '數值欄位應支援降冪排序',
);
assert.ok(inlineSelectionScript.includes("fetch('api/order_items/copy.php'"), '勾選複製必須呼叫正式複製 API');
assert.ok(inlineSelectionScript.includes('selectedByOrder.set(orderId, orderItemId)'), '訂單細項勾選必須維持每張訂單單選');
assert.ok(moduleAssetsScript.includes("orders: ['js/orders/order-item-selection.js']"), '訂單模組必須先載入明細勾選控制器');
assert.ok(ordersScript.includes('editor.openEdit(getOrderContext(orderId), orderItemId)'), '操作欄編輯必須開啟完整客戶批號 Modal');

[
    'reserveNextOrderItemIdentity',
    'INSERT INTO order_item_tools',
    'INSERT INTO order_item_screening_details',
    'INSERT INTO order_item_drawings',
    'INSERT INTO order_item_attachments',
    "logAuditAction('複製訂單品項'",
].forEach((contract) => {
    assert.ok(copyApi.includes(contract), `訂單細項複製 API 缺少契約：${contract}`);
});

const identityStart = modalHtml.indexOf('order-items-identity-section');
const editorTabsStart = modalHtml.indexOf('order-items-editor-tabs', identityStart);
const identityHtml = modalHtml.slice(identityStart, editorTabsStart);
[
    'name="screening_item_id"',
    'name="sub_item_number"',
    'name="part_number"',
    'name="customer_batch_number"',
].forEach((contract) => {
    assert.ok(identityHtml.includes(contract), `頁籤外固定品項識別區缺少：${contract}`);
});
assert.ok(
    modalHtml.includes('work-order-production-mode-tabs work-order-screening-stage-tabs order-items-editor-tabs'),
    '客戶批號頁籤必須完整沿用生產工單的綠色篩分階段頁籤元件',
);
assert.strictEqual(
    (modalHtml.match(/class="btn outline small tab-btn(?: active)?"/g) || []).length,
    3,
    '三個客戶批號頁籤都必須沿用系統標準 outline small 按鈕 class',
);
assert.ok(
    /\.work-order-screening-stage-tabs \.tab-btn\.active\s*\{[\s\S]*?background:\s*var\(--color-primary\);/.test(styles),
    '客戶批號頁籤的 active 狀態必須引用既有系統綠色樣式',
);
assert.ok(
    !styles.includes('.order-items-modal .order-items-editor-tabs'),
    '客戶批號不可建立任何專屬頁籤視覺規則',
);
assert.deepStrictEqual(
    Array.from(modalHtml.matchAll(/data-order-items-tab="([^"]+)"[^>]*>([^<]+)<\/button>/g), (match) => [match[1], match[2]]),
    [['weight', '秤重與數量'], ['production', '生產與服務'], ['delivery', '交付與附件']],
    '客戶批號編輯器必須提供確認後的三個頁籤與順序',
);

const weightPanelHtml = modalHtml.slice(
    modalHtml.indexOf('id="order-items-panel-weight"'),
    modalHtml.indexOf('id="order-items-panel-production"'),
);
['name="total_weight_kg"', 'name="weight_per_unit_g_display"', 'data-tools-rows', 'data-tool-total-weight-display'].forEach((contract) => {
    assert.ok(weightPanelHtml.includes(contract), `秤重與數量頁籤必須維持重量、支數與載具計算鏈：${contract}`);
});
const productionPanelHtml = modalHtml.slice(
    modalHtml.indexOf('id="order-items-panel-production"'),
    modalHtml.indexOf('id="order-items-panel-delivery"'),
);
['name="status"', 'name="customer_sample_status"', 'name="unit_price_per_thousand"', 'data-services-rows'].forEach((contract) => {
    assert.ok(productionPanelHtml.includes(contract), `生產與服務頁籤缺少：${contract}`);
});
assert.ok(
    productionPanelHtml.includes('<div class="order-items-production-row">'),
    '生產三區不可掛用會強制二欄的共用 form-row',
);
['order-items-production-status-section', 'order-items-pricing-section', 'order-items-services-section'].forEach((contract) => {
    assert.ok(productionPanelHtml.includes(contract), `生產與服務 3:3:6 配置缺少：${contract}`);
});
const deliveryPanelHtml = modalHtml.slice(modalHtml.indexOf('id="order-items-panel-delivery"'));
['name="delivery_location"', 'name="notes"', 'data-drawings-rows', 'data-attachments-rows'].forEach((contract) => {
    assert.ok(deliveryPanelHtml.includes(contract), `交付與附件頁籤缺少：${contract}`);
});

assert.deepStrictEqual(
    Array.from(modalHtml.matchAll(/data-metric="([^"]+)"/g), (match) => match[1]),
    ['total-weight', 'tool-weight', 'net-weight', 'unit-weight', 'total-units', 'unit-price', 'total-price'],
    '固定計算摘要必須只保留指定七項，且不可顯示單價合計（參考）',
);
assert.ok(!modalHtml.includes('單價合計 (參考)'), '客戶批號 Modal 不可顯示單價合計（參考）');
assert.ok(orderItemsScript.includes('function switchEditorTab'), '客戶批號頁籤必須具備正式切換控制器');
assert.ok(orderItemsScript.includes('revealFieldTab(firstInvalidField)'), '伺服器驗證錯誤必須自動切換至錯誤頁籤');
assert.ok(orderItemsScript.includes("switchEditorTab('production')"), '缺少篩分服務時必須切換生產與服務頁籤');
assert.ok(orderItemsScript.includes('function createModalFormSnapshot'), '客戶批號 Modal 必須建立未儲存變更基線');
assert.ok(orderItemsScript.includes('window.AppFeedback.confirm'), '放棄未儲存變更必須沿用系統確認視窗');
assert.ok(orderItemsScript.includes("cancelLabel: '繼續編輯'"), '未儲存確認必須提供繼續編輯選項');
assert.ok(orderItemsScript.includes("confirmLabel: '放棄變更'"), '未儲存確認必須提供放棄變更選項');
assert.ok(orderItemsScript.includes('event.target === modalOverlay'), '點擊 Modal 遮罩必須進入安全關閉流程');
assert.ok(orderItemsScript.includes('await closeModal(true)'), '儲存成功後必須略過未儲存提示並安全關閉');
assert.ok(styles.includes('.order-items-modal .order-items-editor-panel.active'), '客戶批號頁籤面板必須具備顯示契約');
assert.ok(
    /\.modal-window\.order-items-modal form \.order-items-identity-grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(360px, 5fr\) minmax\(0, 2fr\) minmax\(0, 2fr\) minmax\(220px, 3fr\);/.test(styles),
    '品項識別桌面版必須使用 5:2:2:3 欄寬比例，且不可被共用 Modal 單欄規則覆蓋',
);
assert.ok(
    /\.modal-window\.order-items-modal form \.screening-create-body\s*\{[\s\S]*?grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\);/.test(styles),
    '新增受篩產品桌面版必須使用四欄兩列配置',
);
assert.ok(
    modalHtml.includes('<label class="inline-label"><span>備註</span><textarea rows="2" data-field="new-screening-item-notes"'),
    '新增受篩產品備註必須使用一般欄位，讓桌面版維持四欄兩列',
);
assert.ok(modalHtml.includes('form-grid order-items-weight-grid'), '重量與數量欄位必須使用專屬單欄配置');
assert.ok(modalHtml.includes('form-grid order-items-tracking-grid'), '重量追蹤欄位必須使用專屬單欄配置');
assert.ok(
    modalHtml.includes('<div class="order-items-weight-row">'),
    '秤重三區不可掛用會強制二欄的共用 form-row',
);
assert.ok(
    /\.order-items-modal \.order-items-weight-row\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 3fr\) minmax\(0, 3fr\) minmax\(0, 6fr\);/.test(styles),
    '重量與數量、重量追蹤、載具設定必須直接使用 3:3:6 固定比例軌道',
);
assert.ok(
    /\.order-items-modal \.order-items-production-row\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 2fr\) minmax\(0, 2fr\) minmax\(0, 8fr\);/.test(styles),
    '生產狀態、計價資料、篩分服務必須直接使用 2:2:8 固定比例軌道',
);
assert.ok(orderItemsScript.includes("tolerancePlusOverInput.type = 'hidden'"), '公差（+）Over 欄位必須暫時隱藏');
assert.ok(orderItemsScript.includes("toleranceMinusOverInput.type = 'hidden'"), '公差（−）Over 欄位必須暫時隱藏');
assert.ok(orderItemsScript.includes("getValue('[data-field=\"tolerance-plus-over\"]')"), '隱藏公差（+）Over 後仍須保留資料送出契約');
assert.ok(orderItemsScript.includes("getValue('[data-field=\"tolerance-minus-over\"]')"), '隱藏公差（−）Over 後仍須保留資料送出契約');
assert.ok(
    /@media \(max-width: 1200px\)\s*\{[\s\S]*?\.modal-window\.order-items-modal form \.order-items-identity-grid,[\s\S]*?\.modal-window\.order-items-modal form \.screening-create-body\s*\{\s*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/.test(styles),
    '客戶批號 Modal 在 1200px 以下必須降為雙欄配置',
);
assert.ok(
    /@media \(max-width: 900px\)\s*\{[\s\S]*?\.modal-window\.order-items-modal form \.order-items-weight-grid,[\s\S]*?\.modal-window\.order-items-modal form \.order-items-tracking-grid,[\s\S]*?grid-template-columns:\s*1fr;/.test(styles),
    '客戶批號 Modal 在 900px 以下必須降為單欄配置',
);

console.log('order-item-editor-parity.test.js passed');
