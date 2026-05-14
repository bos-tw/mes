// Dashboard 模組 v3.0 - 統一系統風格
(function() {
    'use strict';

    let calendar = null;
    let moduleRoot = null;
    let isInitialized = false;
    let currentCalendarFilter = 'all';
    let allCalendarEvents = [];
    let dataSyncHelper = null;

    // 公告跳馬燈狀態
    let announcementList = [];
    let announcementIndex = 0;
    let announcementTimer = null;

    // 圖表實例
    let charts = {
        ordersStatus: null,
        workOrdersStatus: null,
        shippingStatus: null,
        monthlyTrends: null,
        topCustomers: null
    };

    // ===========================
    // 配置與工具函數
    // ===========================

    function getConfig() {
        if (typeof ModuleConfig !== 'undefined' && ModuleConfig.get) {
            return ModuleConfig.get('dashboard') || {};
        }
        return {};
    }

    function getChartColors() {
        return {
            primary: '#1a73e8',
            success: '#34a853',
            warning: '#f9ab00',
            danger: '#ea4335',
            info: '#4285f4',
            purple: '#9334e6',
            teal: '#00bcd4'
        };
    }

    function getStatusColors() {
        return {
            draft: '#9e9e9e',
            pending: '#f9ab00',
            confirmed: '#4285f4',
            in_production: '#9334e6',
            in_progress: '#1a73e8',
            shipped: '#00bcd4',
            delivered: '#00897b',
            completed: '#34a853',
            cancelled: '#ea4335',
            paused: '#ff6d00',
            closed: '#607d8b'
        };
    }

    function getApiPath(name) {
        const paths = {
            ordersStats: 'api/dashboard/orders_stats.php',
            workOrdersStats: 'api/dashboard/work_orders_stats.php',
            shippingOrdersStats: 'api/dashboard/shipping_orders_stats.php',
            chartsData: 'api/dashboard/charts_data.php',
            calendarEvents: 'api/dashboard/calendar_events.php'
        };
        return `${window.APP_BASE_PATH}${paths[name]}`;
    }

    // ===========================
    // 選擇器函數
    // ===========================

    function getElement(name) {
        return moduleRoot.querySelector(`[data-dashboard-${name}]`);
    }

    function getChart(name) {
        return moduleRoot.querySelector(`[data-chart="${name}"]`);
    }

    function getList(name) {
        return moduleRoot.querySelector(`[data-list="${name}"]`);
    }

    // 簡化選擇器 - 用於統計數據元素
    function getStatElement(name) {
        return moduleRoot.querySelector(`[data-dashboard-${name}]`);
    }

    // ===========================
    // 主要初始化
    // ===========================

    function initializeDashboardModule(container) {
        moduleRoot = container.querySelector('[data-module="dashboard"]');
        if (!moduleRoot) {
            console.error('Dashboard: 找不到模組根元素');
            return;
        }

        const wasInitialized = moduleRoot.dataset.initialised === 'true';

        if (wasInitialized) {
            setTimeout(() => {
                if (calendar) {
                    calendar.updateSize();
                    calendar.refetchEvents();
                } else {
                    initializeCalendar();
                }
                loadDashboardData();
            }, 50);
            return;
        }

        moduleRoot.dataset.initialised = 'true';
        isInitialized = true;

        // 初始化篩選器
        initializeFilters();

        // 初始化圖表
        initializeCharts();

        // 綁定事件
        bindEvents();

        if (typeof DataSync !== 'undefined' && !dataSyncHelper) {
            dataSyncHelper = DataSync.createModuleHelper('dashboard', {
                onDependencyUpdate: (sourceModule) => {
                    if (sourceModule === 'notifications') {
                        loadAnnouncements();
                        return;
                    }
                    loadDashboardData();
                    if (calendar) {
                        calendar.refetchEvents();
                    }
                },
                onRefresh: () => {
                    loadDashboardData();
                    loadAnnouncements();
                    if (calendar) {
                        calendar.refetchEvents();
                    }
                }
            });
        }

        // 初始化行事曆
        setTimeout(() => initializeCalendar(), 150);

        // 載入資料
        loadDashboardData();

        // 載入公告跳馬燈
        loadAnnouncements();
    }

    // ===========================
    // 篩選器初始化
    // ===========================

    function initializeFilters() {
        const yearSelect = getElement('year');
        const monthSelect = getElement('month');
        const startDateInput = getElement('start-date');
        const endDateInput = getElement('end-date');

        if (!yearSelect) return;

        // 初始化年份選項
        const currentYear = new Date().getFullYear();
        yearSelect.innerHTML = '';
        for (let year = currentYear - 5; year <= currentYear + 5; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year + '年';
            if (year === currentYear) option.selected = true;
            yearSelect.appendChild(option);
        }

        // 設定預設日期區間（當月）
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

        if (startDateInput) startDateInput.value = formatDateForInput(firstDay);
        if (endDateInput) endDateInput.value = formatDateForInput(now);
        if (monthSelect) monthSelect.value = now.getMonth() + 1;
    }

    // ===========================
    // 事件綁定
    // ===========================

    function bindEvents() {
        // 刷新按鈕
        const refreshBtn = moduleRoot.querySelector('[data-action="refresh"]') || getElement('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', loadDashboardData);
        }

        // 篩選表單
        const filterForm = moduleRoot.querySelector('[data-dashboard-filter]');
        if (filterForm) {
            filterForm.addEventListener('submit', e => {
                e.preventDefault();
                loadDashboardData();
            });

            // 重設按鈕
            const resetBtn = filterForm.querySelector('[data-action="reset-filter"]');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    filterForm.reset();
                    initializeFilters();
                    loadDashboardData();
                });
            }
        }

        // 年月變更時更新日期區間
        const yearSelect = getElement('year');
        const monthSelect = getElement('month');

        if (yearSelect) yearSelect.addEventListener('change', updateDateRange);
        if (monthSelect) monthSelect.addEventListener('change', updateDateRange);

        // 行事曆篩選按鈕
        bindCalendarFilterButtons();

        // 事件彈出卡片
        bindEventPopup();

        // 公告跳馬燈事件
        bindAnnouncementEvents();
    }

    function updateDateRange() {
        const yearSelect = getElement('year');
        const monthSelect = getElement('month');
        const startDateInput = getElement('start-date');
        const endDateInput = getElement('end-date');

        if (!yearSelect || !startDateInput || !endDateInput) return;

        const year = parseInt(yearSelect.value);
        const month = monthSelect ? monthSelect.value : '';

        if (month) {
            const monthNum = parseInt(month) - 1;
            const firstDay = new Date(year, monthNum, 1);
            const lastDay = new Date(year, monthNum + 1, 0);
            startDateInput.value = formatDateForInput(firstDay);
            endDateInput.value = formatDateForInput(lastDay);
        } else {
            const firstDay = new Date(year, 0, 1);
            const lastDay = new Date(year, 11, 31);
            startDateInput.value = formatDateForInput(firstDay);
            endDateInput.value = formatDateForInput(lastDay);
        }
    }

    function bindCalendarFilterButtons() {
        const filterBtns = moduleRoot.querySelectorAll('.calendar-filter-buttons .btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentCalendarFilter = this.dataset.filter;
                if (calendar) calendar.refetchEvents();
            });
        });
    }

    function bindEventPopup() {
        const popupOverlay = getElement('event-popup-overlay');
        if (!popupOverlay) return;

        popupOverlay.addEventListener('click', e => {
            if (e.target === popupOverlay) closeEventPopup();
        });

        popupOverlay.querySelectorAll('[data-action="close-event-popup"]').forEach(btn => {
            btn.addEventListener('click', closeEventPopup);
        });

        const detailBtn = popupOverlay.querySelector('[data-action="open-event-detail"]');
        if (detailBtn) detailBtn.addEventListener('click', openEventDetail);

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                const overlay = getElement('event-popup-overlay');
                if (overlay && !overlay.classList.contains('hidden')) {
                    closeEventPopup();
                }
            }
        });
    }

    // ===========================
    // 資料載入
    // ===========================

    function getFilterParams() {
        const yearSelect = getElement('year');
        const monthSelect = getElement('month');
        const startDateInput = getElement('start-date');
        const endDateInput = getElement('end-date');

        return {
            year: yearSelect ? yearSelect.value : new Date().getFullYear(),
            month: monthSelect ? monthSelect.value : '',
            startDate: startDateInput ? startDateInput.value : '',
            endDate: endDateInput ? endDateInput.value : ''
        };
    }

    async function loadDashboardData() {
        const params = getFilterParams();

        // 並行載入統計資料
        await Promise.all([
            loadOrdersStats(params),
            loadWorkOrdersStats(params),
            loadShippingStats(params),
            loadChartsData(params.year)
        ]);

        // 更新行事曆
        if (calendar) calendar.refetchEvents();
    }

    async function loadOrdersStats(params) {
        try {
            const queryParams = new URLSearchParams({
                year: params.year,
                month: params.month || '',
                start_date: params.startDate || '',
                end_date: params.endDate || ''
            });

            const response = await fetch(`${getApiPath('ordersStats')}?${queryParams}`);
            if (!response.ok) throw new Error('載入失敗');
            const data = await response.json();

            // 更新統計數據
            const countEl = getElement('orders-count');
            const amountEl = getElement('orders-amount');
            if (countEl) countEl.textContent = data.total_count || 0;
            if (amountEl) amountEl.textContent = formatCurrency(data.total_amount || 0);

            // 更新圖表
            renderDoughnutChart('orders-status', data.status_distribution || []);

            // 更新最新列表
            renderRecentOrders(data.recent_orders || []);
        } catch (error) {
            console.error('載入訂單統計失敗:', error);
        }
    }

    async function loadWorkOrdersStats(params) {
        try {
            const queryParams = new URLSearchParams({
                year: params.year,
                month: params.month || '',
                start_date: params.startDate || '',
                end_date: params.endDate || ''
            });

            const response = await fetch(`${getApiPath('workOrdersStats')}?${queryParams}`);
            if (!response.ok) throw new Error('載入失敗');
            const data = await response.json();

            const countEl = getElement('work-orders-count');
            const activeEl = getElement('work-orders-active');
            if (countEl) countEl.textContent = data.total_count || 0;
            if (activeEl) activeEl.textContent = data.active_count || 0;

            renderDoughnutChart('work-orders-status', data.status_distribution || []);
            renderRecentWorkOrders(data.recent_work_orders || []);
        } catch (error) {
            console.error('載入工單統計失敗:', error);
        }
    }

    async function loadShippingStats(params) {
        try {
            const queryParams = new URLSearchParams({
                year: params.year,
                month: params.month || '',
                start_date: params.startDate || '',
                end_date: params.endDate || ''
            });

            const response = await fetch(`${getApiPath('shippingOrdersStats')}?${queryParams}`);
            if (!response.ok) throw new Error('載入失敗');
            const data = await response.json();

            const countEl = getElement('shipping-count');
            const pendingEl = getElement('shipping-pending');
            if (countEl) countEl.textContent = data.total_count || 0;
            if (pendingEl) pendingEl.textContent = data.pending_count || 0;

            renderDoughnutChart('shipping-status', data.status_distribution || []);
            renderRecentShipping(data.recent_shipping_orders || []);
        } catch (error) {
            console.error('載入出貨統計失敗:', error);
        }
    }

    async function loadChartsData(year) {
        try {
            const response = await fetch(`${getApiPath('chartsData')}?year=${year}`);
            if (!response.ok) throw new Error('載入失敗');
            const result = await response.json();

            if (!result.success) throw new Error(result.message);

            const data = result.data;

            // 更新年份標籤
            const yearBadge = getElement('chart-year');
            if (yearBadge) yearBadge.textContent = year + '年';

            // 渲染圖表
            renderMonthlyTrendsChart(data.monthly_trends || []);
            renderTopCustomersChart(data.top_customers || []);
        } catch (error) {
            console.error('載入圖表資料失敗:', error);
        }
    }

    // ===========================
    // 最新紀錄渲染
    // ===========================

    function renderRecentOrders(orders) {
        const list = getList('recent-orders');
        if (!list) return;

        if (!orders || orders.length === 0) {
            list.innerHTML = '<div class="no-data-message">暫無訂單資料</div>';
            return;
        }

        let html = '<ul class="recent-items-list">';
        orders.forEach(order => {
            html += `
                <li class="recent-item" data-id="${order.id}">
                    <div class="item-header">
                        <span class="item-id">${escapeHtml(order.order_number)}</span>
                        <span class="item-status status-${order.status}">${escapeHtml(order.status_label || order.status)}</span>
                    </div>
                    <div class="item-body">
                        <span class="item-info">${escapeHtml(order.customer_name)}</span>
                        <span class="item-info">${formatDate(order.order_date)}</span>
                        <span class="item-amount">${formatCurrency(order.total_amount)}</span>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        list.innerHTML = html;

        // 綁定點擊事件
        list.querySelectorAll('.recent-item').forEach(item => {
            item.addEventListener('click', () => openDetailPage('recent-orders', item.dataset.id));
        });
    }

    function renderRecentWorkOrders(workOrders) {
        const list = getList('recent-work-orders');
        if (!list) return;

        if (!workOrders || workOrders.length === 0) {
            list.innerHTML = '<div class="no-data-message">暫無工單資料</div>';
            return;
        }

        let html = '<ul class="recent-items-list">';
        workOrders.forEach(wo => {
            html += `
                <li class="recent-item" data-id="${wo.id}">
                    <div class="item-header">
                        <span class="item-id">${escapeHtml(wo.work_order_number)}</span>
                        <span class="item-status status-${wo.status}">${escapeHtml(wo.status_label || wo.status)}</span>
                    </div>
                    <div class="item-body">
                        <span class="item-info">訂單: ${escapeHtml(wo.order_number || 'N/A')}</span>
                        <span class="item-info">${formatDate(wo.scheduled_start_date)}</span>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        list.innerHTML = html;

        list.querySelectorAll('.recent-item').forEach(item => {
            item.addEventListener('click', () => openDetailPage('recent-work-orders', item.dataset.id));
        });
    }

    function renderRecentShipping(shippingOrders) {
        const list = getList('recent-shipping');
        if (!list) return;

        if (!shippingOrders || shippingOrders.length === 0) {
            list.innerHTML = '<div class="no-data-message">暫無出貨資料</div>';
            return;
        }

        let html = '<ul class="recent-items-list">';
        shippingOrders.forEach(so => {
            html += `
                <li class="recent-item" data-id="${so.id}">
                    <div class="item-header">
                        <span class="item-id">${escapeHtml(so.shipping_order_number)}</span>
                        <span class="item-status status-${so.status}">${escapeHtml(so.status_label || so.status)}</span>
                    </div>
                    <div class="item-body">
                        <span class="item-info">${escapeHtml(so.customer_name)}</span>
                        <span class="item-info">${formatDate(so.shipping_date)}</span>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        list.innerHTML = html;

        list.querySelectorAll('.recent-item').forEach(item => {
            item.addEventListener('click', () => openDetailPage('recent-shipping', item.dataset.id));
        });
    }

    // ===========================
    // 圖表渲染
    // ===========================

    function initializeCharts() {
        if (window.Chart) {
            Chart.defaults.font.family = "'Noto Sans TC', sans-serif";
            Chart.defaults.font.size = 11;
        }
    }

    function renderDoughnutChart(chartName, data) {
        const ctx = getChart(chartName);
        if (!ctx) return;

        const chartKey = chartName.replace(/-/g, '');

        // 銷毀舊圖表
        if (charts[chartKey]) {
            charts[chartKey].destroy();
            charts[chartKey] = null;
        }

        if (!data || data.length === 0) {
            // 顯示空狀態但保留格線
            charts[chartKey] = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['無資料'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#e0e0e0'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false }
                    }
                }
            });
            return;
        }

        const labels = data.map(d => d.label);
        const values = data.map(d => d.count);
        const statusColors = getStatusColors();
        const colors = data.map(d => statusColors[d.status] || '#9e9e9e');

        charts[chartKey] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        padding: 8,
                        cornerRadius: 4,
                        callbacks: {
                            label: ctx => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = ((ctx.raw / total) * 100).toFixed(0);
                                return `${ctx.label}: ${ctx.raw} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderMonthlyTrendsChart(data) {
        const ctx = getChart('monthly-trends');
        if (!ctx) return;

        if (charts.monthlyTrends) {
            charts.monthlyTrends.destroy();
        }

        const labels = data.map(d => d.label);
        const ordersData = data.map(d => d.orders || 0);
        const workOrdersData = data.map(d => d.work_orders || 0);
        const shippingData = data.map(d => d.shipping_orders || 0);

        const colors = getChartColors();

        charts.monthlyTrends = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '訂單',
                        data: ordersData,
                        backgroundColor: colors.primary,
                        barPercentage: 0.7
                    },
                    {
                        label: '工單',
                        data: workOrdersData,
                        backgroundColor: colors.warning,
                        barPercentage: 0.7
                    },
                    {
                        label: '出貨',
                        data: shippingData,
                        backgroundColor: colors.success,
                        barPercentage: 0.7
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: { boxWidth: 12, padding: 10 }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 10 } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { stepSize: 1, font: { size: 10 } }
                    }
                }
            }
        });
    }

    function renderTopCustomersChart(data) {
        const ctx = getChart('top-customers');
        if (!ctx) return;

        if (charts.topCustomers) {
            charts.topCustomers.destroy();
        }

        if (!data || data.length === 0) {
            charts.topCustomers = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['無資料'],
                    datasets: [{ data: [0], backgroundColor: '#e0e0e0' }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
            return;
        }

        const labels = data.map(d => d.customer_name);
        const values = data.map(d => d.total_amount);
        const colors = getChartColors();

        charts.topCustomers = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [colors.primary, colors.info, colors.teal, colors.purple, colors.success],
                    barThickness: 16
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => '$' + ctx.raw.toLocaleString()
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: {
                            font: { size: 9 },
                            callback: val => val >= 1000 ? '$' + (val/1000).toFixed(0) + 'K' : '$' + val
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            font: { size: 10 },
                            callback: function(val) {
                                const label = this.getLabelForValue(val);
                                return label.length > 8 ? label.substring(0, 8) + '...' : label;
                            }
                        }
                    }
                }
            }
        });
    }

    // ===========================
    // 行事曆
    // ===========================

    function initializeCalendar() {
        const calendarEl = getElement('calendar');
        if (!calendarEl) return;

        if (calendarEl.offsetWidth === 0) {
            setTimeout(initializeCalendar, 100);
            return;
        }

        if (typeof FullCalendar === 'undefined') {
            setTimeout(initializeCalendar, 500);
            return;
        }

        if (calendar) {
            calendar.destroy();
            calendar = null;
        }

        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            locale: 'zh-tw',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek'
            },
            buttonText: {
                today: '今天',
                month: '月',
                week: '週',
                list: '列表'
            },
            height: 'auto',
            dayMaxEvents: 3,
            moreLinkText: '更多',
            navLinks: true,
            fixedWeekCount: false,
            dayCellContent: arg => arg.dayNumberText.replace('日', ''),
            events: (info, successCallback, failureCallback) => {
                loadCalendarEvents(info.start, info.end, successCallback, failureCallback);
            },
            eventClick: info => handleEventClick(info),
            eventDidMount: info => {
                info.el.style.cursor = 'pointer';
            }
        });

        calendar.render();
    }

    async function loadCalendarEvents(start, end, successCallback, failureCallback) {
        try {
            const startDate = formatDateForAPI(start);
            const endDate = formatDateForAPI(end);

            const response = await fetch(`${getApiPath('calendarEvents')}?start=${startDate}&end=${endDate}`);
            if (!response.ok) throw new Error('載入失敗');

            const data = await response.json();
            allCalendarEvents = data.events || [];

            const filteredEvents = filterCalendarEvents(allCalendarEvents);
            successCallback(filteredEvents);
        } catch (error) {
            console.error('載入行事曆事件失敗:', error);
            failureCallback(error);
        }
    }

    function filterCalendarEvents(events) {
        if (currentCalendarFilter === 'all') return events;

        return events.filter(event => {
            const type = event.extendedProps?.type || '';
            if (currentCalendarFilter === 'internal') {
                return type === 'calendar_event';
            } else if (currentCalendarFilter === 'production') {
                return ['order', 'order_delivery', 'work_order', 'shipping'].includes(type);
            }
            return true;
        });
    }

    let currentPopupEvent = null;

    function handleEventClick(info) {
        const event = info.event;
        currentPopupEvent = {
            type: event.extendedProps.type,
            id: event.extendedProps.sourceId,
            title: event.title,
            start: event.start,
            end: event.end,
            status: event.extendedProps.status,
            backgroundColor: event.backgroundColor
        };

        const overlay = getElement('event-popup-overlay');
        const popup = getElement('event-popup');
        if (!overlay || !popup) return;

        popup.querySelector('[data-dashboard-event-popup-title]').textContent = event.title;

        const badge = popup.querySelector('[data-dashboard-event-popup-badge]');
        badge.textContent = getEventTypeName(event.extendedProps.type);
        badge.style.backgroundColor = event.backgroundColor || '#3788d8';

        popup.querySelector('[data-dashboard-event-popup-start]').textContent = formatDateTime(event.start);

        const endWrapper = popup.querySelector('[data-dashboard-event-popup-end-wrapper]');
        if (event.end) {
            popup.querySelector('[data-dashboard-event-popup-end]').textContent = formatDateTime(event.end);
            endWrapper.style.display = '';
        } else {
            endWrapper.style.display = 'none';
        }

        const statusRow = popup.querySelector('[data-dashboard-event-popup-status-row]');
        const statusText = getStatusName(event.extendedProps.status);
        if (statusText) {
            popup.querySelector('[data-dashboard-event-popup-status]').textContent = statusText;
            statusRow.style.display = '';
        } else {
            statusRow.style.display = 'none';
        }

        overlay.classList.remove('hidden');
    }

    function closeEventPopup() {
        const overlay = getElement('event-popup-overlay');
        if (overlay) overlay.classList.add('hidden');
        currentPopupEvent = null;
    }

    function openEventDetail() {
        if (!currentPopupEvent) return;
        const { type, id } = currentPopupEvent;
        closeEventPopup();
        openDetailPage(type, id);
    }

    // ===========================
    // 工具函數
    // ===========================

    function formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDateForAPI(date) {
        return formatDateForInput(date);
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('zh-TW');
    }

    function formatDateTime(date) {
        if (!date) return '';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        if (hours === '00' && minutes === '00') {
            return `${year}/${month}/${day}`;
        }
        return `${year}/${month}/${day} ${hours}:${minutes}`;
    }

    function formatCurrency(amount) {
        if (!amount || isNaN(amount)) return '$0';
        return '$' + parseFloat(amount).toLocaleString('zh-TW', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }


function getEventTypeName(type) {
        const names = {
            'order': '訂單',
            'order_delivery': '交貨日',
            'work_order': '工單',
            'shipping': '出貨',
            'calendar_event': '內部事件'
        };
        return names[type] || type || '未知';
    }

    function getStatusName(status) {
        const names = {
            'pending': '待處理',
            'in_progress': '進行中',
            'completed': '已完成',
            'cancelled': '已取消',
            'draft': '草稿',
            'confirmed': '已確認',
            'shipped': '已出貨',
            'closed': '已結案'
        };
        return names[status] || status || '';
    }

    function openDetailPage(dataType, itemId) {
        let pageId, pageTitle, pageUrl;
        let context = { highlightId: itemId };
        switch (dataType) {
            case 'recent-orders':
            case 'order':
            case 'order_delivery':
                pageId = 'orders'; pageTitle = '訂單管理'; pageUrl = 'modules/orders.html';
                break;
            case 'recent-work-orders':
            case 'work_order':
                pageId = 'work_orders'; pageTitle = '工單管理'; pageUrl = 'modules/work_orders.html';
                break;
            case 'recent-shipping':
            case 'shipping':
                pageId = 'shipping_orders'; pageTitle = '出貨單管理'; pageUrl = 'modules/shipping_orders.html';
                context = { shippingOrderId: itemId, highlightId: itemId };
                break;
            case 'calendar_event':
                pageId = 'dashboard_calendar_events'; pageTitle = '行事曆事件'; pageUrl = 'modules/dashboard_calendar_events.html';
                context = { calendarEventId: itemId, highlightId: itemId };
                break;
            default:
                return;
        }
        if (typeof window.openTab === 'function') {
            window.openTab(pageId, pageTitle, pageUrl, { context });
        }
    }

    // ===========================
    // 公告跳馬燈
    // ===========================

    async function loadAnnouncements() {
        try {
            const res = await fetch(
                `${window.APP_BASE_PATH}api/notifications/?notification_type=announcement&perPage=20`,
                { credentials: 'include' }
            );
            const json = await res.json();
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                announcementList = json.data;
                startAnnouncementTicker();

                const counter = getElement('announcement-count');
                if (counter) counter.textContent = `${json.data.length} 則`;
            } else {
                // 無公告時就抄掉整列
                const bar = getElement('announcement-bar');
                if (bar) bar.style.display = 'none';
            }
        } catch (_e) {
            const bar = getElement('announcement-bar');
            if (bar) bar.style.display = 'none';
        }
    }

    function startAnnouncementTicker() {
        const track = getElement('announcement-track');
        if (!track || announcementList.length === 0) return;

        // 清除舊計時器
        if (announcementTimer) clearInterval(announcementTimer);

        announcementIndex = 0;
        renderTickerItem(track, announcementList[0]);

        if (announcementList.length > 1) {
            announcementTimer = setInterval(() => {
                const track2 = getElement('announcement-track');
                if (!track2) return;
                const current = track2.querySelector('.ticker-item');
                if (current) {
                    current.classList.add('exiting');
                    setTimeout(() => {
                        announcementIndex = (announcementIndex + 1) % announcementList.length;
                        renderTickerItem(track2, announcementList[announcementIndex]);
                    }, 340);
                } else {
                    announcementIndex = (announcementIndex + 1) % announcementList.length;
                    renderTickerItem(track2, announcementList[announcementIndex]);
                }
            }, 4500);
        }
    }

    function renderTickerItem(track, item) {
        const typeLabel = item.notification_type === 'announcement' ? '公告' : '系統';
        const dateStr = item.published_at ? formatDate(item.published_at) : '';
        const itemEl = document.createElement('button');
        itemEl.type = 'button';
        itemEl.className = 'ticker-item';
        itemEl.dataset.announcementId = item.id;
        itemEl.innerHTML = `
            <span class="ticker-type-badge ${escapeHtml(item.notification_type)}">${typeLabel}</span>
            <span class="ticker-title">${escapeHtml(item.title)}</span>
            ${dateStr ? `<span class="ticker-date">${escapeHtml(dateStr)}</span>` : ''}
        `;
        track.innerHTML = '';
        track.appendChild(itemEl);
    }

    function bindAnnouncementEvents() {
        const track = getElement('announcement-track');
        if (track) {
            track.addEventListener('click', e => {
                const btn = e.target.closest('[data-announcement-id]');
                if (!btn) return;
                const id = parseInt(btn.dataset.announcementId, 10);
                const item = announcementList.find(a => a.id === id);
                if (item) showAnnouncementModal(item);
            });
        }

        const modal = getElement('announcement-modal');
        if (modal) {
            modal.addEventListener('click', e => {
                if (e.target === modal) closeAnnouncementModal();
            });
            modal.querySelectorAll('[data-action="close-announcement-modal"]').forEach(btn => {
                btn.addEventListener('click', closeAnnouncementModal);
            });
        }

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                const m = getElement('announcement-modal');
                if (m && !m.classList.contains('hidden')) closeAnnouncementModal();
            }
        });
    }

    function showAnnouncementModal(item) {
        const modal    = getElement('announcement-modal');
        const titleEl  = getElement('announcement-modal-title');
        const metaEl   = getElement('announcement-modal-meta');
        const contentEl = getElement('announcement-modal-content');
        if (!modal) return;

        const typeLabel = item.notification_type === 'announcement' ? '公告' : '系統通知';
        const dateStr   = item.published_at ? formatDate(item.published_at) : '';

        if (titleEl) titleEl.textContent = item.title;
        if (metaEl) {
            metaEl.innerHTML = `
                <span class="announcement-type-tag ${escapeHtml(item.notification_type)}">${typeLabel}</span>
                ${dateStr ? `<span><i class="fas fa-clock"></i> ${escapeHtml(dateStr)}</span>` : ''}
                ${item.created_by_name ? `<span><i class="fas fa-user"></i> ${escapeHtml(item.created_by_name)}</span>` : ''}
            `;
        }
        if (contentEl) {
            contentEl.textContent = item.content || '';
        }

        modal.classList.remove('hidden');

        // 標記已讀
        if (!item.is_read) {
            fetch(`${window.APP_BASE_PATH}api/notifications/mark_read.php`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id })
            }).then(response => {
                if (response.ok && window.DataSync) {
                    DataSync.notifyWithDependencies('notifications', DataSync.EVENT_TYPES.UPDATED, {
                        id: item.id,
                        is_read: true
                    });
                }
            }).catch(() => {});
            item.is_read = true;
        }
    }

    function closeAnnouncementModal() {
        const modal = getElement('announcement-modal');
        if (modal) modal.classList.add('hidden');
    }

    // 註冊模組
    window.initializeDashboardModule = initializeDashboardModule;
})();
