import type { FieldItem, FilterOperator, FilterRule, JoinRule, SortDirection, SortRule, TableItem, ViewItem } from '../types';

interface SavedViewsPanelProps {
  fields: FieldItem[];
  tables: TableItem[];
  activeTableId: string | null;
  joinTargetFields: FieldItem[];
  views: ViewItem[];
  activeViewId: string | null;
  draftFilter: FilterRule;
  draftFilters: FilterRule[];
  draftJoin: JoinRule;
  draftSort: SortRule;
  open: boolean;
  onToggleOpen: () => void;
  onActiveViewChange: (viewId: string | null) => void;
  onDraftFilterChange: (filter: FilterRule) => void;
  onAddDraftFilter: () => void;
  onRemoveDraftFilter: (index: number) => void;
  onDraftJoinChange: (join: JoinRule) => void;
  onDraftSortChange: (sort: SortRule) => void;
  onSaveView: () => void;
  onSaveJoinedView: () => void;
  onUpdateActiveView: () => void;
  onRenameView: () => void;
  onDeleteView: () => void;
  labels: {
    savedViews: string;
    allRecords: string;
    fieldName: string;
    filterOperator: string;
    filterValue: string;
    sortBy: string;
    sortDirection: string;
    saveView: string;
    saveJoinedView: string;
    updateView: string;
    rename: string;
    delete: string;
    joinedTable: string;
    baseJoinField: string;
    targetJoinField: string;
    hideSettings: string;
    showSettings: string;
  };
}

const advancedOperators: FilterOperator[] = ['contains', 'equals', 'not_equals', 'empty', 'not_empty', 'next_days', 'before', 'after', 'gt', 'lt', 'between'];

export default function SavedViewsPanel({ fields, tables, activeTableId, joinTargetFields, views, activeViewId, draftFilter, draftFilters, draftJoin, draftSort, open, onToggleOpen, onActiveViewChange, onDraftFilterChange, onAddDraftFilter, onRemoveDraftFilter, onDraftJoinChange, onDraftSortChange, onSaveView, onSaveJoinedView, onUpdateActiveView, onRenameView, onDeleteView, labels }: SavedViewsPanelProps) {
  return (
    <section className="saved-views-panel">
      <div className="panel-toggle-bar">
        <strong>{labels.savedViews}</strong>
        <button className="secondary-action" onClick={onToggleOpen}>{open ? labels.hideSettings : labels.showSettings}</button>
      </div>
      {open ? <div className="saved-views-body">
      <label className="language-select">
        <span>{labels.savedViews}</span>
        <select value={activeViewId ?? ''} onChange={(event) => onActiveViewChange(event.target.value || null)}>
          <option value="">{labels.allRecords}</option>
          {views.map((view) => <option key={view.id} value={view.id}>{view.name}</option>)}
        </select>
      </label>
      <label className="language-select">
        <span>{labels.fieldName}</span>
        <select value={draftFilter.fieldId} onChange={(event) => onDraftFilterChange({ ...draftFilter, fieldId: event.target.value })}>
          <option value="" />
          {fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
        </select>
      </label>
      <label className="language-select">
        <span>{labels.filterOperator}</span>
        <select value={draftFilter.operator} onChange={(event) => onDraftFilterChange({ ...draftFilter, operator: event.target.value as FilterOperator })}>
          {advancedOperators.map((operator) => <option key={operator} value={operator}>{operator}</option>)}
        </select>
      </label>
      <label className="language-select">
        <span>{labels.filterValue}</span>
        <input value={draftFilter.value} onChange={(event) => onDraftFilterChange({ ...draftFilter, value: event.target.value })} placeholder="High / 60 / 2026-06-01" />
      </label>
      <label className="language-select">
        <span>{labels.sortBy}</span>
        <select value={draftSort.fieldId} onChange={(event) => onDraftSortChange({ ...draftSort, fieldId: event.target.value })}>
          <option value="" />
          {fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
        </select>
      </label>
      <label className="language-select">
        <span>{labels.sortDirection}</span>
        <select value={draftSort.direction} onChange={(event) => onDraftSortChange({ ...draftSort, direction: event.target.value as SortDirection })}>
          <option value="asc">asc</option>
          <option value="desc">desc</option>
        </select>
      </label>
      <button className="secondary-action" onClick={onAddDraftFilter} disabled={!draftFilter.fieldId}>+ {labels.filterOperator}</button>
      {draftFilters.length > 0 ? <div className="filter-stack">{draftFilters.map((filter, index) => {
        const field = fields.find((item) => item.id === filter.fieldId);
        return <button key={`${filter.fieldId}-${filter.operator}-${index}`} className="filter-chip" onClick={() => onRemoveDraftFilter(index)}>{field?.name ?? filter.fieldId} {filter.operator} {filter.value || '∅'} ×</button>;
      })}</div> : null}
      <button className="secondary-action" onClick={onSaveView} disabled={!draftFilter.fieldId && draftFilters.length === 0}>{labels.saveView}</button>
      <label className="language-select">
        <span>{labels.joinedTable}</span>
        <select value={draftJoin.tableId} onChange={(event) => onDraftJoinChange({ ...draftJoin, tableId: event.target.value, targetFieldId: '' })}>
          <option value="" />
          {tables.filter((table) => table.id !== activeTableId).map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}
        </select>
      </label>
      <label className="language-select">
        <span>{labels.baseJoinField}</span>
        <select value={draftJoin.baseFieldId} onChange={(event) => onDraftJoinChange({ ...draftJoin, baseFieldId: event.target.value })}>
          <option value="" />
          {fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
        </select>
      </label>
      <label className="language-select">
        <span>{labels.targetJoinField}</span>
        <select value={draftJoin.targetFieldId} onChange={(event) => onDraftJoinChange({ ...draftJoin, targetFieldId: event.target.value })}>
          <option value="" />
          {joinTargetFields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
        </select>
      </label>
      <button className="secondary-action" onClick={onSaveJoinedView} disabled={!draftJoin.tableId || !draftJoin.baseFieldId || !draftJoin.targetFieldId}>{labels.saveJoinedView}</button>
      <button className="secondary-action" onClick={onUpdateActiveView} disabled={!activeViewId || (!draftFilter.fieldId && draftFilters.length === 0)}>{labels.updateView}</button>
      <button className="secondary-action" onClick={onRenameView} disabled={!activeViewId}>{labels.rename}</button>
      <button className="secondary-action" onClick={onDeleteView} disabled={!activeViewId}>{labels.delete}</button>
      </div> : null}
    </section>
  );
}
