---
applyTo: "api/**/*.php"
---

# API 註解標準規範 (Doc-as-Code)

> 完整規範：`.github/skills/api-doc-standard.md`

## PHPDoc 標準格式

### 檔案層級

```php
<?php
/**
 * 客戶管理 - 列表端點
 *
 * @package MES\Api\Customers
 * @version 1.0.0
 * @since   2025-01-01
 */
declare(strict_types=1);
```

### 函式層級

```php
/**
 * 取得分頁客戶列表
 *
 * @param  int    $page    頁碼（從 1 開始）
 * @param  int    $limit   每頁筆數（預設 20）
 * @param  string $search  搜尋關鍵字（選填）
 * @return array{
 *     data: array<int, array{id: int, name: string}>,
 *     total: int,
 *     page: int,
 *     totalPages: int
 * }
 */
```

### 參數型別標註

| PHP 型別 | PHPDoc 寫法 |
|----------|-------------|
| `int` | `@param int $id` |
| `string\|null` | `@param string\|null $name` |
| 關聯陣列 | `@param array{key: type} $data` |
| 陣列 | `@param array<int, string> $items` |

## 必加的 @throws 標註

```php
/**
 * @throws PDOException 資料庫連線失敗時拋出
 * @throws InvalidArgumentException 傳入無效參數時拋出
 */
```

## 複雜 SQL 必加說明

```php
// 連接客戶主表和訂單計數（需要 LEFT JOIN 避免遺漏無訂單的客戶）
$sql = "SELECT c.*, COUNT(o.id) as order_count
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
        GROUP BY c.id";
```

## 禁止事項

- ❌ 寫無意義的 `// 取得資料` 類型的行內注解
- ❌ 函式超過 50 行而無任何 PHPDoc
- ❌ 複雜邏輯（分頁、JOIN、狀態機）沒有說明
