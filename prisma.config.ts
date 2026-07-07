import "dotenv/config";
import { defineConfig } from "prisma/config";
import path from "path";

const absoluteDbPath = path.resolve(process.cwd(), "prisma/dev.db").replace(/\\/g, "/");
const databaseUrl = `file:${absoluteDbPath}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
