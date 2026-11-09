import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const electronDir = path.dirname(require.resolve('electron/package.json'));
const pathFile = path.join(electronDir, 'path.txt');

if (fs.existsSync(pathFile)) {
  process.exit(0);
}

// Yarn's enableScripts: false skips electron's postinstall download. Fetch the binary on first run.
const result = spawnSync(process.execPath, [path.join(electronDir, 'install.js')], {
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
