<?php
// Final cleanup: remove garbled Skills section, keep only the correct UTF-8 one
$path = 'C:/Apache24/htdocs/mes/.github/copilot-instructions.md';
$c = file_get_contents($path);

echo 'Total bytes: ' . strlen($c) . PHP_EOL;

// Find last occurrence of }); (end of DataSync subscribe call)
$p1 = strrpos($c, '});');
echo 'Last }); at byte: ' . $p1 . PHP_EOL;

// The DataSync block closes with ``` then there is garbled content
// then later comes our clean skills section starting with: \n---\n\n## 📚
// '📚' in UTF-8 is: F0 9F 93 9A
$cleanSkillsMarker = "\n---\n\n## " . "\xF0\x9F\x93\x9A";  // \n---\n\n## 📚
$p2 = strpos($c, $cleanSkillsMarker, $p1);
echo 'Clean Skills section start: ' . $p2 . PHP_EOL;

if ($p1 !== false && $p2 !== false) {
    // Find end of the ``` after });
    $backtickEnd = strpos($c, "\n```", $p1);
    echo 'Backtick end at: ' . $backtickEnd . PHP_EOL;
    
    if ($backtickEnd !== false) {
        $keepUpTo = $backtickEnd + 4; // include \n``` and trailing newline
        echo 'Keeping up to: ' . $keepUpTo . PHP_EOL;
        
        $before = substr($c, 0, $keepUpTo);
        $skills = substr($c, $p2);  // from the clean skills section onwards
        
        $result = $before . $skills;
        file_put_contents($path, $result);
        echo 'Done! New file size: ' . strlen($result) . ' bytes' . PHP_EOL;
        echo 'Preview of junction: ' . substr($result, $keepUpTo - 20, 60) . PHP_EOL;
    }
} else {
    echo 'One of the markers not found.' . PHP_EOL;
    // Show where we are
    if ($p1 !== false) {
        echo 'Context after });: ' . substr($c, $p1, 50) . PHP_EOL;
    }
}
