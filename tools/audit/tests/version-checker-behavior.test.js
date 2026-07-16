'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '../../..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const start = source.indexOf('window.AppVersionChecker = (function () {');
const end = source.indexOf('\n})();', start);
assert(start >= 0 && end > start, '找不到 AppVersionChecker 原始碼');
const checkerSource = source.slice(start, end + '\n})();'.length);

class FakeElement {
    constructor(tagName, document) {
        this.tagName = String(tagName).toUpperCase();
        this.ownerDocument = document;
        this.children = [];
        this.dataset = {};
        this.listeners = {};
        this.parentNode = null;
        this.removed = false;
        this.id = '';
        this.className = '';
        this.textContent = '';
        this.type = '';
        const classes = new Set();
        this.classList = {
            add: (...names) => names.forEach(name => classes.add(name)),
            remove: (...names) => names.forEach(name => classes.delete(name)),
            contains: name => classes.has(name)
        };
    }

    setAttribute(name, value) {
        this[name] = String(value);
    }

    addEventListener(name, listener) {
        (this.listeners[name] ||= []).push(listener);
    }

    append(...children) {
        children.forEach(child => this.appendChild(child));
    }

    appendChild(child) {
        child.parentNode = this;
        child.removed = false;
        this.children.push(child);
        return child;
    }

    prepend(child) {
        child.parentNode = this;
        child.removed = false;
        this.children.unshift(child);
    }

    remove() {
        this.removed = true;
        if (this.parentNode) {
            this.parentNode.children = this.parentNode.children.filter(child => child !== this);
        }
        this.parentNode = null;
    }

    async click() {
        for (const listener of this.listeners.click || []) {
            await listener({ target: this });
        }
    }
}

class FakeDocument {
    constructor() {
        this.readyState = 'complete';
        this.hidden = false;
        this.elements = [];
        this.listeners = {};
        this.body = this.createElement('body');
    }

    createElement(tagName) {
        const element = new FakeElement(tagName, this);
        this.elements.push(element);
        return element;
    }

    getElementById(id) {
        return this.elements.find(element => !element.removed && element.id === id && element.parentNode) || null;
    }

    addEventListener(name, listener) {
        (this.listeners[name] ||= []).push(listener);
    }
}

class MemoryStorage {
    constructor() {
        this.values = new Map();
    }

    getItem(key) {
        return this.values.has(key) ? this.values.get(key) : null;
    }

    setItem(key, value) {
        this.values.set(key, String(value));
    }

    removeItem(key) {
        this.values.delete(key);
    }
}

function findByAction(document, action) {
    return document.elements.find(element => !element.removed && element.dataset.action === action && element.parentNode) || null;
}

async function createRuntime({ dirty = false, confirmResult = true, sessionValues = {} } = {}) {
    const document = new FakeDocument();
    const replacements = [];
    const deletedCaches = [];
    const sessionStorage = new MemoryStorage();
    Object.entries(sessionValues).forEach(([key, value]) => sessionStorage.setItem(key, value));
    const localStorage = new MemoryStorage();
    const windowListeners = {};

    class FakeBroadcastChannel {
        addEventListener() {}
        postMessage() {}
    }

    const window = {
        APP_ASSET_VERSION: 'v1',
        APP_BASE_PATH: '/mes/',
        AppUnsavedChanges: { hasAny: () => dirty, count: () => dirty ? 1 : 0 },
        AppFeedback: { confirm: async () => confirmResult, toast: () => {} },
        BroadcastChannel: FakeBroadcastChannel,
        URL,
        document,
        localStorage,
        sessionStorage,
        location: {
            href: 'http://localhost/mes/index.php',
            replace: url => replacements.push(url)
        },
        addEventListener(name, listener) {
            (windowListeners[name] ||= []).push(listener);
        },
        setInterval: () => 1,
        clearInterval: () => {},
        setTimeout: callback => callback(),
        confirm: () => confirmResult
    };
    const caches = {
        keys: async () => ['mes-runtime-v1', 'shared-third-party-cache'],
        delete: async name => {
            deletedCaches.push(name);
            return true;
        }
    };
    window.caches = caches;
    const context = vm.createContext({
        window,
        document,
        caches,
        BroadcastChannel: FakeBroadcastChannel,
        URL,
        Date,
        Math,
        Promise,
        fetch: async () => ({ ok: true, json: async () => ({ version: 'v2', required: false }) }),
        setInterval: window.setInterval,
        clearInterval: window.clearInterval
    });

    vm.runInContext(checkerSource, context, { filename: 'script.js' });
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));
    return { window, document, replacements, deletedCaches, sessionStorage };
}

(async () => {
    const normal = await createRuntime();
    assert(normal.document.getElementById('app-update-banner'), '偵測新版本後應顯示提示');
    assert.strictEqual(normal.replacements.length, 0, '偵測新版本時不可自動重載');

    await findByAction(normal.document, 'snooze-update').click();
    assert.strictEqual(normal.document.getElementById('app-update-banner'), null, '稍後提醒應隱藏提示');
    normal.window.AppVersionChecker.showUpdateBanner('v2');
    assert.strictEqual(normal.document.getElementById('app-update-banner'), null, '延後期間不可立即重複提示');

    const guarded = await createRuntime({ dirty: true, confirmResult: false });
    assert.strictEqual(await guarded.window.AppVersionChecker.reloadNow('v2'), false, '取消未儲存資料警告時應停止更新');
    assert.strictEqual(guarded.replacements.length, 0, '取消後不可重載');

    const accepted = await createRuntime({ dirty: true, confirmResult: true });
    assert.strictEqual(await accepted.window.AppVersionChecker.reloadNow('v2'), true, '確認放棄資料後應執行更新');
    assert.strictEqual(accepted.replacements.length, 1, '應只啟動一次重載');
    assert(accepted.replacements[0].includes('_asset_version=v2'), '重載 URL 應帶入目標資產版本');
    assert.deepStrictEqual(accepted.deletedCaches, ['mes-runtime-v1'], '只能清除本系統擁有的 CacheStorage');

    const retrying = await createRuntime({
        sessionValues: {
            mes_expected_asset_version: 'v2',
            'mes_asset_reload_attempts:v2': '0'
        }
    });
    assert.strictEqual(retrying.replacements.length, 1, '明確更新後載入舊版時只應自動補救一次');

    const exhausted = await createRuntime({
        sessionValues: {
            mes_expected_asset_version: 'v2',
            'mes_asset_reload_attempts:v2': '1'
        }
    });
    assert.strictEqual(exhausted.replacements.length, 0, '補救已用盡時不可形成重載循環');

    console.log('version-checker-behavior.test.js passed');
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
