#!/usr/bin/env python3
"""
Тестирование исправлений для генерации писем
"""

import requests
import json

def test_letter_generation():
    """Тестирует генерацию письма с исправленными параметрами"""
    print("🧪 Тестирование исправленной генерации писем...")
    
    # URL API
    api_url = "http://localhost:8001/generate-letter"
    
    # Данные для письма о проблеме с отоплением в квартире 902
    request_data = {
        "apartment_id": "902",
        "issue_type": "проблема с отоплением",
        "issue_description": "обнаружена проблема с системой отопления в квартире 902, требующая технического решения",
        "expected_resolution": "Устранение проблемы с отоплением и проверка системы",
        "contact_person": "Отопленов О.О.",
        "phone": "+7 (999) 111-22-33"
    }
    
    try:
        print(f"📧 Отправляем запрос на {api_url}...")
        print(f"📄 Данные: {json.dumps(request_data, ensure_ascii=False, indent=2)}")
        
        # Отправляем POST запрос
        response = requests.post(
            api_url,
            json=request_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Письмо успешно создано!")
            print(f"📁 Файл: {result.get('file_path')}")
            print(f"🔢 Номер документа: {result.get('document_number')}")
            print(f"📅 Дата: {result.get('date')}")
            print(f"🌐 URL: {result.get('file_url')}")
            
            # Проверяем, что квартира указана правильно
            if "902" in result.get('file_path', ''):
                print("✅ Номер квартиры указан правильно!")
            else:
                print("❌ Проблема с номером квартиры!")
            
            return True
        else:
            print(f"❌ Ошибка: {response.status_code}")
            print(f"📄 Ответ: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Не удалось подключиться к API серверу")
        print("💡 Убедитесь, что сервер запущен: python document_generation_api.py")
        return False
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

if __name__ == "__main__":
    test_letter_generation()



