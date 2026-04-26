import type { FieldItem, NumberFormatKind, RecordItem } from '../types';

export function formatNumberValue(value: string | number | boolean | null | undefined, kind: NumberFormatKind = 'decimal', decimalPlaces = 2, currency = 'USD'): string {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return String(value ?? '');
  if (kind === 'integer') return Math.round(numeric).toLocaleString();
  if (kind === 'currency') return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: decimalPlaces, minimumFractionDigits: decimalPlaces }).format(numeric);
  if (kind === 'percent') return `${(numeric * 100).toFixed(decimalPlaces)}%`;
  return numeric.toFixed(decimalPlaces);
}

export function evaluateFormula(formula: string, fields: FieldItem[], record: RecordItem): number | string {
  const expression = formula.replace(/\{([^}]+)\}/g, (_match, token: string) => {
    const trimmed = token.trim();
    const field = fields.find((item) => item.id === trimmed || item.name === trimmed);
    const value = Number(field ? record.data[field.id] ?? 0 : 0);
    return Number.isFinite(value) ? String(value) : '0';
  });
  if (!/^[\d+\-*/().\s]+$/.test(expression)) return '';
  try {
    const result = Function(`"use strict"; return (${expression});`)();
    return typeof result === 'number' && Number.isFinite(result) ? result : '';
  } catch {
    return '';
  }
}

export function applyFormulaFields(records: RecordItem[], fields: FieldItem[]): RecordItem[] {
  const formulaFields = fields.filter((field) => field.fieldType === 'formula' && field.config.formula?.trim());
  if (formulaFields.length === 0) return records;
  return records.map((record) => {
    const data = { ...record.data };
    for (const field of formulaFields) {
      data[field.id] = evaluateFormula(field.config.formula ?? '', fields, { ...record, data });
    }
    return { ...record, data };
  });
}

export function applyAutoNumberFields(records: RecordItem[], fields: FieldItem[]): RecordItem[] {
  const autoFields = fields.filter((field) => field.fieldType === 'auto_number');
  if (autoFields.length === 0) return records;
  return records.map((record, index) => {
    const data = { ...record.data };
    for (const field of autoFields) {
      const prefix = field.config.autoPrefix ?? 'AUTO-';
      data[field.id] = `${prefix}${String(index + 1).padStart(4, '0')}`;
    }
    return { ...record, data };
  });
}
