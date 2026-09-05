@echo off
chcp 65001 >nul
setlocal

REM 智备教案 - 一体化生成台 一键启动
REM 启动本地 zhibei-lesson 服务（如果未运行），然后打开一体化生成台

set ROOT=%~dp0
set PORT=3000

echo ========================================
echo   智备教案 - 一体化生成台
echo ========================================
echo.

REM 1) 检查端口 3000 是否已被占用
netstat -ano | findstr ":%PORT% " | findstr LISTENING >nul 2>&1
if %ERRORLEVEL%==0 (
  echo [OK] 端口 %PORT% 已被占用，假定后端服务正在运行
) else (
  echo [INFO] 端口 %PORT% 未占用，尝试启动后端服务...
  cd /d "%ROOT%.."
  if exist "一键启动.bat" (
    start "" cmd /c "call 一键启动.bat"
    echo [OK] 后端启动中，等待 3 秒...
    timeout /t 3 /nobreak >nul
  ) else (
    echo [WARN] 未找到项目根目录的 一键启动.bat，后端将不会自动启动
  )
  cd /d "%ROOT%"
)

REM 2) 用默认浏览器打开一体化生成台（单个页面集成全部功能）
echo.
echo [INFO] 正在打开一体化生成台...
start "" "%ROOT%智备教案.html"

echo.
echo [DONE] 已打开一体化生成台（含生成 + 成品效果总览）
echo        本窗口可关闭，后端服务继续在后台运行
echo.
timeout /t 3 /nobreak >nul
endlocal
exit /b 0
