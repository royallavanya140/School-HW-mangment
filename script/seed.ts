/**
 * Run the database seed (creates default admin, dev admin, subjects if missing).
 * Requires DATABASE_URL. Run from project root: npm run db:seed
 */
import { seed } from "../server/seed";
import { pool } from "../server/db";

async function main() {
  await seed();
  await pool.end();
  console.log("Seed completed.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
