#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Проверка реального содержимого папки через API Яндекс Диска"""

import requests
import os
from pathlib import Path
from dotenv import load_dotenv
import json

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

token = os.getenv('YANDEX_DISK_TOKEN')
folder_path = os.getenv('YANDEX_DISK_FOLDER_PATH', '/')

print("=" * 60)
print("ПРОВЕРКА РЕАЛЬНОГО СОДЕРЖИМОГО ПАПКИ")
print("=" * 60)
print(f"\nToken: {'Set' if token else 'NOT SET'}")
print(f"Folder path: {repr(folder_path)}")

if not token:
    print("\nОШИБКА: Токен не установлен!")
    exit(1)

url = 'https://cloud-api.yandex.net/v1/disk/resources'
headers = {'Authorization': f'OAuth {token}', 'Accept': 'application/json'}

# Проверяем корневые папки
print("\n" + "=" * 60)
print("ШАГ 1: Список корневых папок")
print("=" * 60)
params = {'path': '/', 'limit': 100}
try:
    r = requests.get(url, headers=headers, params=params, timeout=30)
    if r.status_code == 200:
        data = r.json()
        items = data.get('_embedded', {}).get('items', [])
        folders = [item for item in items if item.get('type') == 'dir']
        print(f"Найдено {len(folders)} папок в корне:")
        for folder in folders:
            name = folder.get('name', '')
            path = folder.get('path', '')
            print(f"  - {name}")
            print(f"    Путь: {path}")
            if 'заказчик' in name.lower() or 'вишневый' in name.lower() or 'сад' in name.lower():
                print(f"    >>> ЭТА ПАПКА!")
    else:
        print(f"Ошибка: {r.status_code}")
        print(r.text)
except Exception as e:
    print(f"Ошибка: {e}")

# Проверяем конкретную папку
print("\n" + "=" * 60)
print(f"ШАГ 2: Содержимое папки '{folder_path}'")
print("=" * 60)
params = {'path': folder_path, 'limit': 1000}
try:
    r = requests.get(url, headers=headers, params=params, timeout=30)
    print(f"Статус ответа: {r.status_code}")
    
    if r.status_code == 200:
        data = r.json()
        print(f"\nИмя папки: {data.get('name', 'N/A')}")
        print(f"Путь папки: {data.get('path', 'N/A')}")
        
        items = data.get('_embedded', {}).get('items', [])
        print(f"\nВсего элементов: {len(items)}")
        
        folders = [item for item in items if item.get('type') == 'dir']
        files = [item for item in items if item.get('type') == 'file']
        
        print(f"Папок: {len(folders)}")
        print(f"Файлов: {len(files)}")
        
        print("\n" + "-" * 60)
        print("СПИСОК ПАПОК:")
        print("-" * 60)
        for folder in folders:
            name = folder.get('name', '')
            path = folder.get('path', '')
            modified = folder.get('modified', '')
            print(f"  - {name}")
            print(f"    Путь: {path}")
            if modified:
                print(f"    Изменена: {modified}")
        
        print("\n" + "-" * 60)
        print("СПИСОК ФАЙЛОВ (первые 10):")
        print("-" * 60)
        for file in files[:10]:
            name = file.get('name', '')
            size = file.get('size', 0)
            size_mb = size / (1024 * 1024) if size > 0 else 0
            print(f"  - {name} ({size_mb:.2f} MB)")
        
        # Сохраняем полный ответ для анализа
        print("\n" + "=" * 60)
        print("Полный JSON ответ сохранен в response.json")
        with open('response.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
    elif r.status_code == 404:
        print(f"\nОШИБКА: Папка не найдена!")
        print(f"Проверьте путь: {folder_path}")
        print("\nПопробуйте найти правильный путь из списка корневых папок выше")
    else:
        print(f"\nОшибка: {r.status_code}")
        print(r.text)
        
except Exception as e:
    print(f"Ошибка: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)




