/**
 * One-off operator script to create or update an ADMIN user with a bcrypt password.
 *
 * Usage (never commit real values):
 *   ADMIN_EMAIL=admin@example.com \
 *   ADMIN_PASSWORD='...' \
 *   ADMIN_NAME='Site Admin' \
 *   npx ts-node --project tsconfig.json scripts/provision-admin.ts
 *
 * Reads credentials only from environment variables. Does not print the password
 * or password hash. There is no public registration endpoint.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../src/generated/prisma/client";
import { hashPassword } from "../src/utils/password";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Administrator";
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }
  if (!email || !email.includes("@")) {
    console.error("ADMIN_EMAIL must be a valid email address.");
    process.exit(1);
  }
  if (!password || password.length < 12) {
    console.error("ADMIN_PASSWORD must be set and at least 12 characters.");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    const passwordHash = await hashPassword(password);
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name,
          password: passwordHash,
          role: UserRole.ADMIN,
        },
      });
      console.log(`Updated administrator account for ${email}.`);
    } else {
      await prisma.user.create({
        data: {
          name,
          email,
          password: passwordHash,
          role: UserRole.ADMIN,
        },
      });
      console.log(`Created administrator account for ${email}.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Failed to provision administrator.");
  if (process.env.NODE_ENV !== "production") {
    console.error(err instanceof Error ? err.message : "Unknown error");
  }
  process.exit(1);
});
