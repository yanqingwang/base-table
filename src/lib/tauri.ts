import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import type { BaseItem, DimensionCandidate, FieldItem, FieldType, ImportResult, RecordItem, TableItem } from '../types';

const browserStore = {
  bases: [] as BaseItem[],
  tables: [] as TableItem[],
  fields: [] as FieldItem[],
  records: [] as RecordItem[],
};

function canUseTauri() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function call<T>(command: string, args?: Record<string, unknown>, fallback?: () => T): Promise<T> {
  if (canUseTauri()) {
    return invoke<T>(command, args);
  }
  if (!fallback) {
    throw new Error(`No browser fallback for ${command}`);
  }
  return fallback();
}

export function createBase(name: string) {
  return call('create_base', { name }, () => {
    const base: BaseItem = { id: id('base'), name, folder: '' };
    browserStore.bases.push(base);
    return base.id;
  });
}

export function listBases() {
  return call('list_bases', {}, () => [...browserStore.bases]);
}

export function renameBase(baseId: string, name: string) {
  return call('rename_base', { baseId, name }, () => {
    browserStore.bases = browserStore.bases.map((base) => (base.id === baseId ? { ...base, name } : base));
  });
}

export function deleteBase(baseId: string) {
  return call('delete_base', { baseId }, () => {
    const tableIds = new Set(browserStore.tables.filter((table) => table.baseId === baseId).map((table) => table.id));
    browserStore.bases = browserStore.bases.filter((base) => base.id !== baseId);
    browserStore.tables = browserStore.tables.filter((table) => table.baseId !== baseId);
    browserStore.fields = browserStore.fields.filter((field) => !tableIds.has(field.tableId));
    browserStore.records = browserStore.records.filter((record) => !tableIds.has(record.tableId));
  });
}

export function moveBaseToFolder(baseId: string, folder: string) {
  return call('move_base_to_folder', { baseId, folder }, () => {
    browserStore.bases = browserStore.bases.map((base) => (base.id === baseId ? { ...base, folder } : base));
  });
}

export function createTable(baseId: string, name: string) {
  return call('create_table', { baseId, name }, () => {
    const table: TableItem = { id: id('table'), baseId, name };
    browserStore.tables.push(table);
    return table.id;
  });
}

export function listTables(baseId: string) {
  return call('list_tables', { baseId }, () => browserStore.tables.filter((table) => table.baseId === baseId));
}

export function renameTable(tableId: string, name: string) {
  return call('rename_table', { tableId, name }, () => {
    browserStore.tables = browserStore.tables.map((table) => (table.id === tableId ? { ...table, name } : table));
  });
}

export function deleteTable(tableId: string) {
  return call('delete_table', { tableId }, () => {
    browserStore.tables = browserStore.tables.filter((table) => table.id !== tableId);
    browserStore.fields = browserStore.fields.filter((field) => field.tableId !== tableId);
    browserStore.records = browserStore.records.filter((record) => record.tableId !== tableId);
  });
}

export function createField(tableId: string, name: string, fieldType: FieldType, ordinal: number) {
  return call('create_field', { tableId, name, fieldType, ordinal }, () => {
    const field: FieldItem = { id: id('field'), tableId, name, fieldType, ordinal, config: {} };
    browserStore.fields.push(field);
    return field.id;
  });
}

export function listFields(tableId: string) {
  return call('list_fields', { tableId }, () => browserStore.fields.filter((field) => field.tableId === tableId));
}

export function renameField(fieldId: string, name: string) {
  return call('rename_field', { fieldId, name }, () => {
    browserStore.fields = browserStore.fields.map((field) => (field.id === fieldId ? { ...field, name } : field));
  });
}

export function updateFieldType(fieldId: string, fieldType: FieldType) {
  return call('update_field_type', { fieldId, fieldType }, () => {
    browserStore.fields = browserStore.fields.map((field) => (field.id === fieldId ? { ...field, fieldType } : field));
  });
}

export function reorderField(fieldId: string, ordinal: number) {
  return call('reorder_field', { fieldId, ordinal }, () => {
    browserStore.fields = browserStore.fields.map((field) => (field.id === fieldId ? { ...field, ordinal } : field)).sort((left, right) => left.ordinal - right.ordinal);
  });
}

export function updateFieldConfig(fieldId: string, config: FieldItem['config']) {
  return call('update_field_config', { fieldId, config }, () => {
    browserStore.fields = browserStore.fields.map((field) => (field.id === fieldId ? { ...field, config } : field));
  });
}

export function deleteField(fieldId: string) {
  return call('delete_field', { fieldId }, () => {
    browserStore.fields = browserStore.fields.filter((field) => field.id !== fieldId);
  });
}

export function createRecord(tableId: string, data: Record<string, unknown>) {
  return call('create_record', { tableId, data }, () => {
    const record: RecordItem = { id: id('record'), tableId, data: data as RecordItem['data'] };
    browserStore.records.push(record);
    return record.id;
  });
}

export function listRecords(tableId: string) {
  return call('list_records', { tableId }, () => browserStore.records.filter((record) => record.tableId === tableId));
}

export function updateRecord(recordId: string, data: Record<string, unknown>) {
  return call('update_record', { recordId, data }, () => {
    browserStore.records = browserStore.records.map((record) => (record.id === recordId ? { ...record, data: data as RecordItem['data'] } : record));
  });
}

export function deleteRecord(recordId: string) {
  return call('delete_record', { recordId }, () => {
    browserStore.records = browserStore.records.filter((record) => record.id !== recordId);
  });
}

export function dimensionCandidates(tableId: string) {
  return call<DimensionCandidate[]>('dimension_candidates', { tableId }, () => {
    const fields = browserStore.fields.filter((field) => field.tableId === tableId);
    return fields.filter((field) => ['text', 'bool', 'single_select'].includes(field.fieldType)).map((field) => ({ fieldId: field.id, fieldName: field.name, score: 0.5 }));
  });
}

export function importWorkbook(baseId: string, path: string) {
  return call<ImportResult>('import_workbook', { baseId, path }, () => ({ tableIds: [], fieldIds: [], recordIds: [] }));
}

export function transposeTable(tableId: string) {
  return call<string>('transpose_table', { tableId }, () => id('table'));
}

export async function pickExcelFile(): Promise<string | null> {
  if (canUseTauri()) {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Excel Workbook', extensions: ['xlsx', 'xlsm', 'xls'] }],
    });
    return typeof selected === 'string' ? selected : null;
  }
  return window.prompt('Excel file path');
}

export async function saveTextFile(defaultPath: string, contents: string): Promise<boolean> {
  if (canUseTauri()) {
    const path = await save({
      defaultPath,
      filters: [{ name: 'CSV', extensions: ['csv'] }],
    });
    if (!path) return false;
    await invoke('write_text_file', { path, contents });
    return true;
  }
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = defaultPath;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
