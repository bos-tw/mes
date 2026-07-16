<?php
/**
 * 系統更新共用函式
 */
declare(strict_types=1);

/**
 * 取得專案根目錄。
 */
function systemUpdateProjectRoot(): string
{
    return dirname(__DIR__);
}

/**
 * 取得系統更新暫存根目錄。
 */
function systemUpdateStorageRoot(): string
{
    return systemUpdateProjectRoot() . '/uploads/system_updates';
}

/**
 * 取得維護模式狀態檔案路徑。
 */
function systemUpdateMaintenanceFlagPath(): string
{
    return systemUpdateStorageRoot() . '/maintenance_state.json';
}

/**
 * 取得 DB 快照儲存目錄。
 */
function systemUpdateDbBackupRoot(): string
{
    return systemUpdateStorageRoot() . '/db_backups';
}

/**
 * 將絕對路徑轉為專案相對路徑。
 */
function toProjectRelativePath(string $path): string
{
    $projectRoot = str_replace('\\', '/', systemUpdateProjectRoot());
    $normalized = str_replace('\\', '/', $path);

    if (str_starts_with($normalized, $projectRoot . '/')) {
        return substr($normalized, strlen($projectRoot) + 1);
    }

    return ltrim($normalized, '/');
}

/**
 * 讀取目前維護模式狀態。
 *
 * @return array{enabled: bool, reason: string, enabled_by: string, enabled_at: string, source: string, job_id: int}
 */
function getSystemUpdateMaintenanceState(): array
{
    $default = [
        'enabled' => false,
        'reason' => '',
        'enabled_by' => '',
        'enabled_at' => '',
        'source' => '',
        'job_id' => 0,
    ];

    $filePath = systemUpdateMaintenanceFlagPath();
    if (!is_file($filePath)) {
        return $default;
    }

    $raw = file_get_contents($filePath);
    if (!is_string($raw) || trim($raw) === '') {
        return $default;
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return $default;
    }

    return [
        'enabled' => (bool)($decoded['enabled'] ?? false),
        'reason' => trim((string)($decoded['reason'] ?? '')),
        'enabled_by' => trim((string)($decoded['enabled_by'] ?? '')),
        'enabled_at' => trim((string)($decoded['enabled_at'] ?? '')),
        'source' => trim((string)($decoded['source'] ?? '')),
        'job_id' => max(0, (int)($decoded['job_id'] ?? 0)),
    ];
}

/**
 * 寫入維護模式狀態。
 *
 * @throws RuntimeException
 */
function setSystemUpdateMaintenanceState(
    bool $enabled,
    string $enabledBy = '',
    string $reason = '',
    string $source = 'manual',
    int $jobId = 0
): array {
    $storageRoot = systemUpdateStorageRoot();
    ensureDirectoryExists($storageRoot);

    $payload = [
        'enabled' => $enabled,
        'reason' => trim($reason),
        'enabled_by' => trim($enabledBy),
        'enabled_at' => $enabled ? date('Y-m-d H:i:s') : '',
        'source' => trim($source),
        'job_id' => max(0, $jobId),
    ];

    $encoded = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($encoded === false) {
        throw new RuntimeException('維護模式狀態序列化失敗。');
    }

    $filePath = systemUpdateMaintenanceFlagPath();
    if (file_put_contents($filePath, $encoded, LOCK_EX) === false) {
        throw new RuntimeException('寫入維護模式狀態失敗。');
    }

    return $payload;
}

/**
 * 檢查目前是否啟用維護模式。
 */
function isSystemUpdateMaintenanceEnabled(): bool
{
    $state = getSystemUpdateMaintenanceState();
    return (bool)$state['enabled'];
}

/**
 * 檢查指定資料表是否存在於目前資料庫。
 */
function systemUpdateTableExists(PDO $pdo, string $tableName): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*)
         FROM information_schema.tables
         WHERE table_schema = DATABASE()
           AND table_name = :table_name'
    );
    $stmt->execute([':table_name' => $tableName]);

    return (int)$stmt->fetchColumn() > 0;
}

/**
 * 建立目錄（若不存在）。
 *
 * @throws RuntimeException
 */
function ensureDirectoryExists(string $directory): void
{
    if (is_dir($directory)) {
        return;
    }

    if (!mkdir($directory, 0755, true) && !is_dir($directory)) {
        throw new RuntimeException('建立目錄失敗：' . $directory);
    }
}

/**
 * 標準化相對路徑並阻擋目錄跳脫。
 */
