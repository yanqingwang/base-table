import { describe, expect, it } from 'vitest';
import { buildAnalysisBuckets } from '../components/AnalysisView';
import type { RecordItem } from '../types';

const records: RecordItem[] = [
  { id: 'r1', tableId: 't1', data: { status: 'Open', budget: 10, cost: 4 } },
  { id: 'r2', tableId: 't1', data: { status: 'Open', budget: 5, cost: 3 } },
  { id: 'r3', tableId: 't1', data: { status: 'Done', budget: 8, cost: 8 } },
];

describe('analysis buckets', () => {
  it('groups records by dimension and sums metrics', () => {
    expect(buildAnalysisBuckets(records, 'status', 'budget', 'cost')).toEqual([
      { label: 'Open', value: 15, secondary: 7 },
      { label: 'Done', value: 8, secondary: 8 },
    ]);
  });
});
