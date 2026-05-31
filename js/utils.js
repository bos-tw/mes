/**
 * 共用工具函數庫
 *
 * 所有模組共用的基礎函數集中於此，避免重複定義。
 * 在 index.html 中必須載入在所有模組 JS 之前。
 */
(function () {
    'use strict';

    /**
     * HTML 跳脫函數 — 防止 XSS 注入
     *
     * @param {*} value - 要跳脫的值
     * @returns {string} 跳脫後的安全 HTML 字串
     */
    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    const WORKFLOW_ACTION_LABELS = {
        delete: '可直接刪除',
        rollback_workflow: '請由後段流程依序退回或作廢',
        reopen_work_order: '請先退回工單狀態',
        go_work_order: '請回到工單處理',
        go_shipping: '請回到出貨流程處理',
        go_return: '請先處理退貨流程',
        return_or_void: '請走退貨、沖銷或作廢流程',
        review: '請先檢視流程影響再處理'
    };

    function ensureWorkflowImpactModal() {
        let overlay = document.querySelector('[data-workflow-impact-modal]');
        if (overlay) {
            return overlay;
        }

        overlay = document.createElement('div');
        overlay.className = 'modal-overlay hidden';
        overlay.setAttribute('data-workflow-impact-modal', 'true');
        overlay.innerHTML = [
            '<div class="modal-window small" role="dialog" aria-modal="true" aria-labelledby="workflow-impact-title">',
            '  <h3 id="workflow-impact-title">流程影響確認</h3>',
            '  <div class="modal-alert info hidden" data-workflow-impact-alert></div>',
            '  <div class="info-box" data-workflow-impact-content>',
            '    <p data-workflow-impact-message></p>',
            '    <ul data-workflow-impact-list></ul>',
            '    <p data-workflow-impact-action class="text-muted"></p>',
            '  </div>',
            '  <div class="form-actions">',
            '    <button type="button" class="btn outline" data-action="workflow-cancel">取消</button>',
            '    <button type="button" class="btn danger" data-action="workflow-confirm">確定</button>',
            '  </div>',
            '</div>'
        ].join('');

        document.body.appendChild(overlay);
        return overlay;
    }

    function showWorkflowImpactConfirm(options) {
        const modal = ensureWorkflowImpactModal();
        const title = modal.querySelector('#workflow-impact-title');
        const alertEl = modal.querySelector('[data-workflow-impact-alert]');
        const messageEl = modal.querySelector('[data-workflow-impact-message]');
        const listEl = modal.querySelector('[data-workflow-impact-list]');
        const actionEl = modal.querySelector('[data-workflow-impact-action]');
        const cancelBtn = modal.querySelector('[data-action="workflow-cancel"]');
        const confirmBtn = modal.querySelector('[data-action="workflow-confirm"]');

        const opts = options || {};
        const impacts = Array.isArray(opts.impacts) ? opts.impacts.filter(Boolean) : [];
        const recommendedAction = String(opts.recommendedAction || '').trim();
        const recommendedLabel = WORKFLOW_ACTION_LABELS[recommendedAction] || recommendedAction;
        const allowConfirm = opts.allowConfirm !== false;
        const severity = String(opts.severity || 'info');

        if (title) {
            title.textContent = String(opts.title || '流程影響確認');
        }

        if (alertEl) {
            const isBlocked = !allowConfirm;
            const alertType = isBlocked ? 'warning' : (severity === 'warning' ? 'warning' : 'info');
            const alertText = isBlocked ? '此資料已進入後續流程' : '此操作將影響流程資料';
            alertEl.textContent = alertText;
            alertEl.className = `modal-alert ${alertType}`;
        }

        if (messageEl) {
            messageEl.textContent = String(opts.message || '請確認是否繼續。');
        }

        if (listEl) {
            if (impacts.length > 0) {
                listEl.innerHTML = impacts.map((impact) => `<li>${escapeHtml(impact)}</li>`).join('');
                listEl.classList.remove('hidden');
            } else {
                listEl.innerHTML = '';
                listEl.classList.add('hidden');
            }
        }

        if (actionEl) {
            if (recommendedLabel) {
                actionEl.textContent = `建議動作：${recommendedLabel}`;
                actionEl.classList.remove('hidden');
            } else {
                actionEl.textContent = '';
                actionEl.classList.add('hidden');
            }
        }

        if (cancelBtn) {
            cancelBtn.textContent = allowConfirm ? String(opts.cancelText || '取消') : '關閉';
        }
        if (confirmBtn) {
            confirmBtn.textContent = String(opts.confirmText || '確定');
            confirmBtn.classList.toggle('hidden', !allowConfirm);
        }

        modal.classList.remove('hidden');

        return new Promise((resolve) => {
            const close = (result) => {
                modal.classList.add('hidden');
                modal.removeEventListener('click', onOverlayClick);
                document.removeEventListener('keydown', onKeyDown);
                if (cancelBtn) cancelBtn.removeEventListener('click', onCancel);
                if (confirmBtn) confirmBtn.removeEventListener('click', onConfirm);
                resolve(result);
            };

            const onCancel = () => close(false);
            const onConfirm = () => close(true);
            const onOverlayClick = (event) => {
                if (event.target === modal) {
                    close(false);
                }
            };
            const onKeyDown = (event) => {
                if (event.key === 'Escape') {
                    close(false);
                }
            };

            if (cancelBtn) cancelBtn.addEventListener('click', onCancel);
            if (confirmBtn) confirmBtn.addEventListener('click', onConfirm);
            modal.addEventListener('click', onOverlayClick);
            document.addEventListener('keydown', onKeyDown);
        });
    }

    // 掛載到全域
    window.escapeHtml = escapeHtml;
    window.showWorkflowImpactConfirm = showWorkflowImpactConfirm;
})();
