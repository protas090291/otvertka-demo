#!/usr/bin/env python3
"""
Создание классификатора типов дефектов
Модель будет определять конкретный тип дефекта вместо просто "дефект/норма"
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ReduceLROnPlateau, EarlyStopping, ModelCheckpoint
import numpy as np
import json
from pathlib import Path
import os
import shutil

# Классы дефектов
DEFECT_CLASSES = {
    0: 'normal',           # Норма
    1: 'crack',           # Трещина
    2: 'stain',           # Пятно
    3: 'damage',          # Повреждение
    4: 'glass_defect',    # Дефект стекла
    5: 'ceiling_issue'    # Проблема с потолком
}

CLASS_NAMES = ['Норма', 'Трещина', 'Пятно', 'Повреждение', 'Дефект стекла', 'Проблема с потолком']

def create_classifier_dataset():
    """Создает датасет для классификации типов дефектов"""
    print("🔧 Создаем датасет для классификации типов дефектов...")
    
    # Создаем структуру папок
    classifier_dir = Path("defect_classifier_data")
    classifier_dir.mkdir(exist_ok=True)
    
    for class_name in CLASS_NAMES:
        (classifier_dir / class_name).mkdir(exist_ok=True)
    
    # Копируем нормальные изображения
    normal_source = Path("test/negative")
    normal_dest = classifier_dir / "Норма"
    
    if normal_source.exists():
        for img_file in normal_source.glob("*.jpg"):
            shutil.copy2(img_file, normal_dest / img_file.name)
        print(f"✅ Скопировано {len(list(normal_dest.glob('*.jpg')))} нормальных изображений")
    
    # Анализируем и распределяем дефекты по типам
    defect_source = Path("test/positive")
    if not defect_source.exists():
        print("❌ Папка с дефектами не найдена")
        return
    
    defect_files = list(defect_source.glob("*.jpg"))
    print(f"📊 Найдено {len(defect_files)} изображений дефектов")
    
    # Распределяем по типам на основе названий файлов
    for img_file in defect_files:
        filename = img_file.name.lower()
        
        if 'crack' in filename or 'трещин' in filename:
            dest_class = "Трещина"
        elif 'stain' in filename or 'пятн' in filename:
            dest_class = "Пятно"
        elif 'damage' in filename or 'поврежден' in filename:
            dest_class = "Повреждение"
        elif 'glass' in filename or 'стекл' in filename:
            dest_class = "Дефект стекла"
        elif 'ceiling' in filename or 'потолок' in filename:
            dest_class = "Проблема с потолком"
        else:
            # По умолчанию - пятно (самый частый тип)
            dest_class = "Пятно"
        
        dest_path = classifier_dir / dest_class / img_file.name
        shutil.copy2(img_file, dest_path)
    
    # Подсчитываем результаты
    print("\n📊 Распределение по классам:")
    for class_name in CLASS_NAMES:
        count = len(list((classifier_dir / class_name).glob("*.jpg")))
        print(f"   {class_name}: {count} изображений")
    
    return classifier_dir

def create_classifier_model(num_classes=6):
    """Создает модель для классификации типов дефектов"""
    print("🏗️ Создаем модель классификатора...")
    
    model = keras.Sequential([
        # Первый блок
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
        layers.BatchNormalization(),
        layers.Conv2D(32, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Второй блок
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Третий блок
        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.BatchNormalization(),
        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Четвертый блок
        layers.Conv2D(256, (3, 3), activation='relu'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Полносвязные слои
        layers.Flatten(),
        layers.Dense(512, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(256, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(num_classes, activation='softmax')  # 6 классов
    ])
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def train_classifier():
    """Обучает классификатор типов дефектов"""
    print("🚀 Обучаем классификатор типов дефектов...")
    
    # Создаем датасет
    dataset_dir = create_classifier_dataset()
    
    # Создаем генераторы данных
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        zoom_range=0.2,
        shear_range=0.2,
        brightness_range=[0.8, 1.2],
        fill_mode='nearest',
        validation_split=0.2
    )
    
    # Генератор для обучения
    train_generator = train_datagen.flow_from_directory(
        dataset_dir,
        target_size=(224, 224),
        batch_size=16,
        class_mode='categorical',
        subset='training',
        shuffle=True
    )
    
    # Генератор для валидации
    val_generator = train_datagen.flow_from_directory(
        dataset_dir,
        target_size=(224, 224),
        batch_size=16,
        class_mode='categorical',
        subset='validation',
        shuffle=False
    )
    
    print(f"📊 Классы: {train_generator.class_indices}")
    
    # Создаем модель
    model = create_classifier_model(len(train_generator.class_indices))
    
    # Callbacks
    callbacks = [
        EarlyStopping(monitor='val_accuracy', patience=5, restore_best_weights=True, mode='max'),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-7, verbose=1),
        ModelCheckpoint('defect_classifier_model.h5', monitor='val_accuracy', save_best_only=True, mode='max', verbose=1)
    ]
    
    # Обучаем модель
    history = model.fit(
        train_generator,
        epochs=20,
        validation_data=val_generator,
        callbacks=callbacks,
        verbose=1
    )
    
    # Сохраняем финальную модель
    model.save('final_defect_classifier.h5')
    
    # Сохраняем информацию о классах
    class_info = {
        'class_indices': train_generator.class_indices,
        'class_names': CLASS_NAMES,
        'num_classes': len(train_generator.class_indices)
    }
    
    with open('defect_classifier_info.json', 'w', encoding='utf-8') as f:
        json.dump(class_info, f, ensure_ascii=False, indent=2)
    
    print("✅ Классификатор обучен и сохранен!")
    print(f"📁 Модель: final_defect_classifier.h5")
    print(f"📁 Информация: defect_classifier_info.json")
    
    return model, train_generator.class_indices

def test_classifier():
    """Тестирует классификатор"""
    print("🧪 Тестируем классификатор...")
    
    try:
        model = keras.models.load_model('final_defect_classifier.h5')
        
        with open('defect_classifier_info.json', 'r', encoding='utf-8') as f:
            class_info = json.load(f)
        
        print("✅ Классификатор загружен успешно")
        print(f"📊 Классы: {class_info['class_names']}")
        
        # Тестируем на нескольких изображениях
        test_dir = Path("defect_classifier_data")
        if test_dir.exists():
            for class_name in class_info['class_names']:
                class_dir = test_dir / class_name
                if class_dir.exists():
                    test_files = list(class_dir.glob("*.jpg"))[:3]
                    print(f"\n🔍 Тестируем {class_name}:")
                    
                    for img_file in test_files:
                        # Загружаем и предобрабатываем изображение
                        img = keras.preprocessing.image.load_img(img_file, target_size=(224, 224))
                        img_array = keras.preprocessing.image.img_to_array(img)
                        img_array = np.expand_dims(img_array, axis=0) / 255.0
                        
                        # Предсказываем
                        predictions = model.predict(img_array, verbose=0)
                        predicted_class_idx = np.argmax(predictions[0])
                        confidence = predictions[0][predicted_class_idx] * 100
                        predicted_class = class_info['class_names'][predicted_class_idx]
                        
                        print(f"   {img_file.name}: {predicted_class} ({confidence:.1f}%)")
        
    except Exception as e:
        print(f"❌ Ошибка тестирования: {e}")

if __name__ == "__main__":
    print("🎯 Создание классификатора типов дефектов")
    print("=" * 50)
    
    model, class_indices = train_classifier()
    test_classifier()
    
    print("\n✅ Готово! Теперь модель будет определять конкретные типы дефектов.")


