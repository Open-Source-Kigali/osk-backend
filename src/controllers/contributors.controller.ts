import { Request, Response } from "express";
import {
  readContributors,
  refreshContributors,
} from "../services/contributors.service";
import response from "../utils/response";

export async function getContributors(req: Request, res: Response) {
  try {
    const contributors = await readContributors();
    return response.success(res, contributors);
  } catch {
    return response.failure(res, "Failed to read contributors", 500);
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const result = await refreshContributors();
    return response.success(
      res,
      result,
      200,
      "Contributors refreshed successfully",
    );
  } catch {
    return response.failure(res, "Failed to refresh contributors", 500);
  }
}