function normalizeRelativePath(string $path): string
{
    $path = str_replace('\\', '/', trim($path));
    while (str_starts_with($path, './')) {
        $path = substr($path, 2);
    }
    while (str_starts_with($path, '/')) {
        $path = substr($path, 1);
    }

    if ($path === '' || str_contains($path, "\0")) {
        return '';
    }

    $parts = [];
    foreach (explode('/', $path) as $segment) {
        $segment = trim($segment);
        if ($segment === '' || $segment === '.') {
            continue;
        }
        if ($segment === '..') {
            return '';
        }
        $parts[] = $segment;
    }

    return implode('/', $parts);
}

/**
 * 檢查是否屬於受保護路徑（不可由更新包覆蓋）。
 */
function isProtectedUpdatePath(string $relativePath): bool
{
    $relativePath = normalizeRelativePath($relativePath);
    if ($relativePath === '') {
        return true;
    }

    $protectedExact = [
        'api/config.php',
        'api/config.local.php',
        '.env',
        '.env.local',
    ];

    $protectedPrefixes = [
        'uploads/',
        'db_backups/',
        'db_exports/',
        'vendor/',
        '.git/',
    ];

    if (in_array($relativePath, $protectedExact, true)) {
        return true;
    }

    foreach ($protectedPrefixes as $prefix) {
        if (str_starts_with($relativePath, $prefix)) {
            return true;
        }
    }

    return false;
}

/**
 * 尋找 ZIP 內名稱（大小寫不敏感）。
 */
function findZipEntryCaseInsensitive(ZipArchive $zip, string $targetName): ?string
{
    $targetName = strtolower($targetName);

    for ($i = 0; $i < $zip->numFiles; $i++) {
        $name = $zip->getNameIndex($i);
        if ($name === false) {
            continue;
        }
        if (strtolower($name) === $targetName) {
            return $name;
        }
    }

    return null;
}

/**
 * 驗證 ZIP 內檔案路徑安全性。
 *
 * @throws RuntimeException
 */
function validateZipEntriesSafe(ZipArchive $zip): void
{
    for ($i = 0; $i < $zip->numFiles; $i++) {
        $entry = $zip->getNameIndex($i);
        if ($entry === false) {
            continue;
        }

        $entry = str_replace('\\', '/', $entry);

        if (str_contains($entry, '../') || str_starts_with($entry, '../') || str_starts_with($entry, '/')) {
            throw new RuntimeException('更新包包含不安全路徑，已拒絕。');
        }

        if (preg_match('/^[A-Za-z]:\//', $entry) === 1) {
            throw new RuntimeException('更新包包含絕對路徑，已拒絕。');
        }
    }
}

/**
 * 解析更新包 manifest 並進行驗證。
 *
 * @return array<string,mixed>
 * @throws RuntimeException
 */
