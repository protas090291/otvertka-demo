#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Тест endpoint для просмотра файлов
"""

import requests
from urllib.parse import quote
import os
from pathlib import Path
from dotenv import load_dotenv

# Загружаем переменные окружения
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

print("=" * 60)
print("ТЕСТ ENDPOINT ДЛЯ ПРОСМОТРА ФАЙЛОВ")
print("=" * 60)
print()

# 1. Получаем список файлов
print("1. Получение списка файлов...")
try:
    r = requests.get('http://localhost:8000/api/yandex-disk/files', timeout=5)
    if r.status_code == 200:
        data = r.json()
        files = data.get('files', [])
        print(f"   [OK] Найдено файлов: {len(files)}")
        
        # Находим любой файл для теста (не папку)
        test_files = [f for f in files if f.get('type', '') == 'file']
        if test_files:
            test_file = test_files[0]
            file_path = test_file.get('path', '')
            file_name = test_file.get('name', 'N/A')
            file_type = test_file.get('type', 'N/A')
            
            print()
            print("2. Тестирование просмотра файла...")
            print(f"   Файл: {file_name}")
            print(f"   Тип: {file_type}")
            print(f"   Путь: {file_path}")
            
            # 2. Получаем ссылку для просмотра
            print()
            print("3. Получение ссылки для просмотра...")
            encoded_path = quote(file_path, safe='')
            view_link_r = requests.get(
                f'http://localhost:8000/api/yandex-disk/view-link?file_path={encoded_path}',
                timeout=5
            )
            
            if view_link_r.status_code == 200:
                view_data = view_link_r.json()
                view_url = view_data.get('view_url', '')
                print(f"   [OK] Ссылка получена: {view_url[:80]}...")
                
                # 3. Тестируем endpoint для просмотра
                print()
                print("4. Тестирование endpoint /api/yandex-disk/view...")
                view_r = requests.get(
                    f'http://localhost:8000/api/yandex-disk/view?file_path={encoded_path}',
                    timeout=30,
                    stream=True
                )
                
                print(f"   Статус: {view_r.status_code}")
                print(f"   Content-Type: {view_r.headers.get('Content-Type', 'N/A')}")
                print(f"   Content-Disposition: {view_r.headers.get('Content-Disposition', 'N/A')}")
                
                if view_r.status_code == 200:
                    content_length = len(view_r.content)
                    print(f"   [OK] Файл получен! Размер: {content_length:,} байт")
                    
                    # Проверяем заголовки
                    content_disposition = view_r.headers.get('Content-Disposition', '')
                    if 'inline' in content_disposition:
                        print(f"   [OK] Content-Disposition: inline (для просмотра)")
                    else:
                        print(f"   [WARNING] Content-Disposition: {content_disposition}")
                    
                    content_type = view_r.headers.get('Content-Type', '')
                    print(f"   [INFO] Content-Type: {content_type}")
                    
                    print()
                    print("=" * 60)
                    print("[OK] ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")
                    print("=" * 60)
                    print()
                    print("Файлы должны открываться для просмотра в браузере.")
                    print(f"Тестовая ссылка: {view_url}")
                else:
                    print(f"   [ERROR] Ошибка получения файла: {view_r.status_code}")
                    try:
                        error_data = view_r.json()
                        print(f"   Сообщение: {error_data.get('detail', 'N/A')}")
                    except:
                        print(f"   Ответ: {view_r.text[:200]}")
            else:
                print(f"   [ERROR] Ошибка получения ссылки: {view_link_r.status_code}")
                try:
                    error_data = view_link_r.json()
                    print(f"   Сообщение: {error_data.get('detail', 'N/A')}")
                except:
                    print(f"   Ответ: {view_link_r.text[:200]}")
        else:
            print("   [WARNING] Файлы не найдены для тестирования")
            print("   Найдены только папки. Нужно открыть папку для доступа к файлам.")
    else:
        print(f"   [ERROR] Ошибка получения списка файлов: {r.status_code}")
        
except Exception as e:
    print(f"[ERROR] Исключение: {str(e)}")
    import traceback
    traceback.print_exc()

print()
