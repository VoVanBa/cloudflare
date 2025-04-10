import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

declare const DB: D1Database; // Binding từ wrangler.toml

function createPrismaClient(env: Env) {
  const adapter = new PrismaD1(env.DB); // Sử dụng binding D1
  return new PrismaClient({ adapter });
}

export function getPrismaClient(env: Env) {
  if (!prisma) {
    prisma = createPrismaClient(env);
  }
  return prisma;
}
