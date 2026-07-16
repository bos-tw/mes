/**
 * 通用欄位顯示/隱藏管理器 v2.0
 *
 * 設計原則：
 * 1. 自動初始化 - 使用 MutationObserver 監聽 DOM，模組載入時自動初始化
 * 2. 零耦合 - 各模組 JS 不需要任何欄位管理器相關程式碼
 * 3. 標記驅動 - 只需在 HTML 中加入正確的 data 屬性即可
 * 4. 防重複 - 使用 WeakMap 追蹤已初始化的元素，避免重複初始化
 *
 * ============================================================
 * 【新增模組時必讀】請參考 .github/copilot-instructions.md
 * ============================================================
 *
 * 快速指南：
 * 1. 在模組 HTML 加入：
 *    - data-module="模組名稱"
 *    - data-模組名稱-column-selector (欄位選擇器)
 *    - data-模組名稱-table (表格)
 * 2. 表格更新後呼叫 manager.onTableUpdated()
 *
 * 注意：模組名稱用 snake_case，data 屬性用 kebab-case
 * 例如：order_items -> data-order-items-table
 */

(function() {
    'use strict';

    // 使用 WeakMap 追蹤已初始化的模組元素，避免記憶體洩漏
    const initializedModules = new WeakMap();

    /**
     * 欄位管理器類別
     */
    class ColumnManager {
        /**
         * @param {string} moduleName - 模組名稱
         * @param {HTMLElement} moduleRoot - 模組根元素
         */
        constructor(moduleName, moduleRoot) {
            this.moduleName = moduleName;
            this.moduleRoot = moduleRoot;
            this.storageKey = `${moduleName}_visible_columns`;

            // 將底線轉換為連字號用於 data 屬性
            const dataAttrName = moduleName.replace(/_/g, '-');

            // 在模組範圍內查找元素
            this.columnSelector = moduleRoot.querySelector(`[data-${dataAttrName}-column-selector]`);
            this.table = moduleRoot.querySelector(`[data-${dataAttrName}-table]`);

            if (!this.columnSelector || !this.table) {
                // 不是所有模組都有欄位設定功能，這是正常的
                this.initialized = false;
                return;
            }

            this.initialized = true;
            this._init();
        }

        _init() {
            this._loadSettings();
            this._bindEvents();
            this.applyColumnVisibility();
            console.debug(`[ColumnManager] ${this.moduleName}: 初始化完成`);
        }

        _bindEvents() {
            // 切換欄位選擇器
            this._bindAction('toggle-column-selector', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._toggleColumnSelector(e.currentTarget);
            });

            // 關閉欄位選擇器
            this._bindAction('close-column-selector', () => {
                this._closeColumnSelector();
            });

            // 全選
            this._bindAction('select-all-columns', () => {
                this._selectAll();
            });

            // 全不選
            this._bindAction('deselect-all-columns', () => {
                this._deselectAll();
            });

            // 套用設定
            this._bindAction('apply-column-settings', () => {
                this._applySettings();
            });

            // 點擊外部關閉（使用 capture 階段以確保優先處理）
            this._outsideClickHandler = (e) => {
                if (!this.columnSelector) return;

                // 統一使用 hidden class 判斷可見性
                if (this.columnSelector.classList.contains('hidden')) return;

                // 檢查點擊是否在選擇器內部或 toggle 按鈕上
                if (this.columnSelector.contains(e.target)) return;
                if (e.target.closest('[data-action="toggle-column-selector"]')) return;

                this._closeColumnSelector();
            };
            document.addEventListener('click', this._outsideClickHandler, true);
        }

        /**
         * 在模組範圍內綁定 data-action 事件
         */
        _bindAction(actionName, handler) {
            const elements = this.moduleRoot.querySelectorAll(`[data-action="${actionName}"]`);
            elements.forEach(el => {
                el.addEventListener('click', handler);
            });
        }

        _toggleColumnSelector(triggerButton) {
            if (this.columnSelector) {
                // 統一用 hidden class 控制顯隱，不設定 inline display style
                // 這樣 CSS 的 display: flex 才能正確生效，避免覆蓋為 block 導致佈局錯誤
                const isHidden = this.columnSelector.classList.contains('hidden');

                if (isHidden) {
                    this.columnSelector.classList.remove('hidden');
                    this.columnSelector.style.display = '';  // 清除 inline style，讓 CSS flex 生效
                    this._positionColumnSelector(triggerButton);
                } else {
                    this._closeColumnSelector();
                }
            }
        }

        _positionColumnSelector(triggerButton) {
            if (!this.columnSelector || !triggerButton) return;

            const triggerRect = triggerButton.getBoundingClientRect();
            const panelWidth = this.columnSelector.offsetWidth || 280;
            const panelHeight = this.columnSelector.offsetHeight || 320;
            const viewportPadding = 12;
            const left = Math.max(
                viewportPadding,
                Math.min(triggerRect.right - panelWidth, window.innerWidth - panelWidth - viewportPadding)
            );
            const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
            const spaceAbove = triggerRect.top - viewportPadding;
            const openAbove = spaceBelow < Math.min(panelHeight, 240) && spaceAbove > spaceBelow;
            const availableHeight = Math.max(160, openAbove ? spaceAbove - 8 : spaceBelow - 8);
            const top = openAbove
                ? Math.max(viewportPadding, triggerRect.top - Math.min(panelHeight, availableHeight) - 8)
                : triggerRect.bottom + 8;

            this.columnSelector.style.top = `${top}px`;
            this.columnSelector.style.left = `${left}px`;
            this.columnSelector.style.right = 'auto';
            this.columnSelector.style.transform = 'none';
            this.columnSelector.style.maxHeight = `${availableHeight}px`;
        }

        _closeColumnSelector() {
            if (this.columnSelector) {
                this.columnSelector.classList.add('hidden');
                this.columnSelector.style.display = '';  // 清除 inline style
                this.columnSelector.style.top = '';
                this.columnSelector.style.left = '';
                this.columnSelector.style.right = '';
                this.columnSelector.style.transform = '';
                this.columnSelector.style.maxHeight = '';
            }
        }

        _selectAll() {
            const checkboxes = this.columnSelector.querySelectorAll('input[type="checkbox"][data-column]');
            checkboxes.forEach(cb => cb.checked = true);
        }

        _deselectAll() {
            const checkboxes = this.columnSelector.querySelectorAll('input[type="checkbox"][data-column]');
            checkboxes.forEach(cb => cb.checked = false);
        }

        _applySettings() {
            this._saveSettings();
            this.applyColumnVisibility();
            this._closeColumnSelector();
        }

        _loadSettings() {
            try {
                const saved = localStorage.getItem(this.storageKey);
                if (saved) {
                    const visibleColumns = JSON.parse(saved);
                    const checkboxes = this.columnSelector.querySelectorAll('input[type="checkbox"][data-column]');
                    checkboxes.forEach(cb => {
                        cb.checked = visibleColumns.includes(cb.dataset.column);
                    });
                }
            } catch (error) {
                console.warn(`[ColumnManager] ${this.moduleName}: 載入設定失敗`, error);
            }
        }

        _saveSettings() {
            try {
                const checkboxes = this.columnSelector.querySelectorAll('input[type="checkbox"][data-column]:checked');
                const visibleColumns = Array.from(checkboxes).map(cb => cb.dataset.column);
                localStorage.setItem(this.storageKey, JSON.stringify(visibleColumns));
            } catch (error) {
                console.warn(`[ColumnManager] ${this.moduleName}: 儲存設定失敗`, error);
            }
        }

        /**
         * 套用欄位可見性到表格
         * 這是公開方法，供外部在表格更新後調用
         */
        applyColumnVisibility() {
            if (!this.table || !this.columnSelector) return;

            const checkboxes = this.columnSelector.querySelectorAll('input[type="checkbox"][data-column]');
            const allThs = Array.from(this.table.querySelectorAll('thead th'));

            checkboxes.forEach(checkbox => {
                const column = checkbox.dataset.column;
                const isVisible = checkbox.checked;

                // 找到對應的 th 元素
                const thElement = allThs.find(th => th.dataset.column === column);
                if (!thElement) return;

                // 計算這個 th 在所有 th 中的索引位置
                const thIndex = allThs.indexOf(thElement);

                // 顯示/隱藏 th
                thElement.classList.toggle('hidden-column', !isVisible);

                // 顯示/隱藏對應的 td
                const tbody = this.table.tBodies && this.table.tBodies[0] ? this.table.tBodies[0] : this.table.querySelector('tbody');
                const trs = tbody ? Array.from(tbody.rows) : [];
                trs.forEach(tr => {
                    if (tr.dataset.columnManagerSkip === 'true') {
                        return;
                    }

                    const tds = tr.querySelectorAll('td');
                    const td = tds[thIndex];
                    if (td) {
                        td.classList.toggle('hidden-column', !isVisible);
                    }
                });
            });
        }

        /**
         * 當表格內容更新時調用此方法
         * 使用 requestAnimationFrame 確保 DOM 已更新
         */
        onTableUpdated() {
            requestAnimationFrame(() => {
                this.applyColumnVisibility();
            });
        }

        /**
         * 清理資源（當模組被移除時調用）
         */
        destroy() {
            if (this._outsideClickHandler) {
                document.removeEventListener('click', this._outsideClickHandler, true);
            }
        }
    }

    /**
     * 欄位管理器自動初始化系統
     */
    const ColumnManagerAutoInit = {
        /**
         * 嘗試初始化指定的模組元素
         */
        initModule(moduleRoot) {
            // 檢查是否已初始化
            if (initializedModules.has(moduleRoot)) {
                return initializedModules.get(moduleRoot);
            }

            const moduleName = moduleRoot.dataset.module;
            if (!moduleName) return null;

            // 建立欄位管理器
            const manager = new ColumnManager(moduleName, moduleRoot);

            if (manager.initialized) {
                // 儲存到 WeakMap
                initializedModules.set(moduleRoot, manager);

                // 同時設定到 window 供外部存取（向後相容）
                const managerKey = this._getManagerKey(moduleName);
                window[managerKey] = manager;

                return manager;
            }

            return null;
        },

        /**
         * 取得管理器在 window 上的 key
         * 既有模組沿用舊全域名稱；新模組自動轉成 camelCase。
         */
        _getManagerKey(moduleName) {
            // 模組名稱 -> window 變數名稱 (camelCase + ColumnManager)
            const keyMap = {
                'customers': 'customerColumnManager',
                'suppliers': 'supplierColumnManager',
                'orders': 'orderColumnManager',
                'order_items': 'orderItemColumnManager',
                'employees': 'employeeColumnManager',
                'machines': 'machineColumnManager',
                'tools': 'toolColumnManager',
                'screening_items': 'screeningItemColumnManager',
                'screening_services': 'screeningServiceColumnManager',
                'work_orders': 'workOrderColumnManager',
                'inventory_items': 'inventoryItemColumnManager',
                'audit_logs': 'auditLogColumnManager',
                'companies': 'companyColumnManager',
                'departments': 'departmentColumnManager',
                'shipping_orders': 'shippingOrderColumnManager',
                'shipping_order_items': 'shippingOrderItemColumnManager',
                'inventory_transactions': 'inventoryTransactionColumnManager',
                'production_quality_records': 'productionQualityRecordsColumnManager',
                'defect_history_records': 'defectHistoryRecordColumnManager',
                'return_orders': 'returnOrderColumnManager',
                'roles': 'roleColumnManager',
                'permissions': 'permissionColumnManager',
                'role_permissions': 'rolePermissionColumnManager',
                'lookup_domains': 'lookupDomainColumnManager',
                'number_sequences': 'numberSequenceColumnManager',
                'employee_roles': 'employeeRoleColumnManager',
                'calendar_event_participants': 'calendarEventParticipantColumnManager',
                'calendar_event_reminders': 'calendarEventReminderColumnManager',
                'daily_machine_inspection_items': 'dailyMachineInspectionItemColumnManager',
                'daily_machine_inspections': 'dailyMachineInspectionColumnManager',
                'dashboard_calendar_events': 'dashboardCalendarEventColumnManager',
                'machine_maintenance_tasks': 'machineMaintenanceTaskColumnManager',
                'production_records': 'productionRecordColumnManager',
                'quality_issue_reports': 'qualityIssueReportColumnManager',
                'shipping_quality_inspections': 'shippingQualityInspectionColumnManager',
                'system_parameters': 'systemParameterColumnManager',
                'work_order_first_piece_dimensions': 'workOrderFirstPieceDimensionColumnManager'
                // 新增模組時在此加入
            };
            const camelName = moduleName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            return keyMap[moduleName] || `${camelName}ColumnManager`;
        },

        /**
         * 掃描並初始化所有模組
         */
        scanAndInit() {
            document.querySelectorAll('[data-module]').forEach(moduleRoot => {
                this.initModule(moduleRoot);
            });
        },

        /**
         * 取得指定模組的管理器
         */
        getManager(moduleName) {
            const moduleRoot = document.querySelector(`[data-module="${moduleName}"]`);
            if (moduleRoot && initializedModules.has(moduleRoot)) {
                return initializedModules.get(moduleRoot);
            }
            return null;
        },

        /**
         * 取得指定元素的管理器
         */
        getManagerByElement(moduleRoot) {
            return initializedModules.get(moduleRoot) || null;
        }
    };

    /**
     * 設定 MutationObserver 監聽 DOM 變化
     */
    function setupObserver() {
        const tabContentArea = document.getElementById('tab-content-area');
        if (!tabContentArea) {
            // 如果還沒有 tab-content-area，稍後重試
            setTimeout(setupObserver, 100);
            return;
        }

        const observer = new MutationObserver((mutations) => {
            let needsScan = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 檢查新增的節點是否是模組或包含模組
                            if (node.dataset?.module || node.querySelector?.('[data-module]')) {
                                needsScan = true;
                                break;
                            }
                        }
                    }
                }
                if (needsScan) break;
            }

            if (needsScan) {
                // 使用 requestAnimationFrame 確保 DOM 完全更新
                requestAnimationFrame(() => {
                    ColumnManagerAutoInit.scanAndInit();
                });
            }
        });

        observer.observe(tabContentArea, {
            childList: true,
            subtree: true
        });

        console.debug('[ColumnManager] MutationObserver 已啟動');
    }

    /**
     * 初始化入口
     */
    function init() {
        // 先掃描現有的模組
        ColumnManagerAutoInit.scanAndInit();

        // 設定 Observer 監聽新載入的模組
        setupObserver();
    }

    // 根據 DOM 狀態決定初始化時機
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========================================
    // 向後相容 API（保留給現有程式碼使用）
    // ========================================

    /**
     * 建立向後相容的初始化函數
     * @deprecated 新程式碼不需要呼叫，會自動初始化
     */
    function createLegacyInit(moduleName) {
        return function(container = null) {
            let moduleRoot = null;

            if (container) {
                moduleRoot = container.querySelector(`[data-module="${moduleName}"]`);
                if (!moduleRoot && container.matches?.(`[data-module="${moduleName}"]`)) {
                    moduleRoot = container;
                }
            }

            if (!moduleRoot) {
                moduleRoot = document.querySelector(`[data-module="${moduleName}"]`);
            }

            if (moduleRoot) {
                return ColumnManagerAutoInit.initModule(moduleRoot);
            }
            return null;
        };
    }

    // 保留舊的 API 供向後相容（實際上會被自動初始化處理）
    window.initCustomerColumnManager = createLegacyInit('customers');
    window.initSupplierColumnManager = createLegacyInit('suppliers');
    window.initOrderColumnManager = createLegacyInit('orders');
    window.initOrderItemColumnManager = createLegacyInit('order_items');

    // 匯出新的 API
    window.ColumnManager = ColumnManager;
    window.ColumnManagerAutoInit = ColumnManagerAutoInit;

})();

