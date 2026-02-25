#!/usr/bin/env python3
"""
Создание еще одного письма с другим содержанием
"""

from learning_document_generator import LearningDocumentGenerator
from datetime import datetime

def create_another_letter():
    """Создает еще одно письмо с другим содержанием"""
    print("📧 Создание еще одного письма...")
    
    # Получаем сегодняшнюю дату
    today = datetime.now()
    print(f"📅 Сегодня: {today.strftime('%d.%m.%Y')}")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для письма с проблемой электроснабжения
    document_data = {
        'apartment_id': '1503',
        'apartment_number': '1503',
        'issue_type': 'проблема с электроснабжением',
        'issue_description': 'обнаружена проблема с системой электроснабжения в квартире 1503, требующая технического решения',
        'expected_resolution': 'Устранение проблемы с электроснабжением и проверка системы',
        'contact_person': 'Электромонтов Э.Э.',
        'phone': '+7 (999) 555-44-33'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Еще одно письмо создано!")
            print(f"📁 Файл: {result}")
            
            # Показываем содержимое
            print("\n📄 СОДЕРЖИМОЕ ВТОРОГО ПИСЬМА:")
            print("=" * 60)
            
            from docx import Document
            doc = Document(result)
            for i, paragraph in enumerate(doc.paragraphs, 1):
                if paragraph.text.strip():
                    print(f"{i:2d}. {paragraph.text}")
            
            print("=" * 60)
            
            return result
        else:
            print("❌ Не удалось создать второе письмо")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании второго письма: {e}")
        return None

if __name__ == "__main__":
    create_another_letter()