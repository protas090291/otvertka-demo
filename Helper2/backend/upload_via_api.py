#!/usr/bin/env python3
"""
Загрузка документов через Supabase API (обход проблем с интерфейсом)
"""

import os
import sys
import requests
import base64
from pathlib import Path

def upload_file_to_storage(file_path: str, supabase_url: str, supabase_key: str, bucket_name: str = "document-templates"):
    """Загружает файл в Supabase Storage через API"""
    try:
        filename = os.path.basename(file_path)
        storage_path = f"templates/{filename}"
        
        # Читаем файл
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        # URL для загрузки
        upload_url = f"{supabase_url}/storage/v1/object/{bucket_name}/{storage_path}"
        
        headers = {
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'x-upsert': 'true'
        }
        
        # Загружаем файл
        response = requests.post(upload_url, headers=headers, data=file_content)
        response.raise_for_status()
        
        print(f"✅ Загружен в Storage: {filename}")
        return storage_path
        
    except Exception as e:
        print(f"❌ Ошибка загрузки {file_path}: {e}")
        return None

def add_to_database(file_path: str, storage_path: str, supabase_url: str, supabase_key: str):
    """Добавляет запись в базу данных через API"""
    try:
        filename = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        
        # Определяем тип документа
        doc_type = "handover_act"
        if "дефект" in filename.lower() or "defect" in filename.lower():
            doc_type = "defect_report"
        elif "работа" in filename.lower() or "work" in filename.lower():
            doc_type = "work_report"
        elif "акт" in filename.lower() or "act" in filename.lower():
            doc_type = "handover_act"
        
        # Данные для вставки
        data = {
            "name": filename,
            "type": doc_type,
            "file_path": storage_path,
            "file_name": filename,
            "file_size": file_size,
            "description": f"Загружен через API из {file_path}",
            "is_active": True
        }
        
        # URL для вставки в базу
        db_url = f"{supabase_url}/rest/v1/document_templates"
        
        headers = {
            'apikey': supabase_key,
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
        
        # Вставляем запись
        response = requests.post(db_url, headers=headers, json=data)
        response.raise_for_status()
        
        print(f"📊 Добавлена запись в БД: {filename} ({doc_type})")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка добавления в БД {file_path}: {e}")
        return False

def main():
    # Настройки (замените на ваши)
    SUPABASE_URL = "https://your-project.supabase.co"  # Замените на ваш URL
    SUPABASE_KEY = "your-service-role-key"  # Замените на ваш ключ
    
    # Или используйте переменные окружения
    supabase_url = os.getenv('SUPABASE_URL', SUPABASE_URL)
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_KEY)
    
    if supabase_url == "https://your-project.supabase.co" or supabase_key == "your-service-role-key":
        print("❌ Ошибка: Не указаны настройки Supabase")
        print("Отредактируйте файл и укажите ваши SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY")
        return 1
    
    documents_path = "../existing_documents"
    
    if not os.path.exists(documents_path):
        print(f"❌ Папка {documents_path} не найдена")
        return 1
    
    print(f"🚀 Загружаем документы через API")
    print(f"📊 Supabase URL: {supabase_url}")
    
    # Находим все .docx файлы
    docx_files = []
    for root, dirs, files in os.walk(documents_path):
        for file in files:
            if file.endswith('.docx'):
                docx_files.append(os.path.join(root, file))
    
    if not docx_files:
        print("❌ Не найдено .docx файлов")
        return 1
    
    print(f"📋 Найдено {len(docx_files)} документов")
    
    # Загружаем файлы
    uploaded_count = 0
    for file_path in docx_files:
        print(f"\n📤 Загружаем: {os.path.basename(file_path)}")
        
        # Загружаем в Storage
        storage_path = upload_file_to_storage(file_path, supabase_url, supabase_key)
        
        if storage_path:
            # Добавляем в базу данных
            if add_to_database(file_path, storage_path, supabase_url, supabase_key):
                uploaded_count += 1
    
    print(f"\n🎉 Загрузка завершена!")
    print(f"✅ Успешно загружено: {uploaded_count}/{len(docx_files)} документов")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

