import type { FieldItem, FieldType } from '../types';

interface FieldEditorProps {
  fields: FieldItem[];
  onCreateField: (name: string, fieldType: FieldType) => void;
  onRenameField: (fieldId: string, name: string) => void;
  onChangeFieldType: (fieldId: string, fieldType: FieldType) => void;
  onUpdateFieldOptions: (fieldId: string, options: string[]) => void;
  onUpdateFieldValidation: (fieldId: string, validationRegex: string) => void;
  onMoveField: (fieldId: string, direction: -1 | 1) => void;
  onDeleteField: (fieldId: string) => void;
  labels: {
    addField: string;
    fieldName: string;
    fieldType: string;
    options: string;
    validation: string;
  };
}

const fieldTypes: FieldType[] = ['text', 'number', 'date', 'bool', 'single_select'];

export default function FieldEditor({ fields, onCreateField, onRenameField, onChangeFieldType, onUpdateFieldOptions, onUpdateFieldValidation, onMoveField, onDeleteField, labels }: FieldEditorProps) {
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
          <button onClick={() => onUpdateFieldOptions(field.id, (window.prompt(labels.options, field.config.options?.join(',') ?? '') ?? '').split(',').map((item) => item.trim()).filter(Boolean))}>{labels.options}</button>
          <button onClick={() => onUpdateFieldValidation(field.id, window.prompt(labels.validation, field.config.validationRegex ?? '') ?? '')}>{labels.validation}</button>
          <button onClick={() => onMoveField(field.id, -1)}>↑</button>
          <button onClick={() => onMoveField(field.id, 1)}>↓</button>
          <button onClick={() => onDeleteField(field.id)}>×</button>
        </div>
      ))}
    </section>
  );
}
