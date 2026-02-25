#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Поиск правильной папки с документами
"""

import requests
import json
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

public_key = os.getenv('YANDEX_DISK_PUBLIC_KEY')
public_url = f"https://disk.yandex.ru/d/{public_key}"

print("=" * 60)
print("ПОИСК ПРАВИЛЬНОЙ ПАПКИ С ДОКУМЕНТАМИ")
print("=" * 60)
print()

url = "https://cloud-api.yandex.net/v1/disk/public/resources"
params = {
    'public_key': public_url,
    'limit': 100
}

try:
    response = requests.get(url, params=params, timeout=30)
    
    if response.status_code == 200:
        data = response.json()
        items = data.get('_embedded', {}).get('items', [])
        
        print(f"Всего элементов в корневой папке: {len(items)}")
        print()
        print("Список всех папок и файлов:")
        print("-" * 60)
        
        # Ищем папки, которые не являются папками квартир
        non_apartment_folders = []
        
        for i, item in enumerate(items, 1):
            name = item.get('name', 'N/A')
            item_type = item.get('type', 'N/A')
            path = item.get('path', 'N/A')
            
            # Проверяем, является ли это папкой квартиры
            # Папки квартир обычно начинаются с "У" или "Т" и номера
            is_apartment = False
            if name.startswith('У') or name.startswith('Т'):
                # Проверяем, есть ли после буквы цифры
                if len(name) > 1 and name[1:4].isdigit():
                    is_apartment = True
            
            if not is_apartment:
                non_apartment_folders.append(item)
                print(f"  [{i}] {name} ({item_type}) - {path}")
            else:
                print(f"  {i}. {name} ({item_type}) - папка квартиры")
        
        print("-" * 60)
        print()
        
        if non_apartment_folders:
            print(f"Найдено папок/файлов, которые НЕ являются папками квартир: {len(non_apartment_folders)}")
            print()
            print("Возможные папки с документами:")
            for folder in non_apartment_folders:
                print(f"  - {folder.get('name', 'N/A')} ({folder.get('type', 'N/A')})")
        else:
            print("Не найдено папок, которые не являются папками квартир")
            print("Возможно, нужная папка находится внутри одной из папок квартир")
            
    else:
        print(f"Ошибка: {response.status_code}")
        
except Exception as e:
    print(f"Исключение: {str(e)}")
    import traceback
    traceback.print_exc()

print()
print("=" * 60)









