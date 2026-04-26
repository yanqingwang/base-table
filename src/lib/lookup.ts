import type { CellValue, FieldItem, RecordItem } from '../types';

function normalizeCellValue(value: CellValue): string {
  return value === null || value === undefined ? '' : String(value);
}

export async function applyLookupFields(records: RecordItem[], fields: FieldItem[], loadRecords: (tableId: string) => Promise<RecordItem[]>): Promise<{ changed: boolean; records: RecordItem[] }> {
  const lookupFields = fields.filter((field) => field.fieldType === 'lookup' && field.config.lookupTableId && field.config.lookupBaseFieldId && field.config.lookupMatchFieldId && field.config.lookupValueFieldId);
  if (lookupFields.length === 0 || records.length === 0) return { changed: false, records };
  const recordsByTable = new Map<string, RecordItem[]>();
  let changed = false;
  const nextRecords = records.map((record) => ({ ...record, data: { ...record.data } }));
  for (const field of lookupFields) {
    const tableId = field.config.lookupTableId;
    const baseFieldId = field.config.lookupBaseFieldId;
    const matchFieldId = field.config.lookupMatchFieldId;
    const valueFieldId = field.config.lookupValueFieldId;
    if (!tableId || !baseFieldId || !matchFieldId || !valueFieldId) continue;
    if (!recordsByTable.has(tableId)) recordsByTable.set(tableId, await loadRecords(tableId));
    const targetRecords = recordsByTable.get(tableId) ?? [];
    const valueByMatch = new Map(targetRecords.map((target) => [normalizeCellValue(target.data[matchFieldId]), target.data[valueFieldId] ?? '']));
    for (const record of nextRecords) {
      const nextValue = valueByMatch.get(normalizeCellValue(record.data[baseFieldId])) ?? '';
      if (record.data[field.id] !== nextValue) {
        record.data[field.id] = nextValue;
        changed = true;
      }
    }
  }
  return { changed, records: nextRecords };
}