function parseSystemUpdateManifestFromZip(string $zipPath): array
{
    if (!class_exists('ZipArchive')) {
        throw new RuntimeException('伺服器未啟用 ZipArchive，無法解析更新包。');
    }

    $zip = new ZipArchive();
    $openResult = $zip->open($zipPath);
    if ($openResult !== true) {
        throw new RuntimeException('無法開啟更新壓縮檔。');
    }

    try {
        validateZipEntriesSafe($zip);

        $manifestName = findZipEntryCaseInsensitive($zip, 'manifest.json');
        if ($manifestName === null) {
            throw new RuntimeException('更新包缺少 manifest.json。');
        }

        $manifestRaw = $zip->getFromName($manifestName);
        if ($manifestRaw === false) {
            throw new RuntimeException('讀取 manifest.json 失敗。');
        }

        $manifest = json_decode($manifestRaw, true);
        if (!is_array($manifest)) {
            throw new RuntimeException('manifest.json 格式不正確。');
        }

        $versionNumber = trim((string)($manifest['version_number'] ?? ''));
        $fileVersion = trim((string)($manifest['file_version'] ?? ''));
        $releaseDate = trim((string)($manifest['release_date'] ?? ''));
        $changeSummary = trim((string)($manifest['change_summary'] ?? ''));
        $filesRoot = normalizeRelativePath((string)($manifest['files_root'] ?? 'files'));

        if ($versionNumber === '' || $fileVersion === '' || $releaseDate === '') {
            throw new RuntimeException('manifest.json 必填欄位不足（version_number/file_version/release_date）。');
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $releaseDate) !== 1) {
            throw new RuntimeException('manifest.json 的 release_date 格式需為 YYYY-MM-DD。');
        }

        if ($filesRoot === '') {
            throw new RuntimeException('manifest.json 的 files_root 設定不正確。');
        }

        $migrations = $manifest['migrations'] ?? [];
        if (!is_array($migrations)) {
            throw new RuntimeException('manifest.json 的 migrations 需為陣列。');
        }

        $migrationFiles = [];
        foreach ($migrations as $migrationFile) {
            $migrationFile = normalizeRelativePath((string)$migrationFile);
            if ($migrationFile === '') {
                continue;
            }
            $entryName = findZipEntryCaseInsensitive($zip, $migrationFile);
            if ($entryName === null) {
                throw new RuntimeException('更新包缺少 migration 檔案：' . $migrationFile);
            }
            $migrationFiles[] = str_replace('\\', '/', $migrationFile);
        }

        $rollbackMigrations = $manifest['rollback_migrations'] ?? [];
        if (!is_array($rollbackMigrations)) {
            throw new RuntimeException('manifest.json 的 rollback_migrations 需為陣列。');
        }

        $rollbackMigrationFiles = [];
        foreach ($rollbackMigrations as $rollbackMigrationFile) {
            $rollbackMigrationFile = normalizeRelativePath((string)$rollbackMigrationFile);
            if ($rollbackMigrationFile === '') {
                continue;
            }
            $entryName = findZipEntryCaseInsensitive($zip, $rollbackMigrationFile);
            if ($entryName === null) {
                throw new RuntimeException('更新包缺少 rollback migration 檔案：' . $rollbackMigrationFile);
            }
            $rollbackMigrationFiles[] = str_replace('\\', '/', $rollbackMigrationFile);
        }

        $deleteFilesRaw = $manifest['delete_files'] ?? [];
        if (!is_array($deleteFilesRaw)) {
            throw new RuntimeException('manifest.json 的 delete_files 需為陣列。');
        }

        $deleteFiles = [];
        $deletePathSet = [];
        foreach ($deleteFilesRaw as $deleteFileRaw) {
            $deleteFile = normalizeRelativePath((string)$deleteFileRaw);
            if ($deleteFile === '') {
                throw new RuntimeException('manifest.json 的 delete_files 不可包含空路徑。');
            }
            if (isProtectedUpdatePath($deleteFile)) {
                throw new RuntimeException('更新包要求刪除受保護路徑：' . $deleteFile);
            }

            $deleteKey = strtolower($deleteFile);
            if (isset($deletePathSet[$deleteKey])) {
                throw new RuntimeException('manifest.json 的 delete_files 包含重複路徑：' . $deleteFile);
            }
            $deletePathSet[$deleteKey] = true;
            $deleteFiles[] = str_replace('\\', '/', $deleteFile);
        }

        $fileCount = 0;
        $packagePathSet = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $entryName = $zip->getNameIndex($i);
            if ($entryName === false) {
                continue;
            }

            $entryName = str_replace('\\', '/', $entryName);
            if (str_ends_with($entryName, '/')) {
                continue;
            }

            $normalized = normalizeRelativePath($entryName);
            if ($normalized === '') {
                continue;
            }

            $prefix = $filesRoot . '/';
            if (!str_starts_with($normalized, $prefix)) {
                continue;
            }

            $targetRelative = substr($normalized, strlen($prefix));
            $targetRelative = normalizeRelativePath($targetRelative);
            if ($targetRelative === '') {
                continue;
            }

            if (isProtectedUpdatePath($targetRelative)) {
                throw new RuntimeException('更新包包含受保護路徑：' . $targetRelative);
            }

            $targetKey = strtolower($targetRelative);
            if (isset($deletePathSet[$targetKey])) {
                throw new RuntimeException('更新包同時包含並要求刪除檔案：' . $targetRelative);
            }
            if (isset($packagePathSet[$targetKey])) {
                throw new RuntimeException('更新包包含重複目標路徑：' . $targetRelative);
            }
            $packagePathSet[$targetKey] = true;

            $fileCount++;
        }

        if ($fileCount === 0) {
            throw new RuntimeException('更新包未包含可套用的檔案（files_root 內無檔案）。');
        }

        if ($changeSummary === '') {
            $changeSummary = '此版本未提供更新說明。';
        }

        return [
            'version_number' => $versionNumber,
            'file_version' => $fileVersion,
            'release_date' => $releaseDate,
            'change_summary' => $changeSummary,
            'files_root' => $filesRoot,
            'migrations' => array_values($migrationFiles),
            'rollback_migrations' => array_values($rollbackMigrationFiles),
            'delete_files' => array_values($deleteFiles),
            'file_count' => $fileCount,
        ];
    } finally {
        $zip->close();
    }
}

/**
 * 建立更新任務紀錄。
 */
