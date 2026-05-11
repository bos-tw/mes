<?php
/**
 * API 文件自動生成器
 * 從 API 程式碼自動產生 OpenAPI 3.0 規格文件
 *
 * 使用方式:
 *   php generate-api-docs.php > ../docs/openapi.json
 *   php generate-api-docs.php --format=yaml > ../docs/openapi.yaml
 *   php generate-api-docs.php --module=departments
 *
 * @file api/tools/generate-api-docs.php
 */
declare(strict_types=1);

// 設定
define('API_BASE_PATH', dirname(__DIR__));
define('DOC_VERSION', '1.0.0');

/**
 * API 文件生成器類別
 */
class ApiDocGenerator
{
    private array $openapi = [];
    private array $paths = [];
    private array $schemas = [];
    private ?string $targetModule = null;

    /**
     * 建構函數
     */
    public function __construct(?string $targetModule = null)
    {
        $this->targetModule = $targetModule;
        $this->initOpenApiStructure();
    }

    /**
     * 初始化 OpenAPI 基本結構
     */
    private function initOpenApiStructure(): void
    {
        $this->openapi = [
            'openapi' => '3.0.3',
            'info' => [
                'title' => 'MES 螺絲篩分管理系統 API',
                'description' => '螺絲篩選加工管理系統的 RESTful API 文件',
                'version' => DOC_VERSION,
                'contact' => [
                    'name' => 'MES 開發團隊',
                ],
            ],
            'servers' => [
                [
                    'url' => '/api',
                    'description' => '本地開發伺服器',
                ],
            ],
            'tags' => [],
            'paths' => [],
            'components' => [
                'securitySchemes' => [
                    'sessionAuth' => [
                        'type' => 'apiKey',
                        'in' => 'cookie',
                        'name' => 'PHPSESSID',
                        'description' => 'PHP Session 認證',
                    ],
                ],
                'schemas' => [
                    'Error' => [
                        'type' => 'object',
                        'properties' => [
                            'success' => ['type' => 'boolean', 'example' => false],
                            'error' => ['type' => 'string', 'example' => '錯誤訊息'],
                        ],
                    ],
                    'Pagination' => [
                        'type' => 'object',
                        'properties' => [
                            'page' => ['type' => 'integer', 'example' => 1],
                            'perPage' => ['type' => 'integer', 'example' => 15],
                            'total' => ['type' => 'integer', 'example' => 100],
                            'totalPages' => ['type' => 'integer', 'example' => 7],
                        ],
                    ],
                    'SuccessResponse' => [
                        'type' => 'object',
                        'properties' => [
                            'success' => ['type' => 'boolean', 'example' => true],
                            'data' => ['type' => 'object'],
                        ],
                    ],
                    'ListResponse' => [
                        'type' => 'object',
                        'properties' => [
                            'success' => ['type' => 'boolean', 'example' => true],
                            'data' => ['type' => 'array', 'items' => ['type' => 'object']],
                            'pagination' => ['$ref' => '#/components/schemas/Pagination'],
                        ],
                    ],
                ],
                'responses' => [
                    'Unauthorized' => [
                        'description' => '未認證',
                        'content' => [
                            'application/json' => [
                                'schema' => ['$ref' => '#/components/schemas/Error'],
                            ],
                        ],
                    ],
                    'NotFound' => [
                        'description' => '資源不存在',
                        'content' => [
                            'application/json' => [
                                'schema' => ['$ref' => '#/components/schemas/Error'],
                            ],
                        ],
                    ],
                    'ValidationError' => [
                        'description' => '驗證錯誤',
                        'content' => [
                            'application/json' => [
                                'schema' => ['$ref' => '#/components/schemas/Error'],
                            ],
                        ],
                    ],
                ],
            ],
            'security' => [
                ['sessionAuth' => []],
            ],
        ];
    }

    /**
     * 掃描所有 API 模組
     */
    public function scan(): void
    {
        $modules = glob(API_BASE_PATH . '/*', GLOB_ONLYDIR);

        foreach ($modules as $modulePath) {
            $moduleName = basename($modulePath);

            // 跳過非 API 目錄
            if (in_array($moduleName, ['tools', 'common', 'vendor'])) {
                continue;
            }

            // 如果指定了特定模組，只處理該模組
            if ($this->targetModule && $moduleName !== $this->targetModule) {
                continue;
            }

            $this->scanModule($moduleName, $modulePath);
        }

        // 排序路徑
        ksort($this->paths);
        $this->openapi['paths'] = $this->paths;
        $this->openapi['components']['schemas'] = array_merge(
            $this->openapi['components']['schemas'],
            $this->schemas
        );
    }

