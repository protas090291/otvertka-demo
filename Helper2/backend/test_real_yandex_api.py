#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Проверка реальных данных от API Яндекс Диска
"""

import requests
import json
import os
from pathlib import Path
from dotenv import load_dotenv

# Загружаем переменные окружения
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

public_key = os.getenv('YANDEX_DISK_PUBLIC_KEY')

print("=" * 60)
print("ПРОВЕРКА РЕАЛЬНЫХ ДАННЫХ ОТ API ЯНДЕКС ДИСКА")
print("=" * 60)
print()
print(f"Публичный ключ: {public_key}")
print()

if not public_key:
    print("[ERROR] YANDEX_DISK_PUBLIC_KEY не установлен!")
    exit(1)

# Тест 1: Прямой запрос к API с полной ссылкой
print("1. Запрос к API Яндекс Диска с полной ссылкой:")
public_url = f"https://disk.yandex.ru/d/{public_key}"
url = "https://cloud-api.yandex.net/v1/disk/public/resources"
params = {
    'public_key': public_url,
    'limit': 100
}

print(f"   URL: {url}")
print(f"   Публичная ссылка: {public_url}")
print("   Отправка запроса...")
print()

try:
    response = requests.get(url, params=params, timeout=30)
    print(f"   Статус: {response.status_code}")
    print()
    
    if response.status_code == 200:
        data = response.json()
        print("   [OK] Успешно получен ответ от API")
        print()
        
        # Выводим полный ответ
        print("   Полный ответ от API:")
        print("   " + "-" * 56)
        print(json.dumps(data, indent=2, ensure_ascii=False))
        print("   " + "-" * 56)
        print()
        
        # Проверяем структуру
        if '_embedded' in data:
            items = data['_embedded'].get('items', [])
            print(f"   Найдено элементов: {len(items)}")
            print()
            
            if items:
                print("   Первые 5 элементов:")
                for i, item in enumerate(items[:5], 1):
                    print(f"     {i}. {item.get('name', 'N/A')}")
                    print(f"        Тип: {item.get('type', 'N/A')}")
                    print(f"        Размер: {item.get('size', 0)} байт")
                    print(f"        Путь: {item.get('path', 'N/A')}")
                    print()
            else:
                print("   [WARNING] Папка пуста или не содержит файлов!")
        else:
            print("   [WARNING] Ответ не содержит '_embedded'")
            print("   Возможно, это не папка, а отдельный файл")
            
    elif response.status_code == 404:
        print("   [ERROR] Публичная папка не найдена!")
        print("   Возможные причины:")
        print("     - Публичный ключ неправильный")
        print("     - Папка не является публичной")
        print("     - Ссылка недействительна")
        print()
        print("   Попробуйте открыть ссылку в браузере:")
        print(f"   {public_url}")
        
    else:
        print(f"   [ERROR] Ошибка: {response.status_code}")
        try:
            error_data = response.json()
            print(f"   Сообщение: {error_data.get('message', 'N/A')}")
            print(f"   Описание: {error_data.get('description', 'N/A')}")
        except:
            print(f"   Ответ: {response.text[:500]}")
            
except Exception as e:
    print(f"   [ERROR] Исключение: {str(e)}")
    import traceback
    traceback.print_exc()

print()
print("=" * 60)









