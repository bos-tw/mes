---
applyTo: "print/**"
---

# 訂單列印功能規範

> 完整規範：`.github/skills/order-print.md`

## 列印範本 fetch() 必要設定

**所有列印範本中的 API 呼叫必須包含 `credentials: 'include'`**，否則 Cookie 不會隨請求傳送，導致 API 回傳 401。

```javascript
// ✅ 正確
const res = await fetch('../api/report_descriptions/get.php?report_code=xxx', {
    credentials: 'include'
});

// ❌ 錯誤
const res = await fetch('../api/report_descriptions/get.php?report_code=xxx');
```

## loadReportDescription() 標準實作

```javascript
async function loadReportDescription(reportCode) {
    try {
        const res = await fetch(
            `../api/report_descriptions/get.php?report_code=${reportCode}`,
            { credentials: 'include' }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !data.data) return;

        const desc = data.data;
        // 依各欄位名稱填入頁面對應元素
        if (desc.terms_and_conditions) {
            document.querySelector('[data-field="terms"]').textContent = desc.terms_and_conditions;
        }
    } catch (e) {
        console.warn('載入報表描述失敗:', e);
    }
}
```

## 列印範本呼叫時機

```javascript
// 在主資料載入完成後呼叫
async function loadOrderData(orderId) {
    const res = await fetch(`../api/orders/show.php?id=${orderId}`, {
        credentials: 'include'
    });
    const data = await res.json();
    renderOrder(data.data);

    // 資料填入後再載入報表描述
    await loadReportDescription('order_confirmation');
}
```

## report_code 對照表

| 列印範本 | report_code |
|----------|-------------|
| 訂單確認單 | `order_confirmation` |
| 工單 | `work_order` |
| 出貨單 | `shipping_order` |
| 退貨單 | `return_order` |

## CSRF Token 注意事項

- 列印範本（獨立視窗）無法取得主頁面的 `sessionStorage`（跨分頁不共享）
- GET 請求不需要 CSRF Token
- 若需要 POST，改用 Cookie-based CSRF 機制

## API 路徑規範

```javascript
// ✅ 相對路徑（print/ 資料夾中的範本）
fetch('../api/xxx/yyy.php', ...)

// ⚠️ 確認層級正確，若範本移動位置需更新路徑
```
