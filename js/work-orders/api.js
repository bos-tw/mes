(function () {
    'use strict';

    async function request(path, options = {}) {
        const response = await fetch(path, {
            credentials: 'same-origin',
            headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
            ...options
        });
        const payload = await response.json().catch(() => ({ success: false, message: `伺服器回應格式異常（HTTP ${response.status}）` }));
        if (!response.ok || payload.success === false) {
            const error = new Error(payload.message || `工單服務失敗（HTTP ${response.status}）`);
            error.status = response.status;
            error.payload = payload;
            throw error;
        }
        return payload;
    }

    window.WorkOrderApi = Object.freeze({ request });
})();
