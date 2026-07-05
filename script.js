// 自動檢測應用基礎路徑
(function() {
    const path = window.location.pathname;
    const basePath = path.substring(0, path.lastIndexOf('/') + 1);
    window.APP_BASE_PATH = basePath;
    window.APP_ASSET_VERSION = window.APP_ASSET_VERSION
        || document.documentElement.getAttribute('data-asset-version')
        || '';
})();

// ──────────────────────────────────────────────
// 系統版本自動更新偵測（可由安全設定動態控制）
// ──────────────────────────────────────────────
window.AppVersionChecker = (function () {
    'use strict';

    let _currentVersion = window.APP_ASSET_VERSION || null;
    let _bannerShown    = false;
    let _enabled        = true;
    let _intervalId     = null;
    let _lastCheckedAt  = 0;
    const AUTO_RELOAD_SESSION_KEY = 'mes_auto_reloaded_asset_version';

    function buildReloadUrl(targetVersion = '') {
        const url = new URL(window.location.href);
        url.searchParams.set('_reload', Date.now().toString());
        if (targetVersion) {
            url.searchParams.set('_asset_version', targetVersion);
        }
        return url.toString();
    }

    async function clearBrowserRuntimeCaches() {
        try {
            if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(name => caches.delete(name)));
            }
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                await Promise.all(registrations.map(registration => registration.unregister()));
            }
        } catch (_e) {
            // Runtime cache / Service Worker 不是必要條件，失敗時仍繼續重整。
        }
    }

    async function reloadNow(targetVersion = '') {
        await clearBrowserRuntimeCaches();
        window.location.replace(buildReloadUrl(targetVersion));
    }

    async function autoReloadForVersion(targetVersion) {
        const normalizedTarget = String(targetVersion || '').trim();
        if (!normalizedTarget) {
            showUpdateBanner();
            return;
        }

        try {
            const reloadedVersion = sessionStorage.getItem(AUTO_RELOAD_SESSION_KEY);
            if (reloadedVersion === normalizedTarget) {
                showUpdateBanner();
                return;
            }
            sessionStorage.setItem(AUTO_RELOAD_SESSION_KEY, normalizedTarget);
        } catch (_e) {
            // sessionStorage 失效時仍嘗試自動刷新一次。
        }

        await reloadNow(normalizedTarget);
    }

    function showUpdateBanner() {
        if (_bannerShown) { return; }
        _bannerShown = true;

        const banner = document.createElement('div');
        banner.id = 'app-update-banner';
        banner.style.cssText = [
            'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:99999',
            'background:#e74c3c', 'color:#fff', 'text-align:center',
            'padding:12px 20px', 'font-size:15px', 'font-weight:600',
            'display:flex', 'align-items:center', 'justify-content:center',
            'gap:16px', 'box-shadow:0 4px 12px rgba(0,0,0,0.3)',
        ].join(';');
        banner.innerHTML = `
            <span>⚠️ 系統已更新，請重新整理頁面以載入最新版本</span>
            <button onclick="window.AppVersionChecker.reloadNow()"
                style="background:#fff;color:#e74c3c;border:none;border-radius:4px;
                       padding:6px 18px;font-weight:700;cursor:pointer;font-size:14px;">
                立即重整
            </button>`;
        document.body.prepend(banner);
    }

    async function checkVersion(options = {}) {
        if (!_enabled) { return; }
        const now = Date.now();
        if (!options.force && _lastCheckedAt > 0 && now - _lastCheckedAt < 30000) {
            return;
        }
        _lastCheckedAt = now;

        try {
            const res = await fetch('api/version.php', { cache: 'no-store' });
            if (!res.ok) { return; }
            const data = await res.json();
            const ver  = data && data.version;
            if (!ver) { return; }
            if (_currentVersion === null) {
                _currentVersion = ver;
            } else if (ver !== _currentVersion) {
                await autoReloadForVersion(ver);
            }
        } catch (_e) {
            // 網路錯誤靜默忽略
        }
    }

    function startPolling(intervalMinutes) {
        if (_intervalId) { clearInterval(_intervalId); }
        const minutes = Math.max(1, Number.parseInt(intervalMinutes, 10) || 5);
        _intervalId = setInterval(checkVersion, minutes * 60 * 1000);
    }

    // 公開 API，供安全設定模組呼叫
    function configure(enabled, intervalMinutes) {
        _enabled = !!enabled;
        startPolling(intervalMinutes || 5);
    }

    // 初始啟動（使用預設值，待安全設定載入後再重設）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => checkVersion({ force: true }));
    } else {
        checkVersion({ force: true });
    }
    window.addEventListener('focus', () => checkVersion({ force: true }));
    window.addEventListener('pageshow', () => checkVersion({ force: true }));
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            checkVersion({ force: true });
        }
    });
    ['click', 'keydown', 'touchstart'].forEach(eventName => {
        document.addEventListener(eventName, checkVersion, { passive: true });
    });
    startPolling(5);

    return { configure, checkNow: () => checkVersion({ force: true }), reloadNow };
})();

// ──────────────────────────────────────────────
// 閒置自動登出管理器（可由安全設定動態控制）
// ──────────────────────────────────────────────
window.AppSecurityManager = (function () {
    'use strict';

    let _logoutFn       = null;
    let _idleMs         = 30 * 60 * 1000; // 預設 30 分鐘
    let _warningMs      = 60 * 1000;       // 預設 60 秒
    let _enabled        = true;
    let _lastActivity   = Date.now();
    let _intervalId     = null;
    let _warningShown   = false;
    let _warningEl      = null;
    let _countdownId    = null;

    const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click'];

    function resetActivity() {
        _lastActivity = Date.now();
        if (_warningShown) { dismissWarning(); }
    }

    function dismissWarning() {
        _warningShown = false;
        if (_countdownId) { clearInterval(_countdownId); _countdownId = null; }
        if (_warningEl && _warningEl.parentNode) {
            _warningEl.parentNode.removeChild(_warningEl);
            _warningEl = null;
        }
    }

    function showWarning(remainingSec) {
        if (_warningShown) { return; }
        _warningShown = true;

        _warningEl = document.createElement('div');
        _warningEl.id = 'idle-warning-overlay';
        _warningEl.style.cssText = [
            'position:fixed', 'inset:0', 'z-index:99998',
            'background:rgba(0,0,0,0.55)', 'display:flex',
            'align-items:center', 'justify-content:center',
        ].join(';');
        _warningEl.innerHTML = `
            <div style="background:#fff;border-radius:12px;padding:36px 40px;
                        max-width:380px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.25);">
                <i class="fas fa-user-clock" style="font-size:48px;color:#e67e22;margin-bottom:16px;display:block;"></i>
                <h3 style="margin:0 0 10px;font-size:18px;color:#333;">閒置即將登出</h3>
                <p style="margin:0 0 20px;color:#666;font-size:14px;">您已長時間無操作，將在</p>
                <div id="idle-countdown" style="font-size:48px;font-weight:700;color:#e74c3c;margin-bottom:20px;">
                    ${remainingSec}
                </div>
                <p style="margin:0 0 24px;color:#666;font-size:14px;">秒後自動登出</p>
                <button id="idle-continue-btn"
                    style="background:#3498db;color:#fff;border:none;border-radius:6px;
                           padding:10px 32px;font-size:15px;font-weight:600;cursor:pointer;">
                    繼續使用
                </button>
            </div>`;

        document.body.appendChild(_warningEl);

        document.getElementById('idle-continue-btn').addEventListener('click', () => {
            resetActivity();
        });

        let sec = remainingSec;
        _countdownId = setInterval(() => {
            sec--;
            const el = document.getElementById('idle-countdown');
            if (el) { el.textContent = sec; }
            if (sec <= 0) {
                clearInterval(_countdownId);
                _countdownId = null;
                if (_logoutFn) { _logoutFn('idle_timeout'); }
            }
        }, 1000);
    }

    function tick() {
        if (!_enabled || !_logoutFn) { return; }
        const idle     = Date.now() - _lastActivity;
        const warnAt   = Math.max(0, _idleMs - _warningMs);

        if (idle >= _idleMs) {
            // 時間到，直接登出（不應到這裡，倒數結束已登出）
            if (_logoutFn) { _logoutFn('idle_timeout'); }
        } else if (warnAt > 0 && idle >= warnAt && !_warningShown) {
            const remaining = Math.ceil((_idleMs - idle) / 1000);
            showWarning(remaining);
        }
    }

    function startTimer() {
        if (_intervalId) { clearInterval(_intervalId); }
        _intervalId = setInterval(tick, 5000); // 每 5 秒檢查一次
    }

    function stopTimer() {
        if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
        dismissWarning();
    }

    // 公開 API
    function init(logoutFn) {
        _logoutFn = logoutFn;
        ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, resetActivity, { passive: true }));
        if (_enabled) { startTimer(); }
    }

    function configure(enabled, idleMinutes, warningSeconds) {
        _enabled  = !!enabled;
        _idleMs   = (idleMinutes  || 30) * 60 * 1000;
        _warningMs = (warningSeconds || 60) * 1000;
        if (_enabled) {
            startTimer();
        } else {
            stopTimer();
        }
    }

    async function reload() {
        try {
            const res = await fetch('api/security_settings/', { credentials: 'include' });
            if (!res.ok) { return; }
            const data = await res.json();
            if (!data.success) { return; }
            const s = data.data;
            // 重新套用版本偵測設定
            window.AppVersionChecker.configure(
                s['security.auto_refresh.enabled'].value === '1',
                parseInt(s['security.auto_refresh.interval_minutes'].value, 10) || 5
            );
            // 重新套用閒置登出設定
            configure(
                s['security.auto_logout.enabled'].value === '1',
                parseInt(s['security.auto_logout.idle_minutes'].value, 10) || 30,
                parseInt(s['security.auto_logout.warning_seconds'].value, 10) || 60
            );
        } catch (e) {
            console.warn('[SecurityManager] reload 失敗：', e);
        }
    }

    return { init, configure, reload };
})();

// ──────────────────────────────────────────────
// 全域 Fetch 攔截器 - 自動附加 CSRF Token
// ──────────────────────────────────────────────
(function() {
    const originalFetch = window.fetch;
    const WRITE_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];
    let authRedirecting = false;

    function resolveRequestUrl(input) {
        if (typeof input === 'string') {
            return input;
        }
        if (input && typeof input.url === 'string') {
            return input.url;
        }
        return '';
    }

    function shouldSkipUnauthorizedRedirect(requestUrl) {
        if (!requestUrl) {
            return false;
        }

        const skipPaths = [
            'api/login.php',
            'api/logout.php',
        ];

        return skipPaths.some(path => requestUrl.includes(path));
    }

    function redirectToLoginWithReason(reason) {
        if (authRedirecting) {
            return;
        }
        authRedirecting = true;

        try {
            localStorage.removeItem('screwsystem_open_tabs');
            localStorage.removeItem('screwsystem_active_tab');
            localStorage.removeItem('screwsystem_sidebar_collapsed');
        } catch (_err) {
            // 靜默忽略 localStorage 清理失敗
        }

        const target = reason
            ? `login.html?reason=${encodeURIComponent(reason)}`
            : 'login.html';
        window.location.href = target;
    }

    window.fetch = function(input, init) {
        init = init || {};
        const method = (init.method || 'GET').toUpperCase();
        const requestUrl = resolveRequestUrl(input);

        // 僅對寫入方法附加 CSRF Token
        if (WRITE_METHODS.includes(method)) {
            const token = sessionStorage.getItem('csrf_token');
            if (token) {
                // 如果 init.headers 是 Headers 物件或純物件，都要處理
                if (init.headers instanceof Headers) {
                    if (!init.headers.has('X-CSRF-Token')) {
                        init.headers.set('X-CSRF-Token', token);
                    }
                } else {
                    init.headers = Object.assign({}, init.headers || {}, {
                        'X-CSRF-Token': init.headers && init.headers['X-CSRF-Token'] ? init.headers['X-CSRF-Token'] : token
                    });
                }
            }
        }

        return originalFetch.call(this, input, init).then((response) => {
            if (response.status === 401 && !shouldSkipUnauthorizedRedirect(requestUrl)) {
                redirectToLoginWithReason('session_expired');
            }
            return response;
        });
    };
})();

