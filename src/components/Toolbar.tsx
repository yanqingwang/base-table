import type { Locale, ViewMode } from '../types';
import type { FieldItem } from '../types';

interface ToolbarProps {
  locale: Locale;
  view: ViewMode;
  onLocaleChange: (locale: Locale) => void;
  onViewChange: (view: ViewMode) => void;
  onImport: () => void;
  onExport: () => void;
  fields: FieldItem[];
  groupingFieldId: string | null;
  onGroupingFieldChange: (fieldId: string) => void;
  visibleKanbanFieldIds: string[];
  onToggleKanbanField: (fieldId: string) => void;
  labels: {
    grid: string;
    kanban: string;
    importExcel: string;
    exportData: string;
    language: string;
    groupBy: string;
    gantt: string;
    kanbanFields: string;
    transpose: string;
  };
}

export default function Toolbar({ locale, view, onLocaleChange, onViewChange, onImport, onExport, fields, groupingFieldId, onGroupingFieldChange, visibleKanbanFieldIds, onToggleKanbanField, labels }: ToolbarProps) {
  return (
    <header className="toolbar">
      <div className="view-switcher">
        <button className={view === 'grid' ? 'pill active' : 'pill'} onClick={() => onViewChange('grid')}>{labels.grid}</button>
        <button className={view === 'kanban' ? 'pill active' : 'pill'} onClick={() => onViewChange('kanban')}>{labels.kanban}</button>
        <button className={view === 'gantt' ? 'pill active' : 'pill'} onClick={() => onViewChange('gantt')}>{labels.gantt}</button>
        <button className={view === 'transpose' ? 'pill active' : 'pill'} onClick={() => onViewChange('transpose')}>{labels.transpose}</button>
      </div>
      <div className="toolbar-actions">
        {view === 'kanban' && fields.length > 0 ? (
          <label className="language-select">
            <span>{labels.groupBy}</span>
            <select value={groupingFieldId ?? ''} onChange={(event) => onGroupingFieldChange(event.target.value)}>
              {fields.filter((field) => ['single_select', 'text', 'bool'].includes(field.fieldType)).map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
            </select>
          </label>
        ) : null}
        {view === 'kanban' && fields.length > 0 ? (
          <div className="kanban-field-picker" aria-label={labels.kanbanFields}>
            {fields.map((field) => (
              <label key={field.id}><input type="checkbox" checked={visibleKanbanFieldIds.includes(field.id)} onChange={() => onToggleKanbanField(field.id)} />{field.name}</label>
            ))}
          </div>
        ) : null}
        <button className="secondary-action" onClick={onExport}>{labels.exportData}</button>
        <button className="secondary-action" onClick={onImport}>{labels.importExcel}</button>
        <label className="language-select">
          <span>{labels.language}</span>
          <select value={locale} onChange={(event) => onLocaleChange(event.target.value as Locale)}>
            <option value="zh-CN">中文</option>
            <option value="en-US">English</option>
          </select>
        </label>
      </div>
    </header>
  );
}
