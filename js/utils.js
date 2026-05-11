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

    // 掛載到全域
    window.escapeHtml = escapeHtml;
})();
