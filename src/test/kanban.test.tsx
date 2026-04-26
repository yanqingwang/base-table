import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import KanbanView from '../components/KanbanView';

describe('KanbanView', () => {
  it('groups records by the selected field', () => {
    render(
      <KanbanView
        fields={[{ id: 'f-status', tableId: 't-1', name: 'Status', fieldType: 'single_select', ordinal: 0, config: {} }]}
        records={[
          { id: 'r-1', tableId: 't-1', data: { 'f-status': 'Todo' } },
          { id: 'r-2', tableId: 't-1', data: { 'f-status': 'Done' } },
          { id: 'r-3', tableId: 't-1', data: { 'f-status': '' } },
        ]}
        groupingFieldId="f-status"
        visibleFieldIds={['f-status']}
        ungroupedLabel="Ungrouped"
      />,
    );

    expect(screen.getAllByText('Todo').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Done').length).toBeGreaterThan(0);
    expect(screen.getByText('Ungrouped')).toBeInTheDocument();
  });

  it('uses configured date format on cards', () => {
    render(
      <KanbanView
        fields={[{ id: 'f-date', tableId: 't-1', name: 'Due', fieldType: 'date', ordinal: 0, config: { dateFormat: 'dd/mm/yyyy' } }]}
        records={[{ id: 'r-1', tableId: 't-1', data: { 'f-date': '2026-04-25' } }]}
        groupingFieldId="f-date"
        visibleFieldIds={['f-date']}
        ungroupedLabel="Ungrouped"
      />,
    );

    expect(screen.getAllByText(/25\/04\/2026/).length).toBeGreaterThan(0);
  });
});
