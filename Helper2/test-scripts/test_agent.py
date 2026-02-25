#!/usr/bin/env python3
"""
Тестовый скрипт для проверки офисного агента
"""

import os
import sys
import time
import json
from datetime import datetime

# Добавляем путь к агенту
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'office-agent'))

from agent import OfficeAgent

def test_agent_initialization():
    """Тест инициализации агента"""
    print("🔧 Тестирование инициализации агента...")
    
    try:
        # Проверяем переменные окружения
        required_vars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        
        if missing_vars:
            print(f"❌ Отсутствуют переменные окружения: {missing_vars}")
            print("💡 Создайте файл .env в папке office-agent с необходимыми переменными")
            return False
        
        # Создаем агента
        agent = OfficeAgent()
        print("✅ Агент инициализирован успешно")
        return agent
        
    except Exception as e:
        print(f"❌ Ошибка инициализации агента: {e}")
        return None

def test_supabase_connection(agent):
    """Тест подключения к Supabase"""
    print("🔗 Тестирование подключения к Supabase...")
    
    try:
        # Пытаемся получить pending команды
        commands = agent._get_pending_commands(limit=1)
        print("✅ Подключение к Supabase работает")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка подключения к Supabase: {e}")
        return False

def test_command_processing(agent):
    """Тест обработки команды"""
    print("⚙️ Тестирование обработки команды...")
    
    try:
        # Создаем тестовую команду
        test_command = {
            "id": "test-command-id",
            "type": "create_act",
            "payload": {
                "apartment_id": "1101",
                "act_type": "handover",
                "meta": {
                    "notes": "Тестовая команда для агента",
                    "test": True
                }
            },
            "attempt_count": 0
        }
        
        # Тестируем создание документа
        print("📄 Тестирование создания акта приёмки...")
        filepath = agent._create_handover_act(test_command["payload"])
        
        if os.path.exists(filepath):
            print(f"✅ Документ создан: {filepath}")
            
            # Проверяем размер файла
            file_size = os.path.getsize(filepath)
            print(f"📊 Размер файла: {file_size} байт")
            
            # Удаляем тестовый файл
            os.remove(filepath)
            print("🗑️ Тестовый файл удален")
            
            return True
        else:
            print("❌ Документ не был создан")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при тестировании обработки команды: {e}")
        return False

def test_document_creation():
    """Тест создания различных типов документов"""
    print("📋 Тестирование создания документов...")
    
    try:
        agent = OfficeAgent()
        
        # Тест создания акта приёмки
        print("📄 Тест создания акта приёмки...")
        handover_payload = {
            "apartment_id": "1101",
            "act_type": "handover",
            "meta": {"notes": "Тестовый акт приёмки"}
        }
        
        handover_file = agent._create_handover_act(handover_payload)
        if os.path.exists(handover_file):
            print(f"✅ Акт приёмки создан: {handover_file}")
            os.remove(handover_file)
        else:
            print("❌ Акт приёмки не создан")
            return False
        
        # Тест создания отчёта о дефектах
        print("📄 Тест создания отчёта о дефектах...")
        defect_payload = {
            "apartment_id": "1102",
            "defect_description": "Трещина в стене",
            "meta": {"notes": "Тестовый отчёт о дефектах"}
        }
        
        defect_file = agent._create_defect_report(defect_payload)
        if os.path.exists(defect_file):
            print(f"✅ Отчёт о дефектах создан: {defect_file}")
            os.remove(defect_file)
        else:
            print("❌ Отчёт о дефектах не создан")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при тестировании создания документов: {e}")
        return False

def test_printer_detection():
    """Тест обнаружения принтера"""
    print("🖨️ Тестирование обнаружения принтера...")
    
    try:
        agent = OfficeAgent()
        
        if hasattr(agent, 'printer_name') and agent.printer_name:
            print(f"✅ Принтер обнаружен: {agent.printer_name}")
            return True
        else:
            print("⚠️ Принтер не обнаружен или не настроен")
            print("💡 Установите переменную PRINTER_NAME в .env файле")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка при тестировании принтера: {e}")
        return False

