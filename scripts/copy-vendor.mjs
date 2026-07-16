// Копирует бинарные ассеты зависимостей в public/ (запускается в postinstall).
import { copyFile, mkdir } from "node:fs/promises";

await mkdir("public/vendor", { recursive: true });
await copyFile(
  "node_modules/esbuild-wasm/esbuild.wasm",
  "public/vendor/esbuild.wasm"
);
console.log("✓ public/vendor/esbuild.wasm");