function createSystemUpdateJob(PDO $pdo, array $payload): int
{
    $sql = 'INSERT INTO system_update_jobs (
                package_name,
                package_path,
                package_sha256,
                package_size,
                status,
                version_number,
                file_version,
                release_date,
                change_summary,
                files_root,
                migration_files,
                file_count,
                result_message,
                created_by
            ) VALUES (
                :package_name,
                :package_path,
                :package_sha256,
                :package_size,
                :status,
                :version_number,
                :file_version,
                :release_date,
                :change_summary,
                :files_root,
                :migration_files,
                :file_count,
                :result_message,
                :created_by
            )';

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':package_name' => (string)($payload['package_name'] ?? ''),
        ':package_path' => (string)($payload['package_path'] ?? ''),
        ':package_sha256' => (string)($payload['package_sha256'] ?? ''),
        ':package_size' => (int)($payload['package_size'] ?? 0),
        ':status' => (string)($payload['status'] ?? 'uploaded'),
        ':version_number' => (string)($payload['version_number'] ?? ''),
        ':file_version' => (string)($payload['file_version'] ?? ''),
        ':release_date' => (string)($payload['release_date'] ?? ''),
        ':change_summary' => (string)($payload['change_summary'] ?? ''),
        ':files_root' => (string)($payload['files_root'] ?? 'files'),
        ':migration_files' => json_encode($payload['migration_files'] ?? [], JSON_UNESCAPED_UNICODE),
        ':file_count' => (int)($payload['file_count'] ?? 0),
        ':result_message' => (string)($payload['result_message'] ?? ''),
        ':created_by' => (string)($payload['created_by'] ?? ''),
    ]);

    return (int)$pdo->lastInsertId();
}

/**
 * 寫入前端快取版本戳，確保更新包套用後即使檔案 mtime 未變，前端版本仍會改變。
 *
 * @return array{path: string, cache_token: string, applied_at: string}
 */
function writeSystemUpdateCacheVersionStamp(array $job): array
{
    $storageRoot = systemUpdateStorageRoot();
    ensureDirectoryExists($storageRoot);

    try {
        $suffix = bin2hex(random_bytes(3));
    } catch (Throwable $exception) {
        $suffix = substr(str_replace('.', '', uniqid('', true)), -6);
    }

    $payload = [
        'cache_token' => date('YmdHis') . '-' . $suffix,
        'applied_at' => date('Y-m-d H:i:s'),
        'job_id' => (int)($job['id'] ?? 0),
        'version_number' => (string)($job['version_number'] ?? ''),
        'file_version' => (string)($job['file_version'] ?? ''),
    ];

    $stampPath = $storageRoot . '/cache_version.json';
    $encoded = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($encoded === false || file_put_contents($stampPath, $encoded, LOCK_EX) === false) {
        throw new RuntimeException('寫入前端快取版本戳失敗。');
    }

    clearstatcache(true, $stampPath);

    return [
        'path' => toProjectRelativePath($stampPath),
        'cache_token' => (string)$payload['cache_token'],
        'applied_at' => (string)$payload['applied_at'],
    ];
}

/**
 * 清除 PHP stat/opcache，降低更新後仍執行舊 PHP 程式碼的機率。
 *
 * @param array<int,string> $relativeFiles
 * @return array{opcache_available: bool, attempted: int, invalidated: int}
 */
function invalidateSystemUpdateRuntimeCaches(array $relativeFiles): array
{
    $projectRoot = systemUpdateProjectRoot();
    $opcacheAvailable = function_exists('opcache_invalidate');
    $attempted = 0;
    $invalidated = 0;

    foreach ($relativeFiles as $relativePath) {
        $relativePath = normalizeRelativePath((string)$relativePath);
        if ($relativePath === '') {
            continue;
        }

        $fullPath = $projectRoot . '/' . $relativePath;
        clearstatcache(true, $fullPath);

        if (strtolower(pathinfo($relativePath, PATHINFO_EXTENSION)) !== 'php') {
            continue;
        }

        $attempted++;
        if ($opcacheAvailable && @opcache_invalidate($fullPath, true)) {
            $invalidated++;
        }
    }

    return [
        'opcache_available' => $opcacheAvailable,
        'attempted' => $attempted,
        'invalidated' => $invalidated,
    ];
}

/**
 * 更新指定更新任務欄位。
 */
function updateSystemUpdateJob(PDO $pdo, int $jobId, array $fields): void
{
    $allowMap = [
        'status' => 'status',
        'result_message' => 'result_message',
        'backup_dir' => 'backup_dir',
        'extract_dir' => 'extract_dir',
        'migration_files' => 'migration_files',
        'file_count' => 'file_count',
    ];

    $sets = [];
    $params = [':id' => $jobId];

    foreach ($allowMap as $key => $column) {
        if (!array_key_exists($key, $fields)) {
            continue;
        }

        $paramName = ':' . $key;
        $sets[] = $column . ' = ' . $paramName;

        if ($key === 'migration_files') {
            $params[$paramName] = json_encode($fields[$key], JSON_UNESCAPED_UNICODE);
        } else {
            $params[$paramName] = $fields[$key];
        }
    }

    if ($sets === []) {
        return;
    }

    $sql = 'UPDATE system_update_jobs SET ' . implode(', ', $sets) . ', updated_at = NOW() WHERE id = :id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
}