def test_logging():
    """Тест системы логирования"""
    print("📝 Тестирование системы логирования...")
    
    try:
        agent = OfficeAgent()
        
        # Тестируем логирование
        test_command_id = "test-logging-command"
        agent._log_agent_action(
            test_command_id,
            "info",
            "Тестовое сообщение",
            {"test": True, "timestamp": datetime.now().isoformat()}
        )
        
        print("✅ Логирование работает")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при тестировании логирования: {e}")
        return False

def test_agent_run_once():
    """Тест однократного запуска агента"""
    print("🔄 Тестирование однократного запуска агента...")
    
    try:
        agent = OfficeAgent()
        
        # Запускаем один цикл обработки
        print("⏳ Запуск одного цикла обработки...")
        agent.run_once()
        
        print("✅ Однократный запуск выполнен")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка при однократном запуске: {e}")
        return False

def create_test_command():
    """Создание тестовой команды в базе данных"""
    print("📝 Создание тестовой команды в базе данных...")
    
    try:
        agent = OfficeAgent()
        
        # Создаем тестовую команду
        command_data = {
            "type": "create_act",
            "payload": {
                "apartment_id": "9999",
                "act_type": "handover",
                "meta": {
                    "notes": "Тестовая команда для агента",
                    "created_by": "test_script",
                    "timestamp": datetime.now().isoformat()
                }
            },
            "status": "pending",
            "created_by": "test_script"
        }
        
        result = agent.supabase.table("commands").insert(command_data).execute()
        
        if result.data:
            command_id = result.data[0]['id']
            print(f"✅ Тестовая команда создана: {command_id}")
            return command_id
        else:
            print("❌ Не удалось создать тестовую команду")
            return None
            
    except Exception as e:
        print(f"❌ Ошибка при создании тестовой команды: {e}")
        return None

def cleanup_test_commands():
    """Очистка тестовых команд"""
    print("🧹 Очистка тестовых команд...")
    
    try:
        agent = OfficeAgent()
        
        # Удаляем тестовые команды
        result = agent.supabase.table("commands").delete().eq("created_by", "test_script").execute()
        
        print(f"✅ Удалено {len(result.data) if result.data else 0} тестовых команд")
        
    except Exception as e:
        print(f"❌ Ошибка при очистке тестовых команд: {e}")

def main():
    """Главная функция тестирования"""
    print("🧪 Запуск тестов офисного агента")
    print("=" * 50)
    
    # Проверяем наличие .env файла
    env_file = os.path.join(os.path.dirname(__file__), '..', 'office-agent', '.env')
    if not os.path.exists(env_file):
        print("❌ Файл .env не найден в папке office-agent")
        print("💡 Создайте файл .env с переменными SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY")
        return
    
    # Загружаем переменные окружения
    from dotenv import load_dotenv
    load_dotenv(env_file)
    
    # Тестируем инициализацию
    agent = test_agent_initialization()
    if not agent:
        return
    
    # Тестируем подключение к Supabase
    if not test_supabase_connection(agent):
        return
    
    # Тестируем создание документов
    if not test_document_creation():
        return
    
    # Тестируем обнаружение принтера
    test_printer_detection()
    
    # Тестируем логирование
    if not test_logging():
        return
    
    # Создаем тестовую команду
    test_command_id = create_test_command()
    
    if test_command_id:
        # Тестируем обработку команды
        if test_command_processing(agent):
            print("✅ Обработка команды работает")
        
        # Тестируем однократный запуск
        test_agent_run_once()
        
        # Очищаем тестовые данные
        cleanup_test_commands()
    
    print("\n" + "=" * 50)
    print("🎉 Тесты агента завершены!")
    
    print("\n💡 Для запуска агента в рабочем режиме:")
    print("   cd office-agent")
    print("   python agent.py")
    
    print("\n💡 Для мониторинга логов:")
    print("   tail -f office-agent/agent.log")

if __name__ == "__main__":
    main()


