// Supabase Edge Function для импорта сметы из Excel/CSV
// Deno 1.x

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RowInput {
  name: string;
  unit: string;
  quantity: number;
  apartment_number?: string | null;
  section?: string | null;
  subsection?: string | null;
  category?: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Получаем файл из FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const estimateId = formData.get('estimate_id') as string;

    if (!file || !estimateId) {
      return new Response(
        JSON.stringify({ error: 'Отсутствует файл или estimate_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      return new Response(
        JSON.stringify({ error: 'Поддерживаются файлы Excel (.xlsx, .xls) или CSV' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Вспомогательные функции парсинга
    const cleanEstimateName = (n: string): string => n.replace(/^[\d.]+\s*/, '').trim();
    const isOnlyNumberOrDots = (n: string) => /^[\d.\s]+$/.test(n);

    const apartmentFromCell = (s: string): string | null => {
      const raw = String(s).trim();
      if (!raw) return null;
      const m1 = raw.match(/\bквартир[аыуе]?\s*(.+)?/i);
      if (m1) {
        const after = (m1[1] || '').trim() || raw;
        if (!after) return null;
        if (/^\d+\.?\d*$/.test(after)) return `Кв. ${after}`;
        if (/^(ТВ|Т)-\d+/i.test(after)) return `Кв. ${after}`;
        return after.startsWith('Кв.') ? after : `Кв. ${after}`;
      }
      if (/^кв\.?\s+.+$/i.test(raw)) return raw.replace(/^кв\.?\s+/i, 'Кв. ').trim();
      if (/^№\s*кв\.?\s*.+$/i.test(raw)) return 'Кв. ' + raw.replace(/^№\s*кв\.?\s*/i, '').trim();
      if (/^(ТВ|Т)-\d+/i.test(raw)) return `Кв. ${raw}`;
      if (/помещен/i.test(raw)) return raw;
      return null;
    };

    const getApartmentFromRow = (cells: (string | number | undefined)[]): string | null => {
      for (const c of cells) {
        const apt = apartmentFromCell(String(c ?? '').trim());
        if (apt) return apt;
      }
      return null;
    };

    let rows: RowInput[] = [];
    let importedFromSheet: string | null = null;
    const totalRowsInFile = 0;

    if (fileName.endsWith('.csv')) {
      // Парсинг CSV
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
      const colSubsection = findColExact('Подраздел');
      const colCategory = findColExact('Категория');
      let colName = findColExact('Наименование работы');
      if (colName < 0) colName = findCol(/наименован|назван|работ|материал|название|позиция/i);
      const colType = findCol(/тип|марка|обозначение|опросн/i);
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
      }
      if (colSectionOrApt < 0) colSectionOrApt = colApt >= 0 ? colApt : 1;

      let currentApartment: string | null = null;
      let currentSection: string | null = null;
      let currentSubsection: string | null = null;
      let currentCategory: string | null = null;
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
          if (quantity > 0 && (typePart || rawName)) {
            const rescueName = typePart || (rawName ? `Позиция ${rawName}` : `Позиция ${i + 1}`);
            rows.push({ name: rescueName, unit, quantity, apartment_number, section, subsection, category });
          }
          continue;
        }
        const baseName = cleanEstimateName(rawName);
        if (!baseName) {
          if (quantity > 0 && (typePart || rawName)) {
            const rescueName = typePart || (rawName ? `Позиция ${rawName}` : `Позиция ${i + 1}`);
            rows.push({ name: rescueName, unit, quantity, apartment_number, section, subsection, category });
          }
          continue;
        }
        const name = typePart ? `${baseName} (${typePart})` : baseName;
        rows.push({ name, unit, quantity, apartment_number, section, subsection, category });
      }
    } else {
      // Парсинг Excel
      const XLSX = await import('https://esm.sh/xlsx@0.18.5');
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const sheetNames: string[] = wb.SheetNames || [];
      const smetaSheet = sheetNames.find((n) => /^смета$/i.test(String(n).trim()));
      const sheetToUse = smetaSheet || sheetNames[0];
      if (smetaSheet) importedFromSheet = sheetToUse;
      if (!sheetToUse) {
        return new Response(
          JSON.stringify({ error: 'В файле нет листов' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const ws = wb.Sheets[sheetToUse];
      const raw: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (raw.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Файл пустой или лист не содержит данных' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
      const colSubsectionExcel = findColExactH('Подраздел');
      const colCategoryExcel = findColExactH('Категория');
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
          if (quantity > 0 && (typePart || rawName)) {
            const rescueName = typePart || (rawName ? `Позиция ${rawName}` : `Позиция ${i + 1}`);
            rows.push({ name: rescueName, unit, quantity, apartment_number, section, subsection, category });
          }
          continue;
        }
        const baseName = cleanEstimateName(rawName);
        if (!baseName) {
          if (quantity > 0 && (typePart || rawName)) {
            const rescueName = typePart || (rawName ? `Позиция ${rawName}` : `Позиция ${i + 1}`);
            rows.push({ name: rescueName, unit, quantity, apartment_number, section, subsection, category });
          }
          continue;
        }
        const name = typePart ? `${baseName} (${typePart})` : baseName;
        rows.push({ name, unit, quantity, apartment_number, section, subsection, category });
      }

      // Fallback парсинг если ничего не найдено
      if (rows.length === 0 && raw.length > 1) {
        const cSectionOrApt = 1;
        const cName = 2;
        const cType = 3;
        const cQty = 4;
        const cUnit = 5;
        currentApartment = null;
        currentSection = null;
        for (let i = 0; i < raw.length; i++) {
          const row = raw[i] || [];
          const aptFromRow = getApartmentFromRow(row);
          if (aptFromRow !== null) {
            currentApartment = aptFromRow;
            currentSection = null;
            continue;
          }
          const cellSectionOrApt = String(row[cSectionOrApt] ?? '').trim();
          const rawName = String(row[cName] ?? '').trim();
          const apt = apartmentFromCell(cellSectionOrApt);
          if (apt !== null) {
            currentApartment = apt;
            currentSection = null;
            continue;
          }
          const val = row[cQty];
          const quantity = typeof val === 'number' ? val : parseFloat(String(val ?? '').replace(',', '.')) || 0;
          const typePart = String(row[cType] ?? '').trim();
          const unit = String(row[cUnit] ?? '').trim() || 'шт.';
          if (!rawName || isOnlyNumberOrDots(rawName)) {
            if (cellSectionOrApt && isMeaningfulSection(cellSectionOrApt) && !apartmentFromCell(cellSectionOrApt)) currentSection = cellSectionOrApt;
            if (quantity > 0) {
              const rescueName = typePart || (rawName ? `Позиция ${rawName}` : `Позиция ${i + 1}`);
              rows.push({ name: rescueName, unit, quantity, apartment_number: currentApartment ?? undefined, section: currentSection ?? undefined });
            }
            continue;
          }
          const baseName = cleanEstimateName(rawName);
          if (!baseName) {
            if (quantity > 0) {
              const rescueName = typePart || (rawName ? `Позиция ${rawName}` : `Позиция ${i + 1}`);
              rows.push({ name: rescueName, unit, quantity, apartment_number: currentApartment ?? undefined, section: currentSection ?? undefined });
            }
            continue;
          }
          if (cellSectionOrApt && isMeaningfulSection(cellSectionOrApt) && !apartmentFromCell(cellSectionOrApt)) currentSection = cellSectionOrApt;
          const name = typePart ? `${baseName} (${typePart})` : baseName;
          rows.push({ name, unit, quantity, apartment_number: currentApartment ?? undefined, section: currentSection ?? undefined });
        }
      }
    }

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'В файле не найдено подходящих строк. Проверьте формат файла.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Подготовка данных для вставки
    const BATCH_SIZE = 100;
    const toInsert = rows
      .map((item, idx) => ({
        estimate_id: estimateId,
        name: (item.name || '').trim(),
        unit: (item.unit || '').trim() || 'шт.',
        quantity: Number(item.quantity) || 0,
        apartment_number: item.apartment_number ?? null,
        section: item.section ?? null,
        subsection: item.subsection ?? null,
        category: item.category ?? null,
        sort_order: idx,
        quantity_assigned: 0,
        status: 'not_started'
      }))
      .filter((row) => row.name.length > 0);

    // Вставка батчами
    let added = 0;
    let chunk: typeof toInsert = [];
    let prevApartment: string | null = null;

    const flush = async (aptLabel?: string) => {
      if (chunk.length === 0) return;
      const { data, error } = await supabaseClient
        .from('estimate_items')
        .insert(chunk)
        .select('id');
      if (error) {
        console.error('createEstimateItemsBatch chunk error:', error);
        throw error;
      }
      const inserted = data?.length ?? 0;
      added += inserted;
      chunk = [];
    };

    for (const row of toInsert) {
      const apt = row.apartment_number ?? '__none__';
      if (chunk.length >= BATCH_SIZE) await flush(prevApartment || undefined);
      if (chunk.length > 0 && apt !== prevApartment) await flush(prevApartment || undefined);
      chunk.push(row);
      prevApartment = apt;
    }
    await flush(prevApartment || undefined);

    return new Response(
      JSON.stringify({
        success: true,
        added,
        total: rows.length,
        importedFromSheet,
        message: `Импортировано позиций: ${added}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Ошибка импорта сметы' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
