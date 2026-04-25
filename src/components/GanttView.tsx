import type { FieldItem, RecordItem } from '../types';

interface GanttViewProps {
  fields: FieldItem[];
  records: RecordItem[];
}

export default function GanttView({ fields, records }: GanttViewProps) {
  const dateField = fields.find((field) => field.fieldType === 'date');
  const titleField = fields.find((field) => field.fieldType === 'text') ?? fields[0];
  if (!dateField) {
    return <div className="empty-state">Add or import a date column to generate a Gantt view.</div>;
  }
  return (
    <div className="gantt-view">
      {records.map((record) => (
        <div className="gantt-row" key={record.id}>
          <strong>{String(record.data[titleField?.id ?? ''] ?? 'Untitled')}</strong>
          <div className="gantt-track"><span /></div>
          <time>{String(record.data[dateField.id] ?? '')}</time>
        </div>
      ))}
    </div>
  );
}
