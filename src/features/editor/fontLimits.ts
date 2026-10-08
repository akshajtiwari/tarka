// Shared by the native settings and the editor WebView (keep this file free of native imports).
export const MIN_FONT = 10;
export const MAX_FONT = 24;

export function clampFont(size: number): number {
  return Math.round(Math.min(Math.max(size, MIN_FONT), MAX_FONT));
}
