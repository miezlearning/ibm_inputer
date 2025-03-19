@echo off
setlocal EnableDelayedExpansion

:SCAN_FOLDER
echo Memindai folder...
set "count=0"
for /d %%i in (BOX*) do (
    set /a count+=1
    set "folder[!count!]=%%i"
    :: Bersihkan suffix untuk foldername
    set "clean_name=%%i"
    set "clean_name=!clean_name: (Sudah Diinput eArsip)=!"
    set "clean_name=!clean_name: (Belum Diinput eArsip)=!"
    set "foldername[!count!]=!clean_name!"
)

if %count% equ 0 (
    echo Tidak ada folder BOX ditemukan di direktori ini.
)

:MENU
cls
echo Ditemukan %count% folder BOX:
echo.
for /l %%i in (1,1,%count%) do (
    echo %%i. !folder[%%i]!
)
echo.
echo Pilihan:
echo 1. Setel semua ke "Belum Diinput eArsip"
echo 2. Setel semua ke "Sudah Diinput eArsip"
echo 3. Setel folder tertentu ke "Sudah Diinput eArsip"
echo 4. Setel folder tertentu ke "Belum Diinput eArsip"
echo 5. Setel rentang folder BOX ke "Sudah Diinput eArsip" atau "Belum Diinput eArsip"
echo 6. Buat folder BOX secara batch
echo 7. Keluar
echo.
set /p choice="Masukkan pilihan Anda (1-7): "

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
    ren "!folder[%%i]!" "!foldername[%%i]! (Belum Diinput eArsip)"
)
echo Semua folder disetel ke "Belum Diinput eArsip".
pause
goto SCAN_FOLDER

:SET_ALL_DONE
for /l %%i in (1,1,%count%) do (
    ren "!folder[%%i]!" "!foldername[%%i]! (Sudah Diinput eArsip)"
)
echo Semua folder disetel ke "Sudah Diinput eArsip".
pause
goto SCAN_FOLDER

:SET_SPECIFIC_DONE
set /p num="Masukkan nomor folder untuk disetel ke Sudah Diinput eArsip (1-%count%): "
if !num! gtr %count% (
    echo Nomor tidak valid!
    pause
    goto MENU
)
if !num! lss 1 (
    echo Nomor tidak valid!
    pause
    goto MENU
)
ren "!folder[%num%]!" "!foldername[%num%]! (Sudah Diinput eArsip)"
echo Folder !num! disetel ke "Sudah Diinput eArsip".
pause
goto SCAN_FOLDER

:SET_SPECIFIC_BELUM
set /p num="Masukkan nomor folder untuk disetel ke Belum Diinput eArsip (1-%count%): "
if !num! gtr %count% (
    echo Nomor tidak valid!
    pause
    goto MENU
)
if !num! lss 1 (
    echo Nomor tidak valid!
    pause
    goto MENU
)
ren "!folder[%num%]!" "!foldername[%num%]! (Belum Diinput eArsip)"
echo Folder !num! disetel ke "Belum Diinput eArsip".
pause
goto SCAN_FOLDER

:SET_RANGE
set /p start="Masukkan nomor BOX awal (misal, 1 untuk BOX 1): "
set /p end="Masukkan nomor BOX akhir (misal, 5 untuk BOX 5): "
if !start! lss 1 (
    echo Rentang awal tidak valid!
    pause
    goto MENU
)
if !end! lss !start! (
    echo Rentang akhir harus lebih besar atau sama dengan rentang awal!
    pause
    goto MENU
)

echo 1. Setel rentang ke "Sudah Diinput eArsip"
echo 2. Setel rentang ke "Belum Diinput eArsip"
set /p range_choice="Pilih status untuk rentang (1-2): "

set "processed=0"
for /l %%i in (1,1,%count%) do (
    set "current_folder=!foldername[%%i]!"
    for /f "tokens=2" %%n in ("!current_folder!") do (
        set "box_num=%%n"
        if !box_num! geq !start! if !box_num! leq !end! (
            if "!range_choice!"=="1" (
                ren "!folder[%%i]!" "!foldername[%%i]! (Sudah Diinput eArsip)"
                set /a processed+=1
            ) else if "!range_choice!"=="2" (
                ren "!folder[%%i]!" "!foldername[%%i]! (Belum Diinput eArsip)"
                set /a processed+=1
            )
        )
    )
)
if !processed! equ 0 (
    echo Tidak ada folder BOX ditemukan dalam rentang BOX !start! hingga BOX !end!.
) else (
    if "!range_choice!"=="1" (
        echo Rentang BOX !start! hingga BOX !end! disetel ke "Sudah Diinput eArsip" untuk !processed! folder.
    ) else if "!range_choice!"=="2" (
        echo Rentang BOX !start! hingga BOX !end! disetel ke "Belum Diinput eArsip" untuk !processed! folder.
    ) else (
        echo Pilihan tidak valid!
    )
)
pause
goto SCAN_FOLDER

:CREATE_BATCH_BOX
cls
echo Buat Folder BOX Secara Batch
echo.
set /p start="Masukkan nomor BOX awal: "
set /p end="Masukkan nomor BOX akhir: "
if !start! lss 1 (
    echo Rentang awal harus 1 atau lebih besar!
    pause
    goto MENU
)
if !end! lss !start! (
    echo Rentang akhir harus lebih besar atau sama dengan rentang awal!
    pause
    goto MENU
)

for /l %%i in (!start!,1,!end!) do (
    mkdir "BOX %%i" 2>nul
    if errorlevel 1 (
        echo Folder "BOX %%i" sudah ada atau gagal dibuat.
    ) else (
        echo Membuat "BOX %%i".
    )
)
echo Pembuatan folder BOX batch selesai.
pause
goto SCAN_FOLDER
