<?php
/**
 * PHPUnit 測試啟動檔
 *
 * @file tests/bootstrap.php
 */
declare(strict_types=1);

// 載入 Composer autoloader
require_once __DIR__ . '/../vendor/autoload.php';

// 設定測試環境
$_ENV['APP_ENV'] = 'testing';

// 載入測試用的設定
define('TEST_BASE_URL', 'http://localhost/mes/api');

/**
 * 測試用的 HTTP 請求類別
 */
class TestHttpClient
{
    private string $baseUrl;
    private ?string $authToken = null;

    public function __construct(string $baseUrl = TEST_BASE_URL)
    {
        $this->baseUrl = $baseUrl;
    }

    public function setAuthToken(string $token): void
    {
        $this->authToken = $token;
    }

    public function get(string $endpoint, array $params = []): array
    {
        $url = $this->baseUrl . $endpoint;
        if ($params) {
            $url .= '?' . http_build_query($params);
        }
        return $this->request('GET', $url);
    }

    public function post(string $endpoint, array $data = []): array
    {
        return $this->request('POST', $this->baseUrl . $endpoint, $data);
    }

    public function put(string $endpoint, array $data = []): array
    {
        return $this->request('PUT', $this->baseUrl . $endpoint, $data);
    }

    public function delete(string $endpoint, array $params = []): array
    {
        $url = $this->baseUrl . $endpoint;
        if ($params) {
            $url .= '?' . http_build_query($params);
        }
        return $this->request('DELETE', $url);
    }

    private function request(string $method, string $url, ?array $data = null): array
    {
        $ch = curl_init();

        $headers = [
            'Content-Type: application/json',
            'Accept: application/json',
        ];

        if ($this->authToken) {
            $headers[] = 'Authorization: Bearer ' . $this->authToken;
        }

        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30,
        ]);

        if ($data !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new RuntimeException("cURL Error: {$error}");
        }

        return [
            'status' => $httpCode,
            'body' => json_decode($response, true) ?? [],
            'raw' => $response,
        ];
    }
}

/**
 * 測試用的資料庫連線
 */
function getTestDb(): PDO
{
    static $pdo = null;

    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=localhost;dbname=yucyuan_test;charset=utf8mb4',
            'root',
            '',
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
    }

    return $pdo;
}
