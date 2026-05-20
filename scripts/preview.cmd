@echo off
set DATABASE_URL=postgresql://postgres:postgres@db:5432/my_diary?schema=public
set AI_PROVIDER=mock
cd /d %~dp0..
npm.cmd run build && npm.cmd run start -- --hostname 127.0.0.1 --port 3000
