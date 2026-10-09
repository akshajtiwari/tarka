// POSTs JSON and returns the JSON reply. Errors carry the server's own message,
// e.g. "Anthropic error 401: invalid x-api-key", so the user knows what to fix.
export async function postJson(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  signal: AbortSignal,
  service: string,
): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = data?.error;
    const message = typeof error === 'string' ? error : (error?.message ?? response.statusText);
    throw new Error(`${service} error ${response.status}: ${message}`);
  }
  return data;
}
