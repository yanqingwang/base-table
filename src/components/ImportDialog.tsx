import { useState } from 'react';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (path: string) => Promise<void>;
  labels: {
    importExcel: string;
    workbookPath: string;
    import: string;
    cancel: string;
  };
}

export default function ImportDialog({ open, onClose, onImport, labels }: ImportDialogProps) {
  const [path, setPath] = useState('');
  const [busy, setBusy] = useState(false);
  if (!open) {
    return null;
  }

  async function submit() {
    if (!path.trim()) {
      return;
    }
    setBusy(true);
    try {
      await onImport(path.trim());
      setPath('');
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog-card" role="dialog" aria-modal="true" aria-label={labels.importExcel}>
        <h2>{labels.importExcel}</h2>
        <label>
          {labels.workbookPath}
          <input value={path} onChange={(event) => setPath(event.target.value)} placeholder="/path/to/workbook.xlsx" />
        </label>
        <div className="dialog-actions">
          <button onClick={onClose}>{labels.cancel}</button>
          <button className="primary-action" disabled={busy || !path.trim()} onClick={submit}>{labels.import}</button>
        </div>
      </section>
    </div>
  );
}
