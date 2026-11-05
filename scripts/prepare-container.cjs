// Workers Builds runs this before Wrangler builds the image. Installing outside
// Docker avoids nested-container RUN failures in restricted build environments.
const { mkdirSync, copyFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

if (process.platform !== 'linux' || process.arch !== 'x64' || process.versions.node.split('.')[0] !== '22') {
  console.error('Prepare the container dependencies on Linux x64 with Node.js 22, matching the container image.');
  process.exit(1);
}
const root = path.resolve(__dirname, '..');
const destination = path.join(root, '.container-deps');
mkdirSync(destination, { recursive: true });
for (const file of ['package.json', 'package-lock.json']) {
  copyFileSync(path.join(root, file), path.join(destination, file));
}
const result = spawnSync('npm', ['ci', '--omit=dev', '--omit=optional', '--legacy-peer-deps', '--prefix', destination], {
  cwd: root,
  stdio: 'inherit'
});
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
