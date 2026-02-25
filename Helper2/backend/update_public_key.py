#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Обновление публичного ключа Яндекс Диска
"""

import os
import sys
from pathlib import Path

# Настройка кодировки для Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Новый публичный ключ
NEW_PUBLIC_KEY = "430f03O1cR8Yag"

# Путь к файлу .env
ENV_FILE_PATH = Path(__file__).parent / ".env"

def update_env_file():
    """Обновить файл .env с новым публичным ключом"""
    
    # Читаем существующий файл
    env_lines = []
    if ENV_FILE_PATH.exists():
        with open(ENV_FILE_PATH, 'r', encoding='utf-8') as f:
            env_lines = f.readlines()
    
    # Обновляем или добавляем YANDEX_DISK_PUBLIC_KEY
    updated = False
    new_lines = []
    for line in env_lines:
        if line.startswith('YANDEX_DISK_PUBLIC_KEY='):
            new_lines.append(f'YANDEX_DISK_PUBLIC_KEY={NEW_PUBLIC_KEY}\n')
            updated = True
        else:
            new_lines.append(line)
    
    # Если не нашли, добавляем в конец
    if not updated:
        new_lines.append(f'\n# Публичный ключ папки (обновлен)\n')
        new_lines.append(f'YANDEX_DISK_PUBLIC_KEY={NEW_PUBLIC_KEY}\n')
    
    # Записываем обновленный файл
    with open(ENV_FILE_PATH, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print("=" * 60)
    print("Обновление публичного ключа Яндекс Диска")
    print("=" * 60)
    print()
    print(f"[OK] Публичный ключ обновлен: {NEW_PUBLIC_KEY}")
    print(f"Путь к файлу: {ENV_FILE_PATH}")
    print()
    print("[!] Перезапустите backend сервер для применения изменений")
    print()

if __name__ == "__main__":
    update_env_file()









