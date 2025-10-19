@echo off
cd /d "%~dp0"
start "" cmd /c "npm run dev"
start "" http://localhost:5173
