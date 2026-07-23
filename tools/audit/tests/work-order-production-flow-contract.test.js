'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

const migration = read('migrations/2026_07_23_add_work_order_production_flow.sql');
const flowHelpers = read('api/work_orders/flow_helpers.php');
const machineResults = read('api/work_orders/machine_results.php');
const stageTransfers = read('api/work_orders/stage_transfers.php');
const cardRecords = read('api/work_orders/card_records.php');
const workOrderIndex = read('api/work_orders/index.php');
const workOrderShow = read('api/work_orders/show.php');
const workOrderUpdate = read('api/work_orders/update.php');
const workOrderExport = read('api/work_orders/export.php');
const flowScript = read('js/work-orders/production-flow.js');
const workOrdersHtml = read('modules/work_orders.html');
const styles = read('styles.css');
const inventoryIndex = read('api/inventory_items/index.php');
const inventoryShow = read('api/inventory_items/show.php');
const shippingAddItem = read('api/shipping_orders/add_item.php');
const shippingUpdate = read('api/shipping_orders/update.php');
const shippingShow = read('api/shipping_orders/show.php');
const shippingScript = read('js/shipping_orders.js');
const reportApi = read('api/reports/screening_inspection.php');
const reportPrint = read('print/screening_inspection_print.html');
const dataSync = read('js/data-sync.js');

