const INTERNAL_PUBLIC_ID_KEYS = new Set([
  "imagePublicId",
  "logoPublicId",
  "profilePublicId",
]);

function stripPublicIds<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripPublicIds) as T;
  }

  if (!value || typeof value !== "object" || value instanceof Date) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).filter(([key]) => !INTERNAL_PUBLIC_ID_KEYS.has(key)),
  ) as T;
}

export default stripPublicIds;
