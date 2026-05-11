#!/usr/bin/env php
<?php
/**
 * API 程式碼產生器
 *
 * 自動生成符合 MES 系統規範的 CRUD API 檔案
 *
 * 使用方式:
 *   php generate-api.php <module_name> <table_name> [options]
 *
 * 範例:
 *   php generate-api.php products products
 *   php generate-api.php user_profiles user_profiles --soft-delete
 *
 * 選項:
 *   --soft-delete    使用軟刪除 (deleted_at)
 *   --no-helpers     不生成 helpers.php
 *   --force          強制覆蓋現有檔案
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

// 確保從命令列執行
if (php_sapi_name() !== 'cli') {
    die("此腳本僅能從命令列執行\n");
}

class ApiGenerator
{
    private string $moduleName;
    private string $tableName;
    private string $moduleDir;
    private bool $softDelete = false;
    private bool $generateHelpers = true;
    private bool $force = false;

    private array $columns = [];
    private string $primaryKey = 'id';

    public function __construct(array $args)
    {
        $this->parseArguments($args);
    }

    private function parseArguments(array $args): void
    {
        // 移除腳本名稱
        array_shift($args);

        if (count($args) < 2) {
            $this->showUsage();
            exit(1);
        }

        $this->moduleName = $args[0];
        $this->tableName = $args[1];
        $this->moduleDir = __DIR__ . '/../' . $this->moduleName;

        // 解析選項
        foreach ($args as $arg) {
            switch ($arg) {
                case '--soft-delete':
                    $this->softDelete = true;
                    break;
                case '--no-helpers':
                    $this->generateHelpers = false;
                    break;
                case '--force':
                    $this->force = true;
                    break;
            }
        }
    }

    private function showUsage(): void
    {
        echo <<<USAGE
API 程式碼產生器

使用方式:
  php generate-api.php <module_name> <table_name> [options]

範例:
  php generate-api.php products products
  php generate-api.php user_profiles user_profiles --soft-delete

選項:
  --soft-delete    使用軟刪除 (deleted_at)
  --no-helpers     不生成 helpers.php
  --force          強制覆蓋現有檔案

USAGE;
    }

    public function generate(): void
    {
        echo "========================================\n";
        echo "API 程式碼產生器\n";
        echo "========================================\n";
        echo "模組名稱: {$this->moduleName}\n";
        echo "資料表: {$this->tableName}\n";
        echo "軟刪除: " . ($this->softDelete ? '是' : '否') . "\n";
        echo "========================================\n\n";

        // 建立目錄
        if (!is_dir($this->moduleDir)) {
            mkdir($this->moduleDir, 0755, true);
            echo "✅ 建立目錄: {$this->moduleDir}\n";
        }

        // 嘗試從資料庫取得表格結構
        $this->fetchTableStructure();

        // 生成檔案
        if ($this->generateHelpers) {
            $this->generateHelpersFile();
        }
        $this->generateIndexFile();
        $this->generateShowFile();
        $this->generateUpdateFile();
        $this->generateDeleteFile();

        echo "\n========================================\n";
        echo "✅ API 生成完成！\n";
        echo "========================================\n";
        echo "生成的檔案:\n";
        echo "  - {$this->moduleName}/helpers.php\n";
        echo "  - {$this->moduleName}/index.php (GET 列表, POST 新增)\n";
        echo "  - {$this->moduleName}/show.php (GET 單筆)\n";
        echo "  - {$this->moduleName}/update.php (PUT/PATCH 更新)\n";
        echo "  - {$this->moduleName}/delete.php (DELETE 刪除)\n";
        echo "\n請記得:\n";
        echo "  1. 檢查並調整 helpers.php 中的驗證規則\n";
        echo "  2. 在 bootstrap.php 確認資料庫連線\n";
        echo "  3. 測試所有 API 端點\n";
    }

    private function fetchTableStructure(): void
    {
        try {
            require_once __DIR__ . '/../bootstrap.php';
            $pdo = db();

            $stmt = $pdo->query("DESCRIBE {$this->tableName}");
            $this->columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($this->columns as $col) {
                if ($col['Key'] === 'PRI') {
                    $this->primaryKey = $col['Field'];
                    break;
                }
            }

            echo "✅ 成功讀取資料表結構 ({$this->tableName})\n";
            echo "   欄位數: " . count($this->columns) . "\n";
            echo "   主鍵: {$this->primaryKey}\n\n";
        } catch (Exception $e) {
            echo "⚠️ 無法讀取資料表結構: {$e->getMessage()}\n";
            echo "   將使用預設結構生成程式碼\n\n";

            // 預設結構
            $this->columns = [
                ['Field' => 'id', 'Type' => 'int', 'Null' => 'NO', 'Key' => 'PRI'],
                ['Field' => 'name', 'Type' => 'varchar(255)', 'Null' => 'NO', 'Key' => ''],
                ['Field' => 'description', 'Type' => 'text', 'Null' => 'YES', 'Key' => ''],
                ['Field' => 'created_at', 'Type' => 'datetime', 'Null' => 'YES', 'Key' => ''],
                ['Field' => 'updated_at', 'Type' => 'datetime', 'Null' => 'YES', 'Key' => ''],
            ];

            if ($this->softDelete) {
                $this->columns[] = ['Field' => 'deleted_at', 'Type' => 'datetime', 'Null' => 'YES', 'Key' => ''];
            }
        }
    }

    private function writeFile(string $filename, string $content): void
    {
        $filepath = $this->moduleDir . '/' . $filename;

        if (file_exists($filepath) && !$this->force) {
            echo "⚠️ 跳過 {$filename} (已存在，使用 --force 覆蓋)\n";
            return;
        }

        file_put_contents($filepath, $content);
        echo "✅ 生成 {$filename}\n";
    }

    private function toCamelCase(string $str): string
    {
        return lcfirst(str_replace(' ', '', ucwords(str_replace('_', ' ', $str))));
    }

    private function toPascalCase(string $str): string
    {
        return str_replace(' ', '', ucwords(str_replace('_', ' ', $str)));
    }

    private function toKebabCase(string $str): string
    {
        return str_replace('_', '-', $str);
    }

    private function getSingular(string $str): string
    {
        // 簡單的複數轉單數
        if (substr($str, -3) === 'ies') {
            return substr($str, 0, -3) . 'y';
        }
        if (substr($str, -1) === 's' && substr($str, -2) !== 'ss') {
            return substr($str, 0, -1);
        }
        return $str;
    }

    private function getEditableColumns(): array
    {
        $skip = ['id', 'created_at', 'updated_at', 'deleted_at'];
        return array_filter($this->columns, fn($c) => !in_array($c['Field'], $skip));
    }

    private function generateHelpersFile(): void
    {
        $pascalName = $this->toPascalCase($this->getSingular($this->moduleName));
        $camelName = $this->toCamelCase($this->getSingular($this->moduleName));
        $editableColumns = $this->getEditableColumns();

        $readPayloadFields = '';
        $validateFields = '';
        $findSelectFields = '';
        $transformFields = '';

        foreach ($editableColumns as $col) {
            $field = $col['Field'];
            $isNullable = $col['Null'] === 'YES';
            $type = $col['Type'];

            // 判斷 PHP 類型
            $phpType = 'string';
            $defaultValue = "''";
            if (preg_match('/^(int|bigint|smallint|tinyint)/i', $type)) {
                $phpType = 'int';
                $defaultValue = '0';
            } elseif (preg_match('/^(decimal|float|double)/i', $type)) {
                $phpType = 'float';
                $defaultValue = '0.0';
            }

            $readPayloadFields .= "        '{$field}' => \$data['{$field}'] ?? {$defaultValue},\n";

            if (!$isNullable) {
                if ($phpType === 'string') {
                    $validateFields .= "    if (empty(\$data['{$field}'])) {\n";
                    $validateFields .= "        \$errors[] = '{$field} 為必填';\n";
                    $validateFields .= "    }\n";
                } else {
                    $validateFields .= "    if (!isset(\$data['{$field}']) || \$data['{$field}'] === '') {\n";
                    $validateFields .= "        \$errors[] = '{$field} 為必填';\n";
                    $validateFields .= "    }\n";
                }
            }

            $findSelectFields .= "       {$field},\n";

            // Transform
            if ($phpType === 'int') {
                $transformFields .= "        '{$field}' => (int)\$row['{$field}'],\n";
            } elseif ($phpType === 'float') {
                $transformFields .= "        '{$field}' => \$row['{$field}'] !== null ? (float)\$row['{$field}'] : null,\n";
            } else {
                $transformFields .= "        '{$field}' => \$row['{$field}'],\n";
            }
        }

        $deleteCondition = $this->softDelete ? " AND deleted_at IS NULL" : "";

        $content = <<<PHP
<?php
/**
 * {$this->moduleName} 模組輔助函數
 *
 * @file   api/{$this->moduleName}/helpers.php
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

/**
 * 讀取請求資料
 */
