export default function trimStrings<T extends Record<string, unknown>>(obj: T): T {
  if (obj == null || typeof obj !== "object") return obj;
  const entries = Object.entries(obj).map(([k, v]) => [k, typeof v === "string" ? (v as string).trim() : v]);
  return Object.fromEntries(entries) as T;
}
