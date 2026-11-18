import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../services/partner.service");
vi.mock("../utils/cloudinary-upload");

import partnerService from "../services/partner.service";
import { destroyImage, uploadBuffer } from "../utils/cloudinary-upload";

const ADMIN_KEY = "test-admin-key";

const mockPartner = {
  id: "1",
  name: "OSK",
  websiteUrl: "https://example.com",
  logoUrl: "https://example.com/logo.png",
  logoPublicId: "partners/old-logo",
  description: "Open-source community",
  email: "partners@example.com",
  partnershipReason: "Support open source",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

beforeEach(() => vi.resetAllMocks());

describe("GET /api/partners", () => {
  it("returns all partners", async () => {
    vi.mocked(partnerService.findAllPartners).mockResolvedValue([mockPartner]);

    const res = await request(app).get("/api/partners");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([
      {
        ...mockPartner,
        createdAt: mockPartner.createdAt.toISOString(),
        updatedAt: mockPartner.updatedAt.toISOString(),
      },
    ]);
  });
});

describe("GET /api/partners/:id", () => {
  it("returns the partner when it exists", async () => {
    vi.mocked(partnerService.findPartnerById).mockResolvedValue(mockPartner);

    const res = await request(app).get("/api/partners/1");

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("1");
    expect(partnerService.findPartnerById).toHaveBeenCalledWith("1");
  });

  it("returns 404 when the partner does not exist", async () => {
    vi.mocked(partnerService.findPartnerById).mockResolvedValue(null);

    const res = await request(app).get("/api/partners/unknown");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Partner not found");
  });
});

describe("POST /api/partners", () => {
  it("returns 400 when no logo file is provided", async () => {
    const res = await request(app)
      .post("/api/partners")
      .set("x-api-key", ADMIN_KEY)
      .send({ name: "OSK" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Logo file is required");
    expect(partnerService.addPartner).not.toHaveBeenCalled();
  });

  it("creates a partner with its uploaded logo", async () => {
    vi.mocked(uploadBuffer).mockResolvedValue({
      secure_url: "https://example.com/new-logo.png",
      public_id: "partners/new-logo",
    });
    vi.mocked(partnerService.addPartner).mockResolvedValue(mockPartner);

    const res = await request(app)
      .post("/api/partners")
      .set("x-api-key", ADMIN_KEY)
      .field("name", "OSK")
      .field("websiteUrl", "https://example.com")
      .field("description", "Open-source community")
      .field("email", "partners@example.com")
      .field("partnershipReason", "Support open source")
      .attach("file", Buffer.from("logo"), {
        filename: "logo.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(201);
    expect(partnerService.addPartner).toHaveBeenCalledWith({
      name: "OSK",
      websiteUrl: "https://example.com",
      description: "Open-source community",
      email: "partners@example.com",
      partnershipReason: "Support open source",
      logoUrl: "https://example.com/new-logo.png",
      logoPublicId: "partners/new-logo",
    });
  });

  it("removes the uploaded logo when creating the partner fails", async () => {
    vi.mocked(uploadBuffer).mockResolvedValue({
      secure_url: "https://example.com/new-logo.png",
      public_id: "partners/new-logo",
    });
    vi.mocked(partnerService.addPartner).mockRejectedValue(
      new Error("Database error"),
    );
    const res = await request(app)
      .post("/api/partners")
      .set("x-api-key", ADMIN_KEY)
      .field("name", "OSK")
      .field("websiteUrl", "https://example.com")
      .field("description", "Open-source community")
      .field("email", "partners@example.com")
      .field("partnershipReason", "Support open source")
      .attach("file", Buffer.from("logo"), {
        filename: "logo.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(500);
    expect(destroyImage).toHaveBeenCalledWith("partners/new-logo");
  });
});

describe("PUT /api/partners/:id", () => {
  it("returns 404 when the partner does not exist", async () => {
    vi.mocked(partnerService.findPartnerByIdInternal).mockResolvedValue(null);

    const res = await request(app)
      .put("/api/partners/unknown")
      .set("x-api-key", ADMIN_KEY)
      .send({ name: "Updated OSK" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Partner not found");
  });

  it("deletes the old logo after uploading a replacement", async () => {
    const updatedPartner = {
      ...mockPartner,
      name: "Updated OSK",
      logoUrl: "https://example.com/new-logo.png",
      logoPublicId: "partners/new-logo",
    };
    vi.mocked(partnerService.findPartnerByIdInternal).mockResolvedValue(
      mockPartner,
    );
    vi.mocked(uploadBuffer).mockResolvedValue({
      secure_url: "https://example.com/new-logo.png",
      public_id: "partners/new-logo",
    });
    vi.mocked(partnerService.updatePartner).mockResolvedValue(updatedPartner);

    const res = await request(app)
      .put("/api/partners/1")
      .set("x-api-key", ADMIN_KEY)
      .field("name", "Updated OSK")
      .attach("file", Buffer.from("logo"), {
        filename: "logo.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(200);
    expect(partnerService.updatePartner).toHaveBeenCalledWith("1", {
      name: "Updated OSK",
      logoUrl: "https://example.com/new-logo.png",
      logoPublicId: "partners/new-logo",
    });
    expect(destroyImage).toHaveBeenCalledWith("partners/old-logo");
  });

  it("removes the replacement logo when updating the partner fails", async () => {
    vi.mocked(partnerService.findPartnerByIdInternal).mockResolvedValue(
      mockPartner,
    );
    vi.mocked(uploadBuffer).mockResolvedValue({
      secure_url: "https://example.com/new-logo.png",
      public_id: "partners/new-logo",
    });
    vi.mocked(partnerService.updatePartner).mockRejectedValue(
      new Error("Database error"),
    );
    const res = await request(app)
      .put("/api/partners/1")
      .set("x-api-key", ADMIN_KEY)
      .attach("file", Buffer.from("logo"), {
        filename: "logo.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(500);
    expect(destroyImage).toHaveBeenCalledWith("partners/new-logo");
  });
});

describe("DELETE /api/partners/:id", () => {
  it("returns 404 when the partner does not exist", async () => {
    vi.mocked(partnerService.findPartnerByIdInternal).mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/partners/unknown")
      .set("x-api-key", ADMIN_KEY);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Partner not found");
  });

  it("deletes the partner and its logo", async () => {
    vi.mocked(partnerService.findPartnerByIdInternal).mockResolvedValue(
      mockPartner,
    );
    vi.mocked(partnerService.deletePartner).mockResolvedValue(mockPartner);

    const res = await request(app)
      .delete("/api/partners/1")
      .set("x-api-key", ADMIN_KEY);

    expect(res.status).toBe(204);
    expect(partnerService.deletePartner).toHaveBeenCalledWith("1");
    expect(destroyImage).toHaveBeenCalledWith("partners/old-logo");
  });
});
