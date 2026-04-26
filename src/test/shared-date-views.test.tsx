import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import JoinedView from '../components/JoinedView';
import TransposeView from '../components/TransposeView';
import type { FieldItem, RecordItem } from '../types';

const fields: FieldItem[] = [
  { id: 'title', tableId: 't1', name: 'Title', fieldType: 'text', ordinal: 0, config: {} },
  { id: 'due', tableId: 't1', name: 'Due', fieldType: 'date', ordinal: 1, config: { dateFormat: 'dd/mm/yyyy' } },
];

const records: RecordItem[] = [
  { id: 'r1', tableId: 't1', data: { title: 'Task', due: '2026-04-25' } },
];

describe('shared date rendering in non-grid views', () => {
  it('formats dates in joined view', () => {
    const { container } = render(<JoinedView fields={fields} records={records} />);
    expect(within(container).getByText('25/04/2026')).toBeInTheDocument();
  });

  it('formats dates in transpose view', () => {
    const { container } = render(<TransposeView fields={fields} records={records} titleFieldId="title" />);
    expect(within(container).getByText('25/04/2026')).toBeInTheDocument();
  });
});
