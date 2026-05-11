(function () {
    'use strict';

    function initializeSecuritySettingsModule(container) {
        const moduleRoot = container.querySelector('[data-module="security_settings"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        // ── DOM 參考 ──
        const form = moduleRoot.querySelector('[data-security-settings-form]');
        const alertBox = moduleRoot.querySelector('[data-security-settings-alert]');
        const updatePackageInput = moduleRoot.querySelector('[data-system-update-package]');
        const updateStatusBox = moduleRoot.querySelector('[data-system-update-status]');
        const updateChangeList = moduleRoot.querySelector('[data-update-change-list]');
        const applyUpdateBtn = moduleRoot.querySelector('[data-action="apply-system-update"]');
        const maintenanceStatusEl = moduleRoot.querySelector('[data-update-maintenance-status]');
        const maintenanceReasonInput = moduleRoot.querySelector('[data-system-update-maintenance-reason]');
        const rollbackJobSelect = moduleRoot.querySelector('[data-system-rollback-job-select]');

        const updateJobIdEl = moduleRoot.querySelector('[data-update-job-id]');
        const updateVersionEl = moduleRoot.querySelector('[data-update-version]');
        const updateStatusValueEl = moduleRoot.querySelector('[data-update-status-value]');
        const updateFileCountEl = moduleRoot.querySelector('[data-update-file-count]');
        const updateMigrationCountEl = moduleRoot.querySelector('[data-update-migration-count]');
        const updateUpdatedAtEl = moduleRoot.querySelector('[data-update-updated-at]');
        const updateDbBackupEl = moduleRoot.querySelector('[data-update-db-backup]');
        const updateHealthCheckEl = moduleRoot.querySelector('[data-update-health-check]');

        let currentUpdateJobId = null;
        const dataSyncHelper = (typeof DataSync !== 'undefined')
            ? DataSync.createModuleHelper('security_settings', { onRefresh: loadSettings })
            : null;

        // ── 工具函式 ──
        function showAlert(msg, isError = true) {
            if (!alertBox) { return; }
            alertBox.textContent = msg;
            alertBox.className = 'module-alert ' + (isError ? 'error' : 'success');
            alertBox.classList.remove('hidden');
            if (!isError) {
                setTimeout(() => { alertBox.classList.add('hidden'); }, 4000);
            }
        }

        function hideAlert() {
            if (alertBox) { alertBox.classList.add('hidden'); }
        }

        function setElementText(el, value) {
            if (!el) {
                return;
            }
            el.textContent = value;
        }

        function updateApplyButtonState(status) {
            if (!applyUpdateBtn) {
                return;
            }
            const canApply = status === 'validated' || status === 'failed';
            applyUpdateBtn.disabled = !canApply;
        }

        function renderUpdateStatusMessage(message, type = 'info') {
            if (!updateStatusBox) {
                return;
            }

            updateStatusBox.textContent = message;
            updateStatusBox.className = 'system-update-status ' + type;
            updateStatusBox.classList.remove('hidden');
        }

        function clearUpdateStatusMessage() {
            if (!updateStatusBox) {
                return;
            }
            updateStatusBox.classList.add('hidden');
        }

        function renderChangeSummary(summary) {
            if (!updateChangeList) {
                return;
            }

            updateChangeList.innerHTML = '';

            const lines = String(summary || '')
                .split(/\r?\n/)
                .map(line => line.trim())
                .filter(line => line !== '');

            if (lines.length === 0) {
                const item = document.createElement('li');
                item.textContent = '此更新未提供摘要。';
                updateChangeList.appendChild(item);
                return;
            }

            lines.forEach(line => {
                const item = document.createElement('li');
                item.textContent = line;
                updateChangeList.appendChild(item);
            });
        }

        function statusText(status) {
            const map = {
                uploaded: '已上傳',
                validated: '已驗證',
                applying: '套用中',
                success: '完成',
                failed: '失敗',
                rolling_back: '回滾中',
                rolled_back: '已回滾',
                rollback_failed: '回滾失敗',
            };
            return map[status] || status || '-';
        }

        function renderMaintenanceState(state) {
            if (!maintenanceStatusEl) {
                return;
            }

            if (!state || state.enabled !== true) {
                maintenanceStatusEl.textContent = '未啟用';
                return;
            }

            const reason = String(state.reason || '').trim();
            const by = String(state.enabled_by || '').trim();
            const at = String(state.enabled_at || '').trim();
            const desc = [
                '已啟用',
                reason ? `原因：${reason}` : '',
                by ? `執行者：${by}` : '',
                at ? `時間：${at}` : '',
            ].filter(Boolean).join('，');

            maintenanceStatusEl.textContent = desc;
        }

        function formatBytes(bytes) {
            const value = Number(bytes || 0);
            if (!Number.isFinite(value) || value <= 0) {
                return '0 B';
            }
            const units = ['B', 'KB', 'MB', 'GB'];
            let size = value;
            let idx = 0;
            while (size >= 1024 && idx < units.length - 1) {
                size /= 1024;
                idx++;
            }
            return `${size.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
        }

        function renderBackupInfo(backupInfo) {
            if (!backupInfo) {
                setElementText(updateDbBackupEl, '-');
                return;
            }

            const path = backupInfo.file_path || '-';
            const bytes = formatBytes(backupInfo.bytes || 0);
            const tables = Number(backupInfo.table_count || 0);
            const rows = Number(backupInfo.row_count || 0);
            const reusedText = backupInfo.reused ? '重用當日快照' : '新建快照';
            const retentionDays = Number(backupInfo.retention_days || 7);

            if (backupInfo.reused) {
                setElementText(
                    updateDbBackupEl,
                    `${path}（${bytes}，${reusedText}，保留 ${retentionDays} 天）`
                );
                return;
            }

            setElementText(
                updateDbBackupEl,
                `${path}（${bytes}，${tables} 表 / ${rows} 筆，${reusedText}，保留 ${retentionDays} 天）`
            );
        }

        function renderHealthCheckInfo(healthCheck) {
            if (!healthCheck) {
                setElementText(updateHealthCheckEl, '-');
                return;
            }

            const passed = healthCheck.passed === true;
            const failedCount = Number(healthCheck.failed_count || 0);
            setElementText(updateHealthCheckEl, passed ? '通過' : `未通過（${failedCount} 項）`);
        }

        function renderUpdateJob(job) {
            if (!job) {
                currentUpdateJobId = null;
                setElementText(updateJobIdEl, '-');
                setElementText(updateVersionEl, '-');
                setElementText(updateStatusValueEl, '-');
                setElementText(updateFileCountEl, '-');
                setElementText(updateMigrationCountEl, '-');
                setElementText(updateUpdatedAtEl, '-');
                renderBackupInfo(null);
                renderHealthCheckInfo(null);
                renderChangeSummary('');
                updateApplyButtonState('');
                return;
            }

            currentUpdateJobId = Number(job.id || 0) || null;

            setElementText(updateJobIdEl, currentUpdateJobId ? String(currentUpdateJobId) : '-');
            setElementText(updateVersionEl, job.version_number || '-');
            setElementText(updateStatusValueEl, statusText(job.status));
            setElementText(updateFileCountEl, String(job.file_count ?? '-'));
            setElementText(updateMigrationCountEl, String(job.migration_count ?? '-'));
            setElementText(updateUpdatedAtEl, job.updated_at || '-');
            renderBackupInfo(null);
            renderHealthCheckInfo(null);
            renderChangeSummary(job.change_summary || '');
            updateApplyButtonState(job.status || '');
        }

        async function loadLatestUpdateJob() {
            try {
                const res = await fetch('api/system_update_status.php?latest=1&limit=1', {
                    credentials: 'include',
                    cache: 'no-store',
                });

                let data = null;
                try {
                    data = await res.json();
                } catch (_err) {
                    data = null;
                }

                if (!res.ok) {
                    throw new Error(data?.message || `HTTP ${res.status}`);
                }

                if (!data.success) {
                    throw new Error(data.message || '讀取更新任務失敗。');
                }

                renderUpdateJob(data.latest || null);
                renderMaintenanceState(data.maintenance || null);

                if (data.initialized === false) {
                    renderUpdateStatusMessage(data.message || '系統更新模組尚未初始化。', 'info');
                }
            } catch (err) {
                renderUpdateJob(null);
                renderUpdateStatusMessage('讀取更新任務失敗：' + err.message, 'error');
            }
        }

        function renderRollbackCandidates(candidates) {
            if (!rollbackJobSelect) {
                return;
            }

            rollbackJobSelect.innerHTML = '';
            if (!Array.isArray(candidates) || candidates.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = '目前沒有可回滾版本';
                rollbackJobSelect.appendChild(option);
                return;
            }

            const readyCandidates = candidates.filter(item => item.rollback_ready === true);
            const source = readyCandidates.length > 0 ? readyCandidates : candidates;
            if (readyCandidates.length === 0) {
                const hintOption = document.createElement('option');
                hintOption.value = '';
                hintOption.textContent = '目前版本皆不符合回滾條件（請先檢查備份與 rollback migration）';
                rollbackJobSelect.appendChild(hintOption);
            }

            source.forEach(item => {
                const option = document.createElement('option');
                option.value = String(item.id || '');

                const statusLabel = statusText(item.status || '');
                const dateLabel = item.release_date || item.updated_at || '-';
                option.textContent = `#${item.id} ${item.version_number || '-'}（${statusLabel} / ${dateLabel}）`;

                if (item.rollback_ready !== true) {
                    const errors = Array.isArray(item.rollback_errors) ? item.rollback_errors.join('、') : '未提供';
                    option.disabled = true;
                    option.textContent += ` - 不可回滾：${errors}`;
                }

                rollbackJobSelect.appendChild(option);
            });

            if (rollbackJobSelect.options.length > 0) {
                rollbackJobSelect.selectedIndex = 0;
            }
        }

        async function loadRollbackCandidates() {
            try {
                const res = await fetch('api/system_update_rollback.php?limit=30', {
                    credentials: 'include',
                    cache: 'no-store',
                });

                let data = null;
                try {
                    data = await res.json();
                } catch (_err) {
                    data = null;
                }

                if (!res.ok) {
                    throw new Error(data?.message || `HTTP ${res.status}`);
                }

                if (!data.success) {
                    throw new Error(data.message || '讀取回滾版本清單失敗。');
                }

                renderRollbackCandidates(data.data?.candidates || []);
                renderMaintenanceState(data.data?.maintenance || null);
            } catch (err) {
                renderRollbackCandidates([]);
                renderUpdateStatusMessage('讀取可回滾版本失敗：' + err.message, 'error');
            }
        }

        async function uploadUpdatePackage() {
            clearUpdateStatusMessage();

            if (!updatePackageInput || !updatePackageInput.files || updatePackageInput.files.length === 0) {
                renderUpdateStatusMessage('請先選擇更新壓縮檔。', 'error');
                return;
            }

            const fd = new FormData();
            fd.append('update_package', updatePackageInput.files[0]);

            try {
                renderUpdateStatusMessage('更新包上傳中，請稍候...', 'info');

                const res = await fetch('api/system_update_upload.php', {
                    method: 'POST',
                    credentials: 'include',
                    body: fd,
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || '上傳更新包失敗。');
                }

                renderUpdateJob(data.data?.job || null);
                renderUpdateStatusMessage(data.message || '更新包上傳完成。', 'success');
            } catch (err) {
                renderUpdateStatusMessage('上傳失敗：' + err.message, 'error');
            }
        }

        async function checkSystemUpdateInitialization() {
            clearUpdateStatusMessage();

            try {
                renderUpdateStatusMessage('初始化檢查中，請稍候...', 'info');

                const res = await fetch('api/system_update_init_check.php', {
                    method: 'GET',
                    credentials: 'include',
                    cache: 'no-store',
                });

                let data = null;
                try {
                    data = await res.json();
                } catch (_err) {
                    data = null;
                }

                if (!res.ok) {
                    throw new Error(data?.message || `HTTP ${res.status}`);
                }

                if (!data.success) {
                    throw new Error(data.message || '初始化檢查失敗。');
                }

                const checks = Array.isArray(data.data?.checks) ? data.data.checks : [];
                const failed = checks.filter(item => !item.ok).map(item => item.label || item.key || '未命名檢查項目');

                if (data.data?.initialized) {
                    renderUpdateStatusMessage('初始化檢查通過：可執行上傳與一鍵更新。', 'success');
                } else {
                    const reason = failed.length > 0
                        ? '未通過項目：' + failed.join('、')
                        : (data.message || '初始化檢查未通過。');
                    renderUpdateStatusMessage(reason, 'error');
                }

                await loadLatestUpdateJob();
            } catch (err) {
                renderUpdateStatusMessage('初始化檢查失敗：' + err.message, 'error');
            }
        }

        async function applyUpdatePackage() {
            clearUpdateStatusMessage();

            if (!currentUpdateJobId) {
                renderUpdateStatusMessage('尚未選擇可套用的更新任務。', 'error');
                return;
            }

            try {
                updateApplyButtonState('applying');
                renderUpdateStatusMessage('系統更新套用中，請勿關閉頁面...', 'info');

                const res = await fetch('api/system_update_apply.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ job_id: currentUpdateJobId }),
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || '套用更新失敗。');
                }

                renderUpdateJob(data.data?.job || null);
                renderBackupInfo(data.data?.db_backup || null);
                renderHealthCheckInfo(data.data?.health_check || null);
                renderMaintenanceState(data.data?.maintenance || null);
                renderUpdateStatusMessage(data.message || '系統更新已完成。', 'success');
                await loadRollbackCandidates();

                if (typeof window.AppVersionChecker !== 'undefined') {
                    window.AppVersionChecker.checkNow();
                }

                if (dataSyncHelper) {
                    dataSyncHelper.notifyUpdated({ scope: 'system_update' });
                }
            } catch (err) {
                renderUpdateStatusMessage('套用更新失敗：' + err.message, 'error');
                await loadLatestUpdateJob();
            }
        }

        async function createDatabaseBackup() {
            clearUpdateStatusMessage();

            try {
                renderUpdateStatusMessage('建立 DB 快照中，請稍候...', 'info');

                const res = await fetch('api/system_update_backup.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ job_id: currentUpdateJobId || 0 }),
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || '建立 DB 快照失敗。');
                }

                renderBackupInfo(data.data?.backup || null);
                renderUpdateStatusMessage(data.message || 'DB 快照建立完成。', 'success');
            } catch (err) {
                renderUpdateStatusMessage('建立 DB 快照失敗：' + err.message, 'error');
            }
        }

        async function rollbackSelectedUpdate() {
            clearUpdateStatusMessage();

            const selectedJobId = Number(rollbackJobSelect?.value || 0);
            const selectedOption = rollbackJobSelect?.selectedOptions?.[0] || null;
            if (selectedOption && selectedOption.disabled) {
                renderUpdateStatusMessage('目前選取版本不可回滾，請改選可回滾版本。', 'error');
                return;
            }
            if (!selectedJobId) {
                renderUpdateStatusMessage('請先選擇要回退的版本。', 'error');
                return;
            }

            const selectedLabel = selectedOption?.textContent || `#${selectedJobId}`;
            const confirmed = window.confirm(
                `確定要回退版本 ${selectedLabel} 嗎？\n此操作會還原檔案並執行 rollback migration。`
            );
            if (!confirmed) {
                return;
            }

            try {
                renderUpdateStatusMessage('版本回退中，請勿關閉頁面...', 'info');

                const res = await fetch('api/system_update_rollback.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ job_id: selectedJobId }),
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || '版本回退失敗。');
                }

                renderUpdateJob(data.data?.job || null);
                renderBackupInfo(data.data?.db_backup || null);
                renderHealthCheckInfo(data.data?.health_check || null);
                renderMaintenanceState(data.data?.maintenance || null);
                renderUpdateStatusMessage(data.message || '版本回退完成。', 'success');

                if (typeof window.AppVersionChecker !== 'undefined') {
                    window.AppVersionChecker.checkNow();
                }
                if (dataSyncHelper) {
                    dataSyncHelper.notifyUpdated({ scope: 'system_update' });
                }

                await loadRollbackCandidates();
            } catch (err) {
                renderUpdateStatusMessage('版本回退失敗：' + err.message, 'error');
                await loadLatestUpdateJob();
                await loadRollbackCandidates();
            }
        }

        async function setMaintenanceMode(enabled) {
            clearUpdateStatusMessage();
            const reason = (maintenanceReasonInput?.value || '').trim();

            try {
                renderUpdateStatusMessage(enabled ? '啟用維護模式中...' : '關閉維護模式中...', 'info');

                const res = await fetch('api/system_update_maintenance.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        enabled: enabled,
                        reason: reason,
                        job_id: currentUpdateJobId || 0,
                    }),
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || '維護模式切換失敗。');
                }

                renderMaintenanceState(data.data?.maintenance || null);
                renderUpdateStatusMessage(data.message || '維護模式狀態已更新。', 'success');
            } catch (err) {
                renderUpdateStatusMessage('維護模式切換失敗：' + err.message, 'error');
            }
        }

        // ── 切換 toggle 連動依賴欄位 ──
        function applyToggleState(groupName, enabled) {
            moduleRoot.querySelectorAll(`[data-group="${groupName}"]`).forEach(el => {
                const inputs = el.querySelectorAll('input, select, textarea');
                inputs.forEach(inp => {
                    inp.disabled = !enabled;
                });
                el.classList.toggle('settings-disabled', !enabled);
            });
        }

        function initToggles() {
            moduleRoot.querySelectorAll('[data-toggle-group]').forEach(checkbox => {
                const group = checkbox.dataset.toggleGroup;
                applyToggleState(group, checkbox.checked);

                checkbox.addEventListener('change', () => {
                    applyToggleState(group, checkbox.checked);
                });
            });
        }

        // ── 載入設定 ──
        async function loadSettings() {
            try {
                const res = await fetch('api/security_settings/', { credentials: 'include' });
                if (!res.ok) { throw new Error(`HTTP ${res.status}`); }
                const data = await res.json();
                if (!data.success) { throw new Error(data.message || '載入失敗。'); }

                const settings = data.data;

                Object.entries(settings).forEach(([key, cfg]) => {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (!input) { return; }

                    if (input.type === 'checkbox') {
                        input.checked = cfg.value === '1';
                    } else {
                        input.value = cfg.value;
                    }
                });

                // 套用 toggle 狀態（必須在填值之後）
                initToggles();

            } catch (err) {
                showAlert('載入安全設定失敗：' + err.message);
            }
        }

        // ── 儲存設定 ──
        async function saveSettings() {
            hideAlert();

            const payload = {};
            form.querySelectorAll('[name]').forEach(input => {
                const key = input.name;
                if (input.type === 'checkbox') {
                    payload[key] = input.checked ? '1' : '0';
                } else {
                    payload[key] = input.value;
                }
            });

            try {
                const res = await fetch('api/security_settings/', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();

                if (!data.success) {
                    const msgs = data.errors
                        ? Object.values(data.errors).join('；')
                        : (data.message || '儲存失敗。');
                    showAlert(msgs);
                    return;
                }

                showAlert('安全設定已儲存。', false);

                // 通知 script.js 的安全管理器重新讀取設定
                if (typeof window.AppSecurityManager !== 'undefined') {
                    window.AppSecurityManager.reload();
                }
                if (dataSyncHelper) {
                    dataSyncHelper.notifyUpdated({ scope: 'all' });
                }

            } catch (err) {
                showAlert('儲存安全設定失敗：' + err.message);
            }
        }

        // ── 事件委派 ──
        moduleRoot.addEventListener('click', e => {
            const btn = e.target.closest('[data-action]');
            if (!btn) { return; }
            const action = btn.dataset.action;

            if (action === 'save-security-settings') {
                saveSettings();
            }

            if (action === 'upload-system-update') {
                uploadUpdatePackage();
            }

            if (action === 'check-system-update-init') {
                checkSystemUpdateInitialization();
            }

            if (action === 'create-system-update-backup') {
                createDatabaseBackup();
            }

            if (action === 'apply-system-update') {
                applyUpdatePackage();
            }

            if (action === 'enable-system-maintenance') {
                setMaintenanceMode(true);
            }

            if (action === 'disable-system-maintenance') {
                setMaintenanceMode(false);
            }

            if (action === 'refresh-system-rollback-candidates') {
                loadRollbackCandidates();
            }

            if (action === 'rollback-system-update') {
                rollbackSelectedUpdate();
            }

            if (action === 'refresh-system-update') {
                clearUpdateStatusMessage();
                loadLatestUpdateJob();
                loadRollbackCandidates();
            }
        });

        // ── 初始載入 ──
        loadSettings();
        loadLatestUpdateJob();
        loadRollbackCandidates();
    }

    window.initializeSecuritySettingsModule = initializeSecuritySettingsModule;
})();
