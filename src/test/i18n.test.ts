import { describe, expect, it } from 'vitest';
import { t } from '../lib/i18n';

describe('i18n messages', () => {
  it('returns Chinese labels', () => {
    expect(t('zh-CN', 'grid')).toBe('表格');
  });

  it('returns English labels', () => {
    expect(t('en-US', 'kanban')).toBe('Group View');
  });
});
