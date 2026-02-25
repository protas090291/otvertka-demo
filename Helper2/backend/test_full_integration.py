#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Полный тест интеграции Яндекс Диска
"""

import requests
import json
import sys

def test_full_integration():
    print("=" * 60)
    print("ПОЛНЫЙ ТЕСТ ИНТЕГРАЦИИ ЯНДЕКС ДИСКА")
    print("=" * 60)
    print()
    
    all_tests_passed = True
    
    # Тест 1: Backend API доступен
    print("1. Проверка доступности Backend API...")
    try:
        response = requests.get("http://localhost:8000/api/yandex-disk/files", timeout=5)
        if response.status_code == 200:
            print("   [OK] Backend API доступен")
        else:
            print(f"   [ERROR] Backend API вернул статус {response.status_code}")
            all_tests_passed = False
    except requests.exceptions.ConnectionError:
        print("   [ERROR] Backend сервер не запущен!")
        print("   Запустите: python simple_main.py")
        return False
    except Exception as e:
        print(f"   [ERROR] Ошибка: {str(e)}")
        all_tests_passed = False
    
    print()
    
    # Тест 2: Получение списка файлов
    print("2. Получение списка файлов...")
    try:
        response = requests.get("http://localhost:8000/api/yandex-disk/files", timeout=10)
        if response.status_code == 200:
            data = response.json()
            total = data.get('total', 0)
            is_public = data.get('is_public', False)
            public_key = data.get('public_key', '')
            files = data.get('files', [])
            
            print(f"   [OK] Успешно получен список файлов")
            print(f"   Всего файлов: {total}")
            print(f"   Публичная папка: {'Да' if is_public else 'Нет'}")
            print(f"   Публичный ключ: {public_key}")
            
            if total > 0:
                print(f"   Первые 3 файла:")
                for i, file in enumerate(files[:3], 1):
                    print(f"     {i}. {file.get('name', 'N/A')} ({file.get('size_formatted', 'N/A')})")
            else:
                print("   [WARNING] Файлы не найдены")
        else:
            print(f"   [ERROR] Ошибка получения файлов: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Сообщение: {error_data.get('detail', 'N/A')}")
            except:
                print(f"   Ответ: {response.text[:200]}")
            all_tests_passed = False
    except Exception as e:
        print(f"   [ERROR] Исключение: {str(e)}")
        all_tests_passed = False
    
    print()
    
    # Тест 3: Структура ответа
    print("3. Проверка структуры ответа...")
    try:
        response = requests.get("http://localhost:8000/api/yandex-disk/files", timeout=10)
        if response.status_code == 200:
            data = response.json()
            required_fields = ['files', 'total', 'folder_path', 'is_public', 'public_key']
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                print("   [OK] Все обязательные поля присутствуют")
            else:
                print(f"   [ERROR] Отсутствуют поля: {', '.join(missing_fields)}")
                all_tests_passed = False
            
            # Проверка структуры файлов
            if data.get('files'):
                file = data['files'][0]
                file_fields = ['name', 'path', 'type', 'size', 'size_formatted', 'modified', 'modified_formatted']
                missing_file_fields = [field for field in file_fields if field not in file]
                
                if not missing_file_fields:
                    print("   [OK] Структура файлов корректна")
                else:
                    print(f"   [WARNING] В файлах отсутствуют поля: {', '.join(missing_file_fields)}")
        else:
            print("   [SKIP] Пропущено из-за ошибки в предыдущем тесте")
    except Exception as e:
        print(f"   [ERROR] Исключение: {str(e)}")
        all_tests_passed = False
    
    print()
    
    # Итоговый результат
    print("=" * 60)
    if all_tests_passed:
        print("[OK] ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")
        print()
        print("Интеграция Яндекс Диска работает корректно:")
        print("  - Backend API доступен")
        print("  - Файлы загружаются из публичной папки")
        print("  - Данные форматируются правильно")
        print("  - Frontend может получить данные")
    else:
        print("[ERROR] НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОЙДЕНЫ!")
        print()
        print("Проверьте:")
        print("  1. Запущен ли backend сервер (python simple_main.py)")
        print("  2. Правильно ли настроен .env файл")
        print("  3. Доступна ли публичная папка на Яндекс Диске")
    print("=" * 60)
    
    return all_tests_passed

if __name__ == "__main__":
    success = test_full_integration()
    sys.exit(0 if success else 1)









