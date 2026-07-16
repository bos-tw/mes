(function () {
    'use strict';

    let activeDialog = null;
    let previousFocus = null;

    function ensureToastRegion() {
        let region = document.getElementById('app-toast-region');
        if (!region) {
            region = document.createElement('div');
            region.id = 'app-toast-region';
            region.className = 'app-toast-region';
            region.setAttribute('role', 'status');
            region.setAttribute('aria-live', 'polite');
            document.body.appendChild(region);
        }
        return region;
    }

    function toast(message, type = 'info', options = {}) {
        const item = document.createElement('div');
        item.className = `app-toast app-toast-${type}`;
        item.textContent = String(message || '');
        ensureToastRegion().appendChild(item);
        const timeout = Number(options.timeout ?? (type === 'error' ? 7000 : 3500));
        if (timeout > 0) window.setTimeout(() => item.remove(), timeout);
        return item;
    }

    function confirm(options = {}) {
        if (typeof options === 'string') options = { message: options };
        if (activeDialog) activeDialog(false);

        previousFocus = document.activeElement;
        const overlay = document.createElement('div');
        overlay.className = 'app-dialog-overlay';
        overlay.innerHTML = `
            <div class="app-dialog" role="alertdialog" aria-modal="true" aria-labelledby="app-dialog-title" aria-describedby="app-dialog-description">
                <div class="app-dialog-stage${options.danger === false ? ' app-dialog-stage-neutral' : ''}">${escapeText(options.stage || '流程確認')}</div>
                <h2 id="app-dialog-title">${escapeText(options.title || '請確認此操作')}</h2>
                <p id="app-dialog-description">${escapeText(options.message || '此操作可能影響相關資料。')}</p>
                ${options.impact ? `<div class="app-dialog-impact"><strong>影響範圍</strong><span>${escapeText(options.impact)}</span></div>` : ''}
                ${options.guidance ? `<div class="app-dialog-guidance"><strong>建議動作</strong><span>${escapeText(options.guidance)}</span></div>` : ''}
                <div class="app-dialog-actions">
                    <button type="button" class="btn outline" data-dialog-cancel>${escapeText(options.cancelLabel || '取消')}</button>
                    <button type="button" class="btn ${options.danger === false ? 'primary' : 'danger'}" data-dialog-confirm>${escapeText(options.confirmLabel || '確認')}</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        return new Promise((resolve) => {
            const finish = (answer) => {
                overlay.remove();
                activeDialog = null;
                if (previousFocus instanceof HTMLElement) previousFocus.focus();
                resolve(answer);
            };
            activeDialog = finish;
            const cancel = overlay.querySelector('[data-dialog-cancel]');
            const accept = overlay.querySelector('[data-dialog-confirm]');
            cancel.addEventListener('click', () => finish(false));
            accept.addEventListener('click', () => finish(true));
            overlay.addEventListener('mousedown', (event) => {
                if (event.target === overlay) finish(false);
            });
            overlay.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    finish(false);
                }
                if (event.key === 'Tab') {
                    if ((event.shiftKey && document.activeElement === cancel) || (!event.shiftKey && document.activeElement === accept)) {
                        event.preventDefault();
                        (event.shiftKey ? accept : cancel).focus();
                    }
                }
            });
            cancel.focus();
        });
    }

    function renderErrorSummary(container, errors, heading = '請修正以下問題') {
        if (!(container instanceof Element)) return;
        const messages = (Array.isArray(errors) ? errors : [errors]).filter(Boolean);
        container.innerHTML = messages.length
            ? `<div class="app-error-summary" role="alert" tabindex="-1"><strong>${escapeText(heading)}</strong><ul>${messages.map(error => `<li>${escapeText(error)}</li>`).join('')}</ul></div>`
            : '';
        container.querySelector('.app-error-summary')?.focus();
    }

    function escapeText(value) {
        const span = document.createElement('span');
        span.textContent = String(value ?? '');
        return span.innerHTML;
    }

    window.AppFeedback = Object.freeze({ toast, confirm, renderErrorSummary });
})();
