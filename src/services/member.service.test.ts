import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockReset } from "vitest-mock-extended";
import type { DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "../generated/prisma/client";

vi.mock("../config/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended");
  return { prisma: mockDeep<PrismaClient>() };
});

import { prisma } from "../config/prisma";
import memberService from "./member.service";

const prismaMock = prisma as DeepMockProxy<PrismaClient>;

const mockMember = {
  id: "1",
  name: "Alice",
  email: "alice@example.com",
  githubUsername: "alice",
  orgName: "OSK",
  joinReason: "Love OSS",
  codingLevel: "intermediate" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => mockReset(prismaMock));

describe("findAllMembers", () => {
  it("returns all members", async () => {
    prismaMock.member.findMany.mockResolvedValue([mockMember]);

    const result = await memberService.findAllMembers();

    expect(prismaMock.member.findMany).toHaveBeenCalledOnce();
    expect(result).toEqual([mockMember]);
  });
});

describe("findMemberById", () => {
  it("returns the member when found", async () => {
    prismaMock.member.findUnique.mockResolvedValue(mockMember);

    const result = await memberService.findMemberById("1");

    expect(prismaMock.member.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
    });
    expect(result).toEqual(mockMember);
  });

  it("returns null when not found", async () => {
    prismaMock.member.findUnique.mockResolvedValue(null);

    const result = await memberService.findMemberById("nonexistent");

    expect(result).toBeNull();
  });
});

describe("addMember", () => {
  it("creates and returns a new member", async () => {
    prismaMock.member.create.mockResolvedValue(mockMember);
    const { id, createdAt, updatedAt, ...input } = mockMember;

    const result = await memberService.addMember(input);

    expect(prismaMock.member.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual(mockMember);
  });
});

describe("updateMember", () => {
  it("updates and returns the member", async () => {
    const updated = { ...mockMember, name: "Bob" };
    prismaMock.member.update.mockResolvedValue(updated);

    const result = await memberService.updateMember("1", { name: "Bob" });

    expect(prismaMock.member.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { name: "Bob" },
    });
    expect(result).toEqual(updated);
  });
});

describe("deleteMember", () => {
  it("deletes the member by id", async () => {
    prismaMock.member.delete.mockResolvedValue(mockMember);

    await memberService.deleteMember("1");

    expect(prismaMock.member.delete).toHaveBeenCalledWith({
      where: { id: "1" },
    });
  });
});
