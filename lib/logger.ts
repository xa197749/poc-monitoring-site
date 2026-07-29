type LogLevel = "info" | "warn" | "error" | "debug";
type LogEntry = {
  level: LogLevel;
  message: string;
  [key: string]: unknown;
};
async function sendToLoki(entries) {
  const lokiUrl = process.env.LOKI_URL;
  const authHeader = process.env.LOKI_AUTH;
  if (!lokiUrl || !authHeader) return;
  const now = Date.now() * 1000000;
  const streams = entries.map((entry) => {
    const { level, message, ...labels } = entry;
    return {
      stream: {
        service: process.env.OTEL_SERVICE_NAME ?? "poc-monitoring-site",
        level,
        ...Object.fromEntries(Object.entries(labels).map(([k, v]) => [k, String(v)])),
      },
      values: [[String(now), JSON.stringify({ message, ...labels })]],
    };
  });
  try {
    await fetch(lokiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader },
      body: JSON.stringify({ streams }),
    });
  } catch (e) {}
}
export const logger = {
  info: (message, meta = {}) => sendToLoki([{ level: "info", message, ...meta }]),
  warn: (message, meta = {}) => sendToLoki([{ level: "warn", message, ...meta }]),
  error: (message, meta = {}) => sendToLoki([{ level: "error", message, ...meta }]),
  debug: (message, meta = {}) => sendToLoki([{ level: "debug", message, ...meta }]),
};