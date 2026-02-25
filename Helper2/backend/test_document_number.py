#!/usr/bin/env python3
"""
Тестирование правильной генерации номера документа
"""

from learning_document_generator import LearningDocumentGenerator
from datetime import datetime

def test_document_number():
    """Тестирует правильную генерацию номера документа"""
    print("🧪 Тестирование генерации номера документа...")
    
    # Получаем сегодняшнюю дату
    today = datetime.now()
    print(f"📅 Сегодня: {today.strftime('%d.%m.%Y')}")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для тестового письма
    document_data = {
        'apartment_id': '2001',
        'apartment_number': '2001',
        'issue_type': 'проблема с вентиляцией',
        'issue_description': 'обнаружена проблема с системой вентиляции в квартире 2001, требующая технического решения',
        'expected_resolution': 'Устранение проблемы с вентиляцией и проверка системы',
        'contact_person': 'Вентиляционов В.В.',
        'phone': '+7 (999) 444-33-22'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Тестовое письмо создано!")
            print(f"📁 Файл: {result}")
            
            return result
        else:
            print("❌ Не удалось создать тестовое письмо")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании тестового письма: {e}")
        return None

if __name__ == "__main__":
    test_document_number()



