import { Request, Response, NextFunction } from "express";
import statsService from "../services/stats.service";

export async function getStats(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await statsService.getStats();

    res.status(200).json({
      success: true,
      message: "Stats fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getStats,
};
