# 模組配置規範 (Module Config Specification)

> ⚠️ **嚴格執行**：所有配置必須使用統一格式，不允許變體

---

## 📋 必要檢查清單

### 建立配置前
- [ ] 閱讀本規範文件
- [ ] 複製 `companies.config.js` 作為模板
- [ ] 確認模組 JS 需要的 data 屬性選擇器

### 建立配置後
- [ ] VS Code 無語法錯誤
- [ ] **瀏覽器實際測試**（不是只有語法檢查！）
- [ ] Console 無錯誤
- [ ] 頁面能正確渲染
- [ ] Modal 能正確開啟/關閉
- [ ] 資料能正確載入顯示

---

## 🔤 標準格式（唯一允許的格式）

```javascript
ModuleConfig.register('module_name', {
    title: '模組標題',
    subtitle: '模組說明',
    
    // ✅ 標題區按鈕：使用 actions
    actions: [
        { 
            action: 'create',      // ✅ 使用 action
            label: '新增', 
            icon: 'fa-plus',       // ✅ 不加 fas 前綴
            style: 'primary'       // ✅ 使用 style
        }
    ],
    
    // ✅ 篩選欄位：使用 filters
    filters: [
        { name: 'keyword', label: '關鍵字', type: 'text', placeholder: '搜尋...' }
    ],
    
    // ✅ 表格欄位：使用 columns
    columns: [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'actions', label: '操作', sortable: false, selectable: false }
    ],
    
    // Modal 配置
    modal: {
        title: '新增資料',
        sections: [
            {
                title: '基本資訊',
                fields: [
                    { name: 'name', label: '名稱', required: true }
                ]
            }
        ]
    }
});
```

---

## ❌ 禁止使用的格式

| 錯誤寫法 | 正確寫法 |
|----------|----------|
| `headerActions: [...]` | `actions: [...]` |
| `dataAction: 'create'` | `action: 'create'` |
| `class: 'btn primary'` | `style: 'primary'` |
| `icon: 'fas fa-plus'` | `icon: 'fa-plus'` |
| `filterToolbar: { fields: [...] }` | `filters: [...]` |
| `dataTable: { columns: [...] }` | `columns: [...]` |

---

## 📝 style 對應表

| style 值 | 產生的 CSS class |
|----------|-----------------|
| `'primary'` | `btn primary` |
| `'danger'` | `btn danger` |
| `'outline'` 或其他 | `btn outline` |

---

## 📁 參考配置檔

建立新配置時，**必須**參考：

- `companies.config.js` - 標準格式範例

---

## 📅 版本歷史

| 日期 | 更新內容 |
|------|----------|
| 2026-01-29 | 統一格式規範，移除兼容性代碼 |
