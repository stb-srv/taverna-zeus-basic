# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.
Das Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/1.1.0/).

## 2026-07-12

### Hinzugefügt

- **Schwebende Aktions-Icons** unten rechts (bei Arabisch automatisch links),
  die beim Scrollen mitfahren: der Dark-Mode-Umschalter (jetzt dort statt in
  der Navigationsleiste, auch im Admin) und auf der Website ein
  **Fingerabdruck-Icon**, das nach der Cookie-Entscheidung die Einstellungen
  jederzeit wieder öffnet
- **DSGVO-konformer Cookie-Widerruf** (Art. 7 Abs. 3 DSGVO / §25 TTDSG):
  Der Consent-Banner lässt sich über das Fingerabdruck-Icon jederzeit erneut
  öffnen, zeigt die aktuelle Auswahl an und erlaubt das Umentscheiden mit
  denselben gleichgewichtigen Buttons; ein Widerruf entlädt die
  OpenStreetMap-Karte sofort. Einwilligungen werden mit Zeitstempel und
  Textversion gespeichert (Rechenschaftspflicht, Art. 7 Abs. 1); ändert sich
  der Einwilligungstext inhaltlich, fragt der Banner erneut. Neue Texte in
  allen 8 Sprachdateien
- **Globaler Dark Mode** als Addon: Alle Farben laufen über zentrale
  Design-Tokens in `globals.css`; der Dunkelmodus ist ein reines
  Variablen-Overlay (`<html data-theme="dark">`) — keine Seite musste
  angepasst werden, und neue Seiten erben ihn automatisch. Umschalter
  (Sonne/Mond) in der Website-Navigation und im Admin-Header, Wahl wird
  gespeichert, Standard folgt der Systemeinstellung, ein Init-Script
  verhindert Farb-Flackern beim Laden.

### Behoben

- CMS-Seiten mit „im Menü anzeigen“ erscheinen jetzt tatsächlich in der
  Navigation (Desktop und Mobil) und sind unter ihrer eigenen URL erreichbar
  (neue Route `/<sprache>/<slug>`) — zuvor gab es weder Nav-Einträge noch eine
  Route für selbst erstellte Seiten
- Englisch ist kein Pflichtfeld mehr: Leere EN-Felder (Titel, Namen,
  Beschreibungen, Inhalte) werden beim Speichern automatisch über
  LibreTranslate gefüllt; manuell eingetragenes Englisch hat weiterhin Vorrang

### Hinzugefügt

- **Sprachverwaltung im Admin**: Unter „Übersetzungen“ lassen sich Sprachen
  aktivieren/deaktivieren (bis zu 20, u. a. Französisch, Italienisch, Türkisch,
  Ukrainisch, Chinesisch). Beim Aktivieren werden Oberflächentexte und alle
  Inhalte automatisch über LibreTranslate übersetzt; die aktiven Sprachen und
  die maschinellen UI-Texte liegen in der Datenbank
  (SQL-Migration: `supabase/migrations/20260712_dynamic_locales.sql`).
  Deaktivierte Sprachen behalten ihre Übersetzungen und leiten Besucher auf
  Deutsch um. ICU-Plural-Strings werden nie maschinell übersetzt (Schutz vor
  kaputter Syntax), fehlende UI-Texte fallen auf Deutsch zurück.
- Admin-Seite **„Übersetzungen“** (`/admin/translations`): zeigt für alle Inhalte
  (Speisen, Kategorien, Seiten, Beschreibung, Allergene, Zusatzstoffe), welche
  Sprachen bereits übersetzt sind und welche fehlen; der Button „Fehlende
  Übersetzungen erstellen“ füllt alle Lücken gebündelt über LibreTranslate —
  vorhandene Werte werden nie überschrieben (`src/lib/i18n-backfill.ts`,
  `src/lib/translation-status.ts`)
- Vitest-Testsuite mit 55 Unit-Tests (`npm test`): Geocoding, Formular-Parsing
  (inkl. deutschem Dezimalkomma), Übersetzungs-Autofill, Übersetzungsstatus,
  Locale-Formatierung, Export-Dateinamen sowie Konsistenzprüfung aller
  8 Sprachdateien
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
