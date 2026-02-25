import { useState, useEffect } from 'react'
import { supabase, supabaseAdmin, Apartment, Drawing, Project } from '../lib/supabase'

// Функция для определения типа квартиры и соответствующего плана
const getApartmentTypeAndPlan = (apartmentNumber: string) => {
  // Полный список всех квартир из таблицы
  const allApartments = [
    // Этаж 1
    '101',
    // Этаж 2
    '201', '202', '203',
    // Этаж 3
    '301', '302', '303',
    // Этаж 4
    '401', '402', '403', '404',
    // Этаж 5
    '501', '502', '503', '504',
    // Этаж 6
    '601', '602', '603', '604',
    // Этаж 7
    '701', '702', '703', '704',
    // Этаж 8
    '801', '802', '803', '804',
    // Этаж 9
    '901', '902', '903', '904',
    // Этаж 10
    '1001', '1002', '1003', '1004',
    // Этаж 11
    '1101', '1102', '1103', '1104',
    // Этаж 12
    '1201', '1202', '1203', '1204',
    // Этаж 13
    '1301', '1302',
    // Этаж 14
    '1401'
  ]
  
  // Проверяем, есть ли квартира в списке
  if (!allApartments.includes(apartmentNumber)) {
    return {
      type: 'unknown',
      planApartment: apartmentNumber,
      isTypical: false
    }
  }
  
  // Индивидуальные квартиры (имеют свои уникальные планы)
  // Только те, для которых есть файлы в Storage
  const individualApartments = ['404', '504', '704', '804', '1204'] // 403 и 603 теперь используются для типовых квартир
  
  if (individualApartments.includes(apartmentNumber)) {
    return {
      type: 'individual',
      planApartment: apartmentNumber,
      isTypical: false
    }
  }
  
  // Типовые квартиры - определяем по последней цифре
  // Используем только те планы, которые есть в Storage
  const typicalPlanMap: { [key: string]: string } = {
    '1': '403', // Типовые квартиры 1 используют план 403 (есть в Storage) ✅
    '2': '402', // Типовые квартиры 2 используют план 402 ✅
    '3': '603', // Типовые квартиры 3 используют план 603 (есть в Storage) ✅
    '4': '804'  // Типовые квартиры 4 используют план 804 (есть в Storage) ✅
  }
  
  const lastDigit = apartmentNumber.slice(-1)
  const planApartment = typicalPlanMap[lastDigit] || apartmentNumber
  
  return {
    type: 'typical',
    planApartment,
    isTypical: true,
    typicalGroup: lastDigit
  }
}

/**
 * Получить ВСЕ файлы из Storage bucket с пагинацией
 * Решает проблему когда list() возвращает только первую страницу (обычно 100 элементов)
 */
const getAllFilesFromStorage = async (
  path: string = '',
  sortBy?: { column: string; order: 'asc' | 'desc' }
): Promise<any[]> => {
  const allFiles: any[] = []
  const pageSize = 100
  let offset = 0
  let hasMore = true
  let hadError = false

  while (hasMore) {
    try {
      const options: any = {
        limit: pageSize,
        offset: offset
      }
      if (sortBy) {
        options.sortBy = sortBy
      }

      const { data: pageData, error: pageError } = await supabaseAdmin.storage
        .from('architectural-plans')
        .list(path, options)

      if (pageError) {
        hadError = true
        console.error(`❌ Ошибка Storage (offset ${offset}):`, pageError)
        break
      }

      if (!pageData || pageData.length === 0) {
        hasMore = false
        break
      }

      allFiles.push(...pageData)
      console.log(`📄 Загружено страница: ${pageData.length} файлов (всего: ${allFiles.length})`)

      if (pageData.length < pageSize) {
        hasMore = false
      } else {
        offset += pageSize
      }
    } catch (err) {
      hadError = true
      console.error(`❌ Исключение при загрузке Storage (offset ${offset}):`, err)
      break
    }
  }

  if (allFiles.length > 0) {
    console.log(`✅ Загружено файлов из Storage: ${allFiles.length}`)
  } else if (hadError) {
    console.warn(
      '⚠️ Storage недоступен (0 файлов). Возможные причины: net::ERR_EMPTY_RESPONSE / Failed to fetch — проверьте статус проекта Supabase (не приостановлен), сеть и CORS.'
    )
  }
  return allFiles
}

