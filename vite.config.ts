import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react()],
    // Only the public proxy URL is exposed; provider API keys belong on the server.
    define: { __AI_BACKEND_URL__: JSON.stringify(env.VITE_AI_BACKEND_URL || '/api/analyze') },
    resolve: { preserveSymlinks: true },
    server: { proxy: { '/api': 'http://127.0.0.1:8787' } },
    preview: { proxy: { '/api': 'http://127.0.0.1:8787' } },
  };
})
