import type { NextFunction, Request, Response } from "express";
import {
  readContributors,
  refreshContributors,
} from "../services/contributors.service";
import response from "../utils/response";

/**
 * Fetches the cached list of contributors.
 */
export async function getContributors(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const contributors = await readContributors();
    return response.success(res, contributors, 200, "Contributors fetched");
  } catch (err) {
    next(err);
  }
}

/**
 * Refreshes the contributors list by parsing CONTRIBUTORS.md and fetching GitHub profiles.
 */
export async function refresh(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await refreshContributors();
    return response.success(res, result, 200, "Contributors refreshed");
  } catch (err) {
    next(err);
  }
}
