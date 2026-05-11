param(
    [Parameter(Mandatory = $true)]
    [string]$VersionNumber,

    [Parameter(Mandatory = $true)]
    [string]$FileVersion,

    [Parameter(Mandatory = $true)]
    [string]$ReleaseDate,

    [Parameter(Mandatory = $true)]
    [string]$ChangeSummaryFile,

    [Parameter(Mandatory = $true)]
    [string[]]$Files,

    [Parameter(Mandatory = $false)]
    [string[]]$Migrations = @(),

    [Parameter(Mandatory = $false)]
    [string]$OutputDir = "dist"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-DateFormat {
    param([string]$DateString)
    if ($DateString -notmatch '^\d{4}-\d{2}-\d{2}$') {
        throw "ReleaseDate must be YYYY-MM-DD."
    }
}

function Resolve-RepoRoot {
    return Split-Path -Parent $PSScriptRoot
}

function Normalize-RelativePath {
    param([string]$Path)
    $normalized = $Path.Replace('\\', '/')
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

function Copy-RelativeFile {
    param(
        [string]$RepoRoot,
        [string]$RelativePath,
        [string]$TargetRoot
    )

    $relative = Normalize-RelativePath -Path $RelativePath
    $source = Join-Path $RepoRoot $relative
    if (!(Test-Path $source -PathType Leaf)) {
        throw "File not found: $relative"
    }

    $target = Join-Path $TargetRoot $relative
    $targetDir = Split-Path -Parent $target
    if (!(Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    Copy-Item -Path $source -Destination $target -Force
}

Assert-DateFormat -DateString $ReleaseDate

$repoRoot = Resolve-RepoRoot
$summaryPath = Join-Path $repoRoot (Normalize-RelativePath -Path $ChangeSummaryFile)
if (!(Test-Path $summaryPath -PathType Leaf)) {
    throw "ChangeSummaryFile not found: $ChangeSummaryFile"
}
$changeSummary = Get-Content -Path $summaryPath -Raw -Encoding UTF8
if ([string]::IsNullOrWhiteSpace($changeSummary)) {
    throw "Change summary file is empty: $ChangeSummaryFile"
}

if ($Files.Count -eq 0) {
    throw "At least one file is required in -Files."
}

$outputRoot = Join-Path $repoRoot $OutputDir
if (!(Test-Path $outputRoot)) {
    New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
}

$workDir = Join-Path $outputRoot ("update_pkg_{0}" -f ([Guid]::NewGuid().ToString('N')))
$filesRoot = Join-Path $workDir 'files'
New-Item -ItemType Directory -Path $filesRoot -Force | Out-Null

foreach ($file in $Files) {
    Copy-RelativeFile -RepoRoot $repoRoot -RelativePath $file -TargetRoot $filesRoot
}

$migrationList = @()
foreach ($migration in $Migrations) {
    $migrationRel = Normalize-RelativePath -Path $migration
    Copy-RelativeFile -RepoRoot $repoRoot -RelativePath $migrationRel -TargetRoot $workDir
    $migrationList += $migrationRel
}

$manifest = [ordered]@{
    version_number = $VersionNumber
    file_version   = $FileVersion
    release_date   = $ReleaseDate
    change_summary = $changeSummary.Trim()
    files_root     = 'files'
    migrations     = $migrationList
}

$manifestPath = Join-Path $workDir 'manifest.json'
$manifestJson = $manifest | ConvertTo-Json -Depth 5
Set-Content -Path $manifestPath -Value $manifestJson -Encoding UTF8

$zipName = "update_{0}_{1}.zip" -f ($VersionNumber -replace '[^0-9A-Za-z\.-]', '_'), (Get-Date -Format 'yyyyMMdd_HHmmss')
$zipPath = Join-Path $outputRoot $zipName
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path (Join-Path $workDir '*') -DestinationPath $zipPath -CompressionLevel Optimal

Remove-Item -Path $workDir -Recurse -Force

Write-Host "Package created: $zipPath"
Write-Host "Version: $VersionNumber"
Write-Host "Files: $($Files.Count)"
Write-Host "Migrations: $($migrationList.Count)"
