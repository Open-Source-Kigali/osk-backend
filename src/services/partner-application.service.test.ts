import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationStatus, PrismaClient } from "../generated/prisma/client";
import { DeepMockProxy, mockReset } from "vitest-mock-extended";

vi.mock("../config/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { prisma: mockDeep<PrismaClient>() };
});

import { prisma } from "../config/prisma";
import partnerApplicationService from "./partner-application.service";

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

describe("find all partner application", () => {
  it("gets all partners applications", async () => {
    prismaMock.partnerApplication.findMany.mockResolvedValue([mockPartner]);
    const applications =
      await partnerApplicationService.findAllPartnerApplications();

    expect(applications).toEqual([mockPartner]);
  });
});

describe("create partner application", () => {
  it("creates a new partner application", async () => {
    const mockPartnerInput = {
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
      email: "partner@info.com",
      partnershipReason: "some reasons",
    };
    const mockCreatedPartner = {
      ...mockPartnerInput,
      id: "545",
      status: ApplicationStatus.Approved,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.partnerApplication.create.mockResolvedValue(mockCreatedPartner);
    const applicationCreation =
      await partnerApplicationService.addPartnerApplication(mockPartnerInput);

    expect(prismaMock.partnerApplication.create).toHaveBeenCalledOnce();
    expect(applicationCreation).toEqual(mockCreatedPartner);
  });
});

describe("find partner by id", () => {
  const mockPartnerUpdate = {
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
  it("returns partner with a given application id", async () => {
    prismaMock.partnerApplication.findUnique.mockResolvedValue(
      mockPartnerUpdate,
    );
    const partnerApplicationID =
      await partnerApplicationService.findPartnerApplicationById("545");

    expect(prismaMock.partnerApplication.findUnique).toHaveBeenCalledWith({
      where: { id: "545" },
      omit: { organisationLogoPublicId: true },
    });
    expect(partnerApplicationID).toEqual(mockPartnerUpdate);
  });

  it("finds and return application by internal id", async () => {
    prismaMock.partnerApplication.findUnique.mockResolvedValue(mockPartner);
    const partnerApplicationID =
      await partnerApplicationService.findPartnerApplicationByIdInternal("545");

    expect(prismaMock.partnerApplication.findUnique).toHaveBeenCalledWith({
      where: { id: "545" },
    });
    expect(partnerApplicationID).toEqual(mockPartner);
  });

  it("returns null for not found application", async () => {
    prismaMock.partnerApplication.findUnique.mockResolvedValue(null);
    const result =
      await partnerApplicationService.findPartnerApplicationById(
        "nonexistenceid",
      );
    expect(result).toBeNull();
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

    expect(prismaMock.partnerApplication.update).toHaveBeenCalledWith({
      where: { id: "545" },
      data: { status: ApplicationStatus.Contacted },
      omit: { organisationLogoPublicId: true },
    });
    expect(updatedData).toEqual(mockPartner);
  });

  it("rejects when the application does not exist", async () => {
    prismaMock.partnerApplication.update.mockRejectedValue(
      new Error("Record to update not found"),
    );

    await expect(
      partnerApplicationService.updatePartnerApplicationStatus(
        "some random id",
        ApplicationStatus.Contacted,
      ),
    ).rejects.toThrow("Record to update not found");
  });
});

describe("delete partner application", () => {
  it("deletes the partner application", async () => {
    prismaMock.partnerApplication.delete.mockResolvedValue(mockPartner);
    const updatedData =
      await partnerApplicationService.deletePartnerApplication("545");

    expect(prismaMock.partnerApplication.delete).toHaveBeenCalledWith({
      where: { id: "545" },
    });
    expect(updatedData).toEqual(mockPartner);
  });
});
