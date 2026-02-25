#!/usr/bin/env python3
"""
API для генерации документов через FastAPI
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
import sys
from datetime import datetime

# Добавляем путь к модулям
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from learning_document_generator import LearningDocumentGenerator

app = FastAPI(title="Document Generation API", version="1.0.0")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модели данных
class LetterRequest(BaseModel):
    apartment_id: str
    apartment_number: Optional[str] = None
    issue_type: str
    issue_description: str
    expected_resolution: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None

class DocumentResponse(BaseModel):
    success: bool
    message: str
    file_path: Optional[str] = None
    file_url: Optional[str] = None
    document_number: Optional[str] = None
    date: Optional[str] = None

# Инициализация генератора документов
generator = LearningDocumentGenerator(
    documents_dir="../existing_documents",
    supabase_url=None,
    supabase_key=None
)

@app.get("/")
async def root():
    return {"message": "Document Generation API is running"}

@app.post("/generate-letter", response_model=DocumentResponse)
async def generate_letter(request: LetterRequest):
    """Генерирует письмо на основе переданных параметров"""
    try:
        print(f"📧 Генерация письма для квартиры {request.apartment_id}")
        
        # Подготавливаем данные для генерации
        document_data = {
            'apartment_id': request.apartment_id,
            'apartment_number': request.apartment_number or request.apartment_id,
            'issue_type': request.issue_type,
            'issue_description': request.issue_description,
            'expected_resolution': request.expected_resolution or 'Решение в процессе',
            'contact_person': request.contact_person or 'Ответственное лицо',
            'phone': request.phone or '+7 (XXX) XXX-XX-XX'
        }
        
        # Генерируем документ
        result = generator.generate_learning_based_document(
            template_type='letter',
            command_data=document_data
        )
        
        if result:
            # Получаем информацию о созданном файле
            file_name = os.path.basename(result)
            file_url = f"/documents/{file_name}"
            
            # Извлекаем номер документа из пути
            document_number = None
            if "learning_letter_" in file_name:
                # Пытаемся извлечь номер из содержимого файла
                try:
                    from docx import Document
                    doc = Document(result)
                    for paragraph in doc.paragraphs:
                        if "№" in paragraph.text and "/" in paragraph.text:
                            # Ищем номер документа в тексте
                            import re
                            match = re.search(r'№\s*([0-9/]+-[0-9]+)', paragraph.text)
                            if match:
                                document_number = match.group(1)
                                break
                except Exception as e:
                    print(f"Ошибка при извлечении номера документа: {e}")
            
            return DocumentResponse(
                success=True,
                message=f"Письмо для квартиры {request.apartment_id} успешно создано",
                file_path=result,
                file_url=file_url,
                document_number=document_number,
                date=datetime.now().strftime('%d.%m.%Y')
            )
        else:
            raise HTTPException(status_code=500, detail="Не удалось создать письмо")
            
    except Exception as e:
        print(f"❌ Ошибка при генерации письма: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка при генерации письма: {str(e)}")

@app.get("/documents/{filename}")
async def get_document(filename: str):
    """Возвращает файл документа"""
    try:
        file_path = os.path.join("../existing_documents", filename)
        if os.path.exists(file_path):
            from fastapi.responses import FileResponse
            return FileResponse(
                path=file_path,
                filename=filename,
                media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
        else:
            raise HTTPException(status_code=404, detail="Файл не найден")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении файла: {str(e)}")

@app.get("/health")
async def health_check():
    """Проверка состояния API"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
