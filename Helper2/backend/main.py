"""
FastAPI Backend для голосового помощника строительного приложения
Обрабатывает команды от мобильного приложения и предоставляет API для агента
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import os
import uuid
from datetime import datetime, timezone
import logging
from supabase import create_client, Client
import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Загружаем переменные окружения из .env файла
load_dotenv()

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Модели данных
class CommandCreate(BaseModel):
    type: str = Field(..., description="Тип команды: create_act, print_act, create_defect, print_defect_report")
    payload: Dict[str, Any] = Field(..., description="Параметры команды")
    created_by: Optional[str] = Field(None, description="ID пользователя")

class CommandResponse(BaseModel):
    id: str
    type: str
    status: str
    created_at: datetime
    payload: Dict[str, Any]
    result_url: Optional[str] = None
    error_message: Optional[str] = None

class CommandUpdate(BaseModel):
    status: str
    result_url: Optional[str] = None
    error_message: Optional[str] = None

class CommandStatus(BaseModel):
    id: str
    type: str
    status: str
    created_at: datetime
    processed_at: Optional[datetime] = None
    attempt_count: int
    result_url: Optional[str] = None
    error_message: Optional[str] = None

# Инициализация Supabase
def get_supabase_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not service_key:
        raise HTTPException(status_code=500, detail="Supabase credentials not configured")
    
    return create_client(url, service_key)

# Глобальная переменная для Supabase клиента
supabase: Optional[Client] = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Инициализация при запуске приложения"""
    global supabase
    try:
        supabase = get_supabase_client()
        logger.info("Supabase client initialized successfully")
        yield
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        raise
    finally:
        logger.info("Application shutdown")

