"use client";

import { useActionState } from "react";
import { createAdminUser, type State } from "../../user-actions";
import { inputCls, btnPrimary } from "../ui";

const initial: State = {};

export default function AddAdmin({ disabled }: { disabled?: boolean }) {
  const [state, action, pending] = useActionState(createAdminUser, initial);
  return (
    <form action={action} className="card-soft space-y-3 p-4 hover:translate-y-0">
      <h2 className="font-display text-lg">Neuen Admin anlegen</h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted">E-Mail</label>
          <input name="email" type="email" required disabled={disabled} placeholder="name@example.com" className={inputCls} />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-muted">Passwort (mind. 8 Zeichen)</label>
          <input name="password" type="text" required minLength={8} disabled={disabled} className={inputCls} />
        </div>
        <button type="submit" disabled={pending || disabled} className={btnPrimary}>
          {pending ? "…" : "Anlegen"}
        </button>
      </div>
      <p className="text-xs text-muted">
        Legt ein bestätigtes Konto an und schaltet es frei. Die Person kann sich sofort mit E-Mail und Passwort anmelden.
      </p>
      {state.ok && <span className="text-sm text-primary">Admin angelegt ✓</span>}
      {state.error && <span className="text-sm text-accent">{state.error}</span>}
    </form>
  );
}
