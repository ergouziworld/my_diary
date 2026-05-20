@echo off
setlocal
set DATABASE_URL=postgresql://postgres:postgres@db:5432/my_diary?schema=public
set AI_PROVIDER=mock
cd /d %~dp0..

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
  taskkill /PID %%p /F >nul 2>nul
)

if exist .next (
  rmdir /s /q .next
)

npm.cmd run dev -- --port 3000 --hostname 127.0.0.1
