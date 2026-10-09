// A tiny git server: real `git http-backend` behind a local HTTP server.
// Used by the unit tests (require it) and by the UI tests (run it):
//   node scripts/git-server.cjs <folder-with-bare-repos> [port]
// Repos are then at http://127.0.0.1:<port>/<name>.git (the emulator reaches it as 10.0.2.2).
const { spawn } = require('child_process');
const http = require('http');

function startGitServer(root, port = 0) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    const cgi = spawn('git', ['http-backend'], {
      env: {
        ...process.env,
        GIT_PROJECT_ROOT: root,
        GIT_HTTP_EXPORT_ALL: '1',
        PATH_INFO: url.pathname,
        QUERY_STRING: url.search.slice(1),
        REQUEST_METHOD: req.method || 'GET',
        CONTENT_TYPE: req.headers['content-type'] || '',
        REMOTE_USER: 'test', // allows push
      },
    });
    req.pipe(cgi.stdin);

    // The CGI program prints headers, a blank line, then the body.
    let head = Buffer.alloc(0);
    let headerDone = false;
    cgi.stdout.on('data', (chunk) => {
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
    server.listen(port, '127.0.0.1', () => {
      // loopback only: nobody else on the Wi-Fi can push
      resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() });
    });
  });
}

module.exports = { startGitServer };

if (require.main === module) {
  const [root, port = '8090'] = process.argv.slice(2);
  startGitServer(root, Number(port)).then(({ url }) =>
    console.log(`git server on ${url}, repos in ${root}`),
  );
}
