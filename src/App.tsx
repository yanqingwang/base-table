import { useEffect, useMemo, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import AiAssistantPanel from './components/AiAssistantPanel';
import AnalysisView from './components/AnalysisView';
import DashboardView from './components/DashboardView';
import FieldEditor from './components/FieldEditor';
import FormView from './components/FormView';
import GanttView from './components/GanttView';
import GridView from './components/GridView';
import JoinedView from './components/JoinedView';
import RecordEditor from './components/RecordEditor';
import SavedViewsPanel from './components/SavedViewsPanel';
import Sidebar from './components/Sidebar';
import StatsPanel from './components/StatsPanel';
import Toolbar from './components/Toolbar';
import TransposeView from './components/TransposeView';
import { applyFilters, applySearch, applySorting, groupRecordsByFields } from './lib/filters';
import type { RecordGroup } from './lib/filters';
import { applyAutoNumberFields, applyFormulaFields } from './lib/formulas';
import { parseImportMapping } from './lib/import-mapping';
import { t } from './lib/i18n';
import { makeJoinedFields, makeJoinedRecords } from './lib/join';
import { applyLookupFields } from './lib/lookup';
import { requestDeepSeekUpdates } from './lib/deepseek';
import type { AiUpdate } from './lib/deepseek';
import * as api from './lib/tauri';
import type { BaseItem, ChartKind, DateFormat, DimensionCandidate, FieldItem, FieldType, FilterRule, GanttScale, JoinRule, Locale, NumberFormatKind, RecordItem, SortRule, TableItem, ViewItem, ViewMode, ViewTemplate } from './types';

const IMPORT_MAPPING_KEY = 'base-table-import-mapping';
const VIEW_TEMPLATES_KEY = 'base-table-view-templates';
const quickFilterOperators: FilterRule['operator'][] = ['contains', 'equals', 'not_equals', 'empty', 'not_empty', 'next_days', 'before', 'after', 'gt', 'lt', 'between'];
const BUILT_IN_VIEW_TEMPLATES: ViewTemplate[] = [
  { name: 'Task Management', viewType: 'filter', config: { filters: [], sorts: [] } },
  { name: 'Customer Management', viewType: 'filter', config: { filters: [], sorts: [] } },
  { name: 'Project Gantt', viewType: 'gantt', config: { filters: [], sorts: [] } },
];

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

function readLocalValue(key: string): string {
  try {
    return typeof localStorage?.getItem === 'function' ? localStorage.getItem(key) ?? '' : '';
  } catch {
    return '';
  }
}

function writeLocalValue(key: string, value: string) {
  try {
    if (typeof localStorage?.setItem === 'function') localStorage.setItem(key, value);
  } catch {
    // Local storage can be unavailable in test or locked-down WebView contexts.
  }
}

function readViewTemplates(): ViewTemplate[] {
  try {
    const raw = readLocalValue(VIEW_TEMPLATES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const custom = Array.isArray(parsed) ? parsed as ViewTemplate[] : [];
    const customNames = new Set(custom.map((template) => template.name));
    return [...BUILT_IN_VIEW_TEMPLATES.filter((template) => !customNames.has(template.name)), ...custom];
  } catch {
    return BUILT_IN_VIEW_TEMPLATES;
  }
}

function writeViewTemplates(templates: ViewTemplate[]) {
  writeLocalValue(VIEW_TEMPLATES_KEY, JSON.stringify(templates));
}

export default function App() {
  const [locale, setLocale] = useState<Locale>('zh-CN');
  const [view, setView] = useState<ViewMode>('grid');
  const [bases, setBases] = useState<BaseItem[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [savedViews, setSavedViews] = useState<ViewItem[]>([]);
  const [activeSavedViewId, setActiveSavedViewId] = useState<string | null>(null);
  const [draftFilter, setDraftFilter] = useState<FilterRule>({ fieldId: '', operator: 'contains', value: '' });
  const [draftFilters, setDraftFilters] = useState<FilterRule[]>([]);
  const [draftJoin, setDraftJoin] = useState<JoinRule>({ tableId: '', baseFieldId: '', targetFieldId: '' });
  const [draftSort, setDraftSort] = useState<SortRule>({ fieldId: '', direction: 'asc' });
  const [searchQuery, setSearchQuery] = useState('');
  const [gridGroupFieldIds, setGridGroupFieldIds] = useState<string[]>([]);
  const [recordHistory, setRecordHistory] = useState<RecordItem[][]>([]);
  const [joinTargetFields, setJoinTargetFields] = useState<FieldItem[]>([]);
  const [joinedFields, setJoinedFields] = useState<FieldItem[]>([]);
  const [joinedRecords, setJoinedRecords] = useState<RecordItem[]>([]);
  const [candidates, setCandidates] = useState<DimensionCandidate[]>([]);
  const [activeBaseId, setActiveBaseId] = useState<string | null>(null);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  
  const [analysisGroupFieldId, setAnalysisGroupFieldId] = useState<string | null>(null);
  const [analysisMetricFieldId, setAnalysisMetricFieldId] = useState<string | null>(null);
  const [analysisSecondaryMetricFieldId, setAnalysisSecondaryMetricFieldId] = useState<string | null>(null);
  const [chartKind, setChartKind] = useState<ChartKind>('column');
  const [ganttScale, setGanttScale] = useState<GanttScale>('day');
  const [ganttStartFieldId, setGanttStartFieldId] = useState<string | null>(null);
  const [ganttEndFieldId, setGanttEndFieldId] = useState<string | null>(null);
  const [transposeTitleFieldId, setTransposeTitleFieldId] = useState<string | null>(null);
  
  const [fieldSettingsOpen, setFieldSettingsOpen] = useState(true);
  const [aiSettingsOpen, setAiSettingsOpen] = useState(true);
  const [filterSettingsOpen, setFilterSettingsOpen] = useState(true);
  const [groupSettingsOpen, setGroupSettingsOpen] = useState(true);
  const [savedViewsOpen, setSavedViewsOpen] = useState(true);
  const [fieldSettingsWidth, setFieldSettingsWidth] = useState(45);
  const [deepseekApiKey, setDeepseekApiKey] = useState(() => readLocalValue('base-table-deepseek-key'));
  const [aiInstruction, setAiInstruction] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [lastAiUpdates, setLastAiUpdates] = useState<AiUpdate[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  const activeGridGroupFieldIds = useMemo(() => gridGroupFieldIds.filter((fieldId) => fields.some((field) => field.id === fieldId)), [fields, gridGroupFieldIds]);

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

  useEffect(() => {
    if (!draftJoin.tableId) {
      setJoinTargetFields([]);
      return;
    }
    api.listFields(draftJoin.tableId).then(setJoinTargetFields).catch(console.error);
  }, [draftJoin.tableId]);

  useEffect(() => {
    void refreshJoinedView();
  }, [activeSavedViewId, savedViews, records, fields, tables]);

  useEffect(() => {
    void refreshLookupFields();
  }, [fields, records]);

  useEffect(() => {
    const validFieldIds = new Set(fields.map((field) => field.id));
    setGridGroupFieldIds((current) => current.filter((fieldId) => !fieldId || validFieldIds.has(fieldId)));
  }, [fields]);

  useEffect(() => {
    setCollapsedGroups([]);
  }, [activeGridGroupFieldIds.join('|')]);

  async function refreshTable() {
    if (!activeTableId) {
      setFields([]);
      setRecords([]);
      setCandidates([]);
      setSavedViews([]);
      setActiveSavedViewId(null);
      return;
    }
    const [nextFields, nextRecords, nextCandidates, nextViews] = await Promise.all([
      api.listFields(activeTableId),
      api.listRecords(activeTableId),
      api.dimensionCandidates(activeTableId),
      api.listViews(activeTableId),
    ]);
    setFields(nextFields);
    setRecords(nextRecords);
    setCandidates(nextCandidates);
    setSavedViews(nextViews);
    setActiveSavedViewId((current) => (current && nextViews.some((view) => view.id === current) ? current : null));
  }

  async function refreshJoinedView() {
    const active = savedViews.find((viewItem) => viewItem.id === activeSavedViewId);
    const join = active?.config.joins?.[0];
    const joinedTable = tables.find((table) => table.id === join?.tableId);
    if (!join || !joinedTable) {
      setJoinedFields([]);
      setJoinedRecords([]);
      return;
    }
    const [targetFields, targetRecords] = await Promise.all([
      api.listFields(join.tableId),
      api.listRecords(join.tableId),
    ]);
    const baseRecords = applyFilters(records, active.config.filters ?? []);
    setJoinedFields(makeJoinedFields(fields, joinedTable, targetFields));
    setJoinedRecords(makeJoinedRecords(baseRecords, joinedTable, targetRecords, join));
  }

  async function refreshLookupFields() {
    const { changed, records: nextRecords } = await applyLookupFields(records, fields, api.listRecords);
    if (!changed) return;
    await Promise.all(nextRecords.map((record) => api.updateRecord(record.id, record.data)));
    setRecords(nextRecords);
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

  async function handleUpdateDateFormat(fieldId: string, dateFormat: DateFormat) {
    const field = fields.find((item) => item.id === fieldId);
    if (!field) return;
    const config = { ...field.config, dateFormat };
    await api.updateFieldConfig(fieldId, config);
    setFields((current) => current.map((item) => (item.id === fieldId ? { ...item, config } : item)));
  }

  async function handleUpdateNumberFormat(fieldId: string, numberFormat: NumberFormatKind, decimalPlaces: number, currency: string) {
    const field = fields.find((item) => item.id === fieldId);
    if (!field) return;
    const config = { ...field.config, numberFormat, decimalPlaces, currency };
    await api.updateFieldConfig(fieldId, config);
    setFields((current) => current.map((item) => (item.id === fieldId ? { ...item, config } : item)));
  }

  async function handleUpdateFormula(fieldId: string, formula: string) {
    const field = fields.find((item) => item.id === fieldId);
    if (!field) return;
    const config = { ...field.config, formula };
    await api.updateFieldConfig(fieldId, config);
    setFields((current) => current.map((item) => (item.id === fieldId ? { ...item, config } : item)));
  }

  async function handleUpdateLookupConfig(fieldId: string, lookupTableId: string, lookupBaseFieldId: string, lookupMatchFieldId: string, lookupValueFieldId: string) {
    const field = fields.find((item) => item.id === fieldId);
    if (!field) return;
    const config = { ...field.config, lookupTableId, lookupBaseFieldId, lookupMatchFieldId, lookupValueFieldId };
    await api.updateFieldConfig(fieldId, config);
    setFields((current) => current.map((item) => (item.id === fieldId ? { ...item, config } : item)));
  }

  async function handleUpdateConditionalFormat(fieldId: string, conditionalValue: string, conditionalColor: string) {
    const field = fields.find((item) => item.id === fieldId);
    if (!field) return;
    const config = { ...field.config, conditionalValue, conditionalColor };
    await api.updateFieldConfig(fieldId, config);
    setFields((current) => current.map((item) => (item.id === fieldId ? { ...item, config } : item)));
  }

  async function handleToggleFrozenField(fieldId: string) {
    const field = fields.find((item) => item.id === fieldId);
    if (!field) return;
    const config = { ...field.config, frozen: !field.config.frozen };
    await api.updateFieldConfig(fieldId, config);
    setFields((current) => current.map((item) => (item.id === fieldId ? { ...item, config } : item)));
  }

  async function handleUpdateAutoPrefix(fieldId: string, autoPrefix: string) {
    const field = fields.find((item) => item.id === fieldId);
    if (!field) return;
    const config = { ...field.config, autoPrefix };
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
    setRecordHistory((history) => [...history.slice(-19), records]);
    const data = { ...record.data, [fieldId]: value };
    setRecords((current) => current.map((item) => (item.id === recordId ? { ...item, data } : item)));
    await api.updateRecord(recordId, data);
    if (activeTableId) setCandidates(await api.dimensionCandidates(activeTableId));
  }

  async function handlePickAttachment(recordId: string, fieldId: string) {
    const path = await api.pickAnyFile();
    if (!path) return;
    await handleCellChange(recordId, fieldId, path);
  }

  async function handleBatchEdit() {
    const fieldId = window.prompt(t(locale, 'fieldName'), fields[0]?.id ?? '');
    if (!fieldId || !fields.some((field) => field.id === fieldId)) return;
    const value = window.prompt(t(locale, 'filterValue'), '') ?? '';
    setRecordHistory((history) => [...history.slice(-19), records]);
    const nextRecords = displayRecords.map((record) => ({ ...record, data: { ...record.data, [fieldId]: value } }));
    await Promise.all(nextRecords.map((record) => api.updateRecord(record.id, record.data)));
    setRecords((current) => current.map((record) => nextRecords.find((item) => item.id === record.id) ?? record));
  }

  async function handleUndo() {
    const previous = recordHistory[recordHistory.length - 1];
    if (!previous) return;
    await Promise.all(previous.map((record: RecordItem) => api.updateRecord(record.id, record.data)));
    setRecords(previous);
    setRecordHistory((history) => history.slice(0, -1));
  }

  async function handleDeleteRecord(recordId: string) {
    await api.deleteRecord(recordId);
    setRecords((current) => current.filter((record) => record.id !== recordId));
  }

  async function applyAiUpdates(updates: AiUpdate[], targetTableId: string) {
    let createdFieldCount = 0;
    const appliedUpdates: AiUpdate[] = [];
    for (const update of updates) {
      if (update.type === 'column_create') {
        if (!targetTableId) continue;
        const ordinal = fields.length + createdFieldCount;
        const id = await api.createField(targetTableId, update.name, update.fieldType, ordinal);
        const config = update.config ?? {};
        if (Object.keys(config).length > 0) await api.updateFieldConfig(id, config);
        const field: FieldItem = { id, tableId: targetTableId, name: update.name, fieldType: update.fieldType, ordinal, config };
        createdFieldCount += 1;
        setFields((current) => [...current, field]);
        appliedUpdates.push(update);
      } else if (update.type === 'column_config') {
        const field = fields.find((item) => item.id === update.fieldId);
        if (!field) continue;
        const config = { ...field.config, ...update.config };
        await api.updateFieldConfig(update.fieldId, config);
        setFields((current) => current.map((item) => (item.id === update.fieldId ? { ...item, config } : item)));
        appliedUpdates.push(update);
      } else {
        const record = records.find((item) => item.id === update.recordId);
        if (!record || !fields.some((field) => field.id === update.fieldId)) continue;
        const data = { ...record.data, [update.fieldId]: update.value };
        await api.updateRecord(update.recordId, data);
        setRecords((current) => current.map((item) => (item.id === update.recordId ? { ...item, data } : item)));
        appliedUpdates.push(update);
      }
    }
    if (createdFieldCount > 0 && activeTableId === targetTableId) await refreshTable();
    return appliedUpdates;
  }

  async function handleRunAi() {
    const targetTableId = activeTableId;
    if (!deepseekApiKey || !aiInstruction || !targetTableId) return;
    writeLocalValue('base-table-deepseek-key', deepseekApiKey);
    setAiBusy(true);
    try {
      const updates = await requestDeepSeekUpdates(deepseekApiKey, aiInstruction, fields, records);
      const appliedUpdates = await applyAiUpdates(updates, targetTableId);
      setLastAiUpdates(appliedUpdates);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
    } finally {
      setAiBusy(false);
    }
  }

  function handleBindDeepSeekApiKey() {
    const nextKey = window.prompt(t(locale, 'deepseekApiKey'), deepseekApiKey);
    if (nextKey === null) return;
    setDeepseekApiKey(nextKey);
    writeLocalValue('base-table-deepseek-key', nextKey);
  }

  async function handleProcessFormulas() {
    const nextRecords = applyFormulaFields(records, fields);
    await Promise.all(nextRecords.map((record) => api.updateRecord(record.id, record.data)));
    setRecords(nextRecords);
  }

  async function handleImport() {
    const path = await api.pickExcelFile();
    if (!path) return;
    const sheetNames = await api.workbookSheetNames(path);
    const duplicateNames = sheetNames.filter((sheetName) => tables.some((table) => table.name === sheetName));
    const overwrite = duplicateNames.length > 0
      ? window.confirm(`Found existing table names: ${duplicateNames.join(', ')}. Overwrite these tables before importing?`)
      : false;
    if (duplicateNames.length > 0 && !overwrite) return;
    let baseId = activeBaseId;
    if (!baseId) {
      const newBaseId = await api.createBase('Imported Workbook');
      setBases((current) => [...current, { id: newBaseId, name: 'Imported Workbook', folder: '' }]);
      setActiveBaseId(newBaseId);
      baseId = newBaseId;
    }
    const result = await api.importWorkbook(baseId, path, overwrite);
    await applyImportMapping(result.tableIds);
    const nextTables = await api.listTables(baseId);
    setTables(nextTables);
    setActiveTableId(result.tableIds[0] ?? nextTables[0]?.id ?? null);
  }

  async function applyImportMapping(tableIds: string[]) {
    const rules = parseImportMapping(readLocalValue(IMPORT_MAPPING_KEY));
    if (rules.length === 0) return;
    await Promise.all(tableIds.map(async (tableId) => {
      const importedFields = await api.listFields(tableId);
      await Promise.all(importedFields.map(async (field) => {
        const rule = rules.find((item) => item.sourceName === field.name);
        if (!rule) return;
        if (rule.targetName !== field.name) await api.renameField(field.id, rule.targetName);
        if (rule.fieldType && rule.fieldType !== field.fieldType) await api.updateFieldType(field.id, rule.fieldType);
      }));
    }));
  }

  function handleConfigureImportMapping() {
    const next = window.prompt('source=target:type, one per line', readLocalValue(IMPORT_MAPPING_KEY));
    if (next === null) return;
    writeLocalValue(IMPORT_MAPPING_KEY, next);
  }

  async function handleExport() {
    if (!activeTableId) return;
    const table = tables.find((item) => item.id === activeTableId);
    const fileName = `${safeFileName(table?.name ?? 'base-table-export')}.csv`;
    const exported = await api.saveTextFile(fileName, buildCsv(displayFields, displayRecords));
    if (exported) window.alert(t(locale, 'exportDone'));
  }

  async function handleBackup() {
    const exported = await api.saveTextFile('base-table-backup.json', JSON.stringify({ bases, tables, fields, records, savedViews }, null, 2));
    if (exported) window.alert('Backup exported');
  }

  async function handleRestoreFromJson() {
    const raw = window.prompt('Paste backup JSON');
    if (!raw) return;
    const backup = JSON.parse(raw) as { records?: RecordItem[] };
    if (!backup.records) return;
    setRecordHistory((history) => [...history.slice(-19), records]);
    await Promise.all(backup.records.map((record) => api.updateRecord(record.id, record.data)));
    setRecords(backup.records);
  }

  function handleSaveViewTemplate() {
    const name = window.prompt(t(locale, 'saveTemplate'), activeSavedView?.name ?? t(locale, 'savedViews'));
    if (!name) return;
    const template: ViewTemplate = activeSavedView
      ? { name, viewType: activeSavedView.viewType, config: activeSavedView.config }
      : { name, viewType: 'filter', config: { filters: currentDraftFilters(), sorts: draftSort.fieldId ? [draftSort] : [], joins: draftJoin.tableId ? [draftJoin] : [] } };
    const templates = readViewTemplates().filter((item) => item.name !== name);
    writeViewTemplates([...templates, template]);
  }

  function handleAddDraftFilter() {
    if (!draftFilter.fieldId) return;
    setDraftFilters((current) => [...current, draftFilter]);
  }

  function handleClearQuickFilters() {
    setDraftFilter({ fieldId: '', operator: 'contains', value: '' });
    setDraftFilters([]);
  }

  function currentDraftFilters() {
    return draftFilters.length > 0 ? draftFilters : draftFilter.fieldId ? [draftFilter] : [];
  }

  async function handleApplyViewTemplate() {
    if (!activeTableId) return;
    const templates = readViewTemplates();
    if (templates.length === 0) return;
    const name = window.prompt(templates.map((template) => template.name).join(', '), templates[0]?.name ?? '');
    const template = templates.find((item) => item.name === name);
    if (!template) return;
    const id = await api.createView(activeTableId, template.name, template.viewType, template.config);
    const viewItem = { id, tableId: activeTableId, name: template.name, viewType: template.viewType, config: template.config };
    setSavedViews((current) => [...current, viewItem]);
    setActiveSavedViewId(id);
  }

  async function handleSaveView() {
    if (!activeTableId || (!draftFilter.fieldId && draftFilters.length === 0)) return;
    const name = window.prompt(t(locale, 'saveView'), t(locale, 'savedViews'));
    if (!name) return;
    const config = { filters: currentDraftFilters(), sorts: draftSort.fieldId ? [draftSort] : [] };
    const id = await api.createView(activeTableId, name, 'filter', config);
    const viewItem = { id, tableId: activeTableId, name, viewType: 'filter', config };
    setSavedViews((current) => [...current, viewItem]);
    setActiveSavedViewId(id);
  }

  async function handleSaveJoinedView() {
    if (!activeTableId || !draftJoin.tableId || !draftJoin.baseFieldId || !draftJoin.targetFieldId) return;
    const name = window.prompt(t(locale, 'saveJoinedView'), t(locale, 'saveJoinedView'));
    if (!name) return;
    const config = { filters: currentDraftFilters(), joins: [draftJoin], sorts: draftSort.fieldId ? [draftSort] : [] };
    const id = await api.createView(activeTableId, name, 'join', config);
    const viewItem = { id, tableId: activeTableId, name, viewType: 'join', config };
    setSavedViews((current) => [...current, viewItem]);
    setActiveSavedViewId(id);
  }

  async function handleUpdateActiveView() {
    if (!activeSavedViewId || (!draftFilter.fieldId && draftFilters.length === 0)) return;
    const current = savedViews.find((viewItem) => viewItem.id === activeSavedViewId);
    const config = { filters: currentDraftFilters(), joins: current?.config.joins, sorts: draftSort.fieldId ? [draftSort] : [] };
    await api.updateViewConfig(activeSavedViewId, config);
    setSavedViews((current) => current.map((viewItem) => (viewItem.id === activeSavedViewId ? { ...viewItem, config } : viewItem)));
  }

  async function handleRenameView() {
    if (!activeSavedViewId) return;
    const current = savedViews.find((viewItem) => viewItem.id === activeSavedViewId);
    const name = window.prompt(t(locale, 'rename'), current?.name ?? '');
    if (!name) return;
    await api.renameView(activeSavedViewId, name);
    setSavedViews((items) => items.map((viewItem) => (viewItem.id === activeSavedViewId ? { ...viewItem, name } : viewItem)));
  }

  async function handleDeleteView() {
    if (!activeSavedViewId) return;
    await api.deleteView(activeSavedViewId);
    setSavedViews((items) => items.filter((viewItem) => viewItem.id !== activeSavedViewId));
    setActiveSavedViewId(null);
  }

  function handleActiveSavedViewChange(viewId: string | null) {
    setActiveSavedViewId(viewId);
    const selected = savedViews.find((viewItem) => viewItem.id === viewId);
    setDraftFilters(selected?.config.filters ?? []);
    setDraftFilter(selected?.config.filters[0] ?? { fieldId: '', operator: 'contains', value: '' });
    setDraftJoin(selected?.config.joins?.[0] ?? { tableId: '', baseFieldId: '', targetFieldId: '' });
    setDraftSort(selected?.config.sorts?.[0] ?? { fieldId: '', direction: 'asc' });
  }

  function handleFieldSettingsResize(event: ReactMouseEvent<HTMLDivElement>) {
    const startX = event.clientX;
    const startWidth = fieldSettingsWidth;
    const containerWidth = event.currentTarget.closest('.workspace-tools')?.getBoundingClientRect().width ?? window.innerWidth;
    function handleMouseMove(moveEvent: MouseEvent) {
      const deltaPercent = ((moveEvent.clientX - startX) / containerWidth) * 100;
      const nextWidth = Math.min(45, Math.max(24, startWidth + deltaPercent));
      setFieldSettingsWidth(nextWidth);
    }
    function handleMouseUp() {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleAddGroupField() {
    if (gridGroupFieldIds.some((fieldId) => !fieldId) || activeGridGroupFieldIds.length >= fields.length) return;
    setGridGroupFieldIds((current) => [...current, '']);
  }

  function handleChangeGroupField(index: number, fieldId: string) {
    setGridGroupFieldIds((current) => current.map((item, itemIndex) => (itemIndex === index ? fieldId : item)));
  }

  function handleRemoveGroupField(index: number) {
    setGridGroupFieldIds((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function renderGroupedRecords(groups: RecordGroup[], depth = 0, path = ''): JSX.Element {
    return <>{groups.map((group) => {
      const field = group.fieldId ? fields.find((item) => item.id === group.fieldId) : null;
      const groupLabel = group.label || t(locale, 'allRecords');
      const key = `${path}/${group.fieldId ?? 'all'}:${groupLabel}`;
      const collapsed = collapsedGroups.includes(key);
      const label = field ? `${field.name}: ${groupLabel}` : groupLabel;
      return (
        <section key={key} className="grid-group" style={{ marginLeft: depth * 18 }}>
          <header><button className="group-toggle" onClick={() => setCollapsedGroups((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])}>{collapsed ? '▸' : '▾'} {label} · {group.records.length}</button></header>
          {collapsed ? null : group.children ? renderGroupedRecords(group.children, depth + 1, key) : <GridView fields={fields} records={group.records} onCellChange={handleCellChange} onDeleteRecord={handleDeleteRecord} onPickAttachment={handlePickAttachment} />}
        </section>
      );
    })}</>;
  }

  const effectiveAnalysisGroupFieldId = useMemo(() => analysisGroupFieldId ?? fields.find((field) => ['single_select', 'text', 'bool', 'date'].includes(field.fieldType))?.id ?? null, [analysisGroupFieldId, fields]);
  const effectiveAnalysisMetricFieldId = useMemo(() => analysisMetricFieldId ?? fields.find((field) => field.fieldType === 'number')?.id ?? null, [analysisMetricFieldId, fields]);
  const dateFields = useMemo(() => fields.filter((field) => field.fieldType === 'date'), [fields]);
  const effectiveGanttStartFieldId = useMemo(() => (ganttStartFieldId && dateFields.some((field) => field.id === ganttStartFieldId) ? ganttStartFieldId : dateFields[0]?.id ?? null), [dateFields, ganttStartFieldId]);
  const effectiveGanttEndFieldId = useMemo(() => (ganttEndFieldId && dateFields.some((field) => field.id === ganttEndFieldId) ? ganttEndFieldId : dateFields[1]?.id ?? effectiveGanttStartFieldId), [dateFields, effectiveGanttStartFieldId, ganttEndFieldId]);
  const effectiveTransposeTitleFieldId = useMemo(() => (transposeTitleFieldId && fields.some((field) => field.id === transposeTitleFieldId) ? transposeTitleFieldId : fields[0]?.id ?? null), [fields, transposeTitleFieldId]);
  const activeSavedView = useMemo(() => savedViews.find((viewItem) => viewItem.id === activeSavedViewId) ?? null, [activeSavedViewId, savedViews]);
  const quickFilters = useMemo(() => draftFilters.length > 0 ? draftFilters : draftFilter.fieldId ? [draftFilter] : [], [draftFilter, draftFilters]);
  const effectiveFilters = quickFilters.length > 0 ? quickFilters : activeSavedView?.config.filters ?? [];
  const formulaRecords = useMemo(() => applyFormulaFields(applyAutoNumberFields(records, fields), fields), [fields, records]);
  const filteredRecords = useMemo(() => applySearch(applySorting(applyFilters(formulaRecords, effectiveFilters), activeSavedView?.config.sorts ?? []), searchQuery), [activeSavedView, effectiveFilters, formulaRecords, searchQuery]);
  const groupedGridRecords = useMemo(() => groupRecordsByFields(filteredRecords, activeGridGroupFieldIds), [activeGridGroupFieldIds, filteredRecords]);
  const isJoinedView = activeSavedView?.viewType === 'join';
  const displayFields = isJoinedView ? joinedFields : fields;
  const displayRecords = isJoinedView ? joinedRecords : filteredRecords;

  return (
    <div className="app-shell">
      <Sidebar
        bases={bases}
        tables={tables}
        views={savedViews}
        activeBaseId={activeBaseId}
        activeTableId={activeTableId}
        activeViewId={activeSavedViewId}
        onSelectBase={setActiveBaseId}
        onSelectTable={setActiveTableId}
        onSelectView={handleActiveSavedViewChange}
        onCreateBase={handleCreateBase}
        onCreateTable={handleCreateTable}
        onRenameBase={handleRenameBase}
        onDeleteBase={handleDeleteBase}
        onMoveBase={handleMoveBase}
        onRenameTable={handleRenameTable}
        onDeleteTable={handleDeleteTable}
        labels={{ title: t(locale, 'baseTable'), newBase: t(locale, 'newBase'), newTable: t(locale, 'newTable'), rename: t(locale, 'rename'), delete: t(locale, 'delete'), moveFolder: t(locale, 'moveFolder'), tables: t(locale, 'tables'), views: t(locale, 'views'), allRecords: t(locale, 'allRecords'), hideSettings: t(locale, 'hideSettings'), showSettings: t(locale, 'showSettings') }}
      />
      <main className="content-shell">
        <Toolbar
          locale={locale}
          view={view}
          onLocaleChange={setLocale}
          onViewChange={setView}
          onImport={handleImport}
          onExport={handleExport}
          onBatchEdit={handleBatchEdit}
          onUndo={handleUndo}
          canUndo={recordHistory.length > 0}
          onBackup={handleBackup}
          onRestore={handleRestoreFromJson}
          onConfigureImportMapping={handleConfigureImportMapping}
          onSaveViewTemplate={handleSaveViewTemplate}
          onApplyViewTemplate={handleApplyViewTemplate}
          fields={fields}
          analysisGroupFieldId={effectiveAnalysisGroupFieldId}
          analysisMetricFieldId={effectiveAnalysisMetricFieldId}
          analysisSecondaryMetricFieldId={analysisSecondaryMetricFieldId}
          chartKind={chartKind}
          ganttScale={ganttScale}
          ganttStartFieldId={effectiveGanttStartFieldId}
          ganttEndFieldId={effectiveGanttEndFieldId}
          onAnalysisGroupFieldChange={setAnalysisGroupFieldId}
          onAnalysisMetricFieldChange={setAnalysisMetricFieldId}
          onAnalysisSecondaryMetricFieldChange={setAnalysisSecondaryMetricFieldId}
          onChartKindChange={setChartKind}
          onGanttScaleChange={setGanttScale}
          onGanttStartFieldChange={setGanttStartFieldId}
          onGanttEndFieldChange={setGanttEndFieldId}
          transposeTitleFieldId={effectiveTransposeTitleFieldId}
          onTransposeTitleFieldChange={setTransposeTitleFieldId}
          labels={{ grid: t(locale, 'grid'), kanban: t(locale, 'kanban'), analysis: t(locale, 'analysis'), dashboard: t(locale, 'dashboard'), form: t(locale, 'form'), gantt: t(locale, 'gantt'), importExcel: t(locale, 'importExcel'), exportData: t(locale, 'exportData'), fileMenu: t(locale, 'fileMenu'), editMenu: t(locale, 'editMenu'), viewMenu: t(locale, 'viewMenu'), toolsMenu: t(locale, 'toolsMenu'), language: t(locale, 'language'), groupBy: t(locale, 'groupBy'), dimension: t(locale, 'dimension'), metric: t(locale, 'metric'), secondaryMetric: t(locale, 'secondaryMetric'), chartType: t(locale, 'chartType'), ganttScale: t(locale, 'ganttScale'), ganttStart: t(locale, 'ganttStart'), ganttEnd: t(locale, 'ganttEnd'), transposeTitle: t(locale, 'transposeTitle'), kanbanFields: t(locale, 'kanbanFields'), transpose: t(locale, 'transpose'), batchEdit: t(locale, 'batchEdit'), undo: t(locale, 'undo'), backup: t(locale, 'backup'), restore: t(locale, 'restore'), importMapping: t(locale, 'importMapping'), saveTemplate: t(locale, 'saveTemplate'), applyTemplate: t(locale, 'applyTemplate') }}
        />
        <section className="workspace">
          {!activeTableId ? (
            <div className="empty-state">{t(locale, 'emptyState')}</div>
          ) : (
            <>
              <div className="workspace-tools">
                <div className="table-controls-column">
                  <div className="table-control-row search-row">
                    <RecordEditor onCreateRecord={handleCreateRecord} labels={{ addRecord: t(locale, 'addRecord') }} />
                    <input className="quick-search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={t(locale, 'quickSearch')} />
                  </div>
                  <section className={filterSettingsOpen ? 'table-control-row filter-row' : 'table-control-row filter-row collapsed'}>
                    <div className="control-header">
                      <strong>{t(locale, 'filterOperator')}</strong>
                      <button className="secondary-action toggle-filter" aria-expanded={filterSettingsOpen} aria-controls="quick-filter-controls" onClick={() => setFilterSettingsOpen((current) => !current)}>
                        {filterSettingsOpen ? t(locale, 'hideSettings') : t(locale, 'showSettings')}
                      </button>
                    </div>
                    {filterSettingsOpen ? (
                      <div id="quick-filter-controls" className="quick-filter-bar" aria-label={t(locale, 'filterOperator')}>
                        <select value={draftFilter.fieldId} onChange={(event) => setDraftFilter({ ...draftFilter, fieldId: event.target.value })}>
                          <option value="">{t(locale, 'allRecords')}</option>
                          {fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
                        </select>
                        <select value={draftFilter.operator} onChange={(event) => setDraftFilter({ ...draftFilter, operator: event.target.value as FilterRule['operator'] })}>
                          {quickFilterOperators.map((operator) => <option key={operator} value={operator}>{operator}</option>)}
                        </select>
                        <input value={draftFilter.value} onChange={(event) => setDraftFilter({ ...draftFilter, value: event.target.value })} placeholder={t(locale, 'filterValue')} />
                        <button className="secondary-action" onClick={handleAddDraftFilter} disabled={!draftFilter.fieldId}>+ {t(locale, 'filterOperator')}</button>
                        <button className="secondary-action" onClick={handleClearQuickFilters} disabled={quickFilters.length === 0 && !draftFilter.fieldId}>{t(locale, 'allRecords')}</button>
                        {quickFilters.length > 0 ? <span className="quick-filter-count">{quickFilters.length}</span> : null}
                      </div>
                    ) : null}
                  </section>
                  <SavedViewsPanel
                    fields={fields}
                    tables={tables}
                    activeTableId={activeTableId}
                    joinTargetFields={joinTargetFields}
                    views={savedViews}
                    activeViewId={activeSavedViewId}
                    draftFilter={draftFilter}
                    draftFilters={draftFilters}
                    draftJoin={draftJoin}
                    draftSort={draftSort}
                    open={savedViewsOpen}
                    onToggleOpen={() => setSavedViewsOpen((current) => !current)}
                    onActiveViewChange={handleActiveSavedViewChange}
                    onDraftFilterChange={setDraftFilter}
                    onAddDraftFilter={handleAddDraftFilter}
                    onRemoveDraftFilter={(index) => setDraftFilters((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    onDraftJoinChange={setDraftJoin}
                    onDraftSortChange={setDraftSort}
                    onSaveView={handleSaveView}
                    onSaveJoinedView={handleSaveJoinedView}
                    onUpdateActiveView={handleUpdateActiveView}
                    onRenameView={handleRenameView}
                    onDeleteView={handleDeleteView}
                    labels={{ savedViews: t(locale, 'savedViews'), allRecords: t(locale, 'allRecords'), fieldName: t(locale, 'fieldName'), filterOperator: t(locale, 'filterOperator'), filterValue: t(locale, 'filterValue'), sortBy: t(locale, 'sortBy'), sortDirection: t(locale, 'sortDirection'), saveView: t(locale, 'saveView'), saveJoinedView: t(locale, 'saveJoinedView'), updateView: t(locale, 'updateView'), rename: t(locale, 'rename'), delete: t(locale, 'delete'), joinedTable: t(locale, 'joinedTable'), baseJoinField: t(locale, 'baseJoinField'), targetJoinField: t(locale, 'targetJoinField'), hideSettings: t(locale, 'hideSettings'), showSettings: t(locale, 'showSettings') }}
                  />
                  <section className={groupSettingsOpen ? 'table-control-row group-row' : 'table-control-row group-row collapsed'}>
                    <div className="control-header">
                      <strong>{t(locale, 'groupBy')}</strong>
                      <button className="secondary-action toggle-group" aria-expanded={groupSettingsOpen} aria-controls="grid-group-controls" onClick={() => setGroupSettingsOpen((current) => !current)}>
                        {groupSettingsOpen ? t(locale, 'hideSettings') : t(locale, 'showSettings')}
                      </button>
                    </div>
                    {groupSettingsOpen ? (
                      <div id="grid-group-controls" className="group-field-stack">
                        {gridGroupFieldIds.map((fieldId, index) => (
                          <label key={`${fieldId}-${index}`} className="quick-group-select compact">
                            <span>{index + 1}</span>
                            <select value={fieldId} onChange={(event) => handleChangeGroupField(index, event.target.value)}>
                              <option value="">{t(locale, 'allRecords')}</option>
                              {fields.filter((field) => field.id === fieldId || !gridGroupFieldIds.includes(field.id)).map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
                            </select>
                            <button className="secondary-action compact-action" onClick={() => handleRemoveGroupField(index)}>×</button>
                          </label>
                        ))}
                        <button className="secondary-action" onClick={handleAddGroupField} disabled={fields.length === 0 || gridGroupFieldIds.some((fieldId) => !fieldId) || activeGridGroupFieldIds.length >= fields.length}>+ {t(locale, 'groupBy')}</button>
                        {activeGridGroupFieldIds.length > 0 || gridGroupFieldIds.length > 0 ? <button className="secondary-action" onClick={() => setGridGroupFieldIds([])}>{t(locale, 'allRecords')}</button> : null}
                      </div>
                    ) : null}
                  </section>
                </div>
                <aside className="table-settings-column">
                  <AiAssistantPanel
                    apiKey={deepseekApiKey}
                    instruction={aiInstruction}
                    busy={aiBusy}
                    open={aiSettingsOpen}
                    labels={{ aiAssistant: t(locale, 'aiAssistant'), deepseekApiKey: t(locale, 'deepseekApiKey'), aiInstruction: t(locale, 'aiInstruction'), runAi: t(locale, 'runAi'), processFormulas: t(locale, 'processFormulas'), hideSettings: t(locale, 'hideSettings'), showSettings: t(locale, 'showSettings') }}
                    onToggleOpen={() => setAiSettingsOpen((current) => !current)}
                    onBindApiKey={handleBindDeepSeekApiKey}
                    onInstructionChange={setAiInstruction}
                    onRun={handleRunAi}
                    onProcessFormulas={handleProcessFormulas}
                    pendingUpdates={lastAiUpdates}
                  />
                  <section className={fieldSettingsOpen ? 'field-settings-panel' : 'field-settings-panel collapsed'} style={fieldSettingsOpen ? { flexBasis: `${fieldSettingsWidth}%`, width: `${fieldSettingsWidth}%`, maxWidth: `${fieldSettingsWidth}%` } : undefined}>
                    <div className="field-settings-bar">
                      <strong>{t(locale, 'columnSettings')}</strong>
                      <button className="secondary-action" onClick={() => setFieldSettingsOpen((current) => !current)}>{fieldSettingsOpen ? t(locale, 'hideSettings') : t(locale, 'showSettings')}</button>
                    </div>
                    {fieldSettingsOpen ? (
                      <>
                        <div className="field-settings-resizer" onMouseDown={handleFieldSettingsResize} aria-label={t(locale, 'columnSettings')} role="separator" />
                        <FieldEditor
                          fields={fields}
                          tables={tables}
                          onCreateField={handleCreateField}
                          onRenameField={handleRenameField}
                          onChangeFieldType={handleChangeFieldType}
                          onUpdateFieldOptions={handleUpdateFieldOptions}
                          onUpdateFieldValidation={handleUpdateFieldValidation}
                          onUpdateDateFormat={handleUpdateDateFormat}
                          onUpdateNumberFormat={handleUpdateNumberFormat}
                          onUpdateFormula={handleUpdateFormula}
                          onUpdateLookupConfig={handleUpdateLookupConfig}
                          onUpdateConditionalFormat={handleUpdateConditionalFormat}
                          onToggleFrozenField={handleToggleFrozenField}
                          onUpdateAutoPrefix={handleUpdateAutoPrefix}
                          onMoveField={handleMoveField}
                          onDeleteField={handleDeleteField}
                          labels={{ addField: t(locale, 'addField'), fieldName: t(locale, 'fieldName'), fieldType: t(locale, 'fieldType'), options: t(locale, 'options'), validation: t(locale, 'validation'), dateFormat: t(locale, 'dateFormat'), dateFormatPrompt: t(locale, 'dateFormatPrompt'), numberFormat: t(locale, 'numberFormat'), formula: t(locale, 'formula'), lookup: t(locale, 'lookup'), conditionalFormat: t(locale, 'conditionalFormat'), freezeField: t(locale, 'freezeField'), autoNumber: t(locale, 'autoNumber') }}
                        />
                      </>
                    ) : null}
                  </section>
                </aside>
              </div>
              <StatsPanel fields={displayFields} records={displayRecords} candidates={candidates} label={t(locale, 'stats')} />
              {isJoinedView ? (
                <JoinedView fields={displayFields} records={displayRecords} />
              ) : view === 'grid' || view === 'kanban' ? (
                activeGridGroupFieldIds.length > 0 ? renderGroupedRecords(groupedGridRecords) : <GridView fields={fields} records={filteredRecords} onCellChange={handleCellChange} onDeleteRecord={handleDeleteRecord} onPickAttachment={handlePickAttachment} />
              ) : view === 'gantt' ? (
                <GanttView fields={fields} records={filteredRecords} scale={ganttScale} startFieldId={effectiveGanttStartFieldId} endFieldId={effectiveGanttEndFieldId} />
              ) : view === 'analysis' ? (
                <AnalysisView fields={displayFields} records={displayRecords} groupFieldId={effectiveAnalysisGroupFieldId} metricFieldId={effectiveAnalysisMetricFieldId} secondaryMetricFieldId={analysisSecondaryMetricFieldId} chartKind={chartKind} />
              ) : view === 'dashboard' ? (
                <DashboardView fields={displayFields} records={displayRecords} />
              ) : view === 'form' ? (
                <FormView fields={fields} records={filteredRecords} onCellChange={handleCellChange} onCreateRecord={handleCreateRecord} />
              ) : (
                <TransposeView fields={fields} records={filteredRecords} titleFieldId={effectiveTransposeTitleFieldId} />
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
