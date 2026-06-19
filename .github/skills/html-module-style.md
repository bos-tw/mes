# HTML 模組撰寫風格指南

此 Skill 定義 MES 系統 HTML 模組頁面的標準撰寫風格，開發新模組時必須遵循。

---

## 1. 模組頁面基本結構

```html
<!-- 頁面標題區 -->
<div class="content-header with-actions">
    <div>
        <h2>模組名稱</h2>
        <p class="subtitle">模組功能說明</p>
    </div>
    <div class="header-actions">
        <button type="button" class="btn primary" data-action="create">
            <i class="fas fa-plus"></i> 新增
        </button>
        <button type="button" class="btn outline" data-action="print">
            <i class="fas fa-print"></i> 列印
        </button>
    </div>
</div>

<!-- 模組主體（必須有 data-module 屬性）-->
<div class="content-area" data-module="{module_name}">
    <!-- Alert 區域 -->
    <div class="module-alert hidden" data-{module-name}-alert></div>

    <!-- 篩選區域 -->
    <section class="module-toolbar compact">
        <form class="filter-form" data-{module-name}-filter>
            <!-- 篩選表單內容 -->
        </form>
    </section>

    <!-- 表格區域 -->
    <section class="table-section">
        <div class="table-responsive">
            <table class="data-table" data-{module-name}-table>
                <!-- 表格內容 -->
            </table>
        </div>
        <div class="pagination" data-{module-name}-pagination></div>
    </section>

    <!-- Modal 區域 -->
    <div class="modal-overlay hidden" data-{module-name}-modal>
        <!-- Modal 內容 -->
    </div>
</div>
```

---

## 2. Data 屬性命名規則

### 2.1 命名轉換

| 用途 | 格式 | 範例 |
|------|------|------|
| 模組識別 | `data-module="{snake_case}"` | `data-module="order_items"` |
| 元素選取 | `data-{kebab-case}-{element}` | `data-order-items-table` |
| 動作按鈕 | `data-action="{action}"` | `data-action="create"` |

### 2.2 標準元素命名

```html
<!-- 模組根元素 -->
<div class="content-area" data-module="order_items">

<!-- Alert -->
<div class="module-alert hidden" data-order-items-alert></div>

<!-- 篩選表單 -->
<form class="filter-form" data-order-items-filter>

<!-- 表格 -->
<table class="data-table" data-order-items-table>

<!-- 分頁 -->
<div class="pagination" data-order-items-pagination></div>

<!-- Modal -->
<div class="modal-overlay hidden" data-order-items-modal>

<!-- Modal 內 Alert -->
<div class="modal-alert hidden" data-order-items-modal-alert role="alert"></div>

<!-- Modal 表單 -->
<form data-order-items-form novalidate>

<!-- 欄位選擇器 -->
<div data-order-items-column-selector class="column-selector" style="display: none;">
```

---

## 3. 篩選表單區域

```html
<section class="module-toolbar compact">
    <form class="filter-form" data-{module-name}-filter>
        <div class="form-grid">
            <!-- 關鍵字搜尋 -->
            <label>
                <span>關鍵字</span>
                <input type="text" name="keyword" placeholder="搜尋名稱、編號...">
            </label>

            <!-- 下拉選單篩選 -->
            <label>
                <span>狀態</span>
                <select name="status">
                    <option value="">全部</option>
                    <option value="pending">待處理</option>
                    <option value="completed">已完成</option>
                </select>
            </label>

            <!-- 日期範圍 -->
            <label>
                <span>開始日期</span>
                <input type="date" name="start_date">
            </label>
            <label>
                <span>結束日期</span>
                <input type="date" name="end_date">
            </label>

            <!-- 每頁筆數 -->
            <label>
                <span>每頁筆數</span>
                <select name="perPage">
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                </select>
            </label>
        </div>
        <div class="form-actions">
            <button type="submit" class="primary">套用</button>
            <button type="button" data-action="reset-filter">重設</button>
        </div>
    </form>
</section>
```

---

