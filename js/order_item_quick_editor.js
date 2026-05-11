/**
 * Order item quick editor used by the orders module inline detail list.
 */
(function() {
    'use strict';

    const state = {
        modal: null,
        options: null,
        optionsLoaded: false,
        current: null,
        isSubmitting: false,
    };

    function formatOptionLabel(item) {
        if (!item) return '';
        return [item.item_number, item.name].filter(Boolean).join(' - ') || `ID ${item.id}`;
    }

    function ensureModal(moduleRoot) {
        if (state.modal) return state.modal;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay hidden';
        modal.setAttribute('data-orders-item-modal', '');
        modal.innerHTML = `
            <div class="modal-window large orders-item-modal">
                <button type="button" class="modal-close" data-action="close-order-item-modal" aria-label="關閉"><i class="fas fa-times"></i></button>
                <h3>編輯訂單細項</h3>
                <div class="modal-alert hidden" data-orders-item-modal-alert role="alert"></div>
                <form data-orders-item-form novalidate>
                    <div class="form-section">
                        <h4>基本資料</h4>
                        <div class="form-grid form-grid-two-columns">
                            <label class="inline-label full-width"><span>受篩產品 <abbr title="必填">*</abbr></span><select name="screening_item_id" required><option value="">-- 請選擇 --</option></select></label>
                            <label class="inline-label"><span>客戶批號</span><input type="text" name="customer_batch_number" maxlength="100"></label>
                            <label class="inline-label"><span>圖面編號</span><input type="text" name="drawing_number" maxlength="255"></label>
                            <label class="inline-label"><span>品項編號</span><input type="text" name="sub_item_number" maxlength="100"></label>
                            <label class="inline-label"><span>料號</span><input type="text" name="part_number" maxlength="100"></label>
                        </div>
                    </div>
                    <div class="form-section">
                        <h4>重量與狀態</h4>
                        <div class="form-grid form-grid-two-columns">
                            <label class="inline-label"><span>總重量(kg) <abbr title="必填">*</abbr></span><input type="number" name="total_weight_kg" min="0" step="0.01" required></label>
                            <label class="inline-label"><span>單價/M</span><input type="number" name="unit_price_per_thousand" min="0" step="0.01"></label>
                            <label class="inline-label"><span>生產狀態</span><select name="status"><option value="">-- 請選擇 --</option></select></label>
                            <label class="inline-label"><span>客戶樣品狀態</span><select name="customer_sample_status"><option value="">-- 請選擇 --</option></select></label>
                            <label class="inline-label"><span>客戶提供重量(kg)</span><input type="number" name="customer_provided_weight" min="0" step="0.01"></label>
                            <label class="inline-label"><span>我方確認重量(kg)</span><input type="number" name="confirmed_weight" min="0" step="0.01"></label>
                            <label class="inline-label"><span>實際生產重量(kg)</span><input type="number" name="actual_production_weight" min="0" step="0.01"></label>
                        </div>
                    </div>
                    <div class="form-section">
                        <h4>補充資訊</h4>
                        <div class="form-grid form-grid-two-columns">
                            <label class="inline-label"><span>指送地點</span><input type="text" name="delivery_location"></label>
                            <label class="inline-label full-width"><span>備註</span><textarea name="notes" rows="3"></textarea></label>
                        </div>
                    </div>
                    <div class="form-actions align-right">
                        <button type="button" class="btn outline" data-action="cancel-order-item-modal">取消</button>
                        <button type="submit" class="btn primary" data-action="submit-order-item-modal">儲存</button>
                    </div>
                </form>
            </div>
        `;

        moduleRoot.appendChild(modal);
        modal.querySelectorAll('[data-action="close-order-item-modal"], [data-action="cancel-order-item-modal"]').forEach((button) => {
            button.addEventListener('click', close);
        });
        modal.querySelector('[data-orders-item-form]')?.addEventListener('submit', submit);
        state.modal = modal;
        return modal;
    }

    function showModalAlert(type, message) {
        const alert = state.modal?.querySelector('[data-orders-item-modal-alert]');
        if (!alert) {
            state.current?.showAlert?.(type, message);
            return;
        }

        alert.textContent = message;
        alert.classList.remove('hidden', 'success', 'error', 'warning', 'info');
        alert.classList.add(type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'info' ? 'info' : 'error');
    }

    function hideModalAlert() {
        const alert = state.modal?.querySelector('[data-orders-item-modal-alert]');
        if (!alert) return;
        alert.classList.add('hidden');
        alert.textContent = '';
        alert.classList.remove('success', 'error', 'warning', 'info');
    }

    function close() {
        if (!state.modal) return;
        state.modal.classList.add('hidden');
        hideModalAlert();
        document.removeEventListener('keydown', handleEscape);
        state.current = null;
    }

    function handleEscape(event) {
        if (event.key === 'Escape') close();
    }

    async function loadOptions() {
        if (state.optionsLoaded) return state.options;
        const response = await fetch('api/order_items/options.php', {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' },
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || '載入訂單細項選項失敗。');
        state.options = result.data || {};
        state.optionsLoaded = true;
        return state.options;
    }

    function fillSelect(select, options, selected) {
        select.innerHTML = '<option value="">-- 請選擇 --</option>';
        options.forEach((item) => {
            const option = document.createElement('option');
            option.value = item.value ?? String(item.id);
            option.textContent = item.label ?? formatOptionLabel(item);
            select.appendChild(option);
        });
        select.value = selected ?? '';
    }

    function setValue(form, name, value) {
        const field = form.querySelector(`[name="${name}"]`);
        if (field) field.value = value ?? '';
    }

    function populate(form, item) {
        const selectedScreeningId = item?.screening_item?.id != null ? String(item.screening_item.id) : '';
        const screeningItems = [...(state.options?.screening_items || [])];
        if (selectedScreeningId && !screeningItems.some((option) => String(option.id) === selectedScreeningId)) {
            screeningItems.push(item.screening_item);
        }
        screeningItems.sort((a, b) => formatOptionLabel(a).localeCompare(formatOptionLabel(b), 'zh-TW', {
            numeric: true,
            sensitivity: 'base',
        }));

        fillSelect(form.querySelector('[name="screening_item_id"]'), screeningItems, selectedScreeningId);
        fillSelect(form.querySelector('[name="status"]'), state.options?.statuses || [], item.status ?? '');
        fillSelect(form.querySelector('[name="customer_sample_status"]'), state.options?.customer_sample_statuses || [], item.customer_sample_status ?? '');

        ['total_weight_kg', 'unit_price_per_thousand', 'customer_batch_number', 'drawing_number', 'sub_item_number',
            'part_number', 'customer_provided_weight', 'confirmed_weight', 'actual_production_weight',
            'delivery_location', 'notes'].forEach((name) => setValue(form, name, item[name]));
    }

    function readForm(form) {
        const screeningItemId = Number.parseInt(form.querySelector('[name="screening_item_id"]')?.value || '', 10);
        if (!Number.isInteger(screeningItemId) || screeningItemId <= 0) {
            showModalAlert('error', '請選擇受篩產品。');
            form.querySelector('[name="screening_item_id"]')?.focus();
            return null;
        }

        const totalWeight = Number.parseFloat(form.querySelector('[name="total_weight_kg"]')?.value || '');
        if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
            showModalAlert('error', '請輸入大於 0 的總重量。');
            form.querySelector('[name="total_weight_kg"]')?.focus();
            return null;
        }

        return new FormData(form);
    }

    async function submit(event) {
        event.preventDefault();
        if (state.isSubmitting || !state.current) return;

        const form = event.currentTarget;
        const formData = readForm(form);
        if (!formData) return;
        formData.append('_method', 'PUT');

        const submitButton = form.querySelector('[data-action="submit-order-item-modal"]');
        state.isSubmitting = true;
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = '儲存中...';
        }

        try {
            const response = await fetch(`api/order_items/update.php?id=${encodeURIComponent(state.current.orderItemId)}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
                body: formData,
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || '更新訂單細項失敗。');

            state.current.showAlert?.('success', '訂單細項已更新。');
            if (typeof DataSync !== 'undefined') {
                DataSync.notifyWithDependencies('order_items', DataSync.EVENT_TYPES.UPDATED, result.data);
            }
            const onSaved = state.current.onSaved;
            close();
            if (typeof onSaved === 'function') await onSaved(result.data);
        } catch (error) {
            console.error(error);
            showModalAlert('error', error.message || '更新訂單細項失敗。');
        } finally {
            state.isSubmitting = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = '儲存';
            }
        }
    }

    async function open(options) {
        try {
            const modal = ensureModal(options.moduleRoot);
            hideModalAlert();
            await loadOptions();

            const response = await fetch(`api/order_items/show.php?id=${encodeURIComponent(options.orderItemId)}`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Accept': 'application/json' },
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || '載入訂單細項失敗。');

            state.current = { ...options, item: result.data };
            const form = modal.querySelector('[data-orders-item-form]');
            form.reset();
            populate(form, result.data);
            modal.classList.remove('hidden');
            document.addEventListener('keydown', handleEscape);
            setTimeout(() => form.querySelector('[name="screening_item_id"]')?.focus(), 50);
        } catch (error) {
            console.error(error);
            options.showAlert?.('error', error.message || '載入訂單細項失敗。');
        }
    }

    window.OrderItemQuickEditor = { open };
})();
