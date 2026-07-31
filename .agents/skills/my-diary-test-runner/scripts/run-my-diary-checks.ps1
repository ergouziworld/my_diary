param(
  [switch]$SkipBuild,
  [switch]$IncludeLint
)

$ErrorActionPreference = "Stop"

function Invoke-Check {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Command
  )

  Write-Host ""
  Write-Host "==> $Name" -ForegroundColor Cyan
  Write-Host $Command -ForegroundColor DarkGray

  powershell -NoProfile -ExecutionPolicy Bypass -Command $Command
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed with exit code $LASTEXITCODE"
  }
}

if (-not (Test-Path -LiteralPath "package.json")) {
  throw "Run this script from the my_diary repository root."
}

Invoke-Check -Name "Prisma generate" -Command "npm run prisma:generate"
Invoke-Check -Name "TypeScript check" -Command "npx tsc --noEmit"

if ($IncludeLint) {
  Invoke-Check -Name "Lint" -Command "npm run lint"
}

if (-not $SkipBuild) {
  Invoke-Check -Name "Next build" -Command "npm run build"
}

Write-Host ""
Write-Host "All requested my_diary checks passed." -ForegroundColor Green
