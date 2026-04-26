import type { DateFormat, FieldItem, FieldType, NumberFormatKind, TableItem } from '../types';

interface FieldEditorProps {
  fields: FieldItem[];
  tables: TableItem[];
  onCreateField: (name: string, fieldType: FieldType) => void;
  onRenameField: (fieldId: string, name: string) => void;
  onChangeFieldType: (fieldId: string, fieldType: FieldType) => void;
  onUpdateFieldOptions: (fieldId: string, options: string[]) => void;
  onUpdateFieldValidation: (fieldId: string, validationRegex: string) => void;
  onUpdateDateFormat: (fieldId: string, dateFormat: DateFormat) => void;
  onUpdateNumberFormat: (fieldId: string, numberFormat: NumberFormatKind, decimalPlaces: number, currency: string) => void;
  onUpdateFormula: (fieldId: string, formula: string) => void;
  onUpdateLookupConfig: (fieldId: string, tableId: string, baseFieldId: string, matchFieldId: string, valueFieldId: string) => void;
  onUpdateConditionalFormat: (fieldId: string, value: string, color: string) => void;
  onToggleFrozenField: (fieldId: string) => void;
  onUpdateAutoPrefix: (fieldId: string, prefix: string) => void;
  onMoveField: (fieldId: string, direction: -1 | 1) => void;
  onDeleteField: (fieldId: string) => void;
  labels: {
    addField: string;
    fieldName: string;
    fieldType: string;
    options: string;
    validation: string;
    dateFormat: string;
    dateFormatPrompt: string;
    numberFormat: string;
    formula: string;
    lookup: string;
    conditionalFormat: string;
    freezeField: string;
    autoNumber: string;
  };
}

const fieldTypes: FieldType[] = ['text', 'number', 'date', 'bool', 'single_select', 'multi_select', 'lookup', 'attachment', 'auto_number', 'formula'];
const numberFormats: NumberFormatKind[] = ['integer', 'decimal', 'currency', 'percent'];

const dateFormats: DateFormat[] = ['yyyy-mm-dd', 'yyyy/mm/dd', 'dd/mm/yyyy', 'mm/dd/yyyy'];

function normalizeDateFormat(value: string | null): DateFormat | null {
  return dateFormats.find((format) => format === value?.trim()) ?? null;
}

function normalizeNumberFormat(value: string | null): NumberFormatKind | null {
  return numberFormats.find((format) => format === value?.trim()) ?? null;
}

export default function FieldEditor({ fields, tables, onCreateField, onRenameField, onChangeFieldType, onUpdateFieldOptions, onUpdateFieldValidation, onUpdateDateFormat, onUpdateNumberFormat, onUpdateFormula, onUpdateLookupConfig, onUpdateConditionalFormat, onToggleFrozenField, onUpdateAutoPrefix, onMoveField, onDeleteField, labels }: FieldEditorProps) {
  function createField() {
    const name = window.prompt(labels.fieldName);
    if (name) {
      onCreateField(name, 'text');
    }
  }

  return (
    <section className="editor-panel">
      <div className="panel-heading">
        <strong>{labels.fieldName}</strong>
        <button onClick={createField}>{labels.addField}</button>
      </div>
      {fields.map((field) => (
        <div className="field-row" key={field.id}>
          <input value={field.name} onChange={(event) => onRenameField(field.id, event.target.value)} aria-label={`${labels.fieldName}: ${field.name}`} />
          <select value={field.fieldType} onChange={(event) => onChangeFieldType(field.id, event.target.value as FieldType)} aria-label={`${labels.fieldType}: ${field.name}`}>
            {fieldTypes.map((fieldType) => <option key={fieldType} value={fieldType}>{fieldType}</option>)}
          </select>
          {['single_select', 'multi_select'].includes(field.fieldType) ? <button onClick={() => onUpdateFieldOptions(field.id, (window.prompt(labels.options, field.config.options?.join(',') ?? '') ?? '').split(',').map((item) => item.trim()).filter(Boolean))}>{labels.options}</button> : null}
          <button onClick={() => onUpdateFieldValidation(field.id, window.prompt(labels.validation, field.config.validationRegex ?? '') ?? '')}>{labels.validation}</button>
          <button onClick={() => {
            const value = window.prompt('value to highlight', field.config.conditionalValue ?? '') ?? '';
            const color = window.prompt('color', field.config.conditionalColor ?? '#fff0c2') ?? '#fff0c2';
            onUpdateConditionalFormat(field.id, value, color);
          }}>{labels.conditionalFormat}</button>
          <button onClick={() => onToggleFrozenField(field.id)}>{labels.freezeField}</button>
          {field.fieldType === 'date' ? <button onClick={() => {
            const nextFormat = normalizeDateFormat(window.prompt(labels.dateFormatPrompt, field.config.dateFormat ?? 'yyyy-mm-dd'));
            if (nextFormat) onUpdateDateFormat(field.id, nextFormat);
          }}>{labels.dateFormat}</button> : null}
          {field.fieldType === 'number' ? <button onClick={() => {
            const nextFormat = normalizeNumberFormat(window.prompt('integer, decimal, currency, percent', field.config.numberFormat ?? 'decimal'));
            if (!nextFormat) return;
            const decimalPlaces = Number(window.prompt('decimal places', String(field.config.decimalPlaces ?? 2)) ?? '2');
            const currency = window.prompt('currency', field.config.currency ?? 'USD') ?? 'USD';
            onUpdateNumberFormat(field.id, nextFormat, Number.isFinite(decimalPlaces) ? decimalPlaces : 2, currency);
          }}>{labels.numberFormat}</button> : null}
          {field.fieldType === 'formula' ? <button onClick={() => onUpdateFormula(field.id, window.prompt('{Amount}*{Rate}', field.config.formula ?? '') ?? '')}>{labels.formula}</button> : null}
          {field.fieldType === 'lookup' ? <button onClick={() => {
            const tableHint = tables.map((table) => `${table.name}:${table.id}`).join(', ');
            const tableId = window.prompt(`${labels.lookup} table id (${tableHint})`, field.config.lookupTableId ?? '') ?? '';
            const baseFieldId = window.prompt(`${labels.lookup} base field id`, field.config.lookupBaseFieldId ?? fields[0]?.id ?? '') ?? '';
            const matchFieldId = window.prompt(`${labels.lookup} match field id`, field.config.lookupMatchFieldId ?? '') ?? '';
            const valueFieldId = window.prompt(`${labels.lookup} value field id`, field.config.lookupValueFieldId ?? '') ?? '';
            onUpdateLookupConfig(field.id, tableId, baseFieldId, matchFieldId, valueFieldId);
          }}>{labels.lookup}</button> : null}
          {field.fieldType === 'auto_number' ? <button onClick={() => onUpdateAutoPrefix(field.id, window.prompt('AUTO-', field.config.autoPrefix ?? 'AUTO-') ?? 'AUTO-')}>{labels.autoNumber}</button> : null}
          <button onClick={() => onMoveField(field.id, -1)}>↑</button>
          <button onClick={() => onMoveField(field.id, 1)}>↓</button>
          <button onClick={() => onDeleteField(field.id)}>×</button>
        </div>
      ))}
    </section>
  );
}
