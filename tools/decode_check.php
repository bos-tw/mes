<?php
// Check encoding of corrupted files
$files = [
    'api/permissions/helpers.php',
    'api/return_order_items/helpers.php',
    'api/roles/helpers.php',
    'api/role_permissions/helpers.php',
    'api/shipping_orders/helpers.php',
    'api/departments/helpers.php', // reference
];

foreach ($files as $f) {
    $content = file_get_contents($f);
    $lines = explode("\n", $content);
    $line3 = $lines[2] ?? '';

    echo "=== $f ===\n";
    echo "Line3: $line3\n";
    echo "Hex: " . bin2hex(substr($line3, 0, 60)) . "\n";
    echo "Detect: " . mb_detect_encoding($line3, ['UTF-8','BIG-5','GB2312','CP950','SJIS','EUC-TW','ISO-8859-1'], true) . "\n";

    // Try BIG5 -> UTF8
    $try1 = @mb_convert_encoding($line3, 'UTF-8', 'BIG-5');
    echo "BIG5->UTF8: $try1\n";

    // Try CP950 -> UTF8
    $try2 = @mb_convert_encoding($line3, 'UTF-8', 'CP950');
    echo "CP950->UTF8: $try2\n";

    // Try GB2312 -> UTF8
    $try3 = @mb_convert_encoding($line3, 'UTF-8', 'GB2312');
    echo "GB2312->UTF8: $try3\n";

    // Try EUC-TW -> UTF8
    $try4 = @mb_convert_encoding($line3, 'UTF-8', 'EUC-TW');
    echo "EUC-TW->UTF8: $try4\n";

    echo "\n";
}
