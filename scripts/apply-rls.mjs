#!/usr/bin/env node
/**
 * Apply RLS migration to honey-shop Supabase.
 * Prefer: supabase db push (requires linked project).
 *
 * Fallback when CLI is unavailable — requires SUPABASE_DB_PASSWORD
 * (Dashboard → Project Settings → Database).
 *
 * Usage:
 *   SUPABASE_DB_PASSWORD='...' node scripts/apply-rls.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = "guijiahkrlnwgwmhlass";
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error(
    "Set SUPABASE_DB_PASSWORD (Supabase Dashboard → Project Settings → Database → Database password)",
  );
  process.exit(1);
}

const sqlFile = join(
  __dirname,
  "../supabase/migrations/20260528100000_enable_rls_all_tables.sql",
);
const migrationSql = readFileSync(sqlFile, "utf8");

const hosts = [
  `aws-0-us-east-1.pooler.supabase.com`,
  `aws-0-ap-southeast-1.pooler.supabase.com`,
];

async function tryConnect(host) {
  const db = postgres({
    host,
    port: 5432,
    database: "postgres",
    username: `postgres.${PROJECT_REF}`,
    password,
    ssl: "require",
    max: 1,
    connect_timeout: 10,
  });
  try {
    await db`select 1 as ok`;
    await db.unsafe(migrationSql);
    const rows = await db`
      select c.relname as table_name, c.relrowsecurity as rls_enabled
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
      order by c.relname
    `;
    console.log("RLS applied successfully.");
    console.table(rows);
    await db.end({ timeout: 5 });
    return true;
  } catch (err) {
    await db.end({ timeout: 5 }).catch(() => {});
    throw err;
  }
}

for (const host of hosts) {
  try {
    console.log(`Connecting via ${host}...`);
    await tryConnect(host);
    process.exit(0);
  } catch (err) {
    console.warn(`${host}: ${err.message}`);
  }
}

console.error("Could not connect to database. Check SUPABASE_DB_PASSWORD and region.");
process.exit(1);
