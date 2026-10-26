@echo off
rem NPS Guide: start the Copilot service and the website, then open the trip page.
rem Double-click this file. Add -LocalModel to use only the local Qwen model (no cloud API calls).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local.ps1" %*
pause
