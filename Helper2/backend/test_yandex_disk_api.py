#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для тестирования API Яндекс Диска
"""

import sys
import os
import requests
import json
from pathlib import Path
from dotenv import load_dotenv

# Загружаем переменные окружения
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

def test_yandex_disk_api():
    """Тестирование API Яндекс Диска"""
    
    print("=" * 60)
    print("Тестирование API Яндекс Диска")
    print("=" * 60)
    print()
    
    # Проверка переменных окружения
    public_key = os.getenv('YANDEX_DISK_PUBLIC_KEY')
    token = os.getenv('YANDEX_DISK_TOKEN')
    
    print("1. Проверка переменных окружения:")
    print(f"   YANDEX_DISK_PUBLIC_KEY: {'[OK] установлен' if public_key else '[ERROR] НЕ установлен'}")
    if public_key:
        print(f"   Значение: {public_key}")
    print(f"   YANDEX_DISK_TOKEN: {'[OK] установлен' if token else '[OK] НЕ установлен (не нужен для публичной папки)'}")
    print()
    
    if not public_key:
        print("[ERROR] YANDEX_DISK_PUBLIC_KEY не установлен!")
        print("   Установите его в файле .env")
        return False
    
    # Тест 1: Прямой запрос к API Яндекс Диска (только ключ)
    print("2. Тест прямого запроса к API Яндекс Диска (только ключ):")
    try:
        url = f"https://cloud-api.yandex.net/v1/disk/public/resources"
        params = {
            'public_key': public_key,
            'limit': 10
        }
        headers = {
            'Accept': 'application/json'
        }
        
        print(f"   URL: {url}")
        print(f"   Параметры: public_key={public_key}")
        print("   Отправка запроса...")
        
        response = requests.get(url, headers=headers, params=params, timeout=30)
        
        print(f"   Статус: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            items = data.get('_embedded', {}).get('items', [])
            print(f"   [OK] Успешно! Найдено файлов: {len(items)}")
            if items:
                print(f"   Первый файл: {items[0].get('name', 'N/A')}")
            return True
        else:
            print(f"   [ERROR] Ошибка: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Сообщение: {error_data.get('message', 'N/A')}")
            except:
                print(f"   Ответ: {response.text[:200]}")
            
            # Пробуем с полной ссылкой
            print()
            print("   Попытка с полной ссылкой...")
            public_url = f"https://disk.yandex.ru/d/{public_key}"
            params2 = {
                'public_key': public_url,
                'limit': 10
            }
            response2 = requests.get(url, headers=headers, params=params2, timeout=30)
            print(f"   Статус с полной ссылкой: {response2.status_code}")
            if response2.status_code == 200:
                data2 = response2.json()
                items2 = data2.get('_embedded', {}).get('items', [])
                print(f"   [OK] Успешно с полной ссылкой! Найдено файлов: {len(items2)}")
                if items2:
                    print(f"   Первый файл: {items2[0].get('name', 'N/A')}")
                print("   [INFO] Нужно использовать полную ссылку в коде!")
                # Продолжаем тестирование backend API
                test_backend = True
            else:
                try:
                    error_data2 = response2.json()
                    print(f"   Сообщение: {error_data2.get('message', 'N/A')}")
                except:
                    print(f"   Ответ: {response2.text[:200]}")
                test_backend = False
            
            if not test_backend:
                return False
            else:
                try:
                    error_data2 = response2.json()
                    print(f"   Сообщение: {error_data2.get('message', 'N/A')}")
                except:
                    print(f"   Ответ: {response2.text[:200]}")
            
            return False
            
    except Exception as e:
        print(f"   [ERROR] Исключение: {str(e)}")
        return False
    
    # Если первый тест прошел, продолжаем тестирование backend
    if response.status_code != 200:
        print()
        print("   Переходим к тестированию backend API...")
    
    print()
    
    # Тест 2: Запрос к нашему backend API
    print("3. Тест запроса к нашему backend API:")
    print("   (Убедитесь, что backend сервер запущен: python simple_main.py)")
    try:
        url = "http://localhost:8000/api/yandex-disk/files"
        print(f"   URL: {url}")
        print("   Отправка запроса...")
        
        response = requests.get(url, timeout=10)
        
        print(f"   Статус: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   [OK] Успешно! Найдено файлов: {data.get('total', 0)}")
            print(f"   Публичная папка: {'Да' if data.get('is_public') else 'Нет'}")
            if data.get('files'):
                print(f"   Первый файл: {data['files'][0].get('name', 'N/A')}")
            return True
        else:
            print(f"   [ERROR] Ошибка: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Сообщение: {error_data.get('detail', 'N/A')}")
            except:
                print(f"   Ответ: {response.text[:200]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("   [ERROR] Backend сервер не запущен!")
        print("   Запустите: python simple_main.py")
        return False
    except Exception as e:
        print(f"   [ERROR] Исключение: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_yandex_disk_api()
    print()
    print("=" * 60)
    if success:
        print("[OK] Тестирование завершено успешно!")
    else:
        print("[ERROR] Тестирование завершено с ошибками!")
    print("=" * 60)
    sys.exit(0 if success else 1)