## 4. 表格區域

### 4.1 基本表格結構

```html
<section class="table-section">
    <div class="table-responsive">
        <table class="data-table" data-{module-name}-table>
            <thead>
                <tr>
                    <!-- 可排序欄位 -->
                    <th data-sort="id">ID <i class="fas fa-sort"></i></th>
                    <th data-sort="name">名稱 <i class="fas fa-sort"></i></th>
                    <th data-sort="created_at">建立時間 <i class="fas fa-sort"></i></th>
                    <!-- 不可排序欄位 -->
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="4" class="text-center">資料載入中...</td>
                </tr>
            </tbody>
        </table>
    </div>
    <div class="pagination" data-{module-name}-pagination></div>
</section>
```

### 4.2 欄位設定功能（Column Manager）

```html
<!-- 欄位設定按鈕（放在 header-actions 或 module-toolbar） -->
<button type="button" data-action="toggle-column-selector">
    <i class="fas fa-columns"></i> 欄位設定
</button>

<!-- 欄位選擇器面板 -->
<div data-{module-name}-column-selector class="column-selector" style="display: none;">
    <div class="column-selector-header">
        <span>選擇顯示欄位</span>
        <button type="button" data-action="close-column-selector">×</button>
    </div>
    <div class="column-selector-body">
        <label><input type="checkbox" data-column="id" checked> ID</label>
        <label><input type="checkbox" data-column="name" checked> 名稱</label>
        <label><input type="checkbox" data-column="status" checked> 狀態</label>
    </div>
    <div class="column-selector-footer">
        <button type="button" data-action="select-all-columns">全選</button>
        <button type="button" data-action="deselect-all-columns">全不選</button>
        <button type="button" data-action="apply-column-settings">套用</button>
    </div>
</div>

<!-- 表格欄位必須有 data-column 屬性 -->
<table class="data-table" data-{module-name}-table>
    <thead>
        <tr>
            <th data-column="id">ID</th>
            <th data-column="name">名稱</th>
            <th data-column="status">狀態</th>
            <th>操作</th>
        </tr>
    </thead>
</table>
```

---

## 5. Modal 對話框

### 5.1 標準 Modal 結構

```html
<div class="modal-overlay hidden" data-{module-name}-modal>
    <div class="modal-window">
        <!-- 關閉按鈕 -->
        <button type="button" class="modal-close" data-action="close-modal" aria-label="關閉">
            <i class="fas fa-times"></i>
        </button>

        <!-- 標題 -->
        <h3 data-modal-title>新增資料</h3>

        <!-- Modal 內部錯誤訊息顯示區 -->
        <div class="modal-alert hidden" data-{module-name}-modal-alert role="alert"></div>

        <!-- 表單 -->
        <form data-{module-name}-form novalidate>
            <input type="hidden" name="id">

            <section class="form-section">
                <h4>區塊標題</h4>
                <div class="form-grid">
                    <!-- 欄位 -->
                </div>
            </section>

            <div class="form-actions align-right">
                <button type="button" class="outline" data-action="cancel">取消</button>
                <button type="submit" class="primary">儲存</button>
            </div>
        </form>
    </div>
</div>
```

### 5.2 Modal 尺寸

```html
<!-- 預設尺寸 -->
<div class="modal-window">

<!-- 中大型表單 -->
<div class="modal-window large">

<!-- 小型確認對話框 -->
<div class="modal-window medium">
```

**⚠️ 禁止使用連字號格式**：
```html
<!-- ❌ 不要使用 -->
<div class="modal-window modal-window-large">

<!-- ✅ 正確格式 -->
<div class="modal-window large">
```

---

## 6. 表單欄位

### 6.1 標準欄位格式

