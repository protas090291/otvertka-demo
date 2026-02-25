#!/usr/bin/env python3
"""
Создание письма о проблеме с отоплением в квартире 902
"""

from learning_document_generator import LearningDocumentGenerator
from datetime import datetime

def create_heating_letter_902():
    """Создает письмо о проблеме с отоплением в квартире 902"""
    print("📧 Создание письма о проблеме с отоплением в квартире 902...")
    
    # Получаем сегодняшнюю дату
    today = datetime.now()
    print(f"📅 Сегодня: {today.strftime('%d.%m.%Y')}")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для письма о проблеме с отоплением в квартире 902
    document_data = {
        'apartment_id': '902',
        'apartment_number': '902',
        'issue_type': 'проблема с отоплением',
        'issue_description': 'обнаружена проблема с системой отопления в квартире 902, требующая технического решения',
        'expected_resolution': 'Устранение проблемы с отоплением и проверка системы',
        'contact_person': 'Отопленов О.О.',
        'phone': '+7 (999) 111-22-33'
    }
    
    try:
        # Создаем письмо через обученную систему
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Письмо о проблеме с отоплением в квартире 902 создано!")
            print(f"📁 Файл: {result}")
            
            # Показываем содержимое
            print("\n📄 СОДЕРЖИМОЕ ПИСЬМА О ПРОБЛЕМЕ С ОТОПЛЕНИЕМ:")
            print("=" * 60)
            
            from docx import Document
            doc = Document(result)
            for i, paragraph in enumerate(doc.paragraphs, 1):
                if paragraph.text.strip():
                    print(f"{i:2d}. {paragraph.text}")
            
            print("=" * 60)
            
            return result
        else:
            print("❌ Не удалось создать письмо о проблеме с отоплением")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании письма о проблеме с отоплением: {e}")
        return None

if __name__ == "__main__":
    create_heating_letter_902()



