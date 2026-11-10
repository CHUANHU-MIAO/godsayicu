@echo off
setlocal
set "NODE_DIR=C:\Users\Administrator\.local\lib\node\current"

if not exist "%NODE_DIR%\node.exe" (
  echo [ERROR] Node not found: %NODE_DIR%
  pause
  exit /b 1
)

set "PATH=%NODE_DIR%;%PATH%"
cd /d "%~dp0web"

echo ==========================================
echo   WenTian dev server
echo   http://localhost:3000
echo   Close this window to stop.
echo ==========================================
echo.

call npm run dev

echo.
echo Server stopped.
pause
