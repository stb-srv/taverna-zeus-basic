# Taverna Zeus — Restaurant-Website mit Admin-CMS

Mehrsprachige Restaurant-Website (Next.js + Supabase) mit integriertem Admin-Bereich
zur Pflege von Speisekarte, Öffnungszeiten, Seiteninhalten und Einstellungen —
ohne externes CMS.

## Features

**Öffentliche Website**

- Startseite, Speisekarte (mit Allergenen & Zusatzstoffen), Standort, CMS-Seiten
  (z. B. Impressum, Datenschutz)
- 8 Sprachen (de, en, el, ru, pl, nl, ar, es) über [next-intl](https://next-intl.dev) —
  Deutsch ist die Quellsprache, maschinelle Übersetzungen kommen aus einer
  selbst gehosteten LibreTranslate-Instanz
- DSGVO-freundlich: Cookie-Banner mit Zwei-Klick-Lösung; die Standort-Karte ist eine
  **OpenStreetMap**-Einbettung (kein Google) und lädt erst nach Zustimmung

**Admin-Bereich** (`/admin`, Login via Supabase Auth)

- Speisekarte: Kategorien & Gerichte inkl. Bilder, Allergene, Zusatzstoffe,
  Import/Export als JSON oder ZIP-Bundle mit Bildern
- Öffnungszeiten, CMS-Seiten (Markdown), Admin-Verwaltung
- Einstellungen: Name, Adresse, Kontakt, Hero-Bild — die Standort-Karte wird
  automatisch aus der Adresse erzeugt (Geocoding via Nominatim, serverseitig)
- Übersetzungen pro Feld einsehbar und per Klick neu generierbar

## Tech-Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Supabase (DB, Auth, Storage) ·
next-intl · LibreTranslate (optional) · Vitest

## Loslegen

```bash
npm install
cp .env.example .env   # Supabase-Zugangsdaten eintragen (siehe Kommentare in der Datei)
npm run dev            # http://localhost:3000
```

## Skripte

| Befehl               | Zweck                                    |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Entwicklungsserver                       |
| `npm run build`      | Production-Build                         |
| `npm start`          | Production-Server                        |
| `npm run lint`       | ESLint                                   |
| `npm test`           | Unit-Tests (Vitest, einmalig)            |
| `npm run test:watch` | Unit-Tests im Watch-Modus                |

## Projektstruktur

```
src/
├── app/
│   ├── [locale]/          Öffentliche Seiten (Start, Speisekarte, Standort, CMS)
│   ├── admin/             Admin-Bereich
│   │   └── actions/       Server-Actions, ein Modul pro Domäne
│   └── api/health/        Healthcheck für Deployments
├── components/            Wiederverwendbare UI (Nav, Footer, MapEmbed, …)
├── hooks/                 Client-Hooks (z. B. useConsent)
├── i18n/                  Routing & Locale-Konfiguration
└── lib/                   Logik: Supabase-Clients, Queries, Geocoding,
                           Übersetzung, FormData-Parsing
messages/                  Übersetzungsdateien, eine pro Sprache
test/                      Vitest-Unit-Tests
```

Konventionen für Änderungen am Code stehen in [`AGENTS.md`](AGENTS.md),
die Änderungshistorie in [`CHANGELOG.md`](CHANGELOG.md).

## Tests

`npm test` führt die Vitest-Suite aus (Geocoding, Formular-Parsing,
Übersetzungs-Autofill, Locale-Formatierung, Konsistenz der Sprachdateien).
Vor jedem Commit: `npm test`, `npm run lint` und `npx tsc --noEmit`.

## Deployment

Das Projekt wird als Docker-Container deployt (Multi-Stage-Build,
Next.js-Standalone). Anleitung für Coolify inkl. aller Umgebungsvariablen:
[`DEPLOY.md`](DEPLOY.md).
