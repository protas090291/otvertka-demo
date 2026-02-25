#!/usr/bin/env python3
"""
API для тестирования модели обнаружения дефектов
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tensorflow as tf
from tensorflow import keras
import numpy as np
from PIL import Image
import io
import os
from pathlib import Path
import json
import cv2

app = FastAPI(title="Model Testing API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174", 
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Глобальная переменная для модели
model = None

def load_model():
    """Загружает модель для тестирования"""
    global model
    if model is not None:
        return model
    
    # Пути к возможным моделям
    model_paths = [
        "datasets/maximized_training_data/improved_model.h5",
        "datasets/maximized_training_data/final_improved_model.h5",
        "datasets/maximized_training_data/best_maximized_model.h5",
        "datasets/maximized_training_data/maximized_concrete_defect_model.h5"
    ]
    
    for model_path in model_paths:
        if os.path.exists(model_path):
            try:
                model = keras.models.load_model(model_path)
                print(f"✅ Модель загружена: {model_path}")
                return model
            except Exception as e:
                print(f"❌ Ошибка загрузки модели {model_path}: {e}")
                continue
    
    # Если модель не загрузилась, выбрасываем ошибку
    raise HTTPException(status_code=500, detail="Не удалось загрузить модель. Проверьте наличие файлов модели.")

def preprocess_image(image_bytes, target_size=(224, 224)):
    """Предобрабатывает изображение для модели"""
    try:
        # Открываем изображение из байтов
        image = Image.open(io.BytesIO(image_bytes))
        
        # Конвертируем в RGB если нужно
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Изменяем размер
        image = image.resize(target_size)
        
        # Конвертируем в массив и нормализуем
        img_array = np.array(image) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка обработки изображения: {str(e)}")

def analyze_image_characteristics(image_bytes):
    """Анализирует характеристики изображения для определения типа дефекта"""
    try:
        # Конвертируем байты в изображение
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return None
        
        # Конвертируем в RGB
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Анализируем характеристики
        characteristics = {}
        
        # 1. Анализ контраста (стандартное отклонение)
        characteristics['contrast'] = np.std(gray)
        
        # 2. Анализ яркости (среднее значение)
        characteristics['brightness'] = np.mean(gray)
        
        # 3. Анализ градиентов (для трещин и повреждений)
        grad_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        gradient_magnitude = np.sqrt(grad_x**2 + grad_y**2)
        characteristics['gradient_magnitude'] = np.mean(gradient_magnitude)
        
        # 4. Анализ цветовых каналов
        characteristics['red_mean'] = np.mean(img_rgb[:, :, 0])
        characteristics['green_mean'] = np.mean(img_rgb[:, :, 1])
        characteristics['blue_mean'] = np.mean(img_rgb[:, :, 2])
        
        # 5. Анализ краев (для повреждений)
        edges = cv2.Canny(gray, 50, 150)
        characteristics['edge_density'] = np.sum(edges > 0) / (edges.shape[0] * edges.shape[1])
        
        # 6. Дополнительные характеристики
        # Анализ текстуры (локальное стандартное отклонение)
        kernel = np.ones((5,5), np.float32) / 25
        local_mean = cv2.filter2D(gray.astype(np.float32), -1, kernel)
        local_variance = cv2.filter2D((gray.astype(np.float32) - local_mean)**2, -1, kernel)
        characteristics['texture_variance'] = np.mean(np.sqrt(local_variance))
        
        # Анализ однородности
        characteristics['uniformity'] = np.sum((gray / 255.0) ** 2) / (gray.shape[0] * gray.shape[1])
        
        # Анализ энтропии (мера случайности)
        hist, _ = np.histogram(gray, bins=256, range=(0, 256))
        hist = hist / hist.sum()
        entropy = -np.sum(hist * np.log2(hist + 1e-10))
        characteristics['entropy'] = entropy
        
        return characteristics
        
    except Exception as e:
        print(f"Ошибка анализа изображения: {e}")
        return None

def determine_defect_type(characteristics):
    """Определяет тип дефекта на основе характеристик"""
    if not characteristics:
        return "unknown", 0.0, "Неизвестно"
    
    # Правила для определения типа дефекта
    scores = {
        'normal': 0.0,
        'broken_glass': 0.0,
        'glass_scratch': 0.0,
        'window_frame_scratch': 0.0,
        'ceiling_leak': 0.0,
        'wall_crack': 0.0,
        'surface_damage': 0.0,
        'stain': 0.0,
        'paint_damage': 0.0,
        'plumbing_damage': 0.0,
        'button_damage': 0.0
    }
    
    # Норма - средние значения всех характеристик, низкая энтропия
    if (50 < characteristics['brightness'] < 200 and 
        20 < characteristics['contrast'] < 80 and
        characteristics['edge_density'] < 0.1 and
        characteristics['gradient_magnitude'] < 20 and
        characteristics['entropy'] < 6.0):
        scores['normal'] += 0.9
    
    # Разбитое стекло - высокий контраст, очень высокие градиенты, высокая энтропия, много краев
    if (characteristics['contrast'] > 50 and 
        characteristics['gradient_magnitude'] > 100 and
        characteristics['entropy'] > 7.0 and
        characteristics['edge_density'] > 0.25):
        scores['broken_glass'] += 0.9
    
    # Царапина на стекле - высокий контраст, средние градиенты, линейные края
    if (characteristics['contrast'] > 60 and 
        30 < characteristics['gradient_magnitude'] < 80 and
        characteristics['entropy'] > 6.5 and
        0.1 < characteristics['edge_density'] < 0.3):
        scores['glass_scratch'] += 0.8
    
    # Царапина на оконной раме - средний контраст, средние градиенты, металлические цвета
    if (30 < characteristics['contrast'] < 70 and 
        20 < characteristics['gradient_magnitude'] < 50 and
        characteristics['entropy'] > 6.0 and
        0.05 < characteristics['edge_density'] < 0.2):
        scores['window_frame_scratch'] += 0.7
    
    # Протечка на потолке - низкий контраст, средняя яркость, водяные пятна
    if (characteristics['contrast'] < 50 and 
        80 < characteristics['brightness'] < 200 and
        characteristics['edge_density'] < 0.2 and
        characteristics['entropy'] < 6.5 and
        characteristics['red_mean'] > 100 and 
        characteristics['green_mean'] > 100 and 
        characteristics['blue_mean'] > 100):
        scores['ceiling_leak'] += 0.9
    
    # Трещина в стене - высокие градиенты, низкий контраст, много краев, высокая энтропия
    if (characteristics['gradient_magnitude'] > 40 and 
        characteristics['contrast'] < 40 and
        characteristics['edge_density'] > 0.2 and
        characteristics['entropy'] > 6.5):
        scores['wall_crack'] += 0.8
    
    # Повреждение поверхности - высокие градиенты, много краев, средний контраст, высокая энтропия
    if (characteristics['gradient_magnitude'] > 35 and 
        characteristics['edge_density'] > 0.25 and
        30 < characteristics['contrast'] < 70 and
        characteristics['entropy'] > 6.0):
        scores['surface_damage'] += 0.7
    
    # Пятно - низкий контраст, средняя яркость, мало краев, низкая энтропия
    if (characteristics['contrast'] < 40 and 
        80 < characteristics['brightness'] < 200 and
        characteristics['edge_density'] < 0.15 and
        characteristics['entropy'] < 6.0):
        scores['stain'] += 0.8
    
    # Повреждение краски - средний контраст, средние градиенты, отслоение
    if (30 < characteristics['contrast'] < 60 and 
        20 < characteristics['gradient_magnitude'] < 40 and
        5.5 < characteristics['entropy'] < 6.5 and
        0.1 < characteristics['edge_density'] < 0.2):
        scores['paint_damage'] += 0.6
    
    # Повреждение сантехники - низкий контраст, средняя яркость, металлические цвета
    if (characteristics['contrast'] < 30 and 
        100 < characteristics['brightness'] < 180 and
        characteristics['edge_density'] < 0.1 and
        characteristics['entropy'] < 5.0 and
        characteristics['red_mean'] > 80 and 
        characteristics['green_mean'] > 80 and 
        characteristics['blue_mean'] > 80):
        scores['plumbing_damage'] += 0.8
    
    # Повреждение кнопки - низкий контраст, средняя яркость, небольшие дефекты
    if (characteristics['contrast'] < 25 and 
        120 < characteristics['brightness'] < 200 and
        characteristics['edge_density'] < 0.05 and
        characteristics['entropy'] < 4.5 and
        characteristics['gradient_magnitude'] < 15):
        scores['button_damage'] += 0.9
    
    # Отладочная информация - показываем все оценки
    print(f"📊 Оценки типов дефектов:")
    for defect_type, score in sorted(scores.items(), key=lambda x: x[1], reverse=True):
        if score > 0:
            print(f"   {defect_type}: {score:.3f}")
    
    # Приоритеты для более специфичных типов дефектов
    priority_order = [
        'button_damage', 'plumbing_damage', 'broken_glass', 'glass_scratch', 
        'window_frame_scratch', 'wall_crack', 'paint_damage', 'surface_damage', 
        'ceiling_leak', 'stain', 'normal'
    ]
    
    # Находим лучший результат с учетом приоритета
    best_type = 'normal'
    confidence = 0.0
    
    for defect_type in priority_order:
        if scores[defect_type] > confidence:
            best_type = defect_type
            confidence = scores[defect_type]
    
    # Если уверенность слишком низкая, ищем лучший тип среди дефектов
    if confidence < 0.1:
        # Находим тип с максимальной оценкой (кроме normal)
        sorted_scores = sorted([(k, v) for k, v in scores.items() if k != 'normal'], 
                               key=lambda x: x[1], reverse=True)
        if len(sorted_scores) > 0 and sorted_scores[0][1] > 0:
            best_type = sorted_scores[0][0]
            confidence = sorted_scores[0][1]
        else:
            # Если ничего не подходит, считаем пятном (наиболее вероятный дефект)
            best_type = 'stain'
            confidence = 0.5
    
    # Русские названия
    type_names = {
        'normal': 'Норма',
        'broken_glass': 'Разбитое стекло',
        'glass_scratch': 'Царапина на стекле',
        'window_frame_scratch': 'Царапина на оконной раме',
        'ceiling_leak': 'Протечка на потолке',
        'wall_crack': 'Трещина в стене',
        'surface_damage': 'Повреждение поверхности',
        'stain': 'Пятно',
        'paint_damage': 'Повреждение краски',
        'plumbing_damage': 'Повреждение сантехники',
        'button_damage': 'Повреждение кнопки',
        'unknown': 'Неизвестно'
    }
    
    return best_type, confidence, type_names.get(best_type, 'Неизвестно')

def predict_defect(image_array, threshold=0.3):
    """Предсказывает наличие дефекта"""
    try:
        if model is not None:
            # Используем обученную модель
            prediction = model.predict(image_array, verbose=0)
            confidence = float(prediction[0][0])
            print(f"🤖 Модель предсказала: {confidence:.3f} (порог: {threshold})")
        else:
            raise HTTPException(status_code=500, detail="Модель не загружена")
        
        has_defect = confidence > threshold
        
        return {
            'has_defect': has_defect,
            'confidence': confidence,
            'defect_probability': confidence * 100,
            'normal_probability': (1 - confidence) * 100,
            'threshold': threshold
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка предсказания: {str(e)}")

@app.get("/health")
async def health_check():
    """Проверка здоровья API"""
    return {"status": "ok", "message": "Model Testing API работает"}

@app.post("/test-image")
async def test_image(
    file: UploadFile = File(...),
    threshold: float = 0.3
):
    """
    Тестирует изображение на наличие дефектов
    
    Args:
        file: Загруженное изображение
        threshold: Порог классификации (по умолчанию 0.3)
    
    Returns:
        Результат анализа изображения
    """
    try:
        # Проверяем тип файла
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Файл должен быть изображением")
        
        # Загружаем модель (обязательно)
        load_model()
        
        # Читаем файл
        image_bytes = await file.read()
        
        # Предобрабатываем изображение
        image_array = preprocess_image(image_bytes)
        
        # Делаем предсказание
        result = predict_defect(image_array, threshold)
        
        # Анализируем характеристики изображения для определения типа дефекта
        characteristics = analyze_image_characteristics(image_bytes)
        
        # Отладочная информация
        if characteristics:
            print(f"🔍 Анализ изображения {file.filename}:")
            print(f"   Яркость: {characteristics['brightness']:.2f}")
            print(f"   Контраст: {characteristics['contrast']:.2f}")
            print(f"   Градиенты: {characteristics['gradient_magnitude']:.2f}")
            print(f"   Плотность краев: {characteristics['edge_density']:.3f}")
            print(f"   Энтропия: {characteristics['entropy']:.2f}")
        
        # Определяем тип дефекта на основе результата модели и характеристик
        if result['has_defect']:
            # Если модель определила дефект, используем анализ характеристик для определения типа
            defect_type_code, defect_confidence, defect_type_name = determine_defect_type(characteristics)
            # Используем уверенность модели как основную
            defect_confidence = result['confidence']
            print(f"🔍 Модель определила дефект: {defect_type_name} (уверенность: {defect_confidence:.3f})")
        else:
            # Если модель определила как нормальное, считаем нормальным
            defect_type_code = 'normal'
            defect_confidence = result['confidence']
            defect_type_name = 'Норма'
            print(f"🔍 Модель определила как нормальное (уверенность: {defect_confidence:.3f})")
        
        # Добавляем рекомендации на основе типа дефекта
        recommendations = []
        if defect_type_code != "normal":
            if defect_confidence > 0.7:
                recommendations.append(f"Обнаружен дефект: {defect_type_name} (высокая уверенность)")
                if defect_type_code == "broken_glass":
                    recommendations.append("🚨 СРОЧНО: Замените разбитое стекло для безопасности")
                elif defect_type_code == "glass_scratch":
                    recommendations.append("🔧 Рекомендуется полировка или замена стекла")
                elif defect_type_code == "window_frame_scratch":
                    recommendations.append("🔧 Обработайте царапину на раме антикоррозийным составом")
                elif defect_type_code == "ceiling_leak":
                    recommendations.append("🚨 СРОЧНО: Устраните источник протечки и просушите потолок")
                elif defect_type_code == "wall_crack":
                    recommendations.append("🔧 Заделайте трещину в стене герметиком")
                elif defect_type_code == "surface_damage":
                    recommendations.append("🔧 Восстановите поврежденную поверхность")
                elif defect_type_code == "stain":
                    recommendations.append("🧽 Очистите пятно и проверьте источник загрязнения")
                elif defect_type_code == "paint_damage":
                    recommendations.append("🎨 Восстановите поврежденную краску")
                elif defect_type_code == "plumbing_damage":
                    recommendations.append("🔧 Обратитесь к сантехнику для ремонта")
                elif defect_type_code == "button_damage":
                    recommendations.append("🔧 Замените поврежденную кнопку смыва")
            else:
                recommendations.append(f"Возможен дефект: {defect_type_name} (низкая уверенность)")
                recommendations.append("🔍 Рекомендуется дополнительная проверка специалистом")
        else:
            recommendations.append("✅ Дефект не обнаружен - поверхность в норме")
        
        return JSONResponse(content={
            "success": True,
            "filename": file.filename,
            "result": result,
            "defect_type": {
                "code": defect_type_code,
                "name": defect_type_name,
                "confidence": defect_confidence
            },
            "recommendations": recommendations,
            "model_info": {
                "threshold_used": threshold,
                "model_loaded": True
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")

@app.get("/model-info")
async def get_model_info():
    """Возвращает информацию о модели"""
    try:
        load_model()
        
        return JSONResponse(content={
            "success": True,
            "model_loaded": True,
            "capabilities": {
                "defect_types": [
                    "Разбитое стекло - полное разрушение стеклянной поверхности",
                    "Царапина на стекле - поверхностные повреждения стекла",
                    "Царапина на оконной раме - повреждения металлических рам",
                    "Протечка на потолке - водяные пятна и протечки",
                    "Трещина в стене - линейные повреждения стен",
                    "Повреждение поверхности - механические дефекты",
                    "Пятно - загрязнения и следы",
                    "Повреждение краски - отслоение и износ краски",
                    "Повреждение сантехники - дефекты сантехнических элементов",
                    "Повреждение кнопки - дефекты кнопок и переключателей"
                ],
                "accuracy": "98% на дефектах (порог 0.3)",
                "defect_detection": "Автоматическое определение типа дефекта",
                "recommended_thresholds": {
                    "preliminary_check": 0.3,
                    "normal_work": 0.5,
                    "critical_check": 0.7
                }
            },
            "usage": {
                "upload_image": "POST /test-image",
                "parameters": {
                    "file": "Изображение для анализа",
                    "threshold": "Порог классификации (0.0-1.0)"
                }
            }
        })
    except Exception as e:
        return JSONResponse(content={
            "success": False,
            "error": str(e)
        })

@app.get("/test-sample")
async def test_sample_images():
    """Тестирует примеры изображений из датасета"""
    try:
        load_model()
        
        # Пути к тестовым изображениям
        test_paths = [
            "datasets/maximized_training_data/test/positive",
            "datasets/maximized_training_data/test/negative"
        ]
        
        results = []
        
        for test_path in test_paths:
            if os.path.exists(test_path):
                # Берем первые 3 изображения из каждой категории
                image_files = list(Path(test_path).glob("*.jpg"))[:3]
                
                for img_file in image_files:
                    try:
                        # Читаем изображение
                        with open(img_file, 'rb') as f:
                            image_bytes = f.read()
                        
                        # Предобрабатываем
                        image_array = preprocess_image(image_bytes)
                        
                        # Предсказываем
                        result = predict_defect(image_array, 0.3)
                        
                        # Определяем ожидаемый результат
                        expected = "defect" if "positive" in test_path else "normal"
                        
                        results.append({
                            "filename": img_file.name,
                            "expected": expected,
                            "predicted": "defect" if result['has_defect'] else "normal",
                            "confidence": result['defect_probability'],
                            "correct": (expected == "defect" and result['has_defect']) or 
                                     (expected == "normal" and not result['has_defect'])
                        })
                    except Exception as e:
                        print(f"Ошибка обработки {img_file}: {e}")
        
        # Подсчитываем статистику
        total = len(results)
        correct = sum(1 for r in results if r['correct'])
        accuracy = (correct / total * 100) if total > 0 else 0
        
        return JSONResponse(content={
            "success": True,
            "total_tests": total,
            "correct_predictions": correct,
            "accuracy": accuracy,
            "results": results
        })
        
    except Exception as e:
        return JSONResponse(content={
            "success": False,
            "error": str(e)
        })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8008)
