import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Generic best-effort disk snapshot for Supabase-backed data, used as a
 * fallback when Supabase itself is unreachable — never a cause of failure on
 * its own. Lives under the container's writable layer at
 * `/app/.cache/<namespace>`, backed by a persistent Docker volume mounted at
 * `/app/.cache` (see Dockerfile/docker-compose.yaml) so it survives
 * redeploys, not just container restarts.
 */
function dir(namespace: string): string {
  return path.join(process.cwd(), ".cache", namespace);
}

/** Cache keys can contain arbitrary IDs (e.g. `page:<uuid>`) — keep only filesystem-safe characters (":" breaks on Windows). */
function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function filePath(namespace: string, key: string): string {
  return path.join(dir(namespace), `${sanitizeKey(key)}.json`);
}

/** Write-through snapshot, called after every successful read. Never throws. */
export async function writeDiskCache<T>(namespace: string, key: string, data: T): Promise<void> {
  try {
    await mkdir(dir(namespace), { recursive: true });
    const target = filePath(namespace, key);
    // Must be unique per call, not per process: in the container the app runs
    // as PID 1, so `process.pid` is identical for every concurrent request and
    // concurrent writes to the same key raced on the same tmp path — the loser's
    // rename then failed with ENOENT because the winner had already consumed it.
    const tmp = `${target}.tmp-${randomUUID()}`;
    await writeFile(tmp, JSON.stringify(data));
    await rename(tmp, target);
  } catch (e) {
    console.error(`Disk-Cache: Schreiben für "${namespace}/${key}" fehlgeschlagen`, e);
  }
}

/** Last known-good snapshot for a key, or null if none exists yet. */
export async function readDiskCache<T>(namespace: string, key: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(filePath(namespace, key), "utf8")) as T;
  } catch {
    return null;
  }
}
