import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://<user>.github.io/office-workout/ on GitHub Pages.
export default defineConfig({
  base: './',
  plugins: [react()],
});
