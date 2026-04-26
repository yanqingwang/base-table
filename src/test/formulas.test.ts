import { describe, expect, it } from 'vitest';
import { applyFormulaFields, evaluateFormula, formatNumberValue } from '../lib/formulas';
import type { FieldItem, RecordItem } from '../types';

const fields: FieldItem[] = [
  { id: 'amount', tableId: 't1', name: 'Amount', fieldType: 'number', ordinal: 0, config: {} },
  { id: 'rate', tableId: 't1', name: 'Rate', fieldType: 'number', ordinal: 1, config: {} },
  { id: 'total', tableId: 't1', name: 'Total', fieldType: 'formula', ordinal: 2, config: { formula: '{Amount}*{Rate}' } },
];

const record: RecordItem = { id: 'r1', tableId: 't1', data: { amount: 20, rate: 3 } };

describe('formula and number formatting', () => {
  it('evaluates formula fields from named columns', () => {
    expect(evaluateFormula('{Amount}*{Rate}', fields, record)).toBe(60);
    expect(applyFormulaFields([record], fields)[0].data.total).toBe(60);
  });

  it('formats integer, decimal, currency, and percent numbers', () => {
    expect(formatNumberValue(12.7, 'integer')).toBe('13');
    expect(formatNumberValue(12.7, 'decimal', 1)).toBe('12.7');
    expect(formatNumberValue(0.125, 'percent', 1)).toBe('12.5%');
    expect(formatNumberValue(12.7, 'currency', 2, 'USD')).toContain('12.70');
  });
});
