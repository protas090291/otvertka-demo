#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Проверка содержимого папки внутри публичной папки
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
print("ПРОВЕРКА СОДЕРЖИМОГО ПАПОК")
print("=" * 60)
print()

# Проверяем содержимое первой папки
folder_path = "/У0101 Elegance"
url = "https://cloud-api.yandex.net/v1/disk/public/resources"
params = {
    'public_key': public_url,
    'path': folder_path,
    'limit': 20
}

print(f"Проверяем папку: {folder_path}")
print(f"URL: {url}")
print()

try:
    response = requests.get(url, params=params, timeout=30)
    print(f"Статус: {response.status_code}")
    print()
    
    if response.status_code == 200:
        data = response.json()
        
        if '_embedded' in data:
            items = data['_embedded'].get('items', [])
            print(f"Найдено элементов: {len(items)}")
            print()
            
            if items:
                print("Содержимое папки:")
                for i, item in enumerate(items[:10], 1):
                    item_type = item.get('type', 'N/A')
                    item_name = item.get('name', 'N/A')
                    item_size = item.get('size', 0)
                    print(f"  {i}. {item_name} ({item_type}) - {item_size} байт")
            else:
                print("Папка пуста")
        else:
            print("Это не папка или нет доступа")
    else:
        print(f"Ошибка: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Сообщение: {error_data.get('message', 'N/A')}")
        except:
            print(f"Ответ: {response.text[:200]}")
            
except Exception as e:
    print(f"Исключение: {str(e)}")

print()
print("=" * 60)









