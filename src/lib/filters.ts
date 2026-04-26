import type { FilterRule, RecordItem, SortRule } from '../types';

export interface RecordGroup {
  fieldId: string | null;
  label: string;
  records: RecordItem[];
  children?: RecordGroup[];
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isoDate(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

export function recordMatchesFilter(record: RecordItem, filter: FilterRule, today = new Date()): boolean {
  const raw = record.data[filter.fieldId];
  const cell = raw === null || raw === undefined ? '' : String(raw).trim();
  const target = filter.value.trim();
  if (!filter.fieldId || !filter.operator) return true;
  if (filter.operator === 'empty') return cell === '';
  if (filter.operator === 'not_empty') return cell !== '';
  if (filter.operator === 'contains') return cell.toLocaleLowerCase().includes(target.toLocaleLowerCase());
  if (filter.operator === 'equals') return cell.toLocaleLowerCase() === target.toLocaleLowerCase();
  if (filter.operator === 'not_equals') return cell.toLocaleLowerCase() !== target.toLocaleLowerCase();
  if (filter.operator === 'gt' || filter.operator === 'lt' || filter.operator === 'between') {
    const numeric = Number(cell);
    if (Number.isFinite(numeric)) {
      if (filter.operator === 'gt') return numeric > Number(target);
      if (filter.operator === 'lt') return numeric < Number(target);
      const [min, max] = target.split('..').map((part) => Number(part.trim()));
      return Number.isFinite(min) && Number.isFinite(max) && numeric >= min && numeric <= max;
    }
  }
  const cellDate = isoDate(cell);
  if (!cellDate) return false;
  if (filter.operator === 'before') return Boolean(target) && cellDate <= target;
  if (filter.operator === 'after') return Boolean(target) && cellDate >= target;
  if (filter.operator === 'between') {
    const [start, end] = target.split('..').map((part) => part.trim());
    return Boolean(start && end) && cellDate >= start && cellDate <= end;
  }
  if (filter.operator === 'next_days') {
    const days = Number.parseInt(target, 10);
    if (!Number.isFinite(days)) return false;
    const start = today.toISOString().slice(0, 10);
    const end = addDays(today, days).toISOString().slice(0, 10);
    return cellDate >= start && cellDate <= end;
  }
  return true;
}

export function applySearch(records: RecordItem[], query: string): RecordItem[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return records;
  return records.filter((record) => Object.values(record.data).some((value) => String(value ?? '').toLocaleLowerCase().includes(needle)));
}

export function groupRecords(records: RecordItem[], fieldId: string | null): Array<{ label: string; records: RecordItem[] }> {
  if (!fieldId) return [{ label: '', records }];
  const groups = new Map<string, RecordItem[]>();
  for (const record of records) {
    const label = String(record.data[fieldId] ?? '') || 'Ungrouped';
    groups.set(label, [...(groups.get(label) ?? []), record]);
  }
  return [...groups.entries()].map(([label, groupedRecords]) => ({ label, records: groupedRecords }));
}

export function groupRecordsByFields(records: RecordItem[], fieldIds: string[]): RecordGroup[] {
  const [fieldId, ...remainingFieldIds] = fieldIds.filter(Boolean);
  if (!fieldId) return [{ fieldId: null, label: '', records }];
  return groupRecords(records, fieldId).map((group) => ({
    fieldId,
    label: group.label,
    records: group.records,
    children: remainingFieldIds.length > 0 ? groupRecordsByFields(group.records, remainingFieldIds) : undefined,
  }));
}

export function applyFilters(records: RecordItem[], filters: FilterRule[]): RecordItem[] {
  if (filters.length === 0) return records;
  return records.filter((record) => filters.every((filter) => recordMatchesFilter(record, filter)));
}

function compareCell(left: unknown, right: unknown): number {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) return leftNumber - rightNumber;
  return String(left ?? '').localeCompare(String(right ?? ''), undefined, { numeric: true, sensitivity: 'base' });
}

export function applySorting(records: RecordItem[], sorts: SortRule[]): RecordItem[] {
  const activeSort = sorts.find((sort) => sort.fieldId);
  if (!activeSort) return records;
  return [...records].sort((left, right) => {
    const result = compareCell(left.data[activeSort.fieldId], right.data[activeSort.fieldId]);
    return activeSort.direction === 'desc' ? -result : result;
  });
}
