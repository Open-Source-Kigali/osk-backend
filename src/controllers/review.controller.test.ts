import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { ReviewStatus, UserRole } from "../generated/prisma/client";

vi.mock("../services/review.service", () => ({
  default: {
    findApprovedReviews: vi.fn(),
    findApprovedReviewById: vi.fn(),
    findReviewsByStatus: vi.fn(),
    findReviewById: vi.fn(),
    addReview: vi.fn(),
    updateReview: vi.fn(),
    setReviewStatus: vi.fn(),
    deleteReview: vi.fn(),
  },
}));

vi.mock("../services/auth.service", () => ({
  default: {
    INVALID_CREDENTIALS: "Invalid email or password",
    login: vi.fn(),
    getSessionUser: vi.fn(),
    getCsrfToken: vi.fn(),
    verifyCsrfToken: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock("../utils/cloudinary-upload", () => ({
  uploadBuffer: vi.fn(),
  destroyImage: vi.fn(),
}));

import app from "../app";
import reviewService from "../services/review.service";
import authService from "../services/auth.service";
import { uploadBuffer } from "../utils/cloudinary-upload";
import { UNSUPPORTED_IMAGE_TYPE_MESSAGE } from "../middlewares/upload.middleware";

const ORIGIN = "http://localhost:5173";
const SESSION_COOKIE = "osk_session=test-session-token";
const CSRF_TOKEN = "test-csrf-token";
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const adminUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: UserRole.ADMIN,
};

const pendingReview = {
  id: "review-1",
  name: "Aline",
  profileUrl: "https://example.com/aline.png",
  profilePublicId: "reviews/aline",
  role: "Contributor",
  message: "OSK helped me ship.",
  status: ReviewStatus.PENDING,
  reviewedAt: null,
  reviewedById: null,
  reviewedBy: null,
  createdAt: new Date("2026-02-01T00:00:00.000Z"),
  updatedAt: new Date("2026-02-01T00:00:00.000Z"),
};

const approvedReview = {
  ...pendingReview,
  id: "review-2",
  status: ReviewStatus.APPROVED,
  reviewedAt: new Date("2026-02-02T00:00:00.000Z"),
  reviewedById: adminUser.id,
  reviewedBy: { id: adminUser.id, name: adminUser.name },
};

function mockValidAdminSession() {
  vi.mocked(authService.getSessionUser).mockResolvedValue({
    user: adminUser,
    session: {
      id: "sess-1",
      userId: adminUser.id,
      expiresAt: new Date(Date.now() + 60_000),
    },
  });
  vi.mocked(authService.verifyCsrfToken).mockResolvedValue(true);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/reviews", () => {
  it("returns approved reviews without moderation fields", async () => {
    vi.mocked(reviewService.findApprovedReviews).mockResolvedValue([
      approvedReview,
    ]);

    const res = await request(app).get("/api/reviews");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      {
        id: approvedReview.id,
        name: approvedReview.name,
        profileUrl: approvedReview.profileUrl,
        profilePublicId: approvedReview.profilePublicId,
        role: approvedReview.role,
        message: approvedReview.message,
        createdAt: approvedReview.createdAt.toISOString(),
        updatedAt: approvedReview.updatedAt.toISOString(),
      },
    ]);
    expect(JSON.stringify(res.body)).not.toMatch(/PENDING|REJECTED|reviewedBy/);
    expect(reviewService.findApprovedReviews).toHaveBeenCalledOnce();
  });
});

describe("GET /api/reviews/:id", () => {
  it("hides reviews that are not approved", async () => {
    vi.mocked(reviewService.findApprovedReviewById).mockResolvedValue(null);

    const res = await request(app).get("/api/reviews/review-1");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      message: "Review not found",
      data: null,
    });
  });
});

