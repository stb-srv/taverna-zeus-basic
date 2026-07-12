# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.
Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

## 2026-07-12

### Hinzugefügt

- Vitest-Testsuite mit 46 Unit-Tests (`npm test`): Geocoding, Formular-Parsing
  (inkl. deutschem Dezimalkomma), Übersetzungs-Autofill, Locale-Formatierung,
  Export-Dateinamen sowie Konsistenzprüfung aller 8 Sprachdateien
- Automatisches Geocoding: Bleibt das Karten-URL-Feld in den Einstellungen leer,
  wird die Embed-URL beim Speichern serverseitig via Nominatim aus der
  Restaurantadresse erzeugt (`src/lib/geocode.ts`)
- Gemeinsamer `useConsent`-Hook auf Basis von `useSyncExternalStore`
  (`src/hooks/use-consent.ts`) — ersetzt die doppelte Consent-Logik in
  Cookie-Banner und Karte und synchronisiert die Auswahl über Browser-Tabs

### Geändert

- Google Maps durch eine consent-geschützte **OpenStreetMap**-Einbettung ersetzt
  (DSGVO: keine Datenübertragung an Google mehr); Consent-Texte in allen
  8 Sprachen aktualisiert, iframe lädt mit `referrerPolicy="no-referrer"`
- Admin-Server-Actions aus einer 481-Zeilen-Monolith-Datei in Domänen-Module
  unter `src/app/admin/actions/` aufgeteilt (settings, hours, menu, pages,
  translations, admins, menu-import); reine `FormData`-Helfer nach
  `src/lib/form-data.ts` extrahiert
- README für das Projekt neu geschrieben; Struktur- und Testregeln in
  `AGENTS.md` dokumentiert

## 2026-07-10

### Hinzugefügt

- Mehrsprachigkeit mit next-intl: 8 Sprachen (de, en, el, ru, pl, nl, ar, es)
  mit lokalisierten Routen und Sprachumschalter
- Healthcheck-Endpoint `/api/health`
- Multi-Stage-Dockerfile mit Next.js-Standalone-Output
- Coolify-Deployment-Guide (`DEPLOY.md`) und `.env.example`

## 2026-07-05

- Initiales Projekt-Setup mit Create Next App
