# API 程式碼風格檢查指南

此 Skill 提供 API 程式碼風格一致性檢查的標準流程與方法。

---

## 檢查清單

### 1. 必要宣告檢查

| 項目 | 標準 | 搜尋方式 |
|------|------|----------|
| `declare(strict_types=1);` | 所有 PHP 檔案必須有 | PowerShell 掃描 |

**PowerShell 檢查指令：**
```powershell
Get-ChildItem -Path "api" -Recurse -Filter "*.php" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -notmatch 'declare\(strict_types=1\)') {
        $_.FullName
    }
}
```

---

### 2. 輸出方式一致性

| 項目 | 標準 | 搜尋方式 |
|------|------|----------|
| JSON 輸出 | 使用 `jsonResponse()` 函式 | grep 搜尋 |

**搜尋不符合的檔案：**
```
grep_search: echo json_encode(['success'
includePattern: api/**/*.php
```

**例外情況：**
- `api/bootstrap.php` 中的 `jsonResponse()` 函式定義本身
- `api/diagnose.php` 診斷工具

---

### 3. 訊息語言一致性

| 項目 | 標準 | 搜尋方式 |
|------|------|----------|
| 錯誤訊息 | 全部使用中文 | 正則搜尋英文訊息 |

**搜尋英文訊息：**
```
grep_search: 'message'\s*=>\s*'[A-Za-z]
isRegexp: true
includePattern: api/**/*.php
```

**常見需檢查的英文訊息：**
- `Invalid ID`
- `Record not found`
- `No changes made`
- `Method not allowed`
- `Unauthorized`
- `Not found`

---

### 4. 中文訊息標點符號

| 項目 | 標準 | 搜尋方式 |
|------|------|----------|
| 中文訊息結尾 | 必須加上句號 `。` | 正則搜尋 |

**搜尋缺少句號的訊息：**
```
grep_search: '[一-龥]+[^。]'\s*\]
isRegexp: true
includePattern: api/**/*.php
```

**另一種搜尋方式（特定訊息）：**
```
grep_search: 不支援的請求方法[^。]
isRegexp: true
```

---

### 5. Response 格式一致性

| 項目 | 標準 |
|------|------|
| 成功回應 | `['success' => true, 'message' => '...', 'data' => ...]` |
| 錯誤回應 | `['success' => false, 'message' => '...']` |

**搜尋缺少 success 欄位的回應：**
```
grep_search: jsonResponse(\['message'
isRegexp: false
includePattern: api/**/*.php
```

---

## 完整檢查流程

### 階段一：全面掃描

1. **執行所有搜尋模式**
   - 依序執行上述 5 個類別的搜尋
   - 記錄所有不符合項目

2. **建立修改清單**
   - 按優先順序排列
   - 高：`declare(strict_types=1)` 缺失
   - 高：英文訊息
   - 中：`echo json_encode()` 使用
   - 中：中文訊息缺句號

### 階段二：執行修改

1. **分批修改**
   - 使用 `multi_replace_string_in_file` 批量修改
   - 每批控制在 10 個以內

2. **即時語法驗證**
   - 每批修改後執行 `php -l` 檢查

### 階段三：三次驗證

#### 第 1 次：語法驗證
```powershell
php -l "檔案路徑"
```

#### 第 2 次：修改內容驗證
- 重新執行階段一的所有搜尋
- 確認不符合項目數量為 0

#### 第 3 次：功能測試
```powershell
curl -s -X GET "http://localhost/mes/api/xxx.php" -H "Content-Type: application/json"
```
- 確認 API 回傳標準 JSON 格式
- 確認 HTTP 狀態碼正確

---

## 常見問題與解決方案

### Q1: 某些檔案不需要 strict_types？
**A:** 以下檔案可視為例外：
- `api/diagnose.php` - 診斷工具
- `api/config.php` - 設定檔（如果只有常數定義）

### Q2: 動態產生的訊息如何處理？
**A:** 如 `'message' => '更新失敗: ' . $e->getMessage()`，結尾不需加句號，因為例外訊息本身可能有標點。

### Q3: 搜尋結果太多怎麼辦？
**A:** 使用 `includePattern` 縮小範圍，例如：
```
includePattern: api/shipping_orders/*.php
```

---

## 自動化檢查腳本

未來可建立 PHP 腳本自動檢查：

```php
<?php
// api/tools/style_checker.php

$issues = [];
$apiDir = __DIR__ . '/..';

// 檢查 strict_types
foreach (glob("$apiDir/**/*.php") as $file) {
    $content = file_get_contents($file);
    if (strpos($content, 'declare(strict_types=1)') === false) {
        $issues[] = [
            'file' => $file,
            'type' => 'missing_strict_types'
        ];
    }
}

// 檢查英文訊息
// ...

echo json_encode(['issues' => $issues], JSON_PRETTY_PRINT);
```

---

## 更新紀錄

| 日期 | 版本 | 變更內容 |
|------|------|----------|
| 2026-01-22 | 1.0 | 初版建立 |
