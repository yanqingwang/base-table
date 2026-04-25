export type FieldType = 'text' | 'number' | 'date' | 'bool' | 'single_select';
export type Locale = 'zh-CN' | 'en-US';
export type ViewMode = 'grid' | 'kanban' | 'gantt' | 'transpose';

export interface FieldConfig {
  options?: string[];
  validationRegex?: string;
}

export interface BaseItem {
  id: string;
  name: string;
  folder: string;
}

export interface TableItem {
  id: string;
  baseId: string;
  name: string;
}

export interface FieldItem {
  id: string;
  tableId: string;
  name: string;
  fieldType: FieldType;
  ordinal: number;
  config: FieldConfig;
}

export type CellValue = string | number | boolean | null;

export interface RecordItem {
  id: string;
  tableId: string;
  data: Record<string, CellValue>;
}

export interface DimensionCandidate {
  fieldId: string;
  fieldName: string;
  score: number;
}

export interface ImportResult {
  tableIds: string[];
  fieldIds: string[];
  recordIds: string[];
}
