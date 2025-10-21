import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// הגדרה מיוחדת עבור GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/yoman-mechvot/', // חשוב מאוד! זה שם המאגר שלך בגיטהאב
});
