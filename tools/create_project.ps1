param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z0-9][a-z0-9_-]*$')]
    [string]$ProjectId,

    [Parameter(Mandatory = $true)]
    [string]$Destination,

    [string]$Title = ''
)

$ErrorActionPreference = 'Stop'
$templateRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $templateRoot 'template'
$destinationPath = [System.IO.Path]::GetFullPath($Destination)

if (-not (Test-Path -LiteralPath $source -PathType Container)) {
    throw "Project template not found: $source"
}

if (Test-Path -LiteralPath $destinationPath) {
    throw "Destination already exists; refusing to overwrite: $destinationPath"
}

New-Item -ItemType Directory -Path $destinationPath | Out-Null
Get-ChildItem -LiteralPath $source -Force |
    Copy-Item -Destination $destinationPath -Recurse -Force

$projectFile = Join-Path $destinationPath 'project.json'
$project = Get-Content -LiteralPath $projectFile -Raw | ConvertFrom-Json
$project.projectId = $ProjectId
$project.title = if ($Title) { $Title } else { $ProjectId -replace '[_-]+', ' ' }
$project | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $projectFile -Encoding utf8

$statusFile = Join-Path $destinationPath 'PROJECT_STATUS.md'
$status = Get-Content -LiteralPath $statusFile -Raw
$status = $status.Replace('`replace_me`', ('`' + $ProjectId + '`'))
Set-Content -LiteralPath $statusFile -Value $status -Encoding utf8

Write-Output "Created project: $destinationPath"
Write-Output "Next: complete project.json, PROJECT_STATUS.md, and content/source_transcript.md"
