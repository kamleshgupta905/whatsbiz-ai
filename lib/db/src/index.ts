import { drizzle as drizzlePgLite } from "drizzle-orm/pglite";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import * as schema from "./schema";
import path from "path";

export * from "./schema";

const dbUrl = process.env.DATABASE_URL;
const isPlaceholder = !dbUrl || dbUrl.includes("[YOUR-PASSWORD]");

export let db: any;
export let client: any;

if (isPlaceholder) {
  console.log("⚠️  Using local PGlite database because DATABASE_URL is not set or is a placeholder.");
  const dbPath = path.resolve(process.cwd(), "../../.local-db");
  client = new PGlite(dbPath);
  db = drizzlePgLite(client, { schema });
} else {
  console.log("🌐 Connecting to live Supabase database...");
  const { Pool } = pg;
  const pool = new Pool({ connectionString: dbUrl });
  db = drizzleNodePg(pool, { schema });
  client = pool;
}
