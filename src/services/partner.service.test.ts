import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "../generated/prisma/client";

vi.mock("../config/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { prisma: mockDeep<PrismaClient>() };
});

import { prisma } from "../config/prisma";
import partnerService from "./partner.service";

const prismaMock = prisma as DeepMockProxy<PrismaClient>;

const mockPartner = {
  id: "1",
  name: "OSK",
  websiteUrl: "https://example.com",
  logoUrl: "https://example.com/logo.png",
  logoPublicId: "logo-123",
  description: "Open-source community",
  email: "partners@example.com",
  partnershipReason: "Support OSS",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const { logoPublicId: _logoPublicId, ...mockPublicPartner } = mockPartner;

beforeEach(() => mockReset(prismaMock));

describe("findAllPartners", () => {
  it("returns all partners", async () => {
    prismaMock.partner.findMany.mockResolvedValue([mockPartner]);

    const result = await partnerService.findAllPartners();

    expect(prismaMock.partner.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
    });
    expect(result).toEqual([mockPartner]);
  });
});

describe("addPartner", () => {
  it("creates and returns a new partner", async () => {
    prismaMock.partner.create.mockResolvedValue(mockPartner);
    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...input
    } = mockPartner;

    const result = await partnerService.addPartner(input);

    expect(prismaMock.partner.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual(mockPartner);
  });
});

describe("findPartnerById", () => {
  it("returns the partner when found, omitting logoPublicId", async () => {
    prismaMock.partner.findUnique.mockResolvedValue(mockPublicPartner as never);

    const result = await partnerService.findPartnerById("1");

    expect(prismaMock.partner.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
      omit: { logoPublicId: true },
    });
    expect(result).toEqual(mockPublicPartner);
  });

  it("returns null when not found", async () => {
    prismaMock.partner.findUnique.mockResolvedValue(null);

    const result = await partnerService.findPartnerById("nonexistent");

    expect(result).toBeNull();
  });
});

describe("findPartnerByIdInternal", () => {
  it("returns the partner when found, without omitting logoPublicId", async () => {
    prismaMock.partner.findUnique.mockResolvedValue(mockPartner);

    const result = await partnerService.findPartnerByIdInternal("1");

    expect(prismaMock.partner.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
    });
    expect(result).toEqual(mockPartner);
  });

  it("returns null when not found", async () => {
    prismaMock.partner.findUnique.mockResolvedValue(null);

    const result = await partnerService.findPartnerByIdInternal("nonexistent");

    expect(result).toBeNull();
  });
});

describe("updatePartner", () => {
  it("updates and returns the partner", async () => {
    const updated = { ...mockPartner, name: "OSK Labs" };
    prismaMock.partner.update.mockResolvedValue(updated);

    const result = await partnerService.updatePartner("1", {
      name: "OSK Labs",
    });

    expect(prismaMock.partner.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { name: "OSK Labs" },
    });
    expect(result).toEqual(updated);
  });
});

describe("deletePartner", () => {
  it("deletes the partner by id", async () => {
    prismaMock.partner.delete.mockResolvedValue(mockPartner);

    await partnerService.deletePartner("1");

    expect(prismaMock.partner.delete).toHaveBeenCalledWith({
      where: { id: "1" },
    });
  });
});
