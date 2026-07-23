'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const modalHtml = fs.readFileSync(path.join(ROOT, 'modules', 'work_orders.html'), 'utf8');
const workOrdersScript = fs.readFileSync(path.join(ROOT, 'js', 'work_orders.js'), 'utf8');
const styles = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');

const createStart = modalHtml.indexOf('data-work-orders-create-modal');
const editStart = modalHtml.indexOf('data-work-orders-edit-modal');
assert.ok(createStart >= 0 && editStart > createStart, '找不到新增／編輯生產工單 Modal');

const createHtml = modalHtml.slice(createStart, editStart);
const editHtml = modalHtml.slice(editStart);

function assertMainTabContract(scopeHtml, expectedTabs, modeLabel) {
    const tabListStart = scopeHtml.indexOf('work-order-main-tabs');
    const tabListEnd = scopeHtml.indexOf('</div>', tabListStart);
    const tabListHtml = scopeHtml.slice(tabListStart, tabListEnd);
    const actualTabs = Array.from(
        tabListHtml.matchAll(/data-work-order-main-tab="([^"]+)"/g),
        match => match[1],
    );

    assert.deepStrictEqual(actualTabs, expectedTabs, `${modeLabel}工單主頁籤的名稱或順序不正確`);
    assert.strictEqual(
        (tabListHtml.match(/class="btn outline small tab-btn[^"]*"/g) || []).length,
        expectedTabs.length,
        `${modeLabel}工單主頁籤必須沿用既有綠色頁籤按鈕 class`,
    );
    assert.strictEqual(
        (tabListHtml.match(/role="tab"/g) || []).length,
        expectedTabs.length,
        `${modeLabel}工單主頁籤必須提供 tab 無障礙語意`,
    );

    const sectionTags = Array.from(scopeHtml.matchAll(/<[^>]+data-work-order-main-tab-section="([^"]+)"[^>]*>/g));
    const sectionTabs = new Set(sectionTags.flatMap(match => match[1].split(/\s+/).filter(Boolean)));
    expectedTabs.forEach((tabName) => {
        assert.ok(sectionTabs.has(tabName), `${modeLabel}工單缺少 ${tabName} 頁籤內容`);
    });
    sectionTabs.forEach((tabName) => {
        assert.ok(expectedTabs.includes(tabName), `${modeLabel}工單出現未登錄頁籤內容：${tabName}`);
    });
    sectionTags.forEach((match) => {
        const tagHtml = match[0];
        const tabNames = match[1].split(/\s+/).filter(Boolean);
        if (tabNames.includes('settings')) {
            assert.ok(!/\shidden(?:\s|>)/.test(tagHtml), `${modeLabel}工單設定頁不應在初始狀態隱藏`);
        } else {
            assert.ok(/\shidden(?:\s|>)/.test(tagHtml), `${modeLabel}工單 ${tabNames.join('/')} 內容必須在初始狀態隱藏`);
        }
    });
}

assertMainTabContract(createHtml, ['settings', 'flow', 'notes'], '新增');
assertMainTabContract(editHtml, ['settings', 'flow', 'secondary', 'inventory', 'notes'], '編輯');

[
    'name="work_order_type"',
    'name="scheduled_start_date"',
    'name="machine_id"',
    'name="customer_instructions"',
    'name="other_notes"',
].forEach((contract) => {
    assert.ok(createHtml.includes(contract), `新增工單缺少既有欄位：${contract}`);
    assert.ok(editHtml.includes(contract), `編輯工單缺少對應欄位：${contract}`);
});
assert.ok(createHtml.includes('name="work_order_number"'), '新增工單設定頁缺少工單號碼欄位');
assert.ok(editHtml.includes('data-edit-summary-work-order'), '編輯工單固定摘要缺少工單號碼');

['total_weight_kg', 'weight_per_unit_g', 'total_units', 'tool_statistics'].forEach((fieldName) => {
    assert.ok(
        editHtml.includes(`name="${fieldName}" readonly class="readonly-field"`),
        `編輯工單設定頁缺少唯讀來源數據：${fieldName}`,
    );
});

assert.ok(
    /work-order-screening-tabs-section hidden" aria-hidden="true"/.test(createHtml),
    '新增工單不可顯示僅供儲存後追蹤的二次篩分切換',
);
assert.ok(
    /work-order-image-sections-grid hidden" aria-hidden="true"/.test(createHtml),
    '新增工單不可顯示僅供儲存後使用的圖片管理區',
);
assert.ok(
    /work-order-edit-production-records hidden"[^>]*aria-hidden="true"/.test(createHtml),
    '新增工單不可顯示僅供儲存後使用的生產履歷區',
);
assert.ok(
    /data-work-order-main-tab="secondary"[^>]*data-work-order-secondary-tab[^>]*aria-hidden="true"/.test(editHtml),
    '二次篩分主頁籤必須在建立轉流前隱藏',
);
assert.ok(
    editHtml.includes('data-work-order-main-tab-section="flow secondary"'),
    '生產與篩分及二次篩分必須共用正式階段／機台元件',
);
assert.ok(
    editHtml.includes('data-work-order-flow-inventory'),
    '編輯工單缺少庫存與結案彙整',
);
assert.ok(
    editHtml.includes('data-legacy-work-order-execution aria-hidden="true"'),
    '舊工單實績區必須封存，避免與正式機台製程雙軌寫入',
);

[
    'function switchWorkOrderMainTab',
    'function revealWorkOrderMainTabForField',
    'function bindWorkOrderMainTabs',
    "switchWorkOrderMainTab('settings', false)",
    "switchWorkOrderMainTab('settings', true)",
    "switchWorkOrderMainTab('flow', isEditMode)",
    "split(/\\s+/)",
    "work-order:main-tab-changed",
    'if (!form.checkValidity())',
    "['ArrowLeft', 'ArrowRight', 'Home', 'End']",
].forEach((contract) => {
    assert.ok(workOrdersScript.includes(contract), `工單主頁籤控制器缺少契約：${contract}`);
});

assert.ok(
    /\[data-work-order-main-tab-section\]\[hidden\],[\s\S]*?display:\s*none !important;/.test(styles),
    '主頁籤非作用中內容必須能蓋過既有 Modal form-row 強制顯示規則',
);
assert.ok(
    createHtml.includes('建立後按機台記錄'),
    '新增工單的篩分服務必須明確標示實績於建立後按機台記錄',
);
assert.ok(
    /class="form-row single-column hidden" aria-hidden="true"/.test(createHtml),
    '新增工單不可直接填寫首件實績',
);
assert.ok(
    /work-order-edit-order-support-row\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\);/.test(styles),
    '編輯工單分頁後的單一卡片必須填滿可用欄寬',
);
assert.ok(
    styles.includes('.work-order-screening-stage-tabs .tab-btn.active'),
    '主頁籤必須沿用既有綠色頁籤 active 樣式',
);
assert.ok(
    !styles.includes('.work-order-main-tabs .tab-btn.active'),
    '工單主頁籤不可建立另一套 active 視覺規則',
);

console.log('work-order-main-tabs.test.js passed');
