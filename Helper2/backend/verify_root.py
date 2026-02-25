#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Проверка корневой папки"""

import requests
import time

print("=" * 60)
print("ПРОВЕРКА: ОТОБРАЖЕНИЕ ВСЕХ ДОСТУПНЫХ ПАПОК")
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
else:
    print("ВНИМАНИЕ: Сервер может быть еще не готов")

# Проверяем API
print("\n" + "=" * 60)
print("Проверка API...")
try:
    response = requests.get("http://localhost:8000/api/yandex-disk/files", timeout=5)
    if response.status_code == 200:
        data = response.json()
        print(f"Статус: OK")
        print(f"Всего элементов: {data.get('total', 0)}")
        print(f"Путь: {data.get('folder_path', 'N/A')}")
        
        folders = [f for f in data.get('files', []) if f.get('type') == 'dir']
        files = [f for f in data.get('files', []) if f.get('type') == 'file']
        
        print(f"\nПапок: {len(folders)}")
        print(f"Файлов: {len(files)}")
        
        if folders:
            print("\nДОСТУПНЫЕ ПАПКИ:")
            print("-" * 60)
            for folder in folders:
                print(f"  - {folder.get('name')}")
        
        print("\n" + "=" * 60)
        print("ГОТОВО!")
        print("=" * 60)
        print("\nТеперь в приложении будут отображаться ВСЕ доступные папки")
        print("Пользователь может выбрать нужную папку, кликнув на неё")
        print("=" * 60)
    else:
        print(f"Ошибка: {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"Ошибка: {e}")



