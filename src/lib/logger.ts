// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Small structured logger for server-side operational events.

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, string | number | boolean | null | undefined>;

const SECRET_KEY_PATTERN = /(secret|password|token|database_url|access_key|secret_key|cookie|authorization)/i;

function redactContext(context: LogContext): LogContext {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      SECRET_KEY_PATTERN.test(key) ? '[redacted]' : value,
    ]),
  );
}

function shouldLog(level: LogLevel): boolean {
  const configured = (process.env.LOG_LEVEL ?? 'info').toLowerCase();
  const order: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
  return order[level] >= (order[configured as LogLevel] ?? order.info);
}

export function logServerEvent(
  level: LogLevel,
  event: string,
  context: LogContext = {},
): void {
  if (!shouldLog(level)) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...redactContext(context),
  };

  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}
