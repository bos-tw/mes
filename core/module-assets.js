(function () {
    'use strict';

    const version = document.documentElement.dataset.assetVersion || 'dev';
    const loaded = new Map();
    const initializers = {
        dashboard: 'initializeDashboardModule', companies: 'initializeCompaniesModule', departments: 'initializeDepartmentsModule',
        employees: 'initializeEmployeesModule', customers: 'initializeCustomersModule', suppliers: 'initializeSuppliersModule',
        tools: 'initializeToolsModule', machines: 'initializeMachinesModule', machine_capabilities: 'initializeMachineCapabilitiesModule',
        screening_services: 'initializeScreeningServicesModule', screening_items: 'initializeScreeningItemsModule',
        roles: 'initializeRolesModule', permissions: 'initializePermissionsModule', role_permissions: 'initializeRolePermissionsModule',
        employee_roles: 'initializeEmployeeRolesModule', audit_logs: 'initializeAuditLogsModule', lookup_domains: 'initializeLookupDomainsModule',
        lookup_values: 'initializeLookupValuesModule', number_sequences: 'initializeNumberSequencesModule',
        basic_settings: 'initializeBasicSettingsModule',
        system_parameters: 'initializeSystemParametersModule', security_settings: 'initializeSecuritySettingsModule',
        report_descriptions: 'initializeReportDescriptionsModule', orders: 'initializeOrdersModule', order_items: 'initializeOrderItemsModule',
        work_orders: 'initializeWorkOrdersModule', production_work_order_schedule: 'initializeProductionWorkOrderScheduleModule',
        work_order_first_piece_dimensions: 'initializeWorkOrderFirstPieceDimensionsModule', work_order_images: 'initializeWorkOrderImagesModule',
        production_records: 'initializeProductionRecordsModule', inventory_items: 'initializeInventoryItemsModule',
        inventory_transactions: 'initializeInventoryTransactionsModule', shipping_orders: 'initializeShippingOrdersModule',
        shipping_order_items: 'initializeShippingOrderItemsModule', return_orders: 'initializeReturnOrdersModule',
        return_order_items: 'initializeReturnOrderItemsModule', rescreen_batches: 'initializeRescreenBatchesModule',
        production_quality_records: 'initializeProductionQualityRecordsModule', defect_history_records: 'initializeDefectHistoryRecordsModule',
        quality_issue_reports: 'initializeQualityIssueReportsModule', shipping_quality_inspections: 'initializeShippingQualityInspectionsModule',
        machine_maintenance_tasks: 'initializeMachineMaintenanceTasksModule', daily_machine_inspections: 'initializeDailyMachineInspectionsModule',
        daily_machine_inspection_items: 'initializeDailyMachineInspectionItemsModule', dashboard_calendar_events: 'initializeDashboardCalendarEventsModule',
        calendar_event_participants: 'initializeCalendarEventParticipantsModule', calendar_event_reminders: 'initializeCalendarEventRemindersModule',
        notifications: 'initializeNotificationsModule', messages: 'initializeMessagesModule'
    };

    const configured = new Set([
        'dashboard', 'companies', 'departments', 'employees', 'customers', 'suppliers', 'tools', 'machines', 'machine_capabilities',
        'screening_services', 'screening_items', 'roles', 'permissions', 'role_permissions', 'employee_roles', 'audit_logs',
        'lookup_domains', 'lookup_values', 'number_sequences', 'system_parameters', 'report_descriptions', 'orders', 'order_items',
        'work_orders', 'work_order_first_piece_dimensions', 'work_order_images', 'production_records', 'inventory_items',
        'inventory_transactions', 'shipping_orders', 'shipping_order_items', 'return_orders', 'return_order_items', 'rescreen_batches',
        'production_quality_records', 'defect_history_records', 'quality_issue_reports', 'shipping_quality_inspections',
        'machine_maintenance_tasks', 'daily_machine_inspections', 'daily_machine_inspection_items', 'dashboard_calendar_events',
        'calendar_event_participants', 'calendar_event_reminders', 'notifications', 'messages'
    ]);

    const extraScripts = {
        orders: ['js/orders/order-item-selection.js'],
        work_orders: ['js/work-orders/api.js']
    };
    const afterScripts = {
        rescreen_batches: ['js/rescreen_batches_execution.js']
    };
    const thirdParty = {
        dashboard: {
            scripts: [
                'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js',
                'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
            ]
        }
    };
    const integrityByUrl = Object.freeze({
        'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js': 'sha384-WfE/vOHqht3KDj6FvpwQUf3UxEPUHoGJ3w1yZ8rhpLWnVigt8HjXL2zXqtcfS7mf',
        'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js': 'sha384-9nhczxUqK87bcKHh20fSQcTGD4qq5GhayNYSYWqwBkINBhOfQLg/P5HG5lF1urn4'
    });

    function assetUrl(path) {
        const separator = path.includes('?') ? '&' : '?';
        return `${path}${separator}v=${encodeURIComponent(version)}`;
    }

    function appendScript(path) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = /^https:\/\//.test(path) ? path : assetUrl(path);
            script.async = false;
            script.dataset.moduleAsset = path;
            if (/^https:\/\//.test(path)) {
                script.crossOrigin = 'anonymous';
                script.referrerPolicy = 'no-referrer';
                if (integrityByUrl[path]) script.integrity = integrityByUrl[path];
            }
            script.onload = resolve;
            script.onerror = () => reject(new Error(`無法載入功能資產：${path}`));
            document.head.appendChild(script);
        });
    }

    function appendStyle(path) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = /^https:\/\//.test(path) ? path : assetUrl(path);
            link.dataset.moduleAsset = path;
            if (/^https:\/\//.test(path)) {
                link.crossOrigin = 'anonymous';
                link.referrerPolicy = 'no-referrer';
                if (integrityByUrl[path]) link.integrity = integrityByUrl[path];
            }
            link.onload = resolve;
            link.onerror = () => reject(new Error(`無法載入樣式資產：${path}`));
            document.head.appendChild(link);
        });
    }

    async function load(moduleId) {
        if (!moduleId || !initializers[moduleId]) return;
        if (loaded.has(moduleId)) return loaded.get(moduleId);

        const promise = (async () => {
            for (const style of thirdParty[moduleId]?.styles || []) {
                await appendStyle(style).catch(error => console.warn(error.message));
            }
            for (const script of thirdParty[moduleId]?.scripts || []) {
                await appendScript(script).catch(error => console.warn(error.message));
            }
            if (moduleId === 'dashboard' && typeof window.Chart === 'undefined') {
                window.Chart = class DashboardChartFallback {
                    static defaults = { font: {} };
                    destroy() {}
                };
                window.AppFeedback?.toast('圖表套件暫時無法使用；工作佇列與統計數字仍可操作。', 'warning', { timeout: 7000 });
            }
            if (configured.has(moduleId)) {
                await appendScript(`core/configs/${moduleId}.config.js`);
            }
            for (const dependency of extraScripts[moduleId] || []) {
                await appendScript(dependency);
            }
            await appendScript(`js/${moduleId}.js`);
            for (const extension of afterScripts[moduleId] || []) {
                await appendScript(extension);
            }
            if (typeof window[initializers[moduleId]] !== 'function') {
                throw new Error(`模組 ${moduleId} 未提供初始化器 ${initializers[moduleId]}`);
            }
        })().catch((error) => {
            loaded.delete(moduleId);
            throw error;
        });

        loaded.set(moduleId, promise);
        return promise;
    }

    window.ModuleAssets = Object.freeze({
        load,
        initializer(moduleId) {
            return window[initializers[moduleId]];
        },
        manifest: Object.freeze({ initializers, configured: Array.from(configured), extraScripts, afterScripts, thirdParty })
    });
})();
