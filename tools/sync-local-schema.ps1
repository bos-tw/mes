param(
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)
    Write-Host "[sync-local-schema] $Message"
}

function Get-PhpConstantString {
    param(
        [string]$PhpContent,
        [string]$ConstantName
    )

    $pattern = 'const\s+{0}\s*=\s*''([^'']*)'';' -f [regex]::Escape($ConstantName)
    $match = [regex]::Match($PhpContent, $pattern)
    if (-not $match.Success) {
        throw "Cannot read constant '$ConstantName' from api/config.php."
    }

    return $match.Groups[1].Value
}

function Get-PhpConstantInt {
    param(
        [string]$PhpContent,
        [string]$ConstantName
    )

    $pattern = 'const\s+{0}\s*=\s*([0-9]+);' -f [regex]::Escape($ConstantName)
    $match = [regex]::Match($PhpContent, $pattern)
    if (-not $match.Success) {
        throw "Cannot read constant '$ConstantName' from api/config.php."
    }

    return [int]$match.Groups[1].Value
}

function Get-MySqlExePath {
    $command = Get-Command mysql.exe -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $candidates = @(
        'C:\mysql-8.0.44\bin\mysql.exe',
        'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe',
        'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe',
        'C:\xampp\mysql\bin\mysql.exe'
    )

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) {
            return $candidate
        }
    }

    throw 'Cannot find mysql.exe. Install MySQL CLI or add it to PATH.'
}

function Invoke-MySqlScalar {
    param(
        [string]$MySqlExe,
        [string]$DbHost,
        [int]$Port,
        [string]$User,
        [string]$Password,
        [string]$Database,
        [string]$Query
    )

    $args = @(
        "--host=$DbHost",
        "--port=$Port",
        "--user=$User",
        "--default-character-set=utf8mb4",
        '--batch',
        '--skip-column-names',
        "--execute=$Query",
        $Database
    )

    $previousMysqlPwd = $env:MYSQL_PWD
    try {
        if ($Password -ne '') {
            $env:MYSQL_PWD = $Password
        } else {
            Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
        }

        $output = & $MySqlExe @args
        if ($LASTEXITCODE -ne 0) {
            throw "SQL check failed. Query: $Query"
        }

        if ($output -is [array]) {
            $output = $output -join "`n"
        }

        return ($output | Out-String).Trim()
    } finally {
        if ($null -eq $previousMysqlPwd) {
            Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
        } else {
            $env:MYSQL_PWD = $previousMysqlPwd
        }
    }
}

function Invoke-MySqlFile {
    param(
        [string]$MySqlExe,
        [string]$DbHost,
        [int]$Port,
        [string]$User,
        [string]$Password,
        [string]$Database,
        [string]$SqlFilePath
    )

    $sqlFileForMysql = $SqlFilePath -replace '\\', '/'
    $executeCommand = "source $sqlFileForMysql"

    $args = @(
        "--host=$DbHost",
        "--port=$Port",
        "--user=$User",
        "--default-character-set=utf8mb4",
        "--execute=$executeCommand",
        $Database
    )

    $previousMysqlPwd = $env:MYSQL_PWD
    try {
        if ($Password -ne '') {
            $env:MYSQL_PWD = $Password
        } else {
            Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
        }

        & $MySqlExe @args | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "Migration failed: $SqlFilePath"
        }
    } finally {
        if ($null -eq $previousMysqlPwd) {
            Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
        } else {
            $env:MYSQL_PWD = $previousMysqlPwd
        }
    }
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$configPath = Join-Path $repoRoot 'api\config.php'
$migrationsDir = Join-Path $repoRoot 'migrations'

if (-not (Test-Path -LiteralPath $configPath)) {
    throw "Missing file: $configPath"
}

if (-not (Test-Path -LiteralPath $migrationsDir)) {
    throw "Missing folder: $migrationsDir"
}

$phpConfig = Get-Content -Raw -LiteralPath $configPath

$dbHost = if ($env:SCREWSYSTEM_DB_HOST) { $env:SCREWSYSTEM_DB_HOST } else { Get-PhpConstantString -PhpContent $phpConfig -ConstantName 'DB_HOST' }
$dbPort = if ($env:SCREWSYSTEM_DB_PORT) { [int]$env:SCREWSYSTEM_DB_PORT } else { Get-PhpConstantInt -PhpContent $phpConfig -ConstantName 'DB_PORT' }
$dbName = if ($env:SCREWSYSTEM_DB_NAME) { $env:SCREWSYSTEM_DB_NAME } else { Get-PhpConstantString -PhpContent $phpConfig -ConstantName 'DB_NAME' }
$dbUser = if ($env:SCREWSYSTEM_DB_USER) { $env:SCREWSYSTEM_DB_USER } else { Get-PhpConstantString -PhpContent $phpConfig -ConstantName 'DB_USER' }
$dbPassword = if ($env:SCREWSYSTEM_DB_PASSWORD) { $env:SCREWSYSTEM_DB_PASSWORD } else { Get-PhpConstantString -PhpContent $phpConfig -ConstantName 'DB_PASSWORD' }

