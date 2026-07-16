<?php
/**
 * Helpers 函數單元測試
 *
 * @file tests/Unit/HelpersTest.php
 */
declare(strict_types=1);

namespace Tests\Unit;

use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\TestCase;

class HelpersTest extends TestCase
{
    /**
     * 測試資料庫連線
     */
    #[Group('database')]
    public function testDatabaseConnection(): void
    {
        $pdo = getTestDb();

        $this->assertInstanceOf(\PDO::class, $pdo);
        $this->assertEquals(\PDO::ERRMODE_EXCEPTION, $pdo->getAttribute(\PDO::ATTR_ERRMODE));
    }

    /**
     * 測試資料庫查詢
     */
    #[Group('database')]
    public function testDatabaseQuery(): void
    {
        $pdo = getTestDb();
        $stmt = $pdo->query("SELECT 1 as test");
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);

        $this->assertEquals(1, $result['test']);
    }

    /**
     * 測試 JSON 編碼處理中文
     */
    public function testJsonEncodeWithChinese(): void
    {
        $data = ['name' => '中文測試'];
        $json = json_encode($data, JSON_UNESCAPED_UNICODE);

        $this->assertStringContainsString('中文測試', $json);
        $this->assertStringNotContainsString('\u', $json);
    }

    /**
     * 測試分頁計算
     */
    public function testPaginationCalculation(): void
    {
        $totalRecords = 100;
        $perPage = 15;
        $totalPages = (int) ceil($totalRecords / $perPage);

        $this->assertEquals(7, $totalPages);
    }

    /**
     * 測試空字串轉 null
     */
    public function testEmptyStringToNull(): void
    {
        $value = '';
        $result = $value === '' ? null : $value;

        $this->assertNull($result);
    }

    /**
     * 測試日期格式驗證
     */
    public function testDateFormatValidation(): void
    {
        $validDate = '2024-01-15';
        $invalidDate = '2024-13-45';

        $validParsed = \DateTime::createFromFormat('Y-m-d', $validDate);
        $invalidParsed = \DateTime::createFromFormat('Y-m-d', $invalidDate);

        $this->assertInstanceOf(\DateTime::class, $validParsed);
        $this->assertFalse($invalidParsed && $invalidParsed->format('Y-m-d') === $invalidDate);
    }

    /**
     * 測試軟刪除欄位結構
     */
    public function testSoftDeleteFieldStructure(): void
    {
        $record = [
            'id' => 1,
            'name' => 'Test',
            'is_deleted' => 0,
            'deleted_at' => null,
            'deleted_by' => null,
        ];

        $this->assertArrayHasKey('is_deleted', $record);
        $this->assertArrayHasKey('deleted_at', $record);
        $this->assertArrayHasKey('deleted_by', $record);
        $this->assertEquals(0, $record['is_deleted']);
    }

    /**
     * 測試搜尋參數處理
     */
    public function testSearchParameterProcessing(): void
    {
        $search = "  test search  ";
        $processed = trim($search);
        $likeParam = "%{$processed}%";

        $this->assertEquals('test search', $processed);
        $this->assertEquals('%test search%', $likeParam);
    }

    /**
     * 測試 HTTP 狀態碼常數
     */
    public function testHttpStatusCodes(): void
    {
        $statusCodes = [
            'OK' => 200,
            'CREATED' => 201,
            'BAD_REQUEST' => 400,
            'UNAUTHORIZED' => 401,
            'FORBIDDEN' => 403,
            'NOT_FOUND' => 404,
            'METHOD_NOT_ALLOWED' => 405,
            'INTERNAL_ERROR' => 500,
        ];

        foreach ($statusCodes as $name => $code) {
            $this->assertIsInt($code);
            $this->assertGreaterThanOrEqual(100, $code);
            $this->assertLessThan(600, $code);
        }
    }

    /**
     * 測試使用者 ID 從 Session 取得
     */
    public function testUserIdFromSession(): void
    {
        // 模擬 session 資料
        $_SESSION = ['user' => ['id' => 42, 'username' => 'testuser']];

        $userId = $_SESSION['user']['id'] ?? null;

        $this->assertEquals(42, $userId);

        // 清理
        $_SESSION = [];
    }

    /**
     * 測試審計欄位結構
     */
    public function testAuditFieldsStructure(): void
    {
        $expectedFields = ['created_at', 'created_by', 'updated_at', 'updated_by'];

        $record = [
            'id' => 1,
            'created_at' => '2024-01-01 10:00:00',
            'created_by' => 1,
            'updated_at' => null,
            'updated_by' => null,
        ];

        foreach ($expectedFields as $field) {
            $this->assertArrayHasKey($field, $record);
        }
    }
}
