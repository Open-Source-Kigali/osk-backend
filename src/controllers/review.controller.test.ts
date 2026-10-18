import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../app";

vi.mock("../services/review.service", () => ({
  default: {
    findAllReviews: vi.fn(),
    findReviewById: vi.fn(),
    addReview: vi.fn(),
    updateReview: vi.fn(),
    deleteReview: vi.fn(),
  },
}));

vi.mock("../utils/cloudinary-upload", () => ({
  uploadBuffer: vi.fn(),
  destroyImage: vi.fn(),
}));

import reviewService from "../services/review.service";
import { destroyImage, uploadBuffer } from "../utils/cloudinary-upload";

const ADMIN_KEY = "test-admin-key";

const mockReview = {
  id: "review-1",
  name: "Jane Doe",
  profileUrl: "https://example.com/jane.jpg",
  profilePublicId: "reviews/jane",
  role: "Software Engineer",
  message: "Open Source Kigali is amazing.",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const mockUpload = {
  secure_url: "https://example.com/new-profile.jpg",
  public_id: "reviews/new-profile",
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("GET /api/reviews", () => {
  it("returns 200 with all reviews", async () => {
    vi.mocked(reviewService.findAllReviews).mockResolvedValue([mockReview]);

    const res = await request(app).get("/api/reviews");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Reviews retrieved successfully");
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(mockReview.id);
    expect(reviewService.findAllReviews).toHaveBeenCalledOnce();
  });

  it("returns 500 when finding reviews fails", async () => {
    vi.mocked(reviewService.findAllReviews).mockRejectedValue(
      new Error("Database error"),
    );

    const res = await request(app).get("/api/reviews");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Internal Server Error");
  });
});

describe("GET /api/reviews/:id", () => {
  it("returns 200 when the review exists", async () => {
    vi.mocked(reviewService.findReviewById).mockResolvedValue(mockReview);

    const res = await request(app).get("/api/reviews/review-1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(mockReview.id);
    expect(reviewService.findReviewById).toHaveBeenCalledWith("review-1");
  });

  it("returns 404 when the review does not exist", async () => {
    vi.mocked(reviewService.findReviewById).mockResolvedValue(null);

    const res = await request(app).get("/api/reviews/missing");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Review not found");
  });
});

describe("POST /api/reviews", () => {
  it("returns 201 when a review is created with an image", async () => {
    vi.mocked(uploadBuffer).mockResolvedValue(mockUpload);
    vi.mocked(reviewService.addReview).mockResolvedValue(mockReview);

    const res = await request(app)
      .post("/api/reviews")
      .field("name", " Jane Doe ")
      .field("role", " Software Engineer ")
      .field("message", " Open Source Kigali is amazing. ")
      .attach("file", Buffer.from("fake image"), {
        filename: "profile.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Review created successfully");
    expect(res.body.data.id).toBe(mockReview.id);

    expect(uploadBuffer).toHaveBeenCalledWith(
      expect.any(Buffer),
      "open-source-kigali/reviews",
    );
    expect(reviewService.addReview).toHaveBeenCalledWith({
      name: "Jane Doe",
      role: "Software Engineer",
      message: "Open Source Kigali is amazing.",
      profileUrl: mockUpload.secure_url,
      profilePublicId: mockUpload.public_id,
    });
  });

  it("returns 400 when no profile image is provided", async () => {
    const res = await request(app).post("/api/reviews").send({
      name: "Jane Doe",
      role: "Software Engineer",
      message: "Great community",
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Profile image file is required");
    expect(uploadBuffer).not.toHaveBeenCalled();
    expect(reviewService.addReview).not.toHaveBeenCalled();
  });

  it("removes the uploaded image when creating a review fails", async () => {
    vi.mocked(uploadBuffer).mockResolvedValue(mockUpload);
    vi.mocked(reviewService.addReview).mockRejectedValue(
      new Error("Database error"),
    );

    const res = await request(app)
      .post("/api/reviews")
      .field("name", "Jane Doe")
      .field("role", "Software Engineer")
      .field("message", "Great community")
      .attach("file", Buffer.from("fake image"), {
        filename: "profile.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(500);
    expect(destroyImage).toHaveBeenCalledWith(mockUpload.public_id);
  });
});

describe("PUT /api/reviews/:id", () => {
  it("returns 403 without an admin key", async () => {
    const res = await request(app)
      .put("/api/reviews/review-1")
      .send({ name: "Updated Name" });

    expect(res.status).toBe(403);
  });

  it("returns 200 and updates non-empty trimmed fields", async () => {
    vi.mocked(reviewService.findReviewById).mockResolvedValue(mockReview);
    vi.mocked(reviewService.updateReview).mockResolvedValue({
      ...mockReview,
      name: "Updated Name",
    });

    const res = await request(app)
      .put("/api/reviews/review-1")
      .set("x-api-key", ADMIN_KEY)
      .send({
        name: " Updated Name ",
        message: " ",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Updated Name");
    expect(reviewService.updateReview).toHaveBeenCalledWith("review-1", {
      name: "Updated Name",
    });
  });

  it("returns 404 when updating a review that does not exist", async () => {
    vi.mocked(reviewService.findReviewById).mockResolvedValue(null);

    const res = await request(app)
      .put("/api/reviews/missing")
      .set("x-api-key", ADMIN_KEY)
      .send({ name: "Updated Name" });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Review not found");
    expect(reviewService.updateReview).not.toHaveBeenCalled();
  });

  it("replaces the image and deletes the old image", async () => {
    vi.mocked(reviewService.findReviewById).mockResolvedValue(mockReview);
    vi.mocked(uploadBuffer).mockResolvedValue(mockUpload);
    vi.mocked(reviewService.updateReview).mockResolvedValue({
      ...mockReview,
      profileUrl: mockUpload.secure_url,
      profilePublicId: mockUpload.public_id,
    });

    const res = await request(app)
      .put("/api/reviews/review-1")
      .set("x-api-key", ADMIN_KEY)
      .attach("file", Buffer.from("new fake image"), {
        filename: "new-profile.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(200);
    expect(reviewService.updateReview).toHaveBeenCalledWith("review-1", {
      profileUrl: mockUpload.secure_url,
      profilePublicId: mockUpload.public_id,
    });
    expect(destroyImage).toHaveBeenCalledWith(mockReview.profilePublicId);
  });
});

describe("DELETE /api/reviews/:id", () => {
  it("returns 403 without an admin key", async () => {
    const res = await request(app).delete("/api/reviews/review-1");

    expect(res.status).toBe(403);
  });

  it("returns 204 and deletes the review image", async () => {
    vi.mocked(reviewService.findReviewById).mockResolvedValue(mockReview);
    vi.mocked(reviewService.deleteReview).mockResolvedValue(mockReview);

    const res = await request(app)
      .delete("/api/reviews/review-1")
      .set("x-api-key", ADMIN_KEY);

    expect(res.status).toBe(204);
    expect(reviewService.deleteReview).toHaveBeenCalledWith("review-1");
    expect(destroyImage).toHaveBeenCalledWith(mockReview.profilePublicId);
  });

  it("returns 404 when deleting a review that does not exist", async () => {
    vi.mocked(reviewService.findReviewById).mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/reviews/missing")
      .set("x-api-key", ADMIN_KEY);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Review not found");
    expect(reviewService.deleteReview).not.toHaveBeenCalled();
  });
});
