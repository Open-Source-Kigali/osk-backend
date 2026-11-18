import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export function isBcryptHash(value: string): boolean {
  return BCRYPT_HASH_PATTERN.test(value);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Verifies a plaintext password against a stored value.
 * Only bcrypt hashes are accepted. Legacy plaintext or unknown formats
 * never authenticate, even if the strings are equal.
 */
export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  if (!isBcryptHash(stored)) {
    return false;
  }

  return bcrypt.compare(plain, stored);
}
