import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const main = async () => {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL is not set. Add it to environment or .env.local.",
      );
    }

    const sql = neon(databaseUrl);
    const db = drizzle({ client: sql });

    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("Migration successful 🚀");
    process.exit(0);
  } catch (error) {
    console.error("Error during migration ❌", error);
    process.exit(1);
  }
};

main();
