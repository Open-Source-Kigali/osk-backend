import { createEventSchema, updateEventSchema } from "./event.schema";
import { describe, it, expect } from "vitest";
describe("event.schema date range validation", () => {
  const baseEvent = {
    title: "Tech Summit",
    description: "Annual tech conference",
    category: "Technology",
    location: "Main Auditorium",
    date: "2026-09-01T10:00:00Z",
  };

  describe("createEventSchema", () => {
    it("should reject when endDate is earlier than start date", () => {
      const result = createEventSchema.safeParse({
        ...baseEvent,
        date: "2026-09-01T10:00:00Z",
        endDate: "2026-08-31T10:00:00Z",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) =>
          i.path.includes("endDate"),
        );
        expect(issue?.message).toBe(
          "End date must be on or after the start date",
        );
      }
    });

    it("should accept when endDate is equal to or after start date", () => {
      const sameDate = createEventSchema.safeParse({
        ...baseEvent,
        date: "2026-09-01T10:00:00Z",
        endDate: "2026-09-01T10:00:00Z",
      });

      const afterDate = createEventSchema.safeParse({
        ...baseEvent,
        date: "2026-09-01T10:00:00Z",
        endDate: "2026-09-02T10:00:00Z",
      });

      expect(sameDate.success).toBe(true);
      expect(afterDate.success).toBe(true);
    });

    it("should accept when endDate is null or omitted", () => {
      const resultNull = createEventSchema.safeParse({
        ...baseEvent,
        endDate: null,
      });

      const resultOmitted = createEventSchema.safeParse(baseEvent);

      expect(resultNull.success).toBe(true);
      expect(resultOmitted.success).toBe(true);
    });
  });

  describe("updateEventSchema", () => {
    it("should reject when endDate is earlier than start date", () => {
      const result = updateEventSchema.safeParse({
        date: "2026-09-01T10:00:00Z",
        endDate: "2026-08-31T10:00:00Z",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) =>
          i.path.includes("endDate"),
        );
        expect(issue?.message).toBe(
          "End date must be on or after the start date",
        );
      }
    });
  });
});
