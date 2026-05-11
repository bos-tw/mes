<?php
/**
 * 生產品質檢驗 - 輔助函式
 *
 * 本檔案包含生產品質檢驗模組的共用函式：
 *
 * - readQualityRecordPayload()    讀取請求資料 (JSON/FormData)
 * - calculateRejectionRatePpm()   計算不良率 (ppm)
 * - validateQualityRecord()       驗證檢驗資料
 *
 * ## 不良率計算公式
 * ppm = (不良數量 / 抽樣數量) × 1,000,000
 *
 * ## 驗證規則
 * - production_record_id: 必填
 * - inspection_datetime: 必填
 * - inspector_id: 必填
 * - sample_quantity_pcs: 必填，非負數
 * - defective_quantity_pcs: 必填，非負數，不可大於抽樣數量
 *
 * @see /api/production_quality_records/index.php   列表與新增
 * @see /api/production_quality_records/show.php    單筆查詢
 * @see /api/production_quality_records/update.php  更新
 * @see /api/production_quality_records/delete.php  刪除
 */
declare(strict_types=1);

/**
 * 讀取請求資料，支援 JSON 和 Form Data
 *
 * @return array<string,mixed>
 */
function readQualityRecordPayload(): array
{
    $payload = getJsonInput();
    if ($payload === [] && !empty($_POST)) {
        $payload = $_POST;
    }

    return is_array($payload) ? $payload : [];
}

/**
 * 計算不良率 (ppm)
 *
 * @param int $sampleQty 抽樣數量
 * @param int $defectiveQty 不良數量
 * @return float 不良率 (ppm)
 */
function calculateRejectionRatePpm(int $sampleQty, int $defectiveQty): float
{
    if ($sampleQty <= 0) {
        return 0.0;
    }

    return round(($defectiveQty / $sampleQty) * 1000000, 3);
}

/**
 * 驗證生產品質檢驗資料
 *
 * @param array $data 待驗證的資料
 * @param bool $isUpdate 是否為更新操作
 * @return array 返回 ['valid' => bool, 'errors' => array]
 */
function validateQualityRecord(array $data, bool $isUpdate = false): array
{
    $errors = [];

    // 必填欄位驗證
    if (!$isUpdate || isset($data['production_record_id'])) {
        if (empty($data['production_record_id'])) {
            $errors[] = '生產紀錄ID為必填欄位';
        }
    }

    if (!$isUpdate || isset($data['inspection_datetime'])) {
        if (empty($data['inspection_datetime'])) {
            $errors[] = '檢驗時間為必填欄位';
        }
    }

    if (!$isUpdate || isset($data['inspector_id'])) {
        if (empty($data['inspector_id'])) {
            $errors[] = '檢驗員為必填欄位';
        }
    }

    if (!$isUpdate || isset($data['sample_quantity_pcs'])) {
        if (!isset($data['sample_quantity_pcs']) || $data['sample_quantity_pcs'] < 0) {
            $errors[] = '抽樣數量必須為非負整數';
        }
    }

    if (!$isUpdate || isset($data['defective_quantity_pcs'])) {
        if (!isset($data['defective_quantity_pcs']) || $data['defective_quantity_pcs'] < 0) {
            $errors[] = '不良數量必須為非負整數';
        }
    }

    // 邏輯驗證：不良數量不能大於抽樣數量
    if (isset($data['sample_quantity_pcs']) && isset($data['defective_quantity_pcs'])) {
        if ($data['defective_quantity_pcs'] > $data['sample_quantity_pcs']) {
            $errors[] = '不良數量不能大於抽樣數量';
        }
    }

    return [
        'valid' => empty($errors),
        'errors' => $errors,
    ];
}
