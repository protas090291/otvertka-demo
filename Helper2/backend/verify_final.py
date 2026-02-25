#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Проверка финальных настроек"""

from yandex_disk_api import get_folder_contents, get_yandex_disk_folder_path
import requests
import time

def main():
    print("=" * 60)
    print("ПРОВЕРКА ФИНАЛЬНЫХ НАСТРОЕК")
    print("=" * 60)
    
    # Ждем, пока сервер запустится
    print("\nОжидание запуска сервера...")
    for i in range(10):
        try:
            response = requests.get("http://localhost:8000/health", timeout=2)
            if response.status_code == 200:
                print("Сервер запущен!")
                break
        except:
            time.sleep(1)
    else:
        print("ВНИМАНИЕ: Сервер может быть еще не готов")
    
    folder_path = get_yandex_disk_folder_path()
    print(f"\nПуть к папке: {folder_path}")
    
    try:
        print(f"\nЗагружаю содержимое папки...")
        files = get_folder_contents()
        
        print(f"\n✅ УСПЕХ! Найдено {len(files)} элементов в папке '{folder_path}':")
        print("-" * 60)
        
        folders = [f for f in files if f['type'] == 'dir']
        file_items = [f for f in files if f['type'] == 'file']
        
        if folders:
            print(f"\n📁 Папки ({len(folders)}):")
            for folder in folders[:10]:
                print(f"  - {folder['name']}")
            if len(folders) > 10:
                print(f"  ... и еще {len(folders) - 10} папок")
        
        if file_items:
            print(f"\n📄 Файлы ({len(file_items)}):")
            for file in file_items[:10]:
                size = file.get('size', 0)
                size_str = f"{size / 1024:.1f} KB" if size < 1024*1024 else f"{size / (1024*1024):.1f} MB"
                print(f"  - {file['name']} ({size_str})")
            if len(file_items) > 10:
                print(f"  ... и еще {len(file_items) - 10} файлов")
        
        # Проверяем API
        print("\n" + "=" * 60)
        print("Проверка API endpoint...")
        try:
            api_response = requests.get("http://localhost:8000/api/yandex-disk/files", timeout=5)
            if api_response.status_code == 200:
                api_data = api_response.json()
                print(f"✅ API работает! Возвращает {api_data.get('total', 0)} элементов")
                print(f"   Путь в API: {api_data.get('folder_path', 'N/A')}")
            else:
                print(f"⚠️ API вернул код: {api_response.status_code}")
        except Exception as e:
            print(f"⚠️ Ошибка проверки API: {e}")
        
        print("\n" + "=" * 60)
        print("✅ ВСЕ ГОТОВО!")
        print("=" * 60)
        print("\nТеперь:")
        print("1. Обновите страницу в браузере (F5)")
        print("2. Перейдите в раздел 'Яндекс Диск'")
        print("3. Должна отображаться папка 'Вишневый_сад-3_для_Заказчика'")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ОШИБКА: {e}")
        print("\nВозможные причины:")
        print("  - Неверный путь к папке")
        print("  - Проблемы с OAuth токеном")
        print("  - Папка не существует или нет доступа")

if __name__ == "__main__":
    main()




