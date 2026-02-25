#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тест открытия папки по пути
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
print("ТЕСТ ОТКРЫТИЯ ПАПКИ ПО ПУТИ")
print("=" * 60)
print()

# Сначала получаем список папок в корне
url = "https://cloud-api.yandex.net/v1/disk/public/resources"
params = {
    'public_key': public_url,
    'limit': 10
}

try:
    response = requests.get(url, params=params, timeout=30)
    
    if response.status_code == 200:
        data = response.json()
        items = data.get('_embedded', {}).get('items', [])
        
        # Находим первую папку
        folders = [item for item in items if item.get('type') == 'dir']
        
        if folders:
            test_folder = folders[0]
            folder_path = test_folder.get('path', '')
            folder_name = test_folder.get('name', 'N/A')
            
            print(f"Тестируем папку: {folder_name}")
            print(f"Путь: {folder_path}")
            print()
            
            # Пробуем открыть папку
            params2 = {
                'public_key': public_url,
                'path': folder_path,
                'limit': 20
            }
            
            print("Запрос к API:")
            print(f"  URL: {url}")
            print(f"  Параметры: {json.dumps(params2, indent=2, ensure_ascii=False)}")
            print()
            
            response2 = requests.get(url, params=params2, timeout=30)
            
            print(f"Статус: {response2.status_code}")
            
            if response2.status_code == 200:
                data2 = response2.json()
                items2 = data2.get('_embedded', {}).get('items', [])
                print(f"[OK] Успешно! Найдено элементов: {len(items2)}")
                
                if items2:
                    print()
                    print("Содержимое папки:")
                    for i, item in enumerate(items2[:5], 1):
                        print(f"  {i}. {item.get('name', 'N/A')} ({item.get('type', 'N/A')})")
            else:
                print(f"[ERROR] Ошибка: {response2.status_code}")
                try:
                    error_data = response2.json()
                    print(f"Сообщение: {error_data.get('message', 'N/A')}")
                    print(f"Описание: {error_data.get('description', 'N/A')}")
                except:
                    print(f"Ответ: {response2.text[:500]}")
        else:
            print("[WARNING] Папки не найдены в корневой папке")
    else:
        print(f"[ERROR] Ошибка получения корневой папки: {response.status_code}")
        
except Exception as e:
    print(f"[ERROR] Исключение: {str(e)}")
    import traceback
    traceback.print_exc()

print()
print("=" * 60)









