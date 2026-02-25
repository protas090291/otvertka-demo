"""Тест с реальным файлом из подпапки"""
import os
from dotenv import load_dotenv
from pathlib import Path
from yandex_disk_api import get_public_folder_contents, get_yandex_disk_public_key, get_public_download_link, download_file

# Загружаем переменные окружения
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

public_key = get_yandex_disk_public_key()
print(f"Public key: {public_key}")
print()

# Получаем список папок
folders = get_public_folder_contents(public_key, None)
print(f"Found {len(folders)} items in root")
print()

# Ищем первую папку и проверяем её содержимое
dir_items = [f for f in folders if f['type'] == 'dir']
if dir_items:
    test_dir = dir_items[0]
    print(f"Checking folder: {test_dir['name']}")
    print(f"Folder path: {test_dir['path']}")
    print()
    
    # Получаем содержимое папки
    sub_items = get_public_folder_contents(public_key, test_dir['path'])
    print(f"Found {len(sub_items)} items in subfolder")
    print()
    
    # Ищем файлы
    file_items = [f for f in sub_items if f['type'] == 'file']
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
            print("Getting download link...")
            download_link = get_public_download_link(public_key, test_file['path'])
            print(f"SUCCESS! Download link obtained")
            print(f"Link length: {len(download_link)}")
            print()
            
            # Пробуем скачать файл
            print("Downloading file...")
            file_content = download_file(test_file['path'], public_key=public_key)
            print(f"SUCCESS! File downloaded")
            print(f"File size: {len(file_content)} bytes")
        except Exception as e:
            print(f"ERROR: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("No files in this folder, checking deeper...")
        # Проверяем подпапки
        sub_dirs = [f for f in sub_items if f['type'] == 'dir']
        if sub_dirs:
            deep_dir = sub_dirs[0]
            print(f"Checking deeper folder: {deep_dir['name']} ({deep_dir['path']})")
            deep_items = get_public_folder_contents(public_key, deep_dir['path'])
            deep_files = [f for f in deep_items if f['type'] == 'file']
            if deep_files:
                test_file = deep_files[0]
                print(f"Testing file from deep folder:")
                print(f"  Name: {test_file['name']}")
                print(f"  Path: {test_file['path']}")
                print()
                try:
                    download_link = get_public_download_link(public_key, test_file['path'])
                    print(f"SUCCESS! Download link obtained")
                    file_content = download_file(test_file['path'], public_key=public_key)
                    print(f"SUCCESS! File downloaded, size: {len(file_content)} bytes")
                except Exception as e:
                    print(f"ERROR: {e}")
                    import traceback
                    traceback.print_exc()








