@echo off
chcp 65001 > nul
title HTS 시뮬레이터 Pro 2026

echo.
echo  ╔══════════════════════════════════════╗
echo  ║   📊 HTS 시뮬레이터 Pro 2026 시작   ║
echo  ╚══════════════════════════════════════╝
echo.

:: Python 설치 확인
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo  [오류] Python이 설치되어 있지 않습니다.
    echo  https://www.python.org 에서 Python을 설치해 주세요.
    pause
    exit /b
)

:: Flask 설치 확인 및 자동 설치
echo  [1/3] Flask 패키지 확인 중...
python -c "import flask" > nul 2>&1
if %errorlevel% neq 0 (
    echo  Flask가 없어서 자동 설치합니다...
    pip install flask
)
echo       완료!

:: app.py 존재 확인
if not exist "%~dp0app.py" (
    echo.
    echo  [오류] app.py 파일을 찾을 수 없습니다.
    echo  이 bat 파일과 같은 폴더에 app.py, templates\index.html 이 있어야 합니다.
    pause
    exit /b
)

:: templates 폴더 및 index.html 확인
if not exist "%~dp0templates\index.html" (
    echo  [2/3] templates 폴더 생성 및 index.html 이동 중...
    if not exist "%~dp0templates" mkdir "%~dp0templates"
    if exist "%~dp0index.html" (
        copy "%~dp0index.html" "%~dp0templates\index.html" > nul
        echo       완료!
    ) else (
        echo  [오류] index.html 파일을 찾을 수 없습니다.
        echo  templates\ 폴더 안에 index.html을 넣어주세요.
        pause
        exit /b
    )
) else (
    echo  [2/3] 파일 구조 확인 완료!
)

echo  [3/3] Flask 서버 시작 중...
echo.
echo  ─────────────────────────────────────
echo   서버 주소: http://127.0.0.1:5000
echo   종료하려면 이 창을 닫으세요.
echo  ─────────────────────────────────────
echo.

:: 3초 후 브라우저 자동 오픈
start "" cmd /c "timeout /t 2 > nul && start http://127.0.0.1:5000"

:: Flask 서버 실행 (현재 bat 파일 위치 기준)
cd /d "%~dp0"
python app.py

pause