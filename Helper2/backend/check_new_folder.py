#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Проверка содержимого новой папки
"""

import requests
import json
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

public_key = "430f03O1cR8Yag"  # Новый ключ
public_url = f"https://disk.yandex.ru/d/{public_key}"

print("=" * 60)
print("ПРОВЕРКА НОВОЙ ПАПКИ")
print("=" * 60)
print()
print(f"Публичный ключ: {public_key}")
print(f"Публичная ссылка: {public_url}")
print()

url = "https://cloud-api.yandex.net/v1/disk/public/resources"
params = {
    'public_key': public_url,
    'limit': 100
}

try:
    response = requests.get(url, params=params, timeout=30)
    print(f"Статус: {response.status_code}")
    print()
    
    if response.status_code == 200:
        data = response.json()
        root_name = data.get('name', 'N/A')
        print(f"Название папки: {root_name}")
        print()
        
        items = data.get('_embedded', {}).get('items', [])
        print(f"Найдено элементов: {len(items)}")
        print()
        
        if items:
            print("Содержимое папки:")
            print("-" * 60)
            
            files_count = 0
            dirs_count = 0
            
            for i, item in enumerate(items, 1):
                name = item.get('name', 'N/A')
                item_type = item.get('type', 'N/A')
                size = item.get('size', 0)
                
                if item_type == 'file':
                    files_count += 1
                    print(f"  {i}. [ФАЙЛ] {name} ({size} байт)")
                else:
                    dirs_count += 1
                    print(f"  {i}. [ПАПКА] {name}")
            
            print("-" * 60)
            print()
            print(f"Всего файлов: {files_count}")
            print(f"Всего папок: {dirs_count}")
            print()
            
            if files_count > 0:
                print("[OK] В папке есть файлы!")
            else:
                print("[INFO] В папке только папки, файлов нет")
        else:
            print("[WARNING] Папка пуста")
    else:
        print(f"[ERROR] Ошибка: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Сообщение: {error_data.get('message', 'N/A')}")
        except:
            print(f"Ответ: {response.text[:200]}")
            
except Exception as e:
    print(f"[ERROR] Исключение: {str(e)}")
    import traceback
    traceback.print_exc()

print()
print("=" * 60)









