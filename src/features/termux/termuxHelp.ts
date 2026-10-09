// Turns Termux problems into what to do next.

export const TERMUX_SETUP_COMMAND =
  'mkdir -p ~/.termux && echo allow-external-apps=true >> ~/.termux/termux.properties';

export const GET_TERMUX_URL = 'https://f-droid.org/packages/com.termux/';

export type TermuxProblem =
  'unsupported' | 'not-installed' | 'no-permission' | 'external-apps-off' | 'not-found' | 'timeout';

export function explainTermux(problem: TermuxProblem, detail = ''): string[] {
  switch (problem) {
    case 'unsupported':
      return ['Termux only works on Android.'];
    case 'not-installed':
      return [
        "Termux isn't installed. Get it from F-Droid (not the Play Store version):",
        GET_TERMUX_URL,
        'Then open it once so it can finish setting up.',
      ];
    case 'no-permission':
      return [
        'TARKA may not run commands in Termux yet. Allow it in Settings → Termux,',
        'or in Android settings: Apps → TARKA → Permissions → Run commands in Termux.',
      ];
    case 'external-apps-off':
      return [
        'Termux is blocking other apps. Run this once in Termux, then close and reopen it:',
        TERMUX_SETUP_COMMAND,
      ];
    case 'not-found':
      return [
        `Command not found in Termux. Install it there with pkg, e.g. pkg install ${detail || 'clang'}.`,
      ];
    case 'timeout':
      return ['No answer from Termux after 2 minutes. Open Termux to see what it is doing.'];
  }
}

// Termux reports its own errors as text; this one means allow-external-apps is off.
export const isExternalAppsOff = (message: string) => /allow-external-apps/i.test(message);
