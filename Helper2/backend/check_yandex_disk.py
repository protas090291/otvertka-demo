#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Проверка содержимого Яндекс Диска"""

import sys
import io

# Устанавливаем UTF-8 для вывода
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from yandex_disk_api import get_public_folder_contents, get_yandex_disk_public_key, get_yandex_disk_folder_path

def main():
    print("=" * 60)
    print("ПРОВЕРКА НАСТРОЕК ЯНДЕКС ДИСКА")
    print("=" * 60)
    
    public_key = get_yandex_disk_public_key()
    folder_path = get_yandex_disk_folder_path()
    
    print(f"\nПубличный ключ: {public_key}")
    print(f"Путь к папке: '{folder_path}' (пусто = корневая папка)")
    
    if not public_key:
        print("\n[ОШИБКА] Публичный ключ не установлен!")
        return
    
    try:
        print(f"\n[INFO] Загружаю содержимое папки...")
        files = get_public_folder_contents(public_key, folder_path if folder_path else None)
        
        print(f"\n[OK] Найдено {len(files)} элементов:")
        print("-" * 60)
        
        folders = [f for f in files if f['type'] == 'dir']
        file_items = [f for f in files if f['type'] == 'file']
        
        if folders:
            print(f"\nПапки ({len(folders)}):")
            for folder in folders[:10]:
                print(f"  - {folder['name']} (путь: {folder['path']})")
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
        print("[TIP] Если вы видите не те данные:")
        print("   1. Проверьте публичный ключ в .env файле")
        print("   2. Установите YANDEX_DISK_FOLDER_PATH для указания подпапки")
        print("   3. Убедитесь, что папка действительно публичная")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n[ОШИБКА] {e}")
        print("\nВозможные причины:")
        print("  - Неверный публичный ключ")
        print("  - Папка не является публичной")
        print("  - Проблемы с подключением к API Яндекс Диска")

if __name__ == "__main__":
    main()