[
    'work_order_stages',
    'work_order_stage_services',
    'work_order_machine_results',
    'work_order_stage_transfers',
    'work_order_machine_result_images',
    'work_order_machine_input_tools',
    'work_order_machine_output_tools',
    'work_order_machine_result_packages',
    'inventory_packages',
    'shipping_order_item_packages',
    'stock_category_snapshot',
].forEach((contract) => {
    assert.ok(migration.includes(contract), `製程 migration 缺少：${contract}`);
});
assert.ok(!/\bDELIMITER\b|\bCREATE\s+PROCEDURE\b|\bCALL\s+`?mes_add_/i.test(migration), '製程 migration 不可依賴 PDO 更新器無法執行的 stored procedure');
assert.ok(migration.includes("'DO 0'"), '製程 migration 的條件式 no-op 必須使用 DO 0');

assert.ok(flowHelpers.includes('function ensureWorkOrderFlowInitialized'), '缺少共用工單流程初始化');
assert.ok(flowHelpers.includes('function fetchWorkOrderFlow'), '缺少正式製程聚合查詢');
assert.ok(flowHelpers.includes('function syncWorkOrderMachineRunsStable'), '機台保存必須使用穩定 ID');
assert.ok(!flowHelpers.includes('DELETE FROM work_order_machine_runs'), '穩定機台保存不可刪除重建');

[workOrderIndex, workOrderShow, workOrderUpdate].forEach((source, index) => {
    assert.ok(
        source.includes('ensureWorkOrderFlowInitialized')
            || source.includes('fetchWorkOrderFlow')
            || source.includes('syncWorkOrderMachineRunsStable'),
        `工單路徑 ${index + 1} 尚未接入正式製程`
    );
});
assert.ok(workOrdersHtml.includes('data-work-order-production-flow'), '編輯工單缺少製程執行頁籤容器');
assert.ok(workOrdersHtml.includes('data-work-order-secondary-tab'), '二次篩分主頁籤必須依轉流動態顯示');
assert.ok(workOrdersHtml.includes('data-work-order-flow-inventory'), '編輯工單缺少庫存與結案彙整');
assert.ok(flowScript.includes('work-order-screening-stage-tabs'), '製程階段必須沿用既有頁籤 class');
assert.ok(flowScript.includes('split-machine-tabs'), '平行機台必須沿用既有機台頁籤 class');
assert.ok(flowScript.includes('op-action-btn'), '製程表格操作必須沿用 op-action-btn');
assert.ok(!flowScript.includes('<form'), '正式製程位於編輯工單表單內，不可建立巢狀 form');
assert.ok(
    flowScript.includes('form-grid form-grid-four-columns')
        && flowScript.includes('data-flow-action="save-machine-plan"'),
    '機台規劃必須使用系統四欄緊湊表單及明確儲存事件'
);
assert.ok(
    styles.includes('[data-work-order-production-flow] .work-order-flow-panel')
        && styles.includes('[data-work-order-production-flow] input'),
    '正式製程面板與欄位缺少系統直角樣式契約'
);
assert.ok(
    flowScript.includes('function initializeWorkOrderProductionFlow')
        && flowScript.includes('window.initializeWorkOrderProductionFlow'),
    '混合模式正式製程必須提供可在 Modal 注入後重入的初始化器'
);
assert.ok(
    read('js/work_orders.js').includes('window.initializeWorkOrderProductionFlow?.(moduleRoot)'),
    '工單主模組必須在混合模式 Modal 注入後啟動正式製程控制器'
);
assert.ok(flowScript.includes('function renderInventorySummary'), '正式製程必須提供庫存與結案彙整');
assert.ok(flowScript.includes("stage.stage_type === 'secondary'"), '正式製程必須區分一般流程與二次篩分');
assert.ok(
    workOrderIndex.includes('新增工單僅能建立工單與機台規劃'),
    '新增工單 API 必須拒絕首件、不良與卡號等實績資料'
);
assert.ok(
    workOrderUpdate.includes('$screeningDefectsProvided') && workOrderUpdate.includes('$machineRunsProvided'),
    '編輯工單必須區分欄位未提供與明確清空，避免誤刪正式製程資料'
);

assert.ok(machineResults.includes('PHP_ROUND_HALF_UP'), '不良支數必須由後端四捨五入');
assert.ok(machineResults.includes('machine_defect_units'), '必須保存機台原始不良 100');
assert.ok(machineResults.includes('settled_defect_units'), '必須保存實秤換算不良 99');
assert.ok(machineResults.includes("requirement_level'] === 'required'"), '圖片必填必須依快照守門');
assert.ok(machineResults.includes('有不良品時必須記錄包／袋資料'), '不良品完成必須有包／袋');
assert.ok(cardRecords.includes('已有實秤資料的卡號順序已鎖定'), '實秤卡號順序必須鎖定');
assert.ok(cardRecords.includes('已鎖定卡號缺少進料載具快照'), '已實秤載具快照不可被覆寫');

assert.ok(
    stageTransfers.includes("$secondaryMode === 'second_process' && $quality !== 'good'"),
    '第二道工序只能接一般篩分良品'
);
assert.ok(
    stageTransfers.includes("$secondaryMode === 'relaxed_standard' && $quality !== 'defect'"),
    '放寬標準只能接一般篩分不良品'
);
assert.ok(stageTransfers.includes('source_defect_history_record_id'), '放寬標準必須保存不良來源');
assert.ok(stageTransfers.includes('createTerminalFlowInventory'), '終點轉流必須建立庫存');
assert.ok(stageTransfers.includes('已轉入二次篩分，未建立中間庫存'), '中間轉流不得重複入庫');

assert.ok(inventoryIndex.includes('stock_category'), '庫存 API 必須顯示良品／不良品類別');
assert.ok(inventoryShow.includes('inventory_packages'), '不良品庫存明細必須可追溯包／袋');
assert.ok(shippingAddItem.includes('package_ids'), '不良品出貨必須送出實際包／袋');
assert.ok(shippingAddItem.includes('不良品出貨數量必須等於所選包／袋的實際支數'), '不良品不可拆袋估算');
assert.ok(shippingUpdate.includes('stock_category'), '變更出貨性質時必須重驗品項類別');
assert.ok(shippingUpdate.includes("package_row.package_status = 'shipped'"), '出貨必須扣除袋狀態');
assert.ok(shippingUpdate.includes("package_row.package_status = 'available'"), '撤銷出貨必須恢復袋狀態');
assert.ok(shippingShow.includes('package_content_weight_kg'), '出貨明細必須回傳實際袋裝重量');
assert.ok(shippingScript.includes('選擇實際出貨包／袋'), '出貨 UI 必須選擇實際包／袋');

assert.ok(reportApi.includes('production_flow'), '篩分報表 API 必須回傳正式製程追溯');
['原始不良(100)', '實秤入庫不良(99)', '單支重快照', '轉流'].forEach((label) => {
    assert.ok(reportPrint.includes(label), `篩分列印缺少：${label}`);
});
[
    '原始不良支數(100)',
    '入庫不良支數(99)',
    '圖片要求',
    '良品出料載具',
    '不良品包／袋',
    'work_order_stage_transfers',
].forEach((contract) => {
    assert.ok(workOrderExport.includes(contract), `工單 CSV 缺少正式製程欄位：${contract}`);
});
[
    "'work_order_stages'",
    "'work_order_machine_results'",
    "'work_order_stage_transfers'",
    "'work_order_machine_result_images'",
    "'inventory_packages'",
    "'shipping_order_item_packages'",
].forEach((eventName) => {
    assert.ok(dataSync.includes(eventName), `DataSync 缺少製程事件：${eventName}`);
});

console.log('work-order-production-flow-contract.test.js passed');
