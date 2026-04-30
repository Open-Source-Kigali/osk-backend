import { prisma } from "../config/prisma";

async function findAllMembers() {
  return prisma.member.findMany();
}

export default { findAllMembers };
