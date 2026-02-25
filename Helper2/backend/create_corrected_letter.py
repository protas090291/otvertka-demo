#!/usr/bin/env python3
"""
Создание исправленного письма без рамок и с правильным выравниванием адресата
"""

from learning_document_generator import LearningDocumentGenerator

def create_corrected_letter():
    """Создает исправленное письмо без рамок и с правильным выравниванием"""
    print("📧 Создание исправленного письма...")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для исправленного письма
    document_data = {
        'apartment_id': '1901',
        'apartment_number': '1901',
        'issue_type': 'смещение сроков поставки материалов',
        'issue_description': 'задержка в поставке отделочных материалов для квартиры 1901, что влияет на общие сроки завершения работ',
        'expected_resolution': 'Ускорение поставки материалов и корректировка графика работ',
        'contact_person': 'Петров П.П.',
        'phone': '+7 (999) 555-66-77'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Исправленное письмо создано!")
            print(f"📁 Файл: {result}")
            
            # Показываем содержимое
            print("\n📄 СОДЕРЖИМОЕ ИСПРАВЛЕННОГО ПИСЬМА:")
            print("=" * 60)
            
            from docx import Document
            doc = Document(result)
            for i, paragraph in enumerate(doc.paragraphs, 1):
                if paragraph.text.strip():
                    print(f"{i:2d}. {paragraph.text}")
            
            print("=" * 60)
            
            return result
        else:
            print("❌ Не удалось создать исправленное письмо")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании исправленного письма: {e}")
        return None

if __name__ == "__main__":
    create_corrected_letter()



