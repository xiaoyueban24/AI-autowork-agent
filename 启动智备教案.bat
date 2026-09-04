@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动「智备教案」服务并打开浏览器...
start /min "智备教案服务" cmd /c "node server.js"
timeout /t 2 /nobreak >nul
start "" http://localhost:3000
echo.
echo 智备教案已启动：http://localhost:3000
echo 若浏览器未自动打开，请手动访问上面的地址。
echo 关闭「智备教案服务」窗口即可停止服务。
pause
