#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Тест исправления путей"""

import requests
import time

print("=" * 60)
print("ТЕСТ ИСПРАВЛЕНИЯ ПУТЕЙ")
print("=" * 60)

# Ждем запуска сервера
print("\nОжидание запуска сервера...")
for i in range(10):
    try:
        response = requests.get("http://localhost:8000/health", timeout=2)
        if response.status_code == 200:
            print("Сервер запущен!")
            break
    except:
        time.sleep(1)

# Тест 1: Корневая папка
print("\n" + "=" * 60)
print("ТЕСТ 1: Корневая папка (/)")
print("=" * 60)
try:
    response = requests.get("http://localhost:8000/api/yandex-disk/files", timeout=5)
    if response.status_code == 200:
        data = response.json()
        print(f"Статус: OK")
        print(f"Всего элементов: {data.get('total', 0)}")
        print(f"Путь: {data.get('folder_path', 'N/A')}")
        
        folders = [f for f in data.get('files', []) if f.get('type') == 'dir']
        if folders:
            print(f"\nНайдено {len(folders)} папок:")
            for folder in folders[:5]:
                print(f"  - {folder.get('name')} (путь: {folder.get('path')})")
        
        # Тест 2: Навигация в подпапку
        if folders:
            test_folder = folders[0]
            folder_path = test_folder.get('path')
            print("\n" + "=" * 60)
            print(f"ТЕСТ 2: Навигация в папку '{test_folder.get('name')}'")
            print(f"Путь: {folder_path}")
            print("=" * 60)
            
            response2 = requests.get(
                f"http://localhost:8000/api/yandex-disk/files",
                params={'folder_path': folder_path},
                timeout=5
            )
            if response2.status_code == 200:
                data2 = response2.json()
                print(f"Статус: OK")
                print(f"Всего элементов: {data2.get('total', 0)}")
                print("Навигация работает!")
            else:
                print(f"Ошибка: {response2.status_code}")
                print(response2.text[:200])
    else:
        print(f"Ошибка: {response.status_code}")
        print(response.text[:200])
except Exception as e:
    print(f"Ошибка: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("ГОТОВО!")
print("=" * 60)