```html
<section class="form-section">
    <h4>基本資訊</h4>
    <div class="form-grid">
        <!-- 必填欄位 -->
        <label class="inline-label">
            <span>名稱 <abbr title="必填">*</abbr></span>
            <input type="text" name="name" required placeholder="請輸入名稱" autocomplete="off">
        </label>

        <!-- 選填欄位 -->
        <label class="inline-label">
            <span>電話</span>
            <input type="tel" name="phone" placeholder="請輸入電話" autocomplete="off">
        </label>

        <!-- 下拉選單 -->
        <label class="inline-label">
            <span>類型 <abbr title="必填">*</abbr></span>
            <select name="type" required>
                <option value="">請選擇</option>
                <option value="A">類型 A</option>
                <option value="B">類型 B</option>
            </select>
        </label>

        <!-- 全寬欄位 -->
        <label class="inline-label full-width">
            <span>備註</span>
            <textarea name="notes" rows="3" placeholder="請輸入備註"></textarea>
        </label>
    </div>
</section>
```

### 6.2 欄位類型

```html
<!-- 文字輸入 -->
<input type="text" name="name" maxlength="255" placeholder="請輸入" autocomplete="off">

<!-- 數字輸入 -->
<input type="number" name="quantity" min="0" step="1" placeholder="請輸入數量">

<!-- 小數輸入 -->
<input type="number" name="price" min="0" step="0.01" placeholder="請輸入金額">

<!-- 日期 -->
<input type="date" name="order_date">

<!-- 電話 -->
<input type="tel" name="phone" maxlength="50" placeholder="請輸入電話">

<!-- Email -->
<input type="email" name="email" maxlength="100" placeholder="請輸入電子郵件">

<!-- 多行文字 -->
<textarea name="notes" rows="3" placeholder="請輸入備註"></textarea>

<!-- 下拉選單 -->
<select name="status" required>
    <option value="">請選擇</option>
</select>

<!-- 勾選框 -->
<label class="checkbox-label">
    <input type="checkbox" name="is_active" value="1">
    <span>啟用</span>
</label>
```

---

## 7. 詳情檢視 Modal

```html
<div class="modal-overlay hidden" data-{module-name}-detail-modal>
    <div class="modal-window large">
        <button type="button" class="modal-close" data-action="close-detail-modal" aria-label="關閉">
            <i class="fas fa-times"></i>
        </button>
        <h3><i class="fas fa-info-circle"></i> 資料詳情</h3>

        <div class="detail-content" data-{module-name}-details>
            <!-- 詳情內容動態載入 -->
        </div>

        <div class="form-actions">
            <button type="button" class="outline" data-action="close-detail-modal">關閉</button>
            <button type="button" class="primary" data-action="edit-from-detail">編輯</button>
        </div>
    </div>
</div>
```

---

## 8. 按鈕規範

### 8.1 按鈕類別

```html
<!-- 主要按鈕（綠色） -->
<button type="submit" class="primary">儲存</button>
<button type="button" class="btn primary">新增</button>

<!-- 次要按鈕（邊框） -->
<button type="button" class="outline">取消</button>
<button type="button" class="btn outline">列印</button>

<!-- 成功按鈕 -->
<button type="button" class="btn success">確認</button>

<!-- 文字按鈕（表格內操作） -->
<button type="button" class="btn text" data-action="edit" title="編輯">
    <i class="fas fa-edit"></i>
</button>
<button type="button" class="btn text danger" data-action="delete" title="刪除">
    <i class="fas fa-trash"></i>
</button>
```

### 8.2 按鈕位置

```html
<!-- 表單內按鈕 -->
<div class="form-actions align-right">
    <button type="button" class="outline" data-action="cancel">取消</button>
    <button type="submit" class="primary">儲存</button>
</div>

<!-- Header 按鈕 -->
<div class="header-actions">
    <button type="button" class="btn primary" data-action="create">
        <i class="fas fa-plus"></i> 新增
    </button>
</div>
```

---

## 9. 狀態徽章

```html
<!-- 使用 status-badge 類別 -->
<span class="status-badge pending">待處理</span>
<span class="status-badge in-progress">進行中</span>
<span class="status-badge completed">已完成</span>
<span class="status-badge cancelled">已取消</span>

<!-- 通用狀態 -->
<span class="status-badge success">成功</span>
<span class="status-badge danger">失敗</span>
<span class="status-badge warning">警告</span>
<span class="status-badge secondary">次要</span>

<!-- 啟用/停用 -->
<span class="status-badge active">啟用</span>
<span class="status-badge inactive">停用</span>
```

