import { describe, expect, it } from "vitest";
import stripPublicIds from "./strip-public-ids";

describe("stripPublicIds", () => {
  it("removes internal Cloudinary public ids from response objects", () => {
    expect(
      stripPublicIds({
        imageUrl: "https://example.com/image.jpg",
        imagePublicId: "internal-image-id",
        logoPublicId: "internal-logo-id",
        profilePublicId: "internal-profile-id",
      }),
    ).toEqual({
      imageUrl: "https://example.com/image.jpg",
    });
  });

  it("removes internal public ids from arrays", () => {
    expect(
      stripPublicIds([
        { name: "Event", imagePublicId: "event-id" },
        { name: "Partner", logoPublicId: "logo-id" },
      ]),
    ).toEqual([{ name: "Event" }, { name: "Partner" }]);
  });
});
