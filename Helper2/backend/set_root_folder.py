#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Установка корневой папки (все доступные папки)"""

from pathlib import Path

env_path = Path(__file__).parent / ".env"

# Корневая папка - показываем все доступные папки
root_path = "/"

print("=" * 60)
print("НАСТРОЙКА: ОТОБРАЖЕНИЕ ВСЕХ ДОСТУПНЫХ ПАПОК")
print("=" * 60)

if env_path.exists():
    content = env_path.read_text(encoding='utf-8')
    
    # Заменяем путь на корневую папку
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        if line.startswith('YANDEX_DISK_FOLDER_PATH='):
            new_lines.append(f'YANDEX_DISK_FOLDER_PATH={root_path}')
        else:
            new_lines.append(line)
    
    content = '\n'.join(new_lines)
    env_path.write_text(content, encoding='utf-8')
    
    print(f"\nПуть установлен на корневую папку: {root_path}")
    print("\nТеперь будут отображаться ВСЕ доступные папки")
    print("Пользователь сможет выбрать нужную папку в интерфейсе")
    print("\n" + "=" * 60)
    print("ПЕРЕЗАПУСТИТЕ BACKEND СЕРВЕР!")
    print("=" * 60)
else:
    print("ОШИБКА: Файл .env не найден!")



