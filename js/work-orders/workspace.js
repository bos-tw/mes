(function () {
    'use strict';

    const stages = [
        ['basic', '基本資料'], ['schedule', '排程／機台'], ['production', '生產紀錄'],
        ['quality', '品質'], ['completion', '完工入庫'], ['trace', '追溯']
    ];

    function classify(section) {
        const text = section.querySelector('h4,h5')?.textContent || section.textContent.slice(0, 80);
        if (/排程|機台|拆分/.test(text)) return 'schedule';
        if (/生產記錄|現場|快速入口/.test(text)) return 'production';
        if (/尺寸|檢驗|品質|不良/.test(text)) return 'quality';
        if (/入庫|結案|數量平衡/.test(text)) return 'completion';
        if (/圖片|追蹤|歷程|載具|附件/.test(text)) return 'trace';
        return 'basic';
    }

    function incompleteCount(form, stage) {
        return Array.from(form.querySelectorAll(`[data-work-order-stage="${stage}"] [required]`))
            .filter(input => !input.disabled && !String(input.value || '').trim()).length;
    }

    function activate(form, stage) {
        form.dataset.activeWorkOrderStage = stage;
        form.querySelectorAll('[data-work-order-stage]').forEach(section => {
            section.hidden = section.dataset.workOrderStage !== stage;
        });
        form.querySelectorAll('[data-stage-target]').forEach(button => {
            const active = button.dataset.stageTarget === stage;
            button.classList.toggle('active', active);
            button.setAttribute('aria-selected', String(active));
        });
        updateProgress(form);
    }

    function updateProgress(form) {
        let complete = 0;
        const missingByStage = {};
        form.querySelectorAll('[data-stage-target]').forEach(button => {
            const missing = incompleteCount(form, button.dataset.stageTarget);
            missingByStage[button.dataset.stageTarget] = missing;
            button.dataset.missing = String(missing);
            button.title = missing ? `尚缺 ${missing} 個必填欄位` : '此階段必填資料已完成';
            button.classList.toggle('stage-complete', missing === 0);
            if (missing === 0) complete += 1;
        });
        const meter = form.querySelector('[data-stage-progress]');
        if (meter) {
            meter.value = complete;
            meter.nextElementSibling.textContent = `${complete} / ${stages.length} 階段完成`;
        }
        const activeStage = form.dataset.activeWorkOrderStage || 'basic';
        const activeLabel = stages.find(([id]) => id === activeStage)?.[1] || '目前';
        const help = form.querySelector('.work-order-stage-help');
        if (help) {
            const missing = missingByStage[activeStage] || 0;
            help.textContent = missing
                ? `${activeLabel}尚缺 ${missing} 個必填欄位，完成前會阻擋送出。`
                : `${activeLabel}必填資料已齊全，可繼續下一階段。`;
        }
    }

    function enhanceForm(form) {
        if (!form || form.dataset.workOrderWorkspace === 'true') return;
        form.dataset.workOrderWorkspace = 'true';
        const body = form.querySelector('.work-orders-modal-body') || form;
        const sections = Array.from(body.querySelectorAll(':scope > section, :scope > .form-section'));
        if (sections.length < 2) return;
        sections.forEach(section => { section.dataset.workOrderStage = classify(section); });
        const nav = document.createElement('div');
        nav.className = 'work-order-stage-workspace';
        nav.innerHTML = `<div class="work-order-stage-tabs" role="tablist" aria-label="工單作業階段">${stages.map(([id, label]) => `<button type="button" role="tab" data-stage-target="${id}">${label}<span class="stage-marker" aria-hidden="true"></span></button>`).join('')}</div><div class="work-order-stage-progress"><progress max="${stages.length}" value="0" data-stage-progress></progress><span></span></div><p class="work-order-stage-help">頁籤上的狀態點會提示必填資料是否齊全；固定操作列可隨時儲存。</p>`;
        body.prepend(nav);
        nav.addEventListener('click', event => {
            const button = event.target.closest('[data-stage-target]');
            if (button) activate(form, button.dataset.stageTarget);
        });
        form.addEventListener('input', () => updateProgress(form));
        form.addEventListener('change', event => {
            updateProgress(form);
            if (event.target.matches('[name="status_lookup_id"]')) {
                const label = event.target.selectedOptions[0]?.textContent || '';
                const key = event.target.selectedOptions[0]?.dataset.key
                    || (/完成/.test(label) ? 'completed' : /進行/.test(label) ? 'in_progress' : /暫停/.test(label) ? 'paused' : /取消/.test(label) ? 'cancelled' : /待|排程/.test(label) ? 'pending' : '');
                const suggested = window.WorkOrderStateMachine?.suggestedStage(key);
                if (suggested) activate(form, suggested);
            }
        });
        activate(form, 'basic');
    }

    window.WorkOrderWorkspace = Object.freeze({
        enhance(root) {
            root.querySelectorAll('[data-work-orders-create-form], [data-work-orders-edit-form]').forEach(enhanceForm);
        },
        update(root) {
            root.querySelectorAll('[data-work-order-workspace="true"]').forEach(updateProgress);
        }
    });
})();
