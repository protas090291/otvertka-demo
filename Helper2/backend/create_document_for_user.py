#!/usr/bin/env python3
"""
Создание документа для пользователя с предоставлением ссылки
"""

import os
import json
from datetime import datetime
from learning_document_generator import LearningDocumentGenerator

def create_document_for_user():
    """Создает документ и возвращает путь к нему"""
    print("📄 Создание документа для пользователя...")
    
    # Создаем генератор документов
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для создания письма
    document_data = {
        'apartment_id': '1201',
        'apartment_number': '1201',
        'issue_type': 'техническая проблема',
        'issue_description': 'Обнаружены трещины в стенах после завершения штукатурных работ. Требуется дополнительное обследование и устранение дефектов.',
        'expected_resolution': 'Проведение технического обследования до 10.10.2025, составление плана устранения дефектов',
        'contact_person': 'Петров П.П.',
        'phone': '+7 (999) 555-77-88'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Документ успешно создан!")
            print(f"📁 Файл: {result}")
            
            # Получаем абсолютный путь
            absolute_path = os.path.abspath(result)
            print(f"📍 Абсолютный путь: {absolute_path}")
            
            # Проверяем, что файл существует
            if os.path.exists(absolute_path):
                file_size = os.path.getsize(absolute_path)
                print(f"📊 Размер файла: {file_size} байт")
                
                # Показываем содержимое
                print("\n📄 СОДЕРЖИМОЕ ДОКУМЕНТА:")
                print("=" * 60)
                
                try:
                    from docx import Document
                    doc = Document(absolute_path)
                    for i, paragraph in enumerate(doc.paragraphs, 1):
                        if paragraph.text.strip():
                            print(f"{i}. {paragraph.text}")
                    print("=" * 60)
                except Exception as e:
                    print(f"Ошибка чтения документа: {e}")
                
                return absolute_path
            else:
                print("❌ Файл не найден после создания")
                return None
        else:
            print("❌ Не удалось создать документ")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании документа: {e}")
        return None

def main():
    print("🚀 СОЗДАНИЕ ДОКУМЕНТА ДЛЯ ПОЛЬЗОВАТЕЛЯ")
    print("=" * 50)
    
    # Создаем документ
    document_path = create_document_for_user()
    
    if document_path:
        print(f"\n🎉 ДОКУМЕНТ ГОТОВ!")
        print(f"📁 Путь к файлу: {document_path}")
        print(f"🔗 Ссылка для открытия: file://{document_path}")
        
        print(f"\n📋 ИНСТРУКЦИЯ ДЛЯ ПРОВЕРКИ:")
        print("1. Скопируйте путь к файлу выше")
        print("2. Откройте Finder (Проводник)")
        print("3. Нажмите Cmd+Shift+G")
        print("4. Вставьте путь и нажмите Enter")
        print("5. Откройте файл в Microsoft Word или Pages")
        
        print(f"\n💡 АЛЬТЕРНАТИВНО:")
        print("Можете открыть файл напрямую через терминал:")
        print(f"open '{document_path}'")
        
    else:
        print("\n❌ НЕ УДАЛОСЬ СОЗДАТЬ ДОКУМЕНТ")

if __name__ == "__main__":
    main()



