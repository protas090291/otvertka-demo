#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для автоматического создания файла .env с настройками Яндекс Диска
"""

import os
import sys
from pathlib import Path

# Настройка кодировки для Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Данные для настройки
# Для публичной папки используем только PUBLIC_KEY (токен не нужен)
YANDEX_DISK_TOKEN = ""  # Оставляем пустым для публичной папки
YANDEX_DISK_FOLDER_PATH = ""  # Не нужен для публичной папки
YANDEX_DISK_PUBLIC_KEY = "BSNe4agC5hSAoA"  # Публичный ключ из URL: https://disk.yandex.ru/d/BSNe4agC5hSAoA

# Путь к файлу .env
ENV_FILE_PATH = Path(__file__).parent / ".env"

def create_env_file():
    """Создать файл .env с настройками Яндекс Диска"""
    
    # Содержимое файла .env
    env_content = f"""# ============================================
# Настройки Яндекс Диска
# ============================================
# Автоматически создано скриптом create_env_file.py

# OAuth токен Яндекс Диска (не нужен для публичной папки)
# Оставьте пустым, если используете публичную папку
YANDEX_DISK_TOKEN={YANDEX_DISK_TOKEN}

# Путь к папке на Яндекс Диске (не нужен для публичной папки)
# Оставьте пустым, если используете публичную папку
YANDEX_DISK_FOLDER_PATH={YANDEX_DISK_FOLDER_PATH}

# Публичный ключ папки (для работы с публичной папкой без токена)
# Извлечен из URL: https://disk.yandex.ru/d/BSNe4agC5hSAoA
YANDEX_DISK_PUBLIC_KEY={YANDEX_DISK_PUBLIC_KEY}
"""
    
    try:
        # Проверяем, существует ли файл
        if ENV_FILE_PATH.exists():
            print(f"[!] Файл {ENV_FILE_PATH} уже существует")
            print("[!] Перезаписываю файл...")
        
        # Создаем файл
        with open(ENV_FILE_PATH, 'w', encoding='utf-8') as f:
            f.write(env_content)
        
        print("=" * 60)
        print("[OK] Файл .env успешно создан!")
        print("=" * 60)
        print(f"Путь: {ENV_FILE_PATH}")
        print()
        print("Содержимое:")
        print("-" * 60)
        print(env_content)
        print("-" * 60)
        print()
        print("[OK] Настройка завершена!")
        print("[!] Перезапустите backend сервер для применения изменений")
        print()
        
        return True
        
    except Exception as e:
        print(f"[X] Ошибка при создании файла: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Создание файла .env для Яндекс Диска")
    print("=" * 60)
    print()
    
    success = create_env_file()
    
    if success:
        print("[OK] Готово! Теперь перезапустите backend сервер.")
    else:
        print("[X] Не удалось создать файл. Проверьте права доступа.")

