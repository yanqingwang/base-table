import type { FieldItem, FieldType, RecordItem } from '../types';

const fieldTypes: FieldType[] = ['text', 'number', 'date', 'bool', 'single_select', 'multi_select', 'lookup', 'attachment', 'auto_number', 'formula'];

export interface AiColumnUpdate {
  type: 'column_config';
  fieldId: string;
  config: FieldItem['config'];
}

export interface AiColumnCreate {
  type: 'column_create';
  name: string;
  fieldType: FieldType;
  config?: FieldItem['config'];
}

export interface AiRecordUpdate {
  type: 'record_update';
  recordId: string;
  fieldId: string;
  value: string | number | boolean | null;
}

export type AiUpdate = AiColumnCreate | AiColumnUpdate | AiRecordUpdate;

interface DeepSeekResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export function parseDeepSeekUpdates(content: string): AiUpdate[] {
  const parsed = JSON.parse(content) as { updates?: unknown };
  if (!Array.isArray(parsed.updates)) return [];
  return parsed.updates.filter((item): item is AiUpdate => {
    if (!item || typeof item !== 'object') return false;
    const update = item as Record<string, unknown>;
    if (update.type === 'column_create') return typeof update.name === 'string' && fieldTypes.includes(update.fieldType as FieldType) && (update.config === undefined || (typeof update.config === 'object' && update.config !== null));
    if (update.type === 'column_config') return typeof update.fieldId === 'string' && typeof update.config === 'object' && update.config !== null;
    if (update.type === 'record_update') return typeof update.recordId === 'string' && typeof update.fieldId === 'string';
    return false;
  });
}

export async function requestDeepSeekUpdates(apiKey: string, instruction: string, fields: FieldItem[], records: RecordItem[]): Promise<AiUpdate[]> {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Return only JSON: {"updates": []}. Allowed updates: {"type":"column_create","name":"...","fieldType":"text|number|date|bool|single_select|multi_select|lookup|attachment|auto_number|formula","config":{}}, {"type":"column_config","fieldId":"...","config":{}}, or {"type":"record_update","recordId":"...","fieldId":"...","value":...}. Use column_create for new columns. For column_config and record_update, do not invent ids; use only provided ids.',
        },
        {
          role: 'user',
          content: JSON.stringify({ instruction, fields: fields.map((field) => ({ id: field.id, name: field.name, fieldType: field.fieldType, config: field.config })), records: records.slice(0, 50) }),
        },
      ],
    }),
  });
  if (!response.ok) throw new Error(`DeepSeek API failed: ${response.status}`);
  const json = await response.json() as DeepSeekResponse;
  return parseDeepSeekUpdates(json.choices?.[0]?.message?.content ?? '{"updates":[]}');
}
