import type { ChartKind, FieldItem, RecordItem } from '../types';
import { formatFieldValue } from '../lib/dates';

interface AnalysisViewProps {
  fields: FieldItem[];
  records: RecordItem[];
  groupFieldId: string | null;
  metricFieldId: string | null;
  secondaryMetricFieldId: string | null;
  chartKind: ChartKind;
}

export interface AnalysisBucket {
  label: string;
  value: number;
  secondary: number;
}

export function buildAnalysisBuckets(records: RecordItem[], groupField: FieldItem | string, metricFieldId: string, secondaryMetricFieldId: string | null): AnalysisBucket[] {
  const groupFieldId = typeof groupField === 'string' ? groupField : groupField.id;
  const buckets = new Map<string, AnalysisBucket>();
  for (const record of records) {
    const label = typeof groupField === 'string' ? String(record.data[groupFieldId] ?? 'Ungrouped') || 'Ungrouped' : formatFieldValue(groupField, record) || 'Ungrouped';
    const bucket = buckets.get(label) ?? { label, value: 0, secondary: 0 };
    bucket.value += Number(record.data[metricFieldId] ?? 0) || 0;
    if (secondaryMetricFieldId) bucket.secondary += Number(record.data[secondaryMetricFieldId] ?? 0) || 0;
    buckets.set(label, bucket);
  }
  return [...buckets.values()].sort((left, right) => right.value - left.value);
}

export default function AnalysisView({ fields, records, groupFieldId, metricFieldId, secondaryMetricFieldId, chartKind }: AnalysisViewProps) {
  const groupField = fields.find((field) => field.id === groupFieldId) ?? fields.find((field) => ['single_select', 'text', 'bool', 'date'].includes(field.fieldType));
  const metricField = fields.find((field) => field.id === metricFieldId) ?? fields.find((field) => field.fieldType === 'number');
  const buckets = groupField && metricField ? buildAnalysisBuckets(records, groupField, metricField.id, secondaryMetricFieldId) : [];
  const maxValue = Math.max(...buckets.map((bucket) => Math.max(bucket.value, bucket.secondary)), 1);
  if (!groupField || !metricField) return <div className="empty-state">Choose one dimension and one numeric column to generate an analysis chart.</div>;

  return (
    <div className={`analysis-view ${chartKind}`}>
      <header><strong>{groupField.name}</strong><span>{metricField.name}</span></header>
      <div className="analysis-bars">
        {buckets.map((bucket) => (
          <div className="analysis-row" key={bucket.label}>
            <span>{bucket.label}</span>
            <div className="analysis-track">
              <i style={{ width: `${Math.max(4, (bucket.value / maxValue) * 100)}%` }} />
              {chartKind === 'dual' && secondaryMetricFieldId ? <b style={{ width: `${Math.max(4, (bucket.secondary / maxValue) * 100)}%` }} /> : null}
            </div>
            <strong>{bucket.value.toLocaleString()}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