---

## 10. 無障礙屬性

```html
<!-- Alert 區域 -->
<div class="modal-alert hidden" data-{module-name}-modal-alert role="alert"></div>

<!-- 關閉按鈕 -->
<button type="button" class="modal-close" data-action="close-modal" aria-label="關閉">
    <i class="fas fa-times"></i>
</button>

<!-- 必填欄位 -->
<span>名稱 <abbr title="必填">*</abbr></span>

<!-- 表單驗證 -->
<form data-{module-name}-form novalidate>
```

---

## 11. 完整模組範例

```html
<div class="content-header with-actions">
    <div>
        <h2>客戶基本資料</h2>
        <p class="subtitle">維護客戶基本資料與聯絡資訊</p>
    </div>
    <div class="header-actions">
        <button type="button" class="btn primary" data-action="create">
            <i class="fas fa-plus"></i> 新增
        </button>
    </div>
</div>

<div class="content-area" data-module="customers">
    <div class="module-alert hidden" data-customers-alert></div>

    <section class="module-toolbar compact">
        <form class="filter-form" data-customers-filter>
            <div class="form-grid">
                <label>
                    <span>關鍵字</span>
                    <input type="text" name="keyword" placeholder="搜尋客戶名稱、編號...">
                </label>
                <label>
                    <span>每頁筆數</span>
                    <select name="perPage">
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                </label>
            </div>
            <div class="form-actions">
                <button type="submit" class="primary">套用</button>
                <button type="button" data-action="reset-filter">重設</button>
            </div>
        </form>
    </section>

    <section class="table-section">
        <div class="table-responsive">
            <table class="data-table" data-customers-table>
                <thead>
                    <tr>
                        <th data-column="id" data-sort="id">ID <i class="fas fa-sort"></i></th>
                        <th data-column="customer_number">客戶編號</th>
                        <th data-column="name" data-sort="name">客戶名稱 <i class="fas fa-sort"></i></th>
                        <th data-column="contact_person">聯絡人</th>
                        <th data-column="phone">電話</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td colspan="6" class="text-center">資料載入中...</td></tr>
                </tbody>
            </table>
        </div>
        <div class="pagination" data-customers-pagination></div>
    </section>

    <div class="modal-overlay hidden" data-customers-modal>
        <div class="modal-window">
            <button type="button" class="modal-close" data-action="close-modal" aria-label="關閉">
                <i class="fas fa-times"></i>
            </button>
            <h3 data-modal-title>新增客戶</h3>
            <div class="modal-alert hidden" data-customers-modal-alert role="alert"></div>

            <form data-customers-form novalidate>
                <input type="hidden" name="id">
                <section class="form-section">
                    <h4>基本資訊</h4>
                    <div class="form-grid">
                        <label class="inline-label">
                            <span>客戶名稱 <abbr title="必填">*</abbr></span>
                            <input type="text" name="name" required placeholder="請輸入客戶名稱" autocomplete="off">
                        </label>
                        <label class="inline-label">
                            <span>聯絡人</span>
                            <input type="text" name="contact_person" placeholder="請輸入聯絡人" autocomplete="off">
                        </label>
                        <label class="inline-label">
                            <span>電話</span>
                            <input type="tel" name="phone" placeholder="請輸入電話" autocomplete="off">
                        </label>
                        <label class="inline-label">
                            <span>Email</span>
                            <input type="email" name="email" placeholder="請輸入電子郵件" autocomplete="off">
                        </label>
                    </div>
                </section>

                <div class="form-actions align-right">
                    <button type="button" class="outline" data-action="cancel">取消</button>
                    <button type="submit" class="primary">儲存</button>
                </div>
            </form>
        </div>
    </div>
</div>
```
