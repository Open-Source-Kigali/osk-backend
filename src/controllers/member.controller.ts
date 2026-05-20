import { Request, Response, NextFunction } from "express";
import memberService from "../services/member.service";
import response from "../utils/response";
import { parseRequestBody } from "../utils/validation";
import {
  createMemberSchema,
  updateMemberSchema,
  CreateMemberInput,
  UpdateMemberInput,
} from "../schemas/member.schema";
import { CodingLevel, Member } from "../generated/prisma/client";

const allowedCodingLevels = new Set(Object.values(CodingLevel));

async function findAllMembers(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const members = await memberService.findAllMembers();
    response.success(res, members, 200, "Members retrieved successfully");
  } catch (err) {
    next(err);
  }
}

async function findMemberById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const member = await memberService.findMemberById(req.params.id);
    if (!member) {
      return response.failure(res, "Member not found", 404);
    }
    response.success(res, member, 200, "Member retrieved successfully");
  } catch (err) {
    next(err);
  }
}

async function addMember(req: Request, res: Response, next: NextFunction) {
  try {
    const data = parseRequestBody<CreateMemberInput>(
      createMemberSchema,
      req.body,
      res,
    );
    if (!data) return;

    const newMember = await memberService.addMember(data);
    response.success(res, newMember, 201, "Member created successfully");
  } catch (err) {
    next(err);
  }
}

async function updateMember(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = parseRequestBody<UpdateMemberInput>(
      updateMemberSchema,
      req.body,
      res,
    );
    if (!data) return;

    const filtered = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v !== undefined),
    ) as Partial<Omit<Member, "id">>;

    if (
      filtered.codingLevel !== undefined &&
      !allowedCodingLevels.has(filtered.codingLevel)
    ) {
      return response.failure(
        res,
        "Invalid codingLevel. Allowed values: beginner, intermediate, advanced",
        400,
      );
    }

    const existing = await memberService.findMemberById(req.params.id);
    if (!existing) return response.failure(res, "Member not found", 404);

    const updatedMember = await memberService.updateMember(
      req.params.id,
      filtered,
    );

    response.success(res, updatedMember, 200, "Member updated successfully");
  } catch (err) {
    next(err);
  }
}

async function deleteMember(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const existing = await memberService.findMemberById(req.params.id);
    if (!existing) return response.failure(res, "Member not found", 404);

    await memberService.deleteMember(req.params.id);
    response.success(res, null, 204, "Member deleted successfully");
  } catch (err) {
    next(err);
  }
}

export default {
  findAllMembers,
  findMemberById,
  addMember,
  updateMember,
  deleteMember,
};
