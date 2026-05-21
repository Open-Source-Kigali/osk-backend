import { Request, Response, NextFunction } from "express";
import contributorService from "../services/contributor.service";
import response from "../utils/response";

async function findAllContributors(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const contributors = await contributorService.getContributors();
    response.success(
      res,
      contributors,
      200,
      "Contributors retrieved successfully",
    );
  } catch (err) {
    next(err);
  }
}

export default { findAllContributors };
