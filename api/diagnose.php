<?php
/**
 * 診斷腳本 - 用於檢查遠端伺服器的 MySQL 表名大小寫問題
 */
require_once __DIR__ . '/bootstrap.php';

requireMethod('GET');
requireAuth();

header('Content-Type: application/json; charset=utf-8');

$results = [
    'timestamp' => date('Y-m-d H:i:s'),
    'tests' => []
];

try {
    $pdo = db();

    $results['database_connection'] = 'OK';

    // 取得 lower_case_table_names 設定
    $stmt = $pdo->query("SHOW VARIABLES LIKE 'lower_case_table_names'");
    $lctn = $stmt->fetch();
    $results['lower_case_table_names'] = $lctn ? $lctn['Value'] : 'unknown';

    // 列出表數量（不暴露表名）
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $results['tables_count'] = count($tables);

    // 測試各種表名查詢
    $testQueries = [
        ['name' => 'orders (lowercase)', 'sql' => 'SELECT COUNT(*) as cnt FROM orders'],
        ['name' => 'Orders (PascalCase)', 'sql' => 'SELECT COUNT(*) as cnt FROM Orders'],
        ['name' => 'customers (lowercase)', 'sql' => 'SELECT COUNT(*) as cnt FROM customers'],
        ['name' => 'Customers (PascalCase)', 'sql' => 'SELECT COUNT(*) as cnt FROM Customers'],
        ['name' => 'lookup_values (lowercase)', 'sql' => 'SELECT COUNT(*) as cnt FROM lookup_values'],
        ['name' => 'LookupValues (PascalCase)', 'sql' => 'SELECT COUNT(*) as cnt FROM lookup_values'],
        ['name' => 'lookup_domains (lowercase)', 'sql' => 'SELECT COUNT(*) as cnt FROM lookup_domains'],
        ['name' => 'LookupDomains (PascalCase)', 'sql' => 'SELECT COUNT(*) as cnt FROM lookup_domains'],
    ];

    foreach ($testQueries as $test) {
        try {
            $stmt = $pdo->query($test['sql']);
            $row = $stmt->fetch();
            $results['tests'][$test['name']] = [
                'status' => 'OK',
                'count' => $row['cnt']
            ];
        } catch (PDOException $e) {
            error_log('Diagnose query failed (' . $test['name'] . '): ' . $e->getMessage());
            $results['tests'][$test['name']] = [
                'status' => 'ERROR',
                'error' => '查詢失敗',
            ];
        }
    }

} catch (PDOException $e) {
    error_log('Diagnose DB connection failed: ' . $e->getMessage());
    $results['database_connection'] = 'FAILED';
    $results['error'] = '資料庫連線失敗';
}

echo json_encode($results, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
