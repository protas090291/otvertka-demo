#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Поиск всех папок и их содержимого"""

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

print("=" * 60)
print("ПОИСК ВСЕХ ПАПОК В КОРНЕ")
print("=" * 60)

# Получаем все корневые папки
params = {'path': '/', 'limit': 1000}
try:
    r = requests.get(url, headers=headers, params=params, timeout=30)
    if r.status_code == 200:
        data = r.json()
        items = data.get('_embedded', {}).get('items', [])
        all_folders = [item for item in items if item.get('type') == 'dir']
        
        print(f"\nНайдено {len(all_folders)} папок в корне:\n")
        
        # Проверяем содержимое каждой папки, связанной с проектом
        for folder in all_folders:
            folder_name = folder.get('name', '')
            folder_path = folder.get('path', '')
            
            # Проверяем только папки, связанные с проектом
            if any(word in folder_name.lower() for word in ['вишневый', 'сад', 'заказчик', 'проект', 'документ']):
                print("=" * 60)
                print(f"ПАПКА: {folder_name}")
                print(f"Путь: {folder_path}")
                print("=" * 60)
                
                # Получаем содержимое
                sub_params = {'path': folder_path, 'limit': 100}
                try:
                    sub_r = requests.get(url, headers=headers, params=sub_params, timeout=30)
                    if sub_r.status_code == 200:
                        sub_data = sub_r.json()
                        sub_items = sub_data.get('_embedded', {}).get('items', [])
                        sub_folders = [item for item in sub_items if item.get('type') == 'dir']
                        sub_files = [item for item in sub_items if item.get('type') == 'file']
                        
                        print(f"Всего: {len(sub_items)} (папок: {len(sub_folders)}, файлов: {len(sub_files)})")
                        
                        if sub_folders:
                            print("\nПОДПАПКИ:")
                            for sub_folder in sub_folders[:20]:
                                print(f"  - {sub_folder.get('name')}")
                            if len(sub_folders) > 20:
                                print(f"  ... и еще {len(sub_folders) - 20}")
                        
                        if sub_files:
                            print("\nФАЙЛЫ (первые 5):")
                            for sub_file in sub_files[:5]:
                                print(f"  - {sub_file.get('name')}")
                    else:
                        print(f"Ошибка доступа: {sub_r.status_code}")
                except Exception as e:
                    print(f"Ошибка: {e}")
                
                print()
    else:
        print(f"Ошибка: {r.status_code}")
        print(r.text)
except Exception as e:
    print(f"Ошибка: {e}")
    import traceback
    traceback.print_exc()

print("=" * 60)
print("Пожалуйста, скажите:")
print("1. Какое название у правильной папки?")
print("2. Какие подпапки вы видите в ней?")
print("=" * 60)




