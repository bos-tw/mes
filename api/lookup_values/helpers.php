<?php
/**
 * Lookup Values API - 共用輔助函式
 *
 * 提供系統查詢值模組使用的查詢輔助函式。
 * 這些函式被其他模組廣泛引用，用於取得狀態標籤、驗證 lookup ID 等。
 *
 * @module lookup_values
 * @table lookup_values, lookup_domains
 *
 * @functions
 * - getLookupValuesByDomainKey(): 根據 domain_key 取得 lookup values
 * - getLookupValuesByDomainId(): 根據 domain_id 取得 lookup values
 * - getLookupValueLabel(): 根據 lookup_value_id 取得 value_label
 * - getLookupValueId(): 根據 domain_key 和 value_key 取得 lookup_value_id
 * - validateLookupValueId(): 驗證 lookup_value_id 是否存在
 *
 * @author System
 * @since 1.0.0
 */
declare(strict_types=1);

/**
 * 根據 domain_key 取得 LookupValues
 */
function getLookupValuesByDomainKey($pdo, string $domainKey): array
{
    $stmt = $pdo->prepare('
        SELECT lv.id, lv.value_key, lv.value_label, lv.sort_order
        FROM lookup_values lv
        INNER JOIN lookup_domains ld ON lv.domain_id = ld.id
        WHERE ld.domain_key = ? AND lv.is_active = 1
        ORDER BY lv.sort_order ASC, lv.value_label ASC
    ');
    $stmt->execute([$domainKey]);

    return $stmt->fetchAll();
}

/**
 * 根據 domain_id 取得 LookupValues
 */
function getLookupValuesByDomainId($pdo, int $domainId): array
{
    $stmt = $pdo->prepare('
        SELECT lv.id, lv.value_key, lv.value_label, lv.sort_order
        FROM lookup_values lv
        WHERE lv.domain_id = ? AND lv.is_active = 1
        ORDER BY lv.sort_order ASC, lv.value_label ASC
    ');
    $stmt->execute([$domainId]);

    return $stmt->fetchAll();
}

/**
 * 根據 lookup_value_id 取得 value_label
 */
function getLookupValueLabel($pdo, ?int $lookupValueId): ?string
{
    if ($lookupValueId === null) {
        return null;
    }

    $stmt = $pdo->prepare('
        SELECT lv.value_label
        FROM lookup_values lv
        WHERE lv.id = ? AND lv.is_active = 1
    ');
    $stmt->execute([$lookupValueId]);

    $result = $stmt->fetchColumn();
    return $result !== false ? $result : null;
}

/**
 * 根據 domain_key 和 value_key 取得 lookup_value_id
 */
function getLookupValueId($pdo, string $domainKey, string $valueKey): ?int
{
    $stmt = $pdo->prepare('
        SELECT lv.id
        FROM lookup_values lv
        INNER JOIN lookup_domains ld ON lv.domain_id = ld.id
        WHERE ld.domain_key = ? AND lv.value_key = ? AND lv.is_active = 1
    ');
    $stmt->execute([$domainKey, $valueKey]);

    $result = $stmt->fetchColumn();
    return $result !== false ? (int)$result : null;
}