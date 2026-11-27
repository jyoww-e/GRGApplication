@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "INSTALL_DIR=C:\ProgramData\Grgbanking\ytzn_devbase"

if not exist "%INSTALL_DIR%\Dll" mkdir "%INSTALL_DIR%\Dll"
if errorlevel 1 exit /b 1
xcopy "%SCRIPT_DIR%Windows\Dll" "%INSTALL_DIR%\Dll" /E /I /Y /V
if errorlevel 1 exit /b 1

echo YTZN_DevBase debug DLLs installed to "%INSTALL_DIR%".
endlocal