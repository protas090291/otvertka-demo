#!/usr/bin/env python3
"""
Проверка содержимого bucket Documents-base в Supabase
"""

import os
import requests
import json

def check_documents_base():
    """Проверяет содержимое bucket Documents-base"""
    
    # Читаем настройки из .env
    supabase_url = None
    supabase_key = None
    
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('SUPABASE_URL='):
                    supabase_url = line.split('=', 1)[1].strip()
                elif line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                    supabase_key = line.split('=', 1)[1].strip()
    
    if not supabase_url or not supabase_key:
        print("❌ Настройки Supabase не найдены")
        return
    
    print(f"🔍 Проверяем содержимое bucket Documents-base...")
    print(f"📊 Supabase URL: {supabase_url}")
    
    try:
        # Получаем список файлов в bucket
        list_url = f"{supabase_url}/storage/v1/object/list/Documents-base"
        headers = {
            'Authorization': f'Bearer {supabase_key}',
            'apikey': supabase_key
        }
        
        # Параметры для получения всех файлов
        params = {
            'limit': 100,
            'offset': 0
        }
        
        response = requests.get(list_url, headers=headers, params=params)
        
        if response.status_code == 200:
            files = response.json()
            print(f"✅ Найдено {len(files)} файлов в Documents-base:")
            
            for i, file_info in enumerate(files, 1):
                print(f"\n  {i}. {file_info.get('name', 'Без названия')}")
                print(f"     Путь: {file_info.get('id', 'Не указан')}")
                print(f"     Размер: {file_info.get('metadata', {}).get('size', 'Не указан')} байт")
                print(f"     Создан: {file_info.get('created_at', 'Не указано')}")
                print(f"     Обновлен: {file_info.get('updated_at', 'Не указано')}")
                
                # Формируем URL для скачивания
                file_url = f"{supabase_url}/storage/v1/object/public/Documents-base/{file_info.get('id', '')}"
                print(f"     URL: {file_url}")
                
        else:
            print(f"❌ Ошибка получения списка файлов: {response.status_code}")
            print(f"Ответ: {response.text}")
            
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")

def download_example_document():
    """Скачивает один из примеров документов"""
    
    # Читаем настройки из .env
    supabase_url = None
    supabase_key = None
    
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('SUPABASE_URL='):
                    supabase_url = line.split('=', 1)[1].strip()
                elif line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                    supabase_key = line.split('=', 1)[1].strip()
    
    if not supabase_url or not supabase_key:
        print("❌ Настройки Supabase не найдены")
        return
    
    # Скачиваем один из примеров
    example_file = "templates/act_handover_1101_6ae64a81.docx"
    download_url = f"{supabase_url}/storage/v1/object/public/Documents-base/{example_file}"
    
    print(f"📥 Скачиваем пример: {example_file}")
    print(f"🔗 URL: {download_url}")
    
    try:
        response = requests.get(download_url)
        
        if response.status_code == 200:
            # Сохраняем файл
            filename = "downloaded_example.docx"
            with open(filename, 'wb') as f:
                f.write(response.content)
            
            print(f"✅ Файл скачан: {filename}")
            print(f"📊 Размер: {len(response.content)} байт")
            
            # Проверяем что файл можно открыть
            if os.path.exists(filename):
                file_size = os.path.getsize(filename)
                print(f"✅ Файл сохранен, размер: {file_size} байт")
                
                # Показываем информацию о файле
                print(f"\n📄 Информация о файле:")
                print(f"   Название: {filename}")
                print(f"   Размер: {file_size:,} байт")
                print(f"   Тип: Word документ (.docx)")
                print(f"   Источник: Supabase Storage - Documents-base")
                
        else:
            print(f"❌ Ошибка скачивания: {response.status_code}")
            print(f"Ответ: {response.text}")
            
    except Exception as e:
        print(f"❌ Ошибка скачивания: {e}")

def main():
    print("🔍 Проверка bucket Documents-base в Supabase")
    print("=" * 50)
    
    # Проверяем содержимое
    check_documents_base()
    
    print("\n" + "=" * 50)
    print("📥 Скачивание примера документа")
    print("=" * 50)
    
    # Скачиваем пример
    download_example_document()

if __name__ == "__main__":
    main()

