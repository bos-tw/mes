<?php
declare(strict_types=1);

// ⚠️ 此為範本檔案，請複製為 config.php 後填入本機設定
// cp api/config.php.example api/config.php
//
// 正式環境請透過以下環境變數注入憑證，勿將真實密碼提交至版本庫：
//   SCREWSYSTEM_DB_HOST
//   SCREWSYSTEM_DB_PORT
//   SCREWSYSTEM_DB_NAME
//   SCREWSYSTEM_DB_USER
//   SCREWSYSTEM_DB_PASSWORD

// Database configuration with environment variable overrides
const DB_HOST = 'localhost';
const DB_PORT = 3306;
const DB_NAME = 'yucyuan';
const DB_USER = 'root';
const DB_PASSWORD = '1q2w3e4r';

const DB_CHARSET = 'utf8mb4';

// Session configuration
const SESSION_NAME = 'MESSESSID';
const SESSION_LIFETIME = 0;                // Browser session cookie
const SESSION_IDLE_TIMEOUT = 1800;         // 30 minutes
const SESSION_REMEMBER_ME_LIFETIME = 2592000; // 30 days

const DB_ENV_MAP = [
    'host'     => 'SCREWSYSTEM_DB_HOST',
    'port'     => 'SCREWSYSTEM_DB_PORT',
    'name'     => 'SCREWSYSTEM_DB_NAME',
    'user'     => 'SCREWSYSTEM_DB_USER',
    'password' => 'SCREWSYSTEM_DB_PASSWORD',
];

/**
 * Resolve configuration by checking environment variables first.
 */
function getDatabaseConfig(): array
{
    $config = [
        'host'     => DB_HOST,
        'port'     => DB_PORT,
        'dbname'   => DB_NAME,
        'user'     => DB_USER,
        'password' => DB_PASSWORD,
        'charset'  => DB_CHARSET,
    ];

    foreach (DB_ENV_MAP as $key => $envKey) {
        $value = getenv($envKey);
        if ($value !== false && $value !== '') {
            if ($key === 'port') {
                $config[$key] = (int) $value;
            } else {
                $config[$key === 'name' ? 'dbname' : $key] = $value;
            }
        }
    }

    return $config;
}