$mysqlExe = Get-MySqlExePath

Write-Step ("Database: {0}@{1}:{2}" -f $dbName, $dbHost, $dbPort)
Write-Step "mysql.exe: $mysqlExe"

$migrationChecks = [ordered]@{
    '2026_05_09_create_system_update_jobs.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'system_update_jobs'), 1, 0);"
        Description = 'system_update_jobs table'
    }
    '2026_05_09_create_system_update_logs.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'system_update_logs'), 1, 0);"
        Description = 'system_update_logs table'
    }
    '2026_05_11_add_orders_final_quote_per_m.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'final_quote_per_m'), 1, 0);"
        Description = 'orders.final_quote_per_m column'
    }
    '2026_05_11_add_orders_single_ppm.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'single_ppm'), 1, 0);"
        Description = 'orders.single_ppm column'
    }
    '2026_05_12_add_work_orders_completed_at.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND column_name = 'completed_at') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND index_name = 'idx_work_orders_completed_at'), 1, 0);"
        Description = 'work_orders.completed_at column and index'
    }
    '2026_05_14_add_work_orders_machine_sequence.sql' = @{
        CheckSql = "SELECT IF(EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND column_name = 'machine_sequence') AND EXISTS(SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'work_orders' AND index_name = 'idx_work_orders_machine_sequence'), 1, 0);"
        Description = 'work_orders.machine_sequence column and index'
    }
}

$migrationFiles = Get-ChildItem -LiteralPath $migrationsDir -File | Sort-Object Name
$unknownMigrations = @()
$pendingMigrations = @()
$appliedMigrations = @()

foreach ($migrationFile in $migrationFiles) {
    $name = $migrationFile.Name
    if (-not $migrationChecks.Contains($name)) {
        $unknownMigrations += $name
        continue
    }

    $checkDefinition = $migrationChecks[$name]
    $checkResult = Invoke-MySqlScalar `
        -MySqlExe $mysqlExe `
        -DbHost $dbHost `
        -Port $dbPort `
        -User $dbUser `
        -Password $dbPassword `
        -Database $dbName `
        -Query $checkDefinition.CheckSql

    if ($checkResult -eq '1') {
        $appliedMigrations += $name
    } else {
        $pendingMigrations += $migrationFile
    }
}

if ($unknownMigrations.Count -gt 0) {
    Write-Warning "Unknown migrations found:"
    foreach ($item in $unknownMigrations) {
        Write-Warning "- $item"
    }
    Write-Warning 'Update $migrationChecks in tools/sync-local-schema.ps1 before running again.'
    exit 2
}

Write-Step ("Applied: {0}, Pending: {1}" -f $appliedMigrations.Count, $pendingMigrations.Count)

if ($pendingMigrations.Count -eq 0) {
    Write-Step 'Schema is already in sync.'
    exit 0
}

if ($DryRun) {
    Write-Step 'DryRun enabled. Pending migrations:'
    foreach ($migration in $pendingMigrations) {
        Write-Host "- $($migration.Name)"
    }
    exit 0
}

Write-Step 'Applying pending migrations...'
foreach ($migration in $pendingMigrations) {
    Write-Step "Applying: $($migration.Name)"
    Invoke-MySqlFile `
        -MySqlExe $mysqlExe `
        -DbHost $dbHost `
        -Port $dbPort `
        -User $dbUser `
        -Password $dbPassword `
        -Database $dbName `
        -SqlFilePath $migration.FullName
}

Write-Step 'Verifying all migration checks...'
foreach ($migrationFile in $migrationFiles) {
    $name = $migrationFile.Name
    $checkDefinition = $migrationChecks[$name]
    $checkResult = Invoke-MySqlScalar `
        -MySqlExe $mysqlExe `
        -DbHost $dbHost `
        -Port $dbPort `
        -User $dbUser `
        -Password $dbPassword `
        -Database $dbName `
        -Query $checkDefinition.CheckSql

    if ($checkResult -ne '1') {
        throw "Post-check failed for $name ($($checkDefinition.Description))."
    }
}

Write-Step 'Local schema sync completed successfully.'
