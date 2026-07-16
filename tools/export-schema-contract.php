<?php
declare(strict_types=1);

require_once __DIR__ . '/../api/config.php';

$config = getDatabaseConfig();
$dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $config['host'], $config['port'], $config['dbname'], $config['charset']);
$pdo = new PDO($dsn, $config['user'], $config['password'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

$rows = $pdo->query("SELECT table_name, column_name, data_type, is_nullable, column_key, extra
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
    ORDER BY table_name, ordinal_position")->fetchAll();

$tables = [];
foreach ($rows as $row) {
    $row = array_change_key_case($row, CASE_LOWER);
    $tables[$row['table_name']][$row['column_name']] = [
        'type' => $row['data_type'],
        'nullable' => $row['is_nullable'] === 'YES',
        'key' => $row['column_key'],
        'extra' => $row['extra'],
    ];
}

$contract = [
    'schemaVersion' => 1,
    'database' => $config['dbname'],
    'generatedAt' => gmdate('c'),
    'tables' => $tables,
];
$json = json_encode($contract, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;

$writeIndex = array_search('--write', $argv, true);
if ($writeIndex !== false) {
    $target = $argv[$writeIndex + 1] ?? (__DIR__ . '/schema-contract.json');
    if (!preg_match('/^[A-Za-z]:[\\\\\/]/', $target) && !str_starts_with($target, '/')) {
        $target = dirname(__DIR__) . '/' . $target;
    }
    file_put_contents($target, $json);
    fwrite(STDERR, sprintf("Schema contract written: %s (%d tables)\n", $target, count($tables)));
    exit(0);
}

echo $json;
