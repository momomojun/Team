@echo off
rem NPS Guide: stop what start.cmd started.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local.ps1" -Stop
pause
