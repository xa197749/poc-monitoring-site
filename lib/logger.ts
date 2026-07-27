/**
 * Loki ログ送信ライブラリ
 */

type LogLevel = "info" | "warn" | "error" | "debug";

type LogEntry = {
  level: LogLevel;
  message: string;
  [key: string]: unknown;
};

async function sendToLoki(entries: LogEntry[]): Promise<void> {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const headers = process.env.OTEL_EXPORTER_OTLP_HEADERS;

  if (!endpoint || !headers) return;

  const lokiUrl = endpoint.replace("/otlp", "") + "/loki/api/v1/push";
  const authHeader = headers.replace("Authorization=", "");
  const now = Date.now() * 1_000_000;

  const streams = entries.map((entry) => {
    const { level, message, ...labels } = entry;
    return {
      stream: {
        service: process.env.OTEL_SERVICE_NAME ?? "poc-monitoring-site",
        level,
        ...Object.fromEntries(
          Object.entries(labels).map(([k, v]) => [k, String(v)])
        ),
      },
      values: [[String(now), JSON.stringify({ message, ...labels })]],
    };
  });

  try {
    await fetch(lokiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({ streams }),
    });
  } catch {
    // ログ送信失敗は無視
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) =>
    sendToLoki([{ level: "info", message, ...meta }]),
  warn: (message: string, meta?: Record<string, unknown>) =>
    sendToLoki([{ level: "warn", message, ...meta }]),
  error: (message: string, meta?: Record<string, unknown>) =>
    sendToLoki([{ level: "error", message, ...meta }]),
  debug: (message: string, meta?: Record<string, unknown>) =>
    sendToLoki([{ level: "debug", message, ...meta }]),
};
