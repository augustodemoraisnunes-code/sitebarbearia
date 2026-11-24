import { cookies } from "next/headers";
import {
  createSession,
  deleteSession,
  getProfileByEmail,
  getProfileById,
  getSessionProfile,
  purgeExpiredSessions,
} from "@/lib/queries";
import {
  generateToken,
  hashPasswordSync,
  hashToken,
  verifyPassword,
} from "@/lib/password";

const COOKIE_NAME = "barbearia_session";
const SESSION_DAYS = 7;

export async function login(email: string, password: string): Promise<boolean> {
  const profile = getProfileByEmail(email);
  if (!profile || !verifyPassword(password, profile.password_hash)) return false;

  const token = generateToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  purgeExpiredSessions();
  createSession(profile.id, hashToken(token), expires.toISOString());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return true;
}

export async function logout(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) deleteSession(hashToken(token));
  store.delete(COOKIE_NAME);
}

export async function getCurrentAdmin() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return getSessionProfile(hashToken(token));
}

export function hashPassword(password: string): string {
  return hashPasswordSync(password);
}
