import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GridView from '../components/GridView';
import type { FieldItem, RecordItem } from '../types';

describe('date grid formatting', () => {
  it('renders and edits configured date display formats as ISO storage values', () => {
    const fields: FieldItem[] = [{ id: 'due', tableId: 'table-1', name: 'Due', fieldType: 'date', ordinal: 0, config: { dateFormat: 'dd/mm/yyyy' } }];
    const records: RecordItem[] = [{ id: 'record-1', tableId: 'table-1', data: { due: '2025-01-02' } }];
    const onCellChange = vi.fn();

    render(<GridView fields={fields} records={records} onCellChange={onCellChange} onDeleteRecord={vi.fn()} />);

    const input = screen.getByLabelText('record-1-Due');
    expect(input).toHaveValue('02/01/2025');

    fireEvent.change(input, { target: { value: '03/01/2025' } });
    expect(onCellChange).toHaveBeenCalledWith('record-1', 'due', '2025-01-03');
  });
});
