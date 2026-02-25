// API для генерации документов
const DOCUMENT_API_URL = 'http://localhost:8000';

export interface LetterRequest {
  apartment_id: string;
  apartment_number?: string;
  issue_type: string;
  issue_description: string;
  expected_resolution?: string;
  contact_person?: string;
  phone?: string;
}

export interface DocumentResponse {
  success: boolean;
  message: string;
  file_path?: string;
  file_url?: string;
  document_number?: string;
  date?: string;
}

// Функция для генерации письма
export const generateLetter = async (request: LetterRequest): Promise<DocumentResponse> => {
  try {
    console.log('📧 Отправляем запрос на генерацию письма:', request);
    
    const response = await fetch(`${DOCUMENT_API_URL}/generate-letter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`Document API error: ${response.status} ${response.statusText}`);
    }

    const data: DocumentResponse = await response.json();
    console.log('✅ Письмо успешно создано:', data);
    
    return data;
  } catch (error) {
    console.error('Error generating letter:', error);
    throw error;
  }
};

// Функция для скачивания документа
export const downloadDocument = async (filename: string): Promise<Blob> => {
  try {
    const response = await fetch(`${DOCUMENT_API_URL}/documents/${filename}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.statusText}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
};

// Функция для проверки состояния API
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${DOCUMENT_API_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};



