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

        $fileCount = 0;
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

    foreach ($statements as $statement) {
        $trimmed = trim($statement);
        if ($trimmed === '') {
            continue;
        }

        // migration 檔若包含 USE DB_NAME，套用時略過。
        if (preg_match('/^USE\s+/i', $trimmed) === 1) {
            continue;
        }

        $pdo->exec($trimmed);
        $executed++;
    }

    return $executed;
}
