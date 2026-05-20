$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
$env:DATABASE_URL = "postgresql://postgres:postgres@db:5432/my_diary?schema=public"
$env:AI_PROVIDER = "mock"
npm.cmd run dev -- --port 3000 --hostname 127.0.0.1
