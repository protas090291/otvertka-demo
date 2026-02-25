#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Исправление настроек Яндекс Диска в .env файле"""

from pathlib import Path

env_path = Path(__file__).parent / ".env"

print("=" * 60)
print("ИСПРАВЛЕНИЕ НАСТРОЕК ЯНДЕКС ДИСКА")
print("=" * 60)

# Читаем текущий файл
if env_path.exists():
    content = env_path.read_text(encoding='utf-8')
    print("\nТекущее содержимое .env:")
    print("-" * 60)
    for line in content.split('\n'):
        if 'YANDEX' in line:
            print(line)
else:
    content = ""
    print("\nФайл .env не найден, создаю новый...")

# Правильные настройки (используем публичный ключ)
correct_settings = """# ============================================
# Настройки Яндекс Диска
# ============================================

# OAuth токен (закомментирован, используем публичный ключ)
# YANDEX_DISK_TOKEN=y0__xDplMyRCBiSuzsgrfjujhWQozV343SXWgSk3mhHwhrrnSQt5g

# Публичный ключ из ссылки https://disk.yandex.ru/d/430f03O1cR8Yag
YANDEX_DISK_PUBLIC_KEY=430f03O1cR8Yag

# Путь к папке на Яндекс Диске
YANDEX_DISK_FOLDER_PATH=/Вишневый сад-3 для Заказчика
"""

# Сохраняем правильные настройки
env_path.write_text(correct_settings, encoding='utf-8')

print("\n" + "=" * 60)
print("НАСТРОЙКИ ИСПРАВЛЕНЫ!")
print("=" * 60)
print("\nНовое содержимое .env:")
print("-" * 60)
for line in correct_settings.split('\n'):
    if 'YANDEX' in line or line.strip().startswith('#'):
        print(line)

print("\n" + "=" * 60)
print("СЛЕДУЮЩИЕ ШАГИ:")
print("=" * 60)
print("1. Перезапустите backend сервер")
print("2. Обновите страницу в браузере")
print("3. Проверьте раздел 'Яндекс Диск' в приложении")
print("=" * 60)




