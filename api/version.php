<?php
/**
 * 系統版本端點
 *
 * 自動偵測前端資源的最新修改時間，產生版本識別碼。
 * 供用戶端輪詢判斷是否需要重新整理頁面。
 *
 * 不需要驗證（僅回傳版本字串，無敏感資訊）。
 *
 * @return JSON {"version": "xxxxxxxx", "generated_at": "..."}
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');

$baseDir = dirname(__DIR__);

// 掃描這些目錄/檔案的最新修改時間
$scanTargets = [
    $baseDir . '/js',
    $baseDir . '/core',
    $baseDir . '/api/common',
    $baseDir . '/styles.css',
    $baseDir . '/script.js',
    $baseDir . '/index.php',
    $baseDir . '/print.html',
];

$latestMtime = 0;

foreach ($scanTargets as $target) {
    if (!file_exists($target)) {
        continue;
    }

    if (is_file($target)) {
        $mtime = filemtime($target);
        if ($mtime > $latestMtime) {
            $latestMtime = $mtime;
        }
    } elseif (is_dir($target)) {
        $iter = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($target, FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iter as $file) {
            if ($file->isFile() && in_array($file->getExtension(), ['js', 'css', 'html'], true)) {
                $mtime = $file->getMTime();
                if ($mtime > $latestMtime) {
                    $latestMtime = $mtime;
                }
            }
        }
    }
}

// 取 8 位十六進位版本碼（從時間戳產生，無需設定，自動更新）
$version = $latestMtime > 0 ? substr(dechex($latestMtime), -8) : 'dev00000';

echo json_encode([
    'version'      => $version,
    'generated_at' => date('Y-m-d H:i:s', $latestMtime),
], JSON_UNESCAPED_UNICODE);
