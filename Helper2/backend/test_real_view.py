"""Тест реального просмотра файла"""
import requests
from urllib.parse import quote
from dotenv import load_dotenv
from pathlib import Path
from yandex_disk_api import get_public_folder_contents, get_yandex_disk_public_key

# Загружаем переменные окружения
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

public_key = get_yandex_disk_public_key()

# Рекурсивно ищем файлы
def find_first_file(path=None, max_depth=3, current_depth=0):
    if current_depth >= max_depth:
        return None
    
    items = get_public_folder_contents(public_key, path)
    
    for item in items:
        if item['type'] == 'file':
            if item['name'].lower().endswith(('.pdf', '.docx', '.doc', '.xlsx', '.xls')):
                return item
        elif item['type'] == 'dir':
            result = find_first_file(item['path'], max_depth, current_depth + 1)
            if result:
                return result
    
    return None

print("Searching for a file...")
test_file = find_first_file()

if test_file:
    print(f"\nFound file:")
    print(f"  Name: {test_file['name']}")
    print(f"  Path: {test_file['path']}")
    print()
    
    # Тестируем endpoint view
    encoded_path = quote(test_file['path'], safe='')
    url = f"http://localhost:8000/api/yandex-disk/view?file_path={encoded_path}"
    print(f"Testing view endpoint:")
    print(f"URL: {url}")
    print()
    
    try:
        response = requests.get(url, timeout=30)
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        print(f"Content-Disposition: {response.headers.get('Content-Disposition')}")
        print(f"Content-Length: {response.headers.get('Content-Length')}")
        
        if response.status_code == 200:
            print(f"\nSUCCESS! File size: {len(response.content)} bytes")
        else:
            print(f"\nERROR:")
            try:
                error_json = response.json()
                print(f"Detail: {error_json.get('detail', 'Unknown')}")
            except:
                print(f"Response: {response.text[:500]}")
    except Exception as e:
        print(f"EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
else:
    print("No files found")








