"""Тест endpoint для просмотра файлов"""
import requests
from urllib.parse import quote

# Тестируем с реальным путем к файлу
test_path = '/Т1202_AM.pdf'
encoded_path = quote(test_path, safe='')

print(f"Тестируем путь: {test_path}")
print(f"Закодированный путь: {encoded_path}")
print(f"URL: http://localhost:8000/api/yandex-disk/view?file_path={encoded_path}")
print()

try:
    url = f"http://localhost:8000/api/yandex-disk/view?file_path={encoded_path}"
    print(f"Отправляем запрос...")
    response = requests.get(url, timeout=10)
    
    print(f"Status Code: {response.status_code}")
    print(f"Headers:")
    for key, value in response.headers.items():
        print(f"  {key}: {value}")
    print()
    
    if response.status_code == 200:
        print("OK: File received")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        print(f"Content-Disposition: {response.headers.get('Content-Disposition')}")
        print(f"Content size: {len(response.content)} bytes")
    else:
        print(f"ERROR: Status {response.status_code}")
        try:
            error_json = response.json()
            print(f"Error detail: {error_json.get('detail', 'Unknown error')}")
        except:
            print(f"Response: {response.text[:500]}")
        
except Exception as e:
    print(f"EXCEPTION: {e}")
    import traceback
    traceback.print_exc()

