@echo off
set DATABASE_URL=postgresql://postgres:postgres@db:5432/my_diary?schema=public
set AI_PROVIDER=mock
cd /d %~dp0..
npm.cmd run dev -- --port 3000 --hostname 127.0.0.1
