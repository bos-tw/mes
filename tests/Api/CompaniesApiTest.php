<?php
/**
 * 公司 API 測試
 *
 * @file tests/Api/CompaniesApiTest.php
 */
declare(strict_types=1);

namespace Tests\Api;

class CompaniesApiTest extends ApiTestCase
{
    private const ENDPOINT = '/companies/';

    /**
     * 測試取得公司列表
     */
    public function testGetCompaniesList(): void
    {
        $response = $this->client->get(self::ENDPOINT);

        $this->assertResponseSuccess($response);
        $this->assertResponseHasData($response);
    }

    /**
     * 測試公開公司資訊 API（無需認證）
     */
    public function testPublicCompanyInfo(): void
    {
        // 公開 API 不需要認證
        $ch = curl_init(TEST_BASE_URL . self::ENDPOINT . 'public_info.php');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => true,
        ]);
        $response = curl_exec($ch);
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $headers = substr($response, 0, $headerSize);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        // 驗證安全標頭
        $this->assertStringContainsString('X-Frame-Options: DENY', $headers);
        $this->assertStringContainsString('X-Content-Type-Options: nosniff', $headers);
        $this->assertEquals(200, $httpCode);
    }

    /**
     * 測試公開 API 只允許 GET 方法
     */
    public function testPublicApiOnlyAllowsGet(): void
    {
        $ch = curl_init(TEST_BASE_URL . self::ENDPOINT . 'public_info.php');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode(['test' => 'data']),
        ]);
        curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $this->assertEquals(405, $httpCode); // Method Not Allowed
    }

    /**
     * 測試新增公司
     */
    public function testCreateCompany(): int
    {
        $data = [
            'company_name' => '測試公司_' . time(),
            'company_short_name' => 'TEST',
            'tax_id' => '1234567' . rand(10, 99),
        ];

        $response = $this->client->post(self::ENDPOINT, $data);

        $this->assertResponseSuccess($response, 201);
        $this->assertResponseHasData($response);

        return (int) $response['body']['data']['id'];
    }

    /**
     * 測試更新公司
     * @depends testCreateCompany
     */
    public function testUpdateCompany(int $id): void
    {
        $data = [
            'company_name' => '更新公司名稱_' . time(),
        ];

        $response = $this->client->put(self::ENDPOINT . "update.php?id={$id}", $data);

        $this->assertResponseSuccess($response);
    }

    /**
     * 測試刪除公司
     * @depends testCreateCompany
     */
    public function testDeleteCompany(int $id): void
    {
        $response = $this->client->delete(self::ENDPOINT . "delete.php", ['id' => $id]);

        $this->assertResponseSuccess($response);
    }
}
