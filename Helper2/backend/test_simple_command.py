#!/usr/bin/env python3
"""
Простой тест команды
"""

import requests
import json

def test_simple_command():
    """Тестируем простую команду"""
    print("🧪 Тестируем простую команду...")
    
    # Тестируем команду через API
    url = "http://localhost:8001/generate-letter"
    data = {
        "apartment_id": "902",
        "issue_type": "проблема с отоплением",
        "issue_description": "обнаружена проблема с системой отопления в квартире 902",
        "expected_resolution": "Решение в процессе",
        "contact_person": "Ответственное лицо",
        "phone": "+7 (XXX) XXX-XX-XX"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"📡 Статус: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Успешно!")
            print(f"📁 Файл: {result.get('file_path')}")
            print(f"🌐 URL: {result.get('file_url')}")
            
            # Проверяем скачивание
            download_url = f"http://localhost:8001{result.get('file_url')}"
            download_response = requests.get(download_url)
            print(f"📥 Скачивание: {download_response.status_code}")
            
            if download_response.status_code == 200:
                print("✅ Файл доступен для скачивания!")
            else:
                print("❌ Файл недоступен")
                
        else:
            print(f"❌ Ошибка: {response.text}")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    test_simple_command()