function read{$pascalName}Payload(): array
{
    \$input = file_get_contents('php://input');
    \$data = json_decode(\$input, true) ?? [];

    return [
{$readPayloadFields}    ];
}

/**
 * 驗證資料
 */
function validate{$pascalName}Data(array \$data): array
{
    \$errors = [];

{$validateFields}
    return \$errors;
}

/**
 * 查詢單筆資料
 */
function find{$pascalName}(PDO \$pdo, int \$id): ?array
{
    \$sql = "
        SELECT
            {$this->primaryKey},
{$findSelectFields}            created_at,
            updated_at
        FROM {$this->tableName}
        WHERE {$this->primaryKey} = ?{$deleteCondition}
    ";
    \$stmt = \$pdo->prepare(\$sql);
    \$stmt->execute([\$id]);

    \$row = \$stmt->fetch(PDO::FETCH_ASSOC);
    return \$row ?: null;
}

/**
 * 檢查資料是否存在
 */
function {$camelName}Exists(PDO \$pdo, int \$id): bool
{
    \$stmt = \$pdo->prepare("SELECT 1 FROM {$this->tableName} WHERE {$this->primaryKey} = ?{$deleteCondition}");
    \$stmt->execute([\$id]);
    return (bool)\$stmt->fetchColumn();
}

