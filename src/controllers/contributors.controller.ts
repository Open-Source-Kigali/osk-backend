import type { Request, Response } from "express";
import { readContributors, refreshContributors } from "../services/contributors.service";
import response from "../utils/response";

export async function getContributors(req: Request, res: Response) {
  try {
    const contributors = await readContributors();
    return response.success(res, contributors, 200, "Contributors fetched");
  } catch (error) {
    return response.failure(res, "Failed to fetch contributors", 500);
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const result = await refreshContributors();
    return response.success(res, result, 200, "Contributors refreshed");
  } catch (error) {
    return response.failure(res, "Failed to refresh contributors", 500);
  }
}
