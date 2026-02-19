import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repositoryName = 'kinopub-to-trakt-history';

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? `/${repositoryName}/` : '/',
});