describe("POST /api/reviews", () => {
  it("submits a valid image as a pending review", async () => {
    vi.mocked(uploadBuffer).mockResolvedValue({
      secure_url: "https://example.com/aline.png",
      public_id: "reviews/aline",
    });
    vi.mocked(reviewService.addReview).mockResolvedValue(pendingReview);

    const res = await request(app)
      .post("/api/reviews")
      .field("name", "Aline")
      .field("role", "Contributor")
      .field("message", "OSK helped me ship.")
      .attach("file", PNG, { filename: "aline.png", contentType: "image/png" });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Review submitted for moderation");
    expect(res.body.data.status).toBe(ReviewStatus.PENDING);
    expect(reviewService.addReview).toHaveBeenCalledWith({
      name: "Aline",
      role: "Contributor",
      message: "OSK helped me ship.",
      profileUrl: "https://example.com/aline.png",
      profilePublicId: "reviews/aline",
    });
  });

  it("rejects a client-supplied moderation status before creating a review", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .field("name", "Aline")
      .field("role", "Contributor")
      .field("message", "OSK helped me ship.")
      .field("status", ReviewStatus.APPROVED)
      .attach("file", PNG, { filename: "aline.png", contentType: "image/png" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Moderation status cannot be set by the client",
    );
    expect(reviewService.addReview).not.toHaveBeenCalled();
    expect(uploadBuffer).not.toHaveBeenCalled();
  });

  it("keeps rejecting unsupported uploads such as SVG", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .field("name", "Aline")
      .field("role", "Contributor")
      .field("message", "OSK helped me ship.")
      .attach(
        "file",
        Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"),
        {
          filename: "logo.svg",
          contentType: "image/svg+xml",
        },
      );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(UNSUPPORTED_IMAGE_TYPE_MESSAGE);
    expect(reviewService.addReview).not.toHaveBeenCalled();
  });
});

describe("admin review moderation", () => {
  it("returns 401 for the moderation queue without a session", async () => {
    const res = await request(app).get("/api/admin/reviews");

    expect(res.status).toBe(401);
    expect(reviewService.findReviewsByStatus).not.toHaveBeenCalled();
  });

  it("returns 401 when only an x-api-key is sent", async () => {
    const res = await request(app)
      .patch("/api/admin/reviews/review-1/status")
      .set("Origin", ORIGIN)
      .set("x-api-key", "test-admin-key")
      .send({ status: ReviewStatus.APPROVED });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Authentication required");
    expect(reviewService.setReviewStatus).not.toHaveBeenCalled();
  });

  it("lists pending reviews for an authenticated admin", async () => {
    mockValidAdminSession();
    vi.mocked(reviewService.findReviewsByStatus).mockResolvedValue([
      pendingReview,
    ]);

    const res = await request(app)
      .get("/api/admin/reviews")
      .set("Cookie", SESSION_COOKIE);

    expect(res.status).toBe(200);
    expect(reviewService.findReviewsByStatus).toHaveBeenCalledWith(
      ReviewStatus.PENDING,
    );
    expect(res.body.data[0].status).toBe(ReviewStatus.PENDING);
    expect(res.body.data[0].reviewedBy).toBeNull();
  });

  it("returns any review, including a pending one, to an admin", async () => {
    mockValidAdminSession();
    vi.mocked(reviewService.findReviewById).mockResolvedValue(pendingReview);

    const res = await request(app)
      .get("/api/admin/reviews/review-1")
      .set("Cookie", SESSION_COOKIE);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(ReviewStatus.PENDING);
  });

  it("requires a CSRF token to approve a review", async () => {
    mockValidAdminSession();

    const res = await request(app)
      .patch("/api/admin/reviews/review-1/status")
      .set("Origin", ORIGIN)
      .set("Cookie", SESSION_COOKIE)
      .send({ status: ReviewStatus.APPROVED });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("CSRF token required");
    expect(reviewService.setReviewStatus).not.toHaveBeenCalled();
  });

  it("rejects an invalid CSRF token", async () => {
    mockValidAdminSession();
    vi.mocked(authService.verifyCsrfToken).mockResolvedValue(false);

    const res = await request(app)
      .patch("/api/admin/reviews/review-1/status")
      .set("Origin", ORIGIN)
      .set("Cookie", SESSION_COOKIE)
      .set("X-CSRF-Token", "bad-token")
      .send({ status: ReviewStatus.REJECTED });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Invalid CSRF token");
    expect(reviewService.setReviewStatus).not.toHaveBeenCalled();
  });

  it("approves a review with a valid admin session and CSRF token", async () => {
    mockValidAdminSession();
    vi.mocked(reviewService.setReviewStatus).mockResolvedValue({
      ok: true,
      review: {
        ...approvedReview,
        reviewedAt: new Date("2026-02-02T00:00:00.000Z"),
      },
    });

    const res = await request(app)
      .patch("/api/admin/reviews/review-1/status")
      .set("Origin", ORIGIN)
      .set("Cookie", SESSION_COOKIE)
      .set("X-CSRF-Token", CSRF_TOKEN)
      .send({ status: ReviewStatus.APPROVED });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Review approved successfully");
    expect(res.body.data.status).toBe(ReviewStatus.APPROVED);
    expect(res.body.data.reviewedBy).toEqual({
      id: adminUser.id,
      name: adminUser.name,
    });
    expect(reviewService.setReviewStatus).toHaveBeenCalledWith(
      "review-1",
      ReviewStatus.APPROVED,
      adminUser.id,
    );
  });

  it("rejects a review with a valid admin session and CSRF token", async () => {
    mockValidAdminSession();
    vi.mocked(reviewService.setReviewStatus).mockResolvedValue({
      ok: true,
      review: {
        ...pendingReview,
        status: ReviewStatus.REJECTED,
        reviewedAt: new Date("2026-02-03T00:00:00.000Z"),
        reviewedById: adminUser.id,
        reviewedBy: { id: adminUser.id, name: adminUser.name },
      },
    });

    const res = await request(app)
      .patch("/api/admin/reviews/review-1/status")
      .set("Origin", ORIGIN)
      .set("Cookie", SESSION_COOKIE)
      .set("X-CSRF-Token", CSRF_TOKEN)
      .send({ status: ReviewStatus.REJECTED });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Review rejected successfully");
    expect(res.body.data.status).toBe(ReviewStatus.REJECTED);
  });

  it("returns 409 for an invalid status transition", async () => {
    mockValidAdminSession();
    vi.mocked(reviewService.setReviewStatus).mockResolvedValue({
      ok: false,
      code: "invalid_transition",
      from: ReviewStatus.APPROVED,
      to: ReviewStatus.APPROVED,
    });

    const res = await request(app)
      .patch("/api/admin/reviews/review-2/status")
      .set("Origin", ORIGIN)
      .set("Cookie", SESSION_COOKIE)
      .set("X-CSRF-Token", CSRF_TOKEN)
      .send({ status: ReviewStatus.APPROVED });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      success: false,
      message: "Cannot change review status from APPROVED to APPROVED",
      data: null,
    });
  });

  it("returns 400 when the status value is not a moderation decision", async () => {
    mockValidAdminSession();

    const res = await request(app)
      .patch("/api/admin/reviews/review-1/status")
      .set("Origin", ORIGIN)
      .set("Cookie", SESSION_COOKIE)
      .set("X-CSRF-Token", CSRF_TOKEN)
      .send({ status: ReviewStatus.PENDING });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(reviewService.setReviewStatus).not.toHaveBeenCalled();
  });
});

