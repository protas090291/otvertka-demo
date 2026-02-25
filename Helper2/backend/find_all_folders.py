#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Поиск всех папок, включая "Вишневый_сад-3_для Заказчика"
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
print("ПОИСК ВСЕХ ПАПОК")
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
        root_name = data.get('name', 'N/A')
        print(f"Корневая папка: {root_name}")
        print()
        
        items = data.get('_embedded', {}).get('items', [])
        print(f"Всего элементов: {len(items)}")
        print()
        print("ВСЕ ПАПКИ И ФАЙЛЫ:")
        print("-" * 60)
        
        for i, item in enumerate(items, 1):
            name = item.get('name', 'N/A')
            item_type = item.get('type', 'N/A')
            path = item.get('path', 'N/A')
            
            # Выделяем папки, которые могут быть нужными
            is_target = False
            if 'заказчик' in name.lower() or 'фото' in name.lower():
                is_target = True
            
            marker = ">>> " if is_target else "    "
            print(f"{marker}{i}. {name} ({item_type})")
            if is_target:
                print(f"     Путь: {path}")
        
        print("-" * 60)
        print()
        
        # Ищем папку с "заказчик" или "фото"
        target_folders = []
        for item in items:
            name = item.get('name', '').lower()
            if 'заказчик' in name or 'фото' in name:
                target_folders.append(item)
        
        if target_folders:
            print(f"Найдено потенциальных папок: {len(target_folders)}")
            print()
            for folder in target_folders:
                print(f"Папка: {folder.get('name', 'N/A')}")
                print(f"Путь: {folder.get('path', 'N/A')}")
                print()
                
                # Проверяем содержимое
                folder_path = folder.get('path', '')
                params2 = {
                    'public_key': public_url,
                    'path': folder_path,
                    'limit': 10
                }
                
                response2 = requests.get(url, params=params2, timeout=30)
                if response2.status_code == 200:
                    data2 = response2.json()
                    items2 = data2.get('_embedded', {}).get('items', [])
                    print(f"  Содержимое: {len(items2)} элементов")
                    if items2:
                        files = [i for i in items2 if i.get('type') == 'file']
                        dirs = [i for i in items2 if i.get('type') == 'dir']
                        print(f"    Файлов: {len(files)}, Папок: {len(dirs)}")
                        if files:
                            print(f"    Первый файл: {files[0].get('name', 'N/A')}")
                print()
        else:
            print("Папки с 'заказчик' или 'фото' не найдены")
            print()
            print("Возможно, нужно использовать другой публичный ключ")
            print("или указать путь к конкретной папке")
                
except Exception as e:
    print(f"Исключение: {str(e)}")
    import traceback
    traceback.print_exc()

print()
print("=" * 60)









