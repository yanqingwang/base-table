import { useState } from 'react';
import type { BaseItem, TableItem, ViewItem } from '../types';

interface SidebarProps {
  bases: BaseItem[];
  tables: TableItem[];
  views: ViewItem[];
  activeBaseId: string | null;
  activeTableId: string | null;
  activeViewId: string | null;
  onSelectBase: (id: string) => void;
  onSelectTable: (id: string) => void;
  onSelectView: (id: string | null) => void;
  onCreateBase: () => void;
  onCreateTable: () => void;
  onRenameBase: (id: string) => void;
  onDeleteBase: (id: string) => void;
  onMoveBase: (id: string) => void;
  onRenameTable: (id: string) => void;
  onDeleteTable: (id: string) => void;
  labels: {
    title: string;
    newBase: string;
    newTable: string;
    rename: string;
    delete: string;
    moveFolder: string;
    tables: string;
    views: string;
    allRecords: string;
    hideSettings: string;
    showSettings: string;
  };
}

export default function Sidebar({ bases, tables, views, activeBaseId, activeTableId, activeViewId, onSelectBase, onSelectTable, onSelectView, onCreateBase, onCreateTable, onRenameBase, onDeleteBase, onMoveBase, onRenameTable, onDeleteTable, labels }: SidebarProps) {
  const [baseMenuOpen, setBaseMenuOpen] = useState(true);
  const [tableMenuOpen, setTableMenuOpen] = useState(true);
  const [viewMenuOpen, setViewMenuOpen] = useState(true);
  const folders = Array.from(new Set(bases.map((base) => base.folder || 'Root')));
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">BT</div>
        <div>
          <h1>{labels.title}</h1>
          <p>Local-first workspace</p>
        </div>
      </div>
      <button className="primary-action" onClick={onCreateBase}>{labels.newBase}</button>
      <div className="menu-section-heading"><strong>Base</strong><button className="secondary-action" onClick={() => setBaseMenuOpen((open) => !open)}>{baseMenuOpen ? labels.hideSettings : labels.showSettings}</button></div>
      {baseMenuOpen ? (
      <div className="nav-section">
        {folders.map((folder) => (
          <section key={folder} className="folder-group">
            <strong>{folder}</strong>
            {bases.filter((base) => (base.folder || 'Root') === folder).map((base) => (
              <div key={base.id} className={base.id === activeBaseId ? 'nav-line active' : 'nav-line'}>
                <button className="nav-item" onClick={() => onSelectBase(base.id)}>{base.name}</button>
                <button aria-label={`${labels.rename} ${base.name}`} onClick={() => onRenameBase(base.id)}>✎</button>
                <button aria-label={`${labels.moveFolder} ${base.name}`} onClick={() => onMoveBase(base.id)}>⇄</button>
                <button aria-label={`${labels.delete} ${base.name}`} onClick={() => onDeleteBase(base.id)}>×</button>
              </div>
            ))}
          </section>
        ))}
      </div>
      ) : null}
      <button className="secondary-action" disabled={!activeBaseId} onClick={onCreateTable}>{labels.newTable}</button>
      <div className="menu-section-heading"><strong>{labels.tables}</strong><button className="secondary-action" onClick={() => setTableMenuOpen((open) => !open)}>{tableMenuOpen ? labels.hideSettings : labels.showSettings}</button></div>
      {tableMenuOpen ? (
      <div className="nav-section compact">
        {tables.map((table) => (
          <div key={table.id} className={table.id === activeTableId ? 'nav-line table active' : 'nav-line table'}>
            <button className="nav-item table" onClick={() => onSelectTable(table.id)}>{table.name}</button>
            <button aria-label={`${labels.rename} ${table.name}`} onClick={() => onRenameTable(table.id)}>✎</button>
            <button aria-label={`${labels.delete} ${table.name}`} onClick={() => onDeleteTable(table.id)}>×</button>
          </div>
        ))}
      </div>
      ) : null}
      <div className="menu-section-heading"><strong>{labels.views}</strong><button className="secondary-action" onClick={() => setViewMenuOpen((open) => !open)}>{viewMenuOpen ? labels.hideSettings : labels.showSettings}</button></div>
      {viewMenuOpen ? (
        <div className="nav-section compact">
          <div className={!activeViewId ? 'nav-line view active' : 'nav-line view'}>
            <button className="nav-item view" onClick={() => onSelectView(null)}>{labels.allRecords}</button>
          </div>
          {views.map((view) => (
            <div key={view.id} className={view.id === activeViewId ? 'nav-line view active' : 'nav-line view'}>
              <button className="nav-item view" onClick={() => onSelectView(view.id)}>{view.name}</button>
            </div>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
