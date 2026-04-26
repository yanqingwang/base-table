import type { FieldItem, RecordItem } from '../types';
import { formatNumberValue } from '../lib/formulas';
import { formatDateValue, parseDisplayedDate, toIsoDate } from '../lib/dates';

interface GridViewProps {
  fields: FieldItem[];
  records: RecordItem[];
  onCellChange: (recordId: string, fieldId: string, value: string) => void;
  onDeleteRecord: (recordId: string) => void;
  onPickAttachment?: (recordId: string, fieldId: string) => void;
}

function cellStyle(field: FieldItem, value: unknown) {
  return field.config.conditionalValue && String(value ?? '') === field.config.conditionalValue ? { background: field.config.conditionalColor ?? '#fff0c2' } : undefined;
}

function frozenStyle(fields: FieldItem[], index: number) {
  if (!fields[index]?.config.frozen) return undefined;
  const left = fields.slice(0, index).filter((field) => field.config.frozen).length * 160;
  return { left };
}

export default function GridView({ fields, records, onCellChange, onDeleteRecord, onPickAttachment }: GridViewProps) {
  return (
    <div className="grid-shell">
      <table className="data-grid">
        <thead>
          <tr>
            {fields.map((field, index) => <th key={field.id} className={field.config.frozen ? 'frozen-cell' : undefined} style={frozenStyle(fields, index)}>{field.name}</th>)}
            <th />
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              {fields.map((field, index) => (
                <td key={field.id} className={field.config.frozen ? 'frozen-cell' : undefined} style={{ ...cellStyle(field, record.data[field.id]), ...frozenStyle(fields, index) }}>
                  {field.fieldType === 'formula' || field.fieldType === 'auto_number' || field.fieldType === 'lookup' ? (
                    <output aria-label={`${record.id}-${field.name}`}>{String(record.data[field.id] ?? '')}</output>
                  ) : field.fieldType === 'multi_select' && field.config.options?.length ? (
                    <div className="multi-select-cell">
                      {field.config.options.map((option) => {
                        const selected = String(record.data[field.id] ?? '').split(',').map((item) => item.trim()).filter(Boolean);
                        return <label key={option}><input type="checkbox" checked={selected.includes(option)} onChange={() => {
                          const next = selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option];
                          onCellChange(record.id, field.id, next.join(', '));
                        }} />{option}</label>;
                      })}
                    </div>
                  ) : field.fieldType === 'single_select' && field.config.options?.length ? (
                    <select value={String(record.data[field.id] ?? '')} onChange={(event) => onCellChange(record.id, field.id, event.target.value)} aria-label={`${record.id}-${field.name}`}>
                      <option value="" />
                      {field.config.options.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : field.fieldType === 'date' && (field.config.dateFormat ?? 'yyyy-mm-dd') === 'yyyy-mm-dd' ? (
                    <input
                      type="date"
                      value={toIsoDate(String(record.data[field.id] ?? ''))}
                      onChange={(event) => onCellChange(record.id, field.id, event.target.value)}
                      aria-label={`${record.id}-${field.name}`}
                    />
                  ) : field.fieldType === 'date' ? (
                    <input
                      value={formatDateValue(record.data[field.id], field.config.dateFormat)}
                      onChange={(event) => onCellChange(record.id, field.id, parseDisplayedDate(event.target.value, field.config.dateFormat))}
                      aria-label={`${record.id}-${field.name}`}
                    />
                  ) : field.fieldType === 'attachment' ? (
                    <div className="attachment-cell"><input value={String(record.data[field.id] ?? '')} onChange={(event) => onCellChange(record.id, field.id, event.target.value)} placeholder="/path/to/file" aria-label={`${record.id}-${field.name}`} />{onPickAttachment ? <button onClick={() => onPickAttachment(record.id, field.id)}>…</button> : null}</div>
                  ) : field.fieldType === 'number' ? (
                    <>
                      <input
                        type="number"
                        step={field.config.numberFormat === 'integer' ? '1' : 'any'}
                        value={String(record.data[field.id] ?? '')}
                        onChange={(event) => onCellChange(record.id, field.id, event.target.value)}
                        aria-label={`${record.id}-${field.name}`}
                        title={formatNumberValue(record.data[field.id], field.config.numberFormat, field.config.decimalPlaces, field.config.currency)}
                      />
                      <small className="cell-format-preview">{formatNumberValue(record.data[field.id], field.config.numberFormat, field.config.decimalPlaces, field.config.currency)}</small>
                    </>
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
