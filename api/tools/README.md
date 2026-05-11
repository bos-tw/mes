# MES API 開發工具文件

## 概述

本目錄包含 MES 系統的 API 開發輔助工具。

---

## 1. API 程式碼產生器 (generate-api.php)

### 功能
自動生成符合規範的 CRUD API 檔案。

### 使用方式
```bash
cd api/tools
php generate-api.php <module_name> <table_name> [options]
```

### 選項
| 選項 | 說明 |
|------|------|
| `--soft-delete` | 使用軟刪除 (deleted_at) |
| `--no-helpers` | 不生成 helpers.php |
| `--force` | 強制覆蓋現有檔案 |

### 範例
```bash
# 基本用法
php generate-api.php products products

# 使用軟刪除
php generate-api.php user_profiles user_profiles --soft-delete

# 強制覆蓋
php generate-api.php orders orders --force
```

### 生成檔案
- `helpers.php` - 共用函數
- `index.php` - 列表 API (GET)
- `show.php` - 取得單筆 (GET)
- `update.php` - 新增/更新 (POST/PUT)
- `delete.php` - 刪除 (DELETE)

---

## 2. API 文件產生器 (generate-api-docs.php)

### 功能
從 API 程式碼自動產生 OpenAPI 3.0 規格文件。

### 使用方式
```bash
cd api/tools
php generate-api-docs.php [選項]
```

### 選項
| 選項 | 說明 |
|------|------|
| `--format=json\|yaml` | 輸出格式（預設: json）|
| `--module=MODULE` | 只產生指定模組的文件 |
| `--help` | 顯示說明 |

### 範例
```bash
# 產生完整 JSON 文件
php generate-api-docs.php > ../docs/openapi.json

# 產生 YAML 格式
php generate-api-docs.php --format=yaml > ../docs/openapi.yaml

# 只產生特定模組
php generate-api-docs.php --module=departments
```

---

## 3. 單元測試框架

### 位置
`/tests/` 目錄

### 結構
```
tests/
├── bootstrap.php          # 測試啟動檔
├── Api/
│   ├── ApiTestCase.php    # API 測試基礎類別
│   ├── DepartmentsApiTest.php
│   └── CompaniesApiTest.php
└── Unit/
    └── HelpersTest.php    # 單元測試
```

### 執行測試
```bash
# 安裝 PHPUnit (如尚未安裝)
composer require --dev phpunit/phpunit

# 執行所有測試
./vendor/bin/phpunit

# 執行特定測試套件
./vendor/bin/phpunit --testsuite "Api Tests"
./vendor/bin/phpunit --testsuite "Unit Tests"
```

### 設定
測試設定檔位於 `/phpunit.xml`，測試前需修改 `tests/bootstrap.php` 中的連線設定。

---

## 4. 公開 API 安全規範

所有公開 API (`public_*.php`) 必須包含：

```php
<?php
require_once '../bootstrap.php';

// 1. HTTP 方法限制
requireMethod('GET');

// 2. 安全標頭
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
```

### 已實施的公開 API
- `/api/companies/public_info.php`
- `/api/companies/public_logo.php`
- `/api/customers/public_info.php`
- `/api/orders/public_info.php`
- `/api/order_items/public_info.php`

---

## 版本記錄

| 日期 | 版本 | 說明 |
|------|------|------|
| 2026-02-01 | 1.0.0 | 初始版本：程式碼產生器、文件產生器、測試框架 |
