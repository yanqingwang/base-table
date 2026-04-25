import type { FieldItem, RecordItem } from '../types';

interface KanbanViewProps {
  fields: FieldItem[];
  records: RecordItem[];
  groupingFieldId: string | null;
  visibleFieldIds: string[];
  ungroupedLabel: string;
}

export default function KanbanView({ fields, records, groupingFieldId, visibleFieldIds, ungroupedLabel }: KanbanViewProps) {
  const groupingField = fields.find((field) => field.id === groupingFieldId) ?? fields.find((field) => ['single_select', 'text', 'bool'].includes(field.fieldType));
  const grouped = records.reduce<Record<string, RecordItem[]>>((groups, record) => {
    const rawValue = groupingField ? record.data[groupingField.id] : null;
    const label = rawValue === null || rawValue === undefined || rawValue === '' ? ungroupedLabel : String(rawValue);
    return { ...groups, [label]: [...(groups[label] ?? []), record] };
  }, {});
  if (!Object.keys(grouped).includes(ungroupedLabel)) {
    grouped[ungroupedLabel] = [];
  }

  return (
    <div className="kanban-board">
      {Object.entries(grouped).map(([label, items]) => (
        <section className="kanban-column" key={label}>
          <header><span>{label}</span><strong>{items.length}</strong></header>
          {items.map((record) => (
            <article className="kanban-card" key={record.id}>
              <strong>{cardTitle(fields, record)}</strong>
              {fields.filter((field) => visibleFieldIds.includes(field.id)).map((field) => (
                <small key={field.id}>{field.name}: {String(record.data[field.id] ?? '')}</small>
              ))}
              <small>{record.id.slice(0, 8)}</small>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}

function cardTitle(fields: FieldItem[], record: RecordItem) {
  const textField = fields.find((field) => field.fieldType === 'text') ?? fields[0];
  const value = textField ? record.data[textField.id] : null;
  return value ? String(value) : 'Untitled';
}
