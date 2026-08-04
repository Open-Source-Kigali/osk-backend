import { describe, expect, it, vi } from "vitest";
import { ApplicationStatus, PrismaClient } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { DeepMockProxy } from "vitest-mock-extended";
import partnerApplicationService from "./partner-application.service";

vi.mock(import("../config/prisma"), async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { prisma: mockDeep<PrismaClient>() };
});
const prismaMock = prisma as DeepMockProxy<PrismaClient>;

const mockPartner = {
  id: "545",
  organisationName: "oneMillion coders",
  organisationLogoUrl: "https://img.log/45",
  organisationLogoPublicId: "34",
  organisationType: "NGO",
  website: "https://web.com",
  organisationSize: "medium",
  country: "Rwanda",
  description: "lorem ipsum lorem ipsum",
  partnershipTier: "unkown",
  organisationOffer: "investement",
  projectIdea: "osk",
  fullName: "open source kernel",
  jobTitle: "CEO",
  workEmail: "osk@info.com",
  agreedToTerms: true,
  status: ApplicationStatus.Approved,
  email: "partner@info.com",
  partnershipReason: "some reasons",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("find all partners application", () => {
  it("gets all partners applications", async () => {
    prismaMock.partnerApplication.findMany.mockResolvedValue([mockPartner]);
    const applications =
      await partnerApplicationService.findAllPartnerApplications();

    expect(applications).toEqual([mockPartner]);
  });
});
