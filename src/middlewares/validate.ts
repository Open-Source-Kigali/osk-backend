import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { response } from '../utils/response';

/**
 * Express middleware factory that validates req.body against a Zod schema.
 * Returns 400 with the first Zod error message on failure.
 *
 * Usage:
 *   router.post('/', validate(createMemberSchema), memberController.addMember)
 */
export const validate =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors[0]?.message ?? 'Validation error';
      return response.failure(res, message, 400);
    }
    req.body = result.data; // replace with coerced/typed data
    return next();
  };
