import { defineConfig } from "prisma/config";

// Prisma CLI не читает .env самостоятельно начиная с v7
process.loadEnvFile();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
