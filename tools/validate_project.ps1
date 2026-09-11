param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectPath
)

$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($ProjectPath)
$errors = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()
$checks = [System.Collections.Generic.List[string]]::new()

function Require-File([string]$RelativePath) {
    $path = Join-Path $root $RelativePath
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        $errors.Add("Missing required file: $RelativePath")
        return $null
    }
    $checks.Add("OK file: $RelativePath")
    return $path
}

$projectPath = Require-File 'project.json'
$timelinePath = Require-File 'after_effects\ae_scripts\01_timeline.json'
$manifestPath = Require-File 'assets\asset_manifest.json'
Require-File 'design\style_config.json' | Out-Null
Require-File 'content\transcript_with_slide_markers.md' | Out-Null

if ($projectPath -and $timelinePath -and $manifestPath) {
    $project = Get-Content -LiteralPath $projectPath -Raw | ConvertFrom-Json
    $timeline = Get-Content -LiteralPath $timelinePath -Raw | ConvertFrom-Json
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    $fps = [double]$project.format.frameRate
    $tolerance = 0.5 / $fps

    if ($project.projectId -eq 'replace_me') {
        $warnings.Add('project.json still uses projectId replace_me')
    }

    for ($i = 0; $i -lt $timeline.slides.Count; $i++) {
        $slide = $timeline.slides[$i]
        $duration = [double]$slide.endSec - [double]$slide.startSec
        if ([math]::Abs($duration - [double]$slide.durationSec) -gt $tolerance) {
            $errors.Add("$($slide.id): durationSec does not match boundaries")
        }
        if ($i -gt 0) {
            $previous = $timeline.slides[$i - 1]
            if ([math]::Abs([double]$slide.startSec - [double]$previous.endSec) -gt $tolerance) {
                $errors.Add("$($slide.id): does not begin at previous slide end")
            }
        }
        $number = '{0:D2}' -f ($i + 1)
        Require-File "after_effects\ae_scripts\slide_content\slide_$number.json" | Out-Null

        $asset = $manifest.slides | Where-Object { $_.id -eq $slide.id } | Select-Object -First 1
        if (-not $asset) {
            $errors.Add("$($slide.id): missing asset-manifest entry")
        } elseif ($asset.localPath) {
            $mediaPath = Join-Path $root $asset.localPath
            if (-not (Test-Path -LiteralPath $mediaPath -PathType Leaf)) {
                $errors.Add("$($slide.id): mapped media is missing: $($asset.localPath)")
            }
        }
    }

    $finalAudio = Join-Path $root $project.paths.finalAudio
    if (-not (Test-Path -LiteralPath $finalAudio -PathType Leaf)) {
        $warnings.Add('Final audio is absent; AE will use timeline duration')
    }
}

$reportDir = Join-Path $root 'quality_control'
New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
$reportPath = Join-Path $reportDir 'validation_report.txt'
$lines = @(
    'Project validation',
    "Project: $root",
    "Checked: $(Get-Date -Format o)",
    '',
    "Errors: $($errors.Count)",
    "Warnings: $($warnings.Count)",
    ''
)
$lines += $errors | ForEach-Object { "ERROR: $_" }
$lines += $warnings | ForEach-Object { "WARNING: $_" }
$lines += ''
$lines += $checks
Set-Content -LiteralPath $reportPath -Value $lines -Encoding utf8

Write-Output $reportPath
if ($errors.Count -gt 0) {
    exit 1
}

