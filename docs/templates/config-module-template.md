# 🛡️ 防止 AI Agent 破壞程式碼統一性 - 實戰指南

> **問題**：多個 AI 模型 agent 參與開發，不遵守規範，導致程式碼風格不統一
> **解決方案**：技術防護 + 流程管控 + 自動化驗證

---

## 📊 現狀分析

### 面臨的挑戰

| 挑戰 | 影響 | 頻率 |
|------|------|------|
| AI 不讀 copilot-instructions.md | 產生不符規範的程式碼 | 🔴 經常 |
| 多個 AI agent 協作 | 風格不一致 | 🟡 偶爾 |
| 分批開發 | 忘記之前的規範 | 🔴 經常 |
| 配置化模組缺 hiddenFields | null 錯誤 | 🔴 經常 |
| 使用不安全的 querySelector | null 錯誤 | 🔴 經常 |

---

## 🎯 解決方案（分層防護）

### 第一層：自動化驗證（最重要）

#### ✅ 已實作：驗證工具

**檔案**：`tools/validate-config-modules.js`

**功能**：
- 檢查配置檔是否有 `hiddenFields`
- 檢查 JS 是否有不安全的 querySelector
- 檢查混合模式的 HTML 檔案
- 檢查 Modal 尺寸規範

**使用方式**：
```bash
node tools/validate-config-modules.js
```

**輸出範例**：
```
🚀 開始執行配置化模組驗證...

🔍 檢查規則 1: 配置檔必須有 hiddenFields...
🔍 檢查規則 2: 禁止不安全的 querySelector 賦值...

❌ 發現 2 個錯誤：

1. core/configs/example.config.js
   規則: 配置檔必須有 hiddenFields
   問題: Modal 定義中缺少 hiddenFields: ['id']
   修復: 在 modal 物件中加入: hiddenFields: ['id']

2. js/example.js:125
   規則: 禁止不安全的 querySelector 賦值
   問題: 發現不安全的模式: querySelector().value =
   程式碼: form.querySelector('[name="id"]').value = data.id;
   修復: 使用 setFieldValue() 函數或加入 null 檢查
```

#### 🔄 整合到開發流程

1. **開始修改前**：
   ```bash
   node tools/validate-config-modules.js
   ```

2. **修改後**：
   ```bash
   node tools/validate-config-modules.js
   ```

3. **提交前**（未來）：
   ```bash
   # Git pre-commit hook 自動執行
   ```

---

### 第二層：文件強化

#### ✅ 已實作：copilot-instructions.md 置頂警告

**位置**：`.github/copilot-instructions.md` 開頭

**內容**：
- 🚨 開始工作前必讀
- ⚡ 自動化驗證工具
- ❌/✅ 錯誤/正確範例對照

**效果**：AI 打開檔案時第一眼就看到警告

---

### 第三層：範本與檢查清單

#### ✅ 新增配置化模組範本

**檔案**：`docs/templates/config-module-template.md`

<function_calls>
<invoke name="create_file">
<parameter name="content"># 配置化模組開發範本

## 📋 開發檢查清單

### 開始前
- [ ] 執行 `node tools/validate-config-modules.js` 確認系統狀態
- [ ] 查看 `modules/README.md` 確認模組狀態
- [ ] 確認是新增模組還是修改現有模組

### 步驟 1: 建立配置檔

**檔案**：`core/configs/{module_name}.config.js`

```javascript
/**
 * {模組中文名稱}模組配置
 */
ModuleConfig.register('{module_name}', {
    title: '{模組標題}',
    subtitle: '{模組說明}',

    // 標題區按鈕
    actions: [
        { label: '新增', icon: 'fas fa-plus', class: 'btn primary', dataAction: 'create' }
    ],

    // 篩選工具列
    filterToolbar: {
        fields: [
            { name: 'keyword', type: 'text', placeholder: '搜尋...' }
        ]
    },

    // 資料表格
    dataTable: {
        columns: [
            { key: 'id', label: 'ID', sortable: true },
            { key: 'name', label: '名稱', sortable: true },
            { key: 'actions', label: '操作' }
        ],
        rowActions: true
    },

    // ⚠️ 重點：Modal 必須有 hiddenFields
    modal: {
        title: '新增資料',
        size: 'medium',  // xlarge, large, medium, small
        hiddenFields: ['id'],  // ⚠️ 必須加入
        sections: [
            {
                title: '基本資料',
                fields: [
                    { name: 'name', label: '名稱', type: 'text', required: true }
                ]
            }
        ],
        submitDataAction: 'save'
    }
});
```

