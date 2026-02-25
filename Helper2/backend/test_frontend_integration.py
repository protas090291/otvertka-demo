#!/usr/bin/env python3
"""
Тест интеграции фронтенда с бэкендом
"""

import requests
import json

def test_letter_generation():
    """Тестируем генерацию письма через API"""
    print("🧪 Тестируем генерацию письма через API...")
    
    url = "http://localhost:8001/generate-letter"
    data = {
        "apartment_id": "902",
        "issue_type": "проблема с отоплением",
        "issue_description": "обнаружена проблема с системой отопления в квартире 902, требующая технического решения",
        "expected_resolution": "Решение в процессе",
        "contact_person": "Ответственное лицо",
        "phone": "+7 (XXX) XXX-XX-XX"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"📡 Статус ответа: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Письмо создано успешно!")
            print(f"📁 Файл: {result.get('file_path')}")
            print(f"🌐 URL: {result.get('file_url')}")
            print(f"📅 Дата: {result.get('date')}")
            
            # Проверяем, что файл доступен для скачивания
            download_url = f"http://localhost:8001{result.get('file_url')}"
            print(f"🔗 URL для скачивания: {download_url}")
            
            # Проверяем доступность файла
            download_response = requests.get(download_url)
            print(f"📥 Статус скачивания: {download_response.status_code}")
            
            if download_response.status_code == 200:
                print("✅ Файл доступен для скачивания!")
                print(f"📄 Размер файла: {len(download_response.content)} байт")
            else:
                print("❌ Файл недоступен для скачивания")
                
        else:
            print(f"❌ Ошибка: {response.status_code}")
            print(f"📄 Ответ: {response.text}")
            
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {e}")

def test_frontend_connection():
    """Тестируем подключение к фронтенду"""
    print("\n🧪 Тестируем подключение к фронтенду...")
    
    try:
        response = requests.get("http://localhost:5174")
        print(f"📡 Статус фронтенда: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Фронтенд доступен!")
        else:
            print("❌ Фронтенд недоступен")
            
    except Exception as e:
        print(f"❌ Ошибка подключения к фронтенду: {e}")

if __name__ == "__main__":
    print("🚀 Запуск тестов интеграции...")
    test_letter_generation()
    test_frontend_connection()
    print("\n✅ Тесты завершены!")
