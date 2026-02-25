#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Поиск правильного пути к папке"""

import requests
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

token = os.getenv('YANDEX_DISK_TOKEN')

if not token:
    print("ОШИБКА: YANDEX_DISK_TOKEN не установлен!")
    exit(1)

print("=" * 60)
print("ПОИСК ПРАВИЛЬНОГО ПУТИ К ПАПКЕ")
print("=" * 60)

url = 'https://cloud-api.yandex.net/v1/disk/resources'
headers = {'Authorization': f'OAuth {token}', 'Accept': 'application/json'}

# Проверяем корневые папки
print("\n1. Проверяю корневые папки...")
params = {'path': '/', 'limit': 100}
try:
    r = requests.get(url, headers=headers, params=params, timeout=30)
    if r.status_code == 200:
        data = r.json()
        items = data.get('_embedded', {}).get('items', [])
        folders = [item for item in items if item.get('type') == 'dir']
        
        print(f"Найдено {len(folders)} папок в корне:")
        print("-" * 60)
        for folder in folders:
            name = folder.get('name', '')
            path = folder.get('path', '')
            # Ищем папку с "заказчик" или "вишневый"
            marker = ">>> " if any(word in name.lower() for word in ['заказчик', 'вишневый', 'сад']) else "    "
            print(f"{marker}{name}")
            if marker.strip():
                print(f"     Путь: {path}")
        
        # Ищем конкретную папку
        target_folders = [f for f in folders if any(word in f.get('name', '').lower() for word in ['заказчик', 'вишневый', 'сад'])]
        if target_folders:
            print("\n" + "=" * 60)
            print("НАЙДЕННЫЕ ПОДХОДЯЩИЕ ПАПКИ:")
            print("=" * 60)
            for folder in target_folders:
                print(f"Имя: {folder.get('name')}")
                print(f"Путь: {folder.get('path')}")
                print("-" * 60)
    else:
        print(f"Ошибка API: {r.status_code}")
        print(r.text)
except Exception as e:
    print(f"Ошибка: {e}")

print("\n" + "=" * 60)
print("РЕКОМЕНДАЦИЯ:")
print("=" * 60)
print("Скопируйте правильный путь из списка выше")
print("и укажите его в .env файле как YANDEX_DISK_FOLDER_PATH")
print("=" * 60)




