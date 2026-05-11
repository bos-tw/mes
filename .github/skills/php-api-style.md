# PHP API 程式碼撰寫風格指南

此 Skill 定義 MES 系統 PHP API 的標準撰寫風格，開發新模組時必須遵循。

---

## 1. 檔案結構規範

每個模組的 API 目錄結構：

```
api/{module}/
├── index.php      # GET (列表) + POST (新增)
├── show.php       # GET (單筆查詢)
├── update.php     # PUT/PATCH (更新)
├── delete.php     # DELETE (刪除)
└── helpers.php    # 共用輔助函式
```

---

## 2. 必要宣告

每個 PHP 檔案開頭必須包含：

```php
<?php
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();  // 需要登入驗證的 API
```

---

## 3. PHPDoc 文件註解（Doc-as-Code 風格）

### 3.1 API 端點檔案

```php
<?php
/**
 * 模組名稱 API - 功能描述
 *
 * @endpoint GET  /api/{module}/          取得列表
 * @endpoint POST /api/{module}/          新增資料
 *
 * @auth 需要登入
 * @table {主表名稱}
 * @related {關聯表1}, {關聯表2}
 *
 * ========================================
 * GET - 取得列表
 * ========================================
 *
 * @input Query Parameters:
 * | 參數名稱       | 類型   | 必填 | 預設值 | 說明                    |
 * |---------------|--------|------|--------|------------------------|
 * | page          | int    | 否   | 1      | 頁碼，從 1 開始          |
 * | perPage       | int    | 否   | 10     | 每頁筆數，範圍 1-100     |
 * | keyword       | string | 否   | ''     | 關鍵字搜尋              |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "data": [...],
 *     "pagination": {
 *         "page": 1,
 *         "perPage": 10,
 *         "total": 42,
 *         "totalPages": 5
 *     }
 * }
 *
 * ========================================
 * POST - 新增資料
 * ========================================
 *
 * @input Body Parameters (JSON / FormData):
 * | 參數名稱   | 類型   | 必填 | 驗證規則     | 說明     |
 * |-----------|--------|------|-------------|---------|
 * | name      | string | 是   | 最大 255 字 | 名稱     |
 *
 * @output 成功回應 (HTTP 201):
 * {
 *     "success": true,
 *     "message": "資料建立成功。",
 *     "data": { ... }
 * }
 *
 * @error 錯誤回應:
 * | HTTP 狀態碼 | 情境              | message            |
 * |------------|------------------|-------------------|
 * | 401        | 未登入           | "尚未登入..."       |
 * | 405        | 不支援的 HTTP 方法 | "不支援的請求方法。" |
 * | 422        | 欄位驗證失敗      | "欄位驗證失敗。"    |
 */
```

### 3.2 Helper 函式

```php
/**
 * 驗證並正規化輸入資料
 *
 * @param array<string,mixed> $payload  請求資料
 * @param bool $isUpdate 是否為更新模式
 *
 * @return array{data: array<string,mixed>, errors: array<string,string>}
 */
function validateModuleData(array $payload, bool $isUpdate = false): array
```

---

## 4. 請求方法分派模式

```php
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

switch ($method) {
    case 'GET':
        handleList();
        break;
    case 'POST':
        handleCreate();
        break;
    default:
        jsonResponse([
            'success' => false,
            'message' => '不支援的請求方法。',
        ], 405);
}
```

---

## 5. Helper 函式命名規則

| 用途 | 命名模式 | 範例 |
|------|---------|------|
| 讀取請求 | `read{Module}Payload()` | `readOrderPayload()` |
| 驗證資料 | `validate{Module}Data()` | `validateOrderData()` |
| 查詢單筆 | `find{Module}()` | `findOrder()` |
| 檢查存在 | `{module}Exists()` | `orderExists()` |
| 檢查重複 | `{field}Exists()` | `orderNumberExists()` |
| 轉換輸出 | `transform{Module}()` | `transformOrder()` |
| 生成編號 | `generate{Module}Number()` | `generateOrderNumber()` |
| 刪除檢查 | `canDelete{Module}()` | `canDeleteOrder()` |
| 例外處理 | `handle{Module}PdoWriteException()` | `handleOrderPdoWriteException()` |

---

## 6. JSON 回應格式

### 6.1 成功回應

```php
// 列表查詢
jsonResponse([
    'success' => true,
    'data' => $items,
    'pagination' => [
        'page' => $page,
        'perPage' => $perPage,
        'total' => $total,
        'totalPages' => (int)ceil($total / $perPage),
    ],
]);

// 單筆查詢
jsonResponse([
    'success' => true,
    'data' => $item,
]);

// 新增成功
jsonResponse([
    'success' => true,
    'message' => '資料建立成功。',
    'data' => $item,
], 201);

// 更新成功
jsonResponse([
    'success' => true,
    'message' => '資料更新成功。',
    'data' => $item,
]);

// 刪除成功
jsonResponse([
    'success' => true,
    'message' => '資料刪除成功。',
]);
```

