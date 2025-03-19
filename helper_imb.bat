@echo off
setlocal EnableDelayedExpansion

:: Mengatur warna latar belakang hitam dan teks hijau terang
color 0A

:SCAN_FOLDER
cls
echo Memindai folder...
set "count=0"
for /d %%i in (BOX*) do (
    set /a count+=1
    set "folder[!count!]=%%i"
    set "clean_name=%%i"
    set "clean_name=!clean_name: (Sudah Diinput eArsip)=!"
    set "clean_name=!clean_name: (Belum Diinput eArsip)=!"
    set "foldername[!count!]=!clean_name!"
)

if %count% equ 0 (
    echo.
    echo [91mTidak ada folder BOX ditemukan di direktori ini.[0m
)

:MENU
cls
echo.
echo [96m========================================[0m
echo               IIMB HELPER[0m
echo [96m========================================[0m
echo.
echo [92mDitemukan %count% folder BOX:[0m
echo.
for /l %%i in (1,1,%count%) do (
    echo [94m  %%i. !folder[%%i]![0m
)
echo.
echo [96m----------------------------------------[0m
echo [95mPilihan:[0m
echo [92m  1. Setel semua ke "Belum Diinput eArsip"[0m
echo [92m  2. Setel semua ke "Sudah Diinput eArsip"[0m
echo [92m  3. Setel folder tertentu ke "Sudah Diinput eArsip"[0m
echo [92m  4. Setel folder tertentu ke "Belum Diinput eArsip"[0m
echo [92m  5. Setel rentang folder BOX ke "Sudah Diinput eArsip" atau "Belum Diinput eArsip"[0m
echo [92m  6. Buat folder BOX secara batch[0m
echo [92m  7. Hapus status semua folder[0m
echo [92m  8. Keluar[0m
echo [96m----------------------------------------[0m
echo.
set /p choice="[93mMasukkan pilihan Anda (1-8): [0m"

if "%choice%"=="1" goto SET_ALL_BELUM
if "%choice%"=="2" goto SET_ALL_DONE
if "%choice%"=="3" goto SET_SPECIFIC_DONE
if "%choice%"=="4" goto SET_SPECIFIC_BELUM
if "%choice%"=="5" goto SET_RANGE
if "%choice%"=="6" goto CREATE_BATCH_BOX
if "%choice%"=="7" goto REMOVE_ALL_STATUS
if "%choice%"=="8" exit /b
goto MENU

:SET_ALL_BELUM
cls
echo [96m=== Setel Semua ke "Belum Diinput eArsip" ===[0m
set "processed=0"
for /l %%i in (1,1,%count%) do (
    ren "!folder[%%i]!" "!foldername[%%i]! (Belum Diinput eArsip)" 2>nul
    if not errorlevel 1 set /a processed+=1
)
if !processed! equ 0 (
    echo.
    echo [91mTidak ada folder yang dapat diubah ke "Belum Diinput eArsip".[0m
) else (
    echo.
    echo [92mSemua folder disetel ke "Belum Diinput eArsip" untuk !processed! folder.[0m
)
echo.
pause
goto SCAN_FOLDER

:SET_ALL_DONE
cls
echo [96m=== Setel Semua ke "Sudah Diinput eArsip" ===[0m
set "processed=0"
for /l %%i in (1,1,%count%) do (
    ren "!folder[%%i]!" "!foldername[%%i]! (Sudah Diinput eArsip)" 2>nul
    if not errorlevel 1 set /a processed+=1
)
if !processed! equ 0 (
    echo.
    echo [91mTidak ada folder yang dapat diubah ke "Sudah Diinput eArsip".[0m
) else (
    echo.
    echo [92mSemua folder disetel ke "Sudah Diinput eArsip" untuk !processed! folder.[0m
)
echo.
pause
goto SCAN_FOLDER

:SET_SPECIFIC_DONE
cls
echo [96m=== Setel Folder Tertentu ke "Sudah Diinput eArsip" ===[0m
set /p num="[93mMasukkan nomor BOX (misal, 1 untuk BOX 1): [0m"
if !num! lss 1 (
    echo.
    echo [91mNomor tidak valid! Harus lebih besar dari 0.[0m
    pause
    goto MENU
)
set "found=0"
for /l %%i in (1,1,%count%) do (
    set "current_folder=!foldername[%%i]!"
    for /f "tokens=2" %%n in ("!current_folder!") do (
        if "%%n"=="!num!" (
            ren "!folder[%%i]!" "!foldername[%%i]! (Sudah Diinput eArsip)" 2>nul
            if not errorlevel 1 (
                set "found=1"
                echo.
                echo [92mBOX !num! disetel ke "Sudah Diinput eArsip".[0m
            )
        )
    )
)
if !found! equ 0 (
    echo.
    echo [91mFolder BOX !num! tidak ditemukan atau gagal diubah.[0m
)
echo.
pause
goto SCAN_FOLDER

:SET_SPECIFIC_BELUM
cls
echo [96m=== Setel Folder Tertentu ke "Belum Diinput eArsip" ===[0m
set /p num="[93mMasukkan nomor BOX (misal, 1 untuk BOX 1): [0m"
if !num! lss 1 (
    echo.
    echo [91mNomor tidak valid! Harus lebih besar dari 0.[0m
    pause
    goto MENU
)
set "found=0"
for /l %%i in (1,1,%count%) do (
    set "current_folder=!foldername[%%i]!"
    for /f "tokens=2" %%n in ("!current_folder!") do (
        if "%%n"=="!num!" (
            ren "!folder[%%i]!" "!foldername[%%i]! (Belum Diinput eArsip)" 2>nul
            if not errorlevel 1 (
                set "found=1"
                echo.
                echo [92mBOX !num! disetel ke "Belum Diinput eArsip".[0m
            )
        )
    )
)
if !found! equ 0 (
    echo.
    echo [91mFolder BOX !num! tidak ditemukan atau gagal diubah.[0m
)
echo.
pause
goto SCAN_FOLDER

:SET_RANGE
cls
echo [96m=== Setel Rentang Folder BOX ===[0m
set /p start="[93mMasukkan nomor BOX awal (misal, 1 untuk BOX 1): [0m"
set /p end="[93mMasukkan nomor BOX akhir (misal, 5 untuk BOX 5): [0m"
if !start! lss 1 (
    echo.
    echo [91mRentang awal tidak valid! Harus lebih besar dari 0.[0m
    pause
    goto MENU
)
if !end! lss !start! (
    echo.
    echo [91mRentang akhir harus lebih besar atau sama dengan rentang awal![0m
    pause
    goto MENU
)
echo.
echo [95m  1. Setel rentang ke "Sudah Diinput eArsip"[0m
echo [95m  2. Setel rentang ke "Belum Diinput eArsip"[0m
set /p range_choice="[93mPilih status untuk rentang (1-2): [0m"

set "processed=0"
for /l %%i in (1,1,%count%) do (
    set "current_folder=!foldername[%%i]!"
    for /f "tokens=2" %%n in ("!current_folder!") do (
        set "box_num=%%n"
        if !box_num! geq !start! if !box_num! leq !end! (
            if "!range_choice!"=="1" (
                ren "!folder[%%i]!" "!foldername[%%i]! (Sudah Diinput eArsip)" 2>nul
                if not errorlevel 1 set /a processed+=1
            ) else if "!range_choice!"=="2" (
                ren "!folder[%%i]!" "!foldername[%%i]! (Belum Diinput eArsip)" 2>nul
                if not errorlevel 1 set /a processed+=1
            )
        )
    )
)
echo.
if !processed! equ 0 (
    echo [91mTidak ada folder BOX ditemukan dalam rentang BOX !start! hingga BOX !end!.[0m
) else (
    if "!range_choice!"=="1" (
        echo [92mRentang BOX !start! hingga BOX !end! disetel ke "Sudah Diinput eArsip" untuk !processed! folder.[0m
    ) else if "!range_choice!"=="2" (
        echo [92mRentang BOX !start! hingga BOX !end! disetel ke "Belum Diinput eArsip" untuk !processed! folder.[0m
    ) else (
        echo [91mPilihan tidak valid![0m
    )
)
echo.
pause
goto SCAN_FOLDER

:CREATE_BATCH_BOX
cls
echo [96m=== Buat Folder BOX Secara Batch ===[0m
set /p start="[93mMasukkan nomor BOX awal: [0m"
set /p end="[93mMasukkan nomor BOX akhir: [0m"
if !start! lss 1 (
    echo.
    echo [91mRentang awal harus 1 atau lebih besar![0m
    pause
    goto MENU
)
if !end! lss !start! (
    echo.
    echo [91mRentang akhir harus lebih besar atau sama dengan rentang awal![0m
    pause
    goto MENU
)

set "created=0"
for /l %%i in (!start!,1,!end!) do (
    if not exist "BOX %%i" (
        mkdir "BOX %%i" 2>nul
        if not errorlevel 1 (
            echo [92mMembuat "BOX %%i".[0m
            set /a created+=1
        )
    )
)
echo.
if !created! equ 0 (
    echo [91mTidak ada folder baru yang dibuat. Semua folder dalam rentang sudah ada.[0m
) else (
    echo [92mPembuatan folder BOX batch selesai. Dibuat !created! folder.[0m
)
echo.
pause
goto SCAN_FOLDER

:REMOVE_ALL_STATUS
cls
echo [96m=== Hapus Status Semua Folder ===[0m
set "processed=0"
for /l %%i in (1,1,%count%) do (
    ren "!folder[%%i]!" "!foldername[%%i]!" 2>nul
    if not errorlevel 1 set /a processed+=1
)
echo.
if !processed! equ 0 (
    echo [91mTidak ada status yang dapat dihapus.[0m
) else (
    echo [92mStatus semua folder telah dihapus untuk !processed! folder.[0m
)
echo.
pause
goto SCAN_FOLDER
