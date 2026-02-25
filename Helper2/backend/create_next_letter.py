#!/usr/bin/env python3
"""
Создание следующего письма для проверки нумерации
"""

from learning_document_generator import LearningDocumentGenerator
from datetime import datetime

def create_next_letter():
    """Создает следующее письмо"""
    print("📧 Создание следующего письма...")
    
    # Получаем сегодняшнюю дату
    today = datetime.now()
    print(f"📅 Сегодня: {today.strftime('%d.%m.%Y')}")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для следующего письма
    document_data = {
        'apartment_id': '4001',
        'apartment_number': '4001',
        'issue_type': 'проблема с отоплением',
        'issue_description': 'обнаружена проблема с системой отопления в квартире 4001, требующая технического решения',
        'expected_resolution': 'Устранение проблемы с отоплением и проверка системы',
        'contact_person': 'Отопленов О.О.',
        'phone': '+7 (999) 222-11-00'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Следующее письмо создано!")
            print(f"📁 Файл: {result}")
            
            return result
        else:
            print("❌ Не удалось создать следующее письмо")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании следующего письма: {e}")
        return None

if __name__ == "__main__":
    create_next_letter()



