'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..', '..');

function read(relativePath) {
    return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

const preferenceScript = read('core/ui-preferences.js');
const moduleHtml = read('modules/basic_settings.html');
const moduleScript = read('js/basic_settings.js');
const moduleAssets = read('core/module-assets.js');
const indexPhp = read('index.php');
const styles = read('styles.css');
const migration = read('migrations/2026_07_19_add_basic_settings_permission.sql');
const schemaSync = read('tools/sync-local-schema.ps1');

const storedValues = new Map([['mes_ui_font_size', 'small']]);
const listeners = new Map();
const dispatchedEvents = [];
const documentElement = { dataset: {} };
const windowMock = {
    localStorage: {
        getItem(key) {
            return storedValues.has(key) ? storedValues.get(key) : null;
        },
        setItem(key, value) {
            storedValues.set(key, value);
        }
    },
    addEventListener(type, handler) {
        listeners.set(type, handler);
    },
    dispatchEvent(event) {
        dispatchedEvents.push(event);
    }
};

vm.runInNewContext(preferenceScript, {
    window: windowMock,
    document: { documentElement },
    CustomEvent: class CustomEvent {
        constructor(type, options) {
            this.type = type;
            this.detail = options?.detail;
        }
    },
    console
});

assert.strictEqual(documentElement.dataset.fontSize, 'small', '啟動時必須套用已儲存字體大小');
assert.strictEqual(Object.keys(windowMock.UiPreferences.fontSizeOptions).length, 5, '字體大小必須維持五段');
assert.strictEqual(windowMock.UiPreferences.setFontSize('large'), 'large', '必須能套用合法字體大小');
assert.strictEqual(storedValues.get('mes_ui_font_size'), 'large', '選擇後必須儲存到瀏覽器');
assert.strictEqual(documentElement.dataset.fontSize, 'large', '選擇後必須立即更新根節點');
assert.strictEqual(windowMock.UiPreferences.setFontSize('invalid'), 'standard', '非法設定必須回復標準值');
assert.strictEqual(dispatchedEvents.at(-1).detail.preference, 'font-size', '設定異動必須發送字體偏好事件');

listeners.get('storage')({ key: 'mes_ui_font_size', newValue: 'extra-large' });
assert.strictEqual(documentElement.dataset.fontSize, 'extra-large', '跨分頁儲存事件必須同步字體大小');

['extra-small', 'small', 'standard', 'large', 'extra-large'].forEach((value) => {
    assert.ok(moduleHtml.includes(`value="${value}"`), `基本設定頁缺少字體選項：${value}`);
    if (value !== 'standard') {
        assert.ok(styles.includes(`html[data-font-size="${value}"]`), `CSS 缺少字體 preset：${value}`);
    }
});

assert.ok(moduleHtml.includes('sidebar-tabs-layout'), '基本設定頁必須使用正式側欄 Tab 版面');
assert.ok(moduleHtml.includes('font-size-preview-table'), '基本設定頁必須提供字體大小範例表格');
assert.ok(moduleHtml.includes('ORDER-20260719-0001'), '範例表格必須包含可辨識的訂單內容');
assert.ok(moduleHtml.includes('data-table compact ui-compact-table'), '範例表格必須使用正式共用表格 class');
assert.ok(moduleScript.includes('initializeBasicSettingsModule'), '基本設定模組必須提供初始化器');
assert.ok(moduleAssets.includes("basic_settings: 'initializeBasicSettingsModule'"), '資產載入器必須註冊基本設定模組');
assert.ok(indexPhp.includes('data-page="basic_settings"'), '側邊欄必須提供基本設定入口');
assert.ok(
    indexPhp.indexOf('core/ui-preferences.js') < indexPhp.indexOf('styles.css'),
    '顯示偏好必須在主要 CSS 載入前套用，避免字體閃動'
);
assert.ok(migration.includes("'basic_settings.read'"), 'migration 必須建立 basic_settings.read 權限');
assert.ok(schemaSync.includes("'2026_07_19_add_basic_settings_permission.sql'"), 'schema sync 必須收錄基本設定權限 migration');

console.log('basic-settings-font-preference.test.js passed');
