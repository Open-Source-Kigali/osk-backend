vi.mock("../services/review.service");
import { beforeEach, describe, expect, it, vi } from "vitest";
import reviewService from "../services/review.service";
import request from "supertest";
import app from "../app";

beforeEach(() => vi.resetAllMocks());
const mockReviews = [
  {
    id: "4",
    name: "Arnold jabo",
    profileUrl: "https://images.com/456",
    profilePublicId: "43",
    role: "user",
    message: "some random messages",
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "40",
    name: "John Doe",
    profileUrl: "https://images.com/400",
    profilePublicId: "47",
    role: "user",
    message: "Lorem ipsum lorem ipsum",
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "50",
    name: "jane doe",
    profileUrl: "https://images.com/600",
    profilePublicId: "73",
    role: "user",
    message: "Great Job!",
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
describe("GET api/reviews", () => {
  it("gets all reviews", async () => {
    vi.mocked(reviewService.findAllReviews).mockResolvedValue(mockReviews);
    const response = await request(app).get("/api/reviews");

    expect(response.status).toBe(200);
    expect(reviewService.findAllReviews).toHaveBeenCalledWith(undefined);
  });

  it("returns featured reviews ", async () => {
    vi.mocked(reviewService.findAllReviews).mockResolvedValue(mockReviews);

    const response = await request(app).get("/api/reviews?featured=true");
    expect(response.status).toBe(200);
    expect(reviewService.findAllReviews).toHaveBeenCalledWith(true);
  });
  it("returns non-featured reviews ", async () => {
    const nonFeaturedReviews = mockReviews.filter(
      (review) => review.featured === false,
    );
    vi.mocked(reviewService.findAllReviews).mockResolvedValue(
      nonFeaturedReviews,
    );

    const response = await request(app).get("/api/reviews?featured=false");
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(reviewService.findAllReviews).toHaveBeenCalledWith(false);
  });
});
