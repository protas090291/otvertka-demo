#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для проверки таблиц budget_items и warehouse_items в Supabase
"""

import os
import sys
import io

# Настройка кодировки для Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from supabase import create_client, Client

# Конфигурация Supabase из кода
SUPABASE_URL = "https://yytqmdanfcwfqfqruvta.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5dHFtZGFuZmN3ZnFmcXJ1dnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MzMzNDEsImV4cCI6MjA3MzEwOTM0MX0.vCgOY0MVZ6oGlZuK8SRhD8YhNyEsjP65ebJuWjy8HPw"

def check_table_exists(supabase: Client, table_name: str) -> bool:
    """Проверяет, существует ли таблица"""
    try:
        # Пытаемся выполнить простой запрос
        result = supabase.table(table_name).select("*").limit(1).execute()
        return True
    except Exception as e:
        error_msg = str(e)
        if "does not exist" in error_msg or "PGRST116" in error_msg:
            return False
        # Другие ошибки (например, RLS) - таблица существует, но нет доступа
        return True

def check_table_data(supabase: Client, table_name: str):
    """Проверяет данные в таблице"""
    try:
        result = supabase.table(table_name).select("*").limit(100).execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"[ERROR] Ошибка при получении данных из {table_name}: {e}")
        return None

def main():
    print("=" * 60)
    print("Проверка таблиц budget_items и warehouse_items")
    print("=" * 60)
    print()
    
    # Создаем клиент Supabase
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
        print(f"[OK] Подключение к Supabase установлено")
        print(f"[INFO] URL: {SUPABASE_URL}")
        print()
    except Exception as e:
        print(f"[ERROR] Ошибка подключения к Supabase: {e}")
        return 1
    
    # Проверяем таблицу budget_items
    print("-" * 60)
    print("Проверка таблицы budget_items")
    print("-" * 60)
    
    budget_exists = check_table_exists(supabase, "budget_items")
    if budget_exists:
        print("[OK] Таблица budget_items существует")
        
        budget_data = check_table_data(supabase, "budget_items")
        if budget_data is not None:
            if len(budget_data) == 0:
                print("[WARNING] Таблица budget_items пуста (нет данных)")
            else:
                print(f"[OK] Найдено записей в budget_items: {len(budget_data)}")
                print()
                print("Примеры записей:")
                for i, item in enumerate(budget_data[:5], 1):
                    print(f"  {i}. ID: {item.get('id', 'N/A')[:8]}...")
                    print(f"     Категория: {item.get('category', 'N/A')}")
                    print(f"     Описание: {item.get('description', 'N/A')[:50]}...")
                    print(f"     Сумма: {item.get('amount', 'N/A')}")
                    print(f"     Тип: {item.get('type', 'N/A')}")
                    print(f"     Проект: {item.get('project_id', 'N/A')}")
                    print()
                
                # Статистика по project_id
                project_ids = {}
                for item in budget_data:
                    project_id = item.get('project_id', 'unknown')
                    project_ids[project_id] = project_ids.get(project_id, 0) + 1
                
                print("Статистика по проектам:")
                for project_id, count in project_ids.items():
                    print(f"  - {project_id}: {count} записей")
        else:
            print("[ERROR] Не удалось получить данные из budget_items")
    else:
        print("[ERROR] Таблица budget_items НЕ СУЩЕСТВУЕТ")
        print("   Выполните SQL скрипт: supabase-budget-setup.sql")
    
    print()
    
    # Проверяем таблицу warehouse_items
    print("-" * 60)
    print("Проверка таблицы warehouse_items")
    print("-" * 60)
    
    warehouse_exists = check_table_exists(supabase, "warehouse_items")
    if warehouse_exists:
        print("[OK] Таблица warehouse_items существует")
        
        warehouse_data = check_table_data(supabase, "warehouse_items")
        if warehouse_data is not None:
            if len(warehouse_data) == 0:
                print("[WARNING] Таблица warehouse_items пуста (нет данных)")
            else:
                print(f"[OK] Найдено записей в warehouse_items: {len(warehouse_data)}")
                print()
                print("Примеры записей:")
                for i, item in enumerate(warehouse_data[:5], 1):
                    print(f"  {i}. ID: {item.get('id', 'N/A')[:8]}...")
                    print(f"     Название: {item.get('name', 'N/A')}")
                    print(f"     Категория: {item.get('category', 'N/A')}")
                    print(f"     Количество: {item.get('quantity', 'N/A')} {item.get('unit', '')}")
                    print(f"     Статус: {item.get('status', 'N/A')}")
                    print(f"     Местоположение: {item.get('location', 'N/A')}")
                    print()
                
                # Статистика по категориям
                categories = {}
                for item in warehouse_data:
                    category = item.get('category', 'unknown')
                    categories[category] = categories.get(category, 0) + 1
                
                print("Статистика по категориям:")
                for category, count in categories.items():
                    print(f"  - {category}: {count} записей")
        else:
            print("[ERROR] Не удалось получить данные из warehouse_items")
    else:
        print("[ERROR] Таблица warehouse_items НЕ СУЩЕСТВУЕТ")
        print("   Выполните SQL скрипт: supabase-materials-setup.sql")
    
    print()
    print("=" * 60)
    print("[OK] Проверка завершена")
    print("=" * 60)
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Прервано пользователем")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Неожиданная ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

