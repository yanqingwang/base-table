import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

describe('record editing flow', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('creates a table field and record then edits the cell inline', async () => {
    const prompts = ['Demo Base', 'Tasks', 'Title'];
    vi.spyOn(window, 'prompt').mockImplementation(() => prompts.shift() ?? null);

    render(<App />);

    fireEvent.click(screen.getByText('新建 Base'));
    expect(await screen.findByText('Demo Base')).toBeInTheDocument();

    fireEvent.click(screen.getByText('新建表'));
    expect(await screen.findByText('Tasks')).toBeInTheDocument();

    fireEvent.click(screen.getByText('新增列'));
    expect(await screen.findByDisplayValue('Title')).toBeInTheDocument();

    fireEvent.click(screen.getByText('新增记录'));
    const cell = await screen.findByLabelText(/^record-.*-Title$/);
    fireEvent.change(cell, { target: { value: 'First task' } });

    await waitFor(() => expect(screen.getByDisplayValue('First task')).toBeInTheDocument());
  });

  it('groups records only after a field is explicitly selected', async () => {
    const prompts = ['Grouping Base', 'Tasks', 'Status', 'Priority'];
    vi.spyOn(window, 'prompt').mockImplementation(() => prompts.shift() ?? null);

    render(<App />);

    fireEvent.click(screen.getByText('新建 Base'));
    expect(await screen.findByText('Grouping Base')).toBeInTheDocument();

    fireEvent.click(screen.getByText('新建表'));
    expect(await screen.findByText('Tasks')).toBeInTheDocument();

    fireEvent.click(screen.getByText('新增列'));
    expect(await screen.findByDisplayValue('Status')).toBeInTheDocument();
    fireEvent.click(screen.getByText('新增列'));
    expect(await screen.findByDisplayValue('Priority')).toBeInTheDocument();

    fireEvent.click(screen.getByText('新增记录'));
    fireEvent.click(screen.getByText('新增记录'));
    const statusCells = await screen.findAllByLabelText(/^record-.*-Status$/);
    const priorityCells = await screen.findAllByLabelText(/^record-.*-Priority$/);
    fireEvent.change(statusCells[0], { target: { value: 'Todo' } });
    fireEvent.change(priorityCells[0], { target: { value: 'High' } });
    fireEvent.change(statusCells[1], { target: { value: 'Done' } });
    fireEvent.change(priorityCells[1], { target: { value: 'Low' } });

    fireEvent.click(screen.getByText('+ 分组'));
    expect(screen.queryByText(/Status: Todo/)).not.toBeInTheDocument();

    const groupSelect = screen.getByLabelText('1') as HTMLSelectElement;
    const statusOption = within(groupSelect).getByRole('option', { name: 'Status' }) as HTMLOptionElement;
    fireEvent.change(groupSelect, { target: { value: statusOption.value } });

    expect(await screen.findByText(/Status: Todo · 1/)).toBeInTheDocument();
    expect(screen.getByText(/Status: Done · 1/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('+ 分组'));
    const secondGroupSelect = screen.getByLabelText('2') as HTMLSelectElement;
    const priorityOption = within(secondGroupSelect).getByRole('option', { name: 'Priority' }) as HTMLOptionElement;
    fireEvent.change(secondGroupSelect, { target: { value: priorityOption.value } });

    expect(await screen.findByText(/Priority: High · 1/)).toBeInTheDocument();
    expect(screen.getByText(/Priority: Low · 1/)).toBeInTheDocument();
  });
});
