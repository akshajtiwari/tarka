// Starter projects. Each file path maps to its contents.

export type Template = {
  id: string;
  title: string;
  description: string;
  files: Record<string, string>;
};

export const templates: Template[] = [
  {
    id: 'js',
    title: 'JavaScript',
    description: 'A main.js file you can run on the phone',
    files: {
      'main.js': "const name = 'world';\nconsole.log(`hello, ${name}`);\n",
      'README.md': '# My project\n\nRun `main.js` from the Run tab.\n',
    },
  },
  {
    id: 'python',
    title: 'Python',
    description: 'A main.py file you can run on the phone',
    files: {
      'main.py': "def greet(name):\n    return f'hello, {name}'\n\nprint(greet('world'))\n",
      'README.md': '# My project\n\nRun `main.py` from the Run tab.\n',
    },
  },
  {
    id: 'web',
    title: 'Web page',
    description: 'HTML, CSS and JS with a live preview',
    files: {
      'index.html':
        '<!doctype html>\n<html>\n  <head>\n    <link rel="stylesheet" href="style.css" />\n  </head>\n  <body>\n    <h1>Hello</h1>\n    <script src="app.js"></script>\n  </body>\n</html>\n',
      'style.css': 'body {\n  font-family: sans-serif;\n  padding: 24px;\n}\n',
      'app.js': "document.querySelector('h1').textContent = 'Hello from TARKA';\n",
    },
  },
];
