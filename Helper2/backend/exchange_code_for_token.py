#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для обмена authorization code на OAuth токен Яндекс Диска
"""

import requests
import sys
import io

# Настройка кодировки для Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Данные приложения
CLIENT_ID = "fd2ebdae34ae4516a13ec9e0038d835c"
CLIENT_SECRET = ""  # Если есть, укажите здесь

# Authorization code (верификационный код)
AUTHORIZATION_CODE = "y0__xDplMyRCBiSuzsgrfjujhWQozV343SXWgSk3mhHwhrrnSQt5g"

def exchange_code_for_token():
    """Обменять authorization code на OAuth токен"""
    
    print("=" * 60)
    print("Обмен authorization code на OAuth токен")
    print("=" * 60)
    print()
    
    # URL для обмена кода на токен
    token_url = "https://oauth.yandex.ru/token"
    
    # Данные для запроса
    data = {
        "grant_type": "authorization_code",
        "code": AUTHORIZATION_CODE,
        "client_id": CLIENT_ID
    }
    
    # Если есть client_secret, добавляем его
    if CLIENT_SECRET:
        data["client_secret"] = CLIENT_SECRET
    
    print("Отправка запроса на обмен кода...")
    print(f"Client ID: {CLIENT_ID}")
    print(f"Code: {AUTHORIZATION_CODE[:20]}...")
    print()
    
    try:
        # Отправляем запрос
        response = requests.post(token_url, data=data, timeout=30)
        
        print(f"Статус ответа: {response.status_code}")
        print()
        
        if response.status_code == 200:
            # Успешно получили токен
            token_data = response.json()
            access_token = token_data.get("access_token")
            
            if access_token:
                print("=" * 60)
                print("[OK] OAuth токен успешно получен!")
                print("=" * 60)
                print()
                print("Ваш OAuth токен:")
                print("-" * 60)
                print(access_token)
                print("-" * 60)
                print()
                print("Сохраните этот токен! Он понадобится для настройки.")
                print()
                
                # Сохраняем токен в файл .env
                save_token_to_env(access_token)
                
                return access_token
            else:
                print("[X] Ошибка: токен не найден в ответе")
                print("Ответ сервера:", token_data)
                return None
        else:
            # Ошибка
            print("[X] Ошибка при получении токена")
            print(f"Статус: {response.status_code}")
            try:
                error_data = response.json()
                print("Детали ошибки:")
                print(error_data)
            except:
                print("Текст ответа:", response.text)
            return None
            
    except Exception as e:
        print(f"[X] Ошибка при отправке запроса: {e}")
        return None

def save_token_to_env(access_token):
    """Сохранить токен в файл .env"""
    from pathlib import Path
    
    env_file = Path(__file__).parent / ".env"
    folder_path = "/Вишневый сад-3 для Заказчика"
    
    env_content = f"""# ============================================
# Настройки Яндекс Диска
# ============================================
# Автоматически создано скриптом exchange_code_for_token.py

# OAuth токен Яндекс Диска
YANDEX_DISK_TOKEN={access_token}

# Путь к папке на Яндекс Диске
YANDEX_DISK_FOLDER_PATH={folder_path}
"""
    
    try:
        with open(env_file, 'w', encoding='utf-8') as f:
            f.write(env_content)
        
        print("=" * 60)
        print("[OK] Токен сохранен в файл .env")
        print("=" * 60)
        print(f"Файл: {env_file}")
        print()
        print("Содержимое файла:")
        print("-" * 60)
        print(env_content)
        print("-" * 60)
        print()
        print("[OK] Настройка завершена!")
        print("[!] Перезапустите backend сервер для применения изменений")
        
    except Exception as e:
        print(f"[X] Ошибка при сохранении в .env: {e}")
        print()
        print("Скопируйте токен вручную в файл Helper2/backend/.env:")
        print(f"YANDEX_DISK_TOKEN={access_token}")

if __name__ == "__main__":
    token = exchange_code_for_token()
    
    if token:
        print()
        print("=" * 60)
        print("[OK] Готово! Токен получен и сохранен.")
        print("=" * 60)
    else:
        print()
        print("=" * 60)
        print("[X] Не удалось получить токен.")
        print("=" * 60)
        print()
        print("Возможные причины:")
        print("1. Authorization code истек (коды действительны несколько минут)")
        print("2. Code уже был использован")
        print("3. Неверный Client ID")
        print("4. Требуется Client Secret")
        print()
        print("Решение:")
        print("1. Получите новый authorization code:")
        print("   https://oauth.yandex.ru/authorize?response_type=code&client_id=fd2ebdae34ae4516a13ec9e0038d835c")
        print("2. Скопируйте код из URL (параметр 'code=...')")
        print("3. Запустите этот скрипт с новым кодом")









