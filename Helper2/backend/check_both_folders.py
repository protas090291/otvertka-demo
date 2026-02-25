#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Проверка обеих папок"""

import requests
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

token = os.getenv('YANDEX_DISK_TOKEN')

if not token:
    print("ОШИБКА: Токен не установлен!")
    exit(1)

url = 'https://cloud-api.yandex.net/v1/disk/resources'
headers = {'Authorization': f'OAuth {token}', 'Accept': 'application/json'}

folders_to_check = [
    '/Вишневый_сад-3_дополнительные документы',
    '/Вишневый_сад-3_для_Заказчика'
]

print("=" * 60)
print("ПРОВЕРКА ОБЕИХ ПАПОК")
print("=" * 60)

for folder_path in folders_to_check:
    print("\n" + "=" * 60)
    print(f"ПАПКА: {folder_path}")
    print("=" * 60)
    
    params = {'path': folder_path, 'limit': 1000}
    try:
        r = requests.get(url, headers=headers, params=params, timeout=30)
        if r.status_code == 200:
            data = r.json()
            items = data.get('_embedded', {}).get('items', [])
            folders = [item for item in items if item.get('type') == 'dir']
            files = [item for item in items if item.get('type') == 'file']
            
            print(f"Всего элементов: {len(items)}")
            print(f"Папок: {len(folders)}")
            print(f"Файлов: {len(files)}")
            
            if folders:
                print("\nПОДПАПКИ:")
                for folder in folders[:15]:
                    print(f"  - {folder.get('name')}")
            
            if files:
                print("\nФАЙЛЫ (первые 5):")
                for file in files[:5]:
                    print(f"  - {file.get('name')}")
        elif r.status_code == 404:
            print(f"Папка не найдена: {folder_path}")
        else:
            print(f"Ошибка {r.status_code}: {r.text[:200]}")
    except Exception as e:
        print(f"Ошибка: {e}")

print("\n" + "=" * 60)
print("КАКАЯ ПАПКА ПРАВИЛЬНАЯ?")
print("=" * 60)
print("Скажите, какие подпапки вы видите в настоящей папке,")
print("и я настрою правильный путь.")
print("=" * 60)




