#!/usr/bin/env python3
"""
Создание финального тестового письма для проверки нумерации
"""

from learning_document_generator import LearningDocumentGenerator
from datetime import datetime

def create_final_test_letter():
    """Создает финальное тестовое письмо"""
    print("📧 Создание финального тестового письма...")
    
    # Получаем сегодняшнюю дату
    today = datetime.now()
    print(f"📅 Сегодня: {today.strftime('%d.%m.%Y')}")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для финального тестового письма
    document_data = {
        'apartment_id': '3001',
        'apartment_number': '3001',
        'issue_type': 'проблема с канализацией',
        'issue_description': 'обнаружена проблема с системой канализации в квартире 3001, требующая технического решения',
        'expected_resolution': 'Устранение проблемы с канализацией и проверка системы',
        'contact_person': 'Канализационов К.К.',
        'phone': '+7 (999) 333-22-11'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Финальное тестовое письмо создано!")
            print(f"📁 Файл: {result}")
            
            return result
        else:
            print("❌ Не удалось создать финальное тестовое письмо")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании финального тестового письма: {e}")
        return None

if __name__ == "__main__":
    create_final_test_letter()



