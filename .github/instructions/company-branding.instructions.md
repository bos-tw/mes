---
applyTo: "api/companies/**,js/companies.js,core/configs/companies.config.js,print/**"
---

# 公司 LOGO 管理規範

> 完整規範：`.github/skills/company-branding-skill.md`

## LOGO 上傳規則

- 儲存路徑：`uploads/logos/{company_id}.{ext}`
- 允許格式：`image/jpeg`, `image/png`, `image/gif`, `image/webp`
- 最大尺寸：2MB
- 必須驗證 MIME type（不可只看副檔名）

```php
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($_FILES['logo']['tmp_name']);
if (!in_array($mimeType, $allowedTypes, true)) {
    jsonResponse(['success' => false, 'message' => '不支援的圖片格式。'], 400);
}
```

## 資料表欄位

```sql
-- companies 資料表應有以下欄位
logo_path      VARCHAR(500) NULL  -- 相對於網站根目錄的路徑
logo_updated_at TIMESTAMP NULL    -- 用於強制瀏覽器重新載入（cache busting）
```

## 前端顯示

```javascript
// 顯示 LOGO（帶 cache busting）
function renderLogo(company) {
    const img = document.querySelector('[data-company-logo]');
    if (!img) return;
    if (company.logo_path) {
        img.src = `/${company.logo_path}?t=${Date.now()}`;
        img.style.display = '';
    } else {
        img.style.display = 'none';
    }
}
```

## 列印範本整合

```javascript
// 列印範本中顯示公司 LOGO
async function loadCompanyInfo() {
    const res = await fetch('../api/companies/index.php', {
        credentials: 'include'
    });
    const data = await res.json();
    if (data.success && data.data.length > 0) {
        const company = data.data[0];
        document.querySelector('[data-company-name]').textContent = company.name || '';
        if (company.logo_path) {
            const logoEl = document.querySelector('[data-company-logo]');
            if (logoEl) logoEl.src = `/${company.logo_path}`;
        }
    }
}
```

## 注意事項

- 刪除公司時，需同步刪除 `uploads/logos/` 中的 LOGO 檔案
- LOGO 預覽需使用 `URL.createObjectURL()` 避免先上傳再顯示
- 若 `companies` 資料表為空，列印範本的公司資訊欄位將顯示空白
