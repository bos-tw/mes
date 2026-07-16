# Native Feedback Audit

- 共用 AppFeedback 呼叫：64
- 保留的同步未儲存導覽守門：14
- 未遷移的原生危險操作／一般提示：0

同步未儲存守門必須在分頁關閉事件中立即回傳 boolean，因此保留瀏覽器原生 confirm；所有可非同步的危險操作均使用具流程節點、影響範圍、焦點管理與 ARIA 的 AppFeedback modal。

- script.js:826 — 允許：未儲存導覽守門 — return window.confirm('此分頁有尚未儲存的資料，若直接關閉將會遺失。確定要繼續關閉嗎？');
- js/companies.js:613 — 允許：未儲存導覽守門 — const confirmed = window.confirm('表單資料尚未儲存，確定要關閉嗎？');
- js/customers.js:1167 — 允許：未儲存導覽守門 — const confirmed = window.confirm('表單資料尚未儲存，確定要關閉嗎？');
- js/employees.js:719 — 允許：未儲存導覽守門 — const confirmed = window.confirm('表單資料尚未儲存，確定要關閉嗎？');
- js/machines.js:624 — 允許：未儲存導覽守門 — const confirmed = window.confirm('表單資料尚未儲存，確定要關閉嗎？');
- js/messages.js:1186 — 允許：未儲存導覽守門 — if (!window.confirm('表單資料尚未儲存，確定要關閉嗎？')) {
- js/notifications.js:670 — 允許：未儲存導覽守門 — if (!window.confirm('表單資料尚未儲存，確定要關閉嗎？')) {
- js/permissions.js:357 — 允許：未儲存導覽守門 — const confirmed = window.confirm('表單資料尚未儲存，確定要關閉嗎？');
- js/production_quality_records.js:604 — 允許：未儲存導覽守門 — const confirmed = window.confirm('表單資料尚未儲存，確定要關閉嗎？');
- js/roles.js:358 — 允許：未儲存導覽守門 — const confirmed = window.confirm('表單資料尚未儲存，確定要關閉嗎？');
- js/screening_services.js:444 — 允許：未儲存導覽守門 — const confirmed = window.confirm('表單資料尚未儲存，確定要關閉嗎？');
- js/suppliers.js:823 — 允許：未儲存導覽守門 — const confirmed = window.confirm('表單資料尚未儲存,確定要關閉嗎?');
- js/tools.js:493 — 允許：未儲存導覽守門 — const confirmed = window.confirm('表單資料尚未儲存，確定要關閉嗎？');
- js/work_orders.js:846 — 允許：未儲存導覽守門 — return window.confirm('目前有尚未儲存的工單資料，若直接關閉將會遺失。確定要繼續關閉嗎？');
