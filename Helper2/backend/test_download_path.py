"""Тест скачивания файла с правильным путем"""
import os
from dotenv import load_dotenv
from pathlib import Path
from yandex_disk_api import get_public_folder_contents, get_yandex_disk_public_key, get_public_download_link

# Загружаем переменные окружения
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

public_key = get_yandex_disk_public_key()
print(f"Public key: {public_key}")
print()

# Получаем список файлов
files = get_public_folder_contents(public_key, None)
print(f"Found {len(files)} items")
print()

# Ищем файлы (не папки)
file_items = [f for f in files if f['type'] == 'file']
print(f"Found {len(file_items)} files")
print()

if file_items:
    # Берем первый файл
    test_file = file_items[0]
    print(f"Testing file:")
    print(f"  Name: {test_file['name']}")
    print(f"  Path: {test_file['path']}")
    print()
    
    # Пробуем получить ссылку для скачивания
    try:
        download_link = get_public_download_link(public_key, test_file['path'])
        print(f"SUCCESS! Download link: {download_link[:100]}...")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
else:
    print("No files found, checking subfolders...")
    # Проверяем первую папку
    dir_items = [f for f in files if f['type'] == 'dir']
    if dir_items:
        test_dir = dir_items[0]
        print(f"Checking folder: {test_dir['name']} ({test_dir['path']})")
        sub_files = get_public_folder_contents(public_key, test_dir['path'])
        file_items = [f for f in sub_files if f['type'] == 'file']
        if file_items:
            test_file = file_items[0]
            print(f"Testing file from subfolder:")
            print(f"  Name: {test_file['name']}")
            print(f"  Path: {test_file['path']}")
            print()
            try:
                download_link = get_public_download_link(public_key, test_file['path'])
                print(f"SUCCESS! Download link: {download_link[:100]}...")
            except Exception as e:
                print(f"ERROR: {e}")
                import traceback
                traceback.print_exc()








