import { Request, Response, NextFunction } from "express";
import memberService from "../services/member.service";
import response from "../utils/response";
import { Member } from "../generated/prisma/client";
import { trimStrings } from "../utils/trim-strings";

/**
 * Fetches all members from the database.
 */
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

/**
 * Fetches a single member by their ID.
 */
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

/**
 * Trims input strings and adds a new member to the database.
 */
async function addMember(
  req: Request<object, unknown, Omit<Member, "id">>,
  res: Response,
  next: NextFunction,
) {
  try {
    // Automatically trim all string inputs before saving
    const trimmedBody = trimStrings(req.body as Record<string, unknown>);
    const newMember = await memberService.addMember(
      trimmedBody as Omit<Member, "id">,
    );
    response.success(res, newMember, 201, "Member created successfully");
  } catch (err) {
    next(err);
  }
}

/**
 * Trims input strings and updates an existing member.
 */
async function updateMember(
  req: Request<{ id: string }, unknown, Partial<Omit<Member, "id">>>,
  res: Response,
  next: NextFunction,
) {
  try {
    // Automatically trim all string inputs before updating
    const trimmedBody = trimStrings(req.body as Record<string, unknown>);
    const filtered = Object.fromEntries(
      Object.entries(trimmedBody).filter(([, v]) => v !== ""),
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

/**
 * Deletes a member by their ID.
 */
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
