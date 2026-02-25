/**
 * React Native приложение для голосового помощника
 * Принимает голосовые команды и отправляет их в backend
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';

// Конфигурация
const API_BASE_URL = 'http://localhost:8000'; // Замените на ваш backend URL
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Замените на ваш Supabase URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Замените на ваш anon key

interface Command {
  id: string;
  type: string;
  status: string;
  created_at: string;
  payload: any;
  result_url?: string;
  error_message?: string;
}

interface CommandStatus {
  id: string;
  status: string;
  result_url?: string;
  error_message?: string;
  processed_at?: string;
}

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [commands, setCommands] = useState<Command[]>([]);
  const [currentCommand, setCurrentCommand] = useState<Command | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  // Функция для запроса разрешений
  useEffect(() => {
    if (!permissionResponse) {
      requestPermission();
    }
  }, [permissionResponse, requestPermission]);

  // Функция для парсинга голосовой команды
  const parseVoiceCommand = (text: string): { type: string; payload: any } | null => {
    const lowerText = text.toLowerCase();
    
    // Извлекаем номер квартиры
    const apartmentMatch = lowerText.match(/квартир[аы]?\s*(\d+)/);
    const apartmentId = apartmentMatch ? apartmentMatch[1] : '1101'; // По умолчанию
    
    // Определяем тип команды
    if (lowerText.includes('создай акт') || lowerText.includes('создать акт')) {
      return {
        type: 'create_act',
        payload: {
          apartment_id: apartmentId,
          act_type: 'handover',
          meta: {
            notes: text,
            voice_command: true
          }
        }
      };
    }
    
    if (lowerText.includes('распечатай акт') || lowerText.includes('печать акт')) {
      return {
        type: 'print_act',
        payload: {
          apartment_id: apartmentId,
          meta: {
            notes: text,
            voice_command: true
          }
        }
      };
    }
    
    if (lowerText.includes('создай дефект') || lowerText.includes('создать дефект')) {
      // Извлекаем описание дефекта
      const defectMatch = lowerText.match(/дефект[аы]?\s*(.+)/);
      const defectDescription = defectMatch ? defectMatch[1] : 'Дефект обнаружен';
      
      return {
        type: 'create_defect',
        payload: {
          apartment_id: apartmentId,
          defect_description: defectDescription,
          meta: {
            notes: text,
            voice_command: true
          }
        }
      };
    }
    
    if (lowerText.includes('распечатай отчет') || lowerText.includes('печать отчет')) {
      return {
        type: 'print_defect_report',
        payload: {
          apartment_id: apartmentId,
          meta: {
            notes: text,
            voice_command: true
          }
        }
      };
    }
    
    return null;
  };

  // Функция для отправки команды в backend
  const sendCommand = async (type: string, payload: any): Promise<Command | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/commands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          payload,
          created_by: 'mobile_user' // В реальном приложении используйте ID пользователя
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const command = await response.json();
      return command;
    } catch (error) {
      console.error('Error sending command:', error);
      Alert.alert('Ошибка', 'Не удалось отправить команду');
      return null;
    }
  };

  // Функция для проверки статуса команды
  const checkCommandStatus = async (commandId: string): Promise<CommandStatus | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/commands/${commandId}/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const status = await response.json();
      return status;
    } catch (error) {
      console.error('Error checking command status:', error);
      return null;
    }
  };

  // Функция для начала записи
  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        Alert.alert('Ошибка', 'Нет разрешения на запись аудио');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecognizedText('');
      
      // Озвучиваем начало записи
      Speech.speak('Начинаю запись', { language: 'ru' });
      
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Ошибка', 'Не удалось начать запись');
    }
  };

  // Функция для остановки записи
  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    const uri = recording.getURI();
    setRecording(null);

    if (uri) {
      await processAudioFile(uri);
    }
  };

  // Функция для обработки аудиофайла
  const processAudioFile = async (uri: string) => {
    setIsProcessing(true);
    
    try {
      // В реальном приложении здесь должен быть вызов API для распознавания речи
      // Пока что используем заглушку
      const mockRecognizedText = await mockSpeechRecognition(uri);
      setRecognizedText(mockRecognizedText);
      
      // Парсим команду
      const parsedCommand = parseVoiceCommand(mockRecognizedText);
      
      if (parsedCommand) {
        // Отправляем команду
        const command = await sendCommand(parsedCommand.type, parsedCommand.payload);
        
        if (command) {
          setCurrentCommand(command);
          setCommands(prev => [command, ...prev]);
          
          // Озвучиваем подтверждение
          Speech.speak('Команда отправлена', { language: 'ru' });
          
          // Начинаем мониторинг статуса
          monitorCommandStatus(command.id);
        }
      } else {
        Alert.alert('Не распознано', 'Команда не распознана. Попробуйте еще раз.');
        Speech.speak('Команда не распознана', { language: 'ru' });
      }
      
    } catch (error) {
      console.error('Error processing audio:', error);
      Alert.alert('Ошибка', 'Не удалось обработать аудио');
    } finally {
      setIsProcessing(false);
    }
  };

  // Заглушка для распознавания речи (в реальном приложении замените на реальный API)
  const mockSpeechRecognition = async (uri: string): Promise<string> => {
    // Имитируем задержку обработки
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Возвращаем случайную команду для демонстрации
    const mockCommands = [
      'Создай акт приёмки для квартиры 1101',
      'Распечатай акт для квартиры 1205',
      'Создай дефект в квартире 1103 трещина в стене',
      'Распечатай отчет о дефектах для квартиры 1101'
    ];
    
    return mockCommands[Math.floor(Math.random() * mockCommands.length)];
  };

  // Функция для мониторинга статуса команды
  const monitorCommandStatus = async (commandId: string) => {
    const checkStatus = async () => {
      const status = await checkCommandStatus(commandId);
      
      if (status) {
        // Обновляем команду в списке
        setCommands(prev => prev.map(cmd => 
          cmd.id === commandId 
            ? { ...cmd, status: status.status, result_url: status.result_url, error_message: status.error_message }
            : cmd
        ));
        
        // Обновляем текущую команду
        if (currentCommand?.id === commandId) {
          setCurrentCommand(prev => prev ? { ...prev, ...status } : null);
        }
        
        // Если команда завершена, озвучиваем результат
        if (status.status === 'done') {
          Speech.speak('Команда выполнена успешно', { language: 'ru' });
        } else if (status.status === 'failed') {
          Speech.speak('Ошибка выполнения команды', { language: 'ru' });
        }
        
        // Продолжаем мониторинг, если команда еще не завершена
        if (status.status === 'pending' || status.status === 'processing') {
          setTimeout(checkStatus, 3000); // Проверяем каждые 3 секунды
        }
      }
    };
    
    checkStatus();
  };

  // Функция для ручного ввода команды
  const handleManualCommand = () => {
    Alert.prompt(
      'Введите команду',
      'Например: "Создай акт приёмки для квартиры 1101"',
      async (text) => {
        if (text) {
          setRecognizedText(text);
          const parsedCommand = parseVoiceCommand(text);
          
          if (parsedCommand) {
            const command = await sendCommand(parsedCommand.type, parsedCommand.payload);
            if (command) {
              setCurrentCommand(command);
              setCommands(prev => [command, ...prev]);
              monitorCommandStatus(command.id);
            }
          } else {
            Alert.alert('Ошибка', 'Не удалось распознать команду');
          }
        }
      }
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'processing': return '#007AFF';
      case 'done': return '#34C759';
      case 'failed': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'processing': return 'Выполняется';
      case 'done': return 'Готово';
      case 'failed': return 'Ошибка';
      default: return 'Неизвестно';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Голосовой помощник</Text>
          <Text style={styles.subtitle}>Строительное приложение</Text>
        </View>

        {/* Кнопка записи */}
        <View style={styles.recordingSection}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={40}
                color="#FFFFFF"
              />
            )}
          </TouchableOpacity>
          
          <Text style={styles.recordButtonText}>
            {isRecording ? 'Остановить запись' : 'Начать запись'}
          </Text>
        </View>

        {/* Распознанный текст */}
        {recognizedText ? (
          <View style={styles.recognizedTextSection}>
            <Text style={styles.recognizedTextLabel}>Распознанный текст:</Text>
            <Text style={styles.recognizedText}>{recognizedText}</Text>
          </View>
        ) : null}

        {/* Кнопка ручного ввода */}
        <TouchableOpacity style={styles.manualButton} onPress={handleManualCommand}>
          <Ionicons name="create-outline" size={20} color="#007AFF" />
          <Text style={styles.manualButtonText}>Ввести команду вручную</Text>
        </TouchableOpacity>

        {/* Текущая команда */}
        {currentCommand && (
          <View style={styles.currentCommandSection}>
            <Text style={styles.sectionTitle}>Текущая команда</Text>
            <View style={styles.commandCard}>
              <View style={styles.commandHeader}>
                <Text style={styles.commandType}>{currentCommand.type}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentCommand.status) }]}>
                  <Text style={styles.statusText}>{getStatusText(currentCommand.status)}</Text>
                </View>
              </View>
              
              <Text style={styles.commandDetails}>
                Квартира: {currentCommand.payload.apartment_id}
              </Text>
              
              {currentCommand.result_url && (
                <TouchableOpacity style={styles.downloadButton}>
                  <Ionicons name="download-outline" size={16} color="#007AFF" />
                  <Text style={styles.downloadButtonText}>Скачать документ</Text>
                </TouchableOpacity>
              )}
              
              {currentCommand.error_message && (
                <Text style={styles.errorText}>{currentCommand.error_message}</Text>
              )}
            </View>
          </View>
        )}

        {/* История команд */}
        {commands.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>История команд</Text>
            {commands.map((command) => (
              <View key={command.id} style={styles.commandCard}>
                <View style={styles.commandHeader}>
                  <Text style={styles.commandType}>{command.type}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(command.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(command.status)}</Text>
                  </View>
                </View>
                
                <Text style={styles.commandDetails}>
                  Квартира: {command.payload.apartment_id}
                </Text>
                
                <Text style={styles.commandTime}>
                  {new Date(command.created_at).toLocaleString('ru-RU')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Инструкции */}
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>Примеры команд</Text>
          <Text style={styles.instructionText}>• "Создай акт приёмки для квартиры 1101"</Text>
          <Text style={styles.instructionText}>• "Распечатай акт для квартиры 1205"</Text>
          <Text style={styles.instructionText}>• "Создай дефект в квартире 1103 трещина в стене"</Text>
          <Text style={styles.instructionText}>• "Распечатай отчет о дефектах для квартиры 1101"</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  recordingSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordButtonActive: {
    backgroundColor: '#FF3B30',
  },
  recordButtonText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  recognizedTextSection: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  recognizedTextLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 5,
  },
  recognizedText: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  manualButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  currentCommandSection: {
    margin: 20,
  },
  historySection: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 15,
  },
  commandCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  commandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commandType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  commandDetails: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 5,
  },
  commandTime: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  downloadButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 5,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 5,
  },
  instructionsSection: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  instructionText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 5,
    lineHeight: 20,
  },
});


