import type { FieldItem, RecordItem } from '../types';
import { formatFieldValue } from '../lib/dates';

interface TransposeViewProps {
  fields: FieldItem[];
  records: RecordItem[];
  titleFieldId: string | null;
}

export default function TransposeView({ fields, records, titleFieldId }: TransposeViewProps) {
  const titleField = fields.find((field) => field.id === titleFieldId) ?? fields[0] ?? null;
  const displayFields = titleField ? fields.filter((field) => field.id !== titleField.id) : fields;

  return (
    <div className="grid-shell">
      <table className="data-grid">
        <thead>
          <tr>
            <th>Field</th>
            {records.map((record, index) => {
              const title = titleField ? formatFieldValue(titleField, record).trim() : '';
              return <th key={record.id}>{title || `Record ${index + 1}`}</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {displayFields.map((field) => (
            <tr key={field.id}>
              <th>{field.name}</th>
              {records.map((record) => <td key={record.id}>{formatFieldValue(field, record)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
