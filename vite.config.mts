import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { gzipSync } from "node:zlib";

import vue from "@vitejs/plugin-vue";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const OUT_DIR = "deploy/oj-frontend/dist";

// 文件名里的 hash 用 8 位十六进制，和 nginx.conf 里长缓存的规则（\.[0-9a-f]{8}\.）对得上
const output = {
  hashCharacters: "hex" as const,
  entryFileNames: "js/[name].[hash].js",
  chunkFileNames: "js/[name].[hash].js",
  assetFileNames: "assets/[name].[hash][extname]",
};

/** 构建完给大于 8KB 的 js/css/html/svg 生成 .gz（nginx 开了 gzip_static，直接发这份） */
const gzipAssets = (): Plugin => ({
  name: "myoj-gzip",
  apply: "build",
  async closeBundle() {
    const files = await readdir(OUT_DIR, { recursive: true });
    for (const file of files) {
      if (!/\.(js|css|html|svg)$/.test(file)) continue;
      const path = join(OUT_DIR, file);
      const source = await readFile(path);
      if (source.length < 8192) continue;
      const compressed = gzipSync(source, { level: 9 });
      if (compressed.length > source.length * 0.8) continue;
      await writeFile(`${path}.gz`, compressed);
    }
  },
});

export default defineConfig({
  plugins: [vue(), gzipAssets()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 8080,
    strictPort: true,
    proxy: {
      "/api": { target: "http://127.0.0.1:8102", changeOrigin: true },
    },
  },
  build: {
    outDir: OUT_DIR,
    emptyOutDir: true,
    rollupOptions: { output },
  },
  worker: {
    rollupOptions: { output },
  },
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "http://localhost/" } },
    globals: true,
    include: ["tests/unit/**/*.spec.ts"],
  },
});
