import type { FieldItem, RecordItem } from '../types';

interface GridViewProps {
  fields: FieldItem[];
  records: RecordItem[];
  onCellChange: (recordId: string, fieldId: string, value: string) => void;
  onDeleteRecord: (recordId: string) => void;
}

export default function GridView({ fields, records, onCellChange, onDeleteRecord }: GridViewProps) {
  return (
    <div className="grid-shell">
      <table className="data-grid">
        <thead>
          <tr>
            {fields.map((field) => <th key={field.id}>{field.name}</th>)}
            <th />
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              {fields.map((field) => (
                <td key={field.id}>
                  {field.fieldType === 'single_select' && field.config.options?.length ? (
                    <select value={String(record.data[field.id] ?? '')} onChange={(event) => onCellChange(record.id, field.id, event.target.value)} aria-label={`${record.id}-${field.name}`}>
                      <option value="" />
                      {field.config.options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input
                      value={String(record.data[field.id] ?? '')}
                      onChange={(event) => onCellChange(record.id, field.id, event.target.value)}
                      aria-label={`${record.id}-${field.name}`}
                    />
                  )}
                </td>
              ))}
              <td><button onClick={() => onDeleteRecord(record.id)}>×</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
