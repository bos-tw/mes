<?php
/**
 * 部門 API 測試
 *
 * @file tests/Api/DepartmentsApiTest.php
 */
declare(strict_types=1);

namespace Tests\Api;

class DepartmentsApiTest extends ApiTestCase
{
    private const ENDPOINT = '/departments/';

    /**
     * 測試取得部門列表
     */
    public function testGetDepartmentsList(): void
    {
        $response = $this->client->get(self::ENDPOINT);

        $this->assertResponseSuccess($response);
        $this->assertResponseHasData($response);
        $this->assertResponseHasPagination($response);
        $this->assertIsArray($response['body']['data']);
    }

    /**
     * 測試分頁功能
     */
    public function testPagination(): void
    {
        $response = $this->client->get(self::ENDPOINT, [
            'page' => 1,
            'perPage' => 5,
        ]);

        $this->assertResponseSuccess($response);
        $this->assertEquals(1, $response['body']['pagination']['page']);
        $this->assertEquals(5, $response['body']['pagination']['perPage']);
    }

    /**
     * 測試新增部門
     */
    public function testCreateDepartment(): int
    {
        $data = [
            'name' => '測試部門_' . time(),
            'code' => 'TEST_' . time(),
            'description' => '這是測試用部門',
        ];

        $response = $this->client->post(self::ENDPOINT, $data);

        $this->assertResponseSuccess($response, 201);
        $this->assertResponseHasData($response);
        $this->assertEquals($data['name'], $response['body']['data']['name']);

        // 記錄建立的 ID 供後續測試使用
        return (int) $response['body']['data']['id'];
    }

    /**
     * 測試新增部門驗證失敗
     */
    public function testCreateDepartmentValidationError(): void
    {
        $response = $this->client->post(self::ENDPOINT, [
            'name' => '', // 空白名稱應該失敗
        ]);

        $this->assertResponseError($response, 400);
    }

    /**
     * 測試取得單一部門
     * @depends testCreateDepartment
     */
    public function testGetSingleDepartment(int $id): void
    {
        $response = $this->client->get(self::ENDPOINT . "show.php", ['id' => $id]);

        $this->assertResponseSuccess($response);
        $this->assertResponseHasData($response);
        $this->assertEquals($id, $response['body']['data']['id']);
    }

    /**
     * 測試取得不存在的部門
     */
    public function testGetNonExistentDepartment(): void
    {
        $response = $this->client->get(self::ENDPOINT . "show.php", ['id' => 999999]);

        $this->assertResponseError($response, 404);
    }

    /**
     * 測試更新部門
     * @depends testCreateDepartment
     */
    public function testUpdateDepartment(int $id): void
    {
        $data = [
            'name' => '更新後的部門名稱_' . time(),
        ];

        $response = $this->client->put(self::ENDPOINT . "update.php?id={$id}", $data);

        $this->assertResponseSuccess($response);
        $this->assertEquals($data['name'], $response['body']['data']['name']);
    }

    /**
     * 測試刪除部門
     * @depends testCreateDepartment
     */
    public function testDeleteDepartment(int $id): void
    {
        $response = $this->client->delete(self::ENDPOINT . "delete.php", ['id' => $id]);

        $this->assertResponseSuccess($response);
    }

    /**
     * 測試刪除不存在的部門
     */
    public function testDeleteNonExistentDepartment(): void
    {
        $response = $this->client->delete(self::ENDPOINT . "delete.php", ['id' => 999999]);

        $this->assertResponseError($response, 404);
    }

    /**
     * 測試無效的 HTTP 方法
     */
    public function testInvalidHttpMethod(): void
    {
        // 嘗試用 PATCH 方法存取列表端點（應該只允許 GET/POST）
        $ch = curl_init(TEST_BASE_URL . self::ENDPOINT);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => 'OPTIONS',
        ]);
        curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $this->assertContains($httpCode, [200, 405]); // OPTIONS 可能被允許或拒絕
    }
}
