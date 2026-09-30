// Measures test coverage of cookies.js and helpers.js:
// 1. Copy package into a temp dir with istanbul-instrumented sources
// 2. Run Tinytest via mtest; tests/coverage.js saves client and server `__coverage__`
// 3. Report and check thresholds with nyc (config in package.json `nyc` field)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const bin = (name) => path.join(root, 'node_modules', '.bin', name);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ostrio-cookies-coverage-'));
const coverageDir = path.join(root, '.coverage');

const run = (cmd, args, opts = {}) => {
  const result = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
  return result;
};

fs.rmSync(coverageDir, { recursive: true, force: true });
for (const file of ['package.js', '.versions', 'index.d.ts', 'tests']) {
  fs.cpSync(path.join(root, file), path.join(tmp, file), { recursive: true });
}

for (const file of ['cookies.js', 'helpers.js']) {
  const { stdout } = run(bin('nyc'), ['instrument', '--es-modules', path.join(root, file)], { stdio: ['ignore', 'pipe', 'inherit'] });
  fs.writeFileSync(path.join(tmp, file), stdout);
}

run(bin('mtest'), ['--package', tmp, '--port=8888', '--once'], {
  env: { ...process.env, COVERAGE_DIR: coverageDir }
});
fs.rmSync(tmp, { recursive: true, force: true });

if (!fs.existsSync(path.join(coverageDir, 'server.json')) || !fs.existsSync(path.join(coverageDir, 'client.json'))) {
  console.error('Coverage data was not collected');
  process.exit(1);
}

run(bin('nyc'), ['report']);
run(bin('nyc'), ['check-coverage']);