/**
 * 取得指定更新任務。
 */
function getSystemUpdateJob(PDO $pdo, int $jobId): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM system_update_jobs WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $jobId]);
    $row = $stmt->fetch();

    return $row ? formatSystemUpdateJob($row) : null;
}

/**
 * 取得最近更新任務清單。
 *
 * @return array<int,array<string,mixed>>
 */
function listSystemUpdateJobs(PDO $pdo, int $limit = 10): array
{
    $limit = max(1, min($limit, 30));

    $stmt = $pdo->prepare('SELECT * FROM system_update_jobs ORDER BY id DESC LIMIT :limit');
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll();
    return array_map(static fn(array $row): array => formatSystemUpdateJob($row), $rows ?: []);
}

/**
 * 格式化更新任務輸出。
 */
function formatSystemUpdateJob(array $row): array
{
    $migrations = [];
    $migrationRaw = $row['migration_files'] ?? '[]';
    if (is_string($migrationRaw) && $migrationRaw !== '') {
        $decoded = json_decode($migrationRaw, true);
        if (is_array($decoded)) {
            $migrations = array_values(array_filter(array_map('strval', $decoded), static fn(string $v): bool => $v !== ''));
        }
    }

    return [
        'id' => (int)($row['id'] ?? 0),
        'package_name' => (string)($row['package_name'] ?? ''),
        'package_path' => (string)($row['package_path'] ?? ''),
        'package_sha256' => (string)($row['package_sha256'] ?? ''),
        'package_size' => (int)($row['package_size'] ?? 0),
        'status' => (string)($row['status'] ?? ''),
        'version_number' => (string)($row['version_number'] ?? ''),
        'file_version' => (string)($row['file_version'] ?? ''),
        'release_date' => (string)($row['release_date'] ?? ''),
        'change_summary' => (string)($row['change_summary'] ?? ''),
        'files_root' => (string)($row['files_root'] ?? 'files'),
        'migration_files' => $migrations,
        'migration_count' => count($migrations),
        'file_count' => (int)($row['file_count'] ?? 0),
        'backup_dir' => (string)($row['backup_dir'] ?? ''),
        'extract_dir' => (string)($row['extract_dir'] ?? ''),
        'result_message' => (string)($row['result_message'] ?? ''),
        'created_by' => (string)($row['created_by'] ?? ''),
        'created_at' => (string)($row['created_at'] ?? ''),
        'updated_at' => (string)($row['updated_at'] ?? ''),
    ];
}

/**
 * 推導對應 rollback migration 路徑（若檔名符合標準命名）。
 */
function guessRollbackMigrationPath(string $migrationFile): string
{
    $migrationFile = normalizeRelativePath($migrationFile);
    if ($migrationFile === '') {
        return '';
    }

    $dir = trim(str_replace('\\', '/', dirname($migrationFile)), '/');
    $baseName = basename($migrationFile);

    $rollbackName = $baseName;
    $rollbackName = preg_replace('/^(\d{4}_\d{2}_\d{2})_/', '$1_rollback_', $rollbackName) ?? $rollbackName;

    if ($rollbackName === $baseName) {
        return '';
    }

    if ($dir === '' || $dir === '.') {
        return 'rollbacks/' . $rollbackName;
    }

    return $dir . '/rollbacks/' . $rollbackName;
}

/**
 * 建立 migration -> rollback migration 對照表。
 *
 * @param array<int,string> $migrations
 * @param array<int,string> $rollbackMigrations
 * @return array<string,string>
 */
function buildRollbackMigrationMap(array $migrations, array $rollbackMigrations): array
{
    $map = [];

    if ($rollbackMigrations !== []) {
        foreach ($migrations as $index => $migrationFile) {
            $migrationFile = normalizeRelativePath((string)$migrationFile);
            if ($migrationFile === '') {
                continue;
            }

            $rollbackFile = normalizeRelativePath((string)($rollbackMigrations[$index] ?? ''));
            if ($rollbackFile === '') {
                $rollbackFile = guessRollbackMigrationPath($migrationFile);
            }

            if ($rollbackFile !== '') {
                $map[$migrationFile] = $rollbackFile;
            }
        }

        return $map;
    }

    foreach ($migrations as $migrationFile) {
        $migrationFile = normalizeRelativePath((string)$migrationFile);
        if ($migrationFile === '') {
            continue;
        }

        $rollbackFile = guessRollbackMigrationPath($migrationFile);
        if ($rollbackFile !== '') {
            $map[$migrationFile] = $rollbackFile;
        }
    }

    return $map;
}

/**
 * 建立 MySQL 全庫快照（Schema + Data）。
 *
 * @return array{file_path: string, table_count: int, row_count: int, bytes: int}
 * @throws RuntimeException
 */
