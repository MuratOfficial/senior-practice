/**
 * Протокол общения приложения с песочницей (sandboxed iframe + Web Worker).
 * Код пользователя выполняется только в браузере: iframe с opaque origin,
 * внутри — воркер с таймаутом. TS транспилируется в приложении до отправки.
 */

export type SandboxLanguage = "javascript" | "python";

/** Язык редактора (TS транспилируется в JS перед запуском) */
export type EditorLanguage = "javascript" | "typescript" | "python";

export interface SandboxTest {
  name: string;
  code: string;
  hidden: boolean;
}

export interface RunRequest {
  kind: "sp-run";
  id: string;
  language: SandboxLanguage;
  code: string;
  /** Пустой массив — режим playground: просто выполнить код */
  tests: SandboxTest[];
  timeoutMs: number;
}

export interface ConsoleEvent {
  kind: "sp-console";
  id: string;
  level: "log" | "warn" | "error" | "info";
  text: string;
}

export interface StatusEvent {
  kind: "sp-status";
  id: string;
  text: string;
}

export interface TestResult {
  name: string;
  hidden: boolean;
  passed: boolean;
  error?: string;
}

export type ResultEvent =
  | {
      kind: "sp-result";
      id: string;
      ok: true;
      tests: TestResult[];
      durationMs: number;
    }
  | { kind: "sp-result"; id: string; ok: false; error: string };

export type SandboxEvent =
  | ConsoleEvent
  | StatusEvent
  | ResultEvent
  | { kind: "sp-ready" };

export type RunOutcome =
  | { ok: true; tests: TestResult[]; durationMs: number }
  | { ok: false; error: string };

export const DEFAULT_TIMEOUT_MS = 10_000;
export const PYTHON_TIMEOUT_MS = 60_000; // первый запуск включает загрузку Pyodide