**檢查**：
- [ ] 已加入 `hiddenFields: ['id']`
- [ ] Modal 尺寸使用標準值（xlarge, large, medium, small）

---

### 步驟 2: 建立 JS 檔案

**檔案**：`js/{module_name}.js`

```javascript
(function() {
    'use strict';

    function initialize{ModuleName}Module(container) {
        const moduleRoot = container.querySelector('[data-module="{module_name}"]');
        if (!moduleRoot || moduleRoot.dataset.initialised === 'true') {
            return;
        }
        moduleRoot.dataset.initialised = 'true';

        // DOM 元素
        const modal = moduleRoot.querySelector('[data-{kebab-module}-modal]');
        const modalForm = modal ? modal.querySelector('[data-{kebab-module}-form]') : null;
        const modalTitle = modal ? modal.querySelector('[data-modal-title]') : null;

        // ⚠️ 重點：必須有防禦性函數
        function openModal(mode, data = null) {
            if (!modal || !modalForm) return;

            // ✅ 安全的欄位設定函數（必須加入）
            function setFieldValue(name, value) {
                const field = modalForm.querySelector(`[name="${name}"]`);
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = !!value;
                    } else {
                        field.value = value || '';
                    }
                } else {
                    console.warn(`{module_name}: 欄位不存在 - ${name}`);
                }
            }

            modalForm.reset();

            if (mode === 'add') {
                if (modalTitle) modalTitle.textContent = '新增資料';
                setFieldValue('id', '');
            } else if (mode === 'edit' && data) {
                if (modalTitle) modalTitle.textContent = '編輯資料';
                setFieldValue('id', data.id);
                setFieldValue('name', data.name);
                // ... 其他欄位
            }

            modal.classList.remove('hidden');
        }

        // ... 其他函數
    }

    window.initialize{ModuleName}Module = initialize{ModuleName}Module;
})();
```

**檢查**：
- [ ] 已加入 `setFieldValue` 函數
- [ ] 所有欄位賦值都使用 `setFieldValue()`
- [ ] ❌ 沒有 `querySelector().value =` 直接賦值

---

### 步驟 3: 執行驗證

```bash
node tools/validate-config-modules.js
```

**預期結果**：
```
✅ 所有檢查通過！系統符合配置化規範。
```

---

### 步驟 4: 瀏覽器測試

1. **開啟模組**
   - [ ] 頁面正常載入
   - [ ] Console 無錯誤

2. **測試新增**
   - [ ] Modal 正常開啟
   - [ ] Console 無 "欄位不存在" 警告
   - [ ] 儲存成功

3. **測試編輯**
   - [ ] Modal 正常開啟
   - [ ] 資料正確填入
   - [ ] Console 無錯誤
   - [ ] 更新成功

---

### 步驟 5: 文件更新

- [ ] 在 `modules/README.md` 中加入模組資訊
- [ ] 如果是新功能，更新相關文件

---

## 🚫 常見錯誤（必須避免）

### 錯誤 1: 忘記 hiddenFields
```javascript
// ❌ 錯誤
modal: {
    title: '新增資料',
    sections: [...]
}

// ✅ 正確
modal: {
    title: '新增資料',
    hiddenFields: ['id'],  // 必須加入
    sections: [...]
}
```

### 錯誤 2: 不安全的 querySelector
```javascript
// ❌ 錯誤
form.querySelector('[name="id"]').value = data.id;

// ✅ 正確
function setFieldValue(name, value) {
    const field = form.querySelector(`[name="${name}"]`);
    if (field) field.value = value || '';
    else console.warn(`欄位不存在 - ${name}`);
}
setFieldValue('id', data.id);
```

### 錯誤 3: Modal 尺寸錯誤
```javascript
// ❌ 錯誤
size: 'modal-window-large'  // 舊格式
size: 'big'                 // 非標準值

// ✅ 正確
size: 'large'  // 使用標準值: xlarge, large, medium, small
```

---

## 📚 參考資源

- **模組索引**：`modules/README.md`
- **配置規範**：`core/configs/README.md`
- **開發指引**：`.github/copilot-instructions.md`
- **驗證工具**：`tools/validate-config-modules.js`
