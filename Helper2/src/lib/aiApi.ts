// API для работы с нейросетью через OpenRouter
// Свой ключ (рекомендуется): в .env задайте VITE_OPENROUTER_API_KEY (получить: https://openrouter.ai/keys)
const AI_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENROUTER_API_KEY?.trim())
  ? import.meta.env.VITE_OPENROUTER_API_KEY.trim()
  : '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';
const AI_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface AIResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
  }>;
}

export interface AIRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
}

// Актуальные бесплатные модели OpenRouter (при 404/429 пробуем следующую)
// Роутер openrouter/free сам выбирает доступную бесплатную модель
const FREE_MODELS = [
  'openrouter/free',
  'arcee-ai/trinity-large-preview:free',
  'tngtech/deepseek-r1t2-chimera:free',
  'z-ai/glm-4.5-air:free',
];

// Функция для отправки запроса к нейросети (OpenRouter).
// Для чата контекст задаёт роль и данные из поиска; иначе — нейтральный помощник.
export const sendToAI = async (message: string, context?: string): Promise<string> => {
  const systemPrompt = context?.trim()
    ? context
    : 'Ты — полезный помощник. Отвечай кратко и по делу.';

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message }
  ];

  let lastError: Error | null = null;

  for (const model of FREE_MODELS) {
    try {
      console.log('Отправляем запрос к AI, модель:', model);

      const requestBody: AIRequest = {
        model,
        messages,
        max_tokens: 1000,
        temperature: 0.7
      };

      const response = await fetch(AI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Construction Management System'
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await response.text();

      if (response.status === 404) {
        console.warn('Модель недоступна, пробуем следующую:', model);
        lastError = new Error(`No endpoints for ${model}`);
        continue;
      }

      if (response.status === 429) {
        console.warn('Лимит запросов для модели, пробуем следующую:', model);
        lastError = new Error('Превышен лимит запросов к нейросети. Подождите или смените ключ на openrouter.ai');
        continue;
      }

      if (!response.ok) {
        let userMessage = `Нейросеть вернула ошибку ${response.status}.`;
        if (response.status === 401) {
          userMessage = 'Неверный или просроченный ключ OpenRouter. Получите новый ключ на https://openrouter.ai/keys и укажите в .env: VITE_OPENROUTER_API_KEY=ваш_ключ';
        } else if (responseText) {
          try {
            const errJson = JSON.parse(responseText);
            if (errJson.error?.message) userMessage += ' ' + errJson.error.message;
          } catch {
            if (responseText.length < 200) userMessage += ' ' + responseText;
          }
        }
        throw new Error(userMessage);
      }

      const data: AIResponse = JSON.parse(responseText);
      if (data.choices && data.choices.length > 0) {
        return data.choices[0].message.content;
      }
      throw new Error('Нейросеть не вернула ответ. Попробуйте другой запрос.');
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // 404 уже обработан выше через continue; здесь — другие ошибки, прерываем
      throw lastError;
    }
  }

  throw lastError || new Error('Ни одна бесплатная модель OpenRouter не доступна. Проверьте https://openrouter.ai/collections/free-models и при необходимости укажите модель в коде (aiApi.ts).');
};

// Функция для анализа команды пользователя
export const analyzeUserCommand = async (userInput: string): Promise<{
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
  response: string;
}> => {
  try {
    console.log('Анализируем команду:', userInput);
    
    // РЕАЛЬНЫЙ AI АНАЛИЗ через OpenRouter
    const analysisPrompt = `Проанализируй команду: "${userInput}"
    
    Намерения:
    - create_letter: создание письма
    - other: другое
    
    Если команда содержит "письмо", "напиши", "создай" - это create_letter.
    
    Для писем извлеки:
    - apartment_id: номер квартиры
    - issue_type: тип проблемы
    - issue_description: описание проблемы
    
    Ответ должен быть кратким.
    
    JSON:
    {
      "intent": "намерение",
      "confidence": 0.9,
      "parameters": {
        "apartment_id": "номер квартиры",
        "issue_type": "тип проблемы",
        "issue_description": "описание проблемы"
      },
      "response": "краткий ответ"
    }`;

    const aiResponse = await sendToAI(analysisPrompt);
    
    // Пытаемся распарсить JSON ответ
    try {
      const parsed = JSON.parse(aiResponse);
      return parsed;
    } catch (parseError) {
      // Если не удалось распарсить, возвращаем базовый ответ
      return {
        intent: 'other',
        confidence: 0.5,
        parameters: {},
        response: aiResponse
      };
    }
  } catch (error) {
    console.error('Error analyzing command:', error);
    return {
      intent: 'other',
      confidence: 0,
      parameters: {},
      response: 'Извините, произошла ошибка при обработке команды.'
    };
  }
};

// Функция для генерации контента документа
export const generateDocumentContent = async (
  documentType: string,
  parameters: Record<string, any>
): Promise<string> => {
  try {
    const prompt = `Создай содержание для документа типа "${documentType}" со следующими параметрами:
    ${JSON.stringify(parameters, null, 2)}
    
    Создай профессиональный, структурированный документ на русском языке.
    Включи все необходимые разделы и детали.`;

    return await sendToAI(prompt);
  } catch (error) {
    console.error('Error generating document content:', error);
    throw error;
  }
};

// Функция для генерации письма через обученную систему
export const generateLetter = async (
  apartmentId: string,
  issueType: string,
  issueDescription: string,
  contactPerson?: string,
  phone?: string
): Promise<{ success: boolean; message: string; documentNumber?: string; filePath?: string }> => {
  try {
    console.log('📧 Генерация письма через обученную систему...');
    
    // Вызываем API для генерации письма
    const response = await fetch('http://localhost:8000/generate-letter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apartment_id: apartmentId,
        issue_type: issueType,
        issue_description: issueDescription,
        expected_resolution: 'Решение в процессе',
        contact_person: contactPerson || 'Ответственное лицо',
        phone: phone || '+7 (XXX) XXX-XX-XX'
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      // Создаем URL для скачивания
      const fileName = result.file_path ? result.file_path.split('/').pop() : null;
      const downloadUrl = fileName ? `http://localhost:8000/documents/${fileName}` : null;
      
      return {
        success: true,
        message: result.message,
        documentNumber: result.document_number,
        filePath: result.file_path,
        downloadUrl: downloadUrl,
        fileName: fileName
      };
    } else {
      throw new Error(result.message || 'Не удалось создать письмо');
    }
  } catch (error) {
    console.error('Error generating letter:', error);
    return {
      success: false,
      message: `Ошибка при создании письма: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
    };
  }
};
