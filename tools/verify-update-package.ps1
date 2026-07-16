param(
    [Parameter(Mandatory = $true)]
    [string]$ZipPath,

    [Parameter(Mandatory = $false)]
    [string]$ExpectedVersionNumber,

    [Parameter(Mandatory = $false)]
    [string]$ExpectedFileVersion,

    [Parameter(Mandatory = $false)]
    [string]$ExpectedReleaseDate
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Normalize-ZipPath {
    param([string]$PathText)
    return $PathText.Replace('\', '/').TrimStart('/')
}

if (!(Test-Path -LiteralPath $ZipPath -PathType Leaf)) {
    throw "ZIP not found: $ZipPath"
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $ZipPath).Path)

try {
    $entries = @($zip.Entries | ForEach-Object {
        [PSCustomObject]@{
            FullName = Normalize-ZipPath -PathText $_.FullName
            Length   = $_.Length
        }
    })

    $entryNames = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
    foreach ($entry in $entries) {
        [void]$entryNames.Add($entry.FullName)
    }

    if (-not $entryNames.Contains('manifest.json')) {
        throw 'Package validation failed: missing manifest.json'
    }

    $manifestEntry = $zip.GetEntry('manifest.json')
    $manifestReader = New-Object System.IO.StreamReader($manifestEntry.Open())
    try {
        $manifestJson = $manifestReader.ReadToEnd()
    } finally {
        $manifestReader.Dispose()
    }

    $manifest = $manifestJson | ConvertFrom-Json
    if (-not $manifest.files_root) {
        throw 'Package validation failed: manifest.files_root is missing'
    }

    if ([string]::IsNullOrWhiteSpace($manifest.version_number) -or
        [string]::IsNullOrWhiteSpace($manifest.file_version) -or
        [string]::IsNullOrWhiteSpace($manifest.release_date)) {
        throw 'Package validation failed: manifest version fields are incomplete'
    }

    if ($ExpectedVersionNumber -and $manifest.version_number -ne $ExpectedVersionNumber) {
        throw "Package validation failed: version_number mismatch. Expected $ExpectedVersionNumber, got $($manifest.version_number)"
    }
    if ($ExpectedFileVersion -and $manifest.file_version -ne $ExpectedFileVersion) {
        throw "Package validation failed: file_version mismatch. Expected $ExpectedFileVersion, got $($manifest.file_version)"
    }
    if ($ExpectedReleaseDate -and $manifest.release_date -ne $ExpectedReleaseDate) {
        throw "Package validation failed: release_date mismatch. Expected $ExpectedReleaseDate, got $($manifest.release_date)"
    }

    $filesRoot = (Normalize-ZipPath -PathText $manifest.files_root).TrimEnd('/')
    $fileEntries = @($entries | Where-Object { $_.FullName.StartsWith("$filesRoot/", [System.StringComparison]::OrdinalIgnoreCase) -and $_.Length -ge 0 })
    if ($fileEntries.Count -eq 0) {
        throw "Package validation failed: no entries found under $filesRoot/"
    }

    $manifestProperties = @{}
    foreach ($property in $manifest.PSObject.Properties) {
        $manifestProperties[$property.Name] = $property.Value
    }

    $migrationEntries = @()
    if ($manifestProperties.ContainsKey('migrations') -and $manifestProperties['migrations']) {
        foreach ($migration in $manifestProperties['migrations']) {
            $normalizedMigration = Normalize-ZipPath -PathText ([string]$migration)
            if (-not $entryNames.Contains($normalizedMigration)) {
                throw "Package validation failed: manifest migration missing in ZIP -> $normalizedMigration"
            }
            $migrationEntries += $normalizedMigration
        }
    }

    $rollbackEntries = @()
    if ($manifestProperties.ContainsKey('rollback_migrations') -and $manifestProperties['rollback_migrations']) {
        foreach ($rollback in $manifestProperties['rollback_migrations']) {
            $normalizedRollback = Normalize-ZipPath -PathText ([string]$rollback)
            if (-not $entryNames.Contains($normalizedRollback)) {
                throw "Package validation failed: manifest rollback migration missing in ZIP -> $normalizedRollback"
            }
            $rollbackEntries += $normalizedRollback
        }
    }

    $deleteEntries = @()
    $declaredPaths = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
    foreach ($fileEntry in $fileEntries) {
        $relativeFile = $fileEntry.FullName.Substring($filesRoot.Length + 1)
        [void]$declaredPaths.Add($relativeFile)
    }
    foreach ($migrationEntry in $migrationEntries) {
        [void]$declaredPaths.Add($migrationEntry)
    }
    if ($manifestProperties.ContainsKey('delete_files') -and $manifestProperties['delete_files']) {
        foreach ($deleteFile in $manifestProperties['delete_files']) {
            $normalizedDelete = Normalize-ZipPath -PathText ([string]$deleteFile)
            if ([string]::IsNullOrWhiteSpace($normalizedDelete)) {
                throw 'Package validation failed: manifest.delete_files contains an empty path'
            }
            if ($declaredPaths.Contains($normalizedDelete)) {
                throw "Package validation failed: deleted path is also packaged -> $normalizedDelete"
            }
            if ($deleteEntries -contains $normalizedDelete) {
                throw "Package validation failed: duplicate deleted path -> $normalizedDelete"
            }
            $deleteEntries += $normalizedDelete
        }
    }

    if ([string]::IsNullOrWhiteSpace([string]$manifest.change_summary)) {
        throw 'Package validation failed: manifest.change_summary is empty'
    }

    Write-Host "OK: update package verification passed." -ForegroundColor Green
    Write-Host ("   ZIP: {0}" -f (Resolve-Path -LiteralPath $ZipPath).Path)
    Write-Host ("   Version: {0}" -f $manifest.version_number)
    Write-Host ("   FileVersion: {0}" -f $manifest.file_version)
    Write-Host ("   ReleaseDate: {0}" -f $manifest.release_date)
    Write-Host ("   FilesRoot: {0}" -f $filesRoot)
    Write-Host ("   FilesInZip: {0}" -f $fileEntries.Count)
    Write-Host ("   MigrationsInManifest: {0}" -f $migrationEntries.Count)
    Write-Host ("   RollbackMigrationsInManifest: {0}" -f $rollbackEntries.Count)
    Write-Host ("   DeletedFilesInManifest: {0}" -f $deleteEntries.Count)
} finally {
    $zip.Dispose()
}
