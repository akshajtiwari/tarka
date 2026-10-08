import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

import { clampFont } from '../fontLimits';

function fingerDistance(e: TouchEvent) {
  return Math.hypot(
    e.touches[0].clientX - e.touches[1].clientX,
    e.touches[0].clientY - e.touches[1].clientY,
  );
}

// Two-finger pinch changes the font size. `preview` runs while pinching, `done` once at the end.
export function pinchZoom(
  getSize: () => number,
  preview: (size: number) => void,
  done: (size: number) => void,
): Extension {
  let startDistance = 0;
  let baseSize = 0;
  let size = 0;

  return EditorView.domEventHandlers({
    touchstart(e) {
      if (e.touches.length !== 2) return false;
      startDistance = fingerDistance(e);
      baseSize = getSize();
      size = baseSize;
      return false;
    },
    touchmove(e) {
      if (e.touches.length !== 2 || startDistance === 0) return false;
      const next = clampFont((baseSize * fingerDistance(e)) / startDistance);
      if (next !== size) {
        size = next;
        preview(next);
      }
      return true;
    },
    touchend() {
      if (startDistance === 0) return false;
      startDistance = 0;
      done(size);
      return false;
    },
  });
}
