#!/usr/bin/env python3
"""
Проверка доступных хранилищ в Supabase
"""

import os
import requests
import json

def check_supabase_storage(supabase_url: str, supabase_key: str):
    """Проверяет доступные хранилища в Supabase"""
    
    print("🔍 Проверяем доступные хранилища в Supabase...")
    print(f"📊 Supabase URL: {supabase_url}")
    
    try:
        # Проверяем список bucket'ов
        buckets_url = f"{supabase_url}/storage/v1/bucket"
        headers = {
            'Authorization': f'Bearer {supabase_key}',
            'apikey': supabase_key
        }
        
        print(f"\n📁 Проверяем bucket'ы...")
        response = requests.get(buckets_url, headers=headers)
        
        if response.status_code == 200:
            buckets = response.json()
            print(f"✅ Найдено {len(buckets)} bucket'ов:")
            
            for bucket in buckets:
                print(f"  • {bucket['id']} - {bucket['name']}")
                print(f"    Публичный: {bucket.get('public', False)}")
                print(f"    Создан: {bucket.get('created_at', 'Не указано')}")
                print(f"    Размер: {bucket.get('file_size_limit', 'Не ограничен')}")
                print()
        else:
            print(f"❌ Ошибка получения bucket'ов: {response.status_code}")
            print(f"Ответ: {response.text}")
            
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
    
    try:
        # Проверяем таблицы в базе данных
        print(f"📊 Проверяем таблицы в базе данных...")
        tables_url = f"{supabase_url}/rest/v1/"
        headers = {
            'apikey': supabase_key,
            'Authorization': f'Bearer {supabase_key}'
        }
        
        # Проверяем таблицу document_templates
        templates_url = f"{supabase_url}/rest/v1/document_templates?select=*&limit=5"
        response = requests.get(templates_url, headers=headers)
        
        if response.status_code == 200:
            templates = response.json()
            print(f"✅ Таблица document_templates найдена, записей: {len(templates)}")
            
            for template in templates:
                print(f"  • {template.get('name', 'Без названия')} ({template.get('type', 'Не указан')})")
                print(f"    Файл: {template.get('file_name', 'Не указан')}")
                print(f"    Путь: {template.get('file_path', 'Не указан')}")
                print(f"    Активен: {template.get('is_active', False)}")
                print()
        else:
            print(f"❌ Таблица document_templates не найдена или недоступна: {response.status_code}")
            print(f"Ответ: {response.text}")
            
    except Exception as e:
        print(f"❌ Ошибка проверки таблиц: {e}")

def main():
    # Настройки Supabase
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Ошибка: Не указаны настройки Supabase")
        print("Установите переменные окружения:")
        print("export SUPABASE_URL='https://your-project.supabase.co'")
        print("export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'")
        return 1
    
    check_supabase_storage(SUPABASE_URL, SUPABASE_KEY)
    return 0

if __name__ == "__main__":
    exit(main())

