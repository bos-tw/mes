<?php
/**
 * Frontend cache version helper.
 *
 * Centralizes the asset version used by index.php and api/version.php so every
 * browser-visible frontend file participates in the same cache-busting token.
 */
declare(strict_types=1);

/**
 * @return array<int,string>
 */
function mesFrontendCacheScanTargets(string $baseDir): array
{
    return [
        $baseDir . '/js',
        $baseDir . '/core',
        $baseDir . '/modules',
        $baseDir . '/print',
        $baseDir . '/help',
        $baseDir . '/api/common',
        $baseDir . '/styles.css',
        $baseDir . '/script.js',
        $baseDir . '/index.php',
        $baseDir . '/login.html',
        $baseDir . '/login.js',
        $baseDir . '/login-fui.css',
        $baseDir . '/status_board.html',
        $baseDir . '/status_board.js',
        $baseDir . '/status_board.css',
        $baseDir . '/.htaccess',
    ];
}

function mesFrontendCacheStampPath(string $baseDir): string
{
    return $baseDir . '/uploads/system_updates/cache_version.json';
}

function mesReadFrontendCacheStampToken(string $baseDir): string
{
    $stampPath = mesFrontendCacheStampPath($baseDir);
    if (!is_file($stampPath)) {
        return '';
    }

    $raw = file_get_contents($stampPath);
    if (!is_string($raw) || trim($raw) === '') {
        return '';
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return '';
    }

    $token = preg_replace('/[^A-Za-z0-9_-]/', '', (string)($decoded['cache_token'] ?? '')) ?? '';
    return substr($token, 0, 48);
}

/**
 * @return array{version: string, generated_at: string, latest_mtime: int, stamp_token: string}
 */
function mesBuildFrontendCacheVersion(?string $baseDir = null): array
{
    $baseDir = $baseDir ?? dirname(__DIR__);
    $latestMtime = 0;
    $allowedExtensions = ['js', 'css', 'html'];

    clearstatcache();

    foreach (mesFrontendCacheScanTargets($baseDir) as $target) {
        if (!file_exists($target)) {
            continue;
        }

        if (is_file($target)) {
            $mtime = (int)filemtime($target);
            if ($mtime > $latestMtime) {
                $latestMtime = $mtime;
            }
            continue;
        }

        if (!is_dir($target)) {
            continue;
        }

        $iter = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($target, FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iter as $file) {
            if (!$file->isFile()) {
                continue;
            }

            $extension = strtolower($file->getExtension());
            if (!in_array($extension, $allowedExtensions, true)) {
                continue;
            }

            $mtime = (int)$file->getMTime();
            if ($mtime > $latestMtime) {
                $latestMtime = $mtime;
            }
        }
    }

    $stampPath = mesFrontendCacheStampPath($baseDir);
    if (is_file($stampPath)) {
        $stampMtime = (int)filemtime($stampPath);
        if ($stampMtime > $latestMtime) {
            $latestMtime = $stampMtime;
        }
    }

    $mtimeToken = $latestMtime > 0 ? substr(dechex($latestMtime), -8) : 'dev00000';
    $stampToken = mesReadFrontendCacheStampToken($baseDir);
    $version = $stampToken !== '' ? $mtimeToken . '-' . $stampToken : $mtimeToken;

    return [
        'version' => $version,
        'generated_at' => $latestMtime > 0 ? date('Y-m-d H:i:s', $latestMtime) : date('Y-m-d H:i:s'),
        'latest_mtime' => $latestMtime,
        'stamp_token' => $stampToken,
    ];
}
