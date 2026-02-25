#!/usr/bin/env python3
"""
Создание финального письма с правильным расположением подписи
"""

from learning_document_generator import LearningDocumentGenerator

def create_final_correct_signature():
    """Создает финальное письмо с правильным расположением подписи"""
    print("📧 Создание финального письма с правильным расположением подписи...")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для финального письма
    document_data = {
        'apartment_id': '2501',
        'apartment_number': '2501',
        'issue_type': 'смещение сроков монтажа систем отопления',
        'issue_description': 'задержка в монтаже систем отопления в квартире 2501 из-за несоответствия технических характеристик оборудования, что влияет на общие сроки сдачи объекта',
        'expected_resolution': 'Замена оборудования и ускорение монтажных работ',
        'contact_person': 'Волков В.В.',
        'phone': '+7 (999) 777-88-99'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Финальное письмо с правильной подписью создано!")
            print(f"📁 Файл: {result}")
            
            # Показываем содержимое
            print("\n📄 СОДЕРЖИМОЕ ФИНАЛЬНОГО ПИСЬМА:")
            print("=" * 60)
            
            from docx import Document
            doc = Document(result)
            for i, paragraph in enumerate(doc.paragraphs, 1):
                if paragraph.text.strip():
                    print(f"{i:2d}. {paragraph.text}")
            
            print("=" * 60)
            
            return result
        else:
            print("❌ Не удалось создать финальное письмо")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании финального письма: {e}")
        return None

if __name__ == "__main__":
    create_final_correct_signature()



