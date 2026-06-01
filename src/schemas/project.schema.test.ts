import { describe, expect, it } from "vitest";
import { createProjectSchema } from "./project.schema";

const validProject = {
  slug: "osk-backend",
  repoOwner: "Open-Source-Kigali",
  repoName: "osk-backend",
  tagline: "Open source community backend",
  category: "community",
};

describe("createProjectSchema", () => {
  it("rejects whitespace-only repository names", () => {
    const result = createProjectSchema.safeParse({
      ...validProject,
      repoName: "   ",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["repoName"]);
  });

  it("trims project fields before validation", () => {
    const result = createProjectSchema.parse({
      ...validProject,
      slug: " osk-backend ",
      repoOwner: " Open-Source-Kigali ",
      repoName: " osk-backend ",
      tagline: " Open source community backend ",
      category: " community ",
    });

    expect(result).toMatchObject(validProject);
  });
});
