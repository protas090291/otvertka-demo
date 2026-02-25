#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Установка правильной папки"""

from pathlib import Path

env_path = Path(__file__).parent / ".env"

# Правильная папка с квартирами
correct_path = "/Вишневый_сад-3_дополнительные документы"

print("=" * 60)
print("УСТАНОВКА ПРАВИЛЬНОЙ ПАПКИ")
print("=" * 60)

if env_path.exists():
    content = env_path.read_text(encoding='utf-8')
    
    # Заменяем путь
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        if line.startswith('YANDEX_DISK_FOLDER_PATH='):
            new_lines.append(f'YANDEX_DISK_FOLDER_PATH={correct_path}')
        else:
            new_lines.append(line)
    
    content = '\n'.join(new_lines)
    env_path.write_text(content, encoding='utf-8')
    
    print(f"\nПуть установлен на: {correct_path}")
    print("\nЭта папка содержит 51 подпапку с квартирами")
    print("(Т0101 Elegance, Т0201 Luxury и т.д.)")
    print("\n" + "=" * 60)
    print("ПЕРЕЗАПУСТИТЕ BACKEND СЕРВЕР!")
    print("=" * 60)
else:
    print("ОШИБКА: Файл .env не найден!")




