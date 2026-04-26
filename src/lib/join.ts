import type { FieldItem, JoinRule, RecordItem, TableItem } from '../types';

export function makeJoinedFields(baseFields: FieldItem[], joinedTable: TableItem, joinedFields: FieldItem[]): FieldItem[] {
  return [
    ...baseFields,
    ...joinedFields.map((field, index) => ({ ...field, id: `join:${joinedTable.id}:${field.id}`, name: `${joinedTable.name}.${field.name}`, ordinal: baseFields.length + index })),
  ];
}

export function makeJoinedRecords(baseRecords: RecordItem[], joinedTable: TableItem, joinedRecords: RecordItem[], join: JoinRule): RecordItem[] {
  const byKey = new Map<string, RecordItem[]>();
  for (const record of joinedRecords) {
    const key = String(record.data[join.targetFieldId] ?? '').trim();
    const bucket = byKey.get(key) ?? [];
    bucket.push(record);
    byKey.set(key, bucket);
  }
  return baseRecords.flatMap((record) => {
    const key = String(record.data[join.baseFieldId] ?? '').trim();
    const matches = byKey.get(key) ?? [null];
    return matches.map((match) => ({
      id: match ? `${record.id}:${match.id}` : `${record.id}:join-empty`,
      tableId: record.tableId,
      data: {
        ...record.data,
        ...(match ? Object.fromEntries(Object.entries(match.data).map(([fieldId, value]) => [`join:${joinedTable.id}:${fieldId}`, value])) : {}),
      },
    }));
  });
}
