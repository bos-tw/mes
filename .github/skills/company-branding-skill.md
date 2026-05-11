# Skill Definition: Company Logo Management

本技能定義公司 LOGO 上傳、管理、預覽及列印整合功能。

---

## 1. 功能概述

### 1.1 目標
- 在 `companies` 模組中增加 LOGO 圖片上傳功能
- 支援多張 LOGO 上傳與預覽
- 允許使用者選擇「使用中」的 LOGO
- 自動將使用中的 LOGO 顯示在列印表單的公司名稱左側

### 1.2 適用列印表單

| 代碼 | 表單名稱 | 現有檔案位置 |
|------|----------|--------------|
| DOC-01 | 客戶代工委託確認單 | `print/order_confirmation_print.html` |
| DOC-02 | 生產命令工單 | （需新增或整合至 `api/work_orders/print.php`） |
| DOC-03 | 出貨單 | （待開發） |
| DOC-04 | 品質檢驗報表 | （待開發） |

---

## 2. 資料庫設計

### 2.1 新增資料表：`company_logos`

```sql
CREATE TABLE `company_logos` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT NOT NULL COMMENT '所屬公司 ID',
  `file_name` VARCHAR(255) NOT NULL COMMENT '原始檔名',
  `file_path` VARCHAR(500) NOT NULL COMMENT '相對儲存路徑',
  `file_size` INT DEFAULT NULL COMMENT '檔案大小 (bytes)',
  `mime_type` VARCHAR(50) DEFAULT NULL COMMENT 'MIME 類型',
  `is_active` TINYINT(1) DEFAULT 0 COMMENT '是否為使用中的 LOGO (0=否, 1=是)',
  `sort_order` INT DEFAULT 0 COMMENT '排序順序',
  `uploaded_by_employee_id` BIGINT DEFAULT NULL COMMENT '上傳者員工 ID',
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '上傳時間',
  `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT '軟刪除時間',
  PRIMARY KEY (`id`),
  KEY `idx_company_id` (`company_id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_company_logos_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='公司 LOGO 圖片';
```

### 2.2 約束規則
- 每個公司**僅能有一個** `is_active = 1` 的 LOGO
- 設定新 LOGO 為啟用時，必須先將該公司其他 LOGO 的 `is_active` 設為 0
- 刪除時使用軟刪除（設定 `deleted_at`）

---

## 3. 檔案儲存規範

### 3.1 儲存路徑
```
uploads/
└── company_logos/
    └── {company_id}/
        ├── logo_abc123.png
        ├── logo_def456.jpg
        └── ...
```

### 3.2 檔案限制
| 項目 | 規範 |
|------|------|
| 允許格式 | PNG, JPEG, JPG, SVG, WebP |
| 最大檔案大小 | 2MB |
| 建議尺寸 | 寬度 300-800px，高度自動等比縮放 |
| 檔名格式 | `logo_{uniqid()}.{extension}` |

---

## 4. API 設計

### 4.1 端點總覽

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/api/companies/logos.php?company_id={id}` | 取得公司所有 LOGO |
| POST | `/api/companies/logos.php` | 上傳新 LOGO |
| PUT | `/api/companies/logos.php?id={logo_id}` | 更新 LOGO（設為啟用） |
| DELETE | `/api/companies/logos.php?id={logo_id}` | 刪除 LOGO |

### 4.2 API 詳細規格

#### GET - 取得公司 LOGO 列表
```php
// 檔案: api/companies/logos.php

/**
 * @endpoint GET /api/companies/logos.php
 *
 * @input Query Parameters
 * | 參數       | 類型 | 必填 | 說明 |
 * |------------|------|------|------|
 * | company_id | int  | Y    | 公司 ID |
 *
 * @output 成功回應
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 1,
 *       "company_id": 1,
 *       "file_name": "company_logo.png",
 *       "file_path": "uploads/company_logos/1/logo_abc123.png",
 *       "file_size": 102400,
 *       "mime_type": "image/png",
 *       "is_active": true,
 *       "sort_order": 1,
 *       "uploaded_at": "2025-01-01 10:00:00",
 *       "uploaded_by_name": "王小明"
 *     }
 *   ]
 * }
 */
```

#### POST - 上傳 LOGO
```php
/**
 * @endpoint POST /api/companies/logos.php
 *
 * @input multipart/form-data
 * | 參數       | 類型 | 必填 | 說明 |
 * |------------|------|------|------|
 * | company_id | int  | Y    | 公司 ID |
 * | logo       | file | Y    | LOGO 圖片檔案 |
 * | is_active  | int  | N    | 是否設為使用中 (0/1)，預設 0 |
 *
 * @output 成功回應
 * {
 *   "success": true,
 *   "message": "LOGO 上傳成功。",
 *   "data": {
 *     "id": 5,
 *     "file_path": "uploads/company_logos/1/logo_xyz789.png"
 *   }
 * }
 */
```

#### PUT - 設定啟用 LOGO
```php
/**
 * @endpoint PUT /api/companies/logos.php?id={logo_id}
 *
 * @input JSON body
 * | 參數      | 類型 | 必填 | 說明 |
 * |-----------|------|------|------|
 * | is_active | int  | Y    | 1=啟用, 0=停用 |
 *
 * @output 成功回應
 * {
 *   "success": true,
 *   "message": "已設定為使用中的 LOGO。"
 * }
 *
 * @logic 啟用時自動停用同公司其他 LOGO
 */
```

#### DELETE - 刪除 LOGO
```php
/**
 * @endpoint DELETE /api/companies/logos.php?id={logo_id}
 *
 * @output 成功回應
 * {
 *   "success": true,
 *   "message": "LOGO 已刪除。"
 * }
 *
 * @error 400 無法刪除使用中的 LOGO，請先設定其他 LOGO 為使用中
 */
```

### 4.3 取得使用中 LOGO（供列印用）

```php
/**
 * @endpoint GET /api/companies/active_logo.php?company_id={id}
 *
 * @output 成功回應
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "file_path": "uploads/company_logos/1/logo_abc123.png",
 *     "file_url": "/mes/uploads/company_logos/1/logo_abc123.png"
 *   }
 * }
 *
 * @output 無啟用 LOGO
 * {
 *   "success": true,
 *   "data": null
 * }
 */
```

---

## 5. 前端實作規範

### 5.1 修改 `modules/companies.html`

在 Modal 表單中新增 LOGO 管理區塊：

```html
<!-- 在 </form> 結束標籤之前，form-actions 之前加入 -->
<section class="form-section">
    <h4><i class="fas fa-image"></i> LOGO 管理</h4>

    <!-- 上傳區域 -->
    <div class="logo-upload-area">
        <div class="logo-dropzone" data-action="upload-logo">
            <i class="fas fa-cloud-upload-alt"></i>
            <span>拖曳圖片或點擊上傳</span>
            <small>支援 PNG, JPG, SVG, WebP (最大 2MB)</small>
            <input type="file" name="logo" accept="image/png,image/jpeg,image/svg+xml,image/webp" hidden>
        </div>
    </div>

    <!-- LOGO 庫列表 -->
    <div class="logo-library" data-company-logos>
        <!-- 動態載入 LOGO 項目 -->
    </div>
</section>
```

### 5.2 LOGO 項目渲染模板

```html
<div class="logo-item ${logo.is_active ? 'active' : ''}" data-logo-id="${logo.id}">
    <div class="logo-preview">
        <img src="${logo.file_path}" alt="LOGO">
    </div>
    <div class="logo-info">
        <span class="logo-name">${logo.file_name}</span>
        <span class="logo-meta">${formatFileSize(logo.file_size)} · ${formatDate(logo.uploaded_at)}</span>
    </div>
    <div class="logo-actions">
        <button type="button" class="icon-btn" data-action="preview-logo" title="預覽">
            <i class="fas fa-eye"></i>
        </button>
        <button type="button" class="icon-btn ${logo.is_active ? 'active' : ''}"
                data-action="set-active-logo" title="${logo.is_active ? '使用中' : '設為使用中'}">
            <i class="fas fa-check-circle"></i>
        </button>
        <button type="button" class="icon-btn danger" data-action="delete-logo" title="刪除"
                ${logo.is_active ? 'disabled' : ''}>
            <i class="fas fa-trash"></i>
        </button>
    </div>
    ${logo.is_active ? '<span class="logo-badge">使用中</span>' : ''}
</div>
```

### 5.3 修改 `js/companies.js`

需新增的功能函式：

```javascript
// === LOGO 管理功能 ===

// 載入公司 LOGO 列表
async function loadCompanyLogos(companyId) { /* ... */ }

// 上傳 LOGO
async function uploadLogo(companyId, file) { /* ... */ }

// 設定使用中 LOGO
async function setActiveLogo(logoId) { /* ... */ }

// 刪除 LOGO
async function deleteLogo(logoId) { /* ... */ }

// 預覽 LOGO (開啟 Lightbox)
function previewLogo(logoUrl) { /* ... */ }

// 渲染 LOGO 列表
function renderLogoLibrary(logos) { /* ... */ }

// 綁定 LOGO 區域事件
function bindLogoEvents() { /* ... */ }
```

---

## 6. 樣式規範

### 6.1 新增至 `styles.css`

```css
/* === LOGO 上傳區域 === */
.logo-upload-area {
    margin-bottom: 1rem;
}

.logo-dropzone {
    border: 2px dashed #ddd;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #fafafa;
}

.logo-dropzone:hover,
.logo-dropzone.dragover {
    border-color: #4CAF50;
    background: #f0fff0;
}

.logo-dropzone i {
    font-size: 2rem;
    color: #9e9e9e;
    display: block;
    margin-bottom: 0.5rem;
}

.logo-dropzone span {
    display: block;
    color: #666;
    margin-bottom: 0.25rem;
}

.logo-dropzone small {
    color: #999;
    font-size: 0.8rem;
}

/* === LOGO 庫列表 === */
.logo-library {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.logo-item {
    position: relative;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 0.75rem;
    background: #fff;
    transition: all 0.2s ease;
}

.logo-item:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.logo-item.active {
    border-color: #4CAF50;
    background: #f0fff0;
}

.logo-preview {
    width: 100%;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    border-radius: 4px;
    margin-bottom: 0.5rem;
    overflow: hidden;
}

.logo-preview img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.logo-info {
    margin-bottom: 0.5rem;
}

.logo-name {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.logo-meta {
    font-size: 0.75rem;
    color: #999;
}

.logo-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}

.logo-actions .icon-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: #f5f5f5;
    color: #666;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.logo-actions .icon-btn:hover {
    background: #e8f5e9;
    color: #4CAF50;
}

.logo-actions .icon-btn.active {
    background: #4CAF50;
    color: #fff;
}

.logo-actions .icon-btn.danger:hover {
    background: #ffebee;
    color: #d32f2f;
}

.logo-actions .icon-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.logo-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: #4CAF50;
    color: #fff;
    font-size: 0.7rem;
    padding: 0.15rem 0.5rem;
    border-radius: 10px;
}

