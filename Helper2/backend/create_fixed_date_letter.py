#!/usr/bin/env python3
"""
Создание письма с фиксированной датой как в оригинале
"""

from learning_document_generator import LearningDocumentGenerator

def create_fixed_date_letter():
    """Создает письмо с фиксированной датой как в оригинале"""
    print("📧 Создание письма с фиксированной датой как в оригинале...")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для письма с фиксированной датой
    document_data = {
        'apartment_id': '1201',
        'apartment_number': '1201',
        'issue_type': 'смещение сроков поставки материалов',
        'issue_description': 'задержка в поставке материалов для отделочных работ в квартире 1201, что влияет на общие сроки сдачи объекта',
        'expected_resolution': 'Ускорение поставки материалов и компенсация задержки',
        'contact_person': 'Сидоров С.С.',
        'phone': '+7 (999) 888-77-66'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Письмо с фиксированной датой создано!")
            print(f"📁 Файл: {result}")
            
            # Показываем содержимое
            print("\n📄 СОДЕРЖИМОЕ ПИСЬМА С ФИКСИРОВАННОЙ ДАТОЙ:")
            print("=" * 60)
            
            from docx import Document
            doc = Document(result)
            for i, paragraph in enumerate(doc.paragraphs, 1):
                if paragraph.text.strip():
                    print(f"{i:2d}. {paragraph.text}")
            
            print("=" * 60)
            
            return result
        else:
            print("❌ Не удалось создать письмо с фиксированной датой")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании письма с фиксированной датой: {e}")
        return None

if __name__ == "__main__":
    create_fixed_date_letter()



