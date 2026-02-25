"""Тест проблемы с путями файлов"""
import requests
from urllib.parse import quote, unquote

# Тестируем разные форматы путей
test_paths = [
    '/Т1202_AM.pdf',  # С начальным слэшем
    'Т1202_AM.pdf',   # Без начального слэша
    '/папка/файл.pdf',  # Путь с подпапкой
    'папка/файл.pdf',   # Путь с подпапкой без начального слэша
]

print("Testing different path formats:")
print()

for test_path in test_paths:
    print(f"Testing path: {test_path}")
    encoded_path = quote(test_path, safe='')
    print(f"Encoded: {encoded_path}")
    
    # Тестируем endpoint view-link
    try:
        url = f"http://localhost:8000/api/yandex-disk/view-link?file_path={encoded_path}"
        print(f"URL: {url}")
        response = requests.get(url, timeout=5)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"View URL: {data.get('view_url', 'N/A')[:100]}")
        else:
            error = response.json() if response.content else {}
            print(f"Error: {error.get('detail', 'Unknown')}")
    except Exception as e:
        print(f"Exception: {e}")
    print()








