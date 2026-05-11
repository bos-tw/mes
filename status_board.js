(function() {
    'use strict';

    const BOARD_HTTP_URL = 'http://127.0.0.1/mes/status_board.html';
    const REFRESH_MS = 30000;
    const BOARD_FETCH_LIMIT = 500;
    const WORK_VISIBLE = 5;
    const SHIPPING_VISIBLE = 5;
    const ANNOUNCEMENT_VISIBLE = 1;
    const WORK_ROW_HEIGHT = 66;
    const SHIPPING_ROW_HEIGHT = 66;
    const ANNOUNCEMENT_ROW_HEIGHT = 78;
    const TICK_MS = 2600;

    const els = {
        workOrders: document.querySelector('[data-work-orders]'),
        shippingOrders: document.querySelector('[data-shipping-orders]'),
        announcements: document.querySelector('[data-announcements]'),
        workCount: document.querySelector('[data-work-count]'),
        shippingCount: document.querySelector('[data-shipping-count]'),
        lastUpdated: document.querySelector('[data-last-updated]'),
        refreshStatus: document.querySelector('[data-refresh-status]'),
        clock: document.querySelector('[data-clock]')
    };

    if (window.location.protocol === 'file:') {
        window.location.replace(BOARD_HTTP_URL);
        return;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function stripHtml(value) {
        const div = document.createElement('div');
        div.innerHTML = value;
        return div.textContent || div.innerText || '';
    }

    function formatTime(value) {
        if (!value) return '--:--';
        const date = new Date(String(value).replace(' ', 'T'));
        if (Number.isNaN(date.getTime())) return '--:--';
        return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    function formatDate(value) {
        if (!value) return '--/--';
        const date = new Date(String(value).replace(' ', 'T'));
        if (Number.isNaN(date.getTime())) return escapeHtml(value);
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    }

    function statusColor(statusKey, statusLabel) {
        const text = `${statusKey || ''} ${statusLabel || ''}`.toLowerCase();
        if (text.includes('cancel') || text.includes('取消')) return { color: '#ff5b64', glow: 'rgba(255, 91, 100, 0.42)' };
        if (text.includes('completed') || text.includes('delivered') || text.includes('完成') || text.includes('送達')) return { color: '#35c76f', glow: 'rgba(53, 199, 111, 0.42)' };
        if (text.includes('shipped') || text.includes('出貨')) return { color: '#27d5d1', glow: 'rgba(39, 213, 209, 0.42)' };
        if (text.includes('packed') || text.includes('包裝')) return { color: '#ff8f3c', glow: 'rgba(255, 143, 60, 0.42)' };
        if (text.includes('preparing') || text.includes('準備')) return { color: '#b786ff', glow: 'rgba(183, 134, 255, 0.42)' };
        if (text.includes('progress') || text.includes('confirmed') || text.includes('進行') || text.includes('確認')) return { color: '#46a7ff', glow: 'rgba(70, 167, 255, 0.42)' };
        if (text.includes('draft') || text.includes('scheduled') || text.includes('草稿') || text.includes('排程') || text.includes('待')) return { color: '#f7b731', glow: 'rgba(247, 183, 49, 0.42)' };
        return { color: '#8ea7b7', glow: 'rgba(142, 167, 183, 0.32)' };
    }

    function statusStyle(statusKey, statusLabel) {
        const token = statusColor(statusKey, statusLabel);
        return `--status-color: ${token.color}; --status-glow: ${token.glow};`;
    }

    function getBoardApiUrl() {
        const url = new URL('api/status_board/index.php', window.location.href);
        url.searchParams.set('work_limit', String(BOARD_FETCH_LIMIT));
        url.searchParams.set('shipping_limit', String(BOARD_FETCH_LIMIT));
        url.searchParams.set('announcement_limit', String(BOARD_FETCH_LIMIT));
        return url.toString();
    }

    function createTicker(container, options) {
        if (!container) {
            return {
                setData() {},
                destroy() {}
            };
        }

        let rows = [];
        let index = 0;
        let timer = null;
        let isAnimating = false;

        function ensureShell() {
            container.innerHTML = '<div class="ticker-viewport"><div class="ticker-track"></div></div>';
            const viewport = container.querySelector('.ticker-viewport');
            const track = container.querySelector('.ticker-track');
            viewport.style.height = `${options.visibleCount * options.rowHeight}px`;
            return { viewport, track };
        }

        function renderWindow(track, windowStart) {
            const needed = Math.max(options.visibleCount + 1, 1);
            const html = [];
            for (let i = 0; i < needed; i += 1) {
                const item = rows[(windowStart + i) % rows.length] || {};
                html.push(options.renderRow(item));
            }
            track.innerHTML = html.join('');
            track.style.transform = 'translateY(0)';
        }

        function step() {
            if (!rows.length || rows.length <= options.visibleCount || isAnimating) return;
            const track = container.querySelector('.ticker-track');
            if (!track) return;

            isAnimating = true;
            track.classList.add('animating');
            track.style.transform = `translateY(-${options.rowHeight}px)`;

            window.setTimeout(() => {
                index = (index + 1) % rows.length;
                track.classList.remove('animating');
                renderWindow(track, index);
                isAnimating = false;
            }, 700);
        }

        function restartTimer() {
            if (timer) window.clearInterval(timer);
            if (rows.length > options.visibleCount) {
                timer = window.setInterval(step, options.tickMs);
            }
        }

        return {
            setData(nextRows) {
                rows = Array.isArray(nextRows) ? nextRows.slice() : [];
                index = 0;
                if (!rows.length) {
                    if (timer) window.clearInterval(timer);
                    container.innerHTML = `<div class="empty-state">${escapeHtml(options.emptyText)}</div>`;
                    return;
                }

                const { track } = ensureShell();
                renderWindow(track, index);
                restartTimer();
            },
            destroy() {
                if (timer) window.clearInterval(timer);
            }
        };
    }

    async function parseBoardResponse(response) {
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (error) {
            const preview = text.slice(0, 160).replace(/\s+/g, ' ').trim();
            throw new Error(`看板資料不是合法 JSON：${preview || '空白回應'}`);
        }
    }

    function showLoadError(message) {
        const fallback = message || '資料載入失敗';

        if (els.workOrders && !els.workOrders.querySelector('.ticker-viewport')) {
            els.workOrders.innerHTML = `<div class="error-state">${escapeHtml(fallback)}</div>`;
        }
        if (els.shippingOrders && !els.shippingOrders.querySelector('.ticker-viewport')) {
            els.shippingOrders.innerHTML = `<div class="error-state">${escapeHtml(fallback)}</div>`;
        }
        if (els.announcements && !els.announcements.querySelector('.ticker-viewport')) {
            els.announcements.innerHTML = `<div class="error-state">${escapeHtml(fallback)}</div>`;
        }
    }

    function normalizeFetchError(error) {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            return '無法連線到看板 API，請確認是從 Apache 網址開啟看板。';
        }
        return error.message || '資料載入失敗';
    }

    const workTicker = createTicker(els.workOrders, {
        visibleCount: WORK_VISIBLE,
        rowHeight: WORK_ROW_HEIGHT,
        tickMs: TICK_MS,
        emptyText: '目前沒有待顯示資料',
        renderRow: (row) => {
            const displayTime = row.actual_start_date || row.scheduled_start_date || row.updated_at;
            return `
                <div class="schedule-row" style="${statusStyle(row.status_key, row.status_label)}">
                    <div class="time-cell">${formatTime(displayTime)}</div>
                    <div>
                        <div class="number-cell">${escapeHtml(row.work_order_number || '-')}</div>
                        <div class="subline">${escapeHtml(row.machine_name || '未指定機台')}</div>
                    </div>
                    <div>
                        <div class="mainline">${escapeHtml(row.customer_name || '-')}</div>
                        <div class="subline">${escapeHtml(row.screening_item_name || row.order_number || '-')}</div>
                    </div>
                    <div class="status-pill">${escapeHtml(row.status_label || row.status_key || '-')}</div>
                </div>
            `;
        }
    });

    const shippingTicker = createTicker(els.shippingOrders, {
        visibleCount: SHIPPING_VISIBLE,
        rowHeight: SHIPPING_ROW_HEIGHT,
        tickMs: TICK_MS,
        emptyText: '目前沒有待顯示資料',
        renderRow: (row) => `
            <div class="schedule-row" style="${statusStyle(row.status, row.status_label)}">
                <div class="time-cell">${formatDate(row.shipping_date || row.updated_at)}</div>
                <div>
                    <div class="number-cell">${escapeHtml(row.shipping_order_number || '-')}</div>
                    <div class="subline">${escapeHtml(row.order_number || '')}</div>
                </div>
                <div>
                    <div class="mainline">${escapeHtml(row.customer_name || '-')}</div>
                    <div class="subline">${Number(row.item_count || 0)} 項 / ${Number(row.total_quantity || 0).toLocaleString('zh-TW')} 支</div>
                </div>
                <div class="status-pill">${escapeHtml(row.status_label || row.status || '-')}</div>
            </div>
        `
    });

    const announcementTicker = createTicker(els.announcements, {
        visibleCount: ANNOUNCEMENT_VISIBLE,
        rowHeight: ANNOUNCEMENT_ROW_HEIGHT,
        tickMs: 3600,
        emptyText: '目前沒有公告',
        renderRow: (row) => `
            <article class="announcement-item">
                <h3>${escapeHtml(row.title || '-')}</h3>
                <p>${escapeHtml(stripHtml(row.content || ''))}</p>
            </article>
        `
    });

    async function loadBoard() {
        try {
            if (els.refreshStatus) els.refreshStatus.textContent = '更新中...';
            const response = await fetch(getBoardApiUrl(), { credentials: 'same-origin' });
            const result = await parseBoardResponse(response);
            if (!response.ok || !result.success) {
                throw new Error(result.message || `HTTP ${response.status}`);
            }

            const data = result.data || {};
            const workOrders = data.work_orders || [];
            const shippingOrders = data.shipping_orders || [];
            const announcements = data.announcements || [];

            workTicker.setData(workOrders);
            shippingTicker.setData(shippingOrders);
            announcementTicker.setData(announcements);

            if (els.workCount) els.workCount.textContent = `${workOrders.length} 筆`;
            if (els.shippingCount) els.shippingCount.textContent = `${shippingOrders.length} 筆`;
            if (els.lastUpdated) els.lastUpdated.textContent = `上次更新 ${new Date().toLocaleTimeString('zh-TW', { hour12: false })}`;
            if (els.refreshStatus) els.refreshStatus.textContent = '每 30 秒更新';
        } catch (error) {
            console.error('Status board load failed:', error);
            const message = normalizeFetchError(error);
            showLoadError(message);
            if (els.refreshStatus) els.refreshStatus.textContent = message.includes('登入')
                ? '更新失敗：登入逾期'
                : '更新失敗';
        }
    }

    function updateClock() {
        if (!els.clock) return;
        els.clock.textContent = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    }

    updateClock();
    loadBoard();
    window.setInterval(updateClock, 1000);
    window.setInterval(loadBoard, REFRESH_MS);

    window.addEventListener('beforeunload', () => {
        workTicker.destroy();
        shippingTicker.destroy();
        announcementTicker.destroy();
    });
})();
