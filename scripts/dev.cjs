// Starts the analysis API and the Vite dev server together, so Gemini works from one command.
const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const run = (file, args = []) => spawn(process.execPath, [path.join(root, file), ...args], { cwd: root, stdio: 'inherit' });

const api = run('server/start.cjs');
const web = run('node_modules/vite/bin/vite.js', process.argv.slice(2));

// The local parser needs no API, so a failed API start leaves the site running.
api.on('exit', (code) => { if (code) console.error('Analysis API stopped; Gemini is unavailable until it restarts.'); });
web.on('exit', (code) => { api.kill(); process.exit(code ?? 0); });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { api.kill(); web.kill(); });
