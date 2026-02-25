#!/usr/bin/env python3
"""
Создание письма с подчеркнутой датой
"""

from learning_document_generator import LearningDocumentGenerator

def create_underlined_date_letter():
    """Создает письмо с подчеркнутой датой"""
    print("📧 Создание письма с подчеркнутой датой...")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для письма с подчеркнутой датой
    document_data = {
        'apartment_id': '5001',
        'apartment_number': '5001',
        'issue_type': 'проблема с отоплением',
        'issue_description': 'обнаружена проблема с системой отопления в квартире 5001, требующая срочного решения',
        'expected_resolution': 'Устранение проблемы с отоплением и проверка системы',
        'contact_person': 'Морозов М.М.',
        'phone': '+7 (999) 555-66-77'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Письмо с подчеркнутой датой создано!")
            print(f"📁 Файл: {result}")
            
            # Показываем содержимое
            print("\n📄 СОДЕРЖИМОЕ ПИСЬМА С ПОДЧЕРКНУТОЙ ДАТОЙ:")
            print("=" * 60)
            
            from docx import Document
            doc = Document(result)
            for i, paragraph in enumerate(doc.paragraphs, 1):
                if paragraph.text.strip():
                    print(f"{i:2d}. {paragraph.text}")
            
            print("=" * 60)
            
            return result
        else:
            print("❌ Не удалось создать письмо с подчеркнутой датой")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании письма с подчеркнутой датой: {e}")
        return None

if __name__ == "__main__":
    create_underlined_date_letter()



