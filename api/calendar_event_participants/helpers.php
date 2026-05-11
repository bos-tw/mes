<?php
/**
 * 行事曆活動參與者 API - 共用輔助函式
 *
 * 提供行事曆活動參與者模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module calendar_event_participants
 * @table calendar_event_participants
 *
 * @functions
 * - validateParticipantData(): 驗證參與者輸入資料
 * - findParticipant(): 查詢單筆參與者
 * - transformParticipant(): 轉換為 API 回應格式
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

/**
 * 驗證參與者輸入資料
 */
function validateParticipantData(array $payload): array
{
    $errors = [];
    $data = [];

    // event_id - 必填
    $eventId = (int)($payload['event_id'] ?? 0);
    if ($eventId <= 0) {
        $errors['event_id'] = '事件 ID 為必填欄位。';
    } else {
        $data['event_id'] = $eventId;
    }

    // employee_id - 必填
    $employeeId = (int)($payload['employee_id'] ?? 0);
    if ($employeeId <= 0) {
        $errors['employee_id'] = '員工 ID 為必填欄位。';
    } else {
        $data['employee_id'] = $employeeId;
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * 查詢單筆參與者
 */
function findParticipant(int $eventId, int $employeeId): ?array
{
    $pdo = db();
    $stmt = $pdo->prepare('
        SELECT p.event_id, p.employee_id, e.title AS event_title, e.start_datetime, emp.name AS employee_name, emp.employee_number 
        FROM calendar_event_participants p 
        INNER JOIN dashboard_calendar_events e ON e.id = p.event_id AND e.deleted_at IS NULL 
        INNER JOIN employees emp ON emp.id = p.employee_id 
        WHERE p.event_id = :event_id AND p.employee_id = :employee_id
    ');
    $stmt->execute(['event_id' => $eventId, 'employee_id' => $employeeId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

/**
 * 轉換為 API 回應格式
 */
function transformParticipant(array $row): array
{
    return [
        'event_id' => (int)$row['event_id'],
        'employee_id' => (int)$row['employee_id'],
        'event_title' => $row['event_title'],
        'start_datetime' => $row['start_datetime'] ?? null,
        'employee_name' => $row['employee_name'],
        'employee_number' => $row['employee_number'] ?? null,
    ];
}
