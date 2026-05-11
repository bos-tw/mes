<?php
/**
 * 儀表板行事曆活動 API - 共用輔助函式
 *
 * 提供儀表板行事曆活動模組使用的驗證、資料轉換、查詢等輔助函式。
 *
 * @module dashboard_calendar_events
 * @table dashboard_calendar_events
 *
 * @functions
 * - validateCalendarEventData(): 驗證並正規化行事曆事件輸入資料
 * - findCalendarEvent(): 查詢單筆行事曆事件
 * - transformCalendarEvent(): 轉換為 API 回應格式
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

/**
 * 驗證並正規化行事曆事件輸入資料
 */
function validateCalendarEventData(array $payload, bool $isUpdate = false): array
{
    $errors = [];
    $data = [];

    // event_type - 必填
    $eventType = trim((string)($payload['event_type'] ?? ''));
    if ($eventType === '') {
        if (!$isUpdate) {
            $errors['event_type'] = '事件類型為必填欄位。';
        }
    } elseif (strlen($eventType) > 50) {
        $errors['event_type'] = '事件類型不可超過 50 個字元。';
    } else {
        $data['event_type'] = $eventType;
    }

    // title - 必填
    $title = trim((string)($payload['title'] ?? ''));
    if ($title === '') {
        if (!$isUpdate) {
            $errors['title'] = '事件標題為必填欄位。';
        }
    } elseif (strlen($title) > 200) {
        $errors['title'] = '事件標題不可超過 200 個字元。';
    } else {
        $data['title'] = $title;
    }

    // description - 選填
    if (isset($payload['description'])) {
        $data['description'] = trim((string)$payload['description']) ?: null;
    }

    // start_datetime - 必填
    $startDatetime = trim((string)($payload['start_datetime'] ?? ''));
    if ($startDatetime === '') {
        if (!$isUpdate) {
            $errors['start_datetime'] = '開始時間為必填欄位。';
        }
    } elseif (!strtotime($startDatetime)) {
        $errors['start_datetime'] = '開始時間格式無效。';
    } else {
        $data['start_datetime'] = date('Y-m-d H:i:s', strtotime($startDatetime));
    }

    // end_datetime - 選填
    if (isset($payload['end_datetime']) && $payload['end_datetime'] !== '') {
        $endDatetime = trim((string)$payload['end_datetime']);
        if (!strtotime($endDatetime)) {
            $errors['end_datetime'] = '結束時間格式無效。';
        } else {
            $data['end_datetime'] = date('Y-m-d H:i:s', strtotime($endDatetime));
        }
    } elseif (array_key_exists('end_datetime', $payload)) {
        $data['end_datetime'] = null;
    }

    // is_all_day - 選填
    if (isset($payload['is_all_day'])) {
        $data['is_all_day'] = $payload['is_all_day'] ? 1 : 0;
    }

    // status - 選填
    if (isset($payload['status'])) {
        $status = trim((string)$payload['status']);
        if (strlen($status) > 50) {
            $errors['status'] = '狀態不可超過 50 個字元。';
        } else {
            $data['status'] = $status ?: null;
        }
    }

    // priority - 選填
    if (isset($payload['priority'])) {
        $priority = trim((string)$payload['priority']);
        if (strlen($priority) > 50) {
            $errors['priority'] = '優先級不可超過 50 個字元。';
        } else {
            $data['priority'] = $priority ?: null;
        }
    }

    // color - 選填
    if (isset($payload['color'])) {
        $color = trim((string)$payload['color']);
        if ($color !== '' && !preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
            $errors['color'] = '顏色格式無效（應為 #RRGGBB）。';
        } else {
            $data['color'] = $color ?: '#3788d8';
        }
    }

    // reference_id - 選填
    if (isset($payload['reference_id'])) {
        $referenceId = $payload['reference_id'];
        if ($referenceId !== null && $referenceId !== '') {
            $data['reference_id'] = (int)$referenceId;
        } else {
            $data['reference_id'] = null;
        }
    }

    return ['data' => $data, 'errors' => $errors];
}

/**
 * 查詢單筆行事曆事件
 */
function findCalendarEvent(int $id): ?array
{
    $pdo = db();
    $stmt = $pdo->prepare('
        SELECT e.*, emp.name AS creator_name 
        FROM dashboard_calendar_events e 
        LEFT JOIN employees emp ON emp.id = e.created_by_employee_id 
        WHERE e.id = :id AND e.deleted_at IS NULL
    ');
    $stmt->execute(['id' => $id]);
    $row = $stmt->fetch();
    return $row ?: null;
}

/**
 * 轉換為 API 回應格式
 */
function transformCalendarEvent(array $row): array
{
    return [
        'id' => (int)$row['id'],
        'event_type' => $row['event_type'],
        'reference_id' => $row['reference_id'] ? (int)$row['reference_id'] : null,
        'title' => $row['title'],
        'description' => $row['description'],
        'start_datetime' => $row['start_datetime'],
        'end_datetime' => $row['end_datetime'],
        'is_all_day' => (bool)$row['is_all_day'],
        'status' => $row['status'],
        'priority' => $row['priority'],
        'color' => $row['color'],
        'created_by_employee_id' => $row['created_by_employee_id'] ? (int)$row['created_by_employee_id'] : null,
        'creator_name' => $row['creator_name'] ?? null,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}
