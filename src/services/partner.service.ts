import { prisma } from "../config/prisma";
import { Partner } from "../generated/prisma/client";

async function findAllPartners() {
  return prisma.partner.findMany();
}

async function addPartner(
  partnerData: Omit<Partner, "id" | "createdAt" | "updatedAt">,
) {
  return prisma.partner.create({ data: partnerData });
}

async function findPartnerById(id: string) {
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
  updatePartner,
  deletePartner,
};
