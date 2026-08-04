import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationStatus, PrismaClient } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { DeepMockProxy, mockReset } from "vitest-mock-extended";
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
beforeEach(() => mockReset(prismaMock));

describe("find all partners application", () => {
  it("gets all partners applications", async () => {
    prismaMock.partnerApplication.findMany.mockResolvedValue([mockPartner]);
    const applications =
      await partnerApplicationService.findAllPartnerApplications();

    expect(applications).toEqual([mockPartner]);
  });
});

describe("create parterners application", () => {
  it("creates a new partners application", async () => {
    prismaMock.partnerApplication.create.mockResolvedValue(mockPartner);
    const applicationCreation =
      await partnerApplicationService.addPartnerApplication(mockPartner);

    expect(prismaMock.partnerApplication.create).toHaveBeenCalledOnce();
    expect(applicationCreation).toEqual(mockPartner);
  });
});

describe("find partner by id", () => {
  it("returns partner with a given application id", async () => {
    prismaMock.partnerApplication.findUnique.mockResolvedValue(mockPartner);
    const partnerApplicationID =
      await partnerApplicationService.findPartnerApplicationById("545");

    expect(prismaMock.partnerApplication.findUnique).toHaveBeenCalledWith({
      where: { id: "545" },
      omit: { organisationLogoPublicId: true },
    });
    expect(partnerApplicationID).toStrictEqual(mockPartner);
  });

  it("finds and return application by internal id", async () => {
    prismaMock.partnerApplication.findUnique.mockResolvedValue(mockPartner);
    const partnerApplicationID =
      await partnerApplicationService.findPartnerApplicationById("545");

    expect(prismaMock.partnerApplication.findUnique).toHaveBeenCalledOnce();
    expect(partnerApplicationID).toEqual(mockPartner);
  });
});

describe("update partner application status", () => {
  it("updates the application status", async () => {
    prismaMock.partnerApplication.update.mockResolvedValue(mockPartner);
    const updatedData =
      await partnerApplicationService.updatePartnerApplicationStatus(
        "545",
        ApplicationStatus.Contacted,
      );

    expect(prismaMock.partnerApplication.update).toHaveBeenNthCalledWith(1, {
      where: { id: "545" },
      data: { status: ApplicationStatus.Contacted },
      omit: { organisationLogoPublicId: true },
    });
    expect(updatedData).toEqual(mockPartner);
  });
});
