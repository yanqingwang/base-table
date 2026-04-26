import type { AiUpdate } from '../lib/deepseek';

interface AiAssistantPanelProps {
  apiKey: string;
  instruction: string;
  busy: boolean;
  open: boolean;
  labels: {
    aiAssistant: string;
    deepseekApiKey: string;
    aiInstruction: string;
    runAi: string;
    processFormulas: string;
    hideSettings: string;
    showSettings: string;
  };
  onToggleOpen: () => void;
  onBindApiKey: () => void;
  onInstructionChange: (instruction: string) => void;
  onRun: () => void;
  onProcessFormulas: () => void;
  pendingUpdates: AiUpdate[];
}

export default function AiAssistantPanel({ apiKey, instruction, busy, open, labels, onToggleOpen, onBindApiKey, onInstructionChange, onRun, onProcessFormulas, pendingUpdates }: AiAssistantPanelProps) {
  return (
    <section className="ai-panel">
      <div className="panel-toggle-bar">
        <strong>{labels.aiAssistant}</strong>
        <button className="secondary-action" onClick={onToggleOpen}>{open ? labels.hideSettings : labels.showSettings}</button>
      </div>
      {open ? (
        <div className="ai-panel-body">
          <button className="secondary-action" onClick={onBindApiKey}>{apiKey ? labels.deepseekApiKey : labels.deepseekApiKey}</button>
          <input value={instruction} onChange={(event) => onInstructionChange(event.target.value)} placeholder={labels.aiInstruction} />
          <button className="secondary-action" onClick={onRun} disabled={busy || !apiKey || !instruction}>{busy ? '...' : labels.runAi}</button>
          <button className="secondary-action" onClick={onProcessFormulas}>{labels.processFormulas}</button>
          {pendingUpdates.length > 0 ? <small>{pendingUpdates.length} updates applied</small> : null}
        </div>
      ) : null}
    </section>
  );
}
