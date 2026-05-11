/**
 * 模組配置系統
 * 
 * 目的：將模組的「結構定義」與「HTML 實作」分離
 * 好處：
 *   1. 修改共用結構只需改一處
 *   2. 新增模組只需定義配置
 *   3. 降低維護成本
 * 
 * @version 1.0.0
 */
(function() {
    'use strict';

    /**
     * 模組配置註冊表
     */
    const MODULE_CONFIGS = {};

    /**
     * 模組配置 Schema
     * @typedef {Object} ModuleConfig
     * @property {string} id - 模組 ID (snake_case)
     * @property {string} title - 模組標題
     * @property {string} subtitle - 模組副標題
     * @property {Array<ActionConfig>} actions - 標題列動作按鈕
     * @property {Array<FilterConfig>} filters - 篩選欄位
     * @property {Array<ColumnConfig>} columns - 表格欄位
     * @property {ModalConfig} modal - Modal 配置
     * @property {ModalConfig} detailModal - 詳情 Modal 配置
     * @property {Object} api - API 端點配置
     * @property {string} customHtml - 自訂 HTML（插入在 content-area 開頭）
     */

    /**
     * 動作按鈕配置
     * @typedef {Object} ActionConfig
     * @property {string} action - 動作名稱 (data-action 值)
     * @property {string} label - 按鈕文字
     * @property {string} icon - FontAwesome 圖示 class
     * @property {string} style - 按鈕樣式 ('primary'|'outline'|'danger')
     * @property {boolean} [disabled] - 是否停用
     * @property {string} [extraHtml] - 額外 HTML（如 badge）
     */

    /**
     * 註冊模組配置
     * @param {string} moduleId - 模組 ID
     * @param {ModuleConfig} config - 模組配置
     */
    function registerModule(moduleId, config) {
        if (MODULE_CONFIGS[moduleId]) {
            console.warn(`ModuleConfig: 模組 ${moduleId} 已存在，將被覆蓋`);
        }
        
        // 驗證必要欄位
        if (!config.title) {
            throw new Error(`ModuleConfig: 模組 ${moduleId} 缺少 title`);
        }

        MODULE_CONFIGS[moduleId] = {
            id: moduleId,
            ...config
        };

        console.log(`ModuleConfig: 已註冊模組 ${moduleId}`);
    }

    /**
     * 取得模組配置
     * @param {string} moduleId - 模組 ID
     * @returns {ModuleConfig|null}
     */
    function getModule(moduleId) {
        return MODULE_CONFIGS[moduleId] || null;
    }

    /**
     * 檢查模組是否已註冊
     * @param {string} moduleId - 模組 ID
     * @returns {boolean}
     */
    function hasModule(moduleId) {
        return moduleId in MODULE_CONFIGS;
    }

    /**
     * 取得所有已註冊模組
     * @returns {Object}
     */
    function getAllModules() {
        return { ...MODULE_CONFIGS };
    }

    /**
     * 將 snake_case 轉換為 kebab-case
     * @param {string} str 
     * @returns {string}
     */
    function toKebabCase(str) {
        return str.replace(/_/g, '-');
    }

    /**
     * 將 snake_case 轉換為 camelCase
     * @param {string} str 
     * @returns {string}
     */
    function toCamelCase(str) {
        return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    /**
     * 將 snake_case 轉換為 PascalCase
     * @param {string} str 
     * @returns {string}
     */
    function toPascalCase(str) {
        const camel = toCamelCase(str);
        return camel.charAt(0).toUpperCase() + camel.slice(1);
    }

    // 暴露到全域
    window.ModuleConfig = {
        register: registerModule,
        get: getModule,
        has: hasModule,
        getAll: getAllModules,
        utils: {
            toKebabCase,
            toCamelCase,
            toPascalCase
        }
    };

})();
