import { memo } from 'react';

import RunnerView from '../run/Runner.dom';
import type { BridgeEvent } from './bridgeTypes';
import { useTerminalStore } from './terminalStore';

const Runner = memo(RunnerView);
// Out of the layout (Expo gives a styled DOM component flex: 1, which would take half the
// screen next to the tabs), invisible, and 1×1 rather than 0×0: Android skips creating views
// with no size, and then the WebView could not be reached.
const tiny = { position: 'absolute', width: 1, height: 1, flex: 0, opacity: 0 } as const;
const hidden = { style: tiny, containerStyle: tiny };
const onEvent = async (event: BridgeEvent) => useTerminalStore.getState().onEvent(event);

// The hidden runner WebView, mounted in the workspace (so a session survives switching tabs)
// once the terminal first needs it.
export function TerminalBridge() {
  const bridgeOn = useTerminalStore((s) => s.bridgeOn);
  const command = useTerminalStore((s) => s.command);
  if (!bridgeOn) return null;
  return <Runner command={command} onEvent={onEvent} dom={hidden} />;
}
