import { NextResponse } from "next/server";
import { getAuthUser, validateCredentials, hashPassword } from "@/lib/auth";
import { getSettings, updateSettings, isKvAvailable } from "@/lib/store";

// GET: 現在の設定を取得
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
  }

  const settings = await getSettings();
  const kv_available = await isKvAvailable();

  return NextResponse.json({
    delay_ms: settings.delay_ms,
    error_enabled: settings.error_enabled,
    error_rate: settings.error_rate,
    error_code: settings.error_code,
    username: settings.username,
    kv_available,
  });
}

// PUT: 設定を更新
export async function PUT(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ message: "認証が必要です" }, { status: 401 });
  }

  const body = await request.json();

  // 認証情報変更
  if (body.change_credentials) {
    const { current_password, new_username, new_password } = body;

    if (!current_password) {
      return NextResponse.json({ message: "現在のパスワードを入力してください" }, { status: 400 });
    }

    // 現在のパスワードを検証
    const valid = await validateCredentials(user.username, current_password);
    if (!valid) {
      return NextResponse.json({ message: "現在のパスワードが正しくありません" }, { status: 403 });
    }

    const patch: Record<string, unknown> = {};
    if (new_username && new_username !== user.username) {
      patch.username = new_username;
    }
    if (new_password) {
      patch.password_hash = await hashPassword(new_password);
    }

    if (Object.keys(patch).length > 0) {
      await updateSettings(patch);
    }

    return NextResponse.json({ success: true });
  }

  // 監視設定の更新
  const patch: Record<string, unknown> = {};

  if (typeof body.delay_ms === "number" && body.delay_ms >= 0) {
    patch.delay_ms = Math.min(body.delay_ms, 30000);
  }
  if (typeof body.error_enabled === "boolean") {
    patch.error_enabled = body.error_enabled;
  }
  if (typeof body.error_rate === "number") {
    patch.error_rate = Math.max(0, Math.min(100, body.error_rate));
  }
  if (typeof body.error_code === "number") {
    patch.error_code = body.error_code;
  }

  if (Object.keys(patch).length > 0) {
    await updateSettings(patch);
  }

  return NextResponse.json({ success: true });
}
