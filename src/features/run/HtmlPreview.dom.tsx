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
      style={{ border: 'none', width: '100vw', height: '100vh', backgroundColor: '#fff' }}
    />
  );
}
