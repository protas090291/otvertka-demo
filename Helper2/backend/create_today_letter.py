#!/usr/bin/env python3
"""
Создание письма с сегодняшней датой
"""

from learning_document_generator import LearningDocumentGenerator
from datetime import datetime

def create_today_letter():
    """Создает письмо с сегодняшней датой"""
    print("📧 Создание письма с сегодняшней датой...")
    
    # Получаем сегодняшнюю дату
    today = datetime.now()
    print(f"📅 Сегодня: {today.strftime('%d.%m.%Y')}")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для письма с сегодняшней датой
    document_data = {
        'apartment_id': '1001',
        'apartment_number': '1001',
        'issue_type': 'проблема с водоснабжением',
        'issue_description': 'обнаружена проблема с системой водоснабжения в квартире 1001, требующая технического решения',
        'expected_resolution': 'Устранение проблемы с водоснабжением и проверка системы',
        'contact_person': 'Водопроводов В.В.',
        'phone': '+7 (999) 666-77-88'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Письмо с сегодняшней датой создано!")
            print(f"📁 Файл: {result}")
            
            # Показываем содержимое
            print("\n📄 СОДЕРЖИМОЕ ПИСЬМА С СЕГОДНЯШНЕЙ ДАТОЙ:")
            print("=" * 60)
            
            from docx import Document
            doc = Document(result)
            for i, paragraph in enumerate(doc.paragraphs, 1):
                if paragraph.text.strip():
                    print(f"{i:2d}. {paragraph.text}")
            
            print("=" * 60)
            
            return result
        else:
            print("❌ Не удалось создать письмо с сегодняшней датой")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании письма с сегодняшней датой: {e}")
        return None

if __name__ == "__main__":
    create_today_letter()



