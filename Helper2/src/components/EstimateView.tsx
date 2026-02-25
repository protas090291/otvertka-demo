import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Upload,
  User,
  Trash2,
  ClipboardList,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  getOrCreateEstimateForProject,
  getEstimateItems,
  createEstimateItem,
  updateEstimateItem,
  deleteEstimateItem,
  deleteAllEstimateItems,
  deleteEstimate,
  createEstimateItemsBatch,
  importEstimateFromFile,
  type EstimateItem,
  type Estimate,
} from '../lib/estimateApi';

const ASSIGNEE_OPTIONS = ['Прораб', 'Подрядчик', 'Рабочий', 'ТехНадзор', 'Заказчик'];

interface EstimateViewProps {
  projectId: string;
  projectName: string;
  onNavigateBack: () => void;
}

const EstimateView: React.FC<EstimateViewProps> = ({ projectId, projectName, onNavigateBack }) => {
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const itemsRef = useRef<EstimateItem[]>([]);
  const [itemsVersion, setItemsVersion] = useState(0);
  const items = itemsRef.current;
  const [loading, setLoading] = useState(!!projectId);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [newItem, setNewItem] = useState({ name: '', unit: 'шт.', quantity: '', apartment: '', section: '', subsection: '', category: '' });
  const [assignForm, setAssignForm] = useState({ assigned_to: '', quantity_assigned: '' });
  const [expandedApts, setExpandedApts] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedSubsections, setExpandedSubsections] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const loadEstimate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOrCreateEstimateForProject(projectId, projectName);
      if (result.estimate === null) {
        setError(result.error || 'Не удалось загрузить или создать смету.');
        setLoading(false);
        return;
      }
      setEstimate(result.estimate);
      const list = await getEstimateItems(result.estimate.id);
      itemsRef.current = list;
      setItemsVersion((v) => v + 1);
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || '';
      if (/apartment_number|schema cache/i.test(msg)) {
        setError(
          "В таблице estimate_items нет столбца apartment_number. В Supabase откройте SQL Editor → New query, вставьте содержимое файла Helper2/supabase_estimate_add_apartment.sql и нажмите Run."
        );
      } else {
        setError(msg || 'Ошибка загрузки сметы. Проверьте подключение к Supabase и наличие таблиц estimates, estimate_items.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!projectId) return;
    loadEstimate();
  }, [projectId, projectName]);

  // Дерево по умолчанию свёрнуто при смене списка
  useEffect(() => {
    if (itemsRef.current.length === 0) return;
    setExpandedApts(new Set());
    setExpandedSections(new Set());
    setExpandedSubsections(new Set());
    setExpandedCategories(new Set());
  }, [itemsVersion]);

  /** Группировка по квартирам — один проход по ref, без хранения массива в state */
  const treeByApartment = useMemo(() => {
    const list = itemsRef.current;
    const aptKey = (a: string | null) => a ?? '__none__';
    const looksLikeSection = (t: string | null | undefined): boolean => {
      if (t == null || t === '__none__') return true;
      const s = String(t).trim();
      if (s.length > 45) return true;
      return /помещен|конструкц|в помещении|гостинн|кухн|санузл|прихож|спальн|отделк|работ[ыа]|материал|стяжк|пола\s|полу|потолк/i.test(s);
    };
    const effectiveKey = (i: EstimateItem) =>
      i.apartment_number != null && !looksLikeSection(i.apartment_number) ? aptKey(i.apartment_number) : '__none__';
    const byApt = new Map<string, EstimateItem[]>();
    for (const item of list) {
      const key = effectiveKey(item);
      if (!byApt.has(key)) byApt.set(key, []);
      byApt.get(key)!.push(item);
    }
    const apartments = Array.from(byApt.keys()).sort((a, b) =>
      a === '__none__' ? 1 : b === '__none__' ? -1 : a.localeCompare(b)
    );
    return { apartments, itemsByApt: byApt };
  }, [itemsVersion]);

  const showNotify = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAddItem = async () => {
    if (!estimate || !newItem.name.trim()) return;
    const qty = parseFloat(newItem.quantity.replace(',', '.')) || 0;
    const created = await createEstimateItem({
      estimate_id: estimate.id,
      name: newItem.name.trim(),
      unit: newItem.unit.trim() || 'шт.',
      quantity: qty,
      apartment_number: newItem.apartment.trim() || null,
      section: newItem.section.trim() || null,
      subsection: newItem.subsection.trim() || null,
      category: newItem.category.trim() || null,
      sort_order: items.length,
    });
    if (created) {
      itemsRef.current = [...itemsRef.current, created];
      setItemsVersion((v) => v + 1);
      setNewItem({ name: '', unit: 'шт.', quantity: '', apartment: '', section: '', subsection: '', category: '' });
      setShowAddForm(false);
      showNotify('Позиция добавлена', 'success');
    } else {
      showNotify('Ошибка добавления позиции', 'error');
    }
  };

  const handleAssign = async (item: EstimateItem) => {
    if (!assignForm.assigned_to.trim()) return;
    const qty = parseFloat(assignForm.quantity_assigned.replace(',', '.')) || 0;
    const updated = await updateEstimateItem(item.id, {
      assigned_to: assignForm.assigned_to.trim(),
      quantity_assigned: qty,
      status: qty > 0 ? ('in_progress' as const) : item.status,
    });
    if (updated) {
      itemsRef.current = itemsRef.current.map((i) => (i.id === item.id ? updated : i));
      setItemsVersion((v) => v + 1);
      setAssigningId(null);
      setAssignForm({ assigned_to: '', quantity_assigned: '' });
      showNotify('Ответственный назначен', 'success');
    } else {
      showNotify('Ошибка обновления', 'error');
    }
  };

  const handleStatusChange = async (item: EstimateItem, status: EstimateItem['status']) => {
    const updated = await updateEstimateItem(item.id, { status });
    if (updated) {
      itemsRef.current = itemsRef.current.map((i) => (i.id === item.id ? updated : i));
      setItemsVersion((v) => v + 1);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить позицию?')) return;
    const ok = await deleteEstimateItem(id);
    if (ok) {
      itemsRef.current = itemsRef.current.filter((i) => i.id !== id);
      setItemsVersion((v) => v + 1);
      showNotify('Позиция удалена', 'success');
    } else {
      showNotify('Ошибка удаления', 'error');
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !estimate) return;
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      showNotify('Поддерживаются файлы Excel (.xlsx, .xls) или CSV', 'error');
      return;
    }
    setImporting(true);

    // Пробуем использовать Edge Function (рекомендуемый способ)
    try {
      const result = await importEstimateFromFile(estimate.id, file, (msg) => {
        console.log(msg);
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const list = await getEstimateItems(estimate.id);
      const sheetNote = result.importedFromSheet ? ` С листа «${result.importedFromSheet}».` : '';
      showNotify(`Импортировано позиций: ${result.added}.${sheetNote}`, 'success');
      if (result.added > 0 && list.length === 0) {
        showNotify('Данные сохранены, но список не обновился. Обновите страницу (F5).', 'error');
      }
      setImporting(false);
      e.target.value = '';
      requestAnimationFrame(() => {
        startTransition(() => {
          itemsRef.current = list;
          setItemsVersion((v) => v + 1);
        });
      });
      return;
    } catch (edgeError: any) {
      console.warn('Edge Function недоступна, используем клиентский парсинг:', edgeError);
      // Fallback на клиентский парсинг если Edge Function недоступна
    }

    // Старая логика парсинга (fallback)
    type RowInput = { name: string; unit: string; quantity: number; apartment_number?: string | null; section?: string | null; subsection?: string | null; category?: string | null };
    let importedFromSheet: string | null = null;
    const cleanEstimateName = (n: string): string => n.replace(/^[\d.]+\s*/, '').trim();
    const isOnlyNumberOrDots = (n: string) => /^[\d.\s]+$/.test(n);
    /** Не считать квартиру, если значение похоже на раздел/наименование работ (длинное или типичные слова). */
    const looksLikeSectionNotApartment = (t: string): boolean => {
      const s = t.trim();
      if (s.length > 45) return true;
      return /помещен|конструкц|в помещении|гостинн|кухн|санузл|прихож|спальн|отделк|работ[ыа]|материал|стяжк|пола\s|полу|потолк/i.test(s);
    };
    /** Распознаёт квартиру из одной ячейки: Квартира ТВ-101, Кв. 901, ТВ-101, Т-1401, № кв. 101. Длинные/разделы — не квартира. */
    const apartmentFromCell = (s: string): string | null => {
      const raw = String(s).trim();
      if (!raw) return null;
      const m1 = raw.match(/\bквартир[аыуе]?\s*(.+)?/i);
      if (m1) {
        const after = (m1[1] || '').trim() || raw;
        if (!after) return null;
        if (looksLikeSectionNotApartment(after)) return null;
        if (/^\d+\.?\d*$/.test(after)) return `Кв. ${after}`;
        if (/^(ТВ|Т)-\d+/.i.test(after)) return `Кв. ${after}`;
        return after.startsWith('Кв.') ? after : `Кв. ${after}`;
      }
      if (/^кв\.?\s+.+$/i.test(raw)) {
        const after = raw.replace(/^кв\.?\s+/i, '').trim();
        if (looksLikeSectionNotApartment(after)) return null;
        return 'Кв. ' + after;
      }
      if (/^№\s*кв\.?\s*.+$/i.test(raw)) {
        const after = raw.replace(/^№\s*кв\.?\s*/i, '').trim();
        if (looksLikeSectionNotApartment(after)) return null;
        return 'Кв. ' + after;
      }
      if (/^(ТВ|Т)-\d+/.i.test(raw)) return `Кв. ${raw}`;
      if (/помещен/i.test(raw) && !looksLikeSectionNotApartment(raw)) return raw;
      return null;
    };
    const getApartmentFromRow = (cells: (string | number | undefined)[]): string | null => {
      for (const c of cells) {
        const apt = apartmentFromCell(String(c ?? '').trim());
        if (apt) return apt;
      }
      return null;
    };
    try {
      let rows: RowInput[] = [];
      if (fileName.endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        const sep = text.includes(';') ? ';' : ',';
        const parseCells = (line: string) => line.split(sep).map((p) => p.trim().replace(/^"|"$/g, ''));
        const isMeaningfulSection = (s: string) => {
          const t = s.trim();
          if (t.length < 2) return false;
          if (/^№+$/.test(t) || /^\d+\.?\d*$/.test(t)) return false;
          if (/^[^\wа-яА-ЯёЁ]/.test(t)) return false;
          return true;
        };

        const headerRow = lines[0] ? parseCells(lines[0]) : [];
        const looksLikeHeader = headerRow.some((h) =>
          /наименован|назван|название|работ|материал|позиция|тип|марка|кол|количество|ед\.|единиц|измерен|квартир|кв\.|раздел|помещен/i.test(String(h))
        );
        const dataStart = looksLikeHeader ? 1 : 0;

        const norm = (s: string) => String(s).trim().toLowerCase();
        const findColExact = (...exact: string[]) => headerRow.findIndex((h) => exact.some((e) => norm(String(h)) === norm(e)));
        const findCol = (regex: RegExp) => headerRow.findIndex((h) => regex.test(String(h)));
        let colApt = findColExact('№ квартир');
        if (colApt < 0) colApt = findCol(/квартир|кв\.|№\s*кв|помещен|apartment/i);
        let colSection = findColExact('Разделы');
        if (colSection < 0) colSection = findCol(/^разделы?$/i);
        if (colSection < 0) colSection = findCol(/раздел/i);
        let colSubsection = findColExact('Подраздел');
        let colCategory = findColExact('Категория');
        let colName = findColExact('Наименование работы');
        if (colName < 0) colName = findCol(/наименован|назван|работ|материал|название|позиция/i);
        let colType = findCol(/тип|марка|обозначение|опросн/i);
        let colUnit = findColExact('Ед. изм.');
        if (colUnit < 0) colUnit = findCol(/ед\.|единиц|unit|измерен/i);
        let colQty = findColExact('Кол-во');
        if (colQty < 0) colQty = findCol(/кол|количество|объём|quantity|объем/i);
        let colSectionOrApt = colSection >= 0 ? colSection : colApt >= 0 ? colApt : 1;

        if (!looksLikeHeader || colName < 0) {
          colName = 4;
          colType = 5;
          colQty = 6;
          colUnit = 7;
          colSectionOrApt = 1;
          colApt = 0;
          colSection = 1;
          colSubsection = 2;
          colCategory = 3;
        }
        if (colSectionOrApt < 0) colSectionOrApt = colApt >= 0 ? colApt : 1;

        let currentApartment: string | null = null;
        let currentSection: string | null = null;
        let currentSubsection: string | null = null;
        let currentCategory: string | null = null;
        let skippedEmpty = 0;
        let skippedOnlyNumber = 0;
        let skippedNoName = 0;
        let skippedApartmentRow = 0;
        let addedRows = 0;

        const cellStr = (idx: number, parts: string[]) => (idx >= 0 && parts[idx] != null ? String(parts[idx]).trim() : '');
        const hasVal = (s: string) => s.length > 0;
        for (let i = dataStart; i < lines.length; i++) {
          const parts = parseCells(lines[i]);
          const aptFromRow = getApartmentFromRow(parts);
          if (aptFromRow !== null) {
            currentApartment = aptFromRow;
            currentSection = null;
            currentSubsection = null;
            currentCategory = null;
            skippedApartmentRow++;
            continue;
          }
          const cellSectionOrApt = String(parts[colSectionOrApt] ?? '').trim();
          const rawName = String(parts[colName] ?? '').trim();
          const apt = apartmentFromCell(cellSectionOrApt);
          if (apt !== null) {
            currentApartment = apt;
            currentSection = null;
            currentSubsection = null;
            currentCategory = null;
            skippedApartmentRow++;
            continue;
          }
          if (colSection >= 0 && hasVal(cellStr(colSection, parts))) currentSection = cellStr(colSection, parts);
          if (colSubsection >= 0 && hasVal(cellStr(colSubsection, parts))) currentSubsection = cellStr(colSubsection, parts);
          if (colCategory >= 0 && hasVal(cellStr(colCategory, parts))) currentCategory = cellStr(colCategory, parts);
          if (colSection >= 0 && !hasVal(cellStr(colSection, parts)) && cellSectionOrApt && isMeaningfulSection(cellSectionOrApt) && !apartmentFromCell(cellSectionOrApt)) currentSection = cellSectionOrApt;

          const quantity = parseFloat(String(parts[colQty] ?? '').replace(',', '.')) || 0;
          const typePart = String(parts[colType] ?? '').trim();
          const unit = String(parts[colUnit] ?? '').trim() || 'шт.';
          const colAptVal = colApt >= 0 && parts[colApt] ? String(parts[colApt]).trim() : '';
          const apartment_number = colAptVal && apartmentFromCell(colAptVal) ? apartmentFromCell(colAptVal) ?? currentApartment ?? undefined : (currentApartment ?? undefined);
          const section = currentSection ?? undefined;
          const subsection = currentSubsection ?? undefined;
          const category = currentCategory ?? undefined;

          if (!rawName || isOnlyNumberOrDots(rawName)) {
            if (!rawName) skippedEmpty++;
            else if (isOnlyNumberOrDots(rawName)) skippedOnlyNumber++;
            if (quantity > 0 && (typePart || rawName)) {
              const rescueName = typePart || (rawName ? `Позиция ${rawName}` : `Позиция ${i + 1}`);
              rows.push({ name: rescueName, unit, quantity, apartment_number, section, subsection, category });
              addedRows++;
            }
            continue;
          }
          const baseName = cleanEstimateName(rawName);
          if (!baseName) {
            if (quantity > 0 && (typePart || rawName)) {
              const rescueName = typePart || (rawName ? `Позиция ${rawName}` : `Позиция ${i + 1}`);
              rows.push({ name: rescueName, unit, quantity, apartment_number, section, subsection, category });
              addedRows++;
            } else {
              skippedNoName++;
            }
            continue;
          }
          const name = typePart ? `${baseName} (${typePart})` : baseName;
          rows.push({ name, unit, quantity, apartment_number, section, subsection, category });
          addedRows++;
        }
        console.log(`📊 CSV парсинг: всего строк в файле: ${lines.length}, обработано: ${lines.length - dataStart}, добавлено: ${addedRows}, пропущено: пустых=${skippedEmpty}, только цифры=${skippedOnlyNumber}, без названия=${skippedNoName}, строки квартир=${skippedApartmentRow}`);
      } else {
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const sheetNames: string[] = wb.SheetNames || [];
        const smetaSheet = sheetNames.find((n) => /^смета$/i.test(String(n).trim()));
        const sheetToUse = smetaSheet || sheetNames[0];
        if (smetaSheet) importedFromSheet = sheetToUse;
        if (!sheetToUse) {
          setImporting(false);
          e.target.value = '';
          showNotify('В файле нет листов', 'error');
          return;
        }
        const ws = wb.Sheets[sheetToUse];
        const raw: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (raw.length === 0) {
          setImporting(false);
          e.target.value = '';
          showNotify('Файл пустой или лист не содержит данных', 'error');
          return;
        }
        const headerRow = raw[0] || [];
        const normH = (s: string) => String(s).trim().toLowerCase();
        const findColExactH = (...exact: string[]) => headerRow.findIndex((h: unknown) => exact.some((e) => normH(String(h)) === normH(e)));
        const findColH = (regex: RegExp) => headerRow.findIndex((h: string) => regex.test(String(h)));
        let colAptExcel = findColExactH('№ квартир');
        if (colAptExcel < 0) colAptExcel = findColH(/квартир|кв\.|№\s*кв|помещен|apartment/i);
        let colSectionExcel = findColExactH('Разделы');
        if (colSectionExcel < 0) colSectionExcel = findColH(/^разделы?$/i);
        if (colSectionExcel < 0) colSectionExcel = findColH(/раздел/i);
        let colSubsectionExcel = findColExactH('Подраздел');
        let colCategoryExcel = findColExactH('Категория');
        let nameIdx = findColExactH('Наименование работы');
        if (nameIdx < 0) nameIdx = findColH(/наименован|назван|работ|материал|название|позиция/i);
        const typeIdx = findColH(/тип|марка|обозначение|опросн/i);
        let unitIdx = findColExactH('Ед. изм.');
        if (unitIdx < 0) unitIdx = findColH(/ед\.|единиц|unit|измерен/i);
        let qtyIdx = findColExactH('Кол-во');
        if (qtyIdx < 0) qtyIdx = findColH(/кол|количество|объём|quantity|объем/i);
        const colSectionOrAptExcel = colSectionExcel >= 0 ? colSectionExcel : colAptExcel >= 0 ? colAptExcel : 1;
        const colName = nameIdx >= 0 ? nameIdx : 4;
        const colType = typeIdx >= 0 ? typeIdx : 5;
        const colQty = qtyIdx >= 0 ? qtyIdx : 6;
        const colUnit = unitIdx >= 0 ? unitIdx : 7;
        const colApt = colAptExcel >= 0 ? colAptExcel : -1;
        const colSection = colSectionExcel >= 0 ? colSectionExcel : colSectionOrAptExcel;
        let currentApartment: string | null = null;
        let currentSection: string | null = null;
        let currentSubsection: string | null = null;
        let currentCategory: string | null = null;
        let skippedEmptyExcel = 0;
        let skippedOnlyNumberExcel = 0;
        let skippedNoNameExcel = 0;
        let skippedApartmentRowExcel = 0;
        let addedRowsExcel = 0;
        const isMeaningfulSection = (s: string) => {
          const t = s.trim();
          if (t.length < 2) return false;
          if (/^№+$/.test(t) || /^\d+\.?\d*$/.test(t)) return false;
          if (/^[^\wа-яА-ЯёЁ]/.test(t)) return false;
          return true;
        };
        const cellStrExcel = (idx: number, r: (string | number)[]) => (idx >= 0 && r[idx] != null ? String(r[idx]).trim() : '');
        const hasValExcel = (s: string) => s.length > 0;
        for (let i = 1; i < raw.length; i++) {
          const row = raw[i] || [];
          const aptFromRow = getApartmentFromRow(row);
          if (aptFromRow !== null) {
            currentApartment = aptFromRow;
            currentSection = null;
            currentSubsection = null;
            currentCategory = null;
            skippedApartmentRowExcel++;
            continue;
          }
          const cellSectionOrApt = String(row[colSection] ?? '').trim();
          const rawName = String(row[colName] ?? '').trim();
          const apt = apartmentFromCell(cellSectionOrApt);
          if (apt !== null) {
            currentApartment = apt;
            currentSection = null;
            currentSubsection = null;
            currentCategory = null;
            skippedApartmentRowExcel++;
            continue;
          }
          if (colSection >= 0 && hasValExcel(cellStrExcel(colSection, row))) currentSection = cellStrExcel(colSection, row);
          if (colSubsectionExcel >= 0 && hasValExcel(cellStrExcel(colSubsectionExcel, row))) currentSubsection = cellStrExcel(colSubsectionExcel, row);
          if (colCategoryExcel >= 0 && hasValExcel(cellStrExcel(colCategoryExcel, row))) currentCategory = cellStrExcel(colCategoryExcel, row);
          if (colSection >= 0 && !hasValExcel(cellStrExcel(colSection, row)) && cellSectionOrApt && isMeaningfulSection(cellSectionOrApt) && !apartmentFromCell(cellSectionOrApt)) currentSection = cellSectionOrApt;

          const val = row[colQty];
          const quantity = typeof val === 'number' ? val : parseFloat(String(val ?? '').replace(',', '.')) || 0;
          const typePart = String(row[colType] ?? '').trim();
          const unit = String(row[colUnit] ?? '').trim() || 'шт.';
          const colAptVal = colApt >= 0 && row[colApt] != null ? String(row[colApt]).trim() : '';
          const apartment_number = colAptVal && apartmentFromCell(colAptVal) ? apartmentFromCell(colAptVal) ?? currentApartment ?? undefined : (currentApartment ?? undefined);
          const section = currentSection ?? undefined;
          const subsection = currentSubsection ?? undefined;
          const category = currentCategory ?? undefined;

          if (!rawName || isOnlyNumberOrDots(rawName)) {
            if (!rawName) skippedEmptyExcel++;
            else if (isOnlyNumberOrDots(rawName)) skippedOnlyNumberExcel++;
            if (quantity > 0 && (typePart || rawName)) {
              const rescueName = typePart || (rawName ? `Позиция ${rawName}` : `Позиция ${i + 1}`);
              rows.push({ name: rescueName, unit, quantity, apartment_number, section, subsection, category });
              addedRowsExcel++;
            }
            continue;
          }
          const baseName = cleanEstimateName(rawName);
          if (!baseName) {
            if (quantity > 0 && (typePart || rawName)) {
              const rescueName = typePart || (rawName ? `Позиция ${rawName}` : `Позиция ${i + 1}`);
              rows.push({ name: rescueName, unit, quantity, apartment_number, section, subsection, category });
              addedRowsExcel++;
            } else {
              skippedNoNameExcel++;
            }
            continue;
          }
          const name = typePart ? `${baseName} (${typePart})` : baseName;
          rows.push({ name, unit, quantity, apartment_number, section, subsection, category });
          addedRowsExcel++;
        }
        console.log(`📊 Excel парсинг: всего строк в файле: ${raw.length}, обработано: ${raw.length - 1}, добавлено: ${addedRowsExcel}, пропущено: пустых=${skippedEmptyExcel}, только цифры=${skippedOnlyNumberExcel}, без названия=${skippedNoNameExcel}, строки квартир=${skippedApartmentRowExcel}`);
        if (rows.length === 0 && raw.length > 1) {
          const cApt = 0, cSection = 1, cSubsection = 2, cCategory = 3, cName = 4, cType = 5, cQty = 6, cUnit = 7;
          currentApartment = null;
          currentSection = null;
          currentSubsection = null;
          currentCategory = null;
          for (let i = 0; i < raw.length; i++) {
            const row = raw[i] || [];
            const aptFromRow = getApartmentFromRow(row);
            if (aptFromRow !== null) {
              currentApartment = aptFromRow;
              currentSection = null;
              currentSubsection = null;
              currentCategory = null;
              continue;
            }
            const cellSectionOrApt = String(row[cSection] ?? '').trim();
            const rawName = String(row[cName] ?? '').trim();
            const apt = apartmentFromCell(cellSectionOrApt);
            if (apt !== null) {
              currentApartment = apt;
              currentSection = null;
              currentSubsection = null;
              currentCategory = null;
              continue;
            }
            const sc = (idx: number) => (idx >= 0 && row[idx] != null ? String(row[idx]).trim() : '');
            if (sc(cSection)) currentSection = sc(cSection);
            if (sc(cSubsection)) currentSubsection = sc(cSubsection);
            if (sc(cCategory)) currentCategory = sc(cCategory);
            if (!sc(cSection) && cellSectionOrApt && isMeaningfulSection(cellSectionOrApt) && !apartmentFromCell(cellSectionOrApt)) currentSection = cellSectionOrApt;
            const val = row[cQty];
            const quantity = typeof val === 'number' ? val : parseFloat(String(val ?? '').replace(',', '.')) || 0;
            const typePart = String(row[cType] ?? '').trim();
            const unit = String(row[cUnit] ?? '').trim() || 'шт.';
            const section = currentSection ?? undefined;
            const subsection = currentSubsection ?? undefined;
            const category = currentCategory ?? undefined;
            if (!rawName || isOnlyNumberOrDots(rawName)) {
              if (quantity > 0) {
                const rescueName = typePart || (rawName ? `Позиция ${rawName}` : `Позиция ${i + 1}`);
                rows.push({ name: rescueName, unit, quantity, apartment_number: currentApartment ?? undefined, section, subsection, category });
              }
              continue;
            }
            const baseName = cleanEstimateName(rawName);
            if (!baseName) {
              if (quantity > 0) {
                const rescueName = typePart || (rawName ? `Позиция ${rawName}` : `Позиция ${i + 1}`);
                rows.push({ name: rescueName, unit, quantity, apartment_number: currentApartment ?? undefined, section, subsection, category });
              }
              continue;
            }
            const name = typePart ? `${baseName} (${typePart})` : baseName;
            rows.push({ name, unit, quantity, apartment_number: currentApartment ?? undefined, section, subsection, category });
          }
        }
      }
      if (rows.length === 0) {
        showNotify('В файле не найдено подходящих строк. Проверьте формат: первая строка — заголовки, дальше по одной позиции на строку. Лист «Смета» или первый.', 'error');
        setImporting(false);
        return;
      }
      console.log(`📊 Импорт сметы: распарсено ${rows.length} строк из файла`);
      const byApt = new Map<string, number>();
      rows.forEach(r => {
        const apt = r.apartment_number ?? '__none__';
        byApt.set(apt, (byApt.get(apt) || 0) + 1);
      });
      console.log(`📊 Импорт сметы: распределение по квартирам:`, Object.fromEntries(byApt));
      const added = await createEstimateItemsBatch(estimate.id, rows);
      console.log(`📊 Импорт сметы: в БД вставлено ${added} позиций`);
      const list = await getEstimateItems(estimate.id);
      console.log(`📊 Импорт сметы: из БД загружено ${list.length} позиций`);
      const byAptLoaded = new Map<string, number>();
      list.forEach(r => {
        const apt = r.apartment_number ?? '__none__';
        byAptLoaded.set(apt, (byAptLoaded.get(apt) || 0) + 1);
      });
      console.log(`📊 Импорт сметы: распределение загруженных по квартирам:`, Object.fromEntries(byAptLoaded));
      const sheetNote = importedFromSheet ? ` С листа «${importedFromSheet}».` : '';
      const totalNote = rows.length > 0 ? ` Обработано строк: ${rows.length}, добавлено: ${added}.` : '';
      showNotify(`Импортировано позиций: ${added}.${totalNote}${sheetNote}`, 'success');
      if (added > 0 && list.length === 0) {
        showNotify('Данные сохранены, но список не обновился. Обновите страницу (F5).', 'error');
      }
      setImporting(false);
      e.target.value = '';
      requestAnimationFrame(() => {
        startTransition(() => {
          itemsRef.current = list;
          setItemsVersion((v) => v + 1);
        });
      });
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || '';
      if (/apartment_number|schema cache/i.test(msg)) {
        showNotify(
          'Добавьте столбец квартиры в БД: Supabase → SQL Editor → выполните Helper2/supabase_estimate_add_apartment.sql',
          'error'
        );
      } else {
        showNotify(msg || 'Ошибка импорта. Проверьте формат файла (Excel/CSV).', 'error');
      }
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const statusLabel = (s: EstimateItem['status']) =>
    s === 'completed' ? 'Выполнено' : s === 'in_progress' ? 'В работе' : 'Не начато';
  const statusIcon = (s: EstimateItem['status']) =>
    s === 'completed' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : s === 'in_progress' ? <Clock className="w-4 h-4 text-amber-400" /> : <ClipboardList className="w-4 h-4 text-slate-400" />;

  if (!projectId) {
    return (
      <div className="p-6">
        <button onClick={onNavigateBack} className="flex items-center gap-2 text-slate-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          К проектам
        </button>
        <p className="text-slate-600">Проект не выбран.</p>
      </div>
    );
  }

  if (loading && !estimate) {
    return (
      <div className="min-h-screen bg-transparent p-4 md:p-6 flex items-center justify-center">
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400">
          <div className="w-6 h-6 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
          <span className="font-medium">Загрузка сметы…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent p-4 md:p-6">
        <button onClick={onNavigateBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">К проектам</span>
        </button>
        <div className="rounded-2xl bg-red-500/15 border border-red-500/30 p-5 text-red-200">
          <p className="font-semibold">Не удалось загрузить или создать смету</p>
          <p className="text-sm mt-1">{error}</p>
          {error.includes('Таблицы') && (
            <p className="text-sm mt-3 text-red-200/90">
              Откройте Supabase → SQL Editor → New query, вставьте содержимое файла <code className="bg-red-500/20 px-1.5 py-0.5 rounded-lg text-xs">Helper2/supabase_estimate_tables.sql</code> и нажмите Run.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6">
      {/* Шапка — в стиле карточки как в остальном приложении */}
      <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/20 shadow-[0_25px_80px_rgba(8,15,40,0.65)] p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateBack}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">К проектам</span>
            </button>
            <div className="border-l border-white/10 pl-4">
              <h1 className="text-xl md:text-2xl font-semibold text-white">Смета</h1>
              <p className="text-sm text-slate-400 mt-0.5">{projectName}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer">
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileImport} disabled={importing} />
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-sm font-medium transition-colors">
                <Upload className="w-4 h-4" />
                {importing ? 'Импорт…' : 'Импорт Excel/CSV'}
              </span>
            </label>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-500/30 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Добавить позицию
            </button>
            {items.length > 0 && (
              <button
                onClick={async () => {
                  if (!estimate) return;
                  if (!window.confirm('Удалить все позиции из текущей сметы? Это нельзя отменить.')) return;
                  const ok = await deleteAllEstimateItems(estimate.id);
                  if (ok) {
                    itemsRef.current = [];
                    setItemsVersion((v) => v + 1);
                    showNotify('Все позиции удалены', 'success');
                  } else {
                    showNotify('Не удалось удалить позиции', 'error');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Очистить смету
              </button>
            )}
            {estimate && (
              <button
                onClick={async () => {
                  if (!estimate) return;
                  if (!window.confirm('Удалить смету из системы для этого проекта? Все позиции и запись сметы будут удалены. Это нельзя отменить.')) return;
                  const ok = await deleteEstimate(estimate.id);
                  if (ok) {
                    itemsRef.current = [];
                    setItemsVersion((v) => v + 1);
                    setEstimate(null);
                    await loadEstimate();
                    showNotify('Смета удалена из системы', 'success');
                  } else {
                    showNotify('Не удалось удалить смету', 'error');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/50 bg-red-500/25 hover:bg-red-500/35 text-red-200 text-sm font-medium transition-colors"
                title="Удалить смету и все позиции из базы"
              >
                <Trash2 className="w-4 h-4" />
                Удалить смету из системы
              </button>
            )}
          </div>
        </div>
      </div>

      {importing && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-4">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-200">Идёт импорт файла</p>
            <p className="text-sm text-amber-200/90 mt-0.5">Подождите, не закрывайте страницу. Для больших файлов это может занять 1–2 минуты.</p>
          </div>
        </div>
      )}

      {notification && (
        <div
          className={`mb-6 px-4 py-3 rounded-2xl border ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
              : 'bg-red-500/15 border-red-500/30 text-red-200'
          }`}
        >
          {notification.message}
        </div>
      )}

      {items.length === 0 && !notification && (
        <div className="mb-6 p-5 md:p-6 rounded-2xl bg-white/5 border border-white/10">
          <p className="font-semibold text-white mb-3 text-base">Формат для импорта</p>
          <p className="text-slate-200 text-sm leading-relaxed">
            Шесть столбцов по порядку: 1 — номер, 2 — квартира или раздел работ, 3 — наименование работ/материалов, 4 — тип/марка, 5 — количество, 6 — ед. изм.<br />
            Квартирой — только «Квартира ТВ-101», «Квартира Т-1401»; номера 1, 1.1, 2 не считаются ни квартирой, ни разделом. Разделы — только текстовые заголовки (например «Подготовка под чистовую отделку»).<br />
            Если смета загружалась раньше: нажмите «Очистить смету» и загрузите файл снова. Лист «Смета» или первый.
          </p>
        </div>
      )}

      {/* Форма добавления позиции */}
      {showAddForm && (
        <div className="mb-6 p-5 md:p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Новая позиция</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Наименование</label>
              <input
                value={newItem.name}
                onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
                placeholder="Работа или материал"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Ед. изм.</label>
              <input
                value={newItem.unit}
                onChange={(e) => setNewItem((p) => ({ ...p, unit: e.target.value }))}
                placeholder="шт."
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Количество</label>
              <input
                value={newItem.quantity}
                onChange={(e) => setNewItem((p) => ({ ...p, quantity: e.target.value }))}
                placeholder="0"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Квартира</label>
              <input
                value={newItem.apartment}
                onChange={(e) => setNewItem((p) => ({ ...p, apartment: e.target.value }))}
                placeholder="—"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Раздел</label>
              <input
                value={newItem.section}
                onChange={(e) => setNewItem((p) => ({ ...p, section: e.target.value }))}
                placeholder="—"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Подраздел</label>
              <input
                value={newItem.subsection}
                onChange={(e) => setNewItem((p) => ({ ...p, subsection: e.target.value }))}
                placeholder="—"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Категория</label>
              <input
                value={newItem.category}
                onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}
                placeholder="—"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddItem}
                className="flex-1 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-medium text-sm transition-colors"
              >
                Сохранить
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 font-medium text-sm transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Дерево: Квартиры → Разделы → Подразделы → Категории → только наименования работ (количество, назначение, статус) */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 md:p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/10 mb-4">
              <ClipboardList className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-200 font-medium text-base">Позиций пока нет</p>
            <p className="text-slate-400 text-sm mt-1">Добавьте позицию вручную или загрузите смету из Excel/CSV</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {(() => {
              const sectionLabel = (s: string | null | undefined) => {
                if (s == null || s === '__none__') return 'Без раздела';
                const t = String(s).trim();
                if (t.length < 2 || /^№+$/.test(t) || /^\d+\.?\d*$/.test(t)) return 'Без раздела';
                return s;
              };
              const subsectionLabel = (s: string | null | undefined) => (s == null || String(s).trim() === '' || s === '__none__' ? 'Без подраздела' : String(s).trim());
              const categoryLabel = (s: string | null | undefined) => (s == null || String(s).trim() === '' || s === '__none__' ? 'Без категории' : String(s).trim());

              const toggleApt = (key: string) => setExpandedApts((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });
              const toggleSec = (key: string) => setExpandedSections((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });
              const toggleSub = (key: string) => setExpandedSubsections((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });
              const toggleCat = (key: string) => setExpandedCategories((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });

              const pl = (level: number) => ({ paddingLeft: 12 + level * 20 });
              const { apartments, itemsByApt } = treeByApartment;
              return (
                <div className="divide-y divide-white/10">
                  {apartments.map((aptKeyVal) => {
                    const aptLabel = aptKeyVal === '__none__' ? 'Без квартиры' : (/^кв\./i.test(aptKeyVal) ? aptKeyVal : /^квартира\s+/i.test(aptKeyVal) ? aptKeyVal : `Квартира ${aptKeyVal}`);
                    const aptItems = itemsByApt.get(aptKeyVal) ?? [];
                    const aptOpen = expandedApts.has(aptKeyVal);
                    const sortSec = (a: string, b: string) => (a === 'Без раздела' ? 1 : b === 'Без раздела' ? -1 : a.localeCompare(b));
                    const sortSub = (a: string, b: string) => (a === 'Без подраздела' ? 1 : b === 'Без подраздела' ? -1 : a.localeCompare(b));
                    const sortCat = (a: string, b: string) => (a === 'Без категории' ? 1 : b === 'Без категории' ? -1 : a.localeCompare(b));
                    let bySection = new Map<string, EstimateItem[]>();
                    let sections: string[] = [];
                    if (aptOpen) {
                      for (const i of aptItems) {
                        const s = sectionLabel(i.section);
                        if (!bySection.has(s)) bySection.set(s, []);
                        bySection.get(s)!.push(i);
                      }
                      sections = Array.from(bySection.keys()).sort(sortSec);
                    }
                    return (
                      <div key={aptKeyVal}>
                        <button
                          type="button"
                          onClick={() => toggleApt(aptKeyVal)}
                          className="w-full flex items-center gap-3 py-4 px-5 text-left font-semibold text-white bg-white/5 hover:bg-white/10 transition-colors border-b border-white/10"
                        >
                          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 border border-white/10 text-slate-400">
                            {aptOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </span>
                          <span>{aptLabel}</span>
                          <span className="text-sm font-normal text-slate-400">({aptItems.length} позиций)</span>
                        </button>
                        {aptOpen && (
                          <div className="bg-white/[0.02]">
                            {sections.map((secLabel) => {
                              const sk = `${aptKeyVal}|${secLabel}`;
                              const secItems = bySection.get(secLabel) ?? [];
                              const bySubsection = new Map<string, EstimateItem[]>();
                              for (const i of secItems) {
                                const s = subsectionLabel(i.subsection);
                                if (!bySubsection.has(s)) bySubsection.set(s, []);
                                bySubsection.get(s)!.push(i);
                              }
                              const subsections = Array.from(bySubsection.keys()).sort(sortSub);
                              const secOpen = expandedSections.has(sk);
                              return (
                                <div key={sk} className="border-t border-white/10">
                                  <button
                                    type="button"
                                    onClick={() => toggleSec(sk)}
                                    style={pl(1)}
                                    className="w-full flex items-center gap-3 py-3 px-4 text-left text-slate-200 bg-white/5 hover:bg-white/10 transition-colors"
                                  >
                                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-white/10 text-slate-400 shrink-0">
                                      {secOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                    </span>
                                    <span className="font-medium">{secLabel}</span>
                                  </button>
                                  {secOpen && (
                                    <>
                                      {subsections.map((subLabel) => {
                                        const subKey = `${sk}|${subLabel}`;
                                        const subItems = bySubsection.get(subLabel) ?? [];
                                        const byCategory = new Map<string, EstimateItem[]>();
                                        for (const i of subItems) {
                                          const c = categoryLabel(i.category);
                                          if (!byCategory.has(c)) byCategory.set(c, []);
                                          byCategory.get(c)!.push(i);
                                        }
                                        const categories = Array.from(byCategory.keys()).sort(sortCat);
                                        const subOpen = expandedSubsections.has(subKey);
                                        return (
                                          <div key={subKey} className="border-t border-white/10">
                                            <button
                                              type="button"
                                              onClick={() => toggleSub(subKey)}
                                              style={pl(2)}
                                              className="w-full flex items-center gap-3 py-2.5 px-4 text-left text-slate-200 bg-white/5 hover:bg-white/10 transition-colors"
                                            >
                                              <span className="flex items-center justify-center w-5 h-5 rounded bg-white/10 text-slate-400 shrink-0">
                                                {subOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                              </span>
                                              <span className="text-sm font-medium">{subLabel}</span>
                                            </button>
                                            {subOpen && (
                                              <>
                                                {categories.map((catLabel) => {
                                                  const catKey = `${subKey}|${catLabel}`;
                                                  const catItems = byCategory.get(catLabel) ?? [];
                                                  const catOpen = expandedCategories.has(catKey);
                                                  return (
                                                    <div key={catKey} className="border-t border-white/10">
                                                      <button
                                                        type="button"
                                                        onClick={() => toggleCat(catKey)}
                                                        style={pl(3)}
                                                        className="w-full flex items-center gap-3 py-2 px-4 text-left text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
                                                      >
                                                        <span className="flex items-center justify-center w-5 h-5 rounded bg-white/10 text-slate-400 shrink-0">
                                                          {catOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                        </span>
                                                        <span className="text-sm">{catLabel}</span>
                                                      </button>
                                                      {catOpen && (
                                                        <div className="overflow-x-auto border-t border-white/10">
                                                          <table className="w-full min-w-[640px]">
                                                            <thead>
                                                              <tr className="bg-slate-800/80 border-b border-white/10">
                                                                <th className="text-left py-3 px-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">Наименование работ</th>
                                                                <th className="text-left py-3 px-4 font-semibold text-slate-400 text-xs uppercase tracking-wider w-20">Ед. изм.</th>
                                                                <th className="text-right py-3 px-4 font-semibold text-slate-400 text-xs uppercase tracking-wider w-24">Количество</th>
                                                                <th className="text-left py-3 px-4 font-semibold text-slate-400 text-xs uppercase tracking-wider">Ответственный</th>
                                                                <th className="text-right py-3 px-4 font-semibold text-slate-400 text-xs uppercase tracking-wider w-20">В работе</th>
                                                                <th className="text-left py-3 px-4 font-semibold text-slate-400 text-xs uppercase tracking-wider w-28">Статус</th>
                                                                <th className="w-32 py-3 px-4 text-right font-semibold text-slate-400 text-xs uppercase tracking-wider">Действия</th>
                                                              </tr>
                                                            </thead>
                                                            <tbody>
                                                              {catItems.map((item) => (
                                                                <tr key={item.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                                                  <td className="py-3 px-4 font-medium text-white text-sm" style={pl(4)}>{item.name}</td>
                                                                  <td className="py-3 px-4 text-slate-400 text-sm">{item.unit}</td>
                                                                  <td className="py-3 px-4 text-right text-slate-200 text-sm tabular-nums">{Number(item.quantity)}</td>
                                                                  <td className="py-3 px-4 text-sm">
                                                                    {assigningId === item.id ? (
                                                                      <div className="flex flex-wrap items-center gap-2">
                                                                        <select
                                                                          value={assignForm.assigned_to}
                                                                          onChange={(e) => setAssignForm((p) => ({ ...p, assigned_to: e.target.value }))}
                                                                          className="border border-white/10 bg-white/5 rounded-lg px-2 py-1.5 text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                                                                        >
                                                                          <option value="">Кто</option>
                                                                          {ASSIGNEE_OPTIONS.map((o) => (
                                                                            <option key={o} value={o}>{o}</option>
                                                                          ))}
                                                                        </select>
                                                                        <input
                                                                          type="text"
                                                                          value={assignForm.quantity_assigned}
                                                                          onChange={(e) => setAssignForm((p) => ({ ...p, quantity_assigned: e.target.value }))}
                                                                          placeholder="Объём"
                                                                          className="w-20 border border-white/10 bg-white/5 rounded-lg px-2 py-1.5 text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                                                                        />
                                                                        <button onClick={() => handleAssign(item)} className="text-sm font-medium text-blue-300 hover:text-blue-200">Ок</button>
                                                                        <button onClick={() => setAssigningId(null)} className="text-sm text-slate-400 hover:text-white">Отмена</button>
                                                                      </div>
                                                                    ) : (
                                                                      <span className="text-slate-300">{item.assigned_to || '—'}</span>
                                                                    )}
                                                                  </td>
                                                                  <td className="py-3 px-4 text-right text-slate-300 text-sm tabular-nums">{item.quantity_assigned ? Number(item.quantity_assigned) : '—'}</td>
                                                                  <td className="py-3 px-4 text-slate-200">
                                                                    <span className="inline-flex items-center gap-1.5 text-sm">
                                                                      {statusIcon(item.status)}
                                                                      {statusLabel(item.status)}
                                                                    </span>
                                                                  </td>
                                                                  <td className="py-3 px-4">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                      <button
                                                                        onClick={() => {
                                                                          setAssigningId(item.id);
                                                                          setAssignForm({ assigned_to: item.assigned_to || '', quantity_assigned: String(item.quantity_assigned || '') });
                                                                        }}
                                                                        className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-300 transition-colors"
                                                                        title="Назначить"
                                                                      >
                                                                        <User className="w-4 h-4" />
                                                                      </button>
                                                                      <select
                                                                        value={item.status}
                                                                        onChange={(e) => handleStatusChange(item, e.target.value as EstimateItem['status'])}
                                                                        className="text-sm border border-white/10 bg-white/5 rounded-lg px-2 py-1.5 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/30"
                                                                      >
                                                                        <option value="not_started">Не начато</option>
                                                                        <option value="in_progress">В работе</option>
                                                                        <option value="completed">Выполнено</option>
                                                                      </select>
                                                                      <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-300 transition-colors" title="Удалить">
                                                                        <Trash2 className="w-4 h-4" />
                                                                      </button>
                                                                    </div>
                                                                  </td>
                                                                </tr>
                                                              ))}
                                                            </tbody>
                                                          </table>
                                                        </div>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default EstimateView;
;