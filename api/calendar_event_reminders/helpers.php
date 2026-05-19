<?php
/**
 * 行事曆活動提醒 API - 共用輔助函式
 *
 * 提供行事曆活動提醒模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module calendar_event_reminders
 * @table calendar_event_reminders
 *
 * @functions
 * - validateReminderData(): 驗證提醒輸入資料
 * - findReminder(): 查詢單筆提醒
 * - transformReminder(): 轉換為 API 回應格式
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

/**
 * 取得目前登入員工 ID，若不存在則回傳 401。
 */
function getCurrentEmployeeIdOrFail(): int
{
    $employee = $_SESSION['employee'] ?? null;
    if (is_array($employee)) {
        $employeeId = (int)($employee['id'] ?? 0);
        if ($employeeId > 0) {
            return $employeeId;
        }
    }

    $legacyEmployeeId = $_SESSION['user']['employee_id'] ?? null;
    if ($legacyEmployeeId !== null) {
        $employeeId = (int)$legacyEmployeeId;
        if ($employeeId > 0) {
            return $employeeId;
        }
    }

    jsonResponse([
        'success' => false,
        'message' => '尚未登入或登入已過期。',
    ], 401);

    return 0;
}

/**
 * 查詢目前登入者是否擁有指定行事曆事件。
 */
function findOwnedCalendarEvent(int $eventId, int $ownerEmployeeId): ?array
{
    $pdo = db();
    $stmt = $pdo->prepare('
        SELECT id, created_by_employee_id
        FROM dashboard_calendar_events
        WHERE id = :id
            AND deleted_at IS NULL
            AND created_by_employee_id = :owner_employee_id
        LIMIT 1
    ');
    $stmt->execute([
        'id' => $eventId,
        'owner_employee_id' => $ownerEmployeeId,
    ]);
    $row = $stmt->fetch();
    return $row ?: null;
}

/**
 * 驗證提醒輸入資料
 */
function validateReminderData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // event_id - 必填
    if (!$isUpdate || isset($payload['event_id'])) {
        $eventId = (int)($payload['event_id'] ?? 0);
        if ($eventId <= 0 && !$isUpdate) {
            $errors['event_id'] = '事件 ID 為必填欄位。';
        } elseif ($eventId > 0) {
            $data['event_id'] = $eventId;
        }
    }

    // employee_id - 個人模式下由後端自動帶入，若有傳入則驗證格式
    if (array_key_exists('employee_id', $payload)) {
        $employeeId = (int)($payload['employee_id'] ?? 0);
        if ($employeeId <= 0) {
            $errors['employee_id'] = '員工 ID 格式無效。';
        } else {
            $data['employee_id'] = $employeeId;
        }
    }

    // reminder_datetime - 必填
    if (!$isUpdate || isset($payload['reminder_datetime'])) {
        $reminderDatetime = trim((string)($payload['reminder_datetime'] ?? ''));
        if ($reminderDatetime === '' && !$isUpdate) {
            $errors['reminder_datetime'] = '提醒時間為必填欄位。';
        } elseif ($reminderDatetime !== '' && !strtotime($reminderDatetime)) {
            $errors['reminder_datetime'] = '提醒時間格式無效。';
        } elseif ($reminderDatetime !== '') {
            $data['reminder_datetime'] = date('Y-m-d H:i:s', strtotime($reminderDatetime));
        }
    }

    // reminder_type - 選填
    if (isset($payload['reminder_type'])) {
        $reminderType = trim((string)$payload['reminder_type']);
        if (strlen($reminderType) > 50) {
            $errors['reminder_type'] = '提醒方式不可超過 50 個字元。';
        } else {
            $data['reminder_type'] = $reminderType ?: null;
        }
    }

    // is_sent - 選填（更新時）
    if ($isUpdate && isset($payload['is_sent'])) {
        $data['is_sent'] = $payload['is_sent'] ? 1 : 0;
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * 查詢單筆提醒
 */
function findReminder(int $id, ?int $employeeId = null): ?array
{
    $pdo = db();
    $sql = '
        SELECT r.*, e.title AS event_title, e.start_datetime AS event_start, emp.name AS employee_name
        FROM calendar_event_reminders r
        INNER JOIN dashboard_calendar_events e ON e.id = r.event_id AND e.deleted_at IS NULL
        LEFT JOIN employees emp ON emp.id = r.employee_id
        WHERE r.id = :id
    ';

    $params = ['id' => $id];
    if ($employeeId !== null) {
        $sql .= ' AND r.employee_id = :employee_id';
        $params['employee_id'] = $employeeId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch();
    return $row ?: null;
}

/**
 * 轉換為 API 回應格式
 */
function transformReminder(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'event_id' => (int)$row['event_id'],
        'employee_id' => (int)$row['employee_id'],
        'event_title' => $row['event_title'] ?? null,
        'event_start' => $row['event_start'] ?? null,
        'employee_name' => $row['employee_name'] ?? null,
        'reminder_datetime' => $row['reminder_datetime'],
        'reminder_type' => $row['reminder_type'],
        'is_sent' => (bool)$row['is_sent'],
        'sent_at' => $row['sent_at'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}
