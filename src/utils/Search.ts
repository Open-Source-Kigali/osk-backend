// import { Prisma } from "../generated/prisma/client";

/**
 * Builds a case-insensitive Prisma `OR` search filter across the given
 * string fields. Returns `undefined` when no search term is provided,
 * so callers can pass the result straight into `where` without extra checks.
 *
 * Usage:
 *   buildSearchFilter<Prisma.MemberWhereInput>(search, ["name", "email"])
 */
export default function buildSearchFilter<T>(
  search: string | undefined,
  fields: readonly (keyof T)[],
): T | undefined {
  if (!search) return undefined;

  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: "insensitive" as const },
    })),
  } as T;
}
