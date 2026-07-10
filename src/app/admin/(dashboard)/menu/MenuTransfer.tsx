"use client";

import { useActionState, useState } from "react";
import { importMenu, type ActionState } from "../../actions";
import { btnGhost, btnPrimary, inputCls } from "../ui";

const initial: ActionState = {};

export default function MenuTransfer() {
  const [state, action, pending] = useActionState(importMenu, initial);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <section className="card-soft space-y-4 p-6 hover:translate-y-0">
      <h2 className="font-display text-xl">Import / Export</h2>
      <p className="text-sm text-muted">
        Sichere die komplette Speisekarte als ZIP-Paket – inklusive aller Bilder – oder spiele ein
        zuvor exportiertes Paket wieder ein. <strong>Import ersetzt die gesamte Speisekarte.</strong>
      </p>

      <a
        href="/admin/api/menu/export"
        className={`inline-flex items-center gap-2 ${btnGhost}`}
        download
      >
        <DownloadIcon />
        Speisekarte exportieren (ZIP)
      </a>

      <form
        action={action}
        onSubmit={(e) => {
          if (!confirm("Import ersetzt die komplette Speisekarte. Fortfahren?")) e.preventDefault();
        }}
        className="space-y-3 border-t border-border pt-4"
      >
        <input
          type="file"
          name="file"
          accept=".zip,application/zip,application/json,.json"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          className="block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-primary-dark"
        />
        {fileName && <p className="text-xs text-muted">Ausgewählt: {fileName}</p>}
        <details className="text-sm text-muted">
          <summary className="cursor-pointer select-none">… oder JSON direkt einfügen</summary>
          <textarea
            name="data"
            rows={5}
            placeholder="JSON hier einfügen"
            className={`${inputCls} mt-2 font-mono text-xs`}
          />
        </details>
        <div className="flex items-center gap-4">
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? "Import …" : "Importieren"}
          </button>
          {state.ok && <span className="text-sm text-primary">Import erfolgreich ✓</span>}
          {state.error && <span className="text-sm text-accent">{state.error}</span>}
        </div>
      </form>
    </section>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
