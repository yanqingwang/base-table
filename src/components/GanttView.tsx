import type { FieldItem, GanttScale, RecordItem } from '../types';
import { dateTime, formatDateValue, toIsoDate } from '../lib/dates';

interface GanttViewProps {
  fields: FieldItem[];
  records: RecordItem[];
  scale: GanttScale;
  startFieldId: string | null;
  endFieldId: string | null;
}

export function periodLabel(value: string, scale: GanttScale): string {
  const iso = toIsoDate(value);
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  if (scale === 'year') return `${year}`;
  if (scale === 'quarter') return `${year} Q${Math.floor((month - 1) / 3) + 1}`;
  if (scale === 'month') return `${year}-${String(month).padStart(2, '0')}`;
  if (scale === 'week') {
    const start = new Date(year, 0, 1);
    const week = Math.ceil((((date.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
    return `${year} W${String(week).padStart(2, '0')}`;
  }
  return iso;
}

function displayPeriod(value: string | number | boolean | null | undefined, field: FieldItem, scale: GanttScale): string {
  if (scale === 'day') return formatDateValue(value, field.config.dateFormat);
  return periodLabel(String(value ?? ''), scale);
}

export function ganttBarStyle(record: RecordItem, startFieldId: string, endFieldId: string, minTime: number, maxTime: number) {
  const start = dateTime(record.data[startFieldId]) ?? minTime;
  const end = Math.max(start, dateTime(record.data[endFieldId]) ?? start);
  const span = Math.max(1, maxTime - minTime);
  const left = Math.max(0, Math.min(100, ((start - minTime) / span) * 100));
  const width = Math.max(3, Math.min(100 - left, ((end - start) / span) * 100 || 3));
  return { left: `${left}%`, width: `${width}%` };
}

export default function GanttView({ fields, records, scale, startFieldId, endFieldId }: GanttViewProps) {
  const dateFields = fields.filter((field) => field.fieldType === 'date');
  const dateField = dateFields.find((field) => field.id === startFieldId) ?? dateFields[0];
  const endField = dateFields.find((field) => field.id === endFieldId) ?? dateFields[1] ?? dateField;
  const titleField = fields.find((field) => field.fieldType === 'text') ?? fields[0];
  if (!dateField) {
    return <div className="empty-state">Add or import a date column to generate a Gantt view.</div>;
  }
  const ranges = records.flatMap((record) => {
    const start = dateTime(record.data[dateField.id]);
    const end = dateTime(record.data[endField.id]);
    if (start === null && end === null) return [];
    return [{ start: start ?? end ?? 0, end: end ?? start ?? 0 }];
  });
  const minTime = Math.min(...ranges.map((range) => Math.min(range.start, range.end)), Date.now());
  const maxTime = Math.max(...ranges.map((range) => Math.max(range.start, range.end)), minTime + 86400000);
  return (
    <div className="gantt-view">
      {records.map((record) => (
        <div className="gantt-row" key={record.id}>
          <strong>{String(record.data[titleField?.id ?? ''] ?? 'Untitled')}</strong>
          <div className="gantt-track"><span style={ganttBarStyle(record, dateField.id, endField.id, minTime, maxTime)} /></div>
          <time>{displayPeriod(record.data[dateField.id], dateField, scale)} → {displayPeriod(record.data[endField.id], endField, scale)}</time>
        </div>
      ))}
    </div>
  );
}