    /**
     * 掃描單一模組
     */
    private function scanModule(string $moduleName, string $modulePath): void
    {
        $files = glob($modulePath . '/*.php');
        $tag = $this->formatTagName($moduleName);

        // 新增標籤
        $this->openapi['tags'][] = [
            'name' => $tag,
            'description' => "{$tag} 相關操作",
        ];

        foreach ($files as $file) {
            $fileName = basename($file, '.php');
            $this->parseEndpoint($moduleName, $fileName, $file, $tag);
        }
    }

    /**
     * 解析端點檔案
     */
    private function parseEndpoint(string $module, string $fileName, string $filePath, string $tag): void
    {
        $content = file_get_contents($filePath);

        // 解析檔案中的 HTTP 方法
        $methods = $this->detectHttpMethods($content);
        $isPublic = str_starts_with($fileName, 'public_');

        // 根據檔案名稱決定路徑和操作
        $pathInfo = $this->getPathInfo($module, $fileName);

        // 跳過 helpers 檔案
        if ($pathInfo['path'] === null) {
            return;
        }

        foreach ($methods as $method) {
            $operation = $this->buildOperation($module, $fileName, $method, $tag, $content, $isPublic);

            if (!isset($this->paths[$pathInfo['path']])) {
                $this->paths[$pathInfo['path']] = [];
            }
            $this->paths[$pathInfo['path']][strtolower($method)] = $operation;
        }

        // 產生模組 Schema
        $this->generateSchema($module, $content);
    }

    /**
     * 偵測檔案使用的 HTTP 方法
     */
    private function detectHttpMethods(string $content): array
    {
        $methods = [];

        // 檢查 requireMethod 呼叫
        if (preg_match("/requireMethod\s*\(\s*['\"](\w+)['\"]/", $content, $matches)) {
            $methods[] = strtoupper($matches[1]);
        }
        // 檢查 requireMethod 陣列
        elseif (preg_match("/requireMethod\s*\(\s*\[([^\]]+)\]/", $content, $matches)) {
            preg_match_all("/['\"](\w+)['\"]/", $matches[1], $methodMatches);
            $methods = array_map('strtoupper', $methodMatches[1]);
        }
        // 檢查 $_SERVER['REQUEST_METHOD']
        elseif (preg_match_all("/REQUEST_METHOD['\"]?\s*\]\s*===?\s*['\"](\w+)['\"]/", $content, $matches)) {
            $methods = array_unique(array_map('strtoupper', $matches[1]));
        }
        // 預設根據檔案名稱猜測
        else {
            $methods = ['GET'];
        }

        return $methods;
    }

    /**
     * 取得路徑資訊
     */
    private function getPathInfo(string $module, string $fileName): array
    {
        $basePath = "/{$module}";

        switch ($fileName) {
            case 'index':
                return ['path' => $basePath, 'operation' => 'list'];
            case 'show':
                return ['path' => "{$basePath}/show", 'operation' => 'get'];
            case 'update':
                return ['path' => "{$basePath}/update", 'operation' => 'update'];
            case 'delete':
                return ['path' => "{$basePath}/delete", 'operation' => 'delete'];
            case 'helpers':
                return ['path' => null, 'operation' => null]; // 跳過
            default:
                return ['path' => "{$basePath}/{$fileName}", 'operation' => $fileName];
        }
    }

    /**
     * 建立操作定義
     */
    private function buildOperation(string $module, string $fileName, string $method, string $tag, string $content, bool $isPublic): array
    {
        $operationId = $this->buildOperationId($module, $fileName, $method);
        $summary = $this->extractSummary($content, $fileName, $module);

        $operation = [
            'tags' => [$tag],
            'summary' => $summary,
            'operationId' => $operationId,
            'responses' => $this->buildResponses($method, $module),
        ];

        // 公開 API 不需要認證
        if ($isPublic) {
            $operation['security'] = [];
            $operation['description'] = '此端點為公開 API，不需要認證';
        }

        // 根據方法添加參數
        if (in_array($method, ['GET', 'DELETE'])) {
            $operation['parameters'] = $this->extractParameters($content, $fileName);
        }

        if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
            $operation['requestBody'] = $this->buildRequestBody($module, $content);
        }

