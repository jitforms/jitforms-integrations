import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { jitforms: 'src/index.ts' },
    format: ['esm'],
    dts: true,
    clean: true,
    minify: true,
  },
  {
    entry: { 'jitforms.global': 'src/global.ts' },
    format: ['iife'],
    globalName: 'JitForms',
    noExternal: [/.*/],
    clean: false,
    minify: true,
    outExtension: () => ({ js: '.js' }),
  },
]);
