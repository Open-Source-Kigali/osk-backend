import { Request, Response } from "express";
import response from "../utils/response";

function checkHealth(_req: Request, res: Response) {
  response.success(res, { status: "ok", uptime: process.uptime() });
}

export default { checkHealth };
