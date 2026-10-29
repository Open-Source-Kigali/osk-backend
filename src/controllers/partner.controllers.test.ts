import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../services/partner.service");
vi.mock("../utils/cloudinary-upload");
import partnerService from "../services/partner.service";
import { destroyImage, uploadBuffer } from "../utils/cloudinary-upload";

const ADMIN_KEY = "test-admin-key";

const NEW_LOGO_URL =
  "https://res.cloudinary.com/demo/image/upload/partners/new-logo.jpg";
const NEW_LOGO_PUBLIC_ID = "open-source-kigali/partners/new-logo";
const OLD_LOGO_PUBLIC_ID = "open-source-kigali/partners/old-logo";

const mockPartner = {
  id: "1",
  name: "Acme Corp",
  websiteUrl: "https://acme.example.com",
  logoUrl: "https://res.cloudinary.com/demo/image/upload/partners/old-logo.jpg",
  logoPublicId: OLD_LOGO_PUBLIC_ID,
  description: "A partner",
  email: "hello@acme.example.com",
  partnershipReason: "Community support",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const validPartnerBody = {
  name: "Acme Corp",
  websiteUrl: "https://acme.example.com",
  description: "A partner",
  email: "hello@acme.example.com",
  partnershipReason: "Community support",
};

const logoBuffer = Buffer.from("fake-logo-bytes");

beforeEach(() => vi.resetAllMocks());

describe("POST /api/partners", () => {
  it("returns 403 without admin key", async () => {
    const res = await request(app).post("/api/partners").send(validPartnerBody);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when no logo file is provided", async () => {
    const res = await request(app)
      .post("/api/partners")
      .set("x-api-key", ADMIN_KEY)
      .send(validPartnerBody);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Logo file is required");
    expect(uploadBuffer).not.toHaveBeenCalled();
    expect(vi.mocked(partnerService.addPartner)).not.toHaveBeenCalled();
  });

  it("returns 201 and passes the uploaded logo to the service", async () => {
    vi.mocked(uploadBuffer).mockResolvedValue({
      secure_url: NEW_LOGO_URL,
      public_id: NEW_LOGO_PUBLIC_ID,
    });
    vi.mocked(partnerService.addPartner).mockResolvedValue(mockPartner);

    const res = await request(app)
      .post("/api/partners")
      .set("x-api-key", ADMIN_KEY)
      .attach("file", logoBuffer, {
        filename: "logo.png",
        contentType: "image/png",
      })
      .field("name", "Acme Corp")
      .field("websiteUrl", "https://acme.example.com")
      .field("description", "A partner")
      .field("email", "hello@acme.example.com")
      .field("partnershipReason", "Community support");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(uploadBuffer).toHaveBeenCalledWith(
      logoBuffer,
      "open-source-kigali/partners",
    );
    expect(vi.mocked(partnerService.addPartner)).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Acme Corp",
        logoUrl: NEW_LOGO_URL,
        logoPublicId: NEW_LOGO_PUBLIC_ID,
      }),
    );
  });

  it("destroys the uploaded image and returns 500 when the service throws", async () => {
    vi.mocked(uploadBuffer).mockResolvedValue({
      secure_url: NEW_LOGO_URL,
      public_id: NEW_LOGO_PUBLIC_ID,
    });
    vi.mocked(partnerService.addPartner).mockRejectedValue(
      new Error("db down"),
    );

    const res = await request(app)
      .post("/api/partners")
      .set("x-api-key", ADMIN_KEY)
      .attach("file", logoBuffer, {
        filename: "logo.png",
        contentType: "image/png",
      })
      .field("name", "Acme Corp")
      .field("websiteUrl", "https://acme.example.com")
      .field("description", "A partner")
      .field("email", "hello@acme.example.com")
      .field("partnershipReason", "Community support");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(destroyImage).toHaveBeenCalledTimes(1);
    expect(destroyImage).toHaveBeenCalledWith(NEW_LOGO_PUBLIC_ID);
    expect(vi.mocked(partnerService.addPartner)).toHaveBeenCalled();
  });
});

describe("PUT /api/partners/:id", () => {
  it("returns 404 when the partner does not exist", async () => {
    vi.mocked(partnerService.findPartnerByIdInternal).mockResolvedValue(null);

    const res = await request(app)
      .put("/api/partners/nonexistent")
      .set("x-api-key", ADMIN_KEY)
      .send({ name: "Nobody" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Partner not found");
    expect(uploadBuffer).not.toHaveBeenCalled();
  });

  it("deletes the old logo when a new file is uploaded", async () => {
    vi.mocked(partnerService.findPartnerByIdInternal).mockResolvedValue(
      mockPartner,
    );
    vi.mocked(uploadBuffer).mockResolvedValue({
      secure_url: NEW_LOGO_URL,
      public_id: NEW_LOGO_PUBLIC_ID,
    });
    vi.mocked(partnerService.updatePartner).mockResolvedValue({
      ...mockPartner,
      name: "Acme Updated",
      logoUrl: NEW_LOGO_URL,
      logoPublicId: NEW_LOGO_PUBLIC_ID,
    });

    const res = await request(app)
      .put("/api/partners/1")
      .set("x-api-key", ADMIN_KEY)
      .attach("file", logoBuffer, {
        filename: "logo.png",
        contentType: "image/png",
      })
      .field("name", "Acme Updated");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(uploadBuffer).toHaveBeenCalledWith(
      logoBuffer,
      "open-source-kigali/partners",
    );
    expect(vi.mocked(partnerService.updatePartner)).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({
        name: "Acme Updated",
        logoUrl: NEW_LOGO_URL,
        logoPublicId: NEW_LOGO_PUBLIC_ID,
      }),
    );
    expect(destroyImage).toHaveBeenCalledTimes(1);
    expect(destroyImage).toHaveBeenCalledWith(OLD_LOGO_PUBLIC_ID);
  });
});

describe("DELETE /api/partners/:id", () => {
  it("returns 404 when the partner does not exist", async () => {
    vi.mocked(partnerService.findPartnerByIdInternal).mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/partners/nonexistent")
      .set("x-api-key", ADMIN_KEY);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Partner not found");
    expect(destroyImage).not.toHaveBeenCalled();
  });

  it("returns 204 and destroys the partner logo", async () => {
    vi.mocked(partnerService.findPartnerByIdInternal).mockResolvedValue(
      mockPartner,
    );
    vi.mocked(partnerService.deletePartner).mockResolvedValue(mockPartner);

    const res = await request(app)
      .delete("/api/partners/1")
      .set("x-api-key", ADMIN_KEY);

    expect(res.status).toBe(204);
    expect(vi.mocked(partnerService.deletePartner)).toHaveBeenCalledWith("1");
    expect(destroyImage).toHaveBeenCalledTimes(1);
    expect(destroyImage).toHaveBeenCalledWith(OLD_LOGO_PUBLIC_ID);
  });
});
