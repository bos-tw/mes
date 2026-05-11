---
applyTo: "api/**/*.php"
---

# API 程式碼風格檢查指南

> 完整規範：`.github/skills/api-code-style-check.md`

## 必要宣告

每個 PHP 檔案必須有 `declare(strict_types=1);`。

## 輸出方式

**禁止** `echo json_encode()`，**必須**使用 `jsonResponse()` 函式。

## 訊息語言一致性

- 所有 API 回應的 `message` 欄位必須使用**繁體中文**
- 結尾必須加句號 `。`
- 常見須修正的英文訊息：`Invalid ID`、`Record not found`、`No changes made`、`Method not allowed`、`Unauthorized`

## Response 格式

```php
// 成功
jsonResponse(['success' => true, 'message' => '資料取得成功。', 'data' => $data]);

// 失敗
jsonResponse(['success' => false, 'message' => '找不到指定資料。'], 404);
```

## 檢查流程（修改 API 後必做）

1. `php -l api/xxx/yyy.php` — 語法驗證
2. 確認無英文 message
3. 確認所有中文訊息結尾有 `。`
4. 確認無 `echo json_encode()` 使用
5. 確認無裸 `declare(strict_types=1)` 遺漏
