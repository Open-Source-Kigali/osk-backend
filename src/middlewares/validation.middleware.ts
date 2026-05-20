import type { ZodTypeAny } from "zod";
import type { NextFunction, Request, Response } from "express";
import response from "../utils/response";

export function validate(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.flatten();
      const message = errors.formErrors.join(" | ") || "Invalid request body";
      return response.failure(res, message, 400);
    }

    req.body = result.data as any;
    return next();
  };
}
