import { NextResponse } from "next/server";
import { applyDelay, shouldSimulateError } from "@/lib/store";

const START_TIME = Date.now();

export async function GET() {
  const requestStart = Date.now();

  await applyDelay();

  const { simulate, code } = await shouldSimulateError();
  if (simulate) {
    return NextResponse.json(
      {
        status: "error",
        message: `Simulated HTTP ${code}`,
        timestamp: new Date().toISOString(),
      },
      {
        status: code,
        headers: { "X-Content-Marker": "HEALTH_CHECK_ENDPOINT" },
      }
    );
  }

  const responseTime = Date.now() - requestStart;

  return NextResponse.json(
    {
      status: "ok",
      message: "POC Monitoring Site is running",
      timestamp: new Date().toISOString(),
      uptime_ms: Date.now() - START_TIME,
      response_time_ms: responseTime,
      version: "1.0.0",
    },
    {
      headers: {
        "X-Content-Marker": "HEALTH_CHECK_ENDPOINT",
        "X-Response-Time": `${responseTime}ms`,
        "Cache-Control": "no-store",
      },
    }
  );
}
