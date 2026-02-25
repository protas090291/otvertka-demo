#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Исправление пути к папке на правильный"""

from pathlib import Path

env_path = Path(__file__).parent / ".env"

# Правильный путь (с подчеркиваниями, как в Яндекс Диске)
correct_path = "/Вишневый_сад-3_для_Заказчика"

print("=" * 60)
print("ИСПРАВЛЕНИЕ ПУТИ К ПАПКЕ")
print("=" * 60)

if env_path.exists():
    content = env_path.read_text(encoding='utf-8')
    
    # Заменяем путь
    if 'YANDEX_DISK_FOLDER_PATH=' in content:
        # Заменяем старый путь на новый
        lines = content.split('\n')
        new_lines = []
        for line in lines:
            if line.startswith('YANDEX_DISK_FOLDER_PATH='):
                new_lines.append(f'YANDEX_DISK_FOLDER_PATH={correct_path}')
            else:
                new_lines.append(line)
        
        content = '\n'.join(new_lines)
    else:
        # Добавляем путь, если его нет
        content += f'\nYANDEX_DISK_FOLDER_PATH={correct_path}\n'
    
    env_path.write_text(content, encoding='utf-8')
    
    print(f"\nПуть исправлен на: {correct_path}")
    print("\nПроверяю содержимое .env:")
    print("-" * 60)
    for line in content.split('\n'):
        if 'YANDEX_DISK_FOLDER_PATH' in line:
            print(line)
    
    print("\n" + "=" * 60)
    print("ГОТОВО! Теперь перезапустите backend сервер")
    print("=" * 60)
else:
    print("ОШИБКА: Файл .env не найден!")




