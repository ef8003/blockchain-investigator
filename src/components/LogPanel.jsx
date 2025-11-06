// מה זה עושה:
// לוח לוג – מציג את היסטוריית הקריאות.
import { useState } from "react";

export default function LogPanel({ logs = [], onClear, loading = false }) {

  const [open, setOpen] = useState(true);

  const items = Array.isArray(logs) ? logs : [];

  const pretty = (v) => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    try { return JSON.stringify(v, null, 2); } catch { return String(v); }
  };

  return (
    <div className="log-panel">
      <div className="log-header" style={{display:'flex', gap:8, alignItems:'center'}}>
        <strong className="blue_strong">Logs</strong>
        <div style={{marginInlineStart:'auto', display:'flex', gap:8}}>
          {loading && <span>loading…</span>}
          <button className="css-74d805-MuiButtonBase-root-MuiButton-root" onClick={onClear}>Cleaning</button>
        </div>
        {items.length > 0 && (
          <button
              className="close_open_logs"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? "Close" : "Open"}
            </button>
        )}
      </div>

      {!open ? null : items.length === 0 ? (
        <div className="log-empty">There are no logs to display yet...</div>
      ) : (
        <ul className="log-list" style={{ direction: "ltr", fontFamily: "monospace" }}>
          {items.map((it, idx) => (
            <li key={it.id ?? it.ts ?? idx}>
              {it.ts ? new Date(it.ts).toLocaleTimeString() + " — " : null}
              {it.msg ?? it.message ?? pretty(it)}
              {it.meta ? <pre style={{ margin: 4 }}>{pretty(it.meta)}</pre> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
