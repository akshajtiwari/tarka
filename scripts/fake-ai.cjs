// A fake OpenAI-compatible AI server for UI tests, so the agent can be tested for free and
// always the same way. It follows a fixed script, counting the tool results it has received:
//   0 results -> ask to read main.py
//   1 result  -> ask to write notes.txt
//   2 results -> answer "Done ..."
// Run: node scripts/fake-ai.cjs [port]   (the emulator reaches it at http://10.0.2.2:<port>/v1)
const http = require('http');

function reply(toolResults) {
  const call = (name, args) => ({
    role: 'assistant',
    content: null,
    tool_calls: [{ id: `call_${toolResults}`, type: 'function', function: { name, arguments: JSON.stringify(args) } }],
  });
  if (toolResults === 0) return { message: call('read_file', { path: 'main.py' }), finish: 'tool_calls' };
  if (toolResults === 1) return { message: call('write_file', { path: 'notes.txt', content: 'written by the agent\n' }), finish: 'tool_calls' };
  return { message: { role: 'assistant', content: 'Done: I read main.py and wrote notes.txt.' }, finish: 'stop' };
}

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    if (req.method !== 'POST' || !req.url.endsWith('/chat/completions')) {
      res.writeHead(404).end();
      return;
    }
    const { messages = [] } = JSON.parse(body || '{}');
    const { message, finish } = reply(messages.filter((m) => m.role === 'tool').length);
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      id: 'fake', object: 'chat.completion', created: 0, model: 'fake',
      choices: [{ index: 0, message, finish_reason: finish, logprobs: null }],
    }));
  });
});

const port = Number(process.argv[2] || 8091);
server.listen(port, '127.0.0.1', () => console.log(`fake AI on http://127.0.0.1:${port}/v1`));
