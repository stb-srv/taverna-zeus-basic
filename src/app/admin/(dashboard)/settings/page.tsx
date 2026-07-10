import { getSettings } from "@/lib/queries";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">Standort & Kontakt</h1>
      <p className="mb-6 text-sm text-muted">Adresse, Kontaktdaten, Karte und Hero-Bild.</p>
      <SettingsForm settings={settings} />
    </div>
  );
}
