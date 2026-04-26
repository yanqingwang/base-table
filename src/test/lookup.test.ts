import { describe, expect, it } from 'vitest';
import { applyLookupFields } from '../lib/lookup';
import type { FieldItem, RecordItem } from '../types';

describe('applyLookupFields', () => {
  it('fills lookup values from the configured target table', async () => {
    const fields: FieldItem[] = [
      { id: 'customer_code', tableId: 'orders', name: 'Customer Code', fieldType: 'text', ordinal: 0, config: {} },
      { id: 'customer_name', tableId: 'orders', name: 'Customer Name', fieldType: 'lookup', ordinal: 1, config: { lookupTableId: 'customers', lookupBaseFieldId: 'customer_code', lookupMatchFieldId: 'code', lookupValueFieldId: 'name' } },
    ];
    const records: RecordItem[] = [{ id: 'order-1', tableId: 'orders', data: { customer_code: 'C-1', customer_name: '' } }];
    const targetRecords: RecordItem[] = [{ id: 'customer-1', tableId: 'customers', data: { code: 'C-1', name: 'Acme' } }];

    const result = await applyLookupFields(records, fields, async () => targetRecords);

    expect(result.changed).toBe(true);
    expect(result.records[0].data.customer_name).toBe('Acme');
  });
});
