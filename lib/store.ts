/**
 * 設定ストア
 * Vercel KV が設定されていれば永続化、なければメモリ内（コールドスタートでリセット）
 */

// フォールバック用インメモリストア
const localStore = new Map<string, unknown>();

async function kvGet<T>(key: string): Promise<T | null> {
  try {
    // @vercel/kv はランタイムで動的インポート
    const { kv } = await import("@vercel/kv");
    return await kv.get<T>(key);
  } catch {
    return (localStore.get(key) as T) ?? null;
  }
}

async function kvSet(key: string, value: unknown): Promise<void> {
  try {
    const { kv } = await import("@vercel/kv");
    await kv.set(key, value);
  } catch {
    localStore.set(key, value);
  }
}

// デフォルト設定
const DEFAULTS = {
  delay_ms: 0,
  error_enabled: false,
  error_rate: 0,   // 0〜100 (%)
  error_code: 500,
  username: process.env.INITIAL_USERNAME ?? "admin",
  password_hash: "",  // 空の場合は初期パスワードで認証
};

export type Settings = {
  delay_ms: number;
  error_enabled: boolean;
  error_rate: number;
  error_code: number;
  username: string;
  password_hash: string;
};

export async function getSettings(): Promise<Settings> {
  const [delay_ms, error_enabled, error_rate, error_code, username, password_hash] =
    await Promise.all([
      kvGet<number>("settings:delay_ms"),
      kvGet<boolean>("settings:error_enabled"),
      kvGet<number>("settings:error_rate"),
      kvGet<number>("settings:error_code"),
      kvGet<string>("settings:username"),
      kvGet<string>("settings:password_hash"),
    ]);

  return {
    delay_ms: delay_ms ?? DEFAULTS.delay_ms,
    error_enabled: error_enabled ?? DEFAULTS.error_enabled,
    error_rate: error_rate ?? DEFAULTS.error_rate,
    error_code: error_code ?? DEFAULTS.error_code,
    username: username ?? DEFAULTS.username,
    password_hash: password_hash ?? DEFAULTS.password_hash,
  };
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const ops = Object.entries(patch).map(([key, value]) =>
    kvSet(`settings:${key}`, value)
  );
  await Promise.all(ops);
}

export async function applyDelay(): Promise<void> {
  const delayMs = (await kvGet<number>("settings:delay_ms")) ?? 0;
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

export async function shouldSimulateError(): Promise<{ simulate: boolean; code: number }> {
  const enabled = (await kvGet<boolean>("settings:error_enabled")) ?? false;
  if (!enabled) return { simulate: false, code: 0 };
  const rate = (await kvGet<number>("settings:error_rate")) ?? 0;
  const code = (await kvGet<number>("settings:error_code")) ?? 500;
  const simulate = Math.random() * 100 < rate;
  return { simulate, code };
}

export async function isKvAvailable(): Promise<boolean> {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}
