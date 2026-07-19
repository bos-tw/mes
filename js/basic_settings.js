(function () {
    'use strict';

    function initializeBasicSettingsModule(container) {
        const moduleRoot = container.querySelector('[data-module="basic_settings"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        const elements = {
            tabNav: moduleRoot.querySelector('[data-basic-settings-tab-nav]'),
            tabPanels: moduleRoot.querySelectorAll('[data-basic-settings-tab-panel]'),
            fontSizeInputs: moduleRoot.querySelectorAll('input[name="font_size"]'),
            currentFontSize: moduleRoot.querySelector('[data-current-font-size]'),
            resetFontSizeButton: moduleRoot.querySelector('[data-action="reset-font-size"]')
        };

        if (!window.UiPreferences) {
            moduleRoot.innerHTML = '<section class="empty-state"><h3>無法載入顯示偏好</h3><p>請重新整理頁面後再試一次。</p></section>';
            return;
        }

        function switchTab(tabValue) {
            if (elements.tabNav) {
                elements.tabNav.querySelectorAll('[data-tab-value]').forEach((button) => {
                    const isActive = button.dataset.tabValue === tabValue;
                    button.classList.toggle('active', isActive);
                    button.setAttribute('aria-selected', String(isActive));
                });
            }

            elements.tabPanels.forEach((panel) => {
                panel.classList.toggle('hidden', panel.dataset.basicSettingsTabPanel !== tabValue);
            });
        }

        function renderFontSize(value) {
            const normalizedValue = window.UiPreferences.fontSizeOptions[value]
                ? value
                : window.UiPreferences.defaultFontSize;
            const option = window.UiPreferences.fontSizeOptions[normalizedValue];

            elements.fontSizeInputs.forEach((input) => {
                input.checked = input.value === normalizedValue;
                const optionLabel = input.closest('[data-font-size-option]');
                if (optionLabel) {
                    optionLabel.classList.toggle('selected', input.checked);
                }
            });

            if (elements.currentFontSize) {
                elements.currentFontSize.textContent = `${option.label}（${option.percentage}%）`;
            }
            if (elements.resetFontSizeButton) {
                elements.resetFontSizeButton.disabled = normalizedValue === window.UiPreferences.defaultFontSize;
            }
        }

        function applyFontSize(value) {
            const appliedValue = window.UiPreferences.setFontSize(value);
            renderFontSize(appliedValue);
            const option = window.UiPreferences.fontSizeOptions[appliedValue];
            window.AppFeedback?.toast(`字體大小已調整為${option.label}（${option.percentage}%）。`, 'success');
        }

        moduleRoot.addEventListener('change', (event) => {
            const input = event.target.closest('input[name="font_size"]');
            if (input) {
                applyFontSize(input.value);
            }
        });

        moduleRoot.addEventListener('click', (event) => {
            const actionElement = event.target.closest('[data-action]');
            if (!actionElement) {
                return;
            }

            if (actionElement.dataset.action === 'switch-basic-settings-tab') {
                switchTab(actionElement.dataset.tabValue || 'font-size');
            }

            if (actionElement.dataset.action === 'reset-font-size') {
                applyFontSize(window.UiPreferences.defaultFontSize);
            }
        });

        const preferenceChangeHandler = (event) => {
            if (!moduleRoot.isConnected) {
                window.removeEventListener('mes:ui-preference-change', preferenceChangeHandler);
                return;
            }
            if (event.detail?.preference === 'font-size') {
                renderFontSize(event.detail.value);
            }
        };

        window.addEventListener('mes:ui-preference-change', preferenceChangeHandler);

        if (typeof DataSync !== 'undefined' && typeof DataSync.createModuleHelper === 'function') {
            DataSync.createModuleHelper('basic_settings', {
                onRefresh: () => renderFontSize(window.UiPreferences.getFontSize())
            });
        }

        switchTab('font-size');
        renderFontSize(window.UiPreferences.getFontSize());
    }

    window.initializeBasicSettingsModule = initializeBasicSettingsModule;
})();
