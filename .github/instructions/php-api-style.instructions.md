---
applyTo: "api/**/*.php"
---

# PHP API 程式碼撰寫風格指南

> 完整規範：`.github/skills/php-api-style.md`

## 強制規則

### 檔案開頭（所有 PHP 檔案）

```php
<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';

requireAuth();
requireMethod(['GET']);          // 或 'POST', ['PUT','POST'], ['DELETE','POST']
requireCsrfForWrite();           // 非 GET 必加
```

### JSON 輸出

- **必須**使用 `jsonResponse()` 函式，**禁止** `echo json_encode()`
- 成功：`jsonResponse(['success' => true, 'message' => '...', 'data' => ...])`
- 失敗：`jsonResponse(['success' => false, 'message' => '...'], 400)`

### 訊息語言

- 所有 `message` **必須使用繁體中文**，結尾加句號 `。`
- ❌ `'message' => 'Not found'`
- ✅ `'message' => '找不到指定資料。'`

### 安全性

```php
// 整數驗證
$id = filter_var($_GET['id'] ?? 0, FILTER_VALIDATE_INT);
if (!$id || $id <= 0) {
    jsonResponse(['success' => false, 'message' => 'ID 格式不正確。'], 400);
}

// 字串截斷防注入（即使用 PDO 也要限制長度）
$name = mb_substr(trim($_POST['name'] ?? ''), 0, 100);
```

### 資料庫操作

- **必須**使用 PDO + Prepared Statement，禁止字串拼接 SQL
- 使用 `$pdo` 全域變數（由 `bootstrap.php` 初始化）
- 查詢前驗證資料，查詢後檢查 `rowCount()`

### 標準 CRUD 結構

| 操作 | 檔案 | HTTP 方法 |
|------|------|----------|
| 列表 | `index.php` | GET |
| 詳情 | `show.php` | GET |
| 新增 | `store.php` | POST |
| 更新 | `update.php` | PUT / POST |
| 刪除 | `delete.php` | DELETE / POST |
| 輔助 | `helpers.php` | — |

### PHPDoc 註解（公開函式必加）

```php
/**
 * 取得指定客戶資料
 *
 * @param int $id 客戶 ID
 * @return array 客戶資料陣列
 * @throws PDOException 資料庫連線失敗時
 */
```

### 禁止事項

- ❌ `die()` / `exit()` — 改用 `jsonResponse()` 後 `return`
- ❌ `$_REQUEST` — 明確使用 `$_GET` / `$_POST`
- ❌ 直接 `echo` HTML 或裸字串
- ❌ 硬編碼 DB 憑證
- ❌ `error_reporting(0)` 隱藏錯誤
