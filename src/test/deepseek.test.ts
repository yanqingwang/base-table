import { describe, expect, it } from 'vitest';
import { parseDeepSeekUpdates } from '../lib/deepseek';

describe('DeepSeek structured updates', () => {
  it('accepts only supported update shapes', () => {
    expect(parseDeepSeekUpdates(JSON.stringify({ updates: [
      { type: 'column_config', fieldId: 'f1', config: { numberFormat: 'currency', currency: 'USD' } },
      { type: 'column_create', name: 'Status', fieldType: 'single_select', config: { options: ['Todo', 'Done'] } },
      { type: 'record_update', recordId: 'r1', fieldId: 'f1', value: 42 },
      { type: 'delete_everything' },
    ] }))).toHaveLength(3);
  });
});
