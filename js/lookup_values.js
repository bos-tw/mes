/**
 * Lookup Values Module
 * 代碼領域/代碼值查詢模組
 */
(function () {
    'use strict';

    function initializeLookupValuesModule(container) {
        const moduleRoot = container.querySelector('[data-module="lookup_values"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }

        moduleRoot.dataset.initialised = 'true';

        const alertBox = moduleRoot.querySelector('[data-lookup-values-alert]');
        const filterForm = moduleRoot.querySelector('[data-lookup-values-filter]');
        const domainKeyInput = filterForm ? filterForm.querySelector('input[name="domain_key"]') : null;
        const domainIdInput = filterForm ? filterForm.querySelector('input[name="domain_id"]') : null;
        const resetButton = moduleRoot.querySelector('[data-action="reset-filter"]');
        const refreshButton = moduleRoot.querySelector('[data-action="refresh-lookup-values"]');
        const tableElement = moduleRoot.querySelector('[data-lookup-values-table]');
        const tableHead = tableElement ? tableElement.querySelector('thead') : null;
        const tableBody = tableElement ? tableElement.querySelector('tbody') : null;
        const summaryLabel = moduleRoot.querySelector('[data-lookup-values-summary]');

        const state = {
            loading: false,
            controller: null,
            currentMode: 'domains',
            lastQueryLabel: '顯示所有代碼領域',
        };

    
function showAlert(type, message) {
            if (!alertBox || !message) {
                return;
            }

            alertBox.textContent = message;
            alertBox.classList.remove('hidden', 'success', 'error');
            alertBox.classList.add(type === 'success' ? 'success' : 'error');
        }

        function clearAlert() {
            if (!alertBox) {
                return;
            }

            alertBox.textContent = '';
            alertBox.classList.add('hidden');
            alertBox.classList.remove('success', 'error');
        }

        function setLoading(isLoading) {
            state.loading = isLoading;
            moduleRoot.classList.toggle('is-loading', isLoading);

            if (refreshButton) {
                refreshButton.disabled = isLoading;
            }

            if (!filterForm) {
                return;
            }

            const interactiveElements = filterForm.querySelectorAll('input, button');
            interactiveElements.forEach((element) => {
                if (element.dataset.action === 'reset-filter') {
                    element.disabled = isLoading;
                } else {
                    element.disabled = isLoading && element.type !== 'hidden';
                }
            });
        }

        function setTableHeader(mode) {
            if (!tableHead) {
                return;
            }

            if (mode === 'domains') {
                tableHead.innerHTML = `
                    <tr>
                        <th>Domain Key</th>
                        <th>描述</th>
                    </tr>
                `;
            } else {
                tableHead.innerHTML = `
                    <tr>
                        <th>鍵值</th>
                        <th>顯示文字</th>
                        <th>排序</th>
                        <th>啟用</th>
                    </tr>
                `;
            }
        }

        function renderEmpty(message, colspan) {
            if (!tableBody) {
                return;
            }
            const span = Math.max(1, colspan);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="${span}" class="text-center">${escapeHtml(message)}</td>
                </tr>
            `;
        }

        function renderDomains(domains) {
            if (!tableBody) {
                return;
            }
            setTableHeader('domains');
            tableBody.innerHTML = domains.map((domain) => `
                <tr>
                    <td>${escapeHtml(domain.domain_key)}</td>
                    <td>${escapeHtml(domain.description ?? '-')}</td>
                </tr>
            `).join('');
        }

        function renderValues(values) {
            if (!tableBody) {
                return;
            }
            setTableHeader('values');
            tableBody.innerHTML = values.map((item) => `
                <tr>
                    <td>${escapeHtml(item.value_key)}</td>
                    <td>${escapeHtml(item.value_label)}</td>
                    <td>${escapeHtml(item.sort_order)}</td>
                    <td>${item.is_active ? '是' : '否'}</td>
                </tr>
            `).join('');
        }

        function getModeForData(items, hasFilter) {
            if (!Array.isArray(items) || items.length === 0) {
                return hasFilter ? 'values' : 'domains';
            }
            return Object.prototype.hasOwnProperty.call(items[0], 'domain_key') ? 'domains' : 'values';
        }

        async function loadLookupValues(options = {}) {
            const domainKey = domainKeyInput ? domainKeyInput.value.trim() : '';
            const domainIdRaw = domainIdInput ? domainIdInput.value.trim() : '';
            const domainId = domainIdRaw !== '' ? Number.parseInt(domainIdRaw, 10) : NaN;

            const params = new URLSearchParams();
            if (domainKey !== '') {
                params.set('domain_key', domainKey);
            } else if (!Number.isNaN(domainId) && domainId > 0) {
                params.set('domain_id', String(domainId));
            }

            const url = params.toString()
                ? `api/lookup_values/index.php?${params.toString()}`
                : 'api/lookup_values/index.php';

            if (state.controller) {
                state.controller.abort();
            }

            const controller = new AbortController();
            state.controller = controller;

            if (!options.silent) {
                setLoading(true);
            }

            try {
                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    },
                    signal: controller.signal,
                });

                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result?.message || `HTTP ${response.status}`);
                }

                const items = Array.isArray(result.data) ? result.data : [];
                const hasFilter = domainKey !== '' || (!Number.isNaN(domainId) && domainId > 0);
                const mode = getModeForData(items, hasFilter);
                state.currentMode = mode;

                if (summaryLabel) {
                    if (mode === 'domains') {
                        state.lastQueryLabel = '顯示所有代碼領域';
                    } else if (domainKey) {
                        state.lastQueryLabel = `顯示 Domain Key「${domainKey}」的代碼值`;
                    } else if (!Number.isNaN(domainId) && domainId > 0) {
                        state.lastQueryLabel = `顯示 Domain ID #${domainId} 的代碼值`;
                    } else {
                        state.lastQueryLabel = '顯示指定篩選條件的代碼值';
                    }
                    summaryLabel.textContent = state.lastQueryLabel;
                }

                if (items.length === 0) {
                    const message = mode === 'domains'
                        ? '目前沒有啟用的代碼領域。'
                        : '此領域尚未設定任何代碼值。';
                    renderEmpty(message, mode === 'domains' ? 3 : 5);
                    return;
                }

                if (mode === 'domains') {
                    renderDomains(items);
                } else {
                    renderValues(items);
                }

                clearAlert();
            } catch (error) {
                if (error?.name === 'AbortError') {
                    return;
                }
                console.error('Failed to load lookup values:', error);
                renderEmpty('資料載入失敗，請稍後再試。', state.currentMode === 'domains' ? 3 : 5);
                showAlert('error', error instanceof Error ? error.message : '資料載入失敗。');
            } finally {
                if (state.controller === controller) {
                    state.controller = null;
                }
                if (!options.silent) {
                    setLoading(false);
                }
            }
        }

        if (filterForm) {
            filterForm.addEventListener('submit', (event) => {
                event.preventDefault();
                loadLookupValues();
            });
        }

        if (resetButton) {
            resetButton.addEventListener('click', () => {
                if (state.loading) {
                    return;
                }
                if (filterForm) {
                    filterForm.reset();
                }
                loadLookupValues();
            });
        }

        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                if (state.loading) {
                    return;
                }
                loadLookupValues({ silent: false });
            });
        }

        loadLookupValues();

        // 建立資料同步輔助器
        if (typeof DataSync !== 'undefined') {
            DataSync.createModuleHelper('lookup_values', {
                onRefresh: () => loadLookupValues(),
                debounceMs: 300
            });
        }
    }

    window.initializeLookupValuesModule = initializeLookupValuesModule;
})();
