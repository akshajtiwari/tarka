import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';

const CHAR_STEP = 10; // finger pixels per character
const LINE_STEP = 24; // finger pixels per line

// Press and hold the key row, then slide: sideways moves the caret by characters,
// up/down moves it by lines. A light tick is felt for each step.
export function useTrackpad(onMove: (chars: number) => void, onMoveLines: (lines: number) => void) {
  return useMemo(() => {
    const used = { x: 0, y: 0 }; // finger distance already turned into caret moves

    return Gesture.Pan()
      .activateAfterLongPress(250)
      .runOnJS(true)
      .onStart(() => {
        used.x = 0;
        used.y = 0;
        Haptics.selectionAsync();
      })
      .onUpdate((e) => {
        const chars = Math.trunc((e.translationX - used.x) / CHAR_STEP);
        if (chars !== 0) {
          used.x += chars * CHAR_STEP;
          onMove(chars);
          Haptics.selectionAsync();
        }
        const lines = Math.trunc((e.translationY - used.y) / LINE_STEP);
        if (lines !== 0) {
          used.y += lines * LINE_STEP;
          onMoveLines(lines);
          Haptics.selectionAsync();
        }
      });
  }, [onMove, onMoveLines]);
}
