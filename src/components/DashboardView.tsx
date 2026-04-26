import type { FieldItem, RecordItem } from '../types';
import { buildAnalysisBuckets } from './AnalysisView';

interface DashboardViewProps {
  fields: FieldItem[];
  records: RecordItem[];
}

export default function DashboardView({ fields, records }: DashboardViewProps) {
  const numericFields = fields.filter((field) => field.fieldType === 'number');
  const dimensionField = fields.find((field) => ['single_select', 'multi_select', 'text', 'date'].includes(field.fieldType));
  const metricField = numericFields[0];
  const buckets = dimensionField && metricField ? buildAnalysisBuckets(records, dimensionField, metricField.id, null).slice(0, 5) : [];
  const totals = numericFields.map((field) => ({ field, value: records.reduce((sum, record) => sum + (Number(record.data[field.id]) || 0), 0) }));
  return (
    <div className="dashboard-view">
      <section className="dashboard-card"><strong>Rows</strong><span>{records.length}</span></section>
      <section className="dashboard-card"><strong>Fields</strong><span>{fields.length}</span></section>
      {totals.map(({ field, value }) => <section className="dashboard-card" key={field.id}><strong>{field.name}</strong><span>{value.toLocaleString()}</span></section>)}
      {buckets.length ? <section className="dashboard-chart"><strong>{dimensionField?.name} by {metricField?.name}</strong>{buckets.map((bucket) => <div className="dashboard-bar" key={bucket.label}><span>{bucket.label}</span><i style={{ width: `${Math.max(5, bucket.value)}%` }} /><b>{bucket.value}</b></div>)}</section> : null}
    </div>
  );
}
