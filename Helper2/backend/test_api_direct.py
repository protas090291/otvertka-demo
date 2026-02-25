#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Прямой тест API"""

import requests
import sys

print("Тестирую API endpoint...")
try:
    response = requests.get("http://localhost:8000/api/yandex-disk/files", timeout=10)
    print(f"Статус: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"OK! Найдено {data.get('total', 0)} элементов")
        print(f"Путь: {data.get('folder_path', 'N/A')}")
        if data.get('files'):
            print("Первые 3 элемента:")
            for f in data['files'][:3]:
                print(f"  - {f.get('name')} ({f.get('type')})")
    else:
        print(f"Ошибка: {response.text[:300]}")
        sys.exit(1)
except requests.exceptions.Timeout:
    print("ОШИБКА: Таймаут запроса!")
    sys.exit(1)
except Exception as e:
    print(f"ОШИБКА: {e}")
    sys.exit(1)



