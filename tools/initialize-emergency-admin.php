<?php
/**
 * 檢查存取控制基線，或在明確確認後將既有有效員工設為緊急管理員。
 *
 * 檢查：php tools/initialize-emergency-admin.php --check
 * 指派：php tools/initialize-emergency-admin.php --account=ACCOUNT --confirm
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../api/bootstrap.php';

$options = getopt('', ['check', 'account:', 'confirm']);
$account = trim((string)($options['account'] ?? ''));
$confirmed = array_key_exists('confirm', $options);
$pdo = db();

$rolelessSql = "
    SELECT e.id, e.account, e.name
    FROM employees e
    LEFT JOIN employee_roles er ON er.employee_id = e.id
    WHERE e.deleted_at IS NULL AND e.status = 'active'
    GROUP BY e.id, e.account, e.name
    HAVING COUNT(er.role_id) = 0
    ORDER BY e.id
";

if ($account === '') {
    $admins = $pdo->query("
        SELECT e.account, e.name
        FROM employees e
        INNER JOIN employee_roles er ON er.employee_id = e.id
        INNER JOIN roles r ON r.id = er.role_id AND r.name = 'admin'
        WHERE e.deleted_at IS NULL AND e.status = 'active'
        ORDER BY e.id
    ")->fetchAll(PDO::FETCH_ASSOC) ?: [];
    $roleless = $pdo->query($rolelessSql)->fetchAll(PDO::FETCH_ASSOC) ?: [];

    echo 'Active administrators: ', count($admins), PHP_EOL;
    foreach ($admins as $admin) {
        echo '  - ', $admin['account'], ' (', $admin['name'], ')', PHP_EOL;
    }
    echo 'Active employees without roles: ', count($roleless), PHP_EOL;
    foreach ($roleless as $employee) {
        echo '  - ', $employee['account'], ' (', $employee['name'], ')', PHP_EOL;
    }

    exit($admins === [] ? 2 : 0);
}

if (!$confirmed) {
    fwrite(STDERR, "Refusing to change access. Re-run with --confirm after verifying the account owner.\n");
    exit(1);
}

$employeeStmt = $pdo->prepare("
    SELECT id, account, name
    FROM employees
    WHERE account = ? AND deleted_at IS NULL AND status = 'active'
    LIMIT 1
");
$employeeStmt->execute([$account]);
$employee = $employeeStmt->fetch(PDO::FETCH_ASSOC);
if (!$employee) {
    fwrite(STDERR, "Active employee account not found.\n");
    exit(1);
}

$roleStmt = $pdo->query("SELECT id FROM roles WHERE name = 'admin' LIMIT 1");
$adminRoleId = (int)$roleStmt->fetchColumn();
if ($adminRoleId <= 0) {
    fwrite(STDERR, "Admin role not found. Run schema synchronization before initialization.\n");
    exit(1);
}

$pdo->beginTransaction();
try {
    // 緊急管理員角色永遠同步目前所有權限，避免新增權限後管理員無法修復設定。
    $permissionStmt = $pdo->query('SELECT id FROM permissions ORDER BY id');
    $assignPermissionStmt = $pdo->prepare('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
    foreach ($permissionStmt->fetchAll(PDO::FETCH_COLUMN) as $permissionId) {
        $assignPermissionStmt->execute([$adminRoleId, (int)$permissionId]);
    }

    $pdo->prepare('INSERT IGNORE INTO employee_roles (employee_id, role_id) VALUES (?, ?)')
        ->execute([(int)$employee['id'], $adminRoleId]);
    $pdo->commit();
} catch (Throwable $exception) {
    $pdo->rollBack();
    fwrite(STDERR, "Emergency administrator initialization failed.\n");
    exit(1);
}

echo 'Emergency administrator ready: ', $employee['account'], ' (', $employee['name'], ')', PHP_EOL;
