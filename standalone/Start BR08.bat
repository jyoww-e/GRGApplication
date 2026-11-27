@echo off
"%~dp0node.exe" "%~dp0src\index.js" %*
exit /b %errorlevel%
