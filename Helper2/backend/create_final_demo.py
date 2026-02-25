#!/usr/bin/env python3
"""
Создание финального демонстрационного письма с точным форматированием
"""

from learning_document_generator import LearningDocumentGenerator

def create_final_demo():
    """Создает финальное демонстрационное письмо"""
    print("📧 Создание финального демонстрационного письма...")
    
    generator = LearningDocumentGenerator(
        documents_dir="../existing_documents",
        supabase_url=None,
        supabase_key=None
    )
    
    # Данные для финального письма
    document_data = {
        'apartment_id': '1801',
        'apartment_number': '1801',
        'issue_type': 'смещение сроков монтажа окон',
        'issue_description': 'задержка в монтаже оконных блоков в квартире 1801 из-за несоответствия размеров проемов, что влияет на общие сроки сдачи объекта',
        'expected_resolution': 'Проведение дополнительных замеров и изготовление окон по новым размерам',
        'contact_person': 'Сидоров С.С.',
        'phone': '+7 (999) 777-88-99'
    }
    
    try:
        # Создаем письмо
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            print("✅ Финальное демонстрационное письмо создано!")
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
    create_final_demo()



