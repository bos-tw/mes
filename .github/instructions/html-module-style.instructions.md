---
applyTo: "modules/**,core/configs/**"
---

# HTML 模組撰寫風格指南

> 完整規範：`.github/skills/html-module-style.md`

## 標準頁面結構

```html
<div data-module="module_name">

  <!-- 頁首 -->
  <div class="content-header with-actions">
    <div>
      <h2>模組標題</h2>
      <p class="subtitle">模組描述</p>
    </div>
    <div class="header-actions">
      <button type="button" class="btn primary" data-action="create">
        <i class="fas fa-plus"></i> 新增
      </button>
    </div>
  </div>

  <!-- 主內容 -->
  <div class="content-area">
    <div class="module-alert hidden" data-{module}-alert></div>

    <!-- 篩選工具列 -->
    <section class="module-toolbar compact">
      <form class="filter-form" data-{module}-filter>
        <div class="filter-row">...</div>
        <div class="form-actions">
          <button type="submit" class="btn primary small">套用</button>
          <button type="button" class="btn outline small" data-action="reset-filter">重設</button>
        </div>
      </form>
    </section>

    <!-- 資料表格 -->
    <section class="table-section">
      <div class="table-responsive">
        <table data-{module}-table>
          <thead><tr>
            <th data-column="name" data-sort="name">名稱 <i class="fas fa-sort"></i></th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <div class="pagination" data-{module}-pagination></div>
    </section>
  </div>

  <!-- Modal -->
  <div class="modal-overlay hidden" data-{module}-modal>...</div>
</div>
```

## 禁止的結構

```html
<!-- ❌ 禁止 sticky -->
<div class="content-header with-actions sticky">

<!-- ❌ 禁止連字號按鈕類別 -->
<button class="btn-primary">
<button class="btn-outline">

<!-- ❌ 禁止連字號 Modal 尺寸 -->
<div class="modal-window modal-window-large">
```

## 表格操作按鈕

```html
<!-- ✅ 必須使用 btn text / btn text danger -->
<button type="button" class="btn text" data-action="edit" title="編輯">
  <i class="fas fa-edit"></i>
</button>
<button type="button" class="btn text danger" data-action="delete" title="刪除">
  <i class="fas fa-trash"></i>
</button>

<!-- ❌ 禁止 -->
<button class="btn-icon">
<button class="btn text purple">
<button data-action="edit">  <!-- 沒有 class -->
```

## Modal 標準結構

```html
<div class="modal-overlay hidden" data-{module}-modal>
  <div class="modal-window medium">  <!-- 或 large / small -->
    <button type="button" class="modal-close" data-action="close-modal" aria-label="關閉">
      <i class="fas fa-times"></i>
    </button>
    <h3 data-modal-title>新增資料</h3>
    <div class="modal-alert hidden" data-{module}-modal-alert role="alert"></div>

    <form data-{module}-form novalidate>
      <input type="hidden" name="id">
      <section class="form-section">
        <h4>基本資料</h4>
        <div class="form-grid">
          <label class="inline-label">
            <span>名稱 <abbr title="必填">*</abbr></span>
            <input type="text" name="name" required autocomplete="off">
          </label>
        </div>
      </section>
      <div class="form-actions align-right">
        <button type="button" class="outline" data-action="cancel">取消</button>
        <button type="submit" class="primary" data-action="save">儲存</button>
      </div>
    </form>
  </div>
</div>
```

## 命名規則（snake → kebab）

| 用途 | 格式 | 範例 |
|------|------|------|
| data-module | snake_case | `data-module="order_items"` |
| data 屬性 | kebab-case | `data-order-items-table` |
