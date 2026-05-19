import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../services/partner.service");
import partnerService from "../services/partner.service";

beforeEach(() => vi.resetAllMocks());

describe("POST /api/partners", () => {
  it("returns 400 when websiteUrl is invalid", async () => {
    const res = await request(app)
      .post("/api/partners")
      .field("name", "Open Source Kigali")
      .field("websiteUrl", "notaurl")
      .field("description", "Community partner")
      .field("email", "partner@example.com")
      .field("partershipReason", "Support open source")
      .attach("file", Buffer.from("fake"), {
        filename: "logo.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid websiteUrl");
    expect(partnerService.addPartner).not.toHaveBeenCalled();
  });
});
