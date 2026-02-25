#!/usr/bin/env python3
"""
Простой загрузчик документов в Supabase Storage
Использование: python simple_storage_uploader.py [путь_к_папке_с_документами]
"""

import os
import sys
import argparse
import requests
from pathlib import Path
import mimetypes

def upload_to_supabase_storage(file_path: str, supabase_url: str, supabase_key: str, bucket_name: str = "document-templates"):
    """Загружает файл в Supabase Storage"""
    try:
        # Определяем MIME тип
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            mime_type = "application/octet-stream"
        
        # Читаем файл
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        # Формируем путь в Storage
        filename = os.path.basename(file_path)
        storage_path = f"templates/{filename}"
        
        # URL для загрузки
        upload_url = f"{supabase_url}/storage/v1/object/{bucket_name}/{storage_path}"
        
        headers = {
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': mime_type,
            'x-upsert': 'true'  # Перезаписывать если файл существует
        }
        
        # Загружаем файл
        response = requests.post(upload_url, headers=headers, data=file_content)
        response.raise_for_status()
        
        print(f"✅ Загружен: {filename} -> {storage_path}")
        return storage_path
        
    except Exception as e:
        print(f"❌ Ошибка загрузки {file_path}: {e}")
        return None

def add_to_database(file_path: str, storage_path: str, supabase_url: str, supabase_key: str):
    """Добавляет запись о файле в базу данных"""
    try:
        filename = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        
        # Определяем тип документа по имени файла
        doc_type = "handover_act"  # По умолчанию
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
            "description": f"Загружен из {file_path}",
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
    parser = argparse.ArgumentParser(description='Загрузка документов в Supabase Storage')
    parser.add_argument('documents_path', nargs='?', default='./existing_documents', 
                       help='Путь к папке с документами')
    parser.add_argument('--supabase-url', help='URL Supabase')
    parser.add_argument('--supabase-key', help='Service Role Key Supabase')
    parser.add_argument('--bucket', default='document-templates', help='Название bucket в Storage')
    
    args = parser.parse_args()
    
    # Настройки Supabase
    supabase_url = args.supabase_url or os.getenv('SUPABASE_URL')
    supabase_key = args.supabase_key or os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Ошибка: Не указаны настройки Supabase")
        print("Используйте --supabase-url и --supabase-key или переменные окружения")
        print("SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY")
        return 1
    
    documents_path = args.documents_path
    
    if not os.path.exists(documents_path):
        print(f"❌ Ошибка: Папка {documents_path} не существует")
        return 1
    
    print(f"🚀 Начинаем загрузку документов из: {documents_path}")
    print(f"📊 Supabase URL: {supabase_url}")
    print(f"🗂️ Bucket: {args.bucket}")
    
    # Находим все .docx файлы
    docx_files = []
    for root, dirs, files in os.walk(documents_path):
        for file in files:
            if file.endswith('.docx'):
                docx_files.append(os.path.join(root, file))
    
    if not docx_files:
        print("❌ Не найдено .docx файлов для загрузки")
        return 1
    
    print(f"📋 Найдено {len(docx_files)} документов для загрузки")
    
    # Загружаем файлы
    uploaded_count = 0
    for file_path in docx_files:
        print(f"\n📤 Загружаем: {os.path.basename(file_path)}")
        
        # Загружаем в Storage
        storage_path = upload_to_supabase_storage(file_path, supabase_url, supabase_key, args.bucket)
        
        if storage_path:
            # Добавляем в базу данных
            if add_to_database(file_path, storage_path, supabase_url, supabase_key):
                uploaded_count += 1
    
    print(f"\n🎉 Загрузка завершена!")
    print(f"✅ Успешно загружено: {uploaded_count}/{len(docx_files)} документов")
    
    if uploaded_count > 0:
        print(f"\n📖 Теперь AI-помощник может использовать эти документы для обучения")
        print("   Попробуйте команды:")
        print("   • 'Акт на основе примеров для квартиры 1101'")
        print("   • 'Отчет дефектов по образцу для квартиры 1205'")
        print("   • 'Отчет работ на основе примеров для квартиры 1301'")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

