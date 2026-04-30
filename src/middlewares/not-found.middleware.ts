import { Request, Response } from "express";
import response from "../utils/response";

export function notFound(_req: Request, res: Response) {
  response.failure(res, "Not Found", 404);
}
