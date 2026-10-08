import { spawn } from 'child_process';
import http from 'http';
import type { AddressInfo } from 'net';

// A tiny git server for tests: real `git http-backend` behind a local HTTP server.
// Repos are folders inside `root`; URLs look like http://127.0.0.1:<port>/<repo>.git
export function startGitServer(root: string): Promise<{ url: string; close: () => void }> {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const cgi = spawn('git', ['http-backend'], {
      env: {
        ...process.env,
        GIT_PROJECT_ROOT: root,
        GIT_HTTP_EXPORT_ALL: '1',
        PATH_INFO: url.pathname,
        QUERY_STRING: url.search.slice(1),
        REQUEST_METHOD: req.method ?? 'GET',
        CONTENT_TYPE: req.headers['content-type'] ?? '',
        REMOTE_USER: 'test', // allows push
      },
    });
    req.pipe(cgi.stdin);

    // The CGI program prints headers, a blank line, then the body.
    let head = Buffer.alloc(0);
    let headerDone = false;
    cgi.stdout.on('data', (chunk: Buffer) => {
      if (headerDone) return res.write(chunk);
      head = Buffer.concat([head, chunk]);
      const end = head.indexOf('\r\n\r\n');
      if (end === -1) return;
      let status = 200;
      for (const line of head.subarray(0, end).toString().split('\r\n')) {
        const [name, ...rest] = line.split(':');
        const value = rest.join(':').trim();
        if (name.toLowerCase() === 'status') status = parseInt(value, 10);
        else res.setHeader(name, value);
      }
      res.writeHead(status);
      res.write(head.subarray(end + 4));
      headerDone = true;
    });
    cgi.stdout.on('end', () => res.end());
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolve({ url: `http://127.0.0.1:${port}`, close: () => server.close() });
    });
  });
}