// Хук для получения проектов из Storage
export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        
        // Получаем ВСЕ файлы из Storage bucket с пагинацией
        const filesData = await getAllFilesFromStorage('', { column: 'name', order: 'asc' })

        if (filesData.length === 0) {
          console.warn('⚠️ Файлы из Storage не получены, используем тестовый проект')
          // Если Storage недоступен, создаем тестовый проект
          setProjects([{
            id: 'zhk-vishnevyy-sad',
            name: 'ЖК "Вишневый сад"',
            description: 'Современный жилой комплекс с развитой инфраструктурой',
            address: 'ул. Вишневая, 15',
            status: 'construction' as const,
            total_apartments: 46, // Общее количество квартир в проекте
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          return
        }

        console.log('🔍 Файлы из Storage (все страницы):', filesData.length, 'файлов')

        // Анализируем структуру файлов и создаем проекты
        const projectMap = new Map<string, Set<string>>()
        
        filesData?.forEach(file => {
          const pathParts = file.name.split('/')
          
          if (pathParts.length >= 2) {
            // Структура: project/apartment/file
            const projectName = pathParts[0]
            const apartmentId = pathParts[1]
            
            if (!projectMap.has(projectName)) {
              projectMap.set(projectName, new Set())
            }
            projectMap.get(projectName)?.add(apartmentId)
          } else if (pathParts.length === 1) {
            // Файл в корне - создаем общий проект
            const projectName = 'ЖК "Вишневый сад"'
            // Извлекаем номер квартиры из названия файла (например, T1003 -> 1003)
            const fileName = pathParts[0]
            const apartmentMatch = fileName.match(/T(\d+)/)
            const apartmentId = apartmentMatch ? `apartment-${apartmentMatch[1]}` : 'apartment-1'
            
            if (!projectMap.has(projectName)) {
              projectMap.set(projectName, new Set())
            }
            projectMap.get(projectName)?.add(apartmentId)
          }
        })

        // Создаем проекты
        const realProjects: Project[] = Array.from(projectMap.entries()).map(([projectName, apartments]) => ({
          id: projectName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: projectName,
          description: 'Современный жилой комплекс с развитой инфраструктурой',
          address: 'ул. Вишневая, 15',
          status: 'construction' as const,
          total_apartments: 46, // Общее количество квартир в проекте
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
        
        // Если нет проектов, создаем один
        if (realProjects.length === 0) {
          realProjects.push({
            id: 'zhk-vishnevyy-sad',
            name: 'ЖК "Вишневый сад"',
            description: 'Современный жилой комплекс с развитой инфраструктурой',
            address: 'ул. Вишневая, 15',
            status: 'construction' as const,
            total_apartments: 46, // Общее количество квартир в проекте
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
        
        setProjects(realProjects)
      } catch (err) {
        console.error('Ошибка загрузки проектов:', err)
        setError(err instanceof Error ? err.message : 'Ошибка загрузки проектов')
        // Fallback: показываем хотя бы один проект, чтобы экран не был пустым
        setProjects([{
          id: 'zhk-vishnevyy-sad',
          name: 'ЖК "Вишневый сад"',
          description: 'Современный жилой комплекс с развитой инфраструктурой',
          address: 'ул. Вишневая, 15',
          status: 'construction' as const,
          total_apartments: 46,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return { projects, loading, error }
}

// Хук для получения квартир из Storage
export const useApartments = (projectId: string) => {
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return

    const fetchApartments = async () => {
      try {
        setLoading(true)
        
        // Получаем ВСЕ файлы из Storage bucket с пагинацией
        const filesData = await getAllFilesFromStorage('')

        if (filesData.length === 0) {
          console.warn('⚠️ Файлы из Storage не получены, используем тестовую квартиру')
          // Если Storage недоступен, создаем тестовую квартиру
          setApartments([{
            id: 'apartment-1',
            project_id: projectId,
            apartment_number: '1',
            floor: 1,
            area: 45.5,
            rooms: 1,
            status: 'available' as const,
            price: 2500000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          return
        }

        console.log('🔍 Файлы из Storage для квартир (все страницы):', filesData.length, 'файлов')

        // Анализируем структуру файлов и создаем квартиры
        const apartmentMap = new Map<string, { files: any[], apartmentNumber: string }>()
        
        filesData?.forEach(file => {
          const pathParts = file.name.split('/')
          
          // Определяем, относится ли файл к данному проекту
          let isForThisProject = false
          let apartmentId = ''
          
          if (pathParts.length >= 2) {
            // Структура: project/apartment/file
            const fileProjectId = pathParts[0].toLowerCase().replace(/[^a-z0-9]/g, '-')
            if (fileProjectId === projectId) {
              isForThisProject = true
              apartmentId = pathParts[1]
            }
          } else if (pathParts.length === 1) {
            // Файл в корне - создаем квартиру на основе номера в названии файла
            isForThisProject = true
            const fileName = pathParts[0]
            const apartmentMatch = fileName.match(/T(\d+)/)
            apartmentId = apartmentMatch ? `apartment-${apartmentMatch[1]}` : 'apartment-1'
          }
          
          if (isForThisProject) {
            if (!apartmentMap.has(apartmentId)) {
              // Извлекаем номер квартиры
              let apartmentNumber = apartmentId
              const match = apartmentId.match(/(\d+)/)
              if (match) {
                apartmentNumber = match[1]
              }
              
              apartmentMap.set(apartmentId, {
                files: [],
                apartmentNumber
              })
            }
            apartmentMap.get(apartmentId)?.files.push(file)
          }
        })

        // Полный список всех квартир из таблицы
        const allApartmentsList = [
          // Этаж 1
          '101',
          // Этаж 2
          '201', '202', '203',
          // Этаж 3
          '301', '302', '303',
          // Этаж 4
          '401', '402', '403', '404',
          // Этаж 5
          '501', '502', '503', '504',
          // Этаж 6
          '601', '602', '603', '604',
          // Этаж 7
          '701', '702', '703', '704',
          // Этаж 8
          '801', '802', '803', '804',
          // Этаж 9
          '901', '902', '903', '904',
          // Этаж 10
          '1001', '1002', '1003', '1004',
          // Этаж 11
          '1101', '1102', '1103', '1104',
          // Этаж 12
          '1201', '1202', '1203', '1204',
          // Этаж 13
          '1301', '1302',
          // Этаж 14
          '1401'
        ]
        
        // Функция для определения этажа из номера квартиры
        const getFloorFromApartmentNumber = (apartmentNumber: string): number => {
          if (apartmentNumber.length === 3) {
            // Трехзначный номер: первая цифра = этаж
            return parseInt(apartmentNumber[0])
          } else if (apartmentNumber.length === 4) {
            // Четырехзначный номер: первые две цифры = этаж
            return parseInt(apartmentNumber.substring(0, 2))
          }
          return 1 // По умолчанию
        }

        // Создаем квартиры на основе полного списка
        const realApartments: Apartment[] = allApartmentsList.map((apartmentNumber, index) => {
          const floor = getFloorFromApartmentNumber(apartmentNumber)
          const { type, isTypical } = getApartmentTypeAndPlan(apartmentNumber)
          
          return {
            id: `apartment-${apartmentNumber}`,
            project_id: projectId,
            apartment_number: apartmentNumber,
            floor: floor,
            area: 45.5 + (index * 5), // Разная площадь для разных квартир
            rooms: Math.min(4, Math.floor(index / 3) + 1), // 1-4 комнаты
            status: 'available' as const,
            price: 2500000 + (index * 200000), // Разная цена
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        })
        
        // Если нет квартир, создаем одну
        if (realApartments.length === 0) {
          realApartments.push({
            id: 'apartment-1',
            project_id: projectId,
            apartment_number: '1',
            floor: 1,
            area: 45.5,
            rooms: 1,
            status: 'available' as const,
            price: 2500000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
        
        setApartments(realApartments)
      } catch (err) {
        console.error('Ошибка загрузки квартир:', err)
        setError(err instanceof Error ? err.message : 'Ошибка загрузки квартир')
        // Fallback: полный список квартир по этажам, чтобы экран не был пустым
        const fallbackList = ['101', '201', '202', '203', '301', '302', '303', '401', '402', '403', '404', '501', '502', '503', '504', '601', '602', '603', '604', '701', '702', '703', '704', '801', '802', '803', '804', '901', '902', '903', '904', '1001', '1002', '1003', '1004', '1101', '1102', '1103', '1104', '1201', '1202', '1203', '1204', '1301', '1302', '1401']
        const getFloor = (num: string) => num.length === 3 ? parseInt(num[0]) : parseInt(num.substring(0, 2))
        setApartments(fallbackList.map((apartmentNumber, index) => ({
          id: `apartment-${apartmentNumber}`,
          project_id: projectId,
          apartment_number: apartmentNumber,
          floor: getFloor(apartmentNumber),
          area: 45.5 + (index * 5),
          rooms: Math.min(4, Math.floor(index / 3) + 1),
          status: 'available' as const,
          price: 2500000 + (index * 200000),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })))
      } finally {
        setLoading(false)
      }
    }

    fetchApartments()
  }, [projectId])

  return { apartments, loading, error }
}

// Хук для получения архитектурных планов квартиры из Storage
export const useArchitecturalPlans = (apartmentId: string) => {
  const [plans, setPlans] = useState<Drawing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!apartmentId) {
      setPlans([])
      setLoading(false)
      return
    }

    let isCancelled = false // Флаг для предотвращения race conditions

    const fetchPlans = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Извлекаем номер квартиры из apartmentId (например, apartment-1003 -> 1003)
        const apartmentNumber = apartmentId.replace('apartment-', '')
        const { type, planApartment, isTypical, typicalGroup } = getApartmentTypeAndPlan(apartmentNumber)
        
        console.log(`🏠 Квартира ${apartmentNumber}:`, { type, planApartment, isTypical, typicalGroup })
        
        // Получаем ВСЕ файлы из Storage bucket с пагинацией (важно: все страницы!)
        const allFilesData = await getAllFilesFromStorage('')

        // Проверяем, не был ли запрос отменён (пользователь переключился на другую квартиру)
        if (isCancelled) {
          console.log(`⏭️ Запрос для квартиры ${apartmentNumber} отменён (переключение)`)
          return
        }

        if (allFilesData.length === 0) {
          console.warn('⚠️ Файлы из Storage не получены для квартиры', apartmentNumber)
          setPlans([])
          return
        }
        
        console.log(`🔍 Файлы из Storage для планов (все страницы): ${allFilesData.length} файлов`)
        
        // Ищем файлы для квартиры-источника плана (planApartment)
        const planFiles = allFilesData.filter(file => {
          const fileName = file.name
          
          // Ищем файлы, которые содержат номер квартиры-источника
          // Например, для квартиры 1003 (тип 3) ищем файлы с T603
          const planMatch = fileName.match(/T(\d+)/)
          if (planMatch) {
            const fileApartmentNum = planMatch[1]
            return fileApartmentNum === planApartment
          }
          return false
        })
        
        console.log(`📋 Файлы для плана квартиры ${planApartment}:`, planFiles.length, 'найдено')
        
        // Проверяем отмену ещё раз перед долгой операцией
        if (isCancelled) {
          console.log(`⏭️ Запрос для квартиры ${apartmentNumber} отменён перед обработкой файлов`)
          return
        }
        
        // Преобразуем файлы в формат Drawing с публичными URL (только PDF)
        const realPlans: Drawing[] = await Promise.all(
          planFiles
            .filter(file => file.name.toLowerCase().endsWith('.pdf')) // Только PDF файлы
            .map(async (file) => {
              // Получаем публичный URL для файла
              const { data: urlData } = supabase.storage
                .from('architectural-plans')
                .getPublicUrl(file.name)
              
              return {
                id: file.id || `${apartmentId}-${file.name}`,
                apartment_id: apartmentId,
                file_path: file.name,
                file_name: file.name.split('/').pop() || file.name,
                file_size: file.metadata?.size || 0,
                width_px: file.metadata?.width || undefined,
                height_px: file.metadata?.height || undefined,
                pages: 1,
                source: 'storage',
                uploaded_by: file.updated_by || 'unknown',
                created_at: file.created_at || new Date().toISOString(),
                file_url: urlData.publicUrl, // Добавляем публичный URL
                // Дополнительная информация о типе квартиры
                apartment_type: type,
                plan_source_apartment: planApartment,
                is_typical: isTypical,
                typical_group: typicalGroup
              }
            })
        )
        
        // Финальная проверка отмены перед обновлением состояния
        if (isCancelled) {
          console.log(`⏭️ Запрос для квартиры ${apartmentNumber} отменён перед установкой планов`)
          return
        }
        
        console.log(`✅ Найдено планов для квартиры ${apartmentNumber}:`, realPlans.length)
        
        setPlans(realPlans)
      } catch (err) {
        if (!isCancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки планов'
          console.error('❌ Ошибка загрузки планов:', errorMessage)
          setError(errorMessage)
          setPlans([])
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    fetchPlans()

    // Cleanup функция: отменяем запрос если apartmentId изменился
    return () => {
      isCancelled = true
    }
  }, [apartmentId])

  return { plans, loading, error }
}

// Хук для загрузки файла плана
export const usePlanUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadPlan = async (
    file: File,
    apartmentId: string,
    planType: string
  ): Promise<string | null> => {
    try {
      setUploading(true)
      setError(null)

      // Генерируем уникальное имя файла
      const fileExt = file.name.split('.').pop()
      const fileName = `${apartmentId}_${planType}_${Date.now()}.${fileExt}`
      const filePath = `plans/${fileName}`

      // Загружаем файл в Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('architectural-plans')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
        .from('architectural-plans')
        .getPublicUrl(filePath)

      // Сохраняем информацию о плане в базу данных
      const { data: planData, error: planError } = await supabase
        .from('architectural_plans')
        .insert({
          apartment_id: apartmentId,
          plan_type: planType,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size
        })
        .select()
        .single()

      if (planError) throw planError

      return urlData.publicUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки файла')
      return null
    } finally {
      setUploading(false)
    }
  }

  return { uploadPlan, uploading, error }
}