        return $operation;
    }

    /**
     * 建立操作 ID
     */
    private function buildOperationId(string $module, string $fileName, string $method): string
    {
        $action = match ($fileName) {
            'index' => 'list',
            'show' => 'get',
            'update' => 'update',
            'delete' => 'delete',
            default => $fileName,
        };

        return lcfirst($this->toCamelCase($module)) . ucfirst($action);
    }

    /**
     * 從程式碼中提取摘要
     */
    private function extractSummary(string $content, string $fileName, string $module): string
    {
        // 嘗試從檔案註解中提取
        if (preg_match('/\/\*\*\s*\n\s*\*\s*(.+?)(?:\n|\*\/)/s', $content, $matches)) {
            return trim($matches[1]);
        }

        // 預設摘要
        $moduleLabel = $this->formatTagName($module);
        return match ($fileName) {
            'index' => "取得{$moduleLabel}列表",
            'show' => "取得單一{$moduleLabel}",
            'update' => "更新{$moduleLabel}",
            'delete' => "刪除{$moduleLabel}",
            default => "{$moduleLabel} - {$fileName}",
        };
    }

    /**
     * 提取參數
     */
    private function extractParameters(string $content, string $fileName): array
    {
        $parameters = [];

        // 列表端點的標準參數
        if ($fileName === 'index') {
            $parameters = [
                [
                    'name' => 'page',
                    'in' => 'query',
                    'schema' => ['type' => 'integer', 'default' => 1],
                    'description' => '頁碼',
                ],
                [
                    'name' => 'perPage',
                    'in' => 'query',
                    'schema' => ['type' => 'integer', 'default' => 15],
                    'description' => '每頁筆數',
                ],
                [
                    'name' => 'search',
                    'in' => 'query',
                    'schema' => ['type' => 'string'],
                    'description' => '搜尋關鍵字',
                ],
            ];
        }

        // show/update/delete 需要 id
        if (in_array($fileName, ['show', 'update', 'delete'])) {
            $parameters[] = [
                'name' => 'id',
                'in' => 'query',
                'required' => true,
                'schema' => ['type' => 'integer'],
                'description' => '資源 ID',
            ];
        }

        // 從程式碼中提取其他參數
        if (preg_match_all("/\\\$_GET\s*\[\s*['\"](\w+)['\"]\s*\]/", $content, $matches)) {
            foreach ($matches[1] as $param) {
                if (!in_array($param, ['page', 'perPage', 'search', 'id'])) {
                    $parameters[] = [
                        'name' => $param,
                        'in' => 'query',
                        'schema' => ['type' => 'string'],
                        'description' => $param,
                    ];
                }
            }
        }

        return $parameters;
    }

    /**
     * 建立請求 Body
     */
    private function buildRequestBody(string $module, string $content): array
    {
        $schemaName = $this->toCamelCase($module) . 'Input';

        // 嘗試從程式碼中提取欄位
        $properties = [];
        if (preg_match_all("/\\\$data\s*\[\s*['\"](\w+)['\"]\s*\]/", $content, $matches)) {
            foreach (array_unique($matches[1]) as $field) {
                $properties[$field] = ['type' => 'string'];
            }
        }

        if (!empty($properties)) {
            $this->schemas[$schemaName] = [
                'type' => 'object',
                'properties' => $properties,
            ];
        }

        return [
            'required' => true,
            'content' => [
                'application/json' => [
                    'schema' => empty($properties)
                        ? ['type' => 'object']
                        : ['$ref' => "#/components/schemas/{$schemaName}"],
                ],
            ],
        ];
    }

    /**
     * 建立回應定義
     */
    private function buildResponses(string $method, string $module): array
    {
        $responses = [];

        switch ($method) {
            case 'GET':
                $responses['200'] = [
                    'description' => '成功',
                    'content' => [
                        'application/json' => [
                            'schema' => ['$ref' => '#/components/schemas/ListResponse'],
                        ],
                    ],
                ];
                break;

            case 'POST':
                $responses['201'] = [
                    'description' => '建立成功',
                    'content' => [
                        'application/json' => [
                            'schema' => ['$ref' => '#/components/schemas/SuccessResponse'],
                        ],
                    ],
                ];
                $responses['400'] = ['$ref' => '#/components/responses/ValidationError'];
                break;

            case 'PUT':
            case 'PATCH':
                $responses['200'] = [
                    'description' => '更新成功',
                    'content' => [
                        'application/json' => [
                            'schema' => ['$ref' => '#/components/schemas/SuccessResponse'],
                        ],
                    ],
                ];
                $responses['404'] = ['$ref' => '#/components/responses/NotFound'];
                break;

            case 'DELETE':
                $responses['200'] = [
                    'description' => '刪除成功',
                    'content' => [
                        'application/json' => [
                            'schema' => ['$ref' => '#/components/schemas/SuccessResponse'],
                        ],
                    ],
                ];
                $responses['404'] = ['$ref' => '#/components/responses/NotFound'];
                break;
        }

        $responses['401'] = ['$ref' => '#/components/responses/Unauthorized'];

        return $responses;
    }

    /**
     * 產生模組 Schema
     */
    private function generateSchema(string $module, string $content): void
    {
        $schemaName = $this->toCamelCase($module);

        if (isset($this->schemas[$schemaName])) {
            return;
        }

        // 從 SELECT 語句中提取欄位
        $properties = ['id' => ['type' => 'integer']];

        if (preg_match('/SELECT\s+(.+?)\s+FROM/is', $content, $matches)) {
            $selectPart = $matches[1];
            // 提取欄位名稱
            if (preg_match_all('/(?:^|,)\s*(?:\w+\.)?(\w+)(?:\s+(?:as\s+)?(\w+))?/i', $selectPart, $fieldMatches)) {
                foreach ($fieldMatches[1] as $i => $field) {
                    $fieldName = !empty($fieldMatches[2][$i]) ? $fieldMatches[2][$i] : $field;
                    if ($fieldName !== '*') {
                        $properties[$fieldName] = $this->guessFieldType($fieldName);
                    }
                }
            }
        }

        $this->schemas[$schemaName] = [
            'type' => 'object',
            'properties' => $properties,
        ];
    }

    /**
     * 猜測欄位類型
     */
    private function guessFieldType(string $fieldName): array
    {
        if (str_ends_with($fieldName, '_id') || $fieldName === 'id') {
            return ['type' => 'integer'];
        }
        if (str_ends_with($fieldName, '_at') || str_contains($fieldName, 'date')) {
            return ['type' => 'string', 'format' => 'date-time'];
        }
        if (str_starts_with($fieldName, 'is_') || str_starts_with($fieldName, 'has_')) {
            return ['type' => 'boolean'];
        }
        if (str_contains($fieldName, 'amount') || str_contains($fieldName, 'price') || str_contains($fieldName, 'quantity')) {
            return ['type' => 'number'];
        }

        return ['type' => 'string'];
    }

    /**
     * 格式化標籤名稱
     */
    private function formatTagName(string $module): string
    {
        return ucwords(str_replace('_', ' ', $module));
    }

    /**
     * 轉換為 CamelCase
     */
    private function toCamelCase(string $str): string
    {
        return str_replace(' ', '', ucwords(str_replace('_', ' ', $str)));
    }

    /**
     * 輸出為 JSON
     */
    public function toJson(): string
    {
        return json_encode($this->openapi, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    /**
     * 輸出為 YAML
     */
    public function toYaml(): string
    {
        return $this->arrayToYaml($this->openapi);
    }

    /**
     * 陣列轉 YAML（簡易實作）
     */
    private function arrayToYaml(array $array, int $indent = 0): string
    {
        $yaml = '';
        $prefix = str_repeat('  ', $indent);

        foreach ($array as $key => $value) {
            if (is_int($key)) {
                $yaml .= "{$prefix}- ";
                if (is_array($value)) {
                    $first = true;
                    foreach ($value as $k => $v) {
                        if ($first) {
                            if (is_array($v)) {
                                $yaml .= "{$k}:\n" . $this->arrayToYaml($v, $indent + 2);
                            } else {
                                $yaml .= "{$k}: " . $this->formatYamlValue($v) . "\n";
                            }
                            $first = false;
                        } else {
                            $yaml .= "{$prefix}  {$k}: ";
                            if (is_array($v)) {
                                $yaml .= "\n" . $this->arrayToYaml($v, $indent + 2);
                            } else {
                                $yaml .= $this->formatYamlValue($v) . "\n";
                            }
                        }
                    }
                } else {
                    $yaml .= $this->formatYamlValue($value) . "\n";
                }
            } else {
                $yaml .= "{$prefix}{$key}:";
                if (is_array($value)) {
                    $yaml .= "\n" . $this->arrayToYaml($value, $indent + 1);
                } else {
                    $yaml .= ' ' . $this->formatYamlValue($value) . "\n";
                }
            }
        }

        return $yaml;
    }

    /**
     * 格式化 YAML 值
     */
    private function formatYamlValue($value): string
    {
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }
        if (is_null($value)) {
            return 'null';
        }
        if (is_numeric($value)) {
            return (string) $value;
        }
        if (str_contains($value, ':') || str_contains($value, '#') || str_contains($value, "'")) {
            return '"' . addslashes($value) . '"';
        }
        return $value;
    }
}

// === 主程式 ===
$format = 'json';
$module = null;

// 解析命令列參數
foreach ($argv as $arg) {
    if (str_starts_with($arg, '--format=')) {
        $format = substr($arg, 9);
    }
    if (str_starts_with($arg, '--module=')) {
        $module = substr($arg, 9);
    }
    if ($arg === '--help' || $arg === '-h') {
        echo <<<HELP
MES API 文件生成器

使用方式:
  php generate-api-docs.php [選項]

選項:
  --format=json|yaml    輸出格式（預設: json）
  --module=MODULE       只產生指定模組的文件
  --help, -h            顯示此說明

範例:
  php generate-api-docs.php > ../docs/openapi.json
  php generate-api-docs.php --format=yaml > ../docs/openapi.yaml
  php generate-api-docs.php --module=departments

HELP;
        exit(0);
    }
}

// 執行生成
$generator = new ApiDocGenerator($module);
$generator->scan();

// 輸出
echo $format === 'yaml' ? $generator->toYaml() : $generator->toJson();
echo "\n";
