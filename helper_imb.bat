@echo off
setlocal EnableDelayedExpansion

:SCAN_FOLDER
echo Scanning folders...
set "count=0"
for /d %%i in (BOX*) do (
    set /a count+=1
    set "folder[!count!]=%%i"
    :: Bersihkan suffix untuk foldername
    set "clean_name=%%i"
    set "clean_name=!clean_name: (Belum)=!"
    set "clean_name=!clean_name: (Done)=!"
    set "foldername[!count!]=!clean_name!"
)

if %count% equ 0 (
    echo No BOX folders found in current directory.
)

:MENU
cls
echo Found %count% BOX folders:
echo.
for /l %%i in (1,1,%count%) do (
    echo %%i. !folder[%%i]!
)
echo.
echo Options:
echo 1. Set all to "Belum"
echo 2. Set all to "Done"
echo 3. Set specific folder to "Done"
echo 4. Set specific folder to "Belum"
echo 5. Set range of BOX folders to "Done" or "Belum"
echo 6. Create batch BOX folders
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto SET_ALL_BELUM
if "%choice%"=="2" goto SET_ALL_DONE
if "%choice%"=="3" goto SET_SPECIFIC_DONE
if "%choice%"=="4" goto SET_SPECIFIC_BELUM
if "%choice%"=="5" goto SET_RANGE
if "%choice%"=="6" goto CREATE_BATCH_BOX
if "%choice%"=="7" exit /b
goto MENU

:SET_ALL_BELUM
for /l %%i in (1,1,%count%) do (
    ren "!folder[%%i]!" "!foldername[%%i]! (Belum)"
)
echo All folders set to "Belum".
pause
goto SCAN_FOLDER

:SET_ALL_DONE
for /l %%i in (1,1,%count%) do (
    ren "!folder[%%i]!" "!foldername[%%i]! (Done)"
)
echo All folders set to "Done".
pause
goto SCAN_FOLDER

:SET_SPECIFIC_DONE
set /p num="Enter folder number to set as Done (1-%count%): "
if !num! gtr %count% (
    echo Invalid number!
    pause
    goto MENU
)
if !num! lss 1 (
    echo Invalid number!
    pause
    goto MENU
)
ren "!folder[%num%]!" "!foldername[%num%]! (Done)"
echo Folder !num! set to "Done".
pause
goto SCAN_FOLDER

:SET_SPECIFIC_BELUM
set /p num="Enter folder number to set as Belum (1-%count%): "
if !num! gtr %count% (
    echo Invalid number!
    pause
    goto MENU
)
if !num! lss 1 (
    echo Invalid number!
    pause
    goto MENU
)
ren "!folder[%num%]!" "!foldername[%num%]! (Belum)"
echo Folder !num! set to "Belum".
pause
goto SCAN_FOLDER

:SET_RANGE
set /p start="Enter start BOX number (e.g., 1 for BOX 1): "
set /p end="Enter end BOX number (e.g., 5 for BOX 5): "
if !start! lss 1 (
    echo Invalid start range!
    pause
    goto MENU
)
if !end! lss !start! (
    echo End range must be greater than or equal to start range!
    pause
    goto MENU
)

echo 1. Set range to "Done"
echo 2. Set range to "Belum"
set /p range_choice="Choose status for range (1-2): "

set "processed=0"
for /l %%i in (1,1,%count%) do (
    set "current_folder=!foldername[%%i]!"
    for /f "tokens=2" %%n in ("!current_folder!") do (
        set "box_num=%%n"
        if !box_num! geq !start! if !box_num! leq !end! (
            if "!range_choice!"=="1" (
                ren "!folder[%%i]!" "!foldername[%%i]! (Done)"
                set /a processed+=1
            ) else if "!range_choice!"=="2" (
                ren "!folder[%%i]!" "!foldername[%%i]! (Belum)"
                set /a processed+=1
            )
        )
    )
)
if !processed! equ 0 (
    echo No BOX folders found in range BOX !start! to BOX !end!.
) else (
    if "!range_choice!"=="1" (
        echo Range BOX !start! to BOX !end! set to "Done" for !processed! folders.
    ) else if "!range_choice!"=="2" (
        echo Range BOX !start! to BOX !end! set to "Belum" for !processed! folders.
    ) else (
        echo Invalid choice!
    )
)
pause
goto SCAN_FOLDER

:CREATE_BATCH_BOX
cls
echo Create Batch BOX Folders
echo.
set /p start="Enter start BOX number: "
set /p end="Enter end BOX number: "
if !start! lss 1 (
    echo Start range must be 1 or greater!
    pause
    goto MENU
)
if !end! lss !start! (
    echo End range must be greater than or equal to start range!
    pause
    goto MENU
)

for /l %%i in (!start!,1,!end!) do (
    mkdir "BOX %%i" 2>nul
    if errorlevel 1 (
        echo Folder "BOX %%i" already exists or creation failed.
    ) else (
        echo Created "BOX %%i".
    )
)
echo Batch BOX creation completed.
pause
goto SCAN_FOLDER
