import { describe, expect, it } from 'vitest';
import { parseImportMapping } from '../lib/import-mapping';

describe('parseImportMapping', () => {
  it('parses valid mapping lines and ignores incomplete lines', () => {
    expect(parseImportMapping('Due=Due Date:date\nAmount=Budget:number\nInvalid\n=Missing')).toEqual([
      { sourceName: 'Due', targetName: 'Due Date', fieldType: 'date' },
      { sourceName: 'Amount', targetName: 'Budget', fieldType: 'number' },
    ]);
  });

  it('keeps rename-only mappings when type is unknown', () => {
    expect(parseImportMapping('Owner=Assignee:person')).toEqual([{ sourceName: 'Owner', targetName: 'Assignee' }]);
  });
});
