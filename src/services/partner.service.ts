import { prisma } from "../config/prisma";
import { Partner, Prisma } from "../generated/prisma/client";
import buildSearchFilter from "../utils/Search";

async function findAllPartners(search?: string) {
  return prisma.partner.findMany({
    where: buildSearchFilter<Prisma.PartnerWhereInput>(search, [
      "name",
      "description",
    ]),
    orderBy: {
      name: "asc",
    },
  });
}

async function addPartner(
  partnerData: Omit<Partner, "id" | "createdAt" | "updatedAt">,
) {
  return prisma.partner.create({ data: partnerData });
}

async function findPartnerById(id: string) {
  return prisma.partner.findUnique({
    where: { id },
    omit: { logoPublicId: true },
  });
}

async function findPartnerByIdInternal(id: string) {
  return prisma.partner.findUnique({ where: { id } });
}

async function updatePartner(
  id: string,
  partnerData: Partial<Omit<Partner, "id" | "createdAt" | "updatedAt">>,
) {
  return prisma.partner.update({ where: { id }, data: partnerData });
}

async function deletePartner(id: string) {
  return prisma.partner.delete({ where: { id } });
}

export default {
  findAllPartners,
  addPartner,
  findPartnerById,
  findPartnerByIdInternal,
  updatePartner,
  deletePartner,
};
