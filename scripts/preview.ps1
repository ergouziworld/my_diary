$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
$env:DATABASE_URL = "postgresql://postgres:postgres@db:5432/my_diary?schema=public"
$env:AI_PROVIDER = "mock"
npm.cmd run build
npm.cmd run start -- --hostname 127.0.0.1 --port 3000
