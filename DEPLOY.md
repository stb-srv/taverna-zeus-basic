# Deployment auf Coolify

Das Projekt wird über das mitgelieferte Multi-Stage-`Dockerfile` deployt
(Next.js-Standalone-Output → kleines Image, schnelle Builds durch Layer-Caching).

## 1. Ressource anlegen

1. In Coolify: **+ New → Application** (Public/Private Repository)
2. Repository verbinden, Branch: `master`
3. **Build Pack: `Dockerfile`** auswählen (nicht Nixpacks)
4. Dockerfile Location: `/Dockerfile` (Standard)

## 2. Netzwerk / Port

| Einstellung | Wert |
|---|---|
| Ports Exposes | `3000` |
| Health Check Path | `/api/health` |
| Health Check Port | `3000` |

Der Healthcheck ermöglicht Zero-Downtime-Deploys (Rolling Update).
Hinweis: Das Alpine-Image enthält kein `curl`; falls Coolify für den
Healthcheck ein Kommando statt eines HTTP-Checks verwendet, `wget -q -O- http://127.0.0.1:3000/api/health` nutzen.

## 3. Environment-Variablen

Unter **Environment Variables** eintragen (Werte siehe `.env.example` / Supabase-Dashboard):

| Variable | Build-Zeit? | Pflicht |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ **„Available at Buildtime" aktivieren** | ja |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ **„Available at Buildtime" aktivieren** | ja |
| `SUPABASE_SERVICE_ROLE_KEY` | nein (nur Laufzeit) | ja |
| `LIBRETRANSLATE_URL` | nein | optional |
| `LIBRETRANSLATE_API_KEY` | nein | optional |

Wichtig: Die beiden `NEXT_PUBLIC_*`-Variablen werden beim `next build` fest ins
Client-Bundle eingebacken. Ohne das Buildtime-Häkchen kommen sie im Docker-Build
nicht an und die Supabase-Anbindung im Browser schlägt fehl. Nach einer Änderung
dieser Werte ist ein **Redeploy (Rebuild)** nötig.

`SUPABASE_SERVICE_ROLE_KEY` ist ein Geheimnis mit vollen DB-Rechten — niemals
mit `NEXT_PUBLIC_`-Prefix versehen und nicht als Build-Arg übergeben.

## 4. LibreTranslate (optional)

Für die automatische Übersetzung im Admin-Bereich kann LibreTranslate als
eigener Coolify-Service laufen (Docker-Image `libretranslate/libretranslate`).
Dann `LIBRETRANSLATE_URL` auf die interne URL des Services setzen, z. B.
`http://<service-name>:5000` (beide im selben Docker-Netzwerk/Projekt).

## 5. Deploy

**Deploy** klicken. Der erste Build dauert am längsten (npm ci + next build);
Folge-Builds sind dank Layer-Caching deutlich schneller, solange sich
`package-lock.json` nicht ändert.

Danach prüfen:

- `https://<domain>/api/health` → `{"status":"ok"}`
- `https://<domain>/` → Redirect auf `/de` (Standard-Locale)
- Admin-Login unter `/admin` (Supabase-Auth)

## Lokal testen

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -t taverna-zeus .

docker run --rm -p 3000:3000 --env-file .env.local taverna-zeus
```

Ohne Docker: `npm run build && node .next/standalone/server.js`
(vorher `public/` und `.next/static/` gemäß Next-Doku in den Standalone-Ordner
kopieren, siehe `node_modules/next/dist/docs/.../output.md` — im Docker-Image
erledigt das das Dockerfile).
