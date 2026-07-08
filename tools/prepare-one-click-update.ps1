param(
    [Parameter(Mandatory = $false)]
    [string]$VersionNumber,

    [Parameter(Mandatory = $false)]
    [string]$FileVersion,

    [Parameter(Mandatory = $false)]
    [string]$ReleaseDate,

    [Parameter(Mandatory = $false)]
    [string]$ChangeSummaryFile,

    [Parameter(Mandatory = $false)]
    [string]$FromRef = "update-base-2026-05-11",

    [Parameter(Mandatory = $false)]
    [string]$OutputDir = "dist",

    [Parameter(Mandatory = $false)]
    [switch]$SkipConfigValidation,

    [Parameter(Mandatory = $false)]
    [switch]$SkipDataSync,

    [Parameter(Mandatory = $false)]
    [switch]$SkipSchemaDryRun,

    [Parameter(Mandatory = $false)]
    [switch]$SkipPackageBuild,

    [Parameter(Mandatory = $false)]
    [switch]$KeepExistingSameVersion
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host ("[prepare-one-click-update] {0}" -f $Message) -ForegroundColor Cyan
}

function Resolve-RepoRoot {
    return Split-Path -Parent $PSScriptRoot
}

function Assert-DateFormat {
    param([string]$DateString)
    if ($DateString -notmatch '^\d{4}-\d{2}-\d{2}$') {
        throw "ReleaseDate must be YYYY-MM-DD."
    }
}

function Assert-PackageParameters {
    if ($SkipPackageBuild) {
        return
    }

    if ([string]::IsNullOrWhiteSpace($VersionNumber)) {
        throw 'VersionNumber is required unless -SkipPackageBuild is used.'
    }
    if ([string]::IsNullOrWhiteSpace($FileVersion)) {
        throw 'FileVersion is required unless -SkipPackageBuild is used.'
    }
    if ([string]::IsNullOrWhiteSpace($ReleaseDate)) {
        throw 'ReleaseDate is required unless -SkipPackageBuild is used.'
    }
    if ([string]::IsNullOrWhiteSpace($ChangeSummaryFile)) {
        throw 'ChangeSummaryFile is required unless -SkipPackageBuild is used.'
    }

    Assert-DateFormat -DateString $ReleaseDate

    $summaryFullPath = Join-Path (Resolve-RepoRoot) $ChangeSummaryFile
    if (!(Test-Path -LiteralPath $summaryFullPath -PathType Leaf)) {
        throw "ChangeSummaryFile not found: $ChangeSummaryFile"
    }
}

function Invoke-ExternalStep {
    param(
        [string]$Name,
        [string]$FilePath,
        [string[]]$Arguments = @()
    )

    Write-Step $Name
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Step failed: $Name"
    }
}

$repoRoot = Resolve-RepoRoot
$syncScript = Join-Path $PSScriptRoot 'sync-local-schema.ps1'
$buildSafeScript = Join-Path $PSScriptRoot 'build-update-package-safe.ps1'
$verifyPackageScript = Join-Path $PSScriptRoot 'verify-update-package.ps1'
$packagePath = $null

Assert-PackageParameters

Push-Location $repoRoot
try {
    if (-not $SkipConfigValidation) {
        Invoke-ExternalStep -Name 'validate config modules' -FilePath 'node' -Arguments @('tools/validate-config-modules.js')
    }

    Invoke-ExternalStep -Name 'syntax check audit-system-health.js' -FilePath 'node' -Arguments @('--check', 'tools/audit-system-health.js')
    Invoke-ExternalStep -Name 'refresh UI style audit report' -FilePath 'node' -Arguments @('tools/audit-ui-style.js', '--write', 'docs/ui-style-audit.md', '--max-samples', '0')

    if (-not $SkipDataSync) {
        Invoke-ExternalStep -Name 'syntax check js/data-sync.js' -FilePath 'node' -Arguments @('--check', 'js/data-sync.js')
        Invoke-ExternalStep -Name 'syntax check tools/audit-data-sync.js' -FilePath 'node' -Arguments @('--check', 'tools/audit-data-sync.js')
        Invoke-ExternalStep -Name 'refresh DataSync audit report' -FilePath 'node' -Arguments @('tools/audit-data-sync.js', '--write', 'docs/data-sync-audit.md')
    }

    if (-not $SkipSchemaDryRun) {
        Write-Step 'schema sync dry-run'
        & $syncScript -DryRun
        if ($LASTEXITCODE -ne 0) {
            throw 'Step failed: schema sync dry-run'
        }
    }

    Invoke-ExternalStep -Name 'changed-scope health audit' -FilePath 'node' -Arguments @('tools/audit-system-health.js', '--changed', '--base', 'origin/main')
    Invoke-ExternalStep -Name 'git diff whitespace check' -FilePath 'git' -Arguments @('diff', '--check')

    if (-not $SkipPackageBuild) {
        Write-Step 'build one-click update package'
        $buildParams = @{
            VersionNumber     = $VersionNumber
            FileVersion       = $FileVersion
            ReleaseDate       = $ReleaseDate
            ChangeSummaryFile = $ChangeSummaryFile
            FromRef           = $FromRef
            OutputDir         = $OutputDir
        }
        if ($KeepExistingSameVersion) {
            $buildParams.KeepExistingSameVersion = $true
        }

        & $buildSafeScript @buildParams
        if ($LASTEXITCODE -ne 0) {
            throw 'Step failed: build one-click update package'
        }

        $versionToken = $VersionNumber -replace '[^0-9A-Za-z\.-]', '_'
        $packagePath = Get-ChildItem -Path (Join-Path $repoRoot $OutputDir) -Filter ("update_{0}_*.zip" -f $versionToken) |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1

        if (-not $packagePath) {
            throw 'Step failed: package file not found after build'
        }

        Write-Step 'verify built update package'
        & $verifyPackageScript `
            -ZipPath $packagePath.FullName `
            -ExpectedVersionNumber $VersionNumber `
            -ExpectedFileVersion $FileVersion `
            -ExpectedReleaseDate $ReleaseDate
        if ($LASTEXITCODE -ne 0) {
            throw 'Step failed: verify built update package'
        }
    }

    Write-Host ""
    Write-Host "OK: prepare-one-click-update completed." -ForegroundColor Green
    Write-Host "   UI style audit: docs/ui-style-audit.md"
    Write-Host "   DataSync audit: docs/data-sync-audit.md"
    if ($packagePath) {
        Write-Host ("   Update package: {0}" -f $packagePath.FullName)
    } else {
        Write-Host "   Update package: skipped"
    }
} finally {
    Pop-Location
}
