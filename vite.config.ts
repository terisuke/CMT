// vite.config.ts
import { vitePlugin as remix } from "@remix-run/dev";
import path from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "url";

// ESMでのディレクトリパス取得
const __dirname = path.dirname(fileURLToPath(import.meta.url));

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  server: {
    hmr: {
      host: 'localhost',  // Docker等で別のホスト名を使う場合はここを変える
      port: 5173,
      protocol: 'ws'
    }
  },
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
      ignoredRouteFiles: ["**/.*"],
    }),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./app"),
      "remix:manifest": path.resolve(__dirname, "build/manifest.json")
    }
  }
});