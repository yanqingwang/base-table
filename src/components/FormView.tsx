import type { FieldItem, RecordItem } from '../types';
import { formatFieldValue } from '../lib/dates';

interface FormViewProps {
  fields: FieldItem[];
  records: RecordItem[];
  onCellChange: (recordId: string, fieldId: string, value: string) => void;
  onCreateRecord: () => void;
}

export default function FormView({ fields, records, onCellChange, onCreateRecord }: FormViewProps) {
  return (
    <div className="form-view">
      <section className="form-card form-create-card">
        <header>New record</header>
        <p>Create a blank record, then fill it in this form view.</p>
        <button className="primary-action" onClick={onCreateRecord}>Add Record</button>
      </section>
      {records.map((record, index) => (
        <section className="form-card" key={record.id}>
          <header>Record {index + 1}</header>
          {fields.map((field) => (
            <label key={field.id}>
              <span>{field.name}</span>
              {field.fieldType === 'formula' || field.fieldType === 'auto_number' || field.fieldType === 'lookup' ? (
                <output>{formatFieldValue(field, record)}</output>
              ) : field.fieldType === 'single_select' && field.config.options?.length ? (
                <select value={String(record.data[field.id] ?? '')} onChange={(event) => onCellChange(record.id, field.id, event.target.value)}>
                  <option value="" />
                  {field.config.options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : field.fieldType === 'multi_select' && field.config.options?.length ? (
                <input value={String(record.data[field.id] ?? '')} onChange={(event) => onCellChange(record.id, field.id, event.target.value)} placeholder={field.config.options.join(', ')} />
              ) : field.fieldType === 'date' ? (
                <input type="date" value={String(record.data[field.id] ?? '')} onChange={(event) => onCellChange(record.id, field.id, event.target.value)} />
              ) : (
                <input value={String(record.data[field.id] ?? '')} onChange={(event) => onCellChange(record.id, field.id, event.target.value)} />
              )}
            </label>
          ))}
        </section>
      ))}
    </div>
  );
}
