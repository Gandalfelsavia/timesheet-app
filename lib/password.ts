import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedPassword: string) {
  if (!storedPassword.includes(":")) {
    return false;
  }

  const [salt, originalHash] = storedPassword.split(":");

  if (!salt || !originalHash) {
    return false;
  }

  const hashBuffer = scryptSync(password, salt, KEY_LENGTH);
  const originalHashBuffer = Buffer.from(originalHash, "hex");

  if (hashBuffer.length !== originalHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(hashBuffer, originalHashBuffer);
}