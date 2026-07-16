"use client";

/**
 * Транспиляция TypeScript → JavaScript в браузере (esbuild-wasm).
 * Инициализация одна на страницу (esbuild бросает при повторной) —
 * держим promise в globalThis, чтобы пережить HMR в dev.
 */

const globalForEsbuild = globalThis as unknown as {
  __esbuildInit?: Promise<typeof import("esbuild-wasm")>;
};

async function getEsbuild() {
  if (!globalForEsbuild.__esbuildInit) {
    globalForEsbuild.__esbuildInit = (async () => {
      const esbuild = await import("esbuild-wasm");
      await esbuild.initialize({ wasmURL: "/vendor/esbuild.wasm" });
      return esbuild;
    })();
  }
  return globalForEsbuild.__esbuildInit;
}

/** Срезает типы TS (валидный JS проходит без изменений). Бросает при синтаксической ошибке. */
export async function transpileTs(code: string): Promise<string> {
  const esbuild = await getEsbuild();
  const result = await esbuild.transform(code, {
    loader: "ts",
    target: "es2022",
  });
  return result.code;
}
