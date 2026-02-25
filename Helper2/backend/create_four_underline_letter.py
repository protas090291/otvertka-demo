#!/usr/bin/env python3
"""
Создание письма с четырьмя подчеркиваниями перед и после номера документа
"""

from learning_document_generator import LearningDocumentGenerator

def create_four_underline_letter():
    """Создает письмо с четырьмя подчеркиваниями перед и после номера документа"""
    print("📧 Создание письма с четырьмя подчеркиваниями перед и после номера документа...")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для письма с четырьмя подчеркиваниями
    document_data = {
        'apartment_id': '7001',
        'apartment_number': '7001',
        'issue_type': 'проблема с электроснабжением',
        'issue_description': 'обнаружена проблема с системой электроснабжения в квартире 7001, требующая технического решения',
        'expected_resolution': 'Устранение проблемы с электроснабжением и проверка системы',
        'contact_person': 'Электронов Э.Э.',
        'phone': '+7 (999) 777-88-99'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Письмо с четырьмя подчеркиваниями создано!")
            print(f"📁 Файл: {result}")
            
            # Показываем содержимое
            print("\n📄 СОДЕРЖИМОЕ ПИСЬМА С ЧЕТЫРЬМЯ ПОДЧЕРКИВАНИЯМИ:")
            print("=" * 60)
            
            from docx import Document
            doc = Document(result)
            for i, paragraph in enumerate(doc.paragraphs, 1):
                if paragraph.text.strip():
                    print(f"{i:2d}. {paragraph.text}")
            
            print("=" * 60)
            
            return result
        else:
            print("❌ Не удалось создать письмо с четырьмя подчеркиваниями")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании письма с четырьмя подчеркиваниями: {e}")
        return None

if __name__ == "__main__":
    create_four_underline_letter()



