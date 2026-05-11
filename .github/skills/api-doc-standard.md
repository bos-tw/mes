# API 註解標準規範 (Doc-as-Code)

本文件定義 MES 系統 API 的 PHPDoc 註解標準，實現「註解即規格」目標。

---

## 目錄

1. [註解原則](#1-註解原則)
2. [檔案類型與範本](#2-檔案類型與範本)
3. [完整範例：customers 模組](#3-完整範例customers-模組)
4. [註解檢查清單](#4-註解檢查清單)
5. [常用標記速查](#5-常用標記速查)

---

## 1. 註解原則

### 1.1 語言規範

| 項目 | 語言 | 範例 |
|------|------|------|
| 檔案說明 | 中文 | `客戶管理 API - 列表與新增` |
| 功能描述 | 中文 | `取得客戶列表，支援分頁、排序、關鍵字搜尋` |
| 參數名稱 | 英文 | `@param int $page` |
| 參數說明 | 中文 | `頁碼，從 1 開始` |
| 型別標記 | 英文 | `array<string,mixed>` |
| 回傳說明 | 中文 | `客戶資料陣列` |

### 1.2 必要註解區塊

每個 API 檔案必須包含：

```
┌─────────────────────────────────────────┐
│  1. 檔案標頭註解 (File Header)           │
│     - 模組名稱、功能說明                  │
│     - API 路徑、HTTP 方法                │
│     - 認證需求                           │
├─────────────────────────────────────────┤
│  2. 輸入參數區塊 (Input Parameters)      │
│     - Query 參數 (GET)                   │
│     - Body 參數 (POST/PUT)               │
│     - 驗證規則                           │
├─────────────────────────────────────────┤
│  3. 輸出格式區塊 (Output Format)         │
│     - 成功回應結構                        │
│     - 錯誤回應結構                        │
│     - HTTP 狀態碼                        │
├─────────────────────────────────────────┤
│  4. 函式註解 (Function DocBlock)         │
│     - 功能說明                           │
│     - @param 參數                        │
│     - @return 回傳值                     │
│     - @throws 例外狀況                   │
└─────────────────────────────────────────┘
```

---

## 2. 檔案類型與範本

### 2.1 index.php - 列表與新增

```php
<?php
/**
 * [模組名稱] API - 列表與新增
 *
 * @endpoint GET  /api/[module]/index.php      取得列表
 * @endpoint POST /api/[module]/index.php      新增資料
 *
 * @auth 需要登入
 * @table [主要資料表名稱]
 *
 * ========================================
 * GET - 取得列表
 * ========================================
 *
 * @input Query Parameters:
 * | 參數名稱      | 類型   | 必填 | 預設值 | 說明                          |
 * |--------------|--------|------|--------|-------------------------------|
 * | page         | int    | 否   | 1      | 頁碼，從 1 開始                |
 * | perPage      | int    | 否   | 10     | 每頁筆數，最大 100             |
 * | keyword      | string | 否   | ''     | 關鍵字搜尋（模糊比對 XX、YY）   |
 * | sortField    | string | 否   | 'id'   | 排序欄位                       |
 * | sortDirection| string | 否   | 'desc' | 排序方向：asc / desc           |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "data": [
 *         {
 *             "id": 1,
 *             "name": "範例",
 *             ...
 *         }
 *     ],
 *     "pagination": {
 *         "page": 1,
 *         "perPage": 10,
 *         "total": 100,
 *         "totalPages": 10
 *     }
 * }
 *
 * ========================================
 * POST - 新增資料
 * ========================================
 *
 * @input Body Parameters (JSON / FormData):
 * | 參數名稱      | 類型   | 必填 | 驗證規則                | 說明           |
 * |--------------|--------|------|------------------------|----------------|
 * | name         | string | 是   | 非空，最大 100 字元     | 名稱           |
 * | code         | string | 否   | 唯一值，最大 50 字元    | 編號           |
 *
 * @output 成功回應 (HTTP 201):
 * {
 *     "success": true,
 *     "message": "XXX已新增。",
 *     "data": { "id": 123 }
 * }
 *
 * @error 錯誤回應:
 * | HTTP 狀態碼 | 情境                  | message 範例              |
 * |------------|----------------------|--------------------------|
 * | 400        | 參數驗證失敗          | "資料驗證失敗。"           |
 * | 401        | 未登入               | "尚未登入或登入已過期。"    |
 * | 409        | 資料重複（唯一值衝突） | "XXX編號已存在。"          |
 * | 500        | 資料庫錯誤           | "新增XXX失敗。"            |
 */
declare(strict_types=1);
```

### 2.2 show.php - 單筆查詢

```php
<?php
/**
 * [模組名稱] API - 單筆查詢
 *
 * @endpoint GET /api/[module]/show.php?id={id}
 *
 * @auth 需要登入
 * @table [主要資料表名稱]
 *
 * @input Query Parameters:
 * | 參數名稱 | 類型 | 必填 | 說明          |
 * |---------|------|------|---------------|
 * | id      | int  | 是   | 資料 ID (> 0) |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "data": {
 *         "id": 1,
 *         "name": "範例",
 *         "created_at": "2024-01-01 12:00:00",
 *         "updated_at": "2024-01-02 15:30:00",
 *         ...關聯資料...
 *     }
 * }
 *
 * @error 錯誤回應:
 * | HTTP 狀態碼 | 情境        | message 範例              |
 * |------------|------------|--------------------------|
 * | 400        | 缺少 id    | "缺少必要參數: id。"       |
 * | 404        | 找不到資料  | "找不到指定的XXX。"        |
 */
declare(strict_types=1);
```

### 2.3 update.php - 更新資料

```php
<?php
/**
 * [模組名稱] API - 更新資料
 *
 * @endpoint PUT  /api/[module]/update.php      更新資料
 * @endpoint POST /api/[module]/update.php      更新資料 (FormData 相容，需帶 _method=PUT)
 *
 * @auth 需要登入
 * @table [主要資料表名稱]
 *
 * @input Body Parameters (JSON / FormData):
 * | 參數名稱      | 類型   | 必填 | 驗證規則                | 說明           |
 * |--------------|--------|------|------------------------|----------------|
 * | id           | int    | 是   | > 0，必須存在           | 資料 ID        |
 * | name         | string | 否   | 非空，最大 100 字元     | 名稱           |
 * | ...          | ...    | ...  | ...                    | ...            |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "message": "XXX已更新。"
 * }
 *
 * @error 錯誤回應:
 * | HTTP 狀態碼 | 情境              | message 範例              |
 * |------------|------------------|--------------------------|
 * | 400        | 參數驗證失敗      | "資料驗證失敗。"           |
 * | 400        | 無更新欄位        | "沒有需要更新的欄位。"      |
 * | 404        | 找不到資料        | "找不到指定的XXX。"        |
 * | 409        | 唯一值衝突        | "XXX編號已存在。"          |
 */
declare(strict_types=1);
```

### 2.4 delete.php - 刪除資料

```php
<?php
/**
 * [模組名稱] API - 刪除資料
 *
 * @endpoint DELETE /api/[module]/delete.php
 *
 * @auth 需要登入
 * @table [主要資料表名稱]
 *
 * @input Body Parameters (JSON):
 * | 參數名稱 | 類型 | 必填 | 說明          |
 * |---------|------|------|---------------|
 * | id      | int  | 是   | 資料 ID (> 0) |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "message": "XXX已刪除。"
 * }
 *
 * @logic 業務邏輯:
 * - 使用軟刪除 (設定 deleted_at 時間戳記)
 * - 刪除時會將編號加上 _deleted_{timestamp} 後綴，避免唯一值衝突
 * - 關聯資料處理：[說明是否會連帶刪除關聯資料]
 *
 * @error 錯誤回應:
 * | HTTP 狀態碼 | 情境              | message 範例              |
 * |------------|------------------|--------------------------|
 * | 400        | 缺少 id          | "缺少必要參數: id。"       |
 * | 404        | 找不到資料        | "找不到指定的XXX。"        |
 * | 409        | 有關聯資料無法刪除 | "此XXX有關聯的YYY，無法刪除。"|
 */
declare(strict_types=1);
```

### 2.5 helpers.php - 輔助函式

```php
<?php
/**
 * [模組名稱] - 輔助函式
 *
 * 本檔案包含 [模組名稱] 模組的共用函式：
 * - readXxxPayload()    讀取請求資料
 * - validateXxxData()   驗證與正規化資料
 * - 其他輔助函式...
 *
 * @see /api/[module]/index.php
 * @see /api/[module]/update.php
 */
declare(strict_types=1);

/**
 * 讀取請求資料
 *
 * 支援 JSON (Content-Type: application/json) 和 FormData 兩種格式。
 * 優先讀取 JSON，若無則讀取 $_POST + $_GET。
 *
 * @return array<string,mixed> 請求資料陣列
 *
 * @example
 * // JSON 請求
 * $data = readXxxPayload();
 * // $data = ['name' => '測試', 'code' => 'A001']
 */
function readXxxPayload(): array
{
    // ...
}

/**
 * 驗證並正規化輸入資料
 *
 * @param array<string,mixed> $payload 原始輸入資料
 * @param bool $isUpdate 是否為更新模式（更新時欄位非必填）
 *
 * @return array{
 *     data: array<string,mixed>,
 *     errors: array<string,string>
 * } 包含：
 *   - data: 已驗證並正規化的資料
 *   - errors: 欄位名稱 => 錯誤訊息（空陣列表示驗證通過）
 *
 * @example
 * $result = validateXxxData(['name' => '  測試  ']);
 * // $result = [
 * //     'data' => ['name' => '測試'],  // 已 trim
 * //     'errors' => []
 * // ]
 *
 * $result = validateXxxData(['name' => '']);
 * // $result = [
 * //     'data' => ['name' => ''],
 * //     'errors' => ['name' => '名稱為必填欄位']
 * // ]
 */
function validateXxxData(array $payload, bool $isUpdate = false): array
{
    // ...
}
```

---

## 3. 完整範例：customers 模組

### 3.1 customers/index.php

```php
<?php
/**
 * 客戶管理 API - 列表與新增
 *
 * @endpoint GET  /api/customers/index.php     取得客戶列表
 * @endpoint POST /api/customers/index.php     新增客戶
 *
 * @auth 需要登入
 * @table customers
 *
 * ========================================
 * GET - 取得客戶列表
 * ========================================
 *
 * 取得客戶列表，支援分頁、排序、關鍵字搜尋。
 * 僅回傳未刪除的客戶 (deleted_at IS NULL)。
 *
 * @input Query Parameters:
 * | 參數名稱      | 類型   | 必填 | 預設值           | 說明                              |
 * |--------------|--------|------|-----------------|-----------------------------------|
 * | page         | int    | 否   | 1               | 頁碼，從 1 開始                    |
 * | perPage      | int    | 否   | 10              | 每頁筆數，範圍 1-100               |
 * | keyword      | string | 否   | ''              | 關鍵字搜尋（比對：客戶編號、名稱、統編）|
 * | sortField    | string | 否   | 'customer_number'| 排序欄位                          |
 * | sortDirection| string | 否   | 'asc'           | 排序方向：asc / desc              |
 *
 * @input sortField 可用值:
 * - customer_number: 客戶編號
 * - name: 客戶名稱
 * - tax_id: 統一編號
 * - created_at: 建立時間
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "data": [
 *         {
 *             "id": 1,
 *             "customer_number": "C001",
 *             "name": "測試客戶",
 *             "tax_id": "12345678",
 *             "contact_person": "王小明",
 *             "phone": "02-12345678",
 *             "email": "test@example.com",
 *             "address": "台北市...",
 *             "notes": "備註內容",
 *             "created_at": "2024-01-01 12:00:00",
 *             "updated_at": "2024-01-02 15:30:00"
 *         }
 *     ],
 *     "pagination": {
 *         "page": 1,
 *         "perPage": 10,
 *         "total": 42,
 *         "totalPages": 5
 *     }
 * }
 *
 * ========================================
 * POST - 新增客戶
 * ========================================
 *
 * 新增一筆客戶資料。客戶編號必須唯一。
 *
 * @input Body Parameters (JSON / FormData):
 * | 參數名稱        | 類型   | 必填 | 驗證規則                     | 說明       |
 * |----------------|--------|------|------------------------------|-----------|
 * | customer_number| string | 是   | 非空，最大 50 字，唯一        | 客戶編號   |
 * | name           | string | 是   | 非空，最大 100 字            | 客戶名稱   |
 * | tax_id         | string | 否   | 最大 20 字                   | 統一編號   |
 * | contact_person | string | 否   | 最大 50 字                   | 聯絡人     |
 * | phone          | string | 否   | 最大 30 字                   | 電話       |
 * | email          | string | 否   | 有效 Email 格式，最大 100 字 | Email     |
 * | address        | string | 否   | 最大 200 字                  | 地址       |
 * | notes          | string | 否   | 最大 500 字                  | 備註       |
 *
 * @output 成功回應 (HTTP 201):
 * {
 *     "success": true,
 *     "message": "客戶資料已新增。",
 *     "data": { "id": 123 }
 * }
 *
 * @error 錯誤回應:
 * | HTTP 狀態碼 | 情境              | message                    | 備註                    |
 * |------------|------------------|----------------------------|------------------------|
 * | 400        | 缺少必填欄位      | "資料驗證失敗。"            | errors 物件含欄位錯誤訊息 |
 * | 401        | 未登入           | "尚未登入或登入已過期。"     |                        |
 * | 409        | 客戶編號重複      | "客戶編號已存在。"          | field: 'customer_number'|
 * | 500        | 資料庫錯誤        | "新增客戶失敗。"            |                        |
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

// ... 程式碼 ...

/**
 * 處理 GET 請求 - 取得客戶列表
 *
 * @return void 直接輸出 JSON 回應
 */
function handleList(): void
{
    // ...
}

/**
 * 處理 POST 請求 - 新增客戶
 *
 * @return void 直接輸出 JSON 回應
 */
function handleCreate(): void
{
    // ...
}
```

### 3.2 customers/show.php

```php
<?php
/**
 * 客戶管理 API - 單筆查詢
 *
 * @endpoint GET /api/customers/show.php?id={id}
 *
 * @auth 需要登入
 * @table customers
 *
 * 查詢單一客戶的完整資料，包含關聯的訂單統計。
 *
 * @input Query Parameters:
 * | 參數名稱 | 類型 | 必填 | 說明                    |
 * |---------|------|------|-------------------------|
 * | id      | int  | 是   | 客戶 ID，必須 > 0 且存在 |
 *
 * @output 成功回應 (HTTP 200):
 * {
 *     "success": true,
 *     "data": {
 *         "id": 1,
 *         "customer_number": "C001",
 *         "name": "測試客戶",
 *         "tax_id": "12345678",
 *         "contact_person": "王小明",
 *         "phone": "02-12345678",
 *         "email": "test@example.com",
 *         "address": "台北市...",
 *         "notes": "備註內容",
 *         "created_at": "2024-01-01 12:00:00",
 *         "updated_at": "2024-01-02 15:30:00",
 *         "order_count": 5,           // 關聯訂單數量
 *         "total_amount": 150000.00   // 訂單總金額
 *     }
 * }
 *
 * @error 錯誤回應:
 * | HTTP 狀態碼 | 情境              | message                    |
 * |------------|------------------|----------------------------|
 * | 400        | id 參數無效       | "缺少必要參數: id。"        |
 * | 401        | 未登入           | "尚未登入或登入已過期。"     |
 * | 404        | 客戶不存在或已刪除 | "找不到指定的客戶。"        |
 */
declare(strict_types=1);
```

### 3.3 customers/helpers.php

```php
<?php
/**
 * 客戶管理 - 輔助函式
 *
 * 本檔案包含客戶管理模組的共用函式：
 * - readCustomerPayload()    讀取請求資料
 * - validateCustomerData()   驗證與正規化資料
 *
 * @see /api/customers/index.php
 * @see /api/customers/update.php
 */
declare(strict_types=1);

/**
 * 讀取客戶請求資料
 *
 * 支援 JSON (Content-Type: application/json) 和 FormData 兩種格式。
 * 優先讀取 JSON，若無則讀取 $_POST 合併 $_GET。
 *
 * @return array<string,mixed> 請求資料，可能包含以下欄位：
 *   - id: int|null              客戶 ID（更新/刪除時）
 *   - customer_number: string   客戶編號
 *   - name: string              客戶名稱
 *   - tax_id: string            統一編號
 *   - contact_person: string    聯絡人
 *   - phone: string             電話
 *   - email: string             Email
 *   - address: string           地址
 *   - notes: string             備註
 */
function readCustomerPayload(): array
{
    // ...
}

/**
 * 驗證並正規化客戶輸入資料
 *
 * 驗證規則：
 * - customer_number: 必填（新增時），最大 50 字元，自動 trim
 * - name: 必填（新增時），最大 100 字元，自動 trim
 * - tax_id: 選填，最大 20 字元
 * - contact_person: 選填，最大 50 字元
 * - phone: 選填，最大 30 字元
 * - email: 選填，必須是有效 Email 格式，最大 100 字元
 * - address: 選填，最大 200 字元
 * - notes: 選填，最大 500 字元
 *
 * @param array<string,mixed> $payload 原始輸入資料
 * @param bool $isUpdate 是否為更新模式
 *   - true:  所有欄位皆為選填（僅驗證有提供的欄位）
 *   - false: customer_number, name 為必填
 *
 * @return array{
 *     data: array<string,mixed>,
 *     errors: array<string,string>
 * } 驗證結果：
 *   - data: 已 trim 並正規化的資料
 *   - errors: 欄位名稱 => 錯誤訊息（空陣列表示驗證通過）
 *
 * @example 新增模式驗證
 * $result = validateCustomerData([
 *     'customer_number' => 'C001',
 *     'name' => '測試客戶'
 * ]);
 * // 通過: $result['errors'] === []
 *
 * @example 更新模式驗證
 * $result = validateCustomerData(['name' => '新名稱'], true);
 * // 通過: customer_number 非必填
 *
 * @example 驗證失敗
 * $result = validateCustomerData(['customer_number' => '']);
 * // $result['errors'] = [
 * //     'customer_number' => '客戶編號為必填欄位',
 * //     'name' => '客戶名稱為必填欄位'
 * // ]
 */
function validateCustomerData(array $payload, bool $isUpdate = false): array
{
    // ...
}
```

---

## 4. 註解檢查清單

### 4.1 index.php 檢查項目

- [ ] 檔案標頭包含模組名稱
- [ ] 列出所有 @endpoint（GET/POST）
- [ ] 標示 @auth 需求
- [ ] 標示 @table 資料表名稱
- [ ] GET 區塊：
  - [ ] 列出所有 Query Parameters（含類型、必填、預設值）
  - [ ] 說明 sortField 可用值
  - [ ] 提供完整的成功回應 JSON 範例
  - [ ] 說明 pagination 結構
- [ ] POST 區塊：
  - [ ] 列出所有 Body Parameters（含驗證規則）
  - [ ] 提供成功回應 JSON 範例
- [ ] 列出所有可能的錯誤回應

### 4.2 show.php 檢查項目

- [ ] 檔案標頭包含 @endpoint
- [ ] 標示 @auth 需求
- [ ] 列出 Query Parameters (id)
- [ ] 提供完整的成功回應 JSON 範例（含關聯資料）
- [ ] 列出所有可能的錯誤回應

### 4.3 update.php 檢查項目

- [ ] 檔案標頭包含 @endpoint（PUT 和 POST+_method）
- [ ] 列出所有可更新的 Body Parameters
- [ ] 說明各欄位的驗證規則
- [ ] 列出所有可能的錯誤回應
- [ ] 若有特殊業務邏輯（如：重複檢查），需說明

### 4.4 delete.php 檢查項目

- [ ] 檔案標頭包含 @endpoint
- [ ] 說明刪除方式（軟刪除 / 硬刪除）
- [ ] 說明軟刪除的處理邏輯（如：編號加後綴）
- [ ] 說明關聯資料處理方式
- [ ] 列出所有可能的錯誤回應

### 4.5 helpers.php 檢查項目

- [ ] 檔案標頭列出所有函式名稱
- [ ] 每個函式都有 @param 說明（含類型和用途）
- [ ] 每個函式都有 @return 說明（含結構）
- [ ] 驗證函式需列出所有驗證規則
- [ ] 提供 @example 使用範例

---

## 5. 常用標記速查

### 5.1 自訂標記

| 標記 | 用途 | 範例 |
|------|------|------|
| `@endpoint` | API 路徑與方法 | `@endpoint GET /api/customers/index.php` |
| `@auth` | 認證需求 | `@auth 需要登入` |
| `@table` | 主要資料表 | `@table customers` |
| `@input` | 輸入參數區塊 | `@input Query Parameters:` |
| `@output` | 輸出格式 | `@output 成功回應 (HTTP 200):` |
| `@error` | 錯誤回應 | `@error 錯誤回應:` |
| `@logic` | 業務邏輯說明 | `@logic 使用軟刪除` |

### 5.2 標準 PHPDoc 標記

| 標記 | 用途 | 範例 |
|------|------|------|
| `@param` | 參數說明 | `@param int $id 客戶 ID` |
| `@return` | 回傳值 | `@return array<string,mixed>` |
| `@throws` | 例外 | `@throws PDOException 資料庫錯誤` |
| `@see` | 參考連結 | `@see /api/customers/helpers.php` |
| `@example` | 使用範例 | `@example $data = readPayload();` |

### 5.3 型別標記

| 型別 | 說明 | 範例 |
|------|------|------|
| `int` | 整數 | `@param int $page` |
| `string` | 字串 | `@param string $keyword` |
| `bool` | 布林值 | `@param bool $isUpdate` |
| `array` | 陣列 | `@param array $data` |
| `array<string,mixed>` | 關聯陣列 | Key 為字串的陣列 |
| `array<int,string>` | 索引陣列 | 字串陣列 |
| `array{key: type}` | 結構陣列 | `array{data: array, errors: array}` |
| `?string` | 可為 null | `@return ?string` |

---

## 6. 實作優先順序

建議依以下順序為 API 加入註解：

### Phase 1：核心模組（高使用頻率）
1. `customers/` - 客戶管理
2. `orders/` - 訂單管理
3. `order_items/` - 訂單明細
4. `work_orders/` - 工單管理

### Phase 2：庫存與生產
5. `inventory_items/` - 庫存品項
6. `inventory_transactions/` - 庫存異動
7. `production_records/` - 生產記錄
8. `production_quality_records/` - 品質檢驗

### Phase 3：出貨與篩選
9. `shipping_orders/` - 出貨單
10. `shipping_order_items/` - 出貨單明細
11. `screening_services/` - 篩選服務
12. `screening_items/` - 篩選項目

### Phase 4：基礎資料
13. `suppliers/` - 供應商
14. `employees/` - 員工
15. `departments/` - 部門
16. `machines/` - 機台
17. `tools/` - 工具
18. `companies/` - 公司
19. `lookup_values/` - 查詢值

### Phase 5：系統功能
20. `audit_logs/` - 稽核日誌
21. `dashboard/` - 儀表板
22. 其他特殊檔案

---

*文件版本: 1.0.0*
*建立日期: 2026-01-22*
*維護者: MES 開發團隊*
