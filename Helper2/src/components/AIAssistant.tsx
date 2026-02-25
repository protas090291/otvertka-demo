import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Bot,
  MessageCircle,
  FileText,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Settings,
  History,
  Zap,
  Search
} from 'lucide-react';
import { UserRole } from '../types';
import AnimatedVoiceAssistant from './AnimatedVoiceAssistant';
import DefectTester from './DefectTester';
import { sendToAI, analyzeUserCommand, generateDocumentContent } from '../lib/aiApi';
import { askConstructionAssistant } from '../lib/systemControlApi';
import { generateLetter, downloadDocument, checkApiHealth, LetterRequest } from '../lib/documentGenerationApi';

interface AIAssistantProps {
  userRole: UserRole;
}

interface VoiceCommand {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  text: string;
  apartmentId?: string;
  resultUrl?: string;
  downloadUrl?: string;
  fileName?: string;
  errorMessage?: string;
  createdAt: string;
  processedAt?: string;
  aiResponse?: string;
  intent?: string;
  confidence?: number;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ userRole }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<VoiceCommand[]>([]);
  const [showDefectTester, setShowDefectTester] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Проверка подключения к API
  useEffect(() => {
    checkConnection();
  }, []);



  const checkConnection = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      setIsConnected(response.ok);
    } catch (error) {
      setIsConnected(false);
    }
  };

  // Парсинг голосовой команды
  const parseVoiceCommand = (text: string): { type: string; payload: any } | null => {
    const lowerText = text.toLowerCase();
    
    // Извлекаем номер квартиры - улучшенный парсинг
    const apartmentPatterns = [
      /квартир[аы]?\s*(\d+)/,           // "квартира 1201"
      /по\s*квартир[аеы]?\s*(\d+)/,     // "по квартире 1201"
      /для\s*квартир[аы]?\s*(\d+)/,     // "для квартиры 1201"
      /в\s*квартир[еы]?\s*(\d+)/,       // "в квартире 1201"
      /квартир[аы]?\s*номер\s*(\d+)/,   // "квартира номер 1201"
      /(\d{3,4})/,                      // просто номер 1201, 601, 402
    ];
    
    let apartmentId = '1101'; // значение по умолчанию
    
    for (const pattern of apartmentPatterns) {
      const match = lowerText.match(pattern);
      if (match) {
        apartmentId = match[1];
        break;
      }
    }
    
    // Определяем тип команды с улучшенным анализом
    if (lowerText.includes('создай акт') || lowerText.includes('создать акт') || 
        lowerText.includes('акт приёмки') || lowerText.includes('акт приемки')) {
      return {
        type: 'create_act',
        payload: {
          apartment_id: apartmentId,
          act_type: 'handover',
          document_purpose: 'приёмка квартиры',
          meta: { 
            notes: text, 
            voice_command: true,
            intent: 'handover_act'
          }
        }
      };
    }
    
    if (lowerText.includes('распечатай акт') || lowerText.includes('печать акт') ||
        lowerText.includes('выведи акт') || lowerText.includes('покажи акт')) {
      return {
        type: 'print_act',
        payload: {
          apartment_id: apartmentId,
          document_purpose: 'печать акта приёмки',
          meta: { 
            notes: text, 
            voice_command: true,
            intent: 'print_handover_act'
          }
        }
      };
    }
    
    if (lowerText.includes('создай дефект') || lowerText.includes('создать дефект') ||
        lowerText.includes('отчёт о дефектах') || lowerText.includes('отчет о дефектах')) {
      const defectMatch = lowerText.match(/дефект[аы]?\s*(.+)/);
      const defectDescription = defectMatch ? defectMatch[1] : 'Дефект обнаружен';
      
      return {
        type: 'create_defect',
        payload: {
          apartment_id: apartmentId,
          defect_description: defectDescription,
          document_purpose: 'отчёт о дефектах',
          meta: { 
            notes: text, 
            voice_command: true,
            intent: 'defect_report'
          }
        }
      };
    }
    
    if (lowerText.includes('распечатай отчет') || lowerText.includes('печать отчет') ||
        lowerText.includes('отчёт о работах') || lowerText.includes('отчет о работах') ||
        lowerText.includes('выведи отчет') || lowerText.includes('покажи отчет')) {
      return {
        type: 'print_defect_report',
        payload: {
          apartment_id: apartmentId,
          document_purpose: 'отчёт о выполненных работах',
          meta: { 
            notes: text, 
            voice_command: true,
            intent: 'work_report'
          }
        }
      };
    }
    
    // Новые команды для писем и уведомлений
    if (lowerText.includes('напиши письмо') || lowerText.includes('написать письмо') ||
        lowerText.includes('отправь письмо') || lowerText.includes('отправить письмо')) {
      const recipientMatch = lowerText.match(/заказчик[у]?|подрядчик[у]?|руководител[ю]?/);
      const recipient = recipientMatch ? recipientMatch[0] : 'заказчику';
      
      return {
        type: 'create_letter',
        payload: {
          apartment_id: apartmentId,
          recipient: recipient,
          document_purpose: 'официальное письмо',
          meta: { 
            notes: text, 
            voice_command: true,
            intent: 'official_letter'
          }
        }
      };
    }
    
    // Все остальные команды теперь автоматически используют примеры из Supabase
    
    return null;
  };

  // Отправка команды в API
  const sendCommand = async (type: string, payload: any, text: string): Promise<VoiceCommand | null> => {
    try {
      const response = await fetch('http://localhost:8000/api/commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          payload,
          created_by: userRole
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const command = await response.json();
      
      const voiceCommand: VoiceCommand = {
        id: command.id,
        type: command.type,
        status: command.status,
        text: text,
        apartmentId: payload.apartment_id,
        resultUrl: command.result_url,
        errorMessage: command.error_message,
        createdAt: command.created_at
      };

      return voiceCommand;
    } catch (error) {
      console.error('Error sending command:', error);
      return null;
    }
  };

  // Мониторинг статуса команды
  const monitorCommandStatus = async (commandId: string) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/commands/${commandId}/status`);
        const status = await response.json();
        
        setMessages(prev => prev.map(msg => 
          msg.id === commandId 
            ? { 
                ...msg, 
                status: status.status, 
                resultUrl: status.result_url, 
                errorMessage: status.error_message,
                processedAt: status.processed_at
              }
            : msg
        ));
        
        // Продолжаем мониторинг, если команда еще не завершена
        if (status.status === 'pending' || status.status === 'processing') {
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        console.error('Error checking command status:', error);
      }
    };
    
    checkStatus();
  };

  // Обработка голосового ввода с использованием AI и управления системой
  const handleVoiceInput = async (text: string) => {
    console.log('🔧 handleVoiceInput вызван с текстом:', text);
    setIsProcessing(true);
    
    // Добавляем сообщение пользователя
    const userMessage: VoiceCommand = {
      id: `user-${Date.now()}`,
      type: 'user_message',
      status: 'done',
      text: text,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const { response } = await askConstructionAssistant(text);
      
      if (response) {
        const aiResponseMessage: VoiceCommand = {
          id: `ai-${Date.now()}`,
          type: 'ai_response',
          status: 'done',
          text: '',
          aiResponse: response,
          intent: 'ai_response',
          confidence: 1.0,
          createdAt: new Date().toISOString(),
          processedAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiResponseMessage]);
      }
      
      
    } catch (error) {
      console.error('Error processing with AI:', error);
      
      // Создаем сообщение об ошибке
      const errorMessage: VoiceCommand = {
        id: `error-${Date.now()}`,
        type: 'error',
        status: 'failed',
        text: '',
        aiResponse: '❌ Ошибка обработки запроса. Попробуйте еще раз.',
        intent: 'error',
        confidence: 0,
        createdAt: new Date().toISOString(),
        processedAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
    }
    
    setIsProcessing(false);
  };

  // Начало записи
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'ru-RU';
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceInput(transcript);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        const msg = event.error === 'not-allowed' || event.error === 'service-not-allowed'
          ? 'Доступ к микрофону запрещён. Разрешите его в настройках браузера.'
          : event.error === 'no-speech'
            ? 'Речь не распознана. Попробуйте ещё раз.'
            : null;
        if (msg) alert(msg);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        console.error('Recognition start error:', err);
        setIsListening(false);
        alert('Не удалось запустить запись. Проверьте доступ к микрофону и попробуйте снова.');
      }
    } else {
      alert('Голосовое распознавание не поддерживается в вашем браузере. Используйте Chrome или Edge.');
    }
  };

  // Остановка записи
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Обработка текстового ввода
  const handleTextSubmit = () => {
    if (inputText.trim()) {
      handleVoiceInput(inputText);
      setInputText('');
    }
  };

  // Получение иконки статуса
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing': return <Zap className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'done': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Получение текста статуса
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'processing': return 'Выполняется';
      case 'done': return 'Готово';
      case 'failed': return 'Ошибка';
      default: return 'Неизвестно';
    }
  };

  // Получение цвета статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'done': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Основной чат */}
      {isExpanded && (
        <div className="animated-chat-container w-96 h-[500px] flex flex-col mb-4">
          {/* Заголовок */}
          <div className="animated-chat-header flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="animated-chat-avatar w-10 h-10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Помощник</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                  <span className="text-xs text-gray-500">
                    {isConnected ? 'Подключен' : 'Отключен'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-all duration-300 backdrop-blur-sm"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Сообщения */}
          <div className="animated-chat-messages flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Чат по строительству — как GPT внутри системы</p>
                <p className="text-xs text-gray-400 mt-1">Можно спросить что угодно по строительной тематике</p>
                <div className="mt-4 text-xs text-gray-400 space-y-1">
                  <p className="text-green-400 font-medium">• Нормы, СП, СНиП</p>
                  <p className="text-blue-400 font-medium">• Технологии и материалы</p>
                  <p className="text-purple-400 font-medium">• Поиск в интернете используется для ответов</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="animated-chat-message space-y-2">
                  {message.text && (
                    <div className="animated-chat-message-user rounded-lg p-3">
                      <p className="text-sm text-gray-900">{message.text}</p>
                      {message.apartmentId && (
                        <p className="text-xs text-gray-500 mt-1">Квартира: {message.apartmentId}</p>
                      )}
                    </div>
                  )}
                  <div className={`animated-chat-message-assistant px-3 py-2 rounded-lg ${message.status === 'processing' ? 'animated-chat-message-processing' : ''}`}>
                    {message.aiResponse ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Bot className="w-4 h-4 text-blue-500" />
                          <p className="text-sm text-gray-800 bg-blue-50/80 backdrop-blur-sm p-3 rounded-lg border border-blue-200">
                            {message.aiResponse}
                          </p>
                        </div>
                        {(message.resultUrl || message.downloadUrl) && (
                          <div className="flex justify-end">
                            <a
                              href={message.downloadUrl || `http://localhost:8000${message.resultUrl}`}
                              download={message.fileName || true}
                              className="flex items-center space-x-1 text-sm hover:underline text-blue-600 hover:text-blue-800 transition-colors bg-green-50/80 backdrop-blur-sm p-2 rounded-lg border border-green-200"
                            >
                              <Download className="w-3 h-3" />
                              <span>Скачать {message.fileName ? `(${message.fileName})` : ''}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(message.status)}
                          <span className={`animated-chat-status-indicator ${message.status === 'done' ? 'success' : message.status === 'failed' ? 'error' : 'processing'} text-sm font-medium`}>
                            {getStatusText(message.status)}
                          </span>
                        </div>
                        {(message.resultUrl || message.downloadUrl) && (
                          <a
                            href={message.downloadUrl || `http://localhost:8000${message.resultUrl}`}
                            download={message.fileName || true}
                            className="flex items-center space-x-1 text-sm hover:underline text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            <span>Скачать {message.fileName ? `(${message.fileName})` : ''}</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  {message.errorMessage && (
                    <div className="animated-chat-message-error text-xs text-red-600 bg-red-50/80 backdrop-blur-sm p-2 rounded-lg border border-red-200">
                      {message.errorMessage}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Ввод */}
          <div className="animated-chat-input p-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
                placeholder="Спросите по строительству..."
                className="animated-chat-input-field flex-1 px-4 py-3 text-sm"
                disabled={isProcessing}
              />
              <button
                onClick={handleTextSubmit}
                disabled={!inputText.trim() || isProcessing}
                className="animated-chat-send-button p-3 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Анимированная кнопка голосового помощника */}
      <div className="relative">
        <div className={`${isExpanded ? 'mb-4' : ''}`}>
          <AnimatedVoiceAssistant
            isListening={isListening}
            isProcessing={isProcessing}
            onClick={isListening ? stopListening : startListening}
            className="w-24 h-24"
          />
        </div>

        {/* Индикатор статуса */}
        {!isExpanded && messages.length > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center z-10 animate-pulse">
            <span className="text-xs text-white font-bold">{messages.length}</span>
          </div>
        )}

        {/* Индикатор состояния записи */}
        {isListening && (
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center z-10 animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        )}

        {/* Индикатор обработки */}
        {isProcessing && (
          <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center z-10">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Кнопка развернуть */}
        {!isExpanded && (
          <div
            id="chat-toggle-button-new"
            onClick={() => setIsExpanded(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.filter = 'brightness(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.4), 0 0 25px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.filter = 'brightness(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.3), 0 0 20px rgba(102, 126, 234, 0.3)';
            }}
          >
            <svg 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Тестер дефектов */}
      {showDefectTester && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">🔍 Тестер модели обнаружения дефектов</h2>
              <button
                onClick={() => setShowDefectTester(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <DefectTester />
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