/* === LOGO 預覽 Lightbox === */
.logo-lightbox {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    cursor: zoom-out;
}

.logo-lightbox img {
    max-width: 90%;
    max-height: 90%;
    object-fit: contain;
}
```

---

## 7. 列印整合

### 7.1 列印標頭 HTML 結構

修改所有列印表單的標頭區塊：

```html
<!-- 修改前 (原 order_confirmation_print.html) -->
<div class="header-section">
    <div class="main-title">客戶代工委託確認單</div>
</div>

<!-- 修改後 -->
<div class="header-section">
    <div class="company-branding">
        <img src="" alt="公司LOGO" class="company-logo" data-company-logo>
        <div class="company-name" data-company-name>羽全有限公司</div>
    </div>
    <div class="main-title">客戶代工委託確認單</div>
</div>
```

### 7.2 列印樣式

```css
/* 列印專用樣式 - 新增至各列印頁面 */
.company-branding {
    display: flex;
    align-items: center;
    gap: 12px;
}

.company-logo {
    height: 50px;
    max-height: 60px;
    width: auto;
    object-fit: contain;
}

.company-logo:not([src]),
.company-logo[src=""] {
    display: none;
}

.company-name {
    font-size: 18pt;
    font-weight: bold;
    color: #000;
}

@media print {
    .company-logo {
        height: 1.5cm;
        max-height: 2cm;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }
}
```

### 7.3 列印資料載入

各列印頁面需在載入資料時一併取得公司 LOGO：

```javascript
// 範例：載入訂單列印資料時取得 LOGO
async function loadPrintData(orderId) {
    // 取得訂單資料
    const orderRes = await fetch(`/api/orders/show.php?id=${orderId}&include=items,customer`);
    const orderData = await orderRes.json();

    // 取得公司使用中的 LOGO
    const logoRes = await fetch('/api/companies/active_logo.php?company_id=1');
    const logoData = await logoRes.json();

    // 設定 LOGO
    const logoImg = document.querySelector('[data-company-logo]');
    if (logoData.success && logoData.data) {
        logoImg.src = logoData.data.file_url;
    } else {
        logoImg.style.display = 'none';
    }

    // 填充其他資料...
}
```

---

## 8. 參考現有實作

### 8.1 圖片上傳參考
- 參考 `api/work_order_images/index.php` 的上傳邏輯
- 參考 `uploads/work_orders/` 的目錄結構

### 8.2 API 風格參考
- 遵循 `api/bootstrap.php` 的 `jsonResponse()` 回傳格式
- 使用 `requireAuth()` 驗證登入狀態
- 使用 `logAuditAction()` 記錄操作日誌

### 8.3 UI 風格參考
- 遵循 `.github/skills/ui-style.md` 的色彩與元件規範
- 遵循 `.github/copilot-instructions.md` 的 Modal 結構規範

---

## 9. 實作檢查清單

### 9.1 資料庫
- [ ] 建立 `company_logos` 資料表
- [ ] 更新 `yucyuan_for_mariadb.sql`

### 9.2 後端 API
- [ ] 建立 `api/companies/logos.php`
- [ ] 建立 `api/companies/active_logo.php`
- [ ] 建立 `uploads/company_logos/` 目錄

### 9.3 前端
- [ ] 修改 `modules/companies.html` 新增 LOGO 區塊
- [ ] 修改 `js/companies.js` 新增 LOGO 管理功能
- [ ] 修改 `styles.css` 新增 LOGO 相關樣式

### 9.4 列印整合
- [ ] 修改 `print/order_confirmation_print.html`
- [ ] 修改/建立其他列印表單

### 9.5 測試
- [ ] 上傳 PNG/JPG/SVG 格式測試
- [ ] 大於 2MB 檔案拒絕測試
- [ ] 啟用/停用切換測試
- [ ] 列印預覽 LOGO 顯示測試
- [ ] 刪除使用中 LOGO 阻擋測試

---

## 10. 版本紀錄

| 版本 | 日期 | 說明 |
|------|------|------|
| 1.0.0 | 2026-01-25 | 初版建立 |
