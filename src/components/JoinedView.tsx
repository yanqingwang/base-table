import type { FieldItem, RecordItem } from '../types';
import { formatFieldValue } from '../lib/dates';

interface JoinedViewProps {
  fields: FieldItem[];
  records: RecordItem[];
}

export default function JoinedView({ fields, records }: JoinedViewProps) {
  return (
    <div className="grid-shell">
      <table className="data-grid">
        <thead>
          <tr>{fields.map((field) => <th key={field.id}>{field.name}</th>)}</tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>{fields.map((field) => <td key={field.id}>{formatFieldValue(field, record)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
