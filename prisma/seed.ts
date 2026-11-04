import { prisma } from "../src/config/prisma";
import { events, members, projects } from "./dataSeeds";
prisma
  .$connect()
  .catch(() => console.log("There was an error starting the database"));

async function main() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error(
      "Can not run seed, the application is currently running in a production environment",
    );
  }

  for (const member of members) {
    await prisma.member.upsert({
      where: { email: member.email },
      create: member,
      update: member,
    });
  }

  for (const event of events) {
    await prisma.event.upsert({
      where: { id: event.id },
      create: event,
      update: event,
    });
  }

  for (const project of projects) {
    await prisma.project.upsert({
      where: {
        repoOwner_repoName: {
          repoOwner: project.repoOwner,
          repoName: project.repoName,
        },
      },
      create: project,
      update: project,
    });
  }
}

main()
  .then(() => {
    console.log(`🌱 data seeding implemented successfully`);
    process.exit(0);
  })
  .catch((err) => {
    if (err instanceof Error) {
      console.log(`something went wrong: ${err.message}`);
      process.exit(1);
    }
  })
  .finally(async () => await prisma.$disconnect);
