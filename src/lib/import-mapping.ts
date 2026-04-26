import type { FieldType, ImportMappingRule } from '../types';

const fieldTypes: FieldType[] = ['text', 'number', 'date', 'bool', 'single_select', 'multi_select', 'lookup', 'attachment', 'auto_number', 'formula'];

export function parseImportMapping(raw: string): ImportMappingRule[] {
  return raw.split('\n').map((line) => {
    const [sourcePart, targetPart = ''] = line.split('=');
    const [targetName, fieldType] = targetPart.split(':').map((part) => part.trim());
    const sourceName = sourcePart.trim();
    if (!sourceName || !targetName) return null;
    const rule: ImportMappingRule = { sourceName, targetName };
    if (fieldTypes.includes(fieldType as FieldType)) rule.fieldType = fieldType as FieldType;
    return rule;
  }).filter((rule): rule is ImportMappingRule => Boolean(rule));
}
