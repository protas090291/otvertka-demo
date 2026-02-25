"""Проверка формата путей от API Яндекс Диска"""
import os
from dotenv import load_dotenv
from pathlib import Path
from yandex_disk_api import get_public_folder_contents, get_yandex_disk_public_key

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

# Показываем первые несколько файлов и их пути
for i, item in enumerate(files[:5]):
    print(f"Item {i+1}:")
    print(f"  Name: {item['name']}")
    print(f"  Path: {item['path']}")
    print(f"  Type: {item['type']}")
    print()








