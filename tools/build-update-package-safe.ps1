param(
    [Parameter(Mandatory = $true)]
    [string]$VersionNumber,

    [Parameter(Mandatory = $true)]
    [string]$FileVersion,

    [Parameter(Mandatory = $true)]
    [string]$ReleaseDate,

    [Parameter(Mandatory = $true)]
    [string]$ChangeSummaryFile,

    [Parameter(Mandatory = $false)]
    [string]$FromRef = "update-base-2026-05-11",

    [Parameter(Mandatory = $false)]
    [string]$OutputDir = "dist",

    [Parameter(Mandatory = $false)]
    [switch]$SkipFromRefDiff,

    [Parameter(Mandatory = $false)]
    [switch]$KeepExistingSameVersion
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Normalize-RelativePath {
    param([string]$Path)

    $normalized = $Path.Replace('\\', '/').Replace('\', '/')
    while ($normalized.StartsWith('./')) {
        $normalized = $normalized.Substring(2)
    }
    $normalized = $normalized.TrimStart('/')

    if ([string]::IsNullOrWhiteSpace($normalized)) {
        throw "Path is empty: $Path"
    }

    if ($normalized.Contains('../')) {
        throw "Path traversal is not allowed: $Path"
    }

    return $normalized
}

function Is-ExcludedPath {
    param([string]$RelativePath)

    $p = Normalize-RelativePath -Path $RelativePath
    $excludedPrefixes = @(
        'uploads/',
        'export/',
        'backup/',
        'db_backups/',
        'db_exports/',
        'old/',
        'vendor/',
        'dist/',
        'updates/'
    )

    foreach ($prefix in $excludedPrefixes) {
        if ($p.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $true
        }
    }

    return $false
}

function Get-GitLines {
    param(
        [string]$RepoRoot,
        [string[]]$Args,
        [switch]$AllowFailure
    )

    $output = & git -C $RepoRoot @Args 2>$null
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0 -and -not $AllowFailure) {
        $argText = ($Args -join ' ')
        throw "Git command failed: git -C $RepoRoot $argText"
    }

    return @($output | Where-Object { $_ -and $_.Trim().Length -gt 0 })
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$buildScript = Join-Path $PSScriptRoot 'build-update-package.ps1'
if (!(Test-Path $buildScript -PathType Leaf)) {
    throw "build-update-package.ps1 not found at: $buildScript"
}

$summaryRel = Normalize-RelativePath -Path $ChangeSummaryFile
$summaryFull = Join-Path $repoRoot $summaryRel
if (!(Test-Path $summaryFull -PathType Leaf)) {
    throw "ChangeSummaryFile not found: $ChangeSummaryFile"
}

$changedSet = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)

if (-not $SkipFromRefDiff) {
    $refLines = Get-GitLines -RepoRoot $repoRoot -Args @('diff', '--name-only', "$FromRef..HEAD")
    foreach ($line in $refLines) {
        [void]$changedSet.Add((Normalize-RelativePath -Path $line))
    }
}

$workingLines = Get-GitLines -RepoRoot $repoRoot -Args @('diff', '--name-only')
foreach ($line in $workingLines) {
    [void]$changedSet.Add((Normalize-RelativePath -Path $line))
}

$stagedLines = Get-GitLines -RepoRoot $repoRoot -Args @('diff', '--name-only', '--cached')
foreach ($line in $stagedLines) {
    [void]$changedSet.Add((Normalize-RelativePath -Path $line))
}

$untrackedLines = Get-GitLines -RepoRoot $repoRoot -Args @('ls-files', '--others', '--exclude-standard')
foreach ($line in $untrackedLines) {
    [void]$changedSet.Add((Normalize-RelativePath -Path $line))
}

[void]$changedSet.Add($summaryRel)

$allCandidates = @($changedSet)
$packFiles = @()

foreach ($relativePath in $allCandidates) {
    if (Is-ExcludedPath -RelativePath $relativePath) {
        continue
    }

    $full = Join-Path $repoRoot $relativePath
    if (Test-Path $full -PathType Leaf) {
        $packFiles += $relativePath
    }
}

if ($packFiles.Count -eq 0) {
    throw 'No files selected for package. Check FromRef/current workspace changes.'
}

$migrationFiles = @($packFiles | Where-Object { $_ -like 'migrations/*.sql' })
$mainFiles = @($packFiles | Where-Object { $_ -notlike 'migrations/*.sql' })

if ($mainFiles.Count -eq 0) {
    throw 'No non-migration files selected for package.'
}

$outputRoot = Join-Path $repoRoot $OutputDir
if (!(Test-Path $outputRoot)) {
    New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
}

$versionToken = $VersionNumber -replace '[^0-9A-Za-z\.-]', '_'
if (-not $KeepExistingSameVersion) {
    Get-ChildItem -Path $outputRoot -Filter ("update_{0}_*.zip" -f $versionToken) -ErrorAction SilentlyContinue |
        Remove-Item -Force
}

$buildParams = @{
    VersionNumber     = $VersionNumber
    FileVersion       = $FileVersion
    ReleaseDate       = $ReleaseDate
    ChangeSummaryFile = $summaryRel
    Files             = $mainFiles
    Migrations        = $migrationFiles
    OutputDir         = $OutputDir
}

& $buildScript @buildParams

$latestZip = Get-ChildItem -Path $outputRoot -Filter ("update_{0}_*.zip" -f $versionToken) |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $latestZip) {
    throw "Package file not found in $outputRoot"
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($latestZip.FullName)

try {
    $entrySet = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
    foreach ($entry in $zip.Entries) {
        $normalized = ($entry.FullName -replace '\\', '/').TrimStart('/')
        [void]$entrySet.Add($normalized)
    }

    if (-not $entrySet.Contains('manifest.json')) {
        throw 'Package validation failed: missing manifest.json'
    }

    if (-not ($entrySet | Where-Object { $_.StartsWith('files/', [System.StringComparison]::OrdinalIgnoreCase) })) {
        throw 'Package validation failed: missing files/ root entries'
    }

    $missingMain = @()
    foreach ($f in $mainFiles) {
        $zipPath = 'files/' + (Normalize-RelativePath -Path $f)
        if (-not $entrySet.Contains($zipPath)) {
            $missingMain += $f
        }
    }

    if ($missingMain.Count -gt 0) {
        $missingText = $missingMain -join ', '
        throw "Package validation failed: missing files in ZIP -> $missingText"
    }

    $missingMigrations = @()
    foreach ($m in $migrationFiles) {
        $zipPath = Normalize-RelativePath -Path $m
        if (-not $entrySet.Contains($zipPath)) {
            $missingMigrations += $m
        }
    }

    if ($missingMigrations.Count -gt 0) {
        $missingText = $missingMigrations -join ', '
        throw "Package validation failed: missing migrations in ZIP -> $missingText"
    }
}
finally {
    $zip.Dispose()
}

Write-Host "Safe package created: $($latestZip.FullName)"
Write-Host "FromRef: $FromRef"
Write-Host "Main files: $($mainFiles.Count)"
Write-Host "Migrations: $($migrationFiles.Count)"
