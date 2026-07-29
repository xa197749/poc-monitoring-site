/**
 * Loki 繝ｭ繧ｰ騾∽ｿ｡繝ｩ繧､繝悶Λ繝ｪ
 */
type LogLevel = "info" | "warn" | "error" | "debug";
type LogEntry = {
  level: LogLevel;
  message: string;
  [key: string]: unknown;
};
async function sendToLoki(entries: LogEntry[]): Promise<void> {
  const lokiUrl = process.env.LOKI_URL;
  const authHeader = process.env.LOKI_AUTH;
  if (!lokiUrl || !authHeader) return;
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
    // 繝ｭ繧ｰ騾∽ｿ｡螟ｱ謨励・辟｡隕・  }
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
'@ | Set-Content lib\logger.ts -Encoding UTF8
