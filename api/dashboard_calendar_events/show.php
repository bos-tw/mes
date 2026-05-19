<?php
/**
 * 行事曆事件 API - 單筆查詢端點
 *
 * @endpoint GET /api/dashboard_calendar_events/show.php?id={id}
 *
 * @auth 必須登入
 * @table dashboard_calendar_events
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/helpers.php';

requireAuth();

requireMethod('GET');

$currentEmployeeId = getCurrentEmployeeIdOrFail();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    jsonResponse([
        'success' => false,
        'message' => '無效的 ID。',
    ], 400);
}

$event = findCalendarEvent($id, $currentEmployeeId);
if ($event === null) {
    jsonResponse([
        'success' => false,
        'message' => '找不到指定的行事曆事件。',
    ], 404);
}

jsonResponse([
    'success' => true,
    'data' => transformCalendarEvent($event),
]);
