'use dom';

// Shows a web page from the project. Local CSS/JS are already copied in (see inlineAssets).

import type { DOMProps } from 'expo/dom';

type Props = {
  html: string;
  dom?: DOMProps;
};

export default function HtmlPreview({ html }: Props) {
  return (
    <iframe
      title="Preview"
      srcDoc={html}
      sandbox="allow-scripts allow-modals"
      // Pinned to the WebView's edges: 100vh is measured once and came out short on Android.
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        backgroundColor: '#fff',
      }}
    />
  );
}
