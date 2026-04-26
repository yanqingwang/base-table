export type FieldType = 'text' | 'number' | 'date' | 'bool' | 'single_select' | 'multi_select' | 'lookup' | 'attachment' | 'auto_number' | 'formula';
export type Locale = 'zh-CN' | 'en-US';
export type ViewMode = 'grid' | 'kanban' | 'gantt' | 'transpose' | 'analysis' | 'form' | 'dashboard';
export type ChartKind = 'column' | 'bar' | 'dual';
export type GanttScale = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type FilterOperator = 'contains' | 'equals' | 'not_equals' | 'empty' | 'not_empty' | 'next_days' | 'before' | 'after' | 'gt' | 'lt' | 'between';
export type NumberFormatKind = 'integer' | 'decimal' | 'currency' | 'percent';
export type SortDirection = 'asc' | 'desc';

export interface FieldConfig {
  options?: string[];
  validationRegex?: string;
  dateFormat?: DateFormat;
  numberFormat?: NumberFormatKind;
  decimalPlaces?: number;
  currency?: string;
  formula?: string;
  lookupTableId?: string;
  lookupBaseFieldId?: string;
  lookupMatchFieldId?: string;
  lookupValueFieldId?: string;
  conditionalValue?: string;
  conditionalColor?: string;
  frozen?: boolean;
  autoPrefix?: string;
}

export type DateFormat = 'yyyy-mm-dd' | 'yyyy/mm/dd' | 'dd/mm/yyyy' | 'mm/dd/yyyy';

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

export interface FilterRule {
  fieldId: string;
  operator: FilterOperator;
  value: string;
}

export interface JoinRule {
  tableId: string;
  baseFieldId: string;
  targetFieldId: string;
}

export interface SortRule {
  fieldId: string;
  direction: SortDirection;
}

export interface SavedViewConfig {
  filters: FilterRule[];
  joins?: JoinRule[];
  sorts?: SortRule[];
}

export interface ViewItem {
  id: string;
  tableId: string;
  name: string;
  viewType: string;
  config: SavedViewConfig;
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

export interface ImportMappingRule {
  sourceName: string;
  targetName: string;
  fieldType?: FieldType;
}

export interface ViewTemplate {
  name: string;
  viewType: string;
  config: SavedViewConfig;
}
