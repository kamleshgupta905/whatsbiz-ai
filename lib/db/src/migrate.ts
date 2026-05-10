import { migrate } from "drizzle-orm/pglite/migrator";
import { db } from "./index";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log("Running migrations with PGlite...");
  const migrationsFolder = path.resolve(__dirname, "../migrations");
  await migrate(db, { migrationsFolder });
  console.log("Migrations applied successfully!");
}

runMigrations().catch((err) => {
  console.error("Failed to run migrations:", err);
  process.exit(1);
});
