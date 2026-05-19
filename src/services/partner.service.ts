import { prisma } from "../config/prisma";
import { Partner, Prisma } from "../generated/prisma/client";

// Public partner payloads only expose the URL clients render, not the storage key.
const partnerSafeSelect = {
  id: true,
  name: true,
  websiteUrl: true,
  logoUrl: true,
  description: true,
  email: true,
  partnershipReason: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PartnerSelect;

async function findAllPartners() {
  return prisma.partner.findMany({
    select: partnerSafeSelect,
    orderBy: { name: "asc" },
  });
}

async function findPartnerByIdSafe(id: string) {
  return prisma.partner.findUnique({
    where: { id },
    select: partnerSafeSelect,
  });
}

async function addPartner(
  partnerData: Omit<Partner, "id" | "createdAt" | "updatedAt">,
) {
  return prisma.partner.create({
    data: partnerData,
    select: partnerSafeSelect,
  });
}

async function findPartnerById(id: string) {
  return prisma.partner.findUnique({ where: { id } });
}

async function updatePartner(
  id: string,
  partnerData: Partial<Omit<Partner, "id" | "createdAt" | "updatedAt">>,
) {
  return prisma.partner.update({
    where: { id },
    data: partnerData,
    select: partnerSafeSelect,
  });
}

async function deletePartner(id: string) {
  return prisma.partner.delete({ where: { id } });
}

export default {
  findAllPartners,
  findPartnerByIdSafe,
  addPartner,
  findPartnerById,
  updatePartner,
  deletePartner,
};
