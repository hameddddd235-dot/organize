const fs = require('node:fs');
const path = require('node:path');
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);
const { createAnalysisServer } = require('jiti')(__filename)('./server.ts');
const server = createAnalysisServer({
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL,
  allowedOrigins: process.env.APP_ORIGINS?.split(',').map(value => value.trim()).filter(Boolean),
});
server.listen(Number(process.env.API_PORT || 8787), '127.0.0.1', () => {
  console.log('Nabd analysis API listening on http://127.0.0.1:' + (process.env.API_PORT || 8787));
  console.log(process.env.GEMINI_API_KEY ? 'Gemini key configured (connectivity not yet verified).' : 'Set GEMINI_API_KEY in .env.local to enable Gemini.');
});
