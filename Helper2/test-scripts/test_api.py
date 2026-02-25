#!/usr/bin/env python3
"""
Тестовый скрипт для проверки API голосового помощника
"""

import requests
import json
import time
from datetime import datetime

# Конфигурация
API_BASE_URL = "http://localhost:8000"

def test_health():
    """Тест проверки здоровья API"""
    print("🔍 Тестирование health endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API здоров: {data}")
            return True
        else:
            print(f"❌ API не отвечает: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ошибка подключения к API: {e}")
        return False

def test_create_command(command_type, payload):
    """Тест создания команды"""
    print(f"📝 Создание команды типа '{command_type}'...")
    try:
        data = {
            "type": command_type,
            "payload": payload,
            "created_by": "test_user"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/api/commands",
            headers={"Content-Type": "application/json"},
            json=data
        )
        
        if response.status_code == 200:
            command = response.json()
            print(f"✅ Команда создана: {command['id']}")
            return command
        else:
            print(f"❌ Ошибка создания команды: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании команды: {e}")
        return None

def test_get_command_status(command_id):
    """Тест получения статуса команды"""
    print(f"📊 Проверка статуса команды {command_id}...")
    try:
        response = requests.get(f"{API_BASE_URL}/api/commands/{command_id}/status")
        
        if response.status_code == 200:
            status = response.json()
            print(f"✅ Статус команды: {status['status']}")
            return status
        else:
            print(f"❌ Ошибка получения статуса: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при получении статуса: {e}")
        return None

def test_get_pending_commands():
    """Тест получения pending команд"""
    print("📋 Получение pending команд...")
    try:
        response = requests.get(f"{API_BASE_URL}/api/commands/pending")
        
        if response.status_code == 200:
            commands = response.json()
            print(f"✅ Найдено {len(commands)} pending команд")
            for cmd in commands:
                print(f"   - {cmd['id']}: {cmd['type']} (попыток: {cmd['attempt_count']})")
            return commands
        else:
            print(f"❌ Ошибка получения команд: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"❌ Ошибка при получении команд: {e}")
        return []

def test_update_command_status(command_id, status, result_url=None, error_message=None):
    """Тест обновления статуса команды"""
    print(f"🔄 Обновление статуса команды {command_id} на '{status}'...")
    try:
        data = {"status": status}
        if result_url:
            data["result_url"] = result_url
        if error_message:
            data["error_message"] = error_message
            
        response = requests.patch(
            f"{API_BASE_URL}/api/commands/{command_id}",
            headers={"Content-Type": "application/json"},
            json=data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Статус обновлен: {result}")
            return True
        else:
            print(f"❌ Ошибка обновления статуса: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при обновлении статуса: {e}")
        return False

def test_full_workflow():
    """Тест полного рабочего процесса"""
    print("\n🚀 Тестирование полного рабочего процесса...")
    
    # 1. Проверяем здоровье API
    if not test_health():
        return False
    
    # 2. Создаем тестовую команду
    test_payload = {
        "apartment_id": "1101",
        "act_type": "handover",
        "meta": {
            "notes": "Тестовая команда из скрипта",
            "test": True
        }
    }
    
    command = test_create_command("create_act", test_payload)
    if not command:
        return False
    
    command_id = command['id']
    
    # 3. Проверяем статус команды
    status = test_get_command_status(command_id)
    if not status:
        return False
    
    # 4. Имитируем обработку агентом
    print("⏳ Имитация обработки агентом...")
    time.sleep(2)
    
    # Обновляем статус на "processing"
    test_update_command_status(command_id, "processing")
    
    time.sleep(2)
    
    # Обновляем статус на "done" с результатом
    result_url = "https://example.com/documents/test_act.pdf"
    test_update_command_status(command_id, "done", result_url=result_url)
    
    # 5. Проверяем финальный статус
    final_status = test_get_command_status(command_id)
    if final_status and final_status['status'] == 'done':
        print("✅ Полный рабочий процесс протестирован успешно!")
        return True
    else:
        print("❌ Рабочий процесс завершился с ошибкой")
        return False

def test_error_scenarios():
    """Тест сценариев с ошибками"""
    print("\n🔧 Тестирование сценариев с ошибками...")
    
    # 1. Неверный тип команды
    print("📝 Тест с неверным типом команды...")
    invalid_command = test_create_command("invalid_type", {"test": "data"})
    if invalid_command is None:
        print("✅ Неверный тип команды правильно отклонен")
    else:
        print("❌ Неверный тип команды не был отклонен")
    
    # 2. Неполный payload
    print("📝 Тест с неполным payload...")
    incomplete_command = test_create_command("create_act", {"test": "data"})
    if incomplete_command is None:
        print("✅ Неполный payload правильно отклонен")
    else:
        print("❌ Неполный payload не был отклонен")
    
    # 3. Обновление несуществующей команды
    print("📝 Тест обновления несуществующей команды...")
    fake_id = "00000000-0000-0000-0000-000000000000"
    result = test_update_command_status(fake_id, "done")
    if not result:
        print("✅ Несуществующая команда правильно отклонена")
    else:
        print("❌ Несуществующая команда не была отклонена")

def main():
    """Главная функция тестирования"""
    print("🧪 Запуск тестов API голосового помощника")
    print("=" * 50)
    
    # Проверяем доступность API
    if not test_health():
        print("\n❌ API недоступен. Убедитесь, что backend запущен на http://localhost:8000")
        return
    
    # Тестируем основные функции
    print("\n📋 Тестирование получения pending команд...")
    test_get_pending_commands()
    
    # Тестируем полный рабочий процесс
    success = test_full_workflow()
    
    # Тестируем сценарии с ошибками
    test_error_scenarios()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Все тесты пройдены успешно!")
    else:
        print("⚠️  Некоторые тесты завершились с ошибками")
    
    print("\n💡 Для тестирования агента:")
    print("   1. Запустите офисный агент: python office-agent/agent.py")
    print("   2. Создайте команду через API")
    print("   3. Проверьте, что агент обработал команду")

if __name__ == "__main__":
    main()