document.addEventListener('DOMContentLoaded', async () => {
    const sidebarElement = document.querySelector('.sidebar');
    ensureMachineCapabilitiesMenuItem(sidebarElement);
    const sidebarMenuLinks = document.querySelectorAll('.sidebar .menu-link');
    const sidebarSubmenuLinks = document.querySelectorAll('.sidebar .submenu a');
    const appContainer = document.querySelector('.app-container');
    const sidebarToggleButton = document.querySelector('[data-action="toggle-sidebar"]');
    const tabHeadersContainer = document.getElementById('tab-headers');
    const tabContentArea = document.getElementById('tab-content-area');
    const logoutButton = document.getElementById('logout-button');
    const currentUserNameElement = document.getElementById('current-user-name');

    const moduleInitializers = {};
    const moduleContexts = new Map();
    const unsavedChangesState = new Map();

    // Storage keys for persistence
    const STORAGE_KEYS = {
        OPEN_TABS: 'screwsystem_open_tabs',
        ACTIVE_TAB: 'screwsystem_active_tab',
        SIDEBAR_COLLAPSED: 'screwsystem_sidebar_collapsed'
    };
    const OPERATION_ACTION_CELL_SELECTOR = 'td.table-actions, td.actions, td.actions-cell, td.actions-col';
    const OPERATION_ACTION_SELECTOR = 'button[data-action], a[data-action]';
    const OPERATION_ACTION_ROLE_CLASSES = [
        'op-role-view',
        'op-role-edit',
        'op-role-delete',
        'op-role-blocked',
        'op-role-print',
        'op-role-screening-report',
        'op-role-expand',
        'op-role-order-items',
        'op-role-order',
        'op-role-work-order',
        'op-role-shipping',
        'op-role-return',
        'op-role-rescreen',
        'op-role-customer',
        'op-role-add',
        'op-role-copy',
        'op-role-state',
        'op-role-reply',
        'op-role-mark-read',
        'op-role-workflow',
        'op-role-navigate',
        'op-role-neutral',
    ];
    const OPERATION_ACTION_ROLE_MAP = Object.freeze({
        view: 'view',
        'view-detail': 'view',
        'view-details': 'view',
        detail: 'view',
        details: 'expand',
        show: 'view',
        preview: 'view',
        'preview-logo': 'view',
        'view-work-order': 'view',
        'view-shipping-order': 'view',
        'view-return-orders': 'view',
        'open-attachment': 'view',
        'open-invoice-stamp': 'view',
        'open-order-items': 'order-items',
        'open-order': 'order',
        'open-work-order': 'work-order',
        'open-shipping-order': 'shipping',
        'open-return-orders': 'return',
        'create-second-screening': 'rescreen',
        'open-second-screening': 'rescreen',
        'open-customer': 'customer',
        edit: 'edit',
        'edit-draft': 'edit',
        'edit-from-detail': 'edit',
        'edit-order-item': 'edit',
        'edit-order-item-inline': 'edit',
        'edit-screening-item': 'edit',
        'edit-work-order': 'edit',
        delete: 'delete',
        'delete-order-item': 'delete',
        'delete-order-item-inline': 'delete',
        'delete-screening-item': 'delete',
        'delete-work-order': 'delete',
        'delete-selected': 'delete',
        'delete-image': 'delete',
        'delete-logo': 'delete',
        'clear-attachment': 'delete',
        'clear-invoice-stamp': 'delete',
        'delete-blocked': 'blocked',
        'delete-item': 'delete',
        print: 'print',
        'print-detail': 'print',
        'print-single': 'print',
        'print-work-order': 'print',
        'print-screening-report': 'screening-report',
        'add-item': 'add',
        'copy-order-item': 'copy',
        'toggle-active': 'state',
        'set-active-logo': 'state',
        'create-work-order': 'workflow',
        'convert-to-inventory': 'workflow',
        'remove-from-machine-schedule': 'workflow',
        'quick-return': 'workflow',
        'add-to-shipping': 'shipping',
        'goto-work-order': 'navigate',
        'go-work-order': 'navigate',
        'goto-shipping-order': 'navigate',
        reply: 'reply',
        'mark-read': 'mark-read',
    });
    const OPERATION_ACTION_ICON_MAP = Object.freeze({
        view: 'fa-eye',
        'view-detail': 'fa-eye',
        'view-details': 'fa-eye',
        detail: 'fa-eye',
        show: 'fa-eye',
        preview: 'fa-eye',
        'preview-logo': 'fa-eye',
        'view-work-order': 'fa-eye',
        'view-shipping-order': 'fa-eye',
        'view-return-orders': 'fa-eye',
        'open-attachment': 'fa-external-link-alt',
        'open-invoice-stamp': 'fa-external-link-alt',
        'open-order-items': 'fa-list-ul',
        'open-order': 'fa-file-invoice',
        'open-work-order': 'fa-clipboard',
        'open-shipping-order': 'fa-shipping-fast',
        'open-return-orders': 'fa-undo',
        'create-second-screening': 'fa-redo',
        'open-second-screening': 'fa-redo',
        'open-customer': 'fa-handshake',
        edit: 'fa-edit',
        'edit-draft': 'fa-edit',
        'edit-from-detail': 'fa-edit',
        'edit-order-item': 'fa-edit',
        'edit-order-item-inline': 'fa-edit',
        'edit-screening-item': 'fa-edit',
        'edit-work-order': 'fa-edit',
        delete: 'fa-trash',
        'delete-order-item': 'fa-trash',
        'delete-order-item-inline': 'fa-trash',
        'delete-screening-item': 'fa-trash',
        'delete-work-order': 'fa-trash',
        'delete-selected': 'fa-trash',
        'delete-image': 'fa-trash',
        'delete-logo': 'fa-trash',
        'clear-attachment': 'fa-trash',
        'clear-invoice-stamp': 'fa-trash',
        'delete-blocked': 'fa-trash',
        'delete-item': 'fa-trash',
        print: 'fa-print',
        'print-detail': 'fa-print',
        'print-single': 'fa-print',
        'print-work-order': 'fa-print',
        'print-screening-report': 'fa-file-medical-alt',
        'add-item': 'fa-plus',
        'copy-order-item': 'fa-copy',
        'create-work-order': 'fa-industry',
        'convert-to-inventory': 'fa-cogs',
        'remove-from-machine-schedule': 'fa-undo',
        'quick-return': 'fa-undo',
        'add-to-shipping': 'fa-truck',
        'goto-work-order': 'fa-external-link-alt',
        'go-work-order': 'fa-external-link-alt',
        'goto-shipping-order': 'fa-external-link-alt',
        reply: 'fa-reply',
        'mark-read': 'fa-check',
    });
    const OPERATION_ACTION_LABEL_MAP = Object.freeze({
        view: '檢視',
        'view-detail': '檢視',
        'view-details': '檢視',
        detail: '檢視',
        show: '檢視',
        preview: '檢視',
        'preview-logo': '檢視',
        'view-work-order': '檢視',
        'view-shipping-order': '檢視出貨單',
        'view-return-orders': '檢視退貨單',
        'open-attachment': '開啟附件',
        'open-invoice-stamp': '開啟附件',
        'open-order-items': '客戶批號',
        'open-order': '開啟訂單',
        'open-work-order': '開啟工單',
        'open-shipping-order': '開啟出貨單',
        'open-return-orders': '開啟退貨單',
        'create-second-screening': '建立二次篩選',
        'open-second-screening': '檢視二次篩選',
        'open-customer': '開啟客戶',
        edit: '編輯',
        'edit-draft': '編輯',
        'edit-from-detail': '編輯',
        'edit-order-item': '編輯',
        'edit-order-item-inline': '編輯',
        'edit-screening-item': '編輯',
        'edit-work-order': '編輯',
        delete: '刪除',
        'delete-order-item': '刪除',
        'delete-order-item-inline': '刪除',
        'delete-screening-item': '刪除',
        'delete-work-order': '刪除',
        'delete-selected': '刪除',
        'delete-image': '刪除',
        'delete-logo': '刪除',
        'clear-attachment': '移除附件',
        'clear-invoice-stamp': '移除附件',
        'delete-blocked': '無法刪除',
        'delete-item': '刪除',
        print: '列印',
        'print-detail': '列印',
        'print-single': '列印',
        'print-work-order': '列印工單',
        'print-screening-report': '列印品質檢驗報表',
        'add-item': '新增項目',
        'copy-order-item': '複製',
        'remove-from-machine-schedule': '移回待排程',
        'quick-return': '快速退貨',
        'goto-shipping-order': '前往出貨單',
        reply: '回覆',
        'mark-read': '標記已讀',
    });
    const pendingActionNormalizationScopes = new Set();
    let isActionNormalizationScheduled = false;

    function ensureMachineCapabilitiesMenuItem(sidebar) {
        if (!(sidebar instanceof Element)) {
            return;
        }

        if (sidebar.querySelector('[data-page="machine_capabilities"]')) {
            return;
        }

        const equipmentMenu = sidebar.querySelector('[data-menu-id="equipment_management"]')?.closest('.menu-item');
        const submenu = equipmentMenu ? equipmentMenu.querySelector('.submenu') : null;
        if (!submenu) {
            return;
        }

        const menuItem = document.createElement('li');
        menuItem.innerHTML = '<a href="#" data-page="machine_capabilities" data-title="機台能力管理"><i class="fas fa-layer-group"></i> 機台能力管理</a>';

        const machinesItem = submenu.querySelector('[data-page="machines"]')?.closest('li');
        if (machinesItem && machinesItem.nextSibling) {
            submenu.insertBefore(menuItem, machinesItem.nextSibling);
        } else if (machinesItem) {
            submenu.appendChild(menuItem);
        } else {
            submenu.prepend(menuItem);
        }
    }

    function getTabContentElementById(tabId) {
        return document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);
    }

    function stableSerialize(value) {
        if (Array.isArray(value)) {
            return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
        }

        if (value && typeof value === 'object') {
            const keys = Object.keys(value).sort();
            return `{${keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(',')}}`;
        }

        return JSON.stringify(value);
    }

    function collectFormSnapshot(root) {
        if (!(root instanceof Element)) {
            return '[]';
        }

        const fields = Array.from(root.querySelectorAll('input, select, textarea')).filter((field) => {
            return shouldTrackUnsavedField(field);
        }).map((field) => {
            const tagName = field.tagName.toLowerCase();
            const type = field.type || '';
            const key = field.name || field.id || field.dataset.field || '';
            let value = '';

            if (type === 'checkbox' || type === 'radio') {
                value = field.checked ? '1' : '0';
            } else if (type === 'file') {
                value = Array.from(field.files || []).map((file) => ({
                    name: file.name,
                    size: file.size,
                    type: file.type
                }));
            } else {
                value = field.value ?? '';
            }

            return {
                tagName,
                type,
                key,
                value
            };
        });

        return stableSerialize(fields);
    }

    function shouldTrackUnsavedField(field) {
        if (!(field instanceof Element)) {
            return false;
        }

        if (field.disabled || field.readOnly) {
            return false;
        }

        if (field.matches('[data-ignore-unsaved], [data-action="select-row"], [data-action="select-all"], [data-column]')) {
            return false;
        }

        if (field.closest('.filter-form, .filter-drawer, .column-selector, .column-selector-panel, .pagination, .table-pagination, .module-toolbar')) {
            return false;
        }

        if (field.closest('table') && (field.matches('input[type="checkbox"], input[type="radio"]') || field.closest('thead'))) {
            return false;
        }

        return true;
    }

    function shouldHandleUnsavedInputEvent(event) {
        if (!event.isTrusted) {
            return false;
        }

        return shouldTrackUnsavedField(event.target);
    }

    function shouldPreventNativeTabFormSubmit(form) {
        if (!(form instanceof HTMLFormElement)) {
            return false;
        }

        if (!form.closest('.tab-content[data-tab-id]')) {
            return false;
        }

        if (form.hasAttribute('data-allow-native-submit')) {
            return false;
        }

        return true;
    }

    function ensureUnsavedChangesEntry(tabId) {
        if (!unsavedChangesState.has(tabId)) {
            unsavedChangesState.set(tabId, {
                baseline: '[]',
                dirty: false,
                tracking: false,
                userInteracted: false
            });
        }

        return unsavedChangesState.get(tabId);
    }

    function updateTabDirtyIndicator(tabId, dirty) {
        const tabHeader = document.querySelector(`.tab-header[data-tab-id="${tabId}"]`);
        if (!tabHeader) {
            return;
        }

        tabHeader.classList.toggle('has-unsaved-changes', Boolean(dirty));
        tabHeader.dataset.unsavedChanges = dirty ? 'true' : 'false';
    }

    function evaluateTabUnsavedChanges(tabId) {
        const tabContent = getTabContentElementById(tabId);
        const state = ensureUnsavedChangesEntry(tabId);

        if (!tabContent || !state.tracking || !state.userInteracted) {
            state.dirty = false;
            updateTabDirtyIndicator(tabId, false);
            return false;
        }

        const currentSnapshot = collectFormSnapshot(tabContent);
        state.dirty = currentSnapshot !== state.baseline;
        updateTabDirtyIndicator(tabId, state.dirty);
        return state.dirty;
    }

    function markTabChangesClean(tabId) {
        const tabContent = getTabContentElementById(tabId);
        const state = ensureUnsavedChangesEntry(tabId);
        state.baseline = collectFormSnapshot(tabContent);
        state.dirty = false;
        state.tracking = true;
        state.userInteracted = false;
        updateTabDirtyIndicator(tabId, false);
    }

    function initTabUnsavedChangesTracking(tabId, tabContentElement) {
        const state = ensureUnsavedChangesEntry(tabId);
        state.tracking = true;
        state.baseline = collectFormSnapshot(tabContentElement);
        state.dirty = false;
        state.userInteracted = false;
        updateTabDirtyIndicator(tabId, false);
    }

    function scheduleCleanBaselineRefresh(tabId, delay = 0) {
        window.setTimeout(() => {
            const tabContent = getTabContentElementById(tabId);
            const state = ensureUnsavedChangesEntry(tabId);
            if (!tabContent || state.userInteracted) {
                return;
            }

            state.baseline = collectFormSnapshot(tabContent);
            state.dirty = false;
            state.tracking = true;
            updateTabDirtyIndicator(tabId, false);
        }, delay);
    }

    function markTabUserInteracted(tabId) {
        if (!tabId) {
            return;
        }

        const state = ensureUnsavedChangesEntry(tabId);
        if (!state.tracking) {
            state.baseline = collectFormSnapshot(getTabContentElementById(tabId));
            state.tracking = true;
        }
        state.userInteracted = true;
    }

    function hasTrackedUnsavedChanges(tabId) {
        return evaluateTabUnsavedChanges(tabId);
    }

    function confirmDiscardUnsavedTabChanges() {
        return window.confirm('此分頁有尚未儲存的資料，若直接關閉將會遺失。確定要繼續關閉嗎？');
    }

    function normalizeOperationActionElement(actionElement) {
        if (!(actionElement instanceof Element)) {
            return;
        }

        const action = (actionElement.getAttribute('data-action') || '').trim();
        if (!action) {
            return;
        }

        actionElement.classList.add('btn', 'text', 'op-action-btn');
        actionElement.classList.remove('btn-icon', 'icon-button', 'icon-btn', 'link', 'purple');
        OPERATION_ACTION_ROLE_CLASSES.forEach(roleClass => actionElement.classList.remove(roleClass));

        const role = OPERATION_ACTION_ROLE_MAP[action] || 'neutral';
        if (role !== 'state') {
            actionElement.classList.remove('success', 'warning', 'danger');
        }
        actionElement.classList.add(`op-role-${role}`);

        if (Object.prototype.hasOwnProperty.call(OPERATION_ACTION_LABEL_MAP, action)) {
            const label = OPERATION_ACTION_LABEL_MAP[action];
            actionElement.setAttribute('title', label);
            actionElement.setAttribute('aria-label', label);
        }

        const iconClass = OPERATION_ACTION_ICON_MAP[action];
        const icon = iconClass ? actionElement.querySelector('i') : null;
        if (icon) {
            Array.from(icon.classList)
                .filter(className => className.startsWith('fa-') && className !== 'fa-fw')
                .forEach(className => icon.classList.remove(className));
            icon.classList.add('fas', iconClass);
        }
    }

    function collectOperationActionCells(scope) {
        if (!scope) {
            return [];
        }

        const cells = new Set();

        const addCandidateCells = (root) => {
            root.querySelectorAll?.('td').forEach(cell => {
                if (cell.querySelector(':scope > .btn.text[data-action], :scope > .op-disabled-title-wrap .btn.text[data-action]')) {
                    cells.add(cell);
                }
            });
        };

        if (scope instanceof Element) {
            if (scope.matches(OPERATION_ACTION_CELL_SELECTOR)) {
                cells.add(scope);
            }
            scope.querySelectorAll(OPERATION_ACTION_CELL_SELECTOR).forEach(cell => cells.add(cell));
            addCandidateCells(scope);
            return Array.from(cells);
        }

        if (scope instanceof Document || scope instanceof DocumentFragment) {
            scope.querySelectorAll(OPERATION_ACTION_CELL_SELECTOR).forEach(cell => cells.add(cell));
            addCandidateCells(scope);
        }

        return Array.from(cells);
    }

    function normalizeOperationActionButtons(scope = document) {
        const actionCells = collectOperationActionCells(scope);
        if (actionCells.length === 0) {
            return;
        }

        actionCells.forEach(cell => {
            cell.classList.add('table-actions');
            cell.querySelectorAll(OPERATION_ACTION_SELECTOR).forEach(normalizeOperationActionElement);
        });
    }

    function scheduleOperationActionButtonNormalization(scope = document) {
        pendingActionNormalizationScopes.add(scope);
        if (isActionNormalizationScheduled) {
            return;
        }

        isActionNormalizationScheduled = true;
        window.requestAnimationFrame(() => {
            isActionNormalizationScheduled = false;
            const scopes = Array.from(pendingActionNormalizationScopes);
            pendingActionNormalizationScopes.clear();
            scopes.forEach(currentScope => normalizeOperationActionButtons(currentScope));
        });
    }

    function observeOperationActionButtons() {
        if (!tabContentArea || typeof MutationObserver === 'undefined') {
            return;
        }

        const observer = new MutationObserver((mutations) => {
            let shouldNormalize = false;
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (!(node instanceof Element)) {
                        continue;
                    }

                    if (node.matches(OPERATION_ACTION_CELL_SELECTOR)
                        || node.matches(OPERATION_ACTION_SELECTOR)
                        || node.querySelector(OPERATION_ACTION_CELL_SELECTOR)
                        || node.querySelector(OPERATION_ACTION_SELECTOR)) {
                        shouldNormalize = true;
                        break;
                    }
                }

                if (shouldNormalize) {
                    break;
                }
            }

            if (shouldNormalize) {
                scheduleOperationActionButtonNormalization(tabContentArea);
            }
        });

        observer.observe(tabContentArea, { childList: true, subtree: true });
    }

    function registerModuleInitializer(moduleId, initializer) {
        moduleInitializers[moduleId] = initializer;
    }

    function runModuleInitializer(moduleId, container, context = null) {
        const initializer = moduleInitializers[moduleId];
        if (typeof initializer === 'function') {
            initializer(container, context);
        }
    }

    // Save open tabs to localStorage
    function saveOpenTabs() {
        try {
            localStorage.setItem(STORAGE_KEYS.OPEN_TABS, JSON.stringify(openTabs));
        } catch (error) {
            console.warn('Failed to save open tabs to localStorage:', error);
        }
    }

    // Load open tabs from localStorage
    function loadOpenTabs() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.OPEN_TABS);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.warn('Failed to load open tabs from localStorage:', error);
            return [];
        }
    }

    // Save active tab to localStorage
    function saveActiveTab(tabId) {
        try {
            localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, tabId);
        } catch (error) {
            console.warn('Failed to save active tab to localStorage:', error);
        }
    }

    // Load active tab from localStorage
    function loadActiveTab() {
        try {
            return localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
        } catch (error) {
            console.warn('Failed to load active tab from localStorage:', error);
            return null;
        }
    }

    function saveSidebarCollapsedState(collapsed) {
        try {
            localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, collapsed ? 'true' : 'false');
        } catch (error) {
            console.warn('Failed to save sidebar state to localStorage:', error);
        }
    }

    function loadSidebarCollapsedState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
            return saved === 'true';
        } catch (error) {
            console.warn('Failed to load sidebar state from localStorage:', error);
            return false;
        }
    }

    function normalizeModuleContentUrl(contentUrl, moduleId = '') {
        if (typeof contentUrl === 'string' && contentUrl.trim() !== '') {
            return contentUrl.split('?')[0];
        }

        return moduleId ? `modules/${moduleId}.html` : '';
    }

    function withAssetVersion(url) {
        const normalizedUrl = normalizeModuleContentUrl(url);
        if (!normalizedUrl) {
            return url;
        }

        const version = window.APP_ASSET_VERSION || document.documentElement.getAttribute('data-asset-version') || '';
        if (!version) {
            return normalizedUrl;
        }

        const parsed = new URL(normalizedUrl, window.location.href);
        parsed.searchParams.set('v', version);
        return parsed.toString();
    }

    function fetchFreshHtml(url) {
        return fetch(withAssetVersion(url), {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
            headers: {
                'Accept': 'text/html',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            },
        });
    }

    function isSidebarCollapsed() {
        return appContainer ? appContainer.classList.contains('sidebar-collapsed') : false;
    }

    function setSidebarCollapsed(collapsed, { skipPersistence = false } = {}) {
        if (!appContainer || !sidebarElement) {
            return;
        }

        appContainer.classList.toggle('sidebar-collapsed', collapsed);

        if (sidebarToggleButton) {
            const expanded = !collapsed;
            sidebarToggleButton.setAttribute('aria-expanded', String(expanded));
            sidebarToggleButton.setAttribute('aria-label', expanded ? '收合側邊選單' : '展開側邊選單');
            sidebarToggleButton.setAttribute('title', expanded ? '收合側邊選單' : '展開側邊選單');

            const toggleIcon = sidebarToggleButton.querySelector('i');
            if (toggleIcon) {
                toggleIcon.classList.toggle('fa-angle-double-left', expanded);
                toggleIcon.classList.toggle('fa-angle-double-right', collapsed);
            }
        }

        if (!skipPersistence) {
            saveSidebarCollapsedState(collapsed);
        }
    }

    const initialSidebarCollapsed = loadSidebarCollapsedState();
    setSidebarCollapsed(initialSidebarCollapsed, { skipPersistence: true });

    if (sidebarToggleButton) {
        sidebarToggleButton.addEventListener('click', () => {
            const shouldCollapse = !isSidebarCollapsed();
            setSidebarCollapsed(shouldCollapse);
        });
    }

    function clearActiveMenuStates() {
        if (!sidebarElement) {
            return;
        }

        sidebarElement.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
        sidebarElement.querySelectorAll('.submenu a').forEach(link => link.classList.remove('active-submenu-item'));
    }

    function setActiveMenuByPageId(pageId) {
        if (!sidebarElement || !pageId) {
            return;
        }

        const submenuLink = sidebarElement.querySelector(`.submenu a[data-page="${pageId}"]`);
        if (submenuLink) {
            clearActiveMenuStates();
            submenuLink.classList.add('active-submenu-item');
            const parentMenuItem = submenuLink.closest('.menu-item');
            if (parentMenuItem) {
                parentMenuItem.classList.add('active');
            }
            return;
        }

        const menuLink = sidebarElement.querySelector(`.menu-link[data-menu-id="${pageId}"]`);
        if (menuLink) {
            clearActiveMenuStates();
            const parentMenuItem = menuLink.closest('.menu-item');
            if (parentMenuItem) {
                parentMenuItem.classList.add('active');
            }
        }
    }

    let currentUser = null;
    let openTabs = []; // Stores { id, title, contentUrl }

    // LookupValues 快取和管理函數
    const lookupValuesCache = new Map();

    /**
     * 從 API 取得 LookupValues
     * @param {string} domainKey - 領域鍵值
     * @returns {Promise<Array>} LookupValues 陣列
     */
    async function fetchLookupValues(domainKey) {
        if (lookupValuesCache.has(domainKey)) {
            return lookupValuesCache.get(domainKey);
        }

        try {
            const response = await fetch(`api/lookup_values/?domain_key=${encodeURIComponent(domainKey)}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                lookupValuesCache.set(domainKey, data.data);
                return data.data;
            } else {
                throw new Error(data.message || 'Failed to fetch lookup values');
            }
        } catch (error) {
            console.error(`Failed to fetch lookup values for domain: ${domainKey}`, error);
            return [];
        }
    }

    /**
     * 填充下拉選單選項
     * @param {HTMLSelectElement} selectElement - 選擇元素
     * @param {string} domainKey - 領域鍵值
     * @param {string} defaultValue - 預設值
     */
    async function populateSelectOptions(selectElement, domainKey, defaultValue = '') {
        if (!selectElement) return;

        const lookupValues = await fetchLookupValues(domainKey);

        // 清空現有選項（保留第一個預設選項）
        const firstOption = selectElement.querySelector('option');
        selectElement.innerHTML = '';
        if (firstOption && firstOption.value === '') {
            selectElement.appendChild(firstOption);
        }

        // 添加選項
        lookupValues.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.value_label;
            option.setAttribute('data-value-key', item.value_key);
            if (item.id.toString() === defaultValue.toString()) {
                option.selected = true;
            }
            selectElement.appendChild(option);
        });
    }

    /**
     * 根據 lookup_id 取得顯示標籤
     * @param {string} domainKey - 領域鍵值
     * @param {number} lookupId - 查詢值 ID
     * @returns {Promise<string>} 顯示標籤
     */
    async function getLookupLabel(domainKey, lookupId) {
        if (!lookupId) return '';

        const lookupValues = await fetchLookupValues(domainKey);
        const item = lookupValues.find(v => v.id === lookupId);
        return item ? item.value_label : '';
    }

    /**
     * 清除 LookupValues 快取
     */
    function clearLookupValuesCache() {
        lookupValuesCache.clear();
    }

    async function fetchSession() {
        try {
            const response = await fetch('api/session.php', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                return null;
            }

            const result = await response.json();
            if (result.success) {
                // 更新 CSRF Token
                if (result.csrf_token) {
                    sessionStorage.setItem('csrf_token', result.csrf_token);
                }
                return result.data;
            }
            return null;
        } catch (error) {
            console.error('無法取得登入狀態：', error);
            return null;
        }
    }

    function clearSavedClientState() {
        try {
            localStorage.removeItem(STORAGE_KEYS.OPEN_TABS);
            localStorage.removeItem(STORAGE_KEYS.ACTIVE_TAB);
            localStorage.removeItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
        } catch (error) {
            console.warn('Failed to clear tab state from localStorage:', error);
        }
    }

    function redirectToLogin(reason = '') {
        clearSavedClientState();
        const target = reason
            ? `login.html?reason=${encodeURIComponent(reason)}`
            : 'login.html';
        window.location.href = target;
    }

    async function performLogout(reason = 'manual_logout') {
        try {
            const response = await fetch('api/logout.php', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('登出失敗，請稍後再試。');
            }
        } catch (error) {
            console.error('登出時發生錯誤：', error);
        } finally {
            redirectToLogin(reason);
        }
    }

    currentUser = await fetchSession();
    if (!currentUser) {
        redirectToLogin('session_expired');
        return;
    }

    // ====== 權限檢查函數 ======
    /**
     * 檢查目前使用者是否有指定權限
     * @param {string} permissionName - 權限名稱
     * @returns {boolean}
     */
    function hasPermission(permissionName) {
        const permissions = Array.isArray(currentUser?.permissions) ? currentUser.permissions : [];
        if (permissions.length === 0) {
            return false;
        }

        const candidates = getPermissionCandidates(permissionName);
        return candidates.some(candidate => permissions.includes(candidate));
    }

    /**
     * 檢查目前使用者是否有任一指定權限
     * @param {string[]} permissionNames - 權限名稱陣列
     * @returns {boolean}
     */
    function hasAnyPermission(permissionNames) {
        if (!Array.isArray(permissionNames)) return false;
        return permissionNames.some(hasPermission);
    }

    /**
     * 檢查目前使用者是否有指定角色
     * @param {string} roleName - 角色名稱
     * @returns {boolean}
     */
    function hasRole(roleName) {
        if (!currentUser?.roles) return false;
        return currentUser.roles.some(r => r.name === roleName);
    }

    const MODULE_LEGACY_PERMISSION_MAP = Object.freeze({
        companies: 'manage_companies',
        customers: 'manage_customers',
        suppliers: 'manage_suppliers',
        employees: 'manage_employees',
        departments: 'manage_departments',
        screening_items: 'manage_screening_items',
        screening_services: 'manage_screening_services',
        orders: 'manage_orders',
        order_items: 'manage_orders',
        work_orders: 'manage_work_orders',
        production_work_order_schedule: 'manage_work_orders',
        work_order_first_piece_dimensions: 'manage_work_orders',
        work_order_images: 'manage_work_orders',
        work_order_pre_production_images: 'manage_work_orders',
        work_order_completion_images: 'manage_work_orders',
        work_order_defect_images: 'manage_work_orders',
        work_order_tool_condition_images: 'manage_work_orders',
        machines: 'manage_machines',
        machine_capabilities: 'manage_machines',
        machine_maintenance_tasks: 'manage_maintenance_tasks',
        daily_machine_inspections: 'manage_daily_inspections',
        daily_machine_inspection_items: 'manage_daily_inspections',
        inventory_items: 'manage_inventory',
        inventory_transactions: 'manage_inventory',
        tools: 'manage_tools',
        shipping_orders: 'manage_shipping_orders',
        shipping_order_items: 'manage_shipping_orders',
        shipping_quality_inspections: 'manage_shipping_quality',
        return_orders: 'manage_return_orders',
        return_order_items: 'manage_return_orders',
        rescreen_batches: 'manage_return_orders',
        production_records: 'manage_production_records',
        production_quality_records: 'manage_production_quality',
        defect_history_records: 'manage_production_quality',
        quality_issue_reports: 'manage_quality_issues',
        roles: 'manage_roles',
        permissions: 'manage_permissions',
        role_permissions: 'manage_roles',
        employee_roles: 'manage_roles',
        lookup_domains: 'manage_system_parameters',
        lookup_values: 'manage_system_parameters',
        number_sequences: 'manage_system_parameters',
        system_parameters: 'manage_system_parameters',
        report_descriptions: 'manage_system_parameters',
        audit_logs: 'view_audit_logs',
        domain_event_outbox: 'manage_system_parameters',
        security_settings: 'manage_system_parameters',
        dashboard_calendar_events: 'manage_calendar_events',
        calendar_event_participants: 'manage_calendar_events',
        calendar_event_reminders: 'manage_calendar_events',
        notifications: 'manage_system_parameters',
        messages: 'manage_system_parameters',
    });

    const PERMISSION_ALIAS_MAP = Object.freeze({
        manage_companies: '公司基本資料',
        manage_customers: '客戶基本資料',
        manage_suppliers: '供應商基本資料',
        manage_departments: '部門基本資料',
        manage_employees: '員工基本資料',
        manage_machines: '機台設備管理',
        'machine_capabilities.read': '機台能力管理',
        manage_tools: '載具管理',
        manage_screening_items: '受篩產品',
        manage_screening_services: '篩分服務項目',
        manage_orders: '訂單主表管理',
        manage_work_orders: '生產工單',
        'work_orders.partial_receipt': '工單部分入庫',
        'work_orders.reverse_partial_receipt': '工單部分入庫沖銷',
        'work_orders.confirm_shortage': '工單短缺確認',
        'production_work_order_schedule.read': '生產工單排程',
        manage_production_records: '生產紀錄',
        manage_shipping_orders: '出貨單',
        manage_return_orders: '退貨單',
        manage_rescreen_batches: '二次篩選紀錄',
        manage_daily_inspections: '每日機台檢驗',
        manage_production_quality: '生產品質檢驗',
        manage_shipping_quality: '出貨品質檢驗',
        manage_quality_issues: '品質異常報告',
        manage_roles: '角色設定',
        manage_permissions: '權限設定',
        manage_system_parameters: '系統參數',
        view_audit_logs: '操作日誌',
        manage_calendar_events: '行事曆事件',
        manage_inventory: '庫存項目',
        manage_maintenance_tasks: '機台維修任務',
        view_reports: '列印報表說明',
    });

    function getPermissionCandidates(permissionName) {
        const candidates = [permissionName];
        const alias = PERMISSION_ALIAS_MAP[permissionName];
        if (alias) {
            candidates.push(alias);
        }

        const technical = Object.keys(PERMISSION_ALIAS_MAP).find(key => PERMISSION_ALIAS_MAP[key] === permissionName);
        if (technical) {
            candidates.push(technical);
        }

        return [...new Set(candidates)];
    }

    const ACTION_MODULE_MAP = Object.freeze({
        'open-notifications': 'notifications',
        'open-messages': 'messages',
    });

    function canAccessModule(moduleId) {
        if (!moduleId || moduleId === 'dashboard') {
            return true;
        }

        const permissions = Array.isArray(currentUser?.permissions) ? currentUser.permissions : [];
        if (permissions.length === 0) {
            // 向後相容：尚未建立權限資料時預設放行
            return true;
        }

        const readPermission = `${moduleId}.read`;
        if (hasPermission(readPermission)) {
            return true;
        }

        const legacyPermission = MODULE_LEGACY_PERMISSION_MAP[moduleId];
        return legacyPermission ? hasPermission(legacyPermission) : false;
    }

    function canAccessAction(action) {
        const moduleId = ACTION_MODULE_MAP[action];
        return moduleId ? canAccessModule(moduleId) : true;
    }

    function applySidebarPermissionVisibility() {
        if (!sidebarElement) {
            return;
        }

        sidebarSubmenuLinks.forEach(link => {
            const pageId = link.dataset.page || '';
            const action = link.dataset.action || '';

            const allowed = pageId ? canAccessModule(pageId) : canAccessAction(action);
            const listItem = link.closest('li');
            const target = listItem || link;
            target.classList.toggle('hidden', !allowed);
        });

        sidebarMenuLinks.forEach(link => {
            const parentMenuItem = link.closest('.menu-item');
            if (!parentMenuItem) {
                return;
            }

            if (parentMenuItem.classList.contains('has-submenu')) {
                const hasVisibleChildren = parentMenuItem.querySelector('.submenu li:not(.hidden)') !== null;
                parentMenuItem.classList.toggle('hidden', !hasVisibleChildren);
                return;
            }

            const moduleId = link.dataset.menuId || '';
            parentMenuItem.classList.toggle('hidden', !canAccessModule(moduleId));
        });

        document.querySelectorAll('.user-dropdown-menu [data-action]').forEach(actionLink => {
            const action = actionLink.dataset.action || '';
            const allowed = canAccessAction(action);
            actionLink.classList.toggle('hidden', !allowed);
        });
    }

    // 暴露權限檢查函數到全域
    window.hasPermission = hasPermission;
    window.hasAnyPermission = hasAnyPermission;
    window.hasRole = hasRole;
    window.canAccessModule = canAccessModule;
    window.currentUser = currentUser;

    applySidebarPermissionVisibility();

    // ====== 安全管理器初始化（閒置登出 + 版本偵測設定載入）======
    window.AppSecurityManager.init(performLogout);
    // 非同步載入安全設定並套用（失敗時使用預設值繼續運行）
    (async function loadAndApplySecuritySettings() {
        try {
            const res = await fetch('api/security_settings/', { credentials: 'include' });
            if (!res.ok) { return; }
            const data = await res.json();
            if (!data.success) { return; }
            const s = data.data;
            window.AppVersionChecker.configure(
                s['security.auto_refresh.enabled'].value === '1',
                parseInt(s['security.auto_refresh.interval_minutes'].value, 10) || 5
            );
            window.AppSecurityManager.configure(
                s['security.auto_logout.enabled'].value === '1',
                parseInt(s['security.auto_logout.idle_minutes'].value, 10) || 30,
                parseInt(s['security.auto_logout.warning_seconds'].value, 10) || 60
            );
        } catch (e) {
            console.warn('[App] 安全設定載入失敗，使用預設值：', e);
        }
    })();

    if (currentUserNameElement) {
        const displayName = currentUser.name ? `${currentUser.name} (${currentUser.account})` : currentUser.account;
        currentUserNameElement.textContent = displayName;
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', (event) => {
            event.preventDefault();
            performLogout('manual_logout');
        });
    }

    // ====== 使用者下拉選單處理 ======
    const userDropdownWrapper = document.querySelector('.user-dropdown-wrapper');
    const userDropdownToggle = document.getElementById('user-dropdown-toggle');
    const userDropdownMenu = document.getElementById('user-dropdown-menu');

    if (userDropdownToggle && userDropdownWrapper) {
        userDropdownToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdownWrapper.classList.toggle('open');
        });

        // 點擊外部關閉下拉選單
        document.addEventListener('click', (e) => {
            if (!userDropdownWrapper.contains(e.target)) {
                userDropdownWrapper.classList.remove('open');
            }
        });
    }

    if (userDropdownMenu) {
        userDropdownMenu.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset?.action;
            if (!action) return;

            e.preventDefault();
            userDropdownWrapper.classList.remove('open');

            switch (action) {
                case 'edit-profile':
                    openProfileModal();
                    break;
                case 'open-notifications':
                    openTab('notifications', '公告通知中心', 'modules/notifications.html');
                    break;
                case 'open-messages':
                    openTab('messages', '我的留言', 'modules/messages.html');
                    break;
            }
        });
    }

    // ====== Profile Modal 功能 ======
    const profileModal = document.querySelector('[data-profile-modal]');
    const profileInfoForm = document.querySelector('[data-profile-info-form]');
    const profilePasswordForm = document.querySelector('[data-profile-password-form]');
    const profileModalAlert = document.querySelector('[data-profile-modal-alert]');
    const profileTabs = document.querySelectorAll('.profile-tab');
    const profileTabContents = document.querySelectorAll('.profile-tab-content');

    // Tab 切換
    profileTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.profileTab;

            // 切換 Tab 按鈕狀態
            profileTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // 切換內容區塊
            profileTabContents.forEach(content => {
                content.classList.remove('active');
            });

            if (targetTab === 'info') {
                profileInfoForm.classList.add('active');
            } else if (targetTab === 'password') {
                profilePasswordForm.classList.add('active');
            }

            // 清除錯誤訊息
            hideProfileAlert();
        });
    });

    // 開啟 Profile Modal
    async function openProfileModal() {
        if (!profileModal) return;

        // 重設為基本資料 Tab
        profileTabs.forEach(t => t.classList.remove('active'));
        profileTabs[0]?.classList.add('active');
        profileTabContents.forEach(c => c.classList.remove('active'));
        profileInfoForm?.classList.add('active');

        // 清除表單與錯誤訊息
        profileInfoForm?.reset();
        profilePasswordForm?.reset();
        hideProfileAlert();

        // 載入個人資料
        try {
            const res = await fetch('api/profile/', { credentials: 'include' });
            const data = await res.json();

            if (data.success && data.data) {
                const profile = data.data;
                profileInfoForm.querySelector('[name="account"]').value = profile.account || '';
                profileInfoForm.querySelector('[name="employee_number"]').value = profile.employee_number || '';
                profileInfoForm.querySelector('[name="name"]').value = profile.name || '';
                profileInfoForm.querySelector('[name="email"]').value = profile.email || '';
                profileInfoForm.querySelector('[name="job_title"]').value = profile.job_title || '';
                profileInfoForm.querySelector('[name="department_name"]').value = profile.department_name || '未指定';
                profileInfoForm.querySelector('[name="status_display"]').value =
                    profile.status === 'active' ? '啟用' : '停用';

                // 角色顯示
                const rolesNames = profile.roles?.map(r => r.name).join(', ') || '無';
                profileInfoForm.querySelector('[name="roles_display"]').value = rolesNames;
            } else {
                showProfileAlert('載入個人資料失敗：' + (data.message || '未知錯誤'), 'error');
            }
        } catch (error) {
            showProfileAlert('載入個人資料失敗：' + error.message, 'error');
        }

        profileModal.classList.remove('hidden');
    }

    // 關閉 Profile Modal
    function closeProfileModal() {
        profileModal?.classList.add('hidden');
    }

    // 顯示 Profile Alert
    function showProfileAlert(message, type = 'error') {
        if (!profileModalAlert) return;
        profileModalAlert.textContent = message;
        profileModalAlert.className = 'modal-alert ' + type;
        profileModalAlert.classList.remove('hidden');
    }

    // 隱藏 Profile Alert
    function hideProfileAlert() {
        profileModalAlert?.classList.add('hidden');
    }

    // 關閉按鈕
    document.querySelectorAll('[data-action="close-profile-modal"]').forEach(btn => {
        btn.addEventListener('click', closeProfileModal);
    });

    // 點擊 overlay 關閉
    profileModal?.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            closeProfileModal();
        }
    });

    // 更新基本資料表單提交
    profileInfoForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideProfileAlert();

        const name = profileInfoForm.querySelector('[name="name"]').value.trim();
        const email = profileInfoForm.querySelector('[name="email"]').value.trim();
        const jobTitle = profileInfoForm.querySelector('[name="job_title"]').value.trim();

        if (!name) {
            showProfileAlert('姓名不可為空。', 'error');
            return;
        }

        if (!email) {
            showProfileAlert('Email 不可為空。', 'error');
            return;
        }

        try {
            const res = await fetch('api/profile/', {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, job_title: jobTitle })
            });

            const data = await res.json();

            if (data.success) {
                showProfileAlert('個人資料更新成功！', 'success');
                // 更新頁面顯示的使用者名稱
                const userNameElem = document.getElementById('current-user-name');
                if (userNameElem && data.data?.name) {
                    userNameElem.textContent = data.data.name;
                }
            } else {
                const errMsg = data.errors
                    ? Object.values(data.errors).join('、')
                    : data.message || '更新失敗';
                showProfileAlert(errMsg, 'error');
            }
        } catch (error) {
            showProfileAlert('更新失敗：' + error.message, 'error');
        }
    });

    // 修改密碼表單提交
    profilePasswordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideProfileAlert();

        const currentPassword = profilePasswordForm.querySelector('[name="current_password"]').value;
        const newPassword = profilePasswordForm.querySelector('[name="new_password"]').value;
        const confirmPassword = profilePasswordForm.querySelector('[name="confirm_password"]').value;

        if (!currentPassword) {
            showProfileAlert('請輸入目前密碼。', 'error');
            return;
        }

        if (!newPassword) {
            showProfileAlert('請輸入新密碼。', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showProfileAlert('新密碼至少需要 6 個字元。', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showProfileAlert('確認密碼與新密碼不一致。', 'error');
            return;
        }

        try {
            const res = await fetch('api/profile/password.php', {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            });

            const data = await res.json();

            if (data.success) {
                showProfileAlert('密碼修改成功！', 'success');
                profilePasswordForm.reset();
            } else {
                const errMsg = data.errors
                    ? Object.values(data.errors).join('、')
                    : data.message || '修改失敗';
                showProfileAlert(errMsg, 'error');
            }
        } catch (error) {
            showProfileAlert('修改失敗：' + error.message, 'error');
        }
    });

    // 暴露函數供其他模組使用
    window.openProfileModal = openProfileModal;

    // ====== 版本資訊 Modal 功能 ======
    const versionModal = document.querySelector('[data-version-modal]');
    const systemVersionEl = document.getElementById('system-version');
    const systemReleaseDateEl = document.getElementById('system-release-date');
    const systemFileVersionEl = document.getElementById('system-file-version');
    const systemUpdateListEl = document.getElementById('system-update-list');

    const VERSION_HISTORY_LIMIT = 3;

    function formatReleaseDate(dateStr) {
        if (!dateStr) {
            return '未設定';
        }

        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) {
            return dateStr;
        }

        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    function normalizeSummaryLines(text) {
        if (typeof text !== 'string') {
            return [];
        }

        return text
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line !== '');
    }

    function renderUpdateList(records) {
        if (!systemUpdateListEl) {
            return;
        }

        systemUpdateListEl.innerHTML = '';

        if (!Array.isArray(records) || records.length === 0) {
            renderUpdateMessage('尚無更新紀錄。');
            return;
        }

        records.forEach(record => {
            const item = document.createElement('li');
            item.className = 'version-update-item';

            const header = document.createElement('div');
            header.className = 'version-update-header';

            const version = document.createElement('span');
            version.className = 'version-update-version';
            version.textContent = record.version_number || '未標示版本';

            const date = document.createElement('span');
            date.className = 'version-update-date';
            date.textContent = formatReleaseDate(record.release_date || '');

            header.appendChild(version);
            header.appendChild(date);

            const lines = normalizeSummaryLines(record.change_summary || '');
            const summaryList = document.createElement('ul');
            summaryList.className = 'version-update-summary';

            if (lines.length === 0) {
                const summaryItem = document.createElement('li');
                summaryItem.textContent = '此版本未提供更新說明。';
                summaryList.appendChild(summaryItem);
            } else {
                lines.forEach(line => {
                    const summaryItem = document.createElement('li');
                    summaryItem.textContent = line;
                    summaryList.appendChild(summaryItem);
                });
            }

            item.appendChild(header);
            item.appendChild(summaryList);
            systemUpdateListEl.appendChild(item);
        });
    }

    function renderUpdateMessage(message) {
        if (!systemUpdateListEl) {
            return;
        }

        systemUpdateListEl.innerHTML = '';
        const item = document.createElement('li');
        item.className = 'version-update-empty';
        item.textContent = message;
        systemUpdateListEl.appendChild(item);
    }

    function applyLatestVersion(latest) {
        if (!latest || typeof latest !== 'object') {
            return;
        }

        if (systemVersionEl && latest.version_number) {
            systemVersionEl.textContent = latest.version_number;
        }

        if (systemReleaseDateEl && latest.release_date) {
            systemReleaseDateEl.textContent = formatReleaseDate(latest.release_date);
        }

        if (systemFileVersionEl && latest.file_version) {
            systemFileVersionEl.textContent = latest.file_version;
        }
    }

    function applyVersionUnavailable() {
        if (systemVersionEl) {
            systemVersionEl.textContent = '未取得';
        }

        if (systemReleaseDateEl) {
            systemReleaseDateEl.textContent = '未取得';
        }

        if (systemFileVersionEl) {
            systemFileVersionEl.textContent = '未取得';
        }
    }

    async function loadVersionHistory() {
        if (!systemUpdateListEl) {
            return;
        }

        renderUpdateMessage('載入更新紀錄中...');

        try {
            const res = await fetch(`api/system_update_history.php?limit=${VERSION_HISTORY_LIMIT}`, {
                credentials: 'include',
                cache: 'no-store',
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message || '載入更新紀錄失敗。');
            }

            applyLatestVersion(data.latest || null);
            renderUpdateList(Array.isArray(data.data) ? data.data : []);
        } catch (error) {
            applyVersionUnavailable();
            renderUpdateMessage('無法載入更新紀錄。');
            console.warn('[version-modal] 載入版本更新紀錄失敗:', error);
        }
    }

    // 開啟版本資訊 Modal
    function openVersionModal() {
        if (!versionModal) return;
        loadVersionHistory();
        versionModal.classList.remove('hidden');
    }

    // 關閉版本資訊 Modal
    function closeVersionModal() {
        versionModal?.classList.add('hidden');
    }

    // 關閉按鈕
    document.querySelectorAll('[data-action="close-version-modal"]').forEach(btn => {
        btn.addEventListener('click', closeVersionModal);
    });

    // 點擊 overlay 關閉
    versionModal?.addEventListener('click', (e) => {
        if (e.target === versionModal) {
            closeVersionModal();
        }
    });

    // 顯示版本資訊按鈕
    document.querySelectorAll('[data-action="show-version-info"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openVersionModal();
        });
    });

    // 暴露函數供其他模組使用
    window.openVersionModal = openVersionModal;

    // ====== 載入未讀數量 ======
    async function loadUnreadCounts() {
        try {
            const [notifRes, msgRes] = await Promise.all([
                fetch('api/notifications/unread_count.php', { credentials: 'include' }),
                fetch('api/messages/unread_count.php', { credentials: 'include' })
            ]);

            if (notifRes.ok) {
                const notifData = await notifRes.json();
                if (notifData.success) {
                    updateBadge('notification', notifData.unread_count);
                }
            }

            if (msgRes.ok) {
                const msgData = await msgRes.json();
                if (msgData.success) {
                    updateBadge('message', msgData.unread_count);
                }
            }
        } catch (error) {
            console.warn('載入未讀數量失敗:', error);
        }
    }

    function updateBadge(type, count) {
        const badges = document.querySelectorAll(`.${type}-badge`);
        badges.forEach(badge => {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = '';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    // 初始載入未讀數量
    loadUnreadCounts();

    // 每 60 秒刷新一次未讀數量
    setInterval(loadUnreadCounts, 60000);

    // 暴露刷新函數供其他模組使用
    window.refreshUnreadCounts = loadUnreadCounts;

    // Close all tabs button event listener
    const closeAllTabsBtn = document.getElementById('close-all-tabs');
    if (closeAllTabsBtn) {
        closeAllTabsBtn.addEventListener('click', () => {
            if (confirm('確定要關閉所有分頁嗎？')) {
                closeAllTabs();
            }
        });
    }

    // Initialize close all button state
    updateCloseAllButtonState();

    // Function to open a new tab or switch to an existing one
    function openTab(pageId, title, contentUrl, options = {}) {
        if (!options.skipPermissionCheck && !canAccessModule(pageId)) {
            if (!options.silentDenied) {
                window.alert('您沒有瀏覽此功能的權限。');
            }
            return;
        }

        contentUrl = normalizeModuleContentUrl(contentUrl, pageId);

        // Check if tab already exists
        let existingTab = openTabs.find(tab => tab.id === pageId);

        if (existingTab) {
            if (Object.prototype.hasOwnProperty.call(options, 'context')) {
                moduleContexts.set(pageId, options.context);
                const existingContent = document.querySelector(`.tab-content[data-tab-id="${pageId}"]`);
                if (existingContent) {
                    existingContent.dispatchEvent(new CustomEvent('module:context', {
                        detail: {
                            moduleId: pageId,
                            context: options.context ?? null,
                        }
                    }));
                }
            }
            switchTab(pageId);
            return;
        }

        // Add to openTabs array
        openTabs.push({ id: pageId, title: title, contentUrl: contentUrl });

        if (Object.prototype.hasOwnProperty.call(options, 'context')) {
            moduleContexts.set(pageId, options.context);
        } else {
            moduleContexts.delete(pageId);
        }

        // Save to localStorage
        saveOpenTabs();

        // Create tab header
        const tabHeader = document.createElement('div');
        tabHeader.classList.add('tab-header');
        tabHeader.dataset.tabId = pageId;
        tabHeader.innerHTML = `
            <span>${title}</span>
            <i class="fas fa-times close-tab"></i>
        `;
        tabHeadersContainer.appendChild(tabHeader);

        // Create tab content pane
        const tabContent = document.createElement('div');
        tabContent.classList.add('tab-content');
        tabContent.dataset.tabId = pageId;
        tabContentArea.appendChild(tabContent);

        // Load content into the tab
    loadTabContent(tabContent, contentUrl, pageId);

        // Switch to the new tab
        switchTab(pageId);

        // Add event listener for closing tab
        tabHeader.querySelector('.close-tab').addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent tab switch when closing
            closeTab(pageId);
        });

        // Add event listener for switching tab
        tabHeader.addEventListener('click', function() {
            switchTab(pageId);
        });
        // Update close all button state
        updateCloseAllButtonState();    }

    // Function to switch to a specific tab
    function switchTab(tabId) {
        // Deactivate all tab headers and content
        document.querySelectorAll('.tab-header').forEach(header => header.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Activate the selected tab header and content
        const activeTabHeader = document.querySelector(`.tab-header[data-tab-id="${tabId}"]`);
        const activeTabContent = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);

        if (activeTabHeader) activeTabHeader.classList.add('active');
        if (activeTabContent) activeTabContent.classList.add('active');

        setActiveMenuByPageId(tabId);

        // Save active tab to localStorage
        saveActiveTab(tabId);

        // 重新觸發模組初始化（只在模組已經初始化過的情況下，讓模組處理重新顯示時的邏輯）
        if (activeTabContent) {
            const moduleRoot = activeTabContent.querySelector(`[data-module="${tabId}"]`);
            // 只有當模組根元素存在且已經初始化過時，才重新呼叫初始化（用於處理重新顯示的邏輯）
            if (moduleRoot && moduleRoot.dataset.initialised === 'true') {
                runModuleInitializer(tabId, activeTabContent, moduleContexts.get(tabId));
            }
            scheduleOperationActionButtonNormalization(activeTabContent);
        }
    }

    // Function to close a tab
    function closeTab(tabId) {
        const tabHeaderToRemove = document.querySelector(`.tab-header[data-tab-id="${tabId}"]`);
        const tabContentToRemove = document.querySelector(`.tab-content[data-tab-id="${tabId}"]`);

        if (tabContentToRemove) {
            const beforeCloseEvent = new CustomEvent('module:before-close', {
                bubbles: true,
                cancelable: true,
                detail: {
                    tabId,
                }
            });

            const canClose = tabContentToRemove.dispatchEvent(beforeCloseEvent);
            if (!canClose) {
                return false;
            }
        }

        if (hasTrackedUnsavedChanges(tabId) && !confirmDiscardUnsavedTabChanges()) {
            return false;
        }

    if (tabHeaderToRemove) tabHeadersContainer.removeChild(tabHeaderToRemove);
    if (tabContentToRemove) tabContentArea.removeChild(tabContentToRemove);
    moduleContexts.delete(tabId);
    unsavedChangesState.delete(tabId);

        // Remove from openTabs array
        openTabs = openTabs.filter(tab => tab.id !== tabId);

        // Save updated tabs to localStorage
        saveOpenTabs();

        // If the closed tab was active, switch to the last remaining tab or show nothing
        if (tabHeaderToRemove && tabHeaderToRemove.classList.contains('active')) {
            if (openTabs.length > 0) {
                switchTab(openTabs[openTabs.length - 1].id);
            } else {
                // 沒有分頁時，自動開啟 Dashboard（避免空白畫面）
                console.log('所有分頁已關閉，自動開啟 Dashboard');
                clearActiveMenuStates();
                saveActiveTab('');
                // 使用 setTimeout 避免立即重新開啟造成的視覺閃爍
                setTimeout(() => {
                    openTab('dashboard', '系統儀表板', 'modules/dashboard.html');
                }, 100);
            }
        }

        // Update close all button state
        updateCloseAllButtonState();
        return true;
    }

    // Function to close all tabs
    function closeAllTabs() {
        if (openTabs.length === 0) return;

        // Close all tabs
        while (openTabs.length > 0) {
            const closed = closeTab(openTabs[0].id);
            if (closed === false) {
                break;
            }
        }
    }

    // Function to update close all button state
    function updateCloseAllButtonState() {
        const closeAllBtn = document.getElementById('close-all-tabs');
        if (closeAllBtn) {
            closeAllBtn.disabled = openTabs.length === 0;
        }
    }

    // Function to load content into a tab pane
    async function loadTabContent(tabContentElement, contentUrl, moduleId) {
        try {
            // 檢查是否使用配置化渲染
            if (typeof ModuleConfig !== 'undefined' && ModuleConfig.has(moduleId)) {
                const config = ModuleConfig.get(moduleId);

                // 檢查是否需要混合模式（配置 + 原 HTML 的 Modal）
                if (config.requiresHtmlModal) {
                    // 混合模式：先渲染配置部分，再從原 HTML 提取 Modal
                    console.log(`loadTabContent: 使用混合配置模式 ${moduleId}`);
                    ModuleRenderer.renderTo(moduleId, tabContentElement);

                    // 從原 HTML 載入 Modal 部分
                    try {
                        const response = await fetchFreshHtml(contentUrl);
                        if (response.ok) {
                            const html = await response.text();
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(html, 'text/html');
                            // 提取所有 modal-overlay 元素
                            const modals = doc.querySelectorAll('.modal-overlay');
                            const moduleRoot = tabContentElement.querySelector('[data-module]');
                            if (moduleRoot && modals.length > 0) {
                                modals.forEach(modal => {
                                    moduleRoot.appendChild(modal.cloneNode(true));
                                });
                                console.log(`loadTabContent: 從原 HTML 載入 ${modals.length} 個 Modal`);
                            }
                        }
                    } catch (modalErr) {
                        console.warn(`loadTabContent: 無法載入原 HTML Modal`, modalErr);
                    }
                } else {
                    // 純配置化渲染
                    console.log(`loadTabContent: 使用配置化渲染 ${moduleId}`);
                    ModuleRenderer.renderTo(moduleId, tabContentElement);
                }
            } else {
                // 傳統方式：載入 HTML 檔案
                const response = await fetchFreshHtml(contentUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const html = await response.text();
                tabContentElement.innerHTML = html;
            }

            if (moduleId) {
                const context = moduleContexts.get(moduleId) ?? null;
                runModuleInitializer(moduleId, tabContentElement, context);
                tabContentElement.dispatchEvent(new CustomEvent('module:context', {
                    detail: {
                        moduleId,
                        context,
                    }
                }));
            } else {
                const moduleContainer = tabContentElement.querySelector('[data-module]');
                if (moduleContainer) {
                    const detectedModuleId = moduleContainer.getAttribute('data-module');
                    const context = moduleContexts.get(detectedModuleId) ?? null;
                    runModuleInitializer(detectedModuleId, tabContentElement, context);
                    tabContentElement.dispatchEvent(new CustomEvent('module:context', {
                        detail: {
                            moduleId: detectedModuleId,
                            context,
                        }
                    }));
                }
            }
            if (moduleId) {
                initTabUnsavedChangesTracking(moduleId, tabContentElement);
                scheduleCleanBaselineRefresh(moduleId, 100);
                scheduleCleanBaselineRefresh(moduleId, 800);
            }
            scheduleOperationActionButtonNormalization(tabContentElement);
        } catch (error) {
            console.error('Error loading tab content:', error);
            tabContentElement.innerHTML = `<p style="color: red;">無法載入內容: ${error.message}</p>`;
        }
    }

    // Handle sidebar main menu clicks
    sidebarMenuLinks.forEach(link => {
        const textElement = link.querySelector('.menu-text');
        if (textElement) {
            const label = textElement.textContent.trim();
            if (label && !link.getAttribute('title')) {
                link.setAttribute('title', label);
            }
        }

        link.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default link behavior
            const parentMenuItem = this.closest('.menu-item');

            if (!parentMenuItem) {
                return;
            }

            if (parentMenuItem.classList.contains('has-submenu')) {
                if (isSidebarCollapsed()) {
                    setSidebarCollapsed(false);
                }
                clearActiveMenuStates();
                parentMenuItem.classList.add('active');
                return;
            }

            const pageId = this.dataset.menuId;
            const title = this.querySelector('.menu-text').textContent;
            const contentUrl = `modules/${pageId}.html`;
            openTab(pageId, title, contentUrl);
            setActiveMenuByPageId(pageId);
        });
    });

    // Handle sidebar submenu clicks
    sidebarSubmenuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // 支援 data-action 連結（如公告通知中心、我的留言）
            const action = this.dataset.action;
            if (action) {
                if (!canAccessAction(action)) {
                    return;
                }

                switch (action) {
                    case 'open-notifications':
                        openTab('notifications', '公告通知中心', 'modules/notifications.html');
                        break;
                    case 'open-messages':
                        openTab('messages', '我的留言', 'modules/messages.html');
                        break;
                    case 'open-mobile-work-orders':
                        window.open('mobile/', '_blank', 'noopener');
                        break;
                }
                return;
            }

            const pageId = this.dataset.page;
            const title = this.dataset.title || this.textContent; // Use data-title if available, else textContent
            const contentUrl = `modules/${pageId}.html`; // Assuming module HTML files are in 'modules' folder
            openTab(pageId, title, contentUrl);
            setActiveMenuByPageId(pageId);
        });
    });

    // ---- Module initializers ----

    registerModuleInitializer('employees', window.initializeEmployeesModule);
    registerModuleInitializer('departments', window.initializeDepartmentsModule);
    registerModuleInitializer('companies', window.initializeCompaniesModule);
    registerModuleInitializer('customers', window.initializeCustomersModule);
    registerModuleInitializer('suppliers', window.initializeSuppliersModule);
    registerModuleInitializer('orders', window.initializeOrdersModule);
    registerModuleInitializer('order_items', window.initializeOrderItemsModule);
    registerModuleInitializer('screening_items', window.initializeScreeningItemsModule);
    registerModuleInitializer('machines', window.initializeMachinesModule);
    registerModuleInitializer('machine_capabilities', window.initializeMachineCapabilitiesModule);
    registerModuleInitializer('tools', window.initializeToolsModule);
    registerModuleInitializer('screening_services', window.initializeScreeningServicesModule);
    registerModuleInitializer('audit_logs', window.initializeAuditLogsModule);
    registerModuleInitializer('lookup_values', window.initializeLookupValuesModule);
    registerModuleInitializer('work_orders', window.initializeWorkOrdersModule);
    registerModuleInitializer('production_work_order_schedule', window.initializeProductionWorkOrderScheduleModule);
    registerModuleInitializer('work_order_first_piece_dimensions', window.initializeWorkOrderFirstPieceDimensionsModule);
    registerModuleInitializer('work_order_images', window.initializeWorkOrderImagesModule);
    registerModuleInitializer('inventory_items', window.initializeInventoryItemsModule);
    registerModuleInitializer('inventory_transactions', window.initializeInventoryTransactionsModule);
    registerModuleInitializer('shipping_orders', window.initializeShippingOrdersModule);
    registerModuleInitializer('shipping_order_items', window.initializeShippingOrderItemsModule);
    registerModuleInitializer('return_orders', window.initializeReturnOrdersModule);
    registerModuleInitializer('rescreen_batches', window.initializeRescreenBatchesModule);
    registerModuleInitializer('production_quality_records', window.initializeProductionQualityRecordsModule);
    registerModuleInitializer('defect_history_records', window.initializeDefectHistoryRecordsModule);
    registerModuleInitializer('dashboard', window.initializeDashboardModule);
    // 新增模組初始化器
    registerModuleInitializer('roles', window.initializeRolesModule);
    registerModuleInitializer('permissions', window.initializePermissionsModule);
    registerModuleInitializer('role_permissions', window.initializeRolePermissionsModule);
    registerModuleInitializer('employee_roles', window.initializeEmployeeRolesModule);
    registerModuleInitializer('quality_issue_reports', window.initializeQualityIssueReportsModule);
    registerModuleInitializer('machine_maintenance_tasks', window.initializeMachineMaintenanceTasksModule);
    registerModuleInitializer('daily_machine_inspections', window.initializeDailyMachineInspectionsModule);
    registerModuleInitializer('daily_machine_inspection_items', window.initializeDailyMachineInspectionItemsModule);
    registerModuleInitializer('shipping_quality_inspections', window.initializeShippingQualityInspectionsModule);

    window.RescreenBatchEditorHelper = {
        formatDateTimeLocalValue(value) {
            if (!value) return '';
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return String(value).slice(0, 16).replace(' ', 'T');
            const pad = (part) => String(part).padStart(2, '0');
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        },
        buildDefectEditorHtml(rows, escapeHtml) {
            if (!Array.isArray(rows) || rows.length === 0) {
                return '<p class="text-muted">建立案件後，會依原始工單的篩分服務自動帶入二次篩分服務明細。</p>';
            }
            return `
                <div class="table-responsive">
                    <table class="data-table compact">
                        <thead>
                            <tr>
                                <th>服務</th>
                                <th>不良數量</th>
                                <th>重量(kg)</th>
                                <th>支數</th>
                                <th>處置</th>
                                <th>記錄時間</th>
                                <th>備註</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map((row, index) => `
                                <tr data-rescreen-defect-row>
                                    <td>
                                        <input type="hidden" data-field="id" value="${escapeHtml(String(row.id || ''))}">
                                        <input type="hidden" data-field="screening_service_id" value="${escapeHtml(String(row.screening_service_id || ''))}">
                                        <input type="hidden" data-field="source_defect_history_record_id" value="${escapeHtml(String(row.source_defect_history_record_id || ''))}">
                                        <input type="hidden" data-field="service_name" value="${escapeHtml(String(row.service_name || ''))}">
                                        <strong>${escapeHtml(row.service_name || `服務 ${index + 1}`)}</strong>
                                    </td>
                                    <td><input type="number" min="0" step="0.01" data-field="defect_quantity" value="${escapeHtml(String(row.defect_quantity ?? 0))}"></td>
                                    <td><input type="number" min="0" step="0.001" data-field="defect_weight_kg" value="${escapeHtml(String(row.defect_weight_kg ?? 0))}"></td>
                                    <td><input type="number" min="0" step="0.01" data-field="defect_units" value="${escapeHtml(String(row.defect_units ?? 0))}"></td>
                                    <td>
                                        <select data-field="disposition">
                                            <option value="">-- 未指定 --</option>
                                            <option value="rework"${row.disposition === 'rework' ? ' selected' : ''}>可再處理</option>
                                            <option value="scrap"${row.disposition === 'scrap' ? ' selected' : ''}>報廢</option>
                                            <option value="return_to_customer"${row.disposition === 'return_to_customer' ? ' selected' : ''}>退回客戶</option>
                                            <option value="hold"${row.disposition === 'hold' ? ' selected' : ''}>暫留待判</option>
                                            <option value="other"${row.disposition === 'other' ? ' selected' : ''}>其他</option>
                                        </select>
                                    </td>
                                    <td><input type="datetime-local" data-field="recorded_at" value="${escapeHtml(window.RescreenBatchEditorHelper.formatDateTimeLocalValue(row.defect_recorded_at || row.recorded_at || ''))}"></td>
                                    <td><input type="text" data-field="notes" value="${escapeHtml(String(row.notes || ''))}" placeholder="補充這個服務的不良狀況"></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        },
        buildDefaultDefectRowsFromWorkOrder(workOrder) {
            const services = Array.isArray(workOrder?.screening_services_details) ? workOrder.screening_services_details : [];
            return services.map((service) => ({
                screening_service_id: service.id || service.screening_service_id || '',
                service_name: service.custom_service_name || service.screening_service_name || '',
                defect_quantity: 0,
                defect_weight_kg: 0,
                defect_units: 0,
                disposition: '',
                recorded_at: '',
                notes: '',
                source_defect_history_record_id: '',
            })).filter((row) => String(row.service_name || '').trim() !== '');
        },
        collectDefectRows(editor) {
            if (!editor) return [];
            return Array.from(editor.querySelectorAll('[data-rescreen-defect-row]')).map((row) => ({
                id: row.querySelector('[data-field="id"]')?.value || '',
                screening_service_id: row.querySelector('[data-field="screening_service_id"]')?.value || '',
                service_name: row.querySelector('[data-field="service_name"]')?.value || '',
                source_defect_history_record_id: row.querySelector('[data-field="source_defect_history_record_id"]')?.value || '',
                defect_quantity: row.querySelector('[data-field="defect_quantity"]')?.value || '0',
                defect_weight_kg: row.querySelector('[data-field="defect_weight_kg"]')?.value || '0',
                defect_units: row.querySelector('[data-field="defect_units"]')?.value || '0',
                disposition: row.querySelector('[data-field="disposition"]')?.value || '',
                recorded_at: row.querySelector('[data-field="recorded_at"]')?.value || '',
                notes: row.querySelector('[data-field="notes"]')?.value || '',
            }));
        },
        buildProductionEditorHtml(rows, escapeHtml) {
            const normalizedRows = Array.isArray(rows) && rows.length > 0 ? rows : [];
            return `
                <div class="table-responsive">
                    <table class="data-table compact">
                        <thead>
                            <tr>
                                <th>卡號/桶號</th>
                                <th>重量(kg)</th>
                                <th>日期</th>
                                <th>時間</th>
                                <th>機台</th>
                                <th>載具</th>
                                <th>載具重(kg)</th>
                                <th>備註</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${normalizedRows.map((row) => window.RescreenBatchEditorHelper.buildProductionEditorRowHtml(row, escapeHtml)).join('')}
                        </tbody>
                    </table>
                </div>
                ${normalizedRows.length === 0 ? '<p class="text-muted mt-2">尚未記錄二次篩選生產資料，可按「新增一筆」補登。</p>' : ''}
            `;
        },
        buildProductionEditorRowHtml(row = {}, escapeHtml) {
            return `
                <tr data-rescreen-production-row>
                    <td><input type="hidden" data-field="id" value="${escapeHtml(String(row.id || ''))}"><input type="text" data-field="card_number" value="${escapeHtml(String(row.card_number || ''))}" placeholder="卡號"></td>
                    <td><input type="number" min="0" step="0.01" data-field="weight_kg" value="${escapeHtml(String(row.weight_kg ?? ''))}"></td>
                    <td><input type="date" data-field="production_date" value="${escapeHtml(String(row.production_date || ''))}"></td>
                    <td><input type="time" data-field="production_time" value="${escapeHtml(String(row.production_time || ''))}"></td>
                    <td><input type="text" data-field="machine_type" value="${escapeHtml(String(row.machine_type || row.machine_name || ''))}" placeholder="機台"></td>
                    <td><input type="text" data-field="tool_name" value="${escapeHtml(String(row.tool_name || ''))}" placeholder="載具"></td>
                    <td><input type="number" min="0" step="0.001" data-field="tool_weight_kg" value="${escapeHtml(String(row.tool_weight_kg ?? ''))}"></td>
                    <td><input type="text" data-field="notes" value="${escapeHtml(String(row.notes || ''))}" placeholder="備註"></td>
                    <td><button type="button" class="btn text" data-action="remove-production-record" title="刪除"><i class="fas fa-trash"></i></button></td>
                </tr>
            `;
        },
        collectProductionRecordRows(editor) {
            if (!editor) return [];
            return Array.from(editor.querySelectorAll('[data-rescreen-production-row]')).map((row) => ({
                id: row.querySelector('[data-field="id"]')?.value || '',
                card_number: row.querySelector('[data-field="card_number"]')?.value || '',
                weight_kg: row.querySelector('[data-field="weight_kg"]')?.value || '',
                production_date: row.querySelector('[data-field="production_date"]')?.value || '',
                production_time: row.querySelector('[data-field="production_time"]')?.value || '',
                machine_type: row.querySelector('[data-field="machine_type"]')?.value || '',
                tool_name: row.querySelector('[data-field="tool_name"]')?.value || '',
                tool_weight_kg: row.querySelector('[data-field="tool_weight_kg"]')?.value || '',
                notes: row.querySelector('[data-field="notes"]')?.value || '',
                production_source_mode: 'manual',
            }));
        }
    };
    registerModuleInitializer('production_records', window.initializeProductionRecordsModule);
    // 系統設定模組
    registerModuleInitializer('lookup_domains', window.initializeLookupDomainsModule);
    registerModuleInitializer('number_sequences', window.initializeNumberSequencesModule);
    registerModuleInitializer('system_parameters', window.initializeSystemParametersModule);
    registerModuleInitializer('security_settings', window.initializeSecuritySettingsModule);
    registerModuleInitializer('dashboard_calendar_events', window.initializeDashboardCalendarEventsModule);
    registerModuleInitializer('calendar_event_participants', window.initializeCalendarEventParticipantsModule);
    registerModuleInitializer('calendar_event_reminders', window.initializeCalendarEventRemindersModule);
    registerModuleInitializer('domain_event_outbox', window.initializeDomainEventOutboxModule);
    // 通知與訊息模組
    registerModuleInitializer('notifications', window.initializeNotificationsModule);
    registerModuleInitializer('messages', window.initializeMessagesModule);
    // 列印報表說明模組
    registerModuleInitializer('report_descriptions', window.initializeReportDescriptionsModule);

    // Restore previously opened tabs and active tab from localStorage
    function restoreTabsState() {
        const savedTabs = loadOpenTabs();
        const savedActiveTab = loadActiveTab();
        const accessibleTabs = savedTabs.filter(tab => canAccessModule(tab.id));

        if (accessibleTabs.length > 0) {
            // Restore all saved tabs
            accessibleTabs.forEach(tab => {
                openTab(tab.id, tab.title, tab.contentUrl, { silentDenied: true });
            });

            // Restore active tab if it exists
            if (savedActiveTab && accessibleTabs.some(tab => tab.id === savedActiveTab)) {
                switchTab(savedActiveTab);
            }
        } else {
            // 如果沒有已儲存的分頁，預設開啟 Dashboard
            openTab('dashboard', '系統儀表板', 'modules/dashboard.html');
        }
    }

    // Initialize tab state restoration
    restoreTabsState();
    observeOperationActionButtons();
    scheduleOperationActionButtonNormalization(tabContentArea || document);

    document.addEventListener('input', (event) => {
        const tabContent = event.target instanceof Element ? event.target.closest('.tab-content[data-tab-id]') : null;
        if (!tabContent) {
            return;
        }

        if (!shouldHandleUnsavedInputEvent(event)) {
            return;
        }

        const tabId = tabContent.dataset.tabId || '';
        markTabUserInteracted(tabId);
        evaluateTabUnsavedChanges(tabId);
    });

    document.addEventListener('change', (event) => {
        const tabContent = event.target instanceof Element ? event.target.closest('.tab-content[data-tab-id]') : null;
        if (!tabContent) {
            return;
        }

        if (!shouldHandleUnsavedInputEvent(event)) {
            return;
        }

        const tabId = tabContent.dataset.tabId || '';
        markTabUserInteracted(tabId);
        evaluateTabUnsavedChanges(tabId);
    });

    // SPA 分頁內的表單一律交由模組腳本處理，避免漏攔截時觸發原生導頁。
    document.addEventListener('submit', (event) => {
        const form = event.target;
        if (!shouldPreventNativeTabFormSubmit(form)) {
            return;
        }

        event.preventDefault();
    }, true);

    window.addEventListener('beforeunload', (event) => {
        const hasUnsavedTabs = openTabs.some((tab) => hasTrackedUnsavedChanges(tab.id));
        if (!hasUnsavedTabs) {
            return;
        }

        event.preventDefault();
        event.returnValue = '';
    });

    // 暴露 openTab 函數到全域,供其他模組使用
    window.openTab = openTab;
    window.markTabChangesClean = markTabChangesClean;

    /**
     * 開啟指定分頁並傳遞參數（跨模組導航用）
     * @param {string} moduleId - 模組 ID
     * @param {string} title - 分頁標題
     * @param {object} params - 傳遞給目標模組的參數
     */
    window.openTabAndNavigate = function(moduleId, title, params = {}) {
        // 開啟或切換到指定分頁
        openTab(moduleId, title, `modules/${moduleId}.html`);

        // 延遲執行導航邏輯，等待模組載入完成
        setTimeout(() => {
            // 根據不同模組和參數執行對應操作
            if (moduleId === 'shipping_orders' && params.shippingOrderId) {
                if (window.shippingOrdersModule && window.shippingOrdersModule.viewDetail) {
                    window.shippingOrdersModule.viewDetail(params.shippingOrderId);
                }
            } else if (moduleId === 'inventory_items' && params.inventoryItemId) {
                if (window.inventoryItemsModule && window.inventoryItemsModule.viewDetail) {
                    window.inventoryItemsModule.viewDetail(params.inventoryItemId);
                }
            } else if (moduleId === 'orders' && params.orderId) {
                if (window.ordersModule && window.ordersModule.viewDetail) {
                    window.ordersModule.viewDetail(params.orderId);
                }
            } else if (moduleId === 'work_orders' && params.workOrderId) {
                if (window.workOrdersModule && window.workOrdersModule.viewDetail) {
                    window.workOrdersModule.viewDetail(params.workOrderId);
                }
            }
            // 可以繼續擴充其他模組的導航邏輯
        }, 300);
    };

});
