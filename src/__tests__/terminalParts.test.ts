import { esmUrl, packageOf, packagesRequired, toCommonJs } from '../features/terminal/jsModules';
import { addDependencies, dependenciesOf } from '../features/terminal/packageJson';
import { parseCommand, tokenize } from '../features/terminal/parseCommand';
import { addRequirements, packageName, parseRequirements } from '../features/terminal/requirements';

test('the terminal understands its commands', () => {
  expect(tokenize('run "my file.py" now')).toEqual(['run', 'my file.py', 'now']);
  expect(parseCommand('  ')).toEqual({ type: 'empty' });
  expect(parseCommand('python3 main.py')).toEqual({ type: 'python', file: 'main.py' });
  expect(parseCommand('python')).toEqual({ type: 'python', file: undefined });
  expect(parseCommand('pip install requests numpy')).toEqual({
    type: 'pip',
    action: 'install',
    packages: ['requests', 'numpy'],
  });
  expect(parseCommand('npm i lodash')).toMatchObject({ type: 'npm', action: 'install' });
  expect(parseCommand('pip install')).toMatchObject({
    type: 'unknown',
    problem: expect.any(String),
  });
  expect(parseCommand('termux gcc main.c && ./a.out')).toEqual({
    type: 'termux',
    line: 'gcc main.c && ./a.out',
  });
  expect(parseCommand('rm -rf /')).toEqual({ type: 'unknown', name: 'rm' });
});

test('requirements.txt keeps one line per package', () => {
  expect(packageName('Requests_OAuthlib>=1.0 ; python_version>"3"')).toBe('requests-oauthlib');
  expect(parseRequirements('# tools\nnumpy==2.1\n\n-r other.txt\nrich # pretty\n')).toEqual([
    'numpy==2.1',
    'rich',
  ]);
  expect(addRequirements('numpy\nrich\n', ['numpy==2.1.0', 'requests'])).toBe(
    'rich\nnumpy==2.1.0\nrequests\n',
  );
  expect(addRequirements('', ['requests'])).toBe('requests\n');
});

test('package.json gets new dependencies and keeps the rest', () => {
  const text = '{"name":"app","dependencies":{"lodash":"^4.17.21"}}';
  expect(dependenciesOf(text)).toEqual({ lodash: '^4.17.21' });
  expect(dependenciesOf(null)).toEqual({});
  expect(JSON.parse(addDependencies(text, { dayjs: '1.11.13' }))).toEqual({
    name: 'app',
    dependencies: { lodash: '^4.17.21', dayjs: '1.11.13' },
  });
  expect(() => addDependencies('{oops', { a: '1' })).toThrow('not valid JSON');
});

test('imports become requires, packages load from esm.sh at the saved version', () => {
  const code = toCommonJs(
    "import _ from 'lodash';\nimport { add } from './math';\nconsole.log(_.chunk([1], 1));",
    false,
  );
  expect(code).toContain('require(');
  expect(packagesRequired(code)).toEqual(['lodash']);
  expect(toCommonJs('const n: number = 1;', true)).not.toContain(': number');
  expect(packageOf('@scope/pkg/sub')).toBe('@scope/pkg');
  expect(esmUrl('lodash/fp', { lodash: '^4.17.21' })).toBe('https://esm.sh/lodash@4.17.21/fp');
  expect(esmUrl('dayjs', {})).toBe('https://esm.sh/dayjs');
});