# Создание FastAPI приложения
app = FastAPI(
    title="Voice Assistant API",
    description="API для голосового помощника строительного приложения",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency для получения Supabase клиента
def get_supabase() -> Client:
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase client not initialized")
    return supabase

# Валидация типов команд
VALID_COMMAND_TYPES = {
    "create_act",
    "print_act", 
    "create_defect",
    "print_defect_report"
}

def validate_command_type(command_type: str) -> bool:
    """Проверяет валидность типа команды"""
    return command_type in VALID_COMMAND_TYPES

def validate_payload(command_type: str, payload: Dict[str, Any]) -> bool:
    """Валидирует payload в зависимости от типа команды"""
    if command_type == "create_act":
        required_fields = ["apartment_id", "act_type"]
        return all(field in payload for field in required_fields)
    elif command_type == "print_act":
        required_fields = ["apartment_id"]
        return all(field in payload for field in required_fields)
    elif command_type == "create_defect":
        required_fields = ["apartment_id", "defect_description"]
        return all(field in payload for field in required_fields)
    elif command_type == "print_defect_report":
        required_fields = ["apartment_id"]
        return all(field in payload for field in required_fields)
    return True

# API Endpoints

@app.get("/")
async def root():
    """Корневой endpoint"""
    return {"message": "Voice Assistant API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Проверка здоровья API"""
    try:
        # Проверяем подключение к Supabase
        supabase_client = get_supabase()
        result = supabase_client.table("commands").select("id").limit(1).execute()
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")

@app.post("/api/commands", response_model=CommandResponse)
async def create_command(
    command: CommandCreate,
    background_tasks: BackgroundTasks,
    db: Client = Depends(get_supabase)
):
    """Создание новой команды"""
    try:
        # Валидация типа команды
        if not validate_command_type(command.type):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid command type. Must be one of: {', '.join(VALID_COMMAND_TYPES)}"
            )
        
        # Валидация payload
        if not validate_payload(command.type, command.payload):
            raise HTTPException(
                status_code=400,
                detail="Invalid payload for command type"
            )
        
        # Создание команды в базе данных
        command_data = {
            "type": command.type,
            "payload": command.payload,
            "status": "pending",
            "created_by": command.created_by,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = db.table("commands").insert(command_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create command")
        
        created_command = result.data[0]
        
        # Логирование
        logger.info(f"Command created: {created_command['id']} of type {command.type}")
        
        # Запуск фоновой задачи для уведомления агента (если нужно)
        background_tasks.add_task(notify_agent, created_command['id'])
        
        return CommandResponse(
            id=created_command['id'],
            type=created_command['type'],
            status=created_command['status'],
            created_at=datetime.fromisoformat(created_command['created_at'].replace('Z', '+00:00')),
            payload=created_command['payload'],
            result_url=created_command.get('result_url'),
            error_message=created_command.get('error_message')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating command: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/commands/pending", response_model=List[CommandStatus])
async def get_pending_commands(
    limit: int = 10,
    db: Client = Depends(get_supabase)
):
    """Получение pending команд (для агента)"""
    try:
        result = db.table("commands").select("*").eq("status", "pending").order("created_at").limit(limit).execute()
        
        commands = []
        for cmd in result.data:
            commands.append(CommandStatus(
                id=cmd['id'],
                type=cmd['type'],
                status=cmd['status'],
                created_at=datetime.fromisoformat(cmd['created_at'].replace('Z', '+00:00')),
                processed_at=datetime.fromisoformat(cmd['processed_at'].replace('Z', '+00:00')) if cmd.get('processed_at') else None,
                attempt_count=cmd['attempt_count'],
                result_url=cmd.get('result_url'),
                error_message=cmd.get('error_message')
            ))
        
        return commands
        
    except Exception as e:
        logger.error(f"Error fetching pending commands: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/commands/{command_id}", response_model=CommandResponse)
async def get_command(
    command_id: str,
    db: Client = Depends(get_supabase)
):
    """Получение команды по ID"""
    try:
        result = db.table("commands").select("*").eq("id", command_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Command not found")
        
        cmd = result.data[0]
        return CommandResponse(
            id=cmd['id'],
            type=cmd['type'],
            status=cmd['status'],
            created_at=datetime.fromisoformat(cmd['created_at'].replace('Z', '+00:00')),
            payload=cmd['payload'],
            result_url=cmd.get('result_url'),
            error_message=cmd.get('error_message')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching command {command_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.patch("/api/commands/{command_id}")
async def update_command(
    command_id: str,
    update: CommandUpdate,
    db: Client = Depends(get_supabase)
):
    """Обновление статуса команды (для агента)"""
    try:
        # Проверяем существование команды
        existing = db.table("commands").select("id").eq("id", command_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Command not found")
        
        # Подготавливаем данные для обновления
        update_data = {
            "status": update.status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if update.status in ["done", "failed"]:
            update_data["processed_at"] = datetime.now(timezone.utc).isoformat()
        
        if update.result_url:
            update_data["result_url"] = update.result_url
            
        if update.error_message:
            update_data["error_message"] = update.error_message
        
        # Обновляем команду
        result = db.table("commands").update(update_data).eq("id", command_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update command")
        
        logger.info(f"Command {command_id} updated to status {update.status}")
        
        return {"message": "Command updated successfully", "command_id": command_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating command {command_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/documents/{document_id}")
async def download_document(
    document_id: str,
    db: Client = Depends(get_supabase)
):
    """Скачивание документа (proxy к Supabase Storage)"""
    try:
        # Получаем информацию о документе
        result = db.table("documents").select("*").eq("id", document_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc = result.data[0]
        storage_path = doc['storage_path']
        
        # Получаем файл из Storage
        file_response = db.storage.from_("documents").download(storage_path)
        
        if not file_response:
            raise HTTPException(status_code=404, detail="File not found in storage")
        
        # Возвращаем файл
        return FileResponse(
            path=storage_path,
            filename=doc['file_name'],
            media_type=doc.get('mime_type', 'application/octet-stream')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/commands/{command_id}/status")
async def get_command_status(
    command_id: str,
    db: Client = Depends(get_supabase)
):
    """Получение статуса команды (для мобильного приложения)"""
    try:
        result = db.table("commands").select("status, result_url, error_message, processed_at").eq("id", command_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Command not found")
        
        cmd = result.data[0]
        return {
            "id": command_id,
            "status": cmd['status'],
            "result_url": cmd.get('result_url'),
            "error_message": cmd.get('error_message'),
            "processed_at": cmd.get('processed_at')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching command status {command_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Фоновые задачи
async def notify_agent(command_id: str):
    """Уведомление агента о новой команде (заглушка)"""
    logger.info(f"Notifying agent about new command: {command_id}")
    # Здесь можно добавить WebSocket уведомления или другие механизмы

# WebSocket endpoint для real-time обновлений (опционально)
@app.websocket("/ws/commands/{command_id}")
async def websocket_command_status(websocket, command_id: str):
    """WebSocket для real-time обновлений статуса команды"""
    await websocket.accept()
    try:
        # Здесь можно реализовать подписку на изменения статуса команды
        # Пока что просто отправляем текущий статус
        db = get_supabase()
        result = db.table("commands").select("status, result_url, error_message").eq("id", command_id).execute()
        
        if result.data:
            await websocket.send_json({
                "command_id": command_id,
                "status": result.data[0]['status'],
                "result_url": result.data[0].get('result_url'),
                "error_message": result.data[0].get('error_message')
            })
        
        # Держим соединение открытым
        while True:
            await asyncio.sleep(1)
            # Здесь можно добавить логику для отправки обновлений
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
