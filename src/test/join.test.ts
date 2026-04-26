import { describe, expect, it } from 'vitest';
import { makeJoinedFields, makeJoinedRecords } from '../lib/join';
import type { FieldItem, RecordItem, TableItem } from '../types';

describe('joined saved views', () => {
  it('builds a left-joined read-only record set from two tables', () => {
    const taskFields: FieldItem[] = [{ id: 'owner', tableId: 'tasks', name: 'Owner', fieldType: 'text', ordinal: 0, config: {} }];
    const peopleTable: TableItem = { id: 'people', baseId: 'base', name: 'People' };
    const peopleFields: FieldItem[] = [{ id: 'name', tableId: 'people', name: 'Name', fieldType: 'text', ordinal: 0, config: {} }, { id: 'team', tableId: 'people', name: 'Team', fieldType: 'text', ordinal: 1, config: {} }];
    const tasks: RecordItem[] = [{ id: 'task-1', tableId: 'tasks', data: { owner: 'Alice' } }];
    const people: RecordItem[] = [{ id: 'person-1', tableId: 'people', data: { name: 'Alice', team: 'Ops' } }];

    const fields = makeJoinedFields(taskFields, peopleTable, peopleFields);
    const records = makeJoinedRecords(tasks, peopleTable, people, { tableId: 'people', baseFieldId: 'owner', targetFieldId: 'name' });

    expect(fields.map((field) => field.name)).toEqual(['Owner', 'People.Name', 'People.Team']);
    expect(records[0].data['join:people:team']).toBe('Ops');
  });
});
