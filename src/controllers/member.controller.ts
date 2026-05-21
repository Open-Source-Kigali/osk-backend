import { Request, Response, NextFunction } from "express";
import memberService from "../services/member.service";
import response from "../utils/response";
import { parseRequestBody } from "../utils/validation";
import { trimStrings } from "../utils/trim-strings";
import {
  createMemberSchema,
  updateMemberSchema,
  CreateMemberInput,
  UpdateMemberInput,
} from "../schemas/member.schema";

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
 * Trims input strings and adds a new member.
 * Validates against Zod schema after trimming.
 */
async function addMember(req: Request, res: Response, next: NextFunction) {
  try {
    // Automatically trim all string inputs before validation/saving
    const trimmedBody = trimStrings(req.body as Record<string, unknown>);

    const data = parseRequestBody<CreateMemberInput>(
      createMemberSchema,
      trimmedBody,
      res,
    );
    if (!data) return;

    const newMember = await memberService.addMember(data);
    response.success(res, newMember, 201, "Member created successfully");
  } catch (err) {
    next(err);
  }
}

/**
 * Trims input strings and updates an existing member.
 */
async function updateMember(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    // Automatically trim all string inputs before validation/updating
    const trimmedBody = trimStrings(req.body as Record<string, unknown>);

    const data = parseRequestBody<UpdateMemberInput>(
      updateMemberSchema,
      trimmedBody,
      res,
    );
    if (!data) return;

    const filtered = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v !== undefined),
    ) as UpdateMemberInput;

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

/**
 * Deletes a member by their ID.
 */
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
