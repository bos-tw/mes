(function () {
    'use strict';

    const controllers = new WeakMap();

    function initializeWorkOrderProductionFlow(rootCandidate = document) {
    const root = rootCandidate?.matches?.('[data-module="work_orders"]')
        ? rootCandidate
        : rootCandidate?.querySelector?.('[data-module="work_orders"]');
    const container = root?.querySelector('[data-work-order-production-flow]');
    const inventoryContainer = root?.querySelector('[data-work-order-flow-inventory]');
    if (!root || !container) return null;
    if (controllers.has(root)) return controllers.get(root);

    const state = {
        source: null,
        flow: null,
        activeStageId: null,
        activeRunId: null
    };

    const api = (path, options = {}) => window.WorkOrderApi.request(path, options);
    const escapeHtml = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    const number = (value, digits = 2) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed.toLocaleString('zh-TW', {
            minimumFractionDigits: 0,
            maximumFractionDigits: digits
        }) : '0';
    };
    const value = (raw) => raw === null || raw === undefined ? '' : String(raw);
    const checked = (condition) => condition ? ' checked' : '';
    const selected = (condition) => condition ? ' selected' : '';
    const disabled = (condition) => condition ? ' disabled' : '';
    const toLocalDateTime = (raw) => raw ? String(raw).replace(' ', 'T').slice(0, 16) : '';
    const randomKey = () => window.crypto?.randomUUID?.()
        || `wo-flow-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    function toast(message, type = 'success') {
        if (window.AppFeedback?.toast) {
            window.AppFeedback.toast(message, type);
            return;
        }
        window.alert(message);
    }

    function statusLabel(status) {
        return ({
            pending: '待開始',
            scheduled: '已排程',
            in_progress: '進行中',
            completed: '已完成',
            cancelled: '已取消',
            draft: '草稿',
            confirmed: '已確認',
            reversed: '已撤銷'
        })[status] || status || '-';
    }

    function secondaryModeLabel(mode) {
        return mode === 'second_process' ? '第二道工序'
            : mode === 'relaxed_standard' ? '放寬標準'
                : '';
    }

    function machineOptions(selectedId = '') {
        const source = root.querySelector('[data-work-orders-edit-form] select[data-field="machine"]');
        if (!source) return '<option value="">-- 請選擇 --</option>';
        return Array.from(source.options).map((option) => (
            `<option value="${escapeHtml(option.value)}"${selected(String(option.value) === String(selectedId))}>${escapeHtml(option.textContent)}</option>`
        )).join('');
    }

    function employeeOptions(selectedId = '') {
        const source = root.querySelector('[data-work-orders-edit-form] select[data-field="assigned-employee"]');
        if (!source) return '<option value="">-- 請選擇 --</option>';
        return Array.from(source.options).map((option) => (
            `<option value="${escapeHtml(option.value)}"${selected(String(option.value) === String(selectedId))}>${escapeHtml(option.textContent)}</option>`
        )).join('');
    }

    function sourceTools() {
        return Array.isArray(state.source?.tool_details) ? state.source.tool_details : [];
    }

    function sourceToolOptions(selectedId = '') {
        return [
            '<option value="">-- 請選擇訂單載具 --</option>',
            ...sourceTools().map((tool) => (
                `<option value="${tool.id}" data-tool-id="${tool.tool_id || ''}" data-tool-number="${escapeHtml(tool.tool_number)}" data-tool-name="${escapeHtml(tool.tool_name)}" data-tool-type="${escapeHtml(tool.tool_type)}" data-unit-weight="${value(tool.unit_weight_kg)}"${selected(String(tool.id) === String(selectedId))}>${escapeHtml(tool.tool_name)} × ${number(tool.quantity, 0)}（${number(tool.unit_weight_kg, 3)} kg/個）</option>`
            ))
        ].join('');
    }

    function activeFlowScope() {
        const activeTab = root.querySelector(
            '[data-work-orders-edit-form] .work-order-main-tabs [data-work-order-main-tab].active'
        )?.dataset.workOrderMainTab;
        return activeTab === 'secondary' ? 'secondary' : 'primary';
    }

    function visibleStages() {
        const scope = activeFlowScope();
        return (state.flow?.stages || []).filter((stage) => (
            scope === 'secondary' ? stage.stage_type === 'secondary' : stage.stage_type === 'primary'
        ));
    }

    function currentStage() {
        const stages = visibleStages();
        return stages.find((stage) => Number(stage.id) === Number(state.activeStageId)) || stages[0] || null;
    }

    function currentRun() {
        const stage = currentStage();
        return stage?.machine_runs?.find((run) => Number(run.id) === Number(state.activeRunId))
            || stage?.machine_runs?.[0]
            || null;
    }

    function latestResult(run) {
        const results = Array.isArray(run?.results) ? run.results : [];
        return [...results].sort((left, right) => (
            Number(right.result_revision || 0) - Number(left.result_revision || 0)
        ))[0] || null;
    }

    function setFlow(flow, options = {}) {
        state.flow = flow;
        const stages = visibleStages();
        const hasSecondary = (flow?.stages || []).some((stage) => stage.stage_type === 'secondary');
        const secondaryTab = root.querySelector('[data-work-orders-edit-form] [data-work-order-secondary-tab]');
        if (secondaryTab) {
            secondaryTab.hidden = !hasSecondary;
            secondaryTab.classList.toggle('hidden', !hasSecondary);
            secondaryTab.setAttribute('aria-hidden', hasSecondary ? 'false' : 'true');
        }
        if (!stages.some((stage) => Number(stage.id) === Number(state.activeStageId))) {
            state.activeStageId = stages[0]?.id || null;
        }
        const stage = currentStage();
        if (!stage?.machine_runs?.some((run) => Number(run.id) === Number(state.activeRunId))) {
            state.activeRunId = stage?.machine_runs?.[0]?.id || null;
        }
        render();
        if (options.notify !== false) {
            window.DataSync?.notifyWithDependencies?.('work_orders', window.DataSync.EVENT_TYPES?.UPDATED || 'updated', {
                id: flow?.id
            });
        }
    }

    function eventSourceForPath(path) {
        if (path.includes('machine_runs.php')) return 'work_order_machine_runs';
        if (path.includes('machine_results.php')) return 'work_order_machine_results';
        if (path.includes('result_images.php')) return 'work_order_machine_result_images';
        if (path.includes('stage_transfers.php')) return 'work_order_stage_transfers';
        return 'work_orders';
    }

    function notifyFlowMutation(path, flow) {
        const source = eventSourceForPath(path);
        window.DataSync?.notifyWithDependencies?.(
            source,
            window.DataSync.EVENT_TYPES?.UPDATED || 'updated',
            { id: flow?.id, work_order_id: flow?.id }
        );
    }

    function render() {
        if (!state.flow) {
            container.innerHTML = '<p class="text-muted">尚未載入製程資料。</p>';
            if (inventoryContainer) {
                inventoryContainer.innerHTML = '<p class="text-muted">尚未載入庫存與結案資料。</p>';
            }
            return;
        }
        const stages = visibleStages();
        if (stages.length === 0) {
            container.innerHTML = activeFlowScope() === 'secondary'
                ? '<div class="empty-state">尚未建立二次篩分轉流。</div>'
                : '<div class="empty-state">此工單尚未建立生產與篩分流程。</div>';
            renderInventorySummary();
            return;
        }
        const stage = currentStage();
        const run = currentRun();
        container.innerHTML = `
            ${stages.length > 1 ? `
                <div class="work-order-production-mode-tabs work-order-screening-stage-tabs" role="tablist" aria-label="二次篩分方式">
                    ${stages.map((item) => `
                    <button type="button" class="btn outline small tab-btn${Number(item.id) === Number(stage?.id) ? ' active' : ''}"
                        data-flow-action="select-stage" data-stage-id="${item.id}" aria-pressed="${Number(item.id) === Number(stage?.id)}">
                        ${escapeHtml(secondaryModeLabel(item.secondary_mode) || item.display_name || '生產與篩分')}
                        <span class="status-badge secondary">${escapeHtml(statusLabel(item.status))}</span>
                    </button>
                    `).join('')}
                </div>
            ` : ''}
            ${renderStage(stage, run)}
        `;
        renderInventorySummary();
    }

    function renderInventorySummary() {
        if (!inventoryContainer || !state.flow) return;
        const stages = state.flow.stages || [];
        const resultRows = [];
        const transferRows = [];
        let unresolvedOutputs = 0;

        stages.forEach((stage) => {
            const completedTransfers = (stage.transfers || []).filter((transfer) => transfer.transfer_status === 'completed');
            completedTransfers.forEach((transfer) => {
                transferRows.push({
                    stage,
                    transfer
                });
            });
            (stage.machine_runs || []).forEach((run) => {
                const result = latestResult(run);
                if (!result || result.result_status !== 'confirmed') return;
                const resultTransfers = completedTransfers.filter((transfer) => (
                    Number(transfer.source_machine_result_id) === Number(result.id)
                ));
                const usedGood = resultTransfers
                    .filter((transfer) => transfer.source_quality === 'good')
                    .reduce((sum, transfer) => sum + Number(transfer.transferred_units || 0), 0);
                const usedDefect = resultTransfers
                    .filter((transfer) => transfer.source_quality === 'defect')
                    .reduce((sum, transfer) => sum + Number(transfer.transferred_units || 0), 0);
                const pendingGood = Math.max(Number(result.machine_good_units || 0) - usedGood, 0);
                const pendingDefect = Math.max(Number(result.settled_defect_units || 0) - usedDefect, 0);
                if (pendingGood > 0) {
                    unresolvedOutputs += 1;
                    resultRows.push({ stage, run, quality: '良品', units: pendingGood });
                }
                if (pendingDefect > 0) {
                    unresolvedOutputs += 1;
                    resultRows.push({ stage, run, quality: '不良品', units: pendingDefect });
                }
            });
        });

        const activeRuns = stages.flatMap((stage) => (
            (stage.machine_runs || []).filter((run) => run.status !== 'cancelled')
        ));
        const allRunsCompleted = activeRuns.length > 0 && activeRuns.every((run) => run.status === 'completed');
        const closed = Boolean(state.flow.completed_at) && unresolvedOutputs === 0;
        inventoryContainer.innerHTML = `
            <div class="form-grid form-grid-four-columns">
                <div class="ui-metric-card"><span class="text-muted small">正式階段</span><strong>${number(stages.length, 0)}</strong></div>
                <div class="ui-metric-card"><span class="text-muted small">有效機台</span><strong>${number(activeRuns.length, 0)}</strong></div>
                <div class="ui-metric-card"><span class="text-muted small">待處置輸出</span><strong>${number(unresolvedOutputs, 0)}</strong></div>
                <div class="ui-metric-card"><span class="text-muted small">工單狀態</span><strong>${closed ? '已結案' : allRunsCompleted && unresolvedOutputs === 0 ? '待系統結案' : '進行中'}</strong></div>
            </div>
            <section class="form-section ui-compact-section">
                <h4>轉流與終點入庫</h4>
                <div class="table-responsive">
                    <table class="data-table compact ui-compact-table">
                        <thead><tr><th>來源階段</th><th>品質</th><th>處置</th><th>支數</th><th>淨重(kg)</th><th>庫存／目標</th><th>狀態</th></tr></thead>
                        <tbody>
                            ${transferRows.map(({ stage, transfer }) => `
                                <tr>
                                    <td>${escapeHtml(stage.display_name || secondaryModeLabel(stage.secondary_mode) || '生產與篩分')}</td>
                                    <td>${transfer.source_quality === 'good' ? '良品' : '不良品'}</td>
                                    <td>${transfer.route === 'secondary_screening' ? `二次篩分－${escapeHtml(secondaryModeLabel(transfer.secondary_mode))}` : '終點入庫'}</td>
                                    <td>${number(transfer.transferred_units)}</td>
                                    <td>${number(transfer.transferred_net_weight_kg, 3)}</td>
                                    <td>${transfer.inventory_item_id ? `庫存 #${transfer.inventory_item_id}` : transfer.target_stage_id ? `階段 #${transfer.target_stage_id}` : '-'}</td>
                                    <td>${escapeHtml(statusLabel(transfer.transfer_status))}</td>
                                </tr>
                            `).join('') || '<tr class="empty-row"><td colspan="7" class="text-center">尚無轉流或入庫紀錄</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </section>
            <section class="form-section ui-compact-section">
                <h4>尚待處置</h4>
                <div class="table-responsive">
                    <table class="data-table compact ui-compact-table">
                        <thead><tr><th>階段</th><th>機台</th><th>品質</th><th>待處置支數</th><th>下一步</th></tr></thead>
                        <tbody>
                            ${resultRows.map(({ stage, run, quality, units }) => `
                                <tr>
                                    <td>${escapeHtml(stage.display_name || secondaryModeLabel(stage.secondary_mode) || '生產與篩分')}</td>
                                    <td>${escapeHtml(run.run_label || `機台${run.machine_sequence}`)}</td>
                                    <td>${quality}</td>
                                    <td>${number(units)}</td>
                                    <td>回到「${stage.stage_type === 'secondary' ? '二次篩分' : '生產與篩分'}」完成入庫或轉流</td>
                                </tr>
                            `).join('') || '<tr class="empty-row"><td colspan="5" class="text-center">目前沒有待處置輸出</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    function renderStage(stage, run) {
        const activeRuns = (stage.machine_runs || []).filter((item) => item.status !== 'cancelled');
        const incomingUnits = (state.flow.stages || []).flatMap((sourceStage) => sourceStage.transfers || [])
            .filter((transfer) => Number(transfer.target_stage_id) === Number(stage.id) && transfer.transfer_status === 'completed')
            .reduce((sum, transfer) => sum + Number(transfer.transferred_units || 0), 0);
        const availableUnits = stage.stage_type === 'primary'
            ? Number(state.flow.total_units || 0)
            : incomingUnits;
        const plannedUnits = activeRuns.reduce((sum, item) => sum + Number(item.planned_units || 0), 0);
        const remainingUnits = Math.max(availableUnits - plannedUnits, 0);
        return `
            <section class="form-section ui-compact-section work-order-flow-stage">
                <header class="split-work-order-header">
                    <div>
                        <h4>${escapeHtml(stage.display_name)}${stage.stage_type === 'secondary' ? `－${escapeHtml(secondaryModeLabel(stage.secondary_mode))}` : ''}</h4>
                        <p class="text-muted small">
                            來源 ${escapeHtml(stage.source_quality || '訂單細項')}／可分配 ${number(availableUnits)} 支／已規劃 ${number(plannedUnits)} 支／剩餘 ${number(remainingUnits)} 支
                            · 圖片 ${stage.image_requirement === 'required' ? `必填 ${number(stage.image_min_count, 0)} 張` : '選填'}
                        </p>
                    </div>
                    ${stage.status !== 'completed' && stage.status !== 'cancelled' ? `
                        <button type="button" class="btn outline small" data-flow-action="toggle-add-machine">
                            <i class="fas fa-plus"></i> 加開機台
                        </button>
                    ` : ''}
                </header>
                <div class="form-grid form-grid-four-columns work-order-flow-inline-form hidden" data-flow-add-machine-form>
                    <label class="inline-label"><span>機台</span><select name="machine_id" required>${machineOptions()}</select></label>
                    <label class="inline-label"><span>指派人員</span><select name="assigned_employee_id">${employeeOptions()}</select></label>
                    <label class="inline-label"><span>校機人員</span><select name="calibration_employee_id">${employeeOptions()}</select></label>
                    <label class="inline-label"><span>預計支數</span><input type="number" name="planned_units" min="0.01" step="0.01" value="${value(remainingUnits)}" required></label>
                    <label class="inline-label"><span>預定開始</span><input type="datetime-local" name="scheduled_start_date"></label>
                    <label class="inline-label"><span>預定結束</span><input type="datetime-local" name="scheduled_end_date"></label>
                    <label class="inline-label"><span>單支重(g)</span><input type="number" name="weight_per_unit_g" min="0.0001" step="0.0001" value="${value(state.flow.weight_per_unit_g)}" required></label>
                    <div class="form-actions">
                        <button type="button" class="btn primary small" data-flow-action="create-machine">建立機台</button>
                    </div>
                </div>
                <div class="split-work-order-layout">
                    <div class="split-machine-tabs">
                        ${(stage.machine_runs || []).map((item) => `
                            <button type="button" class="btn outline small tab-btn${Number(item.id) === Number(run?.id) ? ' active' : ''}"
                                data-flow-action="select-run" data-run-id="${item.id}">
                                ${escapeHtml(item.run_label || `機台${item.machine_sequence}`)}
                                <span class="status-badge secondary">${escapeHtml(statusLabel(item.status))}</span>
                            </button>
                        `).join('') || '<p class="text-muted small">尚未配置機台</p>'}
                    </div>
                    <div class="split-machine-editor">
                        ${run ? renderRun(stage, run) : '<div class="empty-state">請使用「加開機台」建立此階段的第一台機台。</div>'}
                    </div>
                </div>
            </section>
            ${renderTransfers(stage)}
        `;
    }

    function renderRun(stage, run) {
        const result = latestResult(run);
        return `
            ${renderMachinePlan(run)}
            ${renderCards(run)}
            ${renderFirstPiece(run)}
            ${renderMachineResult(stage, run, result)}
            ${result?.result_status === 'confirmed' ? renderOutputs(stage, result) : ''}
        `;
    }

    function renderMachinePlan(run) {
        const locked = run.status === 'completed' || (run.results || []).length > 0;
        return `
            <details class="work-order-flow-panel" open>
                <summary>機台規劃與排程</summary>
                <div class="work-order-flow-panel-body form-grid form-grid-four-columns" data-flow-machine-plan data-run-id="${run.id}">
                    <label class="inline-label"><span>機台名稱</span><input type="text" name="run_label" value="${escapeHtml(run.run_label)}"${disabled(locked)}></label>
                    <label class="inline-label"><span>指定機台</span><select name="machine_id"${disabled(locked)}>${machineOptions(run.machine_id)}</select></label>
                    <label class="inline-label"><span>指派人員</span><select name="assigned_employee_id"${disabled(locked)}>${employeeOptions(run.assigned_employee_id)}</select></label>
                    <label class="inline-label"><span>校機人員</span><select name="calibration_employee_id"${disabled(locked)}>${employeeOptions(run.calibration_employee_id)}</select></label>
                    <label class="inline-label"><span>預定開始</span><input type="datetime-local" name="scheduled_start_date" value="${toLocalDateTime(run.scheduled_start_date)}"${disabled(locked)}></label>
                    <label class="inline-label"><span>預定結束</span><input type="datetime-local" name="scheduled_end_date" value="${toLocalDateTime(run.scheduled_end_date)}"${disabled(locked)}></label>
                    <label class="inline-label"><span>預計支數</span><input type="number" name="planned_units" min="0.01" step="0.01" value="${value(run.planned_units)}"${disabled(locked)}></label>
                    <label class="inline-label"><span>單支重(g)</span><input type="number" name="weight_per_unit_g" min="0.0001" step="0.0001" value="${value(run.weight_per_unit_g)}"${disabled(locked)}></label>
                    <label class="inline-label"><span>篩分速度</span><input type="text" name="screening_speed" value="${escapeHtml(run.screening_speed || '')}"${disabled(locked)}></label>
                    <label class="inline-label full-width"><span>備註</span><textarea name="notes" rows="2"${disabled(locked)}>${escapeHtml(run.notes || '')}</textarea></label>
                    ${!locked ? `
                        <div class="form-actions">
                            <button type="button" class="btn primary small" data-flow-action="save-machine-plan">儲存機台規劃</button>
                            <button type="button" class="btn danger small" data-flow-action="cancel-machine" data-run-id="${run.id}">取消機台</button>
                        </div>
                    ` : ''}
                </div>
            </details>
        `;
    }

    function renderCards(run) {
        const cards = run.cards || [];
        const toolsByRecord = new Map((run.input_tools || []).map((tool) => [Number(tool.production_record_id), tool]));
        const sourceMode = cards[0]?.production_source_mode || 'preset';
        return `
            <details class="work-order-flow-panel">
                <summary>卡號、進料載具與實秤－${number(cards.length, 0)} 筆</summary>
                <div class="work-order-flow-panel-body" data-flow-card-form data-run-id="${run.id}">
                    <div class="ui-compact-form-row">
                        <label class="inline-label"><span>載具來源</span>
                            <select name="source_mode">
                                <option value="preset"${selected(sourceMode === 'preset')}>生管預設</option>
                                <option value="manual"${selected(sourceMode === 'manual')}>自行輸入</option>
                            </select>
                        </label>
                        <p class="text-muted small">兩種模式都會自動計算累計裝載參考號；輸入實秤毛重後該列即鎖定。</p>
                        <button type="button" class="btn outline small" data-flow-action="add-card-row"><i class="fas fa-plus"></i> 新增載具列</button>
                    </div>
                    <div class="table-responsive">
                        <table class="data-table compact ui-compact-table">
                            <thead><tr><th>裝載參考號</th><th>訂單載具</th><th>載具名稱</th><th>數量</th><th>皮重(kg)</th><th>實秤毛重(kg)</th><th>內容淨重(kg)</th><th>狀態</th><th>操作</th></tr></thead>
                            <tbody data-flow-card-rows>
                                ${cards.map((card) => renderCardRow(card, toolsByRecord.get(Number(card.id)), sourceMode)).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="form-actions"><button type="button" class="btn primary small" data-flow-action="save-cards">儲存卡號與實秤</button></div>
                </div>
            </details>
        `;
    }

    function renderCardRow(card = {}, inputTool = {}, sourceMode = 'preset') {
        const locked = Boolean(card.card_locked_at || card.actual_gross_weight_kg !== null && card.actual_gross_weight_kg !== undefined);
        return `
            <tr data-flow-card-row data-card-id="${card.id || ''}" data-locked="${locked ? '1' : '0'}">
                <td><strong>${escapeHtml(card.card_number || '儲存後計算')}</strong></td>
                <td><select name="order_item_tool_id"${disabled(locked || sourceMode === 'manual')}>${sourceToolOptions(inputTool.order_item_tool_id)}</select></td>
                <td><input type="text" name="tool_name" value="${escapeHtml(inputTool.tool_name || card.tool_name || '')}"${disabled(locked)}></td>
                <td><input type="number" name="quantity" min="1" step="1" value="${value(inputTool.quantity || 1)}"${disabled(locked)}></td>
                <td><input type="number" name="unit_weight_kg" min="0" step="0.001" value="${value(inputTool.unit_weight_kg ?? card.tool_weight_kg ?? 0)}"${disabled(locked)}></td>
                <td><input type="number" name="actual_gross_weight_kg" min="0" step="0.001" value="${value(card.actual_gross_weight_kg)}"${disabled(locked)}></td>
                <td>${number(card.actual_net_weight_kg, 3)}</td>
                <td><span class="status-badge ${locked ? 'success' : 'secondary'}">${locked ? '已秤重鎖定' : '待秤重'}</span></td>
                <td>${locked ? '-' : `<button type="button" class="op-action-btn danger" data-flow-action="remove-card-row" title="移除"><i class="fas fa-trash"></i></button>`}</td>
            </tr>
        `;
    }

    function renderFirstPiece(run) {
        const history = run.first_piece_dimensions || [];
        const latest = history[history.length - 1];
        return `
            <details class="work-order-flow-panel">
                <summary>首件尺寸檢驗 ${latest ? `－最新${latest.inspection_result === 'passed' ? '合格' : '不合格'}` : '－尚未檢驗'}</summary>
                <div class="work-order-flow-panel-body" data-flow-first-piece data-run-id="${run.id}">
                    <div class="form-grid form-grid-four-columns">
                        ${[
                            ['head_height', '頭高'], ['head_width', '頭寬'], ['length', '長度'], ['thread_outer_diameter', '牙外徑'],
                            ['washer_diameter', '華司徑'], ['outer_diameter', '外徑'], ['hole_diameter', '孔徑'], ['thickness', '厚度']
                        ].map(([name, label]) => `<label class="inline-label"><span>${label}(mm)</span><input type="number" name="${name}" min="0" step="0.001"></label>`).join('')}
                        <label class="inline-label"><span>判定</span><select name="inspection_result"><option value="passed">合格</option><option value="failed">不合格</option></select></label>
                        <label class="inline-label full-width"><span>備註</span><textarea name="notes" rows="2"></textarea></label>
                    </div>
                    <div class="form-actions"><button type="button" class="btn primary small" data-flow-action="save-first-piece">新增一輪首件檢驗</button></div>
                    <div class="table-responsive">
                        <table class="data-table compact ui-compact-table">
                            <thead><tr><th>輪次</th><th>判定</th><th>測量人員</th><th>測量時間</th><th>備註</th></tr></thead>
                            <tbody>${history.map((item) => `<tr><td>${item.inspection_round}</td><td>${item.inspection_result === 'passed' ? '合格' : '不合格'}</td><td>${escapeHtml(item.measured_by_name || '-')}</td><td>${escapeHtml(item.measured_at || '-')}</td><td>${escapeHtml(item.notes || '-')}</td></tr>`).join('') || '<tr class="empty-row"><td colspan="5" class="text-center">尚無首件檢驗</td></tr>'}</tbody>
                        </table>
                    </div>
                </div>
            </details>
        `;
    }

    function renderMachineResult(stage, run, result) {
        const immutable = result && result.result_status !== 'draft';
        const defectsByService = new Map((result?.defects || []).map((item) => [Number(item.screening_service_id), item]));
        const packages = result?.packages || [];
        const outputTools = result?.output_tools || [];
        const expanded = result?.result_status === 'draft' ? ' open' : '';
        return `
            <details class="work-order-flow-panel"${expanded}>
                <summary>機台完成結果 ${result ? `－第${result.result_revision}版 ${statusLabel(result.result_status)}` : ''}</summary>
                <div class="work-order-flow-panel-body" data-flow-result-form data-run-id="${run.id}" data-result-id="${result?.id || ''}">
                    <div class="form-grid form-grid-four-columns">
                        <label class="inline-label"><span>投入支數</span><input type="number" name="input_units" min="0" step="0.01" value="${value(result?.input_units ?? run.planned_units)}"${disabled(immutable)}></label>
                        <label class="inline-label"><span>投入淨重(kg)</span><input type="number" name="input_net_weight_kg" min="0" step="0.001" value="${value(result?.input_net_weight_kg ?? run.planned_net_weight_kg)}"${disabled(immutable)}></label>
                        <label class="inline-label"><span>機台處理總數</span><input type="number" name="machine_processed_units" min="0" step="1" value="${value(result?.machine_processed_units)}"${disabled(immutable)}></label>
                        <label class="inline-label"><span>機台良品支數</span><input type="number" name="machine_good_units" min="0" step="1" value="${value(result?.machine_good_units)}"${disabled(immutable)}></label>
                        <label class="inline-label"><span>機台原始不良(100)</span><input type="number" name="machine_defect_units" min="0" step="1" value="${value(result?.machine_defect_units)}"${disabled(immutable)}></label>
                        <label class="inline-label"><span>不良實秤淨重(kg)</span><input type="number" name="defect_weight_kg" min="0" step="0.001" value="${value(result?.defect_weight_kg)}"${disabled(immutable)}></label>
                        <label class="inline-label"><span>單支重快照(g)</span><input type="number" name="weight_per_unit_g" min="0.0001" step="0.0001" value="${value(result?.weight_per_unit_g ?? run.weight_per_unit_g)}"${disabled(immutable)}></label>
                        <label class="inline-label"><span>入庫不良(99)</span><input type="text" readonly class="readonly-field" value="${value(result?.settled_defect_units || '後端計算')}"></label>
                        <label class="inline-label"><span>差異支數</span><input type="text" readonly class="readonly-field" value="${value(result?.defect_difference_units || '後端計算')}"></label>
                        <label class="inline-label full-width"><span>完成備註</span><textarea name="notes" rows="2"${disabled(immutable)}>${escapeHtml(result?.notes || '')}</textarea></label>
                    </div>
                    <h5>篩分服務原始不良明細</h5>
                    <div class="table-responsive">
                        <table class="data-table compact ui-compact-table">
                            <thead><tr><th>服務項目</th><th>原始不良支數</th><th>備註</th></tr></thead>
                            <tbody>${(stage.services || []).map((service) => {
                                const defect = defectsByService.get(Number(service.screening_service_id));
                                return `<tr data-flow-defect-row data-service-id="${service.screening_service_id}"><td>${escapeHtml(service.service_name)}</td><td><input type="number" name="defect_quantity" min="0" step="1" value="${value(defect?.defect_quantity ?? 0)}"${disabled(immutable)}></td><td><input type="text" name="notes" value="${escapeHtml(defect?.notes || '')}"${disabled(immutable)}></td></tr>`;
                            }).join('')}</tbody>
                        </table>
                    </div>
                    ${renderOutputTools(run, outputTools, immutable)}
                    ${renderPackages(packages, immutable)}
                    ${result ? renderResultImages(result, immutable) : '<p class="text-muted small">先儲存草稿後即可上傳機台畫面。</p>'}
                    ${!immutable ? `
                        <div class="form-actions">
                            <button type="button" class="btn secondary small" data-flow-action="save-result-draft">儲存草稿</button>
                            <button type="button" class="btn primary small" data-flow-action="confirm-result">確認機台完成</button>
                        </div>
                    ` : result?.result_status === 'confirmed' ? `
                        <div class="form-actions"><button type="button" class="btn danger small" data-flow-action="reverse-result" data-result-id="${result.id}">撤銷結果</button></div>
                    ` : ''}
                </div>
            </details>
        `;
    }

    function renderOutputTools(run, outputTools, immutable) {
        const rows = outputTools.length ? outputTools : [];
        return `
            <h5>良品實際出料載具</h5>
            ${!immutable ? `<button type="button" class="btn outline small" data-flow-action="add-output-tool"><i class="fas fa-plus"></i> 新增出料載具</button>` : ''}
            <div class="table-responsive">
                <table class="data-table compact ui-compact-table">
                    <thead><tr><th>使用方式</th><th>來源進料載具</th><th>載具名稱</th><th>數量</th><th>單重(kg)</th><th>操作</th></tr></thead>
                    <tbody data-flow-output-tool-rows>${rows.map((tool) => renderOutputToolRow(run, tool, immutable)).join('')}</tbody>
                </table>
            </div>
            <h5>原進料載具後續處置</h5>
            <div class="table-responsive">
                <table class="data-table compact ui-compact-table">
                    <thead><tr><th>進料載具</th><th>數量</th><th>處置</th><th>說明</th></tr></thead>
                    <tbody>${(run.input_tools || []).map((tool) => `
                        <tr data-flow-disposition-row data-input-tool-id="${tool.id}">
                            <td>${escapeHtml(tool.tool_name)}</td><td>${number(tool.quantity, 0)}</td>
                            <td><select name="disposition"${disabled(immutable)}>
                                <option value="">-- 請選擇 --</option>
                                <option value="reused_for_good"${selected(tool.disposition === 'reused_for_good')}>沿用裝良品</option>
                                <option value="return_empty"${selected(tool.disposition === 'return_empty')}>空載具歸還</option>
                                <option value="stored_on_site"${selected(tool.disposition === 'stored_on_site')}>現場暫存</option>
                                <option value="damaged"${selected(tool.disposition === 'damaged')}>損壞</option>
                                <option value="other"${selected(tool.disposition === 'other')}>其他</option>
                            </select></td>
                            <td><input type="text" name="notes" value="${escapeHtml(tool.disposition_notes || '')}"${disabled(immutable)}></td>
                        </tr>
                    `).join('') || '<tr class="empty-row"><td colspan="4" class="text-center">尚無進料載具</td></tr>'}</tbody>
                </table>
            </div>
        `;
    }

    function renderOutputToolRow(run, tool = {}, immutable = false) {
        return `
            <tr data-flow-output-tool-row data-output-tool-id="${tool.id || ''}">
                <td><select name="use_mode"${disabled(immutable)}><option value="reused"${selected((tool.use_mode || 'reused') === 'reused')}>沿用進料載具</option><option value="replacement"${selected(tool.use_mode === 'replacement')}>更換載具</option></select></td>
                <td><select name="source_input_tool_id"${disabled(immutable)}><option value="">-- 無 --</option>${(run.input_tools || []).map((input) => `<option value="${input.id}"${selected(String(input.id) === String(tool.source_input_tool_id))}>${escapeHtml(input.tool_name)} × ${number(input.quantity, 0)}</option>`).join('')}</select></td>
                <td><input type="text" name="tool_name" value="${escapeHtml(tool.tool_name || '')}"${disabled(immutable)}></td>
                <td><input type="number" name="quantity" min="1" step="1" value="${value(tool.quantity || 1)}"${disabled(immutable)}></td>
                <td><input type="number" name="unit_weight_kg" min="0" step="0.001" value="${value(tool.unit_weight_kg || 0)}"${disabled(immutable)}></td>
                <td>${immutable ? '-' : '<button type="button" class="op-action-btn danger" data-flow-action="remove-output-tool" title="移除"><i class="fas fa-trash"></i></button>'}</td>
            </tr>
        `;
    }

    function renderPackages(packages, immutable) {
        return `
            <h5>不良品包／袋（塑膠袋不計重）</h5>
            ${!immutable ? `<button type="button" class="btn outline small" data-flow-action="add-package"><i class="fas fa-plus"></i> 新增袋</button>` : ''}
            <div class="table-responsive">
                <table class="data-table compact ui-compact-table">
                    <thead><tr><th>袋號</th><th>包／袋數</th><th>內含支數</th><th>內容物重量(kg)</th><th>操作</th></tr></thead>
                    <tbody data-flow-package-rows>${packages.map((item) => renderPackageRow(item, immutable)).join('')}</tbody>
                </table>
            </div>
        `;
    }

    function renderPackageRow(item = {}, immutable = false) {
        return `
            <tr data-flow-package-row data-package-id="${item.id || ''}">
                <td><input type="text" name="package_number" value="${escapeHtml(item.package_number || '')}"${disabled(immutable)}></td>
                <td><input type="number" name="package_quantity" min="1" step="1" value="${value(item.package_quantity || 1)}"${disabled(immutable)}></td>
                <td><input type="number" name="contained_units" min="0" step="1" value="${value(item.contained_units || 0)}"${disabled(immutable)}></td>
                <td><input type="number" name="content_weight_kg" min="0" step="0.001" value="${value(item.content_weight_kg || 0)}"${disabled(immutable)}></td>
                <td>${immutable ? '-' : '<button type="button" class="op-action-btn danger" data-flow-action="remove-package" title="移除"><i class="fas fa-trash"></i></button>'}</td>
            </tr>
        `;
    }

    function renderResultImages(result, immutable) {
        return `
            <h5>機台畫面（${result.images?.length || 0} 張）</h5>
            <div class="table-responsive">
                <table class="data-table compact ui-compact-table">
                    <thead><tr><th>檔名</th><th>說明</th><th>上傳時間</th><th>操作</th></tr></thead>
                    <tbody>${(result.images || []).map((image) => `<tr><td>${escapeHtml(image.file_name)}</td><td>${escapeHtml(image.description || '-')}</td><td>${escapeHtml(image.uploaded_at || '-')}</td><td>${immutable ? '-' : `<button type="button" class="op-action-btn danger" data-flow-action="delete-result-image" data-image-id="${image.id}" title="移除"><i class="fas fa-trash"></i></button>`}</td></tr>`).join('') || '<tr class="empty-row"><td colspan="4" class="text-center">尚未上傳</td></tr>'}</tbody>
                </table>
            </div>
            ${!immutable ? `
                <div class="ui-compact-form-row">
                    <input type="file" accept="image/jpeg,image/png,image/webp" data-flow-result-image>
                    <input type="text" placeholder="圖片說明" data-flow-result-image-description>
                    <button type="button" class="btn outline small" data-flow-action="upload-result-image" data-result-id="${result.id}">上傳圖片</button>
                </div>
            ` : ''}
        `;
    }

    function renderOutputs(stage, result) {
        const completedTransfers = (stage.transfers || []).filter((transfer) => (
            Number(transfer.source_machine_result_id) === Number(result.id)
            && transfer.transfer_status === 'completed'
        ));
        const usedGood = completedTransfers.filter((item) => item.source_quality === 'good')
            .reduce((sum, item) => sum + Number(item.transferred_units || 0), 0);
        const usedDefect = completedTransfers.filter((item) => item.source_quality === 'defect')
            .reduce((sum, item) => sum + Number(item.transferred_units || 0), 0);
        const goodAvailable = Math.max(Number(result.machine_good_units || 0) - usedGood, 0);
        const defectAvailable = Math.max(Number(result.settled_defect_units || 0) - usedDefect, 0);
        const terminalOnly = stage.stage_type === 'secondary';
        return `
            <details class="work-order-flow-panel" open>
                <summary>結果輸出處置</summary>
                <div class="work-order-flow-panel-body form-grid form-grid-two-columns">
                    <section class="subsection">
                        <h5>良品輸出：可用 ${number(goodAvailable)} 支</h5>
                        ${goodAvailable > 0 ? `<div class="form-actions">
                            <button type="button" class="btn primary small" data-flow-action="transfer-output" data-quality="good" data-route="terminal_good">良品入庫</button>
                            ${!terminalOnly ? '<button type="button" class="btn outline small" data-flow-action="transfer-output" data-quality="good" data-route="secondary_screening" data-secondary-mode="second_process">轉二次篩分－第二道工序</button>' : ''}
                        </div>` : '<p class="text-muted">良品輸出已處理完成。</p>'}
                    </section>
                    <section class="subsection">
                        <h5>不良品輸出：原始 ${number(result.machine_defect_units)}／入庫基準 ${number(result.settled_defect_units)}／可用 ${number(defectAvailable)} 支</h5>
                        ${defectAvailable > 0 ? `<div class="form-actions">
                            <button type="button" class="btn primary small" data-flow-action="transfer-output" data-quality="defect" data-route="terminal_defect">不良品入庫</button>
                            ${!terminalOnly ? '<button type="button" class="btn outline small" data-flow-action="transfer-output" data-quality="defect" data-route="secondary_screening" data-secondary-mode="relaxed_standard">轉二次篩分－放寬標準</button>' : ''}
                        </div>` : '<p class="text-muted">不良品輸出已處理完成。</p>'}
                    </section>
                </div>
            </details>
        `;
    }

    function renderTransfers(stage) {
        return `
            <details class="work-order-flow-panel work-order-flow-history">
                <summary>本階段轉流與入庫紀錄－${number((stage.transfers || []).length, 0)} 筆</summary>
                <div class="work-order-flow-panel-body table-responsive">
                    <table class="data-table compact ui-compact-table">
                        <thead><tr><th>品質</th><th>路徑</th><th>支數</th><th>淨重(kg)</th><th>庫存／目標</th><th>狀態</th><th>操作</th></tr></thead>
                        <tbody>${(stage.transfers || []).map((transfer) => `
                            <tr>
                                <td>${transfer.source_quality === 'good' ? '良品' : '不良品'}</td>
                                <td>${transfer.route === 'secondary_screening' ? `二次篩分－${escapeHtml(secondaryModeLabel(transfer.secondary_mode))}` : '終點入庫'}</td>
                                <td>${number(transfer.transferred_units)}</td>
                                <td>${number(transfer.transferred_net_weight_kg, 3)}</td>
                                <td>${transfer.inventory_item_id ? `庫存 #${transfer.inventory_item_id}` : transfer.target_stage_id ? `階段 #${transfer.target_stage_id}` : '-'}</td>
                                <td>${escapeHtml(statusLabel(transfer.transfer_status))}</td>
                                <td>${transfer.transfer_status === 'completed' ? `<button type="button" class="op-action-btn danger" data-flow-action="reverse-transfer" data-transfer-id="${transfer.id}" title="撤銷"><i class="fas fa-undo"></i></button>` : '-'}</td>
                            </tr>
                        `).join('') || '<tr class="empty-row"><td colspan="7" class="text-center">尚無轉流紀錄</td></tr>'}</tbody>
                    </table>
                </div>
            </details>
        `;
    }

    function formObject(scope) {
        const data = {};
        scope.querySelectorAll('[name]').forEach((field) => {
            if (field.disabled || !field.name) return;
            if ((field.type === 'checkbox' || field.type === 'radio') && !field.checked) return;
            data[field.name] = field.value;
        });
        return data;
    }

    function validateScope(scope) {
        const invalidField = Array.from(scope.querySelectorAll('input, select, textarea'))
            .find((field) => !field.disabled && typeof field.checkValidity === 'function' && !field.checkValidity());
        if (!invalidField) return true;
        invalidField.reportValidity();
        return false;
    }

    async function mutate(path, options, successMessage) {
        try {
            const response = await api(path, options);
            setFlow(response.data, { notify: false });
            notifyFlowMutation(path, response.data);
            toast(response.message || successMessage);
            return response;
        } catch (error) {
            toast(error.message || '操作失敗。', 'error');
            throw error;
        }
    }

    root.addEventListener('work-order:loaded', (event) => {
        state.source = event.detail?.workOrder || null;
        const flow = state.source?.production_flow;
        if (flow) setFlow(flow, { notify: false });
    });

    root.addEventListener('work-order:main-tab-changed', (event) => {
        if (!event.detail?.isEditMode) return;
        const tabName = event.detail?.tabName;
        if (!['flow', 'secondary', 'inventory'].includes(tabName)) return;
        if (tabName === 'flow') {
            state.activeStageId = (state.flow?.stages || []).find((stage) => stage.stage_type === 'primary')?.id || null;
            state.activeRunId = null;
        } else if (tabName === 'secondary') {
            state.activeStageId = (state.flow?.stages || []).find((stage) => stage.stage_type === 'secondary')?.id || null;
            state.activeRunId = null;
        }
        render();
    });

    container.addEventListener('change', (event) => {
        const target = event.target;
        if (target.matches('[data-flow-card-form] [name="source_mode"]')) {
            container.querySelectorAll('[data-flow-card-row]').forEach((row) => {
                const preset = target.value === 'preset';
                const select = row.querySelector('[name="order_item_tool_id"]');
                if (select && row.dataset.locked !== '1') select.disabled = !preset;
            });
        }
        if (target.matches('[data-flow-card-row] [name="order_item_tool_id"]')) {
            const row = target.closest('[data-flow-card-row]');
            const option = target.selectedOptions[0];
            if (option?.value) {
                row.querySelector('[name="tool_name"]').value = option.dataset.toolName || '';
                row.querySelector('[name="unit_weight_kg"]').value = option.dataset.unitWeight || '0';
            }
        }
    });

    container.addEventListener('click', async (event) => {
        const button = event.target.closest('[data-flow-action]');
        if (!button) return;
        const action = button.dataset.flowAction;
        const stage = currentStage();
        const run = currentRun();
        if (action === 'select-stage') {
            state.activeStageId = Number(button.dataset.stageId);
            state.activeRunId = null;
            render();
            return;
        }
        if (action === 'select-run') {
            state.activeRunId = Number(button.dataset.runId);
            render();
            return;
        }
        if (action === 'toggle-add-machine') {
            container.querySelector('[data-flow-add-machine-form]')?.classList.toggle('hidden');
            return;
        }
        if (action === 'create-machine') {
            const scope = button.closest('[data-flow-add-machine-form]');
            if (!scope || !validateScope(scope)) return;
            await mutate('api/work_orders/machine_runs.php', {
                method: 'POST',
                body: JSON.stringify({
                    ...formObject(scope),
                    work_order_id: state.flow.id,
                    stage_id: stage.id
                })
            }, '機台新增成功。').catch(() => {});
            return;
        }
        if (action === 'save-machine-plan') {
            const scope = button.closest('[data-flow-machine-plan]');
            if (!scope || !validateScope(scope)) return;
            await mutate(`api/work_orders/machine_runs.php?id=${encodeURIComponent(scope.dataset.runId)}`, {
                method: 'PATCH',
                body: JSON.stringify(formObject(scope))
            }, '機台規劃更新成功。').catch(() => {});
            return;
        }
        if (action === 'save-cards') {
            const scope = button.closest('[data-flow-card-form]');
            if (!scope || !validateScope(scope)) return;
            const sourceMode = scope.querySelector('[name="source_mode"]')?.value || 'preset';
            const carriers = Array.from(scope.querySelectorAll('[data-flow-card-row]')).map((row) => {
                const selectedTool = row.querySelector('[name="order_item_tool_id"]')?.selectedOptions?.[0];
                return {
                    id: row.dataset.cardId || null,
                    order_item_tool_id: sourceMode === 'preset' ? row.querySelector('[name="order_item_tool_id"]')?.value || null : null,
                    tool_id: selectedTool?.dataset.toolId || null,
                    tool_number: selectedTool?.dataset.toolNumber || null,
                    tool_type: selectedTool?.dataset.toolType || null,
                    tool_name: row.querySelector('[name="tool_name"]')?.value || selectedTool?.dataset.toolName || '',
                    quantity: row.querySelector('[name="quantity"]')?.value || 1,
                    unit_weight_kg: row.querySelector('[name="unit_weight_kg"]')?.value || selectedTool?.dataset.unitWeight || 0,
                    actual_gross_weight_kg: row.querySelector('[name="actual_gross_weight_kg"]')?.value || null
                };
            });
            await mutate('api/work_orders/card_records.php', {
                method: 'PUT',
                body: JSON.stringify({
                    work_order_id: state.flow.id,
                    machine_run_id: run.id,
                    source_mode: sourceMode,
                    carriers
                })
            }, '卡號與載具儲存成功。').catch(() => {});
            return;
        }
        if (action === 'save-first-piece') {
            const scope = button.closest('[data-flow-first-piece]');
            if (!scope || !validateScope(scope)) return;
            await mutate('api/work_orders/first_piece.php', {
                method: 'POST',
                body: JSON.stringify({
                    ...formObject(scope),
                    work_order_id: state.flow.id,
                    machine_run_id: run.id
                })
            }, '首件檢驗新增成功。').catch(() => {});
            return;
        }
        if (action === 'cancel-machine') {
            const reason = window.prompt('請輸入取消機台原因：');
            if (!reason) return;
            if (!window.confirm('確定取消此機台並保留歷史嗎？')) return;
            await mutate(`api/work_orders/machine_runs.php?id=${encodeURIComponent(button.dataset.runId)}`, {
                method: 'DELETE',
                body: JSON.stringify({ reason })
            }, '機台已取消。').catch(() => {});
            return;
        }
        if (action === 'add-card-row') {
            const form = button.closest('[data-flow-card-form]');
            const sourceMode = form.querySelector('[name="source_mode"]')?.value || 'preset';
            form.querySelector('[data-flow-card-rows]').insertAdjacentHTML('beforeend', renderCardRow({}, {}, sourceMode));
            return;
        }
        if (action === 'remove-card-row') {
            button.closest('[data-flow-card-row]')?.remove();
            return;
        }
        if (action === 'add-output-tool') {
            button.closest('[data-flow-result-form]').querySelector('[data-flow-output-tool-rows]')
                .insertAdjacentHTML('beforeend', renderOutputToolRow(run));
            return;
        }
        if (action === 'remove-output-tool') {
            button.closest('[data-flow-output-tool-row]')?.remove();
            return;
        }
        if (action === 'add-package') {
            button.closest('[data-flow-result-form]').querySelector('[data-flow-package-rows]')
                .insertAdjacentHTML('beforeend', renderPackageRow());
            return;
        }
        if (action === 'remove-package') {
            button.closest('[data-flow-package-row]')?.remove();
            return;
        }
        if (action === 'save-result-draft' || action === 'confirm-result') {
            const scope = button.closest('[data-flow-result-form]');
            if (!scope || !validateScope(scope)) return;
            await saveResult(scope, action === 'confirm-result');
            return;
        }
        if (action === 'upload-result-image') {
            await uploadResultImage(button);
            return;
        }
        if (action === 'delete-result-image') {
            if (!window.confirm('確定移除此草稿圖片嗎？')) return;
            await mutate(`api/work_orders/result_images.php?id=${encodeURIComponent(button.dataset.imageId)}`, {
                method: 'DELETE'
            }, '圖片已移除。').catch(() => {});
            return;
        }
        if (action === 'reverse-result') {
            const reason = window.prompt('請輸入撤銷機台結果原因：');
            if (!reason) return;
            if (!window.confirm('確定撤銷此已確認結果嗎？')) return;
            await mutate(`api/work_orders/machine_results.php?id=${encodeURIComponent(button.dataset.resultId)}`, {
                method: 'PATCH',
                body: JSON.stringify({ action: 'reverse', reason })
            }, '機台結果已撤銷。').catch(() => {});
            return;
        }
        if (action === 'transfer-output') {
            await transferOutput(button, stage, latestResult(run));
            return;
        }
        if (action === 'reverse-transfer') {
            const reason = window.prompt('請輸入撤銷轉流原因：');
            if (!reason) return;
            if (!window.confirm('確定撤銷此轉流／入庫嗎？')) return;
            await mutate(`api/work_orders/stage_transfers.php?id=${encodeURIComponent(button.dataset.transferId)}`, {
                method: 'PATCH',
                body: JSON.stringify({ action: 'reverse', reason })
            }, '轉流已撤銷。').catch(() => {});
        }
    });

    async function saveResult(form, confirmResult) {
        const run = currentRun();
        const resultId = form.dataset.resultId;
        const payload = {
            ...formObject(form),
            action: confirmResult ? 'confirm' : 'save_draft',
            work_order_id: state.flow.id,
            machine_run_id: run.id,
            defects: Array.from(form.querySelectorAll('[data-flow-defect-row]')).map((row) => ({
                screening_service_id: row.dataset.serviceId,
                defect_quantity: row.querySelector('[name="defect_quantity"]').value || 0,
                notes: row.querySelector('[name="notes"]').value || null
            })),
            packages: Array.from(form.querySelectorAll('[data-flow-package-row]')).map((row) => ({
                package_number: row.querySelector('[name="package_number"]').value,
                package_quantity: row.querySelector('[name="package_quantity"]').value,
                contained_units: row.querySelector('[name="contained_units"]').value,
                content_weight_kg: row.querySelector('[name="content_weight_kg"]').value,
                package_type: 'plastic_bag',
                package_unit: 'bag'
            })),
            output_tools: Array.from(form.querySelectorAll('[data-flow-output-tool-row]')).map((row) => ({
                use_mode: row.querySelector('[name="use_mode"]').value,
                source_input_tool_id: row.querySelector('[name="source_input_tool_id"]').value || null,
                tool_name: row.querySelector('[name="tool_name"]').value,
                quantity: row.querySelector('[name="quantity"]').value,
                unit_weight_kg: row.querySelector('[name="unit_weight_kg"]').value
            })),
            input_tool_dispositions: Array.from(form.querySelectorAll('[data-flow-disposition-row]'))
                .filter((row) => row.querySelector('[name="disposition"]').value)
                .map((row) => ({
                    input_tool_id: row.dataset.inputToolId,
                    disposition: row.querySelector('[name="disposition"]').value,
                    notes: row.querySelector('[name="notes"]').value || null
                }))
        };
        const path = resultId
            ? `api/work_orders/machine_results.php?id=${encodeURIComponent(resultId)}`
            : 'api/work_orders/machine_results.php';
        await mutate(path, {
            method: resultId ? 'PATCH' : 'POST',
            body: JSON.stringify(payload)
        }, confirmResult ? '機台結果已確認。' : '機台結果草稿已儲存。').catch(() => {});
    }

    async function uploadResultImage(button) {
        const form = button.closest('[data-flow-result-form]');
        const fileInput = form.querySelector('[data-flow-result-image]');
        if (!fileInput?.files?.[0]) {
            toast('請先選擇圖片。', 'warning');
            return;
        }
        const body = new FormData();
        body.append('machine_result_id', button.dataset.resultId);
        body.append('image', fileInput.files[0]);
        body.append('image_type', 'machine_screen');
        body.append('description', form.querySelector('[data-flow-result-image-description]')?.value || '');
        try {
            const response = await fetch('api/work_orders/result_images.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
                body
            });
            const payload = await response.json();
            if (!response.ok || payload.success === false) throw new Error(payload.message || '圖片上傳失敗。');
            setFlow(payload.data, { notify: false });
            notifyFlowMutation('api/work_orders/result_images.php', payload.data);
            toast(payload.message || '圖片上傳成功。');
        } catch (error) {
            toast(error.message || '圖片上傳失敗。', 'error');
        }
    }

    async function transferOutput(button, stage, result) {
        if (!result) return;
        const quality = button.dataset.quality;
        const route = button.dataset.route;
        const secondaryMode = button.dataset.secondaryMode || null;
        const transfers = (stage.transfers || []).filter((item) => (
            Number(item.source_machine_result_id) === Number(result.id)
            && item.source_quality === quality
            && item.transfer_status === 'completed'
        ));
        const total = quality === 'good'
            ? Number(result.machine_good_units || 0)
            : Number(result.settled_defect_units || 0);
        const used = transfers.reduce((sum, item) => sum + Number(item.transferred_units || 0), 0);
        const available = Math.max(total - used, 0);
        if (available <= 0) {
            toast('此輸出已無可用數量。', 'warning');
            return;
        }
        if (!window.confirm(`確定處理 ${number(available)} 支${quality === 'good' ? '良品' : '不良品'}嗎？`)) return;

        const payload = {
            machine_result_id: result.id,
            source_quality: quality,
            route,
            secondary_mode: secondaryMode,
            transferred_units: available,
            idempotency_key: randomKey()
        };
        if (route === 'terminal_good') {
            payload.output_tool_ids = (result.output_tools || [])
                .filter((tool) => !tool.inventory_item_id)
                .map((tool) => tool.id);
        }
        if (route === 'terminal_defect') {
            payload.package_ids = (result.packages || [])
                .filter((item) => item.package_status === 'available')
                .map((item) => item.id);
        }
        if (route === 'secondary_screening') {
            let reason = null;
            let approval = null;
            if (secondaryMode === 'relaxed_standard') {
                reason = window.prompt('請輸入放寬標準原因：');
                if (!reason) return;
                approval = window.prompt('請輸入客戶同意／佐證參考：');
                if (!approval) return;
            }
            payload.services = (stage.services || []).map((service) => ({
                source_stage_service_id: service.id,
                service_name: service.service_name,
                service_name_en: service.service_name_en,
                tolerance_plus_value: service.tolerance_plus_value,
                tolerance_plus_over: service.tolerance_plus_over,
                tolerance_minus_value: service.tolerance_minus_value,
                tolerance_minus_over: service.tolerance_minus_over,
                ppm_standard: service.ppm_standard,
                relaxation_reason: reason,
                customer_approval_reference: approval
            }));
        }
        await mutate('api/work_orders/stage_transfers.php', {
            method: 'POST',
            body: JSON.stringify(payload)
        }, '輸出處置完成。').catch(() => {});
    }

    const controller = Object.freeze({
        render,
        setFlow,
        getFlow: () => state.flow
    });
    controllers.set(root, controller);
    return controller;
    }

    window.initializeWorkOrderProductionFlow = initializeWorkOrderProductionFlow;
    initializeWorkOrderProductionFlow(document);
})();
