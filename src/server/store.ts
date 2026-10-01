import "server-only";
import { createHash } from "node:crypto";

/**
 * Rider report storage.
 *
 *  - DATABASE_URL set      → PostgreSQL (e.g. a free Neon database on Vercel).
 *  - running on Vercel without it → disabled: reports would be lost on the next
 *    cold start, so the app says contributions are off instead of pretending.
 *  - local development     → PGlite, an embedded Postgres stored in .data/.
 *
 * Only salted hashes of the device id and IP address are stored.
 */

interface Db {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
}

const SCHEMA = `
create table if not exists layout_reports (
  line        text        not null,
  station     text        not null,
  egress_id   text        not null,
  device_hash text        not null,
  ip_hash     text        not null,
  car         smallint    not null,
  door        smallint    not null,
  created_at  timestamptz not null default now(),
  primary key (line, station, egress_id, device_hash)
);
create index if not exists layout_reports_ip_time on layout_reports (ip_hash, created_at);
`;

async function connect(): Promise<Db | null> {
  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    const url = process.env.DATABASE_URL;
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    const pool = new Pool({ connectionString: url, max: 3, ssl: local ? undefined : { rejectUnauthorized: true } });
    const db: Db = { query: async (sql, params) => (await pool.query(sql, params as unknown[])).rows };
    await db.query(SCHEMA);
    return db;
  }
  if (process.env.VERCEL) return null;
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.REPORTS_DB_DIR ?? ".data/pglite";
  if (dir !== "memory") (await import("node:fs")).mkdirSync(dir, { recursive: true });
  const pg = dir === "memory" ? new PGlite() : new PGlite(dir);
  await pg.exec(SCHEMA);
  return { query: async <T,>(sql: string, params?: unknown[]) => (await pg.query<T>(sql, params)).rows };
}

// One connection per server process, also across dev hot reloads.
const g = globalThis as unknown as { __yutoriDb?: Promise<Db | null> };
export function db(): Promise<Db | null> {
  g.__yutoriDb ??= connect().catch((err) => {
    console.error("report store unavailable:", err);
    g.__yutoriDb = undefined;
    return null;
  });
  return g.__yutoriDb;
}

export function hashId(value: string): string {
  const salt = process.env.REPORT_SALT ?? "yutori-dev-salt";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex").slice(0, 32);
}

export interface LayoutReportRow {
  station: string;
  egress_id: string;
  car: number;
  door: number;
}

/**
 * Votes per egress point, at most one per network address (the latest), so one
 * person cycling through browser profiles on one connection counts once. Riders
 * on different networks, including different mobile carriers, count separately.
 */
export async function layoutReports(line: string): Promise<LayoutReportRow[] | null> {
  const d = await db();
  if (!d) return null;
  return d.query<LayoutReportRow>(
    `select distinct on (station, egress_id, ip_hash) station, egress_id, car, door
     from layout_reports where line = $1
     order by station, egress_id, ip_hash, created_at desc`,
    [line],
  );
}

export async function saveLayoutReport(r: { line: string; station: string; egressId: string; car: number; door: number; deviceHash: string; ipHash: string }): Promise<boolean> {
  const d = await db();
  if (!d) return false;
  // Re-reporting from the same device replaces that device's earlier vote.
  await d.query(
    `insert into layout_reports (line, station, egress_id, device_hash, ip_hash, car, door)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (line, station, egress_id, device_hash)
     do update set car = excluded.car, door = excluded.door, ip_hash = excluded.ip_hash, created_at = now()`,
    [r.line, r.station, r.egressId, r.deviceHash, r.ipHash, r.car, r.door],
  );
  return true;
}

/** Reports from this IP in the last hour, across all devices: limits one person faking many devices. */
export async function recentReportsFromIp(ipHash: string): Promise<number> {
  const d = await db();
  if (!d) return 0;
  const rows = await d.query<{ n: string | number }>(
    "select count(*) as n from layout_reports where ip_hash = $1 and created_at > now() - interval '1 hour'",
    [ipHash],
  );
  return Number(rows[0]?.n ?? 0);
}
