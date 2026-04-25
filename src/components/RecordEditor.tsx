interface RecordEditorProps {
  onCreateRecord: () => void;
  labels: {
    addRecord: string;
  };
}

export default function RecordEditor({ onCreateRecord, labels }: RecordEditorProps) {
  return <button className="primary-action" onClick={onCreateRecord}>{labels.addRecord}</button>;
}
