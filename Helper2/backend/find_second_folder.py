#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Поиск второй папки "Вишневый_сад-3_для Заказчика"
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
print("ПОИСК ПРАВИЛЬНОЙ ПАПКИ 'Вишневый_сад-3_для Заказчика'")
print("=" * 60)
print()

# Сначала получаем корневую папку (родительскую)
# Нужно найти папку, которая содержит обе папки
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
        print(f"Найдено элементов: {len(items)}")
        print()
        
        # Ищем папку "Вишневый_сад-3_для Заказчика"
        target_folder = None
        for item in items:
            name = item.get('name', '')
            # Ищем папку, которая содержит "для Заказчика" или похожее
            if 'заказчика' in name.lower() or 'заказчик' in name.lower():
                target_folder = item
                print(f"[НАЙДЕНО] Папка: {name}")
                print(f"  Путь: {item.get('path', 'N/A')}")
                print(f"  Тип: {item.get('type', 'N/A')}")
                break
        
        if not target_folder:
            print("Папка 'Вишневый_сад-3_для Заказчика' не найдена в корневой папке")
            print()
            print("Все папки в корневой папке:")
            for i, item in enumerate(items[:10], 1):
                print(f"  {i}. {item.get('name', 'N/A')} ({item.get('type', 'N/A')})")
        else:
            # Проверяем содержимое найденной папки
            print()
            print("Проверяем содержимое папки...")
            folder_path = target_folder.get('path', '')
            
            params2 = {
                'public_key': public_url,
                'path': folder_path,
                'limit': 50
            }
            
            response2 = requests.get(url, params=params2, timeout=30)
            
            if response2.status_code == 200:
                data2 = response2.json()
                items2 = data2.get('_embedded', {}).get('items', [])
                
                print(f"Найдено элементов в папке: {len(items2)}")
                print()
                
                if items2:
                    print("Первые 10 элементов:")
                    files_count = 0
                    dirs_count = 0
                    for i, item in enumerate(items2[:10], 1):
                        item_type = item.get('type', 'N/A')
                        item_name = item.get('name', 'N/A')
                        item_size = item.get('size', 0)
                        
                        if item_type == 'file':
                            files_count += 1
                            print(f"  {i}. [ФАЙЛ] {item_name} ({item_size} байт)")
                        else:
                            dirs_count += 1
                            print(f"  {i}. [ПАПКА] {item_name}")
                    
                    print()
                    print(f"Всего файлов: {files_count}")
                    print(f"Всего папок: {dirs_count}")
                    
                    print()
                    print("=" * 60)
                    print("РЕЗУЛЬТАТ:")
                    print(f"Правильная папка: {target_folder.get('name', 'N/A')}")
                    print(f"Путь к папке: {folder_path}")
                    print("=" * 60)
                else:
                    print("Папка пуста")
            else:
                print(f"Ошибка при получении содержимого: {response2.status_code}")
                
    else:
        print(f"Ошибка: {response.status_code}")
        
except Exception as e:
    print(f"Исключение: {str(e)}")
    import traceback
    traceback.print_exc()

print()









