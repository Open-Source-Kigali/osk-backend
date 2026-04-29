import { Request, Response } from "express";

export const checkHealth = (_req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime() });
};
