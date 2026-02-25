#!/usr/bin/env python3
"""
Проверка существующих хранилищ в Supabase
"""

import os
import requests
import json

def list_existing_storage():
    """Показывает существующие хранилища в Supabase"""
    
    print("🔍 Проверяем существующие хранилища в Supabase...")
    
    # Попробуем найти настройки Supabase в файлах проекта
    supabase_url = None
    supabase_key = None
    
    # Ищем в .env файлах
    env_files = ['.env', '../.env', '../../.env']
    for env_file in env_files:
        if os.path.exists(env_file):
            print(f"📄 Найден файл: {env_file}")
            with open(env_file, 'r') as f:
                for line in f:
                    if line.startswith('SUPABASE_URL='):
                        supabase_url = line.split('=', 1)[1].strip()
                    elif line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                        supabase_key = line.split('=', 1)[1].strip()
    
    # Ищем в переменных окружения
    if not supabase_url:
        supabase_url = os.getenv('SUPABASE_URL')
    if not supabase_key:
        supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Настройки Supabase не найдены")
        print("\n📋 Для проверки хранилищ нужно:")
        print("1. Создать файл .env в папке backend/")
        print("2. Добавить в него:")
        print("   SUPABASE_URL=https://your-project.supabase.co")
        print("   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key")
        print("\nИли установить переменные окружения:")
        print("export SUPABASE_URL='https://your-project.supabase.co'")
        print("export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'")
        return
    
    print(f"📊 Supabase URL: {supabase_url}")
    print(f"🔑 Service Key: {supabase_key[:20]}...")
    
    try:
        # Проверяем список bucket'ов
        print(f"\n📁 Проверяем Storage bucket'ы...")
        buckets_url = f"{supabase_url}/storage/v1/bucket"
        headers = {
            'Authorization': f'Bearer {supabase_key}',
            'apikey': supabase_key
        }
        
        response = requests.get(buckets_url, headers=headers)
        
        if response.status_code == 200:
            buckets = response.json()
            print(f"✅ Найдено {len(buckets)} bucket'ов:")
            
            for i, bucket in enumerate(buckets, 1):
                print(f"\n  {i}. {bucket['id']}")
                print(f"     Название: {bucket['name']}")
                print(f"     Публичный: {'Да' if bucket.get('public', False) else 'Нет'}")
                print(f"     Создан: {bucket.get('created_at', 'Не указано')}")
                print(f"     Размер файла: {bucket.get('file_size_limit', 'Не ограничен')}")
                print(f"     Размер bucket: {bucket.get('allowed_mime_types', 'Все типы')}")
        else:
            print(f"❌ Ошибка получения bucket'ов: {response.status_code}")
            print(f"Ответ: {response.text}")
            
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
    
    try:
        # Проверяем таблицы в базе данных
        print(f"\n📊 Проверяем таблицы в базе данных...")
        
        # Список таблиц для проверки
        tables_to_check = [
            'document_templates',
            'document_examples', 
            'document_generation_rules',
            'ai_learning_logs',
            'defects',
            'progress_data',
            'work_journal',
            'commands'
        ]
        
        for table_name in tables_to_check:
            table_url = f"{supabase_url}/rest/v1/{table_name}?select=*&limit=1"
            headers = {
                'apikey': supabase_key,
                'Authorization': f'Bearer {supabase_key}'
            }
            
            response = requests.get(table_url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Таблица {table_name}: найдена, записей: {len(data)}")
                
                if data:
                    # Показываем структуру первой записи
                    first_record = data[0]
                    print(f"     Поля: {list(first_record.keys())}")
            elif response.status_code == 404:
                print(f"❌ Таблица {table_name}: не найдена")
            else:
                print(f"⚠️ Таблица {table_name}: ошибка {response.status_code}")
                
    except Exception as e:
        print(f"❌ Ошибка проверки таблиц: {e}")

def main():
    list_existing_storage()

if __name__ == "__main__":
    main()