### 6.2 錯誤回應

```php
// 驗證失敗
jsonResponse([
    'success' => false,
    'message' => '欄位驗證失敗。',
    'errors' => $errors,
], 422);

// 找不到資料
jsonResponse([
    'success' => false,
    'message' => '找不到指定的資料。',
], 404);

// 關聯限制
jsonResponse([
    'success' => false,
    'message' => '無法刪除此資料，因為它已被其他資料引用。',
], 409);
```

---

## 7. 驗證函式標準格式

```php
function validateModuleData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // 必填欄位驗證（新增時必填）
    if (!$isUpdate || array_key_exists('name', $payload)) {
        $name = trim((string)($payload['name'] ?? ''));
        if (!$isUpdate && $name === '') {
            $errors['name'] = '名稱為必填。';
        } elseif ($name !== '') {
            $data['name'] = mb_substr($name, 0, 255);
        }
    }

    // 選填欄位驗證
    if (array_key_exists('email', $payload)) {
        $email = trim((string)($payload['email'] ?? ''));
        if ($email !== '') {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errors['email'] = '電子郵件格式不正確。';
            } else {
                $data['email'] = mb_substr($email, 0, 100);
            }
        } else {
            $data['email'] = null;
        }
    }

    return ['data' => $data, 'errors' => $errors];
}
```

---

## 8. 分頁查詢標準模式

```php
function handleList(): void
{
    $pdo = db();

    // 分頁參數
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['perPage'] ?? 10);
    if ($perPage <= 0) $perPage = 10;
    $perPage = min($perPage, 100);  // 上限 100

    // 搜尋條件
    $keyword = trim((string)($_GET['keyword'] ?? ''));

    $conditions = ['deleted_at IS NULL'];
    $params = [];

    if ($keyword !== '') {
        $conditions[] = '(name LIKE :keyword OR code LIKE :keyword)';
        $params['keyword'] = '%' . $keyword . '%';
    }

    $where = implode(' AND ', $conditions);

    // 計算總數
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM table_name WHERE $where");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // 查詢資料
    $offset = ($page - 1) * $perPage;
    $sql = "SELECT * FROM table_name WHERE $where ORDER BY id DESC LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'data' => array_map('transformModule', $rows ?: []),
        'pagination' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
            'totalPages' => (int)ceil($total / max($perPage, 1)),
        ],
    ]);
}
```

---

## 9. 軟刪除標準模式

```php
function handleDelete(): void
{
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) {
        jsonResponse(['success' => false, 'message' => '無效的 ID。'], 400);
    }

    $pdo = db();

    // 檢查是否存在
    if (!moduleExists($pdo, $id)) {
        jsonResponse(['success' => false, 'message' => '找不到指定的資料。'], 404);
    }

    // 檢查關聯
    if (!canDeleteModule($pdo, $id)) {
        jsonResponse(['success' => false, 'message' => '無法刪除此資料，因為它已被其他資料引用。'], 409);
    }

    // 軟刪除
    $stmt = $pdo->prepare('UPDATE table_name SET deleted_at = NOW() WHERE id = :id');
    $stmt->execute(['id' => $id]);

    logAudit('軟刪除資料', 'TableName', $id, null);

    jsonResponse(['success' => true, 'message' => '資料刪除成功。']);
}
```

---

## 10. 訊息規範

### 10.1 語言
- 所有使用者訊息必須使用**繁體中文**
- 結尾必須加上**句號** `。`

### 10.2 標準訊息範例

| 情境 | 訊息 |
|------|------|
| 新增成功 | `"訂單建立成功。"` |
| 更新成功 | `"資料更新成功。"` |
| 刪除成功 | `"資料刪除成功。"` |
| 找不到 | `"找不到指定的資料。"` |
| 驗證失敗 | `"欄位驗證失敗。"` |
| 必填欄位 | `"名稱為必填。"` |
| 格式錯誤 | `"電子郵件格式不正確。"` |
| 關聯限制 | `"無法刪除此資料，因為它已被其他資料引用。"` |
| 未登入 | `"尚未登入或登入已過期。"` |
| 方法錯誤 | `"不支援的請求方法。"` |

---

## 11. HTTP 狀態碼使用

| 狀態碼 | 使用情境 |
|--------|---------|
| 200 | 查詢成功、更新成功、刪除成功 |
| 201 | 新增成功 |
| 400 | 請求格式錯誤（如無效 ID） |
| 401 | 未登入 |
| 403 | 無權限 |
| 404 | 找不到資料 |
| 405 | 不支援的請求方法 |
| 409 | 資料重複或關聯限制 |
| 422 | 欄位驗證失敗 |
| 500 | 伺服器內部錯誤 |
