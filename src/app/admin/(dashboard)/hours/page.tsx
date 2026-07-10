import { getOpeningHours } from "@/lib/queries";
import HoursForm from "./HoursForm";

export default async function HoursPage() {
  const hours = await getOpeningHours();
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl">Öffnungszeiten</h1>
      <p className="mb-6 text-sm text-muted">Zeiten pro Wochentag festlegen.</p>
      <HoursForm hours={hours} />
    </div>
  );
}
