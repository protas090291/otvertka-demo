#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тест открытия папки через backend API
"""

import requests
import json

print("=" * 60)
print("ТЕСТ ОТКРЫТИЯ ПАПКИ ЧЕРЕЗ BACKEND API")
print("=" * 60)
print()

# Тест 1: Корневая папка
print("1. Тест корневой папки:")
try:
    response = requests.get("http://localhost:8000/api/yandex-disk/files", timeout=5)
    print(f"   Статус: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        files = data.get('files', [])
        print(f"   Найдено файлов: {len(files)}")
        
        # Находим первую папку
        folders = [f for f in files if f.get('type') == 'dir']
        if folders:
            test_folder = folders[0]
            folder_path = test_folder.get('path', '')
            folder_name = test_folder.get('name', 'N/A')
            print(f"   Первая папка: {folder_name}")
            print(f"   Путь: {folder_path}")
            print()
            
            # Тест 2: Открытие папки
            print("2. Тест открытия папки:")
            encoded_path = requests.utils.quote(folder_path, safe='')
            url = f"http://localhost:8000/api/yandex-disk/files?folder_path={encoded_path}"
            print(f"   URL: {url}")
            
            response2 = requests.get(url, timeout=5)
            print(f"   Статус: {response2.status_code}")
            
            if response2.status_code == 200:
                data2 = response2.json()
                files2 = data2.get('files', [])
                print(f"   [OK] Успешно! Найдено элементов: {len(files2)}")
                if files2:
                    print("   Первые 3 элемента:")
                    for i, f in enumerate(files2[:3], 1):
                        print(f"     {i}. {f.get('name', 'N/A')} ({f.get('type', 'N/A')})")
            else:
                print(f"   [ERROR] Ошибка: {response2.status_code}")
                try:
                    error_data = response2.json()
                    print(f"   Сообщение: {error_data.get('detail', 'N/A')}")
                except:
                    print(f"   Ответ: {response2.text[:200]}")
        else:
            print("   [WARNING] Папки не найдены")
    else:
        print(f"   [ERROR] Ошибка: {response.status_code}")
except Exception as e:
    print(f"   [ERROR] Исключение: {str(e)}")
    import traceback
    traceback.print_exc()

print()
print("=" * 60)









