import type { NextFunction, Request, Response } from "express";
import {
  readContributors,
  refreshContributors,
} from "../services/contributors.service";
import contributorService from "../services/contributor.service";
import response from "../utils/response";

export async function getContributors(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    let contributors = await readContributors();

    // If readContributors returns an empty list (or nothing), fall back to the
    // legacy contributor service and normalize legacy profiles into the
    // modern `Contributor` shape so TypeScript and the rest of the codebase
    // can consume a consistent type.
    if (!Array.isArray(contributors) || contributors.length === 0) {
      const legacy = await contributorService.getContributors();
      contributors = legacy.map((p: unknown) => {
        const pp = p as Record<string, unknown>;
        const login = String(pp.login ?? pp["login"] ?? "");
        const name = String(pp.name ?? pp["name"] ?? login);
        const avatarUrl = String(pp.avatar_url ?? pp["avatarUrl"] ?? "");
        const profileUrl = String(pp.html_url ?? pp["profileUrl"] ?? "");
        const bio = String(pp.bio ?? "");
        const company = String(pp.company ?? "");
        return { login, name, avatarUrl, profileUrl, bio, company };
      });
    }

    return response.success(res, contributors, 200, "Contributors fetched");
  } catch (err) {
    next(err);
  }
}

export async function refresh(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await refreshContributors();
    return response.success(res, result, 200, "Contributors refreshed");
  } catch (err) {
    next(err);
  }
}
