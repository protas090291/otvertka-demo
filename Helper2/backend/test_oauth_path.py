#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Тест OAuth токена и пути к папке"""

import requests
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

token = os.getenv('YANDEX_DISK_TOKEN')
folder_path = os.getenv('YANDEX_DISK_FOLDER_PATH', '/')

print("=" * 60)
print("ТЕСТ OAuth ТОКЕНА И ПУТИ")
print("=" * 60)
print(f"\nToken: {'Set' if token else 'NOT SET'}")
print(f"Folder path: {repr(folder_path)}")

if not token:
    print("\nОШИБКА: Токен не установлен!")
    exit(1)

url = 'https://cloud-api.yandex.net/v1/disk/resources'
headers = {'Authorization': f'OAuth {token}', 'Accept': 'application/json'}

# Тест 1: Проверяем корневые папки
print("\n" + "=" * 60)
print("ТЕСТ 1: Корневые папки")
print("=" * 60)
params = {'path': '/', 'limit': 100}
try:
    r = requests.get(url, headers=headers, params=params, timeout=30)
    if r.status_code == 200:
        data = r.json()
        items = data.get('_embedded', {}).get('items', [])
        folders = [item for item in items if item.get('type') == 'dir']
        print(f"Найдено {len(folders)} папок:")
        for folder in folders[:5]:
            print(f"  - {folder.get('name')} (путь: {folder.get('path')})")
    else:
        print(f"Ошибка: {r.status_code} - {r.text}")
except Exception as e:
    print(f"Ошибка: {e}")

# Тест 2: Проверяем конкретную папку
print("\n" + "=" * 60)
print(f"ТЕСТ 2: Папка '{folder_path}'")
print("=" * 60)
params = {'path': folder_path, 'limit': 100}
try:
    r = requests.get(url, headers=headers, params=params, timeout=30)
    if r.status_code == 200:
        data = r.json()
        items = data.get('_embedded', {}).get('items', [])
        print(f"Найдено {len(items)} элементов:")
        for item in items[:10]:
            print(f"  - {item.get('name')} ({item.get('type')})")
    elif r.status_code == 404:
        print(f"ОШИБКА: Папка не найдена!")
        print(f"Проверьте правильность пути: {folder_path}")
        print("\nПопробуйте варианты:")
        print("  - /Вишневый_сад-3_для_Заказчика")
        print("  - /Вишневый сад-3 для Заказчика")
    else:
        print(f"Ошибка: {r.status_code} - {r.text}")
except Exception as e:
    print(f"Ошибка: {e}")

print("\n" + "=" * 60)




