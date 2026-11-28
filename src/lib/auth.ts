import { cookies } from "next/headers";
import {
  createSession,
  deleteSession,
  getProfileByEmail,
  getProfileById,
  getSessionProfile,
  purgeExpiredSessions,
} from "@/lib/queries";
import { ensureStorage, invalidateStorage, runMutation } from "@/lib/storage";
import {
  generateToken,
  hashPasswordSync,
  hashToken,
  verifyPassword,
} from "@/lib/password";

const COOKIE_NAME = "barbearia_session";
const SESSION_DAYS = 7;

export async function login(email: string, password: string): Promise<boolean> {
  await ensureStorage();
  const profile = getProfileByEmail(email);
  if (!profile || !verifyPassword(password, profile.password_hash)) return false;

  const token = generateToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await runMutation(() => {
    purgeExpiredSessions();
    createSession(profile.id, hashToken(token), expires.toISOString());
  });
  // Garante que a próxima leitura (mesmo em outra instância) encontre a sessão.
  invalidateStorage();

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
  if (token) {
    await ensureStorage();
    const hashed = hashToken(token);
    await runMutation(() => deleteSession(hashed));
  }
  store.delete(COOKIE_NAME);
}

export async function getCurrentAdmin() {
  await ensureStorage();
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const hashed = hashToken(token);

  const profile = getSessionProfile(hashed);
  if (profile) return profile;

  // A sessão pode ter sido criada em outra instância há menos de 1s (janela
  // de TTL da sincronização com o Blobs). Antes de desistir, força uma nova
  // leitura do snapshot; se ainda assim não existir, o redirect continua.
  invalidateStorage();
  await ensureStorage();
  return getSessionProfile(hashed);
}

export function hashPassword(password: string): string {
  return hashPasswordSync(password);
}
