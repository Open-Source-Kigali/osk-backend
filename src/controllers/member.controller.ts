import { Request, Response, NextFunction } from "express";
import memberService from "../services/member.service";

async function findAllMembers(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const members = await memberService.findAllMembers();
    res.status(200).json(members);
  } catch (err) {
    next(err);
  }
}

export default { findAllMembers };
