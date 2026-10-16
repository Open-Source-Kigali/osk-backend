import { prisma } from "../config/prisma";
import { Member, Prisma } from "../generated/prisma/client";
import buildSearchFilter from "../utils/Search";

async function findAllMembers(search?: string) {
  return prisma.member.findMany({
    where: buildSearchFilter<Prisma.MemberWhereInput>(search, [
      "name",
      "email",
    ]),
    orderBy: { name: "asc" },
  });
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
