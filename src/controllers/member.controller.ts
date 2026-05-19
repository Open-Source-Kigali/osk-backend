import { Request, Response, NextFunction } from "express";
import memberService from "../services/member.service";
import response from "../utils/response";
import { Member } from "../generated/prisma/client";
import {
  createMemberSchema,
  updateMemberSchema,
} from "../schemas/member.schema";

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

async function addMember(
  req: Request<object, unknown, Omit<Member, "id">>,
  res: Response,
  next: NextFunction,
) {
  try {
    const validation = createMemberSchema.safeParse(req.body);
    if (!validation.success) {
      const messages = validation.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      return response.failure(res, messages, 400);
    }
    const newMember = await memberService.addMember(validation.data);
    response.success(res, newMember, 201, "Member created successfully");
  } catch (err) {
    next(err);
  }
}

async function updateMember(
  req: Request<{ id: string }, unknown, Partial<Omit<Member, "id">>>,
  res: Response,
  next: NextFunction,
) {
  try {
    const validation = updateMemberSchema.safeParse(req.body);
    if (!validation.success) {
      const messages = validation.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      return response.failure(res, messages, 400);
    }
    const filtered = Object.fromEntries(
      Object.entries(validation.data).filter(([, v]) => v !== ""),
    ) as Partial<Omit<Member, "id">>;
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
