import type { ChartKind, GanttScale, Locale, ViewMode } from '../types';
import type { FieldItem } from '../types';

interface ToolbarProps {
  locale: Locale;
  view: ViewMode;
  onLocaleChange: (locale: Locale) => void;
  onViewChange: (view: ViewMode) => void;
  onImport: () => void;
  onExport: () => void;
  onBatchEdit: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onBackup: () => void;
  onRestore: () => void;
  onConfigureImportMapping: () => void;
  onSaveViewTemplate: () => void;
  onApplyViewTemplate: () => void;
  fields: FieldItem[];
  analysisGroupFieldId: string | null;
  analysisMetricFieldId: string | null;
  analysisSecondaryMetricFieldId: string | null;
  chartKind: ChartKind;
  ganttScale: GanttScale;
  ganttStartFieldId: string | null;
  ganttEndFieldId: string | null;
  onAnalysisGroupFieldChange: (fieldId: string) => void;
  onAnalysisMetricFieldChange: (fieldId: string) => void;
  onAnalysisSecondaryMetricFieldChange: (fieldId: string) => void;
  onChartKindChange: (chartKind: ChartKind) => void;
  onGanttScaleChange: (scale: GanttScale) => void;
  onGanttStartFieldChange: (fieldId: string) => void;
  onGanttEndFieldChange: (fieldId: string) => void;
  transposeTitleFieldId: string | null;
  onTransposeTitleFieldChange: (fieldId: string) => void;
  labels: {
    grid: string;
    kanban: string;
    analysis: string;
    dashboard: string;
    form: string;
    importExcel: string;
    exportData: string;
    fileMenu: string;
    editMenu: string;
    viewMenu: string;
    toolsMenu: string;
    language: string;
    groupBy: string;
    dimension: string;
    metric: string;
    secondaryMetric: string;
    chartType: string;
    ganttScale: string;
    ganttStart: string;
    ganttEnd: string;
    transposeTitle: string;
    gantt: string;
    kanbanFields: string;
    transpose: string;
    batchEdit: string;
    undo: string;
    backup: string;
    restore: string;
    importMapping: string;
    saveTemplate: string;
    applyTemplate: string;
  };
}

const viewItems: Array<{ mode: ViewMode; key: 'grid' | 'kanban' | 'gantt' | 'analysis' | 'dashboard' | 'form' | 'transpose' }> = [
  { mode: 'grid', key: 'grid' },
  { mode: 'kanban', key: 'kanban' },
  { mode: 'gantt', key: 'gantt' },
  { mode: 'analysis', key: 'analysis' },
  { mode: 'dashboard', key: 'dashboard' },
  { mode: 'form', key: 'form' },
  { mode: 'transpose', key: 'transpose' },
];

export default function Toolbar({ locale, view, onLocaleChange, onViewChange, onImport, onExport, onBatchEdit, onUndo, canUndo, onBackup, onRestore, onConfigureImportMapping, onSaveViewTemplate, onApplyViewTemplate, fields, analysisGroupFieldId, analysisMetricFieldId, analysisSecondaryMetricFieldId, chartKind, ganttScale, ganttStartFieldId, ganttEndFieldId, onAnalysisGroupFieldChange, onAnalysisMetricFieldChange, onAnalysisSecondaryMetricFieldChange, onChartKindChange, onGanttScaleChange, onGanttStartFieldChange, onGanttEndFieldChange, transposeTitleFieldId, onTransposeTitleFieldChange, labels }: ToolbarProps) {
  const dimensionFields = fields.filter((field) => ['single_select', 'text', 'bool', 'date'].includes(field.fieldType));
  const metricFields = fields.filter((field) => field.fieldType === 'number');
  const dateFields = fields.filter((field) => field.fieldType === 'date');
  return (
    <header className="toolbar">
      <div className="app-menu-bar">
        <details className="menu-dropdown">
          <summary>{labels.fileMenu}</summary>
          <div className="menu-popover">
            <button onClick={onImport}>{labels.importExcel}</button>
            <button onClick={onExport}>{labels.exportData}</button>
            <button onClick={onBackup}>{labels.backup}</button>
            <button onClick={onRestore}>{labels.restore}</button>
          </div>
        </details>
        <details className="menu-dropdown">
          <summary>{labels.editMenu}</summary>
          <div className="menu-popover">
            <button onClick={onBatchEdit}>{labels.batchEdit}</button>
            <button onClick={onUndo} disabled={!canUndo}>{labels.undo}</button>
          </div>
        </details>
        <details className="menu-dropdown">
          <summary>{labels.viewMenu}: {labels[viewItems.find((item) => item.mode === view)?.key ?? 'grid']}</summary>
          <div className="menu-popover">
            {viewItems.map((item) => <button key={item.mode} className={view === item.mode ? 'active-menu-item' : undefined} onClick={() => onViewChange(item.mode)}>{labels[item.key]}</button>)}
          </div>
        </details>
        <details className="menu-dropdown">
          <summary>{labels.toolsMenu}</summary>
          <div className="menu-popover">
            <button onClick={onConfigureImportMapping}>{labels.importMapping}</button>
            <button onClick={onSaveViewTemplate}>{labels.saveTemplate}</button>
            <button onClick={onApplyViewTemplate}>{labels.applyTemplate}</button>
          </div>
        </details>
      </div>
      <div className="toolbar-actions">
        {view === 'transpose' && fields.length > 0 ? (
          <label className="language-select">
            <span>{labels.transposeTitle}</span>
            <select value={transposeTitleFieldId ?? fields[0]?.id ?? ''} onChange={(event) => onTransposeTitleFieldChange(event.target.value)}>
              {fields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}
            </select>
          </label>
        ) : null}
        {view === 'analysis' && fields.length > 0 ? (
          <>
            <label className="language-select"><span>{labels.dimension}</span><select value={analysisGroupFieldId ?? ''} onChange={(event) => onAnalysisGroupFieldChange(event.target.value)}>{dimensionFields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}</select></label>
            <label className="language-select"><span>{labels.metric}</span><select value={analysisMetricFieldId ?? ''} onChange={(event) => onAnalysisMetricFieldChange(event.target.value)}>{metricFields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}</select></label>
            <label className="language-select"><span>{labels.secondaryMetric}</span><select value={analysisSecondaryMetricFieldId ?? ''} onChange={(event) => onAnalysisSecondaryMetricFieldChange(event.target.value)}><option value="" />{metricFields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}</select></label>
            <label className="language-select"><span>{labels.chartType}</span><select value={chartKind} onChange={(event) => onChartKindChange(event.target.value as ChartKind)}><option value="column">column</option><option value="bar">bar</option><option value="dual">dual</option></select></label>
          </>
        ) : null}
        {view === 'gantt' ? <><label className="language-select"><span>{labels.ganttScale}</span><select value={ganttScale} onChange={(event) => onGanttScaleChange(event.target.value as GanttScale)}><option value="day">day</option><option value="week">week</option><option value="month">month</option><option value="quarter">quarter</option><option value="year">year</option></select></label><label className="language-select"><span>{labels.ganttStart}</span><select value={ganttStartFieldId ?? ''} onChange={(event) => onGanttStartFieldChange(event.target.value)}>{dateFields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}</select></label><label className="language-select"><span>{labels.ganttEnd}</span><select value={ganttEndFieldId ?? ''} onChange={(event) => onGanttEndFieldChange(event.target.value)}>{dateFields.map((field) => <option key={field.id} value={field.id}>{field.name}</option>)}</select></label></> : null}
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
