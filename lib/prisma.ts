import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function withPrismaRetry<T>(operation: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0 || !isRetryableConnectionError(error)) throw error;

    await prisma.$disconnect().catch(() => undefined);
    return withPrismaRetry(operation, retries - 1);
  }
}

function isRetryableConnectionError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Server has closed the connection") ||
    message.includes("closed the connection") ||
    message.includes("idle-in-transaction timeout") ||
    message.includes("terminating connection") ||
    message.includes("P1017") ||
    message.includes("P1001")
  );
}
