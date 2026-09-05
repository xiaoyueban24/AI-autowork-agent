@echo off
title 智备教案 - 一键启动
cd /d "%~dp0"

echo ============================================
echo   智备教案 - 一体化生成台 一键启动
echo   AI大赛参赛作品 AI-autowork-agent
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 goto NONODE

set PORT_STATE=DOWN
for /f %%R in ('powershell -NoProfile -Command "try { (New-Object Net.Sockets.TcpClient('127.0.0.1',3000)).Close(); 'UP' } catch { 'DOWN' }"') do set PORT_STATE=%%R

if "%PORT_STATE%"=="UP" goto RUNNING

echo [启动] 正在启动生成服务...
start "智备教案服务" /min cmd /c "cd /d "%~dp0zhibei-lesson" && node server.js"
echo [等待] 服务启动中...
timeout /t 4 /nobreak >nul
goto OPEN

:RUNNING
echo [OK] 服务已在运行 直接打开浏览器

:OPEN
start "" http://localhost:3000
echo.
echo ============================================
echo   已启动: http://localhost:3000
echo   填课程信息 一键生成全套
echo   产物目录: zhibei-lesson\output-unified
echo   Word教案 教案PDF 课件PPTX HTML PDF
echo   停止服务: 关闭 智备教案服务 窗口
echo ============================================
echo.
echo 提示: 比赛工作台 窗口1 一体化生成台 也可直接使用
pause
exit /b 0

:NONODE
echo [错误] 未检测到 Node.js 请先安装 nodejs.org
pause
exit /b 1
