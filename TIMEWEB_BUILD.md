# Сборка на TimeWeb Cloud

## Проблема: "Missing script: build"

Сборка запускается в **корне репозитория** (`/app`). Приложение и скрипт `build` находятся в папке **Helper2**.

## Решение 1: Использовать Dockerfile из репозитория

В панели TimeWeb выберите сборку по **своему Dockerfile** (если есть опция «Dockerfile из репозитория» или «Custom Dockerfile»). В корне репозитория уже есть `Dockerfile`, который:

- ставит зависимости в Helper2;
- запускает `npm run build` из корня (он переходит в Helper2 и собирает проект);
- отдаёт статику через nginx.

Каталог сборки (артефакт): **Helper2/dist** (внутри образа он копируется в nginx).

## Решение 2: Настройки сборки без своего Dockerfile

Если платформа **не** использует наш Dockerfile, а свой шаблон:

1. **Корень приложения (Application root / Root directory)** оставьте **пустым** или укажите корень репозитория (не `Helper2`), чтобы в рабочей директории был корневой `package.json` со скриптом `build`.
2. **Команда установки зависимостей:** `npm install`.
3. **Команда сборки:** `npm run build`.
4. **Каталог сборки (Build output / Publish directory):** `Helper2/dist`.

Корневой `package.json` содержит:
- `postinstall`: `cd Helper2 && npm install` — установка зависимостей приложения;
- `build`: `cd Helper2 && npm run build` — сборка фронтенда.

Убедитесь, что в репозитории на GitHub в **корне** есть файл `package.json` (не только в Helper2). Если его нет — закоммитьте и запушьте:

```bash
git add package.json Dockerfile .dockerignore
git commit -m "Root package.json and Dockerfile for TimeWeb"
git push
```
