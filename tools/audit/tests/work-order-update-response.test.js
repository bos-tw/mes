'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const updateApi = fs.readFileSync(path.join(ROOT, 'api', 'work_orders', 'update.php'), 'utf8');
const bootstrap = fs.readFileSync(path.join(ROOT, 'api', 'bootstrap.php'), 'utf8');

const dbInitIndex = updateApi.indexOf('$pdo = db();');
const validationIndex = updateApi.indexOf('validateWorkOrderData($pdo, $payload, true)');
const transactionIndex = updateApi.indexOf('$pdo->beginTransaction();');

assert.ok(dbInitIndex >= 0, '工單更新 API 必須先建立 PDO 連線');
assert.ok(validationIndex > dbInitIndex, '工單更新驗證不得在 PDO 初始化前執行');
assert.ok(transactionIndex > validationIndex, '資料驗證通過後才能開始工單更新交易');
assert.ok(/catch\s*\(Throwable\s+\$e\)/.test(updateApi), '工單更新 API 必須捕捉 PHP Error 與 Exception');
assert.ok(
    /if\s*\(\$pdo->inTransaction\(\)\)\s*\{\s*\$pdo->rollBack\(\);\s*\}/s.test(updateApi),
    '工單更新失敗時只能回滾仍在進行中的交易',
);
assert.ok(
    /function safeErrorMessage\(Throwable \$e,/.test(bootstrap),
    '共用安全錯誤訊息必須接受 Throwable，確保 PHP Error 仍回傳標準 JSON',
);

console.log('work-order-update-response.test.js passed');
