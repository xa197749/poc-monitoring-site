import { NextResponse } from "next/server";
import { validateCredentials, signToken, COOKIE_NAME } from "@/lib/auth";
import { applyDelay, shouldSimulateError } from "@/lib/store";
import { logger } from "@/lib/logger";
import { trace } from "@opentelemetry/api";

export async function POST(request: Request) {
  const tracer = trace.getTracer("poc-monitoring-site");

  return tracer.startActiveSpan("login", async (span) => {
    const start = Date.now();
    await applyDelay();

    const { simulate, code } = await shouldSimulateError();
    if (simulate) {
      span.setStatus({ code: 2, message: `Simulated error ${code}` });
      span.end();
      await logger.error("Login simulated error", { status_code: code });
      return NextResponse.json({ message: "Simulated server error" }, { status: code });
    }

    try {
      const { username, password } = await request.json();

      if (!username || !password) {
        span.end();
        return NextResponse.json(
          { message: "ユーザーIDとパスワードを入力してください" },
          { status: 400 }
        );
      }

      const valid = await validateCredentials(username, password);
      const duration = Date.now() - start;

      if (!valid) {
        span.setAttribute("login.success", false);
        span.setAttribute("login.username", username);
        span.end();
        await logger.warn("Login failed", { username, duration_ms: duration });
        return NextResponse.json(
          { message: "ユーザーIDまたはパスワードが正しくありません" },
          { status: 401 }
        );
      }

      const token = await signToken(username);
      span.setAttribute("login.success", true);
      span.setAttribute("login.username", username);
      span.end();
      await logger.info("Login success", { username, duration_ms: duration });

      const response = NextResponse.json({ success: true });
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      });

      return response;
    } catch {
      span.end();
      await logger.error("Login internal error");
      return NextResponse.json({ message: "サーバーエラーが発生しました" }, { status: 500 });
    }
  });
}

