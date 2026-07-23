/**
 * 跨分頁資料同步模組
 * 負責處理不同 Tab 頁面之間的資料同步
 *
 * 使用方式：
 * 1. 發送通知：DataSync.notify('customers', 'updated', data)
 * 2. 帶依賴通知：DataSync.notifyWithDependencies('customers', 'updated', data)
 * 3. 訂閱變更：DataSync.subscribe('orders', callback)
 * 4. 簡化整合：使用 createModuleHelper 建立模組輔助器
 *
 * 模組輔助器使用範例：
 * const helper = DataSync.createModuleHelper('customers', {
 *     onRefresh: () => loadCustomers(state.page),
 *     onDependencyUpdate: (sourceModule) => {
 *         if (sourceModule === 'companies') loadCompanyOptions();
 *     },
 *     debounceMs: 300  // 防抖延遲（可選）
 * });
 *
 * // 在 CRUD 成功後呼叫
 * helper.notifyCreated(data);
 * helper.notifyUpdated(data);
 * helper.notifyDeleted({ id });
 */

const DataSync = (function() {
    'use strict';

    // 事件類型常數
    const EVENT_TYPES = {
        CREATED: 'created',
        UPDATED: 'updated',
        DELETED: 'deleted',
        BULK_UPDATED: 'bulk_updated',
        DEPENDENCY_UPDATED: 'dependency_updated'
    };

    // 已註冊的監聽器
    const listeners = new Map();

    // 模組輔助器快取
    const moduleHelpers = new Map();

    // 已處理事件快取（避免同事件重複處理）
    const processedEvents = new Set();
    const MAX_PROCESSED_EVENTS = 500;

    // 當前 Tab ID（用於識別來源）
    const currentTabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 防抖計時器
    const debounceTimers = new Map();
    let helperInstanceCounter = 0;

    /**
     * 初始化資料同步模組
     */
    function init() {
        // 監聽自訂事件（同一視窗內的分頁同步）
        window.addEventListener('dataSync', handleDataSyncEvent);

        // 監聽 storage 事件（跨瀏覽器分頁同步）
        window.addEventListener('storage', handleStorageEvent);

        console.log('[DataSync] 資料同步模組已初始化, TabId:', currentTabId);
    }

    /**
     * 處理自訂資料同步事件
     * @param {CustomEvent} event
     */
    function handleDataSyncEvent(event) {
        const { module, action, data, sourceTabId, eventId } = event.detail || {};

        if (!module || !action) {
            return;
        }

        // 跳過自己發出的事件（避免自己觸發自己）
        if (sourceTabId === currentTabId) {
            return;
        }

        // 避免重複處理同一事件
        if (isProcessedEvent(eventId)) {
            return;
        }
        markEventProcessed(eventId);

        notifyListeners(module, action, data);
    }

    /**
     * 處理 localStorage 變更事件（跨瀏覽器分頁）
     * @param {StorageEvent} event
     */
    function handleStorageEvent(event) {
        if (event.key !== 'dataSync') return;
        if (!event.newValue) return;

        try {
            const { module, action, data, sourceTabId, eventId } = JSON.parse(event.newValue);

            if (!module || !action) {
                return;
            }

            // 跳過自己發出的事件
            if (sourceTabId === currentTabId) {
                return;
            }

            // 避免重複處理
            if (isProcessedEvent(eventId)) {
                return;
            }
            markEventProcessed(eventId);

            notifyListeners(module, action, data);
        } catch (e) {
            console.error('[DataSync] 解析 storage 事件失敗:', e);
        }
    }

    /**
     * 通知所有相關的監聽器
     * @param {string} module 模組名稱
     * @param {string} action 操作類型
     * @param {any} data 相關資料
     */
    function notifyListeners(module, action, data) {
        console.log(`[DataSync] 收到通知: ${module} - ${action}`);

        // 通知直接監聽該模組的監聽器
        if (listeners.has(module)) {
            listeners.get(module).forEach(callback => {
                try {
                    callback(action, data, module);
                } catch (e) {
                    console.error(`[DataSync] 執行 ${module} 監聽器時發生錯誤:`, e);
                }
            });
        }

        // 通知監聽所有變更的監聯器
        if (listeners.has('*')) {
            listeners.get('*').forEach(callback => {
                try {
                    callback(action, data, module);
                } catch (e) {
                    console.error('[DataSync] 執行全域監聽器時發生錯誤:', e);
                }
            });
        }
    }

    /**
     * 發送資料變更通知
     * @param {string} module 模組名稱（例如：'customers', 'orders'）
     * @param {string} action 操作類型（'created', 'updated', 'deleted', 'bulk_updated'）
     * @param {any} data 變更的資料（可選）
     */
    function notify(module, action, data = null) {
        const timestamp = Date.now();
        const eventId = `${timestamp}_${currentTabId}_${module}_${action}_${Math.random().toString(36).slice(2, 8)}`;

        const eventDetail = {
            module,
            action,
            data,
            timestamp,
            eventId,
            sourceTabId: currentTabId
        };

        // 同一個視窗（多個系統 Tab）直接同步
        markEventProcessed(eventId);
        notifyListeners(module, action, data);

        // 發送自訂事件（同一視窗內的分頁）
        window.dispatchEvent(new CustomEvent('dataSync', {
            detail: eventDetail
        }));

        // 寫入 localStorage 觸發跨瀏覽器分頁同步
        try {
            localStorage.setItem('dataSync', JSON.stringify(eventDetail));
            // 立即移除，避免佔用空間
            localStorage.removeItem('dataSync');
        } catch (e) {
            console.error('[DataSync] 寫入 localStorage 失敗:', e);
        }

        console.log(`[DataSync] 已發送通知: ${module} - ${action}`, data);
    }

    function isProcessedEvent(eventId) {
        if (!eventId) return false;
        return processedEvents.has(eventId);
    }

    function markEventProcessed(eventId) {
        if (!eventId) return;
        processedEvents.add(eventId);

        if (processedEvents.size > MAX_PROCESSED_EVENTS) {
            const oldest = processedEvents.values().next().value;
            if (oldest) {
                processedEvents.delete(oldest);
            }
        }
    }

    /**
     * 註冊資料變更監聽器
     * @param {string|string[]} modules 要監聽的模組名稱，使用 '*' 監聽所有變更
     * @param {Function} callback 回呼函數 (action, data, module) => void
     * @returns {Function} 取消註冊的函數
     */
    function subscribe(modules, callback) {
        if (typeof callback !== 'function') {
            console.error('[DataSync] callback 必須是函數');
            return () => {};
        }

        const moduleList = Array.isArray(modules) ? modules : [modules];

        moduleList.forEach(module => {
            if (!listeners.has(module)) {
                listeners.set(module, new Set());
            }
            listeners.get(module).add(callback);
        });

        console.log(`[DataSync] 已訂閱: ${moduleList.join(', ')}`);

        // 返回取消訂閱的函數
        return function unsubscribe() {
            moduleList.forEach(module => {
                if (listeners.has(module)) {
                    listeners.get(module).delete(callback);
                }
            });
            console.log(`[DataSync] 已取消訂閱: ${moduleList.join(', ')}`);
        };
    }

    /**
     * 模組之間的依賴關係
     * 當某個模組資料變更時，相關模組也需要更新
     */
    const MODULE_DEPENDENCIES = {
        // 公司變更
        'companies': ['employees', 'customers', 'suppliers'],
        // 客戶變更時，訂單、篩選服務需要更新
        'customers': ['orders', 'screening_services', 'return_orders', 'rescreen_batches'],
        // 供應商變更
        'suppliers': ['orders', 'inventory_items'],
        // 篩選項目變更
        'screening_items': ['order_items', 'screening_services', 'inventory_items'],
        // 篩選服務變更
        'screening_services': ['orders', 'order_items'],
        // 員工變更
        'employees': ['work_orders', 'orders', 'calendar_event_participants', 'calendar_event_reminders', 'work_order_first_piece_dimensions', 'messages', 'notifications', 'employee_roles', 'daily_machine_inspections', 'daily_machine_inspection_items', 'machine_maintenance_tasks', 'production_records', 'quality_issue_reports', 'shipping_quality_inspections'],
        // 部門變更
        'departments': ['employees', 'notifications', 'quality_issue_reports'],
        // 角色變更
        'roles': ['notifications', 'employee_roles', 'role_permissions'],
        // 公告通知變更（儀表板公告區需即時更新）
        'notifications': ['dashboard'],
        // 權限變更
        'permissions': ['role_permissions'],
        // 機台變更
        'machines': ['work_orders', 'machine_maintenance_tasks', 'daily_machine_inspections', 'production_records', 'production_work_order_schedule'],
        // 機台能力變更
        'machine_capabilities': ['machines', 'work_orders', 'production_work_order_schedule'],
        // 工具變更
        'tools': ['work_orders', 'order_items', 'defect_history_records'],
        // 訂單變更
        'orders': ['order_items', 'work_orders', 'dashboard'],
        // 訂單項目變更
        'order_items': ['orders', 'work_orders', 'inventory_items', 'shipping_order_items', 'return_order_items', 'defect_history_records'],
        // 工單變更
        'work_orders': ['order_items', 'orders', 'work_order_images', 'work_order_first_piece_dimensions', 'inventory_items', 'inventory_transactions', 'dashboard', 'production_records', 'production_work_order_schedule', 'defect_history_records', 'rescreen_batches'],
        // 工單製程子資源變更（階段、機台、結果、圖片與轉流都必須回刷工單及其下游）
        'work_order_stages': ['work_orders', 'production_work_order_schedule'],
        'work_order_machine_runs': ['work_orders', 'production_work_order_schedule'],
        'work_order_machine_results': ['work_orders', 'inventory_items', 'inventory_transactions', 'defect_history_records'],
        'work_order_stage_transfers': ['work_orders', 'inventory_items', 'inventory_transactions', 'shipping_orders', 'shipping_order_items'],
        'work_order_machine_result_images': ['work_orders'],
        'inventory_packages': ['inventory_items', 'shipping_orders', 'shipping_order_items'],
        'shipping_order_item_packages': ['shipping_orders', 'shipping_order_items', 'inventory_items'],
        // 出貨單變更
        'shipping_orders': ['shipping_order_items', 'inventory_items', 'order_items', 'inventory_transactions', 'return_orders', 'return_order_items', 'dashboard', 'shipping_quality_inspections', 'defect_history_records'],
        // 出貨單項目變更（會影響出貨單狀態、客戶批號出貨狀態與庫存紀錄）
        'shipping_order_items': ['shipping_orders', 'order_items', 'inventory_items', 'inventory_transactions', 'return_orders', 'return_order_items'],
        // 退貨單變更（會影響出貨單/出貨明細退貨狀態、庫存與異動紀錄）
        'return_orders': ['return_order_items', 'order_items', 'inventory_items', 'inventory_transactions', 'shipping_orders', 'shipping_order_items', 'rescreen_batches'],
        'return_order_items': ['return_orders', 'order_items', 'shipping_orders', 'shipping_order_items'],
        // 二次重篩案件變更（會影響退貨單追溯、工單掛點與後續庫存來源鏈）
        'rescreen_batches': ['return_orders', 'work_orders', 'inventory_items', 'defect_history_records'],
        // 庫存項目變更（會影響工單轉庫存按鈕、出貨可分配狀態與庫存異動紀錄）
        'inventory_items': ['work_orders', 'order_items', 'inventory_transactions', 'shipping_orders', 'shipping_order_items'],
        // 行事曆事件變更
        'dashboard_calendar_events': ['calendar_event_participants', 'calendar_event_reminders', 'dashboard'],
        // 每日機台檢驗變更
        'daily_machine_inspections': ['daily_machine_inspection_items'],
        // 首件尺寸變更（由首件檢驗模組獨立修改時，工單需同步更新）
        'work_order_first_piece_dimensions': ['work_orders'],
        // 工單圖片變更（會影響工單列表顯示/附件操作狀態）
        'work_order_images': ['work_orders'],
        // 工單現場圖片變更（手機上傳後，工單相關畫面需刷新）
        'work_order_pre_production_images': ['work_orders'],
        'work_order_completion_images': ['work_orders'],
        'work_order_defect_images': ['work_orders'],
        'work_order_tool_condition_images': ['work_orders'],
        // 每日機台檢驗項目變更 → 上層檢驗紀錄需刷新
        'daily_machine_inspection_items': ['daily_machine_inspections'],
        // 員工角色指派變更 → 員工清單、角色清單需刷新
        'employee_roles': ['employees', 'roles'],
        // 角色權限指派變更 → 角色清單、權限清單需刷新
        'role_permissions': ['roles', 'permissions'],
        // 查詢網域變更 → 查詢值清單需刷新
        'lookup_domains': ['lookup_values'],
        // 出貨品質檢驗變更 → 出貨單需刷新
        'shipping_quality_inspections': ['shipping_orders'],
        // 機台保養任務變更 → 機台清單需刷新
        'machine_maintenance_tasks': ['machines'],
        // 行事曆提醒變更 → 行事曆事件需刷新
        'calendar_event_reminders': ['dashboard_calendar_events'],
        // 生產品質記錄變更 → 工單需刷新
        'production_quality_records': ['work_orders'],
        // 生產紀錄變更、工單/出貨相關變更 → 不良品歷史需同步刷新
        'production_records': ['defect_history_records'],
        // 品質異常報告變更 → 儀表板需刷新
        'quality_issue_reports': ['dashboard'],
        // Lookup values 變更（影響所有使用下拉選單的模組）
        'lookup_values': ['orders', 'customers', 'suppliers', 'employees', 'work_orders', 'screening_items']
    };

    /**
     * 取得某模組變更時，需要連帶更新的模組列表
     * @param {string} module
     * @returns {string[]}
     */
    function getDependentModules(module) {
        return MODULE_DEPENDENCIES[module] || [];
    }

    /**
     * 註冊或更新模組依賴關係
     * @param {string} module
     * @param {string[]} dependents
     */
    function registerDependency(module, dependents) {
        MODULE_DEPENDENCIES[module] = dependents;
    }

    /**
     * 新增模組的依賴
     * @param {string} module
     * @param {string|string[]} dependents
     */
    function addDependency(module, dependents) {
        if (!MODULE_DEPENDENCIES[module]) {
            MODULE_DEPENDENCIES[module] = [];
        }
        const deps = Array.isArray(dependents) ? dependents : [dependents];
        deps.forEach(dep => {
            if (!MODULE_DEPENDENCIES[module].includes(dep)) {
                MODULE_DEPENDENCIES[module].push(dep);
            }
        });
    }

    /**
     * 發送帶有依賴更新的通知
     * 會同時通知依賴該模組的其他模組
     * @param {string} module
     * @param {string} action
     * @param {any} data
     */
    function notifyWithDependencies(module, action, data = null) {
        // 先通知主要模組
        notify(module, action, data);

        // 再通知依賴模組（使用 'dependency_updated' 標記）
        const dependents = getDependentModules(module);
        dependents.forEach(depModule => {
            notify(depModule, EVENT_TYPES.DEPENDENCY_UPDATED, {
                sourceModule: module,
                sourceAction: action,
                sourceData: data
            });
        });
    }

    /**
     * 建立模組輔助器 - 簡化各模組整合資料同步的方式
     * @param {string} moduleName 模組名稱
     * @param {Object} options 選項
     * @param {Function} options.onRefresh 資料重新載入函數
     * @param {Function} options.onDependencyUpdate 依賴更新時的處理函數 (sourceModule, sourceAction, sourceData) => void
     * @param {number} options.debounceMs 防抖延遲毫秒數，預設 300
     * @param {boolean} options.withDependencies 發送通知時是否包含依賴，預設 true
     * @returns {Object} 模組輔助器物件
     */
    function createModuleHelper(moduleName, options = {}) {
        const {
            onRefresh = null,
            onDependencyUpdate = null,
            debounceMs = 300,
            withDependencies = true
        } = options;
        const helperInstanceId = `${moduleName}_${++helperInstanceCounter}`;

        // 防抖處理的重新載入函數
        function debouncedRefresh() {
            const timerKey = `refresh_${helperInstanceId}`;
            if (debounceTimers.has(timerKey)) {
                clearTimeout(debounceTimers.get(timerKey));
            }
            debounceTimers.set(timerKey, setTimeout(() => {
                if (typeof onRefresh === 'function') {
                    console.log(`[DataSync] 觸發 ${moduleName} 資料重新載入`);
                    onRefresh();
                }
                debounceTimers.delete(timerKey);
            }, debounceMs));
        }

        // 訂閱本模組的變更事件
        const unsubscribe = subscribe(moduleName, (action, data, sourceModule) => {
            if (action === EVENT_TYPES.DEPENDENCY_UPDATED) {
                // 依賴模組更新
                if (typeof onDependencyUpdate === 'function') {
                    onDependencyUpdate(data.sourceModule, data.sourceAction, data.sourceData);
                } else if (typeof onRefresh === 'function') {
                    // 預設行為：重新載入資料
                    debouncedRefresh();
                }
            } else {
                // 本模組資料變更
                debouncedRefresh();
            }
        });

        // 輔助器物件
        const helper = {
            moduleName,

            // 通知資料已新增
            notifyCreated(data = null) {
                if (withDependencies) {
                    notifyWithDependencies(moduleName, EVENT_TYPES.CREATED, data);
                } else {
                    notify(moduleName, EVENT_TYPES.CREATED, data);
                }
            },

            // 通知資料已更新
            notifyUpdated(data = null) {
                if (withDependencies) {
                    notifyWithDependencies(moduleName, EVENT_TYPES.UPDATED, data);
                } else {
                    notify(moduleName, EVENT_TYPES.UPDATED, data);
                }
            },

            // 通知資料已刪除
            notifyDeleted(data = null) {
                if (withDependencies) {
                    notifyWithDependencies(moduleName, EVENT_TYPES.DELETED, data);
                } else {
                    notify(moduleName, EVENT_TYPES.DELETED, data);
                }
            },

            // 通知批量更新
            notifyBulkUpdated(data = null) {
                if (withDependencies) {
                    notifyWithDependencies(moduleName, EVENT_TYPES.BULK_UPDATED, data);
                } else {
                    notify(moduleName, EVENT_TYPES.BULK_UPDATED, data);
                }
            },

            // 手動觸發重新載入
            refresh() {
                debouncedRefresh();
            },

            // 取消訂閱
            destroy() {
                unsubscribe();
                moduleHelpers.delete(moduleName);
            }
        };

        // 快取輔助器
        moduleHelpers.set(moduleName, helper);

        return helper;
    }

    /**
     * 取得已建立的模組輔助器
     * @param {string} moduleName
     * @returns {Object|null}
     */
    function getModuleHelper(moduleName) {
        return moduleHelpers.get(moduleName) || null;
    }

    /**
     * 帶防抖的訂閱 — 避免高頻事件觸發重複重新載入。
     * 建議所有直接訂閱的模組使用此方法取代 subscribe()。
     *
     * @param {string} moduleName 要訂閱的模組名稱
     * @param {Function} callback 回呼函數
     * @param {number} debounceMs 防抖延遲毫秒數，預設 300
     * @returns {Function} 取消訂閱的函數
     */
    function subscribeDebounced(moduleName, callback, debounceMs = 300) {
        const timerKey = `sub_${moduleName}_${Date.now()}`;
        return subscribe(moduleName, function (action, data, sourceModule) {
            if (debounceTimers.has(timerKey)) {
                clearTimeout(debounceTimers.get(timerKey));
            }
            debounceTimers.set(timerKey, setTimeout(function () {
                callback(action, data, sourceModule);
                debounceTimers.delete(timerKey);
            }, debounceMs));
        });
    }

    // 公開 API
    return {
        init,
        notify,
        notifyWithDependencies,
        subscribe,
        subscribeDebounced,
        getDependentModules,
        registerDependency,
        addDependency,
        createModuleHelper,
        getModuleHelper,
        EVENT_TYPES,
        get currentTabId() { return currentTabId; }
    };
})();

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', function() {
    DataSync.init();
});
