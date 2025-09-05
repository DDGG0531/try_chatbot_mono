import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  outDir: 'dist',
  format: ['esm'],
  platform: 'node',
  sourcemap: true,
  clean: true,
  dts: false,
  splitting: false,
  external: [
    '@prisma/client',
    'prisma',
    'firebase-admin',
    'express',
    'cors',
    'dotenv',
  ],
  tsconfig: 'tsconfig.json',
  // esbuildOptions(options) {
  //   options.alias = {
  //     '@': './src',   // 把 @ 指到 src
  //   }
  // },
});
