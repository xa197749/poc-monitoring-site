import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { getSettings } from "./store";

const COOKIE_NAME = "auth_token";
const EXPIRY = "24h";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
}

export async function signToken(username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<{ username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { username: payload.username as string };
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<{ username: string } | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function validateCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const settings = await getSettings();

  // ユーザー名チェック
  if (username !== settings.username) return false;

  // パスワードチェック: KVにハッシュがあればそれを使用、なければ環境変数と直接比較
  if (settings.password_hash) {
    return bcrypt.compare(password, settings.password_hash);
  } else {
    // 初期パスワード（環境変数）と比較
    const initialPassword = process.env.INITIAL_PASSWORD ?? "password123";
    return password === initialPassword;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export { COOKIE_NAME };