/**
 * 轉換資料格式
 */
function transform{$pascalName}(array \$row): array
{
    return [
        '{$this->primaryKey}' => (int)\$row['{$this->primaryKey}'],
{$transformFields}        'created_at' => \$row['created_at'],
        'updated_at' => \$row['updated_at'],
    ];
}

PHP;

        $this->writeFile('helpers.php', $content);
    }

    private function generateIndexFile(): void
    {
        $pascalName = $this->toPascalCase($this->getSingular($this->moduleName));
        $editableColumns = $this->getEditableColumns();
        $deleteCondition = $this->softDelete ? " WHERE deleted_at IS NULL" : "";

        // 生成 INSERT 欄位
        $insertFields = [];
        $insertPlaceholders = [];
        $insertBindings = '';

        foreach ($editableColumns as $col) {
            $field = $col['Field'];
            $insertFields[] = $field;
            $insertPlaceholders[] = ":{$field}";
            $insertBindings .= "            ':{$field}' => \$data['{$field}'],\n";
        }

        $insertFieldsStr = implode(', ', $insertFields);
        $insertPlaceholdersStr = implode(', ', $insertPlaceholders);

        $content = <<<PHP
<?php
/**
 * {$this->moduleName} API — 列表 & 新增
 *
 * GET  /api/{$this->moduleName}/          取得列表（含分頁）
 * POST /api/{$this->moduleName}/          新增資料
 *
 * @file   api/{$this->moduleName}/index.php
 */
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');
requireAuth();

\$method = requireMethod(['GET', 'POST']);

switch (\$method) {
    case 'GET':
        handleList{$pascalName}s();
        break;
    case 'POST':
        handleCreate{$pascalName}();
        break;
    default:
        jsonResponse(['success' => false, 'message' => '不支援的請求方法'], 405);
}

/**
 * GET — 取得列表
 */
function handleList{$pascalName}s(): void
{
    \$pdo = db();

    \$page    = max(1, (int)(\$_GET['page'] ?? 1));
    \$perPage = max(1, min(100, (int)(\$_GET['perPage'] ?? 20)));
    \$offset  = (\$page - 1) * \$perPage;

    \$where  = [];
    \$params = [];

    // TODO: 依需求加入篩選條件
    // if (!empty(\$_GET['keyword'])) {
    //     \$where[]  = 'name LIKE :keyword';
    //     \$params[':keyword'] = '%' . \$_GET['keyword'] . '%';
    // }

    \$whereSql = \$where ? 'WHERE ' . implode(' AND ', \$where) : '{$deleteCondition}';

    // 總筆數
    \$countSql = "SELECT COUNT(*) FROM {$this->tableName} \$whereSql";
    \$stmt = \$pdo->prepare(\$countSql);
    \$stmt->execute(\$params);
    \$total = (int)\$stmt->fetchColumn();

    // 取得資料
    \$sql = "SELECT * FROM {$this->tableName} \$whereSql ORDER BY {$this->primaryKey} DESC LIMIT :limit OFFSET :offset";
    \$stmt = \$pdo->prepare(\$sql);
    foreach (\$params as \$k => \$v) {
        \$stmt->bindValue(\$k, \$v);
    }
    \$stmt->bindValue(':limit', \$perPage, PDO::PARAM_INT);
    \$stmt->bindValue(':offset', \$offset, PDO::PARAM_INT);
    \$stmt->execute();
    \$rows = \$stmt->fetchAll(PDO::FETCH_ASSOC);

    \$data = array_map('transform{$pascalName}', \$rows);

    jsonResponse([
        'success'    => true,
        'data'       => \$data,
        'pagination' => [
            'page'       => \$page,
            'perPage'    => \$perPage,
            'total'      => \$total,
            'totalPages' => (int)ceil(\$total / \$perPage),
        ],
    ]);
}

/**
 * POST — 新增資料
 */
function handleCreate{$pascalName}(): void
{
    \$pdo = db();
    \$data = read{$pascalName}Payload();

    \$errors = validate{$pascalName}Data(\$data);
    if (\$errors) {
        jsonResponse(['success' => false, 'message' => implode('、', \$errors)], 400);
    }

    try {
        \$sql = "INSERT INTO {$this->tableName} ({$insertFieldsStr}, created_at, updated_at)
                VALUES ({$insertPlaceholdersStr}, NOW(), NOW())";
        \$stmt = \$pdo->prepare(\$sql);
        \$stmt->execute([
{$insertBindings}        ]);

        \$newId = (int)\$pdo->lastInsertId();
        \$record = find{$pascalName}(\$pdo, \$newId);

        jsonResponse([
            'success' => true,
            'message' => '新增成功',
            'data'    => \$record ? transform{$pascalName}(\$record) : null,
        ], 201);
    } catch (PDOException \$e) {
        jsonResponse(['success' => false, 'message' => '新增失敗：' . \$e->getMessage()], 500);
    }
}

PHP;

        $this->writeFile('index.php', $content);
    }

    private function generateShowFile(): void
    {
        $pascalName = $this->toPascalCase($this->getSingular($this->moduleName));

        $content = <<<PHP
<?php
/**
 * {$this->moduleName} API — 單筆查詢
 *
 * GET /api/{$this->moduleName}/show.php?id={id}
 *
 * @file   api/{$this->moduleName}/show.php
 */
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');
requireAuth();
requireMethod('GET');

\$id = isset(\$_GET['id']) ? (int)\$_GET['id'] : 0;
if (\$id <= 0) {
    jsonResponse(['success' => false, 'message' => '缺少必要參數 id'], 400);
}

\$pdo = db();

\$record = find{$pascalName}(\$pdo, \$id);
if (!\$record) {
    jsonResponse(['success' => false, 'message' => '找不到指定的資料'], 404);
}

jsonResponse([
    'success' => true,
    'data' => transform{$pascalName}(\$record),
]);

PHP;

        $this->writeFile('show.php', $content);
    }

    private function generateUpdateFile(): void
    {
        $pascalName = $this->toPascalCase($this->getSingular($this->moduleName));
        $camelName = $this->toCamelCase($this->getSingular($this->moduleName));
        $editableColumns = $this->getEditableColumns();

        // 生成 UPDATE SET
        $updateSets = [];
        $updateBindings = '';

        foreach ($editableColumns as $col) {
            $field = $col['Field'];
            $updateSets[] = "{$field} = :{$field}";
            $updateBindings .= "            ':{$field}' => \$data['{$field}'],\n";
        }

        $updateSetsStr = implode(",\n            ", $updateSets);

        $content = <<<PHP
<?php
/**
 * {$this->moduleName} API — 更新
 *
 * PUT/PATCH /api/{$this->moduleName}/update.php?id={id}
 *
 * @file   api/{$this->moduleName}/update.php
 */
declare(strict_types=1);

require_once __DIR__ . '/helpers.php';

header('Content-Type: application/json; charset=utf-8');
requireAuth();
requireMethod(['PUT', 'PATCH']);

\$id = isset(\$_GET['id']) ? (int)\$_GET['id'] : 0;
if (\$id <= 0) {
    jsonResponse(['success' => false, 'message' => '缺少必要參數 id'], 400);
}

\$pdo = db();

// 檢查資料是否存在
if (!{$camelName}Exists(\$pdo, \$id)) {
    jsonResponse(['success' => false, 'message' => '找不到指定的資料'], 404);
}

\$data = read{$pascalName}Payload();

\$errors = validate{$pascalName}Data(\$data);
if (\$errors) {
    jsonResponse(['success' => false, 'message' => implode('、', \$errors)], 400);
}

try {
    \$sql = "UPDATE {$this->tableName} SET
            {$updateSetsStr},
            updated_at = NOW()
        WHERE {$this->primaryKey} = :id";
    \$stmt = \$pdo->prepare(\$sql);
    \$stmt->execute([
        ':id' => \$id,
{$updateBindings}    ]);

    \$record = find{$pascalName}(\$pdo, \$id);

    jsonResponse([
        'success' => true,
        'message' => '更新成功',
        'data'    => \$record ? transform{$pascalName}(\$record) : null,
    ]);
} catch (PDOException \$e) {
    jsonResponse(['success' => false, 'message' => '更新失敗：' . \$e->getMessage()], 500);
}

PHP;

        $this->writeFile('update.php', $content);
    }

    private function generateDeleteFile(): void
    {
        $camelName = $this->toCamelCase($this->getSingular($this->moduleName));

        if ($this->softDelete) {
            $deleteSQL = "UPDATE {$this->tableName} SET deleted_at = NOW() WHERE {$this->primaryKey} = :id";
        } else {
            $deleteSQL = "DELETE FROM {$this->tableName} WHERE {$this->primaryKey} = :id";
        }

        $content = <<<PHP
<?php
/**
 * {$this->moduleName} API — 刪除
 *
 * DELETE /api/{$this->moduleName}/delete.php?id={id}
 *
 * @file   api/{$this->moduleName}/delete.php
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();
requireMethod('DELETE');

\$id = isset(\$_GET['id']) ? (int)\$_GET['id'] : 0;
if (\$id <= 0) {
    jsonResponse(['success' => false, 'message' => '缺少必要參數 id'], 400);
}

\$pdo = db();

// 檢查資料是否存在
if (!{$camelName}Exists(\$pdo, \$id)) {
    jsonResponse(['success' => false, 'message' => '找不到指定的資料'], 404);
}

// TODO: 檢查是否有關聯資料
// \$stmt = \$pdo->prepare("SELECT COUNT(*) FROM related_table WHERE {$this->moduleName}_id = ?");
// \$stmt->execute([\$id]);
// if (\$stmt->fetchColumn() > 0) {
//     jsonResponse(['success' => false, 'message' => '此資料有關聯資料，無法刪除'], 400);
// }

try {
    \$stmt = \$pdo->prepare("{$deleteSQL}");
    \$stmt->execute([':id' => \$id]);

    jsonResponse([
        'success' => true,
        'message' => '刪除成功',
        'data'    => ['id' => \$id],
    ]);
} catch (PDOException \$e) {
    jsonResponse(['success' => false, 'message' => '刪除失敗：' . \$e->getMessage()], 500);
}

PHP;

        $this->writeFile('delete.php', $content);
    }
}

// 執行
$generator = new ApiGenerator($argv);
$generator->generate();
