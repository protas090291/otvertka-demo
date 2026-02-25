#!/usr/bin/env python3
import os
import subprocess
import sys

# Получаем абсолютный путь к директории Helper2
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

print(f"📂 Рабочая директория: {os.getcwd()}")

# Проверяем наличие package.json
if not os.path.exists('package.json'):
    print("❌ package.json не найден!")
    sys.exit(1)

# Проверяем наличие node_modules
if not os.path.exists('node_modules'):
    print("📦 Установка зависимостей...")
    result = subprocess.run(['npm', 'install'], capture_output=False)
    if result.returncode != 0:
        print("❌ Ошибка при установке зависимостей")
        sys.exit(1)
    print("✅ Зависимости установлены")
else:
    print("✅ Зависимости уже установлены")

# Запускаем dev сервер
print("🚀 Запуск frontend сервера...")
print("   Frontend будет доступен на http://localhost:5173 (или 5175)")
subprocess.run(['npm', 'run', 'dev'])
