import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';


export default defineConfig({
  // @ts-expect-error: _
  build: {
    lib: {
      entry: 'src/main/main.ts'
    }
  },
  main: {
    build: {
      outDir: 'dist/main'
    },
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: path.resolve(__dirname, 'src/main/overlay/overlay.ejs'),
            dest: 'overlay'
          }
        ]
      })
    ]
  },
  preload: {
    build: {
      outDir: 'dist/preload'
    }
  },
  renderer: {
    base: './',
    build: {
      outDir: 'dist/renderer'
    },
    plugins: [react()]
  }
});