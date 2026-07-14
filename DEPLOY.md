# Deployment auf Coolify

Das Projekt wird über den Build Pack **`Docker Compose`** deployt. Coolify parst
die mitgelieferte `docker-compose.yaml`, findet jede `${VARIABLE}`-Referenz und
legt daraus **automatisch editierbare Felder** im Tab „Environment Variables" an.
Damit trägst du die Werte einmal in der UI ein – sie fließen sowohl in die
Build-Args (`NEXT_PUBLIC_*`) als auch in die Laufzeit-Umgebung.

> Wichtig: **Nicht** den Build Pack `Dockerfile` verwenden. Dabei liest Coolify
> keine `.env`/`.env.example` ein, und die Variablenfelder erscheinen nicht.

## 1. Ressource anlegen

1. In Coolify: **+ New → Application** (Public/Private Repository)
2. Repository verbinden, Branch: `master`
3. **Build Pack: `Docker Compose`** auswählen
4. Docker Compose Location: `/docker-compose.yaml` (Standard)

## 2. Environment-Variablen

Nach dem ersten Speichern legt Coolify die Felder aus der Compose-Datei an.
Werte eintragen (aus Supabase-Dashboard / `.env.example`):

| Variable | Build-Zeit? | Pflicht |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ **„Available at Buildtime" aktivieren** | ja |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ **„Available at Buildtime" aktivieren** | ja |
| `SUPABASE_SERVICE_ROLE_KEY` | nein (nur Laufzeit) | ja |
| `LIBRETRANSLATE_URL` | nein | optional |
| `LIBRETRANSLATE_API_KEY` | nein | optional |

Die Felder erscheinen automatisch, sobald Coolify die `docker-compose.yaml`
eingelesen hat (jede `${VAR}`-Referenz wird ein editierbares Feld). Erscheint
**kein** Feld, ist meist noch der alte Build Pack `Dockerfile` aktiv — auf
`Docker Compose` umstellen und einmal speichern.

Die beiden `NEXT_PUBLIC_*`-Variablen werden beim `next build` fest ins
Client-Bundle eingebacken (auch der erlaubte Bild-Host in `next.config.ts` wird
daraus abgeleitet) und sind in `docker-compose.yaml` als Build-Args explizit mit
`${VAR}` interpoliert (`args: NAME: ${VAR}`) — so erkennt Coolifys UI sie korrekt
als Variable statt sie als "hardcoded" zu markieren. **Nicht** den Coolify-Toggle
„Build Variable?" benutzen; der funktioniert bei Docker Compose nicht. Es genügt,
die Variable normal im Tab „Environment Variables" zu setzen. Nach einer
Änderung dieser Werte ist ein **Redeploy (Rebuild)** nötig.

`SUPABASE_SERVICE_ROLE_KEY` ist ein Geheimnis mit vollen DB-Rechten — niemals
mit `NEXT_PUBLIC_`-Prefix versehen und nicht als Build-Arg übergeben.

## 3. Netzwerk / Port / Domain

Der Container exponiert Port `3000`; Coolify routet seinen Proxy automatisch
dorthin. Die öffentliche **Domain** wird in der Coolify-UI unter der Application
gesetzt. Der **Healthcheck** ist bereits in `docker-compose.yaml` und im
`Dockerfile` (`/api/health`) definiert und ermöglicht Zero-Downtime-Deploys.

## 4. LibreTranslate (optional)

Für die automatische Übersetzung im Admin-Bereich zwei Varianten:

**A) Eigener Coolify-Service** (empfohlen): LibreTranslate
(`libretranslate/libretranslate`) als separaten Service anlegen und
`LIBRETRANSLATE_URL` auf dessen interne URL setzen, z. B.
`http://<service-name>:5000` (gleiches Docker-Netzwerk/Projekt).

**B) Mitstarten**: den auskommentierten `libretranslate`-Block in
`docker-compose.yaml` einkommentieren und `LIBRETRANSLATE_URL=http://libretranslate:5000`
setzen.

**Wichtig:** Der Container lädt standardmäßig nur ausgewählte Sprachmodelle
(`LT_LOAD_ONLY` / `--load-only <codes>`). Nur Sprachen, deren Code dort
aufgeführt ist, lassen sich unter `/admin/translations` sinnvoll aktivieren —
für alle anderen schlägt die Übersetzung mit `"<code> is not supported"` fehl
(Inhalte bleiben dann auf Deutsch). Der vollständige Satz an im Admin wählbaren
Sprachen steht in `src/i18n/routing.ts`; `LT_LOAD_ONLY` sollte alle Codes
enthalten, die aktiviert werden sollen, z. B.:
`ar,de,el,en,es,nl,pl,ru,fr,it,tr,pt,cs,da,sv,uk,ro,hu,zh,ja`
(mehr Sprachmodelle = mehr RAM/Speicherbedarf des Containers).

## 5. Deploy

**Deploy** klicken. Der erste Build dauert am längsten (npm ci + next build);
Folge-Builds sind dank Layer-Caching deutlich schneller, solange sich
`package-lock.json` nicht ändert.

Danach prüfen:

- `https://<domain>/api/health` → `{"status":"ok"}`
- `https://<domain>/` → Redirect auf `/de` (Standard-Locale)
- Admin-Login unter `/admin` (Supabase-Auth)

## Lokal testen

Eine `.env` neben der `docker-compose.yaml` mit den Werten anlegen
(siehe `.env.example`), dann:

```bash
docker compose up --build
```

Ohne Compose, nur Dockerfile:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -t taverna-zeus .

docker run --rm -p 3000:3000 --env-file .env taverna-zeus
```

Ohne Docker: `npm run build && node .next/standalone/server.js`
(vorher `public/` und `.next/static/` gemäß Next-Doku in den Standalone-Ordner
kopieren, siehe `node_modules/next/dist/docs/.../output.md` — im Docker-Image
erledigt das das Dockerfile).