function createDatabaseSnapshot(PDO $pdo, string $targetFilePath): array
{
    if (function_exists('set_time_limit')) {
        @set_time_limit(0);
    }

    ensureDirectoryExists(dirname($targetFilePath));
    $handle = fopen($targetFilePath, 'wb');
    if ($handle === false) {
        throw new RuntimeException('建立資料庫快照檔案失敗。');
    }

    $tableCount = 0;
    $rowCount = 0;

    try {
        fwrite($handle, "-- MES database snapshot\n");
        fwrite($handle, "-- Generated at: " . date('Y-m-d H:i:s') . "\n");
        fwrite($handle, "SET NAMES utf8mb4;\n");
        fwrite($handle, "SET FOREIGN_KEY_CHECKS = 0;\n\n");

        $tableStmt = $pdo->query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
        if ($tableStmt === false) {
            throw new RuntimeException('讀取資料表清單失敗。');
        }

        $tables = $tableStmt->fetchAll(PDO::FETCH_NUM);
        foreach ($tables as $tableRow) {
            $tableName = (string)($tableRow[0] ?? '');
            if ($tableName === '') {
                continue;
            }

            $tableCount++;
            fwrite($handle, "--\n-- Table structure for `" . $tableName . "`\n--\n");
            fwrite($handle, "DROP TABLE IF EXISTS `" . $tableName . "`;\n");

            $createStmt = $pdo->query('SHOW CREATE TABLE `' . str_replace('`', '``', $tableName) . '`');
            if ($createStmt === false) {
                throw new RuntimeException('讀取資料表結構失敗：' . $tableName);
            }
            $createRow = $createStmt->fetch(PDO::FETCH_ASSOC);
            $createSql = (string)($createRow['Create Table'] ?? '');
            if ($createSql === '') {
                throw new RuntimeException('解析資料表結構失敗：' . $tableName);
            }
            fwrite($handle, $createSql . ";\n\n");

            $dataStmt = $pdo->query('SELECT * FROM `' . str_replace('`', '``', $tableName) . '`');
            if ($dataStmt === false) {
                throw new RuntimeException('讀取資料表資料失敗：' . $tableName);
            }

            while (($record = $dataStmt->fetch(PDO::FETCH_NUM)) !== false) {
                $values = [];
                foreach ($record as $value) {
                    if ($value === null) {
                        $values[] = 'NULL';
                    } elseif (is_int($value) || is_float($value)) {
                        $values[] = (string)$value;
                    } else {
                        $quoted = $pdo->quote((string)$value);
                        if ($quoted === false) {
                            $quoted = "''";
                        }
                        $values[] = $quoted;
                    }
                }

                fwrite(
                    $handle,
                    'INSERT INTO `' . $tableName . '` VALUES (' . implode(', ', $values) . ");\n"
                );
                $rowCount++;
            }

            fwrite($handle, "\n");
        }

        fwrite($handle, "SET FOREIGN_KEY_CHECKS = 1;\n");
    } finally {
        fclose($handle);
    }

    clearstatcache(true, $targetFilePath);
    $bytes = (int)@filesize($targetFilePath);

    return [
        'file_path' => toProjectRelativePath($targetFilePath),
        'table_count' => $tableCount,
        'row_count' => $rowCount,
        'bytes' => max(0, $bytes),
    ];
}

/**
 * 清理舊的 DB 快照檔案。
 *
 * @return array<int,string> 已刪除檔案（專案相對路徑）
 */
function pruneDatabaseSnapshots(string $backupDir, int $keepDays = 7): array
{
    $deleted = [];
    if (!is_dir($backupDir)) {
        return $deleted;
    }

    $keepDays = max(1, $keepDays);
    $threshold = strtotime('-' . $keepDays . ' days 00:00:00');
    if ($threshold === false) {
        return $deleted;
    }

    $files = glob($backupDir . '/db_snapshot_*.sql');
    if (!is_array($files)) {
        return $deleted;
    }

    foreach ($files as $filePath) {
        if (!is_file($filePath)) {
            continue;
        }

        $baseName = basename($filePath);
        if (preg_match('/^db_snapshot_(\d{8})\.sql$/', $baseName, $matches) !== 1) {
            continue;
        }

        $fileDate = DateTime::createFromFormat('Ymd', $matches[1]);
        if (!$fileDate) {
            continue;
        }

        $fileTs = $fileDate->getTimestamp();
        if ($fileTs === false || $fileTs >= $threshold) {
            continue;
        }

        if (@unlink($filePath)) {
            $deleted[] = toProjectRelativePath($filePath);
        }
    }

    return $deleted;
}

/**
 * 建立或重用當日 DB 快照（每日一份，保留 N 天）。
 *
 * @return array{file_path: string, table_count: int, row_count: int, bytes: int, reused: bool, retention_days: int, pruned_files: array<int,string>}
 * @throws RuntimeException
 */
