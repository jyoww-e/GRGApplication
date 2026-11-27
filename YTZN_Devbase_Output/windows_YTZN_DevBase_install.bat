@echo off
SETLOCAL EnableDelayedExpansion

rem ####################1.find win7/8/10 or win11################

for /f "tokens=*" %%A in ('wmic os get Caption^|findstr /i "Windows"') do (
    set OS_NAME=%%A
)


rem ####################2.find grgbanking dunite is install################

rem define 
SET "searchDir=Grgbanking"
SET "baseDir=Grgbanking"
SET "subDir=dunite"
SET "binDir=bin"
SET "found=0"
SET "installDir=ytzn_devbase"
SET "installDll=Dll"
SET "outputDll=Windows\Dll"
SET "outputDll_x86=Windows\Dll\x86"
SET "outputDll_x64=Windows\Dll\x64"
SET "outputLib=Windows\Lib"
SET "outputInclude=Include"
SET "foundDisk=C:"

rem Search each disk for Grgbanking\dunite\bin
FOR %%D IN (C D E F G H I J K L M N O P Q R S T U V W X Y Z) DO (
    IF EXIST "%%D:\%searchDir%\%subDir%\%binDir%\" (
        echo Found "%%D:\%searchDir%\%subDir%\%binDir%"
        SET "found=1"
        SET "foundDisk=%%D:"
        goto end_search
    )
)

:end_search

IF !found! EQU 0 (
    echo Grgbanking directory not found in all drives, creating in C: drive...
    mkdir C:\%searchDir%
    SET "foundDisk=C:"
)

rem If still not found (should not happen after creation), show error
IF !found! EQU 0 (
    msg %username% "Error: Failed to create directory." /time:30
)

rem ####################3.install YTZN_DevBase dll and include################

rem Check whether the ytzn_devbase directory exists in the Grgbanking directory. If it does not exist, create it
IF NOT EXIST "%foundDisk%\%baseDir%\%installDir%\" (
    mkdir %foundDisk%\%baseDir%\%installDir%
	echo Directory "%foundDisk%\%baseDir%\%installDir%" created.
) ELSE (
    echo Directory "%foundDisk%\%baseDir%\%installDir%" already exists.
)


set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

rem Copy the x86 and x64 directories in the current directory to the Grgbanking\ytzn_devbase directory
	echo xcopy "%outputDll%"
	xcopy "%outputDll%" "%foundDisk%\%baseDir%\%installDir%\%outputDll:~8%" /E /I /Y /V
	xcopy "%outputLib%" "%foundDisk%\%baseDir%\%installDir%\%outputLib:~8%" /E /I /Y /V

	rem Copy the x86 dll in the current directory to the C:\Windows\System32 directory
	echo xcopy "%outputDll_x64%"
	xcopy "%outputDll_x86%" "C:\Windows\SysWOW64" /E /I /Y /V

	rem Copy the x64 dll in the current directory to the C:\Windows\SysWOW64 directory
	echo xcopy "%outputDll_x64%"
	xcopy "%outputDll_x64%" "C:\Windows\System32" /E /I /Y /V

	rem Copy the Include directory in the current directory under the Grgbanking\ytzn_devbase directory
	xcopy "%outputInclude%" "%foundDisk%\%baseDir%\%installDir%\%outputInclude%" /E /I /Y /V

rem ####################4.set YTZN_DevBase systemPtath################




pause>nul

ENDLOCAL