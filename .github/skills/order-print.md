# 訂單列印功能規範

本文件定義訂單確認單（客戶代工委託確認單）的列印功能規範。

---

## 1. 功能概述

### 1.1 用途
- 列印「客戶代工委託確認單」供客戶簽核確認
- 支援單筆列印與批次列印

### 1.2 列印範本
- 檔案位置：`print/order_confirmation_print.html`
- 紙張尺寸：A4 (210mm × 297mm)
- 邊距：10mm

---

## 2. 資料來源與欄位對應

### 2.1 資料表關聯
```
orders (訂單主表)
  └── order_items (訂單明細，一對多)
        └── screening_details (篩分明細)
```

### 2.2 欄位對應表

| 列印區塊 | 顯示欄位 | 資料來源 | API 欄位路徑 |
|----------|----------|----------|--------------|
| **客戶資訊區** | | | |
| 客戶名稱 | `customer.name` | customers | `data.customer.name` |
| 客戶地址 | `customer.address` | customers | `data.customer.address` |
| 客戶電話 | `customer.phone` | customers | `data.customer.phone` |
| 聯絡窗口 | `customer.contact_person` | customers | `data.customer.contact_person` |
| **訂單資訊區** | | | |
| 訂單編號 | `order_number` | orders | `data.order_number` |
| 訂單日期 | `order_date` | orders | `data.order_date` (轉民國年格式) |
| 客戶PO號 | `customer_po_number` | orders | `data.customer_po_number` |
| 預計交期 | `expected_delivery_date` | orders | `data.expected_delivery_date` |
| 狀態 | `status` | orders | `data.status_label` |
| **批號明細表** | | | |
| 批號 | `customer_batch_number` | order_items | `item.customer_batch_number` 或 `item.part_number` |
| 品名 | `screening_item.name` | screening_items | `item.screening_item.name` |
| 總重(kg) | `total_weight_kg` | order_items | `item.total_weight_kg` |
| 載具重(kg) | `tool_weight_kg` | order_item_tools (計算) | `item.totals.tool_weight_kg` |
| 單重(g) | `weight_per_unit_g` | screening_items | `item.screening_item.weight_per_unit_g` |
| 支數 | `total_units` | 計算值 | `item.total_units` |
| **備註區** | | | |
| 備註內容 | `notes` | orders | `data.notes` + 固定條款 |

### 2.3 API 端點

**單筆查詢（含完整資料）**
```
GET /api/orders/show.php?id={orderId}&include=items,customer
```

回傳結構：
```json
{
  "success": true,
  "data": {
    "id": 1,
    "order_number": "ORDER-20250101-0001",
    "order_date": "2025-01-01",
    "expected_delivery_date": "2025-01-15",
    "customer_po_number": "PO12345",
    "status": "pending",
    "status_label": "待處理",
    "notes": "...",
    "customer": {
      "id": 1,
      "name": "XX公司",
      "customer_number": "C001",
      "address": "...",
      "phone": "...",
      "contact_person": "..."
    },
    "items": [
      {
        "id": 1,
        "customer_batch_number": "BATCH001",
        "part_number": "P001",
        "total_weight_kg": 100.5,
        "total_units": 15000,
        "screening_item": {
          "id": 1,
          "name": "M8x20",
          "weight_per_unit_g": 6.7
        },
        "totals": {
          "tool_weight_kg": 5.2,
          "net_weight_kg": 95.3
        }
      }
    ]
  }
}
```

---

## 3. UI 設計規範

### 3.1 列印按鈕位置（雙軌設計）

#### 工具列批次列印
- 位置：頁面上方工具列
- 樣式：`btn outline`
- 圖示：`fa-print`
- 文字：「列印」或「批次列印(已選 N 筆)」
- **工具列需使用 sticky 定位**，確保滾動時仍可操作

#### 操作欄單筆列印
- 位置：表格每行操作欄
- 樣式：`btn text`
- 圖示：`fa-print`
- Title：「列印」

### 3.2 工具列 Sticky 樣式
```css
.content-header.with-actions {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #fff;
}
```

### 3.3 勾選框設計
- 表頭：全選 checkbox
- 每行：獨立 checkbox
- 勾選狀態變更時，更新上方按鈕文字顯示已選數量

---

## 4. 互動流程

### 4.1 單筆列印流程
```
用戶點擊操作欄列印按鈕
    ↓
呼叫 API 取得該訂單完整資料（含 order_items）
    ↓
開啟新視窗載入列印範本
    ↓
填入資料並觸發列印
```

### 4.2 批次列印流程
```
用戶勾選多筆訂單
    ↓
點擊上方「批次列印」按鈕
    ↓
逐筆呼叫 API 取得完整資料
    ↓
開啟新視窗，依序產生多頁
    ↓
觸發列印（每張訂單一頁）
```

---

## 5. API 規格

### 5.1 取得訂單列印資料
```
GET /api/orders/{id}/print
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "order_number": "ORDER-20260121-0001",
      "order_date": "2026-01-21",
      "customer_po_number": "PO-12345",
      "notes": "..."
    },
    "customer": {
      "name": "尚展螺絲企業有限公司",
      "address": "高雄市阿蓮區...",
      "phone": "07-632-0068",
      "contact_person": "黃燕雯"
    },
    "items": [
      {
        "batch_number": "260-11401010_10",
        "product_name": "1/4-20X1.640/1.760\"",
        "weight_kg": 1889,
        "carrier_count": 14,
        "carrier_unit": "桶",
        "unit_weight_g": 16.46,
        "piece_count": 114763,
        "screening_details": [
          {
            "screening_item": "頭高",
            "tolerance_min": 4.52,
            "tolerance_max": 5.03,
            "ppm_value": 50,
            "screening_type": "一般全檢",
            "unit_price": 35,
            "description": ""
          }
        ]
      }
    ],
    "company": {
      "name": "羽全有限公司",
      "name_en": "YU CYUAN CO., LTD",
      "address": "高雄市路竹區大仁路 584-23 號",
      "phone": "07-696-2727",
      "fax": "07-696-1919",
      "tax_id": "59182131"
    }
  }
}
```

---

## 6. 列印樣式規範

### 6.1 @page 設定
```css
@page {
    size: A4;
    margin: 10mm;
}
```

### 6.2 列印時隱藏元素
```css
@media print {
    .no-print { display: none !important; }
}
```

### 6.3 字體與大小
- 主標題：28pt bold
- 客戶名稱：18pt bold
- 訂單編號：14pt
- 表格內容：10pt
- 備註文字：10pt

---

## 7. 日期格式轉換

### 7.1 民國年轉換
```javascript
function formatTaiwanDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear() - 1911;
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
```

---

## 8. 實作檢查清單

- [x] 工具列加入 sticky 定位
- [x] 表格加入勾選框欄位
- [x] 操作欄加入列印按鈕
- [ ] 實作列印 API endpoint（目前使用現有 show.php）
- [x] 實作前端列印函數
- [x] 批次列印邏輯
- [x] 列印預覽功能（內建於列印視窗）

---

## 9. 未來擴充

- 支援 PDF 下載
- 支援 Email 發送
- 自訂列印範本
- 列印歷史紀錄
