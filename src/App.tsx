import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import FieldEditor from './components/FieldEditor';
import GanttView from './components/GanttView';
import GridView from './components/GridView';
import KanbanView from './components/KanbanView';
import RecordEditor from './components/RecordEditor';
import Sidebar from './components/Sidebar';
import StatsPanel from './components/StatsPanel';
import Toolbar from './components/Toolbar';
import TransposeView from './components/TransposeView';
import { t } from './lib/i18n';
import * as api from './lib/tauri';
import type { BaseItem, DimensionCandidate, FieldItem, FieldType, Locale, RecordItem, TableItem, ViewMode } from './types';

function csvCell(value: string | number | boolean | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildCsv(fields: FieldItem[], records: RecordItem[]): string {
  const header = fields.map((field) => csvCell(field.name)).join(',');
  const rows = records.map((record) => fields.map((field) => csvCell(record.data[field.id])).join(','));
  return [header, ...rows].join('\n');
}

function safeFileName(name: string): string {
  const cleaned = name.trim().replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/g, '');
  return cleaned || 'base-table-export';
}

export default function App() {
  const [locale, setLocale] = useState<Locale>('zh-CN');
  const [view, setView] = useState<ViewMode>('grid');
  const [bases, setBases] = useState<BaseItem[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [candidates, setCandidates] = useState<DimensionCandidate[]>([]);
  const [activeBaseId, setActiveBaseId] = useState<string | null>(null);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [manualGroupingFieldId, setManualGroupingFieldId] = useState<string | null>(null);
  const [visibleKanbanFieldIds, setVisibleKanbanFieldIds] = useState<string[]>([]);
  const [fieldSettingsOpen, setFieldSettingsOpen] = useState(true);
  const [fieldSettingsWidth, setFieldSettingsWidth] = useState(640);

  useEffect(() => {
    api.listBases().then((items) => {
      setBases(items);
      setActiveBaseId((current) => current ?? items[0]?.id ?? null);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!activeBaseId) {
      setTables([]);
      return;
    }
    api.listTables(activeBaseId).then((items) => {
      setTables(items);
      setActiveTableId((current) => (current && items.some((item) => item.id === current) ? current : items[0]?.id ?? null));
    }).catch(console.error);
  }, [activeBaseId]);

  useEffect(() => {
    void refreshTable();
  }, [activeTableId]);

  async function refreshTable() {
    if (!activeTableId) {
      setFields([]);
      setRecords([]);
      setCandidates([]);
      return;
    }
    const [nextFields, nextRecords, nextCandidates] = await Promise.all([
      api.listFields(activeTableId),
      api.listRecords(activeTableId),
      api.dimensionCandidates(activeTableId),
    ]);
    setFields(nextFields);
    setRecords(nextRecords);
    setCandidates(nextCandidates);
  }

  async function handleCreateBase() {
    const name = window.prompt(t(locale, 'newBase'));
    if (!name) return;
    const id = await api.createBase(name);
    const base = { id, name, folder: '' };
    setBases((current) => [...current, base]);
    setActiveBaseId(id);
  }

  async function handleCreateTable() {
    if (!activeBaseId) return;
    const name = window.prompt(t(locale, 'newTable'));
    if (!name) return;
    const id = await api.createTable(activeBaseId, name);
    const table = { id, baseId: activeBaseId, name };
    setTables((current) => [...current, table]);
    setActiveTableId(id);
  }

  async function handleRenameBase(baseId: string) {
    const current = bases.find((base) => base.id === baseId);
    const name = window.prompt(t(locale, 'rename'), current?.name ?? '');
    if (!name) return;
    await api.renameBase(baseId, name);
    setBases((items) => items.map((base) => (base.id === baseId ? { ...base, name } : base)));
  }

  async function handleDeleteBase(baseId: string) {
    await api.deleteBase(baseId);
    setBases((items) => items.filter((base) => base.id !== baseId));
    if (activeBaseId === baseId) {
      const nextBase = bases.find((base) => base.id !== baseId) ?? null;
      setActiveBaseId(nextBase?.id ?? null);
      setActiveTableId(null);
    }
  }

  async function handleMoveBase(baseId: string) {
    const current = bases.find((base) => base.id === baseId);
    const folder = window.prompt(t(locale, 'moveFolder'), current?.folder ?? '');
    if (folder === null) return;
    await api.moveBaseToFolder(baseId, folder);
    setBases((items) => items.map((base) => (base.id === baseId ? { ...base, folder } : base)));
  }

  async function handleRenameTable(tableId: string) {
    const current = tables.find((table) => table.id === tableId);
    const name = window.prompt(t(locale, 'rename'), current?.name ?? '');
    if (!name) return;
    await api.renameTable(tableId, name);
    setTables((items) => items.map((table) => (table.id === tableId ? { ...table, name } : table)));
  }

  async function handleDeleteTable(tableId: string) {
    await api.deleteTable(tableId);
    const nextTables = tables.filter((table) => table.id !== tableId);
    setTables(nextTables);
    if (activeTableId === tableId) {
      setActiveTableId(nextTables[0]?.id ?? null);
    }
  }

  async function handleCreateField(name: string, fieldType: FieldType) {
    if (!activeTableId) return;
    const id = await api.createField(activeTableId, name, fieldType, fields.length);
    setFields((current) => [...current, { id, tableId: activeTableId, name, fieldType, ordinal: current.length, config: {} }]);
  }

  async function handleRenameField(fieldId: string, name: string) {
    setFields((current) => current.map((field) => (field.id === fieldId ? { ...field, name } : field)));
    await api.renameField(fieldId, name);
  }

  async function handleChangeFieldType(fieldId: string, fieldType: FieldType) {
    await api.updateFieldType(fieldId, fieldType);
    setFields((current) => current.map((field) => (field.id === fieldId ? { ...field, fieldType } : field)));
    setCandidates(await api.dimensionCandidates(activeTableId ?? ''));
  }

  async function handleUpdateFieldOptions(fieldId: string, options: string[]) {
    const field = fields.find((item) => item.id === fieldId);
    if (!field) return;
    const config = { ...field.config, options };
    await api.updateFieldConfig(fieldId, config);
    setFields((current) => current.map((item) => (item.id === fieldId ? { ...item, config } : item)));
  }

  async function handleUpdateFieldValidation(fieldId: string, validationRegex: string) {
    const field = fields.find((item) => item.id === fieldId);
    if (!field) return;
    const config = { ...field.config, validationRegex };
    await api.updateFieldConfig(fieldId, config);
    setFields((current) => current.map((item) => (item.id === fieldId ? { ...item, config } : item)));
  }

  async function handleMoveField(fieldId: string, direction: -1 | 1) {
    const index = fields.findIndex((field) => field.id === fieldId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= fields.length) return;
    const reordered = [...fields];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const normalized = reordered.map((field, ordinal) => ({ ...field, ordinal }));
    setFields(normalized);
    await Promise.all(normalized.map((field) => api.reorderField(field.id, field.ordinal)));
  }

  async function handleDeleteField(fieldId: string) {
    await api.deleteField(fieldId);
    setFields((current) => current.filter((field) => field.id !== fieldId));
  }

  async function handleCreateRecord() {
    if (!activeTableId) return;
    const data = Object.fromEntries(fields.map((field) => [field.id, '']));
    const id = await api.createRecord(activeTableId, data);
    setRecords((current) => [...current, { id, tableId: activeTableId, data }]);
  }

  async function handleCellChange(recordId: string, fieldId: string, value: string) {
    const record = records.find((item) => item.id === recordId);
    if (!record) return;
    const field = fields.find((item) => item.id === fieldId);
    if (field?.config.validationRegex) {
      const regex = new RegExp(field.config.validationRegex);
      if (!regex.test(value)) {
        window.alert(`${field.name} ${t(locale, 'validation')}`);
        return;
      }
    }
    const data = { ...record.data, [fieldId]: value };
    setRecords((current) => current.map((item) => (item.id === recordId ? { ...item, data } : item)));
    await api.updateRecord(recordId, data);
    if (activeTableId) setCandidates(await api.dimensionCandidates(activeTableId));
  }

  async function handleDeleteRecord(recordId: string) {
    await api.deleteRecord(recordId);
    setRecords((current) => current.filter((record) => record.id !== recordId));
  }

  async function handleImport() {
    const path = await api.pickExcelFile();
    if (!path) return;
    let baseId = activeBaseId;
    if (!baseId) {
      const newBaseId = await api.createBase('Imported Workbook');
      setBases((current) => [...current, { id: newBaseId, name: 'Imported Workbook', folder: '' }]);
      setActiveBaseId(newBaseId);
      baseId = newBaseId;
    }
    const result = await api.importWorkbook(baseId, path);
    const nextTables = await api.listTables(baseId);
    setTables(nextTables);
    setActiveTableId(result.tableIds[0] ?? nextTables[0]?.id ?? null);
  }

  async function handleExport() {
    if (!activeTableId) return;
    const table = tables.find((item) => item.id === activeTableId);
    const fileName = `${safeFileName(table?.name ?? 'base-table-export')}.csv`;
    const exported = await api.saveTextFile(fileName, buildCsv(fields, records));
    if (exported) window.alert(t(locale, 'exportDone'));
  }

  function handleFieldSettingsResize(event: ReactMouseEvent<HTMLDivElement>) {
    const startX = event.clientX;
    const startWidth = fieldSettingsWidth;
    function handleMouseMove(moveEvent: MouseEvent) {
      const nextWidth = Math.min(980, Math.max(320, startWidth + moveEvent.clientX - startX));
      setFieldSettingsWidth(nextWidth);
    }
    function handleMouseUp() {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleToggleKanbanField(fieldId: string) {
    setVisibleKanbanFieldIds((current) => current.includes(fieldId) ? current.filter((id) => id !== fieldId) : [...current, fieldId]);
  }

  const groupingFieldId = useMemo(() => manualGroupingFieldId ?? candidates[0]?.fieldId ?? fields.find((field) => ['single_select', 'text', 'bool'].includes(field.fieldType))?.id ?? null, [candidates, fields, manualGroupingFieldId]);

  return (
    <div className="app-shell">
      <Sidebar
        bases={bases}
        tables={tables}
        activeBaseId={activeBaseId}
        activeTableId={activeTableId}
        onSelectBase={setActiveBaseId}
        onSelectTable={setActiveTableId}
        onCreateBase={handleCreateBase}
        onCreateTable={handleCreateTable}
        onRenameBase={handleRenameBase}
        onDeleteBase={handleDeleteBase}
        onMoveBase={handleMoveBase}
        onRenameTable={handleRenameTable}
        onDeleteTable={handleDeleteTable}
        labels={{ title: t(locale, 'baseTable'), newBase: t(locale, 'newBase'), newTable: t(locale, 'newTable'), rename: t(locale, 'rename'), delete: t(locale, 'delete'), moveFolder: t(locale, 'moveFolder') }}
      />
      <main className="content-shell">
        <Toolbar
          locale={locale}
          view={view}
          onLocaleChange={setLocale}
          onViewChange={setView}
          onImport={handleImport}
          onExport={handleExport}
          fields={fields}
          groupingFieldId={groupingFieldId}
          onGroupingFieldChange={setManualGroupingFieldId}
          visibleKanbanFieldIds={visibleKanbanFieldIds}
          onToggleKanbanField={handleToggleKanbanField}
          labels={{ grid: t(locale, 'grid'), kanban: t(locale, 'kanban'), gantt: t(locale, 'gantt'), importExcel: t(locale, 'importExcel'), exportData: t(locale, 'exportData'), language: t(locale, 'language'), groupBy: t(locale, 'groupBy'), kanbanFields: t(locale, 'kanbanFields'), transpose: t(locale, 'transpose') }}
        />
        <section className="workspace">
          {!activeTableId ? (
            <div className="empty-state">{t(locale, 'emptyState')}</div>
          ) : (
            <>
              <div className="workspace-tools">
                <RecordEditor onCreateRecord={handleCreateRecord} labels={{ addRecord: t(locale, 'addRecord') }} />
                <section className={fieldSettingsOpen ? 'field-settings-panel' : 'field-settings-panel collapsed'} style={fieldSettingsOpen ? { width: fieldSettingsWidth } : undefined}>
                  <div className="field-settings-bar">
                    <strong>{t(locale, 'columnSettings')}</strong>
                    <button className="secondary-action" onClick={() => setFieldSettingsOpen((current) => !current)}>{fieldSettingsOpen ? t(locale, 'hideSettings') : t(locale, 'showSettings')}</button>
                  </div>
                  {fieldSettingsOpen ? (
                    <>
                      <div className="field-settings-resizer" onMouseDown={handleFieldSettingsResize} aria-label={t(locale, 'columnSettings')} role="separator" />
                      <FieldEditor
                        fields={fields}
                        onCreateField={handleCreateField}
                        onRenameField={handleRenameField}
                        onChangeFieldType={handleChangeFieldType}
                        onUpdateFieldOptions={handleUpdateFieldOptions}
                        onUpdateFieldValidation={handleUpdateFieldValidation}
                        onMoveField={handleMoveField}
                        onDeleteField={handleDeleteField}
                        labels={{ addField: t(locale, 'addField'), fieldName: t(locale, 'fieldName'), fieldType: t(locale, 'fieldType'), options: t(locale, 'options'), validation: t(locale, 'validation') }}
                      />
                    </>
                  ) : null}
                </section>
              </div>
              <StatsPanel fields={fields} records={records} candidates={candidates} label={t(locale, 'stats')} />
              {view === 'grid' ? (
                <GridView fields={fields} records={records} onCellChange={handleCellChange} onDeleteRecord={handleDeleteRecord} />
              ) : view === 'kanban' ? (
                <KanbanView fields={fields} records={records} groupingFieldId={groupingFieldId} visibleFieldIds={visibleKanbanFieldIds} ungroupedLabel={t(locale, 'ungrouped')} />
              ) : view === 'gantt' ? (
                <GanttView fields={fields} records={records} />
              ) : (
                <TransposeView fields={fields} records={records} />
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
