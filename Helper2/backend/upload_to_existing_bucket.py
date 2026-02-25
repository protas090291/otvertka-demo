#!/usr/bin/env python3
"""
Загрузка документов в существующий bucket Documents-base
"""

import os
import sys
import requests
import mimetypes
from pathlib import Path

def upload_to_documents_base(file_path: str, supabase_url: str, supabase_key: str):
    """Загружает файл в существующий bucket Documents-base"""
    try:
        filename = os.path.basename(file_path)
        storage_path = f"templates/{filename}"
        
        # Читаем файл
        with open(file_path, 'rb') as f:
            file_content = f.read()
        
        # URL для загрузки в Documents-base
        upload_url = f"{supabase_url}/storage/v1/object/Documents-base/{storage_path}"
        
        headers = {
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'x-upsert': 'true'  # Перезаписывать если файл существует
        }
        
        # Загружаем файл
        response = requests.post(upload_url, headers=headers, data=file_content)
        response.raise_for_status()
        
        print(f"✅ Загружен в Documents-base: {filename}")
        return storage_path
        
    except Exception as e:
        print(f"❌ Ошибка загрузки {file_path}: {e}")
        return None

def create_document_templates_table(supabase_url: str, supabase_key: str):
    """Создает таблицу document_templates если её нет"""
    try:
        # SQL для создания таблицы
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS document_templates (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('handover_act', 'defect_report', 'work_report')),
          file_path TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_size BIGINT,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
        
        # Выполняем SQL через API
        sql_url = f"{supabase_url}/rest/v1/rpc/exec_sql"
        headers = {
            'apikey': supabase_key,
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'application/json'
        }
        
        data = {'sql': create_table_sql}
        response = requests.post(sql_url, headers=headers, json=data)
        
        if response.status_code == 200:
            print("✅ Таблица document_templates создана")
            return True
        else:
            print(f"⚠️ Не удалось создать таблицу: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка создания таблицы: {e}")
        return False

def add_to_database(file_path: str, storage_path: str, supabase_url: str, supabase_key: str):
    """Добавляет запись о файле в базу данных"""
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
            "description": f"Загружен в Documents-base из {file_path}",
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
    # Настройки из .env файла
    supabase_url = None
    supabase_key = None
    
    # Читаем .env файл
    if os.path.exists('.env'):
        with open('.env', 'r') as f:
            for line in f:
                if line.startswith('SUPABASE_URL='):
                    supabase_url = line.split('=', 1)[1].strip()
                elif line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                    supabase_key = line.split('=', 1)[1].strip()
    
    if not supabase_url or not supabase_key:
        print("❌ Настройки Supabase не найдены в .env файле")
        return 1
    
    print(f"🚀 Загружаем документы в существующий bucket Documents-base")
    print(f"📊 Supabase URL: {supabase_url}")
    
    # Создаем таблицу если её нет
    create_document_templates_table(supabase_url, supabase_key)
    
    documents_path = "../existing_documents"
    
    if not os.path.exists(documents_path):
        print(f"❌ Папка {documents_path} не найдена")
        return 1
    
    # Находим все .docx файлы
    docx_files = []
    for root, dirs, files in os.walk(documents_path):
        for file in files:
            if file.endswith('.docx'):
                docx_files.append(os.path.join(root, file))
    
    if not docx_files:
        print("❌ Не найдено .docx файлов")
        return 1
    
    print(f"📋 Найдено {len(docx_files)} документов для загрузки")
    
    # Загружаем файлы
    uploaded_count = 0
    for file_path in docx_files:
        print(f"\n📤 Загружаем: {os.path.basename(file_path)}")
        
        # Загружаем в Documents-base
        storage_path = upload_to_documents_base(file_path, supabase_url, supabase_key)
        
        if storage_path:
            # Добавляем в базу данных
            if add_to_database(file_path, storage_path, supabase_url, supabase_key):
                uploaded_count += 1
    
    print(f"\n🎉 Загрузка завершена!")
    print(f"✅ Успешно загружено: {uploaded_count}/{len(docx_files)} документов")
    print(f"📁 Bucket: Documents-base")
    print(f"📊 Таблица: document_templates")
    
    if uploaded_count > 0:
        print(f"\n📖 Теперь AI-помощник может использовать эти документы для обучения")
        print("   Попробуйте команды:")
        print("   • 'Акт на основе примеров для квартиры 1101'")
        print("   • 'Отчет дефектов по образцу для квартиры 1205'")
        print("   • 'Отчет работ на основе примеров для квартиры 1301'")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

