#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Проверка правильной папки"""

from yandex_disk_api import get_folder_contents, get_yandex_disk_folder_path

def main():
    print("=" * 60)
    print("ПРОВЕРКА ПРАВИЛЬНОЙ ПАПКИ")
    print("=" * 60)
    
    folder_path = get_yandex_disk_folder_path()
    print(f"\nПуть к папке: {folder_path}")
    
    try:
        print(f"\nЗагружаю содержимое...")
        files = get_folder_contents()
        
        print(f"\nНайдено {len(files)} элементов:")
        print("-" * 60)
        
        folders = [f for f in files if f['type'] == 'dir']
        file_items = [f for f in files if f['type'] == 'file']
        
        if folders:
            print(f"\nПапки ({len(folders)}):")
            for folder in folders[:10]:
                print(f"  - {folder['name']}")
            if len(folders) > 10:
                print(f"  ... и еще {len(folders) - 10} папок")
        
        if file_items:
            print(f"\nФайлы ({len(file_items)}):")
            for file in file_items[:10]:
                size = file.get('size', 0)
                size_str = f"{size / 1024:.1f} KB" if size < 1024*1024 else f"{size / (1024*1024):.1f} MB"
                print(f"  - {file['name']} ({size_str})")
            if len(file_items) > 10:
                print(f"  ... и еще {len(file_items) - 10} файлов")
        
        print("\n" + "=" * 60)
        print("Если вы видите папку 'Вишневый сад-3 для Заказчика' - все правильно!")
        print("Если видите другие папки (1. РД, 2. ИД и т.д.) - настройки неверные")
        print("=" * 60)
        
    except Exception as e:
        print(f"\nОШИБКА: {e}")

if __name__ == "__main__":
    main()




