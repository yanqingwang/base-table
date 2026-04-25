import type { DimensionCandidate, FieldItem, RecordItem } from '../types';

interface StatsPanelProps {
  fields: FieldItem[];
  records: RecordItem[];
  candidates: DimensionCandidate[];
  label: string;
}

export default function StatsPanel({ fields, records, candidates, label }: StatsPanelProps) {
  const completeCells = records.reduce((count, record) => count + fields.filter((field) => record.data[field.id] !== '' && record.data[field.id] != null).length, 0);
  const totalCells = fields.length * records.length;
  return (
    <section className="stats-panel" aria-label={label}>
      <strong>{label}</strong>
      <span>{records.length} rows</span>
      <span>{fields.length} columns</span>
      <span>{totalCells ? Math.round((completeCells / totalCells) * 100) : 0}% filled</span>
      <span>{candidates.length} dimensions</span>
    </section>
  );
}
