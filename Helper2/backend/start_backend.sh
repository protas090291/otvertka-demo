#!/bin/bash
# Запуск бэкенда (FastAPI на порту 8000)
cd "$(dirname "$0")"
echo "Запуск бэкенда на http://localhost:8000 ..."
echo "Документация API: http://localhost:8000/docs"
echo "Остановка: Ctrl+C"
echo ""
python3 simple_main.py
