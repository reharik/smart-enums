// Copies the built @reharik/smart-enum declarations into a second, unrelated
// location so the fixture project sees two distinct copies of the package
// (`@reharik/smart-enum` and `smart-enum-copy`) — the duplicate-install case
// the rule exists for.
const fs = require('node:fs');
const path = require('node:path');

module.exports = () => {
  const entry = require.resolve('@reharik/smart-enum');
  const distDir = path.dirname(entry);
  const target = path.join(__dirname, 'fixtures', 'smart-enum-copy');

  if (!fs.existsSync(path.join(distDir, 'index.d.ts'))) {
    throw new Error(
      `@reharik/smart-enum declarations not found in ${distDir}; run \`npm run build -w @reharik/smart-enum\` first.`,
    );
  }

  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  for (const file of fs.readdirSync(distDir)) {
    if (file.endsWith('.d.ts')) {
      fs.copyFileSync(path.join(distDir, file), path.join(target, file));
    }
  }
};
