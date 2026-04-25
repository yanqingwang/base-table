import type { FieldItem, RecordItem } from '../types';

interface TransposeViewProps {
  fields: FieldItem[];
  records: RecordItem[];
}

export default function TransposeView({ fields, records }: TransposeViewProps) {
  return (
    <div className="grid-shell">
      <table className="data-grid">
        <thead>
          <tr>
            <th>Field</th>
            {records.map((record, index) => <th key={record.id}>Record {index + 1}</th>)}
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr key={field.id}>
              <th>{field.name}</th>
              {records.map((record) => <td key={record.id}>{String(record.data[field.id] ?? '')}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
