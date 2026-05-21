/**
 * Recursively (or shallowly as per requirement) trims all string properties of an object.
 * This is useful for cleaning up user input before saving to the database.
 * @param obj - The object whose string properties should be trimmed.
 * @returns A new object with all string properties trimmed.
 */
export function trimStrings<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      typeof v === "string" ? v.trim() : v,
    ]),
  ) as T;
}
