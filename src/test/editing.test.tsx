import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

describe('record editing flow', () => {
  afterEach(() => {
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
});
