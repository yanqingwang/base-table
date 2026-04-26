import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TransposeView from '../components/TransposeView';
import type { FieldItem, RecordItem } from '../types';

describe('transpose view', () => {
  it('uses the selected field as column titles and omits it from transposed rows', () => {
    const fields: FieldItem[] = [
      { id: 'title', tableId: 'table-1', name: 'Title', fieldType: 'text', ordinal: 0, config: {} },
      { id: 'status', tableId: 'table-1', name: 'Status', fieldType: 'text', ordinal: 1, config: {} },
    ];
    const records: RecordItem[] = [
      { id: 'record-1', tableId: 'table-1', data: { title: 'Task A', status: 'Open' } },
      { id: 'record-2', tableId: 'table-1', data: { title: 'Task B', status: 'Done' } },
    ];

    render(<TransposeView fields={fields} records={records} titleFieldId="title" />);

    expect(screen.getByRole('columnheader', { name: 'Task A' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Task B' })).toBeInTheDocument();
    expect(screen.queryByText('Title')).not.toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });
});