describe("PUT /api/reviews/:id", () => {
  it("returns 401 to a public caller", async () => {
    const res = await request(app)
      .put("/api/reviews/review-1")
      .set("Origin", ORIGIN)
      .send({ name: "Updated" });

    expect(res.status).toBe(401);
    expect(reviewService.updateReview).not.toHaveBeenCalled();
  });

  it("edits content without accepting a moderation status", async () => {
    mockValidAdminSession();

    const res = await request(app)
      .put("/api/reviews/review-1")
      .set("Origin", ORIGIN)
      .set("Cookie", SESSION_COOKIE)
      .set("X-CSRF-Token", CSRF_TOKEN)
      .send({ name: "Aline U.", status: ReviewStatus.APPROVED });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Moderation status cannot be set by the client",
    );
    expect(reviewService.updateReview).not.toHaveBeenCalled();
  });

  it("keeps the stored status when an admin edits the text", async () => {
    mockValidAdminSession();
    vi.mocked(reviewService.findReviewById).mockResolvedValue(pendingReview);
    vi.mocked(reviewService.updateReview).mockResolvedValue({
      ...pendingReview,
      name: "Aline U.",
    });

    const res = await request(app)
      .put("/api/reviews/review-1")
      .set("Origin", ORIGIN)
      .set("Cookie", SESSION_COOKIE)
      .set("X-CSRF-Token", CSRF_TOKEN)
      .send({ name: "Aline U." });

    expect(res.status).toBe(200);
    expect(reviewService.updateReview).toHaveBeenCalledWith("review-1", {
      name: "Aline U.",
    });
    expect(res.body.data.status).toBe(ReviewStatus.PENDING);
  });
});

describe("DELETE /api/reviews/:id", () => {
  it("returns 401 to a public caller", async () => {
    const res = await request(app)
      .delete("/api/reviews/review-1")
      .set("Origin", ORIGIN);

    expect(res.status).toBe(401);
    expect(reviewService.deleteReview).not.toHaveBeenCalled();
  });
});
