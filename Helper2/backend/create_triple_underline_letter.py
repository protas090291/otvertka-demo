#!/usr/bin/env python3
"""
Создание письма с тремя подчеркиваниями перед и после даты
"""

from learning_document_generator import LearningDocumentGenerator

def create_triple_underline_letter():
    """Создает письмо с тремя подчеркиваниями перед и после даты"""
    print("📧 Создание письма с тремя подчеркиваниями перед и после даты...")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для письма с тремя подчеркиваниями
    document_data = {
        'apartment_id': '6001',
        'apartment_number': '6001',
        'issue_type': 'проблема с водоснабжением',
        'issue_description': 'обнаружена проблема с системой водоснабжения в квартире 6001, требующая технического решения',
        'expected_resolution': 'Устранение проблемы с водоснабжением и проверка системы',
        'contact_person': 'Водянов В.В.',
        'phone': '+7 (999) 666-77-88'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Письмо с тремя подчеркиваниями создано!")
            print(f"📁 Файл: {result}")
            
            # Показываем содержимое
            print("\n📄 СОДЕРЖИМОЕ ПИСЬМА С ТРЕМЯ ПОДЧЕРКИВАНИЯМИ:")
            print("=" * 60)
            
            from docx import Document
            doc = Document(result)
            for i, paragraph in enumerate(doc.paragraphs, 1):
                if paragraph.text.strip():
                    print(f"{i:2d}. {paragraph.text}")
            
            print("=" * 60)
            
            return result
        else:
            print("❌ Не удалось создать письмо с тремя подчеркиваниями")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании письма с тремя подчеркиваниями: {e}")
        return None

if __name__ == "__main__":
    create_triple_underline_letter()



