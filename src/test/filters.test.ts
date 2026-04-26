import { describe, expect, it, vi } from 'vitest';
import { applyFilters, applySorting, groupRecordsByFields } from '../lib/filters';
import type { RecordItem } from '../types';

describe('saved view filters', () => {
  it('filters records for the next configured number of days', () => {
    vi.setSystemTime(new Date('2026-04-25T00:00:00Z'));
    const records: RecordItem[] = [
      { id: 'soon', tableId: 'events', data: { due: '2026-05-10' } },
      { id: 'later', tableId: 'events', data: { due: '2026-08-01' } },
    ];

    const filtered = applyFilters(records, [{ fieldId: 'due', operator: 'next_days', value: '60' }]);

    expect(filtered.map((record) => record.id)).toEqual(['soon']);
    vi.useRealTimers();
  });

  it('filters high priority records by equality', () => {
    const records: RecordItem[] = [
      { id: 'high', tableId: 'tasks', data: { priority: 'High' } },
      { id: 'low', tableId: 'tasks', data: { priority: 'Low' } },
    ];

    const filtered = applyFilters(records, [{ fieldId: 'priority', operator: 'equals', value: 'high' }]);

    expect(filtered.map((record) => record.id)).toEqual(['high']);
  });

  it('sorts saved view records by numeric fields', () => {
    const records: RecordItem[] = [
      { id: 'small', tableId: 'tasks', data: { amount: 2 } },
      { id: 'large', tableId: 'tasks', data: { amount: 10 } },
    ];

    expect(applySorting(records, [{ fieldId: 'amount', direction: 'desc' }]).map((record) => record.id)).toEqual(['large', 'small']);
  });

  it('groups records by multiple fields in order', () => {
    const records: RecordItem[] = [
      { id: 'todo-high', tableId: 'tasks', data: { status: 'Todo', priority: 'High' } },
      { id: 'todo-low', tableId: 'tasks', data: { status: 'Todo', priority: 'Low' } },
      { id: 'done-high', tableId: 'tasks', data: { status: 'Done', priority: 'High' } },
    ];

    const groups = groupRecordsByFields(records, ['status', 'priority']);

    expect(groups.map((group) => group.label)).toEqual(['Todo', 'Done']);
    expect(groups[0].children?.map((group) => group.label)).toEqual(['High', 'Low']);
    expect(groups[0].children?.[0].records.map((record) => record.id)).toEqual(['todo-high']);
  });
});
