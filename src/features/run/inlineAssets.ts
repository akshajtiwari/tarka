// The HTML preview has no web server, so local CSS and JS files are copied into the page.
// <link rel="stylesheet" href="style.css">  ->  <style>…contents…</style>
// <script src="app.js"></script>            ->  <script>…contents…</script>
// Remote URLs (http/https) are left alone. `read` returns a project file's text, or null.
export function inlineAssets(html: string, read: (path: string) => string | null): string {
  const local = (href: string) => !/^[a-z]+:\/\//i.test(href) && !href.startsWith('//');

  const withStyles = html.replace(
    /<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi,
    (tag: string, href: string) => {
      if (!/rel=["']stylesheet["']/i.test(tag) || !local(href)) return tag;
      const css = read(href);
      return css === null ? tag : `<style>\n${css}\n</style>`;
    },
  );

  return withStyles.replace(
    /<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (tag: string, src: string) => {
      if (!local(src)) return tag;
      const js = read(src);
      return js === null ? tag : `<script>\n${js}\n</script>`;
    },
  );
}