function createDailyDatabaseSnapshot(PDO $pdo, int $keepDays = 7): array
{
    $backupDir = systemUpdateDbBackupRoot();
    ensureDirectoryExists($backupDir);

    $dateToken = date('Ymd');
    $targetPath = $backupDir . '/db_snapshot_' . $dateToken . '.sql';
    $reused = is_file($targetPath);

    if ($reused) {
        $bytes = (int)@filesize($targetPath);
        $snapshotInfo = [
            'file_path' => toProjectRelativePath($targetPath),
            'table_count' => 0,
            'row_count' => 0,
            'bytes' => max(0, $bytes),
        ];
    } else {
        $snapshotInfo = createDatabaseSnapshot($pdo, $targetPath);
    }

    $pruned = pruneDatabaseSnapshots($backupDir, $keepDays);

    return [
        'file_path' => (string)$snapshotInfo['file_path'],
        'table_count' => (int)$snapshotInfo['table_count'],
        'row_count' => (int)$snapshotInfo['row_count'],
        'bytes' => (int)$snapshotInfo['bytes'],
        'reused' => $reused,
        'retention_days' => max(1, $keepDays),
        'pruned_files' => $pruned,
    ];
}

/**
 * 列出已解壓更新包中 files_root 內的相對檔案清單。
 *
 * @return array<int,string>
 */
function collectExtractedPackageFiles(string $extractDir, string $filesRoot): array
{
    $filesRoot = normalizeRelativePath($filesRoot);
    if ($filesRoot === '') {
        $filesRoot = 'files';
    }

    $sourceRoot = $extractDir . '/' . $filesRoot;
    if (!is_dir($sourceRoot)) {
        return [];
    }

    $sourceRootNormalized = str_replace('\\', '/', realpath($sourceRoot) ?: $sourceRoot);
    $result = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($sourceRoot, FilesystemIterator::SKIP_DOTS)
    );

    foreach ($iterator as $fileInfo) {
        if (!$fileInfo->isFile()) {
            continue;
        }

        $sourcePath = str_replace('\\', '/', $fileInfo->getPathname());
        $relative = substr($sourcePath, strlen($sourceRootNormalized));
        $relative = ltrim(str_replace('\\', '/', (string)$relative), '/');
        $relative = normalizeRelativePath($relative);

        if ($relative === '' || isProtectedUpdatePath($relative)) {
            continue;
        }

        $result[] = $relative;
    }

    return $result;
}

/**
 * 套用後健康檢查。
 *
 * @param array<int,string> $copiedRelativeFiles
 * @return array{passed: bool, checks: array<int,array<string,mixed>>, failed_count: int}
 */
function performPostUpdateHealthCheck(PDO $pdo, array $copiedRelativeFiles): array
{
    $checks = [];
    $projectRoot = systemUpdateProjectRoot();

    $criticalFiles = [
        'api/bootstrap.php',
        'api/config.php',
        'index.php',
    ];

    foreach ($criticalFiles as $criticalFile) {
        $fullPath = $projectRoot . '/' . $criticalFile;
        $checks[] = [
            'key' => 'critical_file_' . str_replace(['/', '.'], '_', $criticalFile),
            'label' => '關鍵檔案存在：' . $criticalFile,
            'ok' => is_file($fullPath) && is_readable($fullPath),
            'detail' => (is_file($fullPath) && is_readable($fullPath)) ? '檔案可讀取。' : '檔案不存在或不可讀取。',
            'severity' => 'error',
        ];
    }

    try {
        $probe = $pdo->query('SELECT 1');
        $probeValue = $probe ? (int)$probe->fetchColumn() : 0;
        $checks[] = [
            'key' => 'db_probe',
            'label' => '資料庫連線探測',
            'ok' => $probeValue === 1,
            'detail' => $probeValue === 1 ? '連線正常。' : '查詢結果異常。',
            'severity' => 'error',
        ];
    } catch (Throwable $exception) {
        $checks[] = [
            'key' => 'db_probe',
            'label' => '資料庫連線探測',
            'ok' => false,
            'detail' => '資料庫探測失敗：' . $exception->getMessage(),
            'severity' => 'error',
        ];
    }

    $missingCopiedFiles = [];
    foreach ($copiedRelativeFiles as $relativePath) {
        $relativePath = normalizeRelativePath((string)$relativePath);
        if ($relativePath === '') {
            continue;
        }
        $fullPath = $projectRoot . '/' . $relativePath;
        if (!is_file($fullPath)) {
            $missingCopiedFiles[] = $relativePath;
        }
    }
    $checks[] = [
        'key' => 'copied_files_verification',
        'label' => '更新檔案驗證',
        'ok' => $missingCopiedFiles === [],
        'detail' => $missingCopiedFiles === []
            ? '所有已覆蓋檔案皆存在。'
            : '缺少檔案：' . implode(', ', array_slice($missingCopiedFiles, 0, 5)),
        'severity' => 'error',
    ];

    $storageRoot = systemUpdateStorageRoot();
    $checks[] = [
        'key' => 'system_update_storage_writable',
        'label' => '更新目錄寫入權限',
        'ok' => is_dir($storageRoot) && is_writable($storageRoot),
        'detail' => (is_dir($storageRoot) && is_writable($storageRoot)) ? '可寫入。' : '更新目錄不可寫入。',
        'severity' => 'warning',
    ];

    $failedCount = 0;
    $passed = true;
    foreach ($checks as $check) {
        if (($check['severity'] ?? 'error') !== 'error') {
            continue;
        }
        if (!(bool)($check['ok'] ?? false)) {
            $failedCount++;
            $passed = false;
        }
    }

    return [
        'passed' => $passed,
        'checks' => $checks,
        'failed_count' => $failedCount,
    ];
}

