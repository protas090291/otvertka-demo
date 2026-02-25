"""Поиск PDF файлов в публичной папке"""
import os
from dotenv import load_dotenv
from pathlib import Path
from yandex_disk_api import get_public_folder_contents, get_yandex_disk_public_key, get_public_download_link, download_file

# Загружаем переменные окружения
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

public_key = get_yandex_disk_public_key()

def find_files_recursive(path=None, max_depth=3, current_depth=0):
    """Рекурсивный поиск файлов"""
    if current_depth >= max_depth:
        return []
    
    items = get_public_folder_contents(public_key, path)
    files = []
    
    for item in items:
        if item['type'] == 'file':
            # Проверяем расширение
            if item['name'].lower().endswith(('.pdf', '.docx', '.doc', '.xlsx', '.xls')):
                files.append(item)
        elif item['type'] == 'dir':
            # Рекурсивно ищем в подпапках
            sub_files = find_files_recursive(item['path'], max_depth, current_depth + 1)
            files.extend(sub_files)
    
    return files

print("Searching for files...")
all_files = find_files_recursive()

print(f"\nFound {len(all_files)} files")
print()

if all_files:
    # Берем первый файл
    test_file = all_files[0]
    print(f"Testing file:")
    print(f"  Name: {test_file['name']}")
    print(f"  Path: {test_file['path']}")
    print()
    
    # Пробуем получить ссылку для скачивания
    try:
        print("Step 1: Getting download link...")
        download_link = get_public_download_link(public_key, test_file['path'])
        print(f"SUCCESS! Download link obtained")
        print()
        
        # Пробуем скачать файл
        print("Step 2: Downloading file...")
        file_content = download_file(test_file['path'], public_key=public_key)
        print(f"SUCCESS! File downloaded")
        print(f"File size: {len(file_content)} bytes")
        print()
        
        # Тестируем через endpoint
        print("Step 3: Testing via endpoint...")
        import requests
        from urllib.parse import quote
        encoded_path = quote(test_file['path'], safe='')
        url = f"http://localhost:8000/api/yandex-disk/view?file_path={encoded_path}"
        print(f"URL: {url}")
        response = requests.get(url, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("SUCCESS! Endpoint works!")
        else:
            print(f"ERROR: {response.text[:500]}")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
else:
    print("No files found")








