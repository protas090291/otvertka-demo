#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Быстрый тест API"""

import requests
import sys

try:
    print("Тестирую API...")
    response = requests.get("http://localhost:8000/api/yandex-disk/files", timeout=5)
    print(f"Статус: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"OK! Найдено {data.get('total', 0)} элементов")
    else:
        print(f"Ошибка: {response.text[:200]}")
except Exception as e:
    print(f"ОШИБКА: {e}")
    sys.exit(1)



