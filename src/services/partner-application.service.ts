import { prisma } from "../config/prisma";
import {
  ApplicationStatus,
  PartnerApplication,
} from "../generated/prisma/client";

type PartnerApplicationData = Omit<
  PartnerApplication,
  "id" | "status" | "createdAt" | "updatedAt"
>;

async function findAllPartnerApplications() {
  return prisma.partnerApplication.findMany({
    orderBy: { createdAt: "desc" },
    omit: { organisationLogoPublicId: true },
  });
}

async function addPartnerApplication(applicationData: PartnerApplicationData) {
  return prisma.partnerApplication.create({ data: applicationData });
}

async function findPartnerApplicationById(id: string) {
  return prisma.partnerApplication.findUnique({
    where: { id },
    omit: { organisationLogoPublicId: true },
  });
}

async function findPartnerApplicationByIdInternal(id: string) {
  return prisma.partnerApplication.findUnique({ where: { id } });
}

async function updatePartnerApplicationStatus(
  id: string,
  status: ApplicationStatus,
) {
  return prisma.partnerApplication.update({
    where: { id },
    data: { status },
    omit: { organisationLogoPublicId: true },
  });
}

async function deletePartnerApplication(id: string) {
  return prisma.partnerApplication.delete({ where: { id } });
}

export default {
  findAllPartnerApplications,
  addPartnerApplication,
  findPartnerApplicationById,
  findPartnerApplicationByIdInternal,
  updatePartnerApplicationStatus,
  deletePartnerApplication,
};
