import type { DateFormat, FieldItem, RecordItem } from '../types';

export function toIsoDate(value: string): string {
  const trimmed = value.trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (isoMatch) return trimmed;
  const slashYearMatch = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(trimmed);
  if (slashYearMatch) return `${slashYearMatch[1]}-${slashYearMatch[2]}-${slashYearMatch[3]}`;
  const dayFirstMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (dayFirstMatch) return `${dayFirstMatch[3]}-${dayFirstMatch[2]}-${dayFirstMatch[1]}`;
  return trimmed;
}

export function formatDateValue(value: string | number | boolean | null | undefined, format: DateFormat = 'yyyy-mm-dd'): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const iso = toIsoDate(raw);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return raw;
  const [, year, month, day] = match;
  if (format === 'yyyy/mm/dd') return `${year}/${month}/${day}`;
  if (format === 'dd/mm/yyyy') return `${day}/${month}/${year}`;
  if (format === 'mm/dd/yyyy') return `${month}/${day}/${year}`;
  return iso;
}

export function parseDisplayedDate(value: string, format: DateFormat = 'yyyy-mm-dd'): string {
  const trimmed = value.trim();
  if (format === 'yyyy/mm/dd') return toIsoDate(trimmed);
  const dayFirstMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (format === 'dd/mm/yyyy' && dayFirstMatch) return `${dayFirstMatch[3]}-${dayFirstMatch[2]}-${dayFirstMatch[1]}`;
  if (format === 'mm/dd/yyyy' && dayFirstMatch) return `${dayFirstMatch[3]}-${dayFirstMatch[1]}-${dayFirstMatch[2]}`;
  return toIsoDate(trimmed);
}

export function formatFieldValue(field: FieldItem, record: RecordItem): string {
  const value = record.data[field.id];
  if (field.fieldType === 'date') return formatDateValue(value, field.config.dateFormat);
  return value === null || value === undefined ? '' : String(value);
}

export function dateTime(value: string | number | boolean | null | undefined): number | null {
  const iso = toIsoDate(value === null || value === undefined ? '' : String(value));
  const timestamp = new Date(`${iso}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}
