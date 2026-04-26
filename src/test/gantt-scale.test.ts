import { describe, expect, it } from 'vitest';
import { ganttBarStyle, periodLabel } from '../components/GanttView';

describe('gantt scale labels', () => {
  it('formats date values by selected granularity', () => {
    expect(periodLabel('2026-04-25', 'day')).toBe('2026-04-25');
    expect(periodLabel('2026-04-25', 'month')).toBe('2026-04');
    expect(periodLabel('2026-04-25', 'quarter')).toBe('2026 Q2');
    expect(periodLabel('2026-04-25', 'year')).toBe('2026');
    expect(periodLabel('2026-04-25', 'week')).toMatch(/^2026 W\d{2}$/);
  });

  it('positions bars from start and end dates inside the visible range', () => {
    expect(ganttBarStyle(
      { id: 'r1', tableId: 't1', data: { start: '2026-01-06', end: '2026-01-11' } },
      'start',
      'end',
      new Date('2026-01-01T00:00:00').getTime(),
      new Date('2026-01-21T00:00:00').getTime(),
    )).toEqual({ left: '25%', width: '25%' });
  });
});
