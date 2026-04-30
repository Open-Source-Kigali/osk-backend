import { Request, Response } from "express";

function checkHealth(_req: Request, res: Response) {
  res.json({ status: "ok", uptime: process.uptime() });
}

export default { checkHealth };
