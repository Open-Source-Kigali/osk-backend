import { Request, Response, NextFunction } from "express";
import memberService from "../services/member.service";
import response from "../utils/response";
import { Member } from "../generated/prisma/client";

const ALLOWED_CODING_LEVELS = ["beginner", "intermediate", "advanced"] as const;

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
    const requiredFields = [
      "name",
      "email",
      "githubUsername",
      "orgName",
      "joinReason",
      "codingLevel",
    ] as const;
    const body = req.body as Record<string, unknown>;
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return response.failure(res, `${field} is required`, 400);
      }
    }

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_RE.test(String(body.email))) {
      return response.failure(res, "Invalid email address", 400);
    }

    if (
      !ALLOWED_CODING_LEVELS.includes(
        body.codingLevel as (typeof ALLOWED_CODING_LEVELS)[number],
      )
    ) {
      return response.failure(
        res,
        `codingLevel must be one of: ${ALLOWED_CODING_LEVELS.join(", ")}`,
        400,
      );
    }

    const newMember = await memberService.addMember(req.body);
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
    const existing = await memberService.findMemberById(req.params.id);
    if (!existing) return response.failure(res, "Member not found", 404);

    const filtered = Object.fromEntries(
      Object.entries(req.body).filter(([, v]) => v !== ""),
    ) as Partial<Omit<Member, "id">>;
    if (
      filtered.codingLevel &&
      !ALLOWED_CODING_LEVELS.includes(
        filtered.codingLevel as (typeof ALLOWED_CODING_LEVELS)[number],
      )
    ) {
      return response.failure(
        res,
        `codingLevel must be one of: ${ALLOWED_CODING_LEVELS.join(", ")}`,
        400,
      );
    }
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
