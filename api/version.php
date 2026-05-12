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

require_once __DIR__ . '/cache_version.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

$cacheVersion = mesBuildFrontendCacheVersion(dirname(__DIR__));

echo json_encode([
    'version'      => $cacheVersion['version'],
    'generated_at' => $cacheVersion['generated_at'],
], JSON_UNESCAPED_UNICODE);
