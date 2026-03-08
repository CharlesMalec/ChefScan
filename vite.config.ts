import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  const getSafeEnv = (key: string) => {
    const val = env[key] || process.env[key] || '';
    return (val === 'MY_GOOGLE_KEY' || val === 'YOUR_API_KEY') ? '' : val;
  };

  return {
    base: '',
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(getSafeEnv('GEMINI_API_KEY')),
      'import.meta.env.VITE_API_KEY': JSON.stringify(getSafeEnv('API_KEY')),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