/**
 * 分割 SQL 檔中的多條語句。
 *
 * @return array<int,string>
 */
function splitSqlStatements(string $sql): array
{
    $statements = [];
    $buffer = '';
    $inSingle = false;
    $inDouble = false;
    $length = strlen($sql);

    for ($i = 0; $i < $length; $i++) {
        $char = $sql[$i];
        $next = $i + 1 < $length ? $sql[$i + 1] : '';

        if (!$inSingle && !$inDouble) {
            if ($char === '-' && $next === '-') {
                $prev = $i > 0 ? $sql[$i - 1] : "\n";
                if ($prev === "\n" || $prev === "\r" || ctype_space($prev)) {
                    while ($i < $length && $sql[$i] !== "\n") {
                        $i++;
                    }
                    continue;
                }
            }

            if ($char === '#') {
                while ($i < $length && $sql[$i] !== "\n") {
                    $i++;
                }
                continue;
            }

            if ($char === '/' && $next === '*') {
                $i += 2;
                while ($i < $length - 1 && !($sql[$i] === '*' && $sql[$i + 1] === '/')) {
                    $i++;
                }
                $i++;
                continue;
            }
        }

        if ($char === "'" && !$inDouble) {
            $escaped = $i > 0 && $sql[$i - 1] === '\\';
            if (!$escaped) {
                $inSingle = !$inSingle;
            }
        } elseif ($char === '"' && !$inSingle) {
            $escaped = $i > 0 && $sql[$i - 1] === '\\';
            if (!$escaped) {
                $inDouble = !$inDouble;
            }
        }

        if ($char === ';' && !$inSingle && !$inDouble) {
            $trimmed = trim($buffer);
            if ($trimmed !== '') {
                $statements[] = $trimmed;
            }
            $buffer = '';
            continue;
        }

        $buffer .= $char;
    }

    $trimmed = trim($buffer);
    if ($trimmed !== '') {
        $statements[] = $trimmed;
    }

    return $statements;
}

/**
 * 執行單一 migration SQL 檔案。
 *
 * @throws RuntimeException|PDOException
 */
function executeSqlMigrationFile(PDO $pdo, string $sqlFilePath): int
{
    if (!is_file($sqlFilePath)) {
        throw new RuntimeException('找不到 migration 檔案：' . $sqlFilePath);
    }

    $content = file_get_contents($sqlFilePath);
    if ($content === false) {
        throw new RuntimeException('讀取 migration 檔案失敗：' . $sqlFilePath);
    }

    $statements = splitSqlStatements($content);
    $executed = 0;

    foreach ($statements as $statementIndex => $statement) {
        $trimmed = trim($statement);
        if ($trimmed === '') {
            continue;
        }

        // migration 檔若包含 USE DB_NAME，套用時略過。
        if (preg_match('/^USE\s+/i', $trimmed) === 1) {
            continue;
        }

        try {
            $pdo->exec($trimmed);
        } catch (Throwable $exception) {
            $databaseMessage = preg_replace('/\s+/', ' ', trim($exception->getMessage()));
            if (!is_string($databaseMessage) || $databaseMessage === '') {
                $databaseMessage = '資料庫未提供詳細錯誤。';
            }
            if (strlen($databaseMessage) > 600) {
                $databaseMessage = substr($databaseMessage, 0, 600) . '…';
            }
            throw new RuntimeException(
                sprintf(
                    'Migration 執行失敗：%s（第 %d 個命令）。資料庫回覆：%s',
                    basename($sqlFilePath),
                    $statementIndex + 1,
                    $databaseMessage
                ),
                0,
                $exception
            );
        }
        $executed++;
    }

    return $executed;
}
