import { prisma } from "../config/prisma";
import { Member } from "../generated/prisma/client";

async function findAllMembers() {
  return prisma.member.findMany();
}

async function addMember(
  memberData: Omit<Member, "id" | "createdAt" | "updatedAt">,
) {
  return prisma.member.create({ data: memberData });
}

async function findMemberById(id: string) {
  return prisma.member.findUnique({ where: { id } });
}

async function updateMember(
  id: string,
  memberData: Partial<Omit<Member, "id" | "createdAt" | "updatedAt">>,
) {
  return prisma.member.update({ where: { id }, data: memberData });
}

async function deleteMember(id: string) {
  return prisma.member.delete({ where: { id } });
}

export default {
  findAllMembers,
  addMember,
  findMemberById,
  updateMember,
  deleteMember,
};
