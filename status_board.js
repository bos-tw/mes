(function() {
    'use strict';

    const BOARD_HTTP_URL = 'http://127.0.0.1/mes/status_board.html';
    const REFRESH_MS = 30000;
    const BOARD_FETCH_LIMIT = 500;
    const WORK_VISIBLE = 5;
    const WORK_ROW_HEIGHT = readCssLength('--row-height', 56);
    const WORK_TICK_MS = 4200;
    const COMPLETED_VISIBLE = 3;
    const COMPLETED_ROW_HEIGHT = readCssLength('--completed-row-height', 34);
    const COMPLETED_TICK_MS = 2600;
    const MACHINE_ROTATE_MS = 15000;
    const ANNOUNCEMENT_VISIBLE = 1;
    const ANNOUNCEMENT_ROW_HEIGHT = readCssLength('--announcement-row-height', 72);
    const ANNOUNCEMENT_TICK_MS = 5000;

    const state = {
        machineGroups: [],
        machineIndex: 0,
        machineTimer: null
    };

    const els = {
        workOrders: document.querySelector('[data-work-orders]'),
        announcements: document.querySelector('[data-announcements]'),
        workCount: document.querySelector('[data-work-count]'),
        completedOrders: document.querySelector('[data-completed-orders]'),
        completedCount: document.querySelector('[data-completed-count]'),
        completedToday: document.querySelector('[data-completed-today]'),
        machineIndex: document.querySelector('[data-machine-index]'),
        machineName: document.querySelector('[data-machine-name]'),
        machineNote: document.querySelector('[data-machine-note]'),
        lastUpdated: document.querySelector('[data-last-updated]'),
        refreshStatus: document.querySelector('[data-refresh-status]'),
        clock: document.querySelector('[data-clock]')
    };

    if (window.location.protocol === 'file:') {
        window.location.replace(BOARD_HTTP_URL);
        return;
    }

    function readCssLength(cssVarName, fallback) {
        try {
            const raw = getComputedStyle(document.documentElement).getPropertyValue(cssVarName);
            const parsed = Number.parseFloat(String(raw || '').trim());
            return Number.isFinite(parsed) ? parsed : fallback;
        } catch (error) {
            return fallback;
        }
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
        return String(value ?? '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function toDate(value) {
        if (!value) return null;
        const date = new Date(String(value).replace(' ', 'T'));
        if (Number.isNaN(date.getTime())) return null;
        return date;
    }

    function formatTime(value) {
        const date = toDate(value);
        if (!date) return '--:--';
        return date.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    function formatTimeRange(start, end) {
        return `${formatTime(start)} - ${formatTime(end)}`;
    }

    function formatCompletedTime(value) {
        const date = toDate(value);
        if (!date) return '--/-- --:--';

        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${month}/${day} ${hours}:${minutes}`;
    }

    function formatWeight(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return '--';
        return `${numeric.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
    }

    function formatQuantity(primary, fallback) {
        const first = Number(primary);
        if (Number.isFinite(first) && first > 0) {
            return first.toLocaleString('zh-TW', { maximumFractionDigits: 0 });
        }

        const second = Number(fallback);
        if (Number.isFinite(second) && second > 0) {
            return second.toLocaleString('zh-TW', { maximumFractionDigits: 0 });
        }

        return '--';
    }

    function statusColor(statusKey, statusLabel) {
        const text = `${statusKey || ''} ${statusLabel || ''}`.toLowerCase();
        if (text.includes('cancel') || text.includes('取消')) {
            return { color: '#ff6b73', glow: 'rgba(255, 107, 115, 0.42)' };
        }
        if (text.includes('completed') || text.includes('完成')) {
            return { color: '#59d37f', glow: 'rgba(89, 211, 127, 0.42)' };
        }
        if (text.includes('progress') || text.includes('進行')) {
            return { color: '#61d5ff', glow: 'rgba(97, 213, 255, 0.42)' };
        }
        if (text.includes('scheduled') || text.includes('排程') || text.includes('draft') || text.includes('待')) {
            return { color: '#ffce64', glow: 'rgba(255, 206, 100, 0.42)' };
        }
        return { color: '#8bb6db', glow: 'rgba(139, 182, 219, 0.32)' };
    }

    function statusStyle(statusKey, statusLabel) {
        const token = statusColor(statusKey, statusLabel);
        return `--status-color: ${token.color}; --status-glow: ${token.glow};`;
    }

    function getBoardApiUrl() {
        const url = new URL('api/status_board/index.php', window.location.href);
        url.searchParams.set('work_limit', String(BOARD_FETCH_LIMIT));
        url.searchParams.set('completed_limit', String(BOARD_FETCH_LIMIT));
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
        let pageStart = 0;
        let timer = null;
        let isAnimating = false;
        const mode = options.transitionMode || 'scroll';

        function clearTimer() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        function ensureShell() {
            container.innerHTML = '<div class="ticker-viewport"><div class="ticker-track"></div></div>';
            const viewport = container.querySelector('.ticker-viewport');
            const track = container.querySelector('.ticker-track');
            viewport.style.height = `${options.visibleCount * options.rowHeight}px`;
            return { track };
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

        function renderPage(track, start, animateRows) {
            const needed = rows.length > options.visibleCount ? options.visibleCount : rows.length;
            const html = [];

            for (let i = 0; i < needed; i += 1) {
                const item = rows[(start + i) % rows.length] || {};
                html.push(options.renderRow(item));
            }

            track.innerHTML = html.join('');

            if (!animateRows) {
                return;
            }

            const selector = options.rowSelector || '.timetable-row';
            const rowEls = track.querySelectorAll(selector);
            rowEls.forEach((rowEl, rowIndex) => {
                rowEl.classList.add('row-page-enter');
                rowEl.style.animationDelay = `${rowIndex * 85}ms`;
            });
        }

        function step() {
            if (!rows.length || rows.length <= options.visibleCount || isAnimating) return;
            const track = container.querySelector('.ticker-track');
            if (!track) return;

            if (mode === 'page') {
                pageStart = (pageStart + options.visibleCount) % rows.length;
                renderPage(track, pageStart, true);
                return;
            }

            isAnimating = true;
            track.classList.add('animating');
            track.style.transform = `translateY(-${options.rowHeight}px)`;

            window.setTimeout(() => {
                index = (index + 1) % rows.length;
                track.classList.remove('animating');
                renderWindow(track, index);
                isAnimating = false;
            }, 680);
        }

        function restartTimer() {
            clearTimer();
            if (rows.length > options.visibleCount) {
                timer = window.setInterval(step, options.tickMs);
            }
        }

        return {
            setData(nextRows) {
                rows = Array.isArray(nextRows) ? nextRows.slice() : [];
                index = 0;
                pageStart = 0;
                if (!rows.length) {
                    clearTimer();
                    container.innerHTML = `<div class="empty-state">${escapeHtml(options.emptyText)}</div>`;
                    return;
                }

                const { track } = ensureShell();
                if (mode === 'page') {
                    renderPage(track, pageStart, true);
                } else {
                    renderWindow(track, index);
                }
                restartTimer();
            },
            destroy() {
                clearTimer();
            }
        };
    }

    function normalizeFetchError(error) {
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
            return '無法連線到看板 API，請確認是從 Apache 網址開啟看板。';
        }
        return error.message || '資料載入失敗';
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
        if (els.completedOrders && !els.completedOrders.querySelector('.ticker-viewport')) {
            els.completedOrders.innerHTML = `<div class="error-state">${escapeHtml(fallback)}</div>`;
        }
        if (els.announcements && !els.announcements.querySelector('.ticker-viewport')) {
            els.announcements.innerHTML = `<div class="error-state">${escapeHtml(fallback)}</div>`;
        }
    }

    function clearMachineTimer() {
        if (state.machineTimer) {
            window.clearInterval(state.machineTimer);
            state.machineTimer = null;
        }
    }

    function isQueueWorkOrder(row) {
        const text = `${row.status_key || ''} ${row.status_label || ''}`.toLowerCase();
        if (text.includes('completed') || text.includes('完成')) return false;
        if (text.includes('cancel') || text.includes('取消')) return false;
        return true;
    }

    function sortMachineRows(a, b) {
        const seqA = Number.isFinite(Number(a.machine_sequence)) ? Number(a.machine_sequence) : Number.MAX_SAFE_INTEGER;
        const seqB = Number.isFinite(Number(b.machine_sequence)) ? Number(b.machine_sequence) : Number.MAX_SAFE_INTEGER;
        if (seqA !== seqB) return seqA - seqB;

        const timeA = toDate(a.scheduled_start_date || a.actual_start_date || a.updated_at)?.getTime() || Number.MAX_SAFE_INTEGER;
        const timeB = toDate(b.scheduled_start_date || b.actual_start_date || b.updated_at)?.getTime() || Number.MAX_SAFE_INTEGER;
        if (timeA !== timeB) return timeA - timeB;

        return Number(a.id || 0) - Number(b.id || 0);
    }

    function buildMachineGroups(workOrders) {
        const source = Array.isArray(workOrders) ? workOrders.filter(isQueueWorkOrder) : [];
        const groups = new Map();

        source.forEach((row) => {
            const machineName = String(row.machine_name || '').trim();
            // 若機台名稱不存在（含關聯遺失），統一歸到未指定機台，避免被拆成多個單筆群組。
            const key = machineName ? String(row.machine_id || machineName) : 'unassigned';
            if (!groups.has(key)) {
                groups.set(key, {
                    machineName: machineName || '未指定機台',
                    rows: []
                });
            }
            groups.get(key).rows.push(row);
        });

        const result = Array.from(groups.values());
        result.forEach((group) => {
            group.rows.sort(sortMachineRows);
        });

        result.sort((a, b) => {
            const aUnassigned = a.machineName === '未指定機台';
            const bUnassigned = b.machineName === '未指定機台';
            if (aUnassigned && !bUnassigned) return -1;
            if (!aUnassigned && bUnassigned) return 1;
            return a.machineName.localeCompare(b.machineName, 'zh-Hant');
        });
        return result;
    }

    function updateMachineHeader(group, index, total) {
        if (els.machineName) {
            els.machineName.textContent = group ? group.machineName : '未指定機台';
        }
        if (els.machineIndex) {
            els.machineIndex.textContent = total ? `${index + 1} / ${total} 機台` : '0 / 0 機台';
        }
        if (els.workCount) {
            els.workCount.textContent = group ? `${group.rows.length} 筆` : '0 筆';
        }
        if (els.machineNote) {
            els.machineNote.textContent = group
                ? `目前排隊 ${group.rows.length} 筆工單。`
                : '目前沒有排隊工單。';
        }
    }

    const workTicker = createTicker(els.workOrders, {
        visibleCount: WORK_VISIBLE,
        rowHeight: WORK_ROW_HEIGHT,
        tickMs: WORK_TICK_MS,
        transitionMode: 'page',
        rowSelector: '.timetable-row',
        emptyText: '目前沒有排隊工單',
        renderRow: (row) => {
            const customerProduct = `${row.customer_name || '-'} / ${row.screening_item_name || row.order_number || '-'}`;
            const workOrderNumber = row.work_order_number || '-';
            const statusLabel = row.status_label || row.status_key || '-';
            return `
                <div class="timetable-row" style="${statusStyle(row.status_key, row.status_label)}">
                    <div class="time-range">${formatTimeRange(row.scheduled_start_date, row.scheduled_end_date)}</div>
                    <div class="time-range">${formatTimeRange(row.actual_start_date, row.actual_end_date)}</div>
                    <div class="work-number" title="${escapeHtml(workOrderNumber)}">${escapeHtml(workOrderNumber)}</div>
                    <div class="customer-product">${escapeHtml(customerProduct)}</div>
                    <div class="metric">${formatWeight(row.net_weight_kg)}</div>
                    <div class="metric">${formatQuantity(row.quantity_to_produce, row.order_total_units)}</div>
                    <div class="status-text">${escapeHtml(statusLabel)}</div>
                    <div class="operator-name">${escapeHtml(row.assigned_employee_name || '-')}</div>
                </div>
            `;
        }
    });

    const announcementTicker = createTicker(els.announcements, {
        visibleCount: ANNOUNCEMENT_VISIBLE,
        rowHeight: ANNOUNCEMENT_ROW_HEIGHT,
        tickMs: ANNOUNCEMENT_TICK_MS,
        emptyText: '目前沒有公告',
        renderRow: (row) => `
            <article class="announcement-item">
                <h3>${escapeHtml(row.title || '-')}</h3>
                <p>${escapeHtml(stripHtml(row.content || ''))}</p>
            </article>
        `
    });

    const completedTicker = createTicker(els.completedOrders, {
        visibleCount: COMPLETED_VISIBLE,
        rowHeight: COMPLETED_ROW_HEIGHT,
        tickMs: COMPLETED_TICK_MS,
        transitionMode: 'page',
        rowSelector: '.completed-row',
        emptyText: '近三日尚無已完成工單',
        renderRow: (row) => {
            const customerProduct = `${row.customer_name || '-'} / ${row.screening_item_name || row.order_number || '-'}`;
            const workOrderNumber = row.work_order_number || '-';
            const machineName = row.machine_name || '未指定機台';
            const completionTime = row.completion_time || row.completed_at || row.actual_end_date;

            return `
                <div class="completed-row">
                    <div class="completed-time">${escapeHtml(formatCompletedTime(completionTime))}</div>
                    <div class="completed-work-number" title="${escapeHtml(workOrderNumber)}">${escapeHtml(workOrderNumber)}</div>
                    <div class="completed-customer" title="${escapeHtml(customerProduct)}">${escapeHtml(customerProduct)}</div>
                    <div class="completed-machine" title="${escapeHtml(machineName)}">${escapeHtml(machineName)}</div>
                </div>
            `;
        }
    });

    function countCompletedToday(rows) {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const d = now.getDate();

        return rows.reduce((count, row) => {
            const completionTime = row.completion_time || row.completed_at || row.actual_end_date;
            const date = toDate(completionTime);
            if (!date) return count;
            if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
                return count + 1;
            }
            return count;
        }, 0);
    }

    function renderMachine(index) {
        const total = state.machineGroups.length;
        if (!total) {
            updateMachineHeader(null, 0, 0);
            workTicker.setData([]);
            return;
        }

        const safeIndex = ((index % total) + total) % total;
        state.machineIndex = safeIndex;
        const group = state.machineGroups[safeIndex];
        updateMachineHeader(group, safeIndex, total);
        workTicker.setData(group.rows);
    }

    function restartMachineRotation() {
        clearMachineTimer();
        if (state.machineGroups.length <= 1) return;
        state.machineTimer = window.setInterval(() => {
            renderMachine(state.machineIndex + 1);
        }, MACHINE_ROTATE_MS);
    }

    async function loadBoard() {
        try {
            if (els.refreshStatus) els.refreshStatus.textContent = '更新中...';

            const response = await fetch(getBoardApiUrl(), { credentials: 'same-origin' });
            const result = await parseBoardResponse(response);
            if (!response.ok || !result.success) {
                throw new Error(result.message || `HTTP ${response.status}`);
            }

            const data = result.data || {};
            const workOrders = Array.isArray(data.work_orders) ? data.work_orders : [];
            const completedOrders = Array.isArray(data.completed_orders) ? data.completed_orders : [];
            const announcements = Array.isArray(data.announcements) ? data.announcements : [];

            state.machineGroups = buildMachineGroups(workOrders);
            renderMachine(0);
            restartMachineRotation();
            completedTicker.setData(completedOrders);
            announcementTicker.setData(announcements);

            if (els.completedCount) {
                els.completedCount.textContent = `${completedOrders.length} 筆`;
            }
            if (els.completedToday) {
                els.completedToday.textContent = `今日 ${countCompletedToday(completedOrders)} 筆`;
            }

            if (els.lastUpdated) {
                els.lastUpdated.textContent = `上次更新 ${new Date().toLocaleTimeString('zh-TW', { hour12: false })}`;
            }
            if (els.refreshStatus) {
                els.refreshStatus.textContent = '每 30 秒更新';
            }
        } catch (error) {
            console.error('Status board load failed:', error);
            const message = normalizeFetchError(error);
            showLoadError(message);
            if (els.refreshStatus) {
                els.refreshStatus.textContent = message.includes('登入') ? '更新失敗：登入逾期' : '更新失敗';
            }
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
        clearMachineTimer();
        workTicker.destroy();
        completedTicker.destroy();
        announcementTicker.destroy();
    });
})();
