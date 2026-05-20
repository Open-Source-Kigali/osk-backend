import type { NextFunction, Request, Response } from "express";
import contributorsService from "../services/contributors.service";
import response from "../utils/response";

async function getContributors(_req: Request, res: Response, next: NextFunction) {
  try {
    const contributors = await contributorsService.readContributors();
    response.success(res, contributors, 200, "Contributors loaded");
  } catch (err) {
    next(err);
  }
}

async function refreshContributors(_req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await contributorsService.refreshContributors();
    response.success(res, summary, 200, "Contributors refresh completed");
  } catch (err) {
    next(err);
  }
}

export default {
  getContributors,
  refreshContributors,
};