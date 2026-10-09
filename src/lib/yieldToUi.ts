// Git work runs on the JS thread. Pausing for a moment when it has run ~12 ms without a
// break lets taps, animations and renders through, so the app stays responsive meanwhile.
// (A setTimeout pause, not setImmediate: only a timer lets touch events in.)
const BUDGET_MS = 12;
let lastBreak = Date.now();

export async function maybeYield() {
  if (Date.now() - lastBreak < BUDGET_MS) return;
  await new Promise((resolve) => setTimeout(resolve, 0));
  lastBreak = Date.now();
}
