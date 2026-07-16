<?php
/**
 * API 測試基礎類別
 *
 * @file tests/Api/ApiTestCase.php
 */
declare(strict_types=1);

namespace Tests\Api;

use PHPUnit\Framework\TestCase;
use TestHttpClient;

abstract class ApiTestCase extends TestCase
{
    protected TestHttpClient $client;
    protected ?string $authToken = null;

    protected function setUp(): void
    {
        parent::setUp();
        if (getenv('MES_RUN_HTTP_API_TESTS') !== '1') {
            $this->markTestSkipped('HTTP API 測試需以 MES_RUN_HTTP_API_TESTS=1 啟動隔離測試服務。');
        }
        $this->client = new TestHttpClient();

        // 如果需要認證，先登入取得 token
        if ($this->requiresAuth()) {
            $this->login();
        }
    }

    protected function requiresAuth(): bool
    {
        return true;
    }

    protected function login(string $username = 'admin', string $password = 'admin123'): void
    {
        $response = $this->client->post('/login.php', [
            'username' => $username,
            'password' => $password,
        ]);

        if ($response['status'] === 200 && !empty($response['body']['token'])) {
            $this->authToken = $response['body']['token'];
            $this->client->setAuthToken($this->authToken);
        }
    }

    /**
     * 斷言回應成功
     */
    protected function assertResponseSuccess(array $response, int $expectedStatus = 200): void
    {
        $this->assertEquals($expectedStatus, $response['status'], 
            "Expected status {$expectedStatus}, got {$response['status']}. Response: " . json_encode($response['body']));
        $this->assertTrue($response['body']['success'] ?? false, 
            "Response not successful: " . json_encode($response['body']));
    }

    /**
     * 斷言回應失敗
     */
    protected function assertResponseError(array $response, int $expectedStatus = 400): void
    {
        $this->assertEquals($expectedStatus, $response['status']);
        $this->assertFalse($response['body']['success'] ?? true);
        $this->assertArrayHasKey('message', $response['body']);
    }

    /**
     * 斷言回應包含資料
     */
    protected function assertResponseHasData(array $response): void
    {
        $this->assertArrayHasKey('data', $response['body']);
    }

    /**
     * 斷言回應包含分頁資訊
     */
    protected function assertResponseHasPagination(array $response): void
    {
        $this->assertArrayHasKey('pagination', $response['body']);
        $pagination = $response['body']['pagination'];
        $this->assertArrayHasKey('page', $pagination);
        $this->assertArrayHasKey('perPage', $pagination);
        $this->assertArrayHasKey('total', $pagination);
        $this->assertArrayHasKey('totalPages', $pagination);
    }
}
