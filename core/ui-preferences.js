(function () {
    'use strict';

    const STORAGE_KEY = 'mes_ui_font_size';
    const DEFAULT_FONT_SIZE = 'standard';
    const FONT_SIZE_OPTIONS = Object.freeze({
        'extra-small': Object.freeze({ label: '極小', percentage: 85 }),
        small: Object.freeze({ label: '小', percentage: 90 }),
        standard: Object.freeze({ label: '標準', percentage: 100 }),
        large: Object.freeze({ label: '大', percentage: 110 }),
        'extra-large': Object.freeze({ label: '極大', percentage: 120 })
    });

    function normalizeFontSize(value) {
        return Object.prototype.hasOwnProperty.call(FONT_SIZE_OPTIONS, value)
            ? value
            : DEFAULT_FONT_SIZE;
    }

    function readStoredFontSize() {
        try {
            return normalizeFontSize(window.localStorage.getItem(STORAGE_KEY));
        } catch (error) {
            console.warn('[UiPreferences] 無法讀取字體大小設定：', error);
            return DEFAULT_FONT_SIZE;
        }
    }

    function applyFontSize(value, { persist = false, announce = true } = {}) {
        const normalizedValue = normalizeFontSize(value);
        document.documentElement.dataset.fontSize = normalizedValue;

        if (persist) {
            try {
                window.localStorage.setItem(STORAGE_KEY, normalizedValue);
            } catch (error) {
                console.warn('[UiPreferences] 無法儲存字體大小設定：', error);
            }
        }

        if (announce) {
            window.dispatchEvent(new CustomEvent('mes:ui-preference-change', {
                detail: {
                    preference: 'font-size',
                    value: normalizedValue,
                    option: FONT_SIZE_OPTIONS[normalizedValue]
                }
            }));
        }

        return normalizedValue;
    }

    window.addEventListener('storage', (event) => {
        if (event.key === STORAGE_KEY) {
            applyFontSize(event.newValue, { persist: false });
        }
    });

    window.UiPreferences = Object.freeze({
        storageKey: STORAGE_KEY,
        defaultFontSize: DEFAULT_FONT_SIZE,
        fontSizeOptions: FONT_SIZE_OPTIONS,
        getFontSize() {
            return normalizeFontSize(document.documentElement.dataset.fontSize);
        },
        setFontSize(value) {
            return applyFontSize(value, { persist: true });
        },
        resetFontSize() {
            return applyFontSize(DEFAULT_FONT_SIZE, { persist: true });
        }
    });

    applyFontSize(readStoredFontSize(), { persist: false, announce: false });
})();
